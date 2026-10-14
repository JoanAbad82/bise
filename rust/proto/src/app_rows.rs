//! The rows the desktop core's own lines carry ([`crate::core_ev::CoreEv`],
//! [`crate::app_cmd::AppCmd`]): the sidebar's projects, accounts, plugins,
//! computer use, roles, the composer's pick lists and ⌘K's index.

use crate::rows::{Agent, Artifact, Card, CardBatch, CardPage, Opt, ReportKind, ScheduledTask};
use crate::{Pos, Project};
use serde::{Deserialize, Serialize};

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
    /// its hub couldn't start, in plain words (the cause and its log);
    /// absent: it runs, or nothing tried yet. The core keeps retrying,
    /// backing off; the row says it at once, never a silent loop
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub down: Option<String>,
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
    /// L5: the catalog provider it sets up (a model row's `provider_id`)
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub provider: String,
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

/// An agent that uses computer use now (S29, `computer_live`): one entry
/// of the machine's state.json (`bise_computer_use::state::agents`),
/// idle agents absent.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct ComputerAgent {
    /// `<hub>.<dir>` (docs/issues/18): what `computer {act, key}` takes
    pub key: String,
    /// its project; none: its hub is none of his registered projects (an
    /// agent of another bise: shown, never acted on)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub project: Option<Project>,
    pub agent: String,
    /// the app or browser it drives ("Chrome", "Figma")
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub driving: Option<String>,
    /// where in it (a site, a window title)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub place: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub since_ms: Option<u64>,
    /// he took over (`take`): it waits until `hand_back`
    #[serde(default, skip_serializing_if = "crate::is_false")]
    pub paused: bool,
    /// stopped (`stop`, the TUI's /stop): it asks before it starts again
    #[serde(default, skip_serializing_if = "crate::is_false")]
    pub stopped: bool,
    /// its line under its head, from `bise_computer_use::live::line` (the
    /// TUI's status row draws the same): how to colour it, the mark, the
    /// words (`driving Chrome · amazon.fr`). No age in them: the window
    /// adds ` · 2 min` from `since_ms` to a driving line, and builds no
    /// other word.
    pub kind: LiveKind,
    pub mark: String,
    pub words: String,
}

/// How a computer-use line is coloured (`bise_computer_use::live::Kind`).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub enum LiveKind {
    /// it drives an app now (the working colour)
    Driving,
    /// he took the wheel: it waits on him (accent)
    Paused,
    /// stopped until he writes to it (dim)
    Stopped,
}

/// A still of what an agent drives (`computer_peek`): inline, never
/// stored (no file, no image store, no log).
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct PeekShot {
    /// base64
    pub data: String,
    pub mime: String,
    pub width: u32,
    pub height: u32,
    pub at_ms: u64,
}

/// How far voice mode got saying an agent's message (`voice_mode`'s `lit`,
/// amb-web m_16805): the window inks `text[..said]` of that thread entry
/// and leaves the rest faint ('you cut in' when `cut`).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct VoiceLit {
    /// the agent's thread entry being said (or last said)
    pub pos: Pos,
    /// UTF-16 code units of the entry's text said so far, as JS slices
    /// it: `text.slice(0, said)` (the end of the last said word; 0: none
    /// yet)
    pub said: u32,
    /// he cut in: the rest stays unsaid
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub cut: bool,
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

/// A role's model (V17, config.toml's `[roles]`, the TUI's `/models`
/// screen as data): `kind` chat or voice; `source`: `config` (set in
/// config.toml), `env` (an env var sets it), `default` (unset: bise picks,
/// or `follows` that role's model).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct RoleRow {
    pub role: String,
    pub name: String,
    pub about: String,
    pub kind: String,
    pub model: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub effort: Option<String>,
    pub source: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub follows: Option<String>,
}

/// How a slash command runs (C, architect m_10724): `hub` (his typed
/// line goes to the hub's own parser, HubCmd slash), `core` (a window
/// core command), `window` (the window's own screen or state: the window
/// alone knows whether it is built).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
#[serde(rename_all = "snake_case")]
pub enum Runs {
    Hub,
    Core,
    Window,
}

