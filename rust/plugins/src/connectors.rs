//! His Mistral connectors (docs/plugins.md, "Contract"): the catalog of
//! `/v1/connectors/bootstrap`, fetched in Rust and kept in one cache file
//! (`bise_home::Home::connectors_cache`, written under a lock, about
//! [`TTL_MS`] fresh, shared by every agent), turned into the session's
//! tool index lines. A failed fetch keeps the last good catalog and says
//! so. The key comes from the env or the secrets store, never the cache.
//!
//! Signatures only until the chunk "connectors" fills them in; the Bend
//! bootstrap (`mcp.bend` `bootstrap.*`) goes in that same chunk.

use crate::id::PluginId;
use crate::model::{ConnectorEntry, StateV2};
use std::path::Path;

/// The built-in connectors bise asks the bootstrap for, next to the
/// MCP-capable ones: each is a plugin he can turn off (image_generation
/// costs $0.10 an image).
pub const BUILTINS: &[&str] = &["web_search", "image_generation"];

/// How long a fetched catalog stays fresh.
pub const TTL_MS: u64 = 10 * 60 * 1000;

/// The catalog as bise has it: its connectors, when it was fetched, and
/// the last fetch's error when it failed (the connectors are then the last
/// good ones).
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct Catalog {
    pub connectors: Vec<ConnectorEntry>,
    pub fetched_ms: u64,
    pub error: Option<String>,
}

/// The catalog from `cache` when fresh at `now_ms` (and `force` is
/// false), else fetched with `key` and written to `cache` under its lock.
pub fn load(cache: &Path, key: Option<&str>, now_ms: u64, force: bool) -> Catalog {
    let _ = (cache, key, now_ms, force);
    todo!("plugins chunk `connectors`: fetch, cache, TTL")
}

/// The session's tool index lines for the connectors on in `state` (the
/// bridge merges them with the plugins' tools into `D/mcp-index.txt`).
pub fn index_lines(catalog: &Catalog, state: &StateV2) -> Vec<String> {
    let _ = (catalog, state);
    todo!("plugins chunk `connectors`: the index lines")
}

/// The address that connects connector `id` (a `mistral:` id) in his
/// browser.
pub fn connect_url(key: &str, id: &PluginId) -> Result<String, String> {
    let _ = (key, id);
    todo!("plugins chunk `connectors`: Mistral's auth url")
}
