// His folder edits as the desktop core's commands (art-store's AppCmd folders / folders_move,
// architect m_39721): the core writes ~/.bise/library/folders.json for make, rename, merge,
// delete, undo; a move goes to each artifact's own hub (artifacts/move), the only writer of its
// meta.json. Pure: the screen hands them to store.command. Owner: art-folders.
import type { FolderItem, FolderOp } from '@/proto';
import type { Item } from './model';

export type { FolderOp };

/** The core's command for an edit. Pure. */
export function folderCmd(op: FolderOp): { cmd: 'folders'; op: FolderOp } {
  return { cmd: 'folders', op };
}

/** The core's command that moves these artifacts to a folder (null: unfiled), each with its folder before. Pure. */
export function moveCmd(items: readonly Item[], folder: string | null, fromOf: (it: Item) => string | null): { cmd: 'folders_move'; items: FolderItem[]; folder?: string } {
  const rows = items.map((it) => {
    const from = fromOf(it);
    return from === null ? { project: it.project, id: it.a.id } : { project: it.project, id: it.a.id, from };
  });
  return folder === null ? { cmd: 'folders_move', items: rows } : { cmd: 'folders_move', items: rows, folder };
}
