//! The ambient core against a fake hub (a socket pair per connection),
//! a fake mic, listener, synthesizer and speaker, and a fake image store
//! in a temp folder. Never a real mic, sound, network or app.

use super::core::{Cmd, Core, Ports};
use super::hub::{Hub, HubIn};
use crate::voicemode::fakes::{FakeListener, FakeMic, FakeSpeaker, FakeSynth, Fakes};
use crate::voicemode::{Heard, ListenMsg, SayJob, Synth};
use serde_json::{json, Value};
use std::io::{BufRead, BufReader, Write};
use std::os::unix::net::UnixStream;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::mpsc::{self, Receiver};
use std::sync::Arc;
use std::time::{Duration, Instant};

const WS: &str = "/w/repo";

/// The hub's `user_kind` (switchboard::model), as main.rs hands it in.
fn user_kind(kind: &str) -> bool {
    matches!(kind, "question" | "drop" | "confirm" | "merge" | "feature_try" | "feature_merge" | "update")
}

/// The hub's side of one connection.
struct HubEnd {
    w: UnixStream,
    r: BufReader<UnixStream>,
}

impl HubEnd {
    fn say(&mut self, v: Value) {
        writeln!(self.w, "{v}").unwrap();
    }

    fn line(&mut self, agent: &str, line: &str) {
        self.say(json!({"ev": "line", "agent": agent, "line": line, "pos": 1}));
    }

    /// The next request the core wrote (the connector's hello skipped).
    fn next(&mut self) -> Value {
        loop {
            let mut l = String::new();
            self.r.read_line(&mut l).expect("the core wrote nothing");
            let v: Value = serde_json::from_str(l.trim()).unwrap();
            if v["op"] != "hello" {
                return v;
            }
        }
    }
}

struct T {
    core: Core,
    rx: Receiver<HubIn>,
    ends: Receiver<HubEnd>,
    hub: HubEnd,
    fakes: Fakes,
    out: Vec<Value>,
    dir: PathBuf,
    say_ok: Arc<AtomicBool>,
}

fn temp_dir() -> PathBuf {
    static N: AtomicUsize = AtomicUsize::new(0);
    let d = std::env::temp_dir().join(format!("amb-core-{}-{}", std::process::id(), N.fetch_add(1, Ordering::SeqCst)));
    std::fs::create_dir_all(&d).unwrap();
    d
}

/// A store like bend_images': the file and its .b64, named by content.
fn fake_store(dir: PathBuf) -> impl Fn(&Path) -> Result<bend_images::Stored, String> {
    move |p: &Path| {
        let b = std::fs::read(p).map_err(|e| e.to_string())?;
        let name: String = b.iter().map(|x| format!("{x:02x}")).collect();
        let file = dir.join(format!("{name}.png"));
        let b64 = dir.join(format!("{name}.b64"));
        std::fs::write(&file, &b).unwrap();
        std::fs::write(&b64, bend_images::base64_encode(&b)).unwrap();
        Ok(bend_images::Stored { kind: bend_images::Kind::Png, width: 1, height: 1, file, b64 })
    }
}

impl T {
    fn new() -> T {
        let (etx, ends) = mpsc::channel::<HubEnd>();
        let connect: super::hub::Connect = Box::new(move || {
            let (mut core_end, hub_end) = UnixStream::pair()?;
            core_end.write_all(b"{\"op\":\"hello\"}\n")?;
            let r = BufReader::new(hub_end.try_clone()?);
            r.get_ref().set_read_timeout(Some(Duration::from_secs(3)))?;
            etx.send(HubEnd { w: hub_end, r }).map_err(std::io::Error::other)?;
            Ok(core_end)
        });
        let (tx, rx) = mpsc::channel();
        let hub = Hub::start(connect, tx, |h| h, Duration::from_millis(20));
        let fakes = Fakes::new();
        let dir = temp_dir();
        let say_ok = Arc::new(AtomicBool::new(true));
        let (spk, ok) = (fakes.speaker.clone(), say_ok.clone());
        let ports = Ports {
            mic: Box::new(FakeMic(fakes.mic.clone())),
            listener: {
                let l = fakes.listen.clone();
                Box::new(move |_| Box::new(FakeListener(l.clone())))
            },
            synth: Box::new(FakeSynth(fakes.synth.clone())),
            open_speaker: Box::new(move || Ok(Box::new(FakeSpeaker(spk.clone())) as Box<dyn crate::voicemode::Speaker>)),
            listen_job: Box::new(|| Ok(crate::voicemode::fakes::listen_job())),
            say_job: Box::new(move || {
                if ok.load(Ordering::SeqCst) {
                    Ok(SayJob { api: crate::voicemode::fakes::endpoint("tts"), voice: "v".into(), speed: 1.0 })
                } else {
                    Err("no voice".into())
                }
            }),
            language: None,
            store_image: Box::new(fake_store(dir.clone())),
            user_kind,
        };
        let core = Core::new(WS.into(), hub, ports);
        let hub = ends.recv_timeout(Duration::from_secs(3)).expect("the core never connected");
        let mut t = T { core, rx, ends, hub, fakes, out: Vec::new(), dir, say_ok };
        t.until(|o| o.iter().any(|v| v["ev"] == "hub"));
        t
    }

