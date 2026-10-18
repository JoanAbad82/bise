//! The hub's side of `/usage` (cost-pause): it owns the project's
//! [`Ledger`] (crate::usage_ledger, pure) and answers `usage/read`.
//!
//! Never on the boot path (issue 15): the ledger is filled on the first
//! read, on a thread, from the transcripts of the agent folders touched
//! in the last [`DAYS`] days (their mtime), each read backwards from its
//! end until its lines are older than the week. Archived agents count
//! when they fall in that window. Until the fill is back, the answer says
//! `counting` with what the live lines gave so far. From the fill's start
//! on, the live REPLs' usage lines (the same hook as recycle's churn) are
//! added as they come; the fill counts only the lines written before it
//! started, so no call is counted twice. Nothing is written.

use super::*;
use crate::usage_ledger::{local_day, week_start, Cost, Ledger, Report, Sum, Tokens, DAYS};
use bise_proto::hub::HubEv;
use bise_proto::rows::{UsageRow, UsageSum};
use std::io::{Read, Seek, SeekFrom};

/// The ledger and how far its fill is.
#[derive(Debug, Default)]
pub(super) struct Usage {
    ledger: Ledger,
    /// None: never asked; Some(false): counting; Some(true): filled
    filled: Option<bool>,
}

/// The local day of `ms` on this machine.
fn day(ms: u64) -> i64 {
    local_day(ms, bise_home::clock::offset_at(ms))
}

impl Shell {
    /// A line of agent `name`'s live REPL (before the feed). The ledger
    /// keys its rows by the agent's folder, which never changes (name-free:
    /// an archived agent's name may go to a new one; its spend stays its).
    pub(super) fn usage_line(&mut self, name: &str, line: &str) {
        if self.usage.filled.is_some() {
            let dir = self.dir_of(name).unwrap_or_else(|| name.to_string());
            self.usage.ledger.line(&dir, day(now_ms()), line);
        }
    }

    /// The fill's ledger is back: it joins the live one.
    pub(super) fn usage_counted(&mut self, filled: Ledger) {
        self.usage.ledger.merge(filled);
        self.usage.filled = Some(true);
    }

    /// `usage/read`'s answer; the first read starts the fill.
    pub(super) fn usage_ev(&mut self) -> HubEv {
        let now = now_ms();
        if self.usage.filled.is_none() {
            self.usage.filled = Some(false);
            self.usage_fill(now);
        }
        let today = day(now);
        self.usage.ledger.forget_before(today);
        self.setup(); // the catalog's prices, re-read when config changed
        let setup = &self.setup.as_ref().expect("just set").1;
        let live: BTreeSet<&str> = self.hub.st.agents.values().filter(|a| a.lifecycle != crate::model::Lifecycle::Archived).map(|a| a.dir.as_str()).collect();
        let names: BTreeMap<&str, &str> = self.hub.st.agents.values().map(|a| (a.dir.as_str(), a.name.as_str())).collect();
        let cost = |model: &str, t: &Tokens| {
            let r = setup.catalog.resolve(model);
            if setup.catalog.provider(&r.provider).is_some_and(|p| p.signs_in()) {
                return Cost::Plan;
            }
            r.price.cost(t.input, t.output, t.cache_read, t.cache_write).map_or(Cost::Unknown, Cost::Usd)
        };
        let report = named(self.usage.ledger.report(today, cost, |dir| !live.contains(dir)), &names);
        usage_ev(self.project(), self.usage.filled != Some(true), report)
    }

    /// Reads the week's usage lines of every agent folder touched in the
    /// week, on a thread; written before `until` only.
    fn usage_fill(&mut self, until: u64) {
        let since = week_start(day(until));
        let agents = self.opts.paths.agent_dir("x").parent().map(Path::to_path_buf);
        let tx = self.tx.clone();
        std::thread::spawn(move || {
            let mut l = Ledger::default();
            let cutoff = std::time::SystemTime::now() - std::time::Duration::from_secs(DAYS as u64 * 86_400);
            for e in agents.and_then(|d| std::fs::read_dir(d).ok()).into_iter().flatten().flatten() {
                let t = e.path().join("transcript.log");
                let fresh = std::fs::metadata(&t).and_then(|m| m.modified()).is_ok_and(|m| m >= cutoff);
                if !fresh {
                    continue;
                }
                let dir = e.file_name().to_string_lossy().to_string();
                lines_backwards(&t, |raw| l.transcript_line(&dir, raw, since, until, day));
            }
            let _ = tx.send(Msg::UsageCounted(Box::new(l)));
        });
    }
}

