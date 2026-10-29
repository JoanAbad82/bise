use super::*;
use bise_proto::rows::{AgentWatch, WatchKind};

fn row(name: &str, status: Status, created: u64) -> Agent {
    let mut a = Agent::of_archived(&bise_proto::rows::ArchivedAgent { name: name.into(), aliases: vec![], dir: name.into(), status, since_ms: 0, about: String::new() });
    a.status = status;
    a.archived = false;
    a.created_ms = Some(created);
    a
}

fn ranked(rows: &mut [Agent]) -> Vec<&str> {
    apply(rows);
    let mut v: Vec<(u32, &str)> = rows.iter().filter_map(|a| a.rank.map(|r| (r, a.name.as_str()))).collect();
    v.sort();
    v.into_iter().map(|(_, n)| n).collect()
}

#[test]
fn each_state_falls_in_its_tier() {
    let mut waits = row("w", Status::Idle, 0);
    waits.waits = 1;
    let mut on_you = row("y", Status::Idle, 0);
    on_you.waiting_on = Some(WaitingOn::You);
    let mut on_peer = row("p", Status::Idle, 0);
    on_peer.waiting_on = Some(WaitingOn::Agent { name: "x".into() });
    let mut paused = row("e", Status::Idle, 0);
    paused.watching = vec![AgentWatch { id: 1, kind: WatchKind::Bg, what: "cargo test".into(), since_ms: 0, noted: false, resumes: true, until_ms: None }];
    let table = [
        (waits, Tier::Needs),
        (on_you, Tier::Needs),
        (row("b", Status::Blocked, 0), Tier::Needs),
        (row("f", Status::Failed, 0), Tier::Needs),
        (row("k", Status::Working, 0), Tier::Works),
        (row("q", Status::Waiting, 0), Tier::Works),
        (on_peer, Tier::Works),
        (paused, Tier::Works),
        (row("i", Status::Idle, 0), Tier::Rests),
        (row("d", Status::Done, 0), Tier::Done),
    ];
    for (a, want) in table {
        assert_eq!(Tier::of(&a), want, "{}", a.name);
    }
}

#[test]
fn needs_him_then_works_then_rests_then_done() {
    let mut on_you = row("asks", Status::Idle, 1);
    on_you.waiting_on = Some(WaitingOn::You);
    let mut rows = vec![row("done", Status::Done, 9), row("idle", Status::Idle, 8), row("work", Status::Working, 2), on_you];
    assert_eq!(ranked(&mut rows), ["asks", "work", "idle", "done"]);
}

#[test]
fn newest_launched_first_inside_a_tier_then_the_name() {
    let mut rows = vec![row("old", Status::Working, 1), row("new", Status::Working, 3), row("b", Status::Working, 2), row("a", Status::Working, 2), row("unknown", Status::Working, 0)];
    rows[4].created_ms = None;
    assert_eq!(ranked(&mut rows), ["new", "a", "b", "old", "unknown"]);
}

/// His case (m_47356): an older done agent he just talked to stays below
/// one launched a minute ago that works, and below an idle newer one.
#[test]
fn a_fresh_working_agent_is_above_every_done_one() {
    let mut rows = vec![row("talked", Status::Done, 5), row("older-done", Status::Done, 1), row("fresh", Status::Working, 10), row("fresh-idle", Status::Idle, 11)];
    assert_eq!(ranked(&mut rows), ["fresh", "fresh-idle", "talked", "older-done"]);
    // it works again: up at once
    rows[0].status = Status::Working;
    assert_eq!(ranked(&mut rows), ["fresh", "talked", "fresh-idle", "older-done"]);
}

#[test]
fn the_same_rows_give_the_same_order_whatever_they_come_in() {
    let rows = vec![row("a", Status::Done, 3), row("b", Status::Working, 1), row("c", Status::Idle, 2), row("d", Status::Working, 4)];
    let mut fwd = rows.clone();
    let mut rev: Vec<Agent> = rows.into_iter().rev().collect();
    assert_eq!(ranked(&mut fwd), ranked(&mut rev));
}

#[test]
fn rows_get_main_zero_and_archived_none() {
    let mut main = row("main", Status::Idle, 0);
    main.main = true;
    let mut gone = row("z", Status::Done, 3);
    gone.archived = true;
    let mut rows = vec![main, row("x", Status::Idle, 1), row("y", Status::Working, 2), gone];
    apply(&mut rows);
    let ranks: Vec<Option<u32>> = rows.iter().map(|a| a.rank).collect();
    assert_eq!(ranks, [Some(0), Some(2), Some(1), None]);
}
