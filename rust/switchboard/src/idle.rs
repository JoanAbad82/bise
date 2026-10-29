//! idle-exit (docs/idle-exit.md): a hub nobody looks at stops by itself.
//!
//! The hub counts its UIs: the clients that said `hello` (the TUI, the
//! ambient app's core) and the holds others take on it (`Holds`: a
//! page's open event stream). When the count stays at 0 for the grace
//! period (`idle_exit` in config.toml or `$BISE_IDLE_EXIT`, default 2
//! min), the hub stops for good once none of its own operations runs
//! ([`Own`]: a REPL starting or switching, a probation, its builds; at
//! most [`OWN_MAX`] past the grace). The agents' work ([`Work`]: a turn,
//! a background job, a standing order) does not hold it (quit-stop,
//! #817): the stop cuts it, hub.log and main's thread ([`cut_line`])
//! say what; `idle_exit_waits = true` ([`waits`]) makes it hold as
//! before. A UI that comes back during the grace or the wait cancels
//! it. The stop is the one of `bise --stop`: every REPL checkpoints and
//! exits, what the agents started goes with them; the next `bise`
//! brings it all back from the journal and the saved sessions.
//!
//! Pure but for `bg_jobs` (a folder read): the clock, the count and what
//! runs come from the hub (`daemon.rs`), the rule is [`busy`].

use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant, SystemTime};

pub const ENV: &str = "BISE_IDLE_EXIT";
pub const DEFAULT_GRACE: Duration = Duration::from_secs(120);
/// A background job older than this no longer holds the hub up: a dev
/// server or a `tail -f` an agent forgot would keep it forever.
pub const JOB_MAX: Duration = Duration::from_secs(6 * 3600);

/// The grace period: `$BISE_IDLE_EXIT`, else `idle_exit` in config.toml,
/// else 2 min. A number of seconds or `90s`, `5m`, `1h`; `off` (or
/// `never`, `false`): the hub never stops by itself. Unreadable: the
/// default.
pub fn grace(env: Option<&str>, config: &str) -> Option<Duration> {
    let from_config = || {
        let t: toml::Table = config.parse().ok()?;
        match t.get("idle_exit")? {
            toml::Value::String(s) => Some(s.clone()),
            toml::Value::Integer(n) => Some(n.to_string()),
            toml::Value::Boolean(false) => Some("off".into()),
            _ => None,
        }
    };
    let text = env.map(str::to_string).filter(|s| !s.trim().is_empty()).or_else(from_config);
    match text {
        Some(t) => parse(&t).unwrap_or(Some(DEFAULT_GRACE)),
        None => Some(DEFAULT_GRACE),
    }
}

/// `off` -> Some(None); `90`, `90s`, `5m`, `1h` -> Some(Some(d)); else None.
fn parse(s: &str) -> Option<Option<Duration>> {
    let s = s.trim().to_ascii_lowercase();
    if matches!(s.as_str(), "off" | "never" | "false" | "no") {
        return Some(None);
    }
    let (num, unit) = match s.char_indices().find(|(_, c)| !c.is_ascii_digit()) {
        Some((i, _)) => (&s[..i], s[i..].trim()),
        None => (s.as_str(), "s"),
    };
    let n: u64 = num.parse().ok()?;
    let secs = match unit {
        "s" | "sec" | "secs" => n,
        "m" | "min" | "mins" => n * 60,
        "h" => n * 3600,
        _ => return None,
    };
    Some(Some(Duration::from_secs(secs)))
}

/// Holds on the hub besides its `hello` clients (a page's open event
/// stream): the hub does not stop while one is held.
#[derive(Clone, Default)]
pub struct Holds(Arc<AtomicUsize>);

/// One hold; dropping it lets go.
pub struct Hold(Arc<AtomicUsize>);

impl Holds {
    pub fn hold(&self) -> Hold {
        self.0.fetch_add(1, Ordering::AcqRel);
        Hold(self.0.clone())
    }

    pub fn count(&self) -> usize {
        self.0.load(Ordering::Acquire)
    }
}

impl Drop for Hold {
    fn drop(&mut self) {
        self.0.fetch_sub(1, Ordering::AcqRel);
    }
}

