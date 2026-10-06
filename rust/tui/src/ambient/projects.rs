//! The ambient core's projects (bise desktop S1): which hubs it holds and
//! what the window's sidebar shows of each. Pure: the registry rows
//! (`bise_home::projects::list`), each hub's `view.json` and whether its
//! hub runs come in as arguments, so the tests need no HOME. The core
//! (S3b, amb-core) wires the command, the event and the connections;
//! [`read_view`] is the one file read, for it.
//!
//! Holds (decided, desktop plan A): the home hub always; a project's hub
//! while the window shows it, a followed job runs there, or a thread of
//! it is subscribed. A held hub is
//! one `hello` connection (idle-exit counts it); delivering a message to
//! a stopped hub starts it on its own, so routing takes no hold.

use bise_home::projects::Row;
use bise_proto::draft::{ProjectRow, ProjectView};
use bise_proto::rows::Status;
use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

/// The workspaces whose hub the core holds: `home`, every project the
/// window shows, every project a followed job runs in, every project with
/// a live thread subscription (architect m_8461: one rule, S3b calls it).
pub fn wanted(home: &Path, shown: &[PathBuf], followed: &[PathBuf], subscribed: &[PathBuf]) -> BTreeSet<PathBuf> {
    std::iter::once(home.to_path_buf())
        .chain(shown.iter().cloned())
        .chain(followed.iter().cloned())
        .chain(subscribed.iter().cloned())
        .collect()
}

/// A registry row and what is known of its hub.
#[derive(Clone, Debug, PartialEq)]
pub struct Facts {
    pub row: Row,
    /// its folder is gone (moved or deleted)
    pub missing: bool,
    /// its hub runs (its pid lives)
    pub running: bool,
    /// its hub's `view.json` (None: never written, or unreadable)
    pub view: Option<ProjectView>,
}

/// The facts of each row, in the registry's order (home first). `view`
/// and `running` take the hub id, `exists` the folder.
pub fn facts(
    rows: &[Row],
    view: impl Fn(&str) -> Option<ProjectView>,
    running: impl Fn(&str) -> bool,
    exists: impl Fn(&Path) -> bool,
) -> Vec<Facts> {
    rows.iter()
        .map(|r| Facts { missing: !exists(&r.path), running: running(&r.id), view: view(&r.id), row: r.clone() })
        .collect()
}

/// The sidebar's row of `f`, at position `order`. `branch`/`git`: the
/// checkout's (the core reads git). Counts from the view: agents (main
/// and archived ones aside), the working ones, his open cards.
pub fn row(f: &Facts, order: u32, branch: Option<String>, git: bool) -> ProjectRow {
    let agents = f.view.as_ref().map(|v| v.agents.iter().filter(|a| !a.main && !a.archived).collect::<Vec<_>>()).unwrap_or_default();
    ProjectRow {
        project: f.row.id.clone(),
        name: f.row.name.clone(),
        path: f.row.path.to_string_lossy().to_string(),
        branch,
        git,
        home: f.row.home,
        order,
        agents: agents.len() as u32,
        working: agents.iter().filter(|a| a.status == Status::Working).count() as u32,
        waits: f.view.as_ref().map_or(0, |v| v.cards.len() as u32),
        running: f.running,
        missing: f.missing,
    }
}

/// The `view.json` in a hub's folder (`Home::hub_dir(id)`), read-only:
/// None when absent, not JSON, or of another shape.
pub fn read_view(hub_dir: &Path) -> Option<ProjectView> {
    let v: ProjectView = serde_json::from_str(&std::fs::read_to_string(hub_dir.join("view.json")).ok()?).ok()?;
    (v.v == 1).then_some(v)
}

#[cfg(test)]
mod tests {
    use super::*;
    use bise_proto::rows::Agent;

    fn r(name: &str, path: &str, home: bool) -> Row {
        Row { path: path.into(), name: name.into(), id: bise_home::hub_id(Path::new(path)), home, added_ms: 0 }
    }

