//! The hub side of the protocol, v1's frozen part: [`HubEv`] (hub ->
//! client, tagged `"ev"`) and [`HubCmd`] (client -> hub, tagged `"cmd"`).
//! A hub can only emit a `HubEv`; the core's and the app's own messages
//! (projects, open, project_add) are other types ([`crate::draft`]), so
//! they can't reach a hub or come from one.

use crate::rows::{Agent, Artifact, Card};
use crate::thread::Entry;
use crate::{decode, parse, Pos, Project};
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// What a hub sends a client that said `hello {proto: 1}`.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "ev", rename_all = "snake_case")]
pub enum HubEv {
    /// the answer to `hello`: who this hub is (its tag is `welcome`: the
    /// hub's older `hello` event stays the TUI's)
    Welcome { project: Project, proto: u32, workspace: String, name: String },
    /// every agent of the hub, on change
    Agents { project: Project, agents: Vec<Agent> },
    /// every open card of the hub, on change
    Cards { project: Project, cards: Vec<Card> },
    /// one page of a thread, newest last: the answer to `subscribe` and
    /// `page`; `before` the oldest entry's pos when there is more
    Thread { project: Project, agent: String, entries: Vec<Entry>, before: Option<Pos>, more: bool },
    /// a subscribed thread's entry, live: a new pos appends, a known pos
    /// replaces (a tools entry growing, a card answered)
    Entry { project: Project, agent: String, entry: Box<Entry> },
    /// a subscribed agent's current step ("" when its turn ends)
    Typing { project: Project, agent: String, text: String },
    /// every artifact of the project, at hello and on change; `new`: made
    /// or changed since he last looked (`artifacts_seen` clears it)
    Artifacts { project: Project, items: Vec<Artifact> },
    /// an unknown or refused command, never silence
    Error {
        #[serde(default, skip_serializing_if = "Option::is_none")]
        project: Option<Project>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        cmd: Option<String>,
        text: String,
    },
    /// a tag this version doesn't know (a newer hub): kept whole, ignored
    #[serde(skip)]
    Unknown { tag: String, raw: Value },
}

impl HubEv {
    pub const TAGS: &'static [&'static str] = &["welcome", "agents", "cards", "thread", "entry", "typing", "artifacts", "error"];

    pub fn decode(line: &str) -> Result<HubEv, String> {
        Self::from_value(parse(line)?)
    }

    pub fn from_value(v: Value) -> Result<HubEv, String> {
        decode(v, "ev", Self::TAGS, |tag, raw| HubEv::Unknown { tag, raw })
    }

    pub fn to_value(&self) -> Value {
        match self {
            HubEv::Unknown { raw, .. } => raw.clone(),
            e => serde_json::to_value(e).expect("a HubEv encodes"),
        }
    }

    /// One line, without its newline.
    pub fn encode(&self) -> String {
        self.to_value().to_string()
    }

    pub fn tag(&self) -> &str {
        match self {
            HubEv::Unknown { tag, .. } => tag,
            e => match serde_json::to_value(e).ok().and_then(|v| v.get("ev").and_then(Value::as_str).map(str::to_string)) {
                Some(t) => Self::TAGS.iter().find(|x| **x == t).copied().unwrap_or("?"),
                None => "?",
            },
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Mode {
    /// steered into its running turn (or a turn of its own)
    Now,
    /// after its turn
    Queued,
}

/// What a client asks a hub.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "cmd", rename_all = "snake_case")]
pub enum HubCmd {
    /// this connection speaks v`proto`: the hub answers `welcome`, then
    /// sends `agents` and `cards` now and on each change
    Hello {
        proto: u32,
        /// typed events only on this connection: the hub's older events
        /// (`state`, `line`, its own `artifacts`...) stop after this
        /// hello (a window's connection; the capsule's mixed one says
        /// false until S8). When S8 moves the capsule to typed events,
        /// every typed connection is typed_only: S8 removes the mixed
        /// case (and this flag's false)
        #[serde(default, skip_serializing_if = "crate::is_false")]
        typed_only: bool,
    },
    /// a thread's newest page (`thread`), then its `entry`/`typing` live
    Subscribe {
        project: Project,
        agent: String,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        limit: Option<u32>,
    },
    Unsubscribe { project: Project, agent: String },
    /// the entries before `before` (a pos of `thread`): one more `thread`
    Page {
        project: Project,
        agent: String,
        before: Pos,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        limit: Option<u32>,
    },
    /// his words to an agent (main included), as the TUI sends them;
    /// `context`: decision F's fields, refused with an error until its
    /// stream renders it
    Send {
        project: Project,
        agent: String,
        text: String,
        mode: Mode,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        context: Option<Value>,
    },
    /// a card's answer: an option's number or words (approvals and merges
    /// included: the hub's one /answer path)
    Answer { project: Project, card: u64, reply: String },
    /// stop its turn
    Stop { project: Project, agent: String },
    /// out of his list (`force`: a working one is stopped first)
    Archive { project: Project, agent: String, force: bool },
    Unarchive { project: Project, agent: String },
    /// he opened the artifacts screen: their `new` clears, `artifacts`
    /// comes again
    ArtifactsSeen { project: Project },
    /// a tag this version doesn't know: answered with `error`
    #[serde(skip)]
    Unknown { tag: String, raw: Value },
}

impl HubCmd {
    pub const TAGS: &'static [&'static str] = &["hello", "subscribe", "unsubscribe", "page", "send", "answer", "stop", "archive", "unarchive", "artifacts_seen"];

    pub fn decode(line: &str) -> Result<HubCmd, String> {
        Self::from_value(parse(line)?)
    }

    pub fn from_value(v: Value) -> Result<HubCmd, String> {
        decode(v, "cmd", Self::TAGS, |tag, raw| HubCmd::Unknown { tag, raw })
    }

    pub fn to_value(&self) -> Value {
        match self {
            HubCmd::Unknown { raw, .. } => raw.clone(),
            c => serde_json::to_value(c).expect("a HubCmd encodes"),
        }
    }

    pub fn encode(&self) -> String {
        self.to_value().to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unknown_tags_are_kept_and_bad_fields_are_errors() {
        let e = HubEv::decode(r#"{"ev":"route","project":"p","to":"q"}"#).unwrap();
        assert!(matches!(&e, HubEv::Unknown { tag, .. } if tag == "route"));
        assert_eq!(e.encode(), r#"{"ev":"route","project":"p","to":"q"}"#);
        assert!(HubEv::decode(r#"{"ev":"typing","project":"p"}"#).is_err(), "a known tag without its fields");
        assert!(HubEv::decode(r#"{"project":"p"}"#).is_err());
        let c = HubCmd::decode(r#"{"cmd":"approve","project":"p","card":3}"#).unwrap();
        assert!(matches!(c, HubCmd::Unknown { .. }), "approve is answer's path: not a command");
        // unknown fields are ignored
        let t = HubEv::decode(r#"{"ev":"typing","project":"p","agent":"a","text":"x","new":1}"#).unwrap();
        assert_eq!(t, HubEv::Typing { project: "p".into(), agent: "a".into(), text: "x".into() });
        assert_eq!(t.tag(), "typing");
    }
}
