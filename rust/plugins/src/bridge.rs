//! The per-session bridge (`bise plugins serve`): the session's one tool
//! index and its plugins' MCP servers. It starts the servers of the
//! plugins that are on, writes `D/mcp-index.txt` (the only tool index the
//! Bend REPL reads: the plugins' tools, then his Mistral connectors',
//! minus the ones turned off), `D/skills-index.txt` and `D/report.txt`,
//! then serves each server over loopback HTTP (the JSON-response subset of
//! MCP Streamable HTTP) until the REPL is gone, with no server too.
//!
//! Every [`POLL`] it reads `plugins.json` ([`state::read`]), the plugin
//! roots' fingerprint and the connectors' catalog ([`shared_catalog`], the
//! cache every session shares): a change re-resolves the plugins, starts
//! the servers on now and not running (turned on, added to an mcp.json),
//! stops the ones off or gone (a call in flight finishes first, at most
//! [`STOP_GRACE`]) and rewrites the index. A tool or server toggle never
//! relaunches the REPL. A call to a tool turned off is refused with
//! [`off_error`]'s words, plugins.json read at the call.
//!
//! A `${VAR}` of a server's env or headers that the env lacks is read from
//! his MCP secrets for that plugin (`crate::secrets`,
//! `Home::mcp_secrets_dir`). Design: docs/plugins.md.

use std::collections::HashMap;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{channel, Receiver, Sender};
use std::sync::{Arc, Condvar, Mutex, MutexGuard, RwLock, TryLockError};
use std::time::{Duration, Instant, SystemTime};

use serde_json::{json, Value};

use crate::connectors::{self, Catalog};
use crate::id::{PartKind, PluginId};
use crate::model::StateV2;
use crate::remote::{Fail, OnChange, Remote};
use crate::report::{self, ServerStatus};
use crate::resolve::{self, Diagnostic, HttpServer, Resolution, Severity, StdioServer};
use crate::state;
use crate::status;
use crate::stdio::Client;

/// A server's start, handshake and first tools/list when its mcp.json
/// says nothing (`startup_timeout_sec`): Codex's 30 s (a first `npx`
/// download, a remote server's TLS).
pub const START_TIMEOUT: Duration = Duration::from_secs(30);
/// One call when mcp.json says nothing (`tool_timeout_sec`): Codex's
/// 300 s.
pub const CALL_TIMEOUT: Duration = Duration::from_secs(300);
/// The index files are written (and `ready` touched) once every server
/// is up or after this long: the REPL waits 15 s for them. A server
/// still starting then joins the index when it is up.
pub const READY_WAIT: Duration = Duration::from_secs(12);
/// How often the bridge reads plugins.json, the roots and the catalog.
pub const POLL: Duration = Duration::from_secs(2);
/// A server turned off finishes the call in flight for at most this
/// long; then it is stopped.
pub const STOP_GRACE: Duration = Duration::from_secs(10);

/// His connectors' catalog at a time (ms since the epoch); `None`:
/// nothing new since the last call. [`shared_catalog`], or a test's fake.
pub type CatalogSource = Arc<dyn Fn(u64) -> Option<Catalog> + Send + Sync>;

pub struct Opts {
    /// the session's plugin dir (index files, logs, ready marker)
    pub dir: PathBuf,
    /// exit when this pid is gone (the REPL)
    pub parent: Option<u32>,
    /// the plugin roots; their `state` is read again from `state_path`
    pub roots: resolve::Roots,
    /// plugins.json ([`state::state_path`]), read at start, every
    /// [`POLL`] and at each call; None: `roots.state` for good
    pub state_path: Option<PathBuf>,
    /// his Mistral connectors; None: none in the index
    pub catalog: Option<CatalogSource>,
    /// where each remote server's last state goes for `/plugins`
    /// (`status::dir()`); None: nowhere
    pub status_dir: Option<PathBuf>,
    /// the OAuth store (`oauth::store_dir()`); None: no login
    pub secrets_dir: Option<PathBuf>,
    /// the values he typed in for `${VAR}` (`Home::mcp_secrets_dir`);
    /// None: the env only
    pub env_dir: Option<PathBuf>,
    /// how long the index files wait for the servers ([`READY_WAIT`])
    pub ready_wait: Duration,
    /// [`POLL`]
    pub poll: Duration,
    /// [`STOP_GRACE`]
    pub grace: Duration,
}

impl Opts {
    /// A session's bridge with the standard timings and no connector,
    /// status, login or secret (tests set what they need).
    pub fn new(dir: PathBuf, parent: Option<u32>, roots: resolve::Roots) -> Opts {
        Opts {
            dir,
            parent,
            roots,
            state_path: None,
            catalog: None,
            status_dir: None,
            secrets_dir: None,
            env_dir: None,
            ready_wait: READY_WAIT,
            poll: POLL,
            grace: STOP_GRACE,
        }
    }
}

/// What an agent reads when it calls a tool turned off.
pub fn off_error(tool: &str) -> String {
    format!("{} is turned off in plugins", tool)
}

/// What an agent reads when a server wants a login (the designer's words).
pub fn login_error(server: &str) -> String {
    format!("{} needs the user to log in (/plugins login). tell them, or go on without it.", server)
}

/// The connectors from the cache every session shares
/// (`Home::connectors_cache`): loaded ([`connectors::load`], which
/// fetches a stale one under the cache's lock) when the file moved or its
/// catalog is past [`connectors::TTL_MS`]; else nothing new, and no parse.
pub fn shared_catalog(cache: PathBuf) -> CatalogSource {
    let seen: Mutex<Option<(Option<SystemTime>, u64)>> = Mutex::new(None);
    Arc::new(move |now| {
        let mut seen = lock(&seen);
        let m = mtime(&cache);
        if let Some((at, fetched)) = *seen {
            if m.is_some() && at == m && now < fetched.saturating_add(connectors::TTL_MS) {
                return None;
            }
        }
        let c = connectors::load(&cache, &connectors::key(), now, false);
        *seen = Some((mtime(&cache), c.fetched_ms));
        Some(c)
    })
}

