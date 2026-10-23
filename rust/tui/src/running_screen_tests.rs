//! /running: what the screen draws at 150 and 80 columns for
//! procs-hub's fixture, and what its keys do and send.

use super::*;
use crate::running::tests::{fixture, NOW};
use ratatui::backend::TestBackend;
use ratatui::Terminal;
use std::os::unix::net::UnixStream;

fn texts(ls: &[Line]) -> Vec<String> {
    ls.iter().map(|l| l.spans.iter().map(|s| s.content.as_ref()).collect()).collect()
}

fn order() -> Vec<String> {
    ["main", "perf", "docs"].map(String::from).to_vec()
}

fn screen() -> Screen {
    Screen { items: Some(fixture()), sel: Some(("perf".into(), "bg3.1791100100".into())), ..Default::default() }
}

/// An app with main, perf and docs in its panel, and its hub's end.
fn app_hub() -> (App, UnixStream) {
    let (mut app, hub) = crate::sb::bench::test_app_hub();
    for name in ["main", "perf", "docs"] {
        crate::sb::bench::add_agent(&mut app, name, "");
    }
    (app, hub)
}

/// The app with the screen open on the fixture.
fn app_open() -> (App, UnixStream) {
    let (mut app, hub) = app_hub();
    app.running = Some(Screen::default());
    listed(&mut app, &fixture());
    (app, hub)
}

fn press(app: &mut App, c: KeyCode) {
    on_key(app, &KeyEvent::new(c, KeyModifiers::NONE));
}

/// The requests sent since the last call: (method, params).
fn sent(hub: &mut UnixStream) -> Vec<(String, serde_json::Value)> {
    crate::sb::bench::hub_sent(hub).into_iter().map(|v| (v["method"].as_str().unwrap_or_default().to_string(), v["params"].clone())).collect()
}

#[test]
fn at_150_columns_groups_rows_tip_and_keys() {
    let sc = screen();
    let (ls, sel) = list_lines(&sc, &order(), "acme", 146, NOW);
    let t = texts(&ls);
    assert_eq!(t[0], running::group("acme", "perf"));
    assert!(t[1].starts_with("› ∿ pnpm dev ") && t[1].contains("localhost:5173") && t[1].trim_end().ends_with("14 min"), "{}", t[1]);
    assert_eq!(sel, Some(1));
    // the selected row's tip under it, then the next row
    assert!(t[2].trim_start().starts_with("bg3 · started "), "{}", t[2]);
    assert!(t[3].starts_with("  ∿ node scripts/watch.mjs"), "{}", t[3]);
    assert!(t.iter().any(|l| l.contains("python3 -m http.server 8000") && l.contains(running::stopped_by_you)), "{t:#?}");
    assert!(t.iter().any(|l| l.starts_with("  ✗ cargo test --workspace") && l.contains(&running::exit_rc(101))), "{t:#?}");
    assert!(t.iter().any(|l| l == &running::group("acme", "docs")));
    assert!(t.iter().any(|l| l.contains("mkdocs serve") && l.contains(&running::stopped_with("docs"))), "{t:#?}");
    assert!(t.iter().all(|l| l.width() <= 146), "{t:#?}");
    // no numbers on a row (cpu, memory, pid are the output's)
    assert!(t.iter().all(|l| !l.contains("cpu") && !l.contains("48211")), "{t:#?}");
}

#[test]
fn at_80_columns_the_short_words() {
    let sc = screen();
    let (ls, _) = list_lines(&sc, &order(), "acme", 76, NOW);
    let t = texts(&ls);
    assert!(t[1].contains(":5173") && !t[1].contains("localhost"), "{}", t[1]);
    assert!(t.iter().any(|l| l.contains(&format!("{} · {}", running::exit_rc(101), running::ago_short("")).replace(" ago", ""))), "{t:#?}");
    assert!(t.iter().all(|l| l.width() <= 76), "{t:#?}");
}

#[test]
fn empty_and_no_match_say_so() {
    let mut sc = Screen { items: Some(vec![]), ..Default::default() };
    assert_eq!(texts(&list_lines(&sc, &order(), "acme", 146, NOW).0), vec![running::empty.to_string()]);
    sc.filter = Filter::Ended;
    assert_eq!(texts(&list_lines(&sc, &order(), "acme", 146, NOW).0), vec![running::empty_ended.to_string()]);
    sc.items = Some(fixture());
    sc.query = "nothing like it".into();
    assert_eq!(texts(&list_lines(&sc, &order(), "acme", 146, NOW).0), vec![running::none_match.to_string()]);
}

