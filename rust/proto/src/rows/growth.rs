//! How much a project has done since its first agent (les bims, page
//! bims-office v14 "un bureau qui grandit"; architect m_27970, m_28018):
//! the `growth` event (`hub/growth`) and view.json's `growth` (⌘K's
//! [`crate::app_rows::IndexRow`]). Computed by one pure fn, [`growth`],
//! from the hub's agent rows and its artifact count: never a stored
//! counter (archived agents and artifacts keep their rows, so archiving
//! changes nothing). `jobs_done` is the agents in the done state now,
//! live or archived: it goes down by one when a done agent starts a new
//! turn (sb-core clears its declared done), by design. No level or stage
//! here: the office's stages are the desktop's drawing table, and its
//! high-water mark per project is what keeps the office from shrinking.
//! Lands come later, from sb-core's land record (absent until then).

use serde::{Deserialize, Serialize};

/// The project's counters. `since_ms`: its first agent's `created_ms`
/// (none: no row says when it was made).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct Growth {
    /// agents in the done state now, live or archived (a done agent
    /// that resumes leaves it)
    #[serde(default)]
    pub jobs_done: u32,
    /// distinct local days on which an agent was created
    #[serde(default)]
    pub days_used: u32,
    /// every artifact made, archived ones included
    #[serde(default)]
    pub artifacts_made: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub since_ms: Option<u64>,
}

/// One agent as [`growth`] reads it. Not [`super::Agent`] on purpose:
/// the typed Agent row is lossy on an archived agent, whose status folds
/// to (Done, archived) and whose `report.kind` follows that status, so it
/// can't tell an archived done from an archived failed. Nor the last
/// report's kind: each turn's end writes an auto report (kind "turn")
/// over the done. The hub fills this from the status the agent declared
/// (the snapshot's `declared`, switchboard's `proto_view::growth_rows`),
/// which the archive keeps (architect m_28128). Don't "simplify" it back
/// to the Agent row.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct GrowthRow {
    /// it is in the done state now: it declared done (`sb report done`,
    /// `sb status done`) and started no turn since; archived or not
    pub done: bool,
    pub created_ms: Option<u64>,
}

/// The counters of `rows` (main left out by the caller) and
/// `artifacts_total`. `off`: the UTC offset in seconds east at a time
/// (bise_home::clock::offset_at), so a day is the user's local day.
pub fn growth(rows: &[GrowthRow], artifacts_total: u32, off: &dyn Fn(u64) -> i32) -> Growth {
    let days: std::collections::BTreeSet<i64> = rows
        .iter()
        .filter_map(|r| r.created_ms)
        .map(|ms| ((ms / 1000) as i64 + off(ms) as i64).div_euclid(86_400))
        .collect();
    Growth {
        jobs_done: rows.iter().filter(|r| r.done).count() as u32,
        days_used: days.len() as u32,
        artifacts_made: artifacts_total,
        since_ms: rows.iter().filter_map(|r| r.created_ms).min(),
    }
}

/// [`growth_key`]'s value: rows, done rows, artifacts, oldest and newest
/// created_ms.
pub type GrowthKey = (usize, usize, u32, Option<u64>, Option<u64>);

/// What [`growth`] depends on, cheap to compare (architect m_28018: the
/// per-row offset is not free on 700+ archived rows, so the hub computes
/// again only when this key moves): how many rows, how many done, the
/// artifact count, the newest created_ms (a row replaced by a younger one
/// at the same count).
pub fn growth_key(rows: &[GrowthRow], artifacts_total: u32) -> GrowthKey {
    let made = rows.iter().filter_map(|r| r.created_ms);
    (rows.len(), rows.iter().filter(|r| r.done).count(), artifacts_total, made.clone().min(), made.max())
}

#[cfg(test)]
mod tests {
    use super::*;

    const DAY: u64 = 86_400_000;
    // 2026-10-02 00:00 UTC
    const T0: u64 = 1_790_899_200_000;

    fn row(done: bool, created_ms: Option<u64>) -> GrowthRow {
        GrowthRow { done, created_ms }
    }

    fn utc(_: u64) -> i32 {
        0
    }

