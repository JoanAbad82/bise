//! `/plugins` in the TUI (docs/plugins.md).
//!
//! - [`rows`]: the Plugins list (bend_plugins::catalog::rows), for the
//!   desktop's core and the TUI's screen; [`connect`] and [`refresh`]
//!   run a connector's connect and a catalog fetch on their own thread.
//! - `/plugins`: the plugins of the workspace (the static listing).
//! - `/plugins on|off ID`: edits `plugins.json` (bend_plugins::state);
//!   applies at the next `/reload` (or task restart).
//! - `/plugins login [NAME]`: the browser login of a remote MCP server
//!   (bend_plugins::login), in the background: its lines come back
//!   through [`pump`]; every agent's bridge sees the new tokens and
//!   connects the server. `/plugins logout NAME` forgets them.
//! - [`pump`] also says once per server and per TUI run, when a session
//!   found that one needs a login: `linear needs a login: /plugins login`.

use bise_proto::words::settings;
use std::path::Path;

/// The Plugins list of `workspace` (the desktop's `plugins` and `browse`
/// events, the TUI's /plugins screen): bend_plugins::catalog::rows, the
/// one builder, on what each owner reads now (`pending`: the logins whose
/// browser is open, by name). The connectors from their cache only, never
/// a fetch ([`refresh`] fetches, on its own thread).
pub(crate) fn rows(workspace: &Path, pending: &[String]) -> Vec<bise_proto::app_rows::Plugin> {
    use bend_plugins::{catalog, connectors, oauth, resolve, skills, state, status};
    let res = resolve::resolve(&resolve::Roots::standard(Some(workspace)));
    let cat = connectors::cached(&bise_home::Home::from_env().connectors_cache());
    let st = state::read(&state::state_path());
    let (sd, od) = (status::dir(), oauth::store_dir());
    // the skills folders main reads (the user's view), off ones too; a
    // short wait per folder: a stuck one is skipped (bend_plugins::skills)
    let home = std::env::var_os("HOME").filter(|h| !h.is_empty()).map(std::path::PathBuf::from);
    let app = resolve::builtin_root().and_then(|r| r.parent().map(Path::to_path_buf));
    let bise = skills::BiseSkills::of(true, bise_home::projects::desktop_for(workspace));
    let found = skills::scan(&skills::roots(home.as_deref(), workspace, app.as_deref(), bise), std::time::Duration::from_millis(300));
    let inputs = catalog::Inputs {
        resolution: &res,
        catalog: &cat,
        skills: &found.skills,
        state: &st,
        status_dir: Some(&sd),
        oauth_dir: Some(&od),
        pending_logins: pending,
    };
    catalog::rows(&inputs)
}

/// Connect Mistral connector `id` (`plugin_connect`, `/plugins
/// connect`): his browser or one click, then the catalog polled until it
/// is ready (up to 5 min), all on its own thread, never a draw or core
/// loop; `say` gets each step's line, `done` its end.
pub(crate) fn connect(id: &str, say: impl Fn(String) + Send + 'static, done: impl FnOnce(Result<(), String>) + Send + 'static) -> Result<(), String> {
    let id = bend_plugins::id::PluginId::parse(id)?;
    if !matches!(id, bend_plugins::id::PluginId::Mistral { .. }) {
        return Err(format!("{id} is not a Mistral connector"));
    }
    std::thread::spawn(move || {
        let r = bend_plugins::connectors::connect_now(&id, &|l| say(l.to_string()));
        done(r.map(|_| ()));
    });
    Ok(())
}

/// The Mistral catalog fetched again now (`plugins_refresh`, `/plugins
/// refresh`), on its own thread; `done` with the fetch's problem, if any.
pub(crate) fn refresh(done: impl FnOnce(Option<String>) + Send + 'static) {
    std::thread::spawn(move || {
        let cat = bend_plugins::connectors::refresh();
        done(cat.error.map(|p| p.to_string()));
    });
}

/// Turn plugin or part `id` (any `PluginId`) on or off through
/// bend_plugins' one writer.
pub(crate) fn set(id: &str, on: bool) -> Result<bool, String> {
    let id = bend_plugins::id::PluginId::parse(id)?;
    let path = bend_plugins::state::state_path();
    bend_plugins::state::set(&path, &id, on).map_err(|e| format!("{}: {e}", path.display()))
}

/// Forget the login of server `name` (`/plugins logout NAME`).
pub(crate) fn logout(workspace: &Path, name: &str) -> Result<String, String> {
    let ts = bend_plugins::login::targets(workspace);
    let t = bend_plugins::login::find(&ts, name)?;
    bend_plugins::login::logout(t, &bend_plugins::oauth::store_dir(), Some(&bend_plugins::status::dir()))?;
    Ok(t.name.clone())
}

