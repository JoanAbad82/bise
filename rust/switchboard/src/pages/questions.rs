//! Questions in two places (docs/ambient-pages.md §4.2): a `question`
//! block of a published page, or a drawn pick (`k-pick` in a `ui` block,
//! notif-artifact: its options the h3s, each with its why, the agent's
//! `my pick`), is one hub card (kind `question`, a page card the page's
//! agent asks), its options the block's `<li>` items. The page keeps
//! `questions.json`: which card each block opened and its answer, which
//! door took it (`inbox` or `page`) and when. Pure here: the blocks'
//! words from the fragment, what a publish changes (the hub opens and
//! closes the cards), and what the page hears of its asks.

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
    /// which door took the answer, the hub's own fact: `inbox` (the
    /// card, the TUI, `/answer`) or `page`; and when (notif-artifact: the
    /// page says '✓ you picked A in the inbox · 11:42')
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub via: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub at_ms: Option<u64>,
    /// `data-notify="none"` (`data-card="none"` in pages published before
    /// it): a page-only question (promises, meeting pages; ambient-lead
    /// m_6091): never a notification, still in sb page
    /// waiting and answered on the page
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub page_only: bool,
    /// its card closed with no answer (withdrawn, dismissed): no card
    /// again until its words or options change (ambient-lead m_6091)
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub dismissed: bool,
    /// a drawn pick (`k-pick` in a ui block, notif-artifact): its
    /// options' keys, why lines and the agent's pick; None: a question
    /// block (its options are the list's items)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pick: Option<Pick>,
}

/// What a drawn pick adds to a question: per option, its `data-pick`
/// key and its one line why; and the option the agent marked `my pick`.
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct Pick {
    pub options: Vec<PickOption>,
    /// the agent's pick (1-based), when it marked one
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mine: Option<usize>,
}

#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct PickOption {
    /// its `data-pick` (`a`): the page marks the answer on it
    pub key: String,
    /// its first `<p>`: the card's line under the option
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub why: String,
}

impl Question {
    /// The card's text: the question, then its numbered options (the
    /// inbox and the capsule read the options from these lines).
    pub fn card_text(&self) -> String {
        let mut t = self.text.clone();
        let shown = self.on_card();
        for (i, o) in self.options.iter().take(shown).enumerate() {
            t.push_str(&format!("\n{}. {}", i + 1, o));
        }
        if let Some((n, others)) = self.more() {
            t.push_str(&format!("\n{n}. open the page for the other {others}"));
        }
        t
    }

    /// How many of its options the card carries: all, or the first 3
    /// of a drawn pick of more than 4 (designer m_26776).
    pub fn on_card(&self) -> usize {
        match self.pick.is_some() && self.options.len() > 4 {
            true => 3,
            false => self.options.len(),
        }
    }

    /// A drawn pick of more than 4 options: the card's last option (its
    /// number) opens the page for the others (how many).
    pub fn more(&self) -> Option<(usize, usize)> {
        let shown = self.on_card();
        (shown < self.options.len()).then(|| (shown + 1, self.options.len() - shown))
    }

    /// The words of option `n` (1-based).
    pub fn option(&self, n: usize) -> Option<&str> {
        n.checked_sub(1).and_then(|i| self.options.get(i)).map(String::as_str)
    }

    /// What the page hears and keeps of its answer (SSE `answered`, the
    /// meta's `asks`): the block, the words, which option it is (and its
    /// pick key), the door and when.
    pub fn answered_json(&self) -> serde_json::Value {
        let reply = self.reply.clone().unwrap_or_default();
        let n = self.option_of(&reply);
        let key = n.and_then(|n| self.pick.as_ref()?.options.get(n - 1)).map(|o| o.key.clone());
        serde_json::json!({"block": self.block, "reply": reply, "n": n, "key": key, "via": self.via, "at_ms": self.at_ms})
    }

    /// The page's state of this question (meta's `asks`): `open` while
    /// its notification waits in the inbox, else its answer.
    pub fn ask_json(&self, open: bool) -> serde_json::Value {
        match &self.reply {
            Some(_) => self.answered_json(),
            None => serde_json::json!({"block": self.block, "open": open && self.card != 0 && !self.page_only, "count": self.on_card()}),
        }
    }

    /// Which option an answer is (1-based): its number, or its words.
    pub fn option_of(&self, reply: &str) -> Option<usize> {
        let r = reply.trim();
        match r.parse::<usize>() {
            Ok(n) => self.option(n).map(|_| n),
            Err(_) => self.options.iter().position(|o| o == r).map(|i| i + 1),
        }
    }
}

