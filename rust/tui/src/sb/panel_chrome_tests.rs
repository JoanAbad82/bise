//! The header row and the frame's top edge: the counts, the logo, the role line.
use super::super::bench;
use super::*;
use ratatui::{backend::TestBackend, Terminal};

/// Ctrl held alone for 2 s: the words (BISE-303).
fn held_ctrl() -> crate::ctrlhint::Hold {
    crate::ctrlhint::Hold::of(crate::ctrlhint::Held::Ctrl, std::time::Instant::now() - std::time::Duration::from_secs(2))
}

fn draw(app: &mut App, w: u16, h: u16) -> Vec<String> {
    let mut term = Terminal::new(TestBackend::new(w, h)).unwrap();
    term.draw(|f| super::super::draw_sb(app, f)).unwrap();
    let buf = term.backend().buffer();
    buf.content
        .chunks(w as usize)
        .map(|row| row.iter().map(|c| c.symbol()).collect::<String>().trim_end().to_string())
        .collect()
}

fn with_main() -> App {
    let mut app = bench::test_app_drained();
    app.sb.agents.push(Agent {
        name: "main".into(),
        main: true,
        status: "idle".into(),
        ..Agent::default()
    });
    app
}

fn busy() -> App {
    let mut app = with_main();
    let sb = &mut app.sb;
    for (n, st) in [("auth-fix", "working"), ("release", "working"), ("big", "working"), ("api-v2", "waiting"), ("docs", "blocked"), ("bench", "done"), ("ideas", "idle")] {
        sb.agents.push(Agent { name: n.into(), status: st.into(), ..Agent::default() });
    }
    // BISE-299: docs needs you through its card in your inbox (main
    // escalated its question), not through its blocked status
    sb.cards.push(Card { id: 7, kind: "question".into(), agent: "docs".into(), ..Card::default() });
    app
}

/// BISE-299: a blocked task without a card in your inbox is main's:
/// its `?` is dim, the header counts no "needs you"; main's inbox
/// shows as a dim `@ 2` on main's row.
#[test]
fn a_blocked_task_is_mains_not_yours() {
    let mut app = busy();
    app.sb.cards.clear();
    let docs = app.sb.agents.iter().find(|a| a.name == "docs").unwrap();
    assert!(!needs_you(&app.sb, docs));
    assert_eq!(glyph("blocked", 0, crate::gust::Motion::Still), (G_NEEDS_YOU, dim()));
    let main = app.sb.agents.iter_mut().find(|a| a.main).unwrap();
    main.inbox = 2;
    let main = app.sb.agents.iter().find(|a| a.main).unwrap().clone();
    let t = draw(&mut app, 120, 20);
    let row = t.iter().find(|r| r.contains(" 0 ")).unwrap().trim_end().trim_end_matches('│').trim_end();
    assert!(row.ends_with(&format!("main {} {} 2", G_MAIN, crate::theme::glyph(G_MSG))), "{row:?}");
    let _ = main;
}

/// The header at 120 columns (panel shown): `bise :*` left, the long
/// counts flush right; at 60 (no panel) the short counts.
/// QA 14: a narrow header keeps what fits, "needs you" first, in
/// the §8 order; the words go before the counts do.
#[test]
fn a_narrow_header_keeps_needs_you_first() {
    let n = [3, 1, 1, 2, 0, 0];
    let text = |room| fit_counts(n, false, room, &super::still_gust()).iter().map(|s| s.content.to_string()).collect::<String>();
    let all = text(200);
    assert!(all.contains("working") && all.contains("needs you"), "{all}");
    let numbers = text(30);
    assert!(!numbers.contains("working"), "{numbers}");
    assert!(numbers.contains("? 1") && numbers.contains("∿ 3"), "{numbers}");
    let two = text(9);
    assert_eq!(two, "∿ 3 · ? 1");
    assert_eq!(text(3), "? 1");
    assert_eq!(text(2), "");
}

