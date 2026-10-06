//! An agent's thread as entries: his messages, its replies, messages from
//! other agents, its cards, reports and pages, and its tool calls folded
//! (consecutive calls are one `tools` entry at the first call's pos). The
//! hub folds its transcript lines (`<pos, ms, line>`) with [`fold`]; a
//! live line refolds the newest lines, and an entry whose JSON changed is
//! sent again at the same pos.

use crate::context::FnContext;
use crate::rows::{question, Opt, ReportKind};
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
}

impl Entry {
    fn new(pos: Pos, at_ms: u64, kind: EntryKind, text: String) -> Entry {
        Entry { pos, at_ms, kind, text, from: None, tools: None, card: None, page: None, report: None, context: None }
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
}

// ---- the wire's escapes (temporary copies, see the crate header) ----

/// `\n` escapes back to newlines (the TUI's `markdown::unescape_md`).
pub fn unescape(s: &str) -> String {
    let mut out = String::new();
    let mut chars = s.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\\' && chars.peek() == Some(&'n') {
            chars.next();
            out.push('\n');
        } else {
            out.push(c);
        }
    }
    out
}

const THINK_START: &str = "<think>";
const THINK_END: &str = "</think>";

/// The model's thinking out of an assistant text: (thinking, visible), or
/// None when there is none (the TUI's `wire::split_thinking`).
pub fn split_thinking(s: &str) -> Option<(String, String)> {
    let mut visible = String::new();
    let mut think: Vec<&str> = Vec::new();
    let mut rest = s;
    while let Some(start) = rest.find(THINK_START) {
        let after = &rest[start + THINK_START.len()..];
        let Some(end) = after.find(THINK_END) else { break };
        visible.push_str(&rest[..start]);
        think.push(&after[..end]);
        rest = &after[end + THINK_END.len()..];
        if let Some(r) = rest.strip_prefix("\\n") {
            rest = r;
        }
    }
    if think.is_empty() {
        return None;
    }
    visible.push_str(rest);
    Some((think.join("\\n"), visible))
}

// ---- reading a bash call ----

/// `sb report <kind> "<text>"` in a bash call: its kind and text.
pub fn report_in(args: &str) -> Option<(ReportKind, String)> {
    let at = args.find("sb report ")?;
    let rest = &args[at + "sb report ".len()..];
    let (kind, rest) = rest.trim_start().split_once(' ')?;
    let kind = match kind {
        "progress" => ReportKind::Progress,
        "done" => ReportKind::Done,
        "failed" => ReportKind::Failed,
        "blocked" => ReportKind::Blocked,
        _ => return None,
    };
    Some((kind, quoted(rest.trim_start())))
}

fn quoted(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        Some(q @ ('"' | '\'')) => {
            let mut out = String::new();
            let mut esc = false;
            for c in chars {
                match c {
                    _ if esc => {
                        out.push(c);
                        esc = false;
                    }
                    '\\' if q == '"' => esc = true,
                    c if c == q => break,
                    c => out.push(c),
                }
            }
            out
        }
        _ => s.split(" --").next().unwrap_or("").trim().to_string(),
    }
}

/// `sb page publish <file> [--id <id>]` in a bash call: the page id (the
/// option, else the file's stem).
pub fn publish_in(args: &str) -> Option<String> {
    let at = args.find("sb page publish ")?;
    let words: Vec<&str> = args[at + "sb page publish ".len()..].split_whitespace().collect();
    let unq = |w: &str| w.trim_matches(|c| c == '"' || c == '\'').to_string();
    if let Some(i) = words.iter().position(|w| *w == "--id") {
        return words.get(i + 1).map(|w| unq(w));
    }
    let file = unq(words.first()?);
    let name = file.rsplit('/').next().unwrap_or(&file);
    Some(name.split('.').next().unwrap_or(name).to_string())
}