fn lock<T>(m: &Mutex<T>) -> MutexGuard<'_, T> {
    m.lock().unwrap_or_else(|e| e.into_inner())
}

fn now_ms() -> u64 {
    SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0)
}

fn mtime(p: &Path) -> Option<SystemTime> {
    std::fs::metadata(p).and_then(|m| m.modified()).ok()
}

/// A server of a plugin, as mcp.json declares it.
#[derive(Clone, PartialEq)]
enum Spec {
    Stdio(StdioServer),
    Http(HttpServer),
}

impl Spec {
    fn id(&self) -> &str {
        match self {
            Spec::Stdio(s) => &s.id,
            Spec::Http(s) => &s.id,
        }
    }

    fn limits(&self) -> &resolve::Limits {
        match self {
            Spec::Stdio(s) => &s.limits,
            Spec::Http(s) => &s.limits,
        }
    }

    fn startup_timeout(&self) -> Duration {
        self.limits().startup_timeout.unwrap_or(START_TIMEOUT)
    }

    fn call_timeout(&self) -> Duration {
        self.limits().tool_timeout.unwrap_or(CALL_TIMEOUT)
    }
}

/// A started server.
enum Conn {
    Stdio(Client),
    Remote(Remote),
}

impl Conn {
    fn init(&self) -> Value {
        match self {
            Conn::Stdio(c) => c.init.clone(),
            Conn::Remote(r) => r.init(),
        }
    }

    /// A local process can die; a remote client reconnects by itself.
    fn alive(&mut self) -> bool {
        match self {
            Conn::Stdio(c) => c.alive(),
            Conn::Remote(_) => true,
        }
    }

    fn pid(&self) -> Option<u32> {
        match self {
            Conn::Stdio(c) => Some(c.pid()),
            Conn::Remote(_) => None,
        }
    }

    fn request_raw(&self, method: &str, params: Value, timeout: Duration) -> Result<Value, Fail> {
        match self {
            Conn::Stdio(c) => c.request_raw(method, params, timeout).map_err(Fail::Other),
            Conn::Remote(r) => r.request_raw(method, params, timeout),
        }
    }

    fn list_tools(&self, timeout: Duration) -> Result<Vec<Value>, String> {
        match self {
            Conn::Stdio(c) => c.list_tools(timeout),
            Conn::Remote(r) => r.list_tools(timeout).map_err(|e| e.to_string()),
        }
    }

    fn stop(&mut self) {
        match self {
            Conn::Stdio(c) => c.stop(),
            Conn::Remote(r) => r.stop(),
        }
    }
}

/// Where a server's start is.
#[derive(Clone, Debug, PartialEq)]
enum Outcome {
    Starting,
    Up,
    /// a remote server that wants a login: kept without tools, a login
    /// (any session's) brings it up
    Login,
    Failed(String),
}

/// `${VAR}` in a server's env and headers: the env's value, else the one
/// he typed in for this plugin (`crate::secrets`, read once, at the first
/// variable the env lacks; a locked keychain reads as none).
fn env_lookup(plugin: &str, dir: Option<&Path>) -> impl Fn(&str) -> Option<String> {
    let (id, dir) = (PluginId::plugin(plugin), dir.map(Path::to_path_buf));
    let saved = std::cell::OnceCell::new();
    move |k: &str| {
        std::env::var(k).ok().filter(|v| !v.is_empty()).or_else(|| {
            saved
                .get_or_init(|| dir.as_deref().and_then(|d| crate::secrets::read(d, &id).ok()).unwrap_or_default())
                .get(k)
                .cloned()
        })
    }
}

/// One server of one plugin, as the bridge holds it.
struct Entry {
    /// `<plugin>/<server>`
    key: String,
    plugin_name: String,
    namespace: String,
    spec: Spec,
    plugin_root: PathBuf,
    data_root: PathBuf,
    log: PathBuf,
    on_change: OnChange,
    secrets: Option<PathBuf>,
    env_dir: Option<PathBuf>,
    /// where its state for `/plugins` goes
    status_dir: Option<PathBuf>,
    /// a remote server that wants a login: its store file and the
    /// mtime last seen (a change means a login happened)
    login: Mutex<Option<(PathBuf, Option<SystemTime>)>>,
    client: Mutex<Option<Conn>>,
    /// a stdio server's process: killed when it is turned off and a call
    /// holds it past the grace
    pid: Mutex<Option<u32>>,
    outcome: Mutex<Outcome>,
    /// turned off, or gone from its mcp.json: refuses calls, then stops
    off: AtomicBool,
    /// the server's tools as it listed them
    tools: Mutex<Vec<Value>>,
    /// published tool name -> the server's own name
    names: Mutex<HashMap<String, String>>,
}

impl Entry {
    fn owner(&self) -> PluginId {
        PluginId::plugin(self.plugin_name.as_str())
    }

    fn server_id(&self) -> PluginId {
        self.owner().part(PartKind::Mcp, None, self.spec.id())
    }

    fn tool_id(&self, src: &str) -> PluginId {
        self.owner().part(PartKind::Tool, Some(self.spec.id()), src)
    }