/// The raised pane (book §13, BISE-102, BISE-212): the grey fills the
/// inside of the frame under the divider, edge to edge between the
/// side edges; the lines (the divider, the side and bottom edges) stay
/// on the history's ground, outside the grey. 6 rows at rest (the
/// divider, a blank bar row, 1 text row, a blank bar row, the key
/// bar, the frame; BISE-219), 4 under 20 rows; under 14 rows the key bar takes the divider's right
/// side.
#[test]
fn the_pane_under_the_divider_is_raised() {
    let mut app = with_main();
    let screen = |app: &mut App, w: u16, h: u16| {
        let mut term = Terminal::new(TestBackend::new(w, h)).unwrap();
        term.draw(|f| super::super::draw_sb(app, f)).unwrap();
        term.backend().buffer().clone()
    };
    let row = |b: &ratatui::buffer::Buffer, y: u16| (0..b.area.width).map(|x| b[(x, y)].symbol()).collect::<String>();
    for (h, pane) in [(40u16, 6u16), (30, 6), (24, 6), (20, 6), (19, 4), (16, 4)] {
        let b = screen(&mut app, 120, h);
        let div = (0..h).find(|&y| row(&b, y).starts_with("├─ you → main")).unwrap_or_else(|| panic!("{h}: no divider"));
        assert_eq!(h - div, pane, "{h} rows: the pane takes {pane}");
        // the history's ground, and the grey is another color
        let ground = b[(60, div - 1)].bg;
        assert_ne!(ground, raised(), "{h} rows");
        for y in div + 1..h - 1 {
            for x in 1..119 {
                assert_eq!(b[(x, y)].bg, raised(), "{h} rows: ({x}, {y}) is raised");
            }
            // the side edges: on the ground, outside the grey
            assert_eq!((b[(0, y)].symbol(), b[(0, y)].bg), ("│", ground), "{h} rows: the left edge");
            assert_eq!((b[(119, y)].symbol(), b[(119, y)].bg), ("│", ground), "{h} rows: the right edge");
        }
        // the divider (its corners, labels and the panel's join) and
        // the bottom edge: on the ground too, like the history above
        for y in [div - 1, div, h - 1] {
            assert!((0..120).all(|x| b[(x, y)].bg == ground), "{h} rows: row {y} is on the ground: {:?}", row(&b, y));
        }
        assert!(row(&b, h - 1).starts_with('╰'), "{h} rows: {:?}", row(&b, h - 1));
        // the panel's rule stops at the divider: nothing under its join
        let join = row(&b, div).chars().position(|c| c == '┴').unwrap_or_else(|| panic!("{h}: no join"));
        assert!((div + 1..h - 1).all(|y| !["│", "┃"].contains(&b[(join as u16, y)].symbol())), "{h} rows: under the join");
        // the text keeps its colors on the tint: the bar a quiet line, the placeholder dim
        let t = (div + 1..h).find(|&y| row(&b, y).contains(PLACEHOLDER_MAIN)).unwrap();
        assert_eq!((b[(3, t)].symbol(), b[(3, t)].fg), ("│", crate::theme::rule()));
    }
    // bare (under 16 rows): the full width under the divider, down
    // to the last row
    let b = screen(&mut app, 120, 15);
    let div = (0..15).find(|&y| row(&b, y).contains("you → main")).unwrap();
    assert!((div + 1..15).all(|y| (0..120).all(|x| b[(x, y)].bg == raised())));
    assert!((0..120).all(|x| b[(x, div)].bg != raised()), "the divider stays on the ground");
    // under 14 rows the key bar is on the divider's right, no row of its own
    let b = screen(&mut app, 120, 13);
    let div = (0..13).find(|&y| row(&b, y).contains("you → main")).unwrap();
    assert!(row(&b, div).contains("@ file   $ skills"), "{:?}", row(&b, div));
    assert_eq!(13 - div, 2, "the divider and 1 text row");
}

