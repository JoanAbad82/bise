//! The panel's ⌥ numbers (agent-rank, architect m_39150): the hub's one
//! order, each live row's `rank` (switchboard proto_view/rank.rs): main
//! 0, the others 1..n; the desktop's right bar reads the same field. An
//! older hub sends none: start order. Nothing is ranked here.
//!
//! While ⌥ is held, and for [`HOLD`] after an ⌥N jump (his ⌥1, ⌥2, ⌥3
//! often lets go of ⌥ between keys), the numbers he sees stay: a gone
//! agent frees its number, a newcomer goes after the last. Pure.

use super::Agent;
use std::time::{Duration, Instant};

/// How long the numbers stay after an ⌥N jump.
pub(crate) const HOLD: Duration = Duration::from_secs(5);

/// When the numbers hold still: ⌥ held (as the last frame saw it), and
/// the last ⌥N jump.
#[derive(Clone, Copy, Debug, Default)]
pub(crate) struct Hold {
    pub(crate) alt: bool,
    pub(crate) jumped: Option<Instant>,
}

impl Hold {
    pub(crate) fn on(&self, now: Instant) -> bool {
        self.alt || self.jumped.is_some_and(|t| now.saturating_duration_since(t) < HOLD)
    }
}

/// The `live` agents' numbers in the hub's order: main 0, then by rank
/// (none: after the ranked ones, in the hub's order), from 1.
pub(super) fn ranked(live: &[&Agent]) -> Vec<(String, usize)> {
    let mut others: Vec<(usize, &Agent)> = live.iter().copied().filter(|a| !a.main).enumerate().collect();
    others.sort_by_key(|(i, a)| (a.rank.unwrap_or(u32::MAX), *i));
    let main = live.iter().filter(|a| a.main).map(|a| (a.name.clone(), 0));
    main.chain(others.into_iter().enumerate().map(|(k, (_, a))| (a.name.clone(), k + 1))).collect()
}

/// The numbers shown, `next` held to `shown`: the ones still there keep
/// theirs, a newcomer takes the next after the last. `shown` empty (the
/// first frame): `next`.
pub(super) fn held(shown: &[(String, usize)], next: Vec<(String, usize)>) -> Vec<(String, usize)> {
    if shown.is_empty() {
        return next;
    }
    let mut out: Vec<(String, usize)> = shown.iter().filter(|(n, _)| next.iter().any(|(m, _)| m == n)).cloned().collect();
    let mut last = out.iter().map(|(_, k)| *k).max().unwrap_or(0);
    for (name, k) in next {
        if out.iter().any(|(n, _)| *n == name) {
            continue;
        }
        let k = if k == 0 {
            0
        } else {
            last += 1;
            last
        };
        out.push((name, k));
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn agent(name: &str, main: bool, rank: Option<u32>) -> Agent {
        Agent { name: name.into(), main, rank, status: "idle".into(), ..Agent::default() }
    }

    fn pairs(v: &[(&str, usize)]) -> Vec<(String, usize)> {
        v.iter().map(|(n, k)| (n.to_string(), *k)).collect()
    }

    #[test]
    fn the_hubs_rank_numbers_the_rows() {
        let (m, a, b, c) = (agent("main", true, Some(0)), agent("a", false, Some(3)), agent("b", false, Some(1)), agent("c", false, Some(2)));
        assert_eq!(ranked(&[&a, &m, &b, &c]), pairs(&[("main", 0), ("b", 1), ("c", 2), ("a", 3)]));
        // an older hub: no rank, start order
        let (x, y) = (agent("x", false, None), agent("y", false, None));
        assert_eq!(ranked(&[&m, &x, &y]), pairs(&[("main", 0), ("x", 1), ("y", 2)]));
    }

    #[test]
    fn held_numbers_stay_while_the_order_moves() {
        let shown = pairs(&[("main", 0), ("a", 1), ("b", 2), ("c", 3)]);
        // the hub moved c up, dropped a and brought d
        let next = pairs(&[("main", 0), ("c", 1), ("d", 2), ("b", 3)]);
        assert_eq!(held(&shown, next.clone()), pairs(&[("main", 0), ("b", 2), ("c", 3), ("d", 4)]));
        assert_eq!(held(&[], next.clone()), next);
    }

    #[test]
    fn the_hold_lasts_while_alt_is_down_and_a_moment_after_a_jump() {
        let t = Instant::now();
        assert!(!Hold::default().on(t));
        assert!(Hold { alt: true, jumped: None }.on(t));
        let h = Hold { alt: false, jumped: Some(t) };
        assert!(h.on(t + Duration::from_secs(4)));
        assert!(!h.on(t + HOLD));
    }
}
