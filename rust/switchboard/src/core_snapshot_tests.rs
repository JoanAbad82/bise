//! Issue 30 sha 1: the typed snapshot's JSON is the older builder's, key
//! for key, on a state shaped like his journal (archived agents done and
//! failed, open cards with notes, followed jobs with steps, queued inputs
//! with parts, watches, private places), and on his journal itself
//! (`SB_BENCH_JOURNAL`, ignored). Every core_tests snapshot read goes
//! through `snapshot_checked` too. Out of core_tests.rs (its line limit).

use super::super::*;

fn report(t: &mut T, from: &str, kind: &str, summary: &str, step: Option<(u32, u32)>) {
    t.req(from, AgentReq::Report { kind: kind.into(), summary: summary.into(), decisions: vec![], step, result: None });
}

#[test]
fn the_typed_snapshot_is_the_older_builder_s_on_a_journal_shaped_state() {
    let mut t = T::new();
    for n in ["shipped", "broke", "perf", "docs", "asks"] {
        t.spawn_task(n);
        t.go(Input::ReplIdle { agent: n.into(), leftover: false });
    }
    // done then archived (its declared status stays), failed then archived
    t.req("shipped", AgentReq::Status { status: Declared::Done, note: "landed 3 commits".into() });
    report(&mut t, "shipped", "done", "landed: the snapshot is typed", None);
    report(&mut t, "broke", "failed", "the build is red", None);
    for n in ["shipped", "broke"] {
        t.hub.st.agents.get_mut(n).unwrap().lifecycle = Lifecycle::Archived;
    }
    // a followed job with its step; a blocked one; a private place
    t.req(MAIN, AgentReq::Follow { agent: "perf".into(), on: true, hub: String::new() });
    report(&mut t, "perf", "progress", "bench 3 of 7", Some((3, 7)));
    t.req("docs", AgentReq::Status { status: Declared::Blocked, note: "need a key".into() });
    t.hub.st.agents.get_mut("docs").unwrap().place = Some("/w/.wt/docs".into());
    // his queued inputs, one with parts, to a busy agent
    t.go(Input::ReplLine { agent: "perf".into(), line: "  obs: turn_started".into() });
    let parts = r#"[{"kind":"quote","from":"main","text":"q"},{"kind":"text","text":"why?"}]"#;
    t.user_parts("perf", "<selection from=\"main\">\nq\n</selection>\nwhy?", parts, true);
    t.user_queued("perf", "and the rest");
    // a watch on a build
    let spec = crate::wake::Spec { what: crate::wake::What::Pid { pid: 4242, start: String::new() }, tail: None, note: "the build".into() };
    t.req("perf", AgentReq::Wake(WakeReq::Add { spec, max_ms: crate::wake::MAX_DEFAULT_MS, then: None }));
    // a question card to main, then main writes to its asker: the note
    t.req("asks", AgentReq::Card { text: "v1 or v2?\n\n1. v1\n2. v2".into(), for_msg: None });
    t.req(MAIN, AgentReq::Card { text: "ship tonight?".into(), for_msg: None });
    t.req(MAIN, AgentReq::Send { to: "asks".into(), text: "use v2".into(), expect_reply: false, reply_to: None, queued: false, why: String::new(), switch: None, parts: String::new() });
    t.hub.roles.entry("docs".into()).or_default().line = Some("writes the API docs".into());
    t.env.now += 61_000;
    let snap = t.hub.snapshot_checked(t.env.now);
    // the corpus has what it says it has
    let agents = snap["agents"].as_array().unwrap();
    let of = |n: &str| agents.iter().find(|a| a["name"] == n).unwrap().clone();
    assert_eq!((of("shipped")["status"].clone(), of("shipped")["declared"].clone()), (json!("archived"), json!("done")));
    assert_eq!(of("broke")["report_kind"], "failed");
    assert_eq!((of("perf")["step"].clone(), of("perf")["of"].clone(), of("perf")["follow"].clone()), (json!(3), json!(7), json!(true)));
    assert_eq!(of("perf")["queued_inputs"].as_array().unwrap().len(), 2);
    assert!(of("perf")["queued_inputs"][0]["parts"].is_array());
    assert!(of("perf")["queued_inputs"][1].get("parts").is_none());
    assert_eq!(of("perf")["watching"].as_array().unwrap().len(), 1);
    assert_eq!(of("docs")["role"], "writes the API docs");
    // a task's card goes to main's inbox; main's own is his
    assert_eq!(snap["cards"].as_array().unwrap().len(), 1, "{}", snap["cards"]);
}

/// His journal (SB_BENCH_JOURNAL=<a copy of journal.jsonl>), replayed:
/// the typed snapshot is the older builder's, before and after a tick.
#[test]
#[ignore]
fn the_typed_snapshot_is_the_older_builder_s_on_his_journal() {
    let Some(path) = bise_home::env::test_setting("SB_BENCH_JOURNAL") else { return };
    let events: Vec<Value> = std::fs::read_to_string(path).unwrap().lines().filter(|l| !l.trim().is_empty()).map(|l| serde_json::from_str(l).unwrap()).collect();
    let mut h = Hub::new("/w");
    h.replay(&events);
    let mut env = FakeEnv::new();
    env.now = 1_790_722_300_000;
    let snap = h.snapshot_checked(env.now);
    h.handle(Input::Tick, &mut env);
    h.snapshot_checked(env.now + 500);
    eprintln!("{} agents, {} cards, {} places: equal", snap["agents"].as_array().unwrap().len(), snap["cards"].as_array().unwrap().len(), snap["places"].as_array().unwrap().len());
}
