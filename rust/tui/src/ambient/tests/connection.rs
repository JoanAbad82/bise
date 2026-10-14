//! The core's connections: the hub's hello replay, its loss and return,
//! a send with no hub, the command lines' contract, the stdio run loop,
//! and a turn main runs for an agent's report.

use super::*;

#[test]
fn the_hello_replay_says_where_main_is_but_not_its_old_words() {
    let mut t = T::new();
    t.hub.say(json!({"ev": "state", "agents": [{"name": "main", "main": true, "status": "working"}], "cards": []}));
    t.until(|o| has(o, "state"));
    t.take();
    t.hub.line("main", "sb you : an old question");
    t.hub.line("main", "  obs: turn_started");
    t.hub.line("main", "  obs: assistant: an old message");
    t.hub.line("main", "  obs: turn_done: completed");
    t.hub.line("main", "sb msg-you : docs : an old note");
    t.hub.line("main", "sb you : the question main is on");
    t.hub.line("main", "  obs: turn_started");
    t.replay_over();
    t.until(|o| has(o, "phase"));
    let out = t.take();
    assert_eq!(phases(&out), vec!["working"]);
    assert!(!has(&out, "main"), "nothing of the replay is sent: {out:?}");
    // other agents' lines never move main's phase
    t.hub.line("cookies", "  obs: turn_done: completed");
    // a turn with no entry of its own ends when main's row stops running
    t.hub.line("main", "  obs: turn_done: completed");
    t.hub.say(json!({"ev": "state", "agents": [{"name": "main", "main": true, "status": "idle"}], "cards": []}));
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
    HubEnd::new(a, r)
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
        fake_words: None,
        voice_mode: Box::new(|| Err("no voice mode".into())),
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
    // a card is its number (AppCmd's u64), never "#3" (architect m_23230)
    assert!(Cmd::parse(r##"{"cmd":"answer","card":"#3","reply":"1"}"##).is_err());
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
        fake_words: None,
        voice_mode: Box::new(|| Err("no voice mode".into())),
    };
    let mut core = Core::new(WS.into(), hub, ports);
    // an event before initialize is held; a line before it is refused
    tx.send(crate::ambient::In::Hub(HubIn::Down(None))).unwrap();
    tx.send(crate::ambient::In::Line(r#"{"jsonrpc":"2.0","id":1,"method":"core/hush"}"#.into())).unwrap();
    tx.send(crate::ambient::In::Line(r#"{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"proto":1,"client":{"name":"t"}}}"#.into())).unwrap();
    tx.send(crate::ambient::In::Line(r#"{"jsonrpc":"2.0","method":"initialized"}"#.into())).unwrap();
    tx.send(crate::ambient::In::Line("garbage".into())).unwrap();
    tx.send(crate::ambient::In::Line(r#"{"jsonrpc":"2.0","id":2,"method":"core/hush"}"#.into())).unwrap();
    tx.send(crate::ambient::In::Eof).unwrap();
    let (mut out, mut log) = (Vec::new(), Vec::new());
    crate::ambient::run(&mut core, rx, &mut out, &mut log, Vec::new());
    // a refused line goes to the log, never as an event
    assert!(String::from_utf8(log).unwrap().starts_with("ambient-core: "));
    let lines: Vec<Value> = String::from_utf8(out).unwrap().lines().map(|l| serde_json::from_str(l).unwrap()).collect();
    assert_eq!(lines[0]["error"]["code"], bise_proto::jsonrpc::code::NOT_INITIALIZED);
    assert_eq!(lines[1]["id"], 0);
    assert_eq!(lines[2], json!({"jsonrpc": "2.0", "method": "core/hub", "params": {"up": false, "workspace": WS}}));
    assert_eq!(lines[3]["error"]["code"], bise_proto::jsonrpc::code::PARSE);
    assert_eq!(lines[4], json!({"jsonrpc": "2.0", "id": 2, "result": {}}));
    assert_eq!(lines.len(), 5);
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
