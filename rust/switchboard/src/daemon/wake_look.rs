//! The look of `sb wake`'s watches (event-wake), off the hub's loop
//! (hub-loop, docs/issues/32): a worker thread looks at the live watches
//! of active agents through the real world (files, kill(0), `ps`,
//! `launchctl`) and sends each event it sees to the loop as
//! `Msg::WakeSeen`; the loop runs it through sb-core as `Input::WakeHit`
//! only when that watch is still live, and sb-core ends it and wakes its
//! agent once. Before, the loop looked itself, on the Tick: his hub's
//! loop sat 47 s in one "wakes look" and 25 agents' `sb` gave up.
//!
//! The worker never reads the hub: the loop sends it a copy of the
//! watches when their ids or agents change ([`WakeLook::sync`], on the
//! Tick). It reports a watch once and forgets it when a copy without it
//! comes ([`Looker`], pure but for its probe).
//!
//! Battery (idle-cpu): no live watch, the worker sleeps until a copy
//! comes. `stat` and kill(0) once a second; a pid's start time (`ps`,
//! against a reused pid) and `launchctl list` (a process each) at most
//! every [`COSTLY_MS`]; a launchd job's pid, once seen, is watched with
//! kill(0) and launchctl is asked again only when it is gone (for its
//! LastExitStatus). Owns: the cadence, the jobs' pids seen, the ids
//! reported (lost on restart by design). Not here: the decision
//! (sb-core), the words and the look's logic (wake.rs).

use super::*;
use crate::wake::{self, Costly, JobState, Probe, Seen};
use std::io::{Read, Seek, SeekFrom};
use std::sync::mpsc::RecvTimeoutError;

/// A look at most this often.
const LOOK_MS: u64 = 1000;
/// `ps` and `launchctl` at most this often.
const COSTLY_MS: u64 = 10_000;
/// What a look reads of a file: its head, its tail.
const READ_MAX: u64 = 8192;

/// A watch's event, seen by the worker: `Input::WakeHit`'s facts.
#[derive(Debug, PartialEq)]
pub(super) struct WakeSeen {
    pub(super) id: u64,
    pub(super) text: String,
    pub(super) rc: Option<i64>,
    pub(super) tail: Vec<String>,
    pub(super) after_ms: u64,
}

/// The loop's side: the copy last sent, and the worker's door.
pub(super) struct WakeLook {
    sent: Vec<(u64, String)>,
    to_worker: Sender<Vec<wake::Watch>>,
}

impl WakeLook {
    /// The worker, sending what it sees on `to_loop`.
    pub(super) fn start(to_loop: Sender<Msg>) -> WakeLook {
        let (to_worker, rx) = channel();
        std::thread::spawn(move || worker(rx, to_loop));
        WakeLook { sent: Vec::new(), to_worker }
    }

    /// The live watches of active agents now: sent to the worker when
    /// their ids or agents changed since the last copy.
    pub(super) fn sync(&mut self, watches: Vec<wake::Watch>) {
        let key: Vec<(u64, String)> = watches.iter().map(|w| (w.id, w.agent.clone())).collect();
        if key != self.sent {
            self.sent = key;
            let _ = self.to_worker.send(watches);
        }
    }
}

impl Shell {
    /// On the Tick: the worker's copy of the watches to look at.
    pub(super) fn wakes_sync(&mut self) {
        let active = |a: &str| self.hub.st.agents.get(a).is_some_and(|a| a.lifecycle == Lifecycle::Active);
        let watches = self.hub.wakes().live.values().filter(|w| active(&w.agent)).cloned().collect();
        self.wake_look.sync(watches);
    }

    /// The worker saw a watch's event: to sb-core, once, if the watch is
    /// still live (ended meanwhile, by sb-core or a drop: nothing).
    pub(super) fn wake_seen(&mut self, s: WakeSeen) {
        if self.hub.wakes().live.contains_key(&s.id) {
            self.step(Input::WakeHit { id: s.id, text: s.text, rc: s.rc, tail: s.tail, after_ms: s.after_ms });
        }
    }
}

/// The worker's state between looks: pure but for the probe and the clock
/// it is handed.
#[derive(Default)]
struct Looker {
    watches: Vec<wake::Watch>,
    last_ms: u64,
    costly_ms: u64,
    /// a launchd job's pid, by watch id, once a look saw it
    job_pids: BTreeMap<u64, u32>,
    /// watches whose event went to the loop: never again
    reported: BTreeSet<u64>,
}

impl Looker {
    /// A new copy from the loop: what it no longer has is forgotten.
    fn copy(&mut self, watches: Vec<wake::Watch>) {
        let ids: BTreeSet<u64> = watches.iter().map(|w| w.id).collect();
        self.job_pids.retain(|id, _| ids.contains(id));
        self.reported.retain(|id| ids.contains(id));
        self.watches = watches;
    }

    /// When the next look is due (ms from `now`); None: nothing to look at.
    fn due_in(&self, now: u64) -> Option<u64> {
        (!self.watches.is_empty()).then(|| (self.last_ms + LOOK_MS).saturating_sub(now))
    }

