//! The door of script mode (plan §9.2, architect m_23785): every path a
//! script reads or writes passes [`Door::read`] or [`Door::write`] first.
//!
//! The scope is the roots the harness gives (the agent's worktree and its
//! `$TMPDIR`, from `bise_home`'s rows: never read here). A path may name a
//! file under one of them and nothing else:
//!
//! - it is made absolute against the script's folder, then compared to the
//!   roots twice: as written (a `..` that climbs out, or an absolute path
//!   elsewhere, is refused as such) and once every symlink on the way is
//!   resolved (`canonicalize`: a link that leads out is refused as such);
//! - a write never goes through a symlink, even one that stays inside: an
//!   existing target that is a link is refused; the bytes go to a temp file
//!   beside the target, then a rename, so a crash never leaves half a file
//!   and the viewer never reads one;
//! - a file over [`MAX_BYTES`] (the hub's `MAX_COPY`, 50 MB) is refused, to
//!   read or to write.
//!
//! Every refusal is one line that names the path and the roots; each has a
//! test below.

use std::path::{Component, Path, PathBuf};

/// The largest file a script reads or writes: the hub keeps no copy of a
/// bigger one (`switchboard::artifacts::MAX_COPY`).
pub const MAX_BYTES: u64 = 50 * 1024 * 1024;

/// The folders a script may use, and where its relative paths start.
#[derive(Clone, Debug)]
pub struct Door {
    /// each root as given (made absolute) and as resolved
    roots: Vec<(PathBuf, PathBuf)>,
    base: PathBuf,
}

impl Door {
    /// `roots` must exist; `base` is the script's folder (relative paths).
    pub fn new(roots: &[PathBuf], base: &Path) -> Result<Door, String> {
        if roots.is_empty() {
            return Err("no folder given for the script (--root)".into());
        }
        let mut out = Vec::new();
        for r in roots {
            let given = lexical(&absolute(r, base));
            let real = given.canonicalize().map_err(|e| format!("the folder {} can't be used: {e}", r.display()))?;
            if !real.is_dir() {
                return Err(format!("{} is not a folder", r.display()));
            }
            out.push((given, real));
        }
        Ok(Door { roots: out, base: base.to_path_buf() })
    }

    fn roots_text(&self) -> String {
        self.roots.iter().map(|(g, _)| g.display().to_string()).collect::<Vec<_>>().join(", ")
    }

    fn outside(&self, op: &str, path: &str, why: &str) -> String {
        format!("{op}: {path} {why}; a script may only use files under {}", self.roots_text())
    }

    /// Whether `p` (absolute, `..`-free) is under a root: as given (`real`
    /// false) or resolved (`real` true).
    fn inside(&self, p: &Path, real: bool) -> bool {
        self.roots.iter().any(|(g, r)| p.starts_with(if real { r } else { g }) || p.starts_with(r))
    }

    /// The written path, absolute and without `..`, or the refusal when it
    /// leaves every root as written.
    fn lexical_in(&self, op: &str, path: &str) -> Result<PathBuf, String> {
        if path.trim().is_empty() {
            return Err(format!("{op}: no path given"));
        }
        let p = lexical(&absolute(Path::new(path), &self.base));
        if !self.inside(&p, false) {
            let why = if Path::new(path).components().any(|c| c == Component::ParentDir) {
                "climbs out with .."
            } else {
                "is outside"
            };
            return Err(self.outside(op, path, why));
        }
        Ok(p)
    }

    /// The real file to read.
    pub fn read(&self, path: &str) -> Result<PathBuf, String> {
        let op = "run.read";
        let p = self.lexical_in(op, path)?;
        let real = p.canonicalize().map_err(|e| match e.kind() {
            std::io::ErrorKind::NotFound => format!("{op}: no file at {path}"),
            _ => format!("{op}: {path}: {e}"),
        })?;
        if !self.inside(&real, true) {
            return Err(self.outside(op, path, &format!("is a symlink to {}", real.display())));
        }
        let meta = std::fs::metadata(&real).map_err(|e| format!("{op}: {path}: {e}"))?;
        if !meta.is_file() {
            return Err(format!("{op}: {path} is not a file"));
        }
        if meta.len() > MAX_BYTES {
            return Err(format!("{op}: {path} is {} MB, over the {} MB a script may read", meta.len() / (1024 * 1024), MAX_BYTES / (1024 * 1024)));
        }
        Ok(real)
    }

