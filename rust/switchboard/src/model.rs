//! The hub's durable state (RFC 0001 §12), as the views read it. sb-core
//! (hub/*.bend) is its only source of truth: it applies the journal
//! events and sends this state back after each step (core.rs stores it);
//! the runtime-only fields (`Agent::run`, `Agent::waiting`) are set by
//! the core from REPL activity and are never journaled.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet};

/// The name of the orchestrator agent. Never a task name.
pub const MAIN: &str = "main";
/// The human, as a message sender. Never an agent name.
pub const USER: &str = "user";
/// The hub itself, as the sender of notifications (a task crashed...).
/// Never an agent name.
pub const HUB: &str = "switchboard";

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Mode {
    Shared,
    Worktree,
}

/// Where a task works (RFC 0002). `path` is the workspace for `shared`.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Workspace {
    pub mode: Mode,
    pub path: String,
    #[serde(default)]
    pub branch: Option<String>,
    #[serde(default)]
    pub base_commit: Option<String>,
    /// The worktree was removed by a drop (restore can bring it back).
    #[serde(default)]
    pub dropped: bool,
    /// The place this workspace is (dev-flow §3.1, `crate::place`): a
    /// worktree's id, `wt:<its first agent's dir>`, the same in every
    /// agent that shares it. None: the shared folder, or an older
    /// journal's worktree (its agent's own place, [`Workspace::place_id`]).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub place: Option<String>,
    /// dev-flow §5.1: the feature this worktree lands on (`sb spawn
    /// --feature`): its branch is made from the feature's tip and `sb
    /// land` moves the feature, never main. None: not a feature's.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub feature: Option<String>,
}

impl Workspace {
    /// The feature an agent with this workspace lands on (a worktree's).
    pub fn feature(&self) -> Option<&str> {
        match self.mode {
            Mode::Worktree if !self.dropped => self.feature.as_deref(),
            _ => None,
        }
    }

    /// The id of the place an agent with this workspace (and this dir)
    /// is in: `shared`, or its worktree's id.
    pub fn place_id(&self, dir: &str) -> String {
        match self.mode {
            Mode::Shared => crate::place::SHARED.to_string(),
            Mode::Worktree => self.place.clone().unwrap_or_else(|| crate::place::worktree_id(dir)),
        }
    }
}

/// The task brief (RFC 0001 §7.1).
#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Brief {
    pub objective: String,
    #[serde(default)]
    pub context: String,
    #[serde(default)]
    pub constraints: Vec<String>,
    #[serde(default)]
    pub done_when: Option<String>,
    #[serde(default)]
    pub report_format: Option<String>,
}

/// What the owner of a task decided (never automatic, RFC 0001 §9.2).
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Lifecycle {
    Active,
    Stopped,
    Archived,
    Failed,
}

/// What the agent's REPL is doing right now (runtime only).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Run {
    /// No REPL process (not spawned yet, or stopped).
    Down,
    /// Spawned, not connected yet.
    Starting,
    Idle,
    /// A turn is running.
    Busy,
}

/// The status an agent declares about itself (RFC 0003 `setStatus`).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Declared {
    Working,
    Done,
    Blocked,
}

/// The status every view shows (RFC 0001 §9.1, RFC 0003 `ListedAgent`).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Status {
    Starting,
    Working,
    Waiting,
    Idle,
    Done,
    Blocked,
    Failed,
    Stopped,
    Archived,
}

impl Status {
    pub fn as_str(self) -> &'static str {
        match self {
            Status::Starting => "starting",
            Status::Working => "working",
            Status::Waiting => "waiting",
            Status::Idle => "idle",
            Status::Done => "done",
            Status::Blocked => "blocked",
            Status::Failed => "failed",
            Status::Stopped => "stopped",
            Status::Archived => "archived",
        }
    }

}

