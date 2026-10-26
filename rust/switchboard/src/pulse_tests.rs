//! pulse.rs's laws (brief m_44811, architect m_44825).

use super::*;

const H: u64 = 3_600_000;
const B: u64 = PULSE_BUCKET_MS;

fn with_ctx<T>(f: impl FnOnce(&Ctx) -> T) -> T {
    let none = |_: &str| None;
    let ctx = Ctx { open_cards: &[], page: &none, provider: &|i: &str, _: &str| i.to_string(), width: &|s: &str| s.chars().count(), offset: &|_| 0, attached: &crate::attached::split };
    f(&ctx)
}

/// 2026-10-05 00:00 UTC (a Monday), on a bucket boundary at offset 0
const T0: u64 = 1_791_158_400_000;

#[test]
fn the_buckets_sum_the_busy_time_clipped_to_the_window() {
    let from = T0;
    let turns = [(from - 5 * H, from + H), (from + 3 * H, from + 4 * H), (from + WINDOW_MS - H, from + WINDOW_MS + 5 * H)];
    let b = buckets(turns, from);
    assert_eq!(b.len(), PULSE_BUCKETS);
    assert_eq!(b.iter().sum::<u64>(), H + H + H);
    assert_eq!((b[0], b[20]), (2 * H, H));
}

#[test]
fn a_turn_across_a_boundary_splits_exactly() {
    let b = buckets([(T0 + B - 90_000, T0 + 2 * B + 10_000)], T0);
    assert_eq!((b[0], b[1], b[2]), (90_000, B, 10_000));
    assert_eq!(b.iter().sum::<u64>(), B + 100_000);
}

#[test]
fn an_interval_outside_the_window_counts_zero() {
    assert!(buckets([(T0 - 3 * H, T0 - H), (T0 + WINDOW_MS, T0 + WINDOW_MS + H), (T0 + H, T0 + H)], T0).iter().all(|n| *n == 0));
}

#[test]
fn parallel_agents_add_up() {
    let b = buckets([(T0, T0 + 2 * H), (T0 + H, T0 + 3 * H)], T0);
    assert_eq!(b[0], 4 * H);
}

#[test]
fn an_open_turn_counts_to_now() {
    let mut t = Turns::default();
    t.line(T0 + H, TurnLine::Start);
    let now = T0 + 4 * H;
    assert_eq!(buckets(t.intervals(now), T0)[0], 3 * H);
    assert_eq!(t.last_ms(now), Some(now));
    t.line(T0 + 5 * H, TurnLine::Done { failed: false });
    assert_eq!(t.last_ms(now + 9 * H), Some(T0 + 5 * H));
}

fn boundary(ms: u64, off: i32) -> bool {
    (ms as i64 + off as i64 * 1000).rem_euclid(B as i64) == 0
}

#[test]
fn from_falls_on_a_local_boundary_and_now_is_in_the_last_bucket() {
    for off in [0, 3600, 7200, -5 * 3600, 19800] {
        for now in [T0, T0 + 1, T0 + 7 * H + 59 * 60_000, T0 + 13 * H, T0 + 23 * H] {
            let from = window_from(now, &|_| off);
            assert!(boundary(from, off), "off {off} now {now}");
            assert!(now >= from + WINDOW_MS - B && now < from + WINDOW_MS, "off {off} now {now} from {from}");
        }
    }
}

#[test]
fn from_falls_on_a_local_boundary_on_both_sides_of_a_dst_change() {
    // Paris: +2 h until the change at `dst`, +1 h after (fall back), and
    // the spring one the other way
    let dst = T0 + 3 * 24 * H + 1_000;
    for (before, after) in [(7200, 3600), (3600, 7200)] {
        let off = move |ms: u64| if ms < dst { before } else { after };
        for now in (0..30).map(|i| dst - 2 * 24 * H + i * 5 * H) {
            let from = window_from(now, &off);
            assert!(boundary(from, off(from)), "now {now} from {from}");
            assert!(now >= from + WINDOW_MS - B && now < from + WINDOW_MS);
        }
    }
}

