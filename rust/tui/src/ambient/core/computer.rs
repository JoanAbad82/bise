//! Computer use live in the window (S29, architect m_14058): the
//! machine's computer-use agents as `computer_live` rows, each with its
//! project, and his acts on them (`computer {act, key}`: take, hand_back,
//! stop, peek).
//!
//! - Read: computer use's state.json through its one reader
//!   (`bise_computer_use::state::agents`), stat at most every
//!   [`READ_EVERY`] on the tick, read again on a new mtime; `computer_live`
//!   only on change (and once at the first read). No thread, no file.
//! - Project: a key's hub half is the tag hub id, the hash of the socket
//!   its hub is reached by ([`peer_hub`]: the path switchboard's
//!   `proc_hub` and the TUI's `set_hub` hash, the short one when
//!   relocated). A hub of none of his projects: no project, no act.
//! - Acts: each on its own short thread (the commands' socket, waits
//!   bounded), the answer back on the tick; no optimistic row: state.json
//!   moves and the rows follow. A failure is `error {cmd: computer}`.
//! - Peek: inline, never stored: the still goes out in one `computer_peek`
//!   and is dropped (no file, no image store, no log line); one in flight
//!   per agent and one per [`PEEK_EVERY`].

use super::*;
use bise_computer_use::cli::StopOutcome;
use bise_computer_use::live as cu_live;
use bise_computer_use::state::{self as cu_state, Live};
use bise_home::projects::Row;
use bise_proto::draft::{ComputerAgent, CoreEv, LiveKind, PeekShot};
use std::collections::{HashMap, HashSet};
use std::time::SystemTime;

/// state.json is looked at (one stat) at most this often.
pub const READ_EVERY: Duration = Duration::from_millis(500);
/// One peek per agent this often at most (the broker allows one a second).
pub const PEEK_EVERY: Duration = Duration::from_secs(2);
/// How long take / hand_back wait on the commands' socket.
pub const CTL_WAIT: Duration = Duration::from_secs(2);
/// How long a peek waits (the broker gives its capture 5 s).
pub const PEEK_WAIT: Duration = Duration::from_secs(8);

/// A call on computer use's commands' socket: its result, or (its code,
/// its words); `no_broker` when nothing listens.
pub type CtlFn = Arc<dyn Fn(&str, &Value) -> Result<Value, (String, String)> + Send + Sync>;
/// The user's /stop of an agent's computer use by its key.
pub type StopFn = Arc<dyn Fn(&str) -> StopOutcome + Send + Sync>;

/// What the core reaches of computer use: real in `bise ambient-core`
/// ([`ComputerPorts::real`]), fakes in tests.
pub struct ComputerPorts {
    /// state.json's mtime (None: no file)
    pub stat: Box<dyn Fn() -> Option<SystemTime>>,
    pub read: Box<dyn Fn() -> Value>,
    /// a registered project's hub id in the tags ([`peer_hub`] of its hub folder)
    pub peer_hub: Box<dyn Fn(&Row) -> String>,
    pub ctl: CtlFn,
    pub stop: StopFn,
}

impl ComputerPorts {
    pub fn real() -> ComputerPorts {
        let paths = bise_computer_use::paths::Paths::from_env();
        let home = bise_home::Home::from_env();
        let (p1, p2, p3, p4) = (paths.clone(), paths.clone(), paths.clone(), paths);
        ComputerPorts {
            stat: Box::new(move || std::fs::metadata(p1.state_file()).and_then(|m| m.modified()).ok()),
            read: Box::new(move || cu_state::read(&p2)),
            peer_hub: Box::new(move |r| peer_hub(&home.hub_dir(&r.id))),
            ctl: Arc::new(move |op, args| {
                let wait = if op == "peek" { PEEK_WAIT } else { CTL_WAIT };
                let mut c = bise_computer_use::client::Conn::ctl_within(&p3, wait).map_err(|_| ("no_broker".to_string(), "computer use isn't running".to_string()))?;
                match c.call(op, args) {
                    Ok(Ok(v)) => Ok(v),
                    Ok(Err(e)) => Err((e["code"].as_str().unwrap_or("failed").to_string(), e["message"].as_str().unwrap_or("failed").to_string())),
                    Err(e) => Err(("failed".to_string(), e.to_string())),
                }
            }),
            stop: Arc::new(move |key| bise_computer_use::cli::stop_agent(&p4, key)),
        }
    }
}

