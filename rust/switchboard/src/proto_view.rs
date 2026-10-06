//! The typed protocol's rows and live entries from the hub's own views
//! (bise desktop S3a; the shell is `daemon/proto.rs`): pure functions
//! from the client snapshot (`core::Hub::snapshot`, the `state` event)
//! to `bise_proto` rows, and the live fold of a subscribed thread (only
//! the entries that changed go out).

use bise_proto::rows::{question, Agent, Artifact, Card, CardPage, Report, ReportKind, Status};
use bise_proto::thread::{self, Ctx, Entry, Line};
use bise_proto::Pos;
use serde_json::Value;
use std::collections::BTreeMap;

/// The entries of the newest lines a subscription keeps, so a live line
/// folds into the entry it belongs to (a tools entry growing).
pub const KEEP: usize = 8;

fn s(v: &Value, k: &str) -> String {
    v.get(k).and_then(Value::as_str).unwrap_or("").trim().to_string()
}

fn ms(v: &Value, k: &str) -> Option<u64> {
    v.get(k).and_then(Value::as_u64).filter(|m| *m > 0)
}

/// When each agent's status last changed, as the hub saw it (a view's
/// memory, lost on restart: then the first sight counts).
pub type Since = BTreeMap<String, (Status, u64)>;

/// The snapshot's agents as rows. `cards`: the snapshot's open cards (an
/// agent's `waits`); `user_kind`: the hub's (his cards).
pub fn agents(snap: &Value, since: &mut Since, now: u64, user_kind: fn(&str) -> bool) -> Vec<Agent> {
    let list = |k: &str| snap.get(k).and_then(Value::as_array).cloned().unwrap_or_default();
    let cards = list("cards");
    let mut out = Vec::new();
    for a in list("agents") {
        let name = s(&a, "name");
        let (status, archived) = Status::of_hub(&s(&a, "status"));
        let first = ms(&a, "report_ms").filter(|_| status != Status::Working).or(ms(&a, "created_ms")).unwrap_or(now);
        let at = match since.get(&name) {
            Some((st, at)) if *st == status => *at,
            Some(_) => now,
            None => first,
        };
        since.insert(name.clone(), (status, at));
        let title = [s(&a, "note"), s(&a, "role"), s(&a, "report"), s(&a, "objective")].into_iter().find(|t| !t.is_empty()).unwrap_or_default();
        let worktree = s(&a, "mode") == "worktree";
        let report = Some(s(&a, "report")).filter(|r| !r.is_empty()).map(|text| Report {
            kind: match status {
                Status::Done => ReportKind::Done,
                Status::Failed => ReportKind::Failed,
                Status::Blocked => ReportKind::Blocked,
                _ => ReportKind::Progress,
            },
            text,
            at_ms: ms(&a, "report_ms").unwrap_or(0),
        });
        let waits = cards.iter().filter(|c| s(c, "agent") == name && his(&s(c, "kind"), user_kind)).count() as u32;
        out.push(Agent {
            main: a.get("main").and_then(Value::as_bool).unwrap_or(false),
            status,
            archived,
            title: thread::one_line(&title, 120),
            purpose: thread::one_line(&s(&a, "objective"), 200),
            since_ms: at,
            waits,
            parent: Some(s(&a, "parent")).filter(|p| !p.is_empty()),
            branch: Some(s(&a, "branch")).filter(|b| worktree && !b.is_empty()),
            worktree: Some(s(&a, "path")).filter(|p| worktree && !p.is_empty()),
            turn_ms: a.get("turn_ms").and_then(Value::as_u64).filter(|_| status == Status::Working),
            report,
            // his queued inputs (sb-core holds them, amb-hub 7dcb56ab)
            queued: a.get("queued_inputs").cloned().and_then(|q| serde_json::from_value(q).ok()).unwrap_or_default(),
            name,
        });
    }
    since.retain(|n, _| out.iter().any(|a| &a.name == n));
    out
}

/// His cards: the user's kinds, bise's own bookkeeping (a `drop`) left
/// to the TUI (pm's C fail 36).
fn his(kind: &str, user_kind: fn(&str) -> bool) -> bool {
    user_kind(kind) && kind != "drop"
}

/// The snapshot's open cards that are his, as rows.
pub fn cards(snap: &Value, project: &str, now: u64, user_kind: fn(&str) -> bool) -> Vec<Card> {
    let list = snap.get("cards").and_then(Value::as_array).cloned().unwrap_or_default();
    list.iter()
        .filter(|c| his(&s(c, "kind"), user_kind))
        .map(|c| {
            let kind = s(c, "kind");
            let (q, options) = question(c.get("text").and_then(Value::as_str).unwrap_or(""));
            let page = c.get("page").filter(|p| p.is_object()).map(|p| CardPage {
                id: s(p, "id"),
                url: s(p, "url"),
                block: Some(s(p, "block")).filter(|b| !b.is_empty()),
                item: Some(s(p, "item")).filter(|i| !i.is_empty()),
            });
            Card {
                id: c.get("id").and_then(Value::as_u64).unwrap_or(0),
                project: project.to_string(),
                urgent: kind == "confirm",
                kind,
                agent: s(c, "agent"),
                question: q,
                options,
                since_ms: now.saturating_sub(c.get("age_ms").and_then(Value::as_u64).unwrap_or(0)),
                page,
            }
        })
        .collect()
}

