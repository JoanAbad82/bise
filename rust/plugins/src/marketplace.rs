//! Plugin marketplaces (docs/plugins.md, "Add"): git repos with a
//! `marketplace.json` listing plugin folders, like `openai/plugins`.
//!
//! - his list: `Home::marketplaces()` = `{"marketplaces": [url, ...]}`,
//!   one writer here ([`add`], [`remove`]: flock, tmp + rename);
//! - [`read`]: the repo cloned once into `Home::marketplace_cache()/<hash
//!   of its url>` (through [`crate::add::git_clone`]: nothing of it
//!   runs), then `.agents/plugins/marketplace.json` (Codex's format) or
//!   `.claude-plugin/marketplace.json` (Claude Code's) parsed ([`parse`]);
//! - [`rows`]: its plugins as Browse rows (`core_ev::Browse{source,
//!   items}`), available and never on;
//! - [`request`]: installing one is the add menu's git path with its
//!   folder ([`crate::add::Request::Git`]), so the same preview and click.

use std::path::{Path, PathBuf};

use bise_proto::app_rows::Plugin;
#[cfg(test)]
use bise_proto::app_rows::{PluginKind, PluginState};
use serde_json::{json, Value};

use crate::add::{self, AddError};
use crate::id::PluginId;

/// The marketplaces he added, in his order (no file: none).
pub fn list(path: &Path) -> Vec<String> {
    std::fs::read_to_string(path)
        .ok()
        .and_then(|t| serde_json::from_str::<Value>(&t).ok())
        .and_then(|v| v.get("marketplaces")?.as_array().map(|a| a.iter().filter_map(|u| u.as_str().map(str::to_string)).collect()))
        .unwrap_or_default()
}

/// Add `url` (a git URL, or GitHub's `owner/repo`) to his list; false:
/// it was there. Returns the URL as kept.
pub fn add(path: &Path, url: &str) -> Result<(bool, String), AddError> {
    let url = add::git_url(url)?;
    let changed = edit(path, |l| {
        if l.contains(&url) {
            return false;
        }
        l.push(url.clone());
        true
    })?;
    Ok((changed, url))
}

/// Remove `url` from his list (its cache stays until the cache is
/// cleared: it is rebuildable); false: it was not there.
pub fn remove(path: &Path, url: &str) -> Result<bool, AddError> {
    let url = add::git_url(url).unwrap_or_else(|_| url.to_string());
    edit(path, |l| {
        let n = l.len();
        l.retain(|u| *u != url);
        l.len() != n
    })
}

/// The one writer of the list: under `<path>.lock`, tmp + rename, the
/// file's other keys kept.
fn edit(path: &Path, f: impl FnOnce(&mut Vec<String>) -> bool) -> Result<bool, AddError> {
    let io = |e: std::io::Error| AddError::Io { why: format!("{}: {}", path.display(), e) };
    if let Some(d) = path.parent() {
        std::fs::create_dir_all(d).map_err(io)?;
    }
    let _held = lock(&path.with_extension("json.lock")).map_err(io)?;
    let mut v: Value = std::fs::read_to_string(path).ok().and_then(|t| serde_json::from_str(&t).ok()).filter(Value::is_object).unwrap_or(json!({}));
    let mut l = list(path);
    if !f(&mut l) {
        return Ok(false);
    }
    v["marketplaces"] = json!(l);
    let tmp = path.with_extension(format!("json.{}.tmp", std::process::id()));
    std::fs::write(&tmp, serde_json::to_string_pretty(&v).unwrap_or_default() + "\n").map_err(io)?;
    std::fs::rename(&tmp, path).map_err(|e| {
        let _ = std::fs::remove_file(&tmp);
        io(e)
    })?;
    Ok(true)
}

fn lock(path: &Path) -> std::io::Result<std::fs::File> {
    use std::os::unix::io::AsRawFd;
    let f = std::fs::OpenOptions::new().create(true).truncate(false).write(true).open(path)?;
    // SAFETY: flock on a descriptor this function owns; blocks until free
    if unsafe { libc::flock(f.as_raw_fd(), libc::LOCK_EX) } != 0 {
        return Err(std::io::Error::last_os_error());
    }
    Ok(f)
}

/// A marketplace as read.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Market {
    /// its git URL, as kept in his list
    pub url: String,
    /// what he reads (`Codex official`; else its name, else its URL)
    pub title: String,
    pub items: Vec<Item>,
}

/// A plugin a marketplace offers.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Item {
    pub name: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub category: Option<String>,
    pub source: Source,
}

