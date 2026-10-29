// m: the move-to picker (page artifacts-gallery v7 'déplacer'): 'move "agent view fixes" to…', a
// field 'type a folder', then the recent folders first (a digit picks each), then every folder (→
// opens a theme onto its tasks, ← back); typing filters, and when no folder has the typed name
// '+ new folder "pa"' makes it (⌘⏎). Its foot is one line, key-bar style: '⏎ move   1-3 pick
// → open   esc back'. The ds PickerPop from the picked card (the menu law); the field keeps the keys
// and drives the active row. Owner: art-folders.
import { useRef, useState, type KeyboardEvent } from 'react';
import { AppIcon, Input, PickerPop, type PickerGroup } from '@/ds';
import { library } from '@/proto/words_library.gen';
import { moveRows, nameOf, type Library, type MoveRow } from './folders';
import { MenuAnchor, type MenuAt } from './Menus';

export interface MovePickerProps {
  readonly lib: Library;
  /** the picked card's box */
  readonly at: MenuAt;
  /** the picker's title: one artifact's name, or how many */
  readonly title: string;
  /** the folder they are in now (left out of the rows), null unfiled or several */
  readonly from: string | null;
  readonly recent: readonly string[];
  /** a folder id or 'unfiled' */
  readonly onMove: (folder: string) => void;
  /** makes a folder of this name (at the top, or in the theme open in the picker), then moves there */
  readonly onMake: (name: string, parent: string | null) => void;
  readonly onClose: () => void;
  readonly testId: string;
}

/** The rows' ids the keys walk, in order. Pure. */
export function walkOf(rows: { recent: readonly MoveRow[]; all: readonly MoveRow[]; make: string | null }): string[] {
  return [...rows.recent.map((r) => `r:${r.id}`), ...rows.all.map((r) => `a:${r.id}`), ...(rows.make === null ? [] : ['new'])];
}

/** The keys line: '⏎ move   1-3 pick   → open   esc back' (only what applies). Pure. */
export function moveKeys(digits: number, canOpen: boolean, canMake: boolean): string {
  const parts = [`⏎ ${library.key_move}`];
  if (digits > 0) parts.push(`${digits === 1 ? '1' : `1-${String(digits)}`} ${library.key_pick}`);
  if (canOpen) parts.push(`→ ${library.key_open}`);
  if (canMake) parts.push(`⌘⏎ ${library.key_new}`);
  parts.push(`esc ${library.key_back}`);
  return parts.join('   ');
}

export function MovePicker(p: MovePickerProps) {
  const anchor = useRef<HTMLSpanElement>(null);
  const [typed, setTyped] = useState('');
  // a theme opened with →: its tasks only, ← goes back
  const [inside, setInside] = useState<string | null>(null);
  const rows = moveRows(p.lib, typed, p.recent, p.from, inside);
  const walk = walkOf(rows);
  const [active, setActive] = useState<string | null>(null);
  const on = active !== null && walk.includes(active) ? active : (walk[0] ?? null);
  const byWalk = new Map<string, MoveRow>([...rows.recent.map((r) => [`r:${r.id}`, r] as const), ...rows.all.map((r) => [`a:${r.id}`, r] as const)]);
  const digits = [...rows.recent, ...rows.all].filter((r) => r.digit !== undefined).length;
  const make = () => {
    const name = typed.trim();
    if (name !== '') p.onMake(name, inside);
  };
  const pick = (id: string) => {
    if (id === 'new') {
      make();
      return;
    }
    const r = byWalk.get(id);
    if (r !== undefined) p.onMove(r.id);
  };
  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    const stop = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    if (e.key === 'Escape') {
      stop();
      if (inside !== null) setInside(null);
      else p.onClose();
    } else if (e.key === 'Enter') {
      stop();
      if (e.metaKey || e.ctrlKey) make();
      else if (on !== null) pick(on);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      stop();
      const i = on === null ? -1 : walk.indexOf(on);
      const next = walk[Math.max(0, Math.min(walk.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))];
      if (next !== undefined) setActive(next);
    } else if (e.key === 'ArrowRight' && typed === '') {
      const r = on === null ? undefined : byWalk.get(on);
      if (r?.opens === true) {
        stop();
        setInside(r.id);
        setActive(null);
      }
    } else if (e.key === 'ArrowLeft' && typed === '' && inside !== null) {
      stop();
      setInside(null);
      setActive(null);
    } else if (/^[1-9]$/u.test(e.key) && typed === '') {
      const r = [...rows.recent, ...rows.all].find((x) => x.digit === Number(e.key));
      if (r !== undefined) {
        stop();
        p.onMove(r.id);
      }
    } else {
      e.stopPropagation();
    }
  };
  const rowOf = (prefix: string) => (r: MoveRow) => ({
    id: `${prefix}${r.id}`,
    name: r.name,
    glyph: r.id === 'unfiled' ? undefined : <AppIcon name="folder" size={16} />,
    secondary: r.where === '' ? undefined : r.where,
    trailing: r.digit !== undefined ? String(r.digit) : r.opens === true ? '▸' : undefined,
    testId: `${p.testId}.row.${r.id}`,
  });
  const groups: PickerGroup[] = [];
  if (rows.recent.length > 0) groups.push({ id: 'recent', head: library.recent, rows: rows.recent.map(rowOf('r:')) });
  if (rows.all.length > 0) {
    groups.push({ id: 'all', head: typed !== '' ? undefined : inside !== null ? nameOf(p.lib, inside) : library.all_folders, rows: rows.all.map(rowOf('a:')) });
  }
  if (rows.make !== null) {
    groups.push({ id: 'make', rows: [{ id: 'new', name: library.new_folder_named({ name: rows.make }), trailing: '⌘⏎', testId: `${p.testId}.new` }] });
  }
  return (
    <>
    <MenuAnchor at={p.at} anchor={anchor} />
    <PickerPop anchor={anchor} align="start" inline active={on} onClose={p.onClose} onPick={pick} testId={p.testId}
      title={
        <span className="art-move-head">
          <span className="art-move-title">{p.title}</span>
          <Input look="art-move-field" autoFocus value={typed} placeholder={library.type_folder} aria-label={library.type_folder}
            onChange={(e) => { setTyped(e.currentTarget.value); setActive(null); }} onKeyDown={key} data-testid={`${p.testId}.field`} />
        </span>
      }
      groups={groups}
      keyline={moveKeys(digits, rows.all.some((r) => r.opens === true) && typed === '', rows.make !== null)} />
    </>
  );
}
