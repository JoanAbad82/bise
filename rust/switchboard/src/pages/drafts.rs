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
    /// what it is: reply (a review item that leaves: data-verb send or
    /// reply, a message in a thread) | item (a review item with no verb:
    /// he approves it, nothing leaves) | email | message | step (a
    /// drafted step with no draft block) | action
    pub kind: &'static str,
    /// who it goes to, when the page says: an email's To (its name, or
    /// the address before the @), a message's channel
    pub to: Option<String>,
    /// what it is about, when its address says ('to Benjamin, on the
    /// proxy' → proxy): the card groups one recipient's drafts by it
    pub topic: Option<String>,
    /// what he needs to decide on it, from the page: an email's subject,
    /// a message's first words, an action's own line (notif-words)
    pub detail: Option<String>,
    /// an action's place among the page's actions, (its rank from 1, how
    /// many): the notification's '(2 of 7, in order)'
    pub rank: Option<(usize, usize)>,
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
/// `went`: the blocks the page's `--went` names (they left: posted, sent);
/// an approved action takes the message or email it posts with it
/// ([`posted_by`]; issue-15, main m_24663).
pub fn pending(html: &str, notes: &[Note], questions: &[Question], went: &[String]) -> Vec<Draft> {
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
        let (kind, (to, topic)) = match r.draft.as_deref() {
            Some(d) => (kit_of(html, d), recipient(html, d)),
            None => ("step", (None, None)),
        };
        let detail = r.draft.as_deref().and_then(|d| detail_of(html, d));
        out.push(Draft { block, item, text: r.text.clone(), step: Some(r.item.clone()), kind, to, topic, detail, rank: None });
    }
    let verdict = |b: &str, i: Option<&str>| {
        notes.iter().any(|n| n.block == b && note_item(n) == i && (matches!(n.kind.as_str(), "approve" | "skip" | "send" | "drafts") || is_go_word(n)))
    };
    // a review's verb says what its items are: start (feedback an agent
    // can fix: his pick goes to main), keep (what bise keeps), open-reply
    // (read-only places: copy + open) are nothing bise sends (pm's C
    // fail 42); send and reply (mentions) are replies that leave; none:
    // items he approves, never 'replies' (plan-ok: a plan written as a
    // review read 'send these 3 replies?')
    let verb_of = |b: &str| head_of(html, b).and_then(|(h, _)| h.split("data-verb=\"").nth(1).and_then(|r| r.split('"').next()).map(String::from));
    for r in items_of(html, "review") {
        let verb = verb_of(&r.block);
        if r.done || verdict(&r.block, Some(&r.item)) || matches!(verb.as_deref(), Some("start" | "keep" | "open-reply")) {
            continue;
        }
        let (kind, to) = match verb.as_deref() {
            Some("send" | "reply") => ("reply", reply_to(&r.text)),
            _ => ("item", None),
        };
        out.push(Draft { block: r.block.clone(), item: Some(r.item.clone()), text: r.text.clone(), step: None, kind, to, topic: None, detail: None, rank: None });
    }
    // what left already: a --went block, the message an approved action posts
    let approved = |a: &str| notes.iter().any(|n| n.block == a && note_item(n).is_none() && (n.kind == "approve" || is_go_word(n)));
    let posted: Vec<String> = super::waiting::blocks_of(html, "action").into_iter().filter(|(a, _)| approved(a)).filter_map(|(a, _)| posted_by(html, &a)).collect();
    let left = |b: &str| went.iter().any(|w| w == b) || posted.iter().any(|p| p == b);
    for kit in ["email", "message"] {
        for (b, text) in super::waiting::blocks_of(html, kit) {
            if !verdict(&b, None) && !left(&b) && !of_steps.contains(&b) && draft_sendable(html, &b) {
                let (to, topic) = recipient(html, &b);
                // a message in a thread (data-open) is a reply
                let kind = match kit_word(kit) {
                    // (or its label says 'reply to …': amb-kit 97db3777)
                    "message"
                        if head_of(html, &b).is_some_and(|(h, _)| {
                            h.contains("data-open=\"") || h.split("data-to=\"").nth(1).is_some_and(|t| t.split('"').next().unwrap_or("").rsplit(" · ").next().unwrap_or("").trim().starts_with("reply to "))
                        }) =>
                    {
                        "reply"
                    }
                    k => k,
                };
                let detail = detail_of(html, &b);
                out.push(Draft { block: b, item: None, text, step: None, kind, to, topic, detail, rank: None });
            }
        }
    }
    // a change to one of his accounts (amb-kit m_6198: 'close OPS-12'):
    // his approve does it, his skip drops it; its words are data-do
    let actions = super::waiting::blocks_of(html, "action");
    let total = actions.len();
    for (i, (b, text)) in actions.into_iter().enumerate() {
        if !verdict(&b, None) && !left(&b) {
            let todo = head_of(html, &b).and_then(|(h, _)| h.split("data-do=\"").nth(1).and_then(|r| r.split('"').next()).map(String::from));
            let detail = detail_of(html, &b);
            out.push(Draft { block: b, item: None, text: todo.unwrap_or(text), step: None, kind: "action", to: None, topic: None, detail, rank: Some((i + 1, total)) });
        }
    }
    out
}

/// Account changes of a batch, counted apart (amb-kit m_6198): one: its
/// words ('close OPS-12'); 2+ whose words share the first: '2 to close';
/// else '<n> actions'. None: no action.
pub fn action_words(drafts: &[Draft]) -> Option<String> {
    let acts: Vec<&Draft> = drafts.iter().filter(|d| d.kind == "action").collect();
    let verb = |d: &Draft| d.text.split_whitespace().next().map(str::to_lowercase);
    match acts.as_slice() {
        [] => None,
        [one] => Some(one.text.clone()),
        [first, rest @ ..] if verb(first).is_some() && rest.iter().all(|d| verb(d) == verb(first)) => {
            Some(format!("{} to {}", acts.len(), verb(first).unwrap_or_default()))
        }
        _ => Some(format!("{} actions", acts.len())),
    }
}