/// Calls `f` on each line of `path` from the last to the first, until it
/// answers false; reads 64 KiB at a time from the end.
fn lines_backwards(path: &Path, mut f: impl FnMut(&str) -> bool) {
    const CHUNK: u64 = 64 * 1024;
    let Ok(mut file) = std::fs::File::open(path) else { return };
    let Ok(mut pos) = file.seek(SeekFrom::End(0)) else { return };
    let mut tail: Vec<u8> = Vec::new();
    while pos > 0 {
        let n = CHUNK.min(pos);
        pos -= n;
        let mut buf = vec![0u8; n as usize];
        if file.seek(SeekFrom::Start(pos)).is_err() || file.read_exact(&mut buf).is_err() {
            return;
        }
        buf.extend_from_slice(&tail);
        // every whole line after the first newline of the chunk (the part
        // before it may be cut: kept for the next chunk)
        let first = if pos == 0 { None } else { buf.iter().position(|b| *b == b'\n') };
        let start = first.map_or(0, |i| i + 1);
        for l in buf[start..].split(|b| *b == b'\n').rev() {
            if !l.is_empty() && !f(&String::from_utf8_lossy(l)) {
                return;
            }
        }
        tail = first.map(|i| buf[..i].to_vec()).unwrap_or_default();
    }
}

fn usage_sum(s: &Sum) -> UsageSum {
    let t: &Tokens = &s.tokens;
    let priced = t.calls > s.unpriced + s.plan;
    let plan_only = s.plan > 0 && s.plan == t.calls;
    UsageSum {
        input: t.input,
        output: t.output,
        cache_read: t.cache_read,
        cache_write: t.cache_write,
        calls: t.calls,
        cost_usd: s.cost_usd,
        unpriced: s.unpriced,
        plan: s.plan,
        words: bise_proto::thread::words::usage_words(s.cost_usd, priced, plan_only, t.input, t.output, t.calls),
    }
}

/// A report by folder, each row under its agent's name now (a folder no
/// agent has: its own name).
fn named(mut r: Report, names: &BTreeMap<&str, &str>) -> Report {
    for (n, _, _) in r.agents.iter_mut() {
        if let Some(name) = names.get(n.as_str()) {
            *n = name.to_string();
        }
    }
    r
}

/// The typed answer of a report.
pub(crate) fn usage_ev(project: bise_proto::Project, counting: bool, r: Report) -> HubEv {
    let row = |name: String, models: String, r: &crate::usage_ledger::Row| UsageRow { name, models, today: usage_sum(&r.today), week: usage_sum(&r.week) };
    HubEv::Usage {
        project,
        counting,
        all: Box::new(row(String::new(), String::new(), &r.all)),
        agents: r.agents.iter().map(|(n, m, x)| row(n.clone(), m.clone(), x)).collect(),
        models: r.models.iter().map(|(n, x)| row(n.clone(), String::new(), x)).collect(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_a_file_backwards_across_chunks() {
        let dir = std::env::temp_dir().join(format!("usage-back-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let p = dir.join("t.log");
        let lines: Vec<String> = (0..20_000).map(|i| format!("{i}\tline {i}")).collect();
        std::fs::write(&p, lines.join("\n") + "\n").unwrap();
        let mut seen = Vec::new();
        lines_backwards(&p, |l| {
            seen.push(l.to_string());
            true
        });
        let want: Vec<String> = lines.iter().rev().cloned().collect();
        assert_eq!(seen, want);
        // stops when asked
        let mut n = 0;
        lines_backwards(&p, |_| {
            n += 1;
            n < 3
        });
        assert_eq!(n, 3);
        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn the_typed_answer_says_unpriced_and_counting() {
        let mut l = Ledger::default();
        l.line("main", 5, "  obs: usage: model=nowhere/m in=40000 out=0 cache_read=0 cache_write=0");
        let ev = usage_ev(bise_proto::Project::default(), true, l.report(5, |_, _| crate::usage_ledger::Cost::Unknown, |_| false));
        let HubEv::Usage { counting, all, agents, .. } = ev else { panic!() };
        assert!(counting);
        assert_eq!(all.today.words, "— · 40k");
        assert_eq!(agents[0].name, "main");
    }
}
