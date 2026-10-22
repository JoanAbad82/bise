//! The land line (issue 37 #3, plan-3 signed by architect m_36620): one
//! land at a time per target ref, what a land takes, and which lands run
//! the check are sb-core's (bend/hub/land.bend, laws in
//! bend/laws/land.bend). This module is the land thread's side: each
//! decision is one step through sb-core ([`LandCore::step`]), and a turn
//! waits for sb-core's `land_go` ([`LandCore::wait_go`]). git and the
//! check's process stay in land.rs and land_check.rs.
//!
//! [`Claim`] and [`Turn`] end their land when dropped (`land_end`): a land
//! thread that dies frees its line. Fail closed: a step sb-core did not
//! answer refuses the land ([`UNDECIDED`]), nothing moved. The daemon's
//! core (daemon/land.rs `LoopCore`) steps on the hub's loop and gives the live
//! lands back after a core restart (`land_live`).

use bise_proto::core::{input as ci, Fx as CoreFx, In};
use serde_json::{json, Value};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

/// A land step sb-core did not answer (a dead or older core).
pub const UNDECIDED: &str = "the hub could not decide this land: nothing moved, sb land again";

/// sb-core, for a land's thread.
pub trait LandCore: Send + Sync {
    /// One land step: the land fx it answered (none: no answer).
    fn step(&self, i: In) -> Vec<CoreFx>;
    /// Until `ticket` holds go: the target it lands on. Err: the hub is
    /// gone or stopping.
    fn wait_go(&self, ticket: u64) -> Result<String, String>;
    /// The land fx of a step another thread ran (its go's wake the
    /// threads waiting on them); a core that steps alone hears none.
    fn gave(&self, _fx: &[CoreFx]) {}
}

/// The lands' line, shared by the land threads.
#[derive(Clone)]
pub struct Line {
    core: Arc<dyn LandCore>,
    next: Arc<AtomicU64>,
}

/// A land started (its claim key), from its request to its end.
pub struct Claim {
    line: Line,
    key: String,
}

impl Drop for Claim {
    fn drop(&mut self) {
        self.line.end(0, &self.key);
    }
}

/// A land's turn on its target: dropping it ends it, the next goes.
pub struct Turn {
    line: Line,
    ticket: u64,
    target: String,
}

impl Turn {
    /// The ref this turn holds (`refs/heads/main`): sb-core's, which may
    /// be the trunk when the land's feature ended while it waited.
    pub fn target(&self) -> &str {
        &self.target
    }
}

impl Drop for Turn {
    fn drop(&mut self) {
        self.line.end(self.ticket, "");
    }
}

/// What a land takes and names.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct Picked {
    pub mine: Vec<String>,
    pub left_out: Vec<String>,
    /// its words on what it left out ("" none)
    pub note: String,
}

impl Line {
    pub fn new(core: Arc<dyn LandCore>) -> Line {
        Line { core, next: Arc::new(AtomicU64::new(1)) }
    }

    /// A step's land fx, run on the hub's loop: to its core ([`LandCore::gave`]).
    pub fn gave(&self, fx: &[CoreFx]) {
        self.core.gave(fx)
    }

    fn end(&self, ticket: u64, key: &str) {
        self.core.step(In::LandEnd(ci::LandEnd { ticket, key: key.to_string() }));
    }

    /// Start the land of `key` (claim_key: its place, or `place agent`
    /// for a --here); Err: the words of the one already running.
    pub fn claim(&self, key: &str) -> Result<Claim, String> {
        let fx = self.core.step(In::LandClaim(ci::LandClaim { key: key.to_string() }));
        match fx.into_iter().find_map(|f| if let CoreFx::LandClaimed(c) = f { Some(c) } else { None }) {
            Some(c) if c.ok => Ok(Claim { line: self.clone(), key: key.to_string() }),
            Some(c) => Err(c.why),
            None => Err(UNDECIDED.into()),
        }
    }

    /// What the land takes, or its refusal before its turn.
    pub fn pick(&self, p: ci::LandPick) -> Result<Picked, String> {
        let fx = self.core.step(In::LandPick(p));
        match fx.into_iter().find_map(|f| if let CoreFx::LandPicked(c) = f { Some(c) } else { None }) {
            Some(c) if c.ok => Ok(Picked { mine: c.mine, left_out: c.left_out, note: c.note }),
            Some(c) => Err(c.why),
            None => Err(UNDECIDED.into()),
        }
    }

