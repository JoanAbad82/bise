//! Where his words go while an item is open (his pick A on page
//! composer-target, designer m_26531; the desktop's inbox/Block.tsx
//! `answeringOf`, one rule in both apps): a question his words answer
//! turns the divider into `├─ ↳ answering search · which size system…
//! ─── esc to main instead ─┤` in the accent and the composer's bar into
//! the item's own heavy accent `┃`, so the rail runs from the question
//! down into what he types. An approval, a choice, a closed question or
//! an item with keys of its own keep the plain divider and bar: words
//! never approve. The pure parts (`question_cut`, `fit`) are tested here;
//! chrome.rs draws the divider, ui.rs the bar.

use super::cards::{shape, Enter};
use super::*;
use unicode_width::UnicodeWidthStr;

/// The question in the label: cut after a whole word within this many
/// characters (the desktop's `cutWords(question, 40)`).
const QUESTION_MAX: usize = 40;

/// The open item his words answer: who asked, its question on one line,
/// and whom esc gives his words to instead (the thread he is in).
#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct Answering {
    pub(crate) who: String,
    pub(crate) question: String,
    pub(crate) esc_to: String,
}

/// The item open in place (or full screen) whose question his words
/// answer, else None (nothing open, an approval, a choice, a closed one).
pub(crate) fn answering(app: &App) -> Option<Answering> {
    if !super::item_open(app) || app.sb.closed_in_view().is_some() {
        return None;
    }
    let c = app.sb.current_card()?;
    let s = shape(c);
    (s.enter == Enter::Answer && s.words && s.keys.is_empty()).then(|| Answering {
        who: c.agent.clone(),
        question: question_cut(&s.summary, QUESTION_MAX),
        esc_to: app.sb.focus.clone(),
    })
}

/// The composer's bar while his words answer: the item's heavy `┃` in
/// the accent (ASCII: `|`), then the lead's blanks. None: the plain bar.
pub(crate) fn bar(app: &App, lead: u16) -> Option<Span<'static>> {
    answering(app)?;
    let g = if theme::ascii_mode() { "|" } else { "┃" };
    Some(Span::styled(format!("{}{}", g, " ".repeat(lead.saturating_sub(1) as usize)), Style::default().fg(theme::accent())))
}

/// The empty composer's words while his words answer (the desktop's
/// `placeholder`, designer m_26765): `your answer to search, then ⏎`.
/// None: the usual placeholder.
pub(crate) fn placeholder(app: &App) -> Option<String> {
    answering(app).map(|a| format!("your answer to {}, then {}", if a.who == "main" { "bise" } else { &a.who }, if theme::ascii_mode() { "enter" } else { "⏎" }))
}

/// The divider's two sides while his words answer, in `room` columns
/// (from the label's start to the right side's end): the label
/// ` ↳ answering search · which size… ` in the accent, the end
/// ` esc to main instead ` dim; a fresh `note` (a drag's `copied 9
/// chars`, 2 s) takes the end's place as ` ✓ copied 9 chars `, then the
/// end comes back. None: the plain divider.
pub(crate) fn divider(app: &App, room: usize, note: Option<String>) -> Option<(Vec<Span<'static>>, Vec<Span<'static>>)> {
    let a = answering(app)?;
    let tick = if theme::ascii_mode() { "v" } else { "✓" };
    let end = match &note {
        Some(n) => format!("{} {}", tick, n),
        None => format!("esc to {} instead", a.esc_to),
    };
    let (label, end) = fit(&a, &end, room);
    let acc = Style::default().fg(theme::accent());
    let left = vec![Span::styled(format!(" {} ", label), acc)];
    let right = match (end, note) {
        (Some(_), Some(n)) => vec![Span::styled(format!(" {} ", tick), acc), Span::styled(n, Style::default().fg(theme::text())), Span::raw(" ")],
        (Some(e), None) => vec![Span::styled(format!(" {} ", e), Style::default().fg(theme::dim()))],
        (None, _) => Vec::new(),
    };
    Some((left, right))
}

/// `↳ answering search` (ASCII: `-> answering search`): never cut.
pub(crate) fn head(who: &str) -> String {
    format!("{} answering {}", if theme::ascii_mode() { "->" } else { "↳" }, who)
}

