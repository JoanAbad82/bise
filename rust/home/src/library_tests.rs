//! The library's laws (docs/artifacts.md, "Folders"): every change keeps
//! the 2-level rule; delete never deletes an artifact; merge = move all +
//! remove (on the read side); a folder he named is never renamed by an
//! agent; his undo puts back what his change changed, and only that.

use super::*;
use std::collections::BTreeMap;

fn tmp(name: &str) -> Home {
    let d = std::env::temp_dir().join(format!("bise-library-test-{}-{}", std::process::id(), name));
    let _ = std::fs::remove_dir_all(&d);
    std::fs::create_dir_all(&d).unwrap();
    Home::at(d)
}

fn new(m: Result<Made, String>) -> Folder {
    match m {
        Ok(Made::New(f)) => f,
        other => panic!("not made: {other:?}"),
    }
}

/// Artifacts as their metas have them: id -> folder id (raw).
type Metas = BTreeMap<&'static str, Option<String>>;

/// The readers' join: each artifact's live folder id (none: unfiled).
fn join(l: &Library, metas: &Metas) -> BTreeMap<&'static str, Option<String>> {
    metas.iter().map(|(a, f)| (*a, f.as_deref().and_then(|f| resolve(l, f)).map(|f| f.id.clone()))).collect()
}

/// A theme with two task folders, and one more theme.
fn sample() -> (Library, String, String, String, String) {
    let mut l = Library::default();
    let docs = new(make(&mut l, "docs", None, YOU)).id;
    let a = new(make(&mut l, "pricing", Some(&docs), "main")).id;
    let b = new(make(&mut l, "launch", Some(&docs), "main")).id;
    let shots = new(make(&mut l, "shots", None, "main")).id;
    (l, docs, a, b, shots)
}

#[test]
fn make_is_found_again_and_keeps_two_levels() {
    let (mut l, docs, a, _, _) = sample();
    assert_eq!(make(&mut l, " docs ", None, "main"), Ok(Made::Already(get(&l, &docs).unwrap().clone())));
    let e = make(&mut l, "deeper", Some(&a), YOU).unwrap_err();
    assert!(e.contains("2 levels"), "{e}");
    assert!(make(&mut l, "a/b", None, YOU).is_err() && make(&mut l, "  ", None, YOU).is_err());
    assert!(get(&l, &docs).unwrap().named_by_you, "his folder's name is his");
    assert!(!get(&l, &a).unwrap().named_by_you);
    assert!(a.starts_with("f-") && a.len() == 12, "{a}");
    check(&l).unwrap();
}

#[test]
fn make_path_finds_or_makes_each_level() {
    let (mut l, docs, a, _, _) = sample();
    assert_eq!(make_path(&mut l, "docs/pricing", "s1"), Ok(a.clone()));
    let n = l.folders.len();
    let id = make_path(&mut l, "docs/faq", "s1").unwrap();
    assert_eq!((l.folders.len(), get(&l, &id).unwrap().parent.as_deref()), (n + 1, Some(docs.as_str())));
    assert_eq!(path_of(&l, &id).as_deref(), Some("docs/faq"));
    assert!(make_path(&mut l, "a/b/c", "s1").is_err());
}

#[test]
fn find_takes_an_id_a_path_or_a_unique_name() {
    let (mut l, docs, a, _, shots) = sample();
    assert_eq!(find(&l, &a).map(|f| &f.id), Some(&a));
    assert_eq!(find(&l, "docs/pricing").map(|f| &f.id), Some(&a));
    assert_eq!(find(&l, "pricing").map(|f| &f.id), Some(&a));
    new(make(&mut l, "pricing", Some(&shots), YOU));
    assert_eq!(find(&l, "pricing"), None, "two folders are named pricing: a path picks");
    assert_eq!(find(&l, "docs").map(|f| &f.id), Some(&docs));
    assert_eq!(find(&l, "nope"), None);
}

