//! The typed protocol's connections (bise desktop S3a, `bise_proto`): a
//! client of `hub.sock` that says `{"cmd": "hello", "proto": 1}` gets
//! `welcome`, then `agents` and `cards` now and on each change, and the
//! threads it subscribes to as entries (`thread`, then `entry`/`typing`
//! live). Its commands reach the same paths as the TUI's ops (input,
//! interrupt, `/answer`, `/archive`, `/restore`); a command this hub can't
//! do gets `error {cmd, text}`, never silence. The rows and the live fold
//! are pure (`crate::proto_view`); this file only wires them.

use super::*;
use crate::proto_view::{self, Live, Since};
use bise_proto::hub::{HubCmd, HubEv, JobState, Mode};
use bise_proto::thread::{self as pthread, Ctx, Line, PageRef};
use bise_proto::PROTO;

/// Entries in a `thread` page when the client gives no limit, and at most.
const LIMIT: usize = 40;
const MAX_LIMIT: usize = 200;
/// Transcript lines read for one page (a long tools run folds into one
/// entry: the page may hold fewer entries than asked).
const LINES: usize = 600;

/// Every typed connection, by client.
#[derive(Default)]
pub(super) struct Proto {
    conns: BTreeMap<ClientId, Conn>,
    since: Since,
    /// the last `agents` and `cards` sent (sent again only when changed)
    last: (String, String),
    /// the agents' statuses and folders at the last `worktrees` scan
    worktrees: String,
    /// the background jobs' ports once found (dev_servers.rs)
    pub(super) dev_ports: super::dev_servers::Ports,
    /// the last `jobs` sent (S10: sent again only when changed)
    jobs: String,
    /// the typed command being stepped (its connection, its tag): a
    /// notice sb-core sends that connection meanwhile becomes its error
    stepping: Option<(ClientId, String)>,
}

#[derive(Default)]
struct Conn {
    /// its subscribed threads, by agent
    subs: BTreeMap<String, Live>,
    /// it said `typed_only`: the hub's older events skip it
    only: bool,
}

impl Proto {
    /// The connection wants typed events only (`broadcast` skips it).
    pub(super) fn typed_only(&self, id: ClientId) -> bool {
        self.conns.get(&id).is_some_and(|c| c.only)
    }
}

/// What the fold needs from the hub, owned (taken before the conns are
/// borrowed).
struct Facts {
    open: Vec<u64>,
    pages: Option<std::sync::Arc<crate::pages::Pages>>,
}

impl Facts {
    fn page(&self, id: &str) -> Option<PageRef> {
        let p = self.pages.as_ref()?;
        let m = p.store.meta(id)?;
        Some(PageRef { id: m.id.clone(), title: m.title.clone(), v: u32::try_from(m.version()).ok().filter(|v| *v > 0), url: p.url(id) })
    }
}

fn lines_of(raw: Vec<(usize, Option<u64>, String)>) -> Vec<Line> {
    raw.into_iter().map(|(pos, ts, l)| (pos as u64, ts.unwrap_or(0), l)).collect()
}

impl Shell {
    pub(super) fn project(&self) -> String {
        crate::paths::workspace_id(&self.opts.paths.workspace)
    }

    fn facts(&self) -> Facts {
        Facts { open: self.hub.st.open_cards().map(|c| c.id).collect(), pages: self.pages.clone() }
    }

    fn proto_send(&mut self, id: ClientId, ev: &HubEv) {
        if let Some(c) = self.clients.get_mut(&id) {
            write_line(c, &ev.encode());
        }
    }

    /// desktop S2 step 2: sb-core's `route`/`route_done` effects, to every
    /// typed connection (the window and the capsule show the held route).
    pub(super) fn proto_route(&mut self, ev: HubEv) {
        let ids: Vec<ClientId> = self.proto.conns.keys().copied().collect();
        for id in ids {
            self.proto_send(id, &ev);
        }
    }

