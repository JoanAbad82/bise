//! The core's state machine (docs/ambient-app.md §3-§4): the app's
//! commands and the hub's lines in, compact UI events out. Driven by the
//! run loop ([`super::run`]) or a test: [`Core::cmd`], [`Core::hub`],
//! [`Core::tick`] (~30 Hz), then [`Core::take_out`]. Its ports (mic,
//! listener, synthesizer, speaker, the voice jobs) are fakes in tests.

use super::hub::{Hub, HubIn};
use super::speech::{Speech, Step};
use crate::voicemode::{Heard, ListenJob, ListenMsg, Listener, Mic, MicBlock, MicStream, SayJob, Speaker, Synthesizer, UttId};
use crate::wire::{parse_line, Ev};
use serde_json::{json, Value};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{self, Receiver, Sender, TryRecvError};
use std::sync::Arc;
use std::time::{Duration, Instant};

/// After fn up, the listener's last words wait at most this long; then
/// what was heard goes.
pub const FINAL_WAIT: Duration = Duration::from_millis(1500);

/// A note talk's words that send the page's notes (§4.1): the word
/// alone, any case, its punctuation dropped.
fn send_word(words: &str) -> bool {
    let w = words.trim().trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase();
    matches!(w.as_str(), "send" | "send it" | "envoie" | "envoyer" | "envoie-le" | "envoie le")
}

/// The composer label of the shot's marker (the terminal shows
/// `[Screen <app> · <title>]` in main's thread).
const SHOT_NAME: &str = "[Screen]";

/// The listener for the voice role's job (`listen::listener_for`).
pub type ListenerFor = Box<dyn Fn(&ListenJob) -> Box<dyn Listener>>;
/// The output device, opened at the first spoken answer.
pub type OpenSpeaker = Box<dyn FnMut() -> Result<Box<dyn Speaker>, String>>;
/// A file into the image store (`bend_images::store_file`).
pub type StoreImage = Box<dyn Fn(&Path) -> Result<bend_images::Stored, String>>;

/// Everything the core reaches outside: real in `bise ambient-core`,
/// fakes in tests. The mic opens only between talk_start and talk_end;
/// the speaker opens at main's first spoken answer.
pub struct Ports {
    pub mic: Box<dyn Mic>,
    pub listener: ListenerFor,
    pub synth: Box<dyn Synthesizer>,
    pub open_speaker: OpenSpeaker,
    /// the voice role's listener job and the TTS job, read at each use
    /// (a key added while the app runs counts)
    pub listen_job: Box<dyn Fn() -> Result<ListenJob, String>>,
    pub say_job: Box<dyn Fn() -> Result<SayJob, String>>,
    /// the configured voice language (`[voice] language`), if any
    pub language: Option<String>,
    /// a file into the image store (`bend_images::store_file`)
    pub store_image: StoreImage,
    /// the hub's `switchboard::model::user_kind` (the user's inbox),
    /// handed in by the binary: bend-tui does not link switchboard
    pub user_kind: fn(&str) -> bool,
}

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
    Answer { card: u64, reply: String },
    Hush,
    CutIn,
    /// The user is on a call or in a meeting (the app's read): text only,
    /// no voice (docs/ambient-app.md §4 `quiet`).
    Quiet { on: bool },
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
            other => return Err(format!("unknown cmd {other:?}")),
        })
    }
}

/// One phase of main's turn, for the orb (§4 `phase`).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Phase {
    Idle,
    Listening,
    Sending,
    Working,
    Speaking,
    Done,
    Failed,
}

impl Phase {
    fn word(self) -> &'static str {
        match self {
            Phase::Idle => "idle",
            Phase::Listening => "listening",
            Phase::Sending => "sending",
            Phase::Working => "working",
            Phase::Speaking => "speaking",
            Phase::Done => "done",
            Phase::Failed => "failed",
        }
    }
}

