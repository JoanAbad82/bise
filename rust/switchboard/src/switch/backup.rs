//! The hub state's backup before a switch or a restart:
//! `/tmp/sb-backup-<state dir name>-<ms>`, the `KEEP_BACKUPS` newest kept.
//!
//! On APFS each file is an APFS clone (clonefile(2)): the backup costs
//! ~0 bytes until the live state diverges (mac-budget, architect m_36196:
//! 5 rsync copies of 2.2 GB held 10.9 GB of /tmp for good). Off APFS, or
//! when the clone fails as unsupported (EXDEV, ENOTSUP), the copy is
//! today's rsync; the caller logs which one ran. Both copy the same
//! things: the state, not the agents' scratch (agents/*/tmp), not the
//! live REPLs' side channels (agents/*/run/*, but `approvals-mode`), not
//! the hub socket, never a socket or a FIFO; a file gone mid-copy is not a
//! failed backup. The rollback and restore read the backup as before.

use std::path::{Path, PathBuf};

/// The backups of one state dir kept in /tmp: the probation only rolls
/// back to the latest.
pub(super) const KEEP_BACKUPS: usize = 3;

/// How a backup was made, for hub.log.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum How {
    Clone,
    Rsync,
}

impl How {
    pub(super) fn word(self) -> &'static str {
        match self {
            How::Clone => "APFS clone",
            How::Rsync => "rsync copy",
        }
    }
}

/// Back `state` up into `/tmp`.
pub(super) fn backup(state: &Path, ms: u64) -> Result<(PathBuf, How), String> {
    backup_in(state, Path::new("/tmp"), ms, KEEP_BACKUPS, clone_file)
}

/// Back `state` up into `<dir>/sb-backup-<state dir name>-<ms>`, then
/// keep only the `keep` newest backups of that state dir (only after a
/// backup that worked: a failing one never costs an old one). `clone`
/// clones one file (clonefile(2); tests inject failures).
fn backup_in(state: &Path, dir: &Path, ms: u64, keep: usize, clone: CloneFn) -> Result<(PathBuf, How), String> {
    let name = state
        .file_name()
        .ok_or("the state dir has no name")?
        .to_string_lossy()
        .to_string();
    let prefix = format!("sb-backup-{}-", name);
    let dest = dir.join(format!("{}{}", prefix, ms));
    let how = backup_to(state, &dest, clone)?;
    let mut old: Vec<(u64, PathBuf)> = std::fs::read_dir(dir)
        .map(|rd| {
            rd.flatten()
                .filter_map(|e| {
                    let f = e.file_name().to_string_lossy().to_string();
                    let ms = f.strip_prefix(&prefix)?;
                    // only <ms>: another state dir's name may extend this one
                    if ms.is_empty() || !ms.chars().all(|c| c.is_ascii_digit()) {
                        return None;
                    }
                    let ms: u64 = ms.parse().ok()?;
                    e.file_type().ok()?.is_dir().then(|| (ms, e.path()))
                })
                .collect()
        })
        .unwrap_or_default();
    old.sort();
    let drop = old.len().saturating_sub(keep);
    for (_, p) in old.into_iter().take(drop) {
        let _ = std::fs::remove_dir_all(p);
    }
    Ok((dest, how))
}

type CloneFn = fn(&Path, &Path) -> std::io::Result<()>;

/// The clone first; rsync when the clone is unsupported here.
fn backup_to(src: &Path, dest: &Path, clone: CloneFn) -> Result<How, String> {
    if !src.is_dir() {
        return Err(format!("no state dir {}", src.display()));
    }
    match clone_tree(src, dest, &[], clone) {
        Ok(()) => return Ok(How::Clone),
        Err(e) if unsupported(&e) => {
            let _ = std::fs::remove_dir_all(dest);
        }
        Err(e) => {
            let _ = std::fs::remove_dir_all(dest);
            return Err(format!("clone: {}", e));
        }
    }
    rsync_to(src, dest).map(|()| How::Rsync)
}

