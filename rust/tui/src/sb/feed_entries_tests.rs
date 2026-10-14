//! The feed from entries: a first page replaces the feed, a new pos
//! appends, a known pos (a changed entry) replaces its events in place
//! and leaves the others where they were, an older page goes in front,
//! and the window's marks follow every move.

use super::*;
use crate::sb::bench::test_app;
use bise_proto::thread::{fold, Ctx, Line};

fn entries(ls: &[&str]) -> Vec<Entry> {
    let lines: Vec<Line> = ls.iter().enumerate().map(|(i, l)| (i as u64 + 1, 1_700_000_000_000 + i as u64 * 1000, l.to_string())).collect();
    let none = |_: &str| None;
    let ctx = Ctx { open_cards: &[], page: &none, provider: &|_: &str, k: &str| k.to_string(), width: &|s: &str| s.chars().count(), offset: &|_| 0, attached: &bise_proto::thread::Attached::plain };
    fold(&lines, &ctx)
}

fn subscribed(agent: &str) -> App {
    let mut app = test_app();
    app.sb.subscribed.insert(agent.to_string());
    app
}

/// The feed's events by kind; the turn edges (hidden rows, their own
/// test) left out.
fn kinds(app: &App) -> Vec<&'static str> {
    app.events
        .iter()
        .filter_map(|e| match e {
            Ev::You(..) => Some("you"),
            Ev::Assistant(_) => Some("agent"),
            Ev::Tool(_) => Some("tool"),
            Ev::Thinking { .. } => Some("thinking"),
            Ev::AgentMsg { .. } => Some("msg"),
            Ev::TimeMark(_) => Some("time"),
            Ev::Turn | Ev::TurnDone | Ev::Ended(_) => None,
            _ => Some("other"),
        })
        .collect()
}

const TURN: &[&str] = &[
    "sb you : run the tests",
    "  obs: turn_started",
    "  obs: tool_started #1",
    "tool #1 bash : cargo test -q",
    "  obs: tool_finished #1 ok",
    "  obs: assistant: all pass.",
];

#[test]
fn a_first_page_replaces_the_feed_and_marks_its_entries() {
    let mut app = subscribed("main");
    // a feed that held a page before (what came before the connection's
    // first one stays: the next law)
    app.win.first_pos = Some(1);
    app.events.push(Ev::Info("stale".into()));
    app.cache.push(None);
    let es = entries(TURN);
    page(&mut app, "main", None, es.clone(), false);
    assert_eq!(kinds(&app), ["you", "tool", "agent"]);
    let marks: Vec<(usize, usize)> = app.win.marks.iter().copied().collect();
    // a turn starts at pos 3: its (hidden) turn row is that entry's first event
    assert_eq!(marks, [(0, 1), (1, 3), (3, 6)], "(event, entry pos)");
    assert_eq!(app.win.first_pos, Some(1), "nothing before it: no page to ask");
    page(&mut app, "main", None, es[1..].to_vec(), true);
    assert_eq!(app.win.first_pos, Some(3), "more before it: its first pos");
}

/// FINAL gate (tui_update_tmux): /update typed before `initialize`
/// answered gets the hub's words before main's first page (asked at that
/// answer); the page keeps them under its entries. A page again (a
/// resubscribe) replaces the feed whole.
#[test]
fn what_came_before_the_connections_first_page_stays_under_it() {
    let mut app = subscribed("main");
    app.events.push(Ev::Info("building the latest commit, abc1234".into()));
    app.cache.push(None);
    page(&mut app, "main", None, entries(TURN), false);
    assert_eq!(kinds(&app), ["you", "tool", "agent", "other"]);
    assert!(matches!(app.events.last(), Some(Ev::Info(t)) if t.starts_with("building the latest commit")));
    assert_eq!(app.events.len(), app.cache.len());
    page(&mut app, "main", None, entries(TURN), false);
    assert_eq!(kinds(&app), ["you", "tool", "agent"], "a second first page: the feed is its entries");
}

#[test]
fn a_changed_entry_replaces_its_events_in_place() {
    let mut app = subscribed("main");
    let es = entries(TURN);
    page(&mut app, "main", None, es[..1].to_vec(), false);
    // the tools entry comes running, then again with a second call
    let mut more = TURN[..4].to_vec();
    let running = entries(&more);
    entry(&mut app, "main", &running[1]);
    assert_eq!(kinds(&app), ["you", "tool"]);
    more.extend(["  obs: tool_finished #1 ok", "  obs: tool_started #2", "tool #2 read_file : a.rs"]);
    let grown = entries(&more);
    entry(&mut app, "main", &grown[1]);
    assert_eq!(kinds(&app), ["you", "tool", "tool"], "the same entry, two calls now");
    // a newer entry after it, then the you entry changes (its mark): the
    // others stay where they are, the marks follow
    let reply = entries(&[TURN, &["  obs: assistant: done."]].concat());
    entry(&mut app, "main", reply.last().unwrap());
    assert_eq!(kinds(&app), ["you", "tool", "tool", "agent"]);
    let mut you = grown[0].clone();
    you.delivery = Some(Mark::Read);
    entry(&mut app, "main", &you);
    assert!(matches!(&app.events[0], Ev::You(_, Mark::Read, ..)), "his mark moved");
    assert_eq!(kinds(&app), ["you", "tool", "tool", "agent"]);
    let marks: Vec<(usize, usize)> = app.win.marks.iter().copied().collect();
    assert_eq!(marks, [(0, 1), (1, 3), (4, 7)]);
    assert_eq!(app.events.len(), app.cache.len());
}