/// fn held: the mic, the listener, the words so far.
struct Talk {
    /// None once fn is up (the mic is off)
    stream: Option<Box<dyn MicStream>>,
    blocks: Receiver<MicBlock>,
    audio: Sender<ListenMsg>,
    heard: Receiver<Heard>,
    cancel: Arc<AtomicBool>,
    text: String,
    /// fn up at
    ending: Option<Instant>,
    /// a note talk: the page its words go to (never main)
    page: Option<String>,
}

impl Drop for Talk {
    fn drop(&mut self) {
        self.cancel.store(true, Ordering::SeqCst);
    }
}

/// A front-window shot in the image store.
struct Shot {
    stored: bend_images::Stored,
    app: String,
    title: String,
    /// main's turn has it (started after it was sent, or steered into it)
    reached: bool,
}

impl Shot {
    fn marker(&self) -> String {
        let source = match (self.app.trim(), self.title.trim()) {
            ("", t) => t.to_string(),
            (a, "") => a.to_string(),
            (a, t) => format!("{a} · {t}"),
        };
        bend_images::marker(SHOT_NAME, &source, &self.stored)
    }

    fn files(&self) -> [&Path; 2] {
        [&self.stored.file, &self.stored.b64]
    }
}

/// A card of the user's inbox, as the hub's snapshot has it.
#[derive(Clone, Debug)]
struct CardInfo {
    id: u64,
    kind: String,
    agent: String,
    text: String,
    /// a page question's card: {id, block, url} (docs/ambient-pages.md §4.2)
    page: Option<Value>,
}

pub struct Core {
    workspace: String,
    hub: Hub,
    ports: Ports,
    out: Vec<Value>,
    /// the last `hub` said (None: nothing said yet)
    hub_up: Option<bool>,
    /// the hello replay is over (`ready`): main's lines are live
    ready: bool,
    cards: Vec<CardInfo>,
    phase: Phase,
    /// main's turns seen (the `turn` of `main` and `word`)
    turn: u64,
    in_turn: bool,
    /// the turn running answers a user message (main's words are sent)
    for_user: bool,
    /// a user message main has not taken into a turn yet
    user_waiting: bool,
    /// every agent of the last state (main included)
    agent_names: Vec<String>,
    /// the agents there were when the user's last turn started: a page
    /// from main in that turn, or from an agent born since, is one the
    /// user waits for (docs/ambient-pages.md §2.8)
    user_turn_agents: Option<Vec<String>>,
    /// main's last message of this turn, as sent in `main`
    main_text: String,
    /// the last message sent was said: Some(reached main's turn yet)
    voice_out: Option<bool>,
    talk: Option<Talk>,
    speaker: Option<Box<dyn Speaker>>,
    speech: Option<Speech>,
    next_utt: UttId,
    /// the shot for the next message
    shot: Option<Shot>,
    /// shots sent, forgotten (deleted) at the end of main's turn
    sent_shots: Vec<Shot>,
    /// the pages of the last state: (id, title)
    page_titles: Vec<(String, String)>,
    /// the page server's base URL, from the hub's state
    pages_url: Option<String>,
    /// on a call or in a meeting (the app's `quiet`): no voice
    quiet: bool,
}

impl Core {
    pub fn new(workspace: String, hub: Hub, ports: Ports) -> Core {
        Core {
            workspace,
            hub,
            ports,
            out: Vec::new(),
            hub_up: None,
            ready: false,
            cards: Vec::new(),
            phase: Phase::Idle,
            turn: 0,
            in_turn: false,
            for_user: false,
            user_waiting: false,
            agent_names: Vec::new(),
            user_turn_agents: None,
            main_text: String::new(),
            voice_out: None,
            talk: None,
            speaker: None,
            speech: None,
            next_utt: 1,
            shot: None,
            sent_shots: Vec::new(),
            page_titles: Vec::new(),
            pages_url: None,
            quiet: false,
        }
    }