    /// Hub events in, a tick, events out, until `done` holds on what
    /// came out since the last `take` (3 s at most).
    fn until(&mut self, done: impl Fn(&[Value]) -> bool) {
        let t0 = Instant::now();
        loop {
            while let Ok(h) = self.rx.try_recv() {
                self.core.hub(h);
            }
            self.core.tick(Instant::now());
            self.out.extend(self.core.take_out());
            if done(&self.out) {
                return;
            }
            assert!(t0.elapsed() < Duration::from_secs(3), "timed out; out: {:#?}", self.out);
            std::thread::sleep(Duration::from_millis(5));
        }
    }

    fn take(&mut self) -> Vec<Value> {
        std::mem::take(&mut self.out)
    }

    fn cmd(&mut self, c: Cmd) {
        self.core.cmd(c, Instant::now());
        self.out.extend(self.core.take_out());
    }

    /// The hello replay is over: main's lines are live.
    fn ready(&mut self) {
        self.hub.say(json!({"ev": "ready"}));
        self.until(|o| has(o, "phase"));
        self.take();
    }

    /// Everything the hub said so far is handled (a state round trip).
    fn sync(&mut self) {
        self.hub.say(json!({"ev": "state", "agents": [], "cards": []}));
        self.until(|o| has(o, "state"));
        self.out.retain(|v| v["ev"] != "state");
    }

    fn main_turn(&mut self, text: &str) {
        self.hub.line("main", "  obs: turn_started");
        self.hub.line("main", &format!("  obs: assistant: {text}"));
        self.hub.line("main", "  obs: turn_done: completed");
    }
}

impl Drop for T {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.dir);
    }
}

fn has(out: &[Value], ev: &str) -> bool {
    out.iter().any(|v| v["ev"] == ev)
}

fn phases(out: &[Value]) -> Vec<String> {
    out.iter().filter(|v| v["ev"] == "phase").map(|v| v["phase"].as_str().unwrap().to_string()).collect()
}

fn phase_is(out: &[Value], p: &str) -> bool {
    phases(out).last().is_some_and(|x| x == p)
}

#[test]
fn hub_state_becomes_state_with_agents_and_cards_with_options() {
    let mut t = T::new();
    assert_eq!(t.take()[0], json!({"ev": "hub", "up": true, "workspace": WS}));
    t.hub.say(json!({"ev": "state",
        "agents": [
            {"name": "main", "main": true, "status": "idle"},
            {"name": "cookies", "status": "working", "note": "the banner", "report": "", "turn_ms": 1200},
            {"name": "perf", "status": "done", "report": "signup 4.1 s → 0.9 s. the rest is cleanup."},
            {"name": "old", "status": "archived"},
        ],
        "cards": [
            {"id": 3, "kind": "question", "agent": "cookies", "text": "keep the banner on mobile?\n1. yes\n2. no"},
            {"id": 4, "kind": "done", "agent": "perf", "text": "perf is done"},
        ]}));
    t.until(|o| has(o, "state"));
    let st = t.take().into_iter().find(|v| v["ev"] == "state").unwrap();
    assert_eq!(
        st["agents"],
        json!([
            {"name": "cookies", "status": "working", "note": "the banner", "report": "", "working": true, "turn_ms": 1200},
            {"name": "perf", "status": "done", "note": "", "report": "signup 4.1 s → 0.9 s. the rest is cleanup.", "working": false, "turn_ms": null},
        ])
    );
    // only the user's cards (a `done` is the agents' traffic)
    assert_eq!(
        st["cards"],
        json!([{"id": 3, "kind": "question", "agent": "cookies", "text": "keep the banner on mobile?\n1. yes\n2. no",
            "options": [{"n": 1, "label": "yes"}, {"n": 2, "label": "no"}], "urgent": false}])
    );
    // fn + 1 answers with the option's words, as the TUI's box does
    t.cmd(Cmd::Answer { card: 3, reply: "1".into() });
    assert_eq!(t.hub.next(), json!({"op": "input", "focus": "main", "text": "/answer 3 yes"}));
    // words go as they are
    t.cmd(Cmd::Answer { card: 3, reply: "only on desktop".into() });
    assert_eq!(t.hub.next()["text"], "/answer 3 only on desktop");
    // a closed card
    t.cmd(Cmd::Answer { card: 9, reply: "1".into() });
    assert!(has(&t.take(), "error"));
}

#[test]
fn a_hub_item_digit_goes_as_the_digit() {
    let mut t = T::new();
    t.hub.say(json!({"ev": "state", "agents": [], "cards": [
        {"id": 7, "kind": "feature_try", "agent": "main", "text": "ambient-app is ready to try\n1. try it\n2. later"}]}));
    t.until(|o| has(o, "state"));
    t.cmd(Cmd::Answer { card: 7, reply: "1".into() });
    assert_eq!(t.hub.next()["text"], "/answer 7 1");
}

