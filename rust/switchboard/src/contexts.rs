//! The agents' contexts: the `<bise_state>` block appended to each model
//! request of an active agent (main's task board, a task's roster and
//! questions; board.rs builds them), pushed as `Effect::Context` when
//! its text changes (the REPL re-reads `BEND_CONTEXT_FILE` before every
//! model call, so the file must be current at all times).
//!
//! Every active agent's context is built fresh at each input; only the
//! texts that changed are pushed. Nothing else is kept: what made a fresh
//! build slow (main's `<agent_threads>` and everyone's questions walked
//! every message) is now O(hot) or kept by State's writer (issue 21,
//! hot-view sha 2a-2c), and on his journal copy (529 agents, 34 active,
//! 19,474 messages) a fresh build of every context is 5.34 ms (median of
//! 30 tool lines) against 5.56 ms for the per-task cache that was here
//! (sha 2d, rule 7).

use crate::board::{self, Group, Models, Waiting};
use crate::model::{Lifecycle, State, MAIN};
use std::collections::BTreeMap;

#[derive(Debug, Default)]
pub struct Contexts {
    /// What each agent's REPL has: the last text pushed.
    texts: BTreeMap<String, String>,
}

impl Contexts {
    /// The contexts this state changes, (agent, its new text) each, in
    /// the agents' name order: every context built fresh, only the texts
    /// that differ from what the REPLs have are pushed (and kept).
    pub fn refresh(&mut self, st: &State, now: u64, models: &Models) -> Vec<(String, String)> {
        let mut changed = Vec::new();
        for (name, text) in fresh(st, now, models) {
            if self.texts.get(&name) != Some(&text) {
                self.texts.insert(name.clone(), text.clone());
                changed.push((name, text));
            }
        }
        changed
    }

    /// The text `name`'s REPL has (None: none pushed yet).
    pub fn text(&self, name: &str) -> Option<&str> {
        self.texts.get(name).map(String::as_str)
    }
}

/// Every active agent's context built from nothing, by name.
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
