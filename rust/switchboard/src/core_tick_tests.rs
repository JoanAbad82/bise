//! hub-tick: a Tick on a big history ends in milliseconds. On his hub
//! (2026-10-17, 739 agents, 23 live watches) one Tick held the loop
//! 38 min: sb-core's replies_orphan (reach.bend), run at every tick,
//! called itself twice per watch inside a Bool.pick, 2^n calls for n
//! live watches. With 30 watches the old walk never ends; computed once,
//! a tick is a few ms. The bound is 5 s (a loaded machine), and the
//! tick runs on its own thread so the old code fails at the bound
//! instead of hanging the test run: its sb-core is killed then.

use super::*;
use std::sync::mpsc;
use std::time::{Duration, Instant};

/// ~700 agents (most archived, as on his hub) and `watches` live bg
/// watches spread over the active ones.
fn big_history(agents: usize, active: usize, watches: usize) -> Vec<Value> {
    let ws = json!({"mode": "shared", "path": "/w", "branch": null, "base_commit": null, "dropped": false});
    let mut ev = Vec::new();
    for i in 0..agents {
        let name = format!("t{}", i);
        ev.push(json!({"type": "task_created", "name": name, "parent": "main", "ws": ws, "at_ms": 1000 + i as u64}));
        if i >= active {
            ev.push(json!({"type": "lifecycle", "name": name, "lifecycle": "archived", "reason": "drop"}));
        }
    }
    for id in 1..=watches as u64 {
        let agent = format!("t{}", id as usize % active);
        ev.push(json!({"type": "wake_set", "watch": {"id": id, "agent": agent,
            "spec": {"kind": "bg", "slot": format!("/fake/bg/{}", id), "cmd": "sleep 1"},
            "max_text": "", "set_at": 10_000 + id, "max_at": 9_000_000_000_000u64, "quiet": true, "resumes": true}}));
    }
    ev
}

#[test]
fn a_tick_with_30_live_watches_and_700_agents_ends_in_ms() {
    const BOUND: Duration = Duration::from_secs(5);
    let (tx, rx) = mpsc::channel::<Result<(Duration, usize), String>>();
    let (pid_tx, pid_rx) = mpsc::channel::<u32>();
    std::thread::spawn(move || {
        let mut h = Hub::new("/w");
        let _ = pid_tx.send(h.link.child.id());
        let skipped = h.replay(&big_history(700, 20, 30));
        if !skipped.is_empty() {
            let _ = tx.send(Err(format!("events sb-core did not know: {:?}", skipped)));
            return;
        }
        let live = h.st.wakes.live.len();
        let mut env = FakeEnv::new();
        env.now = 20_000;
        let t0 = Instant::now();
        h.handle(Input::Tick, &mut env);
        let _ = tx.send(Ok((t0.elapsed(), live)));
    });
    let pid = pid_rx.recv_timeout(Duration::from_secs(60)).expect("sb-core started");
    // the replay of the fake history is part of the wait, not of the bound
    match rx.recv_timeout(Duration::from_secs(120)) {
        Ok(Ok((took, live))) => {
            assert_eq!(live, 30, "the 30 watches are live");
            assert!(took < BOUND, "a tick took {:?} with 30 live watches (bound {:?})", took, BOUND);
        }
        Ok(Err(e)) => panic!("{}", e),
        Err(_) => {
            crate::procs::terminate(pid);
            panic!("the tick did not end in 120 s with 30 live watches: a walk doubles per watch (tests/pick_gate.py)");
        }
    }
}