#[test]
fn send_goes_to_main_with_the_shot_marker_and_the_png_is_deleted() {
    let mut t = T::new();
    t.ready();
    let png = t.dir.join("front.png");
    std::fs::write(&png, b"\x89PNG fake").unwrap();
    t.cmd(Cmd::Shot { path: png.clone(), app: "Chrome".into(), title: "localhost:4801/settings".into() });
    assert!(!png.exists(), "the app's PNG goes at once");
    t.cmd(Cmd::Send { text: "  why is this red?  ".into() });
    let req = t.hub.next();
    assert_eq!(req["op"], "input");
    assert_eq!(req["focus"], "main");
    let text = req["text"].as_str().unwrap();
    assert!(text.starts_with("why is this red?\n\n<image name=\"[Screen]\" path=\"Chrome · localhost:4801/settings\" mime=\"image/png\" b64=\""), "{text}");
    let ms = bend_images::markers(text);
    assert_eq!(ms.len(), 1);
    let b64 = PathBuf::from(&ms[0].b64);
    assert!(b64.exists());
    let out = t.take();
    assert!(out.contains(&json!({"ev": "sent", "text": "why is this red?", "voice": false, "shot": true})), "{out:?}");
    assert!(phase_is(&out, "sending"));
    // the next message has no shot
    t.cmd(Cmd::Send { text: "and this?".into() });
    assert_eq!(t.hub.next()["text"], "and this?");
    // kept while main's turn reads it, forgotten at its end
    t.hub.line("main", "  obs: turn_started");
    t.until(|o| phase_is(o, "working"));
    assert!(b64.exists());
    t.hub.line("main", "  obs: turn_done: completed");
    t.until(|o| phase_is(o, "done"));
    assert!(!b64.exists(), "the stored shot is not kept after main's turn");
}

#[test]
fn a_shot_steered_into_a_running_turn_is_forgotten_at_its_end() {
    let mut t = T::new();
    t.hub.line("main", "  obs: turn_started");
    t.ready();
    let png = t.dir.join("a.png");
    std::fs::write(&png, b"shot-a").unwrap();
    t.cmd(Cmd::Shot { path: png, app: "Notes".into(), title: String::new() });
    t.cmd(Cmd::Send { text: String::new() });
    let text = t.hub.next()["text"].as_str().unwrap().to_string();
    assert!(text.starts_with("<image name=\"[Screen]\" path=\"Notes\""), "{text}");
    let b64 = PathBuf::from(&bend_images::markers(&text)[0].b64);
    // steered into the running turn (a report's): from then on it is the
    // user's, main works for them, then done; the shot goes at its end
    assert!(phase_is(&t.take(), "sending"));
    t.sync();
    assert!(!has(&t.take(), "phase"), "nothing yet: the turn is an agent's");
    t.hub.line("main", &format!("  obs: steering_received: {text}"));
    t.until(|o| phase_is(o, "working"));
    assert!(b64.exists());
    t.hub.line("main", "  obs: turn_done: completed");
    t.until(|o| phase_is(o, "done"));
    assert!(!b64.exists());
}

#[test]
fn a_message_sent_during_an_agents_turn_waits_for_the_next_one() {
    let mut t = T::new();
    t.hub.line("main", "  obs: turn_started");
    t.ready();
    t.cmd(Cmd::Send { text: "after this".into() });
    t.hub.next();
    t.take();
    // the agent's turn ends without it: nothing said
    t.hub.line("main", "  obs: assistant: for the agent");
    t.hub.line("main", "  obs: turn_done: completed");
    t.sync();
    let out = t.take();
    assert!(!has(&out, "main") && !phases(&out).contains(&"done".to_string()), "{out:?}");
    // the next turn is the user's
    t.main_turn("Here, after it.");
    t.until(|o| phase_is(o, "done"));
    assert!(t.take().contains(&json!({"ev": "main", "text": "Here, after it.", "turn": 2})));
}

