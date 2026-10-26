//! A local site artifact that serves itself again (site-revive, architect
//! m_44365; docs/artifacts.md, "A local site serves itself again"), pure:
//! what the hub keeps at the add and what the page server's door
//! `/a/<id>/live` decides.
//!
//! - At the add of a link to `127.0.0.1`/`localhost`/`0.0.0.0` with a
//!   port, the hub asks who listens there (lsof, parsed by
//!   `proto_view::processes`) and keeps its recipe on the version
//!   ([`Serve`]: its argv as it runs, its folder, the port). A static site
//!   (the bytes of `GET /` are a folder's `index.html`, [`static_root`])
//!   gets bise's copy of that folder too: it opens from the copy forever,
//!   even when the worktree is gone; the recipe stays as the fallback.
//! - The door ([`decide`]): the recipe's own server answers: there; the
//!   port held by another process: a why-page, never its site; nothing
//!   there: bise's copy, else the hub starts the recipe again
//!   (daemon/revive.rs, its one owner) and the door waits for it.
//!
//! The recipe comes only from meta.json, written by the hub: a request
//! can only restart a known recipe, never name a command.

use crate::artifacts::Version;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

/// How long the door waits for a started server's port.
pub const START_WAIT_MS: u64 = 30_000;

/// The folders under the server's folder a static site may be served
/// from (`""`: the folder itself), in this order.
pub const ROOTS: &[&str] = &["", "dist", "build", "out", "public"];

/// How a local site's server runs again: its argv (no shell), its
/// working folder, the port its link names.
#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Serve {
    pub argv: Vec<String>,
    pub cwd: String,
    pub port: u16,
}

/// The port of a local link (`http://127.0.0.1:5173/…`, `localhost`,
/// `0.0.0.0`, `[::1]`); None for any other link or one with no port.
pub fn local_port(url: &str) -> Option<u16> {
    let rest = url.strip_prefix("http://").or_else(|| url.strip_prefix("https://"))?;
    let host = rest.split(['/', '?', '#']).next()?;
    let (name, port) = host.rsplit_once(':')?;
    if !matches!(name, "127.0.0.1" | "localhost" | "0.0.0.0" | "[::1]") {
        return None;
    }
    port.parse().ok().filter(|p| *p > 0)
}

/// The process that listens on `port`, from `pv::lsof_ports`' map: the
/// lowest pid (a server's children may share its socket).
pub fn listener(ports: &BTreeMap<u32, Vec<u16>>, port: u16) -> Option<u32> {
    ports.iter().find(|(_, ps)| ps.contains(&port)).map(|(pid, _)| *pid)
}

/// The folder a static server serves: the first of [`ROOTS`] under `cwd`
/// whose `index.html` has exactly the bytes `GET /` answered. `read`
/// reads a file (the tests fake it). None: not static, or not found.
pub fn static_root(body: &[u8], cwd: &Path, read: impl Fn(&Path) -> Option<Vec<u8>>) -> Option<PathBuf> {
    if body.is_empty() {
        return None;
    }
    ROOTS.iter().map(|r| if r.is_empty() { cwd.to_path_buf() } else { cwd.join(r) }).find(|root| read(&root.join("index.html")).as_deref() == Some(body))
}

/// macOS's `KERN_PROCARGS2` buffer as argv: argc (a native i32), the
/// executable's path, NUL padding, then argc NUL-ended strings.
pub fn procargs2(buf: &[u8]) -> Option<Vec<String>> {
    let argc = i32::from_ne_bytes(buf.get(..4)?.try_into().ok()?);
    if argc <= 0 {
        return None;
    }
    let rest = &buf[4..];
    let exec_end = rest.iter().position(|b| *b == 0)?;
    let mut at = exec_end;
    while rest.get(at) == Some(&0) {
        at += 1;
    }
    let mut out = Vec::with_capacity(argc as usize);
    for part in rest[at..].split(|b| *b == 0).take(argc as usize) {
        out.push(String::from_utf8_lossy(part).into_owned());
    }
    (out.len() == argc as usize).then_some(out)
}

/// Linux's `/proc/<pid>/cmdline` as argv (NUL-separated, a NUL at the end).
pub fn cmdline(buf: &[u8]) -> Vec<String> {
    let buf = buf.strip_suffix(&[0]).unwrap_or(buf);
    if buf.is_empty() {
        return Vec::new();
    }
    buf.split(|b| *b == 0).map(|p| String::from_utf8_lossy(p).into_owned()).collect()
}

/// Who holds a recipe's port now.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Holder {
    /// nothing listens
    Free,
    /// the recipe's own server (same argv, same folder)
    Ours,
    /// another server (another agent's vite on the same default port)
    Other { argv: Vec<String>, cwd: String },
}

