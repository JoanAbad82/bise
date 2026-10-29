//! The land queue (dev-flow §5): one land at a time per target ref, the
//! others in line, each place's rank in its line (the views' `landing`)
//! and the lid said from it (`landing`, `waits to land · 2nd`).
//! Moved out of land.rs as is (feature-retire: land.rs stays under 1,000
//! lines); `land` re-exports [`Queue`] and [`Turn`].
//! land-wait: one land per place at a time ([`Queue::claim`], from its
//! request to its end): a second is refused at once ([`busy`]), never a
//! second check of the same commit in line.

use std::collections::BTreeMap;
use std::sync::{Arc, Condvar, Mutex};

#[derive(Default)]
struct Line {
    /// (ticket, target ref, place id), the first one landing.
    waiting: Vec<(u64, String, String)>,
    next: u64,
    /// The lands started and not ended, by [`claim_key`], since when (ms).
    claims: BTreeMap<String, u64>,
}

/// A land started, from its request to its end; dropping it ends it.
pub struct Claim {
    q: Queue,
    key: String,
}

impl Drop for Claim {
    fn drop(&mut self) {
        let (m, _) = &*self.q.inner;
        m.lock().unwrap_or_else(|e| e.into_inner()).claims.remove(&self.key);
    }
}

/// Whose land a land is: a worktree's branch is its place's (two lands
/// of it land the same commits), a `--here` its agent's in its place
/// (two agents of the shared folder land their own files at once).
pub fn claim_key(place: &str, agent: &str, here: bool) -> String {
    if here {
        format!("{} {}", place, agent)
    } else {
        place.to_string()
    }
}

/// Since when the land of `key` runs, if one does (land-wait: an agent
/// whose sb gave up ran it again, a second check of the same commit).
pub fn in_line(claims: &BTreeMap<String, u64>, key: &str) -> Option<u64> {
    claims.get(key).copied()
}

/// The refusal of a second land of a place, its first started at
/// `since_ms` (architect m_29755: the words say what an agent runs it
/// again for, its commits made meanwhile).
pub fn busy(since_ms: u64, now_ms: u64) -> String {
    let s = now_ms.saturating_sub(since_ms) / 1000;
    let ago = if s < 60 { format!("{} s", s) } else { format!("{} min", s / 60) };
    format!(
        "a land of this place is in line or checking (since {}): its result comes to you. Changes you made after it started land with your next sb land, once it ends.",
        ago
    )
}

/// The land queue, shared by the daemon's land threads.
#[derive(Clone, Default)]
pub struct Queue {
    inner: Arc<(Mutex<Line>, Condvar)>,
}

/// A place in line; dropping it leaves the line.
pub struct Turn {
    q: Queue,
    ticket: u64,
    target: String,
}

impl Turn {
    /// The ref this turn holds (`refs/heads/main`).
    pub fn target(&self) -> &str {
        &self.target
    }
}

impl Drop for Turn {
    fn drop(&mut self) {
        let (m, cv) = &*self.q.inner;
        let mut l = m.lock().unwrap_or_else(|e| e.into_inner());
        l.waiting.retain(|(t, _, _)| *t != self.ticket);
        cv.notify_all();
    }
}

pub(crate) fn ordinal(n: usize) -> String {
    let suffix = match (n % 10, n % 100) {
        (1, x) if x != 11 => "st",
        (2, x) if x != 12 => "nd",
        (3, x) if x != 13 => "rd",
        _ => "th",
    };
    format!("{}{}", n, suffix)
}

impl Queue {
    /// Start the land of `key` ([`claim_key`]) at `now_ms`; Err: since
    /// when the one already started runs ([`busy`] says it).
    pub fn claim(&self, key: &str, now_ms: u64) -> Result<Claim, u64> {
        let (m, _) = &*self.inner;
        let mut l = m.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(since) = in_line(&l.claims, key) {
            return Err(since);
        }
        l.claims.insert(key.to_string(), now_ms);
        Ok(Claim { q: self.clone(), key: key.to_string() })
    }