/// The tag hub id of the hub whose state folder is `state`: the hash of
/// `<state>/hub.sock` as it is reached (`bise_home::socket::socket_path`,
/// the short `/tmp/bise-<uid>/...` link when too long), the same path
/// switchboard's `Paths::socket` gives the hub and the TUI.
pub fn peer_hub(state: &Path) -> String {
    bise_peer::tags::hub_id(&bise_home::socket::socket_path(&state.join("hub.sock")))
}

/// An act's answer, back from its thread.
enum Done {
    /// take / hand_back / stop: what went wrong, if anything
    Acted { err: Option<String> },
    Peeked { key: String, res: Result<Value, (String, String)> },
}

pub(super) struct Computer {
    ports: ComputerPorts,
    tx: Sender<Done>,
    rx: Receiver<Done>,
    looked: Option<Instant>,
    mtime: Option<SystemTime>,
    live: Vec<Live>,
    /// each registered project's (id, tag hub id), for the rows' ids it was made of
    hubs: Vec<(String, String)>,
    /// the rows last sent (None: none yet)
    sent: Option<Vec<ComputerAgent>>,
    peeking: HashSet<String>,
    peeked: HashMap<String, Instant>,
}

impl Computer {
    /// The rows, each with its line in `live::line`'s words (no age, not
    /// ASCII: the window draws `↖` and `·`); an entry with no line (holds
    /// nothing) is not a row.
    fn items(&self) -> Vec<ComputerAgent> {
        self.live
            .iter()
            .filter_map(|a| Some((a, cu_live::line(a, None, false)?)))
            .map(|(a, l)| ComputerAgent {
                key: a.key.clone(),
                project: a.hub.as_ref().and_then(|h| self.hubs.iter().find(|(_, x)| x == h)).map(|(id, _)| id.clone()),
                agent: a.name.clone(),
                driving: a.driving.clone(),
                place: a.place.clone(),
                since_ms: a.since_ms,
                paused: a.paused,
                stopped: a.stopped,
                kind: match l.kind {
                    cu_live::Kind::Driving => LiveKind::Driving,
                    cu_live::Kind::Paused => LiveKind::Paused,
                    cu_live::Kind::Stopped => LiveKind::Stopped,
                },
                mark: l.mark.to_string(),
                words: l.words,
            })
            .collect()
    }

    /// The hub ids again when the registry's rows changed.
    fn map_projects(&mut self, rows: &[Row]) {
        if self.hubs.len() == rows.len() && self.hubs.iter().zip(rows).all(|((id, _), r)| *id == r.id) {
            return;
        }
        self.hubs = rows.iter().map(|r| (r.id.clone(), (self.ports.peer_hub)(r))).collect();
    }
}

fn ev(e: CoreEv) -> Value {
    serde_json::to_value(e).unwrap_or_default()
}

fn peek_ev(key: String, shot: Option<PeekShot>, why: Option<&str>) -> Value {
    ev(CoreEv::ComputerPeek { key, shot, why: why.map(str::to_string) })
}

/// The broker's peek result as the window's still (None: no image in it).
fn shot_of(v: &Value) -> Option<PeekShot> {
    let n = |k: &str| v.get(k).and_then(Value::as_u64);
    Some(PeekShot {
        data: v.get("data").and_then(Value::as_str).filter(|d| !d.is_empty())?.to_string(),
        mime: v.get("mime").and_then(Value::as_str).unwrap_or("image/jpeg").to_string(),
        width: n("width").unwrap_or(0) as u32,
        height: n("height").unwrap_or(0) as u32,
        at_ms: n("at_ms").unwrap_or_else(now_ms),
    })
}