#[test]
fn header_at_60_and_120() {
    let mut app = busy();
    let rows = draw(&mut app, 120, 20);
    // framed (book §8 "The frame"): the title from column 3 in the
    // top edge, the path after it, the counts ending at F - 4
    let head = &rows[0];
    assert!(head.starts_with("╭─ bise :* · bench ─"), "{:?}", head);
    // BISE-303: the panel counts the agents, the header the inbox
    assert!(head.ends_with("─ # 1 in the inbox ─╮"), "{:?}", head);
    assert_eq!(head.chars().count(), 120, "{:?}", head);
    // ctrl held: every count
    app.hold = held_ctrl();
    let rows = draw(&mut app, 120, 20);
    let right = "∿ 3 working · … 1 waiting · ? 1 needs you · ✓ 1 done · # 1 in the inbox";
    assert!(rows[0].starts_with("╭─ bise :* · bench ─") && rows[0].ends_with(&format!("─ {} ─╮", right)), "{:?}", rows[0]);
    app.hold = crate::ctrlhint::Hold::default();
    assert!(!rows.iter().any(|r| r.contains("Switchboard")));
    // 60 columns, no panel: the short counts
    let rows = draw(&mut app, 60, 20);
    assert!(rows[0].starts_with("╭─ bise :* · bench ─") && rows[0].ends_with("─ ∿ 3 · … 1 · ? 1 · ✓ 1 · # 1 ─╮"), "{:?}", rows[0]);
    // under 60 columns: no frame, the header row with margins of 1
    let rows = draw(&mut app, 59, 20);
    let summary = "∿ 3 · … 1 · ? 1 · ✓ 1 · # 1";
    assert_eq!(rows[0], format!(" bise :* · bench{}{}", " ".repeat(59 - 16 - summary.chars().count() - 1), summary));
    // no agents: the words
    let mut app = with_main();
    let rows = draw(&mut app, 120, 20);
    assert!(rows[0].starts_with("╭─ bise :*") && rows[0].ends_with("no agents yet ─╮"), "{:?}", rows[0]);
    let rows = draw(&mut app, 59, 20);
    assert!(rows[0].ends_with("no agents yet"), "{:?}", rows[0]);
}

/// QA F: only idle agents, no count to show: the path after the logo,
/// nothing on the right, no lone ` · `.
#[test]
fn idle_agents_leave_no_lone_separator_in_the_header() {
    let mut app = busy();
    for a in app.sb.agents.iter_mut().filter(|a| !a.main) {
        a.status = "idle".into();
    }
    app.sb.cards.clear();
    let rows = draw(&mut app, 120, 20);
    assert!(rows[0].starts_with("╭─ bise :* · bench ──") && rows[0].ends_with("───╮"), "{:?}", rows[0]);
    let rows = draw(&mut app, 59, 20);
    assert!(!rows[0].trim_end().ends_with('·'), "{:?}", rows[0]);
}

