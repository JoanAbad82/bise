//! The link's own requests (`{"t": <tag>, …}`, like an input): main.bend
//! answers them before any dispatch (its `tag_of`), so they are not
//! sb-core inputs and have no envelope. Any other tag is a step (an
//! [`super::In`]): its Bend fallback is `TStep`.

use super::{core_kinds, Field, FieldKind, Fx, Kind, Table};

core_kinds! {
    /// One request of the hub to the sb-core process itself.
    pub enum Link, tag "t" {
        /// reset the hub's state (a new sb-core, a restart)
        Init = "init" => TInit { workspace: Str },
        /// one journal event (answers `{"skipped": true}` for a kind it
        /// does not know)
        Replay = "replay" => TReplay { ev: Json },
        /// a batch of journal events at boot (answers the skipped indexes)
        ReplayMany = "replay_many" => TReplayMany { evs: Jsons },
        /// answers `{}`
        Ping = "ping" => TPing {},
        /// the whole view
        ViewAll = "view_all" => TView {},
    }
}

/// sb-core's answer line to one link request or step (main.bend's
/// `answer`, `replay`, `replay_many`, `handle`). Untagged: its keys say
/// which it is, tried in this order (a step's answer has a `view` too).
/// Each shape is a row of [`ANSWER`], from which tests/core_gen.rs writes
/// sb-core's encoder (`bend/hub/gen/link.bend`'s `answer_<tag>`).
#[derive(Clone, Debug, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(untagged)]
pub enum Answer {
    Step(AStep),
    Need(ANeed),
    View(AView),
    Skipped(ASkipped),
    Error(AError),
    Done(ADone),
    /// a shape this side doesn't know (a newer sb-core): kept whole
    Unknown(serde_json::Value),
}

/// A committed step: its effects in order, whether the durable state
/// changed (the hub saves it), the view of what the step changed.
#[derive(Clone, Debug, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct AStep {
    #[serde(with = "fx_list")]
    pub fx: Vec<Fx>,
    pub dirty: bool,
    #[serde(default)]
    pub view: serde_json::Value,
}

/// A git answer is missing: the hub runs the query and sends the same
/// input again with its answer appended to `ans` (nothing was committed).
#[derive(Clone, Debug, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct ANeed {
    pub need: serde_json::Value,
}

/// `view_all`: the whole view.
#[derive(Clone, Debug, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct AView {
    pub view: serde_json::Value,
}

/// `replay`: `true`, a journal event of a kind this sb-core doesn't know
/// (written by a newer hub before a rollback), not applied;
/// `replay_many`: the indexes in the batch of those.
#[derive(Clone, Debug, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct ASkipped {
    pub skipped: Skipped,
}

#[derive(Clone, Debug, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(untagged)]
pub enum Skipped {
    One(bool),
    At(Vec<u64>),
}

/// A line that is not JSON (`json: <why>`).
#[derive(Clone, Debug, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct AError {
    pub error: String,
}

/// `{}`: init, ping, an applied replay.
#[derive(Clone, Debug, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ADone {}

impl Answer {
    /// One answer line (any JSON object is an answer: `Unknown` at worst).
    pub fn decode_line(line: &str) -> Result<Answer, String> {
        serde_json::from_value(crate::parse(line)?).map_err(|e| format!("answer: {e}"))
    }

    pub fn to_value(&self) -> serde_json::Value {
        match self {
            Answer::Unknown(v) => v.clone(),
            a => serde_json::to_value(a).expect("an answer always serializes"),
        }
    }
}

/// An answer's `fx`: each item through [`Fx::decode`], so a tag this side
/// doesn't know is `Fx::Unknown` (logged by the hub), never a failed answer.
mod fx_list {
    use super::Fx;
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S: Serializer>(fx: &[Fx], s: S) -> Result<S::Ok, S::Error> {
        s.collect_seq(fx.iter().map(Fx::to_value))
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Vec<Fx>, D::Error> {
        let vals = Vec::<serde_json::Value>::deserialize(d)?;
        vals.into_iter().map(|v| Fx::decode(v).map_err(serde::de::Error::custom)).collect()
    }
}

/// The shapes of [`Answer`], for the Bend encoders (tag: the encoder's
/// name after `answer_`; no tag key on the wire). `skipped` has two
/// shapes, one row each.
pub const ANSWER: Table = Table {
    name: "Answer",
    tag_key: "",
    kinds: &[
        Kind { tag: "step", rust: "Step", bend: "AStep", fields: &[Field { name: "fx", kind: FieldKind::Jsons }, Field { name: "dirty", kind: FieldKind::Bool }, Field { name: "view", kind: FieldKind::Json }] },
        Kind { tag: "need", rust: "Need", bend: "ANeed", fields: &[Field { name: "need", kind: FieldKind::Json }] },
        Kind { tag: "view", rust: "View", bend: "AView", fields: &[Field { name: "view", kind: FieldKind::Json }] },
        Kind { tag: "skipped", rust: "Skipped", bend: "ASkipped", fields: &[Field { name: "skipped", kind: FieldKind::Bool }] },
        Kind { tag: "skipped_at", rust: "Skipped", bend: "ASkippedAt", fields: &[Field { name: "skipped", kind: FieldKind::Nats }] },
        Kind { tag: "error", rust: "Error", bend: "AError", fields: &[Field { name: "error", kind: FieldKind::Str }] },
        Kind { tag: "done", rust: "Done", bend: "ADone", fields: &[] },
    ],
};