    /// Join the line of `target` (`agent`'s feature line while it still
    /// lands there, else `trunk`) and wait until first. `dirty`: a
    /// worktree's files not committed (refused). `joined`: called once in
    /// line (the views refresh).
    pub fn wait_turn(&self, target: &str, place: &str, agent: &str, trunk: &str, dirty: &[String], joined: &mut dyn FnMut()) -> Result<Turn, String> {
        let ticket = self.next.fetch_add(1, Ordering::SeqCst);
        let i = ci::LandJoin { ticket, target: target.into(), place: place.into(), agent: agent.into(), trunk: trunk.into(), dirty: json!(dirty) };
        let fx = self.core.step(In::LandJoin(i));
        match fx.into_iter().find_map(|f| if let CoreFx::LandJoined(c) = f { Some(c) } else { None }) {
            Some(c) if c.ok => {}
            Some(c) => return Err(c.why),
            None => return Err(UNDECIDED.into()),
        }
        // in line from here: a failed wait ends the ticket too
        let mut turn = Turn { line: self.clone(), ticket, target: String::new() };
        joined();
        turn.target = self.core.wait_go(ticket)?;
        Ok(turn)
    }
}

/// One land fx's ticket that got go, and its target.
pub fn go_of(f: &CoreFx) -> Option<(u64, String)> {
    match f {
        CoreFx::LandGo(g) => Some((g.ticket, g.target.clone())),
        _ => None,
    }
}

/// `land_ranks`' map: each place's rank in its target's line.
pub fn ranks_of(f: &CoreFx) -> Option<std::collections::BTreeMap<String, u32>> {
    match f {
        CoreFx::LandRanks(r) => Some(r.ranks.as_object()?.iter().map(|(p, n)| (p.clone(), n.as_u64().unwrap_or(0) as u32)).collect()),
        _ => None,
    }
}

/// The held line of a place at `rank` in line (pr-design §4.1, the lid):
/// `landing` for the first, `waits to land · 2nd` for the next. sb-core
/// says the same (land.bend `lid`, law lids).
pub fn lid(rank: u32) -> String {
    if rank <= 1 {
        return "landing".to_string();
    }
    let suffix = match (rank % 10, rank % 100) {
        (1, x) if x != 11 => "st",
        (2, x) if x != 12 => "nd",
        (3, x) if x != 13 => "rd",
        _ => "th",
    };
    format!("waits to land · {}{}", rank, suffix)
}

/// The lids of `land_ranks`, by place id.
pub fn lids(ranks: &std::collections::BTreeMap<String, u32>) -> std::collections::BTreeMap<String, String> {
    ranks.iter().map(|(p, n)| (p.clone(), lid(*n))).collect()
}

/// A land of a place, as `sb land` keys it: a worktree's branch is its
/// place's, a `--here` its agent's in its place.
pub fn claim_key(place: &str, agent: &str, here: bool) -> String {
    if here {
        format!("{} {}", place, agent)
    } else {
        place.to_string()
    }
}

/// The lands sb-core holds, as the hub saw them go by (its claims and
/// its line): after a core restart (R comes back empty) the hub gives
/// them back with `land_live` before any other input (architect m_36620:
/// the holders keep go, the waiters their order).
#[derive(Clone, Debug, Default)]
pub struct Mirror {
    claims: std::collections::BTreeMap<String, u64>,
    line: Vec<Value>,
}