#[test]
fn law_an_agent_never_renames_a_folder_he_named() {
    let (mut l, docs, a, _, _) = sample();
    let e = rename(&mut l, &docs, "papers", "main").unwrap_err();
    assert_eq!(e, "docs was named by you: an agent never renames it");
    rename(&mut l, &a, "pricing v2", "main").unwrap();
    assert!(!get(&l, &a).unwrap().named_by_you);
    rename(&mut l, &a, "prices", YOU).unwrap();
    assert!(get(&l, &a).unwrap().named_by_you, "his rename makes the name his");
    assert!(rename(&mut l, &a, "anything", "s1").is_err());
    assert!(rename(&mut l, &a, "launch", YOU).unwrap_err().contains("already named launch"));
}

#[test]
fn rename_touches_no_artifact() {
    let (mut l, _, a, _, _) = sample();
    let metas: Metas = [("x", Some(a.clone()))].into();
    let before = join(&l, &metas);
    rename(&mut l, &a, "prices", YOU).unwrap();
    assert_eq!(join(&l, &metas), before);
}

#[test]
fn nest_keeps_two_levels() {
    let (mut l, docs, a, _, shots) = sample();
    nest(&mut l, &shots, Some(&docs)).unwrap();
    assert_eq!(path_of(&l, &shots).as_deref(), Some("docs/shots"));
    assert!(nest(&mut l, &docs, Some(&a)).is_err(), "into a task folder");
    let other = new(make(&mut l, "other", None, YOU)).id;
    assert!(nest(&mut l, &docs, Some(&other)).unwrap_err().contains("has folders inside"));
    assert!(nest(&mut l, &other, Some(&other)).is_err());
    nest(&mut l, &shots, None).unwrap();
    check(&l).unwrap();
}

#[test]
fn law_delete_never_deletes_an_artifact() {
    let (mut l, docs, a, b, shots) = sample();
    let metas: Metas =
        [("x", Some(a.clone())), ("y", Some(b.clone())), ("z", Some(docs.clone())), ("w", Some(shots.clone())), ("v", None)].into();
    delete(&mut l, &docs).unwrap();
    let after = join(&l, &metas);
    assert_eq!(after.len(), metas.len(), "every artifact is still read");
    assert_eq!(after.values().filter(|f| f.is_none()).count(), 4, "the theme's and its tasks' artifacts read unfiled");
    assert_eq!(after["w"], Some(shots.clone()));
    assert!(get(&l, &a).is_none() && get(&l, &b).is_none(), "its sub-folders went with it");
    check(&l).unwrap();
}

#[test]
fn law_merge_is_move_all_then_remove() {
    // into a theme: the task folders move in, a same-named one merges
    let (mut l, docs, a, _, shots) = sample();
    let same = new(make(&mut l, "pricing", Some(&shots), YOU)).id;
    let metas: Metas = [("x", Some(a.clone())), ("z", Some(docs.clone())), ("s", Some(shots.clone())), ("u", None)].into();
    let mut merged = l.clone();
    merge(&mut merged, &docs, &shots).unwrap();
    check(&merged).unwrap();
    // the same by hand: move every artifact of docs to shots, of
    // docs/pricing to shots/pricing, then remove docs
    let mut moved = metas.clone();
    moved.insert("z", Some(shots.clone()));
    moved.insert("x", Some(same.clone()));
    let mut removed = l.clone();
    delete(&mut removed, &docs).unwrap();
    assert_eq!(join(&merged, &metas), join(&removed, &moved));
    assert!(live(&merged).all(|f| f.id != docs), "it leaves the list");
    assert_eq!(path_of(&merged, &same).as_deref(), Some("shots/pricing"));
    assert!(rows(&merged).iter().all(|r| r["id"] != json!(docs)), "a redirect is never listed");
}

#[test]
fn merge_into_a_task_folder_takes_the_sub_folders_too() {
    let (mut l, docs, a, b, shots) = sample();
    let task = new(make(&mut l, "keep", Some(&shots), YOU)).id;
    let metas: Metas = [("x", Some(a.clone())), ("y", Some(b.clone())), ("z", Some(docs.clone()))].into();
    merge(&mut l, &docs, &task).unwrap();
    check(&l).unwrap();
    assert!(join(&l, &metas).values().all(|f| f.as_deref() == Some(task.as_str())));
    assert!(merge(&mut l, &shots, &task).unwrap_err().contains("merge it the other way"));
}