    /// Join the line for `target` and wait until first. `joined`: called
    /// once in line (the views refresh: the lid says it waits).
    pub fn wait_turn(&self, target: &str, place: &str, joined: &mut dyn FnMut()) -> Turn {
        let (m, cv) = &*self.inner;
        let ticket = {
            let mut l = m.lock().unwrap_or_else(|e| e.into_inner());
            l.next += 1;
            let t = l.next;
            l.waiting.push((t, target.to_string(), place.to_string()));
            t
        };
        joined();
        let mut l = m.lock().unwrap_or_else(|e| e.into_inner());
        while l.waiting.iter().find(|(_, r, _)| r == target).map(|(t, _, _)| *t) != Some(ticket) {
            l = cv.wait(l).unwrap_or_else(|e| e.into_inner());
        }
        Turn {
            q: self.clone(),
            ticket,
            target: target.to_string(),
        }
    }

    /// The rank of each place in line, 1-based in its target's line (1:
    /// it lands now), its first ticket when it waits twice. The views'
    /// `landing`; its lid is [`lid`] of it.
    pub fn ranks(&self) -> BTreeMap<String, u32> {
        let (m, _) = &*self.inner;
        let l = m.lock().unwrap_or_else(|e| e.into_inner());
        let mut out = BTreeMap::new();
        let mut taken: BTreeMap<&str, u32> = BTreeMap::new();
        for (_, r, p) in &l.waiting {
            let n = taken.entry(r.as_str()).or_insert(0);
            *n += 1;
            out.entry(p.clone()).or_insert(*n);
        }
        out
    }
}

/// The held line of a place at `rank` in line (pr-design §4.1, the lid):
/// `landing` for the first, `waits to land · 2nd` for the next.
pub fn lid(rank: u32) -> String {
    if rank <= 1 {
        "landing".to_string()
    } else {
        format!("waits to land · {}", ordinal(rank as usize))
    }
}

/// The lids of [`Queue::ranks`], by place id.
pub fn lids(ranks: &BTreeMap<String, u32>) -> BTreeMap<String, String> {
    ranks.iter().map(|(p, n)| (p.clone(), lid(*n))).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    /// land-wait: a second land of a place waits for nothing; it is
    /// refused while the first runs, and taken once it ended.
    #[test]
    fn one_land_of_a_place_at_a_time() {
        let q = Queue::default();
        let first = q.claim(&claim_key("wt:a", "a", false), 1_000).expect("first");
        assert_eq!(q.claim(&claim_key("wt:a", "b", false), 5_000).err(), Some(1_000));
        // another place, and two agents' --here in the shared folder
        let _b = q.claim(&claim_key("wt:b", "b", false), 5_000).expect("another place");
        let _x = q.claim(&claim_key("shared", "x", true), 5_000).expect("x");
        let _y = q.claim(&claim_key("shared", "y", true), 5_000).expect("y");
        assert!(q.claim(&claim_key("shared", "x", true), 6_000).is_err());
        drop(first);
        assert!(q.claim(&claim_key("wt:a", "a", false), 9_000).is_ok());
    }

    #[test]
    fn in_line_reads_the_claims() {
        let claims: BTreeMap<String, u64> = [("wt:a".to_string(), 42)].into();
        assert_eq!(in_line(&claims, "wt:a"), Some(42));
        assert_eq!(in_line(&claims, "wt:b"), None);
    }

    #[test]
    fn the_refusal_says_since_when_and_what_lands_next() {
        let r = busy(0, 12 * 60_000 + 5_000);
        assert!(r.starts_with("a land of this place is in line or checking (since 12 min): its result comes to you."), "{}", r);
        assert!(r.ends_with("land with your next sb land, once it ends."), "{}", r);
        assert!(busy(0, 40_000).contains("(since 40 s)"));
    }
}