    /// The events since the last call, in order.
    pub fn take_out(&mut self) -> Vec<Value> {
        std::mem::take(&mut self.out)
    }

    fn emit(&mut self, v: Value) {
        self.out.push(v);
    }

    fn error(&mut self, text: &str) {
        self.emit(json!({"ev": "error", "text": text}));
    }

    fn set_phase(&mut self, p: Phase, line: Option<String>) {
        self.phase = p;
        let mut v = json!({"ev": "phase", "phase": p.word()});
        if let Some(l) = line {
            v["line"] = json!(l);
        }
        self.emit(v);
    }

    // ---- the app's commands ----

    pub fn cmd(&mut self, c: Cmd, now: Instant) {
        match c {
            Cmd::TalkStart => self.talk_start(None),
            Cmd::PageTalk { page } => self.talk_start(Some(page)),
            Cmd::TalkEnd => self.talk_end(now),
            Cmd::TalkCancel => {
                if let Some(page) = self.talk.as_ref().and_then(|t| t.page.clone()) {
                    self.talk = None;
                    return self.page_voice_over(&page, "cancel", "");
                }
                if self.talk.take().is_some() {
                    // the shot of fn down was for these words
                    if let Some(s) = self.shot.take() {
                        self.forget(vec![s]);
                    }
                    self.set_phase(Phase::Idle, None);
                }
            }
            Cmd::Shot { path, app, title } => self.take_shot(&path, app, title),
            Cmd::Send { text } => {
                let text = text.trim().to_string();
                if !text.is_empty() || self.shot.is_some() {
                    self.send_to_main(text, false);
                }
            }
            Cmd::Answer { card, reply } => self.answer(card, reply.trim()),
            Cmd::Hush => {
                if self.stop_voice() {
                    self.set_phase(Phase::Done, None);
                }
            }
            Cmd::CutIn => {
                if self.stop_voice() {
                    self.set_phase(Phase::Idle, None);
                }
            }
            Cmd::Quiet { on } => {
                self.quiet = on;
                // a call starts while main speaks: the voice stops, the
                // text stays
                if on && self.stop_voice() {
                    self.set_phase(Phase::Done, None);
                }
            }
        }
    }

    fn talk_start(&mut self, page: Option<String>) {
        if self.talk.is_some() {
            return;
        }
        // fn down while main speaks: the voice stops (the app sends
        // cut_in first; a talk_start alone does the same)
        self.stop_voice();
        let job = match (self.ports.listen_job)() {
            Ok(j) => j,
            Err(e) => {
                self.error(&e);
                return self.set_phase(Phase::Failed, None);
            }
        };
        let (btx, blocks) = mpsc::channel();
        let stream = match self.ports.mic.open(btx) {
            Ok(s) => s,
            Err(e) => {
                self.error(&e);
                return self.set_phase(Phase::Failed, None);
            }
        };
        let (audio, arx) = mpsc::channel();
        let (htx, heard) = mpsc::channel();
        let cancel = Arc::new(AtomicBool::new(false));
        (self.ports.listener)(&job).start(job, arx, htx, cancel.clone());
        self.talk = Some(Talk { stream: Some(stream), blocks, audio, heard, cancel, text: String::new(), ending: None, page: page.clone() });
        let Some(id) = page else { return self.set_phase(Phase::Listening, None) };
        // a note talk: the page shows the words at its mouse, the
        // capsule says where they go
        self.hub.send(&json!({"op": "page_voice", "page": id, "phase": "start", "text": ""}));
        let title = match self.page_titles.iter().find(|(i, _)| *i == id) {
            Some((_, t)) if !t.trim().is_empty() => t.clone(),
            _ => id.replace('-', " "),
        };
        self.phase = Phase::Listening;
        self.emit(json!({"ev": "phase", "phase": "listening", "page": {"id": id, "title": title}}));
    }

