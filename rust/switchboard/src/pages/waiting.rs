//! `sb page waiting` (amb-kit m_5762, the morning page): what waits on the
//! user across one page, one line per item. Pure here over the latest
//! version's fragment, its notes and its questions; the store walks the
//! pages.

use super::checklist::{due, items_of, rows_of};
use super::questions::Question;
use super::store::{is_go_word, Note};
use serde::Serialize;

#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct Waiting {
    pub page: String,
    pub item: String,
    /// step | draft | question | notes
    pub kind: &'static str,
    pub text: String,
}

impl Waiting {
    /// `<page id>#<item id> · <kind> · <text>`
    pub fn line(&self) -> String {
        format!("{}#{} · {} · {}", self.page, self.item, self.kind, self.text)
    }
}

fn note_item(n: &Note) -> Option<&str> {
    n.extra.get("item").and_then(|v| v.as_str())
}

/// The id and the text of each block of kind `kit` (an email, a message):
/// the block's whole text, cut.
fn blocks_of(html: &str, kit: &str) -> Vec<(String, String)> {
    let mut out = Vec::new();
    let needle = format!("data-kit=\"{kit}\"");
    let mut rest = html;
    while let Some(i) = rest.find("<section") {
        let sec = &rest[i..];
        let end = sec.find("</section>").map_or(sec.len(), |e| e + "</section>".len());
        let (block, after) = (&sec[..end], &sec[end..]);
        rest = after;
        let head = &block[..block.find('>').unwrap_or(0)];
        if !head.contains(&needle) {
            continue;
        }
        let Some(id) = head.split("data-id=\"").nth(1).and_then(|r| r.split('"').next()) else { continue };
        let text = super::questions::text_of(&block[head.len()..]);
        out.push((id.to_string(), cut(&text)));
    }
    out
}

fn cut(t: &str) -> String {
    let t = t.trim();
    match t.char_indices().nth(80) {
        Some((i, _)) => format!("{}…", &t[..i]),
        None => t.to_string(),
    }
}

/// What waits on him in page `id`: his steps whose turn came, the drafts
/// he has not approved, sent or skipped (review items, emails, messages),
/// the questions he has not answered, and the notes he left unsent.
pub fn of_page(id: &str, html: &str, notes: &[Note], questions: &[Question]) -> Vec<Waiting> {
    let mut out = Vec::new();
    let w = |item: &str, kind: &'static str, text: &str| Waiting { page: id.into(), item: item.into(), kind, text: cut(text) };
    // his steps whose turn came
    let rows = rows_of(html);
    let ticked = |b: &str, i: &str| notes.iter().any(|n| n.kind == "tick" && n.block == b && note_item(n) == Some(i));
    for r in due(&rows, &ticked) {
        out.push(w(&r.item, "step", &r.text));
    }
    // drafts: review items with no verdict of his, emails and messages
    // with no go word
    let verdict = |b: &str, i: Option<&str>| {
        notes.iter().any(|n| n.block == b && note_item(n) == i && (matches!(n.kind.as_str(), "approve" | "skip" | "send" | "drafts") || is_go_word(n)))
    };
    for r in items_of(html, "review") {
        if !r.done && !verdict(&r.block, Some(&r.item)) {
            out.push(w(&r.item, "draft", &r.text));
        }
    }
    for kit in ["email", "message"] {
        for (b, text) in blocks_of(html, kit) {
            if !verdict(&b, None) {
                out.push(w(&b, "draft", &text));
            }
        }
    }
    // questions he has not answered (on the page: no data-answer)
    for (b, _) in blocks_of(html, "question") {
        let answered = questions.iter().any(|q| q.block == b && q.reply.as_deref().is_some_and(|r| !r.is_empty()));
        let has_answer = html.split("data-id=\"").any(|p| p.starts_with(&format!("{b}\"")) && p.split('>').next().is_some_and(|h| h.contains("data-answer")));
        if !answered && !has_answer {
            let text = questions.iter().find(|q| q.block == b).map(|q| q.text.clone()).unwrap_or_default();
            out.push(w(&b, "question", &text));
        }
    }
    // notes he left and did not send
    for n in notes.iter().filter(|n| n.status == "draft") {
        let text = n.text.clone().or(n.quote.clone()).unwrap_or_else(|| n.kind.clone());
        out.push(w(&n.id, "notes", &text));
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    const PAGE: &str = r#"<section data-kit="checklist" data-id="steps"><ol>
<li data-id="t1" data-done>check the name</li><li data-id="t2" data-who="yours">pay the domain on Gandi</li><li data-id="t3">point the DNS</li></ol></section>
<section data-kit="review" data-id="replies"><ol><li data-id="m1">reply to Nina: yes, Friday</li><li data-id="m2">reply to Marc: no</li></ol></section>
<section data-kit="email" data-id="mail"><p>Subject: the offsite</p><p>Hi all, …</p></section>
<section data-kit="question" data-id="q1"><p>post it now?</p><ol><li>yes</li><li>no</li></ol></section>
<section data-kit="question" data-id="q2" data-answer="1"><p>done one?</p><ol><li>yes</li></ol></section>"#;

    fn note(v: serde_json::Value) -> Note {
        serde_json::from_value(v).unwrap()
    }

    #[test]
    fn lists_what_waits_on_him() {
        let notes = vec![
            note(json!({"id": "n1", "block": "replies", "item": "m2", "kind": "skip", "status": "sent"})),
            note(json!({"id": "n2", "block": "mail", "kind": "note", "text": "shorter", "status": "draft"})),
        ];
        let qs = vec![Question { block: "q1".into(), text: "post it now?".into(), options: vec!["yes".into(), "no".into()], card: 4, reply: None }];
        let lines: Vec<String> = of_page("plan", PAGE, &notes, &qs).iter().map(Waiting::line).collect();
        assert_eq!(lines, vec![
            "plan#t2 · step · pay the domain on Gandi",
            "plan#m1 · draft · reply to Nina: yes, Friday",
            "plan#mail · draft · Subject: the offsite Hi all, …",
            "plan#q1 · question · post it now?",
            "plan#n2 · notes · shorter",
        ]);
        // answered, approved, ticked: nothing waits
        let notes = vec![
            note(json!({"id": "n1", "block": "replies", "item": "m1", "kind": "approve", "status": "sent"})),
            note(json!({"id": "n2", "block": "replies", "item": "m2", "kind": "skip", "status": "sent"})),
            note(json!({"id": "n3", "block": "mail", "kind": "send", "status": "sent"})),
            note(json!({"id": "n4", "block": "steps", "item": "t2", "kind": "tick", "status": "sent"})),
        ];
        let qs = vec![Question { reply: Some("yes".into()), ..qs[0].clone() }];
        assert!(of_page("plan", PAGE, &notes, &qs).is_empty());
    }
}
