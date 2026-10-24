//! Lazy stdio servers: the shared cache of each stdio plugin server's
//! `tools/list`, so a session's bridge lists a server's tools without
//! starting it. The bridge starts a server on its first call and stops it
//! after [`IDLE_STOP`] with no call; the next call starts it again. A
//! server that holds state between calls loses it after 10 idle minutes.
//!
//! One file per server spec in `Home::mcp_tools_cache()`, shared by every
//! session: `<key>.json` = `{"at": <unix s>, "tools": [...], "init": {...}}`
//! (its `tools/list` and its `initialize` result, which the bridge answers
//! for a server not running), written
//! atomically (tmp + rename). The key ([`key`]) hashes the plugin, the
//! server id, its command, args, cwd, the NAMES of its env (never a
//! value: they can be secrets) and the mtimes of the plugin's mcp.json,
//! plugin.json and file of typed-in secrets: an edited mcp.json or a new
//! secret is a new key. A list older than
//! [`TTL`] is a miss, so the next session starts the server once to
//! refresh it. A cold key is filled by one bridge under a flock on
//! `<key>.lock` ([`Cache::tools_of`]); the others wait at most the
//! server's startup timeout, then read what it wrote, or give up on that
//! server (never holding their REPL's ready longer). Every real start
//! (a first call, a `list_changed`) lists again and rewrites the file.
//!
//! Later, not built: one server per hub shared by the sessions (servers
//! can keep per-session state, PLUGIN_DATA, cwd: it needs a hub-side
//! owner).

use std::fs::File;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use serde_json::{json, Value};

use crate::resolve::StdioServer;

/// A cached list older than this is listed again (one start).
pub const TTL: Duration = Duration::from_secs(24 * 3600);
/// A running stdio server with no call for this long is stopped.
pub const IDLE_STOP: Duration = Duration::from_secs(10 * 60);

fn mtime_ns(p: &Path) -> u128 {
    std::fs::metadata(p)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_nanos())
        .unwrap_or(0)
}

/// The cache key of one stdio server of the plugin at `root`;
/// `secrets`: the plugin's file of typed-in values (`crate::secrets::path`),
/// by its mtime only.
pub fn key(plugin: &str, root: &Path, s: &StdioServer, secrets: Option<&Path>) -> String {
    let mut env: Vec<&str> = s.env.iter().map(|(k, _)| k.as_str()).collect();
    env.sort();
    let material = [
        plugin.to_string(),
        s.id.clone(),
        s.command.clone(),
        s.args.join("\u{1}"),
        s.cwd.display().to_string(),
        env.join("\u{1}"),
        mtime_ns(&root.join("mcp.json")).to_string(),
        mtime_ns(&root.join("plugin.json")).to_string(),
        secrets.map(mtime_ns).unwrap_or(0).to_string(),
    ]
    .join("\u{0}");
    let d = ring::digest::digest(&ring::digest::SHA256, material.as_bytes());
    d.as_ref()[..16].iter().map(|b| format!("{:02x}", b)).collect()
}

/// A list written at `at` (unix s) is still good at `now`.
pub fn fresh(at: u64, now: u64, ttl: Duration) -> bool {
    at <= now && now - at < ttl.as_secs()
}

/// A running server last called at `last` is stopped at `now`.
pub fn idle(last: Instant, now: Instant, idle_stop: Duration) -> bool {
    now.saturating_duration_since(last) >= idle_stop
}

fn unix(t: SystemTime) -> u64 {
    t.duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0)
}

/// What a server said when it was listed: its tools and its
/// `initialize` result.
#[derive(Clone, Debug, PartialEq)]
pub struct Listed {
    pub tools: Vec<Value>,
    pub init: Value,
}

/// The cache dir. Every method is best effort: an unreadable or
/// unwritable cache is a miss, never an error of the session.
#[derive(Clone, Debug)]
pub struct Cache {
    dir: PathBuf,
    ttl: Duration,
}

/// Held while a bridge lists a cold key; dropped, the flock goes.
pub struct Lock(#[allow(dead_code)] File);

impl Cache {
    pub fn new(dir: PathBuf) -> Cache {
        Cache { dir, ttl: TTL }
    }

    pub fn with_ttl(dir: PathBuf, ttl: Duration) -> Cache {
        Cache { dir, ttl }
    }

    fn file(&self, key: &str) -> PathBuf {
        self.dir.join(format!("{}.json", key))
    }

    /// The fresh list of `key`, if any.
    pub fn read(&self, key: &str, now: SystemTime) -> Option<Listed> {
        let text = std::fs::read_to_string(self.file(key)).ok()?;
        let v: Value = serde_json::from_str(&text).ok()?;
        let at = v.get("at")?.as_u64()?;
        if !fresh(at, unix(now), self.ttl) {
            return None;
        }
        Some(Listed { tools: v.get("tools")?.as_array()?.clone(), init: v.get("init").cloned().unwrap_or(Value::Null) })
    }

    pub fn write(&self, key: &str, listed: &Listed, now: SystemTime) {
        if std::fs::create_dir_all(&self.dir).is_err() {
            return;
        }
        let tmp = self.dir.join(format!("{}.{}.tmp", key, std::process::id()));
        let body = json!({"at": unix(now), "tools": listed.tools, "init": listed.init}).to_string();
        if std::fs::write(&tmp, body).is_ok() && std::fs::rename(&tmp, self.file(key)).is_err() {
            let _ = std::fs::remove_file(&tmp);
        }
    }

    /// The flock of `key`, waiting at most `wait` for another bridge.
    pub fn lock(&self, key: &str, wait: Duration) -> Option<Lock> {
        std::fs::create_dir_all(&self.dir).ok()?;
        let f = std::fs::OpenOptions::new().create(true).truncate(false).write(true).open(self.dir.join(format!("{}.lock", key))).ok()?;
        let fd = std::os::unix::io::AsRawFd::as_raw_fd(&f);
        let deadline = Instant::now() + wait;
        loop {
            // SAFETY: flock(2) on an fd this File owns
            if unsafe { libc::flock(fd, libc::LOCK_EX | libc::LOCK_NB) } == 0 {
                return Some(Lock(f));
            }
            if Instant::now() >= deadline {
                return None;
            }
            std::thread::sleep(Duration::from_millis(25));
        }
    }

    /// `key`'s tools: the cached list, else `list` (which starts the
    /// server, lists and stops it) under the key's lock, written for the
    /// next sessions. A bridge that waited `wait` for another one's list
    /// gives up on that server.
    pub fn tools_of(&self, key: &str, wait: Duration, list: impl FnOnce() -> Result<Listed, String>) -> Result<Listed, String> {
        if let Some(t) = self.read(key, SystemTime::now()) {
            return Ok(t);
        }
        let Some(_lock) = self.lock(key, wait) else {
            return Err(format!("another session is listing its tools; gave up after {}s", wait.as_secs()));
        };
        if let Some(t) = self.read(key, SystemTime::now()) {
            return Ok(t);
        }
        let listed = list()?;
        self.write(key, &listed, SystemTime::now());
        Ok(listed)
    }
}

#[cfg(test)]
#[path = "tools_cache_tests.rs"]
mod tests;