    /// S10: a followed task ended: `job_end` to every typed connection.
    pub(super) fn job_end(&mut self, agent: String, state: &str, label: String, summary: String) {
        let state = if state == "failed" { JobState::Failed } else { JobState::Done };
        self.proto_route(HubEv::JobEnd { project: self.project(), agent, state, label, summary });
    }

    /// `route_correct`'s `to`, checked in the registry before sb-core is
    /// stepped (architect m_8883): "bise" keeps his words here (a cancel),
    /// a known project gives its name, anything else an error.
    fn route_to(&self, to: &str) -> Result<Option<(String, String)>, String> {
        if to == "bise" {
            return Ok(None);
        }
        let home = bise_home::Home::from_env();
        let rows = bise_home::projects::list(&home, &crate::paths::home_workspace());
        let hub = bise_home::projects::target(&rows, to, &self.project())?;
        let name = rows.iter().find(|r| r.id == hub).map_or_else(|| hub.clone(), |r| r.name.clone());
        Ok(Some((hub, name)))
    }

    /// Steps sb-core for typed command `cmd` of connection `id`: its
    /// notice to that connection (a route that ended, ...) comes back as
    /// `error {cmd, text}`, so a command that does nothing says why.
    fn step_typed(&mut self, id: ClientId, cmd: &str, input: Input) {
        self.proto.stepping = Some((id, cmd.to_string()));
        self.step(input);
        self.proto.stepping = None;
    }

    /// `Effect::ToClient`'s body for `client`, as the typed `error` when it
    /// is a notice for the typed command being stepped; false: not one.
    pub(super) fn typed_notice(&mut self, client: ClientId, body: &Value) -> bool {
        let Some((id, cmd)) = self.proto.stepping.clone() else { return false };
        if id != client || body.get("ev").and_then(Value::as_str) != Some("notice") {
            return false;
        }
        self.proto_error(client, &cmd, body.get("text").and_then(Value::as_str).unwrap_or(""));
        true
    }

    /// The typed connections still open.
    pub(super) fn typed_ids(&self) -> Vec<ClientId> {
        self.proto.conns.keys().copied().filter(|id| self.clients.contains_key(id)).collect()
    }

    fn proto_error(&mut self, id: ClientId, cmd: &str, text: &str) {
        let project = Some(self.project());
        let cmd = Some(cmd.to_string()).filter(|c| !c.is_empty());
        self.proto_send(id, &HubEv::Error { project, cmd, text: text.to_string() });
    }

    /// The rows of the snapshot: `agents`, `cards`.
    fn proto_rows(&mut self, snap: &Value) -> (HubEv, HubEv) {
        let project = self.project();
        let now = now_ms();
        let agents = proto_view::agents(snap, &mut self.proto.since, now, crate::model::user_kind);
        let cards = proto_view::cards(snap, &project, now, crate::model::user_kind);
        (HubEv::Agents { project: project.clone(), agents }, HubEv::Cards { project, cards })
    }

