use super::*;

fn f(id: &str, name: &str, parent: Option<&str>) -> Folder {
    Folder { id: id.into(), name: name.into(), parent: parent.map(str::to_string), by: "main".into(), named_by_you: false }
}

/// a row of project `name` (its hub id `h-<name>`)
fn a(id: &str, folder: Option<&str>, agent: &str, name: &str, ts: u64) -> Artifact {
    let name = if name.is_empty() { "bise" } else { name };
    Artifact { id: id.into(), title: id.into(), folder: folder.map(str::to_string), agent: agent.into(), project: format!("h-{name}"), project_name: name.into(), ts_ms: ts, v: 1, ..Default::default() }
}

/// desktop app (agent view, inbox), bims (no task folders), an empty
/// theme.
fn library() -> (Vec<Folder>, Vec<Artifact>) {
    let folders = vec![f("f-desk", "desktop app", None), f("f-view", "agent view", Some("f-desk")), f("f-inbox", "inbox", Some("f-desk")), f("f-bims", "bims", None), f("f-empty", "épargne", None)];
    let rows = vec![
        a("1", Some("f-view"), "amb-home", "", 900),
        a("2", Some("f-view"), "amb-home", "", 800),
        a("3", Some("f-view"), "amb-win", "ai-docs", 700),
        a("4", Some("f-desk"), "main", "", 600),
        a("5", Some("f-bims"), "bims", "bims", 950),
        a("6", None, "", "", 500),
        // a folder the library no longer has: unfiled
        a("7", Some("f-gone"), "x", "", 400),
    ];
    (folders, rows)
}

#[test]
fn a_theme_holds_its_task_folders_and_a_lost_folder_reads_unfiled() {
    let (folders, rows) = library();
    let ids = |p: &Place| rows.iter().filter(|r| holds(p, r, &folders)).map(|r| r.id.as_str()).collect::<Vec<_>>();
    assert_eq!(ids(&Place::Folder("f-desk".into())), ["1", "2", "3", "4"]);
    assert_eq!(ids(&Place::Folder("f-view".into())), ["1", "2", "3"]);
    assert_eq!(ids(&Place::Unfiled), ["6", "7"]);
    assert_eq!(ids(&Place::All).len(), 7);
    assert!(!exists(&Place::Folder("f-gone".into()), &folders));
}

#[test]
fn the_crumb_names_the_theme_then_the_task() {
    let (folders, _) = library();
    assert_eq!(crumb(&Place::Folder("f-view".into()), &folders), ["desktop app", "agent view"]);
    assert_eq!(crumb(&Place::Folder("f-bims".into()), &folders), ["bims"]);
    assert_eq!(crumb(&Place::Unfiled, &folders), ["unfiled"]);
    assert_eq!(theme_of(&Place::Folder("f-view".into()), &folders).as_deref(), Some("f-desk"));
    assert_eq!(theme_of(&Place::Folder("f-desk".into()), &folders).as_deref(), Some("f-desk"));
}

#[test]
fn the_tree_puts_the_newest_theme_first_and_opens_only_open_themes() {
    let (folders, rows) = library();
    let refs: Vec<&Artifact> = rows.iter().collect();
    let shut = tree(&folders, &refs, &refs, &[], &|_| false);
    let names: Vec<&str> = shut.iter().map(|r| r.name.as_str()).collect();
    assert_eq!(names, ["all artifacts", "unfiled", "bims", "desktop app", "épargne"]);
    assert_eq!(shut[3].open, Some(false), "desktop app has task folders");
    assert_eq!(shut[2].open, None, "bims has none");
    let open = tree(&folders, &refs, &refs, &["f-desk".into()], &|a| a.id == "3");
    let names: Vec<(&str, u8)> = open.iter().map(|r| (r.name.as_str(), r.depth)).collect();
    assert_eq!(names[3..6], [("desktop app", 0), ("agent view", 1), ("inbox", 1)]);
    assert!(open[3].fresh && open[4].fresh && !open[5].fresh, "{open:?}");
    assert_eq!((open[0].count, open[1].count, open[3].count, open[4].count), (7, 2, 4, 3));
}

#[test]
fn the_project_filter_counts_of_every_project() {
    let (folders, rows) = library();
    let every: Vec<&Artifact> = rows.iter().collect();
    let here: Vec<&Artifact> = rows.iter().filter(|r| r.project == "h-bise").collect();
    let t = tree(&folders, &here, &every, &["f-desk".into()], &|_| false);
    let view = t.iter().find(|r| r.name == "agent view").unwrap();
    assert_eq!((view.count, view.total), (2, 3));
    let p: Vec<(String, String, usize)> = projects(&every).into_iter().map(|p| (p.id, p.name, p.rows)).collect();
    let want = [("h-bise", "bise", 5), ("h-ai-docs", "ai-docs", 1), ("h-bims", "bims", 1)];
    assert_eq!(p, want.map(|(i, n, r)| (i.to_string(), n.to_string(), r)));
}

#[test]
fn the_search_says_in_project() {
    assert_eq!(split_in("deck in:ai"), (Some("ai".into()), "deck".into()));
    assert_eq!(split_in("deck"), (None, "deck".into()));
    let pr = |id: &str, name: &str, rows: usize| Project { id: id.into(), name: name.into(), rows };
    let p = vec![pr("h-1", "bise", 5), pr("h-2", "ai-docs", 2), pr("h-3", "bims", 1)];
    assert_eq!(match_project("ai", &p), Some("h-2"), "by name, to its hub id");
    assert_eq!(match_project("BIMS", &p), Some("h-3"));
    assert_eq!(match_project("docs", &p), Some("h-2"));
    assert_eq!(match_project("zzz", &p), None);
}

#[test]
fn the_crumbs_agents_most_rows_first() {
    let (_, rows) = library();
    let refs: Vec<&Artifact> = rows[..3].iter().collect();
    assert_eq!(agents(&refs), ["amb-home", "amb-win"]);
}

#[test]
fn a_move_offers_the_folders_you_moved_to_then_the_newest() {
    let (folders, rows) = library();
    let refs: Vec<&Artifact> = rows.iter().collect();
    let names = |v: Vec<&Folder>| v.into_iter().map(|f| f.name.clone()).collect::<Vec<_>>();
    assert_eq!(names(recent(&folders, &refs, &[], None)), ["bims", "agent view", "desktop app", "inbox", "épargne"]);
    assert_eq!(names(recent(&folders, &refs, &["f-inbox".into()], Some("f-bims"))), ["inbox", "agent view", "desktop app", "épargne"]);
}

#[test]
fn the_kept_place_comes_back() {
    for p in [Place::All, Place::Unfiled, Place::Folder("f-1".into())] {
        assert_eq!(place_of(&place_word(&p)), p);
    }
}
