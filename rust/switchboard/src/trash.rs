//! A dropped worktree's folder, deleted off the hub's loop (drop-offloop).
//! A drop's `git worktree remove` and the rm of its task folder (a
//! `rust/target`, gate.sh's `<task>/target`: GBs) held the loop up to
//! 110 s. Now `GitEnv::remove` (worktree.rs) renames the folder aside on
//! the loop ([`aside_of`]: a dot name in the same parent, so a rename),
//! git forgets the worktree there (`worktree prune`, `branch -D`), and the
//! rm of the aside folder goes to a [`Trash`]: one worker thread, its end
//! in the hub log. A hub stopped mid-rm leaves an aside folder; the boot's
//! sweep (sweep.rs) finishes it ([`is_aside`]).
//!
//! Owns: the aside name and the worker. Not here: what may be removed
//! (worktree.rs saved the work before, sweep.rs checks the rest).

use std::path::{Path, PathBuf};
use std::sync::mpsc::channel;

const MARK: &str = ".dropped-";

/// Where `p` goes aside at `now`: `<parent>/.<name>.dropped-<now>`.
pub fn aside_of(p: &Path, now: u64) -> Option<PathBuf> {
    let name = p.file_name()?.to_string_lossy();
    Some(p.parent()?.join(format!(".{}{}{}", name, MARK, now)))
}

/// A folder [`aside_of`] named: trash, whatever it holds.
pub fn is_aside(name: &str) -> bool {
    name.starts_with('.')
        && name
            .rsplit_once(MARK)
            .is_some_and(|(n, ms)| n.len() > 1 && !ms.is_empty() && ms.bytes().all(|b| b.is_ascii_digit()))
}

/// The rm of aside folders.
pub struct Trash {
    put: Box<dyn FnMut(PathBuf) + Send>,
}

impl Trash {
    /// One worker thread, the folders in order; each end goes to `log`.
    pub fn worker(log: Box<dyn Fn(&str) + Send>) -> Trash {
        let (tx, rx) = channel::<PathBuf>();
        std::thread::spawn(move || {
            for p in rx {
                let t0 = crate::util::now_ms();
                let r = std::fs::remove_dir_all(&p);
                let ms = crate::util::now_ms().saturating_sub(t0);
                match r {
                    Ok(()) => log(&format!("worktree folder {} removed off the loop in {} ms", p.display(), ms)),
                    Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
                    Err(e) => log(&format!("worktree folder {} not removed: {}", p.display(), e)),
                }
            }
        });
        Trash::with(move |p| {
            let _ = tx.send(p);
        })
    }

    /// The rm at once (a caller already off the loop: place_work.rs).
    pub fn now() -> Trash {
        Trash::with(|p| {
            let _ = std::fs::remove_dir_all(p);
        })
    }

    /// Any rm (tests: a slow one).
    pub fn with(f: impl FnMut(PathBuf) + Send + 'static) -> Trash {
        Trash { put: Box::new(f) }
    }

    pub fn put(&mut self, p: PathBuf) {
        (self.put)(p)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_aside_name_is_a_dot_name_beside_it() {
        let a = aside_of(Path::new("/w/fix"), 42).unwrap();
        assert_eq!(a, PathBuf::from("/w/.fix.dropped-42"));
        assert!(is_aside(".fix.dropped-42"));
        assert!(is_aside(".a.dropped-x.dropped-7"));
        for n in ["fix", ".fix", "fix.dropped-42", ".fix.dropped-", ".fix.dropped-4a", "..dropped-1", ".git"] {
            assert!(!is_aside(n), "{n}");
        }
        assert_eq!(aside_of(Path::new("/"), 1), None);
    }

    #[test]
    fn the_worker_removes_and_says_so() {
        let d = std::env::temp_dir().join(format!("sb-trash-{}", std::process::id()));
        std::fs::create_dir_all(d.join("a/b")).unwrap();
        std::fs::write(d.join("a/b/f"), "x").unwrap();
        let (tx, rx) = channel();
        let mut t = Trash::worker(Box::new(move |s| {
            let _ = tx.send(s.to_string());
        }));
        t.put(d.clone());
        let line = rx.recv_timeout(std::time::Duration::from_secs(10)).unwrap();
        assert!(line.contains("removed off the loop in"), "{line}");
        assert!(!d.exists());
    }
}
