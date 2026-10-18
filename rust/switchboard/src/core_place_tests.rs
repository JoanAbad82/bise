//! Where an agent works (BISE-136, wt-sign): `sb worktree`, the bash
//! fallback, and main, who always works in the workspace.

use super::*;

/// BISE-136: `sb worktree <path>` (gate.sh new) puts the private worktree
/// in the snapshot and `sb tasks`; `none` takes it back. Before any
/// `sb worktree`, a bash call that starts in a linked worktree (a `.git`
/// file) is the fallback; after one, the fallback no longer guesses.
#[test]
fn an_agent_says_where_it_works() {
    let mut t = T::new();
    t.spawn_task("docs");
    let place = |t: &mut T| {
        t.hub.snapshot(0).agent("docs").place.clone()
    };
    assert!(place(&mut t).is_none());
    // the fallback: a linked worktree has a .git file
    let wt = std::env::temp_dir().join(format!("sb-place-{}", std::process::id()));
    std::fs::create_dir_all(&wt).unwrap();
    std::fs::write(wt.join(".git"), "gitdir: /x").unwrap();
    let wt = wt.to_string_lossy().to_string();
    let bash = |t: &mut T, cmd: &str| {
        t.go(Input::ReplLine {
            agent: "docs".into(),
            line: format!("tool #1 bash : {}", json!({"arg": cmd})),
        })
    };
    bash(&mut t, "cd /tmp && ls");
    assert!(place(&mut t).is_none(), "not a linked worktree");
    let fx = bash(&mut t, &format!("cd {} && cargo test", wt));
    assert_eq!(place(&mut t), Some(wt.clone()));
    assert!(fx.contains(&Effect::State), "the views learn it");
    // wt-sign (Benjamin's 'ψ ven-bots' on main's line): main looking into
    // a task's worktree is no move; main works in the workspace
    t.go(Input::ReplLine { agent: MAIN.into(), line: format!("tool #2 bash : {}", json!({"arg": format!("cd {} && git log", wt)})) });
    let snap = t.hub.snapshot(0);
    let main = snap.agent(MAIN);
    assert!(main.place.is_none() && main.place_id == "shared", "{main:?}");
    // told: the fallback stops guessing
    let (tok, fx) = t.req("docs", AgentReq::Worktree { path: "/tmp/docs-wt".into() });
    assert!(fx.contains(&Effect::Reply { token: tok, body: json!({"ok": true, "path": "/tmp/docs-wt"}) }), "{:?}", fx);
    assert_eq!(place(&mut t).as_deref(), Some("/tmp/docs-wt"));
    let (_, fx) = t.req(MAIN, AgentReq::Tasks);
    assert!(format!("{:?}", fx).contains("private worktree /tmp/docs-wt"), "{:?}", fx);
    bash(&mut t, &format!("cd {} && cargo test", wt));
    assert_eq!(place(&mut t).as_deref(), Some("/tmp/docs-wt"));
    // none: its own workspace again
    t.req("docs", AgentReq::Worktree { path: String::new() });
    assert!(place(&mut t).is_none());
    // the CLI's JSON: an absolute path or none
    let r = |p: &str| AgentReq::from_json(&json!({"cmd": "worktree", "path": p}));
    assert_eq!(r("none"), Ok(AgentReq::Worktree { path: String::new() }));
    assert_eq!(r("/tmp/x-wt/"), Ok(AgentReq::Worktree { path: "/tmp/x-wt".into() }));
    assert!(r("x-wt").is_err());
    // qa-explore B: main works in the workspace, it cannot mark itself
    let (tok, fx) = t.req(MAIN, AgentReq::Worktree { path: "/tmp/docs-wt".into() });
    assert!(fx.iter().any(|e| matches!(e, Effect::Reply { token, body } if *token == tok && body["ok"] == false)), "{:?}", fx);
    let _ = std::fs::remove_dir_all(&wt);
}