/// The plugins of `workspace` matching `q` (the `/plugins on|off`
/// argument, BISE-117). Resolved again at most every 5 s: the popup asks
/// at every frame.
pub(crate) fn choices(workspace: &Path, q: &str, typed: &str) -> Vec<crate::commands::Choice> {
    if matches!(typed.split_whitespace().nth(1), Some("login" | "logout")) {
        return login_choices(workspace, q);
    }
    use std::cell::RefCell;
    use std::time::{Duration, Instant};
    type Cached = Option<(std::path::PathBuf, Instant, Vec<(String, String)>)>;
    thread_local! {
        static CACHE: RefCell<Cached> = const { RefCell::new(None) };
    }
    let all = CACHE.with(|c| {
        let mut c = c.borrow_mut();
        let fresh = c.as_ref().is_some_and(|(w, t, _)| w == workspace && t.elapsed() < Duration::from_secs(5));
        if !fresh {
            let res = bend_plugins::resolve::resolve(&bend_plugins::resolve::Roots::standard(Some(workspace)));
            let list = res
                .plugins
                .iter()
                .map(|p| {
                    let what = p.description.clone().unwrap_or_default();
                    (p.name.clone(), format!("{} · {}", p.state.as_str(), what).trim_end_matches(" · ").to_string())
                })
                .collect();
            *c = Some((workspace.to_path_buf(), Instant::now(), list));
        }
        c.as_ref().map(|(_, _, l)| l.clone()).unwrap_or_default()
    });
    all.into_iter()
        .filter(|(n, _)| crate::commands::matches(q, &[n]))
        .map(|(n, d)| crate::commands::Choice { value: n.clone(), label: n, desc: d, mark: None })
        .collect()
}

/// `/plugins login`'s rows (designer): `linear   mcp.linear.app · needs
/// a login`, `linear   mcp.linear.app · logged in · 23 tools`.
fn login_choices(workspace: &Path, q: &str) -> Vec<crate::commands::Choice> {
    let (secrets, sd) = (bend_plugins::oauth::store_dir(), bend_plugins::status::dir());
    bend_plugins::login::targets(workspace)
        .into_iter()
        .filter(|t| crate::commands::matches(q, &[&t.name]))
        .map(|t| {
            let desc = bend_plugins::login::state(&t, &secrets, &sd);
            crate::commands::Choice { value: t.name.clone(), label: t.name, desc, mark: None }
        })
        .collect()
}

use std::sync::Mutex;

/// Lines for the thread from the background logins, and the logins
/// running (one per server at a time).
static LINES: Mutex<Vec<String>> = Mutex::new(Vec::new());
static RUNNING: Mutex<Vec<String>> = Mutex::new(Vec::new());
/// Addresses pasted with `/plugins login NAME <address>`, for the login
/// of NAME that waits (the browser on another machine).
static PASTED: Mutex<Vec<(String, String)>> = Mutex::new(Vec::new());

fn say(l: String) {
    LINES.lock().unwrap_or_else(|e| e.into_inner()).push(l);
}

/// `/plugins login NAME <address>`: the address a browser elsewhere
/// ended on, for the login of NAME that waits.
fn paste(workspace: &Path, name: &str, address: &str) -> String {
    let ts = bend_plugins::login::targets(workspace);
    let t = match bend_plugins::login::find(&ts, name) {
        Ok(t) => t.clone(),
        Err(e) => return e,
    };
    if !RUNNING.lock().unwrap_or_else(|e| e.into_inner()).contains(&t.name) {
        return bend_plugins::login::no_login_waiting(&t.name);
    }
    PASTED.lock().unwrap_or_else(|e| e.into_inner()).push((t.name, address.to_string()));
    String::new()
}

/// `/plugins login NAME`: the login in a thread; the first line now.
fn login(workspace: &Path, name: &str) -> String {
    let ts = bend_plugins::login::targets(workspace);
    let t = match bend_plugins::login::find(&ts, name) {
        Ok(t) => t.clone(),
        Err(e) => return e,
    };
    {
        let mut r = RUNNING.lock().unwrap_or_else(|e| e.into_inner());
        if r.contains(&t.name) {
            return settings::plugins_login_open(&t.name);
        }
        r.push(t.name.clone());
    }
    let first = settings::plugins_login_opening(&t.name);
    std::thread::spawn(move || {
        let (secrets, sd) = (bend_plugins::oauth::store_dir(), bend_plugins::status::dir());
        let name = t.name.clone();
        // the link always (another browser, another machine)
        let open = move |u: &str| {
            let _ = bend_plugins::oauth::open_browser(u);
            for l in bend_plugins::login::tui_link_lines(&name, u) {
                say(l);
            }
            Ok(())
        };
        PASTED.lock().unwrap_or_else(|e| e.into_inner()).retain(|(n, _)| *n != t.name);
        let next = || {
            let mut p = PASTED.lock().unwrap_or_else(|e| e.into_inner());
            let i = p.iter().position(|(n, _)| *n == t.name)?;
            Some(p.remove(i).1)
        };
        let bad = || say(bend_plugins::login::bad_paste_tui(&t.name));
        let paste = bend_plugins::oauth::Paste { next: &next, bad: &bad };
        let r = bend_plugins::login::run(&t, &secrets, Some(&sd), &open, bend_plugins::login::WAIT, None, Some(&paste));
        say(bend_plugins::login::done_line(&t.name, &r));
        RUNNING.lock().unwrap_or_else(|e| e.into_inner()).retain(|n| *n != t.name);
    });
    first
}

