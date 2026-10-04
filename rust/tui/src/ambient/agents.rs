//! Round 10's agents view (ambient-lead m_7026, identity10 #data): the
//! rows of the list, an agent's preview, its history folded into
//! entries. Pure functions over the hub's snapshot and an agent's feed
//! lines (`<pos, ms, line>`, the transcript's and the hub's live `line`
//! events); the core keeps the state and does the I/O.

use serde_json::{json, Value};

/// One feed line: its position in the agent's transcript, its time (ms
/// since the epoch, 0 unknown), the line.
pub type Raw = (usize, u64, String);

/// Open cards not found in the feed sit after every line (their pos):
/// `CARD_POS + id`, stable, so an answer replaces the same entry.
pub const CARD_POS: usize = 1_000_000_000;

/// The hub's status word as the list shows it, and whether it is
/// archived (an archived row keeps the status it had: done).
pub fn status(hub: &str) -> (&'static str, bool) {
    match hub {
        "starting" | "working" => ("working", false),
        "waiting" => ("waiting", false),
        "blocked" => ("blocked", false),
        "failed" => ("failed", false),
        "done" | "stopped" => ("done", false),
        "archived" => ("done", true),
        _ => ("idle", false),
    }
}

/// The first line of a text, clipped.
pub fn one_line(s: &str, max: usize) -> String {
    let l = s.lines().map(str::trim).find(|l| !l.is_empty()).unwrap_or("");
    crate::render::truncate_chars(l, max)
}

/// A row's title line: what the agent says it does now (its note), else
/// its last report, else its objective (the TUI's title).
pub fn title(a: &Value) -> String {
    let s = |k: &str| a.get(k).and_then(Value::as_str).unwrap_or("").trim().to_string();
    let t = [s("note"), s("report"), s("objective")].into_iter().find(|t| !t.is_empty()).unwrap_or_default();
    one_line(&t, 120)
}

/// `sb report <kind> "<text>"` in a bash call's args: (kind, text).
pub fn report_in(args: &str) -> Option<(String, String)> {
    let at = args.find("sb report ")?;
    let rest = &args[at + "sb report ".len()..];
    let (kind, rest) = rest.trim_start().split_once(' ')?;
    if !matches!(kind, "progress" | "done" | "failed" | "blocked") {
        return None;
    }
    Some((kind.to_string(), quoted(rest.trim_start())))
}

/// The first argument: a quoted string's inside (its escapes read), or
/// the words up to the next option.
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

/// `sb page publish <file> [--id <id>]` in a bash call's args: the page
/// id (the option, else the file's stem).
pub fn publish_in(args: &str) -> Option<String> {
    let at = args.find("sb page publish ")?;
    let rest = &args[at + "sb page publish ".len()..];
    let words: Vec<&str> = rest.split_whitespace().collect();
    if let Some(i) = words.iter().position(|w| *w == "--id") {
        return words.get(i + 1).map(|w| w.trim_matches(|c| c == '"' || c == '\'').to_string());
    }
    let file = words.first()?.trim_matches(|c| c == '"' || c == '\'');
    let stem = std::path::Path::new(file).file_stem()?.to_string_lossy().to_string();
    Some(stem)
}

/// A page as an entry or a preview shows it, from the hub's pages.
pub fn page_ref(id: &str, pages: &[Value]) -> Value {
    let p = pages.iter().find(|p| p.get("id").and_then(Value::as_str) == Some(id));
    let s = |k: &str| p.and_then(|p| p.get(k)).and_then(Value::as_str).unwrap_or("").to_string();
    let title = Some(s("title")).filter(|t| !t.is_empty()).unwrap_or_else(|| id.replace('-', " "));
    let v = p.and_then(|p| p.get("version")).and_then(Value::as_u64);
    json!({"id": id, "title": title, "v": v, "url": s("url")})
}

/// A card as an entry shows it: the question without its options, the
/// options, answered when it is not open any more.
pub fn card_ref(id: u64, kind: &str, agent: &str, text: &str, open: bool) -> Value {
    let options = crate::sb::ambient_options(kind, agent, text);
    let (body, listed) = crate::sb::split_choices(text);
    let question = if !listed.is_empty() && listed.iter().eq(options.iter().map(|(_, l)| l)) { body } else { text.to_string() };
    let options: Vec<Value> = options.into_iter().map(|(n, label)| json!({"n": n, "label": label})).collect();
    json!({"id": id, "question": question.trim(), "options": options, "answered": !open})
}

