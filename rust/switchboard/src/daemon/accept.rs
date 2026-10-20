//! The hub's two sockets (docs/issues/16): one accept loop per socket,
//! one thread per connection; the first line's op decides what the
//! connection becomes (`crate::peer::access`; JSON-RPC's `initialize` is
//! judged as a `hello` and refused with its error response, REFUSED).
//! On `hub.sock`, a `hello` or a `notice` from an agent's process (`crate::peer::judge`, on the
//! peer's pid and the process table) gets one `{"ev":"refused","error"}`
//! line (bise_proto's HubEv::Refused),
//! is closed, and leaves one hub.log line naming the agent.
//! An agent request (`agent`, `version`; agent.sock only)
//! carries its sender's verdict ([`Asker`]) to the daemon thread, where
//! sb-core checks its `from` against it before anything runs
//! (daemon/agent_req.rs, bend/hub/peer.bend, docs/issues/17, issue 37 #2).
//! The peer is read with `bise_peer::table::around`: only the processes
//! the judge walks.

use super::{log_line, write_json, Msg};
use crate::paths::Paths;
use crate::peer::{access, judge, Access, HubSide, Sock, Who};
use serde_json::{json, Value};
use std::collections::BTreeSet;
use std::io::{BufRead, BufReader};
use std::os::unix::net::{UnixListener, UnixStream};
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::mpsc::Sender;
use std::sync::Arc;

/// What both accept loops share: the hub's facts for the peer check and
/// the connection ids (one sequence: a client id and an agent token never
/// meet).
pub(super) struct Doors {
    pub(super) paths: Paths,
    /// The hub's pid, its tag id and its owners' tags (`peer::HubSide`;
    /// its siblings are read at each check).
    pub(super) hub: HubSide,
    pub(super) next: AtomicU64,
}

impl Doors {
    pub(super) fn new(paths: Paths, id: String, owners: &str) -> Arc<Doors> {
        let owners = owners.split(',').map(str::trim).filter(|t| !t.is_empty()).map(str::to_string).collect();
        let hub = HubSide { pid: std::process::id(), id, owners, siblings: BTreeSet::new() };
        Arc::new(Doors { paths, hub, next: AtomicU64::new(1) })
    }

    /// The ids of the hubs in this hub's `hubs/` folder (its own too).
    fn siblings(&self) -> BTreeSet<String> {
        let mut out: BTreeSet<String> = [self.hub.id.clone()].into();
        let Some(parent) = self.paths.state.parent() else { return out };
        for e in std::fs::read_dir(parent).into_iter().flatten().flatten() {
            let natural = e.path().join("hub.sock");
            out.insert(crate::procs::hub_id(&bise_home::socket::socket_path(&natural)));
        }
        out
    }

    /// Who opened the connection of `pid` (read at its accept), and its
    /// pid and program for the log.
    fn who(&self, pid: Option<u32>) -> (Who, String) {
        let Some(pid) = pid else {
            return (Who::Gone, "pid unknown".into());
        };
        // only what the judge walks (bise_peer::table::around): cheap
        // enough for every agent request
        let table = bise_peer::table::around(&[pid, self.hub.pid]);
        let hub = HubSide { siblings: self.siblings(), ..self.hub.clone() };
        let who = judge(&table, pid, &hub);
        let prog = table
            .iter()
            .find(|p| p.pid == pid)
            .map(|p| Path::new(&p.command).file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default())
            .unwrap_or_default();
        (who, format!("pid {pid} ({prog})"))
    }

    /// The sender of an agent request on `sock`, judged at its accept.
    fn asker(&self, pid: Option<u32>, sock: Sock) -> Asker {
        let (who, peer) = self.who(pid);
        Asker { who, peer, sock }
    }
}

/// Who sent an agent request (docs/issues/17): its process's verdict and,
/// for hub.log, its pid and program and the socket.
#[derive(Debug)]
pub(super) struct Asker {
    pub(super) who: Who,
    pub(super) peer: String,
    pub(super) sock: Sock,
}

impl Asker {
    /// Its fact for sb-core's inputs (`req`, `speaks`).
    pub(super) fn by(&self) -> crate::peer::Sender {
        crate::peer::Sender::of(&self.who, self.sock)
    }
}

/// A socket's file name, for hub.log and the refusals.
pub(super) trait SockName {
    fn name(self) -> &'static str;
}

