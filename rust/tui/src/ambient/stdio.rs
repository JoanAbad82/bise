//! The core's stdio with the app (pure; client-protocol step 6): one JSON
//! object per line both ways, either the older lines (`{cmd}` in, `{ev}`
//! out) or JSON-RPC 2.0 (`bise ambient-core --rpc`, the names are
//! `bise_proto::app_rpc`'s).
//!
//! JSON-RPC: `initialize` first (answered with what this core serves),
//! then `initialized`; the events the core makes before it are held and
//! written after it, in order. A request becomes the command line the
//! core's parser reads (`Cmd::parse`, one parser for both ways); its
//! response (`{}`, or the parser's refusal) is written before the events
//! the command causes. Nothing here logs an event, so a computer-use
//! still (`core/computer_peek`) never reaches the log.
//!
//! TODO(client-protocol step 6, land 2): the older lines go with the
//! Python e2e's move; `--rpc` becomes the only way.

use bise_proto::app_rpc::{self, AppInit, AppInitResult, INITIALIZE, INITIALIZED};
use bise_proto::jsonrpc::{code, Id, Message, Response, RpcError};
use serde_json::{json, Value};

/// What one stdin line asks of the run loop.
#[derive(Debug, PartialEq)]
pub enum Took {
    /// a command line for `Cmd::parse`; `id`: a request's, to answer
    Cmd { line: String, id: Option<Id> },
    /// lines to write now (an answer, a refusal, the held events)
    Write(Vec<String>),
    /// lines to write and one to log (a line the core can't read)
    Refused { write: Vec<String>, log: String },
    Nothing,
}

#[derive(Debug, PartialEq)]
enum Phase {
    /// nothing read yet: only `initialize`
    New,
    /// `initialize` answered: events held until `initialized`
    Answered,
    Ready,
}

#[derive(Debug)]
pub struct Stdio {
    /// None: the older lines
    rpc: Option<(Phase, Vec<Value>)>,
}

impl Stdio {
    pub fn older() -> Stdio {
        Stdio { rpc: None }
    }

    pub fn rpc() -> Stdio {
        Stdio { rpc: Some((Phase::New, Vec::new())) }
    }

    pub fn is_rpc(&self) -> bool {
        self.rpc.is_some()
    }

    /// One stdin line (not blank).
    pub fn line_in(&mut self, line: &str) -> Took {
        let Some((phase, held)) = self.rpc.as_mut() else {
            return Took::Cmd { line: line.to_string(), id: None };
        };
        let log = |why: &str| log_of(why, line);
        let msg = match Message::read(line) {
            Ok(m) => m,
            Err(resp) => {
                let log = log(resp.error.as_ref().map_or("", |e| e.message.as_str()));
                return Took::Refused { write: vec![Message::Response(*resp).encode()], log };
            }
        };
        let err = |id: Id, c: i64, m: String| {
            let log = log(&m);
            Took::Refused { write: vec![Message::Response(Response::err(Some(id), RpcError::new(c, m))).encode()], log }
        };
        match msg {
            Message::Request(r) if r.method == INITIALIZE => {
                if *phase != Phase::New {
                    return err(r.id, code::NOT_INITIALIZED, "initialize twice".into());
                }
                if let Err(e) = serde_json::from_value::<AppInit>(r.params.clone()) {
                    return err(r.id, code::INVALID_PARAMS, format!("initialize: {e}"));
                }
                *phase = Phase::Answered;
                let result = serde_json::to_value(AppInitResult::now()).unwrap_or(Value::Null);
                Took::Write(vec![Message::Response(Response::ok(r.id, result)).encode()])
            }
            Message::Request(r) if *phase == Phase::New => err(r.id, code::NOT_INITIALIZED, format!("{}: initialize first", r.method)),
            Message::Request(r) => match app_rpc::cmd_of(&r) {
                Ok(cmd) => Took::Cmd { line: cmd.to_string(), id: Some(r.id) },
                Err(e) => err(r.id, e.code, e.message),
            },
            Message::Notification(n) if n.method == INITIALIZED && *phase == Phase::Answered => {
                *phase = Phase::Ready;
                Took::Write(std::mem::take(held).iter().filter_map(app_rpc::note).map(|n| Message::Notification(n).encode()).collect())
            }
            Message::Notification(n) => Took::Refused { write: vec![], log: log(&format!("a notification it doesn't take ({})", n.method)) },
            Message::Response(_) => Took::Refused { write: vec![], log: log("a response, but the core asks nothing") },
        }
    }

    /// The answer to a request the parser read (`Ok`) or refused.
    pub fn answer(&self, id: Id, parsed: Result<(), String>) -> String {
        let resp = match parsed {
            Ok(()) => Response::ok(id, json!({})),
            Err(e) => Response::err(Some(id), RpcError::new(code::INVALID_PARAMS, e)),
        };
        Message::Response(resp).encode()
    }

    /// The core's events as lines to write now (held before `initialized`).
    pub fn out(&mut self, evs: Vec<Value>) -> Vec<String> {
        match self.rpc.as_mut() {
            None => evs.iter().map(Value::to_string).collect(),
            Some((Phase::Ready, _)) => evs.iter().filter_map(app_rpc::note).map(|n| Message::Notification(n).encode()).collect(),
            Some((_, held)) => {
                held.extend(evs);
                Vec::new()
            }
        }
    }
}

/// The log's line for a stdin line the core refused: why and the line,
/// a key redacted (setup.rs); a [`app_rpc::NO_LOG`] line (a key, a shot)
/// by its name and size only, without the why (a parser's words may
/// quote a value).
pub fn log_of(why: &str, line: &str) -> String {
    match app_rpc::loggable(line) {
        Some(said) => format!("ambient-core: refused {said}"),
        None => format!("ambient-core: {why}: {}", super::setup::redact(line)),
    }
}

#[cfg(test)]
#[path = "stdio_tests.rs"]
mod tests;
