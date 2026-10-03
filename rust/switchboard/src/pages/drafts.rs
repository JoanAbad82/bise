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
    /// what it is: reply (a review item) | email | message | step (a
    /// drafted step with no draft block)
    pub kind: &'static str,
    /// who it goes to, when the page says: an email's To (its name, or
    /// the address before the @), a message's channel
    pub to: Option<String>,
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
    // (a plan's step only: a promise's draft on a promises page waits on
    // him now, whichever row's turn it is; ambient-lead m_6091, d-sso)
    // (a done row's draft went with it: a promise kept)
    let of_steps: Vec<String> = rows.iter().filter(|r| r.done || r.plan).filter_map(|r| r.draft.clone()).collect();
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
        let (kind, to) = match r.draft.as_deref() {
            Some(d) => (kit_of(html, d), recipient(html, d)),
            None => ("step", None),
        };
        out.push(Draft { block, item, text: r.text.clone(), step: Some(r.item.clone()), kind, to });
    }
    let verdict = |b: &str, i: Option<&str>| {
        notes.iter().any(|n| n.block == b && note_item(n) == i && (matches!(n.kind.as_str(), "approve" | "skip" | "send" | "drafts") || is_go_word(n)))
    };
    // a review's verb says what its items are: start (feedback an agent
    // can fix: his pick goes to main), keep (what bise keeps), open-reply
    // (read-only places: copy + open) are nothing bise sends (pm's C
    // fail 42)
    let sends = |b: &str| {
        let verb = head_of(html, b).and_then(|(h, _)| h.split("data-verb=\"").nth(1).and_then(|r| r.split('"').next()).map(String::from));
        !matches!(verb.as_deref(), Some("start" | "keep" | "open-reply"))
    };
    for r in items_of(html, "review") {
        if !r.done && !verdict(&r.block, Some(&r.item)) && sends(&r.block) {
            let to = reply_to(&r.text);
            out.push(Draft { block: r.block.clone(), item: Some(r.item.clone()), text: r.text.clone(), step: None, kind: "reply", to });
        }
    }
    for kit in ["email", "message"] {
        for (b, text) in super::waiting::blocks_of(html, kit) {
            if !verdict(&b, None) && !of_steps.contains(&b) && draft_sendable(html, &b) {
                let to = recipient(html, &b);
                out.push(Draft { block: b, item: None, text, step: None, kind: kit_word(kit), to });
            }
        }
    }
    out
}

fn kit_word(kit: &str) -> &'static str {
    match kit {
        "email" => "email",
        "message" => "message",
        _ => "step",
    }
}

/// The open tag of block `id`.
fn head_of<'a>(html: &'a str, id: &str) -> Option<(&'a str, &'a str)> {
    let at = html.find(&format!("data-id=\"{id}\""))?;
    let start = html[..at].rfind("<section")?;
    let block = &html[start..];
    let end = block.find("</section>").unwrap_or(block.len());
    let head_end = block.find('>').unwrap_or(0);
    Some((&block[..head_end], &block[..end]))
}

fn kit_of(html: &str, id: &str) -> &'static str {
    let kit = head_of(html, id).and_then(|(h, _)| h.split("data-kit=\"").nth(1).and_then(|r| r.split('"').next()).map(String::from));
    kit_word(kit.as_deref().unwrap_or(""))
}

/// Who block `id` goes to: an email's To (its name, else the address
/// before the @), a message's channel (data-to after its ' · ').
fn recipient(html: &str, id: &str) -> Option<String> {
    let (head, block) = head_of(html, id)?;
    if head.contains("data-kit=\"message\"") {
        let to = head.split("data-to=\"").nth(1)?.split('"').next()?;
        return Some(to.rsplit(" · ").next().unwrap_or(to).trim().to_string()).filter(|t| !t.is_empty());
    }
    let p = block.split("<p").find(|p| p.split('>').next().is_some_and(|h| h.contains("data-field=\"to\"")))?;
    let text = super::questions::text_of(&p[p.find('>')? + 1..p.find("</p>").unwrap_or(p.len())]);
    let first = text.split(',').next().unwrap_or("").trim();
    let name = match first.split_once('<') {
        Some((n, _)) if !n.trim().is_empty() => n.trim().to_string(),
        _ => first.trim_matches(|c| c == '<' || c == '>').split('@').next().unwrap_or("").to_string(),
    };
    Some(name).filter(|n| !n.is_empty())
}

