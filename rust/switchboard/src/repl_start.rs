//! REPL starts (pure): how many at once, in what order, and when one
//! has failed. The hub's side is `daemon/repl_starts.rs`.
//!
//! Every start goes through one limiter: a fresh spawn (a boot, a crash
//! restart), a switch's reload (a new version, changed keys or skills)
//! and a recycle. At most [`MAX_IN_FLIGHT`] at once: after a switch to
//! 7fc455f7 the hub reloaded 22 REPLs in one tick, their starts took
//! 22-38 s at load 16, and a flat 20 s limit failed the switch.
//!
//! - Order ([`order`]): a REPL the user's input waits on (main, his
//!   focus, queued messages) first, then fresh starts before switches,
//!   oldest first; recycles always last (they may wait as long as needed).
//! - Failure: a start in flight fails after [`still_limit_ms`] without
//!   progress (its phases: the thread runs, the tools note, AGENTS.md,
//!   the process spawned, its banner; crate::watch, the boot's rule too),
//!   never after a fixed time in all. The limit is [`START_STILL_MS`]
//!   times the machine's load factor (crate::load) when it is judged:
//!   45 s idle, 6 min at load x8 (main m_36148: at load 85-100 starts
//!   made no progress for 94-124 s and counted as crashes).
//! - A stall at a loaded machine ([`Stall::loaded`]) is sb-core's to
//!   count or not (`IExited`'s cause): it never counts toward the
//!   agent's crashes.
//! - A stall is not a death: a slow start on a loaded machine does not
//!   fail a version's probation. But a version whose REPLs never start
//!   must roll back: a stall reports to probation ([`Stall::reports`])
//!   when the same REPL stalls twice in a row, or when more than half of
//!   the REPLs this hub started (3 or more) stalled.

use crate::watch::Watch;
use std::collections::{BTreeMap, BTreeSet};

/// REPL starts in flight at once.
pub const MAX_IN_FLIGHT: usize = 4;
/// A start without progress for this long, on an idle machine, has
/// failed ([`still_limit_ms`] scales it with the load).
pub const START_STILL_MS: u64 = 45_000;

/// How long a start may stand still at load `factor` (crate::load).
pub fn still_limit_ms(factor: f64) -> u64 {
    (START_STILL_MS as f64 * factor.max(1.0)) as u64
}

/// What a start is (its place in the order).
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum Kind {
    /// A fresh process: a boot, a crash restart, a new agent.
    Start,
    /// A live REPL moved to another binary or reloaded.
    Switch,
    /// A live REPL restarted because it aged (crate::recycle).
    Recycle,
}

/// A start waiting for a slot.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Cand {
    pub dir: String,
    pub kind: Kind,
    /// The user's input waits on it.
    pub urgent: bool,
    pub asked_ms: u64,
    /// main: it never waits for a slot (hub-stall, @bise m_25297: his
    /// main sat 4.5 min behind route-name's and bar-scope's switches).
    pub main: bool,
}

/// The order slots go in: main first; then the others, recycles last,
/// then the urgent ones, fresh starts before switches, the oldest first.
pub fn order(mut c: Vec<Cand>) -> Vec<Cand> {
    c.sort_by(|a, b| {
        let key = |x: &Cand| (!x.main, x.kind == Kind::Recycle, !x.urgent, x.kind, x.asked_ms);
        key(a).cmp(&key(b)).then_with(|| a.dir.cmp(&b.dir))
    });
    c
}

/// The starts that go now with `free` slots: main always (past the
/// limit if it must), the others in [`order`] up to `free`.
pub fn admit(c: Vec<Cand>, free: usize) -> Vec<Cand> {
    let mut left = free;
    order(c)
        .into_iter()
        .filter(|x| {
            if x.main {
                left = left.saturating_sub(1);
                return true;
            }
            let go = left > 0;
            left = left.saturating_sub(1);
            go
        })
        .collect()
}