#[test]
fn talk_start_heard_talk_end_is_one_input_and_main_answers_aloud() {
    let mut t = T::new();
    t.ready();
    let png = t.dir.join("fn-down.png");
    std::fs::write(&png, b"shot").unwrap();
    t.cmd(Cmd::Shot { path: png, app: "Chrome".into(), title: "the build".into() });
    t.cmd(Cmd::TalkStart);
    assert!(phase_is(&t.take(), "listening"));
    assert_eq!(t.fakes.mic.lock().unwrap().opened, 1);
    // the mic's blocks go to the listener; its words come back
    let blocks = t.fakes.mic.lock().unwrap().blocks.clone().unwrap();
    blocks.send(crate::voicemode::MicBlock { pcm: vec![5000; 320], at: Instant::now() }).unwrap();
    let heard = t.fakes.listen.lock().unwrap()[0].heard.clone();
    heard.send(Heard::Text(" is the build".into())).unwrap();
    t.until(|o| o.iter().any(|v| v["ev"] == "heard" && v["text"] == "is the build" && v["final"] == false));
    heard.send(Heard::Text(" green".into())).unwrap();
    t.until(|o| o.iter().any(|v| v["ev"] == "heard" && v["text"] == "is the build green"));
    assert!(t.take().iter().any(|v| v["ev"] == "level" && v["who"] == "you"));
    // fn up: the mic closes, the listener flushes
    t.cmd(Cmd::TalkEnd);
    assert!(t.fakes.mic.lock().unwrap().blocks.as_ref().is_some());
    let audio: Vec<ListenMsg> = t.fakes.listen.lock().unwrap()[0].audio.try_iter().collect();
    assert_eq!(audio, vec![ListenMsg::Audio(vec![5000; 320]), ListenMsg::Flush]);
    heard.send(Heard::Text("?".into())).unwrap();
    heard.send(Heard::Flushed).unwrap();
    t.until(|o| has(o, "sent"));
    let req = t.hub.next();
    let text = req["text"].as_str().unwrap();
    assert!(text.starts_with("is the build green?\n\n<image name=\"[Screen]\" path=\"Chrome · the build\""), "{text}");
    let out = t.take();
    assert!(out.contains(&json!({"ev": "heard", "text": "is the build green?", "final": true})));
    assert!(out.contains(&json!({"ev": "sent", "text": "is the build green?", "voice": true, "shot": true})));
    // one input only
    t.hub.w.set_read_timeout(Some(Duration::from_millis(1))).unwrap();
    t.hub.r.get_ref().set_read_timeout(Some(Duration::from_millis(100))).unwrap();
    let mut more = String::new();
    assert!(t.hub.r.read_line(&mut more).is_err() || more.is_empty(), "a second input: {more}");
    t.hub.r.get_ref().set_read_timeout(Some(Duration::from_secs(3))).unwrap();

    // main's lines: working (with its tool line), main's text, then aloud
    t.hub.line("main", "  obs: turn_started");
    t.hub.line("main", "tool_intent #1 : runs the tests");
    t.hub.line("main", "  obs: assistant: <think>check ci</think>Yes, the build is green.\\nAll 412 tests pass.");
    t.hub.line("main", "  obs: turn_done: completed");
    t.until(|o| phase_is(o, "speaking"));
    let out = t.take();
    assert_eq!(phases(&out), vec!["working", "working", "speaking"]);
    assert!(out.iter().any(|v| v["ev"] == "phase" && v["line"] == "runs the tests"));
    assert!(out.contains(&json!({"ev": "main", "text": "Yes, the build is green.\nAll 412 tests pass.", "turn": 1})));
    // the voice: sentence by sentence; the speaker's clock lights the words
    let first = {
        let s = t.fakes.synth.lock().unwrap();
        assert_eq!(s.len(), 1);
        assert!(s[0].text.contains("build is green"), "{}", s[0].text);
        s[0].events.clone()
    };
    first.send(Synth::Audio(vec![0.1; 24_000])).unwrap();
    first.send(Synth::Done).unwrap();
    let synth = t.fakes.synth.clone();
    t.until(move |_| synth.lock().unwrap().len() == 2);
    t.fakes.speaker.lock().unwrap().clock = Some((1, Duration::from_millis(500)));
    t.until(|o| o.iter().any(|v| v["ev"] == "word"));
    let w: Vec<u64> = t.take().iter().filter(|v| v["ev"] == "word").map(|v| v["i"].as_u64().unwrap()).collect();
    assert!(w[0] <= 4, "{w:?}");
    let second = t.fakes.synth.lock().unwrap()[1].events.clone();
    second.send(Synth::Audio(vec![0.1; 24_000])).unwrap();
    second.send(Synth::Done).unwrap();
    {
        let mut s = t.fakes.speaker.lock().unwrap();
        s.clock = None;
        s.done.extend([1, 2]);
    }
    t.until(|o| phase_is(o, "done"));
    let out = t.take();
    // the last word of the message (`pass.`, word 8) is lit
    assert_eq!(out.iter().rfind(|v| v["ev"] == "word").unwrap(), &json!({"ev": "word", "turn": 1, "i": 8}));
    assert!(out.contains(&json!({"ev": "level", "who": "main", "v": 0.0})));
}

fn t_synths(t: &T) -> usize {
    t.fakes.synth.lock().unwrap().len()
}

#[test]
fn voice_out_only_after_a_voice_input() {
    let mut t = T::new();
    t.ready();
    t.cmd(Cmd::Send { text: "typed".into() });
    t.hub.next();
    t.main_turn("Done.");
    t.until(|o| phase_is(o, "done"));
    assert!(has(&t.take(), "main"));
    assert_eq!(t_synths(&t), 0, "a typed message is answered in text");
    // a voice message: aloud
    talk(&mut t, "and now?");
    t.main_turn("Now too.");
    t.until(|o| phase_is(o, "speaking"));
    assert_eq!(t_synths(&t), 1);
    // a typed message after it: text again
    t.cmd(Cmd::Hush);
    t.cmd(Cmd::Send { text: "and typed?".into() });
    t.hub.next();
    t.main_turn("Typed, so text.");
    t.until(|o| o.iter().filter(|v| v["ev"] == "main").count() == 2);
    t.until(|o| phase_is(o, "done"));
    assert_eq!(t_synths(&t), 1);
}

