//! `sb land` on the hub's side (dev-flow §5): the land runs in its own
//! thread, in sb-core's line (the views say who waits), git and the
//! check never on the hub's loop; its answer to the agent's `sb`, and a
//! line in main's feed.
//!
//! land-wait: one land per place at a time (sb-core's claim, issue 37 #3):
//! a second is refused at once. The `sb` waits for its land
//! (`client::wait_for`, 2 h); a land whose `sb` is gone (it gave up, it
//! was killed) or whose answer could not be written tells its agent with
//! bise's message ([`unheard`], sb-core's `IHubMsg`): the result is never
//! lost, at most heard twice (an `sb` that read it and died right after).
//! The planned replacement (architect m_29755, arch-review item D): a
//! typed land record journaled through sb-core (agent, place, from, to,
//! sha, result), which sends this message and feeds merged.rs and the
//! bims' lands count.

use super::*;
use crate::land_line::{go_of, ranks_of, LandCore};
use bise_proto::core::{Fx as CoreFx, In};
use std::collections::BTreeMap;
use std::io::Write;
use std::sync::{Condvar, Mutex};

/// The start of bise's message for a land whose `sb` did not hear it;
/// the answer's own words follow.
pub(super) const UNHEARD: &str = "your sb land ended after your sb stopped waiting: ";

/// bise's message for a land's answer `body` that its `sb` did not get:
/// the same words it would have printed.
pub(super) fn unheard(body: &Value) -> String {
    let said = body["text"].as_str().or_else(|| body["error"].as_str()).unwrap_or_default();
    let failed = if body["ok"] == true { "" } else { "it did not land: " };
    format!("{}{}{}", UNHEARD, failed, said)
}

/// Write the land's answer to its `sb`, off the loop (this is the land's
/// thread): false when the `sb` is gone or the write failed or was cut.
fn told(stream: &mut UnixStream, body: &Value) -> bool {
    if outbox::peer_gone(stream) {
        return false;
    }
    let _ = stream.set_write_timeout(Some(Duration::from_secs(30)));
    let mut line = body.to_string();
    line.push('\n');
    stream.write_all(line.as_bytes()).and_then(|_| stream.flush()).is_ok()
}

impl Shell {
    /// `sb land` (dev-flow §5) in a thread, its answer to the agent (or
    /// bise's message when its `sb` is gone), a line in main's feed.
    pub(super) fn land(&mut self, token: Token, mut job: crate::land::Job) {
        let Some(mut stream) = self.replies.remove(&token) else {
            return;
        };
        let key = crate::land_line::claim_key(&job.place, &job.agent, job.here);
        let claim = match self.lands.claim(&key) {
            Ok(c) => c,
            Err(e) => {
                write_json(&mut stream, &json!({"ok": false, "error": e}));
                return;
            }
        };
        (job.flow, job.checks) = (crate::flow::FlowConfig::load(&self.opts.paths), self.opts.paths.worktrees.clone());
        let (queue, tx) = (self.lands.clone(), self.tx.clone());
        std::thread::spawn(move || {
            let _claim = claim;
            let txj = tx.clone();
            let res = crate::land::run(&job, &queue, &mut || drop(txj.send(Msg::Land { line: None })));
            let mut landed: Option<Feed> = None;
            let (body, line) = match res {
                Ok(o) => {
                    landed = art::landed_rec(&job.shared, &job.agent, &o.target, &o.sha, o.commits);
                    let mut text = crate::flow::land_line(&job.agent, o.commits, &o.target, &o.sha, o.pushed);
                    if let Some(e) = &o.push_error {
                        text = format!("{} ({})", text, e);
                    }
                    if !o.note.is_empty() {
                        text = format!("{}. {}", text, o.note);
                    }
                    (json!({"ok": true, "text": text.clone()}), Feed::info(text))
                }
                Err(e) => (
                    json!({"ok": false, "error": e}),
                    Feed::warn(format!("@{} can't land: {}", job.agent, e)),
                ),
            };
            if !told(&mut stream, &body) {
                let _ = tx.send(Msg::input(Input::HubMsg { to: job.agent.clone(), text: unheard(&body) }));
            }
            let _ = tx.send(Msg::Land { line: Some(line) });
            // the ± door of the land, right after its line (docs/artifacts.md)
            if let Some(f) = landed {
                let _ = tx.send(Msg::Land { line: Some(f) });
            }
        });
    }

