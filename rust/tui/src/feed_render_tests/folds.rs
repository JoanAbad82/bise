//! A call in main is one row, a run of edits folds, a long message of yours folds
//! (BISE-223, BISE-304, BISE-239): moved out of feed_render_tests.rs as is.

use super::*;

// ---- BISE-223: a call in main is one row (the model's description) ----

/// The wire lines of one call: started, its code and intent, its result
/// and its end (`ok`: None while it runs).
fn call_lines(id: u32, name: &str, code: &str, intent: Option<&str>, done: Option<(bool, &str)>) -> Vec<String> {
    let mut l = vec![format!("  obs: tool_started #{id}"), format!("tool #{id} {name} : x"), format!("tool_code #{id} : {}", wire_encode(code))];
    if let Some(d) = intent {
        l.push(format!("tool_intent #{id} : {d}"));
    }
    if let Some((ok, out)) = done {
        l.push(format!("tool_result #{id} {} : {out}", if ok { "ok" } else { "fail" }));
        l.push(format!("  obs: tool_finished #{id} {}", if ok { "ok" } else { "failed" }));
    }
    l
}

fn feed_of(lines: &[String]) -> (Vec<Ev>, Vec<Option<EventRows>>) {
    let mut events: Vec<Ev> = Vec::new();
    let mut cache: Vec<Option<EventRows>> = Vec::new();
    for l in lines {
        if let Some(ev) = parse_line(l) {
            push_event(&mut events, &mut cache, ev);
        }
    }
    (events, cache)
}

/// The rows of a feed, trimmed, the elapsed times masked (`0.0s` → `T`).
fn main_text(events: &[Ev], width: usize) -> Vec<String> {
    let re = |s: String| {
        let mut out = String::new();
        let mut rest = s.as_str();
        while let Some(p) = rest.find(|c: char| c.is_ascii_digit()) {
            let tail = &rest[p..];
            let n = tail.find(|c: char| !(c.is_ascii_digit() || c == '.')).unwrap_or(tail.len());
            if tail[n..].starts_with('s') && !rest[..p].ends_with("exit ") {
                out.push_str(&rest[..p]);
                out.push('T');
                rest = &tail[n + 1..];
            } else {
                out.push_str(&rest[..p + n]);
                rest = &tail[n..];
            }
        }
        out.push_str(rest);
        out
    };
    feed_text(events, width).into_iter().map(re).collect()
}

#[test]
fn a_call_in_main_is_one_row_with_its_description() {
    crate::render::set_main_feed(true);
    let mut lines = call_lines(1, "bash", "git log --oneline -5", Some("checking what changed in signup"), Some((true, "a91c2e0 hero")));
    lines.extend(call_lines(2, "run_typescript", "{\"code\":\"return 1\"}", Some("looking for timeouts in Sentry"), Some((true, "1"))));
    lines.extend(call_lines(3, "bash", "python3 repro.py", Some("reproducing the crash"), Some((false, "exit 1: Traceback (most recent call last):   File x UnicodeDecodeError: 'latin-1' codec can't decode"))));
    lines.extend(call_lines(4, "bash", "npm test", Some("running the export tests"), None));
    let (events, _) = feed_of(&lines);
    let rows = main_text(&events, 60);
    crate::render::set_main_feed(false);
    assert_eq!(
        rows,
        vec![
            " $ checking what changed in signup                    ✓ T",
            " ƒ looking for timeouts in Sentry                     ✓ T",
            " $ reproducing the crash                     ✗ exit 1 · T",
            "   UnicodeDecodeError: 'latin-1' codec can't decode",
            " $ running the export tests                           ∿ T",
        ]
    );
}

#[test]
fn a_row_without_description_shows_the_first_line_and_cuts_long_text() {
    crate::render::set_main_feed(true);
    let mut lines = call_lines(1, "bash", "\n  grep -rn latin api/\nls", None, Some((true, "x")));
    let long = "checking whether any customer exports still expect latin-1 before we switch";
    lines.extend(call_lines(2, "bash", "true", Some(long), Some((true, ""))));
    let (events, _) = feed_of(&lines);
    let rows = main_text(&events, 50);
    crate::render::set_main_feed(false);
    assert_eq!(rows[0], " $ grep -rn latin api/                      ✓ T");
    assert!(rows[1].starts_with(" $ checking whether any customer exports s…"), "{rows:#?}");
    assert!(rows[1].ends_with("✓ T"), "{rows:#?}");
}