    /// A line on `hub.sock` with a `cmd`: one typed command.
    pub(super) fn proto_cmd(&mut self, id: ClientId, v: Value) {
        let tag = v.get("cmd").and_then(Value::as_str).unwrap_or("").to_string();
        let cmd = match HubCmd::from_value(v) {
            Ok(c) => c,
            Err(e) => return self.proto_error(id, &tag, &e),
        };
        if let HubCmd::Hello { proto, typed_only } = cmd {
            if proto != PROTO {
                return self.proto_error(id, &tag, &format!("this hub speaks proto {PROTO}, not {proto}"));
            }
            self.proto.conns.entry(id).or_default().only = typed_only;
            let ws = self.opts.paths.workspace.clone();
            let name = ws.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
            let welcome = HubEv::Welcome { project: self.project(), proto: PROTO, workspace: ws.to_string_lossy().to_string(), name };
            self.proto_send(id, &welcome);
            let snap = self.snapshot();
            let (agents, cards) = self.proto_rows(&snap);
            self.proto_send(id, &agents);
            self.proto_send(id, &cards);
            let jobs = HubEv::Jobs { project: self.project(), items: proto_view::jobs(&snap) };
            self.proto_send(id, &jobs);
            let arts = self.artifacts_ev();
            let arts = self.proto_artifacts(&arts);
            self.proto_send(id, &arts);
            self.worktrees_typed(vec![id]);
            self.dev_servers_typed(vec![id]);
            self.merged_typed(vec![id]);
            return;
        }
        if !self.proto.conns.contains_key(&id) {
            return self.proto_error(id, &tag, "say hello {proto: 1} first");
        }
        let project = match &cmd {
            HubCmd::Subscribe { project, .. }
            | HubCmd::Unsubscribe { project, .. }
            | HubCmd::Page { project, .. }
            | HubCmd::Send { project, .. }
            | HubCmd::Answer { project, .. }
            | HubCmd::Stop { project, .. }
            | HubCmd::Archive { project, .. }
            | HubCmd::Unarchive { project, .. }
            | HubCmd::ArtifactsSeen { project }
            | HubCmd::Worktrees { project }
            | HubCmd::DevServers { project }
            | HubCmd::Merged { project }
            | HubCmd::RouteCorrect { project, .. }
            | HubCmd::RouteCancel { project, .. }
            | HubCmd::Follow { project, .. }
            | HubCmd::Diff { project, .. } => project.clone(),
            HubCmd::Hello { .. } => unreachable!(),
            HubCmd::Unknown { tag, .. } => return self.proto_error(id, tag, &format!("unknown command: {tag}")),
        };
        if project != self.project() {
            return self.proto_error(id, &tag, &format!("this hub is {}, not {project}", self.project()));
        }
        let known = |sh: &Shell, a: &str| sh.hub.st.agents.contains_key(a);
        match cmd {
            HubCmd::Subscribe { agent, limit, .. } => {
                let Some(dir) = self.dir_of(&agent) else { return self.proto_error(id, &tag, &format!("no agent {agent}")) };
                let path = self.transcript(&dir);
                let lines = lines_of(transcript_page(&path, transcript_len(&path) + 1, LINES));
                let facts = self.facts();
                let ctx = Ctx { open_cards: &facts.open, page: &|p: &str| facts.page(p) };
                let (entries, before, more) = pthread::page(&lines, &ctx, limit.map_or(LIMIT, |l| (l as usize).clamp(1, MAX_LIMIT)));
                let live = Live::start(lines, &entries);
                if let Some(c) = self.proto.conns.get_mut(&id) {
                    c.subs.insert(agent.clone(), live);
                }
                self.proto_send(id, &HubEv::Thread { project, agent, entries, before, more });
            }
            HubCmd::Unsubscribe { agent, .. } => {
                if let Some(c) = self.proto.conns.get_mut(&id) {
                    c.subs.remove(&agent);
                }
            }
            HubCmd::Page { agent, before, limit, .. } => {
                let Some(dir) = self.dir_of(&agent) else { return self.proto_error(id, &tag, &format!("no agent {agent}")) };
                let lines = lines_of(transcript_page(&self.transcript(&dir), before as usize, LINES));
                let facts = self.facts();
                let ctx = Ctx { open_cards: &facts.open, page: &|p: &str| facts.page(p) };
                let (entries, before, more) = pthread::page(&lines, &ctx, limit.map_or(LIMIT, |l| (l as usize).clamp(1, MAX_LIMIT)));
                self.proto_send(id, &HubEv::Thread { project, agent, entries, before, more });
            }
            HubCmd::Send { agent, text, mode, context, .. } => {
                if !known(self, &agent) {
                    return self.proto_error(id, &tag, &format!("no agent {agent}"));
                }
                // queued: sb-core holds it until the agent's turn ends
                // (amb-hub 7dcb56ab), never the client. A command never
                // waits: the same rule as core.rs user_input's notice
                // ("commands run now, not queued"), early and typed here;
                // change both together
                let queued = mode == Mode::Queued;
                if queued && text.trim_start().starts_with('/') {
                    return self.proto_error(id, &tag, "a command can't wait in the queue: send it now");
                }
                // S9: the fn context as a field of the input op, never
                // rendered here (the input arm's one render)
                self.client_line(id, json!({"op": "input", "focus": agent, "text": text, "queued": queued, "context": context}));
            }
            HubCmd::Answer { card, reply, .. } => {
                if !self.hub.st.open_cards().any(|c| c.id == card) {
                    return self.proto_error(id, &tag, &format!("card {card} isn't open"));
                }
                self.client_line(id, json!({"op": "input", "focus": MAIN, "text": format!("/answer {card} {reply}")}));
            }
            HubCmd::Stop { agent, .. } => {
                if !known(self, &agent) {
                    return self.proto_error(id, &tag, &format!("no agent {agent}"));
                }
                self.client_line(id, json!({"op": "interrupt", "agent": agent}));
            }
            HubCmd::Archive { agent, force, .. } => {
                if !known(self, &agent) {
                    return self.proto_error(id, &tag, &format!("no agent {agent}"));
                }
                let text = if force { format!("/archive {agent} --force") } else { format!("/archive {agent}") };
                self.client_line(id, json!({"op": "input", "focus": MAIN, "text": text}));
            }
            HubCmd::Unarchive { agent, .. } => {
                if !known(self, &agent) {
                    return self.proto_error(id, &tag, &format!("no agent {agent}"));
                }
                self.client_line(id, json!({"op": "input", "focus": MAIN, "text": format!("/restore {agent}")}));
            }
            // the TUI's own `seen`: the clock moves, the list comes again
            HubCmd::ArtifactsSeen { .. } => self.artifacts_op(id, &json!({"do": "seen"})),
            // git in a thread (art.rs), the typed answer to this client
            HubCmd::Diff { project, agent, commit } => {
                if !known(self, &agent) {
                    return self.proto_error(id, &tag, &format!("no agent {agent}"));
                }
                if commit.as_deref().is_some_and(|c| !crate::proto_view::is_sha(c)) {
                    return self.proto_error(id, &tag, "a commit is its sha (4 to 40 hex digits)");
                }
                self.diff_typed(id, project, agent, commit);
            }
            // git in a thread (worktrees.rs), to this client
            HubCmd::Worktrees { .. } => self.worktrees_typed(vec![id]),
            // jobs and lsof in a thread (dev_servers.rs), to this client
            HubCmd::DevServers { .. } => self.dev_servers_typed(vec![id]),
            // git and main's transcript in a thread (merged.rs)
            HubCmd::Merged { .. } => self.merged_typed(vec![id]),
            // the 2 s hold (sb-core's routing hold): a route that ended
            // already gets sb-core's notice, as an error (step_typed); an
            // unknown target never reaches sb-core
            HubCmd::RouteCorrect { rid, to, .. } => match self.route_to(&to) {
                Err(e) => self.proto_error(id, &tag, &e),
                Ok(None) => self.step_typed(id, &tag, Input::RouteCancel { client: Some(id), rid }),
                Ok(Some((to, name))) => self.step_typed(id, &tag, Input::RouteCorrect { client: Some(id), rid, to, name }),
            },
            HubCmd::RouteCancel { rid, .. } => self.step_typed(id, &tag, Input::RouteCancel { client: Some(id), rid }),
            // S10: sb-core refuses main, an archived or unknown agent: the
            // notice comes back as the error (step_typed)
            HubCmd::Follow { agent, on, .. } => self.step_typed(id, &tag, Input::Follow { client: Some(id), agent, on }),
            HubCmd::Hello { .. } | HubCmd::Unknown { .. } => {}
        }
    }