/// The servers already said to need a login (once per TUI run), and
/// when the status files were last read.
struct Watch {
    said: Vec<String>,
    at: Option<std::time::Instant>,
}

static WATCH: Mutex<Watch> = Mutex::new(Watch { said: Vec::new(), at: None });

/// The lines that wait, then (every 5 s) a quiet line for a server a
/// session found needing a login: `linear needs a login: /plugins login`.
pub(crate) fn pending_lines(workspace: &Path) -> Vec<String> {
    let mut out: Vec<String> = std::mem::take(&mut *LINES.lock().unwrap_or_else(|e| e.into_inner()));
    let mut w = WATCH.lock().unwrap_or_else(|e| e.into_inner());
    if w.at.is_some_and(|t| t.elapsed() < std::time::Duration::from_secs(5)) {
        return out;
    }
    w.at = Some(std::time::Instant::now());
    let sd = bend_plugins::status::dir();
    let running = RUNNING.lock().unwrap_or_else(|e| e.into_inner()).clone();
    for t in bend_plugins::login::targets(workspace) {
        let needs = bend_plugins::status::read(&sd, &t.plugin, &t.server.id).is_some_and(|s| s.login);
        if needs && !w.said.contains(&t.name) && !running.contains(&t.name) {
            w.said.push(t.name.clone());
            out.push(settings::plugins_needs_login(&t.name));
        } else if !needs {
            // logged in since: a later 401 is said again
            w.said.retain(|n| *n != t.name);
        }
    }
    out
}

/// Into the feed: the background logins' lines and the quiet ones.
pub(crate) fn pump(app: &mut crate::app::App) {
    let ws = crate::sb::workspace(app).unwrap_or_default();
    if ws.is_empty() {
        return;
    }
    for l in pending_lines(Path::new(&ws)) {
        crate::feed::push_event(&mut app.events, &mut app.cache, crate::wire::Ev::Info(l));
    }
}

/// The text `/plugins [args]` prints.
pub(crate) fn command(typed: &str, workspace: &Path) -> String {
    let mut words = typed.split_whitespace().skip(1);
    match (words.next(), words.next()) {
        (Some("login"), Some(name)) => match words.next() {
            Some(address) => paste(workspace, name, address),
            None => login(workspace, name),
        },
        (Some(sub @ ("login" | "logout")), None) => {
            let (secrets, sd) = (bend_plugins::oauth::store_dir(), bend_plugins::status::dir());
            let ts = bend_plugins::login::targets(workspace);
            if ts.is_empty() {
                return settings::plugins_no_login.into();
            }
            let rows: Vec<String> = ts.iter().map(|t| format!("  {}   {}", t.name, bend_plugins::login::state(t, &secrets, &sd))).collect();
            format!("/plugins {} NAME:\n{}", sub, rows.join("\n"))
        }
        (Some("logout"), Some(name)) => match logout(workspace, name) {
            Ok(n) => settings::plugins_logged_out(n),
            Err(e) => e,
        },
        (Some(sub @ ("on" | "off")), Some(name)) => match set(name, sub == "on") {
            Ok(changed) => settings::plugins_set(
                name,
                if sub == "on" { settings::plugins_enabled } else { settings::plugins_disabled },
                if changed { "" } else { settings::plugins_unchanged },
            ),
            Err(e) => e,
        },
        (None, _) | (Some("list"), _) => {
            let text = bend_plugins::cli::listing(workspace);
            format!("plugins ({})\n{}", workspace.display(), text.trim_end())
        }
        _ => settings::plugins_usage.into(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lists_the_workspace_plugins() {
        let dir = std::env::temp_dir().join(format!("tui-plugins-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        let t = command("/plugins", &dir);
        assert!(t.starts_with("plugins ("), "{}", t);
        assert!(command("/plugins bogus", &dir).starts_with("usage:"));
        // no remote server in this workspace: login says so, a name too
        assert!(command("/plugins login", &dir).starts_with("no remote MCP server that logs in"));
        assert!(command("/plugins login nope", &dir).starts_with("no remote MCP server named nope"));
        assert!(choices(&dir, "", "/plugins login ").is_empty());
        let _ = std::fs::remove_dir_all(&dir);
    }
}
