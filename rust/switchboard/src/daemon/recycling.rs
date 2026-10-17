//! The hub's side of recycling an aged REPL (crate::recycle, a
//! workaround for the Bend allocator's aging): it counts the context each
//! live REPL read from its usage lines, marks it due at an idle past the
//! budget (`BISE_RECYCLE_TOKENS`, 0 = off), and `switch_idle_repls`
//! restarts the due ones that are still idle through the switch path
//! (`reload`, same binary, port and session, writes queued meanwhile,
//! the restored greeting kept out of the feed). Nothing goes to sb-core,
//! the journal or the transcript. A turn that starts first just waits:
//! only an idle REPL is asked, at its next idle.

use super::{log_line, Shell};
use crate::recycle::{budget, Churn};

/// The counts and the budget, read once at the hub's start.
#[derive(Debug)]
pub(super) struct Recycle {
    churn: Churn,
    budget: u64,
    /// when his last line to main came (ms; hub-tick: main's own recycle
    /// waits [`crate::recycle::HIS_LINE_HOLD_MS`] after it)
    his_main_ms: Option<u64>,
}

impl Recycle {
    pub(super) fn from_env() -> Recycle {
        Recycle::with_budget(budget(std::env::var("BISE_RECYCLE_TOKENS").ok().as_deref()))
    }

    pub(super) fn with_budget(budget: u64) -> Recycle {
        Recycle { churn: Churn::default(), budget, his_main_ms: None }
    }

    /// `dir`'s REPL waits for its recycle.
    pub(super) fn is_due(&self, dir: &str) -> bool {
        self.churn.is_due(dir)
    }

    /// He wrote to main at `now_ms` (`Shell::step_input`).
    pub(super) fn his_line_to_main(&mut self, now_ms: u64) {
        self.his_main_ms = Some(now_ms);
    }
}

impl Shell {
    /// A line of `dir`'s live REPL (before the feed).
    pub(super) fn recycle_line(&mut self, dir: &str, line: &str) {
        let r = &mut self.recycle;
        r.churn.line(dir, line);
        if line == "--- idle" && r.churn.idle(dir, r.budget) {
            let read = r.churn.read(dir);
            log_line(
                &self.opts.paths,
                &format!("the REPL of {} read {} tokens of context: it restarts at idle (recycle)", dir, read),
            );
        }
    }

    /// Main's idle REPL at `dir` waits (crate::recycle::main_holds): its
    /// recycle is the hub's own (`explicit` false: no reload asked, same
    /// binary) and a message is queued for main or his last line to main
    /// is recent. `switch_idle_repls` asks again at its next idle.
    pub(super) fn main_holds(&self, explicit: bool) -> bool {
        let since = self.recycle.his_main_ms.map(|t| crate::util::now_ms().saturating_sub(t));
        crate::recycle::main_holds(explicit, crate::board::queued_count(&self.hub.st, crate::model::MAIN), since)
    }

    /// A new process of `dir` is connected (spawned, adopted, switched).
    pub(super) fn recycle_started(&mut self, dir: &str) {
        self.recycle.churn.started(dir);
    }

    /// `switch_idle_repls` wrote `reload` to `dir`'s REPL.
    pub(super) fn recycle_asked(&mut self, dir: &str) {
        if self.recycle.churn.is_due(dir) {
            self.recycle.churn.asked(dir);
            log_line(&self.opts.paths, &format!("recycling the REPL of {}", dir));
        }
    }
}