#[test]
fn an_entry_of_a_thread_not_subscribed_does_nothing() {
    let mut app = test_app();
    entry(&mut app, "main", &entries(TURN)[0]);
    assert!(app.events.is_empty());
}

#[test]
fn an_older_page_goes_in_front() {
    let mut app = subscribed("main");
    let es = entries(TURN);
    page(&mut app, "main", None, es[2..].to_vec(), true);
    assert_eq!(app.win.first_pos, Some(6));
    // a stale answer (the feed moved since the ask): nothing
    page(&mut app, "main", Some(99), es[..2].to_vec(), false);
    assert_eq!(kinds(&app), ["agent"]);
    page(&mut app, "main", Some(6), es[..2].to_vec(), false);
    assert_eq!(kinds(&app), ["you", "tool", "agent"]);
    let marks: Vec<(usize, usize)> = app.win.marks.iter().copied().collect();
    assert_eq!(marks, [(0, 1), (1, 3), (3, 6)]);
    assert_eq!((app.win.first_pos, app.win.loading), (Some(1), false));
}

#[test]
fn a_pause_between_entries_gets_its_time_mark() {
    let mut app = subscribed("main");
    let mut es = entries(&["sb you : a", "sb you : b"]);
    es[1].at_ms = es[0].at_ms + 6 * 60_000;
    page(&mut app, "main", None, es, false);
    assert_eq!(kinds(&app), ["you", "time", "you"]);
}

#[test]
fn a_turn_edge_ends_the_turn_in_its_feed() {
    let mut app = subscribed("main");
    page(&mut app, "main", None, entries(TURN), false);
    let n = app.events.len();
    app.pending = true;
    app.interrupt_requested = true;
    turn_edge(&mut app, "main", false);
    assert!(!app.pending && !app.interrupt_requested);
    // the rows come with the entries (turn_start, turn_end_ms), not the
    // agents rows: one source for the edges drawn
    assert_eq!(app.events.len(), n);
}

/// BISE-271 from entries: a turn's start before its first entry, its end
/// and the end's time (the hub's, not this clock) after its last, so the
/// hover of a reply reads its own turn's end, never the next one's.
#[test]
fn a_turns_edges_and_end_time_come_with_its_entries() {
    let mut app = subscribed("main");
    let mut es = vec![
        json!({"pos": 1, "at_ms": 1000, "kind": "agent", "text": "first", "turn_start": true}),
        json!({"pos": 3, "at_ms": 3000, "kind": "agent", "text": "second", "turn_start": true, "turn_end_ms": 4000}),
    ];
    page(&mut app, "main", None, es.drain(..).map(|v| serde_json::from_value(v).unwrap()).collect(), false);
    let edges: Vec<String> = app.events.iter().filter_map(|e| match e {
        Ev::Turn => Some("turn".to_string()),
        Ev::TurnDone => Some("done".to_string()),
        Ev::Ended(t) => Some(format!("ended {t}")),
        _ => None,
    }).collect();
    assert_eq!(edges, ["turn", "turn", "done", "ended 4000"]);
    let end_of = |app: &App, text: &str| {
        let i = app.events.iter().position(|e| matches!(e, Ev::Assistant(t) if t == text)).unwrap();
        crate::feed::turn_end_of(&app.events, i)
    };
    assert_eq!(end_of(&app, "first"), None, "the first turn's end had no time");
    assert_eq!(end_of(&app, "second"), Some(4000));
    // live: the end comes as the newest entry again, at its pos
    entry(&mut app, "main", &serde_json::from_value(json!({"pos": 5, "at_ms": 5000, "kind": "agent", "text": "third", "turn_start": true})).unwrap());
    assert_eq!(end_of(&app, "third"), None, "still running");
    entry(&mut app, "main", &serde_json::from_value(json!({"pos": 5, "at_ms": 5000, "kind": "agent", "text": "third", "turn_start": true, "turn_end_ms": 6000})).unwrap());
    assert_eq!(end_of(&app, "third"), Some(6000));
}

