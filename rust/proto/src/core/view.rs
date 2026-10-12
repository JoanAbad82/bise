//! sb-core's view (issue 21, D3): the state the hub's mirror reads after
//! each step (a step's answer `view`, `view_all`'s), as sb-core writes it
//! (bend/hub/view.bend, through the encoders tests/core_gen.rs writes in
//! `bend/hub/gen/view.bend`).
//!
//! Untagged records: [`View`], its [`ViewAgent`] rows and [`ViewMsg`]
//! records. The payloads inside (an agent's brief, ws and report, a
//! message and its state, the cards, timers and watches) are the journal
//! codec's shapes: `Json` here, read into the hub's model types by serde
//! (that codec is the next slice, issue 25).
//!
//! A step's view carries only what the step changed (view.bend
//! `changed`, `durable_kvs`, `timers_kvs`, `wakes_kvs`): the agents it
//! changed (`all_agents` false), the messages it touched (`all_msgs`
//! false), and the order, cards, notes, timers and watches only when an
//! event changed them (absent otherwise: the hub keeps its own).
//!
//! sb-core never decodes a view, so View has no Bend decoder and no round
//! law: it is proven Rust-side (the table test in tests.rs, the fixture
//! fixtures/core_view.jsonl, one view per shape).

use super::core_records;

core_records! {
    /// The records of sb-core's view, for the Bend encoders.
    pub const VIEW = "View" {
        /// One agent's row: its durable record, its runtime (`run`,
        /// `waiting`, `turn_ms`, `turns`) and who it waits on.
        ViewAgent = "agent" => VAgent {
            name: Str,
            dir: Str,
            is_main: Bool,
            parent: OptStr,
            /// the task's brief (null: none)
            brief: Json,
            created_ms: Nat,
            /// its workspace
            ws: Json,
            /// `active`, `archived`, ...
            lifecycle: Str,
            failure: OptStr,
            /// `{status, note}` from `sb status`, null when none
            declared: Json,
            /// its last `sb report` (null: none)
            last_report: Json,
            aliases: Strs,
            files: Strs,
            snapshot_ref: OptStr,
            follow: Bool,
            /// `down`, `starting`, `idle`, `busy`
            run: Str,
            waiting: Bool,
            /// the recipient of the message its `sb wait` waits on
            waiting_on: OptStr,
            /// when its turn started (null: no turn)
            turn_ms: OptNat,
            turns: Nat,
        },
        /// One message with its state, and whether its question is settled.
        ViewMsg = "msg" => VMsg { msg: Json, state: Json, settled: Bool },
        /// The view. A missing `all_agents` reads true (every agent), a
        /// missing `next_msg`/`next_card` 1, as the hub read them before.
        View = "view" => VView {
            agents: Recs(ViewAgent),
            /// false: `agents` are the ones the step changed, keep the others
            all_agents: Bool = true,
            msgs: Recs(ViewMsg),
            /// true: `msgs` are every message (drop the ones not in it)
            all_msgs: Bool,
            next_msg: Nat = 1,
            next_card: Nat = 1,
            /// cost-pause: since when the project is paused (null: it runs)
            paused: OptNat,
            order: OptStrsOmit,
            cards: OptJsonsOmit,
            notes: OptStrsOmit,
            /// `sb every`'s live timers
            timers: OptJsonsOmit,
            timers_ended: OptJsonsOmit,
            /// `sb wake`'s live watches
            wakes: OptJsonsOmit,
            wakes_ended: OptJsonsOmit,
        },
    }
}

impl View {
    /// sb-core's view: an error when a field doesn't fit (a bug of
    /// sb-core's encoder; the hub logs it and keeps its mirror).
    pub fn decode(v: &serde_json::Value) -> Result<View, String> {
        <View as serde::Deserialize>::deserialize(v).map_err(|e| format!("view: {e}"))
    }

    pub fn to_value(&self) -> serde_json::Value {
        serde_json::to_value(self).expect("a view always serializes")
    }
}
