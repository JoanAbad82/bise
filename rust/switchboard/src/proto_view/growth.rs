//! The growth input of the hub's agents (les bims' growing office,
//! architect m_28018, m_28128): one [`GrowthRow`] per agent of the
//! hub's snapshot, main left out. `done` reads the row's `declared` (the
//! status the agent declared, model::Agent.declared, which an archive
//! keeps; sb-core clears it when the agent starts a new turn): never the
//! typed Agent row (lossy on an archived agent, see GrowthRow), never
//! `report_kind` (each turn's end writes an auto report of kind "turn"
//! over the done), never words. The shell's cache and event are
//! `daemon/proto/growth.rs`.

use crate::model::Declared;
use crate::snapshot::Snapshot;
use bise_proto::rows::GrowthRow;

/// The snapshot's agents as growth rows (main left out).
pub fn growth_rows(snap: &Snapshot) -> Vec<GrowthRow> {
    snap.agents
        .iter()
        .filter(|a| !a.main)
        .map(|a| GrowthRow { done: a.declared == Some(Declared::Done), created_ms: Some(a.created_ms).filter(|m| *m > 0) })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::snapshot::AgentRow;
    use bise_proto::rows::growth;

    #[test]
    fn an_archived_done_counts_an_archived_failed_does_not_main_is_left_out() {
        let row = |name: &str, main: bool, declared: Option<Declared>, kind: Option<&str>, created_ms: u64| AgentRow {
            main,
            declared,
            report_kind: kind.map(str::to_string),
            created_ms,
            ..AgentRow::test(name)
        };
        let snap = Snapshot {
            agents: vec![
                row("main", true, Some(Declared::Done), None, 5),
                // its turn's auto report came after its done: still done
                row("shipped", false, Some(Declared::Done), Some("turn"), 7),
                row("broke", false, None, Some("failed"), 8),
                row("live", false, Some(Declared::Done), None, 9),
                row("stuck", false, Some(Declared::Blocked), None, 0),
                row("quiet", false, None, Some("done"), 0),
            ],
            ..Snapshot::default()
        };
        let rows = growth_rows(&snap);
        assert_eq!(rows.len(), 5, "main left out");
        assert_eq!(rows.iter().map(|r| r.done).collect::<Vec<_>>(), [true, false, true, false, false]);
        assert_eq!(rows.iter().map(|r| r.created_ms).collect::<Vec<_>>(), [Some(7), Some(8), Some(9), None, None]);
        let g = growth(&rows, 3, &|_| 0);
        assert_eq!((g.jobs_done, g.days_used, g.artifacts_made, g.since_ms), (2, 1, 3, Some(7)));
        assert!(growth_rows(&Snapshot::default()).is_empty());
    }
}
