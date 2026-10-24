//! The artifacts library's folders (artifacts-in-folders, architect
//! m_39651): one list for every project, `<root>/library/folders.json`
//! ([`Home::library_folders`], bise layout only):
//! `{"v":1,"folders":[{id,name,parent?,by,named_by_you,into?}],"undo"?}`.
//!
//! - A folder's id is stable and random (`f-` + 10 base32), so a rename
//!   touches no artifact. Two levels at most (theme › task), checked by
//!   one pure fn, [`check`], after every change.
//! - An artifact's folder is its own fact (`folder` in its hub's
//!   meta.json, written only by that hub). Readers join the two through
//!   [`resolve`]: a merged folder reads as the one it went into (`into`,
//!   a redirect hidden from every list), a deleted or unknown id reads as
//!   none (unfiled). So neither merge nor delete rewrites any meta.json.
//! - `by`: `you` or the agent that made it; `named_by_you`: its name is
//!   his (he made or renamed it): an agent never renames it.
//!
//! One writer: [`update`] (flock on `folders.json.lock`, read, change,
//! [`check`], write tmp + rename; unknown keys kept, a file a newer bise
//! wrote never written over), called by whichever process acts: the
//! desktop core for his edits, a hub for an agent's and for the
//! terminal's (`artifacts/folders`; the TUI and the `sb` CLI never write
//! it themselves).
//! His changes keep their inverse in the one undo slot ([`undo`]); an
//! agent's change never touches it. The changes ([`make`], [`rename`],
//! [`nest`], [`merge`], [`delete`]) are pure functions over the list,
//! tested alone (`library_tests.rs`, the laws).

use std::collections::BTreeSet;
use std::path::PathBuf;

use serde_json::{json, Map, Value};

use crate::{Home, Layout};

/// The folder in `Home::root`, and the file in it.
pub const DIR: &str = "library";
pub const FILE: &str = "folders.json";
/// `by` of his own changes.
pub const YOU: &str = "you";
/// What every write says in the legacy layout.
pub const LEGACY: &str = "the library needs ~/.bise: run bise once to move there";
/// The deepest a folder goes: a theme (1) and its tasks (2).
pub const DEPTH: usize = 2;

/// One folder (a live one, or a merged one's redirect: `into`).
#[derive(Clone, Debug, PartialEq, Default)]
pub struct Folder {
    pub id: String,
    pub name: String,
    pub parent: Option<String>,
    /// `you` or the agent that made it.
    pub by: String,
    /// He made or renamed it: an agent never renames it.
    pub named_by_you: bool,
    /// Merged into that folder: hidden, its artifacts read as there.
    pub into: Option<String>,
    /// Keys this bise does not know, kept as they were.
    pub extra: Map<String, Value>,
}

impl Folder {
    pub fn live(&self) -> bool {
        self.into.is_none()
    }
}

/// An artifact's folder before one of his moves: what [`undo`] gives
/// back to the caller, which sends it to that project's hub.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Move {
    /// The project's hub id.
    pub project: String,
    pub id: String,
    /// The folder id it had (none: unfiled).
    pub folder: Option<String>,
}

/// The inverse of his last change.
#[derive(Clone, Debug, PartialEq, Default)]
pub struct Undo {
    /// Folders his change made: taken out again.
    pub remove: Vec<String>,
    /// Folders his change changed or took out: put back as they were.
    pub restore: Vec<Folder>,
    /// Artifacts his move moved: back to their folder (the caller's job).
    pub moves: Vec<Move>,
}

impl Undo {
    pub fn is_empty(&self) -> bool {
        self.remove.is_empty() && self.restore.is_empty() && self.moves.is_empty()
    }
}

/// The whole file.
#[derive(Clone, Debug, PartialEq, Default)]
pub struct Library {
    pub folders: Vec<Folder>,
    pub undo: Option<Undo>,
    pub extra: Map<String, Value>,
}

