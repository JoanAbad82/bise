//! Lazy stdio servers: the shared cache of each stdio plugin server's
//! `tools/list`, so a session's bridge lists a server's tools without
//! starting it. The bridge starts a server on its first call and stops it
//! after [`IDLE_STOP`] with no call; the next call starts it again. A
//! server that holds state between calls loses it after 10 idle minutes.
//!
//! One file per server spec in `Home::mcp_tools_cache()`, shared by every
//! session: `<key>.json` = `{"at": <unix s>, "tools": [...], "init": {...}}`
//! (its `tools/list` and its `initialize` result, which the bridge answers
//! for a server not running), written atomically (tmp + rename).
//!
//! The key ([`key`]) is what can change a server's list (architect,
//! t_40590): the plugin, the server id, its command, args, cwd, the
//! mtimes of the plugin's mcp.json and plugin.json, our `initialize`
//! params (`crate::stdio::init_params`), and a keyed hash ([`env_mac`],
//! HMAC-SHA256 with a per-home salt, [`salt`] at
//! `Home::mcp_tools_salt()`) of the env the server starts with: each
//! declared env value resolved as the start does (`crate::secrets::lookup`)
//! and the inherited env ([`inherited`]), minus bise's internal and test
//! names, the per-agent temp names (`bise_home::env::PER_CHILD_NAMES`) and
//! [`SHELL_NAMES`]. So a token or a `GITHUB_TOOLSETS` from the hub's env is
//! in it, and every agent of one hub shares one key. A value is never
//! stored or logged: only the hash.
//!
//! What writes the cache (rule 1): only a cold list, i.e. the launch's
//! start-list-stop ([`Cache::tools_of`]) or a real start's `tools/list`
//! taken before its first call is forwarded. A list after
//! `list_changed` or after a call can be the session's own (FastMCP
//! `enable_components`, the TS SDK's enable/disable): it updates that
//! session's index only. A server's "unknown tool" (rule 3, the typed
//! code -32602, [`UNKNOWN_TOOL`]) relists once for the session; the entry
//! is dropped ([`Cache::remove`]) when the called tool is missing from
//! the fresh list, so the next cold start writes it again.
//!
//! A list older than [`TTL`] is a miss, so the next session starts the
//! server once to refresh it. A cold key is filled by one bridge under a
//! flock on `<key>.lock` ([`Cache::tools_of`]); the others wait at most
//! the server's startup timeout, then read what it wrote, or give up on
//! that server (never holding their REPL's ready longer).
//!
//! Later, not built (rule 4, docs/plugins.md): one server per hub shared
//! by the sessions, keyed by this key; shareable only when it sends no
//! `list_changed` after a call, and the host forwards a `list_changed` to
//! every bridge it serves.

use std::ffi::OsString;
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

/// The code of a server's "unknown tool" answer to `tools/call` (MCP:
/// InvalidParams; a bad argument too, hence the relist decides).
pub const UNKNOWN_TOOL: i64 = -32602;

/// Set by `/bin/sh`, which starts the bridge (bend/runtime/plugins.bend),
/// not by bise or him: left out of the key (the server's cwd is in it).
pub const SHELL_NAMES: &[&str] = &["PWD", "OLDPWD", "SHLVL", "_"];

/// Where the cache lives: its dir and its salt (`Home::mcp_tools_cache`,
/// `Home::mcp_tools_salt`).
#[derive(Clone, Debug)]
pub struct Place {
    pub dir: PathBuf,
    pub salt: PathBuf,
}

impl Place {
    pub fn of(home: &bise_home::Home) -> Place {
        Place { dir: home.mcp_tools_cache(), salt: home.mcp_tools_salt() }
    }
}