/// The first non-empty line, clipped to `max` characters (with `…`).
pub fn one_line(s: &str, max: usize) -> String {
    let l = s.lines().map(str::trim).find(|l| !l.is_empty()).unwrap_or("");
    if l.chars().count() <= max {
        return l.to_string();
    }
    let mut out: String = l.chars().take(max.saturating_sub(1)).collect();
    out.push('…');
    out
}

/// The tools entry's counted words: "read 6 files, ran 4 commands".
pub fn summary(items: &[ToolItem]) -> String {
    let n = |k: ToolKind| items.iter().filter(|i| i.kind == k).count();
    let s = |n: usize, one: &str, many: &str| if n == 1 { one.to_string() } else { format!("{n} {many}") };
    let mut parts = Vec::new();
    let (r, e, x, q, o) = (n(ToolKind::Read), n(ToolKind::Edit), n(ToolKind::Run), n(ToolKind::Search), n(ToolKind::Other));
    if r > 0 {
        parts.push(format!("read {}", s(r, "1 file", "files")));
    }
    if e > 0 {
        parts.push(format!("edited {}", s(e, "1 file", "files")));
    }
    if x > 0 {
        parts.push(format!("ran {}", s(x, "1 command", "commands")));
    }
    if q > 0 {
        parts.push(format!("searched {}", s(q, "once", "times")));
    }
    if o > 0 {
        parts.push(s(o, "1 other step", "other steps"));
    }
    parts.join(", ")
}

struct Fold<'a> {
    out: Vec<Entry>,
    /// the entry a raw line continues (a message on several lines)
    cont: Option<usize>,
    /// tool id -> (entry, item)
    tools: Vec<(u32, usize, usize)>,
    /// the 'you' entry the previous line pushed: the only one a context
    /// line may attach to
    you: Option<usize>,
    ctx: &'a Ctx<'a>,
}