    /// A note talk is over: its last words to the page, the capsule idle
    /// (no `sent`, no main phases: main never hears a note talk).
    fn page_voice_over(&mut self, page: &str, phase: &str, text: &str) {
        self.hub.send(&json!({"op": "page_voice", "page": page, "phase": phase, "text": text}));
        self.emit(json!({"ev": "level", "who": "you", "v": 0.0}));
        self.set_phase(Phase::Idle, None);
    }

    fn talk_end(&mut self, now: Instant) {
        let Some(t) = self.talk.as_mut() else { return };
        if t.ending.is_some() {
            return;
        }
        while let Ok(b) = t.blocks.try_recv() {
            let _ = t.audio.send(ListenMsg::Audio(b.pcm));
        }
        // the mic goes off now (the macOS mic indicator too)
        t.stream = None;
        let _ = t.audio.send(ListenMsg::Flush);
        t.ending = Some(now);
        let note = t.page.is_some();
        self.emit(json!({"ev": "level", "who": "you", "v": 0.0}));
        // a note talk never shows main's phases
        if !note {
            self.set_phase(Phase::Sending, None);
        }
    }

    /// The talk's words are all in (or waited for long enough): to main.
    fn finish_talk(&mut self) {
        let Some(t) = self.talk.take() else { return };
        let words = t.text.trim().to_string();
        self.emit(json!({"ev": "heard", "text": words, "final": true}));
        if let Some(page) = &t.page {
            // nothing heard: no note; the word "send" alone sends the
            // page's notes (§4.1)
            let phase = match send_word(&words) {
                _ if words.is_empty() => "cancel",
                true => "send",
                false => "end",
            };
            return self.page_voice_over(page, phase, &words);
        }
        if words.is_empty() {
            if let Some(s) = self.shot.take() {
                self.forget(vec![s]);
            }
            return self.set_phase(Phase::Idle, None);
        }
        self.send_to_main(words, true);
    }

    fn take_shot(&mut self, path: &Path, app: String, title: String) {
        let stored = (self.ports.store_image)(path);
        // the app's PNG goes at once, stored or not
        let _ = std::fs::remove_file(path);
        match stored {
            Ok(stored) => {
                if let Some(old) = self.shot.replace(Shot { stored, app, title, reached: false }) {
                    self.forget(vec![old]);
                }
            }
            Err(_) => self.error("main can't see this window: the screenshot didn't save."),
        }
    }

    /// The message to main's thread: the words, then the pending shot's
    /// marker.
    fn send_to_main(&mut self, words: String, voice: bool) {
        let shot = self.shot.take();
        let text = match &shot {
            Some(s) if words.is_empty() => s.marker(),
            Some(s) => format!("{words}\n\n{}", s.marker()),
            None => words.clone(),
        };
        if !self.hub.send(&json!({"op": "input", "focus": "main", "text": text})) {
            if let Some(s) = shot {
                self.forget(vec![s]);
            }
            self.error("main didn't get it: bise isn't reachable. try again in a moment.");
            return self.set_phase(Phase::Failed, None);
        }
        let had_shot = shot.is_some();
        self.sent_shots.extend(shot);
        self.voice_out = voice.then_some(false);
        // the hub echoes it as `sb you` too; this one counts if it does not
        self.user_waiting = true;
        self.emit(json!({"ev": "sent", "text": words, "voice": voice, "shot": had_shot}));
        self.set_phase(Phase::Sending, None);
    }

    fn answer(&mut self, id: u64, reply: &str) {
        let card = self.cards.iter().find(|c| c.id == id).cloned();
        let digit = reply.parse::<usize>().ok().filter(|d| (1..=9).contains(d));
        let reply = match (card, digit) {
            (Some(c), Some(d)) => match crate::sb::ambient_reply(&c.kind, &c.agent, &c.text, d) {
                Some(r) => r,
                None => return self.error("that option opens in the terminal."),
            },
            (None, _) => return self.error("that question is already closed."),
            (Some(_), None) if reply.is_empty() => return,
            (Some(_), None) => reply.to_string(),
        };
        if !self.hub.send(&json!({"op": "input", "focus": "main", "text": format!("/answer {id} {reply}")})) {
            self.error("main didn't get it: bise isn't reachable. try again in a moment.");
        }
    }

