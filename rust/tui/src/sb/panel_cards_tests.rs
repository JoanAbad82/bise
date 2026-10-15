//! BISE-125: the open cards in the panel, under the agents.
use super::super::bench;
use super::*;
use crossterm::event::{KeyModifiers, MouseButton, MouseEvent, MouseEventKind};
use ratatui::{backend::TestBackend, Terminal};

fn card(id: u64, kind: &str, agent: &str, text: &str) -> Card {
    Card { id, kind: kind.into(), agent: agent.into(), text: text.into(), ..Card::default() }
}

/// main, two agents, three open cards (ids 12, 153, 40).
fn app() -> App {
    let mut app = bench::test_app_drained();
    let sb = &mut app.sb;
    sb.agents.push(Agent { name: "main".into(), main: true, status: "idle".into(), ..Agent::default() });
    sb.agents.push(Agent { name: "debt-solo".into(), status: "done".into(), ..Agent::default() });
    sb.agents.push(Agent { name: "docs".into(), status: "working".into(), ..Agent::default() });
    sb.cards.push(card(12, "question", "docs", "\nv1 or v2?\n1. v1\n2. v2"));
    sb.cards.push(card(153, "done", "debt-solo", "the debt list is cleared, 14 items closed and two left for later"));
    sb.cards.push(card(40, "blocked", "docs", "no access to the wiki"));
    app
}

fn rows(app: &App, w: u16, h: u16) -> Vec<String> {
    let mut term = Terminal::new(TestBackend::new(w, h)).unwrap();
    term.draw(|f| draw_panel(app, f, f.area())).unwrap();
    let buf = term.backend().buffer();
    buf.content
        .chunks(w as usize)
        .map(|r| r.iter().map(|c| c.symbol()).collect::<String>().trim_end().to_string())
        .collect()
}

/// Under the agents: a blank row, `inbox`, then one row per card in
/// the strip's order with its number (BISE-302: ctrl+N opens the row
/// that says N), `N glyph agent  first line`; the text cut to the
/// panel with `…`, never past its width.
#[test]
fn the_open_cards_list_under_the_agents() {
    let app = app();
    let t = rows(&app, 40, 14);
    let at = |s: &str| t.iter().position(|r| r.contains(s)).unwrap_or_else(|| panic!("{s} missing:\n{}", t.join("\n")));
    let title = t.iter().position(|r| r == " inbox").unwrap_or_else(|| panic!("{}", t.join("\n")));
    assert!(at("docs") < title, "{}", t.join("\n"));
    assert_eq!(t[title - 1], "");
    let first = title + 1;
    // the first line of the text, not the blank one before it
    assert_eq!(t[first], format!(" 1 {} docs  v1 or v2?", G_NEEDS_YOU));
    assert_eq!(t[first + 1], format!(" 2 {} docs  no access to the wiki", G_NEEDS_YOU));
    assert_eq!(t[first + 2], format!(" 3 {} debt-solo  the debt list is clear…", crate::theme::done_glyph()));
    // 28 columns: still one row each, cut at the width
    for w in [28u16, 24] {
        let t = rows(&app, w, 14);
        let r = t.iter().find(|r| r.starts_with(" 3 ")).unwrap_or_else(|| panic!("{}", t.join("\n")));
        assert!(r.chars().count() < w as usize, "{r:?} at {w}");
        assert!(r.contains("debt-solo") && r.ends_with('…'), "{r:?} at {w}");
    }
    // a long agent name is cut too, a few columns of text kept
    let mut app = app;
    app.sb.cards.push(card(200, "question", "a-very-long-agent-name-indeed", "which one?"));
    let t = rows(&app, 28, 14);
    let r = t.iter().find(|r| r.contains(" 2 ? a-very")).unwrap_or_else(|| panic!("{}", t.join("\n")));
    assert!(r.contains("…  wh"), "{r:?}");
    assert!(r.chars().count() < 28);
    // colors: the number dim, the glyph in its kind's color, the text dim
    let mut term = Terminal::new(TestBackend::new(40, 14)).unwrap();
    term.draw(|f| draw_panel(&app, f, f.area())).unwrap();
    let t = rows(&app, 40, 14);
    let y = t.iter().position(|r| r.contains("no access")).unwrap() as u16;
    let buf = term.backend().buffer();
    assert_eq!(buf.cell((1, y)).unwrap().fg, dim());
    assert_eq!(buf.cell((3, y)).unwrap().fg, accent(), "blocked: needs you, accent");
    assert_eq!(buf.cell((5, y)).unwrap().fg, text());
    assert_eq!(buf.cell((11, y)).unwrap().fg, dim());
    // no card: no section
    app.sb.cards.clear();
    assert!(!rows(&app, 40, 14).iter().any(|r| r == " inbox"));
}