fn unsupported(e: &std::io::Error) -> bool {
    matches!(e.raw_os_error(), Some(libc::EXDEV) | Some(libc::ENOTSUP) | Some(libc::ENOSYS))
        || e.kind() == std::io::ErrorKind::Unsupported
}

fn vanished(e: &std::io::Error) -> bool {
    e.kind() == std::io::ErrorKind::NotFound
}

/// What the backup leaves out, by the path inside the state dir: the
/// rsync rules below, as components.
fn skipped(rel: &[&str]) -> bool {
    match rel {
        ["hub.sock"] => true,
        ["agents", _, "tmp"] => true,
        ["agents", _, "run", f] => *f != "approvals-mode",
        _ => false,
    }
}

/// Clone the tree `src` into `dest` (made here), file by file: dirs made
/// with their mode, files cloned, links remade, the rest (sockets, FIFOs)
/// skipped; an entry gone meanwhile is skipped.
fn clone_tree(src: &Path, dest: &Path, rel: &[&str], clone: CloneFn) -> std::io::Result<()> {
    use std::os::unix::fs::PermissionsExt;
    let rd = match std::fs::read_dir(src) {
        Ok(rd) => rd,
        Err(e) if vanished(&e) && !rel.is_empty() => return Ok(()),
        Err(e) => return Err(e),
    };
    std::fs::create_dir_all(dest)?;
    if let Ok(m) = std::fs::metadata(src) {
        let _ = std::fs::set_permissions(dest, std::fs::Permissions::from_mode(m.permissions().mode()));
    }
    for e in rd {
        let e = match e {
            Ok(e) => e,
            Err(e) if vanished(&e) => continue,
            Err(e) => return Err(e),
        };
        let name = e.file_name();
        let name = name.to_string_lossy();
        let mut r: Vec<&str> = rel.to_vec();
        r.push(&name);
        if skipped(&r) {
            continue;
        }
        let ft = match e.file_type() {
            Ok(t) => t,
            Err(e) if vanished(&e) => continue,
            Err(e) => return Err(e),
        };
        let (s, d) = (e.path(), dest.join(&*name));
        let res = if ft.is_dir() {
            clone_tree(&s, &d, &r, clone)
        } else if ft.is_symlink() {
            std::fs::read_link(&s).and_then(|t| std::os::unix::fs::symlink(t, &d))
        } else if ft.is_file() {
            clone(&s, &d)
        } else {
            Ok(()) // a socket, a FIFO: never state
        };
        match res {
            Err(e) if vanished(&e) => continue,
            other => other?,
        }
    }
    Ok(())
}

/// clonefile(2) of one file, its mode and times kept.
#[cfg(target_os = "macos")]
fn clone_file(src: &Path, dest: &Path) -> std::io::Result<()> {
    use std::ffi::CString;
    use std::os::unix::ffi::OsStrExt;
    let s = CString::new(src.as_os_str().as_bytes())?;
    let d = CString::new(dest.as_os_str().as_bytes())?;
    // CLONE_NOFOLLOW (1): the entry itself
    if unsafe { libc::clonefile(s.as_ptr(), d.as_ptr(), 1) } == 0 {
        Ok(())
    } else {
        Err(std::io::Error::last_os_error())
    }
}

#[cfg(not(target_os = "macos"))]
fn clone_file(_: &Path, _: &Path) -> std::io::Result<()> {
    Err(std::io::Error::from_raw_os_error(libc::ENOTSUP))
}

