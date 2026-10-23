//! running.rs: the list's order, a row's words at 150 and 80 columns,
//! the heads and the agents panel's line, on procs-hub's fixture
//! (rust/proto/fixtures/hub_ev.jsonl's `processes`).

use super::*;
use bise_proto::hub::HubEv;
use bise_proto::rows::OutKind;

/// The fixture's rows: perf's `pnpm dev` (bg3, :5173), its detached
/// watcher, docs' tmux, perf's failed `cargo test` (rc 101), its
/// `http.server` he stopped, docs' `mkdocs serve` stopped with docs,
/// perf's bg4 that ended well.
pub(crate) fn fixture() -> Vec<Proc> {
    let line = include_str!("../../proto/fixtures/hub_ev.jsonl").lines().find(|l| l.starts_with(r#"{"ev":"processes""#)).expect("the processes fixture");
    match HubEv::decode(line).expect("it decodes") {
        HubEv::Processes { items, .. } => items,
        _ => unreachable!(),
    }
}

/// The fixture's clock: 14 min after `pnpm dev` started.
pub(crate) const NOW: u64 = 1_791_100_100_000 + 14 * 60_000;

fn plain(l: &Line) -> String {
    l.spans.iter().map(|s| s.content.as_ref()).collect()
}

fn ids<'a>(gs: &[Group<'a>]) -> Vec<(String, Vec<String>)> {
    gs.iter().map(|g| (g.agent.clone(), g.rows.iter().map(|p| p.id.clone()).collect())).collect()
}

#[test]
fn groups_by_agent_running_oldest_first_then_ended_newest_first() {
    let items = fixture();
    let order = vec!["main".to_string(), "docs".to_string(), "perf".to_string()];
    let gs = groups(&items, &order, Filter::All, "");
    // both run something: the panel's order; in a group running then ended
    assert_eq!(
        ids(&gs),
        vec![
            ("docs".into(), vec!["p49012.1791100160".into(), "p47500.1791099650".into(), "bg1.1791098000".into()]),
            ("perf".into(), vec!["bg3.1791100100".into(), "p48990.1791100150".into(), "bg2.1791099500".into(), "bg4.1791099600".into(), "bg1.1791099000".into()]),
        ]
    );
    // tab: the ended ones only
    let ended = groups(&items, &order, Filter::Ended, "");
    assert!(ended.iter().flat_map(|g| &g.rows).all(|p| !p.running()));
    assert_eq!(flat(&ended).len(), 5);
    // the search: its command or its agent
    assert_eq!(ids(&groups(&items, &order, Filter::All, "MKDOCS")), vec![("docs".into(), vec!["bg1.1791098000".into()])]);
    assert_eq!(flat(&groups(&items, &order, Filter::All, "perf")).len(), 5);
    // an agent with only ended ones goes after those that run
    let only_ended: Vec<Proc> = items.iter().filter(|p| p.agent == "perf" || !p.running()).cloned().collect();
    assert_eq!(ids(&groups(&only_ended, &order, Filter::All, ""))[0].0, "perf");
}

#[test]
fn a_rows_words_say_its_state_and_its_port() {
    let items = fixture();
    let by = |agent: &str, id: &str| items.iter().find(|p| p.agent == agent && p.id == id).unwrap().clone();
    let dev = by("perf", "bg3.1791100100");
    assert_eq!(status(&dev, NOW, false, true), "14 min");
    assert_eq!(port_words(&dev, true).as_deref(), Some("localhost:5173"));
    assert_eq!(port_words(&dev, false).as_deref(), Some(":5173"));
    assert_eq!(status(&dev, NOW, true, true), running::stopping);
    let failed = by("perf", "bg1.1791099000");
    let ago = wait_len(NOW - failed.ended_ms.unwrap(), false);
    assert_eq!(status(&failed, NOW, false, true), format!("{} · {}", running::ended_ago(&ago), running::exit_rc(101)));
    assert_eq!(status(&failed, NOW, false, false), format!("{} · {}", running::exit_rc(101), running::ago_short(&ago)));
    // stopping says nothing once it ended
    assert_eq!(status(&failed, NOW, true, true), status(&failed, NOW, false, true));
    assert_eq!(glyph(&failed), (G_FAILED, error()));
    let his = by("perf", "bg2.1791099500");
    assert_eq!(status(&his, NOW, false, true), running::stopped_by_you_at(clock(his.ended_ms.unwrap())));
    // an ended one listens no more
    assert_eq!(port_words(&his, true), None);
    assert_eq!(status(&by("docs", "bg1.1791098000"), NOW, false, true), running::stopped_with("docs"));
    let mut ok = failed.clone();
    ok.state = ProcState::Exited { rc: Some(0) };
    assert_eq!(glyph(&ok).1, dim());
    assert_eq!(status(&ok, NOW, false, true), running::ended_ago(&ago));
    // its code not known (a detached one): '–' dim, no rc, never red
    ok.state = ProcState::Exited { rc: None };
    assert_eq!(glyph(&ok), (G_STOPPED, dim()));
    assert_eq!(status(&ok, NOW, false, true), running::ended_ago(&ago));
}

