use super::*;
use bise_proto::rows::{AgentWatch, WatchKind};
use ratatui::{backend::TestBackend, Terminal};

const MIN: u64 = 60_000;

fn watch(id: u64, kind: WatchKind, what: &str, ago: u64, resumes: bool, until_in: Option<u64>) -> AgentWatch {
    let now = crate::when::now_ms();
    AgentWatch { id, kind, what: what.into(), since_ms: now - ago, noted: kind == WatchKind::File, resumes, until_ms: until_in.map(|u| now + u) }
}

/// designer's case: main idle with an alarm only, perf paused on cargo
/// bench for 3 minutes.
fn app_with_waits() -> crate::app::App {
    let mut app = super::super::bench::test_app_drained();
    let alarm = watch(7, WatchKind::File, "the nightly gate goes red", 20 * 60 * MIN, false, Some(2 * 60 * MIN));
    let pause = watch(9, WatchKind::Bg, "cargo bench", 3 * MIN + 5_000, true, Some(24 * 60 * MIN));
    app.sb.agents = vec![
        Agent { main: true, name: "main".into(), status: "idle".into(), watching: vec![alarm], ..Agent::default() },
        Agent { name: "perf".into(), status: "idle".into(), watching: vec![pause], ..Agent::default() },
    ];
    app
}

fn screen(app: &mut crate::app::App, cols: u16, rows: u16) -> Vec<String> {
    let mut term = Terminal::new(TestBackend::new(cols, rows)).unwrap();
    term.draw(|f| crate::ui::draw(app, f)).unwrap();
    let buf = term.backend().buffer().clone();
    (0..buf.area.height).map(|y| (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_string()).collect::<String>().trim_end().to_string()).collect()
}

fn pause(note: &str, more: &str) -> PauseLine {
    PauseLine { state: "continues when".into(), note: note.into(), who: String::new(), more: more.into(), dur: "3m".into(), len: "3m".into(), title: String::new() }
}

/// The pause line: the state and the age whole, only the note cuts,
/// after a whole word; under 2 words it goes.
#[test]
fn the_pause_line_cuts_its_note_on_a_word() {
    let l = pause("the nightly full gate ends", "");
    assert_eq!(pause_fit(&l, 80), "continues when the nightly full gate ends · 3m");
    assert_eq!(pause_fit(&l, 40), "continues when the nightly full… · 3m");
    assert_eq!(pause_fit(&l, 25), "continues when… · 3m");
    let more = pause("the nightly full gate ends", " and 1 more");
    assert_eq!(pause_fit(&more, 50), "continues when the nightly full… and 1 more · 3m");
    assert_eq!(pause_fit(&more, 45), "continues when the nightly… and 1 more · 3m");
}

/// designer m_22934: the clock always whole, `tmrw`, a weekday, beyond
/// 6 days the date alone.
#[test]
fn an_alarm_ends_on_a_short_clock() {
    assert_eq!(end_short("08:07"), "→08:07");
    assert_eq!(end_short("tomorrow 08:07"), "→tmrw 08:07");
    assert_eq!(end_short("fri 08:07"), "→fri 08:07");
    assert_eq!(end_short("5 oct 08:07"), "→5 oct");
    assert_eq!(end_short(""), "");
}

/// designer m_22997: the agent and its end whole on row 1, the note
/// under the name on row 2, cut on a word; `if the…` says nothing: no
/// row 2.
#[test]
fn a_watching_row_keeps_its_clock_whole() {
    let alarm = Alarm { id: 7, note: "if the nightly gate goes red".into(), end: "08:07".into(), title: String::new() };
    let wt = Watch { agent: "main".into(), alarm };
    let text = |w: usize| watch_rows(&wt, w, None).iter().map(|l| l.spans.iter().map(|s| s.content.as_ref()).collect::<String>()).collect::<Vec<_>>();
    assert_eq!(text(32), [" ◌ main                  →08:07 ", "   if the nightly gate goes red "]);
    assert_eq!(text(31), [" ◌ main                 →08:07 ", "   if the nightly gate goes…   "]);
    assert_eq!(text(24), [" ◌ main          →08:07 ", "   if the nightly gate… "]);
    assert_eq!(text(18), [" ◌ main    →08:07 "]);
    assert!(text(24).iter().all(|r| r.width() == 24));
}