#[derive(Clone, Debug, PartialEq)]
pub struct Agent {
    pub name: String,
    /// The name at creation: its directories never move on a rename.
    pub dir: String,
    pub is_main: bool,
    /// The agent that created it: `main`, or `user` for a `/new`.
    pub parent: Option<String>,
    pub brief: Brief,
    pub created_ms: u64,
    pub ws: Workspace,
    pub lifecycle: Lifecycle,
    pub failure: Option<String>,
    pub declared: Option<(Declared, String)>,
    /// The last report: explicit (`sb report`) or the end of a turn.
    pub last_report: Option<Report>,
    pub aliases: Vec<String>,
    /// Files this task changed in the shared workspace (RFC 0001 §10.3).
    pub files: BTreeSet<String>,
    /// A drop saved work here (RFC 0002 §5.2).
    pub snapshot_ref: Option<String>,
    /// bise desktop S10: someone follows it (one job: off at its job_end)
    pub follow: bool,
    // ---- runtime only ----
    pub run: Run,
    /// Inside `sb wait` (its bash call is blocked on the hub).
    pub waiting: bool,
    /// Who it waits on: the recipient of the message its `sb wait` /
    /// `sb ask` waits for the reply to (sb-core's view).
    pub waiting_on: Option<String>,
    pub turn_started_ms: Option<u64>,
    /// Its turns ended since sb-core started (issue 22): sb-core's
    /// runtime count, +1 each time its run leaves busy (set_rt), so the
    /// agents row's working and turns come from the same view. Back to 0
    /// when sb-core restarts.
    pub turns_ended: u64,
    /// The last thing it did: (time, "bash `cargo test`", "wrote: ...").
    pub activity: Option<(u64, String)>,
    /// BISE-136: the private git worktree it works in (`gate.sh new`,
    /// `sb worktree`), when not its own workspace.
    pub place: Option<String>,
    /// The branch checked out in `place` as the PR poller last read it
    /// (None: detached, as `gate.sh new` makes it, or not read yet).
    pub place_branch: Option<String>,
}

impl Agent {
    pub fn status(&self) -> Status {
        match self.lifecycle {
            Lifecycle::Archived => return Status::Archived,
            Lifecycle::Stopped => return Status::Stopped,
            Lifecycle::Failed => return Status::Failed,
            Lifecycle::Active => {}
        }
        match self.run {
            Run::Down | Run::Starting => Status::Starting,
            Run::Busy if self.waiting => Status::Waiting,
            Run::Busy => Status::Working,
            Run::Idle => match self.declared {
                Some((Declared::Done, _)) => Status::Done,
                Some((Declared::Blocked, _)) => Status::Blocked,
                _ => Status::Idle,
            },
        }
    }

