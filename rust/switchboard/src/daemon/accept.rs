//! The hub's two sockets (docs/issues/16): one accept loop per socket,
//! one thread per connection; the first line's op decides what the
//! connection becomes (`crate::peer::access`; JSON-RPC's `initialize` is
//! judged as a `hello` and refused with its error response, REFUSED).
//! On `hub.sock`, a `hello` or a `notice` from an agent's process (`crate::peer::judge`, on the
//! peer's pid and the process table) gets one `{"ev":"refused","error"}`
//! line (bise_proto's HubEv::Refused),
//! is closed, and leaves one hub.log line naming the agent.
//! An agent request (`agent`, `version`; agent.sock only)
//! carries its sender's verdict ([`Asker`]) to the daemon thread, which
//! checks its `from` against it before anything else (`Shell::speaks_as`,
//! the rule `crate::peer::speaker`, docs/issues/17). The peer is read with
//! `bise_peer::table::around`: only the processes the judge walks.

use super::{log_line, write_json, Msg};
use crate::paths::Paths;
use crate::peer::{access, judge, speaker, Access, HubSide, Known, Sock, Who};
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
    fn asker(&self, pid: Option<u32>, sock: &'static str) -> Asker {
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
    pub(super) sock: &'static str,
}

impl super::Shell {
    /// Whether the request that says `from` may be served (the pure rule
    /// is `peer::speaker`); refused: one hub.log line, and the words the
    /// caller prints. agent.sock's agent requests call it.
    pub(super) fn speaks_as(&self, asker: &Asker, from: &str, cmd: &str) -> Result<(), String> {
        let agents: Vec<Known> =
            self.hub.st.agents.values().map(|a| Known { name: &a.name, dir: &a.dir, aliases: &a.aliases }).collect();
        speaker(&asker.who, from, &agents).inspect_err(|why| {
            log_line(&self.opts.paths, &format!("agent request refused on {} ({cmd}): {}: {why}", asker.sock, asker.peer));
        })
    }

    /// An agent request: served only when its sender speaks as itself.
    pub(super) fn agent_new(&mut self, token: super::Token, mut stream: UnixStream, v: Value, asker: &Asker) {
        let s = |k: &str| v.get(k).and_then(|x| x.as_str()).unwrap_or("");
        if let Err(e) = self.speaks_as(asker, s("from"), s("cmd")) {
            write_json(&mut stream, &json!({"ok": false, "error": e}));
            return;
        }
        self.agent_request(token, stream, v);
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
    let name = if sock == Sock::Agent { "agent.sock" } else { "hub.sock" };
    // an agent request's sender, judged here (agent.sock): the daemon
    // thread maps it to an agent (`Shell::speaks_as`, docs/issues/17)
    let mut asker = None;
    // a client's pid and program, judged at its accept (hub.log names it)
    let mut peer_of = String::new();
    match access(sock, &op) {
        Access::No => {
            write_json(&mut stream, &json!({"ok": false, "error": format!("{name} does not serve the op {op:?}")}));
            return;
        }
        Access::Open => {}
        Access::Agent => asker = Some(doors.asker(pid, name)),
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
            let asker = asker.unwrap_or_else(|| doors.asker(pid, name));
            let _ = tx.send(Msg::AgentNew { token: id, stream, v, asker });
        }
        "version" => {
            let asker = asker.unwrap_or_else(|| doors.asker(pid, name));
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