/// BISE-126: viewing a task, its role line follows the path, dim; it
/// keeps ROLE_KEEP columns, then ROLE_MIN before the path goes; too
/// narrow, it is cut, then it goes; main's view shows none.
#[test]
fn the_viewed_task_s_role_line_follows_the_title() {
    let mut app = busy();
    for a in app.sb.agents.iter_mut().filter(|a| a.name == "auth-fix") {
        a.role = "fixing the safari login redirect".into();
    }
    // ctrl held: the header's every count (BISE-303)
    app.hold = held_ctrl();
    let rows = draw(&mut app, 120, 20);
    assert!(!rows[0].contains("safari"), "main's view: {:?}", rows[0]);
    app.sb.focus = "auth-fix".into();
    let rows = draw(&mut app, 136, 20);
    let full = "∿ 3 working · … 1 waiting · ? 1 needs you · ✓ 1 done · # 1 in the inbox";
    assert!(rows[0].starts_with("╭─ bise :* · bench · fixing the safari login redirect ─"), "{:?}", rows[0]);
    assert!(rows[0].ends_with(&format!(" {} ─╮", full)), "{:?}", rows[0]);
    assert_eq!(rows[0].chars().count(), 136);
    // shorter: the path goes before the line is cut under ROLE_KEEP
    let rows = draw(&mut app, 120, 20);
    assert!(rows[0].starts_with("╭─ bise :* · fixing the safari login redir… ─"), "{:?}", rows[0]);
    assert!(rows[0].ends_with(&format!(" {} ─╮", full)), "{:?}", rows[0]);
    // dim, like the summary
    let line = app.sb.header(200, false, true, &super::still_gust());
    let role = line.spans.iter().find(|s| s.content.contains("safari")).unwrap();
    assert_eq!(role.style.fg, Some(crate::theme::dim()));
    // wide: the whole line
    let rows = draw(&mut app, 160, 20);
    assert!(rows[0].starts_with("╭─ bise :* · bench · fixing the safari login redirect ─"), "{:?}", rows[0]);
    // narrow: the counts shorten, the path goes, the line is cut with …
    let rows = draw(&mut app, 60, 20);
    assert!(rows[0].starts_with("╭─ bise :* · fixing"), "{:?}", rows[0]);
    assert!(rows[0].contains('…') && rows[0].ends_with("∿ 3 · … 1 · ? 1 · ✓ 1 · # 1 ─╮"), "{:?}", rows[0]);
    assert_eq!(rows[0].chars().count(), 60);
    // no frame: the header row, the same order
    let rows = draw(&mut app, 59, 20);
    assert!(rows[0].starts_with(" bise :* · bench · fixing"), "{:?}", rows[0]);
    assert!(rows[0].ends_with("∿ 3 · … 1 · ? 1 · ✓ 1 · # 1"), "{:?}", rows[0]);
    // no room left: no line at all, never a lone "·"
    let rows = draw(&mut app, 50, 20);
    assert!(rows[0].starts_with(" bise :* · fixing t…  ∿ 3"), "at least 12 columns: {:?}", rows[0]);
    let rows = draw(&mut app, 46, 20);
    assert!(!rows[0].contains("fix") && !rows[0].contains(" · f"), "{:?}", rows[0]);
    // a task without a line yet (an old hub): nothing
    for a in app.sb.agents.iter_mut() {
        a.role.clear();
    }
    let rows = draw(&mut app, 120, 20);
    assert!(rows[0].starts_with("╭─ bise :* · bench ─"), "{:?}", rows[0]);
}

/// The summary (the counts) shortens its words.
#[test]
fn summary_shortens_its_words() {
    let app = busy();
    let sb = &app.sb;
    let text = |room: usize, short: bool| sb.summary(room, short, true, &super::still_gust()).iter().map(|s| s.content.to_string()).collect::<String>();
    let full = "∿ 3 working · … 1 waiting · ? 1 needs you · ✓ 1 done · # 1 in the inbox";
    assert_eq!(text(100, false), full);
    assert_eq!(text(full.chars().count(), false), full);
    assert_eq!(text(full.chars().count() - 1, false), "∿ 3 · … 1 · ? 1 · ✓ 1 · # 1");
}

/// Colors of the header: `:*` and "needs you" in accent, the rest dim.
#[test]
fn header_colors() {
    let app = busy();
    let line = app.sb.header(120, false, true, &super::still_gust());
    let color_of = |t: &str| line.spans.iter().find(|s| s.content.contains(t)).map(|s| s.style.fg);
    assert_eq!(color_of(":*"), Some(Some(accent())));
    assert_eq!(color_of("needs you"), Some(Some(accent())));
    assert_eq!(color_of("working"), Some(Some(dim())));
}

