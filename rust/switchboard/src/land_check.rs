//! The land check (issue 28, part 2): nothing moves the trunk without the
//! repo's tracked check green on the exact tree it will point at. Its
//! command is `bise.toml`'s `[land] check` read from the target's tip
//! (`git show <base>:bise.toml`, [`crate::flow::land_check`]): every
//! checkout sees it, and a branch cannot switch off the check it is
//! checked by. It runs as `<check> <base> <head>` in a checkout at
//! `<head>` (this repo: `tests/gate.sh land`, the fast steps of the
//! paths the land touches), inside the target's land-queue turn, so land
//! N is checked on top of N-1. No `[land] check`: lands as before.
//!
//! [`checked`] alone decides which lands run it (pure, its table in the
//! tests): every land onto the trunk (a worktree's, moved or not; a
//! `--here` from main's checkout; a feature merge), and a worktree land
//! onto a feature when the feature moved under it. Where it runs: the
//! agent's worktree for a worktree land, the warm check tree
//! ([`crate::scratch::CheckTree`]) for a `--here` commit and a feature
//! merge's rebased tip, before any ref moves.
//!
//! A red check refuses the land with the step's name, its log and its
//! error lines ([`refusal`], pure, in words for each [`Via`]); nothing
//! moved. A check that runs past [`MAX`] (it holds the queue's turn) is
//! stopped, its process group with it, and refuses the land the same
//! way ([`ran_past`], land-wait).

use std::path::Path;
use std::time::{Duration, Instant};

/// How a land moves its target.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Via<'a> {
    /// `sb land` from a worktree: its branch rebased, then fast-forwarded.
    Worktree,
    /// `sb land --here`: a commit on the checkout's own branch.
    Here,
    /// `sb feature merge` (the user's go): feature `<name>` onto the trunk.
    Merge(&'a str),
}

/// Whether a land runs the land check: `onto_trunk`, its target is the
/// repo's default branch; `base_moved`, the target moved since the
/// branch left it (a rebase happened). The one place that decides it.
pub fn checked(via: Via, onto_trunk: bool, base_moved: bool) -> bool {
    match via {
        Via::Worktree => onto_trunk || base_moved,
        Via::Here => onto_trunk,
        Via::Merge(_) => true,
    }
}

/// The land check's command at main's tip `base`, if the repo has one.
pub fn command(dir: &Path, base: &str) -> Option<String> {
    let spec = format!("{}:{}", base, crate::flow::TRACKED);
    let text = crate::land::git(dir, &["show", &spec]).ok()?;
    crate::flow::land_check(&text)
}

/// The land check of commit `head` on `base` (the target's tip), in the
/// warm check tree under `root` ([`crate::scratch::CheckTree`], in the
/// trunk's `turn`); no `[land] check` at `base`: nothing runs, no tree
/// is made.
pub fn in_check_tree(shared: &Path, root: &Path, base: &str, head: &str, via: Via, turn: &crate::land::Turn) -> Result<(), String> {
    let Some(check) = command(shared, base) else {
        return Ok(());
    };
    let tree = crate::scratch::CheckTree::at(shared, root, head, turn)?;
    run(&tree.dir, &check, base, head, via)
}

/// Run `check <base> <head>` in `dir` (a checkout at `head`). Err: the
/// refusal, in [`refusal`]'s words for `via`.
pub fn run(dir: &Path, check: &str, base: &str, head: &str, via: Via) -> Result<(), String> {
    run_for(dir, check, base, head, via, MAX)
}

/// How long a land check may run (land-wait): it holds its target's land
/// queue turn, so a check that hangs would hold every land behind it.
/// Awake time ([`Instant`] stops while the Mac sleeps).
pub const MAX: Duration = Duration::from_secs(40 * 60);

