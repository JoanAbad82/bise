//! An agent's context usage as its feed says it (architect m_10999, the
//! one rule), moved out of lines.rs unchanged.

use super::{read, Obs, Rec};

/// What one feed item says about an agent's context: a usage after a
/// call, a compaction's end, or nothing.
#[derive(Clone, Debug, PartialEq)]
pub enum UsageMark<T> {
    Usage(T),
    Compacted,
    Other,
}

/// The usage of an agent's current context (architect m_10999, the one
/// rule): the last usage, unless a compaction ended after it. The TUI
/// calls it over its feed events, the hub over a transcript tail.
pub fn current_usage<T>(marks: impl DoubleEndedIterator<Item = UsageMark<T>>) -> Option<T> {
    for m in marks.rev() {
        match m {
            UsageMark::Usage(u) => return Some(u),
            UsageMark::Compacted => return None,
            UsageMark::Other => {}
        }
    }
    None
}

/// A transcript line as a [`UsageMark`]: its usage text (after `obs:
/// usage: `, for bise_session's parser).
pub fn usage_mark(line: &str) -> UsageMark<String> {
    match read(line) {
        Rec::Obs(Obs::Usage(t)) => UsageMark::Usage(t),
        Rec::Obs(Obs::CompactionDone(_)) => UsageMark::Compacted,
        _ => UsageMark::Other,
    }
}
