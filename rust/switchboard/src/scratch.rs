//! Checkouts the hub makes to build or check a commit that no agent has
//! checked out: the one owner of those worktrees.
//!
//! - [`Scratch`]: a throwaway worktree, detached at a rev, removed when
//!   dropped (a feature's sync rebase, `sb feature ready`'s check).
//! - [`CheckTree`]: the land check's warm tree (issue 28 part 2), one per
//!   project, `<worktrees>/.land-check/<workspace id>/<repo>` (two repos
//!   named alike never share one), reused: each check moves it to the
//!   commit (`checkout --detach`, `clean`: ~0.3 s here, where a new
//!   worktree takes ~2.7 s), so its ignored build outputs (the cargo
//!   target, node_modules) stay warm; after the move `git status` must
//!   be empty, else it is made again. Nothing `gate.sh land` reads is
//!   both ignored and generated (the words JSON and the desktop's proto
//!   TS are tracked; node_modules is reinstalled when the lockfile
//!   changes). The `owner` file beside it is gate.sh's "task folder"
//!   mark: its target is `.land-check/<id>/target`, a clone of the warm
//!   seed. A dot folder: the task sweep skips it; it goes with the
//!   project's worktrees folder (`Paths::worktrees`). Used only inside
//!   the trunk's land-queue turn ([`CheckTree::at`] takes it: a `--here`
//!   onto the trunk, a feature merge, a worktree land whose tree is not
//!   clean), so one check at a time uses it.

use crate::land::{git, short};
use std::path::{Path, PathBuf};

/// A scratch worktree, detached at `rev`, removed when dropped.
pub struct Scratch {
    shared: PathBuf,
    pub dir: PathBuf,
}

impl Scratch {
    pub fn new(shared: &Path, root: &Path, tag: &str, rev: &str) -> Result<Scratch, String> {
        let dir = root.join(format!(".{}-{}", tag, crate::util::now_ms()));
        std::fs::create_dir_all(root).map_err(|e| e.to_string())?;
        git(shared, &["worktree", "add", "-q", "--detach", &dir.to_string_lossy(), rev])?;
        Ok(Scratch { shared: shared.to_path_buf(), dir })
    }
}

impl Drop for Scratch {
    fn drop(&mut self) {
        let _ = git(&self.shared, &["worktree", "remove", "--force", &self.dir.to_string_lossy()]);
        let _ = std::fs::remove_dir_all(&self.dir);
        let _ = git(&self.shared, &["worktree", "prune"]);
    }
}

/// The land check's warm worktree of the repo at `shared`.
pub struct CheckTree {
    pub dir: PathBuf,
}

/// Its folder under `root` (the project's worktrees):
/// `.land-check/<workspace id>/<repo>`.
pub fn check_tree_dir(root: &Path, shared: &Path) -> PathBuf {
    root.join(".land-check").join(crate::paths::workspace_id(shared)).join(crate::sweep::repo_name(shared))
}

impl CheckTree {
    /// The check tree, detached at `rev` with nothing else in it than
    /// `rev`'s files and the ignored ones: moved there when it exists,
    /// made (again) when it does not, git cannot move it, or it is not
    /// clean after. `turn`: the trunk's land-queue turn, held by the
    /// caller (refused otherwise: two checks would share the tree).
    pub fn at(shared: &Path, root: &Path, rev: &str, turn: &crate::land::Turn) -> Result<CheckTree, String> {
        let trunk = crate::trunk::trunk_ref(shared)?;
        if turn.target() != trunk {
            return Err(format!("the land check tree is used in {}'s land turn only, not {}'s", short(&trunk), short(turn.target())));
        }
        let dir = check_tree_dir(root, shared);
        if dir.join(".git").exists() && moved(&dir, rev).is_ok() {
            return Ok(CheckTree { dir });
        }
        let _ = std::fs::remove_dir_all(&dir);
        let _ = git(shared, &["worktree", "prune"]);
        let parent = dir.parent().unwrap_or(root);
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        std::fs::write(parent.join(crate::sweep::OWNER), "land-check\u{a}").map_err(|e| e.to_string())?;
        git(shared, &["worktree", "add", "-q", "--detach", &dir.to_string_lossy(), rev])?;
        Ok(CheckTree { dir })
    }
}