fn n(at_ms: u64, what: NewsWhat) -> News {
    News { at_ms, what }
}

#[test]
fn the_news_follows_the_rule() {
    let now = T0 + 30 * 24 * H;
    let failed = n(now - 3 * H, NewsWhat::Failed { agent: "a".into() });
    let landed = n(now - 2 * H, NewsWhat::Landed { agent: "b".into(), sha: "abc".into(), target: "main".into() });
    let art = n(now - H, NewsWhat::Artifact { id: "x".into(), title: "X".into() });
    let soon = n(now + H, NewsWhat::Scheduled { id: "t1".into(), name: "daily".into() });
    let later = n(now + 5 * H, NewsWhat::Scheduled { id: "t2".into(), name: "weekly".into() });
    let old = n(now - 25 * H, NewsWhat::Artifact { id: "o".into(), title: "O".into() });
    let table: Vec<(Vec<News>, Option<News>)> = vec![
        (vec![], None),
        (vec![failed.clone()], Some(failed.clone())),
        (vec![failed.clone(), landed.clone()], Some(landed.clone())),
        (vec![landed.clone(), art.clone(), failed.clone()], Some(art.clone())),
        (vec![later.clone(), soon.clone()], Some(soon.clone())),
        (vec![soon.clone(), failed.clone()], Some(failed.clone())),
        // older than 24 h: not news; the next run instead, else none
        (vec![old.clone(), later.clone()], Some(later.clone())),
        (vec![old.clone()], None),
        // a past scheduled run is never news
        (vec![n(now - H, NewsWhat::Scheduled { id: "t".into(), name: "x".into() })], None),
        // same time: failed first
        (vec![n(now - H, NewsWhat::Artifact { id: "x".into(), title: "X".into() }), n(now - H, NewsWhat::Failed { agent: "a".into() })], Some(n(now - H, NewsWhat::Failed { agent: "a".into() }))),
    ];
    for (cands, want) in table {
        assert_eq!(news(&cands, now), want, "{cands:?}");
    }
}

#[test]
fn the_caps_keep_the_newest() {
    let v: Vec<u64> = (0..250).collect();
    let c = cap(v);
    assert_eq!(c.len(), PULSE_CAP);
    assert_eq!((c[0], c[PULSE_CAP - 1]), (249, 250 - PULSE_CAP as u64));
}

const START: &str = "  obs: turn_started";
const DONE: &str = "  obs: turn_done: completed";
const FAIL: &str = "  obs: turn_done: failed: provider 500";

#[test]
fn turn_lines_read_through_the_line_reader() {
    assert_eq!(turn_line(START), TurnLine::Start);
    assert_eq!(turn_line(DONE), TurnLine::Done { failed: false });
    assert_eq!(turn_line(FAIL), TurnLine::Done { failed: true });
    assert_eq!(turn_line("  obs: turn_done: failed: interrupted by main"), TurnLine::Done { failed: false });
    assert_eq!(turn_line("history   obs: turn_started"), TurnLine::Other);
    assert_eq!(turn_line("  obs: assistant: turn_started"), TurnLine::Other);
}

/// A transcript read backwards by the fill (lines before `until`).
fn back(lines: &[(u64, &str)], since: u64, until: u64) -> Turns {
    let mut b = TurnsBack::new(since, until);
    for (ms, l) in lines.iter().rev() {
        if !b.line(*ms, l) {
            break;
        }
    }
    b.turns()
}

fn forward(lines: &[(u64, &str)]) -> Turns {
    let mut t = Turns::default();
    for (ms, l) in lines {
        t.line(*ms, turn_line(l));
    }
    t
}

#[test]
fn the_fill_reads_turns_backwards_as_forward() {
    let ls = [(10, "x"), (11, START), (12, "tool"), (15, DONE), (20, START), (22, "y"), (30, START), (31, FAIL), (40, "z")];
    let t = back(&ls, 0, 1_000);
    // the turn left open at 20 ends at 22, the line before the next start
    assert_eq!(t.closed, vec![(11, 15), (20, 22), (30, 31)]);
    assert_eq!((t.open, t.last_end, t.last_line), (None, Some((31, true)), 40));
    let f = forward(&ls);
    assert_eq!(f.closed, t.closed);
}

