//! Computer use live in the window (core/computer.rs, S29): a fake
//! state.json (its mtime and its text), a fake commands' socket (the
//! calls recorded, canned answers) and a fake /stop; the registry's rows
//! are hubs.rs's world (home, shop, docs, mail), each hub id `hub-<id>`.

use super::*;
use crate::ambient::core::ComputerPorts;
use bise_computer_use::cli::StopOutcome;
use std::cell::RefCell;
use std::rc::Rc;
use std::sync::Mutex;
use std::time::SystemTime;

type Calls = Arc<Mutex<Vec<(String, Value)>>>;
/// the commands' socket's canned answer per op: Ok(value) or Err((why, detail))
type Answers = Arc<Mutex<HashMap<String, Result<Value, (String, String)>>>>;

struct Fake {
    /// state.json: its mtime (seconds) and its value
    file: Rc<RefCell<Option<(u64, Value)>>>,
    calls: Calls,
    /// the commands' socket's answer to each op
    answers: Answers,
}

use std::collections::HashMap;

fn fake(t: &mut T) -> Fake {
    super::hubs::world(t);
    let file: Rc<RefCell<Option<(u64, Value)>>> = Rc::default();
    let calls: Calls = Arc::default();
    let answers: Answers = Arc::default();
    let (f1, f2, c1, c2, a1) = (file.clone(), file.clone(), calls.clone(), calls.clone(), answers.clone());
    t.core.set_computer(ComputerPorts {
        stat: Box::new(move || f1.borrow().as_ref().map(|(s, _)| SystemTime::UNIX_EPOCH + Duration::from_secs(*s))),
        read: Box::new(move || f2.borrow().as_ref().map(|(_, v)| v.clone()).unwrap_or_default()),
        peer_hub: Box::new(|r| format!("hub-{}", r.id)),
        ctl: Arc::new(move |op, args| {
            c1.lock().unwrap().push((op.to_string(), args.clone()));
            a1.lock().unwrap().get(op).cloned().unwrap_or(Ok(json!({})))
        }),
        stop: Arc::new(move |key| {
            c2.lock().unwrap().push(("stop".into(), json!({"agent": key})));
            StopOutcome::Stopped
        }),
    });
    Fake { file, calls, answers }
}

/// state.json as computer use's broker writes it (v2, `<hub>.<dir>` keys).
fn state(agents: Value) -> Value {
    json!({"v": 2, "agents": agents, "browsers": [], "apps": {}})
}

fn perf_in_shop() -> Value {
    state(json!({
        "hub-shop.perf": {"hub": "hub-shop", "name": "perf", "driving": "Chrome", "where": "amazon.fr", "since_ms": 5, "paused": false, "stopped": false},
        "elsewhere.review": {"hub": "elsewhere", "name": "review", "driving": null, "where": null, "since_ms": null, "paused": false, "stopped": true},
    }))
}

impl T {
    /// A tick at `at` after `t0`; the core's computer events out.
    fn tick_at(&mut self, t0: Instant, at_ms: u64) -> Vec<Value> {
        self.core.tick(t0 + Duration::from_millis(at_ms));
        self.core.take_out().into_iter().filter(|v| v["ev"].as_str().is_some_and(|e| e.starts_with("computer") || e == "error")).collect()
    }

    /// Ticks until the core's computer events hold `done` (the acts' threads).
    fn computer_until(&mut self, t0: Instant, done: impl Fn(&[Value]) -> bool) -> Vec<Value> {
        let mut got = Vec::new();
        for i in 0..600 {
            got.extend(self.tick_at(t0, i));
            if done(&got) {
                return got;
            }
            std::thread::sleep(Duration::from_millis(5));
        }
        panic!("timed out: {got:#?}");
    }
}

#[test]
fn computer_live_maps_each_agent_to_its_project_and_goes_only_on_change() {
    let mut t = T::new();
    let f = fake(&mut t);
    let t0 = Instant::now();
    // no file yet: one empty list at the first look, so the window knows
    assert_eq!(t.tick_at(t0, 0), [json!({"ev": "computer_live", "items": []})]);
    *f.file.borrow_mut() = Some((1, perf_in_shop()));
    assert_eq!(t.tick_at(t0, 100), Vec::<Value>::new(), "looked at most every 500 ms");
    assert_eq!(
        t.tick_at(t0, 500),
        [json!({"ev": "computer_live", "items": [
            {"key": "elsewhere.review", "agent": "review", "stopped": true},
            {"key": "hub-shop.perf", "project": "shop", "agent": "perf", "driving": "Chrome", "place": "amazon.fr", "since_ms": 5},
        ]})],
        "shop's agent has its project; another bise's has none"
    );
    // the same file again, a new mtime with the same rows: nothing
    assert!(t.tick_at(t0, 1000).is_empty());
    f.file.borrow_mut().as_mut().unwrap().0 = 2;
    assert!(t.tick_at(t0, 1500).is_empty(), "the rows didn't change");
    // a new mtime that pauses perf: the rows again
    *f.file.borrow_mut() = Some((3, state(json!({"hub-shop.perf": {"hub": "hub-shop", "name": "perf", "driving": "Chrome", "paused": true}}))));
    let out = t.tick_at(t0, 2000);
    assert_eq!(out[0]["items"], json!([{"key": "hub-shop.perf", "project": "shop", "agent": "perf", "driving": "Chrome", "paused": true}]));
    // the file gone: no agent uses computer use
    *f.file.borrow_mut() = None;
    assert_eq!(t.tick_at(t0, 2500), [json!({"ev": "computer_live", "items": []})]);
}