/// [`make`]'s answer: a new folder, or the live one with that name there.
#[derive(Clone, Debug, PartialEq)]
pub enum Made {
    New(Folder),
    Already(Folder),
}

impl Made {
    pub fn folder(&self) -> &Folder {
        match self {
            Made::New(f) | Made::Already(f) => f,
        }
    }
}

// ---- reads ----

/// The live folders, in the file's order.
pub fn live(l: &Library) -> impl Iterator<Item = &Folder> {
    l.folders.iter().filter(|f| f.live())
}

fn get<'a>(l: &'a Library, id: &str) -> Option<&'a Folder> {
    l.folders.iter().find(|f| f.id == id)
}

/// The live folder an artifact's `folder` id reads as: itself, the one a
/// merge sent it into (followed, cycle-safe), else none (unfiled).
pub fn resolve<'a>(l: &'a Library, id: &str) -> Option<&'a Folder> {
    let mut at = id;
    for _ in 0..=l.folders.len() {
        let f = get(l, at)?;
        match &f.into {
            None => return Some(f),
            Some(next) => at = next,
        }
    }
    None
}

/// Its live sub-folders.
pub fn children<'a>(l: &'a Library, id: &'a str) -> impl Iterator<Item = &'a Folder> + 'a {
    live(l).filter(move |f| f.parent.as_deref() == Some(id))
}

/// `theme/task` (or `theme`) of a live folder.
pub fn path_of(l: &Library, id: &str) -> Option<String> {
    let f = resolve(l, id)?;
    Some(match f.parent.as_deref().and_then(|p| resolve(l, p)) {
        Some(p) => format!("{}/{}", p.name, f.name),
        None => f.name.clone(),
    })
}

fn named<'a>(l: &'a Library, parent: Option<&str>, name: &str) -> Option<&'a Folder> {
    live(l).find(|f| f.parent.as_deref() == parent && f.name == name)
}

/// The live folder `key` names: an id (a merged one's target), else a
/// path `theme/task`, else a name only one live folder has.
pub fn find<'a>(l: &'a Library, key: &str) -> Option<&'a Folder> {
    let key = key.trim();
    if let Some(f) = resolve(l, key) {
        return Some(f);
    }
    if let Some((theme, task)) = key.split_once('/') {
        let t = named(l, None, theme.trim())?;
        return named(l, Some(&t.id), task.trim());
    }
    let mut hits = live(l).filter(|f| f.name == key);
    match (hits.next(), hits.next()) {
        (Some(f), None) => Some(f),
        _ => None,
    }
}

/// The 2-level rule and the list's shape, checked after every change:
/// unique ids, a live folder's parent is a live top-level folder, two
/// live folders in one place never share a name, a redirect leads
/// somewhere or nowhere (never round).
pub fn check(l: &Library) -> Result<(), String> {
    let mut ids = BTreeSet::new();
    for f in &l.folders {
        if !ids.insert(f.id.as_str()) {
            return Err(format!("two folders have the id {}", f.id));
        }
    }
    for f in live(l) {
        if f.name.trim().is_empty() {
            return Err("a folder's name cannot be empty".into());
        }
        if let Some(p) = &f.parent {
            match get(l, p) {
                Some(pf) if pf.live() && pf.parent.is_none() => {}
                Some(pf) if pf.live() => {
                    return Err(format!("folders go {DEPTH} levels deep at most: {} is inside {}", f.name, pf.name))
                }
                _ => return Err(format!("{} is inside a folder that is gone", f.name)),
            }
        }
        if live(l).filter(|g| g.parent == f.parent && g.name == f.name).count() > 1 {
            return Err(format!("two folders here are named {}", f.name));
        }
    }
    for f in l.folders.iter().filter(|f| !f.live()) {
        let mut seen = BTreeSet::new();
        let mut at = f;
        while let Some(next) = &at.into {
            if !seen.insert(at.id.as_str()) {
                return Err(format!("{} is merged round in a circle", f.id));
            }
            match get(l, next) {
                Some(n) => at = n,
                None => break,
            }
        }
    }
    Ok(())
}

