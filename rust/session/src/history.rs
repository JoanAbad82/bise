//! The entries `/debug history` shows, made from a session log
//! (rust/session): pure, no screen. The full history: every entry, in
//! order, the turns and compactions as rules; a window of it
//! ([`history_range`], for `history_cache`). What the model got for a
//! request is not rebuilt here: `/debug completion` shows the body sent
//! (`reqlog`, `completion`). Every text goes through the redactor: a
//! key never reaches the screen.
//!
//! Moved from the TUI's logview (TP-N2, architect m_17272): the TUI's
//! `/log` and the hub's typed `log` read (the window's /log) build their
//! rows here, one builder, the redaction inside it.
use crate::reader::{Event, Log};
use crate::types::*;
use crate::Redactor;
use serde_json::Value;
use std::collections::HashMap;
use std::path::Path;

/// What an entry is, as its role column says it.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Role {
    /// the user's turn (a prompt or a steer)
    You,
    /// the model's text
    Assistant,
    Thinking,
    /// a tool call (its name in `Item::tool`)
    Call,
    /// a tool result
    Result { ok: bool },
    /// from or to another agent
    Message,
    /// what bise put in the context: notes, task status, hub state
    Injected,
    /// the system prompt
    System,
    /// the tools the model was offered
    Tools,
    /// a compaction's summary
    Summary,
    Error,
    /// the rest: model set, process opened, queued input...
    Event,
    /// a part of a request as the provider got it (`/debug completion`):
    /// the provider's own word (user, assistant, tool_use · bash, result)
    Sent(String),
}

impl Role {
    /// The filter key of a role (the picker's rows).
    pub fn key(&self) -> &'static str {
        match self {
            Role::You => "you",
            Role::Assistant => "assistant",
            Role::Thinking => "thinking",
            Role::Call => "call",
            Role::Result { .. } => "result",
            Role::Message => "message",
            Role::Injected => "injected",
            Role::System | Role::Tools => "system",
            Role::Summary => "summary",
            Role::Error => "error",
            Role::Event => "event",
            Role::Sent(_) => "sent",
        }
    }
}

/// The roles the filter picker lists, in its order.
pub const ROLE_KEYS: &[&str] =
    &["you", "assistant", "thinking", "call", "result", "message", "injected", "system", "summary", "error", "event"];

/// How a body draws.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Body {
    None,
    /// markdown (markdown.rs)
    Md(String),
    /// code in a box, colored by `lang` (a fence's tag: bash, ts, json, diff)
    Code { lang: &'static str, text: String },
    /// raw text in a box, as is
    Plain(String),
}

impl Body {
    pub fn text(&self) -> &str {
        match self {
            Body::None => "",
            Body::Md(t) | Body::Plain(t) | Body::Code { text: t, .. } => t,
        }
    }
}

/// One row group of the view: an entry (a header and its body), or a
/// rule between turns or where a compaction cut.
#[derive(Clone, Debug, PartialEq)]
pub struct Item {
    /// the log's seq (0 for what is not an event: system, tools)
    pub seq: u64,
    /// the event's index in the log
    pub idx: usize,
    /// its place in the whole history ([`pos_of`]): pages go by it
    pub pos: u64,
    pub turn: Option<u64>,
    /// HH:MM:SS
    pub time: String,
    pub role: Role,
    /// the tool of a call or a result
    pub tool: String,
    /// the one-line summary of the header
    pub head: String,
    pub body: Body,
    /// a rule (a turn, a compaction): its words; the rest is unused
    pub rule: Option<String>,
    /// the tokens the model saw for it, when known (usage), else an
    /// estimate (bytes / 4) shown with a `~`
    pub tokens: Option<(u64, bool)>,
    /// a faint line above the body (a result's call id, exit, time)
    pub meta: String,
}

impl Item {
    fn entry(e: &Event, idx: usize, role: Role, head: String, body: Body) -> Item {
        Item {
            seq: e.seq,
            idx,
            pos: 0,
            turn: e.turn,
            time: time_of(&e.at),
            role,
            tool: String::new(),
            head,
            body,
            rule: None,
            tokens: None,
            meta: String::new(),
        }
    }