/// A review item's addressee from its words ('reply to Nina: yes, Friday'
/// → Nina), else None.
fn reply_to(text: &str) -> Option<String> {
    let t = text.trim();
    let rest = t.strip_prefix("reply to ").or_else(|| t.strip_prefix("Reply to "))?;
    let name = rest.split([':', ',', '—']).next()?.trim();
    Some(name.to_string()).filter(|n| !n.is_empty())
}

/// What a batch holds, in ambient's words: replies, emails, messages,
/// steps, or drafts when they differ.
pub fn what(drafts: &[Draft]) -> &'static str {
    let first = drafts.first().map_or("step", |d| d.kind);
    if drafts.iter().any(|d| d.kind != first) {
        return "drafts";
    }
    match first {
        "reply" => "replies",
        "email" => "emails",
        "message" => "messages",
        _ => "steps",
    }
}

/// Each draft's name on the card: who it goes to, else its short words.
pub fn names(drafts: &[Draft]) -> Vec<String> {
    drafts.iter().map(|d| d.to.clone().unwrap_or_else(|| short(&d.text))).collect()
}

/// 'a', 'a and b', 'a, b and c', 'a, b and 4 more'.
pub fn and_list(names: &[String]) -> String {
    match names {
        [] => String::new(),
        [a] => a.clone(),
        [a, b] => format!("{a} and {b}"),
        [a, b, c] => format!("{a}, {b} and {c}"),
        [a, b, rest @ ..] => format!("{a}, {b} and {} more", rest.len()),
    }
}

/// The batch card's structured fields for the capsule (amb-web m_6061):
/// {count, title, what, names}.
pub fn info(drafts: &[Draft], title: &str) -> serde_json::Value {
    serde_json::json!({"count": drafts.len(), "title": title, "what": what(drafts), "names": names(drafts)})
}