// ---- changes (pure) ----

/// A new folder's id: `f-` + 10 base32 characters, none the list has.
pub fn fresh_id(l: &Library) -> String {
    use std::hash::{BuildHasher, Hasher};
    const ABC: &[u8] = b"abcdefghijklmnopqrstuvwxyz234567";
    loop {
        // RandomState's keys are random per call: no rand crate needed
        let mut h = std::collections::hash_map::RandomState::new().build_hasher();
        h.write_u128(std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0, |d| d.as_nanos()));
        h.write_u32(std::process::id());
        let mut n = h.finish();
        let id: String = (0..10)
            .map(|_| {
                let c = ABC[(n & 31) as usize] as char;
                n >>= 5;
                c
            })
            .collect();
        let id = format!("f-{id}");
        if get(l, &id).is_none() {
            return id;
        }
    }
}

fn clean(name: &str) -> Result<String, String> {
    let n = name.split_whitespace().collect::<Vec<_>>().join(" ");
    if n.is_empty() {
        return Err("a folder's name cannot be empty".into());
    }
    if n.contains('/') {
        return Err(format!("a folder's name has no /: {n}"));
    }
    Ok(n)
}

fn live_mut<'a>(l: &'a mut Library, id: &str) -> Result<&'a mut Folder, String> {
    l.folders.iter_mut().find(|f| f.id == id && f.live()).ok_or_else(|| format!("no folder {id}"))
}

fn top_level(l: &Library, id: &str) -> Result<(), String> {
    match get(l, id).filter(|f| f.live()) {
        None => Err(format!("no folder {id}")),
        Some(f) if f.parent.is_some() => Err(format!("folders go {DEPTH} levels deep at most: {} is inside a folder already", f.name)),
        Some(_) => Ok(()),
    }
}

/// A folder named `name` in `parent` (none: at the top), made by `by`;
/// the live one already there with that name is answered as it is (so
/// main's "an existing theme" costs nothing).
pub fn make(l: &mut Library, name: &str, parent: Option<&str>, by: &str) -> Result<Made, String> {
    let name = clean(name)?;
    if let Some(p) = parent {
        top_level(l, p)?;
    }
    if let Some(f) = named(l, parent, &name) {
        return Ok(Made::Already(f.clone()));
    }
    let f = Folder {
        id: fresh_id(l),
        name,
        parent: parent.map(str::to_string),
        by: by.to_string(),
        named_by_you: by == YOU,
        into: None,
        extra: Map::new(),
    };
    l.folders.push(f.clone());
    Ok(Made::New(f))
}

/// `theme` or `theme/task`, each level found or made by `by`: the id of
/// the last one.
pub fn make_path(l: &mut Library, path: &str, by: &str) -> Result<String, String> {
    let (theme, task) = match path.split_once('/') {
        Some((a, b)) => (a, Some(b)),
        None => (path, None),
    };
    if task.is_some_and(|t| t.contains('/')) {
        return Err(format!("folders go {DEPTH} levels deep at most: {}", path.trim()));
    }
    let t = make(l, theme, None, by)?.folder().id.clone();
    match task {
        Some(task) => Ok(make(l, task, Some(&t), by)?.folder().id.clone()),
        None => Ok(t),
    }
}

/// Name `id` `name`. An agent never renames a folder he named; his
/// rename makes the name his.
pub fn rename(l: &mut Library, id: &str, name: &str, by: &str) -> Result<(), String> {
    let name = clean(name)?;
    let f = live_mut(l, id)?.clone();
    if by != YOU && f.named_by_you {
        return Err(format!("{} was named by you: an agent never renames it", f.name));
    }
    if named(l, f.parent.as_deref(), &name).is_some_and(|g| g.id != id) {
        return Err(format!("a folder here is already named {name}"));
    }
    let f = live_mut(l, id)?;
    f.name = name;
    if by == YOU {
        f.named_by_you = true;
    }
    Ok(())
}