/// First run: the header says `no agents yet`, the feed the three
/// dim lines of the copy deck, the status row `main · idle`, the
/// composer `›` with the main hints (mockup "first run").
#[test]
fn first_run_screen() {
    let mut app = with_main();
    let rows = draw(&mut app, 120, 24);
    let all = rows.join("\n");
    for l in FIRST_RUN {
        assert!(rows.iter().any(|r| r.contains(l)), "{:?} missing:\n{}", l, all);
    }
    assert_eq!(FIRST_RUN[0], "what's on your mind?");
    assert_eq!(FIRST_RUN[1], "say it and keep talking. the work runs in the background, i'm always here.");
    assert_eq!(FIRST_RUN[2], "try: \"show me what you can do\"");
    // the composer pane (book §8 "The frame"): the divider says who
    // you talk to and what it does
    let at = rows.iter().position(|r| r.starts_with("├─ you → main ─")).unwrap_or_else(|| panic!("{}", all));
    // BISE-303: no state word at rest, no context yet
    assert!(rows[at].ends_with("──┤") && !rows[at].contains("idle"), "{:?}", rows[at]);
    assert!(rows[at].contains('┴'), "the panel's rule joins it: {:?}", rows[at]);
    // then the raised pane (book §13): the composer, its bar at x0
    // (column 3 here) on a blank row, the text row, a blank row
    // (BISE-219), then the key bar from the text's column, the
    // frame's bottom edge
    assert_eq!(rows.len() - at, 6, "6 rows at rest: {}", all);
    assert!(rows[at + 1..at + 4].iter().all(|r| r.starts_with("│  │")), "{}", all);
    assert_eq!(rows[at + 1].trim_end_matches(['│', ' ']), "", "{:?}", rows[at + 1]);
    assert_eq!(rows[at + 3].trim_end_matches(['│', ' ']), "", "{:?}", rows[at + 3]);
    // empty, the composer asks; the text at x0 + 4 (BISE-XPAD)
    assert!(rows[at + 2].starts_with(&format!("│  │     {}", PLACEHOLDER_MAIN)), "{:?}", rows[at + 2]);
    let keys = &rows[rows.len() - 2];
    assert!(keys.starts_with("│      @ file   $ skills   / commands"), "{:?}", keys);
    assert!(rows.last().unwrap().starts_with("╰─"), "{}", all);
    // a panel with main only
    assert!(rows.iter().any(|r| r.contains(&format!("│  0 {} main {}", G_IDLE, G_MAIN))), "{}", all);
    // the block sits at 2/5 of the history's free rows (designer):
    // blank rows above it, more below it; the text stays left, at
    // the feed's indent
    let big = draw(&mut app, 120, 48);
    let at48 = big.iter().position(|r| r.starts_with("├─ you → main ─")).unwrap();
    let top = big.iter().position(|r| r.contains(FIRST_RUN[0])).unwrap();
    let bottom = big.iter().position(|r| r.contains(FIRST_RUN[2])).unwrap();
    let (above, below) = (top - 1, at48 - bottom - 1);
    assert!(above >= 8 && below > above && below - above <= above, "{above} above, {below} below:\n{}", big.join("\n"));
    let t = rows.iter().position(|r| r.contains(FIRST_RUN[0])).unwrap();
    assert_eq!(big[top].find(FIRST_RUN[0]), rows[t].find(FIRST_RUN[0]), "same column");
    assert!(t > 4, "centered at 24 rows too: {}", all);
    // a short history (under 12 rows): on top, after one blank row
    let small = draw(&mut app, 120, 16);
    let t = small.iter().position(|r| r.contains(FIRST_RUN[0])).unwrap();
    assert!(t <= 3 && small[t - 1].chars().take(60).all(|c| c == '│' || c == ' '), "{}", small.join("\n"));
    // once there is an agent, the first-run text goes
    bench::add_agent(&mut app, "auth-fix", "the safari login");
    let rows = draw(&mut app, 120, 24);
    assert!(!rows.iter().any(|r| r.contains(FIRST_RUN[1])));
}

/// The styled cells of a draw (the underline, the colors).
fn cells(app: &mut App, w: u16, h: u16) -> ratatui::buffer::Buffer {
    let mut term = Terminal::new(TestBackend::new(w, h)).unwrap();
    term.draw(|f| super::super::draw_sb(app, f)).unwrap();
    term.backend().buffer().clone()
}

fn mouse(app: &mut App, kind: crossterm::event::MouseEventKind, column: u16, row: u16) {
    let m = crossterm::event::MouseEvent { kind, column, row, modifiers: crossterm::event::KeyModifiers::NONE };
    crate::input::on_mouse(app, &m, 0);
}

fn type_key(app: &mut App, code: crossterm::event::KeyCode) {
    crate::input::on_key(app, &crossterm::event::KeyEvent::new(code, crossterm::event::KeyModifiers::NONE));
}