    fn rule(e: &Event, idx: usize, words: String) -> Item {
        Item {
            seq: e.seq,
            idx,
            pos: 0,
            turn: e.turn,
            time: time_of(&e.at),
            role: Role::Event,
            tool: String::new(),
            head: String::new(),
            body: Body::None,
            rule: Some(words),
            tokens: None,
            meta: String::new(),
        }
    }

    /// The bytes of its body (the fold label, the token estimate).
    pub fn bytes(&self) -> usize {
        self.body.text().len()
    }

    /// The text a search looks in: the header and the body, lowercase.
    pub fn hay(&self) -> String {
        let mut s = String::new();
        if let Some(r) = &self.rule {
            s.push_str(r);
        }
        s.push_str(&self.tool);
        s.push(' ');
        s.push_str(&self.head);
        s.push('\n');
        s.push_str(&self.meta);
        s.push('\n');
        s.push_str(self.body.text());
        s.to_lowercase()
    }
}

fn time_of(at: &str) -> String {
    at.get(11..19).unwrap_or("").to_string()
}

/// `1234` → `1.2k`, `182000` → `182k`, `999` → `999`.
pub fn short_num(n: u64) -> String {
    if n < 1000 {
        n.to_string()
    } else if n < 10_000 {
        format!("{:.1}k", n as f64 / 1000.0)
    } else if n < 1_000_000 {
        format!("{}k", n / 1000)
    } else {
        format!("{:.1}M", n as f64 / 1_000_000.0)
    }
}

/// `2148` → `2.1 KB`.
pub fn short_bytes(n: usize) -> String {
    if n < 1024 {
        format!("{n} B")
    } else if n < 1024 * 1024 {
        format!("{:.1} KB", n as f64 / 1024.0)
    } else {
        format!("{:.1} MB", n as f64 / (1024.0 * 1024.0))
    }
}

/// A body that says only what its head already shows whole: one line of
/// text, the same words, no markdown (designer m_37475: a body appears
/// only when it adds something, more lines, markdown, a diff, code).
fn says_only(head: &str, body: &Body) -> bool {
    let text = match body {
        Body::Md(t) | Body::Plain(t) => t.trim(),
        _ => return false,
    };
    !text.contains('\n') && text == head.trim() && !text.contains(['*', '`', '_', '[', '#', '>', '|', '~'])
}

/// The first non-empty line, cut at `max` chars.
pub fn first_line(s: &str, max: usize) -> String {
    let l = s.lines().map(str::trim).find(|l| !l.is_empty()).unwrap_or("");
    if l.chars().count() > max {
        let mut t: String = l.chars().take(max.saturating_sub(1)).collect();
        t.push('…');
        t
    } else {
        l.to_string()
    }
}

