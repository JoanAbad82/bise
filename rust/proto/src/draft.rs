//! Shapes with no producer yet (architect's S3a review, change A): their
//! fixtures feed the window's fake core now, but their names may still
//! move until their stream emits them, outside v1's "never rename" rule.
//! When a stream ships one, it moves to [`crate::hub`] (or stays here for
//! the core's own messages) and its fixture joins the frozen ones.
//!
//! - [`DraftHubEv`]: diffs and worktrees (S7), artifacts (S7, from
//!   art-core's list), dev servers (S7), followed jobs (S10), routing
//!   "→ project" (S2);
//! - [`DraftHubCmd`]: follow (S10);
//! - [`CoreEv`] (core -> app: the projects list, an app-side open) and
//!   [`AppCmd`] (app -> core: open, project_add): never a hub's (S3b);
//! - [`ProjectView`]: S1's `hubs/<id>/view.json` (amb-hub writes it).

use crate::rows::{Agent, Card};
use crate::{decode, parse, Pos, Project};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LineKind {
    Ctx,
    Add,
    Del,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct DiffLine {
    pub kind: LineKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub old: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub new: Option<u32>,
    pub text: String,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Hunk {
    pub header: String,
    pub lines: Vec<DiffLine>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct DiffFile {
    pub path: String,
    /// added, modified, deleted, renamed
    pub status: String,
    pub add: u32,
    pub del: u32,
    pub hunks: Vec<Hunk>,
    /// the agent's word on this file ("new: 4 workers"), from its summary
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
}

/// What a change measured, before and after (the review's result line,
/// amb-web m_8304): "worst frame, PS5 replay · forest level 40 → 15 ms".
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct DiffResult {
    pub label: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sub: Option<String>,
    pub before: f64,
    pub after: f64,
    pub unit: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub series: Option<Series>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Series {
    pub before: Vec<f64>,
    pub after: Vec<f64>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Artifact {
    pub id: String,
    pub kind: String,
    pub title: String,
    pub agent: String,
    pub version: u32,
    pub at_ms: u64,
    pub url: String,
    /// made or changed since he last looked
    pub new: bool,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Worktree {
    pub path: String,
    pub branch: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub agent: Option<String>,
    pub dirty: bool,
    pub ahead: u32,
    pub behind: u32,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct DevServer {
    pub agent: String,
    /// what it is ("dev server", "grafana (local)")
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub url: String,
    pub port: u16,
    pub cmd: String,
    pub up: bool,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum JobState {
    Running,
    Done,
    Failed,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Job {
    pub agent: String,
    pub label: String,
    pub step: u32,
    pub steps: u32,
    pub state: JobState,
}

/// Hub events whose stream hasn't shipped.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "ev", rename_all = "snake_case")]
pub enum DraftHubEv {
    Diff {
        project: Project,
        agent: String,
        base: String,
        head: String,
        files: Vec<DiffFile>,
        /// what the change measured (none: nothing measured)
        #[serde(default, skip_serializing_if = "Option::is_none")]
        result: Option<DiffResult>,
    },
    Artifacts { project: Project, items: Vec<Artifact> },
    Worktrees { project: Project, items: Vec<Worktree> },
    DevServers { project: Project, items: Vec<DevServer> },
    Jobs { project: Project, jobs: Vec<Job> },
    /// "→ telemetry": bise routes his words to a project's main; tab
    /// corrects it until `correct_until_ms` (decision B's 2 s timer)
    Route {
        project: Project,
        to: Project,
        text: String,
        correct_until_ms: u64,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        card: Option<u64>,
    },
    #[serde(skip)]
    Unknown { tag: String, raw: Value },
}

impl DraftHubEv {
    pub const TAGS: &'static [&'static str] = &["diff", "artifacts", "worktrees", "dev_servers", "jobs", "route"];

    pub fn decode(line: &str) -> Result<DraftHubEv, String> {
        decode(parse(line)?, "ev", Self::TAGS, |tag, raw| DraftHubEv::Unknown { tag, raw })
    }
}

/// Selected lines of a thread quoted in a message (❝).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Quote {
    pub agent: String,
    pub pos: Pos,
    pub text: String,
}

/// One of his messages queued for an agent until its turn ends (sb-core
/// holds it, amb-hub m_8281): an [`Agent`] row's `queued`, draft until the
/// hub's mirror sends them.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Queued {
    pub id: u64,
    pub text: String,
    pub created_ms: u64,
}

/// Hub commands whose stream hasn't shipped.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "cmd", rename_all = "snake_case")]
pub enum DraftHubCmd {
    /// tell me when it's done (decision E: a flag on the task)
    Follow { project: Project, agent: String, on: bool },
    /// a send with quoted lines (the window's ❝)
    SendQuote { project: Project, agent: String, text: String, quote: Quote },
    /// he opened the artifacts screen: their `new` clears, `artifacts`
    /// comes again (amb-web m_8346)
    ArtifactsSeen { project: Project },
    #[serde(skip)]
    Unknown { tag: String, raw: Value },
}

impl DraftHubCmd {
    pub const TAGS: &'static [&'static str] = &["follow", "send_quote", "artifacts_seen"];

    pub fn decode(line: &str) -> Result<DraftHubCmd, String> {
        decode(parse(line)?, "cmd", Self::TAGS, |tag, raw| DraftHubCmd::Unknown { tag, raw })
    }
}

/// One project in the window's sidebar.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ProjectRow {
    pub project: Project,
    pub name: String,
    pub path: String,
    /// its checkout's current branch (none: not a git repo, or detached)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub branch: Option<String>,
    /// a git repo (bise's home is not)
    pub git: bool,
    /// bise's own (the home workspace)
    pub home: bool,
    pub order: u32,
    pub agents: u32,
    pub working: u32,
    pub waits: u32,
    /// its hub runs (the sidebar's dot)
    #[serde(default)]
    pub running: bool,
    /// its folder is gone (moved or deleted)
    #[serde(default, skip_serializing_if = "crate::is_false")]
    pub missing: bool,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OpenWhat {
    Thread,
    Review,
    Artifact,
    Worktree,
}

/// A model account of his (S11's settings, amb-win m_8382).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Account {
    /// chatgpt, claude, anthropic-key, ...
    pub id: String,
    pub label: String,
    /// subscription | key
    pub kind: String,
    /// signed_in | signed_out | expired
    pub state: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub who: Option<String>,
}

/// A folder found by `found_scan` that could be a project.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Found {
    pub path: String,
    pub name: String,
    pub git: bool,
    pub last_ms: u64,
    /// already one of his projects
    pub known: bool,
}

/// What the core sends the app besides the hubs' events (S3b).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "ev", rename_all = "snake_case")]
pub enum CoreEv {
    /// every registered project (bise's first), on change
    Projects { projects: Vec<ProjectRow> },
    /// open this in the window (a capsule's or a card's ⏎)
    Open {
        project: Project,
        what: OpenWhat,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        agent: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        id: Option<String>,
    },
    /// his preferences (`bise_home::prefs`, its one owner): kept as JSON
    /// here until that module types them
    Prefs { prefs: Value },
    Accounts { items: Vec<Account> },
    /// the answer to `found_scan`
    Found { dir: String, items: Vec<Found> },
    #[serde(skip)]
    Unknown { tag: String, raw: Value },
}

impl CoreEv {
    pub const TAGS: &'static [&'static str] = &["projects", "open", "prefs", "accounts", "found"];

    pub fn decode(line: &str) -> Result<CoreEv, String> {
        decode(parse(line)?, "ev", Self::TAGS, |tag, raw| CoreEv::Unknown { tag, raw })
    }
}

/// What the app asks the core itself (never forwarded to a hub).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "cmd", rename_all = "snake_case")]
pub enum AppCmd {
    Open {
        project: Project,
        what: OpenWhat,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        agent: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        id: Option<String>,
    },
    /// add a folder to his projects (S1's registry); the add sheet's two
    /// choices: agents in worktrees, agents land their work
    ProjectAdd {
        path: String,
        #[serde(default, skip_serializing_if = "crate::is_false")]
        worktrees: bool,
        #[serde(default, skip_serializing_if = "crate::is_false")]
        land: bool,
    },
    ProjectRemove { project: Project },
    ProjectMove { project: Project, order: u32 },
    /// one preference by its dotted key (`quiet.call`)
    PrefsSet { key: String, value: Value },
    /// opens his browser for that account, then `accounts` again
    SignIn { id: String },
    KeySet { id: String, key: String },
    KeyRemove { id: String },
    /// folders that could be projects (none: his home folder, depth 2)
    FoundScan {
        #[serde(default, skip_serializing_if = "Option::is_none")]
        dir: Option<String>,
    },
    #[serde(skip)]
    Unknown { tag: String, raw: Value },
}

impl AppCmd {
    pub const TAGS: &'static [&'static str] = &[
        "open",
        "project_add",
        "project_remove",
        "project_move",
        "prefs_set",
        "sign_in",
        "key_set",
        "key_remove",
        "found_scan",
    ];

    pub fn decode(line: &str) -> Result<AppCmd, String> {
        decode(parse(line)?, "cmd", Self::TAGS, |tag, raw| AppCmd::Unknown { tag, raw })
    }
}

/// `hubs/<id>/view.json` (S1, written only by that hub): what the sidebar
/// and bise read of a project without its hub.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ProjectView {
    pub v: u32,
    pub project: Project,
    pub written_ms: u64,
    /// set at a clean stop, absent while it runs (readers tell a running
    /// hub by its pid or a ping, never by a flag here)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub stopped_ms: Option<u64>,
    pub last_activity_ms: u64,
    pub agents: Vec<Agent>,
    pub cards: Vec<Card>,
}
