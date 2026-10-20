//! The codecs of the few `sb` request fields whose wire shape is not
//! their Rust value (sb.rs): each reads what the CLI has always written
//! and writes it back the same way.

use super::{parse_msg_id, Brief};
use serde::de::Error as _;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use serde_json::Value;

/// `--timeout`'s default (s).
pub fn twenty() -> u64 {
    20
}

pub fn yes() -> bool {
    true
}

/// A message id: `"m_12"` on the wire (`"12"` and `12` read too).
pub mod msg_id {
    use super::*;

    pub fn serialize<S: Serializer>(id: &u64, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&format!("m_{id}"))
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<u64, D::Error> {
        match Value::deserialize(d)? {
            Value::Number(n) => n.as_u64().ok_or_else(|| D::Error::custom("invalid message id")),
            Value::String(s) => parse_msg_id(&s).ok_or_else(|| D::Error::custom(format!("invalid message id: {s}"))),
            v => Err(D::Error::custom(format!("invalid message id: {v}"))),
        }
    }
}

/// An optional message id: one that doesn't read is none (as `reply_to`
/// and `for` always were).
pub mod opt_msg_id {
    use super::*;

    pub fn serialize<S: Serializer>(id: &Option<u64>, s: S) -> Result<S::Ok, S::Error> {
        match id {
            Some(id) => s.serialize_str(&format!("m_{id}")),
            None => s.serialize_none(),
        }
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Option<u64>, D::Error> {
        Ok(match Value::deserialize(d)? {
            Value::Number(n) => n.as_u64(),
            Value::String(s) => parse_msg_id(&s),
            _ => None,
        })
    }
}

/// `mode`: `steer` (or none) false, `queued` true.
pub mod mode {
    use super::*;

    pub fn serialize<S: Serializer>(queued: &bool, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(if *queued { "queued" } else { "steer" })
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<bool, D::Error> {
        match String::deserialize(d)?.as_str() {
            "" | "steer" => Ok(false),
            "queued" => Ok(true),
            m => Err(D::Error::custom(format!("unknown mode: {m} (steer|queued)"))),
        }
    }
}

/// `off` on the wire, `on` in Rust; anything but `true` is on.
pub mod negated {
    use super::*;

    pub fn serialize<S: Serializer>(on: &bool, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_bool(!on)
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<bool, D::Error> {
        Ok(Value::deserialize(d)?.as_bool() != Some(true))
    }
}

/// An agent's name, its `@` taken off.
pub fn at_name<'de, D: Deserializer<'de>>(d: D) -> Result<String, D::Error> {
    Ok(String::deserialize(d)?.trim_start_matches('@').to_string())
}

/// A report's kind: progress, done, failed or blocked.
pub fn report_kind<'de, D: Deserializer<'de>>(d: D) -> Result<String, D::Error> {
    let k = String::deserialize(d)?;
    match k.as_str() {
        "progress" | "done" | "failed" | "blocked" => Ok(k),
        _ => Err(D::Error::custom(format!("unknown report kind: {k} (progress|done|failed|blocked)"))),
    }
}

/// A JSON object, else none.
pub fn object<'de, D: Deserializer<'de>>(d: D) -> Result<Option<Value>, D::Error> {
    Ok(Some(Value::deserialize(d)?).filter(Value::is_object))
}

/// A string, trimmed; empty (or null) is none.
pub fn nonempty<'de, D: Deserializer<'de>>(d: D) -> Result<Option<String>, D::Error> {
    Ok(Option::<String>::deserialize(d)?.map(|s| s.trim().to_string()).filter(|s| !s.is_empty()))
}

/// `sb send --model/--effort`: both keys when either was given.
pub mod switch {
    use super::*;

    #[derive(Serialize, Deserialize)]
    struct Keys {
        #[serde(default, skip_serializing_if = "Option::is_none")]
        model: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        effort: Option<String>,
    }

    pub fn serialize<S: Serializer>(v: &Option<(String, String)>, s: S) -> Result<S::Ok, S::Error> {
        let (model, effort) = v.clone().map_or((None, None), |(m, e)| (Some(m), Some(e)));
        Keys { model, effort }.serialize(s)
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Option<(String, String)>, D::Error> {
        let k = Keys::deserialize(d)?;
        Ok((k.model.is_some() || k.effort.is_some()).then(|| (k.model.unwrap_or_default(), k.effort.unwrap_or_default())))
    }
}

/// `sb report --step n/m`: `step` and `of`, both or neither.
pub mod step {
    use super::*;

    #[derive(Serialize, Deserialize)]
    struct Keys {
        #[serde(default, skip_serializing_if = "Option::is_none")]
        step: Option<Value>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        of: Option<Value>,
    }

    pub fn serialize<S: Serializer>(v: &Option<(u32, u32)>, s: S) -> Result<S::Ok, S::Error> {
        let (step, of) = v.map_or((None, None), |(n, m)| (Some(n.into()), Some(m.into())));
        Keys { step, of }.serialize(s)
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Option<(u32, u32)>, D::Error> {
        let k = Keys::deserialize(d)?;
        let n = |v: Option<Value>| v.and_then(|x| x.as_u64()).and_then(|x| u32::try_from(x).ok());
        Ok(n(k.step).zip(n(k.of)))
    }
}

/// `sb status`'s word: working|done|blocked, any other the sender's error
/// (the state's [`super::Declared`] reads any word as `working`: a
/// journal's leniency, not the request's).
pub mod declared {
    use super::*;
    use crate::core::state::Declared;

    pub fn serialize<S: Serializer>(d: &Declared, s: S) -> Result<S::Ok, S::Error> {
        d.serialize(s)
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Declared, D::Error> {
        match String::deserialize(d)?.as_str() {
            "working" => Ok(Declared::Working),
            "done" => Ok(Declared::Done),
            "blocked" => Ok(Declared::Blocked),
            s => Err(D::Error::custom(format!("unknown status: {s} (working|done|blocked)"))),
        }
    }
}

/// A spawn's brief on the wire: `done_when` and `report_format` are ""
/// when none (the journal's [`Brief`] has null).
pub mod brief {
    use super::*;

    #[derive(Serialize, Deserialize)]
    struct Keys {
        #[serde(default)]
        objective: String,
        #[serde(default)]
        context: String,
        #[serde(default)]
        constraints: Vec<String>,
        #[serde(default)]
        done_when: String,
        #[serde(default)]
        report_format: String,
    }

    pub fn serialize<S: Serializer>(b: &Brief, s: S) -> Result<S::Ok, S::Error> {
        Keys {
            objective: b.objective.clone(),
            context: b.context.clone(),
            constraints: b.constraints.clone(),
            done_when: b.done_when.clone().unwrap_or_default(),
            report_format: b.report_format.clone().unwrap_or_default(),
        }
        .serialize(s)
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Brief, D::Error> {
        let k = Keys::deserialize(d)?;
        let some = |s: String| Some(s).filter(|s| !s.is_empty());
        Ok(Brief { objective: k.objective, context: k.context, constraints: k.constraints, done_when: some(k.done_when), report_format: some(k.report_format) })
    }
}
