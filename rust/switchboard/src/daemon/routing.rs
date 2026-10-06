//! bise's home hub routes his words (bise desktop S2 step 3, amb-hub m_9009);
//! named routing, not route: [`crate::route`] is the pure guess it calls.
//!
//! His plain words to bise's main come here before sb-core sees them:
//! [`Shell::route_input`] gathers the projects (registry rows, their git
//! remotes, the recent lines of each project's main), asks the pure
//! [`crate::route::guess`] and [`crate::route::target`] once, and when a
//! project is clear steps sb-core with `Input::RouteHold` (sb-core holds it
//! 2 s, then forwards it: amb-hub's eed00361) instead of the user input.
//! No target: false, and the caller steps today's input unchanged.
//!
//! Read-only: never starts a hub, never writes; the gathered projects are
//! kept 60 s while the registry's rows stay the same ([`Routing`], a field
//! of the Shell). A project's main thread is found and read the way `sb
//! history --project` reads it (architect m_9063): its folder from the
//! project's view.json (`xread::who_of`), its roles by `search::classify`. The fn context is
//! the input op's `context` (amb-core owns it end to end: the typed send
//! puts it there); until it does, only his words name a project.

use super::Shell;
use crate::core::Input;
use crate::model::MAIN;
use crate::route::{self, Candidate, Guess};
use crate::search::Role;
use bise_proto::context::FnContext;
use std::io::{Read, Seek, SeekFrom};
use std::path::Path;
use std::time::{Duration, Instant};

/// How long gathered projects stay fresh.
const TTL: Duration = Duration::from_secs(60);
/// The recent lines kept per project (his and its main's).
const RECENT: usize = 60;
/// How much of a transcript's end is read for them.
const TAIL: u64 = 128 * 1024;

/// The home hub's routing state: the last gathering (when, for which
/// registry rows, what), a field of its Shell.
#[derive(Default)]
pub(super) struct Routing {
    last: Option<(Instant, Vec<String>, Vec<Candidate>)>,
}

impl Routing {
    /// The projects now: the kept ones while fresh and the registry's rows
    /// unchanged, else gathered again.
    fn candidates(&mut self, home: &bise_home::Home, rows: &[bise_home::projects::Row], now: Instant) -> Vec<Candidate> {
        let ids: Vec<String> = rows.iter().filter(|r| !r.home).map(|r| r.id.clone()).collect();
        if let Some((at, was, list)) = &self.last {
            if now.duration_since(*at) < TTL && *was == ids {
                return list.clone();
            }
        }
        let list = gather(home, rows);
        self.last = Some((now, ids, list.clone()));
        list
    }
}

impl Shell {
    /// His input to bise's main goes to a project when the guess is clear
    /// (true: sb-core was stepped with `RouteHold`); false: not routed, the
    /// caller steps the input as today.
    /// `context`: the input's fn context as it came (amb-core's
    /// `bise_proto::context::FnContext`, read here, never kept); absent
    /// or another shape: none, his words alone decide.
    pub(super) fn route_input(&mut self, focus: &str, text: &str, via: &str, queued: bool, context: Option<&serde_json::Value>) -> bool {
        if !routable(focus, text, via, queued) || !crate::paths::is_home(&self.opts.paths.workspace) {
            return false;
        }
        let home = bise_home::Home::from_env();
        let rows = bise_home::projects::list(&home, &crate::paths::home_workspace());
        let projects = self.routing.candidates(&home, &rows, Instant::now());
        let ctx: FnContext = context.and_then(|c| serde_json::from_value(c.clone()).ok()).unwrap_or_default();
        let g = route::guess(text, &ctx, &projects);
        let Some(to) = route::target(&g) else { return false };
        let name = projects.iter().find(|c| c.id == to).map_or_else(|| to.clone(), |c| c.name.clone());
        let why = why_line(&g, &name);
        self.step(Input::RouteHold { text: text.to_string(), via: via.to_string(), to, name, why });
        true
    }
}

/// Words that may go to a project: to main, sent now, not a command (an
/// `/answer` included), not fn space's 'start an agent' (bise's main
/// starts it), not empty.
fn routable(focus: &str, text: &str, via: &str, queued: bool) -> bool {
    let t = text.trim_start();
    (focus.is_empty() || focus == MAIN) && !queued && !t.is_empty() && !t.starts_with('/') && via != "capsule-start"
}