#[test]
fn four_done_calls_fold_and_the_failed_and_running_keep_their_rows() {
    crate::render::set_main_feed(true);
    let mut lines = Vec::new();
    for id in 1..=3 {
        lines.extend(call_lines(id, "bash", "ls", Some(&format!("step {id}")), Some((true, "ok"))));
    }
    lines.extend(call_lines(4, "bash", "make docs", Some("building the docs"), Some((false, "exit 2: broken link: docs/dark.png"))));
    lines.extend(call_lines(5, "bash", "ls", Some("step 5"), Some((true, "ok"))));
    lines.extend(call_lines(6, "run_typescript", "{\"code\":\"x\"}", Some("asking GitHub"), None));
    let (mut events, mut cache) = feed_of(&lines);
    let rows = main_text(&events, 60);
    assert_eq!(
        rows,
        vec![
            " $ ▸ 4 commands · step 1                              ✓ T",
            " $ building the docs                         ✗ exit 2 · T",
            "   broken link: docs/dark.png",
            " ƒ asking GitHub                                      ∿ T",
        ]
    );
    // a click on the fold: the rows come back, in place
    assert!(toggle_event(&mut events, &mut cache, 0));
    let open = main_text(&events, 60);
    assert_eq!(open[0], " $ ▾ 4 commands · step 1                              ✓ T");
    assert_eq!(open[1], " $ step 1                                             ✓ T");
    assert_eq!(open.len(), 8, "{open:#?}");
    crate::render::set_main_feed(false);
}

#[test]
fn a_click_opens_one_box_and_ctrl_o_opens_every_box_then_back_to_rows() {
    crate::render::set_main_feed(true);
    let mut lines = call_lines(1, "bash", "du -h hero.png", Some("weighing the hero image"), Some((true, "4.2M  hero.png")));
    lines.extend(call_lines(2, "bash", "ls", Some("listing"), Some((true, "a"))));
    let (mut events, mut cache) = feed_of(&lines);
    assert!(toggle_event(&mut events, &mut cache, 0));
    let one = main_text(&events, 60);
    assert!(one[0].starts_with("╭─ $ weighing the hero image ✓ T ─"), "{one:#?}");
    assert!(one.iter().any(|r| r.starts_with("│ du -h hero.png")), "{one:#?}");
    assert_eq!(one.last().unwrap(), " $ listing                                            ✓ T");
    // ctrl+o: every box; again: every row
    assert!(anything_closed(&events));
    set_everything(&mut events, &mut cache, true);
    let all = main_text(&events, 60);
    assert_eq!(all.iter().filter(|r| r.starts_with("╭─ $ ")).count(), 2, "{all:#?}");
    assert!(!anything_closed(&events));
    set_everything(&mut events, &mut cache, false);
    let rows = main_text(&events, 60);
    assert_eq!(rows.len(), 2, "{rows:#?}");
    crate::render::set_main_feed(false);
}

#[test]
fn an_agent_view_shows_rows_and_ctrl_o_opens_the_boxes() {
    // BISE-223: an agent's view draws its calls as rows, as main does
    crate::render::set_main_feed(false);
    let mut lines = call_lines(1, "run_typescript", "{\"code\":\"return 1\"}", Some("looking for timeouts"), Some((true, "1")));
    lines.extend(call_lines(2, "bash", "ls", None, Some((true, "a"))));
    let (mut events, mut cache) = feed_of(&lines);
    let rows = main_text(&events, 60);
    assert_eq!(
        rows,
        vec![
            " ƒ looking for timeouts                               ✓ T",
            " $ ls                                                 ✓ T",
        ]
    );
    // ctrl+o: every box, the description as title (no description: the
    // kind's word); again: every row
    assert!(anything_closed(&events));
    set_everything(&mut events, &mut cache, true);
    let all = main_text(&events, 60);
    assert!(all[0].starts_with("╭─ ƒ looking for timeouts ✓ T ─"), "{all:#?}");
    assert!(all.iter().any(|r| r.starts_with("╭─ $ bash ✓ T ─")), "{all:#?}");
    assert!(!anything_closed(&events));
    set_everything(&mut events, &mut cache, false);
    assert_eq!(main_text(&events, 60), rows);
    // a click (space) opens one
    assert!(toggle_event(&mut events, &mut cache, 0));
    let one = main_text(&events, 60);
    assert!(one[0].starts_with("╭─ ƒ looking for timeouts ✓ T ─"), "{one:#?}");
    assert_eq!(one.last().unwrap(), &rows[1]);
}

#[test]
fn an_agent_view_folds_four_done_calls() {
    crate::render::set_main_feed(false);
    let mut lines = Vec::new();
    for n in 1..=4 {
        lines.extend(call_lines(n, "bash", "true", Some(&format!("step {n}")), Some((true, "ok"))));
    }
    let (events, _) = feed_of(&lines);
    let rows = main_text(&events, 60);
    assert_eq!(rows, vec![" $ ▸ 4 commands · step 1                              ✓ T"], "{rows:#?}");
}