/// The items of the fragment with an agent on them: (item id, agent).
fn item_agents(html: &str) -> Vec<(String, String)> {
    html.split("<li")
        .skip(1)
        .filter_map(|li| {
            let head = &li[..li.find('>').unwrap_or(0)];
            let get = |k: &str| head.split(&format!("{k}=\"")).nth(1).and_then(|r| r.split('"').next()).map(String::from);
            Some((get("data-id")?, get("data-agent").filter(|a| !a.is_empty())?))
        })
        .collect()
}

/// The agent on the item draft `d` answers, if any: its own review item,
/// or the item its block is named after ('r-s213', 'reply-s213' → s213).
pub fn agent_of(html: &str, d: &Draft) -> Option<String> {
    item_agents(html)
        .into_iter()
        .find(|(item, _)| d.item.as_deref() == Some(item) || d.block == *item || d.block.ends_with(&format!("-{item}")))
        .map(|(_, a)| a)
}

/// The drafts that can leave now (ambient-lead m_6168): a draft whose
/// item has an agent still at work (`busy`: working, or idle and not
/// done) waits until that agent is done and the reply is republished,
/// so 'send all' never posts a first reply while a fix is underway.
pub fn ready(html: &str, drafts: Vec<Draft>, busy: &dyn Fn(&str) -> bool) -> Vec<Draft> {
    drafts.into_iter().filter(|d| !agent_of(html, d).is_some_and(|a| busy(&a))).collect()
}

fn kit_word(kit: &str) -> &'static str {
    match kit {
        "email" => "email",
        "message" => "message",
        _ => "step",
    }
}

/// The open tag of block `id`.
/// The message or email action `a` posts: the one whose id ends like
/// its own after the first '-' (`a-pr16` → `m-pr16`), else the block
/// right before it when that is a message or an email. Pure.
pub fn posted_by(html: &str, a: &str) -> Option<String> {
    let mut sends: Vec<(String, usize)> = Vec::new();
    for kit in ["message", "email"] {
        for (b, _) in super::waiting::blocks_of(html, kit) {
            if let Some(at) = html.find(&format!("data-id=\"{b}\"")) {
                sends.push((b, at));
            }
        }
    }
    let tail = |id: &str| id.split_once('-').map(|(_, t)| t.to_string()).filter(|t| !t.is_empty());
    if let Some(t) = tail(a) {
        if let Some((b, _)) = sends.iter().find(|(b, _)| tail(b).as_deref() == Some(t.as_str())) {
            return Some(b.clone());
        }
    }
    // the block right before it: no other section between
    let at = html.find(&format!("data-id=\"{a}\""))?;
    let start = html[..at].rfind("<section")?;
    let prev = html[..start].rfind("<section")?;
    sends.into_iter().find(|(_, p)| html[..*p].rfind("<section") == Some(prev)).map(|(b, _)| b)
}

fn head_of<'a>(html: &'a str, id: &str) -> Option<(&'a str, &'a str)> {
    let at = html.find(&format!("data-id=\"{id}\""))?;
    let start = html[..at].rfind("<section")?;
    let block = &html[start..];
    let end = block.find("</section>").unwrap_or(block.len());
    let head_end = block.find('>').unwrap_or(0);
    Some((&block[..head_end], &block[..end]))
}

/// What he needs to decide on block `id` (notif-words): an email's
/// subject, else the block's first paragraph without its '3 · ' rank,
/// cut. None: nothing to say.
fn detail_of(html: &str, id: &str) -> Option<String> {
    let (head, block) = head_of(html, id)?;
    let body = &block[head.len()..];
    let field = |f: &str| body.split("<p").find(|p| p.split('>').next().is_some_and(|h| h.contains(&format!("data-field=\"{f}\""))));
    let p = match field("subject") {
        Some(p) => p,
        None => body.split("<p").skip(1).find(|p| !p.split('>').next().unwrap_or("").contains("data-field="))?,
    };
    let text = super::questions::text_of(&p[p.find('>')? + 1..p.find("</p>").unwrap_or(p.len())]);
    let text = text.trim();
    // '1 · créer …': the page's own rank, not a choice
    let text = match text.split_once(" · ") {
        Some((n, rest)) if n.chars().all(|c| c.is_ascii_digit()) => rest.trim(),
        _ => text,
    };
    Some(cut_at(text, 140)).filter(|t| !t.is_empty())
}

fn kit_of(html: &str, id: &str) -> &'static str {
    let kit = head_of(html, id).and_then(|(h, _)| h.split("data-kit=\"").nth(1).and_then(|r| r.split('"').next()).map(String::from));
    kit_word(kit.as_deref().unwrap_or(""))
}

/// Who block `id` goes to, and what about when its address says: an
/// email's To (its name, else the address before the @); a message's
/// data-to after its last ' · ' ('to Benjamin, on the proxy' → Benjamin,
/// proxy; 'reply to Benjamin in #acme-feedback (install bug)' →
/// Benjamin, install bug; '#lyon' → #lyon).
fn recipient(html: &str, id: &str) -> (Option<String>, Option<String>) {
    let Some((head, block)) = head_of(html, id) else { return (None, None) };
    if head.contains("data-kit=\"message\"") {
        let Some(to) = head.split("data-to=\"").nth(1).and_then(|r| r.split('"').next()) else { return (None, None) };
        return addressee(to.rsplit(" · ").next().unwrap_or(to));
    }
    let name = (|| {
        let p = block.split("<p").find(|p| p.split('>').next().is_some_and(|h| h.contains("data-field=\"to\"")))?;
        let text = super::questions::text_of(&p[p.find('>')? + 1..p.find("</p>").unwrap_or(p.len())]);
        let first = text.split(',').next().unwrap_or("").trim().to_string();
        let name = match first.split_once('<') {
            Some((n, _)) if !n.trim().is_empty() => n.trim().to_string(),
            _ => first.trim_matches(|c| c == '<' || c == '>').split('@').next().unwrap_or("").to_string(),
        };
        Some(name).filter(|n| !n.is_empty())
    })();
    (name, None)
}