/// The route's reason, short, for his capsule line.
fn why_line(g: &Guess, name: &str) -> String {
    match g.why {
        "front file" => format!("the front file is in {name}"),
        "front url" => format!("the front page is {name}'s repo"),
        "named" => format!("you named {name}"),
        "title" => format!("the front window names {name}"),
        "recent" => format!("{name} talked about this lately"),
        other => other.to_string(),
    }
}

/// One candidate per registered project (the home row skipped): its git
/// remotes from `.git/config` (no git call), its main's recent lines from
/// its hub's transcript (never starts the hub).
fn gather(home: &bise_home::Home, rows: &[bise_home::projects::Row]) -> Vec<Candidate> {
    rows.iter()
        .filter(|r| !r.home)
        .map(|r| Candidate {
            id: r.id.clone(),
            name: r.name.clone(),
            path: r.path.clone(),
            remotes: remotes_of(&std::fs::read_to_string(r.path.join(".git").join("config")).unwrap_or_default()),
            recent: recent_of(&tail(&main_transcript(&home.hub_dir(&r.id), &r.name))),
        })
        .collect()
}

/// The `url = ...` values of a git config's remotes.
fn remotes_of(config: &str) -> Vec<String> {
    let mut in_remote = false;
    let mut v = Vec::new();
    for line in config.lines().map(str::trim) {
        if line.starts_with('[') {
            in_remote = line.starts_with("[remote ");
        } else if in_remote {
            if let Some((k, val)) = line.split_once('=') {
                if k.trim() == "url" && !val.trim().is_empty() {
                    v.push(val.trim().to_string());
                }
            }
        }
    }
    v
}

/// A project's main thread: its folder from the project's view.json
/// (amb-hub's `xread::who_of`, the reader `sb history --project` uses),
/// `agents/main` without a view.
fn main_transcript(state: &Path, name: &str) -> std::path::PathBuf {
    let who = super::xread::who_of(name, state);
    let dir = who
        .iter()
        .find(|w| w.name == format!("{name}/{MAIN}"))
        .and_then(|w| w.dir.split_once('/').map(|(_, d)| d.to_string()))
        .unwrap_or_else(|| MAIN.to_string());
    state.join("agents").join(dir).join("transcript.log")
}

/// His lines and main's answers at a transcript's end, newest first; the
/// roles read by `search::classify`, the one parser of transcript roles.
fn recent_of(transcript: &str) -> Vec<String> {
    let mut v: Vec<String> = transcript
        .lines()
        .filter_map(|l| crate::search::classify(l.split_once('\t').map_or(l, |(_, b)| b)))
        .filter(|(role, _)| matches!(role, Role::User | Role::Assistant))
        // its readable text names the role first ("user: ", "assistant: ")
        .map(|(role, t)| t.strip_prefix(&format!("{}: ", role.name())).unwrap_or(&t).trim().to_string())
        .filter(|t| !t.is_empty())
        .collect();
    v.reverse();
    v.truncate(RECENT);
    v
}