/// The opening tag of an injected block (`<task_status>` → `task_status`).
fn tag_of(text: &str) -> Option<String> {
    let t = text.trim_start();
    let rest = t.strip_prefix('<')?;
    let end = rest.find(|c: char| c == '>' || c.is_whitespace())?;
    let tag = &rest[..end];
    (!tag.is_empty() && tag.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')).then(|| tag.to_string())
}

/// A user message bise wrote, not the user: a block of its own
/// (`<task_status>`, `<bise_notes>`) or its `[bise]` / `[switchboard]`
/// notes.
fn injected_head(text: &str) -> Option<String> {
    if let Some(tag) = tag_of(text) {
        if tag != "image" {
            return Some(format!("<{tag}>"));
        }
    }
    let t = text.trim_start();
    for p in ["[bise]", "[switchboard]"] {
        if t.starts_with(p) {
            return Some(first_line(t, 80));
        }
    }
    None
}

/// The text of some parts for people: images and files as a line.
fn parts_text(parts: &[Part], blobs: &Path) -> String {
    let mut o = String::new();
    for p in parts {
        match p {
            Part::Text { text } => o.push_str(&image_tags(text)),
            Part::TextBlob { blob } => match crate::blob::get(blobs, blob) {
                Ok(b) => o.push_str(&image_tags(&String::from_utf8_lossy(&b))),
                Err(e) => o.push_str(&format!("[blob {} unreadable: {e}]", short_sha(&blob.sha256))),
            },
            Part::Image { image, name, path, .. } => {
                o.push_str(&format!("[image {name}: {path}, {}, {}]", image.mime, short_bytes(image.bytes as usize)))
            }
            Part::File { file, name } => o.push_str(&format!("[file {name}: {}, {}]", file.mime, short_bytes(file.bytes as usize))),
            Part::Thinking { .. } | Part::RedactedThinking { .. } => {}
            Part::Other => o.push_str("[a part from a newer bise]"),
        }
    }
    o
}

/// The value of `name="…"` in an image tag's attributes.
fn attr<'a>(tag: &'a str, name: &str) -> Option<&'a str> {
    let k = format!("{name}=\"");
    let at = tag.find(&k)? + k.len();
    let end = tag[at..].find('"')?;
    Some(&tag[at..at + end])
}

/// The image tags of a text (`<image name=… path=… b64=…>`, what the
/// model got for a pasted image) as one line: its name, its file and
/// its size, never the base64.
pub fn image_tags(text: &str) -> String {
    if !text.contains("<image ") {
        return text.to_string();
    }
    let mut o = String::new();
    let mut rest = text;
    while let Some(at) = rest.find("<image ") {
        let Some(end) = rest[at..].find('>') else { break };
        let tag = &rest[at..at + end + 1];
        o.push_str(&rest[..at]);
        let name = attr(tag, "name").unwrap_or("image");
        let path = attr(tag, "path").unwrap_or("").replace('\n', " ");
        let size = attr(tag, "b64")
            .and_then(|f| std::fs::metadata(f).ok())
            .map(|m| format!(", {}", short_bytes(m.len() as usize * 3 / 4)))
            .unwrap_or_default();
        o.push_str(&format!("[▣ {name}: {path}{size}]"));
        rest = &rest[at + end + 1..];
    }
    o.push_str(rest);
    o
}

fn short_sha(s: &str) -> &str {
    s.get(..12).unwrap_or(s)
}

fn thinking_of(parts: &[Part]) -> String {
    let mut o = String::new();
    for p in parts {
        match p {
            Part::Thinking { text, .. } => {
                if !o.is_empty() {
                    o.push_str("\n\n");
                }
                o.push_str(text);
            }
            Part::RedactedThinking { .. } => o.push_str("[redacted thinking]"),
            _ => {}
        }
    }
    o
}

fn json_obj(s: &str) -> Option<serde_json::Map<String, Value>> {
    match serde_json::from_str::<Value>(s) {
        Ok(Value::Object(m)) => Some(m),
        _ => None,
    }
}

fn str_field<'a>(m: &'a serde_json::Map<String, Value>, k: &str) -> Option<&'a str> {
    m.get(k).and_then(Value::as_str)
}

/// A JSON text pretty-printed; None when it is not JSON.
pub fn pretty_json(s: &str) -> Option<String> {
    let t = s.trim();
    if !(t.starts_with('{') || t.starts_with('[')) {
        return None;
    }
    let v: Value = serde_json::from_str(t).ok()?;
    serde_json::to_string_pretty(&v).ok()
}

/// `old` → `new` of one file as a diff (`-` and `+` lines).
fn diff_text(path: &str, old: &str, new: &str) -> String {
    let mut o = format!("--- {path}\n+++ {path}\n");
    for l in old.lines() {
        o.push_str(&format!("-{l}\n"));
    }
    for l in new.lines() {
        o.push_str(&format!("+{l}\n"));
    }
    o
}

