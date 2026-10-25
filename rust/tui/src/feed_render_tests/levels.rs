//! The three levels, folding and time marks (BISE-14, book §9, §10): moved out of
//! feed_render_tests.rs as is.

use super::*;

#[test]
fn a_run_of_twelve_folds() {
    let mut evs = vec![Ev::You("ship it".into(), Mark::Read, false, None)];
    evs.extend(traffic(12, 5, 0));
    let (mut events, mut cache) = arrive(evs);
    let rows = cached_text(&events, &mut cache, 100);
    let pulse = crate::theme::working_frame(0).0;
    assert_eq!(
        rows,
        vec!["│  ship it ✓✓".to_string(), String::new(), format!("▸ 12 messages between 5 agents {}", pulse)],
        "the whole run is one line, live"
    );
    // opened in place, in order, each line a chip; every line is a new
    // pair here, so a blank row between them (BISE-106)
    assert!(toggle_event(&mut events, &mut cache, 1));
    let rows = cached_text(&events, &mut cache, 100);
    assert_eq!(rows[2], format!("▾ 12 messages between 5 agents {}", pulse));
    assert_eq!(rows.len(), 3 + 12 * 2 + 11, "{rows:#?}");
    for (j, r) in rows[3..].iter().enumerate() {
        let k = j / 3;
        let want = match j % 3 {
            0 => chip_row(&format!("a{}", k % 5), &format!("a{}", (k + 1) % 5)),
            1 => under(&format!("message {}", k)),
            _ => String::new(),
        };
        assert_eq!(*r, want);
    }
    // three lines or fewer never fold
    let (events, mut cache) = arrive(traffic(3, 5, 0));
    assert_eq!(cached_text(&events, &mut cache, 100).iter().filter(|r| r.contains('→')).count(), 3);
}

#[test]
fn a_level_two_line_closes_the_run() {
    let mut evs = traffic(5, 3, 0);
    evs.push(to_you("docs", "the v2 docs are up."));
    evs.extend(traffic(2, 3, 5));
    let (mut events, mut cache) = arrive(evs);
    let rows = cached_text(&events, &mut cache, 100);
    assert_eq!(rows[0], "▸ 5 messages between 3 agents", "closed: no pulse");
    assert_eq!(rows[1], "");
    assert_eq!(rows[2], format!(" {} docs to you: the v2 docs are up.", crate::theme::G_MSG));
    assert_eq!(rows[3], "");
    // a2 → a0 then a0 → a1: two pairs, a blank row between
    assert_eq!(rows[4..9], [chip_row("a2", "a0"), under("message 5"), String::new(), chip_row("a0", "a1"), under("message 6")], "{rows:#?}");
    // the new run grows past three: it folds; the closed one stays
    for ev in traffic(2, 3, 7) {
        push_event(&mut events, &mut cache, ev);
    }
    let rows = cached_text(&events, &mut cache, 100);
    let pulse = crate::theme::working_frame(0).0;
    assert_eq!(rows[0], "▸ 5 messages between 3 agents");
    assert_eq!(rows[4], format!("▸ 4 messages between 3 agents {}", pulse));
    assert_eq!(rows.len(), 5, "{rows:#?}");
    // a main line (level 2) and a card (level 1) close it too
    for closer in [Ev::Assistant("done.".into()), Ev::Card { card: crate::wire::CardParts::of_line("#1 question @docs : v1 or v2?"), closed: String::new() }] {
        let mut evs = traffic(4, 3, 0);
        evs.push(closer);
        let (events, mut cache) = arrive(evs);
        assert_eq!(cached_text(&events, &mut cache, 100)[0], "▸ 4 messages between 3 agents");
    }
}

#[test]
fn a_closed_run_never_changes() {
    let mut evs = vec![Ev::You("go".into(), Mark::Read, false, None)];
    evs.extend(traffic(6, 4, 0));
    evs.push(Ev::Assistant("the agents agreed.".into()));
    let (mut events, mut cache) = arrive(evs);
    let before = cached_text(&events, &mut cache, 100);
    let n0 = events.len();
    // everything else arrives after it: more traffic, lines for you, tools
    let mut more = traffic(9, 7, 6);
    more.push(to_you("docs", "done"));
    more.push(Ev::Tool(tool_with(1, "bash", Some("ls"), Some((true, "a")), true)));
    more.extend(traffic(5, 2, 20));
    for ev in more {
        push_event(&mut events, &mut cache, ev);
    }
    let after = cached_text(&events, &mut cache, 100);
    assert_eq!(after[..before.len()], before[..], "cached");
    let fresh = feed_text(&events[..], 100);
    assert_eq!(fresh[..before.len()], before[..], "rebuilt");
    let rebuilt: Vec<String> = feed_text(&events[..n0], 100);
    assert_eq!(rebuilt, before);
}