/// The batch card's words, ambient's (m_6055 via ambient-lead m_6058):
/// '3 drafts wait for you · <title>', then 'replies to legal, Lucas and
/// Marc' (the names alone when they are no recipients).
pub fn batch_text(drafts: &[Draft], title: &str) -> String {
    let w = what(drafts);
    let list = and_list(&names(drafts));
    let line = if drafts.iter().all(|d| d.to.is_some()) && w != "drafts" && w != "steps" { format!("{w} to {list}") } else { list };
    let head = if title.trim().is_empty() {
        format!("{} drafts wait for you", drafts.len())
    } else {
        format!("{} drafts wait for you · {}", drafts.len(), title.trim())
    };
    format!("{head}
{line}")
}

/// A batch card's send option: 'send both' for two, 'send all <n>'.
pub fn send_label(n: usize) -> String {
    if n == 2 {
        "send both".into()
    } else {
        format!("send all {n}")
    }
}

fn short(t: &str) -> String {
    let t = t.trim();
    match t.char_indices().nth(40) {
        Some((i, _)) => format!("{}…", &t[..i]),
        None => t.to_string(),
    }
}

/// Page `id`'s drafts may make a batch card: any page but a promises or
/// a meeting page (no card ever there; amb-kit's lint_page, m_6091).
pub fn carded(id: &str) -> bool {
    !(id.starts_with("promises-") || id.starts_with("meeting-"))
}

/// Words on a batch card that send them all: option 2 (1 is review, the
/// default), 'send all <n>', 'send both', send, envoie, yes.
pub fn is_send_all(reply: &str) -> bool {
    let w = reply.trim().trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase();
    // 'send all 3': the count after the words
    let w = match w.rsplit_once(' ') {
        Some((head, n)) if n.chars().all(|c| c.is_ascii_digit()) => head,
        _ => w.as_str(),
    };
    matches!(w, "2" | "send all" | "send both" | "send" | "send them" | "envoie" | "envoie tout" | "envoie les" | "yes" | "oui")
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
        assert_eq!(batch_text(&p, "launch plan"), "2 drafts wait for you · launch plan
emails to lucas and marc");
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
        assert_eq!(what(&p), "drafts", "a reply and a message: mixed");
        assert_eq!(names(&p), vec!["Nina".to_string(), "#lyon".to_string()]);
    }

    /// Law (pm's C fail 42): a feedback page's Slack replies (message
    /// blocks with data-to and data-open, one after each review item of
    /// data-verb="start") are its drafts, and such a page (no plan) makes
    /// a batch card; the 'start' items are no drafts (an agent on them
    /// goes to main); promises and meeting pages never card.
    #[test]
    fn a_feedback_pages_replies_batch() {
        let item = |i: &str| {
            format!(
                r#"<section data-kit="review" data-id="r-{i}" data-verb="start"><ol><li data-id="{i}" data-agent="fix-{i}"><p>Benjamin · bug {i}</p></li></ol></section>
<section data-kit="message" data-id="reply-{i}" data-to="Slack · reply to Benjamin in #acme-feedback ({i})" data-open="https://acme.slack.com/archives/C05/p{i}"><p>thanks Benjamin, fixed</p></section>"#
            )
        };
        let html = [item("s212"), item("s213"), item("s214")].concat();
        let p = pending(&html, &[], &[]);
        assert_eq!(p.iter().map(Draft::key).collect::<Vec<_>>(), vec!["reply-s212", "reply-s213", "reply-s214"]);
        assert_eq!(what(&p), "messages");
        assert!(carded("benjamin-bugs") && !carded("promises-2026-w40") && !carded("meeting-renewal"));
    }

    /// Law (ambient's words, m_6055 via ambient-lead m_6058): review is
    /// option 1, the default, and never sends; 2 sends them all ('send
    /// both' for two, 'send all <n>' else); the label counts and names
    /// the page, the line says what and to whom.
    #[test]
    fn batch_card_words_review_first() {
        for yes in ["2", "2.", "Send all", "send all 3", "send both", "send", "envoie", "yes", "Oui"] {
            assert!(is_send_all(yes), "{yes}");
        }
        for no in ["1", "review", "1. review", "no", "send later", ""] {
            assert!(!is_send_all(no), "{no}");
        }
        assert_eq!((send_label(2), send_label(3)), ("send both".to_string(), "send all 3".to_string()));
        let s = |n: &[&str]| n.iter().map(|x| x.to_string()).collect::<Vec<_>>();
        assert_eq!(and_list(&s(&["legal", "Lucas", "Marc"])), "legal, Lucas and Marc");
        assert_eq!(and_list(&s(&["legal", "Lucas", "Marc", "Nina", "Ana", "Tom"])), "legal, Lucas and 4 more");
        let reply = |to: &str| Draft { block: "r".into(), item: Some(to.into()), text: format!("reply to {to}"), step: None, kind: "reply", to: Some(to.into()) };
        let three = [reply("legal"), reply("Lucas"), reply("Marc")];
        assert_eq!(batch_text(&three, "inbox"), "3 drafts wait for you · inbox
replies to legal, Lucas and Marc");
        assert_eq!(info(&three, "inbox"), json!({"count": 3, "title": "inbox", "what": "replies", "names": ["legal", "Lucas", "Marc"]}));
        let step = super::super::checklist::Step { text: batch_text(&three, "inbox"), batch: vec!["a".into(), "b".into(), "c".into()], ..Default::default() };
        assert_eq!(step.card_text(), "3 drafts wait for you · inbox
replies to legal, Lucas and Marc
1. review
2. send all 3");
        // steps with no recipient: their words alone
        let p = pending(PAGE, &[], &[]);
        let bare: Vec<Draft> = p.into_iter().map(|d| Draft { to: None, kind: "step", ..d }).collect();
        assert_eq!(batch_text(&bare, ""), "2 drafts wait for you
add the DNS records and tell Marc it's done");
    }
}
