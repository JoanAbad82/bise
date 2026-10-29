// The artifacts library (bise fait mac mockup 7, decision d2; page artifacts-gallery v7): the
// 'library' label, all artifacts, recent, unfiled (each with its line icon), then the 'folders'
// label with its + and the folders (the same for every project). Rows 28, margin 0 8, r 6, the
// chosen one --c-active; labels 12/500 text-3, 28 high, 12 above (nm-frame's sidebar rows). It
// draws in the window's sidebar on the artifacts route (ArtLibrary, library.tsx, `side`), else in
// the page's own column. A theme opens under itself onto its task folders (4, then 'N more'). At
// rest a row is its name and, in pink, a dot when something new is inside; its count shows on hover
// or focus only, in the dot's place, and for 2 s after a drop on it (density rule 2). The folders'
// + puts a field in the list at its place; F2 or a double-click renames one in place; a right-click
// opens the folder's menu. A row takes a drop (drag.ts: holding 600 ms on a closed theme opens it).
// Under 900 px the same rows sit in the crumb's popover (Fold.tsx). A pure render of its props:
// Screen.tsx holds the state. Owner: nm-pages-a (art-folders' before).
import type { DragEvent, KeyboardEvent, MouseEvent } from 'react';
import { AppIcon, Input, Press, sentenceCase, tipAttrs, type AppIconName } from '@/ds';
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
  /** drawn in the window's sidebar (ArtLibrary, library.tsx): the sidebar's rows, not sticky */
  readonly side?: boolean;
  /** ⌘ held (app/held.ts): each of the first 9 rows shows its ⌘1-9 in its end (rail-keys, designer m_45492) */
  readonly digits?: boolean;
  readonly testId: string;
}

/** The places the column draws, top to bottom: All artifacts, Recent, Unfiled, then each theme and,
 *  open, the tasks it shows. ⌘1-9 go to the first nine (app/keys.ts); the column numbers them the
 *  same way. Pure. */
export function columnPlaces(p: Pick<ColumnProps, 'lib' | 'open' | 'full'>): At[] {
  const out: At[] = [{ at: 'all' }, { at: 'recent' }, { at: 'unfiled' }];
  for (const t of p.lib.themes) {
    out.push({ at: 'folder', id: t.id });
    if (!p.open.has(t.id)) continue;
    const tasks = p.lib.tasks.get(t.id) ?? [];
    for (const f of p.full.has(t.id) ? tasks : tasks.slice(0, TASKS_SHOWN)) out.push({ at: 'folder', id: f.id });
  }
  return out;
}

/** A place's ⌘ digit in the column (1-9), none past the ninth. Pure. */
function digitOf(places: readonly At[], at: At): number | undefined {
  const i = places.findIndex((x) => same(x, at));
  return i >= 0 && i < 9 ? i + 1 : undefined;
}

function Digit({ n, testId }: { n: number | undefined; testId: string }) {
  return n === undefined ? null : (
    <span className="end">
      <kbd data-testid={`${testId}.digit`}>{`⌘${String(n)}`}</kbd>
    </span>
  );
}

const same = (a: At, b: At) => a.at === b.at && (a.at !== 'folder' || (b.at === 'folder' && a.id === b.id));

export function FolderColumn(p: ColumnProps) {
  const { lib, counts, at, testId } = p;
  // ⌘ held: the first nine places' ⌘1-9 in their ends, in place of the dot or the count
  const places = p.digits === true ? columnPlaces(p) : [];
  const digit = (a: At) => (p.digits === true ? digitOf(places, a) : undefined);
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
        on={same(at, { at: 'folder', id: f.id })} digit={digit({ at: 'folder', id: f.id })} count={counts.get(f.id)} flash={p.flash === f.id} over={p.drop?.over === f.id}
        onGo={() => { p.onGo({ at: 'folder', id: f.id }); }} onToggle={() => { p.onToggle(f.id); }} onRename={() => { p.onRename(f.id); }}
        onMenu={(e) => { p.onMenu(f.id, e); }} drop={p.drop} testId={`${testId}.f.${f.id}`} />
    );
  };
  return (
    <nav className={`art-col${p.side === true ? ' side' : ''}`} aria-label={library.library_head} data-testid={testId}>
      <div className="art-col-head">{library.library_head}</div>
      <PlaceRow icon="artifacts" name={sentenceCase(library.all_artifacts)} on={at.at === 'all'} digit={digit({ at: 'all' })} onGo={() => { p.onGo({ at: 'all' }); }} testId={`${testId}.all`} />
      <PlaceRow icon="scheduled" name={library.recent} on={at.at === 'recent'} digit={digit({ at: 'recent' })} onGo={() => { p.onGo({ at: 'recent' }); }} testId={`${testId}.recent`} />
      <PlaceRow icon="inbox" name={sentenceCase(library.unfiled)} on={at.at === 'unfiled'} digit={digit({ at: 'unfiled' })} count={counts.get('unfiled')} countAtRest
        over={p.drop?.over === 'unfiled'} drop={p.drop} dropId="unfiled" flash={p.flash === 'unfiled'}
        onGo={() => { p.onGo({ at: 'unfiled' }); }} testId={`${testId}.unfiled`} />
      {/* the folders' label, its + at its end (mockup 7): a field for a new folder's name */}
      <div className="art-col-head">
        <span className="nm">{library.folders}</span>
        <Press look="art-col-add" onClick={p.onNew} aria-label={library.new_folder_tip} data-testid={`${testId}.new`} {...tipAttrs(library.new_folder_tip)}>
          <AppIcon name="plus" size={14} />
        </Press>
      </div>
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
    </nav>
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

function PlaceRow(p: { icon: AppIconName; name: string; on: boolean; digit?: number | undefined; count?: Count | undefined; countAtRest?: boolean; over?: boolean; flash?: boolean; drop?: DropTarget | undefined; dropId?: string; onGo: () => void; testId: string }) {
  return (
    <Press look="art-col-row" aria-current={p.on || undefined} data-over={p.over || undefined} onClick={p.onGo} data-testid={p.testId}
      {...(p.dropId === undefined ? {} : dropAttrs(p.drop, p.dropId))}>
      <AppIcon name={p.icon} size={16} />
      <span className="nm">{p.name}</span>
      {p.digit !== undefined ? <Digit n={p.digit} testId={p.testId} /> : p.count !== undefined && p.count.total > 0 && <End count={p.count} atRest={p.countAtRest} flash={p.flash} />}
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
  digit: number | undefined;
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
      {p.theme && <AppIcon name="folder" size={16} />}
      <span className="nm" {...tipAttrs(p.name)}>{p.name}</span>
      {p.digit !== undefined ? <Digit n={p.digit} testId={p.testId} /> : <End count={p.count} flash={p.flash} />}
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
