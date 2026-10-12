//! sb-core's effects: what a committed step asks the hub to do, the items
//! of its answer's `"fx"` list (`{"fx": <tag>, …}`), in the order sb-core
//! writes their keys (bend/hub/core.bend's `out` calls, main.bend's
//! `fx_json` for `journal`).
//!
//! One tag has two shapes on the wire, one variant here with the shape's
//! fields optional, and one Bend encoder per shape ([`SHAPES`]): `confirm`
//! (the gate card's verdict to its agent, or a client's yes/no on a drop).
//! A line of an agent's feed is `feed`, its record a `Feed` (issue 25:
//! the old text `line` effect is gone).

use super::core_kinds;

core_kinds! {
    /// One effect of sb-core.
    pub enum Fx, tag "fx" {
        /// a journal event (hub/codec.bend's JSON, kept whole here)
        Journal = "journal" => FJournal { ev: Json },
        /// an agent's runtime state (the view carries it too)
        Rt = "rt" => FRt { agent: Str, run: Str, waiting: Bool, turn_ms: OptNat, turns: Nat },
        /// start an agent's REPL (`crash_note`: a restart after a crash)
        Spawn = "spawn" => FSpawn { agent: Str, resume: Bool, crash_note: OptStr },
        Kill = "kill" => FKill { agent: Str },
        /// a text into an agent's REPL, starting a turn
        Say = "say" => FSay { agent: Str, text: Str },
        Passthrough = "passthrough" => FPassthrough { agent: Str, line: Str },
        Interrupt = "interrupt" => FInterrupt { agent: Str },
        /// a record of an agent's feed (issue 25): `rec` is a `Feed` value
        /// with its `sb` tag, written as `sb <kind> :: <json>`
        Feed = "feed" => FFeed { agent: Str, rec: Json },
        /// the answer to an agent's request
        Reply = "reply" => FReply { token: Nat, body: Json },
        /// a notice to the client that typed the input
        Notice = "notice" => FNotice { text: Str },
        /// messages for an agent: `mode` `say` (a new turn) or `steer`;
        /// main's `notes`, the task `status` block, then each message
        Deliver = "deliver" => FDeliver { mode: Str, agent: Str, notes: Strs, status: Bool, msgs: Msgs },
        /// bise's home hub: a message to a project hub
        XDeliver = "xdeliver" => FXDeliver { xid: Nat, project: Str, kind: Str, msg: Nat, text: Str, context: Str, parts: StrOmit },
        /// a project hub: the answer to bise's home hub
        XReply = "xreply" => FXReply { hub: Str, xid: Nat, text: Str },
        /// his words held for a project (S2 step 2)
        Route = "route" => FRoute { rid: Nat, to: Str, name: Str, text: Str, due_ms: Nat, why: Str },
        /// a held route ended (`xid`: the out it became, none when cancelled)
        RouteDone = "route_done" => FRouteDone { rid: Nat, state: Str, to: Str, xid: OptNat },
        /// his unclear words: ask the model for a project
        RouteAsk = "route_ask" => FRouteAsk { rid: Nat, text: Str },
        /// a task ended (`hub`: the following hub to tell, "" none)
        JobEnd = "job_end" => FJobEnd { agent: Str, state: Str, label: Str, summary: Str, key: Nat, hub: Str },
        /// bise's home hub: a task it follows in `project` ended
        FollowedEnd = "followed_end" => FFollowedEnd { project: Str, agent: Str, key: Nat, state: Str, label: Str, summary: Str },
        /// his number on a hub item (merge.rs)
        CardChoice = "card_choice" => FCardChoice { card: Nat, kind: Str, agent: Str, place: OptStr, pr: OptNat, text: Str },
        /// `card`+`agent`: the gate card's verdict; `name`: ask the
        /// client that typed the input yes or no
        Confirm = "confirm" => FConfirm { card: OptNatOmit, agent: OptStrOmit, name: OptStrOmit, text: Str },
        /// the clients on `name` go back to main (it was archived)
        FocusMain = "focus_main" => FFocusMain { name: Str },
        /// his text, for the client's direct-exchange note
        UserSent = "user_sent" => FUserSent { text: Str },
        Renamed = "renamed" => FRenamed { old: Str, new: Str },
    }
}

/// The Bend encoders of the two-shape tags: (encoder, tag, its fields);
/// the other fields of the kind are absent. Every other kind has one
/// encoder with all its fields.
pub const SHAPES: &[(&str, &str, &[&str])] = &[
    ("confirm_card", "confirm", &["card", "agent", "text"]),
    ("confirm_name", "confirm", &["name", "text"]),
];
