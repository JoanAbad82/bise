//! A step's answer, applied (core_link.rs's apply_step): its effects run
//! whatever its view, and his message's id (A1) comes back typed. Moved
//! out of core_tests.rs (its line limit).

use super::*;

/// hot-view: a step whose view doesn't decode (a bug of sb-core's
/// encoder) still applies its effects, the journal's included; the
/// mirror stays as the last good view left it.
#[test]
fn a_step_whose_view_does_not_decode_still_applies_its_effects() {
    use bise_proto::core::{fx as cfx, link::AStep, Fx as CoreFx};
    let mut t = T::new();
    let (agents, order) = (t.hub.st.agents.clone(), t.hub.st.order.clone());
    let s = AStep {
        fx: vec![
            CoreFx::Journal(cfx::Journal { ev: json!({"type": "main_note", "text": "fake", "at_ms": 1}) }),
            CoreFx::Kill(cfx::Kill { agent: "fake".into() }),
        ],
        dirty: true,
        view: json!({"agents": 3, "order": "not a list"}),
        msg: None,
    };
    let mut fx = Vec::new();
    t.hub.apply_step(&mut fx, &mut t.env, None, 0, s);
    assert!(fx.contains(&Effect::Kill { agent: "fake".into() }), "{:?}", fx);
    assert!(fx.iter().any(|e| matches!(e, Effect::Journal(ev) if ev["text"] == "fake")), "{:?}", fx);
    assert_eq!((&t.hub.st.agents, &t.hub.st.order), (&agents, &order), "the mirror kept");
}

/// A1: his input's step answers the id sb-core gave his message (typed,
/// AStep.msg), the id his you-id line carries when it is delivered; a
/// queued one too, at arrival. A tick makes none.
#[test]
fn his_input_answers_the_id_of_his_message() {
    let mut t = T::new();
    t.spawn_task("a");
    let you_id = |fx: &[Effect], agent: &str| recs(fx, agent).iter().find(|r| r["sb"] == "you-id").and_then(|r| r["id"].as_u64());
    t.hub.said = None;
    let fx = t.user("main", "first words");
    let said = t.hub.said.take().expect("his input answers his message's id");
    assert_eq!(you_id(&fx, "main"), Some(said), "the answered id is the you-id line's: {fx:?}");
    // `a` is busy: queued, its id at arrival, its you-id line at the turn's end
    let fx = t.user_queued("a", "queued words");
    let q = t.hub.said.take().expect("a queued input has its id at arrival");
    assert!(q > said && you_id(&fx, "a").is_none(), "a fresh id, no line yet: {q} after {said}");
    let fx = t.go(Input::ReplIdle { agent: "a".into(), leftover: false });
    assert_eq!(you_id(&fx, "a"), Some(q), "its line carries the id answered at arrival: {fx:?}");
    assert_eq!(t.hub.said, None, "a turn's end makes no message of his");
    t.go(Input::Tick);
    assert_eq!(t.hub.said, None, "a tick makes none");
}
