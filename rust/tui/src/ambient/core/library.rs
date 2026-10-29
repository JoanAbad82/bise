//! The artifacts library's folders, his edits in the desktop
//! (docs/artifacts.md, "Folders"; architect m_39651): the core writes
//! `library/folders.json` through `bise_home::library`, its one writer,
//! and moves artifacts only through their hubs (`artifacts_move`, the hub
//! started if needed, as for pages): it never writes a meta.json. The
//! hubs see the file change on their tick and send `artifacts` again.

use super::Core;
use bise_home::library::{self, Move, Op};
use bise_proto::app_cmd::FolderItem;
use bise_proto::core_ev::CoreEv;
use bise_proto::rows::{Folder, FolderOp};
use serde_json::json;
use std::collections::BTreeMap;

fn home() -> bise_home::Home {
    bise_home::Home::from_env()
}

/// The protocol's op as the library's.
pub(super) fn op_of(op: FolderOp) -> Op {
    match op {
        FolderOp::Make { name, parent } => Op::Make { name, parent },
        FolderOp::Rename { id, name } => Op::Rename { id, name },
        FolderOp::Nest { id, parent } => Op::Nest { id, parent },
        FolderOp::Merge { from, into } => Op::Merge { from, into },
        FolderOp::Delete { id } => Op::Delete { id },
        FolderOp::Undo => Op::Undo,
    }
}

/// The live folders as the protocol's rows.
pub(super) fn rows(l: &library::Library) -> Vec<Folder> {
    library::live(l)
        .map(|f| Folder { id: f.id.clone(), name: f.name.clone(), parent: f.parent.clone(), by: f.by.clone(), named_by_you: f.named_by_you })
        .collect()
}

/// Moves grouped by project, then by folder: one `artifacts_move` each.
pub(super) fn grouped(moves: impl IntoIterator<Item = Move>) -> BTreeMap<(String, Option<String>), Vec<String>> {
    let mut out: BTreeMap<(String, Option<String>), Vec<String>> = BTreeMap::new();
    for m in moves {
        out.entry((m.project, m.folder)).or_default().push(m.id);
    }
    out
}

/// `moved plan to docs/pricing`, `moved 3 artifacts to unfiled`.
pub(super) fn moved_text(n: usize, one: &str, place: &str) -> String {
    if n == 1 {
        format!("moved {one} to {place}")
    } else {
        format!("moved {n} artifacts to {place}")
    }
}

impl Core {
    /// `folders {op}`: his change written; an undo's moves sent back to
    /// their hubs. `library_folders` answers, or an error with the library's words.
    pub(super) fn folders(&mut self, op: FolderOp) {
        let undo = matches!(op, FolderOp::Undo);
        match library::run(&home(), op_of(op)) {
            Ok(done) => {
                let n = done.moves.len();
                self.send_moves(grouped(done.moves));
                let notice = undo.then(|| if n > 0 { format!("✓ {n} back where {} were", if n == 1 { "it" } else { "they" }) } else { "✓ undone".into() });
                self.ev(CoreEv::LibraryFolders { folders: rows(&library::read(&home())), made: done.made, notice });
            }
            Err(e) => self.setup_error("folders", &e),
        }
    }

    /// `folders_move {items, folder}`: the undo slot gets their folders
    /// before, then each project's hub moves its own.
    pub(super) fn folders_move(&mut self, items: Vec<FolderItem>, folder: Option<String>) {
        if items.is_empty() {
            return self.setup_error("folders_move", "nothing to move");
        }
        let lib = library::read(&home());
        let place = match &folder {
            Some(f) => match library::path_of(&lib, f) {
                Some(p) => p,
                None => return self.setup_error("folders_move", &format!("no folder {f}")),
            },
            None => "unfiled".into(),
        };
        let back: Vec<Move> = items.iter().map(|i| Move { project: i.project.clone(), id: i.id.clone(), folder: i.from.clone() }).collect();
        if let Err(e) = library::remember_moves(&home(), back) {
            return self.setup_error("folders_move", &e);
        }
        let notice = moved_text(items.len(), &items[0].id, &place);
        let there = items.into_iter().map(|i| Move { project: i.project, id: i.id, folder: folder.clone() });
        self.send_moves(grouped(there));
        self.ev(CoreEv::LibraryFolders { folders: rows(&lib), made: None, notice: Some(notice) });
    }

    /// One `artifacts_move` per project and folder, the undo slot left
    /// to the core (`keep_undo`).
    fn send_moves(&mut self, groups: BTreeMap<(String, Option<String>), Vec<String>>) {
        for ((project, folder), ids) in groups {
            self.typed_cmd(json!({"cmd": "artifacts_move", "project": project, "ids": ids, "folder": folder, "keep_undo": true}));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn moves_go_one_per_project_and_folder() {
        let m = |p: &str, id: &str, f: Option<&str>| Move { project: p.into(), id: id.into(), folder: f.map(String::from) };
        let g = grouped([m("a", "x", Some("f-1")), m("b", "y", None), m("a", "z", Some("f-1")), m("a", "w", None)]);
        let keys: Vec<_> = g.iter().map(|((p, f), ids)| (p.as_str(), f.as_deref(), ids.len())).collect();
        assert_eq!(keys, vec![("a", None, 1), ("a", Some("f-1"), 2), ("b", None, 1)]);
    }

    #[test]
    fn the_toast_words() {
        assert_eq!(moved_text(1, "plan", "docs/pricing"), "moved plan to docs/pricing");
        assert_eq!(moved_text(3, "plan", "unfiled"), "moved 3 artifacts to unfiled");
    }
}
