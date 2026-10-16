//! A card linked to a page (notif-artifact, designer m_26560): a page's
//! question or drawn pick, or `sb notify --page`. The item carries its
//! page as a line under what it asks (`↗ <title> · page · v4   ctrl+t
//! open in your browser`), the asker's own pick (`my pick`) at its
//! option's end, and says who reads typed words (`or type: designer
//! reads it`); ctrl+t or a click on the line opens the page in the
//! browser at its block (the terminal opens no page beside; no bare
//! letter takes an empty composer, designer m_26776). Nothing is sent,
//! the item stays.

use super::super::card_draw::{fg, Drawn};
use super::{cut, Card, CardHit, Enter, Shape};
use crate::theme;
use crate::App;
use bise_proto::words::inbox;
use ratatui::style::Style;
use ratatui::text::{Line, Span};
use unicode_width::UnicodeWidthStr;

/// What links a card to its page, from the hub's row.
#[derive(Clone, Debug, PartialEq)]
pub(crate) struct PageLink {
    pub(crate) page: bise_proto::rows::CardPage,
    /// the options (their numbers) the asking agent marked as its own pick
    pub(crate) mine: Vec<u32>,
}

impl PageLink {
    /// The hub row's page and its options' `mine`; none without a page.
    pub(crate) fn of(c: &bise_proto::rows::Card) -> Option<Box<PageLink>> {
        let page = c.page.clone()?;
        Some(Box::new(PageLink { page, mine: c.options.iter().filter(|o| o.mine).map(|o| o.n).collect() }))
    }
}

/// The options (by index) the asker marked `my pick`.
pub(in crate::sb) fn page_mine(c: &Card, s: &Shape) -> Vec<usize> {
    let Some(l) = &c.page else { return Vec::new() };
    (0..s.options.len()).filter(|&i| l.mine.contains(&(s.num(i) as u32))).collect()
}

/// Its page's chip in words: `↗ <title> · page · v4` (an older hub: the id).
pub(crate) fn chip_words(p: &bise_proto::rows::CardPage) -> String {
    let title = p.title.as_deref().unwrap_or(&p.id);
    match p.v {
        Some(v) => inbox::page_chip_v(title, v),
        None => inbox::page_chip(title),
    }
}

/// The page's line under what it asks, `w` columns: the chip's words in
/// text, `ctrl+t open in your browser` when it fits; the line opens it too.
pub(in crate::sb) fn page_link_line(c: &Card, w: usize) -> Option<Drawn> {
    let p = &c.page.as_ref()?.page;
    let key = format!("   ctrl+t {}", inbox::key_open_browser);
    // the key only beside the whole chip; narrower, the chip alone, cut
    let whole = chip_words(p);
    let fits = whole.width() + key.width() <= w;
    let chip = if fits { whole } else { cut(&whole, w.max(1)) };
    let mut spans = vec![Span::styled(chip.clone(), fg(theme::text()))];
    if fits {
        spans.push(Span::styled("   ", Style::default()));
        spans.push(Span::styled("ctrl+t", fg(theme::text())));
        spans.push(Span::styled(format!(" {}", inbox::key_open_browser), fg(theme::dim())));
    }
    let wd = chip.width() + if fits { key.width() } else { 0 };
    Some(Drawn { line: Line::from(spans), hits: vec![(0, wd, CardHit::Page(c.id))], item: false })
}

/// The title of a card of any other kind: a plan an agent proposes is
/// that agent's (plan-ok, `lean-install proposes a plan`); the rest ask.
pub(in crate::sb) fn other_title(kind: &str, agent: &str) -> String {
    if kind == "plan" {
        return inbox::title_plan(agent);
    }
    inbox::title_asks(agent)
}

/// A linked card's hint under its options: who reads typed words (`or
/// type: designer reads it`; a plan's: `or type what to change:
/// lean-install reads it`, plan-ok); none for any other card.
pub(in crate::sb) fn page_hint(c: &Card, s: &Shape) -> Option<String> {
    if s.enter != Enter::Answer || !s.words {
        return None;
    }
    if c.kind == "plan" {
        return Some(inbox::type_plan(&c.agent));
    }
    c.page.as_ref()?;
    // the terminal calls main main (designer m_26776)
    Some(if s.options.is_empty() { inbox::type_reads(&c.agent) } else { inbox::or_type_reads(&c.agent) })
}

/// The fold of his pick on a page's drawn pick (`B · one frame`): `you
/// picked B`, the thread's row word for word (bise-proto
/// words::page_answer); none for any other answer.
pub(in crate::sb) fn picked_fold(c: &Card, reply: &str) -> Option<String> {
    c.page.as_ref()?;
    let name = reply.split_once(" · ").map(|(k, _)| k.trim()).filter(|k| !k.is_empty() && k.width() <= 12)?;
    Some(inbox::picked(name))
}