/// A start that stalled.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Stall {
    pub dir: String,
    pub kind: Kind,
    pub secs: u64,
    /// A reason for a probation to roll back (see the module header).
    pub reports: bool,
    /// The machine was loaded when it stalled (crate::load::is_loaded).
    pub loaded: bool,
    /// This REPL's stalls in a row, this one counted: +1 a stall, reset
    /// only when it connects (sb-core bounds its restarts by it,
    /// hub/stall.bend).
    pub row: u32,
}

/// The starts in flight, and the stalls of this hub.
#[derive(Debug, Default)]
pub struct Starts {
    flight: BTreeMap<String, (Kind, Watch)>,
    /// stalls in a row, by REPL (a start that connects resets it)
    row: BTreeMap<String, u32>,
    started: BTreeSet<String>,
    stalled: BTreeSet<String>,
    /// stalled ones restarted: they go first (until their next start)
    first: BTreeSet<String>,
    /// the idle machine's limit; 0: [`START_STILL_MS`] (a test's own:
    /// [`Starts::with_still_ms`])
    still_ms: u64,
}

impl Starts {
    /// Starts whose idle limit is `ms` instead of [`START_STILL_MS`] (the
    /// hub's tests: `SB_START_STILL_MS`).
    pub fn with_still_ms(ms: u64) -> Starts {
        Starts { still_ms: ms, ..Starts::default() }
    }
}

/// A stall reports to probation (see the module header).
pub fn stall_reports(in_a_row: u32, stalled: usize, started: usize) -> bool {
    in_a_row >= 2 || (started >= 3 && stalled * 2 > started)
}

impl Starts {
    /// Slots free now.
    pub fn free(&self) -> usize {
        MAX_IN_FLIGHT.saturating_sub(self.flight.len())
    }

    pub fn in_flight(&self, dir: &str) -> bool {
        self.flight.contains_key(dir)
    }

    /// It stalled and waits for its restart: it goes first.
    pub fn goes_first(&self, dir: &str) -> bool {
        self.first.contains(dir)
    }

    pub fn len(&self) -> usize {
        self.flight.len()
    }

    pub fn is_empty(&self) -> bool {
        self.flight.is_empty()
    }

    /// A start takes a slot (admitted by [`order`] and [`Starts::free`]).
    pub fn begin(&mut self, dir: &str, kind: Kind, now_ms: u64) {
        self.first.remove(dir);
        self.started.insert(dir.to_string());
        self.flight.insert(dir.to_string(), (kind, Watch::new(now_ms, START_STILL_MS)));
    }

    /// One of its phases is done.
    pub fn progress(&mut self, dir: &str, now_ms: u64) {
        if let Some((_, w)) = self.flight.get_mut(dir) {
            w.moved(now_ms);
        }
    }

    /// It connected: started, its slot free, its stalls forgotten.
    pub fn connected(&mut self, dir: &str) {
        self.flight.remove(dir);
        self.row.remove(dir);
    }

    /// It ended otherwise (died, killed, dropped): its slot free.
    pub fn ended(&mut self, dir: &str) {
        self.flight.remove(dir);
    }

