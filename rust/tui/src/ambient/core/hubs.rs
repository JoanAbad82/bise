//! The core as a client of every project's hub (bise desktop S3b step 2):
//! one typed connection (`{cmd: hello, proto: 1}`) per held project, the
//! window's commands with a `project` routed to it, its typed events out
//! to the app as they are (they carry `project`), and `projects` (the
//! sidebar's rows) from the registry, the held hubs' own `agents`/`cards`
//! and the other hubs' `view.json`.
//!
//! Held (one rule, `projects::wanted`): bise's home hub, the projects the
//! window shows (`shown`), the ones with a subscribed thread. Nothing is
//! held before the window's first `shown`: the capsule alone opens no
//! connection of this kind. A project not held is listed from its files,
//! never started to be listed; the files are read at most every 2 s, and
//! only while the window has said what it shows.
//!
//! The capsule and the voice keep their own connection to the voice
//! target's hub (core.rs: its legacy feed and `agents_view.rs`); it goes
//! when they move to these typed events (S8), and with it the second
//! reader of that hub's cards.
//!
//! Never buffered (architect m_8433 D): a command to a hub that isn't
//! connected yet gets `error {project, cmd, text}`; only subscriptions
//! are kept (state, not commands) and sent again at each `welcome`.

use super::*;
use crate::ambient::projects::{self, Facts};
use bise_home::projects::Row;
use bise_proto::draft::{ProjectRow, ProjectView};
use bise_proto::hub::HubEv;
use bise_proto::rows::{Agent, Card};
use std::collections::{BTreeMap, BTreeSet};

/// The registry's files are read at most this often.
pub const POLL: Duration = Duration::from_secs(2);

/// A connection to a project's hub (its reader thread tags what it reads
/// with the project id).
pub type Spawn = Box<dyn FnMut(&Path, &str) -> Hub>;
/// A hub's `view.json` by hub id.
pub type ViewOf = Box<dyn Fn(&str) -> Option<ProjectView>>;
/// A checkout's branch and whether it is a git repo.
pub type GitOf = Box<dyn Fn(&Path) -> (Option<String>, bool)>;

/// What the core reads of the projects, real in `bise ambient-core`,
/// fakes in tests.
pub struct ProjectFacts {
    /// the registry's rows, home first (`bise_home::projects::list`)
    pub rows: Box<dyn Fn() -> Vec<Row>>,
    /// a hub's `view.json` by hub id (`projects::read_view`)
    pub view: ViewOf,
    /// its hub runs (its pid lives)
    pub running: Box<dyn Fn(&Path) -> bool>,
    pub exists: Box<dyn Fn(&Path) -> bool>,
    /// its checkout's branch and whether it is a git repo
    pub git: GitOf,
}

pub struct ProjectPorts {
    pub spawn: Spawn,
    pub facts: ProjectFacts,
}

/// One held project's connection.
struct Conn {
    hub: Hub,
    /// its `welcome` came since the last connection: commands go
    welcomed: bool,
    /// its own rows, as its hub sent them (fresher than its view.json)
    rows: Option<(Vec<Agent>, Vec<Card>)>,
}

#[derive(Default)]
pub(super) struct Hubs {
    ports: Option<ProjectPorts>,
    rows: Vec<Row>,
    /// the projects the window shows; None: no window yet
    shown: Option<Vec<String>>,
    conns: BTreeMap<String, Conn>,
    /// each project's subscribed agents (kept across reconnections)
    subs: BTreeMap<String, BTreeSet<String>>,
    /// each row's (branch, git), read at each poll
    git: BTreeMap<String, (Option<String>, bool)>,
    last: String,
    polled: Option<Instant>,
}

/// The projects to hold: none before the window says what it shows; then
/// `projects::wanted` (home, shown, subscribed), as ids of known rows.
pub fn held(rows: &[Row], shown: Option<&[String]>, subs: &BTreeMap<String, BTreeSet<String>>) -> BTreeSet<String> {
    let Some(shown) = shown else { return BTreeSet::new() };
    let Some(home) = rows.iter().find(|r| r.home) else { return BTreeSet::new() };
    let path = |id: &String| rows.iter().find(|r| &r.id == id).map(|r| r.path.clone());
    let shown: Vec<PathBuf> = shown.iter().filter_map(path).collect();
    let subscribed: Vec<PathBuf> = subs.iter().filter(|(_, a)| !a.is_empty()).filter_map(|(id, _)| path(id)).collect();
    let want = projects::wanted(&home.path, &shown, &[], &subscribed);
    rows.iter().filter(|r| want.contains(&r.path)).map(|r| r.id.clone()).collect()
}

