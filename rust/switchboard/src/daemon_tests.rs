//! daemon.rs' unit tests: hub-fifo's urgent lane, a stop ahead of queued
//! REPL lines, the journal's unknown kinds, the live lines' time.
use super::*;

/// hub-fifo's urgent lane holds a client's own messages, client-protocol's
/// too: its `initialize` connection (RpcNew) and a thread's typed answer
/// to its request (Typed); the rest waits its turn.
#[test]
fn a_clients_own_messages_take_the_urgent_lane() {
    let (a, _b) = UnixStream::pair().unwrap();
    assert!(Msg::is_urgent(&Msg::RpcNew { id: 1, stream: a, v: Value::Null, peer: String::new() }));
    assert!(Msg::is_urgent(&Msg::Typed { to: rpc::Typed::Answer(1), v: Value::Null }));
    assert!(Msg::is_urgent(&Msg::ClientGone { id: 1 }));
    assert!(!Msg::is_urgent(&Msg::In(Input::Tick)));
}

/// 2026-10-11, his hub: `bise switchboard --stop` at 22:18:16, its
/// Shutdown queued behind ~85 s of REPL lines, the client said
/// "stopped", bise-dev attached again, and the stop fired at 22:19:41
/// under him (main and 7 busy agents SIGTERMed). A stop, keep or not,
/// is the loop's next message whatever waits in the rest lane.
#[test]
fn a_stop_goes_ahead_of_queued_repl_lines() {
    use super::inbox::{Inbox, Next};
    let (tx, rx) = std::sync::mpsc::channel();
    let line = |n: u64| Msg::ReplLine { dir: "amb-win".into(), gen: 1, line: format!("--- line {n}"), offset: n };
    for n in 0..5000 {
        tx.send(line(n)).unwrap();
    }
    tx.send(Msg::Shutdown { keep: false }).unwrap();
    tx.send(line(5000)).unwrap();
    let mut inbox = Inbox::new(rx, Msg::is_urgent);
    match inbox.next(Some(Duration::ZERO)) {
        Next::Msg(Msg::Shutdown { keep }) => assert!(!keep),
        Next::Msg(_) => panic!("a REPL line went before the stop"),
        _ => panic!("nothing in the inbox"),
    }
    assert!(Msg::is_urgent(&Msg::Shutdown { keep: true }));
}

/// A line that is not a JSON object (a half-written last line) is
/// counted with its number, never dropped in silence; a kind the Rust
/// side does not know is kept (sb-core decodes the events).
#[test]
fn the_journal_keeps_unknown_kinds_and_counts_unreadable_lines() {
    let text = "{\"type\":\"main_notes_flushed\"}\n{\"type\":\"from_a_newer_hub\",\"x\":1}\n\n42\n{\"type\":\"main_no";
    let (events, bad) = read_journal(text);
    assert_eq!(events.len(), 2);
    assert_eq!(events[1]["type"], "from_a_newer_hub");
    assert_eq!(bad, vec![4, 5]);
    assert_eq!(lines_list(&(1..=12).collect::<Vec<_>>()), "1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...");
}

/// A live `line` carries its transcript time as `ts` too (BISE-271:
/// the turns' end times, the pause marks of a replayed feed); an
/// unknown time (0) is left out.
#[test]
fn live_lines_carry_their_time() {
    assert_eq!(
        lines::line_event("main", 3, 1700000000000, "  obs: turn_done: completed"),
        json!({"ev": "line", "agent": "main", "line": "  obs: turn_done: completed", "pos": 3, "ts": 1700000000000u64})
    );
    assert_eq!(lines::line_event("t1", 1, 0, "x"), json!({"ev": "line", "agent": "t1", "line": "x", "pos": 1}));
}
