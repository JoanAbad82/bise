//! stdio.rs: the JSON-RPC handshake, held events, answers; and the law
//! that every line the core parses or writes has its name in
//! bise_proto::app_rpc.

use super::*;
use std::collections::BTreeSet;
use std::path::Path;

fn init() -> String {
    r#"{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"proto":1,"client":{"name":"bise-desktop","version":"t"}}}"#.into()
}
const INITIALIZED_LINE: &str = r#"{"jsonrpc":"2.0","method":"initialized"}"#;

fn written(t: Took) -> Vec<Value> {
    match t {
        Took::Write(w) | Took::Refused { write: w, .. } => w.iter().map(|l| serde_json::from_str(l).unwrap()).collect(),
        other => panic!("{other:?}"),
    }
}

#[test]
fn initialize_first_then_the_held_events_in_order() {
    let mut s = Stdio::new();
    // events before the handshake are held, never written
    assert!(s.out(vec![json!({"ev": "fake_voice", "on": true}), json!({"ev": "prefs", "prefs": {}})]).is_empty());
    // a request before initialize: -32002
    let w = written(s.line_in(r#"{"jsonrpc":"2.0","id":1,"method":"core/hush"}"#));
    assert_eq!(w[0]["error"]["code"], code::NOT_INITIALIZED);
    let w = written(s.line_in(&init()));
    assert_eq!(w[0]["id"], 0);
    assert_eq!(w[0]["result"]["proto"], 1);
    assert!(w[0]["result"]["methods"].as_array().unwrap().iter().any(|m| m == "core/computer"));
    assert!(s.out(vec![json!({"ev": "level", "who": "you", "v": 0.5})]).is_empty(), "still held until initialized");
    let w = written(s.line_in(INITIALIZED_LINE));
    let methods: Vec<&str> = w.iter().map(|n| n["method"].as_str().unwrap()).collect();
    assert_eq!(methods, ["core/fake_voice", "core/prefs", "core/level"]);
    assert_eq!(w[2]["params"], json!({"who": "you", "v": 0.5}));
    // then live
    let live = s.out(vec![json!({"ev": "agents", "project": "p", "agents": []})]);
    let n: Value = serde_json::from_str(&live[0]).unwrap();
    assert_eq!((n["method"].as_str(), n["params"]["project"].as_str()), (Some("hub/agents"), Some("p")));
    // a second initialize is refused
    assert_eq!(written(s.line_in(&init()))[0]["error"]["code"], code::NOT_INITIALIZED);
}

#[test]
fn a_request_is_the_parser_s_line_and_its_answer() {
    let mut s = Stdio::new();
    s.line_in(&init());
    s.line_in(INITIALIZED_LINE);
    let Took::Cmd { line, id } = s.line_in(r#"{"jsonrpc":"2.0","id":7,"method":"core/computer","params":{"act":"peek","key":"h.d"}}"#) else { panic!() };
    assert_eq!(serde_json::from_str::<Value>(&line).unwrap(), json!({"cmd": "computer", "act": "peek", "key": "h.d"}));
    assert_eq!(id, Id::Num(7));
    let ok: Value = serde_json::from_str(&s.answer(Id::Num(7), Ok(()))).unwrap();
    assert_eq!(ok, json!({"jsonrpc": "2.0", "id": 7, "result": {}}));
    let no: Value = serde_json::from_str(&s.answer(Id::Num(8), Err("answer: no card id".into()))).unwrap();
    assert_eq!(no["error"]["code"], code::INVALID_PARAMS);
    // a hub's command keeps its project for cmd.rs's routing
    let Took::Cmd { line, .. } = s.line_in(r#"{"jsonrpc":"2.0","id":"a","method":"hub/subscribe","params":{"project":"p","agent":"x"}}"#) else { panic!() };
    assert_eq!(serde_json::from_str::<Value>(&line).unwrap(), json!({"cmd": "subscribe", "project": "p", "agent": "x"}));
    // unknown method, not JSON, a stray response: answered or logged, never a command
    assert_eq!(written(s.line_in(r#"{"jsonrpc":"2.0","id":2,"method":"core/nope"}"#))[0]["error"]["code"], code::METHOD_NOT_FOUND);
    assert_eq!(written(s.line_in("nope"))[0]["error"]["code"], code::PARSE);
    assert!(matches!(s.line_in(r#"{"jsonrpc":"2.0","id":3,"result":{}}"#), Took::Refused { write, .. } if write.is_empty()));
}

/// The core's sources, without its tests.
fn sources() -> Vec<(String, String)> {
    fn walk(dir: &Path, out: &mut Vec<(String, String)>) {
        for e in std::fs::read_dir(dir).unwrap().flatten() {
            let p = e.path();
            let name = p.file_name().unwrap().to_string_lossy().to_string();
            if name == "tests" || name.ends_with("tests.rs") || name == "fake.rs" {
                continue;
            }
            if p.is_dir() {
                walk(&p, out);
            } else if name.ends_with(".rs") {
                out.push((p.display().to_string(), std::fs::read_to_string(&p).unwrap()));
            }
        }
    }
    let mut out = Vec::new();
    walk(&Path::new(env!("CARGO_MANIFEST_DIR")).join("src/ambient"), &mut out);
    out
}

#[test]
fn every_event_the_core_writes_has_its_notification() {
    let sent: BTreeSet<String> = bise_proto::app_rpc::notifications().into_iter().collect();
    let mut seen = 0;
    for (file, text) in sources() {
        for (i, _) in text.match_indices(r#""ev": ""#) {
            let rest = &text[i + 7..];
            let tag = &rest[..rest.find('"').unwrap()];
            seen += 1;
            let n = app_rpc::note(&json!({"ev": tag})).unwrap();
            assert!(sent.contains(&n.method), "{file}: the core writes {tag:?}, {} is not in bise_proto::app_rpc", n.method);
        }
    }
    assert!(seen > 30, "the scan found {seen} events: the sources moved?");
    // the main hub's page is relayed whole (core.rs page())
    assert!(sent.contains("core/page"));
}

#[test]
fn every_command_the_core_parses_has_its_method() {
    let served: BTreeSet<String> = bise_proto::app_rpc::methods().into_iter().collect();
    // each core/ method's tag is one cmd.rs reads (not "unknown cmd")
    for m in &served {
        let Some(tag) = m.strip_prefix("core/") else { continue };
        let e = crate::ambient::Cmd::parse(&json!({"cmd": tag}).to_string()).err().unwrap_or_default();
        assert!(!e.starts_with("unknown cmd"), "{m}: cmd.rs doesn't read {tag}");
    }
    // and the AppCmd tags no method serves are exactly the ones it doesn't read
    for tag in bise_proto::app_cmd::AppCmd::TAGS {
        let e = crate::ambient::Cmd::parse(&json!({"cmd": tag}).to_string()).err().unwrap_or_default();
        assert_eq!(e.starts_with("unknown cmd"), app_rpc::NOT_SERVED.contains(tag), "{tag}: {e}");
    }
    // (cmd.rs reads only AppCmd's tags: no hand-matched tag to scan for)
}
