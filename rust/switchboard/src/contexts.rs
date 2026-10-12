//! The agents' contexts: the `<bise_state>` block appended to each model
//! request of an active agent (main's task board, a task's roster and
//! questions; board.rs builds them), pushed as `Effect::Context` when
//! its text changes (the REPL re-reads `BEND_CONTEXT_FILE` before every
//! model call, so the file must be current at all times).
//!
//! Built at each input, but only where its inputs changed (issue 21, step
//! 2, item 5b). On his journal (514 agents, 14k+ messages) rebuilding
//! every context at each input took 29 ms, 26 of them in the two walks of
//! every message (main's `<agent_threads>`, everyone's questions), though
//! a REPL tool line changes no message. Here:
//! - main's `<agent_threads>` are not kept here: State keeps them as the
//!   messages arrive (board::Threads, hot-view sha 2a), a read is cheap;
//! - each agent's questions are kept until `State::msgs_rev` moves. They
//!   read the messages, their states and the settled set, nothing of the
//!   agents (names are the messages' own `from`/`to`), so the revision is
//!   their whole key;
//! - a task's context is rebuilt only when the roster rows (with their
//!   ages, so the bytes equal a fresh build at any instant), its parent or
//!   the messages changed: those are all [`board::task_context`] reads;
//! - main's is rebuilt at each input (it shows each task's activity, which
//!   every tool line changes), from the kept threads and questions.
//!
//! A stopgap: once sb-core gives a typed hot view (issue 21 step 3, target
//! T3), what changed comes with the step, and this cache goes. Do not build
//! on it as the final home of the contexts.

use crate::board::{self, Group, Models, Waiting};
use crate::model::{Lifecycle, State, MAIN};
use std::collections::BTreeMap;

/// A row of the roster: an agent, its parent, its row past the relation.
type Row = (String, Option<String>, String);

#[derive(Debug, Default)]
pub struct Contexts {
    /// What each agent's REPL has: the last text pushed.
    texts: BTreeMap<String, String>,
    /// The revision of the messages `questions` were built from (None:
    /// never built).
    msgs_rev: Option<u64>,
    questions: BTreeMap<String, Vec<String>>,
    /// The roster rows of the last input.
    rows: Vec<Row>,
    /// Each task's parent and messages' revision at its last build.
    keys: BTreeMap<String, (Option<String>, u64)>,
}

impl Contexts {
    /// The contexts this state changes, (agent, its new text) each, in
    /// the agents' name order; they are kept as what the REPLs have.
    pub fn refresh(&mut self, st: &State, now: u64, models: &Models) -> Vec<(String, String)> {
        let rev = st.msgs_rev();
        if self.msgs_rev != Some(rev) {
            self.questions = Waiting::of(st).questions();
            self.msgs_rev = Some(rev);
        }
        // kept by State's writer (board::Threads): no cache here
        let threads = board::agent_threads(st, 8);
        let group = Group::of(st, now, models);
        let rows = group.rows();
        let same_rows = rows == self.rows;
        if !same_rows {
            self.rows = rows;
        }
        let mut changed = Vec::new();
        for a in st.agents.values().filter(|a| a.lifecycle == Lifecycle::Active) {
            let questions = self.questions.get(&a.name).map_or(&[][..], Vec::as_slice);
            let text = if a.name == MAIN {
                board::main_context(st, now, &threads, questions)
            } else {
                let key = (a.parent.clone(), rev);
                if same_rows && self.keys.get(&a.name) == Some(&key) {
                    continue;
                }
                self.keys.insert(a.name.clone(), key);
                board::task_context(&a.name, &group, questions)
            };
            if self.texts.get(&a.name) != Some(&text) {
                self.texts.insert(a.name.clone(), text.clone());
                changed.push((a.name.clone(), text));
            }
        }
        changed
    }

    /// The text `name`'s REPL has (None: none pushed yet).
    pub fn text(&self, name: &str) -> Option<&str> {
        self.texts.get(name).map(String::as_str)
    }
}

/// Every active agent's context built from nothing, as before the cache:
/// the reference the cache must equal byte for byte.
pub fn fresh(st: &State, now: u64, models: &Models) -> BTreeMap<String, String> {
    let waiting = Waiting::of(st);
    let group = Group::of(st, now, models);
    let threads = board::agent_threads(st, 8);
    st.agents
        .values()
        .filter(|a| a.lifecycle == Lifecycle::Active)
        .map(|a| {
            let questions = board::questions_for(waiting.unanswered(&a.name));
            let text = if a.name == MAIN {
                board::main_context(st, now, &threads, &questions)
            } else {
                board::task_context(&a.name, &group, &questions)
            };
            (a.name.clone(), text)
        })
        .collect()
}

#[cfg(test)]
#[path = "contexts_tests.rs"]
mod tests;
