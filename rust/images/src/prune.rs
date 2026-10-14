//! The image store's retention (docs/images.md "Retention"): which files
//! go, and the two effects that run it.
//!
//! The store is shared by every hub of a bise home and written by the
//! TUI, bend-jsrt, the hub and the desktop, all under a hash name
//! (`<32 hex>.<ext>` and `.b64` for [`crate::store_bytes`], `<64 hex>.<ext>`
//! for the desktop's copy). [`doomed`] is the pure rule: a hash (its
//! image and its `.b64` together) goes when its newest file is older than
//! the setting and no live text names it; a write's leftover (`tmp-*`,
//! `*.tmp`) goes after a day; any other name stays (the store never
//! deletes what it did not write).
//!
//! A hub only knows its own open messages and cards, so the protection
//! that crosses hubs is the file's age: each hub [`touch`]es the images
//! its live texts name at its start and every [`TOUCH_EVERY_MS`], and
//! [`prune`]s at most once a day. With `keep_days >= 1` a touched image
//! is never old enough to go (the law `named_by_a_live_hub_never_goes`).

use std::collections::{BTreeMap, BTreeSet};
use std::path::Path;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

pub const DAY_MS: u64 = 86_400_000;
/// A hub touches the images it names this often (and at its start).
pub const TOUCH_EVERY_MS: u64 = 3_600_000;
/// How late a touch may run after its time (the hub's tick, a busy loop).
pub const TOUCH_SLACK_MS: u64 = 600_000;
/// A crashed write's leftover goes after this.
pub const TMP_KEEP_MS: u64 = DAY_MS;

const EXTS: &[&str] = &["png", "jpg", "gif", "webp", "b64"];

/// What a store file is, by its name.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Name {
    /// An image or its base64, by its hash.
    Image(String),
    /// A write's leftover.
    Tmp,
    /// Not the store's: never deleted.
    Foreign,
}

fn is_hash(s: &str) -> bool {
    matches!(s.len(), 32 | 64) && s.bytes().all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
}

/// The kind of a store file name.
pub fn classify(name: &str) -> Name {
    if name.starts_with("tmp-") || name.ends_with(".tmp") {
        return Name::Tmp;
    }
    match name.split_once('.') {
        Some((stem, ext)) if is_hash(stem) && EXTS.contains(&ext) => Name::Image(stem.to_string()),
        _ => Name::Foreign,
    }
}

/// The hashes a text names: every `/<hash>.<ext>` in it (a marker's
/// `b64=`, a plain path, a part's file). Whatever the folder: a name
/// read too widely only keeps a file longer.
pub fn named(text: &str) -> BTreeSet<String> {
    let mut out = BTreeSet::new();
    for (i, _) in text.match_indices('/') {
        let rest = &text[i + 1..];
        let n = rest.bytes().take_while(u8::is_ascii_hexdigit).count();
        let (stem, after) = rest.split_at(n);
        let Some(ext) = after.strip_prefix('.') else { continue };
        if is_hash(stem) && EXTS.iter().any(|e| ext.starts_with(e)) {
            out.insert(stem.to_string());
        }
    }
    out
}

/// The files to delete: `entries` are the store's (name, mtime ms).
/// Pure; the order follows `entries`.
pub fn doomed(entries: &[(String, u64)], now_ms: u64, keep_days: u64, named: &BTreeSet<String>) -> Vec<String> {
    let keep_ms = keep_days.max(1).saturating_mul(DAY_MS);
    let old = |mtime: u64, keep: u64| now_ms.saturating_sub(mtime) > keep;
    // a hash's age is its newest file's: the image and its .b64 go together
    let mut newest: BTreeMap<String, u64> = BTreeMap::new();
    for (name, mtime) in entries {
        if let Name::Image(stem) = classify(name) {
            let e = newest.entry(stem).or_insert(0);
            *e = (*e).max(*mtime);
        }
    }
    entries
        .iter()
        .filter(|(name, mtime)| match classify(name) {
            Name::Tmp => old(*mtime, TMP_KEEP_MS),
            Name::Foreign => false,
            Name::Image(stem) => !named.contains(&stem) && old(newest[&stem], keep_ms),
        })
        .map(|(name, _)| name.clone())
        .collect()
}

fn ms(t: SystemTime) -> u64 {
    t.duration_since(UNIX_EPOCH).map_or(0, |d| d.as_millis() as u64)
}

/// Deletes what [`doomed`] says in `dir`; answers how many went. A store
/// not there yet is empty.
pub fn prune(dir: &Path, now_ms: u64, keep_days: u64, named: &BTreeSet<String>) -> std::io::Result<usize> {
    let rd = match std::fs::read_dir(dir) {
        Ok(rd) => rd,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(0),
        Err(e) => return Err(e),
    };
    let entries: Vec<(String, u64)> = rd
        .filter_map(Result::ok)
        .filter(|e| e.file_type().is_ok_and(|t| t.is_file()))
        .filter_map(|e| {
            let mtime = e.metadata().ok()?.modified().ok()?;
            Some((e.file_name().into_string().ok()?, ms(mtime)))
        })
        .collect();
    let mut n = 0;
    for name in doomed(&entries, now_ms, keep_days, named) {
        if std::fs::remove_file(dir.join(&name)).is_ok() {
            n += 1;
        }
    }
    Ok(n)
}

/// Sets the mtime of every file of those hashes in `dir` to now: an image
/// in use is a fresh one. Missing files are skipped.
pub fn touch(dir: &Path, stems: &BTreeSet<String>) {
    let now = SystemTime::now();
    for stem in stems {
        for ext in EXTS {
            touch_file(&dir.join(format!("{stem}.{ext}")), now);
        }
    }
}

pub(crate) fn touch_file(p: &Path, at: SystemTime) {
    if let Ok(f) = std::fs::File::options().write(true).open(p) {
        let _ = f.set_modified(at);
    }
}

/// `ms` as a time (the tests' clock).
pub fn at_ms(ms: u64) -> SystemTime {
    UNIX_EPOCH + Duration::from_millis(ms)
}

#[cfg(test)]
#[path = "prune_tests.rs"]
mod tests;
