//! input.rs' key tests: the keys that fold and open the feed's entries.
use super::*;
use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};

fn thinking(open: bool) -> Ev {
    Ev::Thinking { ms: 10, text: "hm".into(), open }
}

fn report(open: bool) -> Ev {
    let text = "[report: done] p95 at 180 ms.\n- ran 3 times";
    Ev::AgentMsg { from: "bench".into(), to: String::new(), text: text.into(), level: 3, id: "m_3".into(), parts: Vec::new(), open, fold: false }
}

fn opens(app: &App) -> Vec<bool> {
    app.events
        .iter()
        .map(|e| match e {
            Ev::Thinking { open, .. } | Ev::AgentMsg { open, .. } => *open,
            _ => true,
        })
        .collect()
}

fn press(app: &mut App, code: KeyCode, m: KeyModifiers) {
    on_key(app, &KeyEvent::new(code, m));
}

/// ctrl+o (book §16): one state for everything folded. Anything
/// closed: all open; again: all closed; new thinking follows.
#[test]
fn ctrl_o_opens_then_closes_everything_folded() {
    let mut app = crate::sb::bench::test_app();
    app.events = vec![thinking(true), report(false), Ev::Info("x".into()), thinking(false)];
    app.cache = (0..4).map(|_| None).collect();
    press(&mut app, KeyCode::Char('o'), KeyModifiers::CONTROL);
    assert_eq!(opens(&app), vec![true, true, true, true]);
    assert!(app.show_thinking);
    press(&mut app, KeyCode::Char('o'), KeyModifiers::CONTROL);
    assert_eq!(opens(&app), vec![false, false, true, false]);
    assert!(!app.show_thinking);
    // ctrl+t is gone (no alias): nothing changes
    press(&mut app, KeyCode::Char('t'), KeyModifiers::CONTROL);
    assert_eq!(opens(&app), vec![false, false, true, false]);
}
