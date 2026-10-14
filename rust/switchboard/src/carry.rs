//! Changes carried from the shared folder into a new worktree, the one way
//! (shared-guard, architect m_25463): `/new -w --with-changes` (his whole
//! tree's tracked edits, his copies stay) and `sb move <agent> new
//! --with-changes` (only that agent's claimed files, tracked or new, and
//! the shared folder's copies go back to HEAD once they are in the
//! worktree). `worktree::GitEnv::worktree_create` calls [`carry`] right
//! after `git worktree add`; an error there removes the new worktree and
//! leaves the shared folder untouched.
//!
//! How: `git diff --binary HEAD` (the files' pathspec when given) saved
//! as a patch under the hub's state (`carry/<name>-<ms>.patch`: nothing
//! is lost if a later step fails), applied in the worktree with `git
//! apply --3way` (the worktree starts from main's tip, maybe not the
//! shared HEAD); a moved agent's untracked files are copied. Only then,
//! for a move, the shared copies are reverted (tracked: restored from
//! HEAD; new: removed). Other files of the shared folder (his edits,
//! another agent's) are never touched.

use crate::worktree::git;
use std::path::{Path, PathBuf};

/// What a new worktree takes from the shared folder.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub enum Carry {
    /// nothing: a clean worktree from main's tip
    #[default]
    Nothing,
    /// `/new -w --with-changes`: every tracked edit; the shared folder
    /// keeps its copies
    All,
    /// `sb move <agent> new --with-changes`: these files (relative to
    /// the shared folder), moved: the shared copies go back to HEAD
    Moved(Vec<String>),
}

/// Carry `what` from `shared` into the new worktree `wt`; the patch is
/// saved at `save`. Answers the files that moved (none for `All`).
pub fn carry(shared: &Path, wt: &Path, what: &Carry, save: &Path) -> Result<Vec<String>, String> {
    let files: Vec<&str> = match what {
        Carry::Nothing => return Ok(Vec::new()),
        Carry::All => Vec::new(),
        Carry::Moved(fs) if fs.is_empty() => return Ok(Vec::new()),
        Carry::Moved(fs) => fs.iter().map(String::as_str).collect(),
    };
    let moved = matches!(what, Carry::Moved(_));
    let with = |head: &[&str]| -> Vec<String> {
        let mut v: Vec<String> = head.iter().map(|s| s.to_string()).collect();
        v.push("--".into());
        v.extend(files.iter().map(|f| f.to_string()));
        v
    };
    let run = |dir: &Path, args: Vec<String>| -> Result<String, String> {
        let a: Vec<&str> = args.iter().map(String::as_str).collect();
        git(dir, &a)
    };
    // tracked changes (staged or not, new staged files included)
    let patch = run(shared, with(&["diff", "--binary", "HEAD"]))?;
    let tracked = lines(&run(shared, with(&["diff", "--name-only", "-z", "HEAD"]))?);
    let untracked = if moved { lines(&run(shared, with(&["ls-files", "-z", "--others", "--exclude-standard"]))?) } else { Vec::new() };
    if let Some(d) = save.parent() {
        std::fs::create_dir_all(d).map_err(|e| e.to_string())?;
    }
    // the trailing newline git's diff ends with (trimmed by `git`)
    std::fs::write(save, if patch.is_empty() { String::new() } else { format!("{}\n", patch) }).map_err(|e| format!("saving the patch: {}", e))?;
    if !patch.is_empty() {
        let p = save.to_string_lossy().to_string();
        git(wt, &["apply", "--3way", "--binary", &p]).map_err(|e| format!("your changes do not apply on main's tip ({}); the patch is saved at {}", e.trim(), p))?;
        // --3way stages what it applied: the worktree reads as edits
        let _ = git(wt, &["reset", "-q"]);
    }
    for f in &untracked {
        let (src, dst) = (shared.join(f), wt.join(f));
        if let Some(d) = dst.parent() {
            std::fs::create_dir_all(d).map_err(|e| e.to_string())?;
        }
        std::fs::copy(&src, &dst).map_err(|e| format!("copying {}: {}", f, e))?;
    }
    if !moved {
        return Ok(Vec::new());
    }
    // in the worktree now: the shared copies go back
    let in_head = lines(&run(shared, with(&["ls-tree", "-r", "-z", "--name-only", "HEAD"]))?);
    for f in &tracked {
        if in_head.contains(f) {
            git(shared, &["restore", "--source=HEAD", "--staged", "--worktree", "--", f])?;
        } else {
            let _ = git(shared, &["rm", "-q", "--cached", "-f", "--", f]);
            let _ = std::fs::remove_file(shared.join(f));
        }
    }
    for f in &untracked {
        let _ = std::fs::remove_file(shared.join(f));
    }
    let mut all = tracked;
    all.extend(untracked);
    Ok(all)
}