/// A call's header and body, by its tool: the code it runs, the diff
/// it makes, the file it writes, or its arguments as JSON.
pub fn call_view(name: &str, args: &str) -> (String, Body) {
    let obj = json_obj(args);
    let field = |k: &str| obj.as_ref().and_then(|m| str_field(m, k)).map(str::to_string);
    match name {
        "bash" => {
            let cmd = field("arg").or_else(|| field("command")).unwrap_or_else(|| args.to_string());
            let desc = field("description").unwrap_or_default();
            let head = if desc.is_empty() { first_line(&cmd, 90) } else { desc };
            (head, Body::Code { lang: "bash", text: cmd })
        }
        "run_typescript" => {
            let code = field("code").unwrap_or_else(|| args.to_string());
            let head = field("description").unwrap_or_else(|| first_line(&code, 90));
            (head, Body::Code { lang: "ts", text: code })
        }
        "edit" => {
            let path = field("file_path").unwrap_or_default();
            let (old, new) = (field("old_string").unwrap_or_default(), field("new_string").unwrap_or_default());
            let all = obj.as_ref().and_then(|m| m.get("replace_all")).and_then(Value::as_bool).unwrap_or(false);
            let head = format!(
                "{path}  +{} −{}{}",
                new.lines().count(),
                old.lines().count(),
                if all { "  (all)" } else { "" }
            );
            (head, Body::Code { lang: "diff", text: diff_text(&path, &old, &new) })
        }
        "write_file" => {
            let path = field("file_path").unwrap_or_default();
            let content = field("content").unwrap_or_default();
            let head = format!("{path}  {} lines", content.lines().count());
            let lang = path.rsplit('.').next().and_then(lang_tag).unwrap_or("");
            let body = if lang.is_empty() { Body::Plain(content) } else { Body::Code { lang, text: content } };
            (head, body)
        }
        "apply_patch" => {
            let patch = field("patch").or_else(|| field("input")).unwrap_or_else(|| args.to_string());
            (first_line(&patch.replace("*** Begin Patch", ""), 90), Body::Code { lang: "diff", text: patch })
        }
        _ => {
            let head = obj
                .as_ref()
                .and_then(|m| {
                    ["description", "query", "path", "file_path", "arg", "name"].iter().find_map(|k| str_field(m, k))
                })
                .map(|s| first_line(s, 90))
                .unwrap_or_else(|| first_line(args, 90));
            match pretty_json(args) {
                Some(p) => (head, Body::Code { lang: "json", text: p }),
                None => (head, Body::Plain(args.to_string())),
            }
        }
    }
}

/// A file extension's fence tag, for the languages syntax.rs colors.
fn lang_tag(ext: &str) -> Option<&'static str> {
    Some(match ext {
        "ts" | "tsx" | "js" | "jsx" | "mjs" => "ts",
        "rs" => "rust",
        "py" => "python",
        "go" => "go",
        "sh" | "bash" | "zsh" => "bash",
        "json" | "jsonl" => "json",
        "toml" => "toml",
        "yaml" | "yml" => "yaml",
        "css" => "css",
        "html" | "xml" | "svg" => "html",
        "md" => return None,
        _ => return None,
    })
}

/// A result's text without the harness's `tool bash ok:` lead.
fn result_words(text: &str) -> &str {
    let t = text.trim_start();
    if let Some(rest) = t.strip_prefix("tool ") {
        for end in [" ok:", " failed:", " error:"] {
            if let Some(at) = rest.find(end) {
                if !rest[..at].contains(char::is_whitespace) {
                    return rest[at + end.len()..].trim_start();
                }
            }
        }
    }
    t
}

/// A tool result's body: JSON pretty, else the raw text.
fn result_body(text: String) -> Body {
    match pretty_json(&text) {
        Some(p) => Body::Code { lang: "json", text: p },
        None => Body::Plain(text),
    }
}

/// An enum of the log as it writes it (`hub_state`).
trait Named {
    fn name(&self) -> String;
}

fn name_of<T: Named>(v: &T) -> String {
    v.name()
}