impl Fold<'_> {
    fn push(&mut self, e: Entry) -> usize {
        self.out.push(e);
        self.out.len() - 1
    }

    fn tool(&mut self, pos: Pos, ms: u64, id: u32, name: &str, args: &str) {
        let args = unescape(args);
        if name == "bash" {
            if let Some((kind, text)) = report_in(&args) {
                let mut e = Entry::new(pos, ms, EntryKind::Report, text);
                e.report = Some(ReportRef { kind });
                self.push(e);
                return;
            }
            if let Some(id) = publish_in(&args) {
                let page = (self.ctx.page)(&id).unwrap_or(PageRef { id: id.clone(), title: id.replace('-', " "), v: None, url: String::new() });
                let v = page.v.map(|v| format!(" v{v}")).unwrap_or_default();
                let mut e = Entry::new(pos, ms, EntryKind::Page, format!("{}{v}", page.title));
                e.page = Some(page);
                self.push(e);
                return;
            }
        }
        let e = match self.out.last() {
            Some(e) if e.kind == EntryKind::Tools => self.out.len() - 1,
            _ => {
                let mut e = Entry::new(pos, ms, EntryKind::Tools, String::new());
                e.tools = Some(Tools { count: 0, summary: String::new(), items: Vec::new() });
                self.push(e)
            }
        };
        let item = ToolItem {
            pos,
            at_ms: ms,
            text: format!("{name}: {}", one_line(&args.replace("\\N", "\n"), 100)),
            kind: ToolKind::of(name),
            land: name == "bash" && args.contains("sb land"),
        };
        let items = &mut self.out[e].tools.as_mut().expect("a tools entry").items;
        items.push(item);
        let i = items.len() - 1;
        self.tools.push((id, e, i));
        self.sum(e);
    }

    fn intent(&mut self, id: u32, text: &str) {
        let Some(&(_, e, i)) = self.tools.iter().rev().find(|(t, _, _)| *t == id) else { return };
        if let Some(t) = self.out[e].tools.as_mut() {
            t.items[i].text = one_line(&unescape(text), 120);
        }
        self.sum(e);
    }

    fn sum(&mut self, e: usize) {
        let entry = &mut self.out[e];
        let Some(t) = entry.tools.as_mut() else { return };
        t.count = t.items.len() as u32;
        t.summary = summary(&t.items);
        entry.text = t.summary.clone();
    }

    fn line(&mut self, pos: Pos, ms: u64, line: &str) {
        let line = line.strip_prefix("history ").unwrap_or(line);
        let you = self.you.take();
        if line.is_empty() || line == "--- idle" || line.starts_with("  ev: ") {
            return;
        }
        if let Some(o) = line.strip_prefix("  obs: ") {
            self.cont = None;
            let Some(t) = o.strip_prefix("assistant: ") else { return };
            let vis = split_thinking(t).map(|(_, v)| v).unwrap_or_else(|| t.to_string());
            let text = unescape(&vis).trim().to_string();
            if !text.is_empty() {
                self.push(Entry::new(pos, ms, EntryKind::Agent, text));
            }
            return;
        }
        if let Some(r) = line.strip_prefix("tool #") {
            self.cont = None;
            let (id, rest) = r.split_once(' ').unwrap_or((r, ""));
            let (name, args) = rest.split_once(" : ").unwrap_or((rest, ""));
            if let Ok(id) = id.parse() {
                self.tool(pos, ms, id, name.trim(), args);
            }
            return;
        }
        if let Some(r) = line.strip_prefix("tool_intent #") {
            self.cont = None;
            let (id, text) = r.split_once(" : ").unwrap_or((r, ""));
            if let Ok(id) = id.trim().parse() {
                self.intent(id, text);
            }
            return;
        }
        if line.starts_with("tool_") || line.starts_with("subtool ") || line.starts_with("core rejected: ") {
            self.cont = None;
            return;
        }
        if let Some(rest) = line.strip_prefix("sb ") {
            self.cont = None;
            let (kind, raw) = rest.split_once(" : ").unwrap_or((rest, ""));
            let text = unescape(raw);
            match kind {
                "you" => {
                    let i = self.push(Entry::new(pos, ms, EntryKind::You, text));
                    (self.cont, self.you) = (Some(i), Some(i));
                }
                // his fn context: on the 'you' line right before it, else
                // dropped (a stray one never lands on another entry)
                "context" => {
                    if let (Some(i), Ok(c)) = (you, serde_json::from_str::<FnContext>(raw)) {
                        self.out[i].context = Some(c);
                    }
                }
                "msg-in" => {
                    let (head, body) = text.split_once(" : ").unwrap_or(("", text.as_str()));
                    let from = head.split(' ').next().unwrap_or("").trim_start_matches('@').to_string();
                    let mut e = Entry::new(pos, ms, EntryKind::FromAgent, body.to_string());
                    e.from = Some(from);
                    self.cont = Some(self.push(e));
                }
                // an interrupt (sb-core writes it in the interrupt's step)
                "stopped" => {
                    self.push(Entry::new(pos, ms, EntryKind::Stopped, text));
                }
                "msg-you" => {
                    let (_, body) = text.split_once(" : ").unwrap_or(("", text.as_str()));
                    self.cont = Some(self.push(Entry::new(pos, ms, EntryKind::Agent, body.to_string())));
                }
                // `#3 question @docs : text`; a gate's confirm is the tool row's
                "card" => {
                    let (head, body) = text.split_once(" : ").unwrap_or((text.as_str(), ""));
                    let mut w = head.split_whitespace();
                    let id = w.next().and_then(|i| i.trim_start_matches('#').parse::<u64>().ok());
                    let kind = w.next().unwrap_or("question");
                    if let (Some(id), false) = (id, kind == "confirm") {
                        let (q, options) = question(body);
                        let card = EntryCard { id, question: q.clone(), options, answered: !self.ctx.open_cards.contains(&id) };
                        let mut e = Entry::new(pos, ms, EntryKind::Card, q);
                        e.card = Some(card);
                        self.cont = Some(self.push(e));
                    }
                }
                _ => {}
            }
            return;
        }
        // a message's next line
        if let Some(i) = self.cont {
            let e = &mut self.out[i];
            e.text = format!("{}\n{line}", e.text);
            if let Some(c) = e.card.as_mut() {
                let (q, options) = question(&format!("{}\n{line}", c.question));
                c.question = q.clone();
                c.options.extend(options);
                e.text = q;
            }
        }
    }
}

