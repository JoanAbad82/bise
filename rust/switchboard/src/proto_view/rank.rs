//! The agents' rank (agent-rank, architect m_39150): one stable order
//! of the live agents, the `rank` of their rows, that the terminal's
//! panel and the desktop's right bar both sort by and bind ⌥1-9 to.
//! Main is 0 and first, always; the others 1..n. Pure: `now` and the
//! messages are arguments.
//!
//! The score is a frecency (Mozilla Places' 2023 decay, in hours):
//! - talk: each of his messages to it is worth `2^(-age / 6 h)`, kept
//!   per agent the Firefox way, `(score, at)` (one multiply to read it
//!   at `now`), filled from the messages it has not read yet, so a pass
//!   never walks every message again;
//! - act: 4 when it needs him (a card of his, it waits on him, blocked,
//!   failed), 2 while it works (working, waiting on an agent, paused on
//!   an event), else 2 fading with a 30 min half-life since it rests.
//!
//! It holds still: the new order starts from the last one, and an agent
//! passes the one above it only by more than [`MARGIN`]; it is ranked
//! again at most once a [`MINUTE`] (a newcomer is placed by its score at
//! once, a leaver's place closes at once), only when rows are built for
//! a client, so an idle hub never ranks. Ties: older first (created_ms),
//! then the name. The clients keep what they show while ⌥ is held: a
//! hold of this order, never a second ranking.
//!
//! [`Ranks`] is view state on the shell (`daemon/proto.rs`), lost on a
//! hub restart by design: the first rows after it rank from scratch.

use bise_proto::rows::{Agent, Status, WaitingOn};
use std::collections::BTreeMap;

/// His message's weight halves every 6 hours.
pub const TALK_HALF_MS: f64 = 6.0 * 3600.0 * 1000.0;
/// A resting agent's activity halves every 30 minutes.
pub const REST_HALF_MS: f64 = 30.0 * 60.0 * 1000.0;
/// What an agent's score must beat the one above it by to pass it.
pub const MARGIN: f64 = 1.0;
/// The order is ranked again at most this often.
pub const MINUTE: u64 = 60_000;

const NEEDS: f64 = 4.0;
const WORKS: f64 = 2.0;

/// One message from him: to whom, when.
#[derive(Clone, Copy, Debug)]
pub struct Heard<'a> {
    pub id: u64,
    pub to: &'a str,
    pub at: u64,
}

/// His messages to one agent, decayed: worth `score` at `at`.
#[derive(Clone, Copy, Debug, Default, PartialEq)]
struct Talk {
    score: f64,
    at: u64,
}

fn decay(ms: f64, half: f64) -> f64 {
    (-(ms / half)).exp2()
}

impl Talk {
    fn add(&mut self, t: u64) {
        if t >= self.at {
            self.score = self.score * decay((t - self.at) as f64, TALK_HALF_MS) + 1.0;
            self.at = t;
        } else {
            self.score += decay((self.at - t) as f64, TALK_HALF_MS);
        }
    }

    fn at(&self, now: u64) -> f64 {
        self.score * decay(now.saturating_sub(self.at) as f64, TALK_HALF_MS)
    }
}

/// What an agent is doing, for its score.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Act {
    /// it needs him
    Needs,
    /// it works
    Works,
    /// at rest since then (ms)
    Rests(u64),
}

impl Act {
    /// A row's activity, from its typed state.
    pub fn of(a: &Agent) -> Act {
        let you = matches!(a.waiting_on, Some(WaitingOn::You));
        if a.waits > 0 || you || matches!(a.status, Status::Blocked | Status::Failed) {
            return Act::Needs;
        }
        let other = matches!(a.waiting_on, Some(WaitingOn::Agent { .. }));
        if matches!(a.status, Status::Working | Status::Waiting) || other || a.watching.iter().any(|w| w.resumes) {
            return Act::Works;
        }
        Act::Rests(a.since_ms)
    }

