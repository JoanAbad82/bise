//! A stalled REPL start under load (send-fast step 6 C, hub/stall.bend):
//! the shell's facts in, sb-core's crash count out.

use super::*;

/// main m_36148, hub/stall.bend: starts that stall under load never fail
/// the agent; the 4th in a row waits for the machine (wait_load); a stall
/// on an idle machine counts as a crash does.
#[test]
fn a_stalled_start_under_load_never_fails_the_agent() {
    let mut t = T::new();
    t.spawn_task("a");
    let stall = |loaded, row| Input::ReplExited { agent: "a".into(), crashed: true, reason: "no progress".into(), stalled: true, loaded, row };
    let spawn = |fx: &[Effect]| fx.iter().find_map(|e| match e { Effect::Spawn { agent, wait_load, .. } if agent == "a" => Some(*wait_load), _ => None });
    for row in 1..=9 {
        assert_eq!(spawn(&t.go(stall(true, row))), Some(row > 3), "loaded stall {row}: starts again, the 4th on waits");
    }
    assert_ne!(t.status("a"), Status::Failed);
    for i in 1..=5 {
        assert_eq!(spawn(&t.go(stall(false, i))), Some(false), "an idle machine's stall {i} counts");
    }
    t.go(stall(false, 6));
    assert_eq!(t.status("a"), Status::Failed, "the 6th counted one fails it");
}