    /// The art store's event as the typed `artifacts`.
    fn proto_artifacts(&self, ev: &Value) -> HubEv {
        let pages = self.pages.clone();
        let page_url = |id: &str| pages.as_ref().filter(|p| p.store.meta(id).is_some()).map(|p| p.url(id));
        HubEv::Artifacts { project: self.project(), items: proto_view::artifacts(ev, page_url) }
    }

    /// An event the hub broadcasts, for the typed connections: `state` →
    /// `agents`/`cards` when they changed (and the subscribed threads
    /// refolded: a card answered), `line` → its thread's changed entries
    /// and the agent's step.
    pub(super) fn proto_on(&mut self, v: &Value) {
        let live: BTreeSet<ClientId> = self.clients.keys().copied().collect();
        self.proto.conns.retain(|id, _| live.contains(id));
        if self.proto.conns.is_empty() {
            return;
        }
        let ids: Vec<ClientId> = self.proto.conns.keys().copied().collect();
        match v.get("ev").and_then(Value::as_str) {
            Some("state") => {
                let (agents, cards) = self.proto_rows(v);
                let (a, c) = (agents.encode(), cards.encode());
                let new = (a != self.proto.last.0, c != self.proto.last.1);
                self.proto.last = (a, c);
                for id in &ids {
                    if new.0 {
                        self.proto_send(*id, &agents);
                    }
                    if new.1 {
                        self.proto_send(*id, &cards);
                    }
                }
                if new.1 {
                    self.proto_live(|l, ctx| l.refold(ctx));
                }
                // S10: the followed jobs, when they changed
                let jobs = HubEv::Jobs { project: self.project(), items: proto_view::jobs(v) };
                let j = jobs.encode();
                if j != self.proto.jobs {
                    self.proto.jobs = j;
                    for id in &ids {
                        self.proto_send(*id, &jobs);
                    }
                }
                // an agent came, went, started or ended a turn: its
                // worktree may have changed (commits, files)
                let key = self.worktrees_key();
                if key != self.proto.worktrees {
                    self.proto.worktrees = key;
                    self.worktrees_typed(ids.clone());
                    self.dev_servers_typed(ids.clone());
                }
            }
            // the art store changed (artifacts_refresh broadcasts it)
            Some("artifacts") => {
                let arts = self.proto_artifacts(v);
                for id in &ids {
                    self.proto_send(*id, &arts);
                }
            }
            Some("line") => {
                let s = |k: &str| v.get(k).and_then(Value::as_str).unwrap_or("").to_string();
                let (agent, line) = (s("agent"), s("line"));
                let pos = v.get("pos").and_then(Value::as_u64).unwrap_or(0);
                let ts = v.get("ts").and_then(Value::as_u64).unwrap_or(0);
                let step = proto_view::step_of(&line);
                let sent = self.proto_live_of(&agent, |l, ctx| l.push((pos, ts, line.clone()), ctx));
                if let Some(text) = step {
                    let project = self.project();
                    for id in sent {
                        self.proto_send(id, &HubEv::Typing { project: project.clone(), agent: agent.clone(), text: text.clone() });
                    }
                }
                // a land reached main's feed: today's merged list again
                if agent == MAIN && line.starts_with("sb landed : ") {
                    self.merged_typed(ids.clone());
                }
            }
            _ => {}
        }
    }