/// A subscribe or unsubscribe of the window, kept: true when it changed.
pub fn track(subs: &mut BTreeMap<String, BTreeSet<String>>, cmd: &str, project: &str, agent: &str) -> bool {
    let s = subs.entry(project.to_string()).or_default();
    let changed = match cmd {
        "subscribe" => s.insert(agent.to_string()),
        "unsubscribe" => s.remove(agent),
        _ => false,
    };
    if s.is_empty() {
        subs.remove(project);
    }
    changed
}

/// The branch a `.git/HEAD` names (`ref: refs/heads/<b>`); None when
/// detached.
pub fn branch_of_head(head: &str) -> Option<String> {
    head.trim().strip_prefix("ref: refs/heads/").map(str::to_string).filter(|b| !b.is_empty())
}

/// A held hub's own rows as a view (the sidebar's counts).
fn live_view(project: &str, agents: &[Agent], cards: &[Card]) -> ProjectView {
    ProjectView { v: 1, project: project.into(), written_ms: 0, stopped_ms: None, last_activity_ms: 0, agents: agents.to_vec(), cards: cards.to_vec() }
}

impl Core {
    /// The projects' ports (`bise ambient-core`, a test): without them a
    /// command with a project is refused.
    pub fn set_projects(&mut self, p: ProjectPorts) {
        self.hubs.ports = Some(p);
    }

    fn project_error(&mut self, project: &str, cmd: &str, text: &str) {
        self.emit(json!({"ev": "error", "project": project, "cmd": cmd, "text": text}));
    }

    /// `shown {projects}`: the projects the window shows now.
    pub(super) fn shown(&mut self, projects: Vec<String>) {
        self.hubs.shown = Some(projects);
        self.poll_projects(true);
    }

    /// A window command for a project's hub (a `HubCmd` with `project`).
    pub(super) fn typed_cmd(&mut self, v: Value) {
        let s = |k: &str| v.get(k).and_then(Value::as_str).unwrap_or("").to_string();
        let (project, cmd, agent) = (s("project"), s("cmd"), s("agent"));
        if self.hubs.ports.is_none() {
            return self.project_error(&project, &cmd, "this core has no projects");
        }
        if !self.hubs.rows.iter().any(|r| r.id == project) {
            return self.project_error(&project, &cmd, &format!("there's no project {project}"));
        }
        if track(&mut self.hubs.subs, &cmd, &project, &agent) {
            self.hold();
        }
        let welcomed = self.hubs.conns.get(&project).is_some_and(|c| c.welcomed);
        match (cmd.as_str(), welcomed) {
            // kept: sent at its hub's welcome
            ("subscribe" | "unsubscribe", false) => {}
            (_, true) => {
                let sent = self.hubs.conns.get(&project).is_some_and(|c| c.hub.send(&v));
                if !sent {
                    self.project_error(&project, &cmd, "its hub went away: nothing sent. try again in a moment.");
                }
            }
            (_, false) => self.project_error(&project, &cmd, "its hub isn't connected yet: nothing sent. try again in a moment."),
        }
    }

    /// Open the connections to hold, close the others.
    fn hold(&mut self) {
        let want = held(&self.hubs.rows, self.hubs.shown.as_deref(), &self.hubs.subs);
        let gone: Vec<String> = self.hubs.conns.keys().filter(|id| !want.contains(*id)).cloned().collect();
        for id in gone {
            if let Some(c) = self.hubs.conns.remove(&id) {
                c.hub.close();
            }
        }
        for id in want {
            if self.hubs.conns.contains_key(&id) {
                continue;
            }
            let Some(path) = self.hubs.rows.iter().find(|r| r.id == id).map(|r| r.path.clone()) else { continue };
            let Some(p) = self.hubs.ports.as_mut() else { return };
            let hub = (p.spawn)(&path, &id);
            self.hubs.conns.insert(id, Conn { hub, welcomed: false, rows: None });
        }
    }

    /// A project hub's connection said something.
    pub fn project_hub(&mut self, id: &str, h: HubIn) {
        let Some(c) = self.hubs.conns.get_mut(id) else { return };
        match h {
            HubIn::Up => {
                c.welcomed = false;
                c.hub.send(&json!({"cmd": "hello", "proto": bise_proto::PROTO}));
            }
            HubIn::Down => {
                c.welcomed = false;
                c.rows = None;
                self.emit_projects();
            }
            HubIn::Line(l) => {
                let Ok(v) = serde_json::from_str::<Value>(&l) else { return };
                let ev = v.get("ev").and_then(Value::as_str).unwrap_or("").to_string();
                if !HubEv::TAGS.contains(&ev.as_str()) {
                    return;
                }
                match HubEv::from_value(v.clone()) {
                    Ok(HubEv::Welcome { .. }) => {
                        c.welcomed = true;
                        for agent in self.hubs.subs.get(id).into_iter().flatten() {
                            c.hub.send(&json!({"cmd": "subscribe", "project": id, "agent": agent}));
                        }
                    }
                    Ok(HubEv::Agents { agents, .. }) => {
                        let cards = c.rows.take().map(|r| r.1).unwrap_or_default();
                        c.rows = Some((agents, cards));
                    }
                    Ok(HubEv::Cards { cards, .. }) => {
                        let agents = c.rows.take().map(|r| r.0).unwrap_or_default();
                        c.rows = Some((agents, cards));
                    }
                    _ => {}
                }
                self.emit(v);
                if matches!(ev.as_str(), "welcome" | "agents" | "cards") {
                    self.emit_projects();
                }
            }
        }
    }

