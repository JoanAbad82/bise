//! The hub side of the protocol, v1's frozen part: [`HubEv`] (hub ->
//! client, tagged `"ev"`) and [`HubCmd`] (client -> hub, tagged `"cmd"`).
//! A hub can only emit a `HubEv`; the core's and the app's own messages
//! (projects, open, project_add) are other types ([`crate::draft`]), so
//! they can't reach a hub or come from one.

use crate::diff::{DiffFile, DiffResult};
use crate::rows::{Agent, Artifact, Card, DevServer, Worktree};
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
    /// the repo's worktrees (the agents' and his others), at hello, when
    /// the agents change (a turn ends, one comes or goes) and on
    /// `worktrees`
    Worktrees { project: Project, items: Vec<Worktree> },
    /// the agents' background servers, with `worktrees` (same moments)
    /// and on `dev_servers`
    DevServers { project: Project, items: Vec<DevServer> },
    /// an agent's change (the answer to `diff`): its checkout or branch
    /// vs `base`; `head` its branch (none: the shared folder)
    Diff {
        project: Project,
        agent: String,
        base: String,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        head: Option<String>,
        files: Vec<DiffFile>,
        /// what the change measured (none: nothing measured; boxed: the
        /// enum stays small, the wire is the same)
        #[serde(default, skip_serializing_if = "Option::is_none")]
        result: Option<Box<DiffResult>>,
        /// its land on the trunk, once merged: the full sha (the merge
        /// path sets it; the review shows 7 and opens it on GitHub)
        #[serde(default, skip_serializing_if = "Option::is_none")]
        merged: Option<String>,
        /// the commit asked (`diff {commit}`): this is that commit alone,
        /// not the agent's live change (amb-web m_8974)
        #[serde(default, skip_serializing_if = "Option::is_none")]
        commit: Option<String>,
        /// why there are no files to show (its folder is gone...)
        #[serde(default, skip_serializing_if = "Option::is_none")]
        note: Option<String>,
    },
    /// bise's home hub holds his words for a project's main (desktop S2,
    /// decision B): `to` the project picked (its hub id), `name` its name,
    /// `why` the guess's reason; until `correct_until_ms` (2 s after) a
    /// `route_correct` or `route_cancel` with this `rid` still changes it;
    /// `route` comes again after a correction (same rid, same time)
    Route { project: Project, rid: u64, to: Project, name: String, text: String, correct_until_ms: u64, why: String },
    /// the route's end: `state` "sent" (forwarded: `xid` its delivery) or
    /// "cancelled" (his words stayed with bise's main)
    RouteDone {
        project: Project,
        rid: u64,
        state: String,
        to: Project,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        xid: Option<u64>,
    },
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
    pub const TAGS: &'static [&'static str] = &["welcome", "agents", "cards", "thread", "entry", "typing", "artifacts", "worktrees", "dev_servers", "diff", "route", "route_done", "error"];

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
    /// an agent's change, once (`diff` answers); `commit`: one commit of
    /// it instead (a landed one: the review's "merged · e0f3df5")
    Diff {
        project: Project,
        agent: String,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        commit: Option<String>,
    },
    /// the environments screen opened: `worktrees` comes again
    Worktrees { project: Project },
    /// the environments screen opened: `dev_servers` comes again
    DevServers { project: Project },
    /// a held route goes to project `to` instead (a hub id of the
    /// registry, else an error; "bise": his words stay with bise's main,
    /// a cancel); a route that ended already: nothing (its `route_done`
    /// came)
    RouteCorrect { project: Project, rid: u64, to: String },
    /// a held route doesn't go: his words reach bise's main as a plain
    /// message (a route that ended already: nothing)
    RouteCancel { project: Project, rid: u64 },
    /// a tag this version doesn't know: answered with `error`
    #[serde(skip)]
    Unknown { tag: String, raw: Value },
}

impl HubCmd {
    pub const TAGS: &'static [&'static str] = &["hello", "subscribe", "unsubscribe", "page", "send", "answer", "stop", "archive", "unarchive", "artifacts_seen", "diff", "worktrees", "dev_servers", "route_correct", "route_cancel"];

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
        let e = HubEv::decode(r#"{"ev":"jobs","project":"p","to":"q"}"#).unwrap();
        assert!(matches!(&e, HubEv::Unknown { tag, .. } if tag == "jobs"));
        assert_eq!(e.encode(), r#"{"ev":"jobs","project":"p","to":"q"}"#);
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
