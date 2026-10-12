//! The keys a REPL was spawned with, as one number (BISE-266): the hub
//! keeps it per live REPL and compares it at each idle and input
//! (`Shell::keys_changed`); a different number relaunches the REPL at its
//! next idle. Pure.
//!
//! Only the keys count. `BISE_MODELS_FILE` rides in the same spawn env but
//! is a path, not a key: its writer falls back to the temp dir when the
//! cache file can't be written at that moment, and on 2026-10-12 that one
//! fallback (two writes of the hub at once) changed the number for every
//! live REPL, so all 26 relaunched, each with its plugin servers.

/// The spawn env's entries that are not keys: left out of [`hash_keys`].
const NOT_KEYS: &[&str] = &["BISE_MODELS_FILE"];

/// One number for the keys of a spawn env (name, value or unset).
pub(super) fn hash_keys(keys: &[(String, Option<String>)]) -> u64 {
    use std::hash::{Hash, Hasher};
    let mut h = std::collections::hash_map::DefaultHasher::new();
    for kv in keys.iter().filter(|(k, _)| !NOT_KEYS.contains(&k.as_str())) {
        kv.hash(&mut h);
    }
    h.finish()
}

#[cfg(test)]
mod tests {
    use super::hash_keys;

    fn env(models: &str, key: Option<&str>) -> Vec<(String, Option<String>)> {
        vec![
            ("MISTRAL_API_KEY".into(), key.map(String::from)),
            ("BISE_MODELS_FILE".into(), Some(models.into())),
        ]
    }

    /// The models file moving to its temp-dir fallback is no key change:
    /// no REPL relaunches for it.
    #[test]
    fn the_models_file_path_is_not_a_key() {
        let cache = env("/home/.bise/cache/models.toml", Some("k1"));
        let fallback = env("/var/folders/T/bise-models-21090.toml", Some("k1"));
        assert_eq!(hash_keys(&cache), hash_keys(&fallback));
    }

    /// A key saved, changed or removed still is.
    #[test]
    fn a_key_saved_changed_or_removed_is_a_change() {
        let p = "/home/.bise/cache/models.toml";
        let a = hash_keys(&env(p, Some("k1")));
        assert_ne!(a, hash_keys(&env(p, Some("k2"))));
        assert_ne!(a, hash_keys(&env(p, None)));
        assert_ne!(a, hash_keys(&env(p, Some("k1"))[1..]));
    }
}