/// [`run`], stopped at `max`: its process group gets TERM, then KILL 5 s
/// later, and the land is refused ([`ran_past`]); nothing moved.
pub fn run_for(dir: &Path, check: &str, base: &str, head: &str, via: Via, max: Duration) -> Result<(), String> {
    use std::os::unix::process::CommandExt;
    use std::process::Stdio;
    let mut child = std::process::Command::new("/bin/sh")
        .arg("-c")
        .arg(format!("{} \"$@\"", check))
        .arg("land-check")
        .arg(base)
        .arg(head)
        .current_dir(dir)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .process_group(0)
        .spawn()
        .map_err(|e| format!("the land check `{}` could not start: {}", check, e))?;
    let read = |r: Option<Box<dyn std::io::Read + Send>>| {
        std::thread::spawn(move || {
            let mut b = Vec::new();
            if let Some(mut r) = r {
                let _ = r.read_to_end(&mut b);
            }
            b
        })
    };
    let out = read(child.stdout.take().map(|s| Box::new(s) as Box<dyn std::io::Read + Send>));
    let err = read(child.stderr.take().map(|s| Box::new(s) as Box<dyn std::io::Read + Send>));
    let t0 = Instant::now();
    let status = loop {
        match child.try_wait() {
            Ok(Some(s)) => break Some(s),
            Ok(None) if t0.elapsed() < max => std::thread::sleep(Duration::from_millis(200)),
            _ => break None,
        }
    };
    let Some(status) = status else {
        stop_group(&mut child);
        return Err(ran_past(check, max, via));
    };
    if status.success() {
        return Ok(());
    }
    let (out, err) = (out.join().unwrap_or_default(), err.join().unwrap_or_default());
    let text = format!("{}{}", String::from_utf8_lossy(&out), String::from_utf8_lossy(&err));
    Err(refusal(check, &text, via))
}

/// TERM to the check's process group (gate.sh and its cargo, its
/// tests), KILL to what is left 5 s later, then reap the shell.
fn stop_group(child: &mut std::process::Child) {
    let pg = child.id() as i32;
    // SAFETY: signals to the group we made (process_group(0): its id is the child's pid)
    unsafe { libc::kill(-pg, libc::SIGTERM) };
    let t0 = Instant::now();
    while t0.elapsed() < Duration::from_secs(5) && matches!(child.try_wait(), Ok(None)) {
        std::thread::sleep(Duration::from_millis(100));
    }
    // SAFETY: as above
    unsafe { libc::kill(-pg, libc::SIGKILL) };
    let _ = child.wait();
}

/// The refusal of a check stopped at `max`, in [`words`] for `via`.
pub fn ran_past(check: &str, max: Duration, via: Via) -> String {
    let (_, then) = words(via);
    format!("the land check `{}` ran past {} min (its bound): stopped. {}", check, max.as_secs() / 60, then)
}

/// What is red, and what to do now, for each way of landing.
fn words(via: Via) -> (String, String) {
    match via {
        Via::Worktree => ("your branch".into(), "your branch is rebased on main: fix it, then sb land again".into()),
        Via::Here => ("your files".into(), "nothing landed, your files are as they were: fix them, then sb land --here again".into()),
        Via::Merge(n) => (n.to_string(), format!("main and {} did not move: fix it on {}, then merge again", n, n)),
    }
}