/// BISE-284: the first-run text's `show me what you can do` is a
/// link: the hand and an accent underline under the mouse; a click
/// fills the composer with it, selected, and sends nothing; `try:`
/// is no link.
#[test]
fn a_click_on_the_suggestion_fills_the_composer() {
    use crossterm::event::{MouseButton, MouseEventKind};
    use crate::pointer::{at, Shape};
    let mut app = with_main();
    assert_eq!(FIRST_RUN[2], format!("try: \"{DEMO}\""));
    let rows = draw(&mut app, 120, 24);
    let y = rows.iter().position(|r| r.contains(FIRST_RUN[2])).unwrap() as u16;
    let row = &rows[y as usize];
    let x = row[..row.find(DEMO).unwrap()].chars().count() as u16;
    let r = app.demo_rect.expect("the suggestion's place");
    assert_eq!((r.x, r.y, r.width, r.height), (x, y, DEMO.len() as u16, 1));
    assert_eq!(at(x, y), Shape::Pointer);
    assert_eq!(at(x + DEMO.len() as u16 - 1, y), Shape::Pointer);
    assert_eq!(at(x - 3, y), Shape::Default, "`try:` is no link");
    assert_eq!(at(x + DEMO.len() as u16, y), Shape::Default, "the closing quote is no link");
    // at rest: dim, no underline; under the mouse: accent, underlined
    let b = cells(&mut app, 120, 24);
    assert_eq!(b[(x, y)].fg, crate::theme::dim());
    assert!(!b[(x, y)].modifier.contains(Modifier::UNDERLINED));
    mouse(&mut app, MouseEventKind::Moved, x + 2, y);
    let b = cells(&mut app, 120, 24);
    assert_eq!(b[(x, y)].fg, crate::theme::accent());
    assert!(b[(x, y)].modifier.contains(Modifier::UNDERLINED));
    assert!(!b[(x - 3, y)].modifier.contains(Modifier::UNDERLINED), "only the sentence");
    // a click on `try:`: nothing
    mouse(&mut app, MouseEventKind::Down(MouseButton::Left), x - 4, y);
    mouse(&mut app, MouseEventKind::Up(MouseButton::Left), x - 4, y);
    assert_eq!(app.ed.text, "");
    // a click on the sentence: the composer holds it, all selected
    mouse(&mut app, MouseEventKind::Down(MouseButton::Left), x + 5, y);
    mouse(&mut app, MouseEventKind::Up(MouseButton::Left), x + 5, y);
    assert_eq!(app.ed.text, DEMO);
    assert_eq!(app.ed.selection(), Some((0, DEMO.chars().count())));
    assert!(!app.events.iter().any(|e| matches!(e, crate::Ev::You(..))), "not sent");
    // the last line now says what enter does
    let rows = draw(&mut app, 120, 24);
    let ready = format!("{}{}", DEMO_READY.0, DEMO_READY.1);
    assert_eq!(ready, "⏎ try it · or just type your own");
    assert!(rows.iter().any(|r| r.contains(&ready)), "{}", rows.join("\n"));
    assert!(!rows.iter().any(|r| r.contains(FIRST_RUN[2])));
    assert!(app.demo_rect.is_none(), "no link while it says ⏎ try it");
}

/// BISE-284: the first open after the onboarding: the composer holds
/// the suggestion, selected, and the first-run text says `⏎ try it`;
/// a typed key replaces it and the text says `try:` again; esc keeps
/// it (unselected). Not in an agent, not over a draft, not once
/// there are agents.
#[test]
fn the_first_open_after_the_onboarding_holds_the_suggestion() {
    use crossterm::event::KeyCode;
    let mut app = with_main();
    prefill_demo(&mut app);
    assert_eq!(app.ed.text, DEMO);
    assert_eq!(app.ed.selection(), Some((0, DEMO.chars().count())));
    let rows = draw(&mut app, 120, 24);
    let all = rows.join("\n");
    let at = rows.iter().position(|r| r.contains("⏎ try it · or just type your own")).unwrap_or_else(|| panic!("{}", all));
    assert!(rows[..at].iter().any(|r| r.contains(FIRST_RUN[0])), "{}", all);
    assert!(rows.iter().any(|r| r.starts_with("│  │") && r.contains(DEMO)), "the composer holds it:\n{}", all);
    let b = cells(&mut app, 120, 24);
    let x = rows[at].find('⏎').map(|i| rows[at][..i].chars().count() as u16).unwrap();
    assert_eq!(b[(x, at as u16)].fg, crate::theme::accent(), "the key in the accent");
    assert_eq!(b[(x + 3, at as u16)].fg, crate::theme::dim());
    // esc: kept, not selected
    type_key(&mut app, KeyCode::Esc);
    assert_eq!((app.ed.text.as_str(), app.ed.selection()), (DEMO, None));
    // selected again, a key replaces it: back to `try:`
    fill_demo(&mut app);
    type_key(&mut app, KeyCode::Char('h'));
    assert_eq!(app.ed.text, "h");
    let rows = draw(&mut app, 120, 24);
    assert!(rows.iter().any(|r| r.contains(FIRST_RUN[2])), "{}", rows.join("\n"));
    // a draft stays as it is
    prefill_demo(&mut app);
    assert_eq!(app.ed.text, "h");
    // not inside an agent, not once there are agents
    let mut app = with_main();
    bench::add_agent(&mut app, "auth-fix", "the safari login");
    prefill_demo(&mut app);
    assert_eq!(app.ed.text, "");
    app.sb.focus = "auth-fix".into();
    prefill_demo(&mut app);
    assert_eq!(app.ed.text, "");
}