    fn start(&self) -> Result<Conn, Fail> {
        let env = env_lookup(&self.plugin_name, self.env_dir.as_deref());
        match &self.spec {
            Spec::Stdio(s) => Client::start(s, &self.plugin_root, &self.data_root, &self.log, self.spec.startup_timeout(), Some(self.on_change.clone()), &env)
                .map(Conn::Stdio)
                .map_err(Fail::Other),
            Spec::Http(s) => Remote::start_with(s, &env, self.secrets.as_deref(), self.on_change.clone(), self.spec.startup_timeout()).map(Conn::Remote),
        }
    }

    /// The store file of a remote server that may log in.
    fn login_file(&self) -> Option<PathBuf> {
        let (Spec::Http(s), Some(d)) = (&self.spec, self.secrets.as_deref()) else { return None };
        let env = env_lookup(&self.plugin_name, self.env_dir.as_deref());
        let (url, _) = crate::remote::target(s, &env).ok()?;
        s.may_login().then(|| crate::oauth::file_of(d, &crate::oauth::resource_of(&url)))
    }

    fn put(&self, c: Conn) {
        *lock(&self.pid) = c.pid();
        *lock(&self.client) = Some(c);
    }

    /// A remote server's state for `/plugins`.
    fn status(&self, tools: Result<usize, String>) {
        let Some(d) = self.status_dir.as_deref() else { return };
        let (transport, host) = match &self.spec {
            Spec::Http(s) => (s.transport.as_str().to_string(), s.host()),
            // a stdio server: its command's name only, never its args
            Spec::Stdio(s) => ("stdio".to_string(), Path::new(&s.command).file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default()),
        };
        // every tool its mcp.json allows, on or off (the Plugins list's
        // switches); none when it is not up
        let listed = match tools {
            Ok(_) => lock(&self.tools)
                .iter()
                .filter_map(|t| {
                    let name = t.get("name").and_then(Value::as_str)?;
                    let desc = t.get("description").and_then(Value::as_str).unwrap_or("");
                    self.spec.limits().allows(name).then(|| (name.to_string(), desc.to_string()))
                })
                .collect(),
            Err(_) => Vec::new(),
        };
        status::write(d, &self.plugin_name, self.spec.id(), &status::Status::now(&transport, &host, tools).listed(listed));
    }

    fn login_status(&self) {
        if let (Some(d), Spec::Http(s)) = (self.status_dir.as_deref(), &self.spec) {
            status::write(d, &self.plugin_name, &s.id, &status::Status::login_needed(s.transport.as_str(), &s.host()));
        }
    }

    /// Forward one JSON-RPC request; a dead local server is restarted
    /// once. `state`: plugins.json now.
    fn forward(&self, method: &str, mut params: Value, state: &StateV2) -> Result<Value, String> {
        let mut shown = self.spec.id().to_string();
        let mut tool = None;
        if method == "tools/call" {
            let published = params.get("name").and_then(Value::as_str).unwrap_or("").to_string();
            if let Some(src) = lock(&self.names).get(&published) {
                params["name"] = json!(src);
            }
            let src = params.get("name").and_then(Value::as_str).unwrap_or("").to_string();
            // enabled_tools / disabled_tools: a tool left out is not
            // callable either
            if !self.spec.limits().allows(&src) {
                return Err(format!("{} is turned off in {}'s mcp.json", published, self.spec.id()));
            }
            shown = format!("{}.{}", self.namespace, published);
            tool = Some(src);
        }
        let off = |s: &StateV2| {
            self.off.load(Ordering::SeqCst) || !s.is_on(&self.server_id(), false) || tool.as_deref().is_some_and(|t| !s.is_on(&self.tool_id(t), false))
        };
        if off(state) {
            return Err(off_error(&shown));
        }
        if *lock(&self.outcome) == Outcome::Starting {
            return Err(format!("{} is still starting: try again in a moment", self.spec.id()));
        }
        let mut guard = lock(&self.client);
        // turned off while this call waited for the one before
        if self.off.load(Ordering::SeqCst) {
            return Err(off_error(&shown));
        }
        let dead = match guard.as_mut() {
            Some(c) => !c.alive(),
            None => true,
        };
        let id = self.spec.id().to_string();
        let said = |e: Fail| match e {
            Fail::Auth { .. } => login_error(&id),
            Fail::Locked { .. } => crate::remote::locked_line(&id),
            // a step-up: the login again, with more scopes (kept in the
            // store); /plugins says it needs a login
            Fail::Scope { .. } => {
                self.login_status();
                login_error(&id)
            }
            e => e.to_string(),
        };
        if dead {
            let c = self.start().map_err(said)?;
            *lock(&self.pid) = c.pid();
            *guard = Some(c);
        }
        let c = guard.as_ref().ok_or("no server")?;
        c.request_raw(method, params, self.spec.call_timeout()).map_err(said)
    }

    /// Turned off or gone: refuse new calls at once, let the call in
    /// flight finish for at most `grace`, then stop the server (a stdio
    /// one still held is killed).
    fn retire(self: Arc<Self>, grace: Duration) {
        self.off.store(true, Ordering::SeqCst);
        std::thread::spawn(move || {
            let deadline = Instant::now() + grace;
            loop {
                let got = match self.client.try_lock() {
                    Ok(g) => Some(g),
                    Err(TryLockError::Poisoned(p)) => Some(p.into_inner()),
                    Err(TryLockError::WouldBlock) => None,
                };
                if let Some(mut g) = got {
                    if let Some(mut c) = g.take() {
                        c.stop();
                    }
                    return;
                }
                if Instant::now() >= deadline {
                    if let Some(pid) = *lock(&self.pid) {
                        // SAFETY: kill(2) on the pid of a child this bridge started
                        unsafe { libc::kill(pid as i32, libc::SIGKILL) };
                    }
                    return;
                }
                std::thread::sleep(Duration::from_millis(50));
            }
        });
    }
}

