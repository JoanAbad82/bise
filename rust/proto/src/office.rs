//! `bise office run` ↔ bend-jsrt's script mode (architect m_23785): one
//! JSON object per line on jsrt's stdout ([`JsrtEv`], tagged `"ev"`) and
//! stdin ([`HarnessCmd`], tagged `"cmd"`).
//!
//! jsrt runs the script and does the file ops itself, behind its door
//! check (`rust/jsrt/src/door.rs`); it knows no hub. After a write it says
//! `wrote` and waits for one `answer`: the harness has sent the
//! `sb artifact add` request on `SB_SOCKET` by then, so `run.write`
//! resolves once the hub has the version (or said why not).
//!
//! The fixtures (`fixtures/office_ev.jsonl`, `fixtures/office_cmd.jsonl`)
//! are the one source; a name is added, never renamed or retyped.

use crate::{decode, is_false, parse};
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// What jsrt's script mode says.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "ev", rename_all = "snake_case")]
pub enum JsrtEv {
    /// a `console.log` (or `.error`, `.warn`) line of the script
    Log { line: String },
    /// a file was written (whole, by rename): the harness tells the hub,
    /// then answers
    Wrote {
        /// absolute, after the door check
        path: String,
        /// `run.write(.., { artifact: true })`: a new artifact when it is
        /// not one yet; else only a next version of one that already is
        #[serde(default, skip_serializing_if = "is_false")]
        artifact: bool,
    },
    /// the script ended well
    Done,
    /// the script failed (a door refusal, an exception, the time cap)
    Error { message: String },
    #[serde(skip)]
    Unknown { tag: String, raw: Value },
}

impl JsrtEv {
    pub const TAGS: &'static [&'static str] = &["log", "wrote", "done", "error"];

    pub fn decode(line: &str) -> Result<JsrtEv, String> {
        decode(parse(line)?, "ev", Self::TAGS, |tag, raw| JsrtEv::Unknown { tag, raw })
    }

    pub fn to_value(&self) -> Value {
        match self {
            JsrtEv::Unknown { raw, .. } => raw.clone(),
            e => serde_json::to_value(e).expect("a JsrtEv encodes"),
        }
    }
}

/// What the harness answers jsrt.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "cmd", rename_all = "snake_case")]
pub enum HarnessCmd {
    /// the answer to `wrote`: the hub's words (`ok` false: the file is
    /// written, the hub refused the version, `text` says why)
    Answer { ok: bool, text: String },
    #[serde(skip)]
    Unknown { tag: String, raw: Value },
}

impl HarnessCmd {
    pub const TAGS: &'static [&'static str] = &["answer"];

    pub fn decode(line: &str) -> Result<HarnessCmd, String> {
        decode(parse(line)?, "cmd", Self::TAGS, |tag, raw| HarnessCmd::Unknown { tag, raw })
    }

    pub fn to_value(&self) -> Value {
        match self {
            HarnessCmd::Unknown { raw, .. } => raw.clone(),
            c => serde_json::to_value(c).expect("a HarnessCmd encodes"),
        }
    }
}
