//! His `@agent` words routed: to a busy task, and typed in another
//! thread (at-start's trace). Out of core_tests.rs (its line limit).

use super::*;

#[test]
fn at_task_to_a_busy_task_steers_and_answers_at_turn_end() {
    let mut t = T::new();
    t.spawn_task("docs");
    // docs is still in its first turn
    let fx = t.user(MAIN, "@docs où en es-tu ?");
    let s = steer_to(&fx, "docs").unwrap();
    assert!(s.starts_with("<user_message via=\"main\">"), "{}", s);
    t.go(Input::ReplLine {
        agent: "docs".into(),
        line: "  obs: assistant: à mi-chemin".into(),
    });
    let fx = t.go(Input::ReplIdle {
        agent: "docs".into(),
        leftover: false,
    });
    assert!(has_rec(&fx, MAIN, json!({"sb": "msg-you", "from": "docs", "body": "à mi-chemin"})), "{:?}", fx);
    // main still gets its own automatic reply to the brief
    assert!(t.hub.st.unanswered_for("docs").is_empty());
}

/// at-start: his words for docs typed in main's thread leave one route row
/// there with the message's id (the window's '→ sent to docs'); none from
/// docs's own thread, an unknown thread, or no `from`; the message is the
/// same either way (laws say_from_*).
#[test]
fn a_say_typed_in_another_thread_leaves_one_route_row_there() {
    let mut t = T::new();
    t.spawn_task("docs");
    let fx = t.user_from("docs", "fais une map", MAIN);
    let rows = recs_of(&fx, MAIN, "route");
    assert_eq!(rows.len(), 1, "{fx:?}");
    assert_eq!((&rows[0]["who"], &rows[0]["said"], rows[0].get("card")), (&json!("docs"), &json!("fais une map"), None));
    let id = rows[0]["msg"].as_u64().expect("the message's id");
    assert!(t.hub.st.msgs().values().any(|m| m.id == id && m.to == "docs" && m.text == "fais une map"), "the message itself went to docs");
    assert!(recs_of(&fx, "docs", "route").is_empty(), "never in docs's own feed");
    for from in ["", "docs", "nobody"] {
        let fx = t.user_from("docs", "encore", from);
        assert!(recs_of(&fx, MAIN, "route").is_empty() && recs_of(&fx, "docs", "route").is_empty(), "from {from:?}: {fx:?}");
    }
}
