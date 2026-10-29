//! Issue 38 (architect m_35725): the runtime's obs lines have one reader,
//! `thread::lines::read` (records in `thread/obs.rs`, the older text in
//! `thread/legacy.rs`). No other Rust file tests an obs line's text by its
//! prefix: a new reader goes through `lines::read`.

use std::path::{Path, PathBuf};

fn rust_files(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(rd) = std::fs::read_dir(dir) else { return };
    for e in rd.flatten() {
        let p = e.path();
        let name = p.file_name().and_then(|n| n.to_str()).unwrap_or_default();
        if p.is_dir() {
            if !matches!(name, "target" | "node_modules" | ".git") {
                rust_files(&p, out);
            }
        } else if name.ends_with(".rs") {
            out.push(p);
        }
    }
}

#[test]
fn no_rust_reads_obs_text_but_legacy_rs() {
    let rust = Path::new(env!("CARGO_MANIFEST_DIR")).join("..");
    let mut files = Vec::new();
    rust_files(&rust, &mut files);
    assert!(files.len() > 100, "{} files under {}", files.len(), rust.display());
    let me = Path::new(file!()).file_name().unwrap();
    let reads = ["strip_prefix(\"  obs: ", "strip_prefix(\"obs: ", "starts_with(\"  obs: ", "starts_with(\"obs: ", "contains(\"obs: ", "== \"obs: ", "== \"  obs: "];
    let mut found = Vec::new();
    for f in files {
        if f.ends_with("proto/src/thread/legacy.rs") || f.file_name() == Some(me) {
            continue;
        }
        let text = std::fs::read_to_string(&f).unwrap_or_default();
        for (n, l) in text.lines().enumerate() {
            if reads.iter().any(|r| l.contains(r)) {
                found.push(format!("{}:{}: {}", f.display(), n + 1, l.trim()));
            }
        }
    }
    assert!(found.is_empty(), "obs text read outside thread/legacy.rs (use bise_proto::thread::lines::read):\n{}", found.join("\n"));
}