/// `rsync` of the state dir `src` into `dest`, regular files, links and
/// dirs only. Not `-a`: it implies -D, and copying a unix socket makes
/// rsync bind a new one at the destination, which fails (`mkstempsock:
/// Invalid argument`) once the path passes the 104-byte socket limit, as
/// the e2e and tmux sockets under agents/*/tmp do. macOS's openrsync has
/// no --no-specials, hence the explicit -rlptg. The agents' scratch
/// folders (agents/*/tmp: sockets, FIFOs, GBs of test trees) are not
/// state; nor are the live REPLs' side channels (agents/*/run: their
/// bend-sh-*.sh, bend-prog-* come and go, one vanished mid-copy failed a
/// switch's backup with exit 23), but `approvals-mode`, kept there, is.
/// A file gone mid-copy anyway (exit 24) is not a failed backup. rsync's
/// stderr is kept for the error, never left in hub.err.
fn rsync_to(src: &Path, dest: &Path) -> Result<(), String> {
    let out = std::process::Command::new("rsync")
        .args(["-rlptg", "--exclude", "/hub.sock", "--exclude", "/agents/*/tmp/"])
        .args(["--include", "/agents/*/run/approvals-mode", "--exclude", "/agents/*/run/*"])
        .arg(format!("{}/", src.display()))
        .arg(format!("{}/", dest.display()))
        .stdin(std::process::Stdio::null())
        .output()
        .map_err(|e| format!("rsync: {}", e))?;
    let err = String::from_utf8_lossy(&out.stderr);
    if out.status.success() || out.status.code() == Some(24) || (out.status.code() == Some(23) && only_vanished(&err)) {
        return Ok(());
    }
    let first = err.lines().map(str::trim).find(|l| !l.is_empty()).unwrap_or("");
    Err(if first.is_empty() {
        format!("rsync {}", out.status)
    } else {
        format!("rsync {}: {}", out.status, crate::util::clip(first, 200))
    })
}

/// rsync's errors are only files gone mid-copy: macOS's openrsync says
/// exit 23 with `<file>: open (2)` (ENOENT) where rsync says 24 (an
/// agent's role-request.txt vanished in an e2e's backup).
fn only_vanished(stderr: &str) -> bool {
    let errs: Vec<&str> = stderr.lines().filter(|l| l.contains("error")).collect();
    !errs.is_empty() && errs.iter().all(|l| l.contains(": open (2)") || l.contains("No such file or directory (2)"))
}

#[cfg(test)]
mod tests {
    use super::{backup_in, clone_file, How};
    use std::path::{Path, PathBuf};

    fn tmp(tag: &str) -> PathBuf {
        let t = std::env::temp_dir().join(format!("sb-bk-{}-{}", tag, std::process::id()));
        let _ = std::fs::remove_dir_all(&t);
        t
    }

    /// Every file under `d` with its bytes, as (relative path, bytes).
    fn tree(d: &Path) -> Vec<(String, Vec<u8>)> {
        let mut out = vec![];
        fn walk(root: &Path, d: &Path, out: &mut Vec<(String, Vec<u8>)>) {
            for e in std::fs::read_dir(d).unwrap().flatten() {
                let p = e.path();
                let rel = p.strip_prefix(root).unwrap().to_string_lossy().into_owned();
                let ft = e.file_type().unwrap();
                if ft.is_dir() {
                    out.push((rel + "/", vec![]));
                    walk(root, &p, out);
                } else if ft.is_file() {
                    out.push((rel, std::fs::read(&p).unwrap()));
                } else if ft.is_symlink() {
                    out.push((rel + "@", std::fs::read_link(&p).unwrap().to_string_lossy().as_bytes().to_vec()));
                }
            }
        }
        walk(d, d, &mut out);
        out.sort();
        out
    }