    /// The real path to write `len` bytes at (its folder resolved, the
    /// file itself never a symlink).
    pub fn write(&self, path: &str, len: u64) -> Result<PathBuf, String> {
        let op = "run.write";
        if len > MAX_BYTES {
            return Err(format!("{op}: {path} would be {} MB, over the {} MB a script may write", len / (1024 * 1024), MAX_BYTES / (1024 * 1024)));
        }
        let p = self.lexical_in(op, path)?;
        let (Some(dir), Some(name)) = (p.parent(), p.file_name()) else {
            return Err(format!("{op}: {path} names no file"));
        };
        let real_dir = dir.canonicalize().map_err(|e| match e.kind() {
            std::io::ErrorKind::NotFound => format!("{op}: no folder {} (make it first)", dir.display()),
            _ => format!("{op}: {}: {e}", dir.display()),
        })?;
        if !self.inside(&real_dir, true) {
            return Err(self.outside(op, path, &format!("is in a folder that is a symlink to {}", real_dir.display())));
        }
        let target = real_dir.join(name);
        match std::fs::symlink_metadata(&target) {
            Ok(m) if m.file_type().is_symlink() => Err(format!("{op}: {path} is a symlink: a script never writes through one")),
            Ok(m) if m.is_dir() => Err(format!("{op}: {path} is a folder")),
            _ => Ok(target),
        }
    }
}

/// Write `bytes` at `target` (from [`Door::write`]) through a temp file
/// beside it and a rename: the file is whole or untouched.
pub fn write_whole(target: &Path, bytes: &[u8]) -> Result<(), String> {
    use std::io::Write;
    let name = target.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
    let tmp = target.with_file_name(format!(".{name}.office-{}.tmp", std::process::id()));
    let mut f = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&tmp)
        .map_err(|e| format!("run.write: {}: {e}", tmp.display()))?;
    let done = f.write_all(bytes).and_then(|_| f.sync_all()).and_then(|_| std::fs::rename(&tmp, target));
    if let Err(e) = done {
        let _ = std::fs::remove_file(&tmp);
        return Err(format!("run.write: {}: {e}", target.display()));
    }
    Ok(())
}

fn absolute(p: &Path, base: &Path) -> PathBuf {
    if p.is_absolute() {
        p.to_path_buf()
    } else {
        base.join(p)
    }
}

