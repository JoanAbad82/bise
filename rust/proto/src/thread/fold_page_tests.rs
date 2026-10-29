//! The fold of his answers on a page (page-answer-row, architect
//! m_20833), apart from fold_tests.rs (its line limit).

use super::*;
use crate::thread::EntryKind;

fn ctx_with<'a>(open: &'a [u64], page: &'a dyn Fn(&str) -> Option<crate::thread::PageRef>) -> Ctx<'a> {
    Ctx { open_cards: open, page, provider: &|id: &str, _: &str| id.to_string(), width: &|s: &str| s.chars().count(), offset: &|_| 0, attached: &crate::thread::Attached::plain }
}

/// His pick on a page reaches the page's agent as a 'you' line with its
/// page part; the entry keeps the model's text and carries the part,
/// which renders back to that text.
#[test]
fn his_page_answer_keeps_its_page_part() {
    use crate::parts::{render, Part};
    let none = |_: &str| None;
    let ctx = ctx_with(&[], &none);
    let l = |pos: u64, line: &str| (pos, pos, line.to_string());
    let text = "you sent 1 note on your page \"efforts\" (effort-lists v4, http://x):\n1. on q-live: pick: la table";
    let parts = serde_json::json!([{"kind": "page", "text": text, "to": "main", "page": "effort-lists", "title": "efforts", "version": 4,
        "notes": [{"block": "q-live", "kind": "pick", "text": "la table", "card": 516, "asked": "Est-ce que ?"}]}]);
    let lines = vec![
        l(1, "sb card-closed :: {\"id\":516,\"res\":\"answered\"}"),
        l(2, &format!("sb you :: {}", serde_json::json!({"text": text}))),
        l(3, "sb you-id :: {\"id\":20815}"),
        l(4, &format!("sb you-parts :: {}", serde_json::json!({"parts": parts}))),
    ];
    let e = fold(&lines, &ctx);
    let you: Vec<_> = e.iter().filter(|x| x.kind == EntryKind::You).collect();
    assert_eq!(you.len(), 1, "{e:?}");
    assert_eq!(you[0].text, text);
    assert!(matches!(you[0].parts.as_slice(), [Part::Page { notes, .. }] if notes[0].card == 516));
    assert_eq!(render(&you[0].parts), text);
}
