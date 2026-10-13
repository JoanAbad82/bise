//! The newest switch's facts in versions.json (`switch`) and the row a
//! hub says from them (`hub/switch`, architect m_20569/m_20576).

use crate::util::now_ms;
use serde_json::{json, Value};

/// The newest switch's facts in versions.json (`switch`): its phase, the
/// versions it went to and from, why it rolled back, when the phase
/// began. Written by the switcher only, through super::write_state; the
/// next switch's start overwrites it.
pub(super) fn set_phase(st: &mut Value, phase: &str, to: &str, from: &str, reason: Option<&str>) {
    st["switch"] = json!({"phase": phase, "to": to, "from": from, "reason": reason, "at_ms": now_ms()});
}

/// The switch row a hub says (`hub/switch`), from versions.json's
/// `switch` and this hub's own version id (`mine`, super::id_of its app
/// root). A 'reloading' whose `to` is this hub's own version reads 'up':
/// this hub is the new one, answering, so 'up' needs no write it could
/// miss. A stale 'reloading' (a switch that never wrote its end) reads
/// 'up' with its OLD `at_ms` on that version: the window's fade reads
/// `at_ms`, so it never shows an old line as new. None: no switch known
/// (or a file without it).
pub fn row(st: &Value, mine: &str) -> Option<bise_proto::rows::SwitchRow> {
    use bise_proto::rows::{SwitchPhase, SwitchRow};
    let w = st.get("switch").filter(|w| w.is_object())?;
    let s = |k: &str| w.get(k).and_then(Value::as_str).filter(|x| !x.is_empty()).map(str::to_string);
    let to = s("to")?;
    let phase = match s("phase").as_deref() {
        Some("reloading") if to == mine => SwitchPhase::Up,
        Some("reloading") => SwitchPhase::Reloading,
        Some("up") => SwitchPhase::Up,
        Some("passed") => SwitchPhase::Passed,
        Some("rolled_back") => SwitchPhase::RolledBack,
        _ => SwitchPhase::Unknown,
    };
    Some(SwitchRow { phase, to, from: s("from"), reason: s("reason"), at_ms: w.get("at_ms").and_then(Value::as_u64).unwrap_or(0) })
}

#[cfg(test)]
mod tests {
    use super::{row, set_phase};

    /// The switch row per phase (architect m_20576): 'reloading' to
    /// another version is reloading, to this hub's own version it reads
    /// 'up' (the new hub, answering) with the start's at_ms; passed and
    /// rolled_back as written, with the reason; no `switch` (or a bad
    /// one) is no row; a phase this version doesn't know is Unknown.
    #[test]
    fn the_switch_row_says_each_phase() {
        use bise_proto::rows::SwitchPhase::*;
        let mut st = serde_json::json!({"current": "/v/b"});
        assert_eq!(row(&st, "b"), None, "no switch known");
        set_phase(&mut st, "reloading", "b", "a", None);
        let at = st["switch"]["at_ms"].as_u64().unwrap();
        let r = row(&st, "a").unwrap();
        assert_eq!((r.phase, r.to.as_str(), r.from.as_deref(), r.reason, r.at_ms), (Reloading, "b", Some("a"), None, at), "the old hub");
        assert_eq!(row(&st, "b").map(|r| (r.phase, r.at_ms)), Some((Up, at)), "the new hub: up, the start's at_ms");
        set_phase(&mut st, "passed", "b", "a", None);
        assert_eq!(row(&st, "b").map(|r| r.phase), Some(Passed));
        set_phase(&mut st, "rolled_back", "b", "a", Some("the hub died"));
        let r = row(&st, "a").unwrap();
        assert_eq!((r.phase, r.reason.as_deref()), (RolledBack, Some("the hub died")));
        st["switch"]["phase"] = serde_json::json!("warp");
        assert_eq!(row(&st, "a").map(|r| r.phase), Some(Unknown));
        st["switch"] = serde_json::json!("garbage");
        assert_eq!(row(&st, "a"), None);
        // the wire: optional fields left out
        set_phase(&mut st, "passed", "b", "", None);
        let j = serde_json::to_string(&row(&st, "b").unwrap()).unwrap();
        assert!(!j.contains("from") && !j.contains("reason") && j.contains("\"phase\":\"passed\""), "{j}");
    }
}