    fn agent(name: &str, main: bool, status: Status, archived: bool) -> Agent {
        Agent {
            name: name.into(),
            main,
            status,
            archived,
            title: String::new(),
            purpose: String::new(),
            since_ms: 0,
            waits: 0,
            parent: None,
            branch: None,
            worktree: None,
            turn_ms: None,
            report: None,
            queued: vec![],
        }
    }

    #[test]
    fn home_is_always_held_and_projects_while_shown_followed_or_subscribed() {
        let home = PathBuf::from("/u/bise");
        let (api, web) = (PathBuf::from("/c/api"), PathBuf::from("/c/web"));
        let one = |p: &PathBuf| vec![p.clone()];
        assert_eq!(wanted(&home, &[], &[], &[]), BTreeSet::from([home.clone()]));
        assert_eq!(wanted(&home, &one(&api), &[], &[]), BTreeSet::from([home.clone(), api.clone()]));
        // the window leaves api, a followed job runs in web: web stays held
        assert_eq!(wanted(&home, &[], &one(&web), &[]), BTreeSet::from([home.clone(), web.clone()]));
        // a thread of api is still subscribed (a side panel): api stays held
        assert_eq!(wanted(&home, &[], &[], &one(&api)), BTreeSet::from([home.clone(), api.clone()]));
        // shown, followed and subscribed: held once
        assert_eq!(wanted(&home, &one(&web), &one(&web), &one(&web)).len(), 2);
    }

    #[test]
    fn facts_and_rows_come_from_the_registry_the_views_and_the_pids() {
        let rows = vec![r("bise", "/u/bise", true), r("api", "/c/api", false), r("old", "/c/old", false)];
        let api_id = rows[1].id.clone();
        let view = ProjectView {
            v: 1,
            project: api_id.clone(),
            written_ms: 10,
            stopped_ms: Some(10),
            last_activity_ms: 9,
            agents: vec![
                agent("main", true, Status::Idle, false),
                agent("p99", false, Status::Working, false),
                agent("docs", false, Status::Done, false),
                agent("gone", false, Status::Done, true),
            ],
            cards: vec![],
        };
        let v2 = view.clone();
        let f = facts(
            &rows,
            move |id| (id == api_id).then(|| v2.clone()),
            |id| id.starts_with("bise-"),
            |p| p != Path::new("/c/old"),
        );
        assert_eq!(f.iter().map(|x| (x.running, x.missing, x.view.is_some())).collect::<Vec<_>>(), [(true, false, false), (false, false, true), (false, true, false)]);
        let p = row(&f[1], 1, Some("main".into()), true);
        assert_eq!((p.name.as_str(), p.home, p.order, p.agents, p.working, p.waits), ("api", false, 1, 2, 1, 0));
        assert_eq!(p.project, rows[1].id);
        let h = row(&f[0], 0, None, false);
        assert!(h.home && h.agents == 0 && !h.git);
    }

    #[test]
    fn a_view_file_is_read_only_when_it_is_ours() {
        let d = std::env::temp_dir().join(format!("amb-projects-{}", std::process::id()));
        std::fs::create_dir_all(&d).unwrap();
        assert_eq!(read_view(&d), None);
        std::fs::write(d.join("view.json"), "{not json").unwrap();
        assert_eq!(read_view(&d), None);
        let v = ProjectView { v: 1, project: "x-1".into(), written_ms: 1, stopped_ms: None, last_activity_ms: 1, agents: vec![], cards: vec![] };
        std::fs::write(d.join("view.json"), serde_json::to_string(&v).unwrap()).unwrap();
        assert_eq!(read_view(&d), Some(v.clone()));
        std::fs::write(d.join("view.json"), serde_json::to_string(&ProjectView { v: 2, ..v }).unwrap()).unwrap();
        assert_eq!(read_view(&d), None);
        let _ = std::fs::remove_dir_all(&d);
    }
}