fn token() -> String {
    let mut b = [0u8; 16];
    let ok = std::fs::File::open("/dev/urandom").and_then(|mut f| f.read_exact(&mut b)).is_ok();
    if !ok {
        let t = SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0)
            ^ (std::process::id() as u128) << 64;
        b = t.to_le_bytes();
    }
    b.iter().map(|x| format!("{:02x}", x)).collect()
}

/// Descriptions and schemas ride on one index line.
fn flat(s: &str) -> String {
    s.chars().map(|c| if c == '\n' || c == '\r' { ' ' } else { c }).collect()
}

/// The connector index format: `<cid> <group> <tool> : #<desc> | input: <schema>`
pub fn index_line(cid: &str, group: &str, tool: &str, desc: &str, schema: Option<&Value>) -> String {
    let schema = schema.map(|s| format!(" | input: {}", flat(&s.to_string()))).unwrap_or_default();
    format!("{} {} {} : #{}{}\n", cid, group, tool, flat(desc), schema)
}

/// The index lines of every entry's tools that are on in `state`, in
/// order; sets each entry's published names (every allowed tool, on or
/// off: a call to an off one is refused by its own name). Two tools of
/// one plugin with one name: the later is dropped (a diagnostic).
fn index_of(entries: &[Arc<Entry>], base: &str, state: &StateV2) -> (String, Vec<Diagnostic>, HashMap<String, usize>) {
    let mut index = String::new();
    let mut diags = Vec::new();
    let mut counts = HashMap::new();
    let mut taken: HashMap<&str, Vec<String>> = HashMap::new();
    for e in entries.iter().filter(|e| !e.off.load(Ordering::SeqCst)) {
        let cid = format!("{}/{}", base, e.key);
        let mut names = HashMap::new();
        let mut shown = 0;
        let used = taken.entry(e.plugin_name.as_str()).or_default();
        for t in lock(&e.tools).iter() {
            let Some(src) = t.get("name").and_then(Value::as_str) else { continue };
            if !e.spec.limits().allows(src) {
                continue;
            }
            let published = resolve::identifier(src);
            if used.contains(&published) {
                diags.push(Diagnostic {
                    code: "plugin.tool.name_collision",
                    severity: Severity::Warning,
                    plugin: e.plugin_name.clone(),
                    message: format!("tool {}.{} (server {:?}) is already taken; dropped", e.namespace, published, e.spec.id()),
                });
                continue;
            }
            used.push(published.clone());
            if state.is_on(&e.tool_id(src), false) {
                let desc = t.get("description").and_then(Value::as_str).unwrap_or("");
                index.push_str(&index_line(&cid, &e.namespace, &published, desc, t.get("inputSchema")));
                shown += 1;
            }
            names.insert(published, src.to_string());
        }
        counts.insert(e.key.clone(), shown);
        *lock(&e.names) = names;
    }
    (index, diags, counts)
}

/// The bridge's shared state: its servers, plugins.json and the catalog
/// as last read, and what it last wrote.
struct Live {
    dir: PathBuf,
    /// `http://127.0.0.1:<port>/<token>`
    base: String,
    roots: resolve::Roots,
    state_path: Option<PathBuf>,
    grace: Duration,
    status_dir: Option<PathBuf>,
    secrets_dir: Option<PathBuf>,
    env_dir: Option<PathBuf>,
    /// `<plugin>/<server>` when a server says its tools changed, or a
    /// login or a late start brought it up
    changed: Sender<String>,
    entries: RwLock<Vec<Arc<Entry>>>,
    state: RwLock<StateV2>,
    res: Mutex<Resolution>,
    catalog: Mutex<Catalog>,
    /// the index and report last written (the files are written on a
    /// change only, once `ready`)
    written: Mutex<(String, String)>,
    ready: AtomicBool,
    stop: AtomicBool,
    /// a start or the first catalog load is done (the ready wait)
    done: (Mutex<()>, Condvar),
}

impl Live {
    fn entries(&self) -> Vec<Arc<Entry>> {
        self.entries.read().unwrap_or_else(|e| e.into_inner()).clone()
    }

    fn state(&self) -> StateV2 {
        self.state.read().unwrap_or_else(|e| e.into_inner()).clone()
    }

    /// plugins.json now: what a call is checked against.
    fn state_now(&self) -> StateV2 {
        match &self.state_path {
            Some(p) => state::read(p),
            None => self.state(),
        }
    }

    fn signal(&self) {
        let _g = lock(&self.done.0);
        self.done.1.notify_all();
    }

    /// The servers of `res` (its loaded plugins, its on servers), in its
    /// order: the ones already running with the same spec are kept, the
    /// new ones start, the ones gone or changed are retired.
    fn apply(self: &Arc<Self>, res: Resolution) {
        let old = self.entries();
        let mut next: Vec<Arc<Entry>> = Vec::new();
        for p in res.loaded() {
            let specs = p.servers.iter().cloned().map(Spec::Stdio).chain(p.remotes.iter().cloned().map(Spec::Http));
            for spec in specs {
                let key = format!("{}/{}", p.name, spec.id());
                let same = old.iter().find(|e| e.key == key && e.spec == spec && e.plugin_root == p.root && !e.off.load(Ordering::SeqCst));
                if let Some(e) = same {
                    next.push(e.clone());
                    continue;
                }
                let tx = Mutex::new(self.changed.clone());
                let k = key.clone();
                let on_change: OnChange = Arc::new(move || {
                    let _ = lock(&tx).send(k.clone());
                });
                let e = Arc::new(Entry {
                    log: self.dir.join(format!("{}.{}.log", p.name, spec.id())),
                    key,
                    plugin_name: p.name.clone(),
                    namespace: p.namespace.clone(),
                    spec,
                    plugin_root: p.root.clone(),
                    data_root: p.data_root.clone(),
                    on_change,
                    secrets: self.secrets_dir.clone(),
                    env_dir: self.env_dir.clone(),
                    status_dir: self.status_dir.clone(),
                    login: Mutex::new(None),
                    client: Mutex::new(None),
                    pid: Mutex::new(None),
                    outcome: Mutex::new(Outcome::Starting),
                    off: AtomicBool::new(false),
                    tools: Mutex::new(Vec::new()),
                    names: Mutex::new(HashMap::new()),
                });
                launch(self.clone(), e.clone());
                next.push(e);
            }
        }
        for e in old {
            if !next.iter().any(|n| Arc::ptr_eq(n, &e)) {
                e.retire(self.grace);
            }
        }
        *self.entries.write().unwrap_or_else(|e| e.into_inner()) = next;
        *lock(&self.res) = res;
    }

