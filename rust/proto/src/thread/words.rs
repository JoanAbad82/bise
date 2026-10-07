//! The words a thread's rows show, made once (architect m_10476): the
//! hub's fold and the TUI both call these, so the window never rebuilds
//! a row's text. Pure std; a word that needs something outside this
//! crate (a provider's long name) takes it from the caller.

use super::{ToolItem, ToolKind};

/// The first non-empty line, clipped to `max` characters (with `…`).
pub fn one_line(s: &str, max: usize) -> String {
    let l = s.lines().map(str::trim).find(|l| !l.is_empty()).unwrap_or("");
    if l.chars().count() <= max {
        return l.to_string();
    }
    let mut out: String = l.chars().take(max.saturating_sub(1)).collect();
    out.push('…');
    out
}

/// The tools entry's counted words: "read 6 files, ran 4 commands".
pub fn summary(items: &[ToolItem]) -> String {
    let n = |k: ToolKind| items.iter().filter(|i| i.kind == k).count();
    let s = |n: usize, one: &str, many: &str| if n == 1 { one.to_string() } else { format!("{n} {many}") };
    let mut parts = Vec::new();
    let (r, e, x, q, o) = (n(ToolKind::Read), n(ToolKind::Edit), n(ToolKind::Run), n(ToolKind::Search), n(ToolKind::Other));
    if r > 0 {
        parts.push(format!("read {}", s(r, "1 file", "files")));
    }
    if e > 0 {
        parts.push(format!("edited {}", s(e, "1 file", "files")));
    }
    if x > 0 {
        parts.push(format!("ran {}", s(x, "1 command", "commands")));
    }
    if q > 0 {
        parts.push(format!("searched {}", s(q, "once", "times")));
    }
    if o > 0 {
        parts.push(s(o, "1 other step", "other steps"));
    }
    parts.join(", ")
}

/// A model call that failed and waits to retry (`provider_retry: 2/10 ·
/// provider 529 (transient) · retry in 4s`), as the user reads it while
/// the call waits.
pub fn provider_retry(t: &str) -> String {
    let parts: Vec<&str> = t.split(" · ").collect();
    match parts.as_slice() {
        // "2/10" failed: the plan is attempt 3/10 after the pause
        [n, why, wait] => {
            let next = n
                .split_once('/')
                .and_then(|(a, b)| Some((a.parse::<u32>().ok()? + 1, b)))
                .map(|(a, b)| format!("retry {}/{}", a, b))
                .unwrap_or_else(|| "retry".into());
            format!("model call failed (attempt {}): {} · {} in {}", n, why, next, wait.trim_start_matches("retry in "))
        }
        _ => format!("model call failed: {}", t),
    }
}

/// The openings of the runtime's ChatGPT plan lines (bend/runtime, the
/// designer's final words): matched on these, not the whole line.
pub const PLAN_LINES: [&str; 4] = [
    "your ChatGPT plan's limit for bise is reached.",
    "ChatGPT plan use is off for bise.",
    "ChatGPT couldn't check your plan's usage.",
    "your ChatGPT sign-in expired.",
];

/// A turn ended on one of the ChatGPT plan's lines.
pub fn is_plan_line(t: &str) -> bool {
    PLAN_LINES.iter().any(|p| t.starts_with(p))
}

/// The plan line that says the sign-in expired.
pub fn is_expired_line(t: &str) -> bool {
    t.starts_with(PLAN_LINES[3])
}

/// The runtime's words for a model whose provider has no key (BISE-294,
/// runtime/provider.bend model_call.key: `no openrouter key yet
/// (OPENROUTER_API_KEY is not set): /provider sets it up`), and the older
/// runtime's bare `OPENROUTER_API_KEY is not set`, as the designer's line:
/// `turn stopped: no OpenRouter key yet. /provider sets it up.` `name`:
/// a provider's long name from its id or its key's variable (the
/// catalog's, which this crate doesn't depend on).
pub fn no_key(why: &str, name: &dyn Fn(&str, &str) -> String) -> Option<String> {
    let why = why.trim();
    let name = if let Some(rest) = why.strip_prefix("no ") {
        let (id, _) = rest.split_once(" key yet (")?;
        why.contains(" is not set)").then(|| name(id, ""))?
    } else {
        let var = why.strip_suffix(" is not set")?;
        (var.ends_with("_KEY") && !var.contains(' ')).then(|| name("", var))?
    };
    Some(format!("turn stopped: no {} key yet. /provider sets it up.", name))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_retry_says_the_next_attempt() {
        assert_eq!(provider_retry("2/10 · provider 529 (transient) · retry in 4s"), "model call failed (attempt 2/10): provider 529 (transient) · retry 3/10 in 4s");
        assert_eq!(provider_retry("odd"), "model call failed: odd");
    }

    #[test]
    fn a_missing_key_names_its_provider() {
        let name = |id: &str, var: &str| if id.is_empty() { format!("<{var}>") } else { id.to_uppercase() };
        assert_eq!(no_key("no openrouter key yet (OPENROUTER_API_KEY is not set): /provider sets it up", &name).as_deref(), Some("turn stopped: no OPENROUTER key yet. /provider sets it up."));
        assert_eq!(no_key("MISTRAL_API_KEY is not set", &name).as_deref(), Some("turn stopped: no <MISTRAL_API_KEY> key yet. /provider sets it up."));
        assert_eq!(no_key("the network is down", &name), None);
        assert!(is_plan_line("your ChatGPT sign-in expired. run /provider") && is_expired_line("your ChatGPT sign-in expired."));
    }

    #[test]
    fn one_line_and_the_summary() {
        assert_eq!(summary(&[]), "");
        assert_eq!(one_line("  \nabcdef", 4), "abc…");
    }
}