impl Core {
    /// Computer use's live rows and acts for the window (S29).
    pub fn set_computer(&mut self, ports: ComputerPorts) {
        let (tx, rx) = mpsc::channel();
        self.computer = Some(Computer {
            ports,
            tx,
            rx,
            looked: None,
            mtime: None,
            live: Vec::new(),
            hubs: Vec::new(),
            sent: None,
            peeking: HashSet::new(),
            peeked: HashMap::new(),
        });
    }

    pub(super) fn tick_computer(&mut self, now: Instant) {
        let Some(c) = self.computer.as_mut() else { return };
        let mut out = Vec::new();
        while let Ok(d) = c.rx.try_recv() {
            match d {
                Done::Acted { err: Some(e) } => out.push(json!({"ev": "error", "cmd": "computer", "text": e})),
                Done::Acted { err: None } => {}
                Done::Peeked { key, res } => {
                    c.peeking.remove(&key);
                    out.push(match res.as_ref().map(shot_of) {
                        Ok(Some(shot)) => peek_ev(key, Some(shot), None),
                        Ok(None) => peek_ev(key, None, Some("failed")),
                        Err((code, _)) => {
                            let why = if matches!(code.as_str(), "not_found" | "too_soon" | "no_broker") { code.as_str() } else { "failed" };
                            peek_ev(key, None, Some(why))
                        }
                    });
                }
            }
        }
        if !matches!(c.looked, Some(t) if now.duration_since(t) < READ_EVERY) {
            c.looked = Some(now);
            let m = (c.ports.stat)();
            if m != c.mtime || c.sent.is_none() {
                c.mtime = m;
                c.live = if m.is_some() { cu_state::agents(&(c.ports.read)()) } else { Vec::new() };
            }
            c.map_projects(&self.hubs.rows);
            let items = c.items();
            if c.sent.as_ref() != Some(&items) {
                c.sent = Some(items.clone());
                out.push(ev(CoreEv::ComputerLive { items }));
            }
        }
        for e in out {
            self.emit(e);
        }
    }

    /// His act on an agent's computer use, by its `computer_live` key.
    pub(super) fn computer_cmd(&mut self, act: &str, key: &str, max_width: Option<u32>, now: Instant) {
        let err = |text: &str| json!({"ev": "error", "cmd": "computer", "text": text});
        let Some(c) = self.computer.as_mut() else { return self.emit(err("this core shows no computer use")) };
        let row = c.sent.iter().flatten().find(|a| a.key == key);
        let text = match row {
            None => Some("that agent doesn't use computer use now"),
            Some(a) if a.project.is_none() => Some("that agent is another bise's: act on it from there"),
            Some(_) => None,
        };
        if let Some(t) = text {
            return self.emit(err(t));
        }
        let (tx, key) = (c.tx.clone(), key.to_string());
        match act {
            "take" | "hand_back" => {
                let ctl = c.ports.ctl.clone();
                let op = if act == "take" { "pause" } else { "resume" };
                std::thread::spawn(move || {
                    let err = ctl(op, &json!({"agent": key})).err().map(|(_, m)| m);
                    let _ = tx.send(Done::Acted { err });
                });
            }
            "stop" => {
                let stop = c.ports.stop.clone();
                std::thread::spawn(move || {
                    let err = match stop(&key) {
                        StopOutcome::Stopped | StopOutcome::NotDriving => None,
                        StopOutcome::NoBroker => Some("computer use isn't running".to_string()),
                        StopOutcome::Refused(e) => Some(e),
                    };
                    let _ = tx.send(Done::Acted { err });
                });
            }
            "peek" => {
                let soon = c.peeking.contains(&key) || c.peeked.get(&key).is_some_and(|t| now.duration_since(*t) < PEEK_EVERY);
                if soon {
                    return self.emit(peek_ev(key, None, Some("too_soon")));
                }
                c.peeking.insert(key.clone());
                c.peeked.insert(key.clone(), now);
                let ctl = c.ports.ctl.clone();
                let mut args = json!({"agent": key});
                if let Some(w) = max_width {
                    args["max_width"] = json!(w);
                }
                std::thread::spawn(move || {
                    let res = ctl("peek", &args);
                    let _ = tx.send(Done::Peeked { key, res });
                });
            }
            other => self.emit(err(&format!("computer: no act {other:?}"))),
        }
    }
}
