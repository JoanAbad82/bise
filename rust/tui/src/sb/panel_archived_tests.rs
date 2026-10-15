//! The panel's archived section: its fold, its keys, its scroll, ctrl+o.
use super::super::bench;
use super::*;
use crossterm::event::{KeyEvent, KeyModifiers, MouseButton, MouseEvent, MouseEventKind};
use ratatui::{backend::TestBackend, Terminal};

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as u64)
}

/// main, one live task, three archived ones (`old` 5 h ago, `mid`
/// 2 h, `new` 10 min: listed new, mid, old).
fn app() -> App {
    let mut app = bench::test_app_drained();
    let now = now_ms();
    let sb = &mut app.sb;
    sb.agents.push(Agent { name: "main".into(), main: true, status: "idle".into(), ..Agent::default() });
    bench::add_agent(&mut app, "alpha", "live objective");
    let sb = &mut app.sb;
    for (name, h_ago) in [("old", 300u64), ("new", 10), ("mid", 120)] {
        sb.agents.push(Agent {
            name: name.into(),
            status: "archived".into(),
            objective: format!("{} objective", name),
            report: format!("{} did its job", name),
            report_ms: Some(now - h_ago * 60_000),
            ..Agent::default()
        });
    }
    app
}

fn draw(app: &mut App, term: &mut Terminal<TestBackend>) -> Vec<String> {
    term.draw(|f| super::super::draw_sb(app, f)).unwrap();
    let buf = term.backend().buffer();
    let w = buf.area.width as usize;
    buf.content
        .chunks(w)
        .map(|row| row.iter().map(|c| c.symbol()).collect::<String>())
        .collect()
}

fn panel(rows: &[String], x: u16) -> Vec<String> {
    rows.iter().map(|r| r.chars().skip(x as usize).collect::<String>()).collect()
}

fn row_of(rows: &[String], label: &str) -> Option<usize> {
    rows.iter().position(|r| r.contains(label))
}

fn click(app: &mut App, column: u16, row: u16) {
    let m = MouseEvent {
        kind: MouseEventKind::Down(MouseButton::Left),
        column,
        row,
        modifiers: KeyModifiers::NONE,
    };
    crate::input::on_mouse(app, &m, 0);
}

fn press(app: &mut App, code: KeyCode, m: KeyModifiers) -> bool {
    key(app, &KeyEvent::new(code, m), false)
}

/// Collapsed: one dim header, no archived name. A click on it
/// expands the list, newest first, dim; a click on a row opens that
/// task's history read-only (status row, placeholder, typed text not
/// sent); a second click on the header folds the list, the task in
/// focus stays listed.
#[test]
fn archived_section_folds_expands_and_opens_read_only() {
    let mut app = app();
    let mut term = Terminal::new(TestBackend::new(120, 30)).unwrap();
    let rows = draw(&mut app, &mut term);
    let x = app.sb.panel_hits.borrow().area.x;
    let p = panel(&rows, x);
    let head = row_of(&p, "▸ 3 archived").unwrap_or_else(|| panic!("{}", p.join("\n")));
    for n in [&format!("{} old", G_STOPPED), &format!("{} mid", G_STOPPED), &format!("{} new", G_STOPPED)] {
        assert!(row_of(&p, n).is_none(), "{} shown while folded", n);
    }
    let buf = term.backend().buffer().clone();
    let cell = buf.cell((x + 3, head as u16)).unwrap();
    assert_eq!(cell.fg, dim(), "the header is dim");

    click(&mut app, x + 3, head as u16);
    let p = panel(&draw(&mut app, &mut term), x);
    assert!(row_of(&p, "▾ 3 archived").is_some(), "{}", p.join("\n"));
    let (n, m, o) = (
        row_of(&p, &format!("{} new", G_STOPPED)).unwrap(),
        row_of(&p, &format!("{} mid", G_STOPPED)).unwrap(),
        row_of(&p, &format!("{} old", G_STOPPED)).unwrap(),
    );
    assert!(n < m && m < o, "newest first:\n{}", p.join("\n"));
    assert!(p[n].contains("10m") && p[o].contains("5h"), "{}", p.join("\n"));
    assert!(row_of(&p, "did its job").is_none(), "no report line when not selected");
    let buf = term.backend().buffer().clone();
    let name_x = x + p[m].find("mid").map(|b| p[m][..b].chars().count()).unwrap() as u16;
    assert_eq!(buf.cell((name_x, m as u16)).unwrap().fg, dim(), "archived names are dim");

    click(&mut app, x + 5, m as u16);
    assert_eq!(app.sb.focus, "mid");
    let rows = draw(&mut app, &mut term);
    let all = rows.join("\n");
    assert!(all.contains("archived ─"), "the divider says archived: {}", all);
    assert_eq!(all.matches("/restore").count(), 1, "the placeholder alone says /restore: {}", all);
    assert!(panel(&rows, x).iter().any(|r| r.contains("mid did its job")), "{}", all);
    assert_eq!(placeholder(&app).unwrap(), "mid is archived · /restore to talk to it");
    let out = handle_input(&mut app, "hello");
    assert!(matches!(&out[..], [Ev::Warn(w)] if w == "mid is archived. /restore brings it back · esc → main"), "not sent");
    // ⏎ in the composer: the warn line, the message stays there;
    // a command still runs
    assert_eq!(archived_refusal(&app, "hello").as_deref(), Some("mid is archived. /restore brings it back · esc → main"));
    assert_eq!(archived_refusal(&app, "/restore mid"), None);
    app.ed.text = "hello".into();
    app.ed.cursor = 5;
    crate::input::on_key(&mut app, &KeyEvent::new(KeyCode::Enter, KeyModifiers::NONE));
    assert_eq!(app.ed.text, "hello", "the message stays in the composer");
    assert!(app.events.iter().any(|e| matches!(e, Ev::Warn(w) if w.starts_with("mid is archived."))));
    app.ed.text.clear();
    app.ed.cursor = 0;

    let p = panel(&rows, x);
    let head = row_of(&p, "▾ 3 archived").unwrap();
    click(&mut app, x + 3, head as u16);
    let p = panel(&draw(&mut app, &mut term), x);
    assert!(row_of(&p, "▸ 3 archived").is_some());
    assert!(row_of(&p, &format!("{} mid", G_STOPPED)).is_some(), "the focused archived task stays listed");
    assert!(row_of(&p, &format!("{} new", G_STOPPED)).is_none());
}