/// The per-home salt at `path`: read, or made on first use (32 random
/// bytes, 0600, linked in place so two bridges never write two). None:
/// unreadable, then nothing is cached.
pub fn salt(path: &Path) -> Option<Vec<u8>> {
    if let Ok(b) = std::fs::read(path) {
        if b.len() == 32 {
            return Some(b);
        }
    }
    let mut b = [0u8; 32];
    ring::rand::SecureRandom::fill(&ring::rand::SystemRandom::new(), &mut b).ok()?;
    std::fs::create_dir_all(path.parent()?).ok()?;
    let tmp = path.with_extension(format!("{}.tmp", std::process::id()));
    {
        use std::io::Write;
        use std::os::unix::fs::OpenOptionsExt;
        let mut f = std::fs::OpenOptions::new().write(true).create(true).truncate(true).mode(0o600).open(&tmp).ok()?;
        f.write_all(&b).ok()?;
    }
    // a link fails when another bridge made it first: read that one
    let _ = std::fs::hard_link(&tmp, path);
    let _ = std::fs::remove_file(&tmp);
    std::fs::read(path).ok().filter(|b| b.len() == 32)
}

/// The inherited env that goes in the key: `vars` (the bridge's own,
/// `std::env::vars_os()`) minus bise's internal and test names, the
/// per-agent temp names and [`SHELL_NAMES`], sorted.
pub fn inherited(vars: impl IntoIterator<Item = (OsString, OsString)>) -> Vec<(String, String)> {
    use bise_home::env::{kind, Kind, PER_CHILD_NAMES};
    let mut out: Vec<(String, String)> = vars
        .into_iter()
        .map(|(k, v)| (k.to_string_lossy().into_owned(), v.to_string_lossy().into_owned()))
        .filter(|(k, _)| {
            !matches!(kind(k), Some(Kind::Internal | Kind::Test)) && !PER_CHILD_NAMES.contains(&k.as_str()) && !SHELL_NAMES.contains(&k.as_str())
        })
        .collect();
    out.sort();
    out
}

/// `s`'s declared env as its start resolves it (`vars`: the bridge's
/// `crate::secrets::lookup`); None: a `${VAR}` with no value.
pub fn declared(s: &StdioServer, vars: &dyn Fn(&str) -> Option<String>) -> Vec<(String, Option<String>)> {
    let mut out: Vec<(String, Option<String>)> = s.env.iter().map(|(k, v)| (k.clone(), crate::resolve::expand_env(v, vars).ok())).collect();
    out.sort();
    out
}

/// The keyed hash of a server's env ([`declared`], [`inherited`]) with
/// the per-home `salt`: hex, never a value.
pub fn env_mac(salt: &[u8], declared: &[(String, Option<String>)], inherited: &[(String, String)]) -> String {
    let k = ring::hmac::Key::new(ring::hmac::HMAC_SHA256, salt);
    let mut ctx = ring::hmac::Context::with_key(&k);
    for (name, v) in declared {
        ctx.update(b"d\0");
        ctx.update(name.as_bytes());
        match v {
            Some(v) => {
                ctx.update(b"\0=");
                ctx.update(v.as_bytes());
            }
            None => ctx.update(b"\0!"),
        }
        ctx.update(b"\0");
    }
    for (name, v) in inherited {
        ctx.update(b"i\0");
        ctx.update(name.as_bytes());
        ctx.update(b"\0=");
        ctx.update(v.as_bytes());
        ctx.update(b"\0");
    }
    hex(&ctx.sign().as_ref()[..16])
}

fn hex(b: &[u8]) -> String {
    b.iter().map(|b| format!("{:02x}", b)).collect()
}

/// The cache key of one stdio server of the plugin at `root`; `env`: its
/// [`env_mac`].
pub fn key(plugin: &str, root: &Path, s: &StdioServer, env: &str) -> String {
    let material = [
        plugin.to_string(),
        s.id.clone(),
        s.command.clone(),
        s.args.join("\u{1}"),
        s.cwd.display().to_string(),
        env.to_string(),
        crate::stdio::init_params().to_string(),
        mtime_ns(&root.join("mcp.json")).to_string(),
        mtime_ns(&root.join("plugin.json")).to_string(),
    ]
    .join("\u{0}");
    let d = ring::digest::digest(&ring::digest::SHA256, material.as_bytes());
    hex(&d.as_ref()[..16])
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

    /// Drop `key`'s list (a stale one: rule 3); the next cold start
    /// lists it again.
    pub fn remove(&self, key: &str) {
        let _ = std::fs::remove_file(self.file(key));
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
