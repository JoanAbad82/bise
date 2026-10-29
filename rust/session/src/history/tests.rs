//! The rows of a user message: his words are a 'you' row, bise's blocks injected.

use super::*;
use crate::reader::read_dir;
use serde_json::json;

/// The rows `history` gives for these user messages, one turn each.
fn rows(name: &str, texts: &[&str]) -> Vec<(Role, String, String)> {
    let d = std::env::temp_dir().join(format!("hist-{name}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&d);
    std::fs::create_dir_all(&d).unwrap();
    let mut lines = vec![json!({"seq": 1, "at": "2026-10-25T14:00:00.000Z", "type": "session_start", "v": 1,
        "data": {"session": "s-1", "format": 1, "created_by": "bise", "cwd": "/w"}})
    .to_string()];
    for (i, t) in texts.iter().enumerate() {
        lines.push(
            json!({"seq": i + 2, "turn": i + 1, "at": "2026-10-25T14:00:01.000Z", "type": "user_message", "v": 1,
                "data": {"content": [{"kind": "text", "text": t}], "delivery": "prompt"}})
            .to_string(),
        );
    }
    std::fs::write(d.join("events.jsonl"), lines.join("\n") + "\n").unwrap();
    let log = read_dir(&d).unwrap();
    let red = Redactor::default();
    let out = history(&Source { log: &log, blobs: &d, redact: &red })
        .into_iter()
        .filter(|r| matches!(r.role, Role::You | Role::Injected))
        .map(|r| (r.role.clone(), r.head.clone(), r.body.text().to_string()))
        .collect();
    let _ = std::fs::remove_dir_all(&d);
    out
}

#[test]
fn his_wrapped_words_are_a_you_row_with_the_inner_text() {
    let r = rows(
        "wrapped",
        &[
            "<user_message id=\"m_1\"> proto says hi </user_message>",
            "<user_message id=\"m_2\">\n<selection>a quote</selection> and why\n</user_message>",
            "<task_status>t1 done</task_status>",
            "plain words",
        ],
    );
    // a one-line 'you' row says it all in its head (its body is dropped)
    assert_eq!((&r[0].0, r[0].1.as_str()), (&Role::You, "proto says hi"), "{r:#?}");
    assert_eq!(r[1].0, Role::You, "a quote first is still his: {r:#?}");
    assert_eq!(r[1].1, "<selection>a quote</selection> and why", "{r:#?}");
    assert_eq!(r[2].0, Role::Injected, "bise's own block: {r:#?}");
    assert_eq!(r[3].0, Role::You, "{r:#?}");
}
