//! What bise sees in his projects that says a tool is his (page plugins,
//! block how-nudge; plugins-plan's why brief, architect m_41049): the
//! 'connect your tools' band proposes a connector first when one of his
//! projects names it, and says where.
//!
//! - [`gather`] reads one project, names only: its git remotes, the
//!   names of its tracked files (at most [`FILE_CAP`]), and the KEY names
//!   of its env example files (`.env.example`, `.env.sample`...). Never a
//!   value, never `.env` itself, never another file's contents; nothing
//!   leaves the Mac. Its process and file reads are ports
//!   ([`gather_with`]), so the tests run no git;
//! - [`reasons`] (pure) matches those names on [`MARKERS`], a table of
//!   tool families (`sentry`, `github`...) and the names that point to
//!   them, and gives each family the projects it was seen in, most first.
//!
//! The desktop core calls [`gather`] on its setup thread, per project, at
//! most hourly, and `catalog::summary` reads the [`Evidence`]: it ranks
//! the connectors with evidence first and says why.

use std::path::Path;
use std::time::Duration;

/// Tracked file names read per project: a bigger repo matches its first
/// ones and says so ([`Inputs::capped`]).
pub const FILE_CAP: usize = 20_000;
/// How long one git command may run.
pub const GIT_TIMEOUT: Duration = Duration::from_secs(3);
/// Env example files read per project.
const EXAMPLE_CAP: usize = 8;
/// Bytes read of one env example file.
const EXAMPLE_BYTES: usize = 64 * 1024;

/// What one project shows, names only.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct Inputs {
    /// the project's name, as he reads it
    pub project: String,
    /// the hosts of its git remotes (`github.com`)
    pub hosts: Vec<String>,
    /// its tracked files' paths, relative
    pub files: Vec<String>,
    /// the KEY names of its env example files
    pub env_keys: Vec<String>,
    /// more files than [`FILE_CAP`]: only the first ones were matched
    pub capped: bool,
}

