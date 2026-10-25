//! The laws of the app <-> core JSON-RPC names (app_rpc.rs): one name per
//! tag, no tag in two lists, and every fixture line goes through its
//! request or notification and back unchanged.

use super::*;
use crate::jsonrpc::{Id, Message};
use std::collections::BTreeSet;

fn fixture(file: &str) -> Vec<Value> {
    let p = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures").join(file);
    let text = std::fs::read_to_string(&p).unwrap_or_else(|e| panic!("{}: {e}", p.display()));
    text.lines().filter(|l| !l.trim().is_empty()).map(|l| serde_json::from_str(l).unwrap()).collect()
}

fn unique(names: &[String]) -> bool {
    names.iter().collect::<BTreeSet<_>>().len() == names.len()
}

#[test]
fn every_tag_is_exactly_one_name() {
    for t in CoreEv::TAGS {
        assert!(!HubEv::TAGS.contains(t), "{t}: both a CoreEv and a HubEv tag");
    }
    let m = methods();
    let n = notifications();
    assert!(unique(&m), "a method twice: {m:?}");
    assert!(unique(&n), "a notification twice: {n:?}");
    assert_eq!(m.len(), 1 + AppCmd::TAGS.len() - NOT_SERVED.len() + HubCmd::TAGS.len());
    assert_eq!(n.len(), CoreEv::TAGS.len() + HubEv::TAGS.len());
    for t in NOT_SERVED {
        assert!(AppCmd::TAGS.contains(t) && !m.contains(&format!("core/{t}")), "{t}");
    }
    for t in AppCmd::TAGS.iter().filter(|t| !NOT_SERVED.contains(t)) {
        assert!(m.contains(&format!("core/{t}")), "{t}");
    }
    for t in HubCmd::TAGS {
        assert!(m.contains(&format!("hub/{t}")), "{t}");
    }
    for t in CoreEv::TAGS {
        assert!(n.contains(&format!("core/{t}")), "{t}");
    }
    for t in HubEv::TAGS {
        assert!(n.contains(&format!("hub/{t}")), "{t}");
    }
    // S29's computer rows (amb-core 4c0a6249)
    assert!(m.contains(&"core/computer".to_string()));
    assert!(n.contains(&"core/computer_live".to_string()) && n.contains(&"core/computer_peek".to_string()));
}

#[test]
fn every_command_goes_through_its_request_and_back() {
    let mut id = 0;
    for file in ["app_cmd.jsonl", "hub_cmd.jsonl"] {
        for cmd in fixture(file) {
            if NOT_SERVED.contains(&cmd["cmd"].as_str().unwrap_or("")) {
                assert!(method_of(&cmd).is_some_and(|m| !methods().contains(&m)), "{cmd} is never a method");
                continue;
            }
            id += 1;
            let req = request_of(Id::Num(id), &cmd).unwrap();
            assert!(methods().contains(&req.method), "{file}: {} is not served: {cmd}", req.method);
            let line = Message::Request(req.clone()).encode();
            let Ok(Message::Request(back)) = Message::read(&line) else { panic!("{line}") };
            assert_eq!(cmd_of(&back).unwrap(), cmd, "{file}: {line}");
        }
    }
}

#[test]
fn every_event_goes_through_its_notification_and_back() {
    for file in ["core_ev.jsonl", "hub_ev.jsonl"] {
        for ev in fixture(file) {
            let n = note(&ev).unwrap();
            assert!(notifications().contains(&n.method), "{file}: {} is not sent: {ev}", n.method);
            let line = Message::Notification(n).encode();
            let Ok(Message::Notification(back)) = Message::read(&line) else { panic!("{line}") };
            assert_eq!(ev_of(&back).unwrap(), ev, "{file}: {line}");
        }
    }
}

#[test]
fn a_bad_request_is_answered_by_its_code() {
    let req = |m: &str, p: Value| Request::new(Id::Num(1), m, p);
    let c = |r: Request| cmd_of(&r).unwrap_err().code;
    assert_eq!(c(req("core/nope", Value::Null)), code::METHOD_NOT_FOUND);
    assert_eq!(c(req("nope", Value::Null)), code::METHOD_NOT_FOUND);
    assert_eq!(c(req("hub/hello", serde_json::json!({"project": "p"}))), code::METHOD_NOT_FOUND);
    assert_eq!(c(req("core/talk_end", serde_json::json!([1]))), code::INVALID_PARAMS);
    assert_eq!(c(req("core/talk_end", serde_json::json!({"cmd": "hush"}))), code::INVALID_PARAMS);
    // a hub's command needs its project; a core command never has one
    assert_eq!(c(req("hub/stop", serde_json::json!({"agent": "a"}))), code::INVALID_PARAMS);
    assert_eq!(c(req("core/stop", serde_json::json!({"agent": "a", "project": "p"}))), code::INVALID_PARAMS);
    // no params: the command alone
    assert_eq!(cmd_of(&req("core/talk_end", Value::Null)).unwrap(), serde_json::json!({"cmd": "talk_end"}));
    // the same tag in both families: the project says which
    assert_eq!(method_of(&serde_json::json!({"cmd": "stop", "agent": "a"})).unwrap(), "core/stop");
    assert_eq!(method_of(&serde_json::json!({"cmd": "stop", "agent": "a", "project": "p"})).unwrap(), "hub/stop");
}

#[test]
fn initialize_says_what_this_core_serves() {
    let r = AppInitResult::now("/h/cache/thumbs");
    assert_eq!(r.proto, PROTO);
    assert_eq!(r.thumbs_dir, "/h/cache/thumbs");
    // an older core's answer reads with no thumbs folder
    let old: AppInitResult = serde_json::from_value(serde_json::json!({"proto": 1, "methods": [], "notifications": []})).unwrap();
    assert_eq!(old.thumbs_dir, "");
    assert_eq!(r.methods, methods());
    assert_eq!(r.notifications, notifications());
    let p: AppInit = serde_json::from_value(serde_json::json!({"proto": 1, "client": {"name": "bise-desktop"}})).unwrap();
    assert_eq!(p.client.version, "");
}

#[test]
fn a_confirm_never_prints_its_secret() {
    let line = r#"{"cmd":"plugin_add_confirm","token":"t","secrets":[{"name":"K","value":"fake-planted-value"}]}"#;
    let cmd: crate::app_cmd::AppCmd = serde_json::from_str(line).unwrap();
    let shown = format!("{cmd:?} {:#?}", cmd);
    assert!(!shown.contains("fake-planted-value"), "{shown}");
    assert!(shown.contains("•••"));
    // the wire still carries it, as a plain string
    assert_eq!(serde_json::to_value(&cmd).unwrap()["secrets"][0]["value"], "fake-planted-value");
}
