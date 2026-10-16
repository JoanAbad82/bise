//! The hub's loop (`Shell::serve`, called by `daemon::run`) and one
//! message of it executed on the shell (`Shell::dispatch`, the match that
//! was `run`'s loop body, moved out so `run` stays short).

use super::inbox::{Inbox, Next};
use super::repl::kill_pid;
use super::{log_line, version_allowed, write_json, Msg, Repl, Shell, RESUME_TEXT};
use crate::core::Input;
use crate::model::MAIN;
use bise_proto::core::Feed;
use crate::util::{now_ms, wire_escape};
use serde_json::json;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc::Receiver;

/// What the loop does after a message.
pub(super) enum Flow {
    /// The next message.
    Go,
    /// The hub stops; `keep`: its REPLs stay for the next hub.
    Stop { keep: bool },
}

/// The ticker's flag (hub-lag: one tick in the queue at most) and when
/// that tick was sent: the starts are judged at that time (hub-stall,
/// `check_starts`), not when a busy loop reaches the tick.
#[derive(Default)]
pub(super) struct TickFlag {
    pub(super) queued: AtomicBool,
    pub(super) sent_ms: AtomicU64,
}

impl TickFlag {
    /// The ticker's turn: false when a tick waits already; else marked
    /// queued and sent now (the caller sends it).
    pub(super) fn take(&self) -> bool {
        if self.queued.swap(true, Ordering::AcqRel) {
            return false;
        }
        self.sent_ms.store(now_ms(), Ordering::Release);
        true
    }
}

impl Shell {
    /// The hub's loop, until a stop (its `keep`) or every sender gone:
    /// the clients' lane first (daemon/inbox.rs: a hello never waits
    /// behind the REPLs' lines), the state to the clients when its gate
    /// allows (daemon/state_gate.rs: at most once per 100 ms, the last
    /// change always sent, a pending one flushed at the stop).
    pub(super) fn serve(&mut self, rx: Receiver<Msg>, tick_queued: &TickFlag) -> bool {
        let mut inbox = Inbox::new(rx, Msg::is_urgent);
        let keep = loop {
            if self.state_gate.due(now_ms()) {
                self.push_state();
            }
            let m = match inbox.next(self.state_gate.wait(now_ms())) {
                Next::Msg(m) => m,
                Next::Idle => continue,
                Next::Closed => break false,
            };
            self.loop_watch.on(m.label());
            let flow = self.dispatch(m, tick_queued);
            if let Some(l) = self.loop_watch.idle() {
                log_line(&self.opts.paths, &l);
            }
            if let Flow::Stop { keep } = flow {
                break keep;
            }
        };
        if self.state_gate.pending() {
            self.push_state();
        }
        keep
    }