/// Inside an agent (mockup "inside an agent"): the pinned line of the
/// copy deck on top of the feed, the status row starts with the
/// agent's name in accent, then dim; the shared checkout shows no
/// place (BISE-136).
#[test]
fn inside_an_agent_screen() {
    let mut app = with_main();
    app.sb.agents.push(Agent {
        name: "auth-fix".into(),
        status: "idle".into(),
        mode: "shared".into(),
        path: "/ws".into(),
        ..Agent::default()
    });
    focus(&mut app, "auth-fix");
    let mut term = Terminal::new(TestBackend::new(112, 24)).unwrap();
    term.draw(|f| super::super::draw_sb(&mut app, f)).unwrap();
    let buf = term.backend().buffer().clone();
    let rows: Vec<String> = buf
        .content
        .chunks(112)
        .map(|row| row.iter().map(|c| c.symbol()).collect::<String>().trim_end().to_string())
        .collect();
    let all = rows.join("\n");
    let line = "you're talking to auth-fix directly. main isn't in the loop. esc back to main.";
    // the header row, 1 blank row, then the pinned line (book §8),
    // wrapped in the column when it is narrower
    let left = |r: &String| r.chars().skip(1).take(76).collect::<String>().trim().to_string();
    assert!(format!("{} {}", left(&rows[2]), left(&rows[3])).trim().contains(line), "{}", all);
    // the divider: `you →` dim, the name in accent, the state dim
    let y = rows.iter().position(|r| r.starts_with("├─ you → auth-fix ─")).unwrap_or_else(|| panic!("{}", all));
    assert!(!rows[y].contains("idle"), "{:?}", rows[y]);
    let cell = |x: usize| buf.cell((x as u16, y as u16)).unwrap().fg;
    assert_eq!(cell(3), dim(), "you → dim");
    assert_eq!(cell(9), accent(), "the name in accent");
    assert!(!all.contains("task"), "no \"task\" in the chrome:\n{}", all);
}

/// A click lands on the feed row drawn under it: the feed starts
/// under the header (and, inside an agent, under the pinned line).
#[test]
fn feed_clicks_land_on_the_row_under_the_header() {
    for inside in [false, true] {
        let mut app = with_main();
        if inside {
            bench::add_agent(&mut app, "auth-fix", "the safari login");
            focus(&mut app, "auth-fix");
        }
        for k in 0..5 {
            push_event(&mut app.events, &mut app.cache, Ev::Info(format!("event {}", k)));
        }
        let rows = draw(&mut app, 100, 24);
        assert!(app.feed_y >= 1, "the header is above the feed");
        if inside {
            assert!(rows[2].contains("you're talking to auth-fix"));
            // under the pinned line (1 or 2 rows) and a blank row
            assert!(app.feed_y >= 4, "{}", app.feed_y);
        }
        for k in 0..5 {
            let label = format!("event {}", k);
            let y = rows.iter().position(|r| r.contains(&label)).unwrap_or_else(|| panic!("{}", rows.join("\n")));
            let x = rows[y].find(&label).unwrap() as u16;
            let pos = crate::input::feed_pos(&app, x, y as u16, false).expect("a feed row");
            assert_eq!(pos.0, k, "inside {}: {} at screen row {}", inside, label, y);
        }
        // the header row is not the feed
        assert!(crate::input::feed_pos(&app, 5, 0, false).is_none());
    }
}