#[test]
fn merged_twice_follows_to_the_end_and_a_deleted_end_is_unfiled() {
    let (mut l, docs, a, b, _) = sample();
    merge(&mut l, &a, &b).unwrap();
    let t = new(make(&mut l, "t", Some(&docs), YOU)).id;
    merge(&mut l, &b, &t).unwrap();
    assert_eq!(resolve(&l, &a).map(|f| &f.id), Some(&t));
    delete(&mut l, &t).unwrap();
    assert_eq!(resolve(&l, &a), None);
    // a round of redirects (a hand-edited file) reads as unfiled, never loops
    let mut round = Library::default();
    for (id, into) in [("f-1", "f-2"), ("f-2", "f-1")] {
        round.folders.push(Folder { id: id.into(), name: id.into(), into: Some(into.into()), ..Folder::default() });
    }
    assert_eq!(resolve(&round, "f-1"), None);
    assert!(check(&round).is_err());
}

#[test]
fn law_one_folder_per_artifact() {
    // a move replaces the one id a meta has: there is no second place
    let (l, _, a, b, _) = sample();
    let mut metas: Metas = [("x", Some(a.clone()))].into();
    metas.insert("x", Some(b.clone()));
    assert_eq!(join(&l, &metas)["x"], Some(b));
}

#[test]
fn law_every_change_keeps_two_levels() {
    // every op, from every folder to every folder, never leaves a 3rd level
    let (l, ..) = sample();
    let ids: Vec<String> = l.folders.iter().map(|f| f.id.clone()).collect();
    for x in &ids {
        for y in ids.iter().map(Some).chain([None]) {
            let mut m = l.clone();
            let _ = make(&mut m, "n", y.map(String::as_str), YOU);
            let _ = nest(&mut m, x, y.map(String::as_str));
            if let Some(y) = y {
                let _ = merge(&mut m, x, y);
            }
            let _ = delete(&mut m, x);
            check(&m).unwrap_or_else(|e| panic!("{x} {y:?}: {e}"));
            assert!(live(&m).all(|f| f.parent.as_deref().is_none_or(|p| get(&m, p).unwrap().parent.is_none())));
        }
    }
}

#[test]
fn the_file_keeps_unknown_keys() {
    let text = r#"{"v":1,"color":"pink","folders":[{"id":"f-a","name":"docs","by":"you","named_by_you":true,"icon":"star"},{"name":"no id"}]}"#;
    let l = parse(text);
    assert_eq!(l.folders.len(), 1);
    let back: Value = serde_json::from_str(&render(&l)).unwrap();
    assert_eq!(back["color"], "pink");
    assert_eq!(back["folders"][0]["icon"], "star");
    assert_eq!(parse(&render(&l)), l);
    assert_eq!(parse("not json"), Library::default());
}