#[test]
fn the_whole_screen_draws_at_150_and_80() {
    for (wd, keys) in [(150u16, running::keys_list), (80, running::keys_list_short)] {
        let (mut app, _hub) = app_open();
        let mut term = Terminal::new(TestBackend::new(wd, 30)).unwrap();
        term.draw(|f| draw(&mut app, f)).unwrap();
        let buf = term.backend().buffer().clone();
        let rows: Vec<String> = (0..buf.area.height).map(|y| (0..buf.area.width).map(|x| buf[(x, y)].symbol().to_string()).collect()).collect();
        let all = rows.join("\n");
        assert!(all.contains("pnpm dev") && all.contains(keys), "{wd}:\n{all}");
        if wd == 150 {
            assert!(all.contains(running::keys_head) && all.contains(&running::count_running(3)), "{all}");
        }
    }
}

#[test]
fn it_opens_on_the_agent_in_view_and_keys_move_and_filter() {
    let (mut app, mut hub) = app_hub();
    crate::sb::focus(&mut app, "docs");
    sent(&mut hub);
    open(&mut app);
    assert!(sent(&mut hub).iter().any(|(m, p)| m == "processes/list" && p["watch"] == true));
    listed(&mut app, &fixture());
    let sel = |app: &App| app.running.as_ref().unwrap().sel.clone().unwrap();
    assert_eq!(sel(&app).0, "docs");
    press(&mut app, KeyCode::Down);
    assert_eq!(sel(&app), ("docs".into(), "p47500.1791099650".into()));
    press(&mut app, KeyCode::Down);
    assert_eq!(sel(&app), ("docs".into(), "bg1.1791098000".into()));
    press(&mut app, KeyCode::Down);
    assert_eq!(sel(&app), ("docs".into(), "bg1.1791098000".into()), "the last row stays");
    press(&mut app, KeyCode::Up);
    press(&mut app, KeyCode::Up);
    press(&mut app, KeyCode::Up);
    assert_eq!(sel(&app).0, "perf");
    // tab: the ended ones only, the selection on one of them
    press(&mut app, KeyCode::Tab);
    let k = sel(&app);
    assert!(fixture().iter().any(|p| (p.agent.clone(), p.id.clone()) == k && !p.running()));
    // / searches, esc clears it
    press(&mut app, KeyCode::Tab);
    press(&mut app, KeyCode::Char('/'));
    for c in "mkdocs".chars() {
        press(&mut app, KeyCode::Char(c));
    }
    assert_eq!(sel(&app), ("docs".into(), "bg1.1791098000".into()));
    press(&mut app, KeyCode::Esc);
    assert!(app.running.as_ref().unwrap().query.is_empty() && app.running.is_some());
    // esc closes, and the list stops coming
    press(&mut app, KeyCode::Esc);
    assert!(app.running.is_none());
    assert!(sent(&mut hub).iter().any(|(m, p)| m == "processes/list" && p["watch"] == false));
}

#[test]
fn s_stops_with_no_question_and_says_stopping_until_it_ends() {
    let (mut app, mut hub) = app_open();
    app.running.as_mut().unwrap().sel = Some(("perf".into(), "bg3.1791100100".into()));
    press(&mut app, KeyCode::Char('s'));
    assert!(sent(&mut hub).iter().any(|(m, p)| m == "process/stop" && p["agent"] == "perf" && p["id"] == "bg3.1791100100"));
    let sc = app.running.as_ref().unwrap();
    let t = texts(&list_lines(sc, &order(), "acme", 146, NOW).0);
    assert!(t[1].ends_with(running::stopping) || t[1].trim_end().ends_with(running::stopping), "{}", t[1]);
    // the hub's row: stopped by him; `stopping…` goes
    let mut items = fixture();
    items[0].state = bise_proto::rows::ProcState::StoppedByYou;
    items[0].ended_ms = Some(NOW);
    listed(&mut app, &items);
    let sc = app.running.as_ref().unwrap();
    assert!(sc.stopping.is_empty());
    let t = texts(&list_lines(sc, &order(), "acme", 146, NOW).0);
    assert!(t.iter().any(|l| l.contains("pnpm dev") && l.contains(running::stopped_by_you)), "{t:#?}");
    // s on an ended one: a word, no request
    press(&mut app, KeyCode::Char('s'));
    assert!(sent(&mut hub).is_empty());
    assert_eq!(app.running.as_ref().unwrap().note.as_ref().unwrap().0, running::already_ended);
}