    /// One look at every watch not reported yet: the events seen.
    fn look(&mut self, p: &dyn Probe, now: u64) -> Vec<WakeSeen> {
        self.last_ms = now;
        let costly = now >= self.costly_ms + COSTLY_MS;
        if costly {
            self.costly_ms = now;
        }
        let mut out = Vec::new();
        for w in self.watches.iter().filter(|w| !self.reported.contains(&w.id)) {
            let (seen, pid) = wake::look(&w.spec, p, Costly { start: costly, job: costly }, self.job_pids.get(&w.id).copied());
            match pid {
                Some(p) => self.job_pids.insert(w.id, p),
                None => self.job_pids.remove(&w.id),
            };
            if let Seen::Ended { rc } = seen {
                let tail = w.spec.tail.as_deref().and_then(|t| p.tail(t));
                let after_ms = now.saturating_sub(w.set_at);
                let text = wake::hit_text(&w.spec, rc.as_deref(), tail.as_deref(), after_ms);
                let hit = wake::Hit::of(rc.as_deref(), tail.as_deref(), after_ms);
                out.push(WakeSeen { id: w.id, text, rc: hit.rc, tail: hit.tail, after_ms });
            }
        }
        self.reported.extend(out.iter().map(|s| s.id));
        out
    }
}

/// The worker: a copy from the loop, or a look when one is due; ends with
/// the hub (either channel closed).
fn worker(rx: Receiver<Vec<wake::Watch>>, to_loop: Sender<Msg>) {
    let mut l = Looker::default();
    loop {
        let got = match l.due_in(now_ms()) {
            // battery: nothing to look at, wait for a copy
            None => rx.recv().map_err(|_| RecvTimeoutError::Disconnected),
            Some(ms) => rx.recv_timeout(Duration::from_millis(ms)),
        };
        match got {
            Ok(w) => l.copy(w),
            Err(RecvTimeoutError::Disconnected) => return,
            Err(RecvTimeoutError::Timeout) => {
                for s in l.look(&Real, now_ms()) {
                    if to_loop.send(Msg::WakeSeen(s)).is_err() {
                        return;
                    }
                }
            }
        }
    }
}

/// The real world.
struct Real;

impl Probe for Real {
    fn exists(&self, path: &str) -> bool {
        Path::new(path).exists()
    }
    fn head(&self, path: &str) -> Option<String> {
        let mut buf = Vec::new();
        std::fs::File::open(path).ok()?.take(READ_MAX).read_to_end(&mut buf).ok()?;
        Some(String::from_utf8_lossy(&buf).into_owned())
    }
    fn tail(&self, path: &str) -> Option<String> {
        let mut f = std::fs::File::open(path).ok()?;
        let len = f.metadata().ok()?.len();
        f.seek(SeekFrom::Start(len.saturating_sub(READ_MAX))).ok()?;
        let mut buf = Vec::new();
        f.read_to_end(&mut buf).ok()?;
        Some(String::from_utf8_lossy(&buf).into_owned())
    }
    fn alive(&self, pid: u32) -> bool {
        crate::procs::alive(pid)
    }
    fn start(&self, pid: u32) -> Option<String> {
        crate::procs::start_time(pid)
    }
    fn job(&self, label: &str) -> Option<JobState> {
        let out = std::process::Command::new("launchctl")
            .args(["list", label])
            .stdin(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .output()
            .ok()?;
        out.status.success().then(|| wake::parse_job(&String::from_utf8_lossy(&out.stdout)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;

    /// Files that exist, by path.
    #[derive(Default)]
    struct Fake(RefCell<BTreeSet<String>>);

    impl Probe for Fake {
        fn exists(&self, path: &str) -> bool {
            self.0.borrow().contains(path)
        }
        fn head(&self, path: &str) -> Option<String> {
            self.exists(path).then(|| "0\n".into())
        }
        fn tail(&self, _: &str) -> Option<String> {
            None
        }
        fn alive(&self, _: u32) -> bool {
            true
        }
        fn start(&self, _: u32) -> Option<String> {
            None
        }
        fn job(&self, _: &str) -> Option<JobState> {
            None
        }
    }

    fn file_watch(id: u64, path: &str) -> wake::Watch {
        let spec = wake::Spec { what: wake::What::File { path: path.into() }, tail: None, note: String::new() };
        wake::Watch { id, agent: "t1".into(), spec, set_at: 0, max_at: u64::MAX, quiet: false, resumes: false }
    }

    /// Law-like: one hit per watch, however many looks see its event.
    #[test]
    fn a_watch_is_reported_once() {
        let (mut l, p) = (Looker::default(), Fake::default());
        l.copy(vec![file_watch(1, "/x/rc"), file_watch(2, "/x/never")]);
        assert!(l.look(&p, 1_000).is_empty());
        p.0.borrow_mut().insert("/x/rc".into());
        let seen = l.look(&p, 2_000);
        assert_eq!(seen.iter().map(|s| s.id).collect::<Vec<_>>(), [1]);
        assert!(l.look(&p, 3_000).is_empty(), "never twice");
        // the loop's next copy still has it (its hit in flight): still once
        l.copy(vec![file_watch(1, "/x/rc"), file_watch(2, "/x/never")]);
        assert!(l.look(&p, 4_000).is_empty());
    }

    /// A watch the loop's copy no longer has is not looked at.
    #[test]
    fn a_removed_watch_is_not_looked_at() {
        let (mut l, p) = (Looker::default(), Fake::default());
        l.copy(vec![file_watch(1, "/x/rc")]);
        l.copy(Vec::new());
        p.0.borrow_mut().insert("/x/rc".into());
        assert!(l.look(&p, 1_000).is_empty());
        assert_eq!(l.due_in(1_000), None, "no watch: no look at all");
    }

    #[test]
    fn a_look_is_due_once_a_second() {
        let mut l = Looker::default();
        l.copy(vec![file_watch(1, "/x/rc")]);
        l.look(&Fake::default(), 10_000);
        assert_eq!(l.due_in(10_400), Some(600));
        assert_eq!(l.due_in(11_500), Some(0));
    }
}
