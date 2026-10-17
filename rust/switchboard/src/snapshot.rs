//! The hub's client snapshot, typed (issue 30): what `core::Hub::snapshot`
//! returns (built in core_snapshot.rs, its agent rows in snapshot_rows.rs)
//! and what the views read by field: the typed rows (proto_view), the
//! growth rows, view.json.
//!
//! The hub's view, not wire: the wire rows stay bise_proto's
//! (`rows::Agent`, `rows::Card`...), mapped from these. Its JSON
//! (`serde_json::to_value`) is the older untyped snapshot's, key for key:
//! the field names, `null`s and skipped keys below are that shape, pinned
//! by the golden files under `tests/snapshot/` (core_snapshot_tests.rs).

use crate::flow::FlowMode;
use crate::model::{Declared, Mode, Status};
use crate::place::PlaceView;
use bise_proto::draft::Queued;
use bise_proto::rows::{AgentWatch, Doing};
use serde::Serialize;

/// The snapshot's tag (`"ev": "state"`).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize)]
pub enum StateEv {
    #[default]
    #[serde(rename = "state")]
    State,
}

/// The hub's state for the views: its agents, its open cards, its
/// places, the repo's flow.
#[derive(Clone, Debug, Default, PartialEq, Serialize)]
pub struct Snapshot {
    pub ev: StateEv,
    /// every agent, archived ones included, in the hub's order
    pub agents: Vec<AgentRow>,
    /// the open cards, oldest first
    pub cards: Vec<CardRow>,
    /// the worktrees the views draw (`place::views`)
    pub places: Vec<PlaceView>,
    pub flow: Option<FlowMode>,
}

/// One agent as the views see it (snapshot_rows.rs builds it).
#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct AgentRow {
    pub name: String,
    pub main: bool,
    pub status: Status,
    pub objective: String,
    /// what it is doing now, one line (BISE-126); "" for main
    pub role: String,
    pub parent: Option<String>,
    pub mode: Mode,
    pub path: String,
    pub branch: Option<String>,
    pub dropped: bool,
    /// BISE-136: a private worktree (gate.sh new), else null
    pub place: Option<String>,
    /// dev-flow §3.1: the id of the place it is in (`places`) (BISE-136:
    /// its private worktree's, `pt:<path>`; a feature's agent: its
    /// feature's, dev-flow §5.1)
    pub place_id: String,
    pub created_ms: u64,
    /// its folder under agents/ and its former names (S2 C: view.json
    /// carries them for sb history --project)
    pub dir: String,
    pub aliases: Vec<String>,
    pub note: String,
    /// the status it declared (done, blocked, working; null: none): les
    /// bims' growth counts the done ones, archived too (the archive keeps
    /// it; an auto turn report replaces report_kind)
    pub declared: Option<Declared>,
    pub report: Option<String>,
    /// when it last reported (an archived task: about when it stopped)
    pub report_ms: Option<u64>,
    /// S10: followed, and its progress step (`--step n/m`)
    pub follow: bool,
    pub report_kind: Option<String>,
    pub step: Option<u32>,
    pub of: Option<u32>,
    /// messages waiting for its delivery
    pub queued: usize,
    /// the user's queued inputs waiting for the turn's end (the window's
    /// "send queued")
    pub queued_inputs: Vec<Queued>,
    /// BISE-299: main's inbox, the agents' questions waiting for main
    /// (the user sees a quiet count, never asked); 0 for a task
    pub inbox: usize,
    pub turn_ms: Option<u64>,
    /// issue 22: its ended turns, from the same sb-core view as its
    /// status
    pub turns: u64,
    /// who it waits on (`sb wait` / `sb ask`), for `waits {name}`
    pub waiting_on: Option<String>,
    /// event-wake: the events it waits for (wake-ui)
    pub watching: Vec<AgentWatch>,
    /// les bims: what it is doing now, only while its turn runs (or
    /// paused on a backgrounded command: a build)
    pub doing: Option<Doing>,
}

/// One open card as the views see it.
#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct CardRow {
    pub id: u64,
    pub kind: String,
    pub agent: String,
    pub text: String,
    pub for_msg: Option<u64>,
    pub age_ms: u64,
    /// what the view adds under it (a merge's, an update's, a sign-in's,
    /// a question maybe answered another way)
    pub note: Option<String>,
    /// expired-ux: the agents that wait for the sign-in (⏎ in their
    /// thread signs in); a sign-in card only
    pub waiting: Option<Vec<String>>,
    /// update-card: the release page its `3` opens
    pub link: Option<String>,
    /// a hub item's place and PR (pr-merge): the TUI ties it to the
    /// place's box and opens its link
    pub place: Option<String>,
    pub pr: Option<u64>,
}