/// `.` and `..` folded without touching the disk (a `..` above `/` stays
/// at `/`).
fn lexical(p: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for c in p.components() {
        match c {
            Component::ParentDir => {
                out.pop();
            }
            Component::CurDir => {}
            c => out.push(c),
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::os::unix::fs::symlink;

    /// A worktree and a tmp folder as roots, and a folder outside both.
    struct Scope {
        top: PathBuf,
        work: PathBuf,
        tmp: PathBuf,
        out: PathBuf,
    }

    fn scope(name: &str) -> Scope {
        let top = std::env::temp_dir().join(format!("jsrt-door-{}-{name}", std::process::id()));
        let _ = std::fs::remove_dir_all(&top);
        let (work, tmp, out) = (top.join("work"), top.join("tmp"), top.join("out"));
        for d in [&work, &tmp, &out] {
            std::fs::create_dir_all(d).unwrap();
        }
        std::fs::write(out.join("secret.xlsx"), b"his").unwrap();
        std::fs::write(work.join("q3.pptx"), b"deck").unwrap();
        Scope { top, work, tmp, out }
    }

    impl Scope {
        fn door(&self) -> Door {
            Door::new(&[self.work.clone(), self.tmp.clone()], &self.work).unwrap()
        }
    }

    impl Drop for Scope {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.top);
        }
    }

    #[test]
    fn a_file_inside_passes_relative_or_absolute() {
        let s = scope("inside");
        let d = s.door();
        let real = s.work.canonicalize().unwrap().join("q3.pptx");
        assert_eq!(d.read("q3.pptx").unwrap(), real);
        assert_eq!(d.read(s.work.join("q3.pptx").to_str().unwrap()).unwrap(), real);
        // a .. that stays inside is fine
        std::fs::create_dir_all(s.work.join("sub")).unwrap();
        assert_eq!(d.read("sub/../q3.pptx").unwrap(), real);
        // the tmp root too, and a new file
        let t = d.write(s.tmp.join("new.docx").to_str().unwrap(), 10).unwrap();
        assert_eq!(t, s.tmp.canonicalize().unwrap().join("new.docx"));
        // a symlink that stays inside reads
        symlink(s.work.join("q3.pptx"), s.work.join("alias.pptx")).unwrap();
        assert_eq!(d.read("alias.pptx").unwrap(), real);
    }

    #[test]
    fn refuses_an_absolute_path_outside() {
        let s = scope("abs");
        let p = s.out.join("secret.xlsx");
        let e = s.door().read(p.to_str().unwrap()).unwrap_err();
        assert!(e.contains("is outside") && e.contains(&s.work.display().to_string()) && e.contains(&s.tmp.display().to_string()), "{e}");
        assert!(s.door().write(p.to_str().unwrap(), 1).unwrap_err().contains("is outside"));
    }

    #[test]
    fn refuses_dot_dot_that_climbs_out() {
        let s = scope("dotdot");
        let e = s.door().read("../out/secret.xlsx").unwrap_err();
        assert!(e.starts_with("run.read: ../out/secret.xlsx climbs out with .."), "{e}");
        let e = s.door().write("sub/../../out/new.xlsx", 1).unwrap_err();
        assert!(e.contains("climbs out with .."), "{e}");
    }

    #[test]
    fn refuses_a_symlink_that_leads_out_to_read() {
        let s = scope("link-read");
        symlink(s.out.join("secret.xlsx"), s.work.join("looks-inside.xlsx")).unwrap();
        let e = s.door().read("looks-inside.xlsx").unwrap_err();
        assert!(e.contains("is a symlink to") && e.contains("secret.xlsx"), "{e}");
    }

    #[test]
    fn refuses_a_write_into_a_symlinked_folder_that_leads_out() {
        let s = scope("link-dir");
        symlink(&s.out, s.work.join("exit")).unwrap();
        let e = s.door().write("exit/new.xlsx", 1).unwrap_err();
        assert!(e.contains("is in a folder that is a symlink to"), "{e}");
        assert!(!s.out.join("new.xlsx").exists());
    }

    #[test]
    fn refuses_a_write_over_an_existing_symlink_even_inside() {
        let s = scope("link-target");
        symlink(s.work.join("q3.pptx"), s.work.join("alias.pptx")).unwrap();
        let e = s.door().write("alias.pptx", 1).unwrap_err();
        assert_eq!(e, "run.write: alias.pptx is a symlink: a script never writes through one");
        symlink(s.out.join("secret.xlsx"), s.work.join("out.xlsx")).unwrap();
        assert!(s.door().write("out.xlsx", 1).unwrap_err().contains("is a symlink"));
    }

    #[test]
    fn refuses_a_write_over_50_mb() {
        let s = scope("big-write");
        let e = s.door().write("big.xlsx", MAX_BYTES + 1).unwrap_err();
        assert_eq!(e, "run.write: big.xlsx would be 50 MB, over the 50 MB a script may write");
        assert!(s.door().write("ok.xlsx", MAX_BYTES).is_ok());
    }

    #[test]
    fn refuses_a_read_over_50_mb() {
        let s = scope("big-read");
        let f = std::fs::File::create(s.work.join("big.xlsx")).unwrap();
        f.set_len(MAX_BYTES + 1).unwrap(); // sparse: no 50 MB on the disk
        let e = s.door().read("big.xlsx").unwrap_err();
        assert!(e.contains("over the 50 MB a script may read"), "{e}");
    }

    #[test]
    fn refuses_a_missing_file_a_missing_folder_a_folder_and_no_path() {
        let s = scope("missing");
        let d = s.door();
        assert_eq!(d.read("nope.xlsx").unwrap_err(), "run.read: no file at nope.xlsx");
        assert!(d.write("no/such/dir/x.xlsx", 1).unwrap_err().contains("(make it first)"));
        std::fs::create_dir_all(s.work.join("deck")).unwrap();
        assert_eq!(d.read("deck").unwrap_err(), "run.read: deck is not a file");
        assert_eq!(d.write("deck", 1).unwrap_err(), "run.write: deck is a folder");
        assert_eq!(d.read(" ").unwrap_err(), "run.read: no path given");
    }

    #[test]
    fn a_root_must_exist() {
        let s = scope("roots");
        assert!(Door::new(&[], &s.work).is_err());
        assert!(Door::new(&[s.top.join("gone")], &s.work).unwrap_err().contains("can't be used"));
    }

    #[test]
    fn a_write_is_whole_and_replaces_by_rename() {
        let s = scope("whole");
        let t = s.door().write("q3.pptx", 4).unwrap();
        write_whole(&t, b"v2!!").unwrap();
        assert_eq!(std::fs::read(s.work.join("q3.pptx")).unwrap(), b"v2!!");
        let left: Vec<_> = std::fs::read_dir(&s.work).unwrap().flatten().filter(|e| e.file_name().to_string_lossy().ends_with(".tmp")).collect();
        assert!(left.is_empty(), "no temp file left");
    }
}