/// The last [`TAIL`] bytes of a file (its first, cut line dropped); empty
/// when it is missing.
fn tail(path: &Path) -> String {
    let Ok(mut f) = std::fs::File::open(path) else { return String::new() };
    let len = f.metadata().map(|m| m.len()).unwrap_or(0);
    let from = len.saturating_sub(TAIL);
    if f.seek(SeekFrom::Start(from)).is_err() {
        return String::new();
    }
    let mut buf = Vec::new();
    let _ = f.read_to_end(&mut buf);
    let s = String::from_utf8_lossy(&buf).into_owned();
    match (from > 0, s.split_once('\n')) {
        (true, Some((_, rest))) => rest.to_string(),
        _ => s,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use bise_home::projects::Row;
    use std::path::PathBuf;

    /// A fresh folder of this test.
    fn scratch(name: &str) -> PathBuf {
        let d = std::env::temp_dir().join(format!("sb-route-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(&d).unwrap();
        d
    }

    #[test]
    fn only_plain_words_to_main_now_are_routed() {
        assert!(routable("", "the shop's checkout is slow", "", false));
        assert!(routable(MAIN, "the shop's checkout is slow", "capsule", false));
        assert!(!routable("docs", "the shop's checkout is slow", "", false), "to another agent");
        assert!(!routable(MAIN, "the shop's checkout is slow", "", true), "queued");
        assert!(!routable(MAIN, "/answer 3 yes", "", false), "a command");
        assert!(!routable(MAIN, "  ", "", false), "empty");
        assert!(!routable(MAIN, "fix the shop", "capsule-start", false), "start an agent");
    }

    #[test]
    fn a_projects_remotes_come_from_its_git_config() {
        let config = "[core]\n\tbare = false\n\turl = not-a-remote\n[remote \"origin\"]\n\turl = git@github.com:acme/shop.git\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n[remote \"up\"]\n\turl=https://github.com/up/shop\n[branch \"main\"]\n\tremote = origin\n";
        assert_eq!(remotes_of(config), vec!["git@github.com:acme/shop.git", "https://github.com/up/shop"]);
        assert!(remotes_of("").is_empty());
    }

    #[test]
    fn recent_lines_are_his_and_mains_newest_first() {
        let t = "1\tsb you : the checkout\n2\t  obs: turn_started\n3\t  obs: assistant: on the checkout\n4\tsb msg : a → b\n5\tsb you : and the cart\n";
        assert_eq!(recent_of(t), vec!["and the cart", "on the checkout", "the checkout"]);
        let many: String = (0..100).map(|i| format!("{i}\tsb you : line {i}\n")).collect();
        let r = recent_of(&many);
        assert_eq!((r.len(), r[0].as_str()), (RECENT, "line 99"));
    }

    #[test]
    fn gathering_reads_remotes_and_recent_lines_and_skips_home() {
        let d = scratch("gather");
        let home = bise_home::Home::at(d.as_path().join("state"));
        let shop = d.as_path().join("shop");
        std::fs::create_dir_all(shop.join(".git")).unwrap();
        std::fs::write(shop.join(".git/config"), "[remote \"origin\"]\n\turl = https://github.com/acme/shop\n").unwrap();
        let tr = home.hub_dir("shop-1").join("agents/main");
        std::fs::create_dir_all(&tr).unwrap();
        std::fs::write(tr.join("transcript.log"), "1\tsb you : the checkout is slow\n").unwrap();
        let docs = d.as_path().join("docs");
        std::fs::create_dir_all(&docs).unwrap();
        let row = |id: &str, name: &str, path: &Path, home: bool| Row { path: path.into(), name: name.into(), id: id.into(), home, added_ms: 0 };
        let rows = vec![row("bise-0", "bise", d.as_path(), true), row("shop-1", "shop", &shop, false), row("docs-2", "docs", &docs, false)];
        let c = gather(&home, &rows);
        assert_eq!(c.iter().map(|c| c.id.as_str()).collect::<Vec<_>>(), vec!["shop-1", "docs-2"]);
        assert_eq!(c[0].remotes, vec!["https://github.com/acme/shop"]);
        assert_eq!(c[0].recent, vec!["the checkout is slow"]);
        assert!(c[1].remotes.is_empty() && c[1].recent.is_empty(), "no git, no hub yet: nothing, no error");
        let g = route::guess("is the checkout still slow on the shop?", &FnContext::default(), &c);
        assert_eq!(route::target(&g).as_deref(), Some("shop-1"));
        assert_eq!(why_line(&g, "shop"), "you named shop");
    }

    #[test]
    fn gathered_projects_are_kept_a_minute_while_the_rows_stay() {
        let d = scratch("keep");
        let home = bise_home::Home::at(d.join("state"));
        let shop = d.join("shop");
        std::fs::create_dir_all(&shop).unwrap();
        let row = |id: &str| Row { path: shop.clone(), name: id.into(), id: id.into(), home: false, added_ms: 0 };
        let tr = home.hub_dir("shop-1").join("agents/main");
        std::fs::create_dir_all(&tr).unwrap();
        let mut r = Routing::default();
        let t0 = Instant::now();
        assert!(r.candidates(&home, &[row("shop-1")], t0)[0].recent.is_empty());
        std::fs::write(tr.join("transcript.log"), "1\tsb you : the checkout\n").unwrap();
        assert!(r.candidates(&home, &[row("shop-1")], t0 + Duration::from_secs(30))[0].recent.is_empty(), "kept");
        assert_eq!(r.candidates(&home, &[row("shop-1")], t0 + TTL)[0].recent, vec!["the checkout"], "a minute later: gathered again");
        let both = r.candidates(&home, &[row("shop-1"), row("docs-2")], t0 + TTL);
        assert_eq!(both.len(), 2, "a new row: gathered again at once");
    }

    #[test]
    fn a_transcripts_tail_drops_its_cut_line() {
        let d = scratch("tail");
        let p = d.as_path().join("t.log");
        let long = "x".repeat(TAIL as usize);
        std::fs::write(&p, format!("{long}\n1\tsb you : last\n")).unwrap();
        assert_eq!(tail(&p), "1\tsb you : last\n");
        assert_eq!(tail(&d.as_path().join("none")), "");
    }
}
