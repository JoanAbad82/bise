//! `hubs/<id>/view.json` (bise desktop S1): a few facts about a hub for
//! those who must not start it to know them: the window's sidebar (a
//! project whose hub is stopped), `bise project list`, and bise reading
//! other projects (stream C). Written only by its own hub (the shell:
//! `daemon/projects.rs`), from the client snapshot, debounced and at a
//! clean stop; read-only for everyone else. Its shape is bise-proto's
//! [`ProjectView`] (agents and cards are the window's rows).
//!
//! No "running" flag: a crash would leave it true for good. A reader
//! tells a running hub by its pid ([`running`]); the file says when it
//! was written and, after a clean stop, when the hub stopped.
//!
//! Pure but for [`read`] and [`running`] (a file, a pid).

use crate::proto_view::{self, Since};
use bise_proto::draft::ProjectView;
use serde_json::Value;
use std::path::Path;

/// The file's name in the hub's state folder.
pub const FILE: &str = "view.json";
/// The shape this hub writes.
pub const V: u32 = 1;
/// At most one write per this many ms while things change.
pub const DEBOUNCE_MS: u64 = 2_000;

/// The view of the hub of `project` (its hub id) from its client
/// snapshot (`core::Hub::snapshot`).
pub fn of(snap: &Value, project: &str, now: u64, last_activity_ms: u64, stopped_ms: Option<u64>, since: &mut Since) -> ProjectView {
    ProjectView {
        v: V,
        project: project.to_string(),
        written_ms: now,
        stopped_ms,
        last_activity_ms,
        agents: proto_view::agents(snap, since, now, crate::model::user_kind),
        cards: proto_view::cards(snap, project, now, crate::model::user_kind),
    }
}

/// When to write: the hub calls [`Writer::changed`] when its state
/// changed and [`Writer::due`] at each tick; a stop writes whatever.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct Writer {
    /// the last write
    last_ms: Option<u64>,
    /// a change not written yet
    pending: bool,
    /// the last change: the file's `last_activity_ms`
    pub last_activity_ms: u64,
}

impl Writer {
    /// The hub's state changed at `now`.
    pub fn changed(&mut self, now: u64) {
        self.pending = true;
        self.last_activity_ms = now;
    }

    /// A write is due: never written yet (the hub's start), or a change
    /// waits and the last write is at least [`DEBOUNCE_MS`] old.
    pub fn due(&self, now: u64) -> bool {
        match self.last_ms {
            None => true,
            Some(t) => self.pending && now.saturating_sub(t) >= DEBOUNCE_MS,
        }
    }

    /// Written at `now`.
    pub fn wrote(&mut self, now: u64) {
        self.last_ms = Some(now);
        self.pending = false;
    }
}

/// The file's text.
pub fn render(v: &ProjectView) -> String {
    serde_json::to_string_pretty(v).unwrap_or_default() + "\n"
}

/// A view read back: None for no file, not JSON, another shape, or a
/// newer `v` (a reader knows nothing then, it never guesses).
pub fn parse(text: &str) -> Option<ProjectView> {
    let v: ProjectView = serde_json::from_str(text).ok()?;
    (v.v == V).then_some(v)
}

/// The view in a hub's state folder `state` (read-only).
pub fn read(state: &Path) -> Option<ProjectView> {
    parse(&std::fs::read_to_string(state.join(FILE)).ok()?)
}

/// Whether the hub of the state folder `state` runs: its `hub.pid` names
/// a live process.
pub fn running(state: &Path) -> bool {
    std::fs::read_to_string(state.join("hub.pid"))
        .ok()
        .and_then(|t| t.trim().parse::<u32>().ok())
        .is_some_and(crate::procs::alive)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn snap() -> Value {
        json!({
            "agents": [
                {"name": "main", "main": true, "status": "idle", "objective": "", "created_ms": 1},
                {"name": "p99", "main": false, "status": "working", "objective": "why p99 rises", "created_ms": 5,
                 "mode": "worktree", "branch": "sb/p99", "path": "/w/p99", "turn_ms": 4000, "parent": "main"},
            ],
            "cards": [
                {"id": 3, "kind": "question", "agent": "p99", "text": "ship it?\n1. yes\n2. no", "created_ms": 7},
            ],
        })
    }

    #[test]
    fn the_view_has_the_windows_rows_and_no_running_flag() {
        let mut since = Since::new();
        let v = of(&snap(), "api-12345678", 100, 90, None, &mut since);
        assert_eq!((v.v, v.project.as_str(), v.written_ms, v.last_activity_ms, v.stopped_ms), (1, "api-12345678", 100, 90, None));
        assert_eq!(v.agents.iter().map(|a| a.name.as_str()).collect::<Vec<_>>(), ["main", "p99"]);
        assert_eq!(v.agents[1].branch.as_deref(), Some("sb/p99"));
        assert_eq!(v.agents[1].waits, 1);
        assert_eq!(v.cards.len(), 1);
        assert_eq!(v.cards[0].options.len(), 2);
        let text = render(&v);
        assert!(!text.contains("running"), "{text}");
        assert!(!text.contains("stopped_ms"), "absent while it runs: {text}");
        assert_eq!(parse(&text), Some(v.clone()));
        let stopped = of(&snap(), "api-12345678", 200, 90, Some(200), &mut since);
        assert!(render(&stopped).contains("\"stopped_ms\": 200"));
    }

    #[test]
    fn a_reader_knows_nothing_from_a_bad_or_newer_file() {
        assert_eq!(parse(""), None);
        assert_eq!(parse("{not json"), None);
        assert_eq!(parse(r#"{"v":1}"#), None);
        let mut v = of(&snap(), "x-1", 1, 1, None, &mut Since::new());
        v.v = 2;
        assert_eq!(parse(&render(&v)), None);
    }

    #[test]
    fn writes_are_debounced_and_the_first_is_at_once() {
        let mut w = Writer::default();
        assert!(w.due(0), "the hub's start writes");
        w.wrote(0);
        assert!(!w.due(10_000), "nothing changed");
        w.changed(500);
        assert!(!w.due(1_000), "too soon after the last write");
        assert!(w.due(2_000));
        w.wrote(2_000);
        assert_eq!(w.last_activity_ms, 500);
        w.changed(2_100);
        w.changed(2_200);
        assert!(!w.due(3_999) && w.due(4_000), "one write for a burst");
    }

    #[test]
    fn a_hub_runs_when_its_pid_lives() {
        let d = std::env::temp_dir().join(format!("sb-view-{}", std::process::id()));
        std::fs::create_dir_all(&d).unwrap();
        assert!(!running(&d), "no pid file");
        std::fs::write(d.join("hub.pid"), std::process::id().to_string()).unwrap();
        assert!(running(&d));
        std::fs::write(d.join("hub.pid"), "not a pid").unwrap();
        assert!(!running(&d));
        let _ = std::fs::remove_dir_all(&d);
    }
}