/// What the hub does after a look.
#[derive(Debug, PartialEq, Eq)]
pub enum Step {
    Stay,
    /// stay, and say this in hub.log
    Say(String),
    /// stop for good: the line for hub.log, and the one for main's
    /// thread when the stop cut the agents' work
    Stop { log: String, main: Option<String> },
}

/// `a`, `a and b`, `a, b and c`.
fn and_list(v: &[String]) -> String {
    match v {
        [] => String::new(),
        [a] => a.clone(),
        [init @ .., last] => format!("{} and {}", init.join(", "), last),
    }
}

/// Main's line when the stop cut something (designer m_48451): his
/// words, the commands by name, nothing cut: no line. Main's thread
/// keeps it, he reads it at the next start. `alone`: since the last UI;
/// `own`: the hub's own operations it cut (past [`OWN_MAX`]); `work`:
/// the agents' work it cut.
pub fn cut_line(alone: Duration, own: &[String], work: &Work) -> Option<String> {
    let mut agents: Vec<&str> = work.mid_turn.iter().map(String::as_str).collect();
    for (a, jobs) in &work.jobs {
        if !jobs.is_empty() && !agents.contains(&a.as_str()) {
            agents.push(a);
        }
    }
    let (mut stopped, mut next) = (Vec::new(), Vec::new());
    for a in agents {
        let mid = work.mid_turn.iter().any(|m| m == a);
        let names: Vec<String> =
            work.jobs.iter().filter(|(b, _)| b == a).flat_map(|(_, j)| j.iter().map(|j| j.name.clone())).collect();
        // `cargo test`, `cargo test and pnpm dev`, past 2 a count
        let (cmds, again) = match names.len() {
            0 => (None, None),
            1 | 2 => (Some(and_list(&names)), Some(and_list(&names))),
            n => (Some(format!("{} of {} commands", n, if mid { "its".into() } else { format!("{}'s", a) })), Some(format!("its {} commands", n))),
        };
        match (mid, cmds) {
            (true, Some(c)) => {
                stopped.push(format!("{} mid-turn", a));
                stopped.push(if names.len() > 2 { c } else { format!("its {}", c) });
            }
            (true, None) => stopped.push(format!("{} mid-turn", a)),
            (false, Some(c)) => stopped.push(if names.len() > 2 { c } else { format!("{}'s {}", a, c) }),
            (false, None) => {}
        }
        next.push(match (mid, again) {
            (true, Some(g)) => format!("{} picks up its turn and is told to run {} again", a, g),
            (true, None) => format!("{} picks up its turn", a),
            (false, Some(g)) => format!("{} is told to run {} again", a, g),
            (false, None) => continue,
        });
    }
    match work.timers {
        0 => {}
        1 => stopped.push("a scheduled task".into()),
        n => stopped.push(format!("{} scheduled tasks", n)),
    }
    stopped.extend(own.iter().cloned());
    if stopped.is_empty() {
        return None;
    }
    let mins = ((alone.as_secs() + 30) / 60).max(1);
    let mut s = format!("bise stopped {} min after its last window closed. that stopped {}.", mins, and_list(&stopped));
    if !next.is_empty() {
        s.push_str(&format!(" at the next start {}.", and_list(&next)));
    }
    match (work.timers, next.is_empty()) {
        (0, _) => {}
        (1, false) => s.push_str(" the scheduled task runs again too."),
        (_, false) => s.push_str(" the scheduled tasks run again too."),
        (1, true) => s.push_str(" at the next start the scheduled task runs again."),
        (_, true) => s.push_str(" at the next start the scheduled tasks run again."),
    }
    Some(s)
}