    /// Run one message. `tick_queued`: the ticker's flag (one tick in the
    /// queue at most), cleared when a tick is taken.
    pub(super) fn dispatch(&mut self, m: Msg, tick_queued: &TickFlag) -> Flow {
        match m {
            Msg::In(i) => {
                let i = *i;
                let tick = matches!(i, Input::Tick);
                if tick {
                    tick_queued.queued.store(false, Ordering::Release);
                    self.flush_offsets();
                }
                self.step(i);
                if tick {
                    // the trunk's name and the features' facts, off the loop
                    if self.features.due(now_ms()) {
                        self.refresh_features();
                    }
                    self.page_waits_check();
                    self.wakes_look();
                    self.check_starts(tick_queued.sent_ms.load(Ordering::Acquire));
                    self.plugins_changed(false);
                    self.switch_idle_repls();
                    self.announce_update();
                    self.release_check(None);
                    self.plan_prs();
                    self.idle_check();
                    // computer use (design §7.3): each stop, one line in main's feed
                    for l in self.cu.poll() {
                        self.feed_rec(crate::model::MAIN, Feed::Computer(bise_proto::core::feed::Computer { text: l }));
                    }
                }
            }
            Msg::ReplConnected {
                dir,
                gen,
                stream,
                steer,
                interrupt,
                pid,
                adopted,
                busy,
            } => {
                if self.gens.get(&dir) != Some(&gen) {
                    // killed while it was starting
                    kill_pid(pid);
                    return Flow::Go;
                }
                let stream = match super::outbox::of_tcp(&stream, super::outbox::REPL_MAX) {
                    Ok(o) => o,
                    Err(e) => {
                        log_line(&self.opts.paths, &format!("repl {dir}: no writer for it: {e}"));
                        kill_pid(pid);
                        return Flow::Go;
                    }
                };
                if !adopted {
                    let _ = std::fs::write(&steer, "");
                    let _ = std::fs::write(&interrupt, "");
                }
                self.repls.insert(
                    dir.clone(),
                    Repl {
                        stream,
                        steer,
                        interrupt,
                    },
                );
                self.start_connected(&dir);
                self.recycle_started(&dir);
                crate::util::timing(&format!("repl connected {} (adopted {})", dir, adopted));
                if let Some(q) = self.switching.remove(&dir) {
                    // a switched REPL: same session, the core never saw
                    // it go; the writes it missed go now
                    log_line(&self.opts.paths, &format!("switched the REPL of {}", dir));
                    if let Some(r) = self.repls.get_mut(&dir) {
                        for l in &q {
                            let _ = r.stream.write_all(l.as_bytes());
                        }
                    }
                    if !q.is_empty() {
                        return Flow::Go;
                    }
                }
                if !adopted && self.resume_turn.remove(&dir) {
                    // its turn was cut: the first turn of the new process
                    // continues it (queued writes of the core come after)
                    if let Some(r) = self.repls.get_mut(&dir) {
                        let _ = r
                            .stream
                            .write_all(format!("say {}\n", wire_escape(RESUME_TEXT)).as_bytes());
                    }
                    if let Some(name) = self.agent_by_dir(&dir).map(|a| a.name.clone()) {
                        self.feed_rec(&name, Feed::info("its turn was interrupted by a restart — it continues where it left off"));
                    }
                }
                if let Some(name) = self.agent_by_dir(&dir).map(|a| a.name.clone()) {
                    if busy {
                        // adopted mid-turn: busy until its `--- idle`
                        self.step(Input::ReplLine {
                            agent: name.clone(),
                            line: "  obs: turn_started".into(),
                        });
                    } else {
                        self.step(Input::ReplReady { agent: name.clone() });
                    }
                    // design §10: a restart keeps the card the REPL waits on
                    if adopted {
                        self.gate_restore(&dir, &name);
                    } else {
                        self.gate_fresh(&name);
                    }
                }
            }
            Msg::ReplStartStep { dir, gen } => self.start_step(&dir, gen),
            Msg::ReplSpawned { dir, gen, pid } => {
                self.start_step(&dir, gen);
                let _ = std::fs::write(
                    self.opts.paths.agent_dir(&dir).join("repl.pid"),
                    pid.to_string(),
                );
                crate::procs::add_sid(&self.opts.paths.agent_dir(&dir).join("repl.sids"), pid);
                if self.gens.get(&dir) == Some(&gen) {
                    self.pids.insert(dir, (gen, pid));
                } else {
                    kill_pid(pid);
                }
            }
            Msg::ReplLine {
                dir,
                gen,
                line,
                offset,
            } => {
                if self.gens.get(&dir) == Some(&gen) {
                    if !self.on_ev_line(&dir, &line, offset) {
                        self.on_repl_line(&dir, &line);
                    }
                    self.offsets.insert(dir, offset);
                }
            }
            Msg::ReplGone { dir, gen, reason, cause } => return self.repl_gone(dir, gen, reason, cause),
            Msg::Page(m) => self.page_msg(m),
            Msg::OlderHello { stream, peer } => self.older_hello(stream, &peer),
            Msg::RpcNew { id, stream, v, peer } => self.rpc_new(id, stream, v, peer),
            Msg::Typed { to, v } => self.typed_msg(to, v),
            Msg::ClientLine { id, v } => self.client_line(id, v),
            Msg::ClientGone { id } => {
                self.rpc_gone(id);
                if self.clients.remove(&id).is_some() {
                    self.step(Input::ClientGone { client: id });
                }
            }
            Msg::AgentNew { token, stream, v, asker } => self.agent_new(token, stream, v, &asker),
            Msg::XHub { token, stream, v } => self.xhub_op(token, stream, v),
            Msg::Version { mut stream, v, asker } => {
                let from = v.get("from").and_then(|x| x.as_str()).unwrap_or("");
                let what = v.get("do").and_then(|x| x.as_str()).unwrap_or("");
                // `from` is the judged agent's (docs/issues/17), then main's ops are main's
                match self.speaks_as(&asker, from, &format!("version {what}")).and_then(|()| version_allowed(from, what)) {
                    Ok(()) => {
                        let text = self.version_op(&v);
                        write_json(&mut stream, &json!({"ok": true, "text": text}));
                    }
                    Err(e) => {
                        write_json(&mut stream, &json!({"ok": false, "error": e}));
                    }
                }
            }
            Msg::Notice { kind, text } => {
                // a switch phase alone (its start, its probation passed): the switch row says it, no thread line
                if kind != crate::switch::SWITCH_KIND {
                    self.feed_rec(MAIN, if kind == "warn" { Feed::warn(text) } else { Feed::info(text) });
                }
                self.broadcast_versions();
                // the switcher's notices mark its phases (versions.json)
                self.switch_moved();
            }
            Msg::Release { client, v } => self.release_event(client, v),
            Msg::Update(v) => self.update_event(v),
            Msg::Changes { name, v } => self.on_changes(name, v),
            Msg::RoleLine { dir, key, line } => self.step(Input::RoleLine { dir, key, line }),
            Msg::UsageCounted(l) => self.usage_counted(*l),
            Msg::TimerName { id, reply } => self.step(Input::TimerName { id, reply }),
            Msg::GateChecked { dir, n, req, out } => self.on_checked(&dir, &n, *req, out),
            Msg::BuildEnded { rev } => {
                self.building.remove(&rev);
                self.broadcast_versions();
            }
            Msg::Land { line } => {
                if let Some(rec) = line {
                    let landed = matches!(rec, Feed::Landed(_));
                    self.feed_rec(MAIN, rec);
                    // a land moved main or a feature: the features' facts again
                    self.refresh_features();
                    if landed {
                        self.merged_all();
                    }
                }
                self.state_now();
            }
            Msg::Shutdown { keep } => return Flow::Stop { keep },
        }
        Flow::Go
    }

