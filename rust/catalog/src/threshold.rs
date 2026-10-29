//! The compaction threshold (BISE-300, issue #18): a value written in
//! tokens or as a share of the model's window, never above 85 % of it;
//! none: 450k for a window of 1M or more, else 85 % of the window
//! (Gabriel, page token-audit). One rule for doctor, `bise config` and
//! the catalog; the Bend runtime keeps the same
//! (runtime/threshold-pure.bend), both held to
//! testdata/compaction_threshold.tsv.

/// The window from which the default is [`BIG_WINDOW_THRESHOLD`].
pub const BIG_WINDOW: u64 = 1_000_000;
/// The default threshold of a window of 1M or more: a 1M window compacted
/// at 800k re-sent up to 800k tokens a call (issue #18).
pub const BIG_WINDOW_THRESHOLD: u64 = 450_000;

/// 85 % of a context window, in tokens: the most any threshold gets.
pub fn threshold_of(context: u64) -> u64 {
    context / 20 * 17 + context % 20 * 17 / 20
}

/// The threshold nothing writes: 450k from a 1M window, else 85 % of it.
pub fn default_threshold_of(context: u64) -> u64 {
    if context >= BIG_WINDOW {
        BIG_WINDOW_THRESHOLD.min(threshold_of(context))
    } else {
        threshold_of(context)
    }
}

/// A compaction threshold as written (BISE-300), in tokens for a model
/// with this window: a number of tokens ("450000") or a share of the
/// window ("45%", above 100 counts as 100). None when it is no threshold
/// (0, empty, a word, a decimal share): the default applies. The Bend
/// runtime reads the same (runtime/threshold-pure.bend `thr_value`).
pub fn threshold_written(v: &str, context: u64) -> Option<u64> {
    fn digits(s: &str) -> Option<u64> {
        if s.is_empty() || !s.bytes().all(|b| b.is_ascii_digit()) {
            return None;
        }
        Some(s.parse::<u64>().unwrap_or(u64::MAX))
    }
    let v = v.trim();
    let n = match v.strip_suffix('%') {
        Some(p) => {
            let p = digits(p.trim())?.min(100);
            context / 100 * p + context % 100 * p / 100
        }
        None => digits(v)?,
    };
    (n > 0).then_some(n)
}

/// The compaction threshold of a model with this window: the value
/// written (BEND_THRESHOLD, else config `compaction_threshold`), never
/// above 85 % of the window; none or no threshold: the default
/// ([`default_threshold_of`]). A number written for a 1M model stays
/// safe on a 200k one.
pub fn compaction_threshold(written: Option<&str>, context: u64) -> u64 {
    let cap = threshold_of(context);
    written.and_then(|v| threshold_written(v, context)).map_or(default_threshold_of(context), |n| n.min(cap))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// window, written (None: none), threshold: the rows the Bend law
    /// threshold_rows holds too (bend/laws/providers.bend)
    fn rows() -> Vec<(u64, Option<String>, u64)> {
        include_str!("../testdata/compaction_threshold.tsv")
            .lines()
            .filter(|l| !l.starts_with('#') && !l.trim().is_empty())
            .map(|l| {
                let f: Vec<&str> = l.split('\t').collect();
                (f[0].parse().unwrap(), (f[1] != "-").then(|| f[1].to_string()), f[2].parse().unwrap())
            })
            .collect()
    }

    #[test]
    fn the_rows_hold() {
        let rows = rows();
        assert!(rows.len() >= 8);
        for (window, written, want) in rows {
            assert_eq!(compaction_threshold(written.as_deref(), window), want, "{window} {written:?}");
        }
    }

    #[test]
    fn the_bend_law_holds_the_same_rows() {
        let law = include_str!("../../../bend/laws/providers.bend");
        let at = law.find("law threshold_rows:").expect("the law threshold_rows");
        let body = &law[at..at + law[at..].find("\n\n").unwrap_or(law.len() - at)];
        let mut wants = Vec::new();
        for (window, written, want) in rows() {
            let cfg = match written {
                None => String::new(),
                Some(w) if w.ends_with('%') => format!("compaction_threshold = \\\"{w}\\\""),
                Some(w) => format!("compaction_threshold = {w}"),
            };
            let call = format!("Th.threshold(\"\", \"{cfg}\", {window})");
            assert!(body.contains(&call), "{call}\n{body}");
            wants.push(want.to_string());
        }
        assert!(body.contains(&format!("== ({})", wants.join(", "))), "{wants:?}\n{body}");
    }
}