/// agent-waiting-states A at 150 columns: main with an alarm only stays
/// `○` idle with no live line; the panel's `watching` lists the alarm;
/// perf, paused, is `…` with its age. `-- --nocapture` prints the screens.
#[test]
fn an_alarm_lives_in_the_panel_and_a_pause_in_the_feed() {
    let mut app = app_with_waits();
    app.sb.focus = "main".into();
    let rows = screen(&mut app, 150, 24);
    let all = rows.join("\n");
    println!("== tui 150 cols, main (alarm only)\n{all}");
    assert!(!all.contains("continues when") && !all.contains("waiting"), "main is free: no live line\n{all}");
    let main_row = rows.iter().find(|r| r.contains("0 ○ main")).unwrap_or_else(|| panic!("main idle\n{all}"));
    assert!(!main_row.contains('…'), "{main_row}");
    let perf = rows.iter().find(|r| r.contains("perf") && !r.contains('◌')).unwrap_or_else(|| panic!("{all}"));
    assert!(perf.contains("… perf") && perf.contains("3m"), "{perf}");
    let title = rows.iter().position(|r| r.contains("│  watching   ") && !r.contains('◌')).unwrap_or_else(|| panic!("the section\n{all}"));
    assert!(rows[title + 1].contains("◌ main") && rows[title + 1].contains('→'), "{}", rows[title + 1]);
    assert!(rows[title + 2].contains("│    if the nightly gate goes…"), "{}", rows[title + 2]);
    assert!(!rows.iter().any(|r| r.contains("you → main") && r.contains('◌')), "the panel shows it: no count on the rule\n{all}");
    // perf in view: its pause is the live line
    app.sb.focus = "perf".into();
    let rows = screen(&mut app, 150, 24);
    println!("== tui 150 cols, perf (paused)\n{}", rows.join("\n"));
    assert!(rows.iter().any(|r| r.contains("… continues when cargo bench ends · 3m")), "{}", rows.join("\n"));
}

/// At 80 columns (no panel): one faint `◌ 1 watching` at the rule's end,
/// a click opens /scheduled on the alarm.
#[test]
fn without_the_panel_the_rule_counts_the_alarms() {
    let mut app = app_with_waits();
    app.sb.focus = "main".into();
    let rows = screen(&mut app, 80, 24);
    let all = rows.join("\n");
    println!("== tui 80 cols, main (alarm only)\n{all}");
    let y = rows.iter().position(|r| r.contains("you → main")).unwrap_or_else(|| panic!("{all}"));
    assert!(rows[y].contains("◌ 1 watching"), "{}", rows[y]);
    assert!(!all.contains("continues when"), "{all}");
    let r = app.watching_rect.expect("its cells");
    let row: String = rows[r.y as usize].chars().skip(r.x as usize).take(r.width as usize).collect();
    assert_eq!(row, "◌ 1 watching");
    crate::scheduled_watch::open_on(&mut app, None);
    assert_eq!(app.scheduled.as_ref().and_then(|s| s.watch), Some(7));
    let rows = screen(&mut app, 80, 24);
    println!("== tui 80 cols, /scheduled\n{}", rows.join("\n"));
    let all = rows.join("\n");
    assert!(all.contains("› ◌ main") && all.contains("if the nightly gate goes red"), "{all}");
    assert!(all.contains("x stop watching"), "{all}");
    assert!(all.contains("bise wakes main if the nightly gate goes red · set "), "the detail\n{all}");
}

/// The panel alone, `w` columns wide, `h` rows high, trimmed.
fn panel_rows(app: &crate::app::App, w: u16, h: u16) -> Vec<String> {
    let mut term = Terminal::new(TestBackend::new(w, h)).unwrap();
    term.draw(|f| draw_panel(app, f, f.area())).unwrap();
    let buf = term.backend().buffer().clone();
    (0..buf.area.height).map(|y| (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_string()).collect::<String>().trim_end().to_string()).collect()
}

/// event-wake (agent-waiting-states A): an idle agent paused on a
/// watch reads `…` in text, its pause's age in the time column; ctrl
/// held, what it waits for, cut to the column; an alarm alone, or no
/// watch: `○` again.
#[test]
fn an_agent_waiting_on_an_event_is_not_idle() {
    use crate::ctrlhint::{Held, Hold};
    let mut app = super::super::bench::test_app_drained();
    let since = crate::when::now_ms().saturating_sub(125_000);
    let w = bise_proto::rows::AgentWatch { id: 3, kind: bise_proto::rows::WatchKind::Bg, what: "cargo test".into(), since_ms: since, noted: false, resumes: true, until_ms: None };
    app.sb.agents = vec![Agent { main: true, name: "main".into(), status: "idle".into(), ..Agent::default() }, Agent { name: "perf".into(), status: "idle".into(), watching: vec![w], ..Agent::default() }];
    let t = panel_rows(&app, 40, 6);
    let row = t.iter().find(|r| r.contains("perf")).cloned().unwrap_or_default();
    assert!(row.contains(&format!("{} perf", G_WAITING)) && row.contains("2m"), "{row:?}");
    assert_eq!(crate::sb::title_status(&app).running, 1, "it counts in the tab title");
    app.hold = Hold::of(Held::Ctrl, std::time::Instant::now() - std::time::Duration::from_secs(2));
    let t = panel_rows(&app, 40, 6);
    let row = t.iter().find(|r| r.contains("perf")).cloned().unwrap_or_default();
    assert!(row.ends_with("cargo t…"), "{row:?}");
    app.hold = Hold::default();
    app.sb.agents[1].watching[0].resumes = false;
    let t = panel_rows(&app, 40, 6);
    let row = t.iter().find(|r| r.contains("perf") && !r.contains(G_WATCHING)).cloned().unwrap_or_default();
    assert!(row.contains(&format!("{} perf", G_IDLE)), "an alarm leaves it idle: {row:?}");
    app.sb.agents[1].watching.clear();
    let t = panel_rows(&app, 40, 6);
    let row = t.iter().find(|r| r.contains("perf")).cloned().unwrap_or_default();
    assert!(row.contains(&format!("{} perf", G_IDLE)), "{row:?}");
}
