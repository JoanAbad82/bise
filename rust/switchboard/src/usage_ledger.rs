//! What the project's model calls cost, per agent and per model, today
//! and this week (`/usage`, `usage/read`; cost-pause, designer's i6).
//!
//! The source of truth is the transcripts: every usage line the REPL
//! prints (`  obs: usage: model=M in=I out=O cache_read=R cache_write=W`)
//! is in `agents/<dir>/transcript.log` with its time. The lines are read
//! by the one reader, bise_proto's `usage_mark`, then bise_session's
//! `usage_line::parse`: this module only sums. The daemon (daemon/usage.rs)
//! owns the ledger: it fills it on the first `usage/read`, on a thread,
//! from the transcripts read backwards to [`DAYS`] days ago, and feeds it
//! the live REPLs' lines from then on. Nothing is written: a restart
//! reads the transcripts again. Runtime view state.
//!
//! Pure: no file, no clock, no catalog. Times come with their UTC offset
//! ([`local_day`]) and the prices as a function, so the sums and the
//! cutoffs are tested here.

use std::collections::BTreeMap;

/// The days the ledger keeps: "this week" is the last 7 local days,
/// today included.
pub const DAYS: i64 = 7;

/// Tokens of some calls. `input` counts every input token, the cached
/// ones included (the usage line's `in`).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Tokens {
    pub input: u64,
    pub output: u64,
    pub cache_read: u64,
    pub cache_write: u64,
    pub calls: u64,
}

impl Tokens {
    fn add(&mut self, o: &Tokens) {
        self.input = self.input.saturating_add(o.input);
        self.output = self.output.saturating_add(o.output);
        self.cache_read = self.cache_read.saturating_add(o.cache_read);
        self.cache_write = self.cache_write.saturating_add(o.cache_write);
        self.calls = self.calls.saturating_add(o.calls);
    }
}

/// What some calls of a model cost: dollars from the catalog's prices,
/// a plan's (the ChatGPT sign-in: tokens only, no money), or unknown.
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Cost {
    Usd(f64),
    Plan,
    Unknown,
}

/// Tokens and what they cost. `cost_usd` sums the calls whose model has
/// prices in the catalog; `plan` counts the calls on a plan, `unpriced`
/// the others left out of it.
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Sum {
    pub tokens: Tokens,
    pub cost_usd: f64,
    pub plan: u64,
    pub unpriced: u64,
}

impl Sum {
    fn add(&mut self, t: &Tokens, cost: Cost) {
        self.tokens.add(t);
        match cost {
            Cost::Usd(c) => self.cost_usd += c,
            Cost::Plan => self.plan = self.plan.saturating_add(t.calls),
            Cost::Unknown => self.unpriced = self.unpriced.saturating_add(t.calls),
        }
    }
}

/// One row of the report: today and the week.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct Row {
    pub today: Sum,
    pub week: Sum,
}

/// What `/usage` shows. Rows sorted by the week's cost, then tokens,
/// then name.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct Report {
    pub all: Row,
    /// (agent, its models in the week joined by ", ", row)
    pub agents: Vec<(String, String, Row)>,
    /// (model, row)
    pub models: Vec<(String, Row)>,
}

/// The local day of `ms` (days since 1970-01-01) at UTC offset `off`
/// (seconds east, bise_home::clock::offset_at): the day bise_proto's
/// `when::civil` gives.
pub fn local_day(ms: u64, off: i32) -> i64 {
    ((ms / 1000) as i64 + off as i64).div_euclid(86_400)
}

/// The first local day of the week that ends on `today`.
pub fn week_start(today: i64) -> i64 {
    today - (DAYS - 1)
}

/// (agent, model, local day) -> tokens.
#[derive(Debug, Default)]
pub struct Ledger {
    cells: BTreeMap<(String, String, i64), Tokens>,
}

impl Ledger {
    /// A usage line of `agent` on local day `day` (any other line: no-op).
    pub fn line(&mut self, agent: &str, day: i64, line: &str) {
        let bise_proto::thread::lines::UsageMark::Usage(text) = bise_proto::thread::lines::usage_mark(line) else {
            return;
        };
        if let Some(u) = bise_session::usage_line::parse(&text) {
            let t = Tokens { input: u.input, output: u.output, cache_read: u.cache_read, cache_write: u.cache_write, calls: 1 };
            self.cells.entry((agent.to_string(), u.model, day)).or_default().add(&t);
        }
    }

