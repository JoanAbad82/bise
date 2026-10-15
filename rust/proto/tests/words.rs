//! Every word of the catalog is read by a client (architect m_27078 c):
//! Rust reads it as `<area>::<name>` (rust/, outside the catalog), the
//! desktop as `<area>.<name>` (apps/desktop/src, outside the generated
//! files and the tests). A word nothing reads is a dead key: delete it.

use bise_proto::words::ALL;
use std::path::{Path, PathBuf};

fn root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../..")
}

/// The source files of a client: (path, text).
fn sources(dir: &Path, exts: &[&str], skip: &dyn Fn(&Path) -> bool, out: &mut Vec<String>) {
    let Ok(rd) = std::fs::read_dir(dir) else { return };
    for e in rd.filter_map(|e| e.ok()) {
        let p = e.path();
        let name = e.file_name().to_string_lossy().to_string();
        if skip(&p) || name.starts_with('.') || ["target", "vendor", "node_modules", "out", "dist"].contains(&name.as_str()) {
            continue;
        }
        if p.is_dir() {
            sources(&p, exts, skip, out);
        } else if exts.iter().any(|x| name.ends_with(x)) {
            if let Ok(t) = std::fs::read_to_string(&p) {
                out.push(t);
            }
        }
    }
}

/// `needle` in `hay` as a whole name: not followed by a name's character.
fn reads(hay: &str, needle: &str) -> bool {
    hay.match_indices(needle).any(|(i, _)| {
        let before = hay[..i].chars().next_back().is_none_or(|c| !(c.is_alphanumeric() || c == '_'));
        let after = hay[i + needle.len()..].chars().next().is_none_or(|c| !(c.is_alphanumeric() || c == '_'));
        before && after
    })
}

#[test]
fn every_word_is_read_by_a_client() {
    let root = root();
    let catalog = root.join("rust/proto/src/words");
    let mut rust = Vec::new();
    sources(&root.join("rust"), &[".rs"], &|p| p.starts_with(&catalog), &mut rust);
    let desktop_src = root.join("apps/desktop/src");
    let mut ts = Vec::new();
    sources(&desktop_src, &[".ts", ".tsx"], &|p| {
        let n = p.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
        n.ends_with(".gen.ts") || n.contains(".test.")
    }, &mut ts);
    let mut dead = Vec::new();
    for (area, words) in ALL {
        for w in *words {
            let name = w.key.split_once('.').map_or(w.key, |(_, n)| n);
            let in_rust = rust.iter().any(|t| reads(t, &format!("{area}::{name}")));
            let in_ts = ts.iter().any(|t| reads(t, &format!("{area}.{name}")));
            if !in_rust && !in_ts {
                dead.push(w.key);
            }
        }
    }
    assert!(dead.is_empty(), "words no client reads (delete them, or read them as <area>::<name> / <area>.<name>): {dead:?}");
}

#[test]
fn a_name_is_read_whole() {
    assert!(reads("inbox::answered(x)", "inbox::answered"));
    assert!(!reads("inbox::answered_at(x)", "inbox::answered"));
    assert!(!reads("myinbox::answered", "inbox::answered"));
}