/// Where the fold is: the entry a raw line continues (a message on
/// several lines), the tool calls of the open `tools` entry.
struct Fold<'a> {
    out: Vec<Value>,
    cont: Option<usize>,
    /// tool id → (entry index, item index), for its intent
    tools: Vec<(u32, usize, usize)>,
    open_cards: &'a [u64],
    pages: &'a [Value],
}

impl Fold<'_> {
    fn push(&mut self, pos: usize, ms: u64, kind: &str, text: String) -> usize {
        self.out.push(json!({"pos": pos, "at_ms": ms, "kind": kind, "text": text}));
        self.out.len() - 1
    }

    /// The open `tools` entry, or a new one at this line.
    fn tools_entry(&mut self, pos: usize, ms: u64) -> usize {
        match self.out.last() {
            Some(e) if e["kind"] == "tools" => self.out.len() - 1,
            _ => {
                let i = self.push(pos, ms, "tools", String::new());
                self.out[i]["tools"] = json!({"count": 0, "summary": "", "items": []});
                i
            }
        }
    }

    fn tool(&mut self, pos: usize, ms: u64, id: u32, name: &str, args: &str) {
        let args = crate::markdown::unescape_md(args);
        if name == "bash" {
            if let Some((kind, text)) = report_in(&args) {
                let i = self.push(pos, ms, "report", text);
                self.out[i]["report"] = json!({"kind": kind});
                return;
            }
            if let Some(id) = publish_in(&args) {
                let page = page_ref(&id, self.pages);
                let v = page["v"].as_u64().map(|v| format!(" v{v}")).unwrap_or_default();
                let i = self.push(pos, ms, "page", format!("{}{v}", page["title"].as_str().unwrap_or("")));
                self.out[i]["page"] = page;
                return;
            }
        }
        let e = self.tools_entry(pos, ms);
        let text = format!("{name}: {}", one_line(&args.replace("\\N", "\n"), 100));
        let land = name == "bash" && args.contains("sb land");
        let tools = &mut self.out[e]["tools"];
        let items = tools["items"].as_array_mut().expect("items");
        let mut item = json!({"pos": pos, "at_ms": ms, "text": text});
        if land {
            item["land"] = json!(true);
        }
        items.push(item);
        let n = items.len();
        self.tools.push((id, e, n - 1));
        self.sum(e);
    }

    fn intent(&mut self, id: u32, text: &str) {
        let Some(&(_, e, i)) = self.tools.iter().rev().find(|(t, _, _)| *t == id) else { return };
        self.out[e]["tools"]["items"][i]["text"] = json!(one_line(&crate::markdown::unescape_md(text), 120));
        self.sum(e);
    }

    /// A tools entry's count and summary (its last step), its text too.
    fn sum(&mut self, e: usize) {
        let t = &mut self.out[e];
        let n = t["tools"]["items"].as_array().map_or(0, Vec::len);
        let last = t["tools"]["items"][n.saturating_sub(1)]["text"].as_str().unwrap_or("").to_string();
        t["tools"]["count"] = json!(n);
        t["tools"]["summary"] = json!(last);
        t["text"] = json!(if n == 1 { last } else { format!("{n} steps · {last}") });
    }

    fn line(&mut self, pos: usize, ms: u64, line: &str) {
        let line = line.strip_prefix("history ").unwrap_or(line);
        if line.is_empty() || line == "--- idle" || line.starts_with("  ev: ") {
            return;
        }
        if let Some(o) = line.strip_prefix("  obs: ") {
            self.cont = None;
            let Some(t) = o.strip_prefix("assistant: ") else { return };
            let vis = crate::wire::split_thinking(t).map(|(_, v)| v).unwrap_or_else(|| t.to_string());
            let text = crate::markdown::unescape_md(&vis).trim().to_string();
            if !text.is_empty() {
                self.cont = None;
                self.push(pos, ms, "agent", text);
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
            let text = crate::markdown::unescape_md(raw);
            match kind {
                "you" => self.cont = Some(self.push(pos, ms, "you", text)),
                "msg-in" => {
                    let (head, body) = text.split_once(" : ").unwrap_or(("", text.as_str()));
                    let from = head.split(' ').next().unwrap_or("").trim_start_matches('@').to_string();
                    let i = self.push(pos, ms, "from-agent", body.to_string());
                    self.out[i]["from"] = json!(from);
                    self.cont = Some(i);
                }
                "msg-you" => {
                    let (_, body) = text.split_once(" : ").unwrap_or(("", text.as_str()));
                    self.cont = Some(self.push(pos, ms, "agent", body.to_string()));
                }
                // `#3 question @docs : text`
                "card" => {
                    let (head, body) = text.split_once(" : ").unwrap_or((text.as_str(), ""));
                    let mut w = head.split_whitespace();
                    let id = w.next().and_then(|i| i.trim_start_matches('#').parse::<u64>().ok());
                    let kind = w.next().unwrap_or("question");
                    let agent = w.next().unwrap_or("").trim_start_matches('@');
                    if let (Some(id), false) = (id, kind == "confirm") {
                        let open = self.open_cards.contains(&id);
                        let card = card_ref(id, kind, agent, body, open);
                        let i = self.push(pos, ms, "card", card["question"].as_str().unwrap_or("").to_string());
                        self.out[i]["card"] = card;
                        self.cont = Some(i);
                    }
                }
                _ => {}
            }
            return;
        }
        // a message's next line
        if let Some(i) = self.cont {
            let t = format!("{}\n{line}", self.out[i]["text"].as_str().unwrap_or(""));
            self.out[i]["text"] = json!(t);
        }
    }
}