#[test]
fn arrival_order_holds_with_many_agents() {
    // 30 agents talk over each other, lines for you in between: nothing
    // is grouped by agent, nothing moves
    let names: Vec<String> = (0..30).map(|k| format!("ep-{}", k)).collect();
    let mut evs = Vec::new();
    let mut want = Vec::new();
    for m in 0..120 {
        if m % 40 == 39 {
            evs.push(to_you(&names[m % 30], &format!("for you {}", m)));
            want.push(format!("for you {}", m));
        } else {
            evs.push(l3(&names[(m * 7) % 30], &names[(m * 11 + 3) % 30], &format!("line {}", m)));
            want.push(format!("line {}", m));
        }
    }
    let (mut events, mut cache) = arrive(evs);
    set_everything(&mut events, &mut cache, true);
    let rows = cached_text(&events, &mut cache, 100);
    let got: Vec<String> = rows
        .iter()
        .filter_map(|r| r.find("line ").or_else(|| r.find("for you ")).map(|k| r[k..].to_string()))
        .collect();
    assert_eq!(got, want);
    // the folds say how many lines and agents each run holds
    let folds: Vec<&String> = rows.iter().filter(|r| r.contains("messages between")).collect();
    assert_eq!(folds.len(), 3, "{folds:#?}");
    assert!(folds[0].contains("▾ 39 messages between 30 agents"), "{folds:#?}");
    // closed again: one line per run
    set_everything(&mut events, &mut cache, false);
    assert!(!anything_closed(&[]));
    assert!(anything_closed(&events));
    let rows = cached_text(&events, &mut cache, 100);
    assert_eq!(rows.iter().filter(|r| r.contains("line ")).count(), 0, "{rows:#?}");
}

#[test]
fn time_marks_after_a_pause() {
    let (mut events, mut cache) = arrive(vec![]);
    let at = || "14:31".to_string();
    // not at the top of a feed
    assert!(!pause_mark(&mut events, &mut cache, PAUSE_MS * 2, at));
    push_event(&mut events, &mut cache, Ev::You("hi".into(), Mark::Read, false, None));
    // a short pause: nothing
    assert!(!pause_mark(&mut events, &mut cache, PAUSE_MS - 1, at));
    assert!(pause_mark(&mut events, &mut cache, PAUSE_MS, at));
    // never two in a row
    assert!(!pause_mark(&mut events, &mut cache, PAUSE_MS, at));
    push_event(&mut events, &mut cache, Ev::Assistant("back".into()));
    let rows = cached_text(&events, &mut cache, 100);
    assert_eq!(rows, vec!["│  hi ✓✓", "", " · 14:31 ·", "", " back"], "{rows:#?}");
    // a mark ends a run of level 3: the run after it counts apart
    let mut evs = traffic(4, 2, 0);
    evs.push(Ev::TimeMark("15:02".into()));
    evs.extend(traffic(4, 2, 4));
    let (events, mut cache) = arrive(evs);
    let rows = cached_text(&events, &mut cache, 100);
    assert_eq!(rows[0], "▸ 4 messages between 2 agents");
    assert_eq!(rows[2], " · 15:02 ·");
    assert!(rows[4].starts_with("▸ 4 messages between 2 agents "));
    assert!(local_hhmm().len() == 5 && local_hhmm().as_bytes()[2] == b':');
}