    /// The index and the report as they are now.
    fn files(&self) -> (String, String) {
        let entries = self.entries();
        let state = self.state();
        let (mut index, diags, counts) = index_of(&entries, &self.base, &state);
        for l in connectors::index_lines(&lock(&self.catalog), &state) {
            index.push_str(&l);
            index.push('\n');
        }
        let mut res = lock(&self.res).clone();
        let mut status: Vec<ServerStatus> = Vec::new();
        for e in entries.iter() {
            let tools = match lock(&e.outcome).clone() {
                Outcome::Up => Ok(counts.get(&e.key).copied().unwrap_or(0)),
                Outcome::Starting => Err("still starting".to_string()),
                Outcome::Login => {
                    res.diagnostics.push(Diagnostic {
                        code: "plugin.mcp.login_needed",
                        severity: Severity::Info,
                        plugin: e.plugin_name.clone(),
                        message: format!("MCP server {:?} needs a login: /plugins login", e.spec.id()),
                    });
                    Err("needs a login".to_string())
                }
                Outcome::Failed(why) => {
                    res.diagnostics.push(Diagnostic {
                        code: "plugin.mcp.connection_failed",
                        severity: Severity::Warning,
                        plugin: e.plugin_name.clone(),
                        message: format!("MCP server {:?}: {}", e.spec.id(), why),
                    });
                    Err(why)
                }
            };
            status.push(ServerStatus { plugin: e.plugin_name.clone(), server: e.spec.id().to_string(), tools });
        }
        res.diagnostics.extend(diags);
        status.sort_by(|a, b| (&a.plugin, &a.server).cmp(&(&b.plugin, &b.server)));
        (index, report::text(&res, Some(&status)))
    }

    /// Write the index and the report when they changed (once ready).
    fn publish(&self) {
        if !self.ready.load(Ordering::SeqCst) {
            return;
        }
        let (index, report) = self.files();
        let mut w = lock(&self.written);
        if w.0 != index && write_atomic(&self.dir.join("mcp-index.txt"), &index).is_ok() {
            w.0 = index;
        }
        if w.1 != report && write_atomic(&self.dir.join("report.txt"), &report).is_ok() {
            w.1 = report;
        }
    }
}

/// Start `e` in its own thread: up, it joins the index (its tools
/// listed); a login wanted or a failure is said in `/plugins`.
fn launch(live: Arc<Live>, e: Arc<Entry>) {
    std::thread::spawn(move || {
        let timeout = e.spec.startup_timeout();
        let result = e
            .start()
            .map_err(|f| {
                let login = matches!(f, Fail::Auth { .. } | Fail::Scope { .. }) && e.login_file().is_some();
                let why = if matches!(f, Fail::Locked { .. }) { crate::remote::locked_line(e.spec.id()) } else { f.to_string() };
                (why, login)
            })
            .and_then(|c| match c.list_tools(timeout) {
                Ok(ts) => Ok((c, ts)),
                Err(err) => Err((format!("tools/list: {}", err), false)),
            });
        let result = result.map_err(|(why, login)| {
            if matches!(e.spec, Spec::Http(_)) {
                return (why, login);
            }
            let tail = std::fs::read_to_string(&e.log).unwrap_or_default();
            let tail: Vec<&str> = tail.lines().rev().take(3).collect();
            if tail.is_empty() {
                (why, login)
            } else {
                let t: Vec<&str> = tail.into_iter().rev().collect();
                (format!("{} (stderr: {})", why, t.join(" | ")), login)
            }
        });
        match result {
            Ok((mut c, tools)) => {
                if e.off.load(Ordering::SeqCst) {
                    // turned off while it started
                    c.stop();
                } else {
                    *lock(&e.tools) = tools;
                    e.put(c);
                    *lock(&e.outcome) = Outcome::Up;
                }
            }
            Err((why, true)) => {
                *lock(&e.login) = e.login_file().map(|f| {
                    let m = mtime(&f);
                    (f, m)
                });
                *lock(&e.outcome) = Outcome::Login;
                e.login_status();
                eprintln!("MCP server {:?} of {}: {}", e.spec.id(), e.plugin_name, why);
            }
            Err((why, false)) => {
                e.status(Err(why.clone()));
                eprintln!("MCP server {:?} of {}: {}", e.spec.id(), e.plugin_name, why);
                *lock(&e.outcome) = Outcome::Failed(why);
            }
        }
        live.signal();
        if live.ready.load(Ordering::SeqCst) {
            live.publish();
            if *lock(&e.outcome) == Outcome::Up {
                let counts = index_of(&live.entries(), &live.base, &live.state()).2;
                e.status(Ok(counts.get(&e.key).copied().unwrap_or(0)));
            }
        }
    });
}