/// The status row: lowercase, the context, a preview note, the
/// steer hints during a turn.
#[test]
fn status_row_and_hints() {
    let mut app = busy();
    // BISE-303: the glyph says idle; ctrl held, the word
    assert_eq!(status_text(&app), "main");
    app.hold = held_ctrl();
    assert_eq!(status_text(&app), "main · idle");
    app.hold = crate::ctrlhint::Hold::default();
    assert_eq!(key_mode(&app), crate::keybar::Mode::Default);
    app.pending = true;
    assert_eq!(key_mode(&app), crate::keybar::Mode::Steer);
    app.pending = false;
    let sb = &mut app.sb;
    sb.selected = Some(1);
    sb.preview = true;
    let text = status_text(&app);
    assert!(text.ends_with("preview of auth-fix"), "{:?}", text);
}

/// QA N: viewing a working agent, the label says `working · 12m`; the
/// right side does not say `working · 0s` again. Another state keeps
/// its word and the turn's age.
#[test]
fn a_working_agent_has_one_status_and_one_timer() {
    let mut app = busy();
    app.sb.agents.retain(|a| a.name != "auth-fix");
    app.sb.agents.push(Agent {
        name: "auth-fix".into(),
        status: "working".into(),
        turn_ms: Some(12 * 60_000),
        ..Agent::default()
    });
    app.sb.focus = "auth-fix".into();
    app.pending = true;
    assert_eq!(viewed_working(&app).and_then(|w| w.age).as_deref(), Some("12m"));
    let state: String = status_state(&app)[0].spans.iter().map(|s| s.content.to_string()).collect();
    assert!(!state.contains("working") && !state.contains("12m") && !state.contains("0s"), "{state:?}");
    for a in app.sb.agents.iter_mut().filter(|a| a.name == "auth-fix") {
        a.status = "blocked".into();
    }
    let state: String = status_state(&app)[0].spans.iter().map(|s| s.content.to_string()).collect();
    assert!(!state.contains("blocked"), "at rest the glyph says it: {state:?}");
    app.hold = held_ctrl();
    let state: String = status_state(&app)[0].spans.iter().map(|s| s.content.to_string()).collect();
    assert!(state.starts_with("blocked · 12m"), "{state:?}");
}

/// running-procs: an agent that left something running has one faint
/// line under its row (`∿ 2 running · :5173`); none at 0.
#[test]
fn an_agent_running_something_has_a_faint_line_under_its_row() {
    use bise_proto::words::running;
    let mut app = with_main();
    app.sb.agents.push(Agent { name: "perf".into(), status: "working".into(), procs: 2, procs_port: Some(5173), ..Agent::default() });
    app.sb.agents.push(Agent { name: "checkout".into(), status: "working".into(), procs: 1, ..Agent::default() });
    app.sb.agents.push(Agent { name: "search".into(), status: "waiting".into(), ..Agent::default() });
    // under ~100 columns the panel is not drawn (layout.rs)
    for width in [150u16, 110] {
        let t = draw(&mut app, width, 24);
        let at = |name: &str| t.iter().position(|r| r.contains(&format!(" {name} "))).unwrap_or_else(|| panic!("{name}: {t:#?}"));
        // the panel's cell of the row: the text after the feed's rule
        let line = |i: usize| t[i].trim_end_matches('│').rsplit('│').next().unwrap_or_default().trim().to_string();
        assert_eq!(line(at("perf") + 1), format!("∿ {} · {}", running::count_running(2), running::port_short(5173)), "{width}: {t:#?}");
        assert_eq!(line(at("checkout") + 1), format!("∿ {}", running::count_running(1)), "{width}: {t:#?}");
        assert!(!line(at("search") + 1).contains('∿'), "{width}: {t:#?}");
    }
}
