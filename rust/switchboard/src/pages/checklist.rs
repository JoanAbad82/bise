//! Checklists that tick themselves (docs/ambient-roadmap.md §2 D): a
//! checklist row with `data-who="yours"` is the user's step. When its
//! turn comes (every row before it in its block done), the hub opens one
//! card for it; a tick (on the page, on the card, by voice through main)
//! closes it and the next step's turn comes. bise's own rows (no
//! `data-who`, or `bise`) are done when the agent republishes them with
//! `data-done`; any other `data-who` is someone else's (no card). Pure
//! here: the rows of a fragment and whose turn it is; the page keeps
//! `steps.json`, the cards it opened.

use serde::{Deserialize, Serialize};

/// One row of a checklist block, as the latest version has it.
#[derive(Clone, Debug, PartialEq)]
pub struct Row {
    pub block: String,
    pub item: String,
    pub text: String,
    /// `data-who="yours"`: the user's step
    pub yours: bool,
    /// `data-done` in the fragment
    pub done: bool,
}

/// A card the hub opened for a step of the user's.
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct Step {
    pub block: String,
    pub item: String,
    pub text: String,
    pub card: u64,
    /// how it closed: "done" (ticked), the user's words, "" (closed
    /// another way); None while the card is open
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reply: Option<String>,
}

impl Step {
    /// The card's text: the step, and its one option.
    pub fn card_text(&self) -> String {
        format!("{}
1. done", self.text)
    }
}

/// The value of attribute `k` in an open tag (`<li data-id="t1" …>`);
/// Some("") for a bare one (`data-done`).
fn attr(head: &str, k: &str) -> Option<String> {
    let mut rest = head;
    while let Some(i) = rest.find(k) {
        let before = rest[..i].chars().last();
        let after = &rest[i + k.len()..];
        rest = after;
        if !matches!(before, Some(c) if c.is_whitespace()) {
            continue;
        }
        if let Some(v) = after.strip_prefix("=\"") {
            return v.split('"').next().map(String::from);
        }
        if after.starts_with(|c: char| c.is_whitespace() || c == '>' || c == '/') || after.is_empty() {
            return Some(String::new());
        }
    }
    None
}

/// The rows of the checklist blocks of a fragment, in order (the lint
/// ran: each row has its data-id).
pub fn rows_of(html: &str) -> Vec<Row> {
    items_of(html, "checklist")
}

/// The items (`<li data-id>`) of the blocks of kind `kit` in a fragment,
/// in order: a checklist's rows, a review's items.
pub fn items_of(html: &str, kit: &str) -> Vec<Row> {
    let mut out = Vec::new();
    let mut rest = html;
    while let Some(i) = rest.find("<section") {
        let sec = &rest[i..];
        let end = sec.find("</section>").map_or(sec.len(), |e| e + "</section>".len());
        let (block, after) = (&sec[..end], &sec[end..]);
        rest = after;
        let head_end = block.find('>').unwrap_or(0);
        let head = &block[..head_end];
        if attr(head, "data-kit").as_deref() != Some(kit) {
            continue;
        }
        let Some(bid) = attr(head, "data-id") else { continue };
        for li in block[head_end..].split("<li").skip(1) {
            let Some(g) = li.find('>') else { continue };
            let lhead = &li[..g];
            let Some(item) = attr(lhead, "data-id") else { continue };
            let body = &li[g + 1..];
            let body = &body[..body.find("</li>").unwrap_or(body.len())];
            out.push(Row {
                block: bid.clone(),
                item,
                text: super::questions::text_of(body),
                yours: attr(lhead, "data-who").as_deref() == Some("yours"),
                done: attr(lhead, "data-done").is_some(),
            });
        }
    }
    out
}

/// The user's steps whose turn it is: in each checklist block, the first
/// row not done (by the fragment or a tick), when it is his.
pub fn due<'a>(rows: &'a [Row], ticked: &dyn Fn(&str, &str) -> bool) -> Vec<&'a Row> {
    let mut out: Vec<&Row> = Vec::new();
    let mut blocks: Vec<&str> = Vec::new();
    for r in rows {
        if blocks.contains(&r.block.as_str()) {
            continue;
        }
        if r.done || ticked(&r.block, &r.item) {
            continue;
        }
        // the first open row of its block: its turn, the rest wait
        blocks.push(&r.block);
        if r.yours {
            out.push(r);
        }
    }
    out
}

/// Words on a step's card that tick it.
pub fn is_done_word(reply: &str) -> bool {
    let w = reply.trim().trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase();
    matches!(w.as_str(), "1" | "done" | "yes" | "ok" | "fait" | "c'est fait" | "oui")
}

#[cfg(test)]
mod tests {
    use super::*;

    const PLAN: &str = r#"<section data-kit="heading" data-id="h"><h1>buy the domain</h1></section>
<section data-kit="checklist" data-id="steps">
  <ol>
    <li data-id="t1" data-done>check the name is free</li>
    <li data-id="t2">compare <strong>Gandi</strong> and OVH</li>
    <li data-id="t3" data-who="yours" data-due="2026-10-03">pay the domain on Gandi</li>
    <li data-id="t4">point the DNS</li>
    <li data-id="t5" data-who="Camille">tell the team</li>
  </ol>
</section>"#;

    #[test]
    fn reads_the_rows() {
        let r = rows_of(PLAN);
        assert_eq!(r.iter().map(|x| (x.item.as_str(), x.yours, x.done)).collect::<Vec<_>>(),
            vec![("t1", false, true), ("t2", false, false), ("t3", true, false), ("t4", false, false), ("t5", false, false)]);
        assert_eq!(r[1].text, "compare Gandi and OVH");
        assert_eq!(r[2].block, "steps");
    }

    #[test]
    fn a_step_of_his_is_due_when_every_row_before_it_is_done() {
        let r = rows_of(PLAN);
        let none = |_: &str, _: &str| false;
        assert!(due(&r, &none).is_empty(), "t2 (bise's) comes first");
        let t2 = |_: &str, i: &str| i == "t2";
        assert_eq!(due(&r, &t2).iter().map(|x| x.item.as_str()).collect::<Vec<_>>(), vec!["t3"]);
        let t23 = |_: &str, i: &str| i == "t2" || i == "t3";
        assert!(due(&r, &t23).is_empty(), "t4 is bise's");
        // someone else's step is never a card
        let all = |_: &str, i: &str| i != "t5";
        assert!(due(&r, &all).is_empty());
    }

    #[test]
    fn done_words() {
        assert!(is_done_word("1") && is_done_word("Done!") && is_done_word(" fait ") && is_done_word("yes"));
        assert!(!is_done_word("not yet") && !is_done_word("2"));
    }
}
