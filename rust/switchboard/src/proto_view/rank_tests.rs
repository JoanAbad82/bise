use super::*;

const H: u64 = 3_600_000;
const T0: u64 = 1_000 * H;

fn input<'a>(name: &'a str, created_ms: u64, act: Act) -> Input<'a> {
    Input { name, aliases: &[], created_ms, act }
}

fn heard(id: u64, to: &str, at: u64) -> Heard<'_> {
    Heard { id, to, at }
}

#[test]
fn a_fresh_hub_ranks_by_score_then_age() {
    let mut r = Ranks::default();
    r.hear([heard(1, "docs", T0 - H)]);
    let live = [input("perf", 1, Act::Rests(T0 - 10 * H)), input("search", 2, Act::Works), input("docs", 3, Act::Rests(T0 - 10 * H)), input("ux", 4, Act::Rests(T0 - 10 * H))];
    assert_eq!(r.order(&live, T0), ["search", "docs", "perf", "ux"]);
}

#[test]
fn needs_him_passes_working_and_working_passes_rest() {
    let mut r = Ranks::default();
    let live = [input("a", 1, Act::Rests(0)), input("b", 2, Act::Works), input("c", 3, Act::Needs)];
    assert_eq!(r.order(&live, T0), ["c", "b", "a"]);
}

#[test]
fn small_activity_changes_hold_the_order_still() {
    let mut r = Ranks::default();
    r.hear([heard(1, "a", T0), heard(2, "b", T0)]);
    let rest = |n| input(n, 0, Act::Rests(T0 - 4 * H));
    let first = r.order(&[rest("a"), rest("b"), rest("c")], T0).to_vec();
    assert_eq!(first, ["a", "b", "c"]);
    // c starts a turn and b gets one more message: within the minute nothing moves
    r.hear([heard(3, "b", T0 + 10_000)]);
    let live = [rest("a"), rest("b"), input("c", 0, Act::Works)];
    assert_eq!(r.order(&live, T0 + 30_000), first);
    // past the minute: c works (2) against a's talk (1): not more than the margin, it stays
    // below; b's second message (2 vs 1) is not more than the margin either
    assert_eq!(r.order(&live, T0 + 2 * MINUTE), first);
    // a pause between two turns (2 min at rest) changes nothing either
    let live = [rest("a"), rest("b"), input("c", 0, Act::Rests(T0 + 2 * MINUTE))];
    assert_eq!(r.order(&live, T0 + 4 * MINUTE), first);
}

#[test]
fn a_clear_lead_passes_at_the_next_minute_only() {
    let mut r = Ranks::default();
    let rest = |n| input(n, 0, Act::Rests(0));
    assert_eq!(r.order(&[rest("a"), rest("b")], T0), ["a", "b"]);
    let live = [rest("a"), input("b", 0, Act::Needs)];
    assert_eq!(r.order(&live, T0 + MINUTE - 1), ["a", "b"]);
    assert_eq!(r.order(&live, T0 + MINUTE), ["b", "a"]);
}

#[test]
fn a_newcomer_takes_its_place_at_once_and_a_leaver_frees_its_own() {
    let mut r = Ranks::default();
    let rest = |n| input(n, 0, Act::Rests(0));
    r.hear([heard(1, "a", T0), heard(2, "a", T0), heard(3, "a", T0), heard(4, "b", T0)]);
    assert_eq!(r.order(&[rest("a"), rest("b"), rest("c")], T0), ["a", "b", "c"]);
    assert_eq!(r.order(&[rest("a"), rest("b"), rest("c"), input("new", 9, Act::Works)], T0 + 1_000), ["a", "new", "b", "c"]);
    assert_eq!(r.order(&[rest("a"), rest("c"), input("new", 9, Act::Works)], T0 + 2_000), ["a", "new", "c"]);
}

#[test]
fn the_kept_talk_is_the_whole_sum() {
    let msgs: Vec<(u64, &str, u64)> = (1..=40).map(|i| (i, if i % 3 == 0 { "b" } else { "a" }, T0 + i * 17 * 60_000)).collect();
    let now = T0 + 20 * H;
    let sum = |to: &str| msgs.iter().filter(|m| m.1 == to).map(|m| decay((now - m.2) as f64, TALK_HALF_MS)).sum::<f64>();
    // read in two passes (the boot's, then the new ones), one message seen twice
    let mut r = Ranks::default();
    r.hear(msgs[..25].iter().map(|m| heard(m.0, m.1, m.2)));
    assert_eq!(r.unread(), 26);
    r.hear(msgs[24..].iter().map(|m| heard(m.0, m.1, m.2)));
    for to in ["a", "b"] {
        assert!((r.talk(to, &[], now) - sum(to)).abs() < 1e-9, "{to}");
    }
    // an older message read late counts the same
    let mut late = Ranks::default();
    late.hear([heard(1, "a", T0 + H), heard(2, "a", T0)]);
    let want = decay((now - T0 - H) as f64, TALK_HALF_MS) + decay((now - T0) as f64, TALK_HALF_MS);
    assert!((late.talk("a", &[], now) - want).abs() < 1e-9);
}

#[test]
fn a_renamed_agent_keeps_its_talk() {
    let mut r = Ranks::default();
    r.hear([heard(1, "old", T0)]);
    let aliases = vec!["old".to_string()];
    assert!((r.talk("new", &aliases, T0) - 1.0).abs() < 1e-9);
}

#[test]
fn rows_get_main_zero_and_the_others_their_place() {
    let row = |name: &str, main: bool, status: Status, created: u64| {
        let mut a = Agent::of_archived(&bise_proto::rows::ArchivedAgent { name: name.into(), aliases: vec![], dir: name.into(), status, since_ms: 0, about: String::new() });
        a.main = main;
        a.status = status;
        a.archived = false;
        a.created_ms = Some(created);
        a.since_ms = 0;
        a
    };
    let mut rows = vec![row("main", true, Status::Idle, 0), row("x", false, Status::Idle, 1), row("y", false, Status::Working, 2)];
    let mut gone = row("z", false, Status::Done, 3);
    gone.archived = true;
    rows.push(gone);
    apply(&mut rows, &mut Ranks::default(), T0);
    let ranks: Vec<Option<u32>> = rows.iter().map(|a| a.rank).collect();
    assert_eq!(ranks, [Some(0), Some(2), Some(1), None]);
}