    /// One line: what this agent is for.
    pub fn description(&self) -> String {
        if self.is_main {
            "orchestrator: routes the user's requests to the agents".to_string()
        } else {
            crate::util::one_line(&self.brief.objective)
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Report {
    pub at_ms: u64,
    pub kind: String,
    pub summary: String,
    #[serde(default)]
    pub decisions: Vec<String>,
    /// Built by the hub at the end of a turn, not sent by the agent.
    #[serde(default)]
    pub auto: bool,
    /// S10: `sb report progress --step n/m`
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub step: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub of: Option<u32>,
    /// emitter 5: `--result`, proto's DiffResult as JSON
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub result: Option<Value>,
}

/// A message between two parties of the group (RFC 0003). The sender or
/// the recipient may be `user`.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Msg {
    pub id: u64,
    pub thread: u64,
    pub from: String,
    pub to: String,
    #[serde(default)]
    pub reply_to: Option<u64>,
    #[serde(default)]
    pub expect_reply: bool,
    #[serde(default)]
    pub auto: bool,
    pub text: String,
    pub created_ms: u64,
    /// A user message typed to the task (checkout or `@name`): delivered
    /// as a plain user message, without the agent_message tag.
    #[serde(default)]
    pub plain: bool,
    /// `sb send --mode queued`: never steered into a running turn,
    /// delivered only as a new turn (RFC 0003 §6.1).
    #[serde(default)]
    pub queued: bool,
    /// `@task message` typed in another agent's view: that view. The
    /// task reads it tagged, its end-of-turn answer is shown back there
    /// (RFC 0003 §5.1).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub via: Option<String>,
    /// his message's parts as JSON (msg-parts, sb-core's opaque
    /// `Msg.parts`; "" none): written after its 'you' line at delivery
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub parts: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "state")]
pub enum MsgState {
    Queued { reason: String },
    Delivered,
    Rejected { error: String },
    Cancelled,
}

/// A card of the user's inbox (RFC 0001 §11; BISE-299: only what needs
/// the user, only the user resolves it).
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Card {
    pub id: u64,
    /// question | drop | confirm (the user's kinds, [`user_kind`]); an
    /// older journal also has failed | blocked | overlap | done | restart,
    /// closed at the hub's boot
    pub kind: String,
    pub agent: String,
    pub text: String,
    /// A question card: the user's answer replies to this message.
    #[serde(default)]
    pub for_msg: Option<u64>,
    pub created_ms: u64,
    /// What the card asks about, when it is a place's (the hub's items,
    /// [`choice_kind`]): the place's id, and its PR's number.
    #[serde(default)]
    pub place: Option<String>,
    #[serde(default)]
    pub pr: Option<u64>,
}

/// BISE-299: the kinds of the user's inbox, set at the card's creation
/// (hub/model.bend `user_kind`): main's escalations, the tool-call
/// confirmations and the hub's own items ([`choice_kind`]). The agents'
/// traffic is main's, never a card.
pub fn user_kind(kind: &str) -> bool {
    matches!(kind, "question" | "drop" | "confirm") || choice_kind(kind)
}

/// The hub's items with numbered options, about a place (hub/model.bend
/// `choice_kind`): opened and closed by the hub's Rust side, the user's
/// digit comes back as `Effect::CardChoice`. `merge`: a PR ready to merge
/// (pr-design §6.3); `feature_try`, `feature_merge`: a feature branch
/// ready to try, then to merge (dev-flow §5.1); `update`: a newer bise
/// release (update-card); `signin`: the ChatGPT sign-in expired
/// (expired-ux, signin_card.rs).
pub fn choice_kind(kind: &str) -> bool {
    matches!(kind, "merge" | "feature_try" | "feature_merge" | "update" | "signin")
}

/// The durable state, as sb-core last sent it.
#[derive(Clone, Debug, Default)]
pub struct State {
    pub agents: BTreeMap<String, Agent>,
    pub order: Vec<String>,
    /// The messages, their states and the settled ones: written only by
    /// [`State::put_msg`] and [`State::clear_msgs`], which bump
    /// `msgs_rev`, so a cache of what is built from them (contexts.rs)
    /// knows when it is stale. Read with [`State::msgs`] and siblings.
    ///
    /// Every message stays here, delivered and owing nothing included:
    /// three readers still ask for such a cold one (issue 21): the
    /// delivery's text (core_link.rs `deliver`, the step's messages after
    /// the view that turned them cold), main's `<agent_threads>`
    /// (board.rs, through `threads`) and a question card's note
    /// (core.rs `card_note`, main's messages since the card).
    msgs: BTreeMap<u64, Msg>,
    msg_state: BTreeMap<u64, MsgState>,
    settled: BTreeSet<u64>,
    msgs_rev: u64,
    /// main's `<agent_threads>`, kept by the same writer (board::Threads)
    threads: crate::board::Threads,
    /// the hot messages: what sb-core's view says of each (queued, or
    /// owing a reply), only those with one of them: Waiting and
    /// `unanswered_for` walk these, never every message
    hot: BTreeMap<u64, Hot>,
    pub cards: BTreeMap<u64, Card>,
    pub main_notes: Vec<String>,
    pub next_msg: u64,
    pub next_card: u64,
    /// cost-pause: since when the project is paused (sb-core's view
    /// `paused`, hub/pause.bend); None: it runs
    pub paused: Option<u64>,
    /// `sb every`'s timers (sb-core's view `timers`, `timers_ended`)
    pub timers: crate::every::Timers,
    /// `sb wake`'s watches (sb-core's view `wakes`, `wakes_ended`)
    pub wakes: crate::wake::Wakes,
}

impl State {
    /// A state with only main, working in `workspace`.
    pub fn new(workspace: &str) -> State {
        let mut st = State {
            next_msg: 1,
            next_card: 1,
            ..State::default()
        };
        st.agents.insert(
            MAIN.to_string(),
            Agent {
                name: MAIN.to_string(),
                dir: MAIN.to_string(),
                is_main: true,
                parent: None,
                brief: Brief::default(),
                created_ms: 0,
                ws: Workspace {
                    mode: Mode::Shared,
                    path: workspace.to_string(),
                    branch: None,
                    base_commit: None,
                    dropped: false,
                    place: None,
                    feature: None,
                },
                lifecycle: Lifecycle::Active,
                failure: None,
                declared: None,
                last_report: None,
                aliases: Vec::new(),
                files: BTreeSet::new(),
                follow: false,
                snapshot_ref: None,
                run: Run::Down,
                waiting: false,
                waiting_on: None,
                turn_started_ms: None,
                turns_ended: 0,
                activity: None,
                place: None,
                place_branch: None,
            },
        );
        st.order.push(MAIN.to_string());
        st
    }

    /// Every message, by id.
    pub fn msgs(&self) -> &BTreeMap<u64, Msg> {
        &self.msgs
    }

    /// Each message's delivery state, by id.
    pub fn msg_state(&self) -> &BTreeMap<u64, MsgState> {
        &self.msg_state
    }

    /// The messages a reply settled.
    pub fn settled(&self) -> &BTreeSet<u64> {
        &self.settled
    }

    /// Bumped at each write of the messages: equal revisions, equal
    /// messages, states and settled set.
    pub fn msgs_rev(&self) -> u64 {
        self.msgs_rev
    }

    /// The one writer of a message: its row, its state (None: unchanged),
    /// whether a reply settled it, and what sb-core says of it (`hot`).
    pub fn put_msg(&mut self, m: Msg, state: Option<MsgState>, settled: bool, hot: Hot) {
        self.msgs_rev += 1;
        if hot.queued || hot.owes {
            self.hot.insert(m.id, hot);
        } else {
            self.hot.remove(&m.id);
        }
        if let Some(state) = state {
            self.msg_state.insert(m.id, state);
        }
        if settled {
            self.settled.insert(m.id);
        } else {
            self.settled.remove(&m.id);
        }
        let (id, thread) = (m.id, m.thread);
        let was = self.msgs.insert(id, m).map(|o| o.thread);
        if let Some(old) = was.filter(|t| *t != thread) {
            self.threads.take(&self.msgs, old, id);
        }
        self.threads.put(&self.msgs, thread, id);
    }

