//! Where an agent works (BISE-136, wt-sign): `sb worktree`, the bash
//! fallback, and main, who always works in the workspace.

use super::*;

/// shared-guard: `sb spawn` with no place gives a task its own worktree in
/// a git repo (sb-core's spawn_wt); `--place shared` keeps it in the
/// shared folder; no git: the shared folder.
#[test]
fn a_spawn_with_no_place_gets_its_own_worktree() {
    let spawn = |t: &mut T, name: &str, place: &str| {
        let brief = Brief { objective: format!("objective of {}", name), ..Brief::default() };
        let ask = Default::default();
        t.req(MAIN, AgentReq::Spawn { name: name.into(), brief, worktree: false, with_changes: false, place: place.into(), feature: String::new(), ask, parts: String::new() });
        t.hub.st.agents[name].ws.mode.clone()
    };
    let mut t = T::new();
    t.env.git = true;
    assert_eq!(spawn(&mut t, "coder", ""), Mode::Worktree);
    assert_eq!(spawn(&mut t, "reader", "shared"), Mode::Shared);
    t.env.git = false;
    assert_eq!(spawn(&mut t, "plain", ""), Mode::Shared);
}

/// BISE-136: `sb worktree <path>` (gate.sh new) puts the private worktree
/// in the snapshot and `sb tasks`; `none` takes it back. Before any
/// `sb worktree`, a bash call that starts in a linked worktree (a `.git`
/// file) is the fallback; after one, the fallback no longer guesses.
#[test]
fn an_agent_says_where_it_works() {
    let mut t = T::new();
    t.spawn_task("docs");
    let place = |t: &mut T| {
        let snap = t.hub.snapshot(0);
        snap["agents"].as_array().unwrap().iter().find(|a| a["name"] == "docs").unwrap()["place"].clone()
    };
    assert!(place(&mut t).is_null());
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
    assert!(place(&mut t).is_null(), "not a linked worktree");
    let fx = bash(&mut t, &format!("cd {} && cargo test", wt));
    assert_eq!(place(&mut t), json!(wt));
    assert!(fx.contains(&Effect::State), "the views learn it");
    // wt-sign (Benjamin's 'ψ ven-bots' on main's line): main looking into
    // a task's worktree is no move; main works in the workspace
    t.go(Input::ReplLine { agent: MAIN.into(), line: format!("tool #2 bash : {}", json!({"arg": format!("cd {} && git log", wt)})) });
    let snap = t.hub.snapshot(0);
    let main = snap["agents"].as_array().unwrap().iter().find(|a| a["name"] == MAIN).unwrap().clone();
    assert!(main["place"].is_null() && main["place_id"] == "shared", "{main}");
    // told: the fallback stops guessing
    let (tok, fx) = t.req("docs", AgentReq::Worktree { path: "/tmp/docs-wt".into() });
    assert!(fx.contains(&Effect::Reply { token: tok, body: json!({"ok": true, "path": "/tmp/docs-wt"}) }), "{:?}", fx);
    assert_eq!(place(&mut t), json!("/tmp/docs-wt"));
    let (_, fx) = t.req(MAIN, AgentReq::Tasks);
    assert!(format!("{:?}", fx).contains("private worktree /tmp/docs-wt"), "{:?}", fx);
    bash(&mut t, &format!("cd {} && cargo test", wt));
    assert_eq!(place(&mut t), json!("/tmp/docs-wt"));
    // none: its own workspace again
    t.req("docs", AgentReq::Worktree { path: String::new() });
    assert!(place(&mut t).is_null());
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