/// A message's addressee words → (who, about what).
fn addressee(seg: &str) -> (Option<String>, Option<String>) {
    let s = seg.trim();
    let s = s.strip_prefix("reply to ").or_else(|| s.strip_prefix("to ")).unwrap_or(s);
    let (who, topic) = match (s.split_once(" ("), s.split_once(", on "), s.split_once(", ")) {
        (Some((w, t)), _, _) => (w, Some(t.trim_end_matches(')'))),
        (None, Some((w, t)), _) => (w, Some(t)),
        // 'reply to Benjamin, in French' (amb-kit 97db3777's short
        // labels): the person before the comma, no topic
        (None, None, Some((w, _))) => (w, None),
        _ => (s, None),
    };
    // 'Benjamin in #acme-feedback': the person
    let who = who.split(" in #").next().unwrap_or(who).trim();
    let topic = topic.map(|t| t.trim().trim_start_matches("the ").to_string()).filter(|t| !t.is_empty());
    (Some(who.to_string()).filter(|w| !w.is_empty()), topic)
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
/// steps, items (nothing that leaves: never 'replies'), or drafts when
/// they differ.
pub fn what(drafts: &[Draft]) -> &'static str {
    // account changes are counted apart (action_words); only them: actions
    let sends: Vec<&Draft> = drafts.iter().filter(|d| d.kind != "action").collect();
    if sends.is_empty() && !drafts.is_empty() {
        return "actions";
    }
    let first = sends.first().map_or("step", |d| d.kind);
    if sends.iter().any(|d| d.kind != first) {
        return "drafts";
    }
    match first {
        "reply" => "replies",
        "item" => "items",
        "email" => "emails",
        "message" => "messages",
        _ => "steps",
    }
}

/// The names on the card: who the drafts go to (each once, in page
/// order), else each draft's short words.
pub fn names(drafts: &[Draft]) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for n in drafts.iter().map(|d| d.to.clone().unwrap_or_else(|| short(&d.text))) {
        if !out.contains(&n) {
            out.push(n);
        }
    }
    out
}

/// What each draft is about, when every one says (one recipient's
/// drafts are told apart by it).
pub fn topics(drafts: &[Draft]) -> Vec<String> {
    drafts.iter().map(|d| d.topic.clone()).collect::<Option<Vec<_>>>().unwrap_or_default()
}

/// The card's second line (ambient m_6055, ambient-lead m_6168): one
/// recipient: '3 replies to Benjamin: proxy, fish and French'; several:
/// 'replies to legal, Lucas and Marc'; no recipients: the drafts' words.
pub fn line(drafts: &[Draft]) -> String {
    // the account changes counted apart: '4 replies to Benjamin: … · 2
    // to close' (ambient-lead m_6192)
    let others: Vec<Draft> = drafts.iter().filter(|d| d.kind != "action").cloned().collect();
    let acts = action_words(drafts);
    match (others.is_empty(), acts) {
        (true, Some(a)) => a,
        (false, Some(a)) => format!("{} · {a}", sends_line(&others)),
        (_, None) => sends_line(drafts),
    }
}

/// [`line`] for the drafts that leave (no account change).
fn sends_line(drafts: &[Draft]) -> String {
    let w = what(drafts);
    let names = names(drafts);
    let addressed = drafts.iter().all(|d| d.to.is_some());
    if !addressed {
        return and_list(&names);
    }
    let w = if w == "steps" { "drafts" } else { w };
    match (names.as_slice(), topics(drafts)) {
        // the topics read like names (ambient m_6188): 'proxy, fish and
        // French', 'proxy, fish and 2 more'
        ([who], t) if drafts.len() >= 2 && !t.is_empty() => format!("{} {w} to {who}: {}", drafts.len(), and_list(&t)),
        ([who], _) if drafts.len() >= 2 => format!("{} {w} to {who}", drafts.len()),
        _ if w == "drafts" => and_list(&names),
        _ => format!("{w} to {}", and_list(&names)),
    }
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
/// {count, title, what, names (each recipient once), topics (one per
/// draft, or none), line (the card's second line, as is)}.
pub fn info(drafts: &[Draft], title: &str) -> serde_json::Value {
    let sends: Vec<Draft> = drafts.iter().filter(|d| d.kind != "action").cloned().collect();
    serde_json::json!({"count": drafts.len(), "title": title, "what": what(drafts), "names": names(&sends),
        "topics": topics(&sends), "line": line(drafts), "actions": action_words(drafts)})
}

/// The batch in one line, for `sb page waiting` and an old notification's
/// answer: '3 drafts wait for you: 3 replies to Benjamin: proxy, …'.
pub fn summary(drafts: &[Draft]) -> String {
    format!("{} drafts wait for you: {}", drafts.len(), line(drafts))
}

/// The drafts a batch notification lists one by one; the others are
/// counted ('- and 2 more on the page').
const LISTED: usize = 3;

/// The batch notification's words, actionable with no page open
/// (notif-words, his m_25318, signed by designer m_25451): the question
/// first, one decision. Drafts to send: '<page>: send these 2 emails?',
/// a line per draft (who or where, what it says). Else the next account
/// change alone: '<page>: <its data-do>? (1 of 7, in order)', its line
/// from the page, the others named after it; they never share a
/// notification with the sends, which go first. Its options are
/// [`choices`].
pub fn batch_text(drafts: &[Draft], title: &str) -> String {
    let sends: Vec<&Draft> = drafts.iter().filter(|d| d.kind != "action").collect();
    let acts: Vec<&Draft> = drafts.iter().filter(|d| d.kind == "action").collect();
    let page = |q: String| if title.trim().is_empty() { q } else { format!("{}: {q}", title.trim()) };
    let mut out = Vec::new();
    if !sends.is_empty() {
        let w = what(&sends.iter().map(|d| (*d).clone()).collect::<Vec<_>>());
        let w = if w == "steps" { "drafts" } else { w };
        out.push(page(match (sends.len(), w) {
            // items leave nothing: he approves them (plan-ok)
            (1, "items") => "approve this item?".to_string(),
            (n, "items") => format!("approve these {n} items?"),
            (1, "replies") => "send this reply?".to_string(),
            (1, w) => format!("send this {}?", w.trim_end_matches('s')),
            (n, w) => format!("send these {n} {w}?"),
        }));
        for d in sends.iter().take(LISTED) {
            out.push(format!("- {}", draft_line(d)));
        }
        if sends.len() > LISTED {
            out.push(format!("- and {} more on the page", sends.len() - LISTED));
        }
    } else if let Some((next, rest)) = acts.split_first() {
        let rank = match next.rank {
            Some((i, n)) if n > 1 => format!(" ({i} of {n}, in order)"),
            _ => String::new(),
        };
        out.push(page(format!("{}?{rank}", next.text)));
        if let Some(d) = &next.detail {
            out.push(d.clone());
        }
        if !rest.is_empty() {
            let names: Vec<String> = rest.iter().map(|d| d.text.clone()).collect();
            out.push(format!("after it, one at a time: {}", and_list(&names)));
        }
    }
    out.join("\n")
}

/// One draft's line: who it goes to, or where it is posted ('on PR #16'),
/// and what it says.
fn draft_line(d: &Draft) -> String {
    // a drafted step says what it does; a mail or a message its subject or words
    let says = if d.step.is_some() { Some(d.text.clone()) } else { d.detail.clone() };
    let who = d.to.as_ref().map(|to| match (&d.topic, to.contains('#')) {
        // a comment in a place: 'PR #16 review' → on PR #16
        (_, true) => format!("on {}", to.trim_end_matches(" review").trim_end_matches(" reply").trim_end_matches(" comment")),
        (Some(t), false) => format!("to {to} ({t})"),
        (None, false) => format!("to {to}"),
    });
    match (who, says) {
        (Some(w), Some(s)) => format!("{w}: {}", cut_at(&s, 70)),
        (Some(w), None) => w,
        (None, Some(s)) => cut_at(&s, 80),
        (None, None) => cut_at(&d.text, 80),
    }
}

/// One way to answer a batch notification past its option 1 (review):
/// its label, and the drafts it lets leave (`Draft::key`).
#[derive(Clone, Debug, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct Choice {
    pub label: String,
    pub keys: Vec<String>,
}