impl SockName for Sock {
    fn name(self) -> &'static str {
        match self {
            Sock::Agent => "agent.sock",
            Sock::Client => "hub.sock",
        }
    }
}

/// `initialize`'s refusal (docs/issues/16): its error response, REFUSED.
fn rpc_refusal(v: &Value, why: &str) -> Value {
    use bise_proto::rpc::{code, Id, Response, RpcError};
    let id = v.get("id").and_then(|i| serde_json::from_value::<Id>(i.clone()).ok());
    serde_json::to_value(Response::err(id, RpcError::new(code::REFUSED, why))).unwrap_or_default()
}

pub(super) fn accept_loop(listener: UnixListener, tx: Sender<Msg>, doors: Arc<Doors>, sock: Sock) {
    for conn in listener.incoming() {
        let Ok(stream) = conn else { continue };
        let id = doors.next.fetch_add(1, Ordering::Relaxed);
        // at once: a peer that writes one line and closes (a `notice`)
        // has no pid to read once it is gone
        let pid = crate::peer_os::peer_pid(&stream);
        let (tx, doors) = (tx.clone(), doors.clone());
        std::thread::spawn(move || serve(stream, pid, id, &tx, &doors, sock));
    }
}

fn serve(stream: UnixStream, pid: Option<u32>, id: u64, tx: &Sender<Msg>, doors: &Doors, sock: Sock) {
    let Ok(read_half) = stream.try_clone() else {
        return;
    };
    let mut r = BufReader::new(read_half);
    let mut first = String::new();
    if r.read_line(&mut first).unwrap_or(0) == 0 {
        return;
    }
    let Ok(v) = serde_json::from_str::<Value>(first.trim()) else {
        return;
    };
    // JSON-RPC's `initialize` is judged like `hello` (client-protocol
    // step 1, daemon/rpc.rs): the same door, the same refusals
    let init = bise_proto::rpc::is_rpc(&v) && v.get("method").and_then(|x| x.as_str()) == Some(bise_proto::rpc::INITIALIZE);
    let op = if init { "hello".to_string() } else { v.get("op").and_then(|x| x.as_str()).unwrap_or("").to_string() };
    let mut stream = stream;
    let name = sock.name();
    // an agent request's sender, judged here (agent.sock): sb-core maps
    // it to an agent (daemon/agent_req.rs, docs/issues/17)
    let mut asker = None;
    // a client's pid and program, judged at its accept (hub.log names it)
    let mut peer_of = String::new();
    match access(sock, &op) {
        Access::No => {
            write_json(&mut stream, &json!({"ok": false, "error": format!("{name} does not serve the op {op:?}")}));
            return;
        }
        Access::Open => {}
        Access::Agent => asker = Some(doors.asker(pid, sock)),
        Access::User => {
            let (who, peer) = doors.who(pid);
            if let Some(why) = who.refusal_of(&op) {
                log_line(&doors.paths, &format!("client refused on hub.sock ({op}): {peer}: {why}"));
                // the typed refusal (bise_proto HubEv::Refused): one shape
                // for this writer and the TUI's and the desktop core's readers
                if init {
                    write_json(&mut stream, &rpc_refusal(&v, &why));
                } else {
                    write_json(&mut stream, &bise_proto::hub::HubEv::Refused { error: why.to_string() }.to_value());
                }
                return;
            }
            peer_of = peer;
        }
    }
    match op.as_str() {
        // `initialize`; or the hello of a client from before
        // client-protocol (v2026.10.2-30): the hub's exe and reload id,
        // then the connection closes (nothing more is read from it)
        "hello" => {
            if !init {
                let _ = tx.send(Msg::OlderHello { stream, peer: peer_of });
                return;
            }
            let _ = tx.send(Msg::RpcNew { id, stream, v, peer: peer_of });
            let mut line = String::new();
            loop {
                line.clear();
                match r.read_line(&mut line) {
                    Ok(0) | Err(_) => break,
                    Ok(_) => {
                        if let Ok(v) = serde_json::from_str::<Value>(line.trim()) {
                            let _ = tx.send(Msg::ClientLine { id, v });
                        }
                    }
                }
            }
            let _ = tx.send(Msg::ClientGone { id });
        }
        "agent" => {
            let asker = asker.unwrap_or_else(|| doors.asker(pid, sock));
            let _ = tx.send(Msg::AgentNew { token: id, stream, v, asker });
        }
        "version" => {
            let asker = asker.unwrap_or_else(|| doors.asker(pid, sock));
            let _ = tx.send(Msg::Version { stream, v, asker });
        }
        "xin" | "xreply" | "xfollow" => {
            let _ = tx.send(Msg::XHub { token: id, stream, v });
        }
        "notice" => {
            let s = |k: &str| v.get(k).and_then(|x| x.as_str()).unwrap_or("").to_string();
            let _ = tx.send(Msg::Notice { kind: s("kind"), text: s("text") });
        }
        "ping" => {
            write_json(&mut stream, &json!({"ok": true, "pid": std::process::id()}));
        }
        _ => {}
    }
}

