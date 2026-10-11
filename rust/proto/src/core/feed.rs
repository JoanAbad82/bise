//! DRAFT: the typed records of an agent's transcript, the hub's lines
//! (`sb <kind> : …`). Nothing writes them yet: issue 25's chunk F moves
//! the writers to `sb <kind> : <json>` of this type, and reads every older
//! text shape in one place (`thread/legacy.rs`). Until its first writer
//! lands, a name here may still change; from then on the wire rule binds.
//!
//! One variant per kind the hub writes today (sb-core's `line` effects
//! and the Rust side's own lines), its fields what
//! [`crate::thread::lines::Hub`] reads from the text now, so the fold's
//! change is mechanical. The tag is `"sb"` (`kind` is a field of two
//! records); the line carries the kind in its prefix and the JSON
//! without it ([`Feed::line`], [`Feed::read`]).
//!
//! `v` (always 1 for now) only on the records whose shape grew before or
//! may change: card, approval, pr, landed, scheduled, wake.

use super::core_kinds;
use serde_json::Value;

core_kinds! {
    /// One hub record of a transcript.
    pub enum Feed, tag "sb" {
        /// his message
        You = "you" => RYou { text: Str },
        /// the id of the `you` record right before it (same step)
        YouId = "you-id" => RYouId { id: Nat },
        /// the parts of the `you` record before it (msg-parts, a
        /// `Vec<parts::Part>`)
        YouParts = "you-parts" => RYouParts { parts: Json },
        /// the parts of the route record right before it
        RouteParts = "route-parts" => RRouteParts { parts: Json },
        /// the agent read these steered messages here, mid-turn
        Steered = "steered" => RSteered { ids: Nats },
        /// the agent's runtime received these steered messages
        SteerRx = "steer-rx" => RSteerRx { ids: Nats },
        /// his fn context (S9), the FnContext JSON
        Context = "context" => RContext { context: Json },
        /// his message could not reach `to` (stopped, dropped, archived)
        Undelivered = "undelivered" => RUndelivered { to: Str, text: Str },
        /// what the feed's owner received (`id` none: older lines)
        MsgIn = "msg-in" => RMsgIn { from: Str, id: OptNatOmit, body: Str },
        /// a message between two others (`id` none: before BISE-110)
        Msg = "msg" => RMsg { from: Str, to: Str, id: OptNatOmit, body: Str },
        /// what the feed's owner sent (`ask`: it awaits a reply)
        Sent = "sent" => RSent { to: Str, id: Nat, ask: Bool, body: Str },
        /// an agent writing to the user
        MsgYou = "msg-you" => RMsgYou { from: Str, body: Str },
        /// main answered an agent for the user
        Answered = "answered" => RAnswered { agent: Str, question: Str, answer: Str, why: Str },
        /// an attention card opened
        Card = "card" => RCard { v: Ver, id: Nat, kind: Str, agent: Str, body: Str },
        /// the approvals gate of the running call: `check`, `card`, `done`
        Gate = "gate" => RGate { step: Str },
        /// a gate's card answered: `how` allowed|outside|outside-always|no
        Approval = "approval" => RApproval { v: Ver, how: Str, who: Str, what: Str, note: Str },
        /// a card closed (`res`: answered, closed, …)
        CardClosed = "card-closed" => RCardClosed { id: Nat, res: Str },
        /// his answer to an item, routed to `who`
        Route = "route" => RRoute { who: Str, card: Nat, said: Str },
        /// pr-news: `state` news|done|failing
        Pr = "pr" => RPr { v: Ver, state: Str, number: Nat, url: Str, text: Str },
        /// an artifact registered, its `version`
        Artifact = "artifact" => RArtifact { id: Str, agent: Str, title: Str, kind: Str, version: Nat },
        /// a land: `files` changed, `add`/`del` lines
        Landed = "landed" => RLanded { v: Ver, agent: Str, target: Str, from: Str, sha: Str, files: Nat, add: Nat, del: Nat },
        /// a task created (`main → new task @x : objective`)
        Spawn = "spawn" => RSpawn { text: Str },
        /// computer use (design §7.3)
        Computer = "computer" => RComputer { text: Str },
        Direct = "direct" => RDirect { text: Str },
        Info = "info" => RInfo { text: Str },
        Warn = "warn" => RWarn { text: Str },
        /// a scheduled task set or ended (`thread::Scheduled`'s JSON)
        Scheduled = "scheduled" => RScheduled { v: Ver, timer: Json },
        /// an interrupt (sb-core writes it in the interrupt's step)
        Stopped = "stopped" => RStopped { text: Str },
        /// event-wake: a watch ended (`thread::WakeFold`'s JSON)
        Wake = "wake" => RWake { v: Ver, watch: Json },
        /// the answer he had read as it streamed in, when its turn failed
        Kept = "kept" => RKept { text: Str },
    }
}

impl Feed {
    /// Its transcript line: `sb <kind> : <json without the tag>`.
    pub fn line(&self) -> String {
        let mut v = self.to_value();
        if let Value::Object(m) = &mut v {
            m.remove("sb");
        }
        format!("sb {} : {}", self.tag(), v)
    }

    /// A line's kind and JSON text (after `sb <kind> : `) read back;
    /// None when the text is not a JSON object (an older text line: the
    /// legacy reader's).
    pub fn read(kind: &str, json: &str) -> Option<Result<Feed, String>> {
        let Ok(Value::Object(mut m)) = serde_json::from_str::<Value>(json) else { return None };
        m.insert("sb".into(), Value::String(kind.to_string()));
        Some(Feed::decode(Value::Object(m)))
    }
}