#[test]
fn take_hand_back_and_stop_go_by_key_and_only_for_his_projects() {
    let mut t = T::new();
    let f = fake(&mut t);
    *f.file.borrow_mut() = Some((1, perf_in_shop()));
    let t0 = Instant::now();
    t.tick_at(t0, 0);
    let act = |t: &mut T, act: &str, key: &str| t.core.cmd(Cmd::parse(&json!({"cmd": "computer", "act": act, "key": key}).to_string()).unwrap(), t0);
    act(&mut t, "take", "hub-shop.perf");
    act(&mut t, "hand_back", "hub-shop.perf");
    act(&mut t, "stop", "hub-shop.perf");
    let calls = f.calls.clone();
    t.computer_until(t0, |_| calls.lock().unwrap().len() == 3);
    let mut got = f.calls.lock().unwrap().clone();
    got.sort_by(|a, b| a.0.cmp(&b.0));
    assert_eq!(
        got,
        [("pause".to_string(), json!({"agent": "hub-shop.perf"})), ("resume".to_string(), json!({"agent": "hub-shop.perf"})), ("stop".to_string(), json!({"agent": "hub-shop.perf"}))]
    );
    // no optimistic row: nothing changes until state.json does
    assert!(t.tick_at(t0, 100).is_empty());
    // another bise's agent, a key not in the rows, an act that isn't one: refused, never sent
    for (a, k) in [("take", "elsewhere.review"), ("stop", "hub-shop.gone"), ("drive", "hub-shop.perf")] {
        act(&mut t, a, k);
        let out = t.core.take_out();
        assert_eq!(out.len(), 1, "{a} {k}: {out:?}");
        assert_eq!((out[0]["ev"].as_str(), out[0]["cmd"].as_str()), (Some("error"), Some("computer")), "{a} {k}");
    }
    assert_eq!(f.calls.lock().unwrap().len(), 3);
    // the broker refuses a take: his error
    f.answers.lock().unwrap().insert("pause".into(), Err(("refused".into(), "perf drives nothing now".into())));
    act(&mut t, "take", "hub-shop.perf");
    let out = t.computer_until(t0, |o| has(o, "error"));
    assert_eq!(out, [json!({"ev": "error", "cmd": "computer", "text": "perf drives nothing now"})]);
}

