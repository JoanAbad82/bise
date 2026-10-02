//! Questions in two places (docs/ambient-pages.md §4.2): a `question`
//! block of a published page is one hub card (kind `question`, the
//! page's agent asking), its options the block's `<li>` items. The page
//! keeps `questions.json`: which card each block opened and its answer.
//! Pure here: the blocks' words from the fragment, and what a publish
//! changes (the hub opens and closes the cards).

use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct Question {
    pub block: String,
    pub text: String,
    #[serde(default)]
    pub options: Vec<String>,
    /// the hub card it opened (0: none yet)
    #[serde(default)]
    pub card: u64,
    /// the user's answer (on the page, in the capsule or the TUI)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reply: Option<String>,
}

impl Question {
    /// The card's text: the question, then its numbered options (the
    /// inbox and the capsule read the options from these lines).
    pub fn card_text(&self) -> String {
        let mut t = self.text.clone();
        for (i, o) in self.options.iter().enumerate() {
            t.push_str(&format!("\n{}. {}", i + 1, o));
        }
        t
    }

    /// The words of option `n` (1-based).
    pub fn option(&self, n: usize) -> Option<&str> {
        n.checked_sub(1).and_then(|i| self.options.get(i)).map(String::as_str)
    }
}

/// The text of some HTML: tags dropped, the common entities decoded,
/// whitespace folded.
pub(crate) fn text_of(html: &str) -> String {
    let mut out = String::new();
    let mut in_tag = false;
    for c in html.chars() {
        match c {
            '<' => {
                in_tag = true;
                out.push(' ');
            }
            '>' => in_tag = false,
            c if !in_tag => out.push(c),
            _ => {}
        }
    }
    let out = out.replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"").replace("&#39;", "'").replace("&nbsp;", " ").replace("&amp;", "&");
    out.split_whitespace().collect::<Vec<_>>().join(" ")
}

/// The question blocks of a fragment, in order: the block's text before
/// its list, and each `<li>` of the list. The lint ran: the blocks are
/// well formed.
pub fn of_fragment(html: &str) -> Vec<Question> {
    let mut out = Vec::new();
    let mut rest = html;
    while let Some(i) = rest.find("<section") {
        let sec = &rest[i..];
        let end = sec.find("</section>").map_or(sec.len(), |e| e + "</section>".len());
        let (block, after) = (&sec[..end], &sec[end..]);
        rest = after;
        let head_end = block.find('>').unwrap_or(0);
        let head = &block[..head_end];
        let attr = |k: &str| head.split(&format!("{k}=\"")).nth(1).and_then(|r| r.split('"').next()).map(String::from);
        if attr("data-kit").as_deref() != Some("question") {
            continue;
        }
        let Some(id) = attr("data-id") else { continue };
        let body = &block[head_end + 1..block.len().saturating_sub("</section>".len())];
        let list_at = body.find("<ol").or_else(|| body.find("<ul")).unwrap_or(body.len());
        let text = text_of(&body[..list_at]);
        let options: Vec<String> = body[list_at..]
            .split("<li")
            .skip(1)
            .map(|li| {
                let li = &li[li.find('>').map_or(0, |g| g + 1)..];
                text_of(li.split("</li>").next().unwrap_or(li))
            })
            .filter(|o| !o.is_empty())
            .collect();
        out.push(Question { block: id, text, options, card: 0, reply: None });
    }
    out
}

/// The page's kicker for the home list (amb-kit, m_4884): the `<p>` of
/// its first `heading` block (its meta line), when it has one.
pub fn kicker(html: &str) -> Option<String> {
    let at = html.find("data-kit=\"heading\"")?;
    let sec = &html[at..];
    let sec = &sec[..sec.find("</section>").unwrap_or(sec.len())];
    let p = &sec[sec.find("<p")?..];
    let p = &p[p.find('>')? + 1..];
    let t = text_of(&p[..p.find("</p>").unwrap_or(p.len())]);
    (!t.is_empty()).then_some(t)
}

