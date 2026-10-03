//! The drafts of a page that wait for his word, batched (ambient-lead
//! m_5977, pm's challenge 4): D's good run made 7 cards for one plan, 3
//! of them 'send the draft?'. Two or more drafts of one page waiting at
//! once are ONE card, '3 drafts ready · 1 send all · 2 review': send all
//! is an approve note per draft; review opens the page at the first. A
//! single drafted step keeps its own card; a single review item or mail
//! has none (as before). Questions stay one card each.
//!
//! Pure here: which drafts wait, over the latest version's fragment, its
//! notes and its questions.

use super::checklist::{closed_by, draft_sendable, due, items_of, judged};
use super::questions::Question;
use super::store::{is_go_word, Note};

/// One draft waiting for his word.
#[derive(Clone, Debug, PartialEq)]
pub struct Draft {
    /// where his approve goes: the draft's block
    pub block: String,
    /// a review item's id (an approve on that item); None: the block
    pub item: Option<String>,
    pub text: String,
    /// a drafted plan step: its row (the page anchor)
    pub step: Option<String>,
}

impl Draft {
    /// Its key in a batch card: `block` or `block/item`.
    pub fn key(&self) -> String {
        match &self.item {
            Some(i) => format!("{}/{}", self.block, i),
            None => self.block.clone(),
        }
    }

    /// Where the page opens on it: the step's row, the item, the block.
    pub fn anchor(&self) -> &str {
        self.step.as_deref().or(self.item.as_deref()).unwrap_or(&self.block)
    }
}

fn note_item(n: &Note) -> Option<&str> {
    n.extra.get("item").and_then(|v| v.as_str())
}

/// The drafts of a page waiting for his word, in page order of kind:
/// a plan's drafted steps whose turn came (sendable, no question of the
/// page open), review items with no verdict of his, then emails and
/// messages with no go word that are no step's draft and can leave.
pub fn pending(html: &str, notes: &[Note], questions: &[Question]) -> Vec<Draft> {
    let mut out = Vec::new();
    let rows = judged(html, questions);
    let closed = |r: &super::checklist::Row| closed_by(r, notes);
    let asking = questions.iter().any(|q| q.reply.is_none());
    // a step's draft is that step's, sent at its turn, never on its own
    let of_steps: Vec<String> = rows.iter().filter(|r| !r.done).filter_map(|r| r.draft.clone()).collect();
    // (a plan's or not: a drafted row is a draft of his like a reply; only
    // the single-step card is a plan's)
    for r in due(&rows, &closed).into_iter().filter(|r| r.drafted) {
        if asking || r.draft.as_deref().is_some_and(|d| !draft_sendable(html, d)) {
            continue;
        }
        let (block, item) = match &r.draft {
            Some(d) => (d.clone(), None),
            None => (r.block.clone(), Some(r.item.clone())),
        };
        out.push(Draft { block, item, text: r.text.clone(), step: Some(r.item.clone()) });
    }
    let verdict = |b: &str, i: Option<&str>| {
        notes.iter().any(|n| n.block == b && note_item(n) == i && (matches!(n.kind.as_str(), "approve" | "skip" | "send" | "drafts") || is_go_word(n)))
    };
    for r in items_of(html, "review") {
        if !r.done && !verdict(&r.block, Some(&r.item)) {
            out.push(Draft { block: r.block.clone(), item: Some(r.item.clone()), text: r.text.clone(), step: None });
        }
    }
    for kit in ["email", "message"] {
        for (b, text) in super::waiting::blocks_of(html, kit) {
            if !verdict(&b, None) && !of_steps.contains(&b) && draft_sendable(html, &b) {
                out.push(Draft { block: b, item: None, text, step: None });
            }
        }
    }
    out
}

/// A batch card's first line: how many, and their words.
pub fn batch_text(drafts: &[Draft]) -> String {
    let names: Vec<String> = drafts.iter().map(|d| short(&d.text)).collect();
    format!("{} drafts ready: {}", drafts.len(), names.join(" · "))
}

fn short(t: &str) -> String {
    let t = t.trim();
    match t.char_indices().nth(40) {
        Some((i, _)) => format!("{}…", &t[..i]),
        None => t.to_string(),
    }
}

/// Words on a batch card that send them all.
pub fn is_send_all(reply: &str) -> bool {
    let w = reply.trim().trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase();
    matches!(w.as_str(), "1" | "send all" | "send" | "send them" | "envoie" | "envoie tout" | "yes" | "oui")
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    const PAGE: &str = r#"<section data-kit="checklist" data-id="plan" data-plan><ol>
<li data-id="s1" data-who="yours" data-done>pay the domain</li>
<li data-id="s5" data-who="bise" data-did="drafted" data-draft="mail-lucas">add the DNS records</li>
<li data-id="s6" data-who="bise" data-did="drafted" data-draft="mail-marc">tell Marc it's done</li>
<li data-id="s7" data-who="yours">check the site loads</li>
<li data-id="s8" data-who="bise" data-did="drafted" data-draft="mail-team">tell the team</li>
</ol></section>
<section data-kit="email" data-id="mail-lucas"><p data-field="to">lucas@acme.test</p><p data-field="subject">DNS</p><p>x</p></section>
<section data-kit="email" data-id="mail-marc"><p data-field="to">marc@acme.test</p><p data-field="subject">done</p><p>x</p></section>
<section data-kit="email" data-id="mail-team"><p data-field="to">team@acme.test</p><p data-field="subject">live</p><p>x</p></section>"#;

    fn note(v: serde_json::Value) -> Note {
        serde_json::from_value(v).unwrap()
    }

    /// Law (ambient-lead m_5977): drafted steps one after another are his
    /// turn at once, one batch; a later step's draft is not in it before
    /// its turn; sent drafts leave the batch.
    #[test]
    fn drafts_in_a_row_wait_together() {
        let p = pending(PAGE, &[], &[]);
        assert_eq!(p.iter().map(Draft::anchor).collect::<Vec<_>>(), vec!["s5", "s6"], "s8 waits behind his s7");
        assert_eq!(p.iter().map(Draft::key).collect::<Vec<_>>(), vec!["mail-lucas", "mail-marc"]);
        assert_eq!(batch_text(&p), "2 drafts ready: add the DNS records · tell Marc it's done");
        let sent = [note(json!({"id": "n1", "block": "mail-lucas", "kind": "approve", "text": "send", "status": "sent"}))];
        assert_eq!(pending(PAGE, &sent, &[]).iter().map(Draft::anchor).collect::<Vec<_>>(), vec!["s6"]);
    }

    /// Replies and mails of a feedback or inbox page batch the same way;
    /// a mail with no address is not ready.
    #[test]
    fn review_items_and_mails_are_drafts_too() {
        let html = r#"<section data-kit="review" data-id="replies"><ol><li data-id="r1">reply to Nina</li><li data-id="r2">reply to Marc</li></ol></section>
<section data-kit="message" data-id="slack-1" data-to="Slack · #lyon"><p>bonjour</p></section>
<section data-kit="email" data-id="mail-x"><p data-field="to">legal: address missing</p><p data-field="subject">s</p><p>x</p></section>"#;
        let skip = [note(json!({"id": "n1", "block": "replies", "item": "r2", "kind": "skip", "status": "sent"}))];
        let p = pending(html, &skip, &[]);
        assert_eq!(p.iter().map(Draft::key).collect::<Vec<_>>(), vec!["replies/r1", "slack-1"]);
        assert!(is_send_all("1") && is_send_all("Send all") && !is_send_all("2") && !is_send_all("review"));
    }
}