/// Many cards: the panel ends with `+ n more`; the card in the box
/// is on the selection color and scrolled into view.
#[test]
fn many_cards_end_with_more_and_the_shown_one_stays_in_view() {
    let mut app = app();
    for i in 0..30 {
        app.sb.cards.push(card(1000 + i, "done", "debt-solo", &format!("report {i}")));
    }
    let t = rows(&app, 28, 14);
    assert!(t[13].starts_with(" ↓ ") && t[13].ends_with(" more"), "{}", t.join("\n"));
    // 33 cards; title, blank, 3 agents, blank, cards title, 6 cards: 27 below
    assert_eq!(t[13], " ↓ 27 more", "{}", t.join("\n"));
    assert!(t.iter().any(|r| r.starts_with(" 1 ? docs  v1")), "the strip's order: {}", t.join("\n"));
    // a card far down shown in the box: the panel scrolls to it
    super::super::cards::open_view(&mut app, Some(1029));
    let t = rows(&app, 28, 14);
    assert!(t.iter().any(|r| r.contains("report 29")), "{}", t.join("\n"));
    let mut term = Terminal::new(TestBackend::new(28, 14)).unwrap();
    term.draw(|f| draw_panel(&app, f, f.area())).unwrap();
    let y = t.iter().position(|r| r.contains("report 29")).unwrap() as u16;
    assert_eq!(term.backend().buffer().cell((20, y)).unwrap().bg, selection_bg());
}

fn click(app: &mut App, column: u16, row: u16) -> bool {
    let m = MouseEvent { kind: MouseEventKind::Down(MouseButton::Left), column, row, modifiers: KeyModifiers::NONE };
    panel_mouse(app, &m)
}

/// A click on a card row opens the card view on it (cards v2); on
/// another card the view follows; the section title toggles the view.
#[test]
fn a_click_on_a_card_opens_it() {
    let mut app = app();
    let mut term = Terminal::new(TestBackend::new(120, 30)).unwrap();
    let mut draw = |app: &mut App| {
        term.draw(|f| super::super::draw_sb(app, f)).unwrap();
        let buf = term.backend().buffer();
        buf.content.chunks(120).map(|r| r.iter().map(|c| c.symbol()).collect::<String>()).collect::<Vec<_>>()
    };
    let screen = draw(&mut app);
    let x = app.sb.panel_hits.borrow().area.x;
    let y_of = |s: &[String], l: &str| s.iter().position(|r| r.chars().skip(x as usize).collect::<String>().contains(l)).unwrap_or_else(|| panic!("{l}:\n{}", s.join("\n"))) as u16;
    assert!(!app.sb.card.open);
    assert!(click(&mut app, x + 3, y_of(&screen, "no access")));
    assert!(app.sb.card.open);
    assert_eq!(app.sb.current_card().map(|c| c.id), Some(40));
    let screen = draw(&mut app);
    assert!(screen.iter().any(|r| r.contains("docs is blocked")), "the view shows #40:\n{}", screen.join("\n"));
    // another card: the view follows
    click(&mut app, x + 3, y_of(&screen, "3 ✓ debt-solo"));
    assert_eq!((app.sb.card.open, app.sb.current_card().map(|c| c.id)), (true, Some(153)));
    // the section title: back to the thread, then the view again
    let screen = draw(&mut app);
    click(&mut app, x + 3, y_of(&screen, " inbox  "));
    assert!(!app.sb.card.open);
    let screen = draw(&mut app);
    click(&mut app, x + 3, y_of(&screen, " inbox  "));
    assert!(app.sb.card.open);
    assert_eq!(app.sb.focus, "main", "a card click does not change the view");
}

/// The header counts the open cards, last (`# 3 in the inbox`), and keeps
/// them when the panel is hidden (`# 3`), right after needs you.
#[test]
fn the_header_counts_the_cards() {
    let app = app();
    let text = |room: usize, short: bool| app.sb.summary(room, short, true, &super::still_gust()).iter().map(|s| s.content.to_string()).collect::<String>();
    let t = text(200, false);
    assert!(t.ends_with(&format!("{} 1 done · # 3 in the inbox", crate::theme::done_glyph())), "{t:?}");
    assert!(text(200, true).ends_with("· # 3"), "{:?}", text(200, true));
    // short on room: needs you, then the cards, before the rest
    assert_eq!(text(14, true), format!("{} 1 · # 3", G_NEEDS_YOU));
    let one = [0, 0, 0, 0, 0, 1];
    let s: String = fit_counts(one, false, 100, &[]).iter().map(|s| s.content.to_string()).collect();
    assert_eq!(s, "# 1 in the inbox");
}