/// A feature's try that did not go through (the rebase conflicts, the
/// feature is busy): the item opens again with why on it, under a new
/// number (both apps show it again), and the old one closes with that line.
#[test]
fn a_refused_feature_answer_says_why_on_its_item() {
    let mut t = T::new();
    let place = crate::feature::place_id("bims");
    let text = "bims is ready to try\n24 commits on bims\n\n1. try it\n2. show the diff\n3. not yet";
    let open = ci::CardOpen { kind: "feature_try".into(), agent: MAIN.into(), text: text.into(), place: Some(place.clone()), pr: None };
    let mut fx = Vec::new();
    t.hub.core(&mut fx, &mut t.env, None, In::CardOpen(open));
    let id = *t.hub.st.cards.keys().max().unwrap();
    let why = crate::feature::refused_line("try", "a.txt changed on main too: the rebase of bims conflicts");
    t.go(Input::Feature(FeatureDone { name: "bims".into(), refused: Some(why.clone()), ..FeatureDone::default() }));
    assert!(!t.hub.st.cards.contains_key(&id), "the old item closed");
    let open: Vec<_> = t.hub.st.open_cards().collect();
    assert_eq!(open.len(), 1, "{open:?}");
    let c = open[0];
    assert_eq!((c.kind.as_str(), c.place.as_deref()), ("feature_try", Some(place.as_str())));
    assert!(c.id > id && c.text.contains(&why) && c.text.ends_with("3. not yet"), "{}", c.text);
}

// moved from core_tests.rs (hub-loop: its line count)
#[test]
fn worktrees_need_git() {
    let mut t = T::new();
    t.env.git = false;
    let fx = t.user(MAIN, "/new -w x: y");
    assert!(fx.iter().any(|e| matches!(e, Effect::ToClient { body, .. } if body["text"].as_str().unwrap_or("").contains("not a git repository"))));
    assert!(!t.hub.st.agents.contains_key("x"));
}

/// rows233B (desk-cut-15 m_31808): `sb spawn b --place a` while a's
/// worktree is still being made joins a's place: b gets no worktree of
/// its own (no `worktree_create` for b), no REPL before a's is made, then
/// a's path and branch; a's failure fails b too, with git's words.
#[test]
fn a_join_while_placing_waits_for_its_place() {
    for fails in [false, true] {
        let mut t = T::new();
        let spawn = |t: &mut T, name: &str, place: &str| {
            t.token += 1;
            let req = AgentReq::Spawn {
                name: name.into(),
                brief: Brief { objective: format!("objective of {}", name), ..Brief::default() },
                worktree: place == "new",
                with_changes: false,
                place: if place == "new" { String::new() } else { place.into() },
                feature: String::new(),
                ask: Default::default(),
                parts: String::new(),
            };
            // the hub alone: the shell's worker has not answered yet
            t.hub.handle(Input::Agent { token: t.token, from: MAIN.into(), req }, &mut t.env)
        };
        let creates = |fx: &[Effect]| fx.iter().filter(|e| matches!(e, Effect::Place(crate::place_job::Job::Create { .. }))).count();
        let fx = spawn(&mut t, "a", "new");
        assert_eq!(creates(&fx), 1, "{:?}", fx);
        assert!(t.hub.st.agents["a"].ws.placing());
        let fx = spawn(&mut t, "b", "a");
        assert_eq!(creates(&fx), 0, "b joins a's place, no worktree of its own: {:?}", fx);
        assert!(!fx.iter().any(|e| matches!(e, Effect::Spawn { agent, .. } if agent == "b")), "no REPL before placed: {:?}", fx);
        assert!(t.hub.st.agents["b"].ws.placing());
        if fails {
            let fx = t.go(Input::Placed { name: "a".into(), ws: Value::Null, err: "fatal: no space left".into() });
            for n in ["a", "b"] {
                let ag = &t.hub.st.agents[n];
                assert_eq!(ag.lifecycle, Lifecycle::Failed, "{n}: {:?}", ag.lifecycle);
                let told = format!("@{n} could not start: its worktree was not made: fatal: no space left");
                assert!(format!("{:?}", fx).contains(&told), "{told}: {:?}", fx);
            }
            assert!(t.env.dropped.is_empty());
            continue;
        }
        let made = crate::place_job::placed_now(&mut t.env, &Effect::Place(crate::place_job::Job::Create { name: "a".into(), with_changes: false })).unwrap();
        let fx = t.go(made);
        assert!(t.env.dropped.is_empty());
        let (wa, wb) = (t.hub.st.agents["a"].ws.clone(), t.hub.st.agents["b"].ws.clone());
        assert_eq!(wa, wb, "one place, the same ws");
        assert_eq!((wb.path.as_str(), wb.branch.as_deref(), wb.place.as_deref()), ("/state/worktrees/a", Some("sb/a"), Some("wt:a")));
        assert!(!wb.placing());
        for n in ["a", "b"] {
            assert!(fx.iter().any(|e| matches!(e, Effect::Spawn { agent, .. } if agent == n)), "{n} starts: {:?}", fx);
        }
        assert_eq!(t.hub.snapshot(0).places[0].agents, ["a", "b"]);
    }
}