#[test]
fn o_on_a_port_nothing_answers_flashes_why() {
    let (mut app, _hub) = app_open();
    // a port nothing listens on in the test
    let mut items = fixture();
    items[0].ports = vec![1];
    listed(&mut app, &items);
    app.running.as_mut().unwrap().sel = Some(("perf".into(), "bg3.1791100100".into()));
    press(&mut app, KeyCode::Char('o'));
    assert_eq!(app.running.as_ref().unwrap().note.as_ref().unwrap().0, running::not_answering(1));
    app.running.as_mut().unwrap().sel = Some(("docs".into(), "p49012.1791100160".into()));
    press(&mut app, KeyCode::Char('o'));
    assert_eq!(app.running.as_ref().unwrap().note.as_ref().unwrap().0, running::no_port);
    // an ended one: it has ended, not 'no port'
    app.running.as_mut().unwrap().sel = Some(("docs".into(), "bg1.1791098000".into()));
    press(&mut app, KeyCode::Char('o'));
    assert_eq!(app.running.as_ref().unwrap().note.as_ref().unwrap().0, running::already_ended);
}

#[test]
fn enter_without_a_local_file_reads_the_hub_and_follows() {
    let (mut app, mut hub) = app_open();
    // the detached watcher: its file is the hub's to read
    app.running.as_mut().unwrap().sel = Some(("perf".into(), "p48990.1791100150".into()));
    press(&mut app, KeyCode::Enter);
    assert!(crate::running_less::take().is_none());
    let calls = sent(&mut hub);
    assert!(calls.iter().any(|(m, p)| m == "process/output" && p["id"] == "p48990.1791100150"));
    assert!(calls.iter().any(|(m, p)| m == "process/follow" && p["on"] == true));
    // the hub's bytes, then a follow notification
    use base64::Engine;
    let b64 = |s: &str| base64::engine::general_purpose::STANDARD.encode(s);
    let first = "\x1b[32mwatching\x1b[0m src\nbuilt in 12 ms\n";
    output(&mut app, "perf", "p48990.1791100150", 0, &b64(first));
    output(&mut app, "perf", "p48990.1791100150", first.len() as u64, &b64("rebuilt\n"));
    // another process's bytes are not this view's
    output(&mut app, "perf", "bg3.1791100100", 0, &b64("nope\n"));
    let sc = app.running.as_ref().unwrap();
    let o = sc.out.as_ref().unwrap();
    let p = sc.items.as_ref().unwrap().iter().find(|p| p.id == "p48990.1791100150").cloned();
    let t = texts(&out_lines(o, p.as_ref(), "acme", false, 146, 20, NOW));
    assert!(t[0].starts_with("node scripts/watch.mjs  ") && t[0].contains(&running::whose("perf", "acme")), "{}", t[0]);
    assert_eq!(&t[2..5], ["watching src", "built in 12 ms", "rebuilt"]);
    assert_eq!(t.last().unwrap(), running::keys_output);
    // esc: back to the list, the follow off
    press(&mut app, KeyCode::Esc);
    assert!(app.running.as_ref().unwrap().out.is_none());
    assert!(sent(&mut hub).iter().any(|(m, p)| m == "process/follow" && p["on"] == false));
}

#[test]
fn a_process_with_no_output_says_so_in_one_dim_line() {
    let (mut app, mut hub) = app_open();
    app.running.as_mut().unwrap().sel = Some(("docs".into(), "p49012.1791100160".into()));
    press(&mut app, KeyCode::Enter);
    assert!(!sent(&mut hub).iter().any(|(m, _)| m == "process/output"), "nothing to read");
    let sc = app.running.as_ref().unwrap();
    let p = sc.items.as_ref().unwrap().iter().find(|p| p.id == "p49012.1791100160").cloned();
    let t = texts(&out_lines(sc.out.as_ref().unwrap(), p.as_ref(), "acme", false, 76, 12, NOW));
    assert_eq!(t[2], running::no_output);
}

#[test]
fn a_takes_you_to_its_agent() {
    let (mut app, _hub) = app_open();
    app.running.as_mut().unwrap().sel = Some(("docs".into(), "bg1.1791098000".into()));
    press(&mut app, KeyCode::Char('a'));
    assert!(app.running.is_none());
    assert_eq!(app.sb.focus, "docs");
}