/// `notifications/tools/list_changed`, or a login: list that server's
/// tools again (connect it first after a login) and rewrite the index
/// (the REPL reads it at each search and call).
fn refresh_loop(rx: Receiver<String>, live: Arc<Live>) {
    while let Ok(first) = rx.recv() {
        if live.stop.load(Ordering::SeqCst) {
            return;
        }
        // a burst of notifications is one refresh
        std::thread::sleep(Duration::from_millis(100));
        let mut keys = vec![first];
        keys.extend(rx.try_iter());
        keys.sort();
        keys.dedup();
        let entries = live.entries();
        for k in keys {
            let Some(e) = entries.iter().find(|e| e.key == k && !e.off.load(Ordering::SeqCst)) else { continue };
            if lock(&e.client).is_none() {
                // a login happened: connect now
                match e.start() {
                    Ok(c) => {
                        e.put(c);
                        *lock(&e.login) = None;
                        *lock(&e.outcome) = Outcome::Up;
                    }
                    Err(Fail::Auth { .. } | Fail::Scope { .. }) => continue,
                    Err(err) => {
                        e.status(Err(err.to_string()));
                        continue;
                    }
                }
            }
            let listed = {
                let guard = lock(&e.client);
                match guard.as_ref() {
                    Some(c) => c.list_tools(e.spec.startup_timeout()),
                    None => continue,
                }
            };
            match listed {
                Ok(ts) => *lock(&e.tools) = ts,
                Err(err) => e.status(Err(format!("tools/list: {}", err))),
            }
        }
        live.publish();
        let counts = index_of(&live.entries(), &live.base, &live.state()).2;
        for e in live.entries().iter().filter(|e| lock(&e.client).is_some()) {
            e.status(Ok(counts.get(&e.key).copied().unwrap_or(0)));
        }
    }
}

/// What the poll saw last.
struct Seen {
    state: StateV2,
    fingerprint: u64,
}

/// One poll: plugins.json and the roots moved: re-resolve, start and
/// stop servers; the catalog moved: new connector lines. Either: the
/// index again.
fn poll_once(live: &Arc<Live>, catalog: Option<&CatalogSource>, seen: &mut Seen) {
    let mut moved = false;
    if let Some(p) = &live.state_path {
        let mut roots = live.roots.clone();
        roots.state = state::read(p);
        let fp = resolve::fingerprint(&roots);
        if roots.state != seen.state || fp != seen.fingerprint {
            *live.state.write().unwrap_or_else(|e| e.into_inner()) = roots.state.clone();
            *seen = Seen { state: roots.state.clone(), fingerprint: fp };
            live.apply(resolve::resolve(&roots));
            moved = true;
        }
    }
    if let Some(c) = catalog.and_then(|src| src(now_ms())) {
        *lock(&live.catalog) = c;
        moved = true;
    }
    if moved {
        live.publish();
    }
}

// ---- HTTP ----

struct Request {
    method: String,
    path: String,
    body: Vec<u8>,
    close: bool,
}

fn read_request(r: &mut BufReader<TcpStream>) -> Option<Request> {
    let mut line = String::new();
    if r.read_line(&mut line).ok()? == 0 {
        return None;
    }
    let mut parts = line.split_whitespace();
    let method = parts.next()?.to_string();
    let path = parts.next()?.to_string();
    let mut len = 0usize;
    let mut close = false;
    loop {
        let mut h = String::new();
        if r.read_line(&mut h).ok()? == 0 {
            return None;
        }
        let h = h.trim_end();
        if h.is_empty() {
            break;
        }
        if let Some((k, v)) = h.split_once(':') {
            let k = k.trim().to_ascii_lowercase();
            if k == "content-length" {
                len = v.trim().parse().ok()?;
            } else if k == "connection" && v.trim().eq_ignore_ascii_case("close") {
                close = true;
            }
        }
    }
    let mut body = vec![0u8; len];
    r.read_exact(&mut body).ok()?;
    Some(Request { method, path, body, close })
}

fn respond(w: &mut TcpStream, status: &str, body: &str) -> std::io::Result<()> {
    let ctype = if body.is_empty() { "" } else { "Content-Type: application/json\r\n" };
    write!(w, "HTTP/1.1 {}\r\n{}Content-Length: {}\r\nConnection: keep-alive\r\n\r\n{}", status, ctype, body.len(), body)?;
    w.flush()
}

fn rpc_error(id: &Value, code: i64, message: &str) -> String {
    json!({"jsonrpc": "2.0", "id": id, "error": {"code": code, "message": message}}).to_string()
}

/// One JSON-RPC message for one server: (HTTP status, body).
fn handle_rpc(live: &Live, entry: &Entry, body: &[u8]) -> (&'static str, String) {
    let Ok(msg) = serde_json::from_slice::<Value>(body) else {
        return ("400 Bad Request", rpc_error(&Value::Null, -32700, "parse error"));
    };
    let Some(id) = msg.get("id").cloned() else {
        // a notification: accepted, nothing to answer
        return ("202 Accepted", String::new());
    };
    let method = msg.get("method").and_then(Value::as_str).unwrap_or("");
    if method == "initialize" {
        let init = lock(&entry.client).as_ref().map(Conn::init).unwrap_or_else(|| {
            json!({"protocolVersion": crate::stdio::PROTOCOL, "capabilities": {"tools": {}},
                   "serverInfo": {"name": "bend-plugin-bridge", "version": "1"}})
        });
        return ("200 OK", json!({"jsonrpc": "2.0", "id": id, "result": init}).to_string());
    }
    let params = msg.get("params").cloned().unwrap_or_else(|| json!({}));
    match entry.forward(method, params, &live.state_now()) {
        Ok(answer) => ("200 OK", stamp(answer, id)),
        Err(e) => ("200 OK", rpc_error(&id, -32000, &e)),
    }
}