    /// A state dir with a socket and a FIFO deep down (an e2e hub's
    /// socket, a tmux socket, a bg command's stdin), scratch and a REPL's
    /// side channels: (the state dir, the tree its backup must hold).
    fn a_state(t: &Path) -> PathBuf {
        let st = t.join("state-of-a-workspace");
        let run = st.join("agents/x/run");
        let deep = st.join("agents/x/tmp/sb-e2e-0000/st");
        for d in [&run, &deep, &st.join("sessions/s1")] {
            std::fs::create_dir_all(d).unwrap();
        }
        std::fs::write(st.join("journal.jsonl"), "{}\n").unwrap();
        std::fs::write(st.join("agents/x/transcript.log"), "1\tsb you : fake\n").unwrap();
        std::fs::write(st.join("sessions/s1/events.jsonl"), vec![7u8; 100_000]).unwrap();
        std::os::unix::fs::symlink("../journal.jsonl", st.join("sessions/link")).unwrap();
        std::fs::write(deep.join("big.bin"), "scratch").unwrap();
        // a live REPL's side channels come and go; its approvals mode stays
        std::fs::write(run.join("approvals-mode"), "auto").unwrap();
        std::fs::write(run.join("bend-sh-59301-2714723221.sh"), "echo").unwrap();
        // made from inside the folder: a full path may pass the socket limit
        let mk = |d: &Path| {
            let ok = std::process::Command::new("python3")
                .current_dir(d)
                .args(["-c", "import socket,os; socket.socket(socket.AF_UNIX).bind('hub.sock'); os.mkfifo('0.in')"])
                .status()
                .unwrap()
                .success();
            assert!(ok, "socket and fifo made in {}", d.display());
        };
        mk(&run);
        mk(&deep);
        mk(&st);
        st
    }

    fn expected() -> Vec<(String, Vec<u8>)> {
        let mut v: Vec<(String, Vec<u8>)> = vec![
            ("agents/".into(), vec![]),
            ("agents/x/".into(), vec![]),
            ("agents/x/run/".into(), vec![]),
            ("agents/x/run/approvals-mode".into(), b"auto".to_vec()),
            ("agents/x/transcript.log".into(), b"1\tsb you : fake\n".to_vec()),
            ("journal.jsonl".into(), b"{}\n".to_vec()),
            ("sessions/".into(), vec![]),
            ("sessions/link@".into(), b"../journal.jsonl".to_vec()),
            ("sessions/s1/".into(), vec![]),
            ("sessions/s1/events.jsonl".into(), vec![7u8; 100_000]),
        ];
        v.sort();
        v
    }

    /// The backup skips sockets, FIFOs, scratch and side channels, where
    /// `rsync -a` died on "mkstempsock: Invalid argument" (the hub's own
    /// c2c30af8 switch); only the newest `keep` backups stay.
    #[test]
    fn a_backup_skips_sockets_fifos_and_scratch_and_keeps_the_newest_three() {
        let t = tmp("keep");
        let st = a_state(&t);
        let dir = t.join("backups-in-a-folder-with-a-long-enough-name-to-pass-the-limit");
        std::fs::create_dir_all(&dir).unwrap();
        for ms in 1..=6u64 {
            std::fs::create_dir_all(dir.join(format!("sb-backup-state-of-a-workspace-{}", ms))).unwrap();
        }
        // another state dir whose name extends this one's, and a stray file
        std::fs::create_dir_all(dir.join("sb-backup-state-of-a-workspace-2-7")).unwrap();
        std::fs::create_dir_all(dir.join("sb-backup-state-of-a-workspace-x")).unwrap();
        let (b, how) = backup_in(&st, &dir, 100, 3, clone_file).expect("the backup works");
        assert_eq!(b, dir.join("sb-backup-state-of-a-workspace-100"));
        if cfg!(target_os = "macos") {
            assert_eq!(how, How::Clone, "APFS: a clone");
        }
        assert_eq!(tree(&b), expected(), "the backup holds the state, paths and bytes");
        let mut left: Vec<String> =
            std::fs::read_dir(&dir).unwrap().flatten().map(|e| e.file_name().to_string_lossy().into_owned()).collect();
        left.sort();
        assert_eq!(
            left,
            [
                "sb-backup-state-of-a-workspace-100",
                "sb-backup-state-of-a-workspace-2-7",
                "sb-backup-state-of-a-workspace-5",
                "sb-backup-state-of-a-workspace-6",
                "sb-backup-state-of-a-workspace-x",
            ]
        );
        // a failed backup says why and costs no old one
        let e = backup_in(&t.join("no-such-state"), &dir, 200, 1, clone_file).unwrap_err();
        assert!(e.starts_with("no state dir "), "{}", e);
        assert!(dir.join("sb-backup-state-of-a-workspace-5").is_dir());
        let _ = std::fs::remove_dir_all(&t);
    }

