//! The voice models a provider lists now (`<cache>/voice-models.json`):
//! its `/models` answer, the ids it says transcribe
//! (`capabilities.audio_transcription`, Mistral's). Mistral took
//! voxtral-transcribe-3 away on 2026-10-19 and every dictation failed on
//! the catalog's default: with this list the default, the pickers and the
//! fallback of a failed take follow what the provider has
//! ([`crate::Catalog::with_live_stt`]); the catalog is only the fallback
//! when there is no list.
//!
//! [`crate::live_fetch::refresh`] is the one writer (the hub's thread,
//! once a day per provider, only a provider whose key bise has); a
//! failed fetch keeps the old file. [`read`] gives the lists to
//! [`crate::Setup::load`]. The parsing and the store are pure.

use std::collections::BTreeMap;
use std::path::Path;

use serde_json::{json, Value};

/// The providers whose model list says which ids transcribe.
pub const LISTED: [&str; 1] = ["mistral"];

/// The ids of a `/models` answer that transcribe, in its order, once
/// each. Empty: not a list, or none says it transcribes.
pub fn parse(v: &Value) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for m in v.get("data").and_then(Value::as_array).into_iter().flatten() {
        let hears = m.pointer("/capabilities/audio_transcription").and_then(Value::as_bool) == Some(true);
        if let (true, Some(id)) = (hears, m.get("id").and_then(Value::as_str)) {
            if !id.is_empty() && !out.iter().any(|x| x == id) {
                out.push(id.to_string());
            }
        }
    }
    out
}

/// What `<cache>/voice-models.json` holds: when each provider was
/// fetched (ms) and its ids that transcribe.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct Store {
    pub fetched: BTreeMap<String, u64>,
    pub models: BTreeMap<String, Vec<String>>,
}

impl Store {
    /// None: not a store (the caller keeps the file it has).
    pub fn parse(text: &str) -> Option<Store> {
        let v: Value = serde_json::from_str(text).ok()?;
        let fetched = v.get("fetched")?.as_object()?.iter().filter_map(|(p, t)| Some((p.clone(), t.as_u64()?))).collect();
        let models = v
            .get("models")?
            .as_object()?
            .iter()
            .map(|(p, l)| (p.clone(), l.as_array().into_iter().flatten().filter_map(|w| w.as_str().map(String::from)).collect::<Vec<_>>()))
            .filter(|(_, l)| !l.is_empty())
            .collect();
        Some(Store { fetched, models })
    }

    pub fn to_json(&self) -> String {
        json!({"version": 1, "fetched": self.fetched, "models": self.models}).to_string()
    }

    /// The provider's fetch is older than a day, or never was.
    pub fn due(&self, provider: &str, now_ms: u64) -> bool {
        self.fetched.get(provider).is_none_or(|t| now_ms.saturating_sub(*t) >= crate::live_efforts::TTL_MS)
    }

    /// A new fetch of `provider`: its list replaces the old one.
    pub fn with(mut self, provider: &str, now_ms: u64, ids: Vec<String>) -> Store {
        self.models.remove(provider);
        if !ids.is_empty() {
            self.models.insert(provider.to_string(), ids);
        }
        self.fetched.insert(provider.to_string(), now_ms);
        self
    }

    /// (provider, its ids), for [`crate::Catalog::with_live_stt`].
    pub fn lists(&self) -> Vec<(String, Vec<String>)> {
        self.models.iter().map(|(p, l)| (p.clone(), l.clone())).collect()
    }
}

pub(crate) fn store_path(cache_dir: &Path) -> std::path::PathBuf {
    cache_dir.join("voice-models.json")
}

/// The stored store, empty when there is none (or it is not one).
pub fn read_store(cache_dir: &Path) -> Store {
    std::fs::read_to_string(store_path(cache_dir)).ok().and_then(|t| Store::parse(&t)).unwrap_or_default()
}

/// Every provider's list bise holds.
pub fn read(cache_dir: &Path) -> Vec<(String, Vec<String>)> {
    read_store(cache_dir).lists()
}