/// Where an [`Item`]'s plugin is.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Source {
    /// a folder of the marketplace's own repo
    Here { subdir: String },
    /// another repo (`{"source": "github", "repo"}`, `{"source": "url"}`)
    Git { url: String, subdir: Option<String> },
}

/// Its clone in `cache` (`Home::marketplace_cache()`).
pub fn cache_of(cache: &Path, url: &str) -> PathBuf {
    let d = ring::digest::digest(&ring::digest::SHA256, url.as_bytes());
    cache.join(d.as_ref()[..8].iter().map(|b| format!("{b:02x}")).collect::<String>())
}

/// Read marketplace `url`: its clone in `cache` (cloned when missing, or
/// again when `refresh`: off the UI thread), then [`parse`]. A failed
/// refresh keeps the last clone.
pub fn read(cache: &Path, url: &str, refresh: bool) -> Result<Market, AddError> {
    let url = add::git_url(url)?;
    let dir = cache_of(cache, &url);
    if refresh || !dir.is_dir() {
        std::fs::create_dir_all(cache).map_err(|e| AddError::Io { why: e.to_string() })?;
        let fresh = dir.with_extension(format!("new{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&fresh);
        match add::git_clone(&url, &fresh, add::GIT_TIMEOUT) {
            Ok(()) => {
                let old = dir.with_extension(format!("old{}", std::process::id()));
                let _ = std::fs::rename(&dir, &old);
                std::fs::rename(&fresh, &dir).map_err(|e| AddError::Io { why: e.to_string() })?;
                let _ = std::fs::remove_dir_all(&old);
            }
            Err(e) if !dir.is_dir() => return Err(e),
            Err(_) => {}
        }
    }
    parse(&dir, &url)
}

/// The marketplace in the clone `dir` of `url`:
/// `.agents/plugins/marketplace.json`, else
/// `.claude-plugin/marketplace.json`. Reads files only.
pub fn parse(dir: &Path, url: &str) -> Result<Market, AddError> {
    let file = [".agents/plugins/marketplace.json", ".claude-plugin/marketplace.json"].into_iter().map(|f| dir.join(f)).find(|f| f.is_file());
    let Some(file) = file else {
        return Err(AddError::BadSource { why: format!("{} has no marketplace.json", add::url_shown(url)) });
    };
    let v: Value = std::fs::read_to_string(&file)
        .ok()
        .and_then(|t| serde_json::from_str(&t).ok())
        .ok_or_else(|| AddError::BadSource { why: format!("{}'s marketplace.json is not JSON", add::url_shown(url)) })?;
    let s = |v: &Value, k: &str| v.get(k).and_then(Value::as_str).filter(|s| !s.is_empty()).map(str::to_string);
    let title = v.get("interface").and_then(|i| s(i, "displayName")).or_else(|| s(&v, "name")).unwrap_or_else(|| add::url_shown(url));
    // Claude Code's pluginRoot: where bare plugin names are
    let base = v.get("metadata").and_then(|m| s(m, "pluginRoot")).unwrap_or_default();
    let mut items = Vec::new();
    for p in v.get("plugins").and_then(Value::as_array).into_iter().flatten() {
        let Some(name) = s(p, "name").filter(|n| crate::resolve::valid_name(n)) else { continue };
        let Some(source) = source(p.get("source"), &base) else { continue };
        if p.get("policy").and_then(|x| s(x, "installation")).is_some_and(|i| i == "NOT_AVAILABLE") {
            continue;
        }
        // its own manifest says more when the marketplace doesn't
        let own = match &source {
            Source::Here { subdir } => [".codex-plugin/plugin.json", ".claude-plugin/plugin.json", "plugin.json"]
                .into_iter()
                .find_map(|m| std::fs::read_to_string(dir.join(subdir).join(m)).ok())
                .and_then(|t| serde_json::from_str::<Value>(&t).ok()),
            Source::Git { .. } => None,
        };
        let iface = own.as_ref().and_then(|o| o.get("interface")).cloned().unwrap_or(Value::Null);
        items.push(Item {
            title: s(&iface, "displayName"),
            description: s(p, "description").or_else(|| s(&iface, "shortDescription")).or_else(|| own.as_ref().and_then(|o| s(o, "description"))),
            category: s(p, "category").or_else(|| s(&iface, "category")),
            name,
            source,
        });
    }
    Ok(Market { url: url.to_string(), title, items })
}

/// An entry's `source`: `"./plugins/x"`, `{"source": "local", "path"}`,
/// `{"source": "github", "repo", "path"?}`, `{"source": "url"|"git",
/// "url", "path"?}`. None: a source bise can't fetch (an npm package).
fn source(v: Option<&Value>, base: &str) -> Option<Source> {
    let here = |p: &str| {
        let p = p.trim_start_matches("./");
        let p = if base.is_empty() || p.contains('/') { p.to_string() } else { format!("{}/{}", base.trim_start_matches("./").trim_end_matches('/'), p) };
        (!p.is_empty() && !p.starts_with('/') && !p.split('/').any(|c| c == "..")).then_some(Source::Here { subdir: p })
    };
    match v? {
        Value::String(p) => here(p),
        Value::Object(o) => {
            let s = |k: &str| o.get(k).and_then(Value::as_str);
            let sub = s("path").map(|p| p.trim_start_matches("./").to_string()).filter(|p| !p.is_empty());
            match s("source")? {
                "local" => here(s("path")?),
                "github" => Some(Source::Git { url: add::git_url(s("repo")?).ok()?, subdir: sub }),
                "url" | "git" => Some(Source::Git { url: add::git_url(s("url")?).ok()?, subdir: sub }),
                _ => None,
            }
        }
        _ => None,
    }
}

/// Its plugins as Browse rows: available, never on.
pub fn rows(m: &Market) -> Vec<Plugin> {
    m.items
        .iter()
        .map(|i| {
            let id = PluginId::plugin(i.name.clone()).to_string();
            let mut row: Plugin = serde_json::from_value(json!({
                "id": id, "name": i.name, "kind": "plugin", "scope": "user", "state": "available", "on": false,
                "title": i.title.clone().unwrap_or_else(|| crate::title::display_name(&i.name)),
            }))
            .expect("a Browse row");
            row.what = i.description.clone();
            row
        })
        .collect()
}

/// Installing `item`: the add menu's git path, with its folder.
pub fn request(m: &Market, item: &Item) -> add::Request {
    match &item.source {
        Source::Here { subdir } => add::Request::Git { url: m.url.clone(), subdir: Some(subdir.clone()) },
        Source::Git { url, subdir } => add::Request::Git { url: url.clone(), subdir: subdir.clone() },
    }
}

pub const USAGE: &str = "usage:
  bise plugins marketplace [list]
  bise plugins marketplace add|remove URL     (a git URL, or GitHub's owner/repo, like openai/plugins)
  bise plugins marketplace show URL [--refresh]   what it offers (add one: bise plugins add URL --subdir DIR)";

/// `bise plugins marketplace ...`; the exit code.
pub fn main(args: &[String]) -> i32 {
    use bise_home::style::Style;
    let (out, err) = (Style::stdout(), Style::stderr());
    let home = bise_home::Home::from_env();
    let file = home.marketplaces();
    let fail = |e: AddError| {
        eprintln!("{}", err.fail(&e.to_string()));
        1
    };
    match (args.first().map(String::as_str).unwrap_or("list"), args.get(1)) {
        ("list", _) => {
            let l = list(&file);
            if l.is_empty() {
                println!("{}", out.dim("no marketplace yet: bise plugins marketplace add openai/plugins"));
            }
            for u in l {
                println!("{}", add::url_shown(&u));
            }
            0
        }
        ("add", Some(u)) => match add(&file, u) {
            Ok((true, u)) => {
                println!("{}", out.ok(&format!("added {}", add::url_shown(&u))));
                0
            }
            Ok((false, u)) => {
                println!("{}", out.dim(&format!("{} is there already", add::url_shown(&u))));
                0
            }
            Err(e) => fail(e),
        },
        ("remove", Some(u)) => match remove(&file, u) {
            Ok(true) => {
                println!("{}", out.ok("removed"));
                0
            }
            Ok(false) => {
                println!("{}", out.dim("not in your marketplaces"));
                0
            }
            Err(e) => fail(e),
        },
        ("show", Some(u)) => match read(&home.marketplace_cache(), u, args.iter().any(|a| a == "--refresh")) {
            Ok(m) => {
                println!("{} · {} plugins", m.title, m.items.len());
                for i in &m.items {
                    let at = match &i.source {
                        Source::Here { subdir } => subdir.clone(),
                        Source::Git { url, subdir } => format!("{}{}", add::url_shown(url), subdir.as_ref().map(|s| format!(" ({s})")).unwrap_or_default()),
                    };
                    println!("  {}  {}  {}", i.name, out.dim(i.description.as_deref().unwrap_or("")), out.dim(&at));
                }
                0
            }
            Err(e) => fail(e),
        },
        _ => {
            eprintln!("{USAGE}");
            2
        }
    }
}

#[cfg(test)]
mod tests;