/// Put folder `id` in `parent` (none: at the top). A folder with folders
/// inside stays at the top (2 levels).
pub fn nest(l: &mut Library, id: &str, parent: Option<&str>) -> Result<(), String> {
    let f = live_mut(l, id)?.clone();
    if let Some(p) = parent {
        if p == id {
            return Err(format!("{} cannot go inside itself", f.name));
        }
        top_level(l, p)?;
        if children(l, id).next().is_some() {
            return Err(format!("folders go {DEPTH} levels deep at most: {} has folders inside", f.name));
        }
    }
    if named(l, parent, &f.name).is_some_and(|g| g.id != id) {
        return Err(format!("a folder there is already named {}", f.name));
    }
    live_mut(l, id)?.parent = parent.map(str::to_string);
    Ok(())
}

/// Merge `from` into `into`: every artifact of `from` reads as in `into`
/// (a redirect: no meta.json rewritten), and `from` leaves the list. Its
/// sub-folders: into a theme they move in (one with a name already there
/// merges into that one); into a task folder they merge into it too.
pub fn merge(l: &mut Library, from: &str, into: &str) -> Result<(), String> {
    let (src, dst) = (live_mut(l, from)?.clone(), live_mut(l, into)?.clone());
    if from == into {
        return Err(format!("{} is already itself", src.name));
    }
    if dst.parent.as_deref() == Some(from) {
        return Err(format!("{} is inside {}: merge it the other way", dst.name, src.name));
    }
    let kids: Vec<Folder> = children(l, from).cloned().collect();
    for k in kids {
        if dst.parent.is_some() {
            merge(l, &k.id, into)?;
        } else if let Some(same) = named(l, Some(into), &k.name).map(|f| f.id.clone()) {
            merge(l, &k.id, &same)?;
        } else {
            live_mut(l, &k.id)?.parent = Some(into.to_string());
        }
    }
    live_mut(l, from)?.into = Some(into.to_string());
    Ok(())
}

/// Take `id` out, with its sub-folders: their artifacts read as unfiled
/// (no artifact is deleted, no meta.json rewritten).
pub fn delete(l: &mut Library, id: &str) -> Result<(), String> {
    live_mut(l, id)?;
    let gone: BTreeSet<String> =
        std::iter::once(id.to_string()).chain(children(l, id).map(|f| f.id.clone())).collect();
    l.folders.retain(|f| !gone.contains(&f.id));
    Ok(())
}

/// The inverse of going from `before` to `after` (folders only).
pub fn inverse(before: &Library, after: &Library) -> Undo {
    let remove = after.folders.iter().filter(|f| get(before, &f.id).is_none()).map(|f| f.id.clone()).collect();
    let restore = before.folders.iter().filter(|f| get(after, &f.id) != Some(*f)).cloned().collect();
    Undo { remove, restore, moves: Vec::new() }
}

/// Apply an undo's folder part (its moves are the caller's).
pub fn apply(l: &mut Library, u: &Undo) {
    l.folders.retain(|f| !u.remove.contains(&f.id));
    for r in &u.restore {
        match l.folders.iter_mut().find(|f| f.id == r.id) {
            Some(f) => *f = r.clone(),
            None => l.folders.push(r.clone()),
        }
    }
}

// ---- the file ----

fn s(v: &Value, k: &str) -> Option<String> {
    v.get(k).and_then(Value::as_str).filter(|s| !s.is_empty()).map(str::to_string)
}

const FOLDER_KEYS: &[&str] = &["id", "name", "parent", "by", "named_by_you", "into"];

fn folder_of(v: &Value) -> Option<Folder> {
    let o = v.as_object()?;
    Some(Folder {
        id: s(v, "id")?,
        name: s(v, "name").unwrap_or_default(),
        parent: s(v, "parent"),
        by: s(v, "by").unwrap_or_default(),
        named_by_you: v.get("named_by_you").and_then(Value::as_bool).unwrap_or(false),
        into: s(v, "into"),
        extra: o.iter().filter(|(k, _)| !FOLDER_KEYS.contains(&k.as_str())).map(|(k, v)| (k.clone(), v.clone())).collect(),
    })
}