/// Where a carry's patch is saved: `<state>/carry/<name>-<ms>.patch`.
pub fn patch_path(state: &Path, name: &str, now: u64) -> PathBuf {
    state.join("carry").join(format!("{}-{}.patch", name, now))
}

fn lines(z: &str) -> Vec<String> {
    z.split('\0').filter(|s| !s.is_empty()).map(str::to_string).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sh(dir: &Path, script: &str) {
        let ok = std::process::Command::new("sh").arg("-c").arg(script).current_dir(dir).status().unwrap().success();
        assert!(ok, "{}", script);
    }

    /// A repo with `f` and `g` committed, and a worktree of its HEAD.
    fn setup(tag: &str) -> (PathBuf, PathBuf, PathBuf) {
        let root = std::env::temp_dir().join(format!("sb-carry-{}-{}-{}", tag, std::process::id(), crate::util::now_ms()));
        let shared = root.join("repo");
        std::fs::create_dir_all(&shared).unwrap();
        sh(&shared, "git init -q && git config user.email t@t && git config user.name t && git config commit.gpgsign false && echo a > f && echo g > g && git add f g && git commit -qm init");
        let wt = root.join("wt");
        sh(&shared, &format!("git worktree add -q -b sb/t {} HEAD", wt.display()));
        (root, shared, wt)
    }

    fn read(p: &Path) -> String {
        std::fs::read_to_string(p).unwrap_or_default()
    }

    #[test]
    fn a_move_takes_only_its_files_and_cleans_them_in_the_shared_folder() {
        let (root, shared, wt) = setup("move");
        // the agent's: an edit, a new file in a new folder, a staged new file;
        // his own edit to g stays where it is
        sh(&shared, "echo mine >> f && mkdir -p src && echo n > src/new.rs && echo s > staged.rs && git add staged.rs && echo his >> g");
        let what = Carry::Moved(vec!["f".into(), "src/new.rs".into(), "staged.rs".into()]);
        let save = patch_path(&root.join("state"), "t", 1);
        let mut moved = carry(&shared, &wt, &what, &save).unwrap();
        moved.sort();
        assert_eq!(moved, vec!["f", "src/new.rs", "staged.rs"]);
        assert_eq!(read(&wt.join("f")), "a\nmine\n");
        assert_eq!(read(&wt.join("src/new.rs")), "n\n");
        assert_eq!(read(&wt.join("staged.rs")), "s\n");
        assert_eq!(read(&wt.join("g")), "g\n", "his edit is not the agent's");
        // the shared folder: only his edit is left
        assert_eq!(git(&shared, &["status", "--porcelain"]).unwrap(), " M g");
        assert_eq!(read(&shared.join("g")), "g\nhis\n");
        assert!(read(&save).contains("mine"), "the patch is kept");
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn a_patch_that_does_not_apply_leaves_the_shared_folder_alone() {
        let (root, shared, wt) = setup("conflict");
        // the worktree's base already changed f's line another way
        sh(&wt, "echo other > f && git commit -qam other");
        sh(&shared, "echo mine > f");
        let what = Carry::Moved(vec!["f".into()]);
        let save = patch_path(&root.join("state"), "t", 2);
        let e = carry(&shared, &wt, &what, &save).unwrap_err();
        assert!(e.contains("do not apply"), "{}", e);
        assert_eq!(read(&shared.join("f")), "mine\n", "untouched");
        assert!(save.exists());
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn with_changes_copies_every_tracked_edit_and_keeps_his() {
        let (root, shared, wt) = setup("all");
        sh(&shared, "echo mine >> f && echo his >> g && echo u > untracked.txt");
        let save = patch_path(&root.join("state"), "u", 3);
        assert!(carry(&shared, &wt, &Carry::All, &save).unwrap().is_empty());
        assert_eq!(read(&wt.join("f")), "a\nmine\n");
        assert_eq!(read(&wt.join("g")), "g\nhis\n");
        assert!(!wt.join("untracked.txt").exists(), "as before: tracked edits only");
        assert_eq!(read(&shared.join("f")), "a\nmine\n", "his copies stay");
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn nothing_to_carry_writes_nothing() {
        let (root, shared, wt) = setup("none");
        let save = patch_path(&root.join("state"), "v", 4);
        assert!(carry(&shared, &wt, &Carry::Nothing, &save).unwrap().is_empty());
        assert!(carry(&shared, &wt, &Carry::Moved(vec![]), &save).unwrap().is_empty());
        assert!(!save.exists());
        let _ = std::fs::remove_dir_all(root);
    }
}
