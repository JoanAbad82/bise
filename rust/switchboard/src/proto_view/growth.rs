//! The growth input of the hub's agents (les bims' growing office,
//! architect m_28018, m_28128): one [`GrowthRow`] per agent of the client
//! snapshot, main left out. `done` reads the snapshot's `declared` (the
//! status the agent declared, model::Agent.declared, which an archive
//! keeps; sb-core clears it when the agent starts a new turn) as the
//! typed [`Declared`]: never the typed Agent row (lossy on an archived
//! agent, see GrowthRow), never `report_kind` (each turn's end writes an
//! auto report of kind "turn" over the done), never words; an unknown
//! value is not done. The shell's cache and event are
//! `daemon/proto/growth.rs`.

use crate::model::Declared;
use bise_proto::rows::GrowthRow;
use serde_json::Value;

/// The snapshot's agents as growth rows (main left out).
pub fn growth_rows(snap: &Value) -> Vec<GrowthRow> {
    let agents = snap.get("agents").and_then(Value::as_array).map(Vec::as_slice).unwrap_or_default();
    agents
        .iter()
        .filter(|a| !a.get("main").and_then(Value::as_bool).unwrap_or(false))
        .map(|a| GrowthRow {
            done: a.get("declared").cloned().and_then(|d| serde_json::from_value::<Declared>(d).ok()) == Some(Declared::Done),
            created_ms: a.get("created_ms").and_then(Value::as_u64).filter(|m| *m > 0),
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use bise_proto::rows::growth;
    use serde_json::json;

    #[test]
    fn an_archived_done_counts_an_archived_failed_does_not_main_is_left_out() {
        let snap = json!({"agents": [
            {"name": "main", "main": true, "status": "idle", "declared": "done", "created_ms": 5},
            // its turn's auto report came after its done: still done
            {"name": "shipped", "status": "archived", "declared": "done", "report_kind": "turn", "created_ms": 7},
            {"name": "broke", "status": "archived", "declared": null, "report_kind": "failed", "created_ms": 8},
            {"name": "live", "status": "done", "declared": "done", "created_ms": 9},
            {"name": "stuck", "status": "blocked", "declared": "blocked"},
            {"name": "odd", "status": "archived", "declared": "shipped-ish", "created_ms": 0},
            {"name": "quiet", "status": "archived", "report_kind": "done"},
        ]});
        let rows = growth_rows(&snap);
        assert_eq!(rows.len(), 6, "main left out");
        assert_eq!(rows.iter().map(|r| r.done).collect::<Vec<_>>(), [true, false, true, false, false, false]);
        assert_eq!(rows.iter().map(|r| r.created_ms).collect::<Vec<_>>(), [Some(7), Some(8), Some(9), None, None, None]);
        let g = growth(&rows, 3, &|_| 0);
        assert_eq!((g.jobs_done, g.days_used, g.artifacts_made, g.since_ms), (2, 1, 3, Some(7)));
        assert!(growth_rows(&json!({})).is_empty());
    }
}
