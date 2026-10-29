//! `/debug completion`'s rows as the screen's entries: each row of
//! `bise_session::completion` (a message, the system prompt, the
//! request's head) is one entry under its provider word, and each of its
//! calls and results one more under its own (`tool_use · bash`,
//! `result`), so a bash call draws as its command, run_typescript as its
//! code, a text as markdown, the way the history draws them.

use super::model::{self, Body, Item, Role};
use bise_proto::log::{CompRow, LogBody, LogBodyKind};
use bise_session::{completion, Redactor};

/// What the tab shows: the family the rows are in, the body's size, and
/// the model it was rendered for (none: as sent).
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub(crate) struct Shown {
    pub(crate) family: String,
    pub(crate) bytes: u64,
    pub(crate) shown_as: Option<String>,
}

fn lang(l: Option<&str>) -> &'static str {
    match l.unwrap_or("") {
        "bash" => "bash",
        "ts" => "ts",
        "json" => "json",
        "diff" => "diff",
        "rust" => "rust",
        "python" => "python",
        _ => "",
    }
}

fn body(b: &LogBody) -> Body {
    match b.kind {
        LogBodyKind::Md => Body::Md(b.text.clone()),
        LogBodyKind::Code => Body::Code { lang: lang(b.lang.as_deref()), text: b.text.clone() },
        _ => Body::Plain(b.text.clone()),
    }
}

fn item(n: u64, rank: u64, role: String, head: String, body: Body, tokens: Option<u64>) -> Item {
    let tool = role.strip_prefix("tool_use · ").unwrap_or("").to_string();
    Item {
        seq: n,
        idx: n as usize,
        pos: model::pos_of(n as usize, rank),
        turn: None,
        time: String::new(),
        role: Role::Sent(role),
        tool,
        head,
        body,
        rule: None,
        tokens: tokens.map(|t| (t, true)),
        meta: String::new(),
    }
}

/// A block's header: the params' keys, the tools' names, a call's or
/// a result's first line.
fn block_head(label: &str, text: &str) -> String {
    let v = || serde_json::from_str::<serde_json::Value>(text).ok();
    let list = |names: Vec<String>| model::first_line(&names.join(", "), 90);
    match label {
        "params" => v().and_then(|v| v.as_object().map(|m| list(m.keys().cloned().collect()))).unwrap_or_default(),
        l if l.starts_with("tools") => v()
            .and_then(|v| {
                v.as_array().map(|a| {
                    let name = |t: &serde_json::Value| t.get("name").or_else(|| t.pointer("/function/name")).and_then(|n| n.as_str()).unwrap_or("?").to_string();
                    list(a.iter().map(name).collect())
                })
            })
            .unwrap_or_default(),
        _ => model::first_line(text, 90),
    }
}

/// The entries of the rows: a row's first block under its header when
/// it has no label of its own, each other block an entry after it. A
/// message with no text of its own (a user message holding only a
/// tool_result, an assistant one holding only calls) has no header row:
/// its calls and results are its entries, the first one with its tokens
/// (designer m_37596).
pub(crate) fn of_rows(rows: &[CompRow], family: &str, bytes: u64, shown_as: Option<String>) -> (Vec<Item>, Shown) {
    let mut out = Vec::new();
    for r in rows {
        let mut blocks = r.blocks.iter().peekable();
        let first = blocks.next_if(|b| b.label.is_none()).map(|b| body(&b.body));
        let bare = first.is_none() && r.n > 0 && !r.blocks.is_empty();
        if !bare {
            out.push(item(r.n, 0, r.role.clone(), r.head.clone(), first.unwrap_or(Body::None), Some(r.tokens)));
        }
        for (k, b) in blocks.enumerate() {
            let label = b.label.clone().unwrap_or_default();
            let head = block_head(&label, &b.body.text);
            let tokens = (bare && k == 0).then_some(r.tokens);
            out.push(item(r.n, k as u64 + 1, label, head, body(&b.body), tokens));
        }
    }
    (out, Shown { family: family.to_string(), bytes, shown_as })
}

/// A body read from the ring, as entries (`raw`: each row its slice).
pub(crate) fn of_body(b: &str, raw: bool, red: &Redactor) -> Result<(Vec<Item>, Shown), String> {
    let s = completion::split(b)?;
    let rows = if raw { completion::raw_rows(&s, red) } else { completion::rows(&s, red) };
    Ok(of_rows(&rows, s.family.word(), b.len() as u64, None))
}