/// The art store's `artifacts` event (daemon/art.rs `artifacts_ev`:
/// rows + `seen_ms`) as rows. `url`: a page's the page server gives
/// (`page_url`), else its link or its file (its kept copy first); `new`:
/// not his own, changed since he last looked.
pub fn artifacts(ev: &Value, page_url: impl Fn(&str) -> Option<String>) -> Vec<Artifact> {
    let seen = ev.get("seen_ms").and_then(Value::as_u64).unwrap_or(0);
    let rows = ev.get("rows").and_then(Value::as_array).cloned().unwrap_or_default();
    rows.iter()
        .map(|r| {
            let (id, kind) = (s(r, "id"), s(r, "kind"));
            let at_ms = r.get("ts_ms").and_then(Value::as_u64).unwrap_or(0);
            let url = match page_url(&id).filter(|_| s(r, "by") == "page") {
                Some(u) => u,
                None => Some(s(r, "copy")).filter(|c| !c.is_empty() && !s(r, "target").contains("://")).unwrap_or_else(|| s(r, "target")),
            };
            Artifact {
                title: s(r, "title"),
                agent: s(r, "agent"),
                version: r.get("v").and_then(Value::as_u64).unwrap_or(0) as u32,
                new: s(r, "by") != "you" && at_ms > seen,
                at_ms,
                url,
                kind,
                id,
            }
        })
        .collect()
}

/// An agent's current step from one feed line: its tool intent, "" at
/// its turn's end; None: the line says nothing of it.
pub fn step_of(line: &str) -> Option<String> {
    if let Some(r) = line.strip_prefix("tool_intent #") {
        let text = r.split_once(" : ").map_or("", |(_, t)| t);
        return Some(thread::one_line(&thread::unescape(text), 80));
    }
    line.starts_with("  obs: turn_done").then(String::new)
}

/// A subscribed thread's newest lines and what was sent of each entry.
#[derive(Default)]
pub struct Live {
    lines: Vec<Line>,
    sent: BTreeMap<Pos, String>,
}

impl Live {
    /// After its page: the lines of the page's newest entries are kept,
    /// the page's entries count as sent.
    pub fn start(lines: Vec<Line>, page: &[Entry]) -> Live {
        let mut l = Live { lines, sent: BTreeMap::new() };
        for e in page {
            l.sent.insert(e.pos, json(e));
        }
        l.trim(page);
        l
    }

    /// One live line: the entries it made or changed (a line already
    /// seen, a replay after a reconnection, changes nothing).
    pub fn push(&mut self, line: Line, ctx: &Ctx) -> Vec<Entry> {
        if self.lines.last().is_some_and(|l| l.0 >= line.0) {
            return Vec::new();
        }
        self.lines.push(line);
        self.refold(ctx)
    }

    /// The fold again (a card answered, a page published): what changed.
    pub fn refold(&mut self, ctx: &Ctx) -> Vec<Entry> {
        let entries = thread::fold(&self.lines, ctx);
        let mut out = Vec::new();
        for e in &entries {
            let j = json(e);
            if self.sent.get(&e.pos) != Some(&j) {
                self.sent.insert(e.pos, j);
                out.push(e.clone());
            }
        }
        self.trim(&entries);
        out
    }

    fn trim(&mut self, entries: &[Entry]) {
        if entries.len() > KEEP {
            let cut = entries[entries.len() - KEEP].pos;
            self.lines.retain(|l| l.0 >= cut);
            self.sent.retain(|p, _| *p >= cut);
        }
    }
}