    /// One land step on the loop: its land fx to its thread (go's to the
    /// waiting threads, ranks to the views), the rest as any step's.
    pub(super) fn land_step(&mut self, s: Step) {
        let fx = self.hub.handle(crate::core::Input::Land(s.i), &mut self.env);
        let (land, rest): (Vec<_>, Vec<_>) = fx.into_iter().partition(|e| matches!(e, Effect::LandFx(_)));
        let land: Vec<CoreFx> = land.into_iter().filter_map(|e| if let Effect::LandFx(f) = e { Some(f) } else { None }).collect();
        self.lands.gave(&land);
        if let Some(r) = land.iter().find_map(ranks_of) {
            self.hub.landing = r;
        }
        let _ = s.reply.send(land);
        self.step_fx(rest);
    }
}

/// sb-core's land line for the land threads (issue 37 #3,
/// crate::land_line): a step goes through the hub's loop
/// (`Msg::LandStep`) and its land fx come back to its thread; `land_go`
/// wakes the thread whose ticket goes, `land_ranks` is the views' lids
/// (`Hub::landing`). Fail closed: a loop gone answers nothing (the land
/// is refused, nothing moved). After a core restart the hub gives the
/// live lands back itself (core_link.rs `lands_back`).
pub(super) struct LoopCore {
    tx: std::sync::mpsc::Sender<Msg>,
    /// The tickets that got go, for the threads that wait on them.
    got: Mutex<BTreeMap<u64, String>>,
    cv: Condvar,
}

/// A land thread's step, for the loop to run ([`Shell::land_step`]).
pub(super) struct Step {
    i: In,
    reply: std::sync::mpsc::Sender<Vec<CoreFx>>,
}

impl LoopCore {
    /// The line of a hub whose loop reads `tx`.
    pub(super) fn line(tx: std::sync::mpsc::Sender<Msg>) -> crate::land::Line {
        crate::land::Line::new(std::sync::Arc::new(LoopCore { tx, got: Mutex::default(), cv: Condvar::new() }))
    }
}

impl LandCore for LoopCore {
    fn step(&self, i: In) -> Vec<CoreFx> {
        let (reply, rx) = std::sync::mpsc::channel();
        if self.tx.send(Msg::LandStep(Step { i, reply })).is_err() {
            return Vec::new();
        }
        rx.recv().unwrap_or_default()
    }

    fn wait_go(&self, ticket: u64) -> Result<String, String> {
        let mut g = self.got.lock().unwrap_or_else(|e| e.into_inner());
        loop {
            if let Some(t) = g.remove(&ticket) {
                return Ok(t);
            }
            g = self.cv.wait(g).unwrap_or_else(|e| e.into_inner());
        }
    }

    fn gave(&self, fx: &[CoreFx]) {
        let mut g = self.got.lock().unwrap_or_else(|e| e.into_inner());
        g.extend(fx.iter().filter_map(go_of));
        self.cv.notify_all();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_unheard_land_says_the_same_words() {
        let ok = json!({"ok": true, "text": "@a landed 1 commit on main (abc1234)"});
        assert_eq!(unheard(&ok), "your sb land ended after your sb stopped waiting: @a landed 1 commit on main (abc1234)");
        let red = json!({"ok": false, "error": "the land check is red at clippy"});
        assert_eq!(unheard(&red), "your sb land ended after your sb stopped waiting: it did not land: the land check is red at clippy");
    }

    /// architect m_29755: a gone `sb` is never told on its socket (bise's
    /// message instead); a live one is, once.
    #[test]
    fn a_gone_sb_is_not_told_a_live_one_is() {
        let (mut ours, theirs) = UnixStream::pair().unwrap();
        drop(theirs);
        assert!(!told(&mut ours, &json!({"ok": true})));
        let (mut ours, theirs) = UnixStream::pair().unwrap();
        assert!(told(&mut ours, &json!({"ok": true, "text": "x"})));
        let mut got = String::new();
        std::io::BufRead::read_line(&mut std::io::BufReader::new(theirs), &mut got).unwrap();
        assert_eq!(got, "{\"ok\":true,\"text\":\"x\"}\n");
    }
}