fn folder_json(f: &Folder) -> Value {
    let mut o = f.extra.clone();
    o.insert("id".into(), json!(f.id));
    o.insert("name".into(), json!(f.name));
    if let Some(p) = &f.parent {
        o.insert("parent".into(), json!(p));
    }
    o.insert("by".into(), json!(f.by));
    o.insert("named_by_you".into(), json!(f.named_by_you));
    if let Some(i) = &f.into {
        o.insert("into".into(), json!(i));
    }
    Value::Object(o)
}

fn undo_of(v: &Value) -> Option<Undo> {
    let list = |k: &str| v.get(k).and_then(Value::as_array).cloned().unwrap_or_default();
    let u = Undo {
        remove: list("remove").iter().filter_map(|x| x.as_str().map(str::to_string)).collect(),
        restore: list("restore").iter().filter_map(folder_of).collect(),
        moves: list("moves")
            .iter()
            .filter_map(|m| Some(Move { project: s(m, "project")?, id: s(m, "id")?, folder: s(m, "folder") }))
            .collect(),
    };
    (!u.is_empty()).then_some(u)
}

fn undo_json(u: &Undo) -> Value {
    json!({
        "remove": u.remove,
        "restore": u.restore.iter().map(folder_json).collect::<Vec<_>>(),
        "moves": u.moves.iter().map(|m| json!({"project": m.project, "id": m.id, "folder": m.folder})).collect::<Vec<_>>(),
    })
}

/// The file's library. A file that is not ours (bad JSON, no list) reads
/// as empty; a folder with no id is skipped.
pub fn parse(text: &str) -> Library {
    let v: Value = serde_json::from_str(text).unwrap_or(Value::Null);
    let Some(o) = v.as_object() else { return Library::default() };
    Library {
        folders: o.get("folders").and_then(Value::as_array).into_iter().flatten().filter_map(folder_of).collect(),
        undo: o.get("undo").and_then(undo_of),
        extra: o.iter().filter(|(k, _)| !["v", "folders", "undo"].contains(&k.as_str())).map(|(k, v)| (k.clone(), v.clone())).collect(),
    }
}

/// The file's text for `l`.
pub fn render(l: &Library) -> String {
    let mut o = l.extra.clone();
    o.insert("v".into(), json!(1));
    o.insert("folders".into(), Value::Array(l.folders.iter().map(folder_json).collect()));
    if let Some(u) = &l.undo {
        o.insert("undo".into(), undo_json(u));
    }
    serde_json::to_string_pretty(&Value::Object(o)).unwrap_or_default() + "\n"
}

/// The library as the file has it (empty: no file, the legacy layout).
pub fn read(home: &Home) -> Library {
    home.library_folders().and_then(|f| std::fs::read_to_string(f).ok()).map(|t| parse(&t)).unwrap_or_default()
}

/// The live folders as an event's rows (`{id, name, parent?, by,
/// named_by_you}`), for the hubs' `artifacts` event and the core.
pub fn rows(l: &Library) -> Vec<Value> {
    live(l)
        .map(|f| {
            let mut v = json!({"id": f.id, "name": f.name, "by": f.by, "named_by_you": f.named_by_you});
            if let Some(p) = &f.parent {
                v["parent"] = json!(p);
            }
            v
        })
        .collect()
}