    /// Forget every message (a view that carries them all).
    pub fn clear_msgs(&mut self) {
        self.msgs_rev += 1;
        self.msgs.clear();
        self.msg_state.clear();
        self.settled.clear();
        self.threads = Default::default();
        self.hot.clear();
    }

    /// Tests only: put_msg with sb-core's facts as model.bend's
    /// predicates give them (`is_queued`; delivered, expecting a reply,
    /// not settled), the state kept when `state` is None.
    #[cfg(test)]
    pub fn put_msg_judged(&mut self, m: Msg, state: Option<MsgState>, settled: bool) {
        let st = state.clone().or_else(|| self.msg_state.get(&m.id).cloned());
        let hot = Hot {
            queued: matches!(st, Some(MsgState::Queued { .. })),
            owes: m.expect_reply && !settled && matches!(st, Some(MsgState::Delivered)),
        };
        self.put_msg(m, state, settled, hot);
    }

    /// The hot messages, oldest first, with what sb-core says of each.
    pub fn hot(&self) -> impl Iterator<Item = (&Msg, Hot)> + '_ {
        self.hot.iter().filter_map(|(id, h)| Some((self.msgs.get(id)?, *h)))
    }

    /// The threads of main's `<agent_threads>` (board::agent_threads).
    pub fn threads(&self) -> &crate::board::Threads {
        &self.threads
    }

    /// The canonical name of an agent: itself, or the task an alias
    /// (an old name) points to.
    pub fn resolve(&self, name: &str) -> Option<String> {
        if self.agents.contains_key(name) {
            return Some(name.to_string());
        }
        self.agents
            .values()
            .find(|a| a.aliases.iter().any(|x| x == name))
            .map(|a| a.name.clone())
    }

    pub fn tasks(&self) -> impl Iterator<Item = &Agent> {
        self.order
            .iter()
            .filter_map(|n| self.agents.get(n))
            .filter(|a| !a.is_main)
    }

    /// The user's inbox: an older journal's cards of other kinds are
    /// hidden until the hub's boot closes them.
    pub fn open_cards(&self) -> impl Iterator<Item = &Card> {
        self.cards.values().filter(|c| user_kind(&c.kind))
    }

    /// Tests only: a task as its creation leaves it (the real state
    /// comes from sb-core, see core.rs).
    #[cfg(test)]
    pub fn test_task(&mut self, name: &str, objective: &str) {
        let mut a = self.agents[MAIN].clone();
        a.name = name.to_string();
        a.dir = name.to_string();
        a.is_main = false;
        a.parent = Some(MAIN.to_string());
        a.brief = Brief {
            objective: objective.to_string(),
            ..Brief::default()
        };
        self.agents.insert(name.to_string(), a);
        self.order.push(name.to_string());
    }

    /// Delivered messages to `name` that expect a reply it has not given.
    pub fn unanswered_for(&self, name: &str) -> Vec<&Msg> {
        self.hot().filter(|(m, h)| h.owes && m.to == name).map(|(m, _)| m).collect()
    }

    /// `m` was delivered, expects a reply, and its recipient has not
    /// given it (sb-core's word, its view's `owes`).
    pub fn owes_reply(&self, m: &Msg) -> bool {
        self.hot.get(&m.id).is_some_and(|h| h.owes)
    }

    /// `m` waits for delivery (sb-core's word, its view's `queued`).
    pub fn is_queued(&self, m: &Msg) -> bool {
        self.hot.get(&m.id).is_some_and(|h| h.queued)
    }
}

/// What sb-core says of a message (its view's `ViewMsg.queued`, `owes`,
/// hub/model.bend's predicates): the hub never decides it again.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Hot {
    /// it waits for delivery
    pub queued: bool,
    /// it was delivered and expects a reply its recipient has not given
    pub owes: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn status_follows_lifecycle_then_run_then_declared() {
        let mut st = State::new("/w");
        st.test_task("a", "do it");
        let a = st.agents.get_mut("a").unwrap();
        assert_eq!(a.status(), Status::Starting);
        a.run = Run::Busy;
        assert_eq!(a.status(), Status::Working);
        a.waiting = true;
        assert_eq!(a.status(), Status::Waiting);
        a.waiting = false;
        a.run = Run::Idle;
        a.declared = Some((Declared::Done, String::new()));
        assert_eq!(a.status(), Status::Done);
        a.lifecycle = Lifecycle::Archived;
        assert_eq!(a.status(), Status::Archived);
    }
}