/// An agent's transcript lines as entries, oldest first.
pub fn fold(lines: &[Line], ctx: &Ctx) -> Vec<Entry> {
    let mut f = Fold { out: Vec::new(), cont: None, tools: Vec::new(), you: None, ctx };
    for (pos, ms, l) in lines {
        f.line(*pos, *ms, l);
    }
    f.out
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

#[cfg(test)]
mod tests {
    use super::*;

    fn lines() -> Vec<Line> {
        let l = |pos: u64, line: &str| (pos, 1_000 + pos, line.to_string());
        vec![
            l(1, "sb you : make it fast"),
            l(2, "  obs: turn_started"),
            l(3, "  obs: assistant: <think>hmm</think>on it"),
            l(4, "tool #1 bash : cargo test -q"),
            l(5, "tool_intent #1 : running the tests"),
            l(6, "tool_result #1 ok : 3 failed"),
            l(7, "tool #2 read_file : {\"path\":\"a.rs\"}"),
            l(8, "tool #3 bash : sb land \"fast\""),
            l(9, "tool_intent #3 : landing the fix"),
            l(10, "sb msg-in : ambient-lead m_3 : nice"),
            l(11, "second line"),
            l(12, "tool #4 bash : sb report done \"the e2e takes 40 s\""),
            l(13, "sb card : #9 question @perf : which bench?\\n1. cold\\n2. warm"),
            l(14, "tool #5 bash : sb page publish $TMPDIR/n.html --id perf-notes"),
            l(15, "  obs: turn_done: completed"),
        ]
    }

    fn ctx_with<'a>(open: &'a [u64], page: &'a dyn Fn(&str) -> Option<PageRef>) -> Ctx<'a> {
        Ctx { open_cards: open, page }
    }

    #[test]
    fn a_thread_folds_into_entries() {
        let page = |id: &str| (id == "perf-notes").then(|| PageRef { id: id.into(), title: "Perf notes".into(), v: Some(2), url: "http://p/perf-notes".into() });
        let e = fold(&lines(), &ctx_with(&[9], &page));
        let kinds: Vec<EntryKind> = e.iter().map(|e| e.kind).collect();
        use EntryKind::*;
        assert_eq!(kinds, [You, Agent, Tools, FromAgent, Report, Card, Page]);
        assert_eq!((e[0].pos, e[0].at_ms, e[0].text.as_str()), (1, 1001, "make it fast"));
        assert_eq!(e[1].text, "on it", "no thinking");
        let t = e[2].tools.as_ref().unwrap();
        assert_eq!((e[2].pos, t.count, t.items[0].text.as_str(), t.items[2].land), (4, 3, "running the tests", true));
        assert_eq!(t.summary, "read 1 file, ran 2 commands");
        assert_eq!(e[2].text, t.summary);
        assert_eq!((e[3].text.as_str(), e[3].from.as_deref()), ("nice\nsecond line", Some("ambient-lead")));
        assert_eq!(e[4].report, Some(ReportRef { kind: ReportKind::Done }));
        let c = e[5].card.as_ref().unwrap();
        assert_eq!((c.id, c.question.as_str(), c.options.len(), c.answered), (9, "which bench?", 2, false));
        assert_eq!(e[6].page.as_ref().unwrap().v, Some(2));
        assert_eq!(e[6].text, "Perf notes v2");
        // closed card: answered
        assert!(fold(&lines(), &ctx_with(&[], &page))[5].card.as_ref().unwrap().answered);
    }

    /// An interrupt's 'stopped' line (sb-core, architect m_9650 D) is an
    /// entry of its own at its position, and ends the message before it.
    #[test]
    fn a_stopped_line_is_a_stopped_entry() {
        let page = |_: &str| None;
        let ls = vec![
            (1, 1001, "sb you : go".to_string()),
            (2, 1002, "  obs: assistant: working on".to_string()),
            (3, 1003, "sb stopped : stopped".to_string()),
            (4, 1004, "a line after".to_string()),
        ];
        let e = fold(&ls, &ctx_with(&[], &page));
        let kinds: Vec<EntryKind> = e.iter().map(|e| e.kind).collect();
        assert_eq!(kinds, [EntryKind::You, EntryKind::Agent, EntryKind::Stopped]);
        assert_eq!((e[2].pos, e[2].text.as_str()), (3, "stopped"));
        assert_eq!(e[1].text, "working on", "the line after the stop doesn't join the agent's message");
    }

    /// Law (architect m_9048): a context line attaches only to the 'you'
    /// line right before it; a stray one (after anything else, or a second
    /// one) is dropped, never attached elsewhere.
    #[test]
    fn a_context_line_belongs_to_the_you_line_right_before_it() {
        let none = |_: &str| None;
        let ctx = ctx_with(&[], &none);
        let l = |pos: u64, line: &str| (pos, pos, line.to_string());
        let lines = vec![
            l(1, r#"sb you : why is this slow?"#),
            l(2, r#"sb context : {"app":"Safari","url":"https://grafana.acme.test/d/p99"}"#),
            l(3, r#"sb context : {"app":"Mail"}"#),
            l(4, "  obs: assistant: looking"),
            l(5, r#"sb context : {"app":"Notes"}"#),
            l(6, "sb you : and this?"),
            l(7, "  obs: turn_started"),
            l(8, r#"sb context : {"app":"Code"}"#),
            l(9, "sb you : third"),
            l(10, "sb context : not json"),
        ];
        let e = fold(&lines, &ctx);
        assert_eq!(e.len(), 4);
        assert_eq!(e[0].context.as_ref().and_then(|c| c.url.as_deref()), Some("https://grafana.acme.test/d/p99"));
        assert_eq!(e[0].text, "why is this slow?");
        assert!(e[1..].iter().all(|e| e.context.is_none()), "{e:?}");
        assert_eq!(e[2].text, "and this?");
    }

    #[test]
    fn a_page_keeps_the_newest_and_says_what_is_before() {
        let none = |_: &str| None;
        let ctx = ctx_with(&[], &none);
        let (e, before, more) = page(&lines(), &ctx, 60);
        assert_eq!((e.len(), before, more), (7, None, false));
        let (e, before, more) = page(&lines(), &ctx, 2);
        assert_eq!((e.len(), before, more), (2, Some(13), true));
        // a page that doesn't start the thread: its first entry may be cut
        let (e, before, more) = page(&lines()[3..10], &ctx, 60);
        assert_eq!(e[0].kind, EntryKind::FromAgent);
        assert_eq!((before, more), (Some(10), true));
    }

    #[test]
    fn bash_calls_read_as_reports_and_publishes() {
        assert_eq!(report_in(r#"cd x && sb report done "landed \"a\"" --decision y"#), Some((ReportKind::Done, "landed \"a\"".into())));
        assert_eq!(report_in("sb report progress 'half'"), Some((ReportKind::Progress, "half".into())));
        assert_eq!(report_in("sb report nope x"), None);
        assert_eq!(publish_in("sb page publish ./weekly.html"), Some("weekly".into()));
        assert_eq!(summary(&[]), "");
        assert_eq!(one_line("  \nabcdef", 4), "abc…");
    }
}
