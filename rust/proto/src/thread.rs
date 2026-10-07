//! An agent's thread as entries: his messages, its replies, messages from
//! other agents, its cards, reports and pages, and its tool calls folded
//! (consecutive calls are one `tools` entry at the first call's pos). The
//! hub folds its transcript lines (`<pos, ms, line>`) with [`fold`]; a
//! live line refolds the newest lines, and an entry whose JSON changed is
//! sent again at the same pos.
//!
//! Here: the entry types and [`page`]. [`lines`] reads each transcript
//! line kind into a typed record, the one parser the TUI calls too;
//! [`words`] makes the words both sides show; [`fold`] turns the records
//! into entries.

use crate::context::FnContext;
use crate::rows::{Opt, ReportKind};
use crate::{is_false, Pos};
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
#[serde(rename_all = "snake_case")]
pub enum EntryKind {
    /// his message
    You,
    /// the agent's own words
    Agent,
    /// a message from another agent (`from`)
    FromAgent,
    /// its tool calls in a row
    Tools,
    Card,
    Page,
    Report,
    /// its turn was stopped (an interrupt: sb-core's `stopped` line, written
    /// in the same step as the interrupt)
    Stopped,
    /// a message this agent sent another one (`to`; `asks`: it waits
    /// for the reply, its question), sb-core's `sent` line
    ToAgent,
    /// the model's reasoning with no words after it (a tool-call-only
    /// turn; `thinking`: how long, the text), folded as "thought for
    /// 3.2s". A reply's own thinking rides on its `agent` entry.
    Thinking,
    /// a compaction started (`≡ compacting`)
    Compacting,
    /// a compaction's summary (the text), folded
    Compacted,
    /// a line of the runtime or the hub for him (`notice`: info, warn or
    /// err, the words): a failed turn and why, a retry, a warning
    Notice,
    /// his message didn't reach its agent (`not_delivered`: to whom, his
    /// text, never lost)
    NotDelivered,
    /// a kind this reader doesn't know (a newer hub)
    #[serde(other)]
    Unknown,
}

/// A `thinking` entry: how long the model thought (ms, 0 unknown: a
/// replay) and what.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Thinking {
    pub ms: u64,
    pub text: String,
}

/// How a notice reads: info (dim), warn (▲, what to do), err (✗).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
#[serde(rename_all = "snake_case")]
pub enum NoticeLevel {
    Info,
    Warn,
    Err,
    #[serde(other)]
    Unknown,
}

/// A `notice` entry: its level and its words ([`words::notice`]).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Notice {
    pub level: NoticeLevel,
    pub text: String,
}

/// A `not_delivered` entry: the agent his message didn't reach, and his
/// text (BISE-86: send again or drop it).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct NotDelivered {
    pub to: String,
    pub text: String,
}

/// What a tool call did, for the counted summary.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
#[serde(rename_all = "snake_case")]
pub enum ToolKind {
    Read,
    Edit,
    Run,
    Search,
    Other,
}