/// What points to a family.
#[derive(Clone, Copy, Debug)]
pub enum Marker {
    /// a git remote on this host
    Host(&'static str),
    /// a tracked file with this exact name
    File(&'static str),
    /// a tracked file whose name starts with this
    FilePrefix(&'static str),
    /// a tracked path under this folder (`.github/`)
    Folder(&'static str),
    /// an env key with this word between its underscores
    /// (`NEXT_PUBLIC_SENTRY_DSN` has `SENTRY`)
    EnvWord(&'static str),
    /// an env key with this exact name
    Env(&'static str),
}

/// Tool families and the names that point to them. A connector's family
/// is [`family`] of its name. Data that only orders suggestions: nothing
/// acts on it.
pub const MARKERS: &[(&str, &[Marker])] = {
    use Marker::*;
    &[
        ("github", &[Host("github.com"), Folder(".github/"), EnvWord("GITHUB")]),
        ("gitlab", &[Host("gitlab.com"), File(".gitlab-ci.yml"), EnvWord("GITLAB")]),
        ("sentry", &[File(".sentryclirc"), FilePrefix("sentry."), EnvWord("SENTRY")]),
        ("datadog", &[File("datadog.yaml"), File("datadog.json"), EnvWord("DATADOG"), Env("DD_API_KEY"), Env("DD_APP_KEY")]),
        ("stripe", &[EnvWord("STRIPE")]),
        ("slack", &[EnvWord("SLACK")]),
        ("notion", &[EnvWord("NOTION")]),
        ("linear", &[EnvWord("LINEAR")]),
        ("jira", &[EnvWord("JIRA")]),
        ("confluence", &[EnvWord("CONFLUENCE")]),
        ("atlassian", &[EnvWord("ATLASSIAN"), EnvWord("JIRA"), EnvWord("CONFLUENCE")]),
        ("figma", &[File("figma.config.json"), EnvWord("FIGMA")]),
        ("hubspot", &[EnvWord("HUBSPOT")]),
        ("airtable", &[EnvWord("AIRTABLE")]),
    ]
};

/// A connector's family: its name, or the family it starts with
/// (`datadog_eu` is `datadog`). None: no marker points to it.
pub fn family(name: &str) -> Option<&'static str> {
    MARKERS
        .iter()
        .map(|(f, _)| *f)
        .find(|f| *f == name)
        .or_else(|| MARKERS.iter().map(|(f, _)| *f).find(|f| name.strip_prefix(f).is_some_and(|r| r.starts_with('_'))))
}

/// What was seen for one family.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Evidence {
    pub family: &'static str,
    /// the first name that matched: a host, a file name, an env key
    pub seen: Seen,
    /// the projects it was seen in, in the order given
    pub places: Vec<String>,
}

/// The name that matched, by kind (the words say each its way).
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Seen {
    Host(String),
    File(String),
    Env(String),
}

/// Each family seen in these projects, the most projects first (then
/// [`MARKERS`]' order). A project counts once per family.
pub fn reasons(projects: &[Inputs]) -> Vec<Evidence> {
    let mut out: Vec<Evidence> = Vec::new();
    for (family, markers) in MARKERS {
        for p in projects {
            let Some(seen) = first_match(p, markers) else { continue };
            match out.iter_mut().find(|e| e.family == *family) {
                Some(e) => e.places.push(p.project.clone()),
                None => out.push(Evidence { family, seen, places: vec![p.project.clone()] }),
            }
        }
    }
    // stable: the table's order between equals
    out.sort_by_key(|e| std::cmp::Reverse(e.places.len()));
    out
}

/// The first marker this project shows, remotes first, then files, then
/// env keys.
fn first_match(p: &Inputs, markers: &[Marker]) -> Option<Seen> {
    for m in markers {
        if let Marker::Host(h) = m {
            if p.hosts.iter().any(|x| x == h) {
                return Some(Seen::Host((*h).to_string()));
            }
        }
    }
    for f in &p.files {
        let base = f.rsplit('/').next().unwrap_or(f);
        let hit = markers.iter().any(|m| match m {
            Marker::File(n) => base == *n,
            Marker::FilePrefix(n) => base.starts_with(n),
            Marker::Folder(d) => f.starts_with(d),
            _ => false,
        });
        if hit {
            let shown = markers.iter().find_map(|m| if let Marker::Folder(d) = m { f.starts_with(d).then(|| d.to_string()) } else { None });
            return Some(Seen::File(shown.unwrap_or_else(|| base.to_string())));
        }
    }
    for k in &p.env_keys {
        let hit = markers.iter().any(|m| match m {
            Marker::Env(n) => k == n,
            Marker::EnvWord(w) => k.split('_').any(|s| s == *w),
            _ => false,
        });
        if hit {
            return Some(Seen::Env(k.clone()));
        }
    }
    None
}

/// The env example files bise reads the KEY names of. `.env` and any
/// other file are never opened.
pub fn is_env_example(path: &str) -> bool {
    let base = path.rsplit('/').next().unwrap_or(path);
    matches!(base, ".env.example" | ".env.sample" | ".env.template" | ".env.dist" | "env.example" | "example.env")
}

/// The KEY names of an env file's text (`KEY=...`, `export KEY=...`):
/// the values are dropped as each line is read.
pub fn env_keys(text: &str) -> Vec<String> {
    text.lines()
        .filter_map(|l| {
            let l = l.trim_start();
            let l = l.strip_prefix("export ").unwrap_or(l);
            let (k, _) = l.split_once('=')?;
            let k = k.trim();
            let ok = !k.is_empty() && k.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') && !k.starts_with(|c: char| c.is_ascii_digit());
            ok.then(|| k.to_string())
        })
        .collect()
}

/// The host of a remote URL (`git@github.com:a/b.git`, `https://u@gitlab.com/a`).
pub fn host_of(url: &str) -> Option<String> {
    let rest = url.split_once("://").map(|(_, r)| r).unwrap_or(url);
    let rest = rest.rsplit_once('@').map(|(_, h)| h).unwrap_or(rest);
    let host = rest.split([':', '/']).next()?.to_ascii_lowercase();
    (host.contains('.') && !host.is_empty()).then_some(host)
}

/// The ports [`gather_with`] reads through.
pub struct Ports<'a> {
    /// `git <args>` in the project, its stdout; None: failed or too slow
    pub git: &'a dyn Fn(&[&str]) -> Option<String>,
    /// one file's text, at most [`EXAMPLE_BYTES`] (only env examples)
    pub read: &'a dyn Fn(&Path) -> Option<String>,
}

/// One project's [`Inputs`], through `ports`.
pub fn gather_with(path: &Path, project: &str, ports: &Ports) -> Inputs {
    let mut hosts: Vec<String> = Vec::new();
    for l in (ports.git)(&["remote", "-v"]).unwrap_or_default().lines() {
        if let Some(h) = l.split_whitespace().nth(1).and_then(host_of) {
            if !hosts.contains(&h) {
                hosts.push(h);
            }
        }
    }
    let listed = (ports.git)(&["ls-files", "-z"]).unwrap_or_default();
    let mut files: Vec<String> = Vec::new();
    let mut capped = false;
    for f in listed.split('\0').filter(|f| !f.is_empty()) {
        if files.len() == FILE_CAP {
            capped = true;
            break;
        }
        files.push(f.to_string());
    }
    let mut env: Vec<String> = Vec::new();
    for f in files.iter().filter(|f| is_env_example(f)).take(EXAMPLE_CAP) {
        for k in env_keys(&(ports.read)(&path.join(f)).unwrap_or_default()) {
            if !env.contains(&k) {
                env.push(k);
            }
        }
    }
    Inputs { project: project.to_string(), hosts, files, env_keys: env, capped }
}

/// One project's [`Inputs`]: git in `path` (killed after [`GIT_TIMEOUT`]),
/// and its env example files' first bytes. Run it off any send path.
pub fn gather(path: &Path, project: &str) -> Inputs {
    let git = |args: &[&str]| run_git(path, args);
    let read = |p: &Path| read_head(p);
    gather_with(path, project, &Ports { git: &git, read: &read })
}

fn read_head(p: &Path) -> Option<String> {
    use std::io::Read;
    let f = std::fs::File::open(p).ok()?;
    let mut buf = Vec::new();
    f.take(EXAMPLE_BYTES as u64).read_to_end(&mut buf).ok()?;
    Some(String::from_utf8_lossy(&buf).into_owned())
}

/// `git -C path <args>`: its stdout, the first bytes of it; None when it
/// fails or runs over [`GIT_TIMEOUT`].
fn run_git(path: &Path, args: &[&str]) -> Option<String> {
    use std::io::Read;
    use std::process::{Command, Stdio};
    // ~200 bytes per path at the cap is plenty
    const OUT_CAP: u64 = (FILE_CAP as u64) * 256;
    let mut child = Command::new("git")
        .arg("-C")
        .arg(path)
        .args(["-c", "core.hooksPath=/dev/null"])
        .args(args)
        .env("GIT_TERMINAL_PROMPT", "0")
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .ok()?;
    let out = child.stdout.take()?;
    let reader = std::thread::spawn(move || {
        let mut buf = Vec::new();
        let _ = out.take(OUT_CAP).read_to_end(&mut buf);
        buf
    });
    let start = std::time::Instant::now();
    let ok = loop {
        match child.try_wait() {
            Ok(Some(s)) => break s.success(),
            Ok(None) if start.elapsed() > GIT_TIMEOUT => {
                let _ = child.kill();
                let _ = child.wait();
                break false;
            }
            Ok(None) => std::thread::sleep(Duration::from_millis(20)),
            Err(_) => return None,
        }
    };
    let buf = reader.join().ok()?;
    // a listing cut at OUT_CAP is still its first names
    ok.then(|| String::from_utf8_lossy(&buf).into_owned())
}

#[cfg(test)]
mod tests;