    /// The live journal appended after the backup leaves the backup as it
    /// was (a clone shares blocks until one side writes).
    #[test]
    fn the_live_state_written_after_a_backup_leaves_it_unchanged() {
        let t = tmp("live");
        let st = a_state(&t);
        let (b, _) = backup_in(&st, &t, 1, 3, clone_file).unwrap();
        use std::io::Write;
        let mut f = std::fs::OpenOptions::new().append(true).open(st.join("journal.jsonl")).unwrap();
        f.write_all(b"{\"later\":1}\n").unwrap();
        std::fs::write(st.join("sessions/s1/events.jsonl"), "rewritten").unwrap();
        assert_eq!(tree(&b), expected());
        let _ = std::fs::remove_dir_all(&t);
    }

    fn unsupported(_: &Path, _: &Path) -> std::io::Result<()> {
        Err(std::io::Error::from_raw_os_error(libc::ENOTSUP))
    }

    /// A clone that fails as unsupported (off APFS): today's rsync runs,
    /// and the backup is the same.
    #[test]
    fn an_unsupported_clone_falls_back_to_rsync() {
        let t = tmp("fallback");
        let st = a_state(&t);
        let (b, how) = backup_in(&st, &t, 1, 3, unsupported).unwrap();
        assert_eq!(how, How::Rsync);
        assert_eq!(tree(&b), expected());
        let _ = std::fs::remove_dir_all(&t);
    }

    /// The transcript vanishes between the listing and its clone
    /// (openrsync's exit 23 case, hub-boot-hang): not a failed backup.
    fn transcript_gone(s: &Path, d: &Path) -> std::io::Result<()> {
        if s.ends_with("transcript.log") {
            return Err(std::io::Error::from_raw_os_error(libc::ENOENT));
        }
        clone_file(s, d)
    }

    fn denied(_: &Path, _: &Path) -> std::io::Result<()> {
        Err(std::io::Error::from_raw_os_error(libc::EACCES))
    }

    #[test]
    fn a_file_gone_mid_clone_is_not_a_failed_backup_another_error_is() {
        if !cfg!(target_os = "macos") {
            return;
        }
        let t = tmp("gone");
        let st = a_state(&t);
        let (b, how) = backup_in(&st, &t, 1, 3, transcript_gone).expect("a vanished file is no failure");
        assert_eq!(how, How::Clone);
        let want: Vec<_> = expected().into_iter().filter(|(p, _)| p != "agents/x/transcript.log").collect();
        assert_eq!(tree(&b), want);
        let e = backup_in(&st, &t, 2, 3, denied).unwrap_err();
        assert!(e.starts_with("clone: "), "{}", e);
        assert!(!t.join("sb-backup-state-of-a-workspace-2").exists(), "no half backup left");
        let _ = std::fs::remove_dir_all(&t);
    }

    #[test]
    fn a_file_gone_mid_rsync_is_not_a_failed_backup_another_error_is() {
        use super::only_vanished;
        let gone = "rsync(40552): error: /st/agents/t7/role-request.txt: open (2) in /v\nrsync(40552): error: /st/agents/a/run/bend-sh-1.sh: open (2)\n";
        assert!(only_vanished(gone));
        assert!(!only_vanished("rsync(1): error: /st/journal.jsonl: open (13)\n"), "permission denied is a failure");
        assert!(!only_vanished(&format!("{}rsync(1): error: write failed: No space left on device (28)\n", gone)));
        assert!(!only_vanished(""));
    }
}