impl ToolKind {
    pub fn of(name: &str) -> ToolKind {
        match name {
            "read_file" | "read" | "view" | "read_image" => ToolKind::Read,
            "edit" | "write_file" | "write" | "apply_patch" | "multi_edit" => ToolKind::Edit,
            "bash" | "run_typescript" | "shell" => ToolKind::Run,
            "grep" | "rg" | "glob" | "search" | "find" | "web_search" | "search_tool_functions" => ToolKind::Search,
            _ => ToolKind::Other,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct ToolItem {
    pub pos: Pos,
    pub at_ms: u64,
    /// its intent ("running the tests"), else `name: first line of args`
    pub text: String,
    pub kind: ToolKind,
    /// a `sb land`
    #[serde(default, skip_serializing_if = "is_false")]
    pub land: bool,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Tools {
    pub count: u32,
    /// counted words: "read 6 files, ran 4 commands"
    pub summary: String,
    pub items: Vec<ToolItem>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct EntryCard {
    pub id: u64,
    pub question: String,
    pub options: Vec<Opt>,
    pub answered: bool,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct PageRef {
    pub id: String,
    pub title: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub v: Option<u32>,
    pub url: String,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct ReportRef {
    pub kind: ReportKind,
}

/// One entry of a thread.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Entry {
    /// its first line's transcript position (`<agent>#<pos>`)
    pub pos: Pos,
    pub at_ms: u64,
    pub kind: EntryKind,
    /// markdown
    pub text: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub from: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tools: Option<Tools>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub card: Option<EntryCard>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub page: Option<PageRef>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub report: Option<ReportRef>,
    /// his message's fn context (S9): what was on his screen when he
    /// spoke, from the `sb context : <json>` line right after his 'you'
    /// line (the window draws the shot and the app on his message)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub context: Option<FnContext>,
    /// a `to_agent` entry: who it went to
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub to: Option<String>,
    /// a `to_agent` entry: it waits for the reply (its question)
    #[serde(default, skip_serializing_if = "is_false")]
    pub asks: bool,
    /// a `to_agent` entry: its message id (`m_12` is 12; the card main
    /// opens for it says `for` the same)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub msg: Option<u64>,
    /// a `thinking` entry's, or an `agent` reply's own: the reasoning
    /// before it ("thought for 3.2s", folded)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub thinking: Option<Thinking>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub notice: Option<Notice>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub not_delivered: Option<NotDelivered>,
}

impl Entry {
    fn new(pos: Pos, at_ms: u64, kind: EntryKind, text: String) -> Entry {
        Entry {
            pos,
            at_ms,
            kind,
            text,
            from: None,
            tools: None,
            card: None,
            page: None,
            report: None,
            context: None,
            to: None,
            asks: false,
            msg: None,
            thinking: None,
            notice: None,
            not_delivered: None,
        }
    }

    /// Law (architect m_10476): an entry of a kind with a payload carries
    /// exactly that payload, and no other kind's: `pr` never comes with
    /// `pr: None`. The kinds without a payload carry none, but for an
    /// `agent` reply's own thinking (one line, one entry: pos is the key).
    pub fn payload_matches_kind(&self) -> bool {
        let has = [
            (EntryKind::Tools, self.tools.is_some()),
            (EntryKind::Card, self.card.is_some()),
            (EntryKind::Page, self.page.is_some()),
            (EntryKind::Report, self.report.is_some()),
            (EntryKind::Notice, self.notice.is_some()),
            (EntryKind::NotDelivered, self.not_delivered.is_some()),
        ];
        let thinking = match self.kind {
            EntryKind::Thinking => self.thinking.is_some(),
            EntryKind::Agent => true,
            _ => self.thinking.is_none(),
        };
        thinking && has.iter().all(|(k, set)| *set == (self.kind == *k))
    }
}

/// One transcript line: its position, its time (ms, 0 unknown), the line.
pub type Line = (Pos, u64, String);

/// What the fold needs from the hub: the open cards (an entry's card says
/// answered when it is not open), the pages (a publish's title, version
/// and url).
pub struct Ctx<'a> {
    pub open_cards: &'a [u64],
    pub page: &'a dyn Fn(&str) -> Option<PageRef>,
    /// a provider's name for people, by its id or its key variable (a
    /// missing key's notice; the catalog's `provider_name`)
    pub provider: &'a dyn Fn(&str, &str) -> String,
}

/// A page of a thread: the newest `limit` entries of `lines`. `more`: the
/// lines don't start the transcript (the oldest entry, maybe cut, is
/// dropped) or entries were left out; `before`: the oldest entry's pos
/// when there is more (ask `page {before}` for the ones before it).
pub fn page(lines: &[Line], ctx: &Ctx, limit: usize) -> (Vec<Entry>, Option<Pos>, bool) {
    let older = lines.first().is_some_and(|l| l.0 > 1);
    let mut entries = fold(lines, ctx);
    if older && entries.len() > 1 {
        entries.remove(0);
    }
    let more = older || entries.len() > limit;
    let entries = entries.split_off(entries.len().saturating_sub(limit));
    let before = entries.first().map(|e| e.pos).filter(|_| more);
    (entries, before, more)
}

pub mod fold;
pub mod lines;
pub mod words;
pub use fold::fold;
