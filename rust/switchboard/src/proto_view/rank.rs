//! The agents' rank (agent-rank, architect m_39150; side-sort, his
//! m_47356 « les agents en cours d'activité plus haut, et surtout les
//! derniers lancés devant tous ceux en done », architect m_47361): one
//! order of the live agents, the `rank` of their rows, that the
//! terminal's panel and every desktop list (the side, the Overview, the
//! float, ⌥1-9) sort by. Main is 0 and first, always; the others 1..n.
//!
//! The rule, by tier, then newest launched first (`created_ms`), then
//! the name:
//! 1. it needs him: a card of his, it waits on him, blocked, failed;
//! 2. it works: working, waiting, waiting on an agent, paused on an
//!    event it resumes on;
//! 3. it rests: idle;
//! 4. done.
//!
//! Pure: a function of the rows, no memory, no clock. A tier change
//! shows at once (an agent that works again goes back up); the clients
//! hold the numbers he sees while ⌥ is held and a moment after an ⌥N
//! jump (desktop agents/model numbersOf, the TUI's sb/numbers.rs).

use bise_proto::rows::{Agent, Status, WaitingOn};
use std::collections::BTreeMap;

/// An agent's tier, the first key of the order: the smaller, the higher.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum Tier {
    /// it needs him
    Needs,
    /// it works
    Works,
    /// at rest, not done
    Rests,
    /// done
    Done,
}

impl Tier {
    /// A row's tier, from its typed state.
    pub fn of(a: &Agent) -> Tier {
        let you = matches!(a.waiting_on, Some(WaitingOn::You));
        if a.waits > 0 || you || matches!(a.status, Status::Blocked | Status::Failed) {
            return Tier::Needs;
        }
        let other = matches!(a.waiting_on, Some(WaitingOn::Agent { .. }));
        if matches!(a.status, Status::Working | Status::Waiting) || other || a.watching.iter().any(|w| w.resumes) {
            return Tier::Works;
        }
        if matches!(a.status, Status::Done) {
            return Tier::Done;
        }
        Tier::Rests
    }
}

/// One live agent to rank (main is not one).
#[derive(Clone, Copy, Debug)]
pub struct Input<'a> {
    pub name: &'a str,
    /// when it was launched (0: unknown, last of its tier)
    pub created_ms: u64,
    pub tier: Tier,
}

/// The live agents' order: by tier, then newest launched first, then
/// the name. Pure.
pub fn order<'a>(live: &[Input<'a>]) -> Vec<&'a str> {
    let mut v = live.to_vec();
    v.sort_by(|a, b| a.tier.cmp(&b.tier).then(b.created_ms.cmp(&a.created_ms)).then(a.name.cmp(b.name)));
    v.into_iter().map(|i| i.name).collect()
}

/// The rows' `rank`: main 0, the live others 1..n in [`order`]; an
/// archived row none.
pub fn apply(rows: &mut [Agent]) {
    let live: Vec<Input> = rows
        .iter()
        .filter(|a| !a.archived && !a.main)
        .map(|a| Input { name: &a.name, created_ms: a.created_ms.unwrap_or(0), tier: Tier::of(a) })
        .collect();
    let at: BTreeMap<String, u32> = order(&live).into_iter().enumerate().map(|(i, n)| (n.to_string(), i as u32 + 1)).collect();
    for a in rows.iter_mut() {
        a.rank = if a.archived {
            None
        } else if a.main {
            Some(0)
        } else {
            at.get(&a.name).copied()
        };
    }
}

#[cfg(test)]
#[path = "rank_tests.rs"]
mod tests;
