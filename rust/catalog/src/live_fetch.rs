//! The one writer of `<cache>/efforts.json` (effort-table step 2): the
//! hub calls [`refresh`] in a thread at its start, then at most once a
//! day per provider. It fetches only the providers he uses (a key found,
//! or signed in): Anthropic and OpenRouter here, ChatGPT through
//! chatgpt.rs's own fetch of its model list (no second request). A
//! failure (no network, an error status, an answer that is not a list)
//! keeps the old file; a short timeout, so no network costs little.
//! [`read`] gives the lists to [`crate::Setup`] (the hub, the TUI, the
//! hand-off). The parsing is `live_efforts`, pure.
use std::path::Path;
use std::time::Duration;

use bend_plugins::http::{self, Url};
use serde_json::Value;

use crate::auth::Keys;
use crate::live_efforts::{self, Store, FETCHED};
use crate::{auth_cli::Paths, chatgpt, Provider, Setup};

/// The longest a fetch may wait, connect and each read.
pub const TIMEOUT: Duration = Duration::from_secs(5);

fn store_path(cache_dir: &Path) -> std::path::PathBuf {
    cache_dir.join("efforts.json")
}

/// The stored store, empty when there is none (or it is not one).
pub fn read_store(cache_dir: &Path) -> Store {
    std::fs::read_to_string(store_path(cache_dir)).ok().and_then(|t| Store::parse(&t)).unwrap_or_default()
}

/// Every API list bise holds: efforts.json, and ChatGPT's model list
/// (`chatgpt-models.json`, written by chatgpt.rs) as "chatgpt/<slug>".
pub fn read(cache_dir: &Path) -> Vec<(String, Vec<String>)> {
    let mut out: Vec<(String, Vec<String>)> = read_store(cache_dir).models.into_iter().collect();
    let plan = std::fs::read_to_string(cache_dir.join("chatgpt-models.json")).ok();
    let plan: Option<Value> = plan.and_then(|t| serde_json::from_str(&t).ok());
    for m in plan.iter().flat_map(|v| v.get("models").and_then(Value::as_array).into_iter().flatten()) {
        let (Some(slug), l) = (m.get("slug").and_then(Value::as_str), live_efforts::chatgpt_levels(m)) else {
            continue;
        };
        if !l.is_empty() {
            out.push((format!("chatgpt/{slug}"), l));
        }
    }
    out
}

/// One provider's lists from its API, or why not.
fn fetch(p: &Provider, key: &str) -> Result<Vec<(String, Vec<String>)>, String> {
    let url = Url::parse(&format!("{}/models", p.base_url.trim_end_matches('/')))?;
    let h: Vec<(String, String)> = match p.api.as_str() {
        "anthropic" => vec![("x-api-key".into(), key.into()), ("anthropic-version".into(), "2023-06-01".into())],
        _ => vec![("Authorization".into(), format!("Bearer {key}"))],
    };
    let r = http::send(&http::Request { method: "GET", url: &url, headers: &h, body: b"", timeout: TIMEOUT }).map_err(|e| e.to_string())?;
    let status = r.status;
    let body = r.read_all(32 << 20).map_err(|e| e.to_string())?;
    if !(200..300).contains(&status) {
        return Err(format!("{} answered {status} to the model list", p.name));
    }
    let v: Value = serde_json::from_slice(&body).map_err(|_| format!("{}'s model list is not JSON", p.name))?;
    let lists = if p.api == "anthropic" { live_efforts::parse_anthropic(&v) } else { live_efforts::parse_openrouter(&v) };
    if lists.is_empty() {
        return Err(format!("{}'s model list has no effort list", p.name));
    }
    Ok(lists)
}

/// Fetch the lists that are due (`now_ms`) and write them; one line per
/// provider tried, for the hub's log. Never a key in a line.
pub fn refresh(paths: &Paths, cache_dir: &Path, setup: &Setup, keys: &Keys, now_ms: u64) -> Vec<String> {
    let mut out = Vec::new();
    let mut store = read_store(cache_dir);
    let mut changed = false;
    for id in FETCHED {
        let Some(p) = setup.catalog.provider(id) else { continue };
        let Some(key) = keys.for_provider(p).map(|f| f.key) else { continue };
        if p.base_url.is_empty() || !store.due(id, now_ms) {
            continue;
        }
        match fetch(p, &key) {
            Ok(lists) => {
                out.push(format!("efforts: {} lists from {}", lists.len(), id));
                store = store.with(id, now_ms, lists);
                changed = true;
            }
            Err(e) => out.push(format!("efforts: {id} kept its old lists: {e}")),
        }
    }
    if changed {
        if let Err(e) = write(cache_dir, &store) {
            out.push(format!("efforts: cannot write {}: {e}", store_path(cache_dir).display()));
        }
    }
    // ChatGPT: its own model list carries the levels (chatgpt.rs writes it)
    if setup.catalog.provider("chatgpt").is_some_and(|p| keys.signed_in(p)) && !chatgpt::models_fresh(paths) {
        match chatgpt::fetch_models(paths) {
            Ok(m) => out.push(format!("efforts: {} models from chatgpt", m.len())),
            Err(e) => out.push(format!("efforts: chatgpt kept its old list: {e}")),
        }
    }
    out
}

/// How often the hub's thread looks: [`refresh`] fetches only what is due.
pub const EVERY: Duration = Duration::from_secs(3600);

/// The hub's thread: [`refresh`] now, then every [`EVERY`], with the
/// keys and config as they are at each look; its lines go to `log`.
pub fn spawn_refresher(paths: Paths, cache_dir: std::path::PathBuf, log: fn(&str)) {
    let _ = std::thread::Builder::new().name("live-efforts".into()).spawn(move || loop {
        let files = crate::auth::EnvFile::read_all(&paths.env_files);
        let store = crate::auth::Store::read(&paths.auth_file).unwrap_or_default();
        let env = |k: &str| std::env::var(k).ok();
        let keys = Keys { env: &env, store: &store, files: &files };
        let setup = Setup::load(&paths.config);
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0, |d| d.as_millis() as u64);
        for line in refresh(&paths, &cache_dir, &setup, &keys, now) {
            log(&line);
        }
        std::thread::sleep(EVERY);
    });
}

/// What a [`Setup::load`] reads changed since: the latest change of
/// `config` and of the API lists (efforts.json, chatgpt-models.json).
pub fn stamp(config: &Path, cache_dir: &Path) -> Option<std::time::SystemTime> {
    let at = |p: &Path| std::fs::metadata(p).and_then(|m| m.modified()).ok();
    [at(config), at(&store_path(cache_dir)), at(&cache_dir.join("chatgpt-models.json"))].into_iter().flatten().max()
}

/// Atomically: a temp file of this write, then a rename.
fn write(cache_dir: &Path, store: &Store) -> std::io::Result<()> {
    std::fs::create_dir_all(cache_dir)?;
    let path = store_path(cache_dir);
    static N: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
    let n = N.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    let tmp = path.with_extension(format!("json.{}.{}.tmp", std::process::id(), n));
    std::fs::write(&tmp, store.to_json())?;
    std::fs::rename(&tmp, &path).inspect_err(|_| {
        let _ = std::fs::remove_file(&tmp);
    })
}