/// The holder of the port, from the listener found there (its argv and
/// folder) against the recipe.
pub fn holder(recipe: &Serve, found: Option<(Vec<String>, String)>) -> Holder {
    match found {
        None => Holder::Free,
        Some((argv, cwd)) if argv == recipe.argv && cwd == recipe.cwd => Holder::Ours,
        Some((argv, cwd)) => Holder::Other { argv, cwd },
    }
}

/// Why the door shows a page instead of the site.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Why {
    /// the port answers for another server
    Taken { port: u16, argv: Vec<String>, cwd: String },
    /// the recipe's folder is gone (the agent's worktree was dropped)
    FolderGone { cwd: String },
    /// the server could not start
    NoStart { error: String },
    /// it started, then exited before it listened
    Exited { tail: String },
    /// it did not listen within [`START_WAIT_MS`]
    Slow { secs: u64, tail: String },
    /// nothing answers and bise knows no way to start it
    NoRecipe { link: String },
}

/// What the door does first.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Open {
    /// redirect there (the site's own server)
    Go(String),
    /// redirect to bise's copy (a path on the page server)
    Copy(String),
    /// ask the hub to start the recipe, then wait for its port
    Start,
    Why(Why),
}

/// The door's first decision for version `v` of artifact `id`: `holder`
/// is who holds its port now (None: no recipe, so nobody was asked),
/// `cwd_here` whether the recipe's folder still exists, `rest` the path
/// after `/a/<id>/live`.
pub fn decide(id: &str, v: &Version, holder: Option<&Holder>, cwd_here: bool, rest: &[&str]) -> Open {
    let copy = v.copy.as_deref().map(|c| crate::pages::site::copy_href(id, v.v, c));
    match (holder, &v.serve) {
        (Some(Holder::Ours), _) => Open::Go(link_at(&v.target, rest)),
        (_, _) if copy.is_some() => Open::Copy(copy.unwrap_or_default()),
        (Some(Holder::Other { argv, cwd }), Some(s)) => Open::Why(Why::Taken { port: s.port, argv: argv.clone(), cwd: cwd.clone() }),
        (_, Some(s)) if !cwd_here => Open::Why(Why::FolderGone { cwd: s.cwd.clone() }),
        (_, Some(_)) => Open::Start,
        (_, None) => Open::Go(link_at(&v.target, rest)),
    }
}

/// Where `/a/<id>/live/<rest>` goes on the site: the link, then the
/// rest of the path.
pub fn link_at(link: &str, rest: &[&str]) -> String {
    let rest: Vec<&str> = rest.iter().copied().filter(|s| !s.is_empty()).collect();
    if rest.is_empty() {
        return link.to_string();
    }
    format!("{}/{}", link.trim_end_matches('/'), rest.join("/"))
}

/// The door of an artifact (`/a/<id>/live`), the row's url when its
/// newest version has a recipe or is a local link with a copy.
pub fn live_href(id: &str) -> String {
    format!("/a/{id}/live")
}

/// Whether version `v` opens through the door: a local link bise can
/// serve again (a recipe, or a copy).
pub fn has_door(v: &Version) -> bool {
    local_port(&v.target).is_some() && (v.serve.is_some() || v.copy.is_some())
}

/// The why in words, one paragraph.
pub fn why_text(why: &Why) -> String {
    match why {
        Why::Taken { port, argv, cwd } => format!("port {port} is used by another server: {} in {cwd}. stop it, or ask its agent to, then open this again.", argv.join(" ")),
        Why::FolderGone { cwd } => format!("its folder is gone ({cwd}): the agent that made it was dropped, and bise kept no copy of a site that runs a server."),
        Why::NoStart { error } => format!("its server could not start: {error}"),
        Why::Exited { tail } => format!("its server stopped before it answered. its last lines:\n{tail}"),
        Why::Slow { secs, tail } => format!("its server did not answer within {secs} s. its last lines:\n{tail}"),
        Why::NoRecipe { link } => format!("nothing answers at {link}, and bise does not know how to start it."),
    }
}

/// The why-page (the door's 502), with the command bise ran.
pub fn why_html(title: &str, recipe: Option<&Serve>, why: &Why) -> String {
    let esc = crate::pages::server::esc;
    let ran = recipe.map(|s| format!("<p class=\"ran\"><code>{}</code> in <code>{}</code></p>", esc(&s.argv.join(" ")), esc(&s.cwd))).unwrap_or_default();
    format!(
        "<!doctype html>\n<html lang=\"en\"><head><meta charset=\"utf-8\"><title>{t} · not opened</title>\n<link rel=\"stylesheet\" href=\"/kit/tokens.css\"><link rel=\"stylesheet\" href=\"/kit/kit.css\"></head>\n<body><main class=\"why\"><h1>{t} did not open</h1><pre>{w}</pre>{ran}</main></body></html>\n",
        t = esc(title),
        w = esc(&why_text(why)),
    )
}

#[cfg(test)]
#[path = "artifacts_serve_tests.rs"]
mod tests;
