//! Shapes with no producer yet (architect's S3a review, change A): their
//! fixtures feed the window's fake core now, but their names may still
//! move until their stream emits them, outside v1's "never rename" rule.
//! When a stream ships one, it moves to [`crate::hub`] (or stays here for
//! the core's own messages) and its fixture joins the frozen ones.
//!
//! - [`DraftHubCmd`]: a send with quoted lines (S7's artifacts, diffs,
//!   worktrees and dev servers, S2's routing "→ project" and S10's
//!   followed jobs shipped: hub.rs);
//! - [`CoreEv`] (core -> app: the projects list, an app-side open) and
//!   [`AppCmd`] (app -> core: open, project_add): never a hub's (S3b);
//! - [`ProjectView`]: S1's `hubs/<id>/view.json` (amb-hub writes it).

use crate::rows::{Agent, Card};
use crate::{decode, parse, Pos, Project};
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Selected lines of a thread quoted in a message (❝).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Quote {
    pub agent: String,
    pub pos: Pos,
    pub text: String,
}

/// One of his messages queued for an agent until its turn ends (sb-core
/// holds it, amb-hub m_8281): an [`Agent`] row's `queued`, draft until the
/// hub's mirror sends them.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Queued {
    pub id: u64,
    pub text: String,
    pub created_ms: u64,
}

/// Hub commands whose stream hasn't shipped.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
#[serde(tag = "cmd", rename_all = "snake_case")]
pub enum DraftHubCmd {
    /// a send with quoted lines (the window's ❝)
    SendQuote { project: Project, agent: String, text: String, quote: Quote },
    #[serde(skip)]
    Unknown { tag: String, raw: Value },
}

impl DraftHubCmd {
    pub const TAGS: &'static [&'static str] = &["send_quote"];

    pub fn decode(line: &str) -> Result<DraftHubCmd, String> {
        decode(parse(line)?, "cmd", Self::TAGS, |tag, raw| DraftHubCmd::Unknown { tag, raw })
    }
}

/// One project in the window's sidebar.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
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
    /// his open cards (`waits` of them): a held hub's own `cards`, else
    /// its `view.json`'s, so bise's "waiting for you" lists and answers
    /// the cards of a project it doesn't hold (lead m_8769)
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub cards: Vec<Card>,
    /// its GitHub remote's web page (`https://github.com/acme/engine`):
    /// the review opens `<web>/commit/<sha>`; absent: no GitHub remote
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub web: Option<String>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
#[serde(rename_all = "snake_case")]
pub enum OpenWhat {
    Thread,
    Review,
    Artifact,
    Worktree,
}

/// A model account of his (S11's settings, amb-win m_8382).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
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
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Found {
    pub path: String,
    pub name: String,
    pub git: bool,
    pub last_ms: u64,
    /// already one of his projects
    pub known: bool,
}

/// An agent plugin of his (P.1, the TUI's `/plugins`): bend_plugins'
/// resolution of a workspace, user and built-in plugins included.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Plugin {
    pub name: String,
    /// loaded | disabled | shadowed | invalid
    pub state: String,
    /// built-in | user | workspace
    pub scope: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub what: Option<String>,
    /// its remote MCP servers that log in (none: nothing to log in to)
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub logins: Vec<PluginLogin>,
}

/// A plugin's remote MCP server that logs in through his browser.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct PluginLogin {
    /// what `plugin_login` takes (its id, or plugin/server)
    pub name: String,
    pub host: String,
    /// needs | in | out | pending (its browser is open)
    pub state: String,
    /// its tools, once a session connected it
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tools: Option<u32>,
}

/// A step of computer use's setup (P.2, the TUI's `/computer-use`
/// screen as data: rust/tui/src/computer_use.rs rows).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct CuRow {
    /// browser | extension | live_test | accessibility | screen_recording
    pub id: String,
    pub label: String,
    /// done | waits | checking | failed | not_yet
    pub state: String,
    pub detail: String,
    /// the lines under it while it waits on him
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub help: Vec<String>,
    /// what its button does ("open chrome://extensions"); none: no button
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub action: Option<String>,
    /// what `computer_use {act: fix, fix}` takes for that button
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub fix: Option<String>,
    /// under "for apps" (the helper app's permissions)
    #[serde(default, skip_serializing_if = "crate::is_false")]
    pub apps: bool,
}

/// One project's part of `away_summary` (only a project where something
/// happened while he was away).
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct AwayProject {
    pub project: Project,
    pub done: u32,
    pub questions: u32,
    pub failed: u32,
}

