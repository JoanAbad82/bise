//! Who watches the hubs' processes lists (architect m_47406): one lease
//! per holder, by key (`screen` for the running screen, every project;
//! `panel:<project>/<agent>/<id>` for a process's side panel, its project
//! only), each renewed by its window and gone at its time, so a holder
//! that leaves without a word never keeps a watch. A hub is watched while
//! one live holder covers it. Pure: `hubs.rs` asks it and sends
//! `processes {watch}` when a hub's answer changes.

use std::collections::{BTreeMap, BTreeSet};
use std::time::{Duration, Instant};

/// How long a hold lasts after its window last said `on` (each holder
/// says it again every 10 s).
pub const LISTS_LEASE: Duration = Duration::from_secs(30);

/// The holder a `processes_all` without `by` is: the running screen.
pub const SCREEN: &str = "screen";

#[derive(Clone, Debug, Default, PartialEq)]
pub struct Leases {
    /// by holder: until when, and its project (none: every project)
    held: BTreeMap<String, (Instant, Option<String>)>,
}

impl Leases {
    /// `by` says on (a new lease, or its renewal) or off.
    pub fn set(&mut self, by: &str, on: bool, project: Option<String>, now: Instant) {
        if on {
            self.held.insert(by.to_string(), (now + LISTS_LEASE, project));
        } else {
            self.held.remove(by);
        }
    }

    /// The holds whose time has come go; whether any went.
    pub fn expire(&mut self, now: Instant) -> bool {
        let n = self.held.len();
        self.held.retain(|_, (until, _)| *until > now);
        self.held.len() != n
    }

    /// A live holder wants every project (the running screen).
    pub fn all(&self, now: Instant) -> bool {
        self.held.values().any(|(u, p)| *u > now && p.is_none())
    }

    /// The projects live holders name one by one.
    pub fn projects(&self, now: Instant) -> BTreeSet<String> {
        self.held.values().filter(|(u, _)| *u > now).filter_map(|(_, p)| p.clone()).collect()
    }

    /// Whether hub `id` is watched at `at` (none: by any hold set, its
    /// time come or not).
    pub fn covers(&self, id: &str, at: Option<Instant>) -> bool {
        self.held.values().any(|(u, p)| at.is_none_or(|t| *u > t) && p.as_deref().is_none_or(|p| p == id))
    }

    /// Whether any hold is set, run out or not (its end still lets go).
    pub fn any(&self) -> bool {
        !self.held.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_screen_leaving_keeps_a_panels_hub_watched() {
        let t = Instant::now();
        let mut l = Leases::default();
        l.set(SCREEN, true, None, t);
        l.set("panel:shop/perf/bg3", true, Some("shop".into()), t);
        assert!(l.covers("mail", Some(t)) && l.covers("shop", Some(t)), "the screen covers every hub");
        l.set(SCREEN, false, None, t);
        assert!(!l.covers("mail", Some(t)), "the screen gone: mail isn't watched");
        assert!(l.covers("shop", Some(t)), "the panel still watches its own project");
        assert_eq!((l.all(t), l.projects(t)), (false, ["shop".to_string()].into()));
    }

    #[test]
    fn a_hold_runs_out_unless_renewed_and_the_union_is_per_hub() {
        let t = Instant::now();
        let mut l = Leases::default();
        l.set("panel:a/x/1", true, Some("a".into()), t);
        l.set("panel:b/y/2", true, Some("b".into()), t + Duration::from_secs(20));
        let later = t + LISTS_LEASE + Duration::from_secs(1);
        assert!(!l.covers("a", Some(later)) && l.covers("b", Some(later)), "a's panel said nothing for its lease: gone");
        assert!(l.covers("a", None), "still set until the tick drops it: its end lets go");
        assert!(l.expire(later));
        assert!(!l.covers("a", None));
        assert!(!l.expire(later), "nothing more to drop");
        assert!(l.any());
        l.set("panel:b/y/2", false, None, later);
        assert!(!l.any());
        // two panels on one project: one closing keeps it watched
        l.set("panel:a/x/1", true, Some("a".into()), t);
        l.set("panel:a/x/2", true, Some("a".into()), t);
        l.set("panel:a/x/1", false, None, t);
        assert!(l.covers("a", Some(t)));
    }
}