/// A background command's name for his line, from its `.cmd` file
/// (the bash tool's `cd <dir> || exit 1` first, then the command): the
/// first real step's program and its subcommand, `cargo test`, `pnpm
/// dev`, `gate.sh quick`; wrappers (`env`, `nohup`, heavy-run and its
/// flags), `VAR=x`, `cd`, `sb`, `echo` skipped. Nothing found: `a command`.
pub fn cmd_name(cmd: &str) -> String {
    const SKIP: [&str; 7] = ["sb", "echo", "sleep", "export", "source", "mkdir", "rm"];
    const WRAP: [&str; 6] = ["env", "nohup", "time", "exec", "caffeinate", "heavy-run"];
    const SUB: [&str; 14] =
        ["cargo", "pnpm", "npm", "yarn", "npx", "git", "make", "uv", "go", "docker", "gh", "bun", "bise", "just"];
    let base = |t: &str| t.rsplit('/').next().unwrap_or(t).to_string();
    let lines = cmd.lines().map(str::trim).filter(|l| !l.is_empty() && !l.starts_with('#'));
    let mut first = None;
    for seg in lines.flat_map(|l| l.split(&['&', ';', '|'][..])) {
        let mut toks = seg.split_whitespace().peekable();
        // VAR=x, the wrappers and their flags
        while let Some(t) = toks.peek() {
            let b = base(t);
            if t.contains('=') && !t.starts_with('-') || WRAP.contains(&b.as_str()) || t.starts_with('-') {
                toks.next();
            } else {
                break;
            }
        }
        let Some(prog) = toks.next().map(base) else { continue };
        // the bash tool's `cd <dir> || exit 1`: no name, not even the last resort
        if ["cd", "exit", "true"].contains(&prog.as_str()) {
            continue;
        }
        let sub = toks.find(|t| !t.starts_with('-') && !t.contains('>') && !t.contains('<'));
        let name = match sub {
            Some(s) if SUB.contains(&prog.as_str()) || prog.ends_with(".sh") => format!("{} {}", prog, s),
            Some(s) if ["python", "python3", "node", "bash", "sh"].contains(&prog.as_str()) => base(s),
            _ => prog.clone(),
        };
        if !SKIP.contains(&prog.as_str()) {
            return name;
        }
        first.get_or_insert(name);
    }
    first.unwrap_or_else(|| "a command".into())
}

/// `idle_exit_waits = true` in config.toml: the agents' work (a turn, a
/// background job, a standing order) holds the hub after the grace, the
/// rule before the quit-stop change. Default false: it is cut.
pub fn waits(config: &str) -> bool {
    let t: Option<toml::Table> = config.parse().ok();
    t.and_then(|t| t.get("idle_exit_waits").and_then(|v| v.as_bool())).unwrap_or(false)
}

/// The hub's own operations that run now. Each is bounded on its own
/// (a REPL start: its idle limit `repl_start::START_STILL_MS`; a version
/// switch's probation: `probation_until`) or not (a REPL switching, a
/// `/version` build, `/update`, `/release-bise`: no timeout of their
/// own), so they all hold the hub at most [`OWN_MAX`] past the grace:
/// a hung build never keeps it up after his quit.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct Own {
    pub starting: bool,
    pub switching: bool,
    pub probation: bool,
    pub building: bool,
    pub updating: bool,
    pub release: bool,
}

/// What the agents run now: who is mid-turn (or in `sb wait`), each
/// agent's background jobs (the agent, its jobs), the live `sb every`
/// timers.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct Work {
    pub mid_turn: Vec<String>,
    pub jobs: Vec<(String, Vec<Job>)>,
    pub timers: usize,
}

/// A background job of an agent's bash tool: its number (hub.log) and
/// its command's name ([`cmd_name`], his line).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Job {
    pub id: String,
    pub name: String,
}

/// The hub's own operations hold it at most this long past the grace.
pub const OWN_MAX: Duration = Duration::from_secs(3600);

/// After the grace: what holds the hub, and what the stop cuts.
#[derive(Debug, Default, PartialEq, Eq)]
pub struct Busy {
    pub holds: Vec<String>,
    pub cut: Vec<String>,
}

impl Own {
    fn reasons(&self) -> Vec<String> {
        [
            (self.starting, "a REPL starting"),
            (self.switching, "a REPL switching"),
            // its idle exit read as a crash: the switch rolled back
            (self.probation, "a version switch on probation"),
            (self.building, "a version build"),
            (self.updating, "the /update build"),
            (self.release, "/release-bise"),
        ]
        .into_iter()
        .filter(|(on, _)| *on)
        .map(|(_, r)| r.to_string())
        .collect()
    }
}