/// What the core sends the app besides the hubs' events (S3b).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
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
    /// the answer to `away_back` (S9, amb-mac m_9038): what happened while
    /// he was away, since `since_ms`: agents that turned done or failed,
    /// his cards (questions and approvals) that came; `projects`: each
    /// project where one of those happened, in his projects' order
    AwaySummary { since_ms: u64, done: u32, questions: u32, failed: u32, projects: Vec<AwayProject> },
    /// his agent plugins for `project`'s workspace (none: bise's home),
    /// the answer to `plugins` and to each change; a change applies to
    /// the sessions that start after it (the TUI's `/reload`)
    Plugins {
        #[serde(default, skip_serializing_if = "Option::is_none")]
        project: Option<Project>,
        items: Vec<Plugin>,
    },
    /// computer use (P.2): on (the built-in `computer` plugin), its setup's
    /// steps while the window's page checks them (none until a check
    /// came), ready (browser, extension and live test done), `said`: what
    /// went wrong with a fix, `flash`: what a fix just did
    ComputerUse {
        on: bool,
        ready: bool,
        rows: Vec<CuRow>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        said: Option<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        flash: Option<String>,
    },
    #[serde(skip)]
    Unknown { tag: String, raw: Value },
}

impl CoreEv {
    pub const TAGS: &'static [&'static str] = &["projects", "open", "prefs", "accounts", "found", "away_summary", "plugins", "computer_use"];

    pub fn decode(line: &str) -> Result<CoreEv, String> {
        decode(parse(line)?, "ev", Self::TAGS, |tag, raw| CoreEv::Unknown { tag, raw })
    }
}

/// What the app asks the core itself (never forwarded to a hub).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
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
    /// add a folder to his projects (S1's registry); `land`: the add
    /// sheet's 'agents land their work', the repo's flow mode (true trunk,
    /// false pr, absent: devflow decides; architect m_9130)
    ProjectAdd {
        path: String,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        land: Option<bool>,
    },
    ProjectRemove { project: Project },
    ProjectMove { project: Project, order: u32 },
    ProjectRename { project: Project, name: String },
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
    /// he's back at his Mac after `away_ms` (the app's read): the core
    /// answers `away_summary`
    AwayBack { away_ms: u64 },
    /// the plugins of `project`'s workspace (none: bise's home): `plugins`
    Plugins {
        #[serde(default, skip_serializing_if = "Option::is_none")]
        project: Option<Project>,
    },
    /// turn a plugin on or off (plugins.json, bend_plugins' one writer)
    PluginSet {
        #[serde(default, skip_serializing_if = "Option::is_none")]
        project: Option<Project>,
        name: String,
        on: bool,
    },
    /// log in to a plugin's remote MCP server: opens his browser (his
    /// click only, never a test), `plugins` again at its end
    PluginLogin {
        #[serde(default, skip_serializing_if = "Option::is_none")]
        project: Option<Project>,
        name: String,
    },
    PluginLogout {
        #[serde(default, skip_serializing_if = "Option::is_none")]
        project: Option<Project>,
        name: String,
    },
    /// computer use (P.2): `act` on | off | uninstall | check (its page is
    /// open: the setup check runs, once a second, until leave or 2 min
    /// without a check) | leave | fix (`fix`: a row's fix, his click only)
    ComputerUse {
        act: String,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        fix: Option<String>,
    },
    /// the projects the window shows now (replaces the set; on load and on
    /// each route change): the core holds their hubs and sends their
    /// `projects`/`agents`/`cards` only after the first one (core/hubs.rs)
    Shown { projects: Vec<Project> },
    /// fn held (the helper's talk): the core opens the mic and starts a
    /// talk to main; `page`: a note talk on that bise page instead, its
    /// words to the page, never to main (docs/ambient-pages.md §4.1)
    TalkStart {
        #[serde(default, skip_serializing_if = "Option::is_none")]
        page: Option<TalkPage>,
    },
    /// fn released: the talk's words go
    TalkEnd,
    /// the talk is dropped, nothing sent
    TalkCancel,
    #[serde(skip)]
    Unknown { tag: String, raw: Value },
}

/// The bise page a note talk is about (`talk_start {page}`).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct TalkPage {
    pub id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

impl AppCmd {
    pub const TAGS: &'static [&'static str] = &[
        "open",
        "project_add",
        "project_remove",
        "project_move",
        "project_rename",
        "prefs_set",
        "sign_in",
        "key_set",
        "key_remove",
        "found_scan",
        "away_back",
        "plugins",
        "plugin_set",
        "plugin_login",
        "plugin_logout",
        "computer_use",
        "shown",
        "talk_start",
        "talk_end",
        "talk_cancel",
    ];

    pub fn decode(line: &str) -> Result<AppCmd, String> {
        decode(parse(line)?, "cmd", Self::TAGS, |tag, raw| AppCmd::Unknown { tag, raw })
    }
}

/// `hubs/<id>/view.json` (S1, written only by that hub): what the sidebar
/// and bise read of a project without its hub.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
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