macro_rules! names {
    ($($t:ty),*) => {$(
        impl Named for $t {
            fn name(&self) -> String {
                serde_json::to_value(self).ok().and_then(|v| v.as_str().map(String::from)).unwrap_or_default()
            }
        }
    )*};
}
names!(Cause, Outcome, Delivery, InjectedKind, Relation, DiscardCause, By, During, QueuedKind, DropReason, CloseReason);

/// What a session's items are made of: the log, its blobs, the
/// redactor and the agent's name (the assistant's role word).
pub struct Source<'a> {
    pub log: &'a Log,
    pub blobs: &'a Path,
    pub redact: &'a Redactor,
}

impl Source<'_> {
    fn red(&self, s: String) -> String {
        self.redact.text(&s)
    }

    fn red_body(&self, b: Body) -> Body {
        match b {
            Body::None => Body::None,
            Body::Md(t) => Body::Md(self.red(t)),
            Body::Plain(t) => Body::Plain(self.red(t)),
            Body::Code { lang, text } => Body::Code { lang, text: self.red(text) },
        }
    }

    /// The tool of every call id of the log.
    fn call_tools(&self) -> HashMap<String, String> {
        let mut m = HashMap::new();
        for e in &self.log.events {
            if let Some(Payload::AssistantMessage(a)) = &e.payload {
                for c in &a.calls {
                    m.insert(c.id.clone(), c.name.clone());
                }
            }
        }
        m
    }

    /// The entries of one event (an assistant message: its thinking,
    /// its text, each call), none for an event only the UI needs.
    fn entries(&self, idx: usize, tools: &HashMap<String, String>, out: &mut Vec<Item>) {
        let e = &self.log.events[idx];
        let Some(p) = e.payload.as_ref() else {
            out.push(Item::entry(
                e,
                idx,
                Role::Event,
                format!("{} v{} (from a newer bise)", e.typ, e.v),
                Body::Code { lang: "json", text: pretty_json(&e.raw).unwrap_or_else(|| e.raw.clone()) },
            ));
            return;
        };
        let mut push = |role: Role, head: String, body: Body| {
            let head = self.red(head);
            let body = self.red_body(body);
            let body = if says_only(&head, &body) { Body::None } else { body };
            out.push(Item::entry(e, idx, role, head, body));
        };
        match p {
            Payload::SessionStart(s) => {
                let who = s.agent.as_ref().map(|a| format!(" · {} of {}", a.name, a.hub)).unwrap_or_default();
                push(Role::Event, format!("session {}{who}", s.session), Body::Plain(format!("cwd {}", s.cwd)));
            }
            Payload::ProcessOpened(p) => push(
                Role::Event,
                format!("opened by {} (pid {}{})", p.writer, p.pid, if p.resume { ", resumed" } else { "" }),
                Body::None,
            ),
            Payload::SessionClosed { reason } => push(Role::Event, format!("session closed: {}", name_of(reason)), Body::None),
            Payload::TitleSet { title, .. } => push(Role::Event, format!("title: {title}"), Body::None),
            Payload::ContextSet(c) => {
                if let Some(s) = &c.system {
                    let text = self.text_of(s);
                    push(Role::System, format!("system prompt · {} lines", text.lines().count()), Body::Md(text));
                }
                if let Some(t) = &c.tools {
                    let (head, body) = tools_view(t);
                    push(Role::Tools, head, body);
                }
            }
            Payload::LimitsSet(l) => push(
                Role::Event,
                format!(
                    "limits: compact at {} · select {} · max nulls {}",
                    l.compact_threshold.map(short_num).unwrap_or_else(|| "-".into()),
                    l.select_budget.map(short_num).unwrap_or_else(|| "-".into()),
                    l.max_nulls.map(|n| n.to_string()).unwrap_or_else(|| "-".into())
                ),
                Body::None,
            ),
            Payload::ModelSet(m) => push(
                Role::Event,
                format!(
                    "model {}{}{}",
                    m.model.model,
                    m.model.effort.as_ref().map(|e| format!(" ({e})")).unwrap_or_default(),
                    m.context_window.map(|w| format!(" · window {}", short_num(w))).unwrap_or_default()
                ),
                Body::None,
            ),
            Payload::UserMessage(m) => {
                let text = parts_text(&m.content, self.blobs);
                let steer = if matches!(m.delivery, Delivery::Steer) { " (steer)" } else { "" };
                match injected_head(&text) {
                    Some(h) => push(Role::Injected, format!("{h}{steer}"), Body::Md(text)),
                    None => push(Role::You, format!("{}{steer}", first_line(&text, 90)), Body::Md(text)),
                }
            }
            Payload::ContextInjected(m) => {
                let text = parts_text(&m.content, self.blobs);
                let head = injected_head(&text).unwrap_or_else(|| first_line(&text, 80));
                push(Role::Injected, format!("{} · {head}", name_of(&m.kind)), Body::Md(text));
            }
            Payload::AgentMessage(m) => {
                let text = parts_text(&m.content, self.blobs);
                let reply = if m.expects_reply { " · expects a reply" } else { "" };
                push(
                    Role::Message,
                    format!("from {} ({}) {}{reply} · {}", bise_proto::thread::lines::shown_name(&m.from), name_of(&m.relation), m.hub_msg, first_line(&text, 60)),
                    Body::Md(text),
                );
            }
            Payload::AssistantMessage(a) => {
                let think = thinking_of(&a.parts);
                if !think.is_empty() {
                    push(Role::Thinking, first_line(&think, 90), Body::Md(think));
                }
                let text = parts_text(&a.parts, self.blobs);
                if !text.trim().is_empty() {
                    push(Role::Assistant, first_line(&text, 90), Body::Md(text));
                }
                for c in &a.calls {
                    let (head, body) = call_view(&c.name, &c.args);
                    let head = self.red(head);
                    let body = self.red_body(body);
                    let mut it = Item::entry(e, idx, Role::Call, head, body);
                    it.tool = c.name.clone();
                    out.push(it);
                }
            }
            Payload::ToolResult(r) => {
                let text = parts_text(&r.content, self.blobs);
                let tool = tools.get(&r.call).cloned().unwrap_or_default();
                // the call id, the exit and the time: a faint line over the
                // body (grep finds it); the header is the output's words
                let mut meta = format!("{} {}", r.call, if r.ok { "ok" } else { "failed" });
                if let Some(x) = r.exit {
                    meta.push_str(&format!(" · exit {x}"));
                }
                if let Some(ms) = r.ms {
                    meta.push_str(&format!(" · {:.1} s", ms as f64 / 1000.0));
                }
                let head = self.red(first_line(result_words(&text), 100));
                let body = self.red_body(result_body(text));
                let mut it = Item::entry(e, idx, Role::Result { ok: r.ok }, head, body);
                it.tool = tool;
                it.meta = meta;
                out.push(it);
            }
            Payload::RequestFailed(r) => push(
                Role::Error,
                format!("request {} failed (attempt {}): {}", r.req, r.attempt, first_line(&r.error.message, 80)),
                Body::Plain(r.error.message.clone()),
            ),
            Payload::ResponseDiscarded(d) => push(
                Role::Error,
                format!("response {} discarded: {}", d.req, name_of(&d.cause)),
                d.partial.as_ref().map(|p| Body::Md(parts_text(p, self.blobs))).unwrap_or(Body::None),
            ),
            Payload::Interrupted(i) => {
                push(Role::Error, format!("interrupted by {} during {}", name_of(&i.by), name_of(&i.during)), Body::None)
            }
            Payload::TurnEnded(t) if !matches!(t.outcome, Outcome::Done) => push(
                Role::Error,
                format!(
                    "turn ended: {}{}",
                    name_of(&t.outcome),
                    t.error.as_ref().map(|e| format!(" · {}", first_line(&e.message, 80))).unwrap_or_default()
                ),
                Body::None,
            ),
            Payload::InputQueued(q) => {
                let text = parts_text(&q.content, self.blobs);
                push(Role::Event, format!("queued {}: {}", name_of(&q.kind), first_line(&text, 70)), Body::Md(text));
            }
            Payload::InputDropped(d) => {
                push(Role::Event, format!("queued #{} dropped: {}", d.queued, name_of(&d.reason)), Body::None)
            }
            Payload::CompactionFailed(c) => push(
                Role::Error,
                format!("compaction {} failed (attempt {}): {}", c.id, c.attempt, first_line(&c.error.message, 80)),
                Body::None,
            ),
            Payload::CompactionDone(c) => {
                let text = self.legacy_summary(idx).unwrap_or_else(|| parts_text(&c.summary, self.blobs));
                push(
                    Role::Summary,
                    format!("compaction {} · replaces #{}..#{} · keeps {}", c.id, c.replaces.from, c.replaces.to, c.kept.len()),
                    Body::Md(text),
                );
            }
            _ => {}
        }
    }

    /// A compaction written before the summary opened the replacement:
    /// its compaction_done holds only the preamble line ("The earlier
    /// conversation was compacted. ..."), and the real summary came
    /// after the kept messages as a context_injected of kind summary.
    /// That summary's text, to show on the compaction's row.
    fn legacy_summary(&self, idx: usize) -> Option<String> {
        let Some(Payload::CompactionDone(c)) = self.log.events[idx].payload.as_ref() else { return None };
        if !parts_text(&c.summary, self.blobs).starts_with("The earlier conversation was compacted.") {
            return None;
        }
        self.log.events[idx + 1..].iter().find_map(|e| match e.payload.as_ref()? {
            Payload::ContextInjected(m) if name_of(&m.kind) == "summary" => Some(Some(parts_text(&m.content, self.blobs))),
            Payload::UserMessage(_) | Payload::AgentMessage(_) | Payload::ContextInjected(_) => None,
            // the replacement ends at the first event that is not one of
            // its messages
            _ => Some(None),
        })?
    }

    fn text_of(&self, t: &Text) -> String {
        match t {
            Text::Inline { text } => text.clone(),
            Text::Blob { blob } => match crate::blob::get(self.blobs, blob) {
                Ok(b) => String::from_utf8_lossy(&b).into_owned(),
                Err(e) => format!("[blob {} unreadable: {e}]", short_sha(&blob.sha256)),
            },
        }
    }
}