/// The server's answer with the client's id: a JSON object gets `id`
/// and `jsonrpc`; anything else becomes an error answer (indexing a
/// non-object `Value` panics).
fn stamp(answer: Value, id: Value) -> String {
    match answer {
        Value::Object(mut o) => {
            o.insert("id".into(), id);
            o.insert("jsonrpc".into(), json!("2.0"));
            Value::Object(o).to_string()
        }
        other => rpc_error(&id, -32000, &format!("the plugin server answered a non-object: {}", other)),
    }
}

/// A server turned off keeps its URL until the REPL reads the new index:
/// its entry (retired) answers, by the off words; one never known is a 404.
fn connection(stream: TcpStream, token: String, live: Arc<Live>, retired: Arc<Mutex<Vec<Arc<Entry>>>>) {
    let Ok(mut w) = stream.try_clone() else { return };
    let mut r = BufReader::new(stream);
    while let Some(req) = read_request(&mut r) {
        let prefix = format!("/{}/", token);
        let key = req.path.strip_prefix(&prefix).map(|k| k.trim_end_matches('/').to_string());
        let find = |k: &str| live.entries().into_iter().find(|e| e.key == k).or_else(|| lock(&retired).iter().rev().find(|e| e.key == k).cloned());
        let out = match (req.method.as_str(), key.and_then(|k| find(&k))) {
            ("POST", Some(e)) => handle_rpc(&live, &e, &req.body),
            (_, Some(_)) => ("405 Method Not Allowed", String::new()),
            (_, None) => ("404 Not Found", String::new()),
        };
        if respond(&mut w, out.0, &out.1).is_err() || req.close {
            break;
        }
    }
}

/// The REPL the bridge serves (`--parent`), by pid and start time.
/// Bridges outlived their REPL (idle-exit audit: plugin servers whose
/// `--parent` was dead): a `kill -0` every 500 ms spawned a `kill` each
/// time (two a second per bridge) and took a pid the system had reused
/// for another process as the parent still alive. Now kill(2) without a
/// process, and every `IDENTITY_EVERY` the start time is compared too.
pub struct Parent {
    pid: u32,
    started: Option<String>,
}

/// How often the parent's start time is read again (one `ps`).
const IDENTITY_EVERY: u64 = 20;

impl Parent {
    pub fn new(pid: u32) -> Parent {
        Parent { pid, started: started(pid) }
    }

    /// `deep`: compare the start time too (a reused pid is not it).
    pub fn alive(&self, deep: bool) -> bool {
        let Ok(p) = i32::try_from(self.pid) else { return false };
        // SAFETY: kill(2) with signal 0 only checks; a positive pid
        if p <= 0 || unsafe { libc::kill(p, 0) } != 0 {
            return false;
        }
        !deep || self.started.is_none() || started(self.pid) == self.started
    }
}

/// A process's start time as `ps` says it (None: gone or unreadable).
fn started(pid: u32) -> Option<String> {
    let o = std::process::Command::new("ps")
        .args(["-p", &pid.to_string(), "-o", "lstart="])
        .stderr(std::process::Stdio::null())
        .output()
        .ok()?;
    let s = String::from_utf8_lossy(&o.stdout).trim().to_string();
    (!s.is_empty()).then_some(s)
}

fn write_atomic(path: &Path, text: &str) -> std::io::Result<()> {
    let tmp = path.with_extension("tmp");
    std::fs::write(&tmp, text)?;
    std::fs::rename(&tmp, path)
}

