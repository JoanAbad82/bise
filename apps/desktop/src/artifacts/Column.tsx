// The folder column (page artifacts-gallery v7 'la page', 200 px, rows of --h-row-tight): all
// artifacts, recent, unfiled, then the folders (the same for every project). A theme opens under
// itself onto its task folders (4, then 'N more'). At rest a row is its name and, in pink, a dot
// when something new is inside; its count shows on hover or focus only, in the dot's place, and
// for 2 s after a drop on it (density rule 2). '+ new folder' puts a field in the column at its
// place; F2 or a double-click renames one in place; a right-click opens the folder's menu. A row
// takes a drop (drag.ts: holding 600 ms on a closed theme opens it). Under 900 px the same rows sit
// in the crumb's popover (Fold.tsx). A pure render of its props: Screen.tsx holds the state.
// Owner: art-folders.
import type { DragEvent, KeyboardEvent, MouseEvent } from 'react';
import { Input, Press, tipAttrs } from '@/ds';
import { library } from '@/proto/words_library.gen';
import { countWords, type At, type Count, type Folder, type Library } from './folders';

/** How many task folders an open theme shows before its 'N more'. */
export const TASKS_SHOWN = 4;

/** A field in the column: a new folder (in a theme or at the top) or a rename. */
export type Editing = { readonly kind: 'new'; readonly parent: string | null } | { readonly kind: 'rename'; readonly id: string } | null;

/** What a row needs to take a drop (drag.ts's useDrop builds it). */
export interface DropTarget {
  /** the row a drag is over now */
  readonly over: string | null;
  readonly onDragOver: (id: string, e: DragEvent) => void;
  readonly onDragLeave: (id: string) => void;
  readonly onDrop: (id: string, e: DragEvent) => void;
}

export interface ColumnProps {
  readonly lib: Library;
  readonly counts: ReadonlyMap<string, Count>;
  readonly at: At;
  /** the themes open under themselves */
  readonly open: ReadonlySet<string>;
  /** the themes showing all their tasks (past 'N more') */
  readonly full: ReadonlySet<string>;
  readonly editing: Editing;
  /** a row whose count shows for 2 s (a drop just landed on it) */
  readonly flash: string | null;
  readonly drop?: DropTarget;
  readonly onGo: (at: At) => void;
  readonly onToggle: (theme: string) => void;
  readonly onMore: (theme: string) => void;
  readonly onNew: () => void;
  readonly onRename: (id: string) => void;
  /** the field's ⏎ (its words) or esc (null) */
  readonly onEdited: (name: string | null) => void;
  readonly onMenu: (id: string, e: MouseEvent) => void;
  readonly testId: string;
}

const same = (a: At, b: At) => a.at === b.at && (a.at !== 'folder' || (b.at === 'folder' && a.id === b.id));

export function FolderColumn(p: ColumnProps) {
  const { lib, counts, at, testId } = p;
  const field = (parent: string | null) =>
    p.editing?.kind === 'new' && p.editing.parent === parent ? <EditRow key={`new:${parent ?? ''}`} indent={parent !== null} initial="" onEdited={p.onEdited} testId={`${testId}.field`} /> : null;
  const folderRow = (f: Folder, indent: boolean) => {
    if (p.editing?.kind === 'rename' && p.editing.id === f.id) {
      return <EditRow key={f.id} indent={indent} initial={f.name} onEdited={p.onEdited} testId={`${testId}.field`} />;
    }
    const tasks = lib.tasks.get(f.id) ?? [];
    const isOpen = p.open.has(f.id);
    return (
      <FolderRow key={f.id} id={f.id} name={f.name} indent={indent} theme={!indent} hasTasks={tasks.length > 0} isOpen={isOpen}
        on={same(at, { at: 'folder', id: f.id })} count={counts.get(f.id)} flash={p.flash === f.id} over={p.drop?.over === f.id}
        onGo={() => { p.onGo({ at: 'folder', id: f.id }); }} onToggle={() => { p.onToggle(f.id); }} onRename={() => { p.onRename(f.id); }}
        onMenu={(e) => { p.onMenu(f.id, e); }} drop={p.drop} testId={`${testId}.f.${f.id}`} />
    );
  };
  return (
    <nav className="art-col" aria-label={library.folders} data-testid={testId}>
      <PlaceRow name={library.all_artifacts} on={at.at === 'all'} onGo={() => { p.onGo({ at: 'all' }); }} testId={`${testId}.all`} />
      <PlaceRow name={library.recent} on={at.at === 'recent'} onGo={() => { p.onGo({ at: 'recent' }); }} testId={`${testId}.recent`} />
      <PlaceRow name={library.unfiled} on={at.at === 'unfiled'} count={counts.get('unfiled')} countAtRest
        over={p.drop?.over === 'unfiled'} drop={p.drop} dropId="unfiled" flash={p.flash === 'unfiled'}
        onGo={() => { p.onGo({ at: 'unfiled' }); }} testId={`${testId}.unfiled`} />
      <div className="art-col-head">{library.folders}</div>
      {lib.themes.map((t) => {
        const tasks = lib.tasks.get(t.id) ?? [];
        const shown = p.full.has(t.id) ? tasks : tasks.slice(0, TASKS_SHOWN);
        const more = tasks.length - shown.length;
        return [
          folderRow(t, false),
          ...(p.open.has(t.id)
            ? [
                ...shown.map((f) => folderRow(f, true)),
                more > 0 ? (
                  <Press key={`${t.id}:more`} look="art-col-row art-col-more" onClick={() => { p.onMore(t.id); }} data-testid={`${testId}.more.${t.id}`}>
                    <span className="nm">{library.n_more({ n: more })}</span>
                  </Press>
                ) : null,
                field(t.id),
              ]
            : []),
        ];
      })}
      {field(null)}
      <Press look="art-col-row art-col-new" onClick={p.onNew} data-testid={`${testId}.new`}>
        <span className="nm">{library.new_folder}</span>
      </Press>
    </nav>
  );
}