/// The tools offered, as a header (their names) and a JSON body.
fn tools_view(t: &[ToolDef]) -> (String, Body) {
    let names: Vec<&str> = t.iter().map(|d| d.name.as_str()).collect();
    let head = format!("{} tools · {}", t.len(), first_line(&names.join(", "), 80));
    let body = serde_json::to_string_pretty(t).unwrap_or_default();
    (head, Body::Code { lang: "json", text: body })
}

/// The full history: every entry in order, a rule at each turn's
/// start (its usage on it) and where each compaction cut.
pub fn history(src: &Source) -> Vec<Item> {
    history_range(src, 0, src.log.events.len())
}

/// The rows of the events `from..to` only, as [`history`] has them
/// (its rows of those events, in order): a page of a long log costs
/// its own events, not the whole log's (`history_cache`). The maps a
/// row reads across events (a call's tool, a turn's usage) still see
/// the whole log.
pub fn history_range(src: &Source, from: usize, to: usize) -> Vec<Item> {
    let log = src.log;
    let to = to.min(log.events.len());
    let from = from.min(to);
    let tools = src.call_tools();
    // per turn: the context size of its last request and its output
    let mut turn_use: HashMap<u64, (u64, u64)> = HashMap::new();
    for e in &log.events {
        if let (Some(Payload::Usage(u)), Some(t)) = (&e.payload, e.turn) {
            let w = turn_use.entry(t).or_default();
            w.0 = u.input + u.cache_read.unwrap_or(0);
            w.1 += u.output;
        }
    }
    // the context size before `from` (a compaction's rule says it)
    let mut last_in: Option<u64> = log.events[..from].iter().rev().find_map(|e| match &e.payload {
        Some(Payload::Usage(u)) => Some(u.input + u.cache_read.unwrap_or(0)),
        _ => None,
    });
    let mut out = Vec::new();
    for (i, e) in log.events.iter().enumerate().take(to).skip(from) {
        match &e.payload {
            Some(Payload::TurnStarted { cause }) => {
                let t = e.turn.unwrap_or(0);
                let mut w = format!("turn {t} · {} · {}", time_of(&e.at).get(..5).unwrap_or(""), name_of(cause));
                if let Some((i_, o)) = turn_use.get(&t) {
                    w.push_str(&format!(" · {} in · {} out", short_num(*i_), short_num(*o)));
                }
                out.push(Item::rule(e, i, w));
            }
            Some(Payload::Usage(u)) => last_in = Some(u.input + u.cache_read.unwrap_or(0)),
            Some(Payload::CompactionDone(c)) => {
                let after = c.tokens_after.or_else(|| next_input(log, i));
                let w = match (last_in, after) {
                    (Some(b), Some(a)) => format!("compacted · {} → {} tokens", short_num(b), short_num(a)),
                    (Some(b), None) => format!("compacted · {} tokens before", short_num(b)),
                    _ => "compacted".to_string(),
                };
                out.push(Item::rule(e, i, w));
                src.entries(i, &tools, &mut out);
            }
            _ => src.entries(i, &tools, &mut out),
        }
    }
    // every text field through the redactor, not only head and body
    // (architect m_17272): the TUI's /log and the hub's typed read both
    // get their rows here, so neither can skip it
    for it in &mut out {
        it.tool = src.red(std::mem::take(&mut it.tool));
        it.meta = src.red(std::mem::take(&mut it.meta));
        it.rule = it.rule.take().map(|r| src.red(r));
    }
    set_pos(&mut out);
    out
}