/// Run the bridge until the parent is gone (no parent: until the
/// process ends). The index files are written, and `ready` touched, once
/// every server is up and the catalog is read, or after `ready_wait`.
pub fn serve(opts: Opts) -> std::io::Result<()> {
    std::fs::create_dir_all(&opts.dir)?;
    let listener = TcpListener::bind(("127.0.0.1", 0))?;
    let port = listener.local_addr()?.port();
    let token = token();
    let mut roots = opts.roots.clone();
    if let Some(p) = &opts.state_path {
        roots.state = state::read(p);
    }
    let mut seen = Seen { state: roots.state.clone(), fingerprint: resolve::fingerprint(&roots) };
    let res = resolve::resolve(&roots);
    let (changed_tx, changed_rx) = channel();
    let live = Arc::new(Live {
        dir: opts.dir.clone(),
        base: format!("http://127.0.0.1:{}/{}", port, token),
        roots: opts.roots.clone(),
        state_path: opts.state_path.clone(),
        grace: opts.grace,
        status_dir: opts.status_dir.clone(),
        secrets_dir: opts.secrets_dir.clone(),
        env_dir: opts.env_dir.clone(),
        changed: changed_tx.clone(),
        entries: RwLock::new(Vec::new()),
        state: RwLock::new(roots.state.clone()),
        res: Mutex::new(Resolution::default()),
        catalog: Mutex::new(Catalog::default()),
        written: Mutex::new((String::new(), String::new())),
        ready: AtomicBool::new(false),
        stop: AtomicBool::new(false),
        done: (Mutex::new(()), Condvar::new()),
    });
    // the loose skill folders, scanned while the servers start
    let loose = std::thread::spawn(crate::skills::loose_on);
    let plugin_skills = crate::skills::of_plugins(res.loaded());
    live.apply(res);
    // the first catalog read (a stale cache is fetched: at most its 10 s)
    // runs while the servers start
    let catalog_read = Arc::new(AtomicBool::new(opts.catalog.is_none()));
    if let Some(src) = opts.catalog.clone() {
        let (live, read) = (live.clone(), catalog_read.clone());
        std::thread::spawn(move || {
            if let Some(c) = src(now_ms()) {
                *lock(&live.catalog) = c;
            }
            read.store(true, Ordering::SeqCst);
            live.signal();
            live.publish();
        });
    }
    {
        let deadline = Instant::now() + opts.ready_wait;
        let mut g = lock(&live.done.0);
        loop {
            let starting = live.entries().iter().any(|e| *lock(&e.outcome) == Outcome::Starting);
            let left = deadline.saturating_duration_since(Instant::now());
            if (!starting && catalog_read.load(Ordering::SeqCst)) || left.is_zero() {
                break;
            }
            g = live.done.1.wait_timeout(g, left.min(Duration::from_millis(200))).map(|r| r.0).unwrap_or_else(|e| e.into_inner().0);
        }
    }
    let (index, report) = live.files();
    write_atomic(&opts.dir.join("mcp-index.txt"), &index)?;
    // the session's skills index, before `ready`: the REPL's first
    // prompt reads it (and only it)
    let skills = crate::skills::index(&crate::skills::ordered(loose.join().unwrap_or_default(), plugin_skills));
    write_atomic(&opts.dir.join("skills-index.txt"), &skills)?;
    write_atomic(&opts.dir.join("report.txt"), &report)?;
    *lock(&live.written) = (index, report);
    live.ready.store(true, Ordering::SeqCst);
    // a server up between files() and ready: its index line now
    live.publish();
    for e in live.entries() {
        if *lock(&e.outcome) == Outcome::Up {
            let counts = index_of(&live.entries(), &live.base, &live.state()).2;
            e.status(Ok(counts.get(&e.key).copied().unwrap_or(0)));
        }
    }
    write_atomic(&opts.dir.join("ready"), &format!("{}\n", std::process::id()))?;
    {
        let live = live.clone();
        std::thread::spawn(move || refresh_loop(changed_rx, live));
    }
    // the servers retired keep answering (the off words) until the
    // process ends: a REPL may call one before it reads the new index
    let retired: Arc<Mutex<Vec<Arc<Entry>>>> = Arc::new(Mutex::new(Vec::new()));
    {
        let (live, retired) = (live.clone(), retired.clone());
        std::thread::spawn(move || {
            for s in listener.incoming().flatten() {
                if live.stop.load(Ordering::SeqCst) {
                    return;
                }
                let (t, l, r) = (token.clone(), live.clone(), retired.clone());
                std::thread::spawn(move || connection(s, t, l, r));
            }
        });
    }
    {
        let (live, src, poll, retired) = (live.clone(), opts.catalog.clone(), opts.poll, retired.clone());
        std::thread::spawn(move || {
            while !live.stop.load(Ordering::SeqCst) {
                std::thread::sleep(poll);
                if live.stop.load(Ordering::SeqCst) {
                    return;
                }
                let before = live.entries();
                poll_once(&live, src.as_ref(), &mut seen);
                let now = live.entries();
                let mut r = lock(&retired);
                r.extend(before.into_iter().filter(|e| !now.iter().any(|n| Arc::ptr_eq(n, e))));
                // only the last few matter (a REPL's stale index)
                let n = r.len();
                if n > 64 {
                    r.drain(..n - 64);
                }
            }
        });
    }
    // a login (from /plugins login, any session) shows as a change of
    // the server's store file: connect it then
    let logins = |entries: &[Arc<Entry>]| {
        for e in entries {
            let mut l = lock(&e.login);
            if let Some((f, seen)) = l.as_mut() {
                let now = mtime(f);
                if now.is_some() && now != *seen {
                    *seen = now;
                    let _ = changed_tx.send(e.key.clone());
                }
            }
        }
    };
    let parent = opts.parent.map(Parent::new);
    let mut tick = 0u64;
    loop {
        if let Some(p) = &parent {
            if !p.alive(tick.is_multiple_of(IDENTITY_EVERY)) {
                break;
            }
        }
        std::thread::sleep(Duration::from_millis(500));
        tick += 1;
        if tick.is_multiple_of(4) {
            logins(&live.entries());
        }
    }
    live.stop.store(true, Ordering::SeqCst);
    let _ = changed_tx.send(String::new());
    for e in live.entries().iter().chain(lock(&retired).iter()) {
        e.off.store(true, Ordering::SeqCst);
        if let Some(mut c) = lock(&e.client).take() {
            c.stop();
        }
    }
    Ok(())
}

#[cfg(test)]
mod parent_tests {
    use super::*;

    #[test]
    fn the_parent_is_its_pid_and_its_start_time() {
        let mut c = std::process::Command::new("sleep").arg("30").spawn().unwrap();
        let p = Parent::new(c.id());
        assert!(p.started.is_some());
        assert!(p.alive(false) && p.alive(true));
        // the same pid with another start time: a reused pid, not it
        let other = Parent { pid: c.id(), started: Some("Thu Jan  1 00:00:00 1970".into()) };
        assert!(other.alive(false) && !other.alive(true));
        c.kill().unwrap();
        c.wait().unwrap();
        assert!(!p.alive(false) && !p.alive(true));
    }
}

#[cfg(test)]
mod stamp_tests {
    use super::*;

    #[test]
    fn a_non_object_answer_is_an_error_not_a_panic() {
        let ok: Value = serde_json::from_str(&stamp(json!({"result": 1}), json!(7))).unwrap_or_default();
        assert_eq!((ok["id"].clone(), ok["result"].clone()), (json!(7), json!(1)));
        for bad in [json!([1, 2]), json!(3), json!("s"), Value::Null] {
            let e: Value = serde_json::from_str(&stamp(bad, json!(8))).unwrap_or_default();
            assert_eq!(e["id"], json!(8));
            assert!(e["error"].is_object(), "{e}");
        }
    }
}