    /// Hush, cut in: main's voice stops (the text stays). False: it was
    /// not speaking.
    fn stop_voice(&mut self) -> bool {
        let Some(mut sp) = self.speech.take() else { return false };
        if let Some(spk) = self.speaker.as_mut() {
            sp.stop(spk.as_mut());
        }
        self.emit(json!({"ev": "level", "who": "main", "v": 0.0}));
        true
    }

    /// Delete the shots' stored files (SPEC §5.1: not kept after main's
    /// turn), but a file another live shot still uses (two shots of an
    /// unchanged window are the same bytes, the same store file).
    fn forget(&mut self, shots: Vec<Shot>) {
        let live: Vec<PathBuf> = self
            .shot
            .iter()
            .chain(&self.sent_shots)
            .flat_map(|s| s.files().map(Path::to_path_buf))
            .collect();
        for s in shots {
            for f in s.files() {
                if !live.iter().any(|l| l == f) {
                    let _ = std::fs::remove_file(f);
                }
            }
        }
    }

    /// Stdin closed: the app is gone. Nothing of the shots stays.
    pub fn shutdown(&mut self) {
        self.stop_voice();
        self.talk = None;
        let mut all: Vec<Shot> = self.sent_shots.drain(..).collect();
        all.extend(self.shot.take());
        self.forget(all);
    }

    // ---- the hub ----

    pub fn hub(&mut self, h: HubIn) {
        match h {
            HubIn::Up => {
                self.ready = false;
                self.hub_up = Some(true);
                let ws = self.workspace.clone();
                self.emit(json!({"ev": "hub", "up": true, "workspace": ws}));
            }
            HubIn::Down => {
                if self.hub_up != Some(false) {
                    self.hub_up = Some(false);
                    let ws = self.workspace.clone();
                    self.emit(json!({"ev": "hub", "up": false, "workspace": ws}));
                }
            }
            HubIn::Line(l) => self.hub_line(&l),
        }
    }

    fn hub_line(&mut self, raw: &str) {
        let Ok(v) = serde_json::from_str::<Value>(raw) else { return };
        let s = |k: &str| v.get(k).and_then(Value::as_str).unwrap_or("").to_string();
        match s("ev").as_str() {
            "state" => self.state(&v),
            "ready" => {
                self.ready = true;
                // the replay told where main's turn is (working only on
                // a turn that answers the user)
                let p = if self.in_turn && self.for_user { Phase::Working } else { Phase::Idle };
                if self.talk.is_none() && self.speech.is_none() {
                    self.set_phase(p, None);
                }
            }
            "page" if self.ready => self.page(v),
            "line" => {
                let line = s("line");
                if self.ready && line.starts_with("sb msg-you : ") {
                    self.msg_you(&line);
                } else if s("agent") == "main" {
                    self.main_line(&line);
                }
            }
            _ => {}
        }
    }

    /// The hub's `page` event, relayed with `front`: the user is waiting
    /// for it (main's page in the user's turn, or a page of an agent born
    /// since the user's last turn started), so the app opens it without
    /// fn + o (docs/ambient-pages.md §2.8).
    fn page(&mut self, mut v: Value) {
        let agent = v.get("agent").and_then(Value::as_str).unwrap_or("").to_string();
        let ready = v.get("state").and_then(Value::as_str) == Some("ready");
        let waited = match &self.user_turn_agents {
            None => false,
            Some(_) if agent == "main" => self.for_user && self.in_turn,
            Some(known) => !known.contains(&agent),
        };
        v["front"] = json!(ready && waited);
        self.emit(v);
    }