/// What a publish does to the cards.
#[derive(Debug, Default, PartialEq)]
pub struct Plan {
    /// the questions after (cards still to open have `card` 0)
    pub questions: Vec<Question>,
    /// open cards to close: (card, the hub's word)
    pub close: Vec<(u64, &'static str)>,
}

/// A new version's questions against the page's: the same question
/// keeps its card (and its answer); a changed one gets a new card (the
/// old one closes, `replaced`); a question gone closes its card
/// (`withdrawn`). `open`: whether a card is still open.
pub fn plan(old: &[Question], new: Vec<Question>, open: &dyn Fn(u64) -> bool) -> Plan {
    let mut close = Vec::new();
    let mut questions = Vec::new();
    for mut q in new {
        match old.iter().find(|o| o.block == q.block) {
            Some(o) if o.text == q.text && o.options == q.options => {
                q.card = o.card;
                q.reply = o.reply.clone();
            }
            Some(o) if o.card != 0 && open(o.card) => close.push((o.card, "replaced")),
            _ => {}
        }
        questions.push(q);
    }
    for o in old {
        if !questions.iter().any(|q| q.block == o.block) && o.card != 0 && open(o.card) {
            close.push((o.card, "withdrawn"));
        }
    }
    Plan { questions, close }
}

#[cfg(test)]
mod tests {
    use super::*;

    const PAGE: &str = r#"<section data-kit="prose" data-id="p1"><p>x</p></section>
<section data-kit="question" data-id="q1">
  <p>post it in #team now, or wait for <strong>Marc</strong>&#39;s check?</p>
  <ol>
    <li>post now</li>
    <li>wait for Marc</li>
  </ol>
</section>"#;

    #[test]
    fn reads_the_question_blocks() {
        let q = of_fragment(PAGE);
        assert_eq!(q.len(), 1);
        assert_eq!((q[0].block.as_str(), q[0].text.as_str()), ("q1", "post it in #team now, or wait for Marc 's check?"));
        assert_eq!(q[0].options, vec!["post now", "wait for Marc"]);
        assert_eq!(q[0].card_text(), "post it in #team now, or wait for Marc 's check?\n1. post now\n2. wait for Marc");
        assert_eq!(q[0].option(2), Some("wait for Marc"));
        assert_eq!(q[0].option(0), None);
    }

    #[test]
    fn a_publish_keeps_replaces_or_withdraws_cards() {
        let q = |b: &str, t: &str, card: u64| Question { block: b.into(), text: t.into(), options: vec!["a".into(), "b".into()], card, reply: None };
        let old = vec![Question { reply: Some("a".into()), ..q("q1", "same?", 7) }, q("q2", "old words?", 8), q("q3", "gone?", 9)];
        let new = vec![q("q1", "same?", 0), q("q2", "new words?", 0), q("q4", "new?", 0)];
        let p = plan(&old, new, &|c| c != 7);
        assert_eq!(p.questions.iter().map(|x| (x.block.as_str(), x.card)).collect::<Vec<_>>(), vec![("q1", 7), ("q2", 0), ("q4", 0)]);
        assert_eq!(p.questions[0].reply.as_deref(), Some("a"), "the answer stays with its question");
        assert_eq!(p.close, vec![(8, "replaced"), (9, "withdrawn")]);
    }

    #[test]
    fn the_kicker_is_the_first_headings_meta_line() {
        let h = r#"<section data-kit="prose" data-id="a"><p>no</p></section>
<section data-kit="heading" data-id="h"><h1>Weekly update</h1><p>week 41 &middot; for #team · draft 2</p></section>
<section data-kit="heading" data-id="h2"><h1>x</h1><p>later</p></section>"#;
        assert_eq!(kicker(h).as_deref(), Some("week 41 &middot; for #team · draft 2"));
        assert_eq!(kicker(r#"<section data-kit="heading" data-id="h"><h1>t</h1></section><p>out</p>"#), None);
        assert_eq!(kicker(PAGE), None);
    }
}