/// A question on one line, cut after a whole word within `max`
/// characters with one `…` (never mid-word; a first word longer than
/// `max`: cut there). Pure.
pub(crate) fn question_cut(s: &str, max: usize) -> String {
    let one = s.split_whitespace().collect::<Vec<_>>().join(" ");
    if one.chars().count() <= max {
        return one;
    }
    let ell = theme::ellipsis();
    let mut head = String::new();
    for w in one.split(' ') {
        let next = if head.is_empty() { w.to_string() } else { format!("{} {}", head, w) };
        if next.chars().count() > max - 1 {
            break;
        }
        head = next;
    }
    let head = head.trim_end_matches(|c: char| c.is_whitespace() || "·,:;".contains(c));
    if head.is_empty() {
        let cut: String = one.chars().take(max - 1).collect();
        return format!("{}{}", cut.trim_end(), ell);
    }
    format!("{}{}", head, ell)
}

/// The label and the end in `room` columns (the label's blank on each
/// side, the end's too, 3 rule cells between them at least): both whole
/// when they fit; short, the question goes first, word by word down to
/// `↳ answering search…`, then the end; the head never goes. `end`:
/// `esc to main instead`, or a fresh note. Pure.
pub(crate) fn fit(a: &Answering, end: &str, room: usize) -> (String, Option<String>) {
    let head = head(&a.who);
    let full = if a.question.is_empty() { head.clone() } else { format!("{} · {}", head, a.question) };
    let end = end.to_string();
    let ell = theme::ellipsis();
    // the label's words, longest first: the whole, then cut after each word, then the head alone
    let mut tries = vec![full.clone()];
    let words: Vec<&str> = a.question.split(' ').filter(|w| !w.is_empty()).collect();
    for n in (1..words.len()).rev() {
        let q = words[..n].join(" ");
        let q = q.trim_end_matches(|c: char| "·,:;…".contains(c) || c.is_whitespace());
        if !q.is_empty() {
            tries.push(format!("{} · {}{}", head, q, ell));
        }
    }
    tries.push(format!("{}{}", head, ell));
    let label_w = |l: &str| l.width() + 2;
    let end_w = end.width() + 2 + 3;
    if let Some(l) = tries.iter().find(|l| label_w(l) + end_w <= room) {
        return (l.clone(), Some(end));
    }
    match tries.iter().find(|l| label_w(l) <= room) {
        Some(l) => (l.clone(), None),
        None => (head, None),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn a() -> Answering {
        Answering { who: "search".into(), question: question_cut("which size system should the filter use: EU, or US too?", QUESTION_MAX), esc_to: "main".into() }
    }

    #[test]
    fn the_question_is_cut_after_a_whole_word() {
        assert_eq!(question_cut("which size system should the filter use: EU, or US too?", 40), "which size system should the filter…");
        assert_eq!(question_cut("merge  gift-cards\ninto main?", 40), "merge gift-cards into main?");
        assert_eq!(question_cut(&"a".repeat(80), 40), format!("{}…", "a".repeat(39)));
    }

    #[test]
    fn both_whole_when_they_fit() {
        let (l, e) = fit(&a(), END, 120);
        assert_eq!(l, "↳ answering search · which size system should the filter…");
        assert_eq!(e.as_deref(), Some("esc to main instead"));
    }

    #[test]
    fn the_question_goes_first_then_the_end_never_the_head() {
        // 80 columns framed: the label's room is about 74
        let (l, e) = fit(&a(), END, 74);
        assert_eq!(e.as_deref(), Some("esc to main instead"), "{l}");
        assert!(l.starts_with("↳ answering search · which size system"), "{l}");
        assert!(l.ends_with('…'));
        let (l, e) = fit(&a(), END, 46);
        assert_eq!((l.as_str(), e.as_deref()), ("↳ answering search…", Some("esc to main instead")));
        let (l, e) = fit(&a(), END, 40);
        assert_eq!((l.as_str(), e), ("↳ answering search · which size…", None));
        let (l, e) = fit(&a(), END, 12);
        assert_eq!((l.as_str(), e), ("↳ answering search", None));
    }

    #[test]
    fn a_fresh_note_takes_the_ends_place() {
        let (l, e) = fit(&a(), "✓ copied 9 chars", 74);
        assert_eq!(e.as_deref(), Some("✓ copied 9 chars"), "{l}");
        assert!(l.starts_with("↳ answering search · which size system"), "{l}");
    }

    const END: &str = "esc to main instead";
}