    fn state(&mut self, v: &Value) {
        let s = |x: &Value, k: &str| x.get(k).and_then(Value::as_str).unwrap_or("").to_string();
        let list = |k: &str| v.get(k).and_then(Value::as_array).cloned().unwrap_or_default();
        self.agent_names = list("agents").iter().map(|a| s(a, "name")).collect();
        let agents: Vec<Value> = list("agents")
            .iter()
            .filter(|a| !a.get("main").and_then(Value::as_bool).unwrap_or(false))
            .filter(|a| s(a, "status") != "archived")
            .map(|a| {
                let status = s(a, "status");
                json!({
                    "name": s(a, "name"),
                    "status": status,
                    "note": s(a, "note"),
                    "report": s(a, "report"),
                    "working": matches!(status.as_str(), "working" | "waiting" | "starting"),
                    "turn_ms": a.get("turn_ms").and_then(Value::as_u64),
                })
            })
            .collect();
        self.cards = list("cards")
            .iter()
            .filter(|c| (self.ports.user_kind)(&s(c, "kind")))
            .map(|c| CardInfo {
                id: c.get("id").and_then(Value::as_u64).unwrap_or(0),
                kind: s(c, "kind"),
                agent: s(c, "agent"),
                text: s(c, "text"),
                page: c.get("page").filter(|p| p.is_object()).cloned(),
            })
            .collect();
        let cards: Vec<Value> = self
            .cards
            .iter()
            .map(|c| {
                let options: Vec<Value> = crate::sb::ambient_options(&c.kind, &c.agent, &c.text)
                    .into_iter()
                    .map(|(n, label)| json!({"n": n, "label": label}))
                    .collect();
                // urgent: it asks even on a call or in a meeting. A
                // tool call waiting for a yes holds an agent's work now
                // (best guess, told to ambient-lead)
                let urgent = c.kind == "confirm";
                let mut v = json!({"id": c.id, "kind": c.kind, "agent": c.agent, "text": c.text, "options": options, "urgent": urgent});
                if let Some(p) = &c.page {
                    v["page"] = p.clone();
                }
                v
            })
            .collect();
        let pages = list("pages");
        self.page_titles = pages.iter().map(|p| (s(p, "id"), s(p, "title"))).collect();
        if let Some(u) = v.get("pages_url").and_then(Value::as_str).filter(|u| !u.is_empty()) {
            self.pages_url = Some(u.to_string());
        }
        let mut st = json!({"ev": "state", "agents": agents, "cards": cards, "pages": pages});
        if let Some(u) = &self.pages_url {
            st["pages_url"] = json!(u);
        }
        self.emit(st);
    }

