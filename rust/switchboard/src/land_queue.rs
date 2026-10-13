//! The land queue (dev-flow §5): one land at a time per target ref, the
//! others in line, and the views' lids (`landing`, `waits to land · 2nd`).
//! Moved out of land.rs as is (feature-retire: land.rs stays under 1,000
//! lines); `land` re-exports [`Queue`] and [`Turn`].

use std::collections::BTreeMap;
use std::sync::{Arc, Condvar, Mutex};

#[derive(Default)]
struct Line {
    /// (ticket, target ref, place id), the first one landing.
    waiting: Vec<(u64, String, String)>,
    next: u64,
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
        }
    }

    /// The held line of each place in line (pr-design §4.1, the lid):
    /// `landing` for the first, `waits to land · 2nd` for the next.
    pub fn lids(&self) -> BTreeMap<String, String> {
        let (m, _) = &*self.inner;
        let l = m.lock().unwrap_or_else(|e| e.into_inner());
        let mut out = BTreeMap::new();
        let mut rank: BTreeMap<&str, usize> = BTreeMap::new();
        for (_, r, p) in &l.waiting {
            let n = rank.entry(r.as_str()).or_insert(0);
            let lid = if *n == 0 { "landing".to_string() } else { format!("waits to land · {}", ordinal(*n + 1)) };
            out.entry(p.clone()).or_insert(lid);
            *n += 1;
        }
        out
    }
}