/** The folder's line icon (the mock's), 16 px, text-3. */
export function FolderIcon() {
  return (
    <svg className="art-folder-icon" viewBox="0 0 16 13" width="16" height="13" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round">
      <path d="M1 2.5a1 1 0 0 1 1-1h4l1.5 1.5h6.5a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1z" />
    </svg>
  );
}

/** A row's right end: the pink dot at rest when new is inside, the count on hover or focus (or always). */
function End({ count, atRest = false, flash = false }: { count: Count | undefined; atRest?: boolean; flash?: boolean }) {
  const fresh = count?.fresh ?? 0;
  return (
    <span className="end" data-rest={atRest || undefined} data-flash={flash || undefined}>
      {fresh > 0 && <span className="dot" {...tipAttrs(library.tip_new_dot({ n: fresh }))} />}
      {count !== undefined && (count.total > 0 || atRest) && <span className="ct" {...tipAttrs(library.tip_count({ n: count.n }))}>{countWords(count)}</span>}
    </span>
  );
}

function dropAttrs(drop: DropTarget | undefined, id: string) {
  if (drop === undefined) return {};
  return {
    onDragOver: (e: DragEvent) => { drop.onDragOver(id, e); },
    onDragLeave: () => { drop.onDragLeave(id); },
    onDrop: (e: DragEvent) => { drop.onDrop(id, e); },
  };
}

function PlaceRow(p: { name: string; on: boolean; count?: Count | undefined; countAtRest?: boolean; over?: boolean; flash?: boolean; drop?: DropTarget | undefined; dropId?: string; onGo: () => void; testId: string }) {
  return (
    <Press look="art-col-row" aria-current={p.on || undefined} data-over={p.over || undefined} onClick={p.onGo} data-testid={p.testId}
      {...(p.dropId === undefined ? {} : dropAttrs(p.drop, p.dropId))}>
      <span className="nm">{p.name}</span>
      {p.count !== undefined && p.count.total > 0 && <End count={p.count} atRest={p.countAtRest} flash={p.flash} />}
    </Press>
  );
}

interface FolderRowProps {
  id: string;
  name: string;
  indent: boolean;
  theme: boolean;
  hasTasks: boolean;
  isOpen: boolean;
  on: boolean;
  count: Count | undefined;
  flash: boolean;
  over: boolean;
  drop: DropTarget | undefined;
  onGo: () => void;
  onToggle: () => void;
  onRename: () => void;
  onMenu: (e: MouseEvent) => void;
  testId: string;
}

function FolderRow(p: FolderRowProps) {
  const key = (e: KeyboardEvent) => {
    if (e.key === 'F2') {
      e.preventDefault();
      p.onRename();
    }
  };
  return (
    <Press look={`art-col-row${p.indent ? ' in' : ''}`} aria-current={p.on || undefined} aria-expanded={p.hasTasks ? p.isOpen : undefined}
      data-over={p.over || undefined} data-folder={p.id}
      onClick={() => {
        if (p.hasTasks && (!p.isOpen || p.on)) p.onToggle();
        p.onGo();
      }}
      onDoubleClick={(e) => { e.preventDefault(); p.onRename(); }}
      onContextMenu={(e) => { e.preventDefault(); p.onMenu(e); }}
      onKeyDown={key} data-testid={p.testId} {...dropAttrs(p.drop, p.id)}>
      {p.theme && <FolderIcon />}
      <span className="nm" {...tipAttrs(p.name)}>{p.name}</span>
      <End count={p.count} flash={p.flash} />
    </Press>
  );
}

/** The column's field: a new folder's name or a rename, ⏎ keeps it, esc (or leaving it empty) drops it. */
function EditRow({ indent, initial, onEdited, testId }: { indent: boolean; initial: string; onEdited: (name: string | null) => void; testId: string }) {
  return (
    <span className={`art-col-edit${indent ? ' in' : ''}`}>
      <Input look="art-col-input" autoFocus defaultValue={initial} placeholder={library.folder_name} aria-label={library.folder_name} data-testid={testId}
        onFocus={(e) => { e.currentTarget.select(); }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            const v = e.currentTarget.value.trim();
            onEdited(v === '' ? null : v);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onEdited(null);
          }
        }}
        onBlur={(e) => {
          const v = e.currentTarget.value.trim();
          onEdited(v === '' || v === initial ? null : v);
        }} />
    </span>
  );
}