    /// One line of main's feed (ambient's review, m_4672: only main's
    /// words FOR THE USER reach the capsule). A turn answers the user when
    /// a user message reached it: `sb you` (the TUI's, or this core's
    /// echoed) before it started, or steered into it. Main's other turns
    /// (an agent's report, a message between agents) send nothing: no
    /// `main`, no phase. Before `ready` (the hello replay) the lines only
    /// say where main is; nothing of them is sent.
    fn main_line(&mut self, line: &str) {
        let obs = line.strip_prefix("  obs: ");
        if let Some(t) = line.strip_prefix("sb you : ") {
            // a slash command (`/answer`) is the hub's, never a turn
            if !t.trim_start().starts_with('/') {
                self.user_waiting = true;
            }
            return;
        }
        if obs == Some("turn_started") {
            self.in_turn = true;
            self.turn += 1;
            self.main_text.clear();
            self.for_user = std::mem::take(&mut self.user_waiting);
            if self.for_user {
                self.user_turn_agents = Some(self.agent_names.clone());
            }
            if self.ready {
                self.reached();
                if self.for_user && self.speech.is_none() {
                    self.set_phase(Phase::Working, None);
                }
            }
            return;
        }
        if let Some(how) = obs.and_then(|o| o.strip_prefix("turn_done: ")) {
            self.in_turn = false;
            let for_user = std::mem::take(&mut self.for_user);
            if self.ready {
                self.turn_done(how, line, for_user);
            }
            return;
        }
        if obs.is_some_and(|o| o.starts_with("steering_received: ") || o.starts_with("steered: ")) {
            // the user's message went into the running turn
            if self.in_turn && self.user_waiting {
                self.user_waiting = false;
                if !self.for_user {
                    self.for_user = true;
                    self.user_turn_agents = Some(self.agent_names.clone());
                    if self.ready && self.speech.is_none() {
                        self.set_phase(Phase::Working, None);
                    }
                }
            }
            if self.ready {
                self.reached();
            }
            return;
        }
        if !self.ready || !self.for_user {
            return;
        }
        match parse_line(line) {
            Some(Ev::Assistant(t)) => {
                let vis = crate::wire::split_thinking(&t).map(|(_, v)| v).unwrap_or(t);
                let text = super::plain::plain(&crate::markdown::unescape_md(&vis));
                if !text.is_empty() {
                    self.main_text = text.clone();
                    let turn = self.turn;
                    self.emit(json!({"ev": "main", "text": text, "turn": turn}));
                }
            }
            Some(Ev::ToolIntent { text, .. }) if self.speech.is_none() => {
                self.set_phase(Phase::Working, Some(crate::render::truncate_chars(&text, 80)));
            }
            Some(Ev::ToolInfo { name, .. }) if self.speech.is_none() => {
                self.set_phase(Phase::Working, Some(name));
            }
            _ => {}
        }
    }

    /// `sb msg-you : {from} : {text}` in any feed: an agent (or main)
    /// writing to the user, shown as main's words, with who wrote it.
    fn msg_you(&mut self, line: &str) {
        let Some(Ev::AgentMsg { from, text, level: 2, .. }) = parse_line(line) else { return };
        let text = super::plain::plain(&text);
        if !text.is_empty() {
            let turn = self.turn;
            self.emit(json!({"ev": "main", "text": text, "turn": turn, "from": from}));
        }
    }

    /// Main's turn has the message sent last: its shots and its voice.
    fn reached(&mut self) {
        for s in &mut self.sent_shots {
            s.reached = true;
        }
        if self.voice_out == Some(false) {
            self.voice_out = Some(true);
        }
    }

    fn turn_done(&mut self, how: &str, line: &str, for_user: bool) {
        // the shots main's turn had are forgotten now
        let (done, keep): (Vec<Shot>, Vec<Shot>) = self.sent_shots.drain(..).partition(|s| s.reached);
        self.sent_shots = keep;
        self.forget(done);
        if !for_user {
            // a turn for an agent: the capsule keeps its status line
            if self.voice_out == Some(true) {
                self.voice_out = None;
            }
            return;
        }
        if how != "completed" {
            let why = match parse_line(line) {
                Some(Ev::Err(t) | Ev::Warn(t)) => t,
                _ => how.to_string(),
            };
            if self.voice_out == Some(true) {
                self.voice_out = None;
            }
            return self.set_phase(Phase::Failed, Some(why));
        }
        if self.voice_out == Some(true) {
            self.voice_out = None;
            // on a call or in a meeting: text only
            if !self.quiet && self.say_main() {
                return self.set_phase(Phase::Speaking, None);
            }
        }
        self.set_phase(Phase::Done, None);
    }