#[test]
fn rows_fit_150_and_80_columns_with_the_command_cut_last() {
    let mut items = fixture();
    items[0].cmd = "pnpm exec playwright test --ui --project chromium --reporter list --retries 2 --workers 4 --grep checkout --timeout 60000 --trace on".into();
    for wd in [146usize, 76] {
        let wide = wd >= WIDE_FROM;
        for p in &items {
            let l = plain(&row(p, NOW, false, false, wd));
            assert!(l.width() <= wd, "{wd}: {l:?} is {}", l.width());
            assert!(l.contains(&status(p, NOW, false, wide)), "{wd}: {l:?}");
        }
        let long = plain(&row(&items[0], NOW, true, false, wd));
        assert!(long.starts_with("› ∿ pnpm exec") && long.contains('…'), "{long}");
        assert!(long.contains(&port_words(&items[0], wide).unwrap()), "{long}");
        // the selection fills the row
        assert_eq!(long.width(), wd, "{long}");
    }
}

#[test]
fn heads_count_the_running_and_the_listening() {
    let items = fixture();
    assert_eq!(head("acme", &items, true), format!("acme · {} · {}", running::count_running(3), running::count_listening(1)));
    assert_eq!(head("acme", &items, false), format!("acme · 3 · {}", running::count_listening(1)));
    let quiet: Vec<Proc> = items.iter().filter(|p| p.ports.is_empty()).cloned().collect();
    assert_eq!(head("acme", &quiet, true), format!("acme · {}", running::count_running(2)));
}

#[test]
fn the_tip_says_its_id_start_and_folder_and_a_detached_ones_origin() {
    let items = fixture();
    let dev = &items[0];
    assert_eq!(tip(dev)[0], running::tip("bg3", clock(dev.started_ms), short_home(dev.cwd.as_deref().unwrap())));
    assert_eq!(tip(dev).len(), 1);
    let watcher = &items[1];
    assert_eq!(tip(watcher)[1], running::tip_detached("perf"));
    assert_eq!(tip(&items[2])[0], running::tip_no_cwd(&items[2].id, clock(items[2].started_ms)));
    assert_eq!(short_home("/a/b/c/d/e/perf"), "/…/e/perf");
    assert_eq!(short_home("/tmp/x"), "/tmp/x");
}

#[test]
fn the_agents_panel_line_counts_and_names_the_port() {
    assert_eq!(panel_line(0, Some(5173)), None);
    assert_eq!(panel_line(2, Some(5173)).unwrap(), format!("∿ {} · {}", running::count_running(2), running::port_short(5173)));
    assert_eq!(panel_line(1, None).unwrap(), format!("∿ {}", running::count_running(1)));
}

#[test]
fn the_output_head_has_its_meta_and_usage_only_while_it_runs() {
    let items = fixture();
    let h = out_head(&items[0], "acme", NOW, false);
    assert!(h.starts_with("pnpm dev  "), "{h}");
    for part in [running::whose("perf", "acme"), format!("∿ {} · 14 min", running::state_running), "localhost:5173".into(), running::pid_of(48211), running::usage(13, 340)] {
        assert!(h.contains(&part), "{h} lacks {part}");
    }
    let ended = out_head(&items[3], "acme", NOW, false);
    assert!(!ended.contains("cpu") && ended.contains(&running::exit_rc(101)), "{ended}");
    assert_eq!(items[2].out, OutKind::None);
}

#[test]
fn a_command_on_several_lines_keeps_the_columns() {
    let mut items = fixture();
    items[1].cmd = "cd '/w' || exit 1\npython3 -u -m\thttp.server 8000".into();
    assert_eq!(one_line(&items[1].cmd), "cd '/w' || exit 1 python3 -u -m http.server 8000");
    for wd in [146usize, 76] {
        let col = |p: &Proc| {
            let l = plain(&row(p, NOW, false, false, wd));
            l.find(&status(p, NOW, false, wd >= WIDE_FROM)).map(|i| l[..i].width())
        };
        assert_eq!(col(&items[1]), col(&items[0]), "{wd}");
    }
}
