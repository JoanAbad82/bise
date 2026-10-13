//! A gate's `confirm` card (approvals-design.md §9) as the inbox shows
//! it: the hub's lines (`wants to …`, `= `, `| `, `reason: ` or `warn: `,
//! `always: `) into a `Shape`, and its option 2's words.

use super::{Card, Enter, Part, Shape};
use crate::theme;
use ratatui::style::Style;
use ratatui::text::Span;

/// A gate's card (approvals-design.md §9), as the hub writes it: the
/// title (`wants to run`), `= ` the parts already allowed (dim, above),
/// `| ` what needs you, `reason: ` (or `warn: `, ▲), one `always: ` per rule it saves (none:
/// a hard rule, no option 2). Options: allow, always allow … here, no;
/// typed words say no, with the words as the note.
pub(super) fn confirm_shape(c: &Card) -> Shape {
    let (mut head, mut done, mut body, mut reason, mut always, mut warn) = (String::new(), vec![], vec![], String::new(), vec![], String::new());
    for (i, l) in c.text.lines().enumerate() {
        if i == 0 {
            head = l.to_string();
        } else if let Some(x) = l.strip_prefix("= ") {
            done.push(x.to_string());
        } else if let Some(x) = l.strip_prefix("| ").or(l.strip_prefix("|")) {
            body.push(x.to_string());
        } else if let Some(x) = l.strip_prefix("reason: ") {
            reason = x.to_string();
        } else if let Some(x) = l.strip_prefix("warn: ") {
            warn = x.to_string();
        } else if let Some(x) = l.strip_prefix("always: ") {
            always.push(x.to_string());
        }
    }
    let n = c.agent.split(", ").count();
    let title = if n > 1 {
        format!("{} agents {}", n, head.replacen("wants", "want", 1))
    } else {
        format!("{} {}", c.agent, head)
    };
    // `wants to run it outside the sandbox`: a sandbox card (brief 1e)
    let bash = head.starts_with("wants to run");
    let rerun = head.ends_with("outside the sandbox");
    let edit = head.starts_with("wants to edit");
    // an edit or a connector: its first 3 lines (after the path), the rest counted
    // (designer m_21189: never fold fewer than 3 lines, show them all)
    let keep = if edit { 4 } else { 3 };
    let (shown, more) = if bash || body.len() < keep + 3 {
        (body.clone(), 0)
    } else {
        (body.iter().take(keep).cloned().collect::<Vec<_>>(), body.len() - keep)
    };
    let mut parts: Vec<Part> = done.iter().map(|d| Part::Reason(format!("$ {d}"))).collect();
    let text = shown.join("\n");
    parts.push(Part::Code(if bash {
        // the bash mark in accent before the command (designer)
        let mut rows = crate::code::highlight_bash(&text);
        if let Some(first) = rows.first_mut() {
            first.insert(0, Span::styled("$ ", Style::default().fg(theme::accent())));
        }
        rows
    } else if edit {
        crate::code::highlight_patch(&text)
    } else {
        text.lines().map(|l| vec![Span::raw(l.to_string())]).collect()
    }));
    if more > 0 {
        parts.push(Part::Reason(format!("{} {} more line{}", theme::glyph("▸"), more, if more == 1 { "" } else { "s" })));
    }
    if !reason.is_empty() {
        parts.push(Part::Reason(reason));
    }
    parts.extend((!warn.is_empty()).then_some(Part::Warn(warn)));
    if !c.note.is_empty() {
        parts.push(Part::Note(c.note.clone()));
    }
    let first = body.first().map_or("", |l| l.trim());
    let summary = if body.len() > 1 && bash { format!("{first} · {} lines", body.len()) } else { first.to_string() };
    let mut options = vec![if rerun { "run it again without the sandbox" } else { "allow" }.to_string()];
    let mut short = vec![if rerun { "run again" } else { "allow" }.to_string()];
    if !always.is_empty() {
        options.push(always_option(rerun, &always, &body));
        short.push("always".into());
    }
    options.push("no".into());
    short.push("no".into());
    let who = title.clone();
    let hard = always.is_empty();
    let mut s = Shape::plain(title, who, summary, parts, options, short, Enter::Deny);
    s.note = String::new();
    s.cmd = bash;
    // `no` is always 3 (designer): a hard rule has no 2
    if hard {
        s.nums = vec![1, 3];
    }
    s
}

/// A confirm card's option 2. A sandbox card's saves a "run outside the
/// sandbox" rule, and says so (designer): `it` when the rule is the
/// command shown, else the rule.
fn always_option(rerun: bool, always: &[String], body: &[String]) -> String {
    let rules = always.join(", ");
    if !rerun {
        format!("always allow {rules} here")
    } else if rules == body.join("\n").trim() {
        "always run it outside the sandbox here".to_string()
    } else {
        format!("always run {rules} outside the sandbox here")
    }
}
