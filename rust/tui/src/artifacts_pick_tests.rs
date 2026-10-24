use super::*;
use crossterm::event::KeyEventKind;

fn f(id: &str, name: &str, parent: Option<&str>) -> Folder {
    Folder { id: id.into(), name: name.into(), parent: parent.map(str::to_string), by: "main".into(), named_by_you: false }
}

fn folders() -> Vec<Folder> {
    vec![f("f-desk", "desktop app", None), f("f-hero", "page heroes", Some("f-desk")), f("f-ep", "épargne", None), f("f-view", "agent view", Some("f-desk"))]
}

fn k(code: KeyCode) -> KeyEvent {
    KeyEvent { code, modifiers: KeyModifiers::NONE, kind: KeyEventKind::Press, state: crossterm::event::KeyEventState::NONE }
}

fn text_of(l: &[Line]) -> String {
    l.iter().map(|l| l.spans.iter().map(|s| s.content.as_ref()).collect::<String>()).collect::<Vec<_>>().join("\n")
}

fn mover(query: &str) -> Pick {
    Pick::Move { key: "a".into(), title: "agent view fixes".into(), from: Some("f-view".into()), query: query.into(), sel: 0 }
}

/// The mock's `m: move to…`: typing filters, the typed folder can be
/// made, a digit picks.
#[test]
fn m_filters_as_you_type_and_offers_the_typed_folder() {
    let fs = folders();
    let p = mover("pa");
    let rows = rows(&p, &fs, &[], &[], "bise");
    let words: Vec<(&str, &str)> = rows.iter().map(|r| (r.words.as_str(), r.dim.as_str())).collect();
    assert_eq!(words, [("page heroes", "desktop app"), ("épargne", "")]);
    let out = text_of(&lines(&p, &rows, &fs, None, 80));
    assert!(out.starts_with("╭─ move \"agent view fixes\" to… ─"), "{out}");
    assert!(out.contains("│ › pa▏"), "{out}");
    assert!(out.contains("│ 1 page heroes  desktop app"), "{out}");
    assert!(out.contains("│ 2 épargne"), "{out}");
    assert!(out.contains("│ + new folder \"pa\""), "{out}");
    for l in out.lines() {
        assert_eq!(unicode_width::UnicodeWidthStr::width(l), 63, "{l}");
    }
    let bar: Vec<String> = key_pairs(&p, rows.len(), can_make(&p, &fs)).into_iter().map(|(k, w)| format!("{k} {w}")).collect();
    assert_eq!(bar, ["1-2 pick", "⏎ move", "ctrl+⏎ new folder", "esc back"]);
    let mut p2 = p.clone();
    assert_eq!(key(&mut p2, &k(KeyCode::Char('2')), &rows, &fs), Outcome::Chose(Choice::Folder("f-ep".into())));
    let ctrl = KeyEvent { modifiers: KeyModifiers::CONTROL, ..k(KeyCode::Enter) };
    assert_eq!(key(&mut p2, &ctrl, &rows, &fs), Outcome::Chose(Choice::Make { name: "pa".into(), parent: None, then_move: true }));
    assert_eq!(key(&mut p2, &k(KeyCode::Esc), &rows, &fs), Outcome::Close);
}

#[test]
fn m_leaves_out_its_own_folder_and_offers_unfiled() {
    let fs = folders();
    let rows = rows(&mover(""), &fs, &[], &[], "bise");
    assert!(!rows.iter().any(|r| r.choice == Choice::Folder("f-view".into())));
    assert_eq!(rows.last().map(|r| &r.choice), Some(&Choice::Unfiled));
}

#[test]
fn a_theme_slash_task_makes_the_task_folder_in_that_theme() {
    let fs = folders();
    assert_eq!(split_path("desktop app/plugins", &fs), ("plugins".into(), Some("f-desk".into())));
    assert_eq!(split_path("launch/day", &fs), ("day".into(), Some("launch".into())));
    assert_eq!(split_path("plugins", &fs), ("plugins".into(), None));
}

#[test]
fn typing_moves_the_choice_back_to_the_first_and_arrows_stay_in_the_list() {
    let fs = folders();
    let mut p = mover("");
    let rows = rows(&p, &fs, &[], &[], "bise");
    for _ in 0..10 {
        key(&mut p, &k(KeyCode::Down), &rows, &fs);
    }
    assert!(matches!(p, Pick::Move { sel, .. } if sel == rows.len() - 1));
    key(&mut p, &k(KeyCode::Char('x')), &rows, &fs);
    assert!(matches!(&p, Pick::Move { sel: 0, query, .. } if query == "x"));
}

#[test]
fn n_names_the_folder_and_enter_makes_it() {
    let fs = folders();
    let mut p = Pick::NewFolder { parent: Some("f-desk".into()), name: String::new() };
    assert_eq!(key(&mut p, &k(KeyCode::Enter), &[], &fs), Outcome::Stay, "no name yet");
    for c in "plugins".chars() {
        key(&mut p, &k(KeyCode::Char(c)), &[], &fs);
    }
    let out = text_of(&lines(&p, &[], &fs, Some("desktop app"), 80));
    assert!(out.starts_with("╭─ new folder in desktop app ─"), "{out}");
    assert!(out.contains("│ › plugins▏"), "{out}");
    assert_eq!(key(&mut p, &k(KeyCode::Enter), &[], &fs), Outcome::Chose(Choice::Make { name: "plugins".into(), parent: Some("f-desk".into()), then_move: false }));
}

#[test]
fn p_lists_every_project_with_its_count() {
    let fs = folders();
    let rows_ = [
        Artifact { id: "1".into(), ..Default::default() },
        Artifact { id: "2".into(), project: "ai-docs".into(), ..Default::default() },
        Artifact { id: "3".into(), ..Default::default() },
    ];
    let refs: Vec<&Artifact> = rows_.iter().collect();
    let p = Pick::Project { query: String::new(), sel: 0 };
    let r = rows(&p, &fs, &refs, &[], "bise");
    let words: Vec<(&str, &str)> = r.iter().map(|r| (r.words.as_str(), r.dim.as_str())).collect();
    assert_eq!(words, [("all projects", "3"), ("bise", "2"), ("ai-docs", "1")]);
    let out = text_of(&lines(&p, &r, &fs, None, 80));
    assert!(out.contains("│ 3 ai-docs  1"), "{out}");
    assert_eq!(r[0].choice, Choice::Project(None));
}