    /// One transcript line (`<ms>\t<line>`) of `agent`, read from the
    /// end of its file: counted when its time is before `until` (the
    /// live lines count from then) and its day from `since` on. False:
    /// the line is older than `since`, the reader can stop (a transcript
    /// only grows, its times go up).
    pub fn transcript_line(&mut self, agent: &str, raw: &str, since: i64, until: u64, day: impl Fn(u64) -> i64) -> bool {
        let Some((ms, rest)) = raw.split_once('\t') else { return true };
        let Ok(ms) = ms.parse::<u64>() else { return true };
        let d = day(ms);
        if d < since {
            return false;
        }
        if ms < until {
            self.line(agent, d, rest);
        }
        true
    }

    /// Another ledger's cells added to this one (the fill's, done on a
    /// thread, into the live one).
    pub fn merge(&mut self, o: Ledger) {
        for (k, t) in o.cells {
            self.cells.entry(k).or_default().add(&t);
        }
    }

    /// An agent renamed: its past calls follow it.
    pub fn rename(&mut self, old: &str, new: &str) {
        let moved: Vec<_> = self.cells.keys().filter(|k| k.0 == old).cloned().collect();
        for k in moved {
            if let Some(t) = self.cells.remove(&k) {
                self.cells.entry((new.to_string(), k.1, k.2)).or_default().add(&t);
            }
        }
    }

    /// Drop the days before the week of `today` (the ledger stays small).
    pub fn forget_before(&mut self, today: i64) {
        let since = week_start(today);
        self.cells.retain(|k, _| k.2 >= since);
    }

    /// The report for local day `today`. `cost` prices tokens of a model
    /// (a plan's, or unknown without prices in the catalog).
    /// `archived` says which agents are gone: their calls sum in one row,
    /// `archived (n)`, last (designer m_18789).
    pub fn report(&self, today: i64, cost: impl Fn(&str, &Tokens) -> Cost, archived: impl Fn(&str) -> bool) -> Report {
        let since = week_start(today);
        let mut all = Row::default();
        let mut agents: BTreeMap<String, (Row, Vec<String>)> = BTreeMap::new();
        let mut models: BTreeMap<String, Row> = BTreeMap::new();
        let mut gone = Row::default();
        let mut gone_names: Vec<&str> = Vec::new();
        for ((agent, model, day), t) in &self.cells {
            if *day < since || *day > today {
                continue;
            }
            if archived(agent) {
                let c = cost(model, t);
                gone.week.add(t, c);
                all.week.add(t, c);
                if *day == today {
                    gone.today.add(t, c);
                    all.today.add(t, c);
                }
                if !gone_names.contains(&agent.as_str()) {
                    gone_names.push(agent);
                }
                put_model(&mut models, model, t, c, *day == today);
                continue;
            }
            let c = cost(model, t);
            let is_today = *day == today;
            let put = |r: &mut Row| {
                r.week.add(t, c);
                if is_today {
                    r.today.add(t, c);
                }
            };
            put(&mut all);
            let a = agents.entry(agent.clone()).or_default();
            put(&mut a.0);
            if !a.1.contains(model) {
                a.1.push(model.clone());
            }
            put(models.entry(model.clone()).or_default());
        }
        let key = |r: &Row| (std::cmp::Reverse((r.week.cost_usd * 1e6) as u64), std::cmp::Reverse(r.week.tokens.input + r.week.tokens.output));
        let mut agents: Vec<(String, String, Row)> = agents.into_iter().map(|(n, (r, ms))| (n, ms.join(", "), r)).collect();
        agents.sort_by(|a, b| key(&a.2).cmp(&key(&b.2)).then_with(|| a.0.cmp(&b.0)));
        if !gone_names.is_empty() {
            agents.push((format!("archived ({})", gone_names.len()), String::new(), gone));
        }
        let mut models: Vec<(String, Row)> = models.into_iter().collect();
        models.sort_by(|a, b| key(&a.1).cmp(&key(&b.1)).then_with(|| a.0.cmp(&b.0)));
        Report { all, agents, models }
    }
}