/// Each row's stable place: its event's index, then its rank among
/// that event's rows ([`Item::pos`]).
fn set_pos(rows: &mut [Item]) {
    let mut last = (usize::MAX, 0u64);
    for it in rows {
        last = if last.0 == it.idx { (it.idx, last.1 + 1) } else { (it.idx, 0) };
        it.pos = pos_of(it.idx, last.1);
    }
}

/// A row's place in the whole history: the same whichever window built
/// it, and it never moves as the log grows (append-only). Pages go by it.
pub fn pos_of(idx: usize, rank: u64) -> u64 {
    ((idx as u64) << 16) | rank.min(0xffff)
}

/// The context size of the first request after event `i`.
fn next_input(log: &Log, i: usize) -> Option<u64> {
    log.events[i + 1..].iter().find_map(|e| match &e.payload {
        Some(Payload::Usage(u)) => Some(u.input + u.cache_read.unwrap_or(0)),
        _ => None,
    })
}

/// `2026-10-02T14:02:31.123Z` → ms since the epoch (UTC).
pub fn iso_ms(at: &str) -> Option<u64> {
    let n = |r: std::ops::Range<usize>| at.get(r).and_then(|s| s.parse::<i64>().ok());
    let (y, mo, d) = (n(0..4)?, n(5..7)?, n(8..10)?);
    let (h, mi, s) = (n(11..13)?, n(14..16)?, n(17..19)?);
    let ms = at.get(19..).and_then(|r| r.strip_prefix('.')).and_then(|r| r.get(..3)).and_then(|r| r.parse::<i64>().ok()).unwrap_or(0);
    // days from the civil date (Howard Hinnant's algorithm)
    let y2 = if mo <= 2 { y - 1 } else { y };
    let era = y2.div_euclid(400);
    let yoe = y2 - era * 400;
    let mp = (mo + 9) % 12;
    let doy = (153 * mp + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    let days = era * 146_097 + doe - 719_468;
    let t = ((days * 24 + h) * 60 + mi) * 60 + s;
    u64::try_from(t * 1000 + ms).ok()
}
