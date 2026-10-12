//! The terminal never depends on the desktop's core (architect m_19472
//! (d), desktop-on-main): `ambient/` (what `bise ambient-core` runs for
//! the desktop app) may use the TUI's modules, never the reverse. Until
//! it is its own crate (bise-ambient-core, after the merge), this test
//! holds the line: no file of this crate outside `src/ambient/` names
//! `crate::ambient` or `super::ambient` in its code.

use std::path::{Path, PathBuf};

fn rs_files(dir: &Path, out: &mut Vec<PathBuf>) {
    for e in std::fs::read_dir(dir).unwrap().flatten() {
        let p = e.path();
        if p.is_dir() {
            if p.file_name().is_some_and(|n| n != "ambient") {
                rs_files(&p, out);
            }
        } else if p.extension().is_some_and(|x| x == "rs") {
            out.push(p);
        }
    }
}

/// The lines of `text` that reach into `ambient` from outside it
/// (comments left out: a doc may name it).
fn reaches(text: &str) -> Vec<String> {
    text.lines()
        .map(|l| l.split("//").next().unwrap_or(""))
        .filter(|code| ["crate::ambient", "super::ambient"].iter().any(|w| code.contains(w)))
        .map(|code| code.trim().to_string())
        .collect()
}

#[test]
fn nothing_outside_ambient_uses_it() {
    let src = Path::new(env!("CARGO_MANIFEST_DIR")).join("src");
    let mut files = vec![];
    rs_files(&src, &mut files);
    assert!(files.len() > 50, "found {} files under {}", files.len(), src.display());
    let bad: Vec<String> = files
        .iter()
        .filter(|f| !f.ends_with("ambient_seam_tests.rs"))
        .flat_map(|f| reaches(&std::fs::read_to_string(f).unwrap()).into_iter().map(move |l| format!("{}: {}", f.display(), l)))
        .collect();
    assert!(bad.is_empty(), "terminal code uses the desktop's core (keep it in src/ambient/):\n{}", bad.join("\n"));
}

#[test]
fn the_guard_sees_a_use_and_skips_a_comment() {
    assert_eq!(reaches("use crate::ambient::setup;\n// crate::ambient in a doc\nlet x = 1;"), ["use crate::ambient::setup;"]);
    assert_eq!(reaches("    super::ambient::hub::read(x)"), ["super::ambient::hub::read(x)"]);
    assert!(reaches("/// for ambient::setup's ports").is_empty());
}