/// Card `id`'s page in the browser at its block; false: no linked page.
pub(in crate::sb) fn open_page(app: &mut App, id: u64) -> bool {
    let Some(url) = app.sb.card_by_id(id).and_then(|c| c.page.as_ref()).map(|l| l.page.url.clone()) else { return false };
    crate::links::open(&url);
    true
}

/// The page title of each card linked to one, by card id (the cards'
/// view state, CardView), kept once it closes: its thread line stays one
/// line. Filled from the hub's state; after a TUI restart a card closed
/// before it is not there, and its line draws whole (the fix: the
/// thread's entry carrying its page).
pub(in crate::sb) type PageTitles = std::collections::HashMap<u64, String>;

/// Keeps in `linked` the page title of each card linked to one; true
/// when one is new or changed.
pub(in crate::sb) fn remember_pages(linked: &mut PageTitles, cards: &[Card]) -> bool {
    let mut new = false;
    for c in cards {
        if let Some(l) = &c.page {
            let t = l.page.title.clone().unwrap_or_else(|| l.page.id.clone());
            new |= linked.insert(c.id, t.clone()).as_ref() != Some(&t);
        }
    }
    new
}

/// The feed's cards learn their page from `linked`: the thread draws one
/// linked to a page as one line, `? main asks: <question> ↗ <title>`
/// (render.rs card_lines, designer m_26776); the rows of a card that
/// changed draw again.
pub(in crate::sb) fn link_feed(app: &mut App) {
    if app.sb.card.linked.is_empty() {
        return;
    }
    for (i, ev) in app.events.iter_mut().enumerate() {
        let crate::wire::Ev::Card { card, .. } = ev else { continue };
        let page = card.id.and_then(|id| app.sb.card.linked.get(&id)).cloned();
        if page.is_some() && card.page != page {
            card.page = page;
            if let Some(c) = app.cache.get_mut(i) {
                *c = None;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn linked(title: Option<&str>) -> Card {
        let page = bise_proto::rows::CardPage { id: "notif-artifact".into(), url: "http://127.0.0.1:1/p/notif-artifact#look".into(), block: Some("look".into()), item: None, title: title.map(String::from), v: Some(4) };
        Card { id: 7, kind: "question".into(), agent: "designer".into(), text: "which composer look?\n1. A · pink\n2. B · frame".into(), page: Some(Box::new(PageLink { page, mine: vec![1] })), ..Card::default() }
    }

    /// notif-artifact: the line, the asker's pick, who reads typed words.
    #[test]
    fn a_linked_card_names_its_page_its_askers_pick_and_who_reads() {
        let c = linked(Some("where does my answer go"));
        let s = super::super::shape(&c);
        let text = |d: &Drawn| d.line.spans.iter().map(|s| s.content.as_ref()).collect::<String>();
        assert_eq!(text(&page_link_line(&c, 76).unwrap()), "↗ where does my answer go · page · v4   ctrl+t open in your browser");
        // narrow: the chip alone, cut
        assert_eq!(text(&page_link_line(&c, 30).unwrap()), cut("↗ where does my answer go · page · v4", 30));
        assert_eq!(chip_words(&linked(None).page.unwrap().page), "↗ notif-artifact · page · v4");
        assert_eq!(page_mine(&c, &s), vec![0]);
        assert_eq!(page_hint(&c, &s).as_deref(), Some("or type: designer reads it"));
        assert_eq!(picked_fold(&c, "B · frame").as_deref(), Some("you picked B"));
        assert_eq!(picked_fold(&c, "post now"), None);
        let mut linked = std::collections::HashMap::new();
        assert!(remember_pages(&mut linked, std::slice::from_ref(&c)) && !remember_pages(&mut linked, std::slice::from_ref(&c)));
        assert_eq!(linked.get(&7).map(String::as_str), Some("where does my answer go"));
        let plain = Card { page: None, ..c };
        assert!(page_link_line(&plain, 76).is_none() && page_mine(&plain, &s).is_empty() && page_hint(&plain, &s).is_none() && picked_fold(&plain, "B · frame").is_none());
    }

    /// plan-ok: a plan's card is its agent's, and typing changes the plan.
    #[test]
    fn a_plan_is_proposed_and_typing_changes_it() {
        let c = Card { kind: "plan".into(), agent: "lean-install".into(), ..linked(Some("lean installs")) };
        assert_eq!(other_title("plan", "lean-install"), "lean-install proposes a plan");
        assert_eq!(other_title("merge", "lean-install"), "lean-install asks");
        let s = super::super::shape(&c);
        assert_eq!(page_hint(&c, &s).as_deref(), Some("or type what to change: lean-install reads it"));
    }
}