/// The agents' requests that only read (hub-loop, architect m_30615):
/// they go in the inbox's urgent lane with the clients' lines
/// (`Msg::is_urgent`, daemon/inbox.rs). An agent's `sb` waits for its
/// answer before its next command, so its own writes are applied before
/// its read runs, and a read answers the state as it is now. Each op here
/// changes nothing: no sb-core step that journals, no file written (`list`
/// and `tasks` are sb-core reads, the test below; `inspect` reads
/// transcripts, `history` and `show` the search index (daemon/tindex.rs:
/// a cache of the transcripts it may bring up to date, not state), `page_list` and
/// `page_waiting` the page store). Op names only: an op whose read or
/// write depends on its args (`every`, `wake`, `artifact`) stays in order.
pub(super) const READS: &[&str] = &["list", "tasks", "inspect", "history", "show", "page_list", "page_waiting"];

/// An agent request that only reads ([`READS`]).
pub(super) fn is_read(v: &Value) -> bool {
    v.get("cmd").and_then(|c| c.as_str()).is_some_and(|c| READS.contains(&c))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::{AgentReq, Effect, Env, Hub, Input, Loss};
    use crate::model::Workspace;

    /// No git, no project: a read never asks for one.
    struct NoEnv;

    impl Env for NoEnv {
        fn now(&self) -> u64 {
            1_000_000
        }
        fn is_git(&mut self) -> bool {
            false
        }
        fn worktree_create(&mut self, _: &str, _: bool) -> Result<Workspace, String> {
            Err("a read made a worktree".into())
        }
        fn worktree_loss(&mut self, _: &Workspace) -> Loss {
            Loss::default()
        }
        fn worktree_drop(&mut self, _: &str, _: &Workspace, _: &Loss) -> Result<Option<String>, String> {
            Err("a read dropped a worktree".into())
        }
        fn worktree_restore(&mut self, _: &str, _: &Workspace, _: Option<&str>) -> Result<Workspace, String> {
            Err("a read restored a worktree".into())
        }
    }

    #[test]
    fn only_the_listed_ops_are_reads() {
        for c in READS {
            assert!(is_read(&json!({"op": "agent", "cmd": c, "from": "t1"})), "{c}");
        }
        for c in ["send", "report", "status", "land", "spawn", "wake", "every", "artifact", "page_publish", "page_tick", "page_notes", "follow"] {
            assert!(!is_read(&json!({"op": "agent", "cmd": c, "from": "t1"})), "{c} is not a read");
        }
        assert!(!is_read(&json!({"op": "version"})));
    }

    /// The sb-core reads (`list`, `tasks`) journal nothing, on a hub with
    /// agents and their state; the others never step sb-core
    /// (daemon/agent_req.rs's shell_request answers them).
    #[test]
    fn an_agents_read_journals_nothing() {
        let (mut h, mut env) = (Hub::new("/w"), NoEnv);
        let spawn = json!({"cmd": "spawn", "name": "t1", "objective": "o", "worktree": false});
        h.handle(Input::Agent { token: 1, from: "main".into(), req: AgentReq::decode(spawn).expect("spawn"), by: crate::peer::Sender::hub() }, &mut env);
        for (i, c) in ["list", "tasks"].iter().enumerate() {
            for from in ["main", "t1"] {
                let req = AgentReq::decode(json!({"cmd": c})).expect("a read");
                let fx = h.handle(Input::Agent { token: 10 + i as u64, from: from.into(), req, by: crate::peer::Sender::hub() }, &mut env);
                assert!(!fx.iter().any(|e| matches!(e, Effect::Journal(_))), "sb {c} from {from} journaled: {fx:?}");
                assert!(fx.iter().any(|e| matches!(e, Effect::Reply { .. })), "sb {c} from {from} answered");
            }
        }
    }
}
