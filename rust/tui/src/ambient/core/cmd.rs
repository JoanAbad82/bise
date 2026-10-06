//! The app's commands (stdin, docs/ambient-app.md §4) and their parse.

use serde_json::Value;
use std::path::PathBuf;

/// A command of the app (stdin), §4.
#[derive(Clone, Debug, PartialEq)]
pub enum Cmd {
    TalkStart,
    /// `talk_start` with `page: {id, url}`: a note talk on that bise page
    /// (docs/ambient-pages.md §4.1), its words to the page, never to main
    PageTalk { page: String },
    TalkEnd,
    TalkCancel,
    Shot { path: PathBuf, app: String, title: String },
    Send { text: String },
    /// fn space's typed text sent with tab: main starts an agent on it
    /// (only main starts agents; ambient-lead m_6513)
    Start { text: String },
    Answer { card: u64, reply: String },
    Hush,
    CutIn,
    /// The user is on a call or in a meeting (the app's read): text only,
    /// no voice (docs/ambient-app.md §4 `quiet`).
    Quiet { on: bool },
    /// The settings' voice answers (amb-mac m_5327): off, main's answers
    /// are text only; on (the default), as usual.
    Voice { on: bool },
    /// The menu bar's "stop watching" (roadmap B, amb-mac m_5475): the
    /// standing order `id` stops (the hub's `every_stop`).
    EveryStop { id: u64 },
    /// Round 10 (identity10 #data): an agent's preview (now, its last
    /// actions, what waits on him, its last report, its pages), re-sent
    /// on its events while it stays selected.
    AgentPreview { agent: String },
    /// An agent's history panel: the newest entries (before: None, the
    /// panel opens and its live entries follow) or the ones before a pos.
    AgentHistory { agent: String, before: Option<usize>, limit: usize },
    /// The panel closed: no more live entries.
    AgentUnwatch { agent: String },
    /// His words to an agent: now (steered into its turn) or queued
    /// (held by the core until the agent is free).
    AgentSend { agent: String, text: String, queued: bool },
    Follow { agent: String, on: bool },
    /// Stop an agent's turn (the hub's interrupt; the web asks first).
    Stop { agent: String },
    /// `/archive <agent>` (stop_first: `--force`, a working agent).
    Archive { agent: String, stop_first: bool },
    /// `/restore <agent>`: back in his list.
    Unarchive { agent: String },
    /// Harness A: the words the fake voice hears at the next talk (only
    /// with the fake voice on; an error otherwise).
    FakeWords { text: String },
}

impl Cmd {
    /// One stdin line; Err: the line to say back as `error` (a bad line
    /// from the app is a bug, never the user's).
    pub fn parse(line: &str) -> Result<Cmd, String> {
        let v: Value = serde_json::from_str(line).map_err(|e| format!("not JSON: {e}"))?;
        let s = |k: &str| v.get(k).and_then(Value::as_str).unwrap_or("").to_string();
        Ok(match s("cmd").as_str() {
            "talk_start" => match v.get("page").and_then(|p| p.get("id")).and_then(Value::as_str).map(str::trim) {
                Some(id) if !id.is_empty() => Cmd::PageTalk { page: id.to_string() },
                _ => Cmd::TalkStart,
            },
            "talk_end" => Cmd::TalkEnd,
            "talk_cancel" => Cmd::TalkCancel,
            "shot" => Cmd::Shot { path: PathBuf::from(s("path")), app: s("app"), title: s("title") },
            "send" => Cmd::Send { text: s("text") },
            "start" => Cmd::Start { text: s("text") },
            "answer" => {
                let card = match v.get("card") {
                    Some(Value::Number(n)) => n.as_u64(),
                    Some(Value::String(t)) => t.trim().trim_start_matches('#').parse().ok(),
                    _ => None,
                };
                Cmd::Answer { card: card.ok_or("answer: no card id")?, reply: s("reply") }
            }
            "hush" => Cmd::Hush,
            "cut_in" => Cmd::CutIn,
            "quiet" => Cmd::Quiet { on: v.get("on").and_then(Value::as_bool).unwrap_or(false) },
            "voice" => Cmd::Voice { on: v.get("on").and_then(Value::as_bool).unwrap_or(true) },
            "every_stop" => {
                let id = match v.get("id") {
                    Some(Value::Number(n)) => n.as_u64(),
                    Some(Value::String(t)) => t.trim().parse().ok(),
                    _ => None,
                };
                Cmd::EveryStop { id: id.ok_or("every_stop: no id")? }
            }
            "fake_words" => Cmd::FakeWords { text: s("text") },
            c @ ("agent_preview" | "agent_history" | "agent_unwatch" | "agent_send" | "follow" | "stop" | "archive" | "unarchive") => {
                let agent = s("agent").trim().trim_start_matches('@').to_string();
                if agent.is_empty() {
                    return Err(format!("{c}: no agent"));
                }
                let flag = |k: &str| v.get(k).and_then(Value::as_bool).unwrap_or(false);
                match c {
                    "agent_preview" => Cmd::AgentPreview { agent },
                    "agent_history" => Cmd::AgentHistory {
                        agent,
                        before: v.get("before").and_then(Value::as_u64).map(|b| b as usize),
                        limit: v.get("limit").and_then(Value::as_u64).map_or(60, |l| (l as usize).clamp(1, 200)),
                    },
                    "agent_unwatch" => Cmd::AgentUnwatch { agent },
                    "agent_send" => Cmd::AgentSend { agent, text: s("text"), queued: s("mode") == "queued" },
                    "follow" => Cmd::Follow { agent, on: v.get("on").and_then(Value::as_bool).unwrap_or(true) },
                    "stop" => Cmd::Stop { agent },
                    "archive" => Cmd::Archive { agent, stop_first: flag("stop_first") },
                    _ => Cmd::Unarchive { agent },
                }
            }
            other => return Err(format!("unknown cmd {other:?}")),
        })
    }
}