    /// At most every [`POLL`] while the window shows something (`force`:
    /// now): the registry and the files again, the holds, the rows.
    pub(super) fn poll_projects(&mut self, force: bool) {
        if self.hubs.shown.is_none() {
            return;
        }
        let now = Instant::now();
        if !force && self.hubs.polled.is_some_and(|t| now.duration_since(t) < POLL) {
            return;
        }
        self.hubs.polled = Some(now);
        let Some(p) = self.hubs.ports.as_ref() else { return };
        let rows = (p.facts.rows)();
        let git = rows.iter().map(|r| (r.id.clone(), (p.facts.git)(&r.path))).collect();
        self.hubs.rows = rows;
        self.hubs.git = git;
        self.hold();
        self.emit_projects();
    }

    /// `projects` when the rows changed.
    fn emit_projects(&mut self) {
        let Some(p) = self.hubs.ports.as_ref() else { return };
        let conns = &self.hubs.conns;
        let facts: Vec<Facts> = projects::facts(
            &self.hubs.rows,
            |id| match conns.get(id).and_then(|c| c.rows.as_ref()) {
                Some((a, c)) => Some(live_view(id, a, c)),
                None => (p.facts.view)(id),
            },
            |_| false,
            |path| (p.facts.exists)(path),
        );
        let rows: Vec<ProjectRow> = facts
            .into_iter()
            .enumerate()
            .map(|(i, mut f)| {
                let held = conns.get(&f.row.id).is_some_and(|c| c.welcomed);
                f.running = held || (p.facts.running)(&f.row.path);
                let (branch, git) = self.hubs.git.get(&f.row.id).cloned().unwrap_or((None, false));
                projects::row(&f, i as u32, branch, git)
            })
            .collect();
        let ev = json!({"ev": "projects", "projects": rows});
        let s = ev.to_string();
        if s != self.hubs.last {
            self.hubs.last = s;
            self.emit(ev);
        }
    }

    /// Every project connection closed (the core's end).
    pub(super) fn close_projects(&mut self) {
        for (_, c) in std::mem::take(&mut self.hubs.conns) {
            c.hub.close();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(id: &str, home: bool) -> Row {
        Row { path: PathBuf::from(format!("/p/{id}")), name: id.into(), id: id.into(), home, added_ms: 0 }
    }

    #[test]
    fn the_held_hubs_are_home_shown_and_subscribed_once_a_window_shows() {
        let rows = [row("home", true), row("a", false), row("b", false), row("c", false)];
        let mut subs = BTreeMap::new();
        assert!(held(&rows, None, &subs).is_empty(), "no window: nothing held");
        let ids = |s: BTreeSet<String>| s.into_iter().collect::<Vec<_>>();
        assert_eq!(ids(held(&rows, Some(&[]), &subs)), ["home"]);
        assert_eq!(ids(held(&rows, Some(&["a".into(), "zz".into()]), &subs)), ["a", "home"], "an unknown id is not held");
        assert!(track(&mut subs, "subscribe", "b", "main"));
        assert!(!track(&mut subs, "subscribe", "b", "main"), "already");
        assert_eq!(ids(held(&rows, Some(&["a".into()]), &subs)), ["a", "b", "home"], "a subscribed thread holds its hub");
        assert!(track(&mut subs, "unsubscribe", "b", "main"));
        assert!(subs.is_empty());
        assert!(!track(&mut subs, "send", "b", "main"));
        assert_eq!(ids(held(&rows, Some(&["a".into()]), &subs)), ["a", "home"]);
    }

    #[test]
    fn a_head_names_its_branch() {
        assert_eq!(branch_of_head("ref: refs/heads/main\n"), Some("main".into()));
        assert_eq!(branch_of_head("ref: refs/heads/sb/perf"), Some("sb/perf".into()));
        assert_eq!(branch_of_head("3f2a9c0d1e"), None, "detached");
    }
}