    /// The starts without progress for [`still_limit_ms`] at load
    /// `factor` (the load when judged, not at their begin): out of
    /// flight, counted, each said once.
    pub fn stalled(&mut self, now_ms: u64, factor: f64) -> Vec<Stall> {
        let limit = match self.still_ms {
            0 => still_limit_ms(factor),
            ms => (ms as f64 * factor.max(1.0)) as u64,
        };
        let loaded = crate::load::is_loaded(factor);
        let late: Vec<(String, Kind, u64)> = self
            .flight
            .iter()
            .filter(|(_, (_, w))| w.still_ms(now_ms) >= limit)
            .map(|(d, (k, w))| (d.clone(), *k, w.still_ms(now_ms) / 1000))
            .collect();
        let mut out = Vec::new();
        for (dir, kind, secs) in late {
            self.flight.remove(&dir);
            self.first.insert(dir.clone());
            self.stalled.insert(dir.clone());
            let n = self.row.entry(dir.clone()).or_insert(0);
            *n += 1;
            let reports = stall_reports(*n, self.stalled.len(), self.started.len());
            let row = *n;
            out.push(Stall { dir, kind, secs, reports, loaded, row });
        }
        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cand(dir: &str, kind: Kind, urgent: bool, at: u64) -> Cand {
        Cand { dir: dir.into(), kind, urgent, asked_ms: at, main: dir == "main" }
    }

    /// @bise m_25297: main's recycle waited 4.5 min behind other
    /// switches. Main goes first and never waits for a slot.
    #[test]
    fn main_starts_first_even_when_every_slot_is_taken() {
        let c = || vec![cand("route-name", Kind::Switch, false, 1), cand("main", Kind::Recycle, false, 9), cand("bar-scope", Kind::Switch, false, 2)];
        let dirs = |v: Vec<Cand>| v.into_iter().map(|x| x.dir).collect::<Vec<_>>();
        assert_eq!(dirs(admit(c(), 0)), ["main"]);
        assert_eq!(dirs(admit(c(), 1)), ["main"]);
        assert_eq!(dirs(admit(c(), 2)), ["main", "route-name"]);
        assert_eq!(dirs(admit(vec![cand("t", Kind::Start, false, 0)], 0)), Vec::<String>::new());
    }

    #[test]
    fn his_input_first_then_fresh_starts_oldest_first_and_recycles_last() {
        let got: Vec<String> = order(vec![
            cand("recycled-main", Kind::Recycle, true, 0),
            cand("old-switch", Kind::Switch, false, 1),
            cand("new-start", Kind::Start, false, 9),
            cand("old-start", Kind::Start, false, 2),
            cand("focused-switch", Kind::Switch, true, 8),
            cand("recycled", Kind::Recycle, false, 0),
        ])
        .into_iter()
        .map(|c| c.dir)
        .collect();
        assert_eq!(got, ["focused-switch", "old-start", "new-start", "old-switch", "recycled-main", "recycled"]);
    }

    #[test]
    fn at_most_four_in_flight_and_a_slot_frees_when_one_connects_or_ends() {
        let mut s = Starts::default();
        for (i, d) in ["a", "b", "c"].iter().enumerate() {
            s.begin(d, Kind::Switch, i as u64);
        }
        assert_eq!(s.free(), 1);
        s.begin("d", Kind::Start, 3);
        assert_eq!(s.free(), 0);
        s.connected("a");
        s.ended("b");
        assert_eq!(s.free(), 2);
        assert!(s.in_flight("c") && !s.in_flight("a"));
    }

    #[test]
    fn a_slow_start_that_moves_never_stalls() {
        // 22 starts at load 16 took 22-38 s: each phase moves the watch
        let mut s = Starts::default();
        s.begin("amb-kit", Kind::Switch, 0);
        for t in (10_000..300_000).step_by(30_000) {
            s.progress("amb-kit", t);
            assert!(s.stalled(t + 29_000, 1.0).is_empty(), "at {} ms", t);
        }
        assert!(s.in_flight("amb-kit"));
    }

    /// hub-stall: the hub judges at the time its tick was sent. His loop,
    /// busy 20:08:10 → 20:09:08, took route-name's progress after that
    /// tick's time: judged then, it is no stall (judged at the loop's
    /// late "now", it failed a start that had moved, and its REPL lived
    /// on, orphaned).
    #[test]
    fn progress_the_loop_takes_late_never_fails_a_start_judged_at_the_tick_time() {
        let mut s = Starts::default();
        s.begin("route-name", Kind::Start, 0);
        // the tick was sent at 40 s; the banner's progress, sent at 30 s,
        // was taken at 59 s when the busy loop came back
        s.progress("route-name", 59_000);
        assert!(s.stalled(40_000, 1.0).is_empty());
        // a start that truly stands still still fails
        s.begin("still", Kind::Start, 0);
        assert_eq!(s.stalled(START_STILL_MS, 1.0).iter().map(|x| x.dir.as_str()).collect::<Vec<_>>(), ["still"]);
    }

    #[test]
    fn one_stall_does_not_fail_a_probation_the_same_repl_twice_in_a_row_does() {
        let mut s = Starts::default();
        for d in ["a", "b", "c", "d"] {
            s.begin(d, Kind::Switch, 0);
        }
        s.progress("b", 40_000);
        s.progress("c", 40_000);
        s.progress("d", 40_000);
        let st = s.stalled(45_000, 1.0);
        assert_eq!(st, [Stall { dir: "a".into(), kind: Kind::Switch, secs: 45, reports: false, loaded: false, row: 1 }]);
        assert!(!s.in_flight("a"), "a stalled start leaves its slot");
        assert!(s.goes_first("a") && !s.goes_first("b"), "its restart goes first");
        // restarted, it stalls again: a reason to roll back
        s.begin("a", Kind::Start, 50_000);
        assert!(!s.goes_first("a"), "started: no longer first");
        for d in ["b", "c", "d"] {
            s.progress(d, 90_000);
        }
        let st = s.stalled(95_000, 1.0);
        assert!(st.len() == 1 && st[0].reports, "{:?}", st);
        // a start that connects forgets its stalls
        s.begin("a", Kind::Start, 100_000);
        s.connected("a");
        s.begin("a", Kind::Start, 110_000);
        s.progress("b", 150_000);
        s.progress("c", 150_000);
        s.progress("d", 150_000);
        assert!(!s.stalled(155_000, 1.0)[0].reports);
    }

    #[test]
    fn more_than_half_of_the_starts_stalled_is_a_reason_to_roll_back() {
        assert!(!stall_reports(1, 1, 1), "one REPL, one stall: not yet");
        assert!(!stall_reports(1, 2, 4));
        assert!(stall_reports(1, 3, 4));
        assert!(stall_reports(2, 1, 22));
        // a version whose REPLs never start: every one stalls
        let mut s = Starts::default();
        for d in ["a", "b", "c", "d"] {
            s.begin(d, Kind::Switch, 0);
        }
        let st = s.stalled(45_000, 1.0);
        assert_eq!(st.iter().map(|x| x.reports).collect::<Vec<_>>(), [false, false, true, true]);
    }

    /// architect m_36171: sb-core bounds a loaded stall's restarts by the
    /// row (hub/stall.bend), so the row is +1 per stall of that REPL,
    /// reset only when it connects (not when it dies or is killed), and
    /// never shared between REPLs.
    #[test]
    fn the_row_counts_one_repls_stalls_until_it_connects() {
        let mut s = Starts::default();
        let stall = |s: &mut Starts, d: &str, t: u64| {
            s.begin(d, Kind::Start, t);
            s.stalled(t + START_STILL_MS, 1.0).into_iter().find(|x| x.dir == d).map(|x| x.row)
        };
        assert_eq!(stall(&mut s, "a", 0), Some(1));
        assert_eq!(stall(&mut s, "a", 100_000), Some(2));
        // a death or a kill (ended) keeps the row
        s.begin("a", Kind::Start, 200_000);
        s.ended("a");
        assert_eq!(stall(&mut s, "a", 300_000), Some(3));
        // another REPL has its own
        assert_eq!(stall(&mut s, "b", 400_000), Some(1));
        // connected: from nothing again
        s.begin("a", Kind::Start, 500_000);
        s.connected("a");
        assert_eq!(stall(&mut s, "a", 600_000), Some(1));
        assert_eq!(stall(&mut s, "b", 700_000), Some(2));
    }

    /// main m_36148: the same stillness stalls an idle machine's start,
    /// not a loaded one's; judged at the load then, `loaded` from x2.
    #[test]
    fn the_limit_scales_with_the_load_when_judged() {
        assert_eq!(still_limit_ms(1.0), START_STILL_MS);
        assert_eq!(still_limit_ms(0.5), START_STILL_MS, "never under the idle limit");
        assert_eq!(still_limit_ms(4.0), 4 * START_STILL_MS);
        let mut s = Starts::default();
        s.begin("a", Kind::Start, 0);
        assert!(s.stalled(100_000, 4.0).is_empty(), "100 s still at x4: not yet");
        let st = s.stalled(100_000, 1.5);
        assert!(st.len() == 1 && !st[0].loaded, "the load fell to x1.5: stalled, not loaded");
        s.begin("b", Kind::Start, 0);
        let st = s.stalled(4 * START_STILL_MS, 4.0);
        assert!(st.len() == 1 && st[0].loaded);
    }
}