#[test]
fn level_two_and_answered_lines() {
    let why = Ev::Answered {
        agent: "docs".into(),
        question: "v1 or v2?".into(),
        answer: "v2".into(),
        why: "the brief says v2.".into(),
        open: false,
    };
    let (mut events, mut cache) = arrive(vec![to_you("docs", "the examples use v2."), why]);
    let rows = cached_text(&events, &mut cache, 100);
    assert_eq!(rows, vec![" @ docs to you: the examples use v2.", "", " :* docs asked: v1 or v2? · i answered: v2 ▸ why"]);
    assert!(toggle_event(&mut events, &mut cache, 1));
    let rows = cached_text(&events, &mut cache, 100);
    assert_eq!(rows[2..], [" :* docs asked: v1 or v2? · i answered: v2 ▾ why", " │ the brief says v2."]);
    // a long level-3 message: 2 rows, `… ▸`; open, its whole text,
    // hung under its first column, `▾` at the end (BISE-106)
    let long = format!("heads-up: {}", "i'm touching web/src/auth ".repeat(8));
    let (mut events, mut cache) = arrive(vec![l3("auth-fix", "release", &long)]);
    let rows = cached_text(&events, &mut cache, 100);
    // BISE-127: the chip alone, the text under it at x0+2
    let hang = "  ";
    assert_eq!(rows.len(), 3, "{rows:#?}");
    assert_eq!(rows[0], chip_row("auth-fix", "release"));
    assert!(rows[1].starts_with("  heads-up") && rows[2].starts_with(hang), "{rows:#?}");
    assert!(!rows[2][hang.len()..].starts_with(' '), "the text starts at x0+2: {rows:#?}");
    assert!(rows[2].ends_with("… ▸"), "{rows:#?}");
    assert!(rows.iter().all(|r| r.width() <= CODE_MAX), "{rows:#?}");
    assert!(toggle_event(&mut events, &mut cache, 0));
    let rows = cached_text(&events, &mut cache, 100);
    assert!(rows.len() > 2 && rows[1..].iter().all(|r| r.starts_with(hang)), "{rows:#?}");
    assert!(rows.last().unwrap().ends_with("auth ▾") && !rows.iter().any(|r| r.contains('…')), "{rows:#?}");
}

#[test]
fn the_first_line_of_an_open_fold_toggles_by_row() {
    let long = format!("heads-up: {}", "x ".repeat(40));
    let mut evs = vec![Ev::You("go".into(), Mark::Read, false, None), l3("a", "b", &long)];
    evs.extend(traffic(4, 3, 0));
    let (mut events, mut cache) = arrive(evs);
    // row 1 (after the gap) is the fold line
    assert!(toggle_at(&mut events, &mut cache, 1, 1));
    assert!(matches!(events[1], Ev::AgentMsg { fold: true, open: false, .. }));
    // row 2 is its message: that opens the message
    assert!(toggle_at(&mut events, &mut cache, 1, 2));
    assert!(matches!(events[1], Ev::AgentMsg { fold: true, open: true, .. }));
    assert!(toggle_at(&mut events, &mut cache, 1, 1));
    assert!(matches!(events[1], Ev::AgentMsg { fold: false, .. }));
}

/// Mockup "what's for you, what isn't" (tui-screens.html).
#[test]
fn whats_for_you_matches_the_mockup() {
    let evs = vec![
        Ev::You("the login breaks on safari. and the api docs, v2 please.".into(), Mark::Read, false, None),
        Ev::Assistant("on it: auth-fix takes safari, docs takes the api docs.".into()),
        l3("docs", "main", "v1 or v2 for the examples?"),
        l3("main", "docs", "v2, the brief says so."),
        Ev::Answered { agent: "docs".into(), question: "v1 or v2 for the examples?".into(), answer: "v2".into(), why: "the brief says v2.".into(), open: false },
        l3("auth-fix", "release", "heads-up, i'm touching web/src/auth."),
        l3("release", "auth-fix", "ok, i'll mention the fix."),
        l3("bench", "main", "✓ done. p95 180 ms, 3 runs."),
        Ev::AgentMsg { from: "bench".into(), to: String::new(), text: "[report: done] p95 at 180 ms, nothing to fix.\nran it 3 times".into(), level: 3, id: String::new(), parts: Vec::new(), open: false, fold: false },
        l3("api-v2", "main", "? i need the v2 schema file, it isn't in the repo."),
        Ev::Card { card: crate::wire::CardParts::of_line("#4 question @api-v2 : the v2 schema file isn't in the repo. where is it?"), closed: String::new() },
    ];
    let (events, mut cache) = arrive(evs);
    let rows = cached_text(&events, &mut cache, 100);
    println!("{}", rows.join("\n"));
    let want: [&str; 23] = [
        "│  the login breaks on safari. and the api docs, v2 please. ✓✓",
        "",
        " on it: auth-fix takes safari, docs takes the api docs.",
        "",
        &chip_row("docs", "main"),
        &under("v1 or v2 for the examples?"),
        &chip_row("main", "docs"),
        &under("v2, the brief says so."),
        "",
        " :* docs asked: v1 or v2 for the examples? · i answered: v2 ▸ why",
        "",
        &chip_row("auth-fix", "release"),
        &under("heads-up, i'm touching web/src/auth."),
        &chip_row("release", "auth-fix"),
        &under("ok, i'll mention the fix."),
        "",
        &chip_row("bench", "main"),
        &under("✓ done. p95 180 ms, 3 runs."),
        "",
        " ✓ bench: p95 at 180 ms, nothing to fix. ▸ report",
        "",
        &chip_row("api-v2", "main"),
        &under("? i need the v2 schema file, it isn't in the repo."),
    ];
    assert_eq!(rows[..want.len()], want[..], "{rows:#?}");
    assert!(rows[want.len()..].iter().any(|r| r.contains("api-v2 needs you")), "{rows:#?}");
}

