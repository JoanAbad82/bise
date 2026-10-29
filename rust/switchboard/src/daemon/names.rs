//! An agent's names on the hub's side, after sb-core decided (name-free,
//! architect m_31139): a rename moves what the shell keeps by name (the
//! REPL buffers, the thread positions, the window's heads), and a take of
//! an old name (fx `retarget`: another agent takes `from`) moves what
//! still says `from` on disk to `to`, the agent that had it: its pages'
//! and artifacts' agent, so their notes and questions never reach the
//! new holder. What is keyed by an agent's folder (its transcript, tmp,
//! run files, the usage ledger) needs nothing: the folder never changes.

use super::*;

impl Shell {
    pub(super) fn renamed(&mut self, old: String, new: String) {
        if let Some(b) = self.buffers.remove(&old) {
            self.buffers.insert(new.clone(), b);
        }
        if let Some(p) = self.positions.remove(&old) {
            self.positions.insert(new.clone(), p);
        }
        self.proto_renamed(&old, &new);
        self.broadcast(&json!({"ev": "renamed", "old": old, "new": new}));
    }

    pub(super) fn retarget(&mut self, from: &str, to: &str) {
        let arts = crate::artifacts::Store::new(&self.opts.paths.state).retarget(from, to);
        let pages = self.pg.pages.as_ref().map_or(0, |p| p.store.retarget(from, to));
        if arts + pages > 0 {
            log_line(&self.opts.paths, &format!("name-free: @{} taken: {} artifacts and {} pages now @{}'s", from, arts, pages, to));
        }
    }
}