    /// `dir`'s REPL of generation `gen` is gone (it exited, or its start
    /// stalled: repl_starts.rs calls this at once, so a later message of
    /// that generation finds it dead and kills its process).
    pub(super) fn repl_gone(&mut self, dir: String, gen: u64, reason: String, cause: super::repl_starts::Gone) -> Flow {
        // a killed generation is not live anymore: its exit is
        // expected; any exit of the live one is a crash (the hub
        // never asks a REPL to quit)
        if self.gens.get(&dir) != Some(&gen) {
            return Flow::Go;
        }
        self.start_gone(&dir, cause);
        self.gens.remove(&dir);
        self.repls.remove(&dir);
        self.gate_forget(&dir);
        self.pids.remove(&dir);
        // its writer's lock goes with it (a respawn resumes the log)
        self.recorders.remove(&dir);
        if self.switching.contains_key(&dir) && !self.switch_spawned.contains(&dir) {
            // the reload a switch asked for: the same session on
            // this hub's binary, the same port
            let port = self.ports.get(&dir).copied();
            if let Some(name) = self.agent_by_dir(&dir).map(|a| a.name.clone()) {
                self.restored.insert(dir.clone());
                self.switch_spawned.insert(dir.clone());
                self.spawn_on(&name, true, None, port);
                return Flow::Go;
            }
        }
        // the new process of a switch died: a crash like any other
        self.switching.remove(&dir);
        self.switch_spawned.remove(&dir);
        self.restored.remove(&dir);
        // a new version on probation: a REPL that dies is a
        // reason to roll back, a slow start is not (repl_start)
        if cause.reports() {
            crate::switch::report_failure(&self.opts.paths, &format!("the REPL of {} stopped: {}", dir, reason));
        }
        if let Some(name) = self.agent_by_dir(&dir).map(|a| a.name.clone()) {
            self.step(Input::ReplExited { agent: name, crashed: true, reason });
        }
        Flow::Go
    }
}