/// An agent's feed lines as the panel's entries, oldest first: his
/// messages, its replies, messages from agents, its cards, its reports
/// and pages, and its tool calls folded (consecutive calls are one
/// `tools` entry at the first one's pos).
pub fn fold(lines: &[Raw], open_cards: &[u64], pages: &[Value]) -> Vec<Value> {
    let mut f = Fold { out: Vec::new(), cont: None, tools: Vec::new(), open_cards, pages };
    for (pos, ms, l) in lines {
        f.line(*pos, *ms, l);
    }
    f.out
}

/// The preview's last actions (newest last): its tool steps, its
/// messages, its reports, pages and lands, one line each.
pub fn actions(entries: &[Value], n: usize) -> Vec<Value> {
    let mut out = Vec::new();
    for e in entries {
        let one = |kind: &str, text: &str| json!({"at_ms": e["at_ms"], "kind": kind, "text": one_line(text, 120)});
        match e["kind"].as_str().unwrap_or("") {
            "tools" => {
                for i in e["tools"]["items"].as_array().into_iter().flatten() {
                    let kind = if i["land"] == true { "land" } else { "tool" };
                    out.push(json!({"at_ms": i["at_ms"], "kind": kind, "text": i["text"]}));
                }
            }
            "agent" => out.push(one("message", e["text"].as_str().unwrap_or(""))),
            "report" => out.push(one("report", e["text"].as_str().unwrap_or(""))),
            "page" => out.push(one("page", e["text"].as_str().unwrap_or(""))),
            _ => {}
        }
    }
    let skip = out.len().saturating_sub(n);
    out.split_off(skip)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reports_and_publishes_read_from_a_bash_call() {
        assert_eq!(report_in(r#"cd x && sb report done "landed \"a\" · ok" --decision "y""#), Some(("done".into(), r#"landed "a" · ok"#.into())));
        assert_eq!(report_in("sb report progress 'half way'"), Some(("progress".into(), "half way".into())));
        assert_eq!(report_in("sb report nope x"), None);
        assert_eq!(publish_in("sb page publish $TMPDIR/p.html --id perf-notes --title T"), Some("perf-notes".into()));
        assert_eq!(publish_in("sb page publish ./weekly.html"), Some("weekly".into()));
        assert_eq!(status("stopped"), ("done", false));
        assert_eq!(status("archived"), ("done", true));
        assert_eq!(status("starting"), ("working", false));
    }
}
