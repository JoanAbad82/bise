//! The local sites' servers the hub starts again (site-revive, architect
//! m_44365; docs/artifacts.md, "A local site serves itself again"): the
//! one owner. The page server's door (`/a/<id>/live`,
//! pages/artifact/live.rs) asks it through `PageMsg::Revive` when the
//! recipe's port is free; it starts the recipe kept on the artifact's
//! newest version (artifacts_serve::Serve: its argv with no shell, in its
//! folder, `env_for(Child::Shell)`, in a session of its own), its output
//! in `<state>/revive/<id>.out` (Paths::revive_dir), and answers the pid;
//! the door waits for the port.
//!
//! At most one start per artifact: a server it started that still runs
//! is answered again, never started twice. They are the hub's, tied to
//! no agent: [`Revive::stop_all`] ends their process groups when the hub
//! quits for good. No journal line, no sb-core input: serving a site is
//! an effect of his request and wakes nobody.

use crate::artifacts::Store;
use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

/// The servers it started, by artifact id.
#[derive(Default)]
pub(crate) struct Revive {
    kids: BTreeMap<String, Child>,
}

impl Revive {
    /// `PageMsg::Revive` for artifact `id`: (status, body) for the door.
    /// 200 `{pid, out}`: started now, or still running from before (`out`
    /// its output file, the why-page's last lines); 404: no
    /// such artifact or no recipe; 410 `{why}`: its folder is gone; 500
    /// `{why}`: it did not start.
    pub(crate) fn answer(&mut self, store: &Store, out_dir: &Path, id: &str) -> (u16, Value) {
        let Some(m) = store.stored().into_iter().find(|m| m.id == id) else { return (404, json!({"why": "no such artifact"})) };
        let Some(s) = m.current().and_then(|v| v.serve.clone()) else { return (404, json!({"why": "no recipe"})) };
        let out = out_dir.join(format!("{id}.out"));
        if let Some(pid) = self.running(id) {
            return (200, json!({"pid": pid, "out": out}));
        }
        if !Path::new(&s.cwd).is_dir() {
            return (410, json!({"why": format!("its folder is gone ({})", s.cwd)}));
        }
        let Some((prog, args)) = s.argv.split_first() else { return (404, json!({"why": "no recipe"})) };
        let _ = std::fs::create_dir_all(out_dir);
        let file = match std::fs::File::create(&out) {
            Ok(f) => f,
            Err(e) => return (500, json!({"why": format!("its output file: {e}")})),
        };
        let err = match file.try_clone() {
            Ok(f) => f,
            Err(e) => return (500, json!({"why": format!("its output file: {e}")})),
        };
        let mut cmd = Command::new(prog);
        cmd.args(args).current_dir(&s.cwd).stdin(Stdio::null()).stdout(file).stderr(err);
        bise_home::env::for_child::<&str, &str>(bise_home::env::Child::Shell, []).apply(&mut cmd);
        crate::procs::own_session(&mut cmd);
        match cmd.spawn() {
            Ok(child) => {
                let pid = child.id();
                self.kids.insert(id.to_string(), child);
                (200, json!({"pid": pid, "out": out}))
            }
            Err(e) => (500, json!({"why": format!("{prog}: {e}")})),
        }
    }

    /// The pid of the server it started for `id`, while it runs (an
    /// ended one is reaped and forgotten).
    fn running(&mut self, id: &str) -> Option<u32> {
        let child = self.kids.get_mut(id)?;
        match child.try_wait() {
            Ok(None) => Some(child.id()),
            _ => {
                self.kids.remove(id);
                None
            }
        }
    }

    /// The hub quits for good: TERM to each server's process group (its
    /// own session: its pid), KILL after `grace`, then reaped.
    pub(crate) fn stop_all(&mut self, grace: Duration) {
        let pgs: Vec<i32> = self.kids.values().map(|c| c.id() as i32).collect();
        for pg in &pgs {
            // SAFETY: a signal to a group this hub started
            unsafe { libc::killpg(*pg, libc::SIGTERM) };
        }
        let t0 = Instant::now();
        while t0.elapsed() < grace && self.kids.values_mut().any(|c| matches!(c.try_wait(), Ok(None))) {
            std::thread::sleep(Duration::from_millis(20));
        }
        for pg in &pgs {
            // SAFETY: as above; a group already gone is ESRCH, harmless
            unsafe { libc::killpg(*pg, libc::SIGKILL) };
        }
        for (_, mut c) in std::mem::take(&mut self.kids) {
            let _ = c.wait();
        }
    }
}

#[cfg(test)]
#[path = "revive_tests.rs"]
mod tests;