/// `dir` moved to `rev`: its tracked files `rev`'s, the files git does
/// not know removed (a red step's leftovers), the ignored ones kept; Err
/// when anything is left that `git status` shows (a broken tree).
fn moved(dir: &Path, rev: &str) -> Result<(), String> {
    git(dir, &["checkout", "-q", "-f", "--detach", rev])?;
    git(dir, &["clean", "-q", "-f", "-d"])?;
    let left = git(dir, &["status", "--porcelain", "--untracked-files=all"])?;
    if !left.is_empty() {
        return Err(format!("the check tree is not clean after the checkout: {}", crate::util::clip(&left, 200)));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sh(dir: &Path, script: &str) {
        let ok = std::process::Command::new("/bin/sh").arg("-c").arg(script).current_dir(dir).status().unwrap().success();
        assert!(ok, "{}", script);
    }

    fn read(p: PathBuf) -> String {
        std::fs::read_to_string(p).unwrap()
    }

    #[test]
    fn the_check_tree_is_reused_and_keeps_only_ignored_files() {
        let root = std::env::temp_dir().join(format!("sb-scratch-{}-{}", std::process::id(), crate::util::now_ms()));
        let ws = root.join("repo");
        std::fs::create_dir_all(&ws).unwrap();
        sh(&ws, "git init -q -b main && git config user.email t@t && git config user.name t && git config commit.gpgsign false");
        sh(&ws, "echo target > .gitignore && echo a > a && git add . && git commit -qm one && echo a2 > a && git commit -qam two");
        let ws = ws.canonicalize().unwrap();
        let wts = root.join("worktrees");
        let one = git(&ws, &["rev-parse", "main~1"]).unwrap();
        // only in the trunk's land turn
        let q = crate::land::Queue::default();
        let other = q.wait_turn("refs/heads/sb/x", "wt:x", &mut || {});
        let e = CheckTree::at(&ws, &wts, &one, &other).err().unwrap();
        assert_eq!(e, "the land check tree is used in main's land turn only, not sb/x's");
        drop(other);
        let turn = q.wait_turn("refs/heads/main", "wt:x", &mut || {});
        let t = CheckTree::at(&ws, &wts, &one, &turn).unwrap();
        // keyed by the workspace id: two repos named alike never share one
        let id = crate::paths::workspace_id(&ws);
        assert_eq!(t.dir, wts.join(".land-check").join(&id).join("repo"));
        assert_eq!(read(wts.join(".land-check").join(&id).join("owner")).trim(), "land-check", "gate.sh's task folder mark");
        assert_eq!(read(t.dir.join("a")).trim(), "a");
        // a build output (ignored) stays, a red step's leftover goes
        sh(&t.dir, "mkdir target && echo warm > target/x && echo junk > left && echo dirty > a");
        let t = CheckTree::at(&ws, &wts, "main", &turn).unwrap();
        assert_eq!(read(t.dir.join("a")).trim(), "a2");
        assert!(t.dir.join("target/x").exists() && !t.dir.join("left").exists());
        assert_eq!(git(&t.dir, &["rev-parse", "HEAD"]).unwrap(), git(&ws, &["rev-parse", "main"]).unwrap());
        // gone (removed by hand): made again
        std::fs::remove_dir_all(&t.dir).unwrap();
        let t = CheckTree::at(&ws, &wts, &one, &turn).unwrap();
        assert_eq!(read(t.dir.join("a")).trim(), "a");
        let _ = std::fs::remove_dir_all(&root);
    }
}