impl Work {
    fn reasons(&self) -> Vec<String> {
        let mut v: Vec<String> = self.mid_turn.iter().map(|a| format!("{} mid-turn", a)).collect();
        for (a, jobs) in self.jobs.iter().filter(|(_, j)| !j.is_empty()) {
            let ids: Vec<&str> = jobs.iter().map(|j| j.id.as_str()).collect();
            v.push(format!("{}'s background job {}", a, ids.join(" ")));
        }
        match self.timers {
            0 => {}
            1 => v.push("a standing order (sb every)".into()),
            n => v.push(format!("{} standing orders (sb every)", n)),
        }
        v
    }
}

/// The rule: the hub's own operations hold it until `own_over` (past
/// [`OWN_MAX`]); the agents' work holds it only when `waits` (the
/// opt-out), else the stop cuts it (it resumes at the next bise).
pub fn busy(own: &Own, work: &Work, waits: bool, own_over: bool) -> Busy {
    let (own, work) = (own.reasons(), work.reasons());
    let mut b = Busy::default();
    if own_over {
        b.cut.extend(own);
    } else {
        b.holds.extend(own);
    }
    if waits {
        b.holds.extend(work);
    } else {
        b.cut.extend(work);
    }
    b
}

/// The watch: since when no UI is there, and what it last said.
pub struct Watch {
    grace: Option<Duration>,
    waits: bool,
    alone_since: Option<Instant>,
    said: Option<String>,
}

impl Watch {
    /// A hub starts alone: one nobody opens (a test's, a relaunch nobody
    /// came back to) stops after the grace like any other. `waits`:
    /// [`waits`] (the agents' work holds it).
    pub fn new(grace: Option<Duration>, waits: bool, now: Instant) -> Watch {
        Watch {
            grace,
            waits,
            alone_since: Some(now),
            said: None,
        }
    }

    pub fn grace(&self) -> Option<Duration> {
        self.grace
    }

    /// hub.log's line at boot: the grace, and the rule (`idle_exit_waits`).
    pub fn boot_line(&self, grace: Duration) -> String {
        match self.waits {
            true => format!("idle exit: after {} s without a UI, once nothing runs (idle_exit_waits)", grace.as_secs()),
            false => format!("idle exit: after {} s without a UI, whatever the agents run", grace.as_secs()),
        }
    }

    /// One look: `uis` the UIs there now, `running` what runs (asked only
    /// once the grace is over: it reads folders).
    pub fn step(&mut self, now: Instant, uis: usize, running: impl FnOnce() -> (Own, Work)) -> Step {
        let Some(grace) = self.grace else { return Step::Stay };
        if uis > 0 {
            self.alone_since = None;
            return match self.said.take() {
                Some(_) => Step::Say("idle exit: a UI is back, the hub stays".into()),
                None => Step::Stay,
            };
        }
        let since = *self.alone_since.get_or_insert(now);
        let alone = now.duration_since(since);
        if alone < grace {
            if self.said.is_none() && since == now {
                let s = format!(
                    "idle exit: no UI left, the hub stops in {} s{}",
                    grace.as_secs(),
                    if self.waits { " once nothing runs" } else { "" }
                );
                self.said = Some(s.clone());
                return Step::Say(s);
            }
            return Step::Stay;
        }
        let (own, work) = running();
        let own_over = alone >= grace + OWN_MAX;
        let b = busy(&own, &work, self.waits, own_over);
        if b.holds.is_empty() {
            let none = Work::default();
            let main = cut_line(
                alone,
                &if own_over { own.reasons() } else { Vec::new() },
                if self.waits { &none } else { &work },
            );
            return match b.cut.is_empty() {
                true => Step::Stop {
                    log: format!(
                        "idle exit: no UI for {} s and nothing runs: the hub stops (the next bise brings it all back)",
                        alone.as_secs()
                    ),
                    main: None,
                },
                false => Step::Stop {
                    log: format!(
                        "idle exit: no UI for {} s: the hub stops (cut: {}; all resume at the next bise)",
                        alone.as_secs(),
                        b.cut.join(", ")
                    ),
                    main,
                },
            };
        }
        let s = format!("idle exit: no UI, the hub waits for: {}", b.holds.join(", "));
        if self.said.as_deref() == Some(s.as_str()) {
            return Step::Stay;
        }
        self.said = Some(s.clone());
        Step::Say(s)
    }
}