#[test]
fn a_turn_begun_before_the_week_runs_from_where_the_reader_stopped() {
    let t = back(&[(5, START), (6, "a"), (50, "b"), (60, DONE), (70, START)], 40, 1_000);
    assert_eq!(t.closed, vec![(6, 60)]);
    assert_eq!(t.open, Some(70));
}

/// Law (brief): the fill plus the live lines count a turn once, the fill
/// started mid-turn; the same turns as one reader of the whole file.
#[test]
fn a_turn_the_fill_saw_start_and_live_saw_end_counts_once() {
    let ls = [(10, START), (12, "a"), (15, DONE), (20, START), (22, "b"), (30, DONE), (31, "c"), (40, START), (45, DONE)];
    let whole = forward(&ls);
    for until in [11, 16, 21, 25, 31, 35, 41, 100] {
        let fill = back(&ls, 0, until);
        let live = forward(&ls.iter().filter(|(ms, _)| *ms >= until).copied().collect::<Vec<_>>());
        let m = Turns::merge(fill, live, true);
        assert_eq!((m.closed.clone(), m.open), (whole.closed.clone(), whole.open), "until {until}");
        assert_eq!(buckets(m.intervals(100), 0), buckets(whole.intervals(100), 0));
    }
}

#[test]
fn the_fills_open_turn_runs_on_while_busy_else_ends_at_its_last_line() {
    let ls = [(10, START), (12, "a"), (14, "b")];
    let busy = Turns::merge(back(&ls, 0, 20), Turns::default(), true);
    assert_eq!((busy.open, busy.closed.len()), (Some(10), 0));
    let dead = Turns::merge(back(&ls, 0, 20), Turns::default(), false);
    assert_eq!((dead.open, dead.closed), (None, vec![(10, 14)]));
    // the live side started a new turn: the fill's was left open
    let mut live = Turns::default();
    live.line(30, TurnLine::Start);
    let m = Turns::merge(back(&ls, 0, 20), live, true);
    assert_eq!((m.open, m.closed), (Some(30), vec![(10, 14)]));
}

fn main_lines() -> Vec<(u64, String)> {
    [
        (1_000, "sb you : hello"),
        (1_001, START),
        (1_002, "  obs: assistant: first line"),
        (1_003, "and its second line"),
        (1_004, "and a third"),
        (1_005, "tool #1 bash : {\"command\":\"ls\"}"),
        (1_006, "  obs: tool_started #1"),
        (1_007, "tool_result #1 ok : x"),
        (1_008, "  obs: tool_finished #1 ok"),
        (1_009, "  obs: assistant: done here"),
        (1_010, "on two lines"),
        (1_011, DONE),
        (2_000, "sb you : again"),
        (2_001, START),
        (2_002, "  obs: assistant: and again"),
        (2_003, DONE),
    ]
    .iter()
    .map(|(m, l)| (*m, l.to_string()))
    .collect()
}

#[test]
fn said_counts_main_entries_for_him_not_his() {
    with_ctx(|ctx| {
        let mut s = Said::default();
        s.push_all(main_lines(), ctx);
        assert_eq!(s.times(0), vec![2_002, 1_009, 1_002]);
        assert_eq!(s.times(1_005), vec![2_002, 1_009]);
    });
}

/// Law (architect m_44825): the fill then the live lines give the same
/// said_at as folding the whole week at once, wherever the fill stops.
#[test]
fn said_fill_then_live_is_the_whole_fold() {
    with_ctx(|ctx| {
        let all = main_lines();
        let mut whole = Said::default();
        whole.push_all(all.clone(), ctx);
        for cut in 0..=all.len() {
            let mut s = Said::default();
            s.push_all(all[..cut].to_vec(), ctx);
            for (ms, l) in all[cut..].iter().cloned() {
                s.push(ms, l);
                s.settle(ctx);
            }
            assert_eq!(s.times(0), whole.times(0), "cut {cut}");
        }
    });
}
