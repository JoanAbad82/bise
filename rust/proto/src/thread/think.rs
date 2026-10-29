//! The runtime's signed thinking, read off a `<think>` span. The runtime
//! (bend/core/wire.bend `think_marked` / `think_sig`) appends the
//! provider's signature as the span's LAST line, `BENDSIG::<sig>`, so a
//! replayed thinking is exactly what the provider signed. The transcript
//! keeps it for that replay; no client ever shows it: the fold and the
//! TUI both read spans through [`unsigned`] (`lines::split_thinking`).

/// The prefix of a span's signature line, the runtime's format
/// (bend/core/wire.bend `think_sig`): change both or neither.
pub const SIG_MARK: &str = "BENDSIG::";

/// A `<think>` span as a feed line holds it (newlines escaped `\n`)
/// without its signature line: only its LAST line, and only when that
/// line starts with [`SIG_MARK`]. A thinking that mentions the mark
/// elsewhere stays whole. Pure.
pub fn unsigned(span: &str) -> &str {
    let (head, last) = match span.rfind("\\n") {
        Some(n) => (&span[..n], &span[n + 2..]),
        None => ("", span),
    };
    if last.starts_with(SIG_MARK) {
        head
    } else {
        span
    }
}

#[cfg(test)]
#[path = "think_tests.rs"]
mod tests;