/// Keys: A expands from a selection, ⌥↑↓ walk into the archived
/// rows (the selected one shows its report), ⏎ opens it; Alt+N never
/// lands on an archived task; D does not drop one.
#[test]
fn archived_keys() {
    let mut app = app();
    let mut term = Terminal::new(TestBackend::new(120, 30)).unwrap();
    press(&mut app, KeyCode::Down, KeyModifiers::ALT);
    assert_eq!(app.sb.nav().len(), 2);
    press(&mut app, KeyCode::Char('A'), KeyModifiers::SHIFT);
    assert!(app.sb.archived_open);
    assert_eq!(app.sb.selected, Some(0), "selection kept");
    press(&mut app, KeyCode::Up, KeyModifiers::ALT);
    let sb = &app.sb;
    assert_eq!(sb.selected_agent().map(|a| a.name.as_str()), Some("old"));
    let x = sb.panel_hits.borrow().area.x;
    let p = panel(&draw(&mut app, &mut term), x.max(90));
    assert!(row_of(&p, "old did its job").is_some(), "{}", p.join("\n"));
    press(&mut app, KeyCode::Char('D'), KeyModifiers::SHIFT);
    press(&mut app, KeyCode::Enter, KeyModifiers::NONE);
    assert_eq!(app.sb.focus, "old");
    press(&mut app, KeyCode::Char('2'), KeyModifiers::ALT);
    assert_eq!(app.sb.focus, "old", "Alt+2: no live task 2");
    press(&mut app, KeyCode::Char('1'), KeyModifiers::ALT);
    assert_eq!(app.sb.focus, "alpha");
}

/// Hundreds of archived tasks, expanded: the panel scrolls to keep
/// the selected row in view, and clicks still hit the right row.
#[test]
fn a_long_archived_list_scrolls_to_the_selection() {
    let mut app = app();
    let sb = &mut app.sb;
    for i in 0..300u64 {
        sb.agents.push(Agent {
            name: format!("t{:03}", i),
            status: "archived".into(),
            report_ms: Some(1_000 + i),
            ..Agent::default()
        });
    }
    sb.archived_open = true;
    // the oldest: t000, last of the list
    sb.selected = sb.nav().iter().position(|a| a.name == "t000");
    let mut term = Terminal::new(TestBackend::new(120, 30)).unwrap();
    let rows = draw(&mut app, &mut term);
    let x = app.sb.panel_hits.borrow().area.x;
    let p = panel(&rows, x);
    let y = row_of(&p, &format!("{} t000", G_STOPPED)).unwrap_or_else(|| panic!("{}", p.join("\n")));
    click(&mut app, x + 5, y as u16);
    assert_eq!(app.sb.focus, "t000");
}