    /// Main's message aloud. False: no voice (no TTS, no speaker,
    /// nothing to say); the text shows anyway.
    fn say_main(&mut self) -> bool {
        if self.main_text.is_empty() {
            return false;
        }
        let job = match (self.ports.say_job)() {
            Ok(j) => j,
            Err(_) => {
                self.error("main can't speak: no voice model is set up.");
                return false;
            }
        };
        if self.speaker.is_none() {
            match (self.ports.open_speaker)() {
                Ok(s) => self.speaker = Some(s),
                Err(e) => {
                    self.error(&e);
                    return false;
                }
            }
        }
        self.stop_voice();
        let lang = self.ports.language.clone();
        let Some(sp) = Speech::new(self.turn, &self.main_text, lang.as_deref(), job, self.next_utt) else {
            return false;
        };
        self.next_utt += sp.utts();
        self.speech = Some(sp);
        true
    }

    // ---- the clock ----

    /// ~30 Hz: the mic to the listener, its words, the voice and its
    /// words, the levels.
    pub fn tick(&mut self, now: Instant) {
        self.tick_talk(now);
        self.tick_speech();
    }

    fn tick_talk(&mut self, now: Instant) {
        let Some(t) = self.talk.as_mut() else { return };
        while let Ok(b) = t.blocks.try_recv() {
            let _ = t.audio.send(ListenMsg::Audio(b.pcm));
        }
        let mut evs = Vec::new();
        let mut flushed = false;
        let mut failed = None;
        let mut words = false;
        loop {
            match t.heard.try_recv() {
                Ok(Heard::Text(w)) => {
                    t.text.push_str(&w);
                    words = true;
                    if t.ending.is_none() {
                        evs.push(json!({"ev": "heard", "text": t.text.trim(), "final": false}));
                    }
                }
                Ok(Heard::Flushed) => {
                    flushed = true;
                    break;
                }
                Ok(Heard::Failed(e)) => {
                    failed = Some(e);
                    break;
                }
                Err(TryRecvError::Empty) => break,
                Err(TryRecvError::Disconnected) => {
                    flushed = t.ending.is_some();
                    break;
                }
            }
        }
        if let Some(s) = &t.stream {
            evs.push(json!({"ev": "level", "who": "you", "v": s.level()}));
        }
        let late = t.ending.is_some_and(|e| now.duration_since(e) >= FINAL_WAIT);
        let ending = t.ending.is_some();
        let page = t.page.clone();
        // a note talk's words so far, live on the page
        if let (Some(p), true, None) = (&page, words, &failed) {
            let text = t.text.trim().to_string();
            self.hub.send(&json!({"op": "page_voice", "page": p, "phase": "heard", "text": text}));
        }
        self.out.extend(evs);
        if let Some(e) = failed {
            self.talk = None;
            if let Some(p) = page {
                self.error(&e);
                return self.page_voice_over(&p, "cancel", "");
            }
            if let Some(s) = self.shot.take() {
                self.forget(vec![s]);
            }
            self.error(&e);
            return self.set_phase(Phase::Failed, None);
        }
        if ending && (flushed || late) {
            self.finish_talk();
        }
    }

    fn tick_speech(&mut self) {
        let (Some(sp), Some(spk)) = (self.speech.as_mut(), self.speaker.as_mut()) else { return };
        let step = sp.step(self.ports.synth.as_ref(), spk.as_mut());
        let (turn, level) = (sp.turn, spk.level());
        match step {
            Step::Playing { word } => {
                if let Some(i) = word {
                    self.emit(json!({"ev": "word", "turn": turn, "i": i}));
                }
                self.emit(json!({"ev": "level", "who": "main", "v": level}));
            }
            Step::Over { word } => {
                self.speech = None;
                if let Some(i) = word {
                    self.emit(json!({"ev": "word", "turn": turn, "i": i}));
                }
                self.emit(json!({"ev": "level", "who": "main", "v": 0.0}));
                if self.talk.is_none() {
                    self.set_phase(Phase::Done, None);
                }
            }
            Step::Failed(e) => {
                self.speech = None;
                self.emit(json!({"ev": "level", "who": "main", "v": 0.0}));
                self.error(&e);
                self.set_phase(Phase::Done, None);
            }
        }
    }
}
