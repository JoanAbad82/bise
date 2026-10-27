//! A site artifact's localStorage, kept by the hub (web-storage, architect
//! m_46151). A site copy runs in an opaque origin (pages/site.rs
//! `ARTIFACT_CSP`), where the browser keeps no storage: kit/storage.js
//! gives it an in-memory one, which this file makes last across loads,
//! app restarts and browsers.
//!
//! - `<state>/artifacts/<id>/storage.json` ([`crate::artifacts::Store::storage_path`]):
//!   `{"<key>": "<value>"}`, shared by every version of `<id>`, like one
//!   origin. Written only here ([`save`]), by the page server under its
//!   lock (`Pages::locked`), atomically.
//! - [`read`]: the map, `{}` when none (or unreadable): the page server
//!   seeds each html page of the copy with it (site.rs `tagged`).
//! - [`checked`]: a posted map read again, pure: strings only (a key or a
//!   value that is not one is dropped), at most [`MAX_BYTES`] in all, else
//!   refused whole.
//!
//! Not kept: sessionStorage (in memory, per load), indexedDB and cookies
//! (still throw in the sandbox).

use crate::artifacts::Store;
use serde_json::{Map, Value};
use std::collections::BTreeMap;

/// The most a site keeps (its keys and values, in bytes), like a browser's
/// 5 MB per origin.
pub const MAX_BYTES: usize = 5 * 1024 * 1024;

/// A site's kept map.
pub type Kept = BTreeMap<String, String>;

/// `v` (a posted `local`) as a map to keep: its string values only, the
/// rest dropped. Err: not an object, or over [`MAX_BYTES`].
pub fn checked(v: &Value) -> Result<Kept, String> {
    let Some(obj): Option<&Map<String, Value>> = v.as_object() else { return Err("local is not an object".into()) };
    let kept: Kept = obj.iter().filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string()))).collect();
    let size: usize = kept.iter().map(|(k, v)| k.len() + v.len()).sum();
    if size > MAX_BYTES {
        return Err(format!("over {} MB", MAX_BYTES / (1024 * 1024)));
    }
    Ok(kept)
}

/// The kept map of `id` (empty: none yet, or unreadable).
pub fn read(store: &Store, id: &str) -> Kept {
    std::fs::read(store.storage_path(id)).ok().and_then(|b| serde_json::from_slice(&b).ok()).unwrap_or_default()
}

/// Keep `map` as `id`'s, whole (an empty map deletes the file).
pub fn save(store: &Store, id: &str, map: &Kept) -> Result<(), String> {
    let p = store.storage_path(id);
    if map.is_empty() {
        return match std::fs::remove_file(&p) {
            Err(e) if e.kind() != std::io::ErrorKind::NotFound => Err(e.to_string()),
            _ => Ok(()),
        };
    }
    if let Some(d) = p.parent() {
        std::fs::create_dir_all(d).map_err(|e| e.to_string())?;
    }
    let tmp = p.with_extension("json.tmp");
    std::fs::write(&tmp, serde_json::to_vec(map).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    std::fs::rename(&tmp, &p).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn checked_keeps_strings_drops_the_rest_and_refuses_too_much() {
        let k = checked(&json!({"a": "1", "n": 2, "o": {"x": "y"}, "z": null})).unwrap();
        assert_eq!(k, Kept::from([("a".to_string(), "1".to_string())]));
        assert!(checked(&json!(["a"])).is_err(), "not an object");
        assert!(checked(&json!({"big": "x".repeat(MAX_BYTES)})).is_err(), "over 5 MB");
        assert!(checked(&json!({"ok": "x".repeat(MAX_BYTES - 2)})).is_ok(), "at 5 MB");
    }

    #[test]
    fn save_then_read_and_empty_deletes() {
        let d = std::env::temp_dir().join(format!("sb-art-storage-{}", std::process::id()));
        let s = Store::new(&d);
        assert!(read(&s, "budget").is_empty());
        let m = Kept::from([("rent".to_string(), "</script><b>".to_string())]);
        save(&s, "budget", &m).unwrap();
        assert_eq!(read(&s, "budget"), m);
        save(&s, "budget", &Kept::new()).unwrap();
        assert!(!s.storage_path("budget").exists());
        let _ = std::fs::remove_dir_all(&d);
    }
}