fn put_model(models: &mut BTreeMap<String, Row>, model: &str, t: &Tokens, c: Cost, today: bool) {
    let r = models.entry(model.to_string()).or_default();
    r.week.add(t, c);
    if today {
        r.today.add(t, c);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn line(m: &str, i: u64, o: u64) -> String {
        format!("  obs: usage: model={m} in={i} out={o} cache_read=0 cache_write=0")
    }

    /// 1 USD per thousand tokens in or out, for model "p/priced" only.
    fn cost(m: &str, t: &Tokens) -> Cost {
        match m {
            "p/priced" => Cost::Usd((t.input + t.output) as f64 / 1000.0),
            "p/plan" => Cost::Plan,
            _ => Cost::Unknown,
        }
    }

    #[test]
    fn a_plan_counts_tokens_not_money() {
        let mut l = Ledger::default();
        l.line("main", 5, &line("p/plan", 100, 1));
        let r = l.report(5, cost, |_| false);
        assert_eq!((r.all.week.plan, r.all.week.unpriced, r.all.week.cost_usd), (1, 0, 0.0));
    }

    #[test]
    fn sums_today_and_the_week_per_agent_and_model() {
        let mut l = Ledger::default();
        l.line("main", 100, &line("p/priced", 1000, 0));
        l.line("main", 98, &line("p/priced", 2000, 0));
        l.line("main", 93, &line("p/priced", 9000, 0)); // 7 days back: out of the week
        l.line("task", 100, &line("p/free", 500, 500));
        l.line("task", 100, "  obs: something else");
        let r = l.report(100, cost, |_| false);
        assert_eq!(r.all.today.tokens.input, 1500);
        assert_eq!(r.all.today.tokens.calls, 2);
        assert_eq!(r.all.today.cost_usd, 1.0);
        assert_eq!(r.all.today.unpriced, 1);
        assert_eq!(r.all.week.tokens.input, 3500);
        assert_eq!(r.all.week.cost_usd, 3.0);
        assert_eq!(r.agents[0].0, "main");
        assert_eq!(r.agents[0].1, "p/priced");
        assert_eq!(r.agents[0].2.week.cost_usd, 3.0);
        assert_eq!(r.agents[1].0, "task");
        assert_eq!(r.agents[1].2.week.unpriced, 1);
        assert_eq!(r.models.iter().map(|m| m.0.as_str()).collect::<Vec<_>>(), ["p/priced", "p/free"]);
    }

    #[test]
    fn reads_a_transcript_backwards_to_the_week_start() {
        let mut l = Ledger::default();
        let raw = [
            format!("10\t{}", line("p/priced", 100, 1)),
            "20\t  you: hi".to_string(),
            format!("30\t{}", line("p/priced", 200, 2)),
            format!("40\t{}", line("p/priced", 400, 4)),
        ];
        // ms < 25 is day 1, later day 2; the week from day 2; the live
        // lines count from ms 35: 40 is live's, 30 counts, 20 is day 1
        // (the reader stops there)
        let day = |ms: u64| if ms < 25 { 1 } else { 2 };
        let read: Vec<bool> = raw.iter().rev().map(|r| l.transcript_line("a", r, 2, 35, day)).collect();
        assert_eq!(read, [true, true, false, false]);
        let r = l.report(2, cost, |_| false);
        assert_eq!(r.all.week.tokens.input, 200);
        assert_eq!(r.all.week.tokens.output, 2);
    }

    #[test]
    fn the_local_day_follows_the_offset() {
        // 2026-10-06 23:30 UTC is the 7th in Paris (+2h)
        let ms = 1_791_329_400_000;
        let utc = local_day(ms, 0);
        assert_eq!(local_day(ms, 7200), utc + 1);
        let (y, m, d, _, _) = bise_proto::thread::when::civil(ms, 7200);
        assert_eq!((y, m, d), (2026, 10, 7));
        assert_eq!(utc, crate::every::days_from_civil(2026, 10, 6));
    }

    #[test]
    fn a_rename_keeps_the_calls_and_old_days_go() {
        let mut l = Ledger::default();
        l.line("old", 10, &line("p/priced", 100, 0));
        l.line("old", 1, &line("p/priced", 100, 0));
        l.rename("old", "new");
        l.forget_before(10);
        let r = l.report(10, cost, |_| false);
        assert_eq!(r.agents.len(), 1);
        assert_eq!(r.agents[0].0, "new");
        assert_eq!(r.all.week.tokens.calls, 1);
    }
}
