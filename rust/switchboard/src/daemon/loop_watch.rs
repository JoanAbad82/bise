//! The loop's watchdog (hub-stall): what the hub's loop runs, and a
//! hub.log line when one message holds it. On 2026-10-14 his loop sat
//! 27 min in one call and nothing said where; now hub.log says
//! `hub loop busy 30 s on <msg>` at 5 s, 30 s, then each minute, and
//! `hub loop free after N s` when it moves again.
//!
//! The loop marks each message it takes ([`LoopWatch::on`], `Msg::label`:
//! its kind and its agent or client) and its idle wait; a thread reads
//! the mark once a second. The cadence is pure ([`say_at`]).
//!
//! What may still hold the loop: sb-core's line (`core::CoreLink::call`,
//! strictly one request then one answer: sb-core reads the whole line
//! before it writes, so the two pipes never fill at once), the git
//! queries sb-core asks for, and a few short processes (`ps`, `launchctl`
//! in wakes.rs). No peer socket: every write goes through
//! daemon/outbox.rs.

use super::{log_line, Msg};
use crate::paths::Paths;
use crate::util::now_ms;
use std::sync::{Arc, Mutex};
use std::time::Duration;

/// The first word on a busy loop, then the second; then one per minute.
const FIRST_MS: u64 = 5_000;
const SECOND_MS: u64 = 30_000;
const EVERY_MS: u64 = 60_000;

/// When a loop busy for `busy_ms` is said again, `said` lines said
/// already: the next line's due time (ms into the busy spell).
pub(super) fn say_at(said: u32) -> u64 {
    match said {
        0 => FIRST_MS,
        1 => SECOND_MS,
        n => SECOND_MS + EVERY_MS * (n as u64 - 1),
    }
}

#[derive(Default)]
struct Mark {
    /// what the loop runs ("" idle)
    what: String,
    since_ms: u64,
    /// lines said for this busy spell
    said: u32,
}

#[derive(Clone, Default)]
pub(super) struct LoopWatch {
    mark: Arc<Mutex<Mark>>,
}

impl LoopWatch {
    /// The watch and its thread (hub.log in `paths`).
    pub(super) fn start(paths: &Paths) -> LoopWatch {
        let w = LoopWatch::default();
        let (mark, paths) = (w.mark.clone(), paths.clone());
        std::thread::spawn(move || loop {
            std::thread::sleep(Duration::from_secs(1));
            let line = {
                let mut m = mark.lock().unwrap_or_else(|e| e.into_inner());
                let busy = now_ms().saturating_sub(m.since_ms);
                if m.what.is_empty() || busy < say_at(m.said) {
                    None
                } else {
                    m.said += 1;
                    Some(format!("hub loop busy {} s on {}", busy / 1000, m.what))
                }
            };
            if let Some(l) = line {
                log_line(&paths, &l);
            }
        });
        w
    }

    /// The loop takes `what`.
    pub(super) fn on(&self, what: String) {
        let mut m = self.mark.lock().unwrap_or_else(|e| e.into_inner());
        *m = Mark { what, since_ms: now_ms(), said: 0 };
    }

    /// The loop is done with it; a spell long enough to be said says its
    /// end too. The line to log, if any.
    pub(super) fn idle(&self) -> Option<String> {
        let mut m = self.mark.lock().unwrap_or_else(|e| e.into_inner());
        let out = (m.said > 0).then(|| format!("hub loop free after {} s on {}", now_ms().saturating_sub(m.since_ms) / 1000, m.what));
        *m = Mark::default();
        out
    }
}

impl Msg {
    /// The loop watch's words for this message: its kind, and whose.
    pub(super) fn label(&self) -> String {
        match self {
            Msg::In(i) => format!("input {}", input_kind(i)),
            Msg::ReplConnected { dir, .. } => format!("repl connected {dir}"),
            Msg::ReplSpawned { dir, .. } => format!("repl spawned {dir}"),
            Msg::ReplLine { dir, .. } => format!("repl line {dir}"),
            Msg::ReplStartStep { dir, .. } => format!("repl start step {dir}"),
            Msg::ReplGone { dir, .. } => format!("repl gone {dir}"),
            Msg::ClientLine { id, .. } => format!("client line {id:?}"),
            Msg::ClientGone { id } => format!("client gone {id:?}"),
            Msg::RpcNew { id, .. } => format!("client initialize {id:?}"),
            Msg::AgentNew { v, .. } => format!(
                "sb {} from {}",
                v.get("cmd").or_else(|| v.get("op")).and_then(|x| x.as_str()).unwrap_or("?"),
                v.get("from").and_then(|x| x.as_str()).unwrap_or("?")
            ),
            Msg::OlderHello { .. } => "older hello".into(),
            Msg::XHub { .. } => "another hub's op".into(),
            Msg::Version { .. } => "sb version".into(),
            Msg::Page(_) => "page".into(),
            Msg::Land { .. } => "land".into(),
            Msg::GateChecked { dir, .. } => format!("gate checked {dir}"),
            Msg::RoleLine { dir, .. } => format!("role line {dir}"),
            Msg::Typed { .. } => "typed event".into(),
            _ => "a hub message".into(),
        }
    }
}

/// An input's variant name (its Debug's first word).
fn input_kind(i: &crate::core::Input) -> String {
    let d = format!("{i:?}");
    d.split(|c: char| !c.is_alphanumeric()).next().unwrap_or("?").to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_busy_loop_is_said_at_5_s_30_s_then_each_minute() {
        let at: Vec<u64> = (0..5).map(say_at).collect();
        assert_eq!(at, [5_000, 30_000, 90_000, 150_000, 210_000]);
    }

    #[test]
    fn a_short_message_says_nothing_and_a_long_one_says_its_end() {
        let w = LoopWatch::default();
        w.on("repl line route-name".into());
        assert_eq!(w.idle(), None);
        w.on("client line 3".into());
        w.mark.lock().unwrap().said = 1;
        assert!(w.idle().is_some_and(|l| l.starts_with("hub loop free after ") && l.ends_with(" on client line 3")));
    }
}
