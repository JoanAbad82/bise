// The artifacts screen, in folders (artifacts-folders brief part 4, page artifacts-gallery v7; route
// artifacts[/<p>]): one library for every project. The hero (ds PageHero, the bims still in its
// slot) scrolls away with the page; under it the 200 px folder column (Column.tsx; under 900 px
// folded into the crumb, Fold.tsx) and the place he is in: all artifacts (the themes as big tiles,
// then recent), recent, unfiled, a theme (its task folders as small tiles, then its cards), a
// task's folder (its cards by day). The filter row: the kind chips the place holds, the project
// scope at the search field (Scope.tsx, or 'in:<project>' typed), ▦ ☰. / searches every folder
// (Search.tsx). A card moves by a drag onto a folder or a tile (drag.ts), by m (MovePicker.tsx),
// by its right-click menu (Menus.tsx); ⌘/shift-click picks several, the selection bar comes up.
// Folders: + new folder in the column, F2 or a double-click renames, the folder menu merges or
// deletes (a dialog). Every move and folder edit has its undo (⌘Z, and the toast's). The grid, the
// cards, the stacks and the list view are art-grid's (Grid.tsx, Sheet.tsx). Owner: art-folders.
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Button, Field, IconButton, PageHero, Press, Sheet, tipAttrs, Toast } from '@/ds';
import { library } from '@/proto/words_library.gen';
import { useFolders, useProjects, useStore } from '@/store';
import { useRouter } from '@/app/router';
import { useKeptScroll } from '@/app/keep';
import { useAllArtifacts } from './hooks';
import { rowKey, useLook } from './List';
import { usePutInMessage } from './Open';
import { useGoArtifact } from './leave';
import { AddButton, AddDrop, useAddPlace } from './Drops';
import { ArtifactGrid } from './Grid';
import { StackSheet } from './Sheet';
import { useGridKeys, type View } from './gridKeys';
import { itemsOf, ownerOf, topOf, whenOf, type Card, type Place, type Stack } from './gallery';
import { Thumb } from './thumbs';
import { keyOf, revealPathOf, splitArchived, type Item } from './model';
import {
  atOfPath, atPath, chipOf, chipsOf, countsOf, coverOf, crumbOf, folderLine, groupByFolder, inFolder, itemsAt, libraryFacts, libraryOf,
  nameOf, nearestOf, parseQuery, pathOf, projectOfTyped, rememberMove, searchItems, titlePath, type At, type ChipKind, type Library,
} from './folders';
import { FolderColumn, type Editing } from './Column';
import { FoldCrumb, useNarrow } from './Fold';
import { MovePicker } from './MovePicker';
import { atOf, CardMenu, FolderMenu, MergePicker, type CardAct, type FolderAct, type MenuAt } from './Menus';
import { ProjectScope } from './Scope';
import { KindChips, NothingFound, SearchResults } from './Search';
import { BigTile, SmallTile } from './Tiles';
import { cardDrag, FLASH_MS, TOAST_MS, useBrief, useDrop } from './drag';
import { folderCmd, moveCmd, type FolderOp } from './ops';
import heroLight from './hero/artifacts-hero-light.png';
import heroDark from './hero/artifacts-hero-dark.png';
import './artifacts.css';
import './folders.css';

