//! Message marks (BISE-15, C3, book §13): moved out of feed_render_tests.rs as is.

use super::*;

// ---- BISE-15: message marks (C3, book §13) ----

/// The wire lines into a feed, as run::ingest_line parses them.
fn ingest(lines: &[&str]) -> (Vec<Ev>, Vec<Option<EventRows>>) {
    let (mut events, mut cache) = (Vec::new(), Vec::new());
    for l in lines {
        let (line, replayed) = strip_history(l);
        let ev = if replayed { parse_history_line(line) } else { parse_line(line) };
        if let Some(ev) = ev {
            push_event(&mut events, &mut cache, ev);
        }
    }
    (events, cache)
}

fn marks(events: &[Ev]) -> Vec<(String, Mark)> {
    events
        .iter()
        .filter_map(|e| match e {
            Ev::You(t, m, ..) => Some((t.text.clone(), *m)),
            _ => None,
        })
        .collect()
}

#[test]
fn steering_moves_the_mark_of_your_line() {
    // your line while the agent works: `·`, then `✓` (received), `✓✓` (read)
    let (mut events, mut cache) = ingest(&[
        "sb you : run the tests",
        "  obs: turn_started",
        "sb you : skip firefox",
    ]);
    let rows = cached_text(&events, &mut cache, 100);
    assert!(rows.contains(&format!("│  skip firefox {}", G_SENDING)), "{rows:#?}");
    push_event(&mut events, &mut cache, parse_line("  obs: steering_received: skip firefox").unwrap());
    let rows = cached_text(&events, &mut cache, 100);
    assert!(rows.contains(&format!("│  skip firefox {}", G_RECEIVED)), "{rows:#?}");
    push_event(&mut events, &mut cache, parse_line("  obs: steered: skip firefox").unwrap());
    let rows = cached_text(&events, &mut cache, 100);
    assert!(rows.contains(&format!("│  skip firefox {}", G_READ)), "{rows:#?}");
    // no info line for either: the mark says it
    assert!(!rows.iter().any(|r| r.contains("steer")), "{rows:#?}");
    // the colors: `·` dim, `✓` faint, `✓✓` accent
    let last = |evs: &[Ev]| -> Style {
        let rows = build_rows(evs, evs.len() - 1, false, 100, 0);
        rows.iter().flat_map(|r| r.spans.clone()).last().unwrap().style
    };
    let one = |m| vec![Ev::You("x".into(), m, false, None)];
    assert_eq!(last(&one(Mark::Sent)).fg, Some(crate::theme::dim()));
    assert_eq!(last(&one(Mark::Received)).fg, Some(crate::theme::faint()));
    assert_eq!(last(&one(Mark::Read)).fg, Some(crate::theme::accent()));
}

#[test]
fn a_mark_only_moves_up_and_finds_its_line() {
    let (mut events, mut cache) = ingest(&[
        "sb you : same text",
        "  obs: turn_started",
        "sb you : other",
        "sb you : same   text",
    ]);
    // a line break flattened on the wire still matches; the latest line
    // with the text gets it
    push_event(&mut events, &mut cache, parse_line("  obs: steered: same text").unwrap());
    push_event(&mut events, &mut cache, parse_line("  obs: steering_received: same text").unwrap());
    assert_eq!(
        marks(&events),
        vec![("same text".into(), Mark::Read), ("other".into(), Mark::Sent), ("same   text".into(), Mark::Read)]
    );
    // a steering line with no line of yours: nothing appended
    let n = events.len();
    push_event(&mut events, &mut cache, parse_line("  obs: steered: unknown").unwrap());
    assert_eq!(events.len(), n);
}

#[test]
fn a_message_at_idle_is_read_when_its_turn_starts() {
    let (events, _) = ingest(&["sb you : hello", "  obs: turn_started", "  obs: assistant: hi", "--- idle", "sb you : next"]);
    assert_eq!(marks(&events), vec![("hello".into(), Mark::Read), ("next".into(), Mark::Sent)]);
}

#[test]
fn a_replayed_history_restores_the_marks() {
    // --resume: `you :` lines were committed (read); a steering the Core
    // committed comes back as `injected :` and marks its line; an
    // injected notification stays an info line
    let (events, mut cache) = ingest(&[
        "history you : fix the login",
        "history   obs: turn_started",
        "history injected : skip firefox",
        "history injected : [notification] docs is done",
    ]);
    assert_eq!(marks(&events), vec![("fix the login".into(), Mark::Read)]);
    let rows = cached_text(&events, &mut cache, 100);
    // a replayed steering has no `you :` line of its own: it stays the
    // injected line (the REPL history can't tell it from a notification)
    assert!(rows.iter().any(|r| r.contains("injected · skip firefox")), "{rows:#?}");
    assert!(rows.iter().any(|r| r.contains("injected · [notification] docs is done")), "{rows:#?}");
    // with its line in the feed (typed live, then the REPL replays), the
    // injected line marks it read and adds nothing
    let (events, mut cache) = ingest(&["sb you : skip firefox", "history injected : skip firefox"]);
    assert_eq!(marks(&events), vec![("skip firefox".into(), Mark::Read)]);
    assert_eq!(cached_text(&events, &mut cache, 100), vec![format!("│  skip firefox {}", G_READ)]);
    // a steering typed live then replayed from the hub transcript: the
    // same obs lines give the same marks
    let (events, _) = ingest(&[
        "sb you : fix the login",
        "  obs: turn_started",
        "sb you : skip firefox",
        "  obs: steering_received: skip firefox",
        "sb you : and log the headers",
        "  obs: steering_received: and log the headers",
        "  obs: steered: skip firefox",
        "sb you : also logout",
    ]);
    assert_eq!(
        marks(&events),
        vec![
            ("fix the login".into(), Mark::Read),
            ("skip firefox".into(), Mark::Read),
            ("and log the headers".into(), Mark::Received),
            ("also logout".into(), Mark::Sent),
        ]
    );
}

