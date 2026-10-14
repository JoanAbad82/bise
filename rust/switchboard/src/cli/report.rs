//! `sb report`'s `--step` and `--result` read (S10, emitter 5): out of
//! cli.rs (its line limit).

use super::*;

/// `--step 3/7`: (3, 7), 1 <= n <= m.
pub(super) fn step_of(s: &str) -> Result<(u32, u32), String> {
    let bad = || format!("--step expects <n>/<m>, like 3/7 (not {s})");
    let (n, m) = s.trim().split_once('/').ok_or_else(bad)?;
    let (n, m): (u32, u32) = (n.trim().parse().map_err(|_| bad())?, m.trim().parse().map_err(|_| bad())?);
    if n == 0 || m == 0 || n > m {
        return Err(bad());
    }
    Ok((n, m))
}

/// `--result '<json>'`: proto's DiffResult, one shape for the review.
pub(super) fn result_of(s: &str) -> Result<Value, String> {
    let ex = r#"--result '{"label":"p99","before":420,"after":290,"unit":"ms"}'"#;
    let r: bise_proto::diff::DiffResult = serde_json::from_str(s).map_err(|e| format!("--result: {e}; like {ex}"))?;
    serde_json::to_value(r).map_err(|e| e.to_string())
}