const RECENT_KEY = 'bise.artifacts.recentFolders';
const readRecent = (): string[] => {
  try {
    const v: unknown = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

/** What floats over the page: one at a time. */
type Over =
  | { readonly k: 'move'; readonly keys: readonly string[]; readonly at: MenuAt }
  | { readonly k: 'card'; readonly key: string; readonly at: MenuAt }
  | { readonly k: 'folder'; readonly id: string; readonly at: MenuAt }
  | { readonly k: 'merge'; readonly id: string; readonly at: MenuAt }
  | { readonly k: 'delete'; readonly id: string }
  | null;

/** What the page keeps across its places (each place is a route, the screen mounts anew): the
 *  view, the themes he opened, the ones shown past 'N more'. */
const mem: { view: View; open: ReadonlySet<string>; full: ReadonlySet<string> } = { view: 'grid', open: new Set(), full: new Set() };
const keepView = (v: View) => { mem.view = v; };
const keepOpen = (o: ReadonlySet<string>) => { mem.open = o; };
const keepFull = (f: ReadonlySet<string>) => { mem.full = f; };

export function ArtifactsScreen({ project = '', at: atRoute = '' }: { project?: string; at?: string }) {
  const store = useStore();
  const router = useRouter();
  const all = useAllArtifacts();
  const folders = useFolders();
  const projects = useProjects();
  useKeptScroll(`artifacts:${project}:${atRoute}`, () => document.querySelector<HTMLElement>('[data-testid="artifacts.scroll"]'));
  const [now] = useState(() => Date.now());
  // the scope and the place are the route's (the title bar's path follows the place)
  const scope = project;
  const at = atOfPath(atRoute);
  const [q, setQ] = useState('');
  const [chip, setChip] = useState<ChipKind | null>(null);
  const [view, setViewRaw] = useState<View>(mem.view);
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [anchorKey, setAnchorKey] = useState<string | null>(null);
  const [open, setOpenRaw] = useState<ReadonlySet<string>>(mem.open);
  const [full, setFullRaw] = useState<ReadonlySet<string>>(mem.full);
  const setView = (v: View) => { keepView(v); setViewRaw(v); };
  const setOpen = (o: ReadonlySet<string>) => { keepOpen(o); setOpenRaw(o); };
  const setFull = (f: ReadonlySet<string>) => { keepFull(f); setFullRaw(f); };
  const [whole, setWhole] = useState<ReadonlySet<string>>(new Set());
  const [editing, setEditing] = useState<Editing>(null);
  const [over, setOver] = useState<Over>(null);
  const [stack, setStack] = useState<Stack | null>(null);
  const [archivedOn, setArchivedOn] = useState(false);
  const [recent, setRecent] = useState<string[]>(readRecent);
  const [flash, setFlash] = useBrief<string>(FLASH_MS);
  const [toast, setToast] = useBrief<string>(TOAST_MS);
  // a move to a folder made from the picker (⌘⏎): sent once the folder is in the list
  const pendingMove = useRef<{ name: string; parent: string | null; keys: readonly string[] } | null>(null);
  const narrow = useNarrow();

  const go = (p: string, a: At) => {
    const path = atPath(a);
    router.go(path === '' ? { screen: 'artifacts', project: p } : { screen: 'artifacts', project: p, at: path });
  };
  const setAt = (a: At) => {
    if (a.at === 'folder') {
      const theme = folders.find((f) => f.id === a.id)?.parent ?? a.id;
      if (!open.has(theme)) setOpen(new Set([...open, theme]));
    }
    go(scope, a);
  };
  const setScope = (p: string) => { go(p, at); };


  const { live, archived } = splitArchived(all);
  const base = archivedOn ? archived : live;
  const lib = libraryOf(folders, all);
  const parsed = parseQuery(q);
  const typedProject = parsed.project === null ? null : projectOfTyped(projects.map((p) => ({ project: p.project, name: p.name })), parsed.project);
  const eff = typedProject ?? scope;
  const projectName = eff === '' ? '' : (projects.find((p) => p.project === eff)?.name || eff);
  const scoped = eff === '' ? base : base.filter((it) => it.project === eff);
  const counts = countsOf(lib, base, scoped);
  const searching = parsed.words.length > 0;
  // a folder gone (deleted, merged): back to all artifacts
  const atNow: At = at.at === 'folder' && !lib.byId.has(at.id) ? { at: 'all' } : at;
  const found = searching ? searchItems(lib, scoped, parsed.words) : [];
  const here = searching ? found : itemsAt(lib, scoped, atNow);
  const chips = chipsOf(here);
  const shown = chip === null ? here : here.filter((it) => chipOf(it) === chip);
  const byKey = new Map(base.map((it) => [keyOf(it), it]));
  const place = placeOf(lib, atNow, searching, shown);
  const curId = atNow.at === 'folder' ? atNow.id : null;
  const isTheme = curId !== null && (lib.byId.get(curId)?.parent ?? null) === null;

  const goArtifact = useGoArtifact();
  const openIt = (it: Item) => { goArtifact(it.project, it.a.id, it.a); };
  const look = useLook(openIt);
  const put = usePutInMessage();
  const putIt = (it: Item) => { put(it.project, it.a); };
  const place_ = useAddPlace(eff);

  const send = (cmd: object) => { store.command(cmd as never); };
  const edit = (op: FolderOp) => { send(folderCmd(op)); };
  const tilesOnly = !searching && (atNow.at === 'all');
  const gridItems = tilesOnly ? shown.slice(0, 40) : shown;
  const { sel, setSel, ref, onKeyDown, move, cards, cols, cardOf } = useGridKeys({
    items: gridItems,
    view,
    days: !tilesOnly && atNow.at !== 'recent',
    keepAs: `artifacts.sel:${project}`,
    onOpen: (k) => { openCard(k); },
    onKey: (e, k) => rowKey(e, k === null ? undefined : itemOfKey(k), { onOpen: openIt, onLook: look, onPut: putIt }) || screenKey(e, k),
  });
  function itemOfKey(k: string): Item | undefined {
    const c = cardOf(k);
    return c === undefined ? byKey.get(k) : topOf(c);
  }
  function openCard(k: string) {
    const c = cardOf(k);
    if (c === undefined) return;
    if (c.kind === 'stack') setStack(c);
    else openIt(c.it);
  }
  const itemsOfKeys = (keys: readonly string[]): Item[] => keys.flatMap((k) => {
    const c = cardOf(k);
    if (c !== undefined) return [...itemsOf(c)];
    const it = byKey.get(k);
    return it === undefined ? [] : [it];
  });
  function moveTo(keys: readonly string[], folder: string) {
    const items = itemsOfKeys(keys);
    if (items.length === 0) return;
    const to = folder === 'unfiled' ? null : folder;
    send(moveCmd(items, to, lib.folderOf));
    if (to !== null) {
      const next = rememberMove(recent, to);
      setRecent(next);
      try { window.localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* private window */ }
    }
    setFlash(folder);
    const what = items.length === 1 ? (items[0]?.a.title ?? '') : library.n_artifacts({ n: items.length });
    setToast(library.moved({ what, to: to === null ? library.unfiled : nameOf(lib, to) }));
    setPicked(new Set());
    setOver(null);
  }
  // a folder made from the m picker: move there once it is in the list
  useEffect(() => {
    const pm = pendingMove.current;
    if (pm === null) return;
    const made = folders.find((f) => f.name === pm.name && (f.parent ?? null) === pm.parent);
    if (made === undefined) return;
    pendingMove.current = null;
    moveTo(pm.keys, made.id);
  });

  const undo = () => {
    edit('undo');
    setToast(null);
  };

  const keysToMove = (sel: string | null): string[] => (picked.size > 0 ? [...picked] : sel === null ? [] : [sel]);
  // the screen's own keys, beside the grid's and the card's
  function screenKey(e: KeyboardEvent, sel: string | null): boolean {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      undo();
      return true;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return false;
    if (e.key === '/') {
      document.querySelector<HTMLInputElement>('[data-testid="artifacts.search"]')?.focus();
      return true;
    }
    if (e.key === 'm') {
      const keys = keysToMove(sel);
      if (keys.length > 0) setOver({ k: 'move', keys, at: boxOf(keys[0] ?? '') });
      return true;
    }
    if (e.key === 'a') {
      setArchivedOn(!archivedOn);
      setPicked(new Set());
      return true;
    }
    if (e.key !== 'Escape') return false;
    if (picked.size > 0) setPicked(new Set());
    else if (stack !== null) setStack(null);
    else if (q !== '') setQ('');
    else if (archivedOn) setArchivedOn(false);
    else if (atNow.at === 'folder') {
      const p = lib.byId.get(atNow.id)?.parent ?? null;
      setAt(p === null ? { at: 'all' } : { at: 'folder', id: p });
    } else return false;
    return true;
  }
  // the card's box (the picker opens from it), else the page's top
  const boxOf = (key: string): MenuAt => {
    const el = document.querySelector(`[data-row="${CSS.escape(key)}"]`) ?? ref.current;
    return el === null ? { x: 0, y: 0 } : atOf(el);
  };  const onPick = (key: string, how: { meta: boolean; shift: boolean }) => {
    if (how.shift && anchorKey !== null) {
      const order = cards.map((c) => c.key);
      const [a, b] = [order.indexOf(anchorKey), order.indexOf(key)].sort((x, y) => x - y);
      if (a !== undefined && b !== undefined && a >= 0) setPicked(new Set(order.slice(a, b + 1)));
      setSel(key);
      return;
    }
    if (how.meta) {
      const next = new Set(picked);
      if (picked.size === 0 && sel !== null && sel !== key) next.add(sel);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      setPicked(next);
      setAnchorKey(key);
      setSel(key);
      return;
    }
    setPicked(new Set());
    setAnchorKey(key);
    setSel(key);
  };
  const drop = useDrop({
    isClosedTheme: (id) => (lib.tasks.get(id)?.length ?? 0) > 0 && !open.has(id),
    onOpen: (id) => { setOpen(new Set([...open, id])); },
    onDrop: (keys, id) => { moveTo(keys, id); },
  });

  // the search has the keys: ⏎ opens the first result, ↑↓ give them back and move, esc clears
  const searchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const back = () => {
      e.preventDefault();
      ref.current?.focus({ preventScroll: true });
    };
    if (e.key === 'Escape') {
      setQ('');
      back();
    } else if (e.key === 'Enter') {
      const first = shown[0];
      if (searching && first !== undefined) openIt(first);
      back();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      back();
      move(e.key === 'ArrowDown' ? 1 : -1);
    }
  };
  const doFolder = (id: string, act: FolderAct, at_: MenuAt) => {
    if (act === 'rename') setEditing({ kind: 'rename', id });
    else if (act === 'inside') {
      setOpen(new Set([...open, id]));
      setEditing({ kind: 'new', parent: id });
    } else if (act === 'merge') setOver({ k: 'merge', id, at: at_ });
    else setOver({ k: 'delete', id });
  };
  const doCard = (key: string, act: CardAct) => {
    const it = itemOfKey(key);
    if (it === undefined) return;
    const keys = picked.has(key) ? [...picked] : [key];
    switch (act) {
      case 'open': openCard(key); return;
      case 'look': look(it); return;
      case 'put': for (const x of itemsOfKeys(keys)) putIt(x); return;
      case 'move': setOver({ k: 'move', keys, at: boxOf(key) }); return;
      default:
        // versions, copy, finder, archive: the card's own keys (List.tsx rowKey)
        setSel(key);
        rowKey(new KeyboardEvent('keydown', { key: { versions: 'v', copy: 'c', finder: 'r', archive: 'Backspace' }[act] }) as never, it, { onOpen: openIt, onLook: look, onPut: putIt });
    }
  };
  const onEdited = (name: string | null) => {
    const e = editing;
    setEditing(null);
    if (e === null || name === null) return;
    if (e.kind === 'rename') edit({ rename: { id: e.id, name } });
    else edit({ make: e.parent === null ? { name } : { name, parent: e.parent } });
  };


  const column = (
    <FolderColumn lib={lib} counts={counts} at={atNow} open={open} full={full} editing={editing} flash={flash} drop={drop}
      onGo={(a) => { setQ(''); setAt(a); }} onToggle={(t) => { setOpen(toggled(open, t)); }} onMore={(t) => { setFull(new Set([...full, t])); }}
      onNew={() => { setEditing({ kind: 'new', parent: null }); }} onRename={(id) => { setEditing({ kind: 'rename', id }); }} onEdited={onEdited}
      onMenu={(id, e: MouseEvent) => { setOver({ k: 'folder', id, at: { x: e.clientX, y: e.clientY } }); }} testId="artifacts.col" />
  );
  const grid = (items: readonly Card[], placeHere: Place, days: boolean, testId: string) => (
    <ArtifactGrid cards={items} cols={cols} view={view} now={now} place={placeHere} days={days} cursor={sel} picked={picked}
      onPick={onPick} onOpen={(c) => { openCard(c.key); }}
      onMenu={(key, p) => { setOver({ k: 'card', key, at: p }); }}
      dragOf={(key) => cardDrag(key, picked)}
      scroller={() => document.querySelector<HTMLElement>('[data-testid="artifacts.scroll"]')} testId={testId} />
  );
  const crumb = crumbOf(lib, atNow);
  const current = atNow.at === 'folder' ? lib.byId.get(atNow.id) : undefined;
  const filterRow = (
    <div className="art-filters">
      {chips.length > 1 && !searching && <KindChips total={here.length} chips={chips} chip={chip} onChip={setChip} testId="artifacts.kinds" />}
      {searching && <KindChips total={found.length} chips={chips} chip={chip} onChip={setChip} testId="artifacts.kinds" />}
      <span className="art-filters-end">
        <ProjectScope all={base} project={eff} projectName={projectName} onPick={(p) => { setScope(p); if (typedProject !== null) setQ(parsed.words.join(' ')); }} testId="artifacts.projects" />
        <span className="art-search">
          <Field slash placeholder="search" value={q} onChange={(e) => { setQ(e.currentTarget.value); setWhole(new Set()); }} onKeyDown={searchKey} testId="artifacts.search" />
        </span>
        <span className="art-views">
          <span {...tipAttrs(library.tip_cards)}><IconButton label={library.tip_cards} size="row" pressed={view === 'grid'} onClick={() => { setView('grid'); }} testId="artifacts.view.grid">▦</IconButton></span>
          <span {...tipAttrs(library.tip_list)}><IconButton label={library.tip_list} size="row" pressed={view === 'list'} onClick={() => { setView('list'); }} testId="artifacts.view.list">☰</IconButton></span>
        </span>
        <AddButton place={place_} testId="artifacts.add" />
      </span>
    </div>
  );

  const body = (() => {
    if (all.length === 0) return <FirstRun place={place_} />;
    if (archivedOn && base.length === 0) return <div className="art-empty-box" data-testid="artifacts.none"><p className="s">{library.none_archived}</p></div>;
    if (stack !== null) {
      return <StackSheet stack={stack} now={now} onOpen={openIt} onLook={look} onPut={putIt} onBack={() => { setStack(null); }} testId="artifacts.sheet" />;
    }
    if (searching) {
      if (found.length === 0) {
        const near = nearestOf(scoped, parsed.words.join(' '));
        const nf = near === null ? null : lib.folderOf(near);
        return <NothingFound q={q} nearest={near} nearestFolder={nf === null ? library.unfiled : pathOf(lib, nf)} onOpen={openIt} onClear={() => { setQ(''); }} testId="artifacts.nothing" />;
      }
      const groups = groupByFolder(lib, shown);
      return (
        <SearchResults q={parsed.words.join(' ')} total={found.length} chips={chips} chip={chip} onChip={setChip} groups={groups} whole={whole}
          onWhole={(g) => { setWhole(new Set([...whole, g])); }}
          cards={(items, g) => grid(items.map((it) => cards.find((c) => c.key === keyOf(it)) ?? { kind: 'one', key: keyOf(it), it }), { kind: 'search' }, false, `artifacts.results.${g.id ?? 'unfiled'}`)}
          testId="artifacts.results" />
      );
    }
    if (atNow.at === 'all') {
      const themes = lib.themes.filter((t) => eff === '' || (counts.get(t.id)?.n ?? 0) > 0);
      return (
        <>
          {themes.length > 0 && (
            <>
              <div className="art-sect"><span>{library.folders}</span><span className="sort">{library.recent_first}</span></div>
              <div className="art-tiles big" data-testid="artifacts.tiles">
                {themes.map((t) => (
                  <BigTile key={t.id} folder={t} count={counts.get(t.id)} when={whenOf(lib.latest.get(t.id) ?? now, now)}
                    cover={coverOf(lib, scoped, t.id)} thumb={(it) => <Thumb item={it} visible />} drop={drop} flash={flash === t.id}
                    onOpen={() => { setAt({ at: 'folder', id: t.id }); }} onMenu={(e) => { setOver({ k: 'folder', id: t.id, at: { x: e.clientX, y: e.clientY } }); }}
                    testId={`artifacts.tile.${t.id}`} />
                ))}
              </div>
            </>
          )}
          <div className="art-sect"><span>{eff === '' ? library.recent : library.recent_in({ project: projectName })}</span></div>
          {grid(cards, place, false, 'artifacts.grid')}
        </>
      );
    }
    if (atNow.at === 'unfiled' && here.length === 0) {
      return <div className="art-empty-box" data-testid="artifacts.none"><div className="t">{library.no_unfiled_title}</div><p className="s">{library.no_unfiled_say}</p></div>;
    }
    if (atNow.at === 'folder' && here.length === 0) {
      if (eff !== '' && (counts.get(atNow.id)?.total ?? 0) > 0) {
        return <div className="art-empty-box" data-testid="artifacts.none"><p className="s">{library.none_from({ project: projectName })}</p></div>;
      }
      return (
        <div className="art-empty-box" data-testid="artifacts.none">
          <div className="t">{library.empty_folder_title}</div>
          <p className="s">{library.empty_folder_say({ name: nameOf(lib, atNow.id) })}</p>
        </div>
      );
    }
    const tasks = isTheme ? (lib.tasks.get(curId) ?? []) : [];
    return (
      <>
        {tasks.length > 0 && (
          <div className="art-tiles small" data-testid="artifacts.tasks">
            {tasks.filter((f) => eff === '' || (counts.get(f.id)?.n ?? 0) > 0).map((f) => (
              <SmallTile key={f.id} folder={f} count={counts.get(f.id)} when="" drop={drop} flash={flash === f.id}
                onOpen={() => { setAt({ at: 'folder', id: f.id }); }} onMenu={(e) => { setOver({ k: 'folder', id: f.id, at: { x: e.clientX, y: e.clientY } }); }}
                testId={`artifacts.task.${f.id}`} />
            ))}
          </div>
        )}
        {grid(cards, place, atNow.at !== 'recent', 'artifacts.grid')}
      </>
    );
  })();

  const head = searching || atNow.at === 'all' || stack !== null ? null : (
    <header className="art-head" data-testid="artifacts.head">
      <div className="art-head-t">
        <span className="t">{atNow.at === 'folder' ? crumb.map((c) => c.name).join(' / ') : crumb[0]?.name}</span>
        {current !== undefined && (
          <span {...tipAttrs(library.tip_folder_more)}>
            <IconButton label={library.tip_folder_more} size="row" onClick={(e) => { setOver({ k: 'folder', id: current.id, at: atOf(e.currentTarget) }); }} testId="artifacts.head.more">···</IconButton>
          </span>
        )}
      </div>
      <p className="art-head-s">
        {atNow.at === 'folder' ? folderLine(lib, atNow.id, here) : atNow.at === 'unfiled' ? library.unfiled_say : ''}
        {atNow.at === 'unfiled' && here.length > 0 && (
          <> <Press look="art-link" onClick={() => { router.go({ screen: 'bise' }); }} data-testid="artifacts.sort">{library.sort_with_main}</Press></>
        )}
      </p>
    </header>
  );
  const stackHead = stack === null ? null : (
    <header className="art-head" data-testid="artifacts.head">
      <div className="art-head-t"><span className="t">{[...crumb.map((c) => c.name), stack.title].join(' / ')}</span></div>
    </header>
  );

  return (
    <section ref={ref} tabIndex={-1} className="art-screen" data-testid="artifacts.screen" data-archived={archivedOn || undefined} data-narrow={narrow || undefined}
      data-title-path={titlePath(lib, atNow, searching)} onKeyDown={onKeyDown}>
      <div className="art-scroll" data-testid="artifacts.scroll">
        <PageHero name={archivedOn ? 'artifacts · archived' : 'artifacts'} sentence={library.say} facts={libraryFacts(lib, scoped, projectName)}
          vignette={<picture><source srcSet={heroDark} media="(prefers-color-scheme: dark)" /><img src={heroLight} alt="" /></picture>} testId="artifacts.hero" />
        <div className="art-lib">
          {!narrow && column}
          <div className="art-main">
            {narrow && <FoldCrumb label={crumb.length === 0 ? library.all_artifacts : crumb.map((c) => c.name).join(' / ')} testId="artifacts.fold">{column}</FoldCrumb>}
            {stackHead ?? head}
            {filterRow}
            <AddDrop place={place_} testId="artifacts.drop">{body}</AddDrop>
          </div>
        </div>
      </div>
      {!archivedOn && archived.length > 0 && picked.size === 0 && (
        <Press look="art-archived" onClick={() => { setArchivedOn(true); }} data-testid="artifacts.archived">{archived.length} archived</Press>
      )}
      {picked.size > 0 && (
        <div className="art-selbar" data-testid="artifacts.selbar">
          <span className="n">{library.picked({ n: picked.size })}</span>
          <Press look="art-selbar-a" onClick={(e) => { setOver({ k: 'move', keys: [...picked], at: atOf(e.currentTarget) }); }} data-testid="artifacts.selbar.move">{library.menu_move}<span className="k">m</span></Press>
          <Press look="art-selbar-a" onClick={() => { for (const x of itemsOfKeys([...picked])) putIt(x); }} data-testid="artifacts.selbar.put">{library.put_in_message}<span className="k">@</span></Press>
          <span className="sep" />
          <Press look="art-selbar-a" onClick={() => { setPicked(new Set()); }} data-testid="artifacts.selbar.esc">esc</Press>
        </div>
      )}
      {toast !== null && picked.size === 0 && (
        <div className="art-toast">
          <Toast action={{ text: `${library.undo} ⌘Z`, onClick: undo, testId: 'artifacts.toast.undo' }} testId="artifacts.toast">{toast}</Toast>
        </div>
      )}
      {over?.k === 'move' && (
        <MovePicker lib={lib} at={over.at} recent={recent} testId="artifacts.move"
          title={over.keys.length === 1 ? library.move_to({ name: itemOfKey(over.keys[0] ?? '')?.a.title ?? '' }) : library.move_n_to({ n: itemsOfKeys(over.keys).length })}
          from={commonFolder(lib, itemsOfKeys(over.keys))}
          onMove={(f) => { moveTo(over.keys, f); }}
          onMake={(name, parent) => {
            pendingMove.current = { name, parent, keys: over.keys };
            edit({ make: parent === null ? { name } : { name, parent } });
            setOver(null);
          }}
          onClose={() => { setOver(null); ref.current?.focus({ preventScroll: true }); }} />
      )}
      {over?.k === 'card' && (
        <CardMenu at={over.at} several={picked.has(over.key) ? picked.size : 1} finder={(() => { const it = itemOfKey(over.key); return it !== undefined && revealPathOf(it.a) !== null; })()}
          onAct={(a) => { doCard(over.key, a); }} onClose={() => { setOver((o) => (o?.k === 'card' ? null : o)); }} testId="artifacts.menu" />
      )}
      {over?.k === 'folder' && (
        <FolderMenu at={over.at} isTheme={(lib.byId.get(over.id)?.parent ?? null) === null}
          onAct={(a) => { doFolder(over.id, a, over.at); }} onClose={() => { setOver((o) => (o?.k === 'folder' ? null : o)); }} testId="artifacts.fmenu" />
      )}
      {over?.k === 'merge' && (
        <MergePicker at={over.at} lib={lib} id={over.id} n={counts.get(over.id)?.total ?? 0}
          onMerge={(into) => { edit({ merge: { from: over.id, into } }); setFlash(into); setToast(library.moved({ what: nameOf(lib, over.id), to: nameOf(lib, into) })); }}
          onClose={() => { setOver((o) => (o?.k === 'merge' ? null : o)); }} testId="artifacts.merge" />
      )}
      <Sheet open={over?.k === 'delete'} onClose={() => { setOver(null); }} testId="artifacts.delete"
        title={over?.k === 'delete' ? library.delete_q({ name: nameOf(lib, over.id) }) : ''}
        sub={over?.k === 'delete' ? library.delete_say({ n: counts.get(over.id)?.total ?? 0 }) : ''}
        onPrimary={() => { if (over?.k === 'delete') { edit({ delete: { id: over.id } }); setOver(null); } }}
        foot={
          <>
            <Button kind="ghost" onClick={() => { setOver(null); }} testId="artifacts.delete.cancel">{library.cancel}</Button>
            <Button kind="danger" onClick={() => { if (over?.k === 'delete') { edit({ delete: { id: over.id } }); setOver(null); } }} testId="artifacts.delete.go">{library.delete_folder}</Button>
          </>
        }>
        {null}
      </Sheet>
    </section>
  );
}

const toggled = (s: ReadonlySet<string>, k: string): Set<string> => {
  const n = new Set(s);
  if (n.has(k)) n.delete(k);
  else n.add(k);
  return n;
};

/** The folder all of them are in, else null (the picker leaves it out). Pure. */
function commonFolder(lib: Library, items: readonly Item[]): string | null {
  const ids = new Set(items.map((it) => lib.folderOf(it)));
  return ids.size === 1 ? ([...ids][0] ?? null) : null;
}

/** What the cards' line leaves out here (density rule 1, art-grid's lineOf). Pure. */
function placeOf(lib: Library, at: At, searching: boolean, items: readonly Item[]): Place {
  if (searching) return { kind: 'search' };
  switch (at.at) {
    case 'all':
    case 'recent':
      return { kind: 'recent', folderOf: (it) => { const f = lib.folderOf(it); return f === null ? '' : pathOf(lib, f); } };
    case 'unfiled':
      return { kind: 'unfiled' };
    case 'folder': {
      const isTheme = (lib.byId.get(at.id)?.parent ?? null) === null && (lib.tasks.get(at.id)?.length ?? 0) > 0;
      if (isTheme) return { kind: 'theme', folderOf: (it) => { const f = lib.folderOf(it); return f === null || f === at.id ? '' : nameOf(lib, f); } };
      const owner = ownerOf(items.filter((it) => inFolder(lib, it, at.id)));
      return owner === undefined ? { kind: 'folder' } : { kind: 'folder', owner };
    }
  }
}

/** First run: nothing yet, one sentence, one action. */
function FirstRun({ place }: { place: ReturnType<typeof useAddPlace> }) {
  return (
    <div className="art-empty-box first" data-testid="artifacts.empty">
      <div className="t">{library.first_title}</div>
      <p className="s">{library.first_say}</p>
      <div className="acts"><AddButton place={place} testId="artifacts.empty.add" /></div>
    </div>
  );
}
