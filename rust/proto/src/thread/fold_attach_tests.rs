//! The fold of an agent's message parts (send-parts, architect m_23962),
//! apart from fold_tests.rs (its line limit).

use super::*;
use crate::thread::EntryKind;

fn ctx<'a>(page: &'a dyn Fn(&str) -> Option<crate::thread::PageRef>) -> Ctx<'a> {
    Ctx { open_cards: &[], page, provider: &|id: &str, _: &str| id.to_string(), width: &|s: &str| s.chars().count(), offset: &|_| 0, attached: &crate::thread::Attached::plain }
}

/// msg-parts / sent-parts go on the entry of their message id, received
/// or sent, wherever the line sits (by id, never "the entry before"); one
/// for an id with no entry, or unreadable, attaches to nothing and makes
/// no entry; a message without one keeps no parts.
#[test]
fn an_agents_parts_go_on_the_entry_of_their_id() {
    use crate::parts::Part;
    let none = |_: &str| None;
    let l = |pos: u64, line: String| (pos, pos, line);
    let img = serde_json::json!({"kind": "image", "name": "[Image #1]", "source": "/u/s.png", "mime": "image/png", "b64_file": "/h/1.b64"});
    let parts = serde_json::json!([{"kind": "text", "text": "look\n\n"}, img]);
    let rec = |kind: &str, v: serde_json::Value| format!("sb {kind} :: {v}");
    let lines = vec![
        l(1, rec("msg-in", serde_json::json!({"from": "main", "id": 7, "body": "look\n\n<image …>"}))),
        l(2, rec("msg-in", serde_json::json!({"from": "main", "id": 8, "body": "plain"}))),
        // its parts after another message: still on m_7
        l(3, rec("msg-parts", serde_json::json!({"id": 7, "parts": parts}))),
        l(4, rec("sent", serde_json::json!({"to": "docs", "id": 9, "ask": false, "body": "for you"}))),
        l(5, rec("sent-parts", serde_json::json!({"id": 9, "parts": parts}))),
        // no entry of that id, and an unreadable one: nothing
        l(6, rec("msg-parts", serde_json::json!({"id": 99, "parts": parts}))),
        l(7, rec("msg-parts", serde_json::json!({"id": 8, "parts": "not a list"}))),
    ];
    let e = fold(&lines, &ctx(&none));
    let kinds: Vec<EntryKind> = e.iter().map(|e| e.kind).collect();
    assert_eq!(kinds, [EntryKind::FromAgent, EntryKind::FromAgent, EntryKind::ToAgent], "no entry of their own");
    assert!(matches!(e[0].parts.as_slice(), [Part::Text { .. }, Part::Image { name, .. }] if name == "[Image #1]"), "{:?}", e[0].parts);
    assert!(e[1].parts.is_empty(), "a plain message, and an unreadable line: none");
    assert_eq!(e[2].parts, e[0].parts, "the sender's entry too");
}