    /// Every subscription refolded: the entries that changed go out.
    fn proto_live(&mut self, f: impl Fn(&mut Live, &Ctx) -> Vec<pthread::Entry>) {
        let agents: BTreeSet<String> = self.proto.conns.values().flat_map(|c| c.subs.keys().cloned()).collect();
        for a in agents {
            self.proto_live_of(&a, &f);
        }
    }

    /// One agent's subscriptions through `f`; the clients subscribed.
    fn proto_live_of(&mut self, agent: &str, f: impl Fn(&mut Live, &Ctx) -> Vec<pthread::Entry>) -> Vec<ClientId> {
        let facts = self.facts();
        let ctx = Ctx { open_cards: &facts.open, page: &|p: &str| facts.page(p) };
        let mut out: Vec<(ClientId, Vec<pthread::Entry>)> = Vec::new();
        for (id, c) in self.proto.conns.iter_mut() {
            if let Some(l) = c.subs.get_mut(agent) {
                out.push((*id, f(l, &ctx)));
            }
        }
        let project = self.project();
        let mut ids = Vec::new();
        for (id, entries) in out {
            for e in entries {
                self.proto_send(id, &HubEv::Entry { project: project.clone(), agent: agent.to_string(), entry: Box::new(e) });
            }
            ids.push(id);
        }
        ids
    }
}