/// The first row of an agent fires nothing, then its ends do (the edges'
/// own laws: turns.rs turn_edges).
#[test]
fn the_first_row_fires_nothing() {
    let mut app = subscribed("main");
    app.pending = true;
    agent_row(&mut app, "main", false, 2);
    assert!(app.pending, "the first row fires nothing");
    agent_row(&mut app, "main", false, 4);
    assert!(!app.pending);
}

/// cost-pause (designer m_18932): a turn cut by /pause shows only its
/// `‖ paused` line, and his message held by the pause shows once: dim
/// with `held until /resume`, then his row when delivered.
#[test]
fn a_pause_cut_and_a_held_message_show_once() {
    let ls = [
        "sb you : [[bash: sleep 30; echo late]]",
        "sb you-id : m_2",
        "sb stopped : stopped",
        "sb paused : ‖ paused · its turn stopped",
        "  obs: turn_started",
        "  obs: assistant: ",
        "  obs: tool_started #3",
        "tool #3 bash : sleep 30; echo late",
        "tool_code #3 : sleep 30; echo late",
        "tool_result #3 fail : exit 130: [bash: interrupted by bise: the command was stopped (TERM to its process group, then KILL); its output so far is above. Check what it changed before you run it again] ",
        "  obs: tool_finished #3 failed",
        "  obs: tool_result_committed #3",
        "  obs: candidate_discarded: interrupt",
        "  obs: turn_done: interrupted",
        "--- idle",
        "sb msg-in : switchboard m_3 : the project was paused. go on where your turn stopped.",
        "sb you : still there?",
        "sb you-id : m_4",
        "  obs: turn_started",
        "  obs: assistant: ack",
        "  obs: turn_done: completed",
    ];
    let mut app = subscribed("main");
    page(&mut app, "main", None, entries(&ls[..1]), false);
    let held_at = 13;
    // the hub sends each entry again as it changes: every prefix's entries
    for k in 2..=ls.len() {
        if k == held_at + 1 {
            push_event(&mut app.events, &mut app.cache, Ev::Held("still there?".into()));
        }
        for e in entries(&ls[..k]) {
            entry(&mut app, "main", &e);
        }
    }
    let texts: Vec<String> = app
        .events
        .iter()
        .filter_map(|e| match e {
            Ev::You(t, ..) => Some(format!("you {}", t.as_str())),
            Ev::Held(t) => Some(format!("held {}", t.as_str())),
            Ev::Warn(t) | Ev::Info(t) => Some(t.clone()),
            _ => None,
        })
        .collect();
    assert_eq!(texts.iter().filter(|t| *t == "you still there?").count(), 1, "{texts:#?}");
    assert!(!texts.iter().any(|t| t.starts_with("held ")), "{texts:#?}");
    assert!(!texts.iter().any(|t| t.contains("interrupt")), "{texts:#?}");
    // the call the pause cut: `– stopped by the pause`, no output, no ✗
    // (designer m_19111); none left running
    let tools: Vec<&crate::wire::ToolData> = app.events.iter().filter_map(|e| if let Ev::Tool(td) = e { Some(td) } else { None }).collect();
    assert_eq!(tools.len(), 1);
    assert!(tools[0].paused);
    let drawn: String = (0..app.events.len())
        .flat_map(|i| crate::feed::build_rows(&app.events, i, false, 80, 0))
        .map(|l| l.spans.iter().map(|s| s.content.as_ref()).collect::<String>() + "\n")
        .collect();
    assert!(drawn.contains("stopped by the pause") && drawn.contains("sleep 30"), "{drawn}");
    assert_eq!(app.events.len(), app.cache.len());
}

/// page-answer-row: his page answer's 'you' entry comes first without its
/// page part (sb-core writes the part on the next line); answered here
/// (the card's fold is drawn), the entry again with its part takes the
/// raw text away: nothing of the agent's template stays in the feed.
#[test]
fn his_page_answer_folded_here_leaves_no_raw_text() {
    let mut app = subscribed("main");
    let text = "you sent 1 note on your page \"plan\" (plan v1, http://x):\n1. on q1: pick: the effort table now\nanswer with: sb page publish <file> --id plan --notes-done n1";
    let raw: Entry = serde_json::from_value(serde_json::json!({"pos": 5, "at_ms": 0, "kind": "you", "text": text})).unwrap();
    entry(&mut app, "main", &raw);
    assert_eq!(kinds(&app), ["you"]);
    app.sb.fold_here(1, "main");
    let parts = serde_json::json!([{"kind": "page", "text": text, "to": "main", "page": "plan", "title": "plan", "version": 1,
        "notes": [{"block": "q1", "kind": "pick", "text": "the effort table now", "card": 1, "asked": "which table first?"}]}]);
    let typed: Entry = serde_json::from_value(serde_json::json!({"pos": 5, "at_ms": 0, "kind": "you", "text": text, "parts": parts})).unwrap();
    entry(&mut app, "main", &typed);
    assert!(kinds(&app).is_empty(), "{:?}", kinds(&app));
}