/// A batch notification's options past review (notif-words): the drafts
/// that leave together ('send both', 'send all 3'), then the next account
/// change alone, labelled with its own verb ('create the env'). Account
/// changes are never sent all at once: a plan's run in order, and a
/// later one may need what an earlier one makes (main m_25339).
pub fn choices(drafts: &[Draft]) -> Vec<Choice> {
    let sends: Vec<String> = drafts.iter().filter(|d| d.kind != "action").map(Draft::key).collect();
    // one decision per notification (designer m_25451): the sends first,
    // then each change alone
    if !sends.is_empty() {
        let items = drafts.iter().filter(|d| d.kind != "action").all(|d| d.kind == "item");
        let label = if items { approve_label(sends.len()) } else { send_label(sends.len()) };
        return vec![Choice { label, keys: sends }];
    }
    drafts.iter().find(|d| d.kind == "action").map(|a| Choice { label: a.text.clone(), keys: vec![a.key()] }).into_iter().collect()
}

/// A batch's send option: 'send it' for one, 'send both' for two, 'send
/// all <n>'.
pub fn send_label(n: usize) -> String {
    match n {
        1 => "send it".into(),
        2 => "send both".into(),
        n => format!("send all {n}"),
    }
}

/// A batch of items' option (nothing leaves, plan-ok): 'approve it',
/// 'approve both', 'approve all <n>'.
pub fn approve_label(n: usize) -> String {
    send_label(n).replacen("send", "approve", 1)
}

/// The option that lets a batch's drafts go together (send or approve
/// all), never an account change.
pub fn is_all_label(label: &str) -> bool {
    label.starts_with("send ") || label.starts_with("approve ")
}

/// `t` cut to about `n` chars after a whole word, '…' glued to it
/// ('ChatGPT's…', never 'ChatGPT's pl…'; designer m_25451).
fn cut_at(t: &str, n: usize) -> String {
    let t = t.trim();
    let Some((i, _)) = t.char_indices().nth(n) else { return t.to_string() };
    let head = &t[..i];
    // the char at i starts a word: head ends on a whole one
    let whole = t[i..].starts_with(char::is_whitespace);
    let head = match (whole, head.rfind(char::is_whitespace)) {
        (true, _) => head,
        (false, Some(sp)) => &head[..sp],
        (false, None) => head,
    };
    format!("{}…", head.trim_end().trim_end_matches([',', ';', ':', '.', '·', '(']).trim_end())
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

/// A batch notification's option 1: the page, never a message. Every
/// client opens the page on it (the desktop's inbox, notif-open's act):
/// it stays first.
pub const OPEN_PAGE: &str = "open the page";

/// Words on a batch card that open its page (its option 1), never a
/// message. Only these exact words: any other words go to the asker.
pub fn is_review(reply: &str) -> bool {
    let w = reply.trim().trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase();
    // '1. open the page', as the clients send an option
    let w = w.strip_prefix("1. ").unwrap_or(&w);
    matches!(w, "1" | "review" | "voir" | "relire" | "open the page" | "open" | "ouvrir" | "ouvre la page")
}

/// What his words on a batch notification do (ambient-lead m_21516,
/// architect m_21543): review opens the page, a choice lets its drafts
/// leave (its index in [`choices`]), any other words go to the asker as
/// his message, none do nothing.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BatchAnswer<'a> {
    Review,
    Choice(usize),
    Words(&'a str),
    Empty,
}

/// His words on a batch notification with these choices, sorted: never
/// swallowed. Option n (2, 3) or its label; send words pick the sends;
/// a bare go ('yes', 'oui', 'go') only when there is one choice.
pub fn batch_answer<'a>(reply: &'a str, choices: &[Choice]) -> BatchAnswer<'a> {
    let words = reply.trim();
    let w = words.trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase();
    // '2. create the env', as the clients send an option: its number
    let n = w.split(['.', ')', ' ']).next().and_then(|n| n.parse::<usize>().ok());
    let label = |c: &Choice| {
        let l = c.label.to_lowercase();
        w == l || w.split_once(['.', ')']).is_some_and(|(_, rest)| rest.trim() == l)
    };
    if words.is_empty() {
        BatchAnswer::Empty
    } else if is_review(words) {
        BatchAnswer::Review
    } else if let Some(i) = n.filter(|n| *n >= 2 && n - 2 < choices.len()) {
        BatchAnswer::Choice(i - 2)
    } else if let Some(i) = choices.iter().position(label) {
        BatchAnswer::Choice(i)
    } else if let Some(i) = choices.iter().position(|c| is_all_label(&c.label)).filter(|_| is_send_word(&w)) {
        BatchAnswer::Choice(i)
    } else if choices.len() == 1 && matches!(w.as_str(), "yes" | "oui" | "go" | "ok" | "vas-y" | "vas y") {
        BatchAnswer::Choice(0)
    } else {
        BatchAnswer::Words(words)
    }
}