#[test]
fn mains_replies_carry_its_glyph_in_its_feed_only() {
    let (events, mut cache) = arrive(vec![Ev::Assistant("on it: auth-fix takes safari.".into())]);
    crate::render::set_main_feed(true);
    let in_main = cached_text(&events, &mut cache, 100);
    // the rows built for main's feed rebuild inside an agent
    crate::render::set_main_feed(false);
    let in_agent = cached_text(&events, &mut cache, 100);
    assert_eq!(in_main, vec![format!(" {} on it: auth-fix takes safari.", crate::theme::G_MAIN)]);
    assert_eq!(in_agent, vec![" on it: auth-fix takes safari.".to_string()]);
}

// BISE-90: the hub steered your message together with an agent's message
// and the agents' status: the steered text is that block, not your
// words; it still moves the marks of what you sent during this turn
#[test]
fn a_combined_steer_moves_the_marks_of_this_turn() {
    let mut events: Vec<Ev> = Vec::new();
    let mut cache: Vec<Option<EventRows>> = Vec::new();
    push_event(&mut events, &mut cache, Ev::You("before".into(), Mark::Sent, false, None));
    push_event(&mut events, &mut cache, Ev::Turn);
    push_event(&mut events, &mut cache, Ev::You("also check the logs".into(), Mark::Sent, false, None));
    let block = "<agent_message from=\"noisy\" relation=\"child\" id=\"m_4\">";
    let mark = |to| Ev::MarkYou { mark: bise_proto::thread::lines::Mark::Text { text: block.into(), to, or_turn: true }, or: None };
    assert!(!push_event(&mut events, &mut cache, mark(Mark::Received)));
    assert!(matches!(&events[2], Ev::You(_, Mark::Received, ..)));
    assert!(!push_event(&mut events, &mut cache, mark(Mark::Read)));
    assert!(matches!(&events[2], Ev::You(_, Mark::Read, ..)));
    // a message of an earlier turn keeps its own mark (Turn read it)
    assert!(matches!(&events[0], Ev::You(_, Mark::Read, ..)));
    assert_eq!(events.len(), 3);
}

// architect m_16963 (sha 2): his messages' ✓ and ✓✓ come from sb-core's
// receipts by id (`sb steer-rx`, `sb steered`, after his `sb you-id`);
// the runtime's steering lines move only id-less messages (transcripts
// before 9633cd2a)
fn fed(ls: &[&str]) -> (Vec<Ev>, Vec<Option<EventRows>>) {
    let mut events: Vec<Ev> = Vec::new();
    let mut cache: Vec<Option<EventRows>> = Vec::new();
    for l in ls {
        feed_line(&mut events, &mut cache, l);
    }
    (events, cache)
}

fn feed_line(events: &mut Vec<Ev>, cache: &mut Vec<Option<EventRows>>, l: &str) {
    if let Some(ev) = parse_line(l) {
        push_event(events, cache, ev);
    }
}

const STEER_START: [&str; 5] = ["sb you : go", "sb you-id : m_1", "  obs: turn_started", "  obs: tool_started #1", "tool #1 bash : sleep 8"];

#[test]
fn a_single_steer_is_marked_by_its_receipts() {
    let mut ls = STEER_START.to_vec();
    ls.extend(["sb you : steer one", "sb you-id : m_2"]);
    let (mut events, mut cache) = fed(&ls);
    assert_eq!(yours(&events)[1], ("steer one".into(), Mark::Sent, Some(2)), "its id from the line after it");
    feed_line(&mut events, &mut cache, "  obs: steering_received: steer one");
    assert_eq!(yours(&events)[1].1, Mark::Sent, "the runtime's words move no message with an id");
    feed_line(&mut events, &mut cache, "sb steer-rx : m_2");
    assert_eq!(yours(&events)[1].1, Mark::Received);
    feed_line(&mut events, &mut cache, "  obs: steered: steer one");
    assert_eq!(yours(&events)[1].1, Mark::Received);
    feed_line(&mut events, &mut cache, "sb steered : m_2");
    assert_eq!(yours(&events)[1].1, Mark::Read);
    assert_eq!(events.iter().filter(|e| matches!(e, Ev::You(..))).count(), 2, "the id and receipt lines make no row");
}