#[test]
fn a_peek_goes_out_once_inline_one_in_flight_and_one_per_two_seconds() {
    let mut t = T::new();
    let f = fake(&mut t);
    *f.file.borrow_mut() = Some((1, perf_in_shop()));
    let t0 = Instant::now();
    t.tick_at(t0, 0);
    let still = json!({"data": "QUJD", "mime": "image/jpeg", "width": 640, "height": 400, "target": "tab:1", "url": "https://amazon.fr", "at_ms": 9});
    f.answers.lock().unwrap().insert("peek".into(), Ok(still));
    let peek = |t: &mut T, at: Instant| {
        t.core.cmd(Cmd::parse(r#"{"cmd":"computer","act":"peek","key":"hub-shop.perf","max_width":640}"#).unwrap(), at);
        t.core.take_out()
    };
    assert!(peek(&mut t, t0).is_empty(), "its answer comes on the tick");
    // asked again while the first is in flight, and within 2 s: too soon, never sent
    assert_eq!(peek(&mut t, t0 + Duration::from_millis(10)), [json!({"ev": "computer_peek", "key": "hub-shop.perf", "why": "too_soon"})]);
    let out = t.computer_until(t0, |o| has(o, "computer_peek"));
    assert_eq!(out, [json!({"ev": "computer_peek", "key": "hub-shop.perf", "shot": {"data": "QUJD", "mime": "image/jpeg", "width": 640, "height": 400, "at_ms": 9}})]);
    assert_eq!(peek(&mut t, t0 + Duration::from_millis(1900)), [json!({"ev": "computer_peek", "key": "hub-shop.perf", "why": "too_soon"})]);
    assert_eq!(*f.calls.lock().unwrap(), [("peek".to_string(), json!({"agent": "hub-shop.perf", "max_width": 640}))]);
    // 2 s later: asked again; the broker's not_found and a missing broker pass through
    f.answers.lock().unwrap().insert("peek".into(), Err(("not_found".into(), "perf drives nothing now".into())));
    assert!(peek(&mut t, t0 + Duration::from_millis(2000)).is_empty());
    let out = t.computer_until(t0 + Duration::from_millis(2000), |o| has(o, "computer_peek"));
    assert_eq!(out, [json!({"ev": "computer_peek", "key": "hub-shop.perf", "why": "not_found"})]);
    f.answers.lock().unwrap().insert("peek".into(), Err(("no_broker".into(), "computer use isn't running".into())));
    assert!(peek(&mut t, t0 + Duration::from_millis(4000)).is_empty());
    let out = t.computer_until(t0 + Duration::from_millis(4000), |o| has(o, "computer_peek"));
    assert_eq!(out, [json!({"ev": "computer_peek", "key": "hub-shop.perf", "why": "no_broker"})]);
    // another bise's agent is never peeked
    t.core.cmd(Cmd::parse(r#"{"cmd":"computer","act":"peek","key":"elsewhere.review"}"#).unwrap(), t0 + Duration::from_secs(9));
    assert_eq!(t.core.take_out()[0]["ev"], "error");
    assert_eq!(f.calls.lock().unwrap().len(), 3);
}

/// Peek's one rule (architect m_14385): a still goes to the window and
/// nowhere else. Through the real run loop (JSON-RPC, amb-core m_14730):
/// initialize, then computer peek requests; the still goes out as a
/// core/computer_peek notification and never into the log (stderr, the
/// window's core.log), which does get the refused line sent with it.
#[test]
fn a_peek_through_the_run_loop_never_reaches_the_log() {
    let mut t = T::new();
    let f = fake(&mut t);
    *f.file.borrow_mut() = Some((1, perf_in_shop()));
    let data = "U0VDUkVULVNDUkVFTi1CWVRFUw=="; // "SECRET-SCREEN-BYTES"
    let still = json!({"data": data, "mime": "image/jpeg", "width": 640, "height": 400, "at_ms": 9});
    f.answers.lock().unwrap().insert("peek".into(), Ok(still));
    let (tx, rx) = std::sync::mpsc::channel();
    let calls = f.calls.clone();
    let sender = std::thread::spawn(move || {
        use crate::ambient::In;
        let line = |s: &str| In::Line(s.to_string());
        tx.send(line(r#"{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"proto":1,"client":{"name":"t"}}}"#)).unwrap();
        tx.send(line(r#"{"jsonrpc":"2.0","method":"initialized"}"#)).unwrap();
        tx.send(line("not a command")).unwrap();
        tx.send(line(r#"{"jsonrpc":"2.0","id":1,"method":"core/computer","params":{"act":"peek"}}"#)).unwrap();
        for i in 0..100 {
            std::thread::sleep(Duration::from_millis(50));
            tx.send(line(&format!(r#"{{"jsonrpc":"2.0","id":{},"method":"core/computer","params":{{"act":"peek","key":"hub-shop.perf"}}}}"#, i + 2))).unwrap();
            if calls.lock().unwrap().iter().any(|(op, _)| op == "peek") {
                break;
            }
        }
        std::thread::sleep(Duration::from_millis(300));
        tx.send(In::Eof).unwrap();
    });
    let (mut out, mut log) = (Vec::new(), Vec::new());
    crate::ambient::run(&mut t.core, rx, &mut out, &mut log, vec![json!({"ev": "fake_voice", "on": true})]);
    sender.join().unwrap();
    let (out, log) = (String::from_utf8(out).unwrap(), String::from_utf8(log).unwrap());
    let lines: Vec<Value> = out.lines().map(|l| serde_json::from_str::<Value>(l).unwrap()).collect();
    // every line is JSON-RPC: initialize's result first, then the start's event
    assert!(lines.iter().all(|v| v["jsonrpc"] == "2.0"), "{out}");
    assert_eq!(lines[0]["id"], 0, "{out}");
    assert_eq!(lines[1]["method"], "core/fake_voice", "{out}");
    let peeks: Vec<&Value> = lines.iter().filter(|v| v["method"] == "core/computer_peek" && v["params"].get("shot").is_some()).collect();
    assert_eq!(peeks.len(), 1, "{out}");
    assert_eq!(peeks[0]["params"]["shot"]["data"], data);
    // the keyless request is refused by the parser: an error answer
    assert!(lines.iter().any(|v| v["id"] == 1 && v["error"]["code"] == bise_proto::jsonrpc::code::INVALID_PARAMS), "{out}");
    assert!(log.contains("ambient-core: ") && log.contains("not JSON"), "{log}");
    assert!(!log.contains(data) && !log.contains("shot") && !log.contains("computer_peek"), "{log}");
}

/// A key's hub half is what the hub and the TUI hash (harness main.rs's
/// the_hub_and_the_tui_stop_the_same_key checks the three sides): the
/// socket as reached, the short link when the natural path is too long.
#[test]
fn peer_hub_hashes_the_socket_as_reached() {
    let short = Path::new("/h/.bise/hubs/shop-1a2b3c4d");
    assert_eq!(crate::ambient::core::peer_hub(short), bise_peer::tags::hub_id(&short.join("hub.sock")));
    let long = PathBuf::from(format!("/var/folders/xy/{}/T/.bise/hubs/tmp-x-ee85d2ab", "a".repeat(80)));
    let reached = bise_home::socket::socket_path(&long.join("hub.sock"));
    assert_ne!(reached, long.join("hub.sock"));
    assert_eq!(crate::ambient::core::peer_hub(&long), bise_peer::tags::hub_id(&reached));
}