    fn score(self, now: u64) -> f64 {
        match self {
            Act::Needs => NEEDS,
            Act::Works => WORKS,
            Act::Rests(since) => WORKS * decay(now.saturating_sub(since) as f64, REST_HALF_MS),
        }
    }
}

/// One live agent to rank (main is not one).
#[derive(Clone, Debug)]
pub struct Input<'a> {
    pub name: &'a str,
    /// its former names: his messages to them count
    pub aliases: &'a [String],
    pub created_ms: u64,
    pub act: Act,
}

/// The rank's memory: his talk by agent, the next message to read, the
/// last order and when it was ranked.
#[derive(Debug, Default)]
pub struct Ranks {
    talk: BTreeMap<String, Talk>,
    next: u64,
    order: Vec<String>,
    at: u64,
}

impl Ranks {
    /// His messages, those from id [`Ranks::unread`] on (ascending ids);
    /// the others' messages are not given.
    pub fn hear<'a>(&mut self, heard: impl IntoIterator<Item = Heard<'a>>) {
        for h in heard {
            if h.id < self.next {
                continue;
            }
            self.next = h.id + 1;
            self.talk.entry(h.to.to_string()).or_default().add(h.at);
        }
    }

    /// The first message id not read yet.
    pub fn unread(&self) -> u64 {
        self.next
    }

    /// His talk with `name` (and its former names) at `now`.
    pub fn talk(&self, name: &str, aliases: &[String], now: u64) -> f64 {
        std::iter::once(name).chain(aliases.iter().map(String::as_str)).filter_map(|n| self.talk.get(n)).map(|t| t.at(now)).sum()
    }

    /// The live agents' order now, held still (the module's rules).
    pub fn order(&mut self, live: &[Input], now: u64) -> &[String] {
        let score: BTreeMap<&str, f64> = live.iter().map(|i| (i.name, i.act.score(now) + self.talk(i.name, i.aliases, now))).collect();
        let s = |n: &str| score.get(n).copied().unwrap_or(0.0);
        let mut order: Vec<String> = self.order.iter().filter(|n| score.contains_key(n.as_str())).cloned().collect();
        if order.is_empty() || now.saturating_sub(self.at) >= MINUTE {
            settle(&mut order, &s);
            self.at = now;
        }
        let mut new: Vec<&Input> = live.iter().filter(|i| !order.iter().any(|n| n == i.name)).collect();
        new.sort_by(|a, b| s(b.name).total_cmp(&s(a.name)).then(a.created_ms.cmp(&b.created_ms)).then(a.name.cmp(b.name)));
        for i in new {
            let at = order.iter().position(|n| s(i.name) > s(n)).unwrap_or(order.len());
            order.insert(at, i.name.to_string());
        }
        self.order = order;
        &self.order
    }
}

/// An agent passes the one above it only by more than [`MARGIN`], until
/// none does (each swap undoes one such pair and makes none: it ends).
fn settle(order: &mut [String], s: &dyn Fn(&str) -> f64) {
    loop {
        let mut moved = false;
        for i in 1..order.len() {
            if s(&order[i]) > s(&order[i - 1]) + MARGIN {
                order.swap(i, i - 1);
                moved = true;
            }
        }
        if !moved {
            return;
        }
    }
}

/// The rows' `rank`: main 0, the live others 1..n in [`Ranks::order`];
/// an archived row none.
pub fn apply(rows: &mut [Agent], ranks: &mut Ranks, now: u64) {
    let live: Vec<Input> = rows
        .iter()
        .filter(|a| !a.archived && !a.main)
        .map(|a| Input { name: &a.name, aliases: &a.aliases, created_ms: a.created_ms.unwrap_or(0), act: Act::of(a) })
        .collect();
    let order: BTreeMap<String, u32> = ranks.order(&live, now).iter().enumerate().map(|(i, n)| (n.clone(), i as u32 + 1)).collect();
    for a in rows.iter_mut() {
        a.rank = if a.archived {
            None
        } else if a.main {
            Some(0)
        } else {
            order.get(&a.name).copied()
        };
    }
}

#[cfg(test)]
#[path = "rank_tests.rs"]
mod tests;