#[test]
fn the_ascii_rows() {
    crate::theme::set_ascii_for_tests(true);
    crate::render::set_main_feed(true);
    let mut lines = call_lines(1, "run_typescript", "{\"code\":\"x\"}", Some("looking"), Some((true, "1")));
    lines.extend(call_lines(2, "bash", "false", Some("failing"), Some((false, "exit 1: Error: boom"))));
    lines.extend(call_lines(3, "bash", "sleep 9", Some("waiting"), None));
    let (events, _) = feed_of(&lines);
    let rows = main_text(&events, 40);
    crate::render::set_main_feed(false);
    crate::theme::set_ascii_for_tests(false);
    assert_eq!(
        rows,
        vec![
            " f looking                       ok T",
            " $ failing               x exit 1 · T",
            "   Error: boom",
            " $ waiting                        ~ T",
        ]
    );
}

// ---- BISE-304: a run of edits folds into one row ----

/// An edit call's wire lines: its patch (`+` adds, `-` removes).
fn edit_lines(id: u32, name: &str, path: &str, adds: usize, dels: usize, done: Option<(bool, &str)>) -> Vec<String> {
    let mut p = format!("*** Begin Patch
*** Update File: {path}
@@
");
    p.push_str(&"-old
".repeat(dels));
    p.push_str(&"+new
".repeat(adds));
    p.push_str("*** End Patch
");
    call_lines(id, name, &p, None, done)
}

#[test]
fn three_done_edits_fold_and_the_failed_one_keeps_its_row() {
    let mut lines = edit_lines(1, "write_file", "src/auth/session.ts", 3, 0, Some((true, "ok")));
    lines.extend(edit_lines(2, "edit", "src/auth/token.ts", 1, 1, Some((true, "ok"))));
    lines.extend(edit_lines(3, "edit", "src/auth/nope.ts", 1, 1, Some((false, "File does not exist"))));
    lines.extend(edit_lines(4, "edit", "src/auth/session.ts", 1, 1, Some((true, "ok"))));
    lines.extend(edit_lines(5, "apply_patch", "README.md", 2, 0, Some((true, "ok"))));
    let (mut events, mut cache) = feed_of(&lines);
    let rows = main_text(&events, 70);
    assert_eq!(
        rows,
        vec![
            " ± ▸ 3 files · session.ts, token.ts, README.md                 ✓ +7 −2",
            " ± edit src/auth/nope.ts ✗ File does not exist ▸",
        ],
        "{rows:#?}"
    );
    // a click: the rows come back in place, each still opens its diff
    assert!(toggle_event(&mut events, &mut cache, 0));
    let open = main_text(&events, 70);
    assert_eq!(open[0], " ± ▾ 3 files · session.ts, token.ts, README.md                 ✓ +7 −2");
    assert_eq!(open[1], " ± write src/auth/session.ts ✓ +3 ▸");
    assert_eq!(open.len(), 6, "{open:#?}");
    // ctrl+o: the fold and every diff; again: all closed
    set_everything(&mut events, &mut cache, false);
    assert_eq!(main_text(&events, 70), rows);
    set_everything(&mut events, &mut cache, true);
    let all = main_text(&events, 70);
    assert!(all[0].starts_with(" ± ▾ 3 files"), "{all:#?}");
    assert!(all.iter().any(|r| r.contains("+new")), "{all:#?}");
}

#[test]
fn two_edits_stay_rows_and_a_command_ends_the_run() {
    let mut lines = edit_lines(1, "edit", "a.ts", 1, 0, Some((true, "ok")));
    lines.extend(edit_lines(2, "edit", "b.ts", 1, 0, Some((true, "ok"))));
    lines.extend(call_lines(3, "bash", "ls", Some("checking"), Some((true, "ok"))));
    lines.extend(edit_lines(4, "edit", "c.ts", 1, 0, Some((true, "ok"))));
    lines.extend(edit_lines(5, "edit", "d.ts", 1, 0, None));
    let (events, _) = feed_of(&lines);
    let rows = main_text(&events, 60);
    assert_eq!(rows.len(), 5, "{rows:#?}");
    assert!(rows.iter().all(|r| !r.contains("files ·")), "{rows:#?}");
}

#[test]
fn one_file_counts_the_edits_and_names_fit_whole() {
    let mut lines = Vec::new();
    for id in 1..=4 {
        lines.extend(edit_lines(id, "edit", "web/src/auth/session.ts", 2, 1, Some((true, "ok"))));
    }
    let (events, _) = feed_of(&lines);
    assert_eq!(main_text(&events, 60), vec![" ± ▸ 4 edits · session.ts                            ✓ +8 −4"]);
    // many files: whole names, then `+n more`; a basename twice gets its parent
    let names = ["auth/index.ts", "ui/index.ts", "router.ts", "store.ts", "theme.ts"];
    let mut lines = Vec::new();
    for (id, p) in names.iter().enumerate() {
        lines.extend(edit_lines(id as u32 + 1, "edit", p, 1, 0, Some((true, "ok"))));
    }
    let (events, _) = feed_of(&lines);
    assert_eq!(main_text(&events, 60), vec![" ± ▸ 5 files · auth/index.ts, ui/index.ts +3 more       ✓ +5"]);
    // not even one name fits: it is cut
    assert_eq!(main_text(&events, 30), vec![" ± ▸ 5 files · a… +4 more ✓ +5"]);
}

#[test]
fn the_ascii_edits_fold() {
    crate::theme::set_ascii_for_tests(true);
    let mut lines = Vec::new();
    for (id, p) in ["a.ts", "b.ts", "c.ts"].iter().enumerate() {
        lines.extend(edit_lines(id as u32 + 1, "edit", p, 1, 1, Some((true, "ok"))));
    }
    let (events, _) = feed_of(&lines);
    let rows = main_text(&events, 50);
    crate::theme::set_ascii_for_tests(false);
    assert_eq!(rows, vec![" % > 3 files · a.ts, b.ts, c.ts           ok +3 -3"]);
}

// ---- a long message of yours folds (BISE-239) ----

#[test]
fn a_long_message_of_yours_folds_to_twenty_rows_and_its_hint() {
    let text = (1..=30).map(|n| format!("line {n}")).collect::<Vec<_>>().join("\n");
    let (mut events, mut cache) = arrive(vec![Ev::You(text.into(), Mark::Read, false, None)]);
    let rows = cached_text(&events, &mut cache, 60);
    let body: Vec<&String> = rows.iter().filter(|r| !r.trim().is_empty()).collect();
    // 20 rows of text (BISE-262; 12 before, 8 at first), then the hint
    // on its own row, the bar through it
    assert_eq!(body.len(), YOU_ROWS + 1, "{rows:#?}");
    assert_eq!(body[0].as_str(), "│  line 1", "{rows:#?}");
    assert_eq!(body[19].as_str(), "│  line 20", "{rows:#?}");
    assert_eq!(body[20].as_str(), "│  ▸ 10 more lines ✓✓", "{rows:#?}");
    assert!(crate::feed::is_closed_at(&events, 0) && crate::feed::anything_closed(&events));
    // ctrl+o opens it whole, `▾` after its last line; again folds it
    crate::feed::set_everything(&mut events, &mut cache, true);
    let open = cached_text(&events, &mut cache, 60);
    assert!(open.iter().any(|r| r == "│  line 30 ▾ ✓✓") && !open.iter().any(|r| r.contains("more line")), "{open:#?}");
    assert_eq!(open.iter().filter(|r| r.starts_with("│  line")).count(), 30);
    crate::feed::set_everything(&mut events, &mut cache, false);
    assert!(cached_text(&events, &mut cache, 60).iter().any(|r| r.contains("▸ 10 more lines")));
}

#[test]
fn a_line_cut_to_fit_counts_as_hidden() {
    // 19 short lines then one that wraps over rows 20-22: rows 1-20
    // show, the 20th line is cut, so 1 more line (and the 2 after it: 3)
    let mut lines: Vec<String> = (1..=19).map(|n| format!("l{n}")).collect();
    lines.push("word ".repeat(30));
    lines.push("a".into());
    lines.push("b".into());
    let (events, mut cache) = arrive(vec![Ev::You(lines.join("\n").into(), Mark::Read, false, None)]);
    let rows = cached_text(&events, &mut cache, 60);
    let body: Vec<&String> = rows.iter().filter(|r| !r.trim().is_empty()).collect();
    assert_eq!(body.len(), YOU_ROWS + 1, "{rows:#?}");
    assert!(body[19].starts_with("│  word"), "{rows:#?}");
    assert_eq!(body[20].as_str(), "│  ▸ 3 more lines ✓✓", "{rows:#?}");
}

#[test]
fn a_short_message_of_yours_stays_whole() {
    let text = (1..=20).map(|n| format!("line {n}")).collect::<Vec<_>>().join("\n");
    let (events, mut cache) = arrive(vec![Ev::You(text.into(), Mark::Read, false, None)]);
    let rows = cached_text(&events, &mut cache, 60);
    assert_eq!(rows.iter().filter(|r| r.starts_with("│  line")).count(), 20, "{rows:#?}");
    assert!(rows.iter().any(|r| r == "│  line 20 ✓✓") && !rows.iter().any(|r| r.contains("more line") || r.contains('▾')), "{rows:#?}");
    assert!(!crate::feed::discloses(&events[0]) && !crate::feed::anything_closed(&events));
}

#[test]
fn a_click_on_the_hint_row_opens_just_that_message() {
    let long = (1..=24).map(|n| format!("line {n}")).collect::<Vec<_>>().join("\n");
    let (mut events, mut cache) = arrive(vec![Ev::You(long.clone().into(), Mark::Read, false, None), Ev::You(long.into(), Mark::Read, false, None)]);
    let rows = cached_text(&events, &mut cache, 60);
    let n = cache[1].as_ref().unwrap().rows.len();
    assert!(rows.iter().filter(|r| r.contains("▸ 4 more lines")).count() == 2, "{rows:#?}");
    // a click on a text row does nothing; on the hint row it opens
    assert!(!toggle_at(&mut events, &mut cache, 1, n - 3));
    assert!(matches!(events[1], Ev::You(_, _, false, _)));
    assert!(toggle_at(&mut events, &mut cache, 1, n - 1));
    assert!(matches!(events[1], Ev::You(_, _, true, _)) && matches!(events[0], Ev::You(_, _, false, _)));
    // open: its last row (the `▾` one) folds it again
    let _ = cached_text(&events, &mut cache, 60);
    let n = cache[1].as_ref().unwrap().rows.len();
    assert!(toggle_at(&mut events, &mut cache, 1, n - 1));
    assert!(matches!(events[1], Ev::You(_, _, false, _)));
}

/// A long message of yours with a few screenshots: the sizes of its
/// images wrap to several rows under the hint row; a click on the hint
/// still opens it (the click took the sizes for one row and missed it),
/// the sizes rows stay inert, the `▾` row folds it again.
#[test]
fn a_click_on_the_hint_opens_a_message_whose_image_sizes_wrap() {
    let shot = |n: u32| format!("<image name=\"[Image #{n}]\" path=\"/shots/Screenshot 2026-10-02 at 11.3{n}.59.png\" mime=\"image/png\" b64=\"/nowhere/{n}.b64\">");
    let long = (1..=24).map(|n| format!("{n}. {} line {n}", shot(n % 6))).collect::<Vec<_>>().join("\n");
    let (mut events, mut cache) = arrive(vec![Ev::You(long.into(), Mark::Read, false, None)]);
    let rows = cached_text(&events, &mut cache, 60);
    let n = cache[0].as_ref().unwrap().rows.len();
    let hint = rows.iter().position(|r| r.contains("▸") && r.contains("more lines")).expect("a hint row");
    let sizes = rows.len() - 1 - hint;
    assert!(sizes >= 3, "the sizes wrap: {rows:#?}");
    assert!(rows[hint + 1..].iter().all(|r| r.starts_with("│  ") && r.contains("Screenshot")), "{rows:#?}");
    let hint = hint - (rows.len() - n);
    // the sizes rows and the text rows: nothing; the hint row: opens
    for r in (hint + 1..n).chain([hint - 1]) {
        assert!(!crate::feed::toggles_at(&events, &cache, 0, r) && !toggle_at(&mut events, &mut cache, 0, r), "row {r}");
    }
    assert!(matches!(events[0], Ev::You(_, _, false, _)));
    assert!(crate::feed::toggles_at(&events, &cache, 0, hint));
    assert!(toggle_at(&mut events, &mut cache, 0, hint));
    assert!(matches!(events[0], Ev::You(_, _, true, _)));
    // open: the `▾` row (its last line, above the sizes) folds it again
    let rows = cached_text(&events, &mut cache, 60);
    let n = cache[0].as_ref().unwrap().rows.len();
    let open = rows.iter().position(|r| r.contains("line 24") && r.contains('▾')).expect("the ▾ row") - (rows.len() - n);
    assert!(!toggle_at(&mut events, &mut cache, 0, n - 1));
    assert!(toggle_at(&mut events, &mut cache, 0, open));
    assert!(matches!(events[0], Ev::You(_, _, false, _)));
}

/// BISE-240: a long paste in your message is its chip in the line and
/// one dim row under it; a click on that row (or ctrl+o) opens the
/// message and shows the full text there, never by default.
#[test]
fn a_long_paste_in_your_message_is_a_chip_and_opens_like_a_fold() {
    let body: String = (1..=40).map(|n| format!("row {n}\n")).collect();
    let msg = format!("see {} ok", crate::pasted::tag(1, body.trim_end()));
    let (mut events, mut cache) = arrive(vec![Ev::You(msg.into(), Mark::Read, false, None)]);
    assert!(crate::feed::discloses(&events[0]) && crate::feed::anything_closed(&events));
    let rows = cached_text(&events, &mut cache, 80);
    let mine: Vec<&String> = rows.iter().filter(|r| r.starts_with('│')).collect();
    assert_eq!(mine.len(), 2, "{rows:#?}");
    assert_eq!(mine[0].as_str(), "│  see ▤ 1 ok ✓✓", "{rows:#?}");
    assert!(mine[1].starts_with("│  ▤ 1 “row 1 row 2") && mine[1].ends_with("” · 40 lines"), "{rows:#?}");
    assert!(!rows.iter().any(|r| r.contains("row 40")), "{rows:#?}");
    // a click on the paste row opens it: the full text under the line
    let n = cache[0].as_ref().unwrap().rows.len();
    assert!(toggle_at(&mut events, &mut cache, 0, n - 1));
    assert!(matches!(events[0], Ev::You(_, _, true, _)));
    let rows = cached_text(&events, &mut cache, 80);
    assert!(rows.iter().any(|r| r == "│  ▤ 1 · 40 lines"), "{rows:#?}");
    assert!(rows.iter().any(|r| r == "│  row 40"), "{rows:#?}");
    // its last row closes it again
    let n = cache[0].as_ref().unwrap().rows.len();
    assert!(toggle_at(&mut events, &mut cache, 0, n - 1));
    assert!(matches!(events[0], Ev::You(_, _, false, _)));
}

/// A skill call as the wire brings it: `{"name":"<skill>"}`, then its
/// result (`None`: still running).
fn skill_call(id: u32, skill: &str, result: Option<(bool, &str)>) -> Ev {
    let mut lines = vec![format!("  obs: tool_started #{id}"), format!("tool #{id} skill : {{\"name\":\"{skill}\"}}")];
    if let Some((ok, r)) = result {
        lines.push(format!("tool_result #{id} {} : {r}", if ok { "ok" } else { "fail" }));
        lines.push(format!("  obs: tool_finished #{id} {}", if ok { "ok" } else { "failed" }));
    }
    Ev::Tool(merged_tool(&lines))
}

/// BISE-283 (the user's onboarding test, designer's rows): a skill call
/// is a sentence, `reading skill <name>` then `read skill <name>`, never
/// `skill ✓ 0.0s · {"name":…}` and `▸ output`; a failed one says why on
/// the right; a click (or ctrl+o) opens its SKILL.md in a box.
#[test]
fn a_skill_call_reads_as_a_sentence() {
    let body = "# bise demo

Show what bise can do.";
    let run = skill_call(1, "bise-demo", None);
    let rows = rows_text(&build_rows(std::slice::from_ref(&run), 0, false, 60, 0));
    assert!(rows[0].starts_with("   reading skill bise-demo "), "{rows:#?}");
    assert_eq!(rows.len(), 1, "{rows:#?}");
    // the verb dim, the name in the text color while it runs
    let spans = &build_rows(std::slice::from_ref(&run), 0, false, 60, 0)[0].spans;
    let name = spans.iter().find(|s| s.content == "bise-demo").unwrap();
    assert_eq!(name.style.fg, Some(crate::theme::text()));
    let verb = spans.iter().find(|s| s.content.starts_with("reading")).unwrap();
    assert_eq!(verb.style.fg, Some(crate::theme::dim()));

    let done = skill_call(2, "bise-demo", Some((true, body)));
    let (mut events, mut cache) = arrive(vec![done]);
    let rows = cached_text(&events, &mut cache, 60);
    assert_eq!(rows, vec!["   read skill bise-demo".to_string()], "{rows:#?}");
    assert!(crate::feed::anything_closed(&events));
    // ctrl+o: the SKILL.md in a box titled with the sentence, no JSON
    crate::feed::set_everything(&mut events, &mut cache, true);
    let rows = cached_text(&events, &mut cache, 60);
    assert!(rows[0].starts_with("╭─ read skill bise-demo ✓"), "{rows:#?}");
    assert!(rows.iter().any(|r| r.starts_with("│ Show what bise can do.")), "{rows:#?}");
    assert!(!rows.iter().any(|r| r.contains('{') || r.starts_with('├')), "{rows:#?}");
    crate::feed::set_everything(&mut events, &mut cache, false);
    assert_eq!(cached_text(&events, &mut cache, 60), vec!["   read skill bise-demo".to_string()]);

    let why = "unknown skill: bise-dmeo: call it with an exact name from <available-skills>";
    let failed = skill_call(3, "bise-dmeo", Some((false, why)));
    let (events, mut cache) = arrive(vec![failed]);
    let rows = cached_text(&events, &mut cache, 60);
    assert_eq!(rows.len(), 1, "{rows:#?}");
    assert!(rows[0].starts_with("   read skill bise-dmeo ") && rows[0].ends_with("✗ unknown skill"), "{rows:#?}");
    // the other views draw the same row
    let other = text_of(&events[0], 60);
    assert_eq!(other.len(), 1, "{other:#?}");
    assert!(other[0].trim_end().ends_with("✗ unknown skill"), "{other:#?}");
}

// BISE-293: a refused request says it once, in two lines: bise's, then
// the provider's own words dim under it (never the raw JSON twice)
#[test]
fn refused_request_reads_once_in_two_lines() {
    let why = "OpenAI refused the request (400). OpenAI said: \"Invalid 'tools[0].function.name': string does not match pattern.\"";
    let mut events: Vec<Ev> = Vec::new();
    let mut cache: Vec<Option<EventRows>> = Vec::new();
    for l in [format!("  obs: candidate_discarded: {}", why), format!("  obs: turn_done: failed: {}", why)] {
        push_event(&mut events, &mut cache, parse_line(&l).expect("parse"));
    }
    assert_eq!(events.len(), 1, "the warning gives its place to the failure");
    let rows = rows_text(&ev_lines(&events[0], 200));
    assert_eq!(rows.len(), 2, "{:?}", rows);
    assert_eq!(rows[0].trim_end(), " ✗ the turn stopped: OpenAI refused the request (400).");
    assert_eq!(rows[1].trim(), "OpenAI said: \"Invalid 'tools[0].function.name': string does not match pattern.\"");
    // a warning for another cause stays
    let mut events = vec![Ev::Warn("candidate discarded: interrupt".into())];
    let mut cache = vec![None];
    push_event(&mut events, &mut cache, Ev::Err(format!("turn failed: {}", why)));
    assert_eq!(events.len(), 2);
}

#[test]
fn refusal_parts_split_bise_and_the_provider() {
    assert_eq!(
        refusal_parts("turn failed: OpenAI refused the key (401). check it with /setup. OpenAI said: \"Incorrect key. See docs.\""),
        Some(("OpenAI refused the key (401). check it with /setup.", "OpenAI said: \"Incorrect key. See docs.\""))
    );
    assert_eq!(
        refusal_parts("turn failed: Mistral refused the request (400)."),
        Some(("Mistral refused the request (400).", ""))
    );
    assert_eq!(refusal_parts("turn failed: provider unreachable: retries exhausted"), None);
    assert_eq!(refusal_parts("compaction failed: x refused the y. z said: \"w\""), None);
}

// subscriptions (design item 5): the ChatGPT plan's four turn lines read as
// a ▲ that says what to do, matched on their openings; the limit line's
// usage page is a link; any other failure stays a ✗
#[test]
fn the_chatgpt_plan_lines_are_a_warning_and_the_rest_a_failure() {
    let lines = [
        "your ChatGPT plan's limit for bise is reached. your usage is at chatgpt.com/settings/usage, or switch model with /model.",
        "ChatGPT plan use is off for bise. turn it on in your ChatGPT settings, or pick another provider in /provider.",
        "ChatGPT couldn't check your plan's usage. try again in a moment, or switch model with /model.",
        "your ChatGPT sign-in expired. sign in again in /provider, or run bise login chatgpt.",
    ];
    for l in lines {
        let ev = parse_line(&format!("  obs: turn_done: failed: {}", l)).expect("parse");
        // expired-ux: the TUI's own words for the expired sign-in (⏎
        // signs in again from the thread, designer m_7456)
        let shown = if l.starts_with("your ChatGPT sign-in expired.") { crate::wire::EXPIRED_TUI } else { l };
        assert!(matches!(&ev, Ev::Warn(w) if w == shown), "{l}");
        let text = rows_text(&ev_rows(&ev, 0, 200)).iter().map(|r| r.trim()).collect::<Vec<_>>().join(" ");
        assert_eq!(text, format!("▲ {}", shown));
    }
    // the limit line: one link, the usage page, on its own words
    let ev = Ev::Warn(lines[0].to_string());
    let rows = ev_rows(&ev, 0, 200);
    let linked: Vec<String> = rows
        .iter()
        .flat_map(|r| r.spans.iter())
        .filter(|sp| sp.style.add_modifier.contains(ratatui::style::Modifier::UNDERLINED))
        .map(|sp| sp.content.to_string())
        .collect();
    assert_eq!(linked, vec!["chatgpt.com/settings/usage".to_string()]);
    // a reworded tail still matches; another provider's failure stays ✗
    let ev = parse_line("  obs: turn_done: failed: your ChatGPT sign-in expired. (401)").expect("parse");
    assert!(matches!(ev, Ev::Warn(_)));
    let ev = parse_line("  obs: turn_done: failed: OpenAI refused the request (400).").expect("parse");
    assert!(matches!(&ev, Ev::Err(t) if t == "turn failed: OpenAI refused the request (400)."));
    assert!(rows_text(&ev_rows(&ev, 0, 200)).join("\n").starts_with(" ✗ "));
}

// H9 (architect m_19836, a terminal-visible change): a run of retries is
// one ▲ row updated in place (the newest attempt), not one row per retry;
// a retry after anything else starts a new row
#[test]
fn a_run_of_retries_is_one_updating_row() {
    let r = |n: u32| parse_line(&format!("  obs: provider_retry: {n}/10 · provider 529 (transient) · retry in {n}s")).unwrap();
    let (mut events, mut cache) = (Vec::new(), Vec::new());
    for ev in [r(1), r(2), r(3)] {
        crate::feed::push_event(&mut events, &mut cache, ev);
    }
    assert_eq!(events.len(), 1, "one row for the run");
    let text = rows_text(&ev_rows(&events[0], 0, 200)).join(" ");
    assert!(text.contains("▲") && text.contains("model call failed (attempt 3/10): provider 529 (transient) · retry 4/10 in 3s"), "{text}");
    crate::feed::push_event(&mut events, &mut cache, Ev::Assistant("done".into()));
    crate::feed::push_event(&mut events, &mut cache, r(1));
    assert_eq!(events.len(), 3, "a retry after the reply is a new row");
}

// subscriptions: an expired sign-in shows once, at the turn's end, never
// as a discarded candidate first
#[test]
fn a_plan_line_shows_once_not_as_a_discarded_candidate() {
    let l = "your ChatGPT sign-in expired. sign in again in /provider, or run bise login chatgpt.";
    let evs: Vec<Ev> = [format!("  obs: candidate_discarded: {}", l), format!("  obs: turn_done: failed: {}", l)]
        .iter()
        .filter_map(|x| parse_line(x))
        .collect();
    let text: Vec<String> = evs.iter().flat_map(|e| rows_text(&ev_rows(e, 0, 200))).collect();
    let all = text.join(" ");
    assert_eq!(all.matches("your ChatGPT sign-in expired.").count(), 1, "{all}");
    assert!(!all.contains("candidate discarded"), "{all}");
    // another discarded candidate still says so
    assert!(parse_line("  obs: candidate_discarded: the answer was empty").is_some());
}

// interrupt-who: a call an interrupt stopped mid-answer names who asked
// and reads as a dim ▲ stop, not a red ✗ failure
#[test]
fn an_interrupt_mid_answer_is_a_dim_stop_naming_who() {
    for (who, text) in [("main", " ▲ turn interrupted by main"), ("the user", " ▲ turn interrupted by the user")] {
        let ev = parse_line(&format!("  obs: turn_done: failed: interrupted by {}", who)).expect("parse");
        assert_eq!(rows_text(&ev_rows(&ev, 0, 100)).join("\n"), text);
    }
}

/// file-chips: a message of yours with an image and file chips draws
/// each chip by name in its place (`▯ deck.pptx`), a gone one
/// `· missing`, never a marker.
#[test]
fn your_file_chips_draw_by_name_in_place() {
    use bise_proto::parts::Part;
    let parts = vec![
        Part::Text { text: "ajouter l'image ".into() },
        Part::Image { name: "[Image #1]".into(), source: "/u/logo.png".into(), mime: "image/png".into(), b64_file: "/nowhere/1.b64".into(), caption: String::new() },
        Part::Text { text: " dans ".into() },
        Part::File { path: "/u/My Desktop/deck.pptx".into(), name: "[File #2]".into(), missing: false },
        Part::Text { text: " et ".into() },
        Part::File { path: "/u/gone.csv".into(), name: "[File #3]".into(), missing: true },
    ];
    let said = crate::said::Said::new(bise_proto::parts::render(&parts), parts);
    let (events, mut cache) = arrive(vec![Ev::You(said, Mark::Read, false, None)]);
    let rows = cached_text(&events, &mut cache, 120).join("\n");
    assert!(rows.contains("▣ logo.png") && rows.contains("▯\u{a0}deck.pptx") && rows.contains("▯\u{a0}gone.csv · missing"), "{rows}");
    assert!(!rows.contains("<file") && !rows.contains("<image"), "{rows}");
}

/// file-chips: the tmux test's message (an image, seven file chips, one
/// gone) draws at every width without a panic.
#[test]
fn many_file_chips_draw_at_every_width() {
    use bise_proto::parts::Part;
    let f = |n: u32, name: &str, missing: bool| Part::File { path: format!("/tmp/sb-e2e-x/My Desktop/{name}"), name: format!("[File #{n}]"), missing };
    let t = |s: &str| Part::Text { text: s.into() };
    let parts = vec![
        t("ajouter l'image "),
        Part::Image { name: "[Image #1]".into(), source: "/tmp/sb-e2e-x/My Desktop/logo.png".into(), mime: "image/png".into(), b64_file: "/nowhere/1.b64".into(), caption: String::new() },
        t(" dans la presentation powerpoint "),
        f(2, "deck.pptx", false),
        t(" avec "),
        f(3, "q3.pdf", false),
        t(" "),
        f(4, "data.csv", false),
        t(" "),
        f(5, "plan.xlsx", false),
        t(" "),
        f(6, "brief.docx", false),
        t(" "),
        f(7, "gone.csv", true),
        t("  "),
        Part::File { path: "/tmp/sb-e2e-x/ws/docs/roadmap.pdf".into(), name: "[File #8]".into(), missing: false },
        t(" "),
    ];
    let said = crate::said::Said::new(bise_proto::parts::render(&parts), parts);
    for w in [20, 40, 60, 80, 100, 110, 116, 150] {
        let (events, mut cache) = arrive(vec![Ev::You(said.clone(), Mark::Read, false, None)]);
        let rows = cached_text(&events, &mut cache, w).join("\n");
        assert!(rows.contains("deck.pptx"), "{w}: {rows}");
    }
}