/// The refusal for a red land check's output: the step that failed (its
/// `GATE land FAILED: <step>` line), its log (the `log: <path>` line)
/// and the lines between its `FAIL <step>` and that line (its errors),
/// else the output's tail.
pub fn refusal(check: &str, output: &str, via: Via) -> String {
    let (what, then) = words(via);
    let lines: Vec<&str> = output.lines().collect();
    let failed = lines.iter().rposition(|l| l.starts_with("GATE land FAILED: "));
    let Some(end) = failed else {
        let tail = crate::util::clip_tail(output.trim(), 600);
        return format!("the land check `{}` is red on main + {}: {}. {}", check, what, tail, then);
    };
    let step = lines[end].trim_start_matches("GATE land FAILED: ").trim();
    let start = lines[..end]
        .iter()
        .rposition(|l| l.starts_with("FAIL "))
        .map(|i| i + 1)
        .unwrap_or(end);
    let log = lines[start..end].iter().rev().find_map(|l| l.strip_prefix("log: ")).map(|p| format!(" (log: {})", p.trim()));
    let errors: Vec<&str> =
        lines[start..end].iter().map(|l| l.trim_end()).filter(|l| !l.is_empty() && !l.starts_with("log: ")).collect();
    let errors = clip_head(&errors.join("\u{a}"), 600);
    let errors = if errors.is_empty() { ". ".to_string() } else { format!(":\u{a}{}\u{a}", errors) };
    format!("the land check is red at {} on main + {}{}{}{}", step, what, log.unwrap_or_default(), errors, then)
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

    /// Every way of landing, onto the trunk or another branch, its base
    /// moved or not: whether the land check runs (issue 28 part 2).
    #[test]
    fn which_lands_are_checked() {
        use Via::*;
        let table: [(Via, bool, bool, bool); 12] = [
            // via, onto the trunk, base moved, checked
            (Worktree, true, true, true),
            (Worktree, true, false, true),
            (Worktree, false, true, true),
            (Worktree, false, false, false),
            (Here, true, true, true),
            (Here, true, false, true),
            (Here, false, true, false),
            (Here, false, false, false),
            (Merge("cu"), true, true, true),
            (Merge("cu"), true, false, true),
            (Merge("cu"), false, true, true),
            (Merge("cu"), false, false, true),
        ];
        for (via, trunk, moved, want) in table {
            assert_eq!(checked(via, trunk, moved), want, "{:?} onto the trunk: {}, base moved: {}", via, trunk, moved);
        }
    }

    #[test]
    fn a_red_step_is_named_with_its_log_and_its_error_lines() {
        let r = refusal("tests/gate.sh land", TS, Via::Worktree);
        assert!(
            r.starts_with("the land check is red at desktop on main + your branch (log: /g/sb-gate-land-desktop.log):\u{a}src/inbox/InboxCard.tsx(315,17): error TS2323"),
            "{}",
            r
        );
        assert!(r.contains("error during build:\u{a}your branch is rebased on main: fix it, then sb land again"), "{}", r);
        assert!(!r.contains("line_gate"), "{}", r);
    }

    #[test]
    fn each_way_of_landing_says_what_did_not_move() {
        let p = "FAIL proto_ts (3s)\u{a}GATE land FAILED: proto_ts\u{a}";
        assert_eq!(
            refusal("x", p, Via::Here),
            "the land check is red at proto_ts on main + your files. nothing landed, your files are as they were: fix them, then sb land --here again"
        );
        assert_eq!(
            refusal("x", p, Via::Merge("cu")),
            "the land check is red at proto_ts on main + cu. main and cu did not move: fix it on cu, then merge again"
        );
    }

    #[test]
    fn a_rust_duplicate_and_a_stale_proto() {
        let rs = "FAIL clippy (21s)\u{a}error[E0428]: the name `pick` is defined multiple times\u{a}  --> switchboard/src/land_pick.rs:40:1\u{a}GATE land FAILED: clippy\u{a}";
        let r = refusal("x", rs, Via::Worktree);
        assert!(r.contains("red at clippy") && r.contains("E0428") && r.contains("land_pick.rs:40:1"), "{}", r);
        let p = "FAIL proto_ts (3s)\u{a}GATE land FAILED: proto_ts\u{a}";
        assert_eq!(
            refusal("x", p, Via::Worktree),
            "the land check is red at proto_ts on main + your branch. your branch is rebased on main: fix it, then sb land again"
        );
    }

    #[test]
    fn no_gate_words_the_tail_and_the_command() {
        let r = refusal("make check", "building\u{a}boom\u{a}", Via::Worktree);
        assert_eq!(r, "the land check `make check` is red on main + your branch: building\u{a}boom. your branch is rebased on main: fix it, then sb land again");
    }

    /// land-wait: a check past its bound is stopped, its children too,
    /// and refuses the land in the words of its way; a green one passes.
    #[test]
    fn a_check_past_its_bound_is_stopped_and_refuses() {
        let dir = std::env::temp_dir();
        let t0 = Instant::now();
        let r = run_for(&dir, "sleep 30 & sleep 30; true", "b", "h", Via::Worktree, Duration::from_millis(400));
        assert!(t0.elapsed() < Duration::from_secs(10), "{:?}", t0.elapsed());
        assert_eq!(
            r.unwrap_err(),
            "the land check `sleep 30 & sleep 30; true` ran past 0 min (its bound): stopped. your branch is rebased on main: fix it, then sb land again"
        );
        // the check gets `<base> <head>` as its args
        let args = "f() { test \"$1\" = b && test \"$2\" = h; }; f";
        assert!(run_for(&dir, args, "b", "h", Via::Here, Duration::from_secs(10)).is_ok());
        let red = run_for(&dir, "echo boom; false", "b", "h", Via::Worktree, Duration::from_secs(10)).unwrap_err();
        assert!(red.contains("boom"), "{}", red);
    }

    #[test]
    fn long_errors_keep_their_head() {
        let many = format!("FAIL desktop (1s)\u{a}{}GATE land FAILED: desktop\u{a}", "error: é\u{a}".repeat(200));
        let r = refusal("x", &many, Via::Worktree);
        assert!(r.contains("error: é\u{a}error: é") && r.contains("…\u{a}your branch is rebased"), "{}", r);
        assert!(r.len() < 760, "{}", r.len());
    }
}