#[test]
fn quiet_is_text_only_and_stops_the_voice() {
    let mut t = T::new();
    t.ready();
    // on a call: a voice message is answered in text
    t.cmd(Cmd::Quiet { on: true });
    talk(&mut t, "is it green?");
    t.main_turn("Green.");
    t.until(|o| phase_is(o, "done"));
    assert!(has(&t.take(), "main"));
    assert_eq!(t_synths(&t), 0, "quiet: no voice");
    // the call ends: aloud again; a call starting mid-voice stops it
    t.cmd(Cmd::Quiet { on: false });
    talk(&mut t, "and now?");
    t.main_turn("Now aloud.");
    t.until(|o| phase_is(o, "speaking"));
    assert_eq!(t_synths(&t), 1);
    t.cmd(Cmd::Quiet { on: true });
    assert!(phase_is(&t.take(), "done"));
    assert_eq!(Cmd::parse(r#"{"cmd":"quiet","on":true,"why":"call"}"#), Ok(Cmd::Quiet { on: true }));
}

#[test]
fn voice_answers_off_is_text_only_until_on_again() {
    let mut t = T::new();
    t.ready();
    t.cmd(Cmd::Voice { on: false });
    talk(&mut t, "is it green?");
    t.main_turn("Green.");
    t.until(|o| phase_is(o, "done"));
    assert_eq!(t_synths(&t), 0, "voice answers off: text only");
    t.cmd(Cmd::Voice { on: true });
    talk(&mut t, "and now?");
    t.main_turn("Now aloud.");
    t.until(|o| phase_is(o, "speaking"));
    assert_eq!(t_synths(&t), 1);
    // turned off mid-voice: it stops, the text stays
    t.cmd(Cmd::Voice { on: false });
    assert!(phase_is(&t.take(), "done"));
    assert_eq!(Cmd::parse(r#"{"cmd":"voice","on":false}"#), Ok(Cmd::Voice { on: false }));
}

#[test]
fn the_state_carries_pages_url_and_urgent_cards() {
    let mut t = T::new();
    t.hub.say(json!({"ev": "state", "agents": [], "pages": [], "pages_url": "http://127.0.0.1:47123",
        "cards": [{"id": 1, "kind": "confirm", "agent": "a", "text": "run rm?"}, {"id": 2, "kind": "question", "agent": "a", "text": "which?"}]}));
    t.until(|o| has(o, "state"));
    let st = t.take().into_iter().find(|v| v["ev"] == "state").unwrap();
    assert_eq!(st["pages_url"], "http://127.0.0.1:47123");
    assert_eq!((st["cards"][0]["urgent"].as_bool(), st["cards"][1]["urgent"].as_bool()), (Some(true), Some(false)));
}

/// fn held, `words` heard, fn up: sent.
fn talk(t: &mut T, words: &str) {
    t.cmd(Cmd::TalkStart);
    let heard = t.fakes.listen.lock().unwrap().last().unwrap().heard.clone();
    heard.send(Heard::Text(format!(" {words}"))).unwrap();
    t.cmd(Cmd::TalkEnd);
    heard.send(Heard::Flushed).unwrap();
    t.until(|o| has(o, "sent"));
    assert_eq!(t.hub.next()["text"], words);
    t.take();
}

#[test]
fn hush_and_cut_in_stop_the_speaker() {
    let mut t = T::new();
    t.ready();
    talk(&mut t, "say something");
    t.main_turn("Something long enough to say.");
    t.until(|o| phase_is(o, "speaking"));
    let cancel = t.fakes.synth.lock().unwrap()[0].cancel.clone();
    t.cmd(Cmd::Hush);
    assert_eq!(t.fakes.speaker.lock().unwrap().stops, 1);
    assert!(cancel.load(Ordering::SeqCst), "the voice being made is dropped too");
    assert!(phase_is(&t.take(), "done"));
    // hush when nothing speaks: nothing
    t.cmd(Cmd::Hush);
    assert!(t.take().is_empty());

    talk(&mut t, "again");
    t.main_turn("Again, something to say.");
    t.until(|o| phase_is(o, "speaking"));
    t.cmd(Cmd::CutIn);
    assert_eq!(t.fakes.speaker.lock().unwrap().stops, 2);
    assert!(phase_is(&t.take(), "idle"));
    t.cmd(Cmd::TalkStart);
    assert!(phase_is(&t.take(), "listening"));

    // fn down while main speaks, without cut_in first: the voice stops too
    t.cmd(Cmd::TalkCancel);
    talk(&mut t, "once more");
    t.main_turn("Once more, said.");
    t.until(|o| phase_is(o, "speaking"));
    t.cmd(Cmd::TalkStart);
    assert_eq!(t.fakes.speaker.lock().unwrap().stops, 3);
}

#[test]
fn talk_cancel_sends_nothing_and_drops_the_shot() {
    let mut t = T::new();
    t.ready();
    let png = t.dir.join("c.png");
    std::fs::write(&png, b"cancelled").unwrap();
    t.cmd(Cmd::Shot { path: png, app: "Mail".into(), title: "x".into() });
    let stored: Vec<_> = std::fs::read_dir(&t.dir).unwrap().collect();
    assert_eq!(stored.len(), 2);
    t.cmd(Cmd::TalkStart);
    let heard = t.fakes.listen.lock().unwrap()[0].heard.clone();
    heard.send(Heard::Text(" never mind".into())).unwrap();
    t.cmd(Cmd::TalkCancel);
    assert!(phase_is(&t.take(), "idle"));
    assert_eq!(std::fs::read_dir(&t.dir).unwrap().count(), 0, "the shot is gone");
    t.cmd(Cmd::Send { text: "typed after".into() });
    assert_eq!(t.hub.next()["text"], "typed after");
}

#[test]
fn no_voice_model_keeps_the_text() {
    let mut t = T::new();
    t.ready();
    t.say_ok.store(false, Ordering::SeqCst);
    talk(&mut t, "hello");
    t.main_turn("Hi.");
    t.until(|o| phase_is(o, "done"));
    let out = t.take();
    assert!(has(&out, "error") && has(&out, "main"));
    assert_eq!(t_synths(&t), 0);
}

#[test]
fn a_failed_turn_is_phase_failed_with_its_line() {
    let mut t = T::new();
    t.ready();
    t.hub.line("main", "sb you : what's up");
    t.hub.line("main", "  obs: turn_started");
    t.hub.line("main", "  obs: turn_done: failed: the provider is down");
    t.until(|o| phase_is(o, "failed"));
    let out = t.take();
    let f = out.iter().rfind(|v| v["ev"] == "phase").unwrap();
    assert_eq!(f["line"], "turn failed: the provider is down");
}

#[test]
fn the_hello_replay_says_where_main_is_but_not_its_old_words() {
    let mut t = T::new();
    t.take();
    t.hub.line("main", "sb you : an old question");
    t.hub.line("main", "  obs: turn_started");
    t.hub.line("main", "  obs: assistant: an old message");
    t.hub.line("main", "  obs: turn_done: completed");
    t.hub.line("main", "sb msg-you : docs : an old note");
    t.hub.line("main", "sb you : the question main is on");
    t.hub.line("main", "  obs: turn_started");
    t.hub.say(json!({"ev": "ready"}));
    t.until(|o| has(o, "phase"));
    let out = t.take();
    assert_eq!(phases(&out), vec!["working"]);
    assert!(!has(&out, "main"), "nothing of the replay is sent: {out:?}");
    // other agents' lines never move main's phase
    t.hub.line("cookies", "  obs: turn_done: completed");
    t.hub.line("main", "  obs: turn_done: completed");
    t.until(|o| has(o, "phase"));
    assert_eq!(phases(&t.take()), vec!["done"]);
}

#[test]
fn hub_loss_says_up_false_then_reconnects() {
    let mut t = T::new();
    t.ready();
    // the hub goes away
    let old = std::mem::replace(&mut t.hub, t.ends.recv_timeout(Duration::from_millis(1)).unwrap_or_else(|_| dead_end()));
    drop(old);
    t.until(|o| o.contains(&json!({"ev": "hub", "up": false, "workspace": WS})));
    // a send while it is away: said, never lost silently
    let out = t.take();
    assert!(!has(&out, "phase"));
    // the core reconnects on its own
    t.until(|o| o.contains(&json!({"ev": "hub", "up": true, "workspace": WS})));
    t.hub = t.ends.recv_timeout(Duration::from_secs(3)).unwrap();
    t.ready();
    t.cmd(Cmd::Send { text: "back?".into() });
    assert_eq!(t.hub.next()["text"], "back?");
}

/// A hub end with nobody behind it (placeholder while swapping).
fn dead_end() -> HubEnd {
    let (a, _b) = UnixStream::pair().unwrap();
    let r = BufReader::new(a.try_clone().unwrap());
    HubEnd { w: a, r }
}

#[test]
fn a_send_while_the_hub_is_away_is_an_error() {
    let mut t = T::new();
    let hub = Hub::default();
    let _ = &mut t;
    // a core whose hub never connected
    let fakes = Fakes::new();
    let ports = Ports {
        mic: Box::new(FakeMic(fakes.mic.clone())),
        listener: Box::new(|_| Box::new(crate::voicemode::fakes::FakeListener(Default::default()))),
        synth: Box::new(FakeSynth(fakes.synth.clone())),
        open_speaker: Box::new(|| Err("no speaker".into())),
        listen_job: Box::new(|| Err("no voice model".into())),
        say_job: Box::new(|| Err("no voice".into())),
        language: None,
        store_image: Box::new(|_| Err("no store".into())),
        user_kind,
    };
    let mut core = Core::new(WS.into(), hub, ports);
    core.cmd(Cmd::Send { text: "hello".into() }, Instant::now());
    let out = core.take_out();
    assert!(has(&out, "error") && phase_is(&out, "failed"), "{out:?}");
    core.cmd(Cmd::TalkStart, Instant::now());
    assert!(has(&core.take_out(), "error"));
}

#[test]
fn cmd_lines_parse_as_the_contract_says() {
    assert_eq!(Cmd::parse(r#"{"cmd":"talk_start"}"#), Ok(Cmd::TalkStart));
    assert_eq!(
        Cmd::parse(r#"{"cmd":"shot","path":"/t/a.png","app":"Chrome","title":"x"}"#),
        Ok(Cmd::Shot { path: "/t/a.png".into(), app: "Chrome".into(), title: "x".into() })
    );
    assert_eq!(Cmd::parse(r##"{"cmd":"answer","card":"#3","reply":"1"}"##), Ok(Cmd::Answer { card: 3, reply: "1".into() }));
    assert_eq!(Cmd::parse(r#"{"cmd":"answer","card":3,"reply":"yes"}"#), Ok(Cmd::Answer { card: 3, reply: "yes".into() }));
    assert!(Cmd::parse(r#"{"cmd":"answer","reply":"yes"}"#).is_err());
    assert!(Cmd::parse(r#"{"cmd":"fly"}"#).is_err());
    assert!(Cmd::parse("nope").is_err());
}

#[test]
fn the_run_loop_writes_lines_and_ends_with_stdin() {
    let (tx, rx) = mpsc::channel();
    let hub = Hub::default();
    let fakes = Fakes::new();
    let ports = Ports {
        mic: Box::new(FakeMic(fakes.mic.clone())),
        listener: Box::new(|_| Box::new(crate::voicemode::fakes::FakeListener(Default::default()))),
        synth: Box::new(FakeSynth(fakes.synth.clone())),
        open_speaker: Box::new(|| Err("no speaker".into())),
        listen_job: Box::new(|| Err("no voice model".into())),
        say_job: Box::new(|| Err("no voice".into())),
        language: None,
        store_image: Box::new(|_| Err("no store".into())),
        user_kind,
    };
    let mut core = Core::new(WS.into(), hub, ports);
    tx.send(super::In::Hub(HubIn::Down)).unwrap();
    tx.send(super::In::Line("garbage".into())).unwrap();
    tx.send(super::In::Line(r#"{"cmd":"hush"}"#.into())).unwrap();
    tx.send(super::In::Eof).unwrap();
    let mut out = Vec::new();
    super::run(&mut core, rx, &mut out);
    let text = String::from_utf8(out).unwrap();
    assert_eq!(text, format!("{}\n", json!({"ev": "hub", "up": false, "workspace": WS})));
}

#[test]
fn a_report_triggered_turn_sends_no_words_and_no_phase() {
    let mut t = T::new();
    // the replay at launch: main answering an agent's report
    t.hub.line("main", "sb msg-in : perf m_12 : [report: done] signup 4.1 s -> 0.9 s");
    t.hub.line("main", "  obs: turn_started");
    t.ready();
    t.hub.line("main", "tool_intent #1 : reads the report");
    t.hub.line("main", "  obs: assistant: **perf** is done; I merged it.");
    t.hub.line("main", "  obs: turn_done: completed");
    // live: another report, another turn
    t.hub.line("main", "sb msg-in : docs m_13 : [report: progress] half way");
    t.main_turn("Noted, docs is half way.");
    t.sync();
    let out = t.take();
    assert!(!has(&out, "main") && !has(&out, "phase"), "{out:?}");
}

#[test]
fn a_tui_user_turn_sends_main_words_as_plain_text() {
    let mut t = T::new();
    t.ready();
    // typed in the terminal: the hub echoes it in main's feed
    t.hub.line("main", "sb you : is the build green?");
    t.main_turn("**Yes**: the `gate` is green, see [the PR](https://x/412).\\n\\n- 412 tests\\n- 0 flaky");
    t.until(|o| phase_is(o, "done"));
    let out = t.take();
    assert_eq!(phases(&out), vec!["working", "done"]);
    let main: Vec<&Value> = out.iter().filter(|v| v["ev"] == "main").collect();
    assert_eq!(main, vec![&json!({"ev": "main", "text": "Yes: the gate is green, see the PR.\n\n- 412 tests\n- 0 flaky", "turn": 1})]);
    // a slash command is the hub's: the turn after it is not the user's
    t.hub.line("main", "sb you : /answer 3 yes");
    t.main_turn("t1 has your answer.");
    t.sync();
    assert!(!has(&t.take(), "main"));
}

#[test]
fn msg_you_lines_are_main_words_with_who_wrote_them() {
    let mut t = T::new();
    t.ready();
    t.hub.line("docs", "sb msg-you : docs : the **v2** page is up");
    t.until(|o| has(o, "main"));
    let out = t.take();
    assert!(out.contains(&json!({"ev": "main", "text": "the v2 page is up", "turn": 0, "from": "docs"})), "{out:?}");
    assert!(!has(&out, "phase"));
}

#[test]
fn pages_ride_the_state_and_a_waited_page_comes_in_front() {
    let mut t = T::new();
    t.hub.say(json!({"ev": "state", "agents": [{"name": "main", "main": true, "status": "idle"}, {"name": "old", "status": "idle"}], "cards": [],
        "pages": [{"id": "w", "title": "weekly update", "agent": "old", "version": 1, "url": "http://127.0.0.1:47100/p/w", "at_ms": 5, "state": "ready", "open_notes": 0}]}));
    t.until(|o| has(o, "state"));
    let st = t.take().into_iter().find(|v| v["ev"] == "state").unwrap();
    assert_eq!(st["pages"][0]["id"], "w");
    t.ready();
    let page = |agent: &str| json!({"ev": "page", "id": "p", "title": "p", "agent": agent, "version": 1, "url": "u", "at_ms": 1, "state": "ready"});
    let front = |t: &mut T| -> bool {
        t.until(|o| has(o, "page"));
        let out = t.take();
        out.iter().find(|v| v["ev"] == "page").unwrap()["front"].as_bool().unwrap()
    };
    // nobody asked: never in front
    t.hub.say(page("main"));
    assert!(!front(&mut t));
    // the user asks; main publishes in that turn: in front
    t.hub.line("main", "sb you : draft my weekly update");
    t.hub.line("main", "  obs: turn_started");
    t.hub.say(page("main"));
    assert!(front(&mut t));
    // an agent that was there before the user's turn: not in front
    t.hub.say(page("old"));
    assert!(!front(&mut t));
    // an agent born since (main started it for the user): in front, even after main's turn
    t.hub.say(json!({"ev": "state", "agents": [{"name": "main", "main": true, "status": "idle"}, {"name": "old", "status": "idle"}, {"name": "weekly-update", "status": "working"}], "cards": [], "pages": []}));
    t.hub.line("main", "  obs: turn_done: completed");
    t.hub.say(page("weekly-update"));
    assert!(front(&mut t));
    // updating: not in front
    t.hub.say(json!({"ev": "page", "id": "p", "agent": "weekly-update", "state": "updating"}));
    assert!(!front(&mut t));
}

/// A note talk on page `id`: its words, then fn up; the hub's
/// page_voice requests, in order.
fn note_talk(t: &mut T, id: &str, words: &[&str]) -> Vec<Value> {
    t.cmd(Cmd::PageTalk { page: id.into() });
    let heard = t.fakes.listen.lock().unwrap().last().unwrap().heard.clone();
    let mut reqs = vec![t.hub.next()];
    for w in words {
        heard.send(Heard::Text(format!(" {w}"))).unwrap();
        t.until(|o| o.iter().any(|v| v["ev"] == "heard" && v["final"] == false));
        reqs.push(t.hub.next());
        t.out.retain(|v| v["ev"] != "heard");
    }
    t.cmd(Cmd::TalkEnd);
    heard.send(Heard::Flushed).unwrap();
    t.until(|o| o.iter().any(|v| v["ev"] == "heard" && v["final"] == true));
    reqs.push(t.hub.next());
    reqs
}

#[test]
fn a_note_talk_goes_to_the_page_never_to_main() {
    let mut t = T::new();
    t.hub.say(json!({"ev": "state", "agents": [], "cards": [],
        "pages": [{"id": "weekly-update", "title": "Weekly update", "agent": "a", "version": 1, "url": "u", "state": "ready"}]}));
    t.until(|o| has(o, "state"));
    t.ready();
    let reqs = note_talk(&mut t, "weekly-update", &["make the intro", "shorter"]);
    let pv = |phase: &str, text: &str| json!({"op": "page_voice", "page": "weekly-update", "phase": phase, "text": text});
    assert_eq!(reqs, vec![pv("start", ""), pv("heard", "make the intro"), pv("heard", "make the intro shorter"), pv("end", "make the intro shorter")]);
    let out = t.take();
    // the capsule says where the words go, then idle: no sent, no main phases
    let first = out.iter().find(|v| v["ev"] == "phase").unwrap();
    assert_eq!(first, &json!({"ev": "phase", "phase": "listening", "page": {"id": "weekly-update", "title": "Weekly update"}}));
    assert_eq!(phases(&out), vec!["listening", "idle"]);
    assert!(!has(&out, "sent"), "{out:?}");

    // "send" alone sends the page's notes; a page not in the state: its id
    let reqs = note_talk(&mut t, "q3-plan", &["Envoie."]);
    assert_eq!(reqs[0]["page"], "q3-plan");
    assert_eq!(reqs.last().unwrap()["phase"], "send");
    let out = t.take();
    assert_eq!(out.iter().find(|v| v["ev"] == "phase").unwrap()["page"]["title"], "q3 plan");

    // nothing heard: cancel; talk_cancel: cancel
    let reqs = note_talk(&mut t, "weekly-update", &[]);
    assert_eq!(reqs.last().unwrap(), &pv("cancel", ""));
    t.cmd(Cmd::PageTalk { page: "weekly-update".into() });
    assert_eq!(t.hub.next(), pv("start", ""));
    t.cmd(Cmd::TalkCancel);
    assert_eq!(t.hub.next(), pv("cancel", ""));
    assert!(phase_is(&t.take(), "idle"));

    // never an input to main
    t.hub.w.set_read_timeout(Some(Duration::from_millis(1))).unwrap();
    t.hub.r.get_ref().set_read_timeout(Some(Duration::from_millis(100))).unwrap();
    let mut more = String::new();
    assert!(t.hub.r.read_line(&mut more).is_err() || more.is_empty(), "more: {more}");
}

#[test]
fn a_page_question_card_carries_its_page_link() {
    let mut t = T::new();
    let link = json!({"id": "w", "block": "q1", "url": "http://127.0.0.1:47100/p/w#q1"});
    t.hub.say(json!({"ev": "state", "agents": [], "pages": [],
        "cards": [{"id": 7, "kind": "question", "agent": "a", "text": "post now?\n1. post now\n2. wait", "page": link},
                  {"id": 8, "kind": "question", "agent": "a", "text": "plain?"}]}));
    t.until(|o| has(o, "state"));
    let st = t.take().into_iter().find(|v| v["ev"] == "state").unwrap();
    assert_eq!(st["cards"][0]["page"], link);
    assert_eq!(st["cards"][0]["options"][1]["label"], "wait");
    assert!(st["cards"][1].get("page").is_none());
}

#[test]
fn talk_start_with_a_page_is_a_note_talk() {
    assert_eq!(
        Cmd::parse(r#"{"cmd":"talk_start","page":{"id":"w","url":"http://127.0.0.1:47100/p/w"}}"#),
        Ok(Cmd::PageTalk { page: "w".into() })
    );
    assert_eq!(Cmd::parse(r#"{"cmd":"talk_start","page":{"id":" "}}"#), Ok(Cmd::TalkStart));
    assert_eq!(Cmd::parse(r#"{"cmd":"talk_start","page":null}"#), Ok(Cmd::TalkStart));
}

#[test]
fn what_the_capsule_sends_main_says_it_came_from_the_capsule() {
    let mut t = T::new();
    t.ready();
    t.cmd(Cmd::Send { text: "what's running?".into() });
    assert_eq!(
        t.hub.next(),
        json!({"op": "input", "focus": "main", "text": "what's running?", "via": "capsule"})
    );
    // an answer is an /answer command: no via, the hub adds no hint to it
    t.hub.say(json!({"ev": "state", "agents": [], "cards": [
        {"id": 4, "kind": "question", "agent": "a", "text": "now?\n1. yes\n2. no"}]}));
    t.until(|o| has(o, "state"));
    t.cmd(Cmd::Answer { card: 4, reply: "1".into() });
    assert!(t.hub.next().get("via").is_none());
}