#[test]
fn a_bundled_steer_marks_each_message_it_names() {
    let mut ls = STEER_START.to_vec();
    ls.extend(["sb you : steer a", "sb you-id : m_2", "sb you : steer b", "sb you-id : m_3", "sb steer-rx : m_2 m_3"]);
    let (mut events, mut cache) = fed(&ls);
    assert_eq!(yours(&events)[1..].iter().map(|y| y.1).collect::<Vec<_>>(), [Mark::Received, Mark::Received]);
    feed_line(&mut events, &mut cache, "sb steered : m_2 m_3");
    assert_eq!(yours(&events)[1..].iter().map(|y| y.1).collect::<Vec<_>>(), [Mark::Read, Mark::Read]);
}

#[test]
fn two_messages_with_the_same_words_move_by_id_only() {
    let mut ls = STEER_START.to_vec();
    ls.extend(["sb you : again", "sb you-id : m_2", "sb you : again", "sb you-id : m_3"]);
    let (mut events, mut cache) = fed(&ls);
    for l in ["  obs: steering_received: again", "sb steer-rx : m_2", "  obs: steered: again", "sb steered : m_2"] {
        feed_line(&mut events, &mut cache, l);
    }
    let y = yours(&events);
    assert_eq!((y[1].1, y[1].2), (Mark::Read, Some(2)), "{y:?}");
    assert_eq!((y[2].1, y[2].2), (Mark::Sent, Some(3)), "the other 'again' stays: {y:?}");
}

#[test]
fn an_old_transcript_without_ids_is_still_marked_by_its_words() {
    let (events, _) = fed(&["sb you : go", "  obs: turn_started", "sb you : steer one", "  obs: steering_received: steer one"]);
    assert_eq!(yours(&events)[1], ("steer one".into(), Mark::Received, None));
    let (events, _) = fed(&["sb you : go", "  obs: turn_started", "sb you : steer one", "  obs: steering_received: steer one", "  obs: steered: steer one"]);
    assert_eq!(yours(&events)[1].1, Mark::Read);
}

// a steer-rx receipt and its steered receipt in the same burst: ✓ then ✓✓,
// never ✓✓ then ✓ (a late ✓ never lowers ✓✓)
#[test]
fn a_burst_of_both_receipts_goes_up_only() {
    let mut ls = STEER_START.to_vec();
    ls.extend(["sb you : steer one", "sb you-id : m_2"]);
    let (mut events, mut cache) = fed(&ls);
    let mut seen = Vec::new();
    for l in ["sb steer-rx : m_2", "sb steered : m_2", "sb steer-rx : m_2"] {
        feed_line(&mut events, &mut cache, l);
        seen.push(yours(&events)[1].1);
    }
    assert_eq!(seen, [Mark::Received, Mark::Read, Mark::Read]);
}

// BISE-90: an opened report whose first line is longer than the row hangs
// its continuation under the text, never at column 1
#[test]
fn an_open_report_hangs_its_rows() {
    let long = "p95 at 180 ms, nothing to fix, the slow tail is the cold cache on the first request of each worker";
    let ev = Ev::AgentMsg {
        from: "bench".into(),
        to: String::new(),
        text: format!("[report: done] {}", long),
        level: 3,
        id: String::new(),
        parts: Vec::new(),
        open: true,
        fold: false,
    };
    let rows = rows_text(&ev_rows(&ev, 0, 60));
    assert!(rows.len() >= 2, "{rows:#?}");
    assert!(rows[0].starts_with(" ✓ bench: p95"), "{rows:#?}");
    for r in &rows[1..] {
        assert!(r.starts_with("   ") && !r.starts_with("    "), "{r:?} in {rows:#?}");
    }
}

// BISE-97: main's reply is wrapped once, at its text's width; the rows
// under the first line up with its text (at 80 columns a row 1 cell too
// wide used to wrap again, leaving a one-word row)
#[test]
fn mains_reply_wraps_once_under_its_text() {
    let long = "the quick brown fox jumps over the lazy dog and keeps running across the field until the evening comes and the light fades away slowly";
    crate::render::set_main_feed(true);
    for w in 40..110usize {
        let rows: Vec<String> = crate::render::ev_rows(&Ev::Assistant(long.into()), 0, w)
            .iter()
            .map(|l| l.spans.iter().map(|s| s.content.as_ref()).collect())
            .collect();
        let text_w = crate::render::prose_width(w) - 4;
        // no row is cut short: each one but the last could not take the next word
        for pair in rows.windows(2) {
            let next = pair[1].split_whitespace().next().unwrap();
            assert!(pair[0].trim_start_matches([' ', ':', '*']).chars().count() + 1 + next.chars().count() > text_w, "w {}: {:?}", w, rows);
        }
        for r in &rows[1..] {
            assert!(r.starts_with("    ") && !r[4..].starts_with(' '), "w {}: {:?}", w, rows);
        }
    }
    crate::render::set_main_feed(false);
}

#[test]
fn session_log_facts_are_not_in_the_feed() {
    // BISE-195: the REPL's `ev:` lines go to the hub's session writer
    assert!(parse_line(r#"  ev: {"type":"turn_started","v":1,"data":{"cause":"user"}}"#).is_none());
}
