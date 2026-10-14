//! The core's stdio with the app (pure; client-protocol step 6): JSON-RPC
//! 2.0, one object per line both ways, the names `bise_proto::app_rpc`'s.
//!
//! `initialize` first (answered with what this core serves),
//! then `initialized`; the events the core makes before it are held and
//! written after it, in order. A request becomes the command line the
//! core's parser reads (`Cmd::parse`, one parser for both ways); the
//! parser's refusal is written at once, a read command's answer comes from
//! the core ([`replies`]: `{}` for its own commands, a `hub/<tag>`'s its
//! hub's own response, architect m_23524), before the events it causes.
//! Nothing here logs an event, so a computer-use
//! still (`core/computer_peek`) never reaches the log.

use bise_proto::app_rpc::{self, AppInit, AppInitResult, INITIALIZE, INITIALIZED};
use bise_proto::jsonrpc::{code, Id, Message, Response, RpcError};
use serde_json::{json, Value};

/// What one stdin line asks of the run loop.
#[derive(Debug, PartialEq)]
pub enum Took {
    /// a command line for `Cmd::parse` and the request's id, to answer
    Cmd { line: String, id: Id },
    /// lines to write now (an answer, the held events)
    Write(Vec<String>),
    /// lines to write and one to log (a line the core can't read)
    Refused { write: Vec<String>, log: String },
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
    phase: Phase,
    /// the events made before `initialized`, in order
    held: Vec<Value>,
}

impl Default for Stdio {
    fn default() -> Stdio {
        Stdio::new()
    }
}

impl Stdio {
    pub fn new() -> Stdio {
        Stdio { phase: Phase::New, held: Vec::new() }
    }

    /// One stdin line (not blank).
    pub fn line_in(&mut self, line: &str) -> Took {
        let (phase, held) = (&mut self.phase, &mut self.held);
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
                Ok(cmd) => Took::Cmd { line: cmd.to_string(), id: r.id },
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
    /// A read one is answered by the core ([`replies`]); `Ok` stays for tests.
    pub fn answer(&self, id: Id, parsed: Result<(), String>) -> String {
        let resp = match parsed {
            Ok(()) => Response::ok(id, json!({})),
            Err(e) => Response::err(Some(id), RpcError::new(code::INVALID_PARAMS, e)),
        };
        Message::Response(resp).encode()
    }

    /// The core's events as lines to write now (held before `initialized`).
    pub fn out(&mut self, evs: Vec<Value>) -> Vec<String> {
        if self.phase != Phase::Ready {
            self.held.extend(evs);
            return Vec::new();
        }
        evs.iter().filter_map(app_rpc::note).map(|n| Message::Notification(n).encode()).collect()
    }
}

/// The core's answers to the app's requests (`Core::take_replies`) as
/// lines: written as they come, never held (a request comes only after
/// `initialize`).
pub fn replies(rs: Vec<Response>) -> Vec<String> {
    rs.into_iter().map(|r| Message::Response(r).encode()).collect()
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
