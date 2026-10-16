//! The snapshot's agent rows (`state`'s `agents`, the TUI's and the
//! desktop's roster, view.json), kept from one snapshot to the next: a row
//! is a pure function of its inputs ([`RowIn`]), so a row whose inputs
//! are equal to last time's is the kept one, cloned, never rebuilt.
//!
//! Why (issue 21 step 2, item 7): on his journal (514 agents, 493 of
//! them archived) a snapshot took 59-130 ms, 88-120 of them building the
//! archived rows, which never change; the state gate sends up to 10
//! snapshots a second, so under a flood the loop spent most of its time
//! there. Comparing a row's inputs costs a few memcmp; building it, its
//! objective's `one_line` twice and ~30 JSON fields.
//!
//! The rows stay on the wire exactly as before (architect m_15238 (1)):
//! every agent, archived ones included, the same fields. Like
//! contexts.rs, a stopgap until sb-core's typed hot view (issue 21 step 3,
//! target T3) says which agents a step changed.

use crate::board::Waiting;
use crate::model::{Agent, Mode, State};
use crate::util::{clip, one_line};
use bise_proto::rows::{AgentWatch, Doing};
use serde_json::{json, Value};
use std::collections::BTreeMap;

/// Everything a row reads: the agent, and what the hub knows of it
/// besides (its role line, its messages, its watches, its turn's age).
#[derive(Debug)]
pub struct RowIn<'a> {
    pub agent: &'a Agent,
    /// The model's role line (BISE-126; None: none yet).
    pub role: Option<&'a str>,
    /// Messages waiting for its delivery.
    pub queued: usize,
    /// The user's queued inputs ([`crate::board::Waiting::queued_inputs`]).
    pub queued_inputs: Vec<Value>,
    /// main's inbox (0 for a task).
    pub inbox: usize,
    /// How long its turn has run (None: no turn).
    pub turn_ms: Option<u64>,
    pub watching: Vec<AgentWatch>,
    /// les bims: what it is doing now, from `Hub.doing` (its one owner,
    /// core_doing.rs); the row says it through `crate::doing::row`
    pub doing: Option<Doing>,
}

/// A kept row and the inputs it was built from.
#[derive(Debug)]
struct Kept {
    agent: Agent,
    role: Option<String>,
    queued: usize,
    queued_inputs: Vec<Value>,
    inbox: usize,
    turn_ms: Option<u64>,
    watching: Vec<AgentWatch>,
    doing: Option<Doing>,
    row: Value,
}

impl Kept {
    fn same(&self, i: &RowIn) -> bool {
        self.queued == i.queued
            && self.inbox == i.inbox
            && self.turn_ms == i.turn_ms
            && self.role.as_deref() == i.role
            && self.queued_inputs == i.queued_inputs
            && self.watching == i.watching
            && self.doing == i.doing
            && self.agent == *i.agent
    }
}

/// What the rows read of the messages, by agent: queued count, the
/// user's queued inputs, the questions waiting for it. Built from one
/// [`Waiting`] at each snapshot: it walks the hot messages only (0.11 ms
/// on his journal copy, hot-view sha 2c), no longer worth keeping.
#[derive(Debug, Default)]
struct Mail {
    queued: BTreeMap<String, usize>,
    inputs: BTreeMap<String, Vec<Value>>,
    unanswered: BTreeMap<String, usize>,
}

/// The kept rows, by agent name.
#[derive(Debug, Default)]
pub struct Rows {
    kept: BTreeMap<String, Kept>,
    mail: Mail,
    /// How many rows were built (not kept), for the tests and the bench.
    pub built: u64,
}

impl Rows {
    /// Bring the messages' part up to `st` (one pass over the hot ones).
    pub fn mail(&mut self, st: &State) {
        let w = Waiting::of(st);
        let mut m = Mail::default();
        for a in st.agents.keys() {
            let (q, i, u) = (w.queued_count(a), w.queued_inputs(a), w.unanswered(a).len());
            if q > 0 {
                m.queued.insert(a.clone(), q);
            }
            if !i.is_empty() {
                m.inputs.insert(a.clone(), i);
            }
            if u > 0 {
                m.unanswered.insert(a.clone(), u);
            }
        }
        self.mail = m;
    }

    /// `a`'s row inputs, its messages' part from the last [`Rows::mail`].
    pub fn input<'a>(&self, a: &'a Agent, role: Option<&'a str>, now: u64, watching: Vec<AgentWatch>, doing: Option<Doing>) -> RowIn<'a> {
        RowIn {
            agent: a,
            role,
            queued: self.mail.queued.get(&a.name).copied().unwrap_or(0),
            queued_inputs: self.mail.inputs.get(&a.name).cloned().unwrap_or_default(),
            inbox: if a.is_main { self.mail.unanswered.get(&a.name).copied().unwrap_or(0) } else { 0 },
            turn_ms: a.turn_started_ms.map(|t| now.saturating_sub(t)),
            watching,
            doing,
        }
    }