/// The background jobs of an agent's bash tool still running in `bg`
/// (its `BEND_BG_DIR`): a `<n>.slot` folder whose `<n>.pid` is alive and
/// younger than `JOB_MAX`. Their numbers.
pub fn bg_jobs(bg: &Path, alive: impl Fn(u32) -> bool) -> Vec<String> {
    let Ok(rd) = std::fs::read_dir(bg) else { return Vec::new() };
    let mut out: Vec<String> = rd
        .flatten()
        .filter_map(|e| e.file_name().to_str().and_then(|n| n.strip_suffix(".slot")).map(str::to_string))
        .filter(|n| {
            let f = bg.join(format!("{}.pid", n));
            let young = std::fs::metadata(&f)
                .and_then(|m| m.modified())
                .ok()
                .and_then(|t| SystemTime::now().duration_since(t).ok())
                .is_some_and(|age| age < JOB_MAX);
            young
                && std::fs::read_to_string(&f)
                    .ok()
                    .and_then(|p| p.trim().parse().ok())
                    .is_some_and(&alive)
        })
        .collect();
    out.sort();
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    const S: fn(u64) -> Duration = Duration::from_secs;

    #[test]
    fn the_grace_reads_the_env_then_the_config() {
        assert_eq!(grace(None, ""), Some(DEFAULT_GRACE));
        assert_eq!(grace(Some("30"), "idle_exit = \"5m\""), Some(S(30)));
        assert_eq!(grace(None, "idle_exit = \"5m\""), Some(S(300)));
        assert_eq!(grace(None, "idle_exit = 45"), Some(S(45)));
        assert_eq!(grace(None, "idle_exit = \"off\""), None);
        assert_eq!(grace(None, "idle_exit = false"), None);
        assert_eq!(grace(Some("never"), ""), None);
        assert_eq!(grace(Some("1h"), ""), Some(S(3600)));
        assert_eq!(grace(Some("2 m"), ""), Some(S(120)));
        // unreadable: the default, never "off" by mistake
        assert_eq!(grace(Some("soon"), ""), Some(DEFAULT_GRACE));
        assert_eq!(grace(None, "idle_exit = [1]"), Some(DEFAULT_GRACE));
        assert_eq!(grace(Some(""), "idle_exit = \"10s\""), Some(S(10)));
    }

    /// Nothing runs.
    fn idle() -> (Own, Work) {
        Default::default()
    }

    /// The hub's own: a REPL starting.
    fn starting() -> (Own, Work) {
        (Own { starting: true, ..Default::default() }, Work::default())
    }

    fn job(id: &str, name: &str) -> Job {
        Job { id: id.into(), name: name.into() }
    }

    /// The agents' work: t1 mid-turn, its background job 3, two standing orders.
    fn work() -> (Own, Work) {
        let w = Work {
            mid_turn: vec!["t1".into()],
            jobs: vec![("t1".into(), vec![job("3", "cargo test")]), ("t2".into(), vec![])],
            timers: 2,
        };
        (Own::default(), w)
    }

    #[test]
    fn the_hub_stops_after_the_grace_once_nothing_of_its_own_runs() {
        let t0 = Instant::now();
        let mut w = Watch::new(Some(S(120)), false, t0);
        // a UI the first second: nothing said, no stop
        assert_eq!(w.step(t0, 1, idle), Step::Stay);
        // it leaves: the grace starts
        assert!(matches!(w.step(t0 + S(10), 0, idle), Step::Say(s) if s.ends_with("stops in 120 s")));
        assert_eq!(w.step(t0 + S(100), 0, || panic!("not asked during the grace")), Step::Stay);
        // over: a REPL starting holds it, said once
        assert!(matches!(w.step(t0 + S(131), 0, starting), Step::Say(s) if s.contains("a REPL starting")));
        assert_eq!(w.step(t0 + S(140), 0, starting), Step::Stay);
        // it started: stop
        assert!(matches!(w.step(t0 + S(150), 0, idle), Step::Stop { log, main: None } if log.contains("nothing runs")));
    }

    /// quit-stop (#817): after his quit, the agents' work never holds
    /// the hub: a turn, a background job, standing orders are cut at
    /// the grace, and the stop line names them.
    #[test]
    fn the_agents_work_is_cut_at_the_grace() {
        let t0 = Instant::now();
        let mut w = Watch::new(Some(S(120)), false, t0);
        assert_eq!(w.step(t0 + S(119), 0, work), Step::Stay);
        let Step::Stop { log, main } = w.step(t0 + S(121), 0, work) else { panic!("the work held the hub") };
        assert_eq!(
            log,
            "idle exit: no UI for 121 s: the hub stops (cut: t1 mid-turn, t1's background job 3, \
             2 standing orders (sb every); all resume at the next bise)"
        );
        assert_eq!(
            main.as_deref(),
            Some(
                "bise stopped 2 min after its last window closed. that stopped t1 mid-turn, its cargo test and \
                 2 scheduled tasks. at the next start t1 picks up its turn and is told to run cargo test again. \
                 the scheduled tasks run again too."
            )
        );
    }

    /// Main's line (designer m_48451): commands by name, two at most,
    /// then a count; nothing cut, no line.
    #[test]
    fn mains_line_names_what_was_stopped_in_his_words() {
        let m = S(120);
        assert_eq!(cut_line(m, &[], &Work::default()), None);
        let w = Work {
            mid_turn: vec![],
            jobs: vec![("t1".into(), vec![job("3", "cargo test"), job("4", "pnpm dev")])],
            timers: 1,
        };
        assert_eq!(
            cut_line(m, &[], &w).unwrap(),
            "bise stopped 2 min after its last window closed. that stopped t1's cargo test and pnpm dev and a scheduled task. \
             at the next start t1 is told to run cargo test and pnpm dev again. the scheduled task runs again too."
        );
        let w = Work {
            mid_turn: vec!["main".into(), "t1".into()],
            jobs: vec![("t1".into(), vec![job("1", "a"), job("2", "b"), job("3", "c")])],
            timers: 0,
        };
        assert_eq!(
            cut_line(m, &[], &w).unwrap(),
            "bise stopped 2 min after its last window closed. that stopped main mid-turn, t1 mid-turn and 3 of its commands. \
             at the next start main picks up its turn and t1 picks up its turn and is told to run its 3 commands again."
        );
        let w = Work { timers: 2, ..Default::default() };
        assert_eq!(
            cut_line(S(3600), &["a version build".into()], &w).unwrap(),
            "bise stopped 60 min after its last window closed. that stopped 2 scheduled tasks and a version build. \
             at the next start the scheduled tasks run again."
        );
    }

    #[test]
    fn a_jobs_name_is_its_command_not_its_wrappers() {
        let cd = "cd '/w/harness' || exit 1\n";
        assert_eq!(cmd_name(&format!("{cd}cargo test -p switchboard --lib idle::")), "cargo test");
        assert_eq!(cmd_name(&format!("{cd}cd apps/desktop && pnpm dev")), "pnpm dev");
        assert_eq!(cmd_name(&format!("{cd}~/.bise/run/heavy-run --low -- tests/gate.sh quick > o 2>&1")), "gate.sh quick");
        assert_eq!(cmd_name(&format!("{cd}sb status working; RUST_LOG=1 nohup python3 -u tests/x_e2e.py")), "x_e2e.py");
        assert_eq!(cmd_name(&format!("{cd}sleep 30")), "sleep");
        assert_eq!(cmd_name(cd), "a command");
        assert_eq!(cmd_name(""), "a command");
    }

    /// `idle_exit_waits = true`: the rule before quit-stop, the work holds.
    #[test]
    fn with_waits_the_agents_work_holds_the_hub() {
        let t0 = Instant::now();
        let mut w = Watch::new(Some(S(60)), true, t0);
        assert!(matches!(w.step(t0, 0, idle), Step::Say(s) if s.ends_with("once nothing runs")));
        assert!(matches!(w.step(t0 + S(61), 0, work), Step::Say(s) if s.contains("t1 mid-turn") && s.contains("2 standing orders")));
        assert_eq!(w.step(t0 + S(600), 0, work), Step::Stay);
        assert!(matches!(w.step(t0 + S(601), 0, idle), Step::Stop { .. }));
    }

    /// The laws of the rule: the hub's own hold whatever `waits` (until
    /// OWN_MAX), the work holds only with `waits`, the cut names exactly
    /// what does not hold.
    #[test]
    fn the_rule_holds_its_own_and_cuts_the_work() {
        let (own, _) = starting();
        let (_, wk) = work();
        let all = [own.reasons(), wk.reasons()].concat();
        for waits in [false, true] {
            let b = busy(&own, &Work::default(), waits, false);
            assert_eq!((b.holds, b.cut), (own.reasons(), vec![]), "its own hold, waits={waits}");
        }
        let b = busy(&Own::default(), &wk, false, false);
        assert_eq!((b.holds, b.cut), (vec![], wk.reasons()));
        let b = busy(&Own::default(), &wk, true, false);
        assert_eq!((b.holds, b.cut), (wk.reasons(), vec![]));
        // past OWN_MAX: its own are cut too, nothing lost from the list
        let b = busy(&own, &wk, false, true);
        assert!(b.holds.is_empty());
        assert_eq!(b.cut, all);
        assert_eq!(busy(&own, &wk, false, false).cut, wk.reasons());
    }

    #[test]
    fn the_hubs_own_hold_it_at_most_own_max() {
        let t0 = Instant::now();
        let mut w = Watch::new(Some(S(60)), false, t0);
        assert!(matches!(w.step(t0 + S(61), 0, starting), Step::Say(_)));
        assert_eq!(w.step(t0 + S(60) + OWN_MAX - S(1), 0, starting), Step::Stay);
        assert!(matches!(w.step(t0 + S(60) + OWN_MAX, 0, starting), Step::Stop { log, .. } if log.contains("cut: a REPL starting")));
    }

    #[test]
    fn waits_reads_the_config() {
        assert!(!waits(""));
        assert!(waits("idle_exit_waits = true"));
        assert!(!waits("idle_exit_waits = false"));
        assert!(!waits("idle_exit_waits = \"yes\""), "not a bool: the default");
    }

    #[test]
    fn a_ui_back_during_the_grace_or_the_wait_cancels_it() {
        let t0 = Instant::now();
        let mut w = Watch::new(Some(S(60)), false, t0);
        assert!(matches!(w.step(t0, 0, idle), Step::Say(_)));
        // a quick relaunch: back before the grace ends
        assert!(matches!(w.step(t0 + S(50), 1, idle), Step::Say(s) if s.contains("back")));
        // gone again: a fresh grace, from now
        assert!(matches!(w.step(t0 + S(70), 0, idle), Step::Say(_)));
        assert_eq!(w.step(t0 + S(120), 0, idle), Step::Stay);
        assert!(matches!(w.step(t0 + S(131), 0, idle), Step::Stop { .. }));
    }

    #[test]
    fn a_hub_nobody_opens_stops_and_off_never_does() {
        let t0 = Instant::now();
        let mut w = Watch::new(Some(S(60)), false, t0);
        assert!(matches!(w.step(t0 + S(61), 0, idle), Step::Stop { .. }));
        let mut off = Watch::new(None, false, t0);
        assert_eq!(off.step(t0 + S(100_000), 0, idle), Step::Stay);
    }

    #[test]
    fn holds_count_until_dropped() {
        let h = Holds::default();
        let a = h.hold();
        let b = h.clone().hold();
        assert_eq!(h.count(), 2);
        drop(a);
        assert_eq!(h.count(), 1);
        drop(b);
        assert_eq!(h.count(), 0);
    }

    #[test]
    fn a_running_young_job_holds_the_hub() {
        let d = std::env::temp_dir().join(format!("idle-bg-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(d.join("3.slot")).unwrap();
        std::fs::write(d.join("3.pid"), "4242\n").unwrap();
        // done: no slot, a .rc
        std::fs::write(d.join("1.rc"), "0\n").unwrap();
        // a slot whose process is gone
        std::fs::create_dir_all(d.join("5.slot")).unwrap();
        std::fs::write(d.join("5.pid"), "999999\n").unwrap();
        assert_eq!(bg_jobs(&d, |p| p == 4242), vec!["3".to_string()]);
        assert!(bg_jobs(&d.join("none"), |_| true).is_empty());
        let _ = std::fs::remove_dir_all(&d);
    }
}