/// Send words: 'send all <n>', 'send both', send, envoie.
fn is_send_word(w: &str) -> bool {
    // 'send all 3': the count after the words
    let w = match w.rsplit_once(' ') {
        Some((head, n)) if n.chars().all(|c| c.is_ascii_digit()) => head,
        _ => w,
    };
    matches!(w, "send all" | "send both" | "send" | "send it" | "send them" | "envoie" | "envoie tout" | "envoie les" | "envoie-le" | "approve all" | "approve both" | "approve" | "approve it")
}

/// Words on an old batch notification (replaced or closed) that still
/// send the drafts waiting now: option 2 or send words, never an account
/// change (pm's C fail 43; notif-words).
pub fn is_send_all(reply: &str) -> bool {
    let w = reply.trim().trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase();
    w == "2" || is_send_word(&w) || matches!(w.as_str(), "yes" | "oui")
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
        let p = pending(PAGE, &[], &[], &[]);
        assert_eq!(p.iter().map(Draft::anchor).collect::<Vec<_>>(), vec!["s5", "s6"], "s8 waits behind his s7");
        assert_eq!(p.iter().map(Draft::key).collect::<Vec<_>>(), vec!["mail-lucas", "mail-marc"]);
        assert_eq!(batch_text(&p, "launch plan"), "launch plan: send these 2 emails?\n- to lucas: add the DNS records\n- to marc: tell Marc it's done");
        assert_eq!(summary(&p), "2 drafts wait for you: emails to lucas and marc");
        let sent = [note(json!({"id": "n1", "block": "mail-lucas", "kind": "approve", "text": "send", "status": "sent"}))];
        assert_eq!(pending(PAGE, &sent, &[], &[]).iter().map(Draft::anchor).collect::<Vec<_>>(), vec!["s6"]);
    }

    /// Replies and mails of a feedback or inbox page batch the same way;
    /// a mail with no address is not ready.
    #[test]
    fn review_items_and_mails_are_drafts_too() {
        let html = r#"<section data-kit="review" data-id="replies" data-verb="send"><ol><li data-id="r1">reply to Nina</li><li data-id="r2">reply to Marc</li></ol></section>
<section data-kit="message" data-id="slack-1" data-to="Slack · #lyon"><p>bonjour</p></section>
<section data-kit="email" data-id="mail-x"><p data-field="to">legal: address missing</p><p data-field="subject">s</p><p>x</p></section>"#;
        let skip = [note(json!({"id": "n1", "block": "replies", "item": "r2", "kind": "skip", "status": "sent"}))];
        let p = pending(html, &skip, &[], &[]);
        assert_eq!(p.iter().map(Draft::key).collect::<Vec<_>>(), vec!["replies/r1", "slack-1"]);
        assert_eq!(what(&p), "drafts", "a reply and a message: mixed");
        assert_eq!(names(&p), vec!["Nina".to_string(), "#lyon".to_string()]);
    }

    /// Law (plan-ok, Benjamin's 'send these 3 replies?' on a plan): a
    /// review with no verb holds items he approves, never replies: the
    /// card asks 'approve these 3 items?' and offers 'approve all 3';
    /// 'send' and 'replies' stay for a review of data-verb="send".
    #[test]
    fn a_review_with_no_verb_is_items_never_replies() {
        let review = |verb: &str| {
            format!(r#"<section data-kit="review" data-id="prs"{verb}><ol><li data-id="p1"><p>PR 1 · lean install</p></li><li data-id="p2"><p>PR 2 · AGENTS.md</p></li><li data-id="p3"><p>PR 3 · win32</p></li></ol></section>"#)
        };
        let p = pending(&review(""), &[], &[], &[]);
        assert_eq!(p.iter().map(|d| d.kind).collect::<Vec<_>>(), vec!["item"; 3]);
        assert_eq!(what(&p), "items");
        assert!(batch_text(&p, "lean installs").starts_with("lean installs: approve these 3 items?\n- "), "{}", batch_text(&p, "lean installs"));
        assert_eq!(choices(&p)[0].label, "approve all 3");
        assert_eq!(batch_answer("approve all 3", &choices(&p)), BatchAnswer::Choice(0));
        assert_eq!(batch_answer("approve all", &choices(&p)), BatchAnswer::Choice(0));
        let sends = pending(&review(r#" data-verb="send""#), &[], &[], &[]);
        assert_eq!((what(&sends), choices(&sends)[0].label.as_str()), ("replies", "send all 3"));
        assert!(batch_text(&sends, "t").starts_with("t: send these 3 replies?"));
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
        let p = pending(&html, &[], &[], &[]);
        assert_eq!(p.iter().map(Draft::key).collect::<Vec<_>>(), vec!["reply-s212", "reply-s213", "reply-s214"]);
        // messages in a thread (data-open) are replies
        assert_eq!(what(&p), "replies");
        assert!(carded("benjamin-bugs") && !carded("promises-2026-w40") && !carded("meeting-renewal"));
    }

    /// The feedback page of pm's C run (feedback-20261003-065637), cut.
    const FEEDBACK: &str = r#"<section data-kit="review" data-id="ready" data-verb="start"><ol>
<li data-id="s213" data-agent="fix-proxy"><p>proxy</p></li><li data-id="s212" data-agent="fix-fish"><p>fish</p></li></ol></section>
<section data-kit="message" data-id="r-s213" data-to="Slack · #acme-feedback · to Benjamin, on the proxy" data-verb="send" data-open="https://acme.slack.com/archives/C05/p1"><p>a</p></section>
<section data-kit="message" data-id="r-s212" data-to="Slack · #acme-feedback · to Benjamin, on fish" data-verb="send" data-open="https://acme.slack.com/archives/C05/p2"><p>b</p></section>
<section data-kit="review" data-id="reports" data-verb="start"><ol><li data-id="s214"><p>French</p></li></ol></section>
<section data-kit="message" data-id="r-s214" data-to="Slack · #acme-feedback · to Benjamin, on French" data-verb="send" data-open="https://acme.slack.com/archives/C05/p3"><p>c</p></section>"#;

    /// Law (ambient-lead m_6168, pm's C run): one recipient's drafts are
    /// grouped: '3 replies to Benjamin: proxy, fish and French', not the
    /// address three times; several recipients read as before.
    #[test]
    fn one_recipients_drafts_are_grouped() {
        let p = pending(FEEDBACK, &[], &[], &[]);
        assert_eq!(p.iter().map(|d| (d.to.as_deref(), d.topic.as_deref())).collect::<Vec<_>>(), vec![
            (Some("Benjamin"), Some("proxy")),
            (Some("Benjamin"), Some("fish")),
            (Some("Benjamin"), Some("French")),
        ]);
        assert_eq!(batch_text(&p, "benjamin's reports"), "benjamin's reports: send these 3 replies?\n- to Benjamin (proxy): a\n- to Benjamin (fish): b\n- to Benjamin (French): c");
        assert_eq!(line(&p), "3 replies to Benjamin: proxy, fish and French");
        assert_eq!(info(&p, "t")["names"], json!(["Benjamin"]));
        let four: Vec<Draft> = p.iter().cloned().chain([Draft { topic: Some("docs".into()), ..p[0].clone() }]).collect();
        assert_eq!(line(&four), "4 replies to Benjamin: proxy, fish and 2 more");
        // the earlier shape of address: 'reply to X in #channel (topic)'
        assert_eq!(addressee("reply to Benjamin in #acme-feedback (install bug)"), (Some("Benjamin".into()), Some("install bug".into())));
        assert_eq!(addressee("#lyon"), (Some("#lyon".into()), None));
        // amb-kit 97db3777's short labels (pm's C run 074425): one person
        assert_eq!(addressee("reply to Benjamin, in French"), (Some("Benjamin".into()), None));
        let c = r#"<section data-kit="message" data-id="r1" data-to="Slack · reply to Benjamin in #acme-feedback" data-verb="send"><p>a</p></section>
<section data-kit="message" data-id="r2" data-to="Slack · reply to Benjamin, in French" data-verb="send"><p>b</p></section>"#;
        assert_eq!(line(&pending(c, &[], &[], &[])), "2 replies to Benjamin");
    }

    /// Law (ambient-lead m_6192, amb-kit m_6198): an account change
    /// (data-kit="action", data-do) is a draft his approve does; the card
    /// counts them apart: one → its words, 2+ with one verb → '2 to
    /// close', else '<n> actions'; skipped or approved, it no longer waits.
    #[test]
    fn account_changes_are_counted_apart() {
        let act = |id: &str, todo: &str| format!(r#"<section data-kit="action" data-id="{id}" data-do="{todo}"><p>{todo} in Linear · fixed in 0.4.2</p></section>"#);
        let html = format!("{FEEDBACK}{}{}", act("a-ops12", "close OPS-12"), act("a-ops13", "close OPS-13"));
        let p = pending(&html, &[], &[], &[]);
        assert_eq!(p.iter().filter(|d| d.kind == "action").map(|d| (d.key(), d.text.clone())).collect::<Vec<_>>(), vec![
            ("a-ops12".to_string(), "close OPS-12".to_string()),
            ("a-ops13".to_string(), "close OPS-13".to_string()),
        ]);
        // one decision each (designer m_25451): the sends first, the changes never in them
        assert_eq!(batch_text(&p, "t"), "t: send these 3 replies?\n- to Benjamin (proxy): a\n- to Benjamin (fish): b\n- to Benjamin (French): c");
        assert_eq!(choices(&p), vec![Choice { label: "send all 3".into(), keys: vec!["r-s213".into(), "r-s212".into(), "r-s214".into()] }]);
        let sent: Vec<Note> = ["r-s213", "r-s212", "r-s214"].iter().map(|b| note(json!({"id": b, "block": b, "kind": "approve", "status": "sent"}))).collect();
        let changes = pending(&html, &sent, &[], &[]);
        assert_eq!(batch_text(&changes, "t"), "t: close OPS-12? (1 of 2, in order)\nclose OPS-12 in Linear · fixed in 0.4.2\nafter it, one at a time: close OPS-13");
        assert_eq!(choices(&changes), vec![Choice { label: "close OPS-12".into(), keys: vec!["a-ops12".into()] }]);
        assert_eq!(line(&p), "3 replies to Benjamin: proxy, fish and French · 2 to close");
        assert_eq!(info(&p, "t")["names"], json!(["Benjamin"]));
        assert_eq!(info(&p, "t")["actions"], json!("2 to close"));
        assert_eq!(what(&p), "replies");
        let one = format!("{}{}", act("a-ops12", "close OPS-12"), act("a-x", "archive the old board"));
        assert_eq!(line(&pending(&one, &[], &[], &[])), "2 actions");
        let skipped = [note(json!({"id": "n1", "block": "a-x", "kind": "skip", "status": "sent"}))];
        let left = pending(&one, &skipped, &[], &[]);
        assert_eq!((line(&left), what(&left)), ("close OPS-12".to_string(), "actions"));
    }

    /// Law (ambient-lead m_6168): a draft whose item has an agent still at
    /// work (working, or idle and not done) does not wait yet: out of the
    /// batch and of sb page waiting; the agent done, it waits again.
    #[test]
    fn a_draft_waits_for_its_items_agent() {
        let p = pending(FEEDBACK, &[], &[], &[]);
        assert_eq!(agent_of(FEEDBACK, &p[0]).as_deref(), Some("fix-proxy"));
        assert_eq!(agent_of(FEEDBACK, &p[2]), None);
        let fixing = |a: &str| a == "fix-proxy";
        assert_eq!(ready(FEEDBACK, p.clone(), &fixing).iter().map(Draft::key).collect::<Vec<_>>(), vec!["r-s212", "r-s214"]);
        assert_eq!(ready(FEEDBACK, p.clone(), &|_| false).len(), 3);
        let lines = |busy: &dyn Fn(&str) -> bool| super::super::waiting::of_page("fb", FEEDBACK, &[], &[], &[], busy).iter().map(|w| w.line()).collect::<Vec<_>>();
        assert_eq!(lines(&|a| a.starts_with("fix-")), vec!["fb#r-s214 · draft · c"]);
        assert_eq!(lines(&|_| false), vec!["fb#r-s213 · draft · 3 drafts wait for you: 3 replies to Benjamin: proxy, fish and French"]);
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
        // review is only its own words: any other words are his message
        // to the asker (ambient-lead m_21516: 'Ou sont les drafts?' was lost)
        for r in ["1", "1.", "Review", "voir"] {
            assert!(is_review(r), "{r}");
        }
        for w in ["Ou sont les drafts?", "review them later", "revoir le titre", "voir plus tard", "2", "send all", ""] {
            assert!(!is_review(w), "{w}");
        }
        // each path of his words (architect m_21543): review, a choice, words, empty
        let send = [Choice { label: "send both".into(), keys: vec!["a".into(), "b".into()] }];
        assert_eq!(batch_answer(" 1. ", &send), BatchAnswer::Review);
        assert_eq!(batch_answer("relire", &send), BatchAnswer::Review);
        for yes in ["2", "2.", "2. send both", "send both", "Send all", "send", "envoie", "yes", "Oui"] {
            assert_eq!(batch_answer(yes, &send), BatchAnswer::Choice(0), "{yes}");
        }
        assert_eq!(batch_answer("3", &send), BatchAnswer::Words("3"), "no option 3");
        assert_eq!(batch_answer("  Ou sont les drafts? ", &send), BatchAnswer::Words("Ou sont les drafts?"));
        assert_eq!(batch_answer("revoir le titre", &send), BatchAnswer::Words("revoir le titre"), "a note, never a review");
        assert_eq!(batch_answer(" \n ", &send), BatchAnswer::Empty);
        // sends and a change: each by its number or its words; a bare yes is no choice
        let two = [send[0].clone(), Choice { label: "close OPS-12".into(), keys: vec!["c".into()] }];
        assert_eq!(batch_answer("3. close OPS-12", &two), BatchAnswer::Choice(1));
        assert_eq!(batch_answer("Close OPS-12", &two), BatchAnswer::Choice(1));
        assert_eq!(batch_answer("send all", &two), BatchAnswer::Choice(0));
        assert_eq!(batch_answer("yes", &two), BatchAnswer::Words("yes"));
        // a change alone: 'send all' sends nothing (it goes to the asker)
        let change = [two[1].clone()];
        assert_eq!(batch_answer("send all 7", &change), BatchAnswer::Words("send all 7"));
        assert_eq!(batch_answer("go", &change), BatchAnswer::Choice(0));
        assert_eq!((send_label(1), send_label(2), send_label(3)), ("send it".to_string(), "send both".to_string(), "send all 3".to_string()));
        let s = |n: &[&str]| n.iter().map(|x| x.to_string()).collect::<Vec<_>>();
        assert_eq!(and_list(&s(&["legal", "Lucas", "Marc"])), "legal, Lucas and Marc");
        assert_eq!(and_list(&s(&["legal", "Lucas", "Marc", "Nina", "Ana", "Tom"])), "legal, Lucas and 4 more");
        let reply = |to: &str| Draft { block: "r".into(), item: Some(to.into()), text: format!("reply to {to}"), step: None, kind: "reply", to: Some(to.into()), topic: None, detail: Some(format!("hi {to}, yes for Friday")), rank: None };
        let four = [reply("legal"), reply("Lucas"), reply("Marc"), reply("Nina")];
        assert_eq!(batch_text(&four, "inbox"), "inbox: send these 4 replies?\n- to legal: hi legal, yes for Friday\n- to Lucas: hi Lucas, yes for Friday\n- to Marc: hi Marc, yes for Friday\n- and 1 more on the page");
        let three = &four[..3];
        assert_eq!(info(three, "inbox"), json!({"count": 3, "title": "inbox", "what": "replies", "names": ["legal", "Lucas", "Marc"],
            "topics": [], "line": "replies to legal, Lucas and Marc", "actions": null}));
        let step = super::super::checklist::Step { text: batch_text(three, "inbox"), batch: vec!["a".into(), "b".into(), "c".into()], choices: choices(three), ..Default::default() };
        assert_eq!(step.card_text(), "inbox: send these 3 replies?\n- to legal: hi legal, yes for Friday\n- to Lucas: hi Lucas, yes for Friday\n- to Marc: hi Marc, yes for Friday\n1. open the page\n2. send all 3");
        // a comment in a place reads 'on' it; a long line is cut after a whole word
        let on = Draft { to: Some("PR #16 review".into()), detail: Some("Thanks a lot Eric, you found the real cause: on the ChatGPT plan route, ChatGPT's plan".into()), ..four[0].clone() };
        assert_eq!(draft_line(&on), "on PR #16: Thanks a lot Eric, you found the real cause: on the ChatGPT plan…");
        assert_eq!((cut_at("one two three", 9), cut_at("one two three", 7), cut_at("one two, three", 8)), ("one two…".to_string(), "one two…".to_string(), "one two…".to_string()));
        assert!(is_review("1. open the page") && is_review("open the page") && !is_review("open it later"));
        // a card saved before its choices: one send of all it holds
        let old = super::super::checklist::Step { text: "t".into(), batch: vec!["a".into(), "b".into()], ..Default::default() };
        assert_eq!(old.card_text(), "t\n1. open the page\n2. send both");
        // steps with no recipient: their words alone
        let p = pending(PAGE, &[], &[], &[]);
        let bare: Vec<Draft> = p.into_iter().map(|d| Draft { to: None, kind: "step", ..d }).collect();
        assert_eq!(batch_text(&bare, ""), "send these 2 drafts?\n- add the DNS records\n- tell Marc it's done");
    }

    /// Law (notif-words, his #549: '7 drafts wait for you · distribuer
    /// bise desktop / 7 actions / 1. review 2. send all 7'): a plan's
    /// account changes are never sent all at once; the notification names
    /// the next one with its own line from the page, its option is that
    /// change alone, and the next one comes once it is approved.
    #[test]
    fn a_plans_changes_go_one_at_a_time() {
        let act = |id: &str, n: usize, todo: &str, line: &str| format!(r#"<section data-kit="action" data-id="{id}" data-do="{todo}"><p>{n} · {line}</p></section>"#);
        let html = [
            act("a-env", 1, "create the desktop-release env", "the GitHub env desktop-release: you as required reviewer, desktop-v* tags and main only."),
            act("a-secrets", 2, "set the 6 GitHub secrets", "gh secret set --env desktop-release for the cert, its password and the API key."),
            act("a-var", 3, "turn DESKTOP_RELEASE on", "the variable DESKTOP_RELEASE=on."),
        ]
        .concat();
        let p = pending(&html, &[], &[], &[]);
        assert_eq!(
            batch_text(&p, "distribuer bise desktop"),
            "distribuer bise desktop: create the desktop-release env? (1 of 3, in order)\nthe GitHub env desktop-release: you as required reviewer, desktop-v* tags and main only.\nafter it, one at a time: set the 6 GitHub secrets and turn DESKTOP_RELEASE on"
        );
        assert_eq!(choices(&p), vec![Choice { label: "create the desktop-release env".into(), keys: vec!["a-env".into()] }]);
        assert!(!is_send_all("create the desktop-release env"));
        // approved: the next one is next, the words follow
        let ok = [note(json!({"id": "n1", "block": "a-env", "kind": "approve", "text": "send", "status": "sent"}))];
        let left = pending(&html, &ok, &[], &[]);
        assert_eq!(choices(&left)[0].keys, vec!["a-secrets".to_string()]);
        assert!(batch_text(&left, "d").starts_with("d: set the 6 GitHub secrets? (2 of 3, in order)\n"));
        let last = pending(&html, &[ok[0].clone(), note(json!({"id": "n2", "block": "a-secrets", "kind": "approve", "status": "sent"}))], &[], &[]);
        assert_eq!(batch_text(&last, "d"), "d: turn DESKTOP_RELEASE on? (3 of 3, in order)\nthe variable DESKTOP_RELEASE=on.");
    }

    /// Law (issue-15, main m_24663): a message posted elsewhere leaves
    /// the batch: a block its page's --went names, or the message an
    /// approved action posts (`a-pr16` → `m-pr16`, else the block right
    /// before it), with that action; an action not approved keeps both.
    #[test]
    fn posted_drafts_leave_the_batch() {
        let html = r#"<section data-kit="message" data-id="m-pr16" data-to="GitHub · PR #16 review" data-open="https://x.test/pull/16"><p>thanks</p></section>
<section data-kit="action" data-id="a-pr16" data-do="post the review, close #16"><p>post it</p></section>
<section data-kit="message" data-id="m-issue15" data-to="GitHub · issue #15 reply" data-open="https://x.test/issues/15"><p>fixed</p></section>
<section data-kit="action" data-id="post-it" data-do="post the reply on #15"><p>post it</p></section>"#;
        let keys = |p: Vec<Draft>| p.iter().map(Draft::key).collect::<Vec<_>>();
        assert_eq!(keys(pending(html, &[], &[], &[])), vec!["m-pr16", "m-issue15", "a-pr16", "post-it"]);
        assert_eq!((posted_by(html, "a-pr16").as_deref(), posted_by(html, "post-it").as_deref()), (Some("m-pr16"), Some("m-issue15")));
        // --went names the messages: they left, their actions too
        let went = vec!["m-pr16".to_string(), "m-issue15".to_string(), "a-pr16".to_string(), "post-it".to_string()];
        assert!(pending(html, &[], &[], &went).is_empty());
        assert_eq!(keys(pending(html, &[], &[], &went[..1])), vec!["m-issue15", "a-pr16", "post-it"]);
        // his approves on the actions: each takes its message with it
        let ok = |b: &str| note(json!({"id": b, "block": b, "kind": "approve", "text": "post", "status": "done"}));
        assert_eq!(keys(pending(html, &[ok("a-pr16")], &[], &[])), vec!["m-issue15", "post-it"]);
        assert!(pending(html, &[ok("a-pr16"), ok("post-it")], &[], &[]).is_empty());
        // a skip is no post: the message still waits
        let skip = note(json!({"id": "s", "block": "a-pr16", "kind": "skip", "status": "sent"}));
        assert_eq!(keys(pending(html, &[skip], &[], &[])), vec!["m-pr16", "m-issue15", "post-it"]);
    }
}