    #[test]
    fn counts_done_days_and_artifacts() {
        let rows = [row(true, Some(T0 + 1)), row(false, Some(T0 + 2)), row(true, Some(T0 + DAY + 5)), row(true, None)];
        let g = growth(&rows, 12, &utc);
        assert_eq!(g, Growth { jobs_done: 3, days_used: 2, artifacts_made: 12, since_ms: Some(T0 + 1) });
        assert_eq!(growth(&[], 0, &utc), Growth::default());
    }

    #[test]
    fn a_day_is_the_local_day() {
        // 23:30 and 00:30 UTC: two days in UTC, one in UTC-2 (both the
        // evening before), one in UTC+2 too (both the next morning)
        let rows = [row(false, Some(T0 + DAY - 1_800_000)), row(false, Some(T0 + DAY + 1_800_000))];
        assert_eq!(growth(&rows, 0, &utc).days_used, 2);
        assert_eq!(growth(&rows, 0, &|_| -7200).days_used, 1);
        assert_eq!(growth(&rows, 0, &|_| 7200).days_used, 1);
    }

    /// Law: adding a row or an artifact never lowers a counter, and
    /// `since_ms` never moves later.
    #[test]
    fn never_lowers() {
        let base = [row(true, Some(T0 + 3 * DAY)), row(false, Some(T0 + 5 * DAY)), row(true, None)];
        let extras = [row(true, Some(T0)), row(false, None), row(false, Some(T0 + 5 * DAY + 9)), row(true, Some(T0 + 9 * DAY))];
        for e in extras {
            for more in [0, 1, 7] {
                let a = growth(&base, 4, &utc);
                let mut rows = base.to_vec();
                rows.push(e);
                let b = growth(&rows, 4 + more, &utc);
                assert!(b.jobs_done >= a.jobs_done && b.days_used >= a.days_used && b.artifacts_made >= a.artifacts_made, "{e:?} +{more}");
                assert!(b.since_ms <= a.since_ms || a.since_ms.is_none(), "{e:?}");
            }
        }
    }

    /// Law, by design: a done agent that resumes (sb-core clears its
    /// declared done at its next turn) lowers jobs_done by one, and only
    /// that; archiving a row changes nothing (the row stays, same inputs).
    #[test]
    fn a_resumed_done_agent_lowers_jobs_done_by_one() {
        let done = [row(true, Some(T0)), row(true, Some(T0 + DAY)), row(false, Some(T0 + 2 * DAY))];
        let g = growth(&done, 5, &utc);
        let resumed = [done[0], row(false, Some(T0 + DAY)), done[2]];
        let h = growth(&resumed, 5, &utc);
        assert_eq!(h, Growth { jobs_done: g.jobs_done - 1, ..g });
    }

    /// Law: the rows' order changes nothing (the hub's order may move).
    #[test]
    fn order_free() {
        let mut rows = vec![row(true, Some(T0 + 2 * DAY)), row(false, Some(T0)), row(true, None), row(false, Some(T0 + 7 * DAY + 4))];
        let g = growth(&rows, 3, &utc);
        rows.reverse();
        assert_eq!(growth(&rows, 3, &utc), g);
        rows.rotate_left(1);
        assert_eq!(growth(&rows, 3, &utc), g);
    }

    /// Law: a row without `created_ms` adds no day and moves no
    /// `since_ms`; it still counts when done.
    #[test]
    fn no_created_ms_no_day() {
        let rows = [row(false, Some(T0))];
        let g = growth(&rows, 0, &utc);
        let h = growth(&[rows[0], row(true, None)], 0, &utc);
        assert_eq!((h.days_used, h.since_ms, h.jobs_done), (g.days_used, g.since_ms, g.jobs_done + 1));
    }

    /// The key moves whenever the counters can.
    #[test]
    fn the_key_follows_the_inputs() {
        let rows = [row(true, Some(T0)), row(false, Some(T0 + DAY))];
        let k = growth_key(&rows, 2);
        assert_ne!(growth_key(&rows, 3), k);
        assert_ne!(growth_key(&[rows[0], row(true, Some(T0 + DAY))], 2), k);
        assert_ne!(growth_key(&[rows[0], row(false, Some(T0 + 3 * DAY))], 2), k);
        assert_ne!(growth_key(&rows[..1], 2), k);
        assert_eq!(growth_key(&[rows[1], rows[0]], 2), k);
    }
}
