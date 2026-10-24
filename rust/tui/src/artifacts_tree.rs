//! The library's folders in `/artifacts` (brief artifacts-folders part 6,
//! page artifacts-gallery v7, block b-term), pure: the places (all
//! artifacts, unfiled, a theme, a task folder inside one), which rows a
//! place holds, the tree's rows with their counts and `•` for new, the
//! crumb and its agents, the folders a move offers first, the projects
//! of the library and the search's `in:<project>`. The screen draws them
//! (artifacts_screen.rs); the pickers are artifacts_pick.rs.
//!
//! The folders are the same for every project; the project filter (`p`,
//! `in:`) only narrows the rows, so a folder counts `14 of 74`.

use crate::artifacts::{Artifact, Folder};
use bise_proto::words::library as words;

/// Where the list is: every artifact, the unfiled ones, or a folder (a
/// theme holds its task folders' rows too).
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub(crate) enum Place {
    #[default]
    All,
    Unfiled,
    Folder(String),
}

/// The place as the kept screen says it (sb/keep.rs): "" all,
/// `unfiled`, else the folder's id.
pub(crate) fn place_word(p: &Place) -> String {
    match p {
        Place::All => String::new(),
        Place::Unfiled => "unfiled".into(),
        Place::Folder(id) => id.clone(),
    }
}

pub(crate) fn place_of(w: &str) -> Place {
    match w {
        "" => Place::All,
        "unfiled" => Place::Unfiled,
        id => Place::Folder(id.to_string()),
    }
}

/// The row's folder, when the library has it (an id it no longer has
/// reads as unfiled).
pub(crate) fn folder_of<'a>(a: &Artifact, folders: &'a [Folder]) -> Option<&'a Folder> {
    let id = a.folder.as_deref()?;
    folders.iter().find(|f| f.id == id)
}

fn by_id<'a>(folders: &'a [Folder], id: &str) -> Option<&'a Folder> {
    folders.iter().find(|f| f.id == id)
}

/// The place holds this row.
pub(crate) fn holds(place: &Place, a: &Artifact, folders: &[Folder]) -> bool {
    match place {
        Place::All => true,
        Place::Unfiled => folder_of(a, folders).is_none(),
        Place::Folder(id) => folder_of(a, folders).is_some_and(|f| f.id == *id || f.parent.as_deref() == Some(id.as_str())),
    }
}

/// The place still exists (a folder deleted while the screen is open
/// sends the list back to all artifacts).
pub(crate) fn exists(place: &Place, folders: &[Folder]) -> bool {
    match place {
        Place::Folder(id) => by_id(folders, id).is_some(),
        _ => true,
    }
}

/// The place's words: `all artifacts`, `unfiled`, `desktop app / agent
/// view` (the theme, then the task folder).
pub(crate) fn crumb(place: &Place, folders: &[Folder]) -> Vec<String> {
    match place {
        Place::All => vec![words::all_artifacts.into()],
        Place::Unfiled => vec![words::unfiled.into()],
        Place::Folder(id) => {
            let Some(f) = by_id(folders, id) else { return vec![words::all_artifacts.into()] };
            let mut out: Vec<String> = f.parent.as_deref().and_then(|p| by_id(folders, p)).map(|p| p.name.clone()).into_iter().collect();
            out.push(f.name.clone());
            out
        }
    }
}

/// Who made a row: its agent, else who added it.
pub(crate) fn maker(a: &Artifact) -> &str {
    if a.agent.is_empty() {
        &a.by
    } else {
        &a.agent
    }
}

/// The agents of these rows, the one with the most first (ties: the
/// newest row's); the crumb says `amb-home and 2 more`, and the rows of
/// the first one leave their agent column blank.
pub(crate) fn agents(rows: &[&Artifact]) -> Vec<String> {
    let mut out: Vec<(String, usize, usize)> = Vec::new();
    for (i, a) in rows.iter().enumerate() {
        let m = maker(a);
        if m.is_empty() {
            continue;
        }
        match out.iter_mut().find(|(n, _, _)| n == m) {
            Some(e) => e.1 += 1,
            None => out.push((m.to_string(), 1, i)),
        }
    }
    out.sort_by(|a, b| b.1.cmp(&a.1).then(a.2.cmp(&b.2)));
    out.into_iter().map(|(n, _, _)| n).collect()
}

/// The newest row's time in a folder (a theme: its tasks' too), 0 when empty.
fn newest(id: &str, rows: &[&Artifact], folders: &[Folder]) -> u64 {
    let p = Place::Folder(id.to_string());
    rows.iter().filter(|a| holds(&p, a, folders)).map(|a| a.ts_ms).max().unwrap_or(0)
}

/// The themes (folders with no parent), the newest work first, then the
/// empty ones by name.
pub(crate) fn themes<'a>(folders: &'a [Folder], rows: &[&Artifact]) -> Vec<&'a Folder> {
    let mut t: Vec<&Folder> = folders.iter().filter(|f| f.parent.is_none()).collect();
    t.sort_by(|a, b| newest(&b.id, rows, folders).cmp(&newest(&a.id, rows, folders)).then(a.name.to_lowercase().cmp(&b.name.to_lowercase())));
    t
}

/// A theme's task folders, by name.
pub(crate) fn tasks<'a>(folders: &'a [Folder], theme: &str) -> Vec<&'a Folder> {
    let mut t: Vec<&Folder> = folders.iter().filter(|f| f.parent.as_deref() == Some(theme)).collect();
    t.sort_by_key(|f| f.name.to_lowercase());
    t
}