    /// `i`'s row: the kept one when its inputs are the same, else built
    /// (and kept).
    pub fn row(&mut self, i: RowIn) -> Value {
        if let Some(k) = self.kept.get(&i.agent.name).filter(|k| k.same(&i)) {
            return k.row.clone();
        }
        let row = build(&i);
        self.built += 1;
        let k = Kept {
            agent: i.agent.clone(),
            role: i.role.map(str::to_string),
            queued: i.queued,
            queued_inputs: i.queued_inputs,
            inbox: i.inbox,
            turn_ms: i.turn_ms,
            watching: i.watching,
            doing: i.doing,
            row: row.clone(),
        };
        self.kept.insert(k.agent.name.clone(), k);
        row
    }

    /// Forget the rows of the agents no longer in `names` (a rename).
    pub fn keep_only<'a>(&mut self, names: impl Iterator<Item = &'a String>) {
        let names: std::collections::BTreeSet<&String> = names.collect();
        self.kept.retain(|n, _| names.contains(n));
    }
}

/// The role line the views show (BISE-126): the model's, else the
/// objective's first sentence; none for main.
pub fn role_of(a: &Agent, line: Option<&str>) -> String {
    if a.is_main {
        return String::new();
    }
    match line {
        Some(l) => l.to_string(),
        None => crate::role::default_line(&a.brief.objective),
    }
}

/// A row from its inputs.
pub fn build(i: &RowIn) -> Value {
    let a = i.agent;
    json!({
        "name": a.name,
        "main": a.is_main,
        "status": a.status().as_str(),
        "objective": a.description(),
        // what it is doing now, one line (BISE-126); "" for main
        "role": role_of(a, i.role),
        "parent": a.parent,
        "mode": match a.ws.mode { Mode::Worktree => "worktree", Mode::Shared => "shared" },
        "path": a.ws.path,
        "branch": a.ws.branch,
        "dropped": a.ws.dropped,
        // BISE-136: a private worktree (gate.sh new), else null
        "place": a.place,
        // dev-flow §3.1: the id of the place it is in (`places`)
        // (BISE-136: its private worktree's, `pt:<path>`; a
        // feature's agent: its feature's, dev-flow §5.1)
        "place_id": crate::place::view_id(a),
        "created_ms": a.created_ms,
        // its folder under agents/ and its former names (S2 C:
        // view.json carries them for sb history --project)
        "dir": a.dir,
        "aliases": a.aliases,
        "note": a.declared.as_ref().map(|(_, n)| n.clone()).unwrap_or_default(),
        // the status it declared (done, blocked, working; null: none):
        // les bims' growth counts the done ones, archived too (the
        // archive keeps it; an auto turn report replaces report_kind)
        "declared": a.declared.as_ref().map(|(d, _)| *d),
        "report": a.last_report.as_ref().map(|r| clip(&one_line(&r.summary), 200)),
        // when it last reported (an archived task: about when it stopped)
        "report_ms": a.last_report.as_ref().map(|r| r.at_ms),
        // S10: followed, and its progress step (`--step n/m`)
        "follow": a.follow,
        "report_kind": a.last_report.as_ref().map(|r| r.kind.clone()),
        "step": a.last_report.as_ref().and_then(|r| r.step),
        "of": a.last_report.as_ref().and_then(|r| r.of),
        "queued": i.queued,
        // the user's queued inputs waiting for the turn's end
        // (the window's "send queued"): [{id, text, created_ms}]
        "queued_inputs": i.queued_inputs,
        // BISE-299: main's inbox, the agents' questions waiting
        // for main (the user sees a quiet count, never asked)
        "inbox": i.inbox,
        "turn_ms": i.turn_ms,
        // issue 22: its ended turns, from the same sb-core
        // view as its status (the agents row's `turns`)
        "turns": a.turns_ended,
        // who it waits on (`sb wait` / `sb ask`), for `waits {name}`
        "waiting_on": a.waiting_on.as_ref().filter(|_| a.waiting),
        // event-wake: the events it waits for (the agents
        // row's `watching`, wake-ui)
        "watching": i.watching,
        // les bims: what it is doing now, only while its turn runs (or
        // paused on a backgrounded command: a build)
        "doing": crate::doing::row(a.run == crate::model::Run::Busy, i.doing, &i.watching),
    })
}

#[cfg(test)]
#[path = "snapshot_rows_tests.rs"]
mod tests;