#[test]
fn update_writes_one_file_and_refuses_a_bad_change() {
    let home = tmp("update");
    let id = update(&home, true, |l| Ok(new(make(l, "docs", None, YOU)).id)).unwrap();
    assert_eq!(home.library_folders(), Some(home.root().join("library/folders.json")));
    assert_eq!(read(&home).folders[0].id, id);
    let e = update(&home, true, |l| {
        l.folders.push(Folder { id: "f-x".into(), name: "x".into(), parent: Some("f-gone".into()), ..Folder::default() });
        Ok(())
    });
    assert!(e.is_err(), "a change check() refuses writes nothing");
    assert_eq!(read(&home).folders.len(), 1);
    std::fs::write(home.library_folders().unwrap(), r#"{"v":2,"folders":[]}"#).unwrap();
    assert!(update(&home, true, |_| Ok(())).unwrap_err().contains("newer bise"));
    let legacy = Home { layout: Layout::Legacy, ..Home::at("/nowhere") };
    assert_eq!(update(&legacy, true, |_| Ok(())), Err(LEGACY.to_string()));
}

#[test]
fn law_undo_puts_back_his_change() {
    let home = tmp("undo");
    let (docs, a) = update(&home, false, |l| {
        let d = new(make(l, "docs", None, YOU)).id;
        Ok((d.clone(), new(make(l, "pricing", Some(&d), "main")).id))
    })
    .unwrap();
    type Op = fn(&mut Library, &str, &str) -> Result<(), String>;
    let ops: [(&str, Op); 4] = [
        ("rename", |l, d, _| rename(l, d, "papers", YOU)),
        ("nest", |l, _, a| nest(l, a, None)),
        ("merge", |l, d, _| {
            let t = new(make(l, "other", None, YOU)).id;
            merge(l, d, &t)
        }),
        ("delete", |l, d, _| delete(l, d)),
    ];
    for (name, op) in ops {
        let before = read(&home).folders;
        update(&home, true, |l| op(l, &docs, &a)).unwrap();
        assert_ne!(read(&home).folders, before, "{name} changed something");
        assert_eq!(undo(&home), Ok(vec![]), "{name}");
        let mut after = read(&home).folders;
        let mut want = before.clone();
        after.sort_by(|x, y| x.id.cmp(&y.id));
        want.sort_by(|x, y| x.id.cmp(&y.id));
        assert_eq!(after, want, "{name}: undo puts it back");
        assert_eq!(undo(&home), Err("nothing to undo".into()), "{name}: once");
    }
    // a make is undone by taking it out
    let made = update(&home, true, |l| Ok(new(make(l, "new", None, YOU)).id)).unwrap();
    undo(&home).unwrap();
    assert!(read(&home).folders.iter().all(|f| f.id != made));
}

#[test]
fn law_an_agents_change_between_is_never_undone() {
    let home = tmp("between");
    let docs = update(&home, true, |l| Ok(new(make(l, "docs", None, YOU)).id)).unwrap();
    update(&home, true, |l| rename(l, &docs, "papers", YOU)).unwrap();
    // main makes a folder in it and renames another of its own
    let (task, own) = update(&home, false, |l| {
        let o = new(make(l, "shots", None, "main")).id;
        rename(l, &o, "screens", "main")?;
        Ok((new(make(l, "pricing", Some(&docs), "main")).id, o))
    })
    .unwrap();
    undo(&home).unwrap();
    let l = read(&home);
    assert_eq!(get(&l, &docs).unwrap().name, "docs", "his rename undone");
    assert_eq!(get(&l, &own).unwrap().name, "screens", "the agent's rename stays");
    assert_eq!(path_of(&l, &task).as_deref(), Some("docs/pricing"), "the agent's folder stays");
}

#[test]
fn undo_gives_his_moves_back_to_the_caller() {
    let home = tmp("moves");
    let moves = vec![Move { project: "w-1".into(), id: "plan".into(), folder: Some("f-a".into()) }, Move { project: "w-2".into(), id: "deck".into(), folder: None }];
    remember_moves(&home, moves.clone()).unwrap();
    assert_eq!(read(&home).undo.map(|u| u.moves), Some(moves.clone()), "kept in the file");
    assert_eq!(undo(&home), Ok(moves));
    assert_eq!(undo(&home), Err("nothing to undo".into()));
}

#[test]
fn undo_of_a_delete_whose_theme_is_gone_goes_to_the_top() {
    let home = tmp("orphan");
    let (docs, a) = update(&home, false, |l| {
        let d = new(make(l, "docs", None, YOU)).id;
        Ok((d.clone(), new(make(l, "pricing", Some(&d), YOU)).id))
    })
    .unwrap();
    update(&home, true, |l| delete(l, &a)).unwrap();
    update(&home, false, |l| delete(l, &docs)).unwrap();
    undo(&home).unwrap();
    let l = read(&home);
    assert_eq!(get(&l, &a).and_then(|f| f.parent.clone()), None);
}
