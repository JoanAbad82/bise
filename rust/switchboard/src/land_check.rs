//! The land check (issue 28): before a worktree land whose base moved
//! moves main, the repo's tracked check runs on the rebased tree, inside
//! the land queue's turn (land N is checked on top of N-1). Its command
//! is `bise.toml`'s `[land] check` read from main's tip (`git show
//! <base>:bise.toml`, [`crate::flow::land_check`]): every checkout sees
//! it, and a branch cannot switch off the check it is checked by. It runs
//! as `<check> <base> <head>` in the worktree (this repo: `tests/gate.sh
//! land`, the fast steps of the paths the land touches).
//!
//! A red check refuses the land with the step's name and its error lines
//! ([`refusal`], pure); the branch stays rebased, so the agent fixes it
//! and lands again. Not checked: a fast-forward (no merge happened: the
//! agent's own gate ran on that tree) and `--here` (the land line says
//! so, [`crate::flow::land_line`]).

use std::path::Path;

/// The land check's command at main's tip `base`, if the repo has one.
pub fn command(dir: &Path, base: &str) -> Option<String> {
    let spec = format!("{}:{}", base, crate::flow::TRACKED);
    let text = crate::land::git(dir, &["show", &spec]).ok()?;
    crate::flow::land_check(&text)
}

/// Run `check <base> <head>` in `dir` (the rebased worktree). Err: the
/// refusal, in [`refusal`]'s words.
pub fn run(dir: &Path, check: &str, base: &str, head: &str) -> Result<(), String> {
    let out = std::process::Command::new("/bin/sh")
        .arg("-c")
        .arg(format!("{} \"$@\"", check))
        .arg("land-check")
        .arg(base)
        .arg(head)
        .current_dir(dir)
        .stdin(std::process::Stdio::null())
        .output()
        .map_err(|e| format!("the land check `{}` could not start: {}", check, e))?;
    if out.status.success() {
        return Ok(());
    }
    let text = format!("{}{}", String::from_utf8_lossy(&out.stdout), String::from_utf8_lossy(&out.stderr));
    Err(refusal(check, &text))
}

/// The refusal for a red land check's output: the step that failed (its
/// `GATE land FAILED: <step>` line) and the lines between its `FAIL
/// <step>` and that line (its errors), else the output's tail.
pub fn refusal(check: &str, output: &str) -> String {
    let lines: Vec<&str> = output.lines().collect();
    let failed = lines.iter().rposition(|l| l.starts_with("GATE land FAILED: "));
    let Some(end) = failed else {
        let tail = crate::util::clip_tail(output.trim(), 600);
        return format!(
            "the land check `{}` is red on main + your branch: {}. your branch is rebased on main: fix it, then sb land again",
            check, tail
        );
    };
    let step = lines[end].trim_start_matches("GATE land FAILED: ").trim();
    let start = lines[..end]
        .iter()
        .rposition(|l| l.starts_with("FAIL "))
        .map(|i| i + 1)
        .unwrap_or(end);
    let errors: Vec<&str> =
        lines[start..end].iter().map(|l| l.trim_end()).filter(|l| !l.is_empty() && !l.starts_with("log: ")).collect();
    let errors = clip_head(&errors.join("\u{a}"), 600);
    let errors = if errors.is_empty() { String::new() } else { format!(":\u{a}{}\u{a}", errors) };
    format!(
        "the land check is red at {} on main + your branch{}your branch is rebased on main: fix it, then sb land again",
        step,
        if errors.is_empty() { ". ".to_string() } else { errors }
    )
}

/// The first `max` bytes of `s` on a char boundary, `…` when cut: the
/// first errors are the ones that say what broke.
fn clip_head(s: &str, max: usize) -> String {
    if s.len() <= max {
        return s.to_string();
    }
    let mut i = max;
    while !s.is_char_boundary(i) {
        i -= 1;
    }
    format!("{}…", &s[..i])
}

#[cfg(test)]
mod tests {
    use super::*;

    const TS: &str = "ok   line_gate (0s)\u{a}FAIL desktop (14s)\u{a}src/inbox/InboxCard.tsx(315,17): error TS2323: Cannot redeclare exported variable 'typeWords'.\u{a}error during build:\u{a}log: /g/sb-gate-land-desktop.log\u{a}GATE land FAILED: desktop\u{a}";

    #[test]
    fn a_red_step_is_named_with_its_error_lines() {
        let r = refusal("tests/gate.sh land", TS);
        assert!(r.starts_with("the land check is red at desktop on main + your branch:\u{a}src/inbox/InboxCard.tsx(315,17): error TS2323"), "{}", r);
        assert!(r.contains("error during build:\u{a}your branch is rebased on main: fix it, then sb land again"), "{}", r);
        assert!(!r.contains("log: ") && !r.contains("line_gate"), "{}", r);
    }

    #[test]
    fn a_rust_duplicate_and_a_stale_proto() {
        let rs = "FAIL clippy (21s)\u{a}error[E0428]: the name `pick` is defined multiple times\u{a}  --> switchboard/src/land_pick.rs:40:1\u{a}GATE land FAILED: clippy\u{a}";
        let r = refusal("x", rs);
        assert!(r.contains("red at clippy") && r.contains("E0428") && r.contains("land_pick.rs:40:1"), "{}", r);
        let p = "FAIL proto_ts (3s)\u{a}GATE land FAILED: proto_ts\u{a}";
        assert_eq!(refusal("x", p), "the land check is red at proto_ts on main + your branch. your branch is rebased on main: fix it, then sb land again");
    }

    #[test]
    fn no_gate_words_the_tail_and_the_command() {
        let r = refusal("make check", "building\u{a}boom\u{a}");
        assert_eq!(r, "the land check `make check` is red on main + your branch: building\u{a}boom. your branch is rebased on main: fix it, then sb land again");
    }

    #[test]
    fn long_errors_keep_their_head() {
        let many = format!("FAIL desktop (1s)\u{a}{}GATE land FAILED: desktop\u{a}", "error: é\u{a}".repeat(200));
        let r = refusal("x", &many);
        assert!(r.contains("error: é\u{a}error: é") && r.contains("…\u{a}your branch is rebased"), "{}", r);
        assert!(r.len() < 760, "{}", r.len());
    }
}