fn json(e: &Entry) -> String {
    serde_json::to_string(e).unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn uk(k: &str) -> bool {
        matches!(k, "question" | "drop" | "confirm")
    }

    fn snap() -> Value {
        json!({"ev": "state",
            "agents": [
                {"name": "main", "main": true, "status": "idle", "objective": "", "created_ms": 5},
                {"name": "perf", "main": false, "status": "working", "objective": "make the e2e fast\nmore", "note": "",
                 "role": "profiling the hub", "mode": "worktree", "branch": "sb/perf", "path": "/w/perf", "parent": "main",
                 "turn_ms": 4200, "created_ms": 7, "queued": 1,
                 "queued_inputs": [{"id": 3, "text": "then the cold run", "created_ms": 8}]},
                {"name": "old", "main": false, "status": "archived", "objective": "an old fix", "report": "fixed in 0.4",
                 "report_ms": 9, "mode": "shared", "branch": "main", "path": "/w"},
            ],
            "cards": [
                {"id": 9, "kind": "question", "agent": "perf", "text": "which bench?\n1. cold\n2. warm", "age_ms": 1000},
                {"id": 10, "kind": "confirm", "agent": "perf", "text": "run it?", "age_ms": 0,
                 "page": {"id": "p", "url": "http://x/p/p", "block": "q1"}},
                {"id": 11, "kind": "drop", "agent": "old", "text": "archive old?", "age_ms": 0},
                {"id": 12, "kind": "done", "agent": "perf", "text": "perf is done", "age_ms": 0},
            ]})
    }

    #[test]
    fn the_snapshot_becomes_rows() {
        let mut since = Since::new();
        let a = agents(&snap(), &mut since, 100, uk);
        assert_eq!(a.len(), 3);
        let p = &a[1];
        assert_eq!((p.status, p.title.as_str(), p.purpose.as_str(), p.waits), (Status::Working, "profiling the hub", "make the e2e fast", 2));
        assert_eq!((p.branch.as_deref(), p.worktree.as_deref(), p.turn_ms, p.since_ms), (Some("sb/perf"), Some("/w/perf"), Some(4200), 7));
        let o = &a[2];
        assert_eq!((o.archived, o.status, o.branch.as_deref(), o.since_ms), (true, Status::Done, None, 9));
        assert_eq!(o.report.as_ref().map(|r| r.kind), Some(ReportKind::Done));
        assert_eq!(p.queued.iter().map(|q| (q.id, q.text.as_str())).collect::<Vec<_>>(), [(3, "then the cold run")]);
        assert!(o.queued.is_empty());
        // a status change moves since; the same keeps it
        let mut s2 = snap();
        s2["agents"][1]["status"] = json!("idle");
        assert_eq!(agents(&s2, &mut since, 200, uk)[1].since_ms, 200);
        assert_eq!(agents(&s2, &mut since, 300, uk)[1].since_ms, 200);
        let c = cards(&snap(), "acme", 5_000, uk);
        assert_eq!(c.iter().map(|c| c.id).collect::<Vec<_>>(), [9, 10], "his kinds, no drop");
        assert_eq!((c[0].question.as_str(), c[0].options.len(), c[0].since_ms, c[0].urgent), ("which bench?", 2, 4_000, false));
        assert!(c[1].urgent && c[1].page.as_ref().is_some_and(|p| p.block.as_deref() == Some("q1")));
    }

    #[test]
    fn the_art_store_rows_become_artifacts() {
        let ev = json!({"ev": "artifacts", "seen_ms": 100, "rows": [
            {"id": "perf-notes", "kind": "page", "title": "Perf notes", "agent": "perf", "by": "page", "ts_ms": 150, "v": 2,
             "target": "/st/pages/perf-notes", "copy": null},
            {"id": "deck", "kind": "file", "title": "Deck", "agent": "main", "by": "agent", "ts_ms": 90, "v": 1,
             "target": "/w/deck.pdf", "copy": "/st/art/deck/1.pdf"},
            {"id": "site", "kind": "site", "title": "Site", "agent": "web", "by": "agent", "ts_ms": 200, "v": 3,
             "target": "https://x.dev", "copy": "/st/art/site/3"},
            {"id": "mine", "kind": "file", "title": "Mine", "agent": "main", "by": "you", "ts_ms": 300, "v": 1,
             "target": "/w/m.txt", "copy": null}]});
        let a = artifacts(&ev, |id| (id == "perf-notes").then(|| "http://127.0.0.1:1/p/perf-notes".to_string()));
        let row = |i: usize| (a[i].id.as_str(), a[i].url.as_str(), a[i].version, a[i].new);
        assert_eq!(row(0), ("perf-notes", "http://127.0.0.1:1/p/perf-notes", 2, true), "a page: its server url");
        assert_eq!(row(1), ("deck", "/st/art/deck/1.pdf", 1, false), "a file: its kept copy, seen before");
        assert_eq!(row(2), ("site", "https://x.dev", 3, true), "a link: the link");
        assert_eq!(row(3), ("mine", "/w/m.txt", 1, false), "his own is never new");
    }

    #[test]
    fn a_live_thread_sends_only_what_changed() {
        let none = |_: &str| None;
        let open: [u64; 0] = [];
        let ctx = Ctx { open_cards: &open, page: &none };
        let l = |pos: u64, line: &str| (pos, pos, line.to_string());
        let first = vec![l(1, "sb you : go"), l(2, "  obs: assistant: on it")];
        let page = thread::fold(&first, &ctx);
        let mut live = Live::start(first, &page);
        assert!(live.push(l(2, "  obs: assistant: on it"), &ctx).is_empty(), "a replay");
        let e = live.push(l(3, "tool #1 bash : ls"), &ctx);
        assert_eq!((e.len(), e[0].pos), (1, 3));
        let e = live.push(l(4, "tool_intent #1 : listing"), &ctx);
        assert_eq!((e.len(), e[0].pos, e[0].tools.as_ref().unwrap().items[0].text.as_str()), (1, 3, "listing"));
        let e = live.push(l(5, "tool #2 read_file : a"), &ctx);
        assert_eq!((e[0].pos, e[0].tools.as_ref().unwrap().count), (3, 2), "the same entry grows");
        assert_eq!(step_of("tool_intent #2 : reading a"), Some("reading a".into()));
        assert_eq!(step_of("  obs: turn_done: completed"), Some(String::new()));
        assert_eq!(step_of("tool #2 x : y"), None);
    }
}