/// One row of the tree.
#[derive(Clone, Debug, PartialEq)]
pub(crate) struct TreeRow {
    pub(crate) place: Place,
    /// 0: all, unfiled and the themes; 1: a task folder
    pub(crate) depth: u8,
    pub(crate) name: String,
    /// a theme with task folders: open (`▾`) or shut (`▸`)
    pub(crate) open: Option<bool>,
    /// its rows (in the project filter)
    pub(crate) count: usize,
    /// its rows in every project (the filter's `14 of 74`)
    pub(crate) total: usize,
    /// something new on this visit inside it
    pub(crate) fresh: bool,
}

/// The tree: all artifacts, unfiled, then each theme and, when open,
/// its task folders. `rows`: in the filter; `every`: in every project;
/// `open`: the themes shown open.
pub(crate) fn tree(folders: &[Folder], rows: &[&Artifact], every: &[&Artifact], open: &[String], fresh: &dyn Fn(&Artifact) -> bool) -> Vec<TreeRow> {
    let row = |place: Place, depth: u8, name: &str, open: Option<bool>| {
        let n = rows.iter().filter(|a| holds(&place, a, folders)).count();
        let total = every.iter().filter(|a| holds(&place, a, folders)).count();
        let new = rows.iter().any(|a| holds(&place, a, folders) && fresh(a));
        TreeRow { place, depth, name: name.to_string(), open, count: n, total, fresh: new }
    };
    let mut out = vec![row(Place::All, 0, words::all_artifacts, None), row(Place::Unfiled, 0, words::unfiled, None)];
    for t in themes(folders, rows) {
        let kids = tasks(folders, &t.id);
        let is_open = open.contains(&t.id);
        out.push(row(Place::Folder(t.id.clone()), 0, &t.name, (!kids.is_empty()).then_some(is_open)));
        if is_open {
            for k in kids {
                out.push(row(Place::Folder(k.id.clone()), 1, &k.name, None));
            }
        }
    }
    out
}

/// The theme a place is in (a task folder's parent, a theme itself).
pub(crate) fn theme_of(place: &Place, folders: &[Folder]) -> Option<String> {
    let Place::Folder(id) = place else { return None };
    let f = by_id(folders, id)?;
    Some(f.parent.clone().unwrap_or_else(|| f.id.clone()))
}

/// The folders a move offers, in order: the ones you moved to on this
/// visit (last first), then by their newest row; `but`: the row's own
/// folder, left out.
pub(crate) fn recent<'a>(folders: &'a [Folder], rows: &[&Artifact], moved: &[String], but: Option<&str>) -> Vec<&'a Folder> {
    let mut out: Vec<&Folder> = moved.iter().rev().filter_map(|id| by_id(folders, id)).collect();
    let mut rest: Vec<&Folder> = folders.iter().filter(|f| !out.iter().any(|o| o.id == f.id)).collect();
    // a folder's own rows (a theme's task folders have theirs)
    let own = |f: &Folder| rows.iter().filter(|a| a.folder.as_deref() == Some(f.id.as_str())).map(|a| a.ts_ms).max().unwrap_or(0);
    rest.sort_by(|a, b| own(b).cmp(&own(a)).then(a.name.to_lowercase().cmp(&b.name.to_lowercase())));
    out.extend(rest);
    out.retain(|f| Some(f.id.as_str()) != but);
    out
}

/// The parent's name of a task folder (the picker's dim words).
pub(crate) fn parent_name(f: &Folder, folders: &[Folder]) -> Option<String> {
    f.parent.as_deref().and_then(|p| by_id(folders, p)).map(|p| p.name.clone())
}

/// The library's projects, the most rows first: (name, rows).
pub(crate) fn projects(rows: &[&Artifact], here: &str) -> Vec<(String, usize)> {
    let mut out: Vec<(String, usize)> = Vec::new();
    for a in rows {
        let p = project_name(a, here);
        match out.iter_mut().find(|(n, _)| *n == p) {
            Some(e) => e.1 += 1,
            None => out.push((p.to_string(), 1)),
        }
    }
    out.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));
    out
}

/// The row's project by name: this hub's own rows carry none.
pub(crate) fn project_name<'a>(a: &'a Artifact, here: &'a str) -> &'a str {
    if a.project.is_empty() {
        here
    } else {
        &a.project
    }
}

/// The search split: its `in:<project>` (the last one) and the rest.
pub(crate) fn split_in(q: &str) -> (Option<String>, String) {
    let mut proj = None;
    let mut rest = Vec::new();
    for w in q.split_whitespace() {
        match w.strip_prefix("in:") {
            Some(p) if !p.is_empty() => proj = Some(p.to_lowercase()),
            _ => rest.push(w),
        }
    }
    (proj, rest.join(" "))
}

/// The project `in:<words>` names: an exact name, else the first that
/// starts with them, else the first that has them.
pub(crate) fn match_project<'a>(words: &str, projects: &'a [(String, usize)]) -> Option<&'a str> {
    let w = words.to_lowercase();
    let low = |p: &str| p.to_lowercase();
    projects
        .iter()
        .find(|(p, _)| low(p) == w)
        .or_else(|| projects.iter().find(|(p, _)| low(p).starts_with(&w)))
        .or_else(|| projects.iter().find(|(p, _)| low(p).contains(&w)))
        .map(|(p, _)| p.as_str())
}

#[cfg(test)]
#[path = "artifacts_tree_tests.rs"]
mod tests;