/// The attribute `k` of a tag's head (`<div class="x" data-pick="a"`).
fn attr_of(head: &str, k: &str) -> Option<String> {
    head.split(&format!(" {k}=\"")).nth(1).and_then(|r| r.split('"').next()).map(String::from)
}

/// The text of the first `<tag>…</tag>` in `html` (`<p>` or `<p …>`,
/// never `<path`).
fn first_text(html: &str, tag: &str) -> Option<String> {
    let open = [format!("<{tag}>"), format!("<{tag} ")];
    let at = open.iter().filter_map(|o| html.find(o.as_str())).min()?;
    let rest = &html[at..];
    let body = &rest[rest.find('>')? + 1..];
    let t = text_of(&body[..body.find(&format!("</{tag}>")).unwrap_or(body.len())]);
    (!t.is_empty()).then_some(t)
}

/// A ui block's drawn pick (`data-ui="pick"`, one per block): its
/// options' h3s, keys and why lines, the agent's `my pick`. Its words:
/// `data-ask` on the pick (or the block), else empty (the hub asks with
/// the page's title). None: no pick, or fewer than two options.
fn pick_of(head: &str, body: &str) -> Option<(String, Vec<String>, Pick)> {
    let at = body.find("data-ui=\"pick\"")?;
    let tag_start = body[..at].rfind('<').unwrap_or(0);
    let tag_head = &body[tag_start..at + body[at..].find('>').unwrap_or(0)];
    let ask = attr_of(tag_head, "data-ask").or_else(|| attr_of(head, "data-ask")).map(|a| text_of(&a)).unwrap_or_default();
    let inner = &body[at..];
    let mut names = Vec::new();
    let mut pick = Pick::default();
    let parts: Vec<&str> = inner.split(" data-pick=\"").skip(1).collect();
    for part in parts {
        let key = part.split('"').next().unwrap_or_default().to_string();
        // the option runs to the next data-pick; its h3 is its name
        let Some(name) = first_text(part, "h3") else { continue };
        let after = &part[part.find("</h3>").map_or(0, |e| e + "</h3>".len())..];
        let why = first_text(after, "p").unwrap_or_default();
        if part[..part.find("<h3").unwrap_or(0)].contains("k-mark") {
            pick.mine = Some(names.len() + 1);
        }
        names.push(name);
        pick.options.push(PickOption { key, why });
    }
    (names.len() >= 2).then_some((ask, names, pick))
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
        // data-notify="none"; data-card="none", its old name, in pages published before it
        let page_only = [attr("data-notify"), attr("data-card")].iter().any(|v| v.as_deref() == Some("none"));
        let Some(id) = attr("data-id") else { continue };
        let body = &block[head_end + 1..block.len().saturating_sub("</section>".len())];
        match attr("data-kit").as_deref() {
            Some("question") => {}
            // a drawn pick asks like a question (notif-artifact)
            Some("ui") => {
                if let Some((text, options, pick)) = pick_of(head, body) {
                    out.push(Question { block: id, text, options, page_only, pick: Some(pick), ..Question::default() });
                }
                continue;
            }
            _ => continue,
        }
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
        out.push(Question { block: id, text, options, page_only, ..Question::default() });
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
            // now page-only: its open card goes
            Some(o) if q.page_only && o.card != 0 && open(o.card) => {
                if o.text == q.text && o.options == q.options {
                    q.reply = o.reply.clone();
                }
                close.push((o.card, "withdrawn"));
            }
            Some(o) if o.text == q.text && o.options == q.options => {
                q.card = o.card;
                q.reply = o.reply.clone();
                q.dismissed = o.dismissed;
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
        let q = |b: &str, t: &str, card: u64| Question { block: b.into(), text: t.into(), options: vec!["a".into(), "b".into()], card, ..Question::default() };
        let old = vec![Question { reply: Some("a".into()), ..q("q1", "same?", 7) }, q("q2", "old words?", 8), q("q3", "gone?", 9)];
        let new = vec![q("q1", "same?", 0), q("q2", "new words?", 0), q("q4", "new?", 0)];
        let p = plan(&old, new, &|c| c != 7);
        assert_eq!(p.questions.iter().map(|x| (x.block.as_str(), x.card)).collect::<Vec<_>>(), vec![("q1", 7), ("q2", 0), ("q4", 0)]);
        assert_eq!(p.questions[0].reply.as_deref(), Some("a"), "the answer stays with its question");
        assert_eq!(p.close, vec![(8, "replaced"), (9, "withdrawn")]);
    }

    /// Law (ambient-lead m_6091): data-notify="none" is a page-only
    /// question (no card; an open one it had goes); a card closed with no
    /// answer stays closed on a republish until the question's words or
    /// options change.
    #[test]
    fn page_only_and_dismissed_questions_open_no_card() {
        let h = |extra: &str, text: &str| format!(r#"<section data-kit="question" data-id="q-cc"{extra}><p>{text}</p><ol><li>lelio@acme.test</li><li>without the cc</li></ol></section>"#);
        let q = &of_fragment(&h(r#" data-notify="none""#, "which address?"))[0];
        assert!(q.page_only && q.card == 0);
        // a page published before notif-rename: its old data-card="none" still reads page-only
        assert!(of_fragment(&h(r#" data-card="none""#, "which address?"))[0].page_only);
        assert!(!of_fragment(&h("", "which address?"))[0].page_only);
        // it had a card, now page-only: the card goes
        let old = vec![Question { card: 3, ..of_fragment(&h("", "which address?"))[0].clone() }];
        let p = plan(&old, of_fragment(&h(r#" data-notify="none""#, "which address?")), &|_| true);
        assert_eq!(p.close, vec![(3, "withdrawn")]);
        assert!(p.questions[0].page_only && p.questions[0].card == 0);
        // dismissed: the same words keep it so, new words clear it
        let old = vec![Question { dismissed: true, ..of_fragment(&h("", "which address?"))[0].clone() }];
        assert!(plan(&old, of_fragment(&h("", "which address?")), &|_| false).questions[0].dismissed);
        assert!(!plan(&old, of_fragment(&h("", "which address for Lelio?")), &|_| false).questions[0].dismissed);
    }

    /// notif-artifact: a k-pick in a ui block asks like a question: its
    /// options are the h3s, each with its key and its first p (the why),
    /// the agent's `my pick` named; data-notify="none" opts out the same.
    #[test]
    fn a_drawn_pick_is_a_question() {
        let ui = |head: &str, ask: &str| {
            format!(
                r#"<section data-kit="ui" data-id="look"{head}>
<div class="k-pick" data-ui="pick"{ask}>
<div class="k-option" data-pick="a"><span class="k-mark">my pick</span><h3>A · a pink border</h3><p>and a clear <b>label</b>.</p><ul><li>clear</li></ul></div>
<div class="k-option" data-pick="b"><svg><path d="M0"/></svg><h3>B · one frame</h3><ul><li>no why</li></ul></div>
<div class="k-option" data-pick="c"><h3>C · a reply chip</h3><p>in the field.</p></div>
</div></section>"#
            )
        };
        let q = &of_fragment(&ui("", r#" data-ask="which composer look?""#))[0];
        assert_eq!((q.block.as_str(), q.text.as_str()), ("look", "which composer look?"));
        assert_eq!(q.options, vec!["A · a pink border", "B · one frame", "C · a reply chip"]);
        let p = q.pick.as_ref().unwrap();
        assert_eq!(p.options.iter().map(|o| (o.key.as_str(), o.why.as_str())).collect::<Vec<_>>(), vec![("a", "and a clear label ."), ("b", ""), ("c", "in the field.")]);
        assert_eq!(p.mine, Some(1));
        assert!(!q.page_only);
        assert_eq!(q.option_of("2"), Some(2));
        assert_eq!(q.option_of("C · a reply chip"), Some(3));
        assert_eq!(q.option_of("neither"), None);
        assert_eq!(q.card_text(), "which composer look?\n1. A · a pink border\n2. B · one frame\n3. C · a reply chip");
        assert_eq!((q.on_card(), q.more()), (3, None));
        // more than 4: the card carries the first 3 and opens the page for the others
        let six = Question { options: (b'a'..=b'f').map(|k| format!("{} · x", (k as char).to_ascii_uppercase())).collect(), ..q.clone() };
        assert_eq!((six.on_card(), six.more()), (3, Some((4, 3))));
        assert!(six.card_text().ends_with("\n3. C · x\n4. open the page for the other 3"), "{}", six.card_text());
        assert_eq!(six.ask_json(true)["count"], 3);
        // no data-ask: empty words (the hub asks with the page's title); on the block works too
        assert_eq!(of_fragment(&ui("", ""))[0].text, "");
        assert_eq!(of_fragment(&ui(r#" data-ask="which?""#, ""))[0].text, "which?");
        assert!(of_fragment(&ui(r#" data-notify="none""#, ""))[0].page_only);
        // a ui block without a pick, or a pick of one option, asks nothing
        assert!(of_fragment(r#"<section data-kit="ui" data-id="t"><div data-ui="tabs"><p>x</p></div></section>"#).is_empty());
        assert!(of_fragment(r#"<section data-kit="ui" data-id="t"><div data-ui="pick"><div data-pick="a"><h3>A</h3></div></div></section>"#).is_empty());
        // the old questions.json (no pick) still reads
        let old: Question = serde_json::from_str(r#"{"block":"q1","text":"t","options":["a"],"card":3}"#).unwrap();
        assert!(old.pick.is_none());
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