/// The one writer: under an exclusive lock, read the library, let `f`
/// change it, [`check`] it, write it whole (tmp + rename). `f`'s error or
/// a failed check writes nothing. `his`: his change, whose inverse takes
/// the undo slot (an agent's leaves it as it is). A file a newer bise
/// wrote (`v` > 1) is never written over.
pub fn update<T>(home: &Home, his: bool, f: impl FnOnce(&mut Library) -> Result<T, String>) -> Result<T, String> {
    let file = home.library_folders().ok_or_else(|| LEGACY.to_string())?;
    let dir = file.parent().map(PathBuf::from).unwrap_or_default();
    std::fs::create_dir_all(&dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    let _lock = crate::projects::lock(&file.with_extension("json.lock"))?;
    let text = std::fs::read_to_string(&file).unwrap_or_default();
    if let Some(v) = serde_json::from_str::<Value>(&text).ok().and_then(|v| v.get("v").and_then(Value::as_u64)) {
        if v > 1 {
            return Err(format!("{} was written by a newer bise (v{v}): not changed", file.display()));
        }
    }
    let before = parse(&text);
    let mut lib = before.clone();
    let out = f(&mut lib)?;
    check(&lib)?;
    if his {
        let u = inverse(&before, &lib);
        if !u.is_empty() {
            lib.undo = Some(u);
        }
    }
    crate::prefs::write_atomic(&file, &render(&lib)).map_err(|e| format!("{}: {e}", file.display()))?;
    Ok(out)
}

/// His move of artifacts, done by their hubs: its inverse (each one's
/// folder before) takes the undo slot.
pub fn remember_moves(home: &Home, moves: Vec<Move>) -> Result<(), String> {
    update(home, false, |l| {
        if !moves.is_empty() {
            l.undo = Some(Undo { moves, ..Undo::default() });
        }
        Ok(())
    })
}

/// Undo his last change: its folder part here, once (the slot empties);
/// the artifacts it moved come back for the caller to send to their hubs.
/// Nothing to undo: an error. A folder put back whose place is gone since
/// goes to the top.
pub fn undo(home: &Home) -> Result<Vec<Move>, String> {
    update(home, false, |l| {
        let u = l.undo.take().ok_or_else(|| "nothing to undo".to_string())?;
        apply(l, &u);
        let orphans: Vec<String> = live(l)
            .filter(|f| f.parent.as_deref().is_some_and(|p| top_level(l, p).is_err()))
            .map(|f| f.id.clone())
            .collect();
        for id in orphans {
            live_mut(l, &id)?.parent = None;
        }
        Ok(u.moves)
    })
}

/// One change of his (`bise_proto::rows::FolderOp`, mapped by each
/// caller: this crate knows no protocol).
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Op {
    Make { name: String, parent: Option<String> },
    Rename { id: String, name: String },
    Nest { id: String, parent: Option<String> },
    Merge { from: String, into: String },
    Delete { id: String },
    Undo,
}

/// What [`run`] did that the caller must know: the folder a make made
/// (or found), the artifacts an undo moves back (to send to their hubs).
#[derive(Clone, Debug, PartialEq, Eq, Default)]
pub struct Done {
    pub made: Option<String>,
    pub moves: Vec<Move>,
}

/// His change `op`, written through [`update`] (it takes the undo slot;
/// an undo empties it): the desktop core's and the hub's
/// `artifacts/folders` one path.
pub fn run(home: &Home, op: Op) -> Result<Done, String> {
    let ok = |_| Done::default();
    match op {
        Op::Make { name, parent } => {
            update(home, true, |l| make(l, &name, parent.as_deref(), YOU)).map(|m| Done { made: Some(m.folder().id.clone()), moves: Vec::new() })
        }
        Op::Rename { id, name } => update(home, true, |l| rename(l, &id, &name, YOU)).map(ok),
        Op::Nest { id, parent } => update(home, true, |l| nest(l, &id, parent.as_deref())).map(ok),
        Op::Merge { from, into } => update(home, true, |l| merge(l, &from, &into)).map(ok),
        Op::Delete { id } => update(home, true, |l| delete(l, &id)).map(ok),
        Op::Undo => undo(home).map(|moves| Done { made: None, moves }),
    }
}

impl Home {
    /// `library/folders.json` (bise layout only).
    pub fn library_folders(&self) -> Option<PathBuf> {
        (self.layout == Layout::Bise).then(|| self.root.join(DIR).join(FILE))
    }
}

#[cfg(test)]
#[path = "library_tests.rs"]
mod tests;