/// One value a command's argument can take, as its popup shows it.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct PickChoice {
    pub value: String,
    pub desc: String,
}

/// What completes one argument of a command (the catalog's commands.rs
/// `Arg`): fixed words, a list the window has (live agents, archived ones,
/// open cards, branches, models, efforts, plugins), or free text (`text`
/// required, `note` optional).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum PickArg {
    Words { words: Vec<PickChoice> },
    Agent,
    Archived,
    Card,
    Branch,
    Model,
    Effort,
    Plugin,
    Text,
    Note,
}

/// A slash command, as the TUI's `/` popup lists it (commands.rs
/// COMMANDS, the catalog: same name, desc, order, args). `runnable`: for `hub` and
/// `core`, a typed path exists today; for `window`, always false here
/// (the window owns its screens' readiness and combines the two).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct PickCommand {
    pub name: String,
    pub desc: String,
    pub args: Vec<PickArg>,
    pub runs: Runs,
    pub runnable: bool,
}

/// A skill of a workspace, as the TUI's `$` popup lists it.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct PickSkill {
    pub name: String,
    pub desc: String,
}

/// A file or folder for an `@` query, ranked as the TUI ranks it
/// (files.rs): `path` relative to the workspace (or as typed for
/// `@../`, `@~/`, `@/`), `protected`: macOS asks once it is entered.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct PickFile {
    pub path: String,
    pub dir: bool,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub protected: bool,
}

/// The folder an `@folder/` query browses, its own row (⏎ inserts a
/// reference to the folder); `locked`: no access to it.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct PickFolder {
    pub path: String,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub locked: bool,
}

pub(crate) fn is_zero(n: &u32) -> bool {
    *n == 0
}

/// A project of ⌘K's index (CoreEv `index`): what its `view.json` says,
/// as of `written_ms` (none: no view yet), and whether its hub runs now
/// (`up`: a stopped hub fires no timers, so the window never shows a
/// past next run as coming).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct IndexRow {
    pub project: Project,
    pub up: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub written_ms: Option<u64>,
    pub agents: Vec<Agent>,
    pub artifacts: Vec<Artifact>,
    #[serde(default, skip_serializing_if = "is_zero")]
    pub artifacts_total: u32,
    /// its live scheduled tasks as of `written_ms` (a stopped hub runs
    /// none: a `next_ms` in the past is not coming)
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub scheduled: Vec<ScheduledTask>,
}

/// An agent's row in the capsule's `state` (main aside): `status` the
/// row's word (idle, working, waiting, done, failed, blocked), `since_ms`
/// when the core saw it change, `waits`: his open cards from it.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct StateAgent {
    pub name: String,
    pub status: String,
    pub title: String,
    pub purpose: String,
    pub since_ms: u64,
    pub waits: u32,
    pub followed: bool,
    pub archived: bool,
    pub note: String,
    pub report: String,
    pub working: bool,
    pub turn_ms: Option<u64>,
}

/// One of his cards in the capsule's `state`: its words without the
/// options it lists, its options, `urgent` (it asks even on a call),
/// `label` (main's own question), the page block it is about, the batch
/// of drafts it stands for.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct StateCard {
    pub id: u64,
    pub kind: String,
    pub agent: String,
    pub text: String,
    pub options: Vec<Opt>,
    pub urgent: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub page: Option<CardPage>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub batch: Option<CardBatch>,
}

/// The page a note talk is about, as the capsule's `phase` says it.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct PhasePage {
    pub id: String,
    pub title: String,
}

/// One of an agent's last actions in its preview: `kind` tool, land,
/// message, report or page, one line.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct PreviewAction {
    pub at_ms: u64,
    pub kind: String,
    pub text: String,
}

/// A card of the agent's that waits on him, in its preview.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct PreviewWait {
    pub card_id: u64,
    pub question: String,
}

/// An agent's last report in its preview.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct PreviewReport {
    pub kind: ReportKind,
    pub text: String,
    pub at_ms: u64,
}