/// Mockup "a busy hour, 30 agents" (tui-screens.html).
#[test]
fn a_busy_hour_matches_the_mockup() {
    let mut evs = vec![
        Ev::TimeMark("14:02".into()),
        Ev::You("ship the v2 api: endpoints, docs, sdk, migration, the lot.".into(), Mark::Read, false, None),
        Ev::Assistant("that's 30 pieces. i split it: 12 endpoints, 8 sdk, 6 docs, 4 migration. starting them.".into()),
    ];
    evs.extend(traffic(47, 30, 0));
    evs.push(Ev::Assistant("the 12 endpoint agents agreed on one error format; i picked it for the sdk agents too.".into()));
    evs.extend(traffic(23, 9, 100));
    evs.push(Ev::AgentMsg { from: "ep-users".into(), to: String::new(), text: "[report: done] 4 endpoints are done: users, orgs, keys, audit.\nmore".into(), level: 3, id: String::new(), parts: Vec::new(), open: false, fold: false });
    evs.extend([
        l3("sdk-py", "sdk-ts", "same pagination shape as you?"),
        l3("sdk-ts", "sdk-py", "yes: cursor + limit, max 200."),
        l3("mig-db", "main", "? drop the v1 tables now or after a release?"),
        l3("main", "mig-db", "asking the user."),
        l3("docs-auth", "ep-keys", "heads-up, i'm quoting your error codes."),
    ]);
    let opened = evs.len() - 5;
    evs.push(Ev::Card { card: crate::wire::CardParts::of_line("#7 question @mig-db : drop the v1 tables now, or keep them one release?"), closed: String::new() });
    evs.push(Ev::TimeMark("14:31".into()));
    evs.extend(traffic(12, 6, 200));
    let (mut events, mut cache) = arrive(evs);
    assert!(toggle_event(&mut events, &mut cache, opened));
    let rows = cached_text(&events, &mut cache, 100);
    println!("{}", rows.join("\n"));
    let pulse = crate::theme::working_frame(0).0;
    let want = [
        " · 14:02 ·".to_string(),
        "".into(),
        "│  ship the v2 api: endpoints, docs, sdk, migration, the lot. ✓✓".into(),
        "".into(),
        " that's 30 pieces. i split it: 12 endpoints, 8 sdk, 6 docs, 4 migration. starting them.".into(),
        "".into(),
        "▸ 47 messages between 30 agents".into(),
        "".into(),
        " the 12 endpoint agents agreed on one error format; i picked it for the sdk agents too.".into(),
        "".into(),
        "▸ 23 messages between 9 agents".into(),
        "".into(),
        " ✓ ep-users: 4 endpoints are done: users, orgs, keys, audit. ▸ report".into(),
        "".into(),
        "▾ 5 messages between 6 agents".into(),
        chip_row("sdk-py", "sdk-ts"),
        under("same pagination shape as you?"),
        chip_row("sdk-ts", "sdk-py"),
        under("yes: cursor + limit, max 200."),
        "".into(),
        chip_row("mig-db", "main"),
        under("? drop the v1 tables now or after a release?"),
        chip_row("main", "mig-db"),
        under("asking the user."),
        "".into(),
        chip_row("docs-auth", "ep-keys"),
        under("heads-up, i'm quoting your error codes."),
    ];
    assert_eq!(rows[..want.len()], want[..], "{rows:#?}");
    let tail: Vec<&String> = rows[want.len()..].iter().collect();
    assert!(tail.iter().any(|r| r.contains("mig-db needs you")), "{rows:#?}");
    assert_eq!(tail[tail.len() - 3..], [&" · 14:31 ·".to_string(), &String::new(), &format!("▸ 12 messages between 6 agents {}", pulse)]);
}