impl Mirror {
    /// One land step `i` at `now` and the land fx it answered.
    pub fn saw(&mut self, i: &In, fx: &[&CoreFx], now: u64) {
        match i {
            In::LandClaim(c) if fx.iter().any(|f| matches!(f, CoreFx::LandClaimed(a) if a.ok)) => {
                self.claims.insert(c.key.clone(), now);
            }
            In::LandJoin(j) => {
                if let Some(CoreFx::LandJoined(a)) = fx.iter().find(|f| matches!(f, CoreFx::LandJoined(_))) {
                    if a.ok {
                        let t = json!({"ticket": j.ticket, "target": a.target, "place": j.place, "agent": j.agent, "trunk": j.trunk, "go": false});
                        self.line.push(t);
                    }
                }
            }
            In::LandEnd(e) => {
                self.claims.remove(&e.key);
                self.line.retain(|t| t["ticket"] != e.ticket);
            }
            _ => {}
        }
        for (n, target) in fx.iter().filter_map(|f| go_of(f)) {
            for t in self.line.iter_mut().filter(|t| t["ticket"] == n) {
                t["go"] = json!(true);
                t["target"] = json!(target);
            }
        }
    }

    /// The input that gives them back; None when no land runs.
    pub fn live(&self) -> Option<In> {
        if self.claims.is_empty() && self.line.is_empty() {
            return None;
        }
        let claims: Vec<Value> = self.claims.iter().map(|(k, s)| json!({"key": k, "since": s})).collect();
        Some(In::LandLive(ci::LandLive { claims: json!(claims), line: json!(self.line) }))
    }
}

/// sb-core in this process, for tests (and `trunk`'s): a hub stepped
/// under a lock, its go's kept for the waiting threads.
#[cfg(test)]
pub(crate) mod local {
    use super::*;
    use crate::core::{Effect, Env, Hub, Input, Loss};
    use crate::model::Workspace;
    use std::collections::BTreeMap;
    use std::sync::{Condvar, Mutex};

    struct NoEnv;

    impl Env for NoEnv {
        fn now(&self) -> u64 {
            1_000_000
        }
        fn is_git(&mut self) -> bool {
            true
        }
        fn worktree_create(&mut self, _: &str, _: bool) -> Result<Workspace, String> {
            Err("no worktree here".into())
        }
        fn worktree_loss(&mut self, _: &Workspace) -> Loss {
            Loss::default()
        }
        fn worktree_drop(&mut self, _: &str, _: &Workspace, _: &Loss) -> Result<Option<String>, String> {
            Err("no worktree here".into())
        }
        fn worktree_restore(&mut self, _: &str, _: &Workspace, _: Option<&str>) -> Result<Workspace, String> {
            Err("no worktree here".into())
        }
    }

    /// sb-core on its own thread (a Hub is not Send): one step at a time
    pub(crate) struct Local {
        tx: Mutex<std::sync::mpsc::Sender<(In, std::sync::mpsc::Sender<Vec<CoreFx>>)>>,
        gos: Mutex<BTreeMap<u64, String>>,
        cv: Condvar,
    }

    impl LandCore for Local {
        fn step(&self, i: In) -> Vec<CoreFx> {
            let (reply, rx) = std::sync::mpsc::channel();
            let sent = self.tx.lock().unwrap_or_else(|e| e.into_inner()).send((i, reply));
            let fx = if sent.is_ok() { rx.recv().unwrap_or_default() } else { Vec::new() };
            let mut g = self.gos.lock().unwrap_or_else(|e| e.into_inner());
            g.extend(fx.iter().filter_map(go_of));
            self.cv.notify_all();
            fx
        }

        fn wait_go(&self, ticket: u64) -> Result<String, String> {
            let mut g = self.gos.lock().unwrap_or_else(|e| e.into_inner());
            loop {
                if let Some(t) = g.remove(&ticket) {
                    return Ok(t);
                }
                g = self.cv.wait(g).unwrap_or_else(|e| e.into_inner());
            }
        }
    }

    /// A line on a fresh in-process sb-core.
    pub(crate) fn line() -> Line {
        let (tx, rx) = std::sync::mpsc::channel::<(In, std::sync::mpsc::Sender<Vec<CoreFx>>)>();
        std::thread::spawn(move || {
            let mut hub = Hub::new("/w");
            for (i, reply) in rx {
                let fx = hub.handle(Input::Land(i), &mut NoEnv);
                let _ = reply.send(fx.into_iter().filter_map(|e| if let Effect::LandFx(f) = e { Some(f) } else { None }).collect());
            }
        });
        Line::new(Arc::new(Local { tx: Mutex::new(tx), gos: Mutex::new(BTreeMap::new()), cv: Condvar::new() }))
    }
}
