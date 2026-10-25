// src/app/panel · the tabbed panel's rules, pure (bise fait mac, page native-mac §4 #2 and §6, plan
// native-mac-plan §1 nm-panel): which tabs are open and in which order, which one is in front, what
// opening, closing, reordering and stepping do, which six show in the bar (HIG: six at most, the
// rest in the overflow menu), the panel's width for what is in front, and how the kept record reads
// back. No React, no store, no words: state.ts keeps one of these per window, the views draw it.
// Owner: nm-panel.
import { entityKey, type Entity } from '@/shared/entity';

/** What a tab shows. */
export type TabWhat =
  /** what the right bar was: agents, archived, artifacts, scheduled, processes; of `project` when a card pinned it, else of the view */
  | { readonly kind: 'overview'; readonly project?: string }
  /** New tab: the launcher (search, Open, Recent) */
  | { readonly kind: 'launcher'; readonly n: number }
  /** a shell in a project's folder; n 0 is the project's first (the bottom panel's too) */
  | { readonly kind: 'terminal'; readonly project: string; readonly n: number }
  /** a thing he opened: an artifact, a PR, a commit, a diff, a process, a plugin, an agent's thread */
  | { readonly kind: 'thing'; readonly e: Entity };

export interface Tab {
  /** one per thing: 'overview', 'new:2', 'term:<project>#1', or the entity's key */
  readonly id: string;
  readonly what: TabWhat;
}

export interface Tabs {
  readonly list: readonly Tab[];
  /** the id of the tab in front (always one of list's) */
  readonly active: string;
}

/** The tabs in the bar at most (HIG: « Avoid providing more than six tabs in a tab view »). */
export const MAX_SHOWN = 6;

export const OVERVIEW: Tab = { id: 'overview', what: { kind: 'overview' } };

/** A fresh panel: Overview alone, in front. */
export const FIRST: Tabs = { list: [OVERVIEW], active: OVERVIEW.id };

/** A tab's id from what it shows: the same thing is one tab. Pure. */
export function tabIdOf(what: TabWhat): string {
  switch (what.kind) {
    case 'overview':
      return OVERVIEW.id;
    case 'launcher':
      return `new:${String(what.n)}`;
    case 'terminal':
      return `term:${what.project}#${String(what.n)}`;
    case 'thing':
      return entityKey(what.e);
  }
}

/** A tab for `what`. Pure. */
export function tabOf(what: TabWhat): Tab {
  return { id: tabIdOf(what), what };
}

/**
 * Opens `what`: an open one comes to the front; a new one goes right after the tab in front, or in
 * the place of `instead` (the launcher he picked it from, as a browser's new tab becomes the page).
 * Pure.
 */
export function openIn(t: Tabs, what: TabWhat, instead?: string): Tabs {
  const tab = tabOf(what);
  const has = t.list.some((x) => x.id === tab.id);
  if (has) {
    // the launcher he picked an open thing from goes: it did its job; the open tab takes the new
    // what (an Overview pinned to another project)
    const list = (instead !== undefined && instead !== tab.id ? t.list.filter((x) => x.id !== instead) : t.list).map((x) => (x.id === tab.id ? tab : x));
    return { list, active: tab.id };
  }
  const at = instead === undefined ? -1 : t.list.findIndex((x) => x.id === instead);
  if (at >= 0) return { list: t.list.map((x, i) => (i === at ? tab : x)), active: tab.id };
  const i = t.list.findIndex((x) => x.id === t.active);
  const list = [...t.list.slice(0, i + 1), tab, ...t.list.slice(i + 1)];
  return { list, active: tab.id };
}

/** The next free New tab's number. Pure. */
export function nextLauncher(t: Tabs): TabWhat {
  let n = 1;
  while (t.list.some((x) => x.id === `new:${String(n)}`)) n += 1;
  return { kind: 'launcher', n };
}

/** The next free shell number of `project` (0 first). Pure. */
export function nextShell(t: Tabs, project: string): number {
  let n = 0;
  while (t.list.some((x) => x.id === `term:${project}#${String(n)}`)) n += 1;
  return n;
}

/**
 * Closes `id`: the tab in front goes to its right neighbour, else its left one. The last tab
 * closed leaves no tab: undefined (the panel folds, and opens again on Overview). Pure.
 */
export function closeIn(t: Tabs, id: string): Tabs | undefined {
  const i = t.list.findIndex((x) => x.id === id);
  if (i < 0) return t;
  const list = t.list.filter((x) => x.id !== id);
  if (list.length === 0) return undefined;
  if (t.active !== id) return { list, active: t.active };
  const next = list[Math.min(i, list.length - 1)] as Tab;
  return { list, active: next.id };
}

/** Every tab but `id` closed (a tab's menu: Close others). Pure. */
export function closeOthers(t: Tabs, id: string): Tabs {
  const keep = t.list.find((x) => x.id === id);
  return keep === undefined ? t : { list: [keep], active: keep.id };
}

/** Brings `id` to the front. Pure. */
export function activate(t: Tabs, id: string): Tabs {
  return t.list.some((x) => x.id === id) ? { ...t, active: id } : t;
}

/** Moves `id` to index `to` (a drag in the bar), the others keeping their order. Pure. */
export function moveIn(t: Tabs, id: string, to: number): Tabs {
  const tab = t.list.find((x) => x.id === id);
  if (tab === undefined) return t;
  const rest = t.list.filter((x) => x.id !== id);
  const at = Math.max(0, Math.min(rest.length, Math.round(to)));
  return { ...t, list: [...rest.slice(0, at), tab, ...rest.slice(at)] };
}

/** ⌘⇧] (+1) and ⌘⇧[ (-1): the next or previous tab, round the ends. Pure. */
export function stepIn(t: Tabs, dir: 1 | -1): Tabs {
  const n = t.list.length;
  if (n < 2) return t;
  const i = t.list.findIndex((x) => x.id === t.active);
  const next = t.list[(i + dir + n) % n] as Tab;
  return { ...t, active: next.id };
}

/**
 * The tabs the bar shows (six at most, in their order) and the rest for the overflow menu. The tab
 * in front always shows: past the sixth, it takes the sixth place. Pure.
 */
export function shownOf(t: Tabs, max = MAX_SHOWN): { readonly shown: readonly Tab[]; readonly over: readonly Tab[] } {
  if (t.list.length <= max) return { shown: t.list, over: [] };
  const i = t.list.findIndex((x) => x.id === t.active);
  if (i < max) return { shown: t.list.slice(0, max), over: t.list.slice(max) };
  const shown = [...t.list.slice(0, max - 1), t.list[i] as Tab];
  return { shown, over: t.list.filter((x) => !shown.includes(x)) };
}

/** The agent a tab hangs on, when it has one (its thread, its changes, its process). Pure. */
function agentOf(what: TabWhat): { readonly project: string; readonly agent: string } | undefined {
  if (what.kind !== 'thing') return undefined;
  const e = what.e;
  return e.kind === 'agent' || e.kind === 'diff' || e.kind === 'process' ? { project: e.project, agent: e.agent } : undefined;
}

/**
 * Drops the tabs of agents no longer in the rows (architect m_42089: an agent is keyed by its name,
 * a rename changes its key, a dead tab never shows). `known(project)` is the names of a project
 * whose rows came, undefined while they did not (its tabs wait). Undefined: no tab left. Pure.
 */
export function dropGone(t: Tabs, known: (project: string) => ReadonlySet<string> | undefined): Tabs | undefined {
  let out: Tabs | undefined = t;
  for (const x of t.list) {
    const a = agentOf(x.what);
    if (a === undefined || out === undefined) continue;
    const names = known(a.project);
    if (names !== undefined && !names.has(a.agent)) out = closeIn(out, x.id);
  }
  return out;
}

/** The width each kind of tab asks, kept apart: the rows, a shell (mockup 2), a page (mockup 4). */
export type WidthOf = 'rows' | 'shell' | 'page';

/** The widths he starts with (page native-mac §6: 384; mockup 2: 480; mockup 4: 640). */
export const WIDTHS: Readonly<Record<WidthOf, number>> = { rows: 384, shell: 480, page: 640 };
/** The panel's border drags it from 320 to 640 (native-mac-qa §7). */
export const MIN_W = 320;
export const MAX_W = 640;

/** Which width a tab asks: a shell's, a page's (an artifact, an office, a thread), or the rows'. Pure. */
export function widthOf(what: TabWhat): WidthOf {
  if (what.kind === 'terminal') return 'shell';
  if (what.kind === 'thing') return 'page';
  return 'rows';
}

/** A width in the panel's limits. Pure. */
export function clampW(w: number): number {
  return Number.isFinite(w) ? Math.round(Math.min(MAX_W, Math.max(MIN_W, w))) : WIDTHS.rows;
}

/** The panel's whole kept state: open or folded, its tabs, each kind's width, what he opened last. */
export interface PanelKept {
  readonly open: boolean;
  readonly tabs: Tabs;
  readonly widths: Readonly<Record<WidthOf, number>>;
  /** the things he opened in a tab, newest first (the launcher's Recent) */
  readonly recent: readonly Entity[];
}

export const FOLDED: PanelKept = { open: false, tabs: FIRST, widths: WIDTHS, recent: [] };

/** How many things Recent keeps. */
export const RECENT_MAX = 8;

/** `e` first in Recent, once, RECENT_MAX at most. Pure. */
export function pushRecent(list: readonly Entity[], e: Entity, max = RECENT_MAX): readonly Entity[] {
  const k = entityKey(e);
  return [e, ...list.filter((x) => entityKey(x) !== k)].slice(0, max);
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** An entity read back from the kept record, or undefined when it isn't one. Pure. */
function entityOf(x: unknown): Entity | undefined {
  if (!isObj(x) || typeof x['kind'] !== 'string') return undefined;
  const s = (k: string) => typeof x[k] === 'string' && x[k] !== '';
  switch (x['kind']) {
    case 'agent':
      return s('project') && s('agent') ? (x as Entity) : undefined;
    case 'project':
      return s('project') ? (x as Entity) : undefined;
    case 'artifact':
      return s('project') && s('id') ? (x as Entity) : undefined;
    case 'pr':
      return s('project') && typeof x['number'] === 'number' ? (x as Entity) : undefined;
    case 'commit':
      return s('project') && s('sha') ? (x as Entity) : undefined;
    case 'diff':
      return s('project') && s('agent') ? (x as Entity) : undefined;
    case 'process':
      return s('project') && s('agent') && s('id') ? (x as Entity) : undefined;
    case 'plugin':
      return s('id') ? (x as Entity) : undefined;
    case 'scheduled':
      return s('project') && typeof x['id'] === 'number' ? (x as Entity) : undefined;
    case 'office':
      return s('project') ? (x as Entity) : undefined;
    default:
      return undefined;
  }
}

/** A tab's what read back, or undefined. Pure. */
function whatOf(x: unknown): TabWhat | undefined {
  if (!isObj(x)) return undefined;
  switch (x['kind']) {
    case 'overview':
      return typeof x['project'] === 'string' && x['project'] !== '' ? { kind: 'overview', project: x['project'] } : { kind: 'overview' };
    case 'launcher':
      return typeof x['n'] === 'number' ? { kind: 'launcher', n: x['n'] } : undefined;
    case 'terminal':
      return typeof x['project'] === 'string' && x['project'] !== '' && typeof x['n'] === 'number' ? { kind: 'terminal', project: x['project'], n: x['n'] } : undefined;
    case 'thing': {
      const e = entityOf(x['e']);
      return e === undefined ? undefined : { kind: 'thing', e };
    }
    default:
      return undefined;
  }
}

/** The kept record read back: anything unreadable is dropped, a broken record reads as FOLDED. Pure. */
export function parseKept(raw: unknown): PanelKept {
  if (!isObj(raw)) return FOLDED;
  const tabsRaw = isObj(raw['tabs']) && Array.isArray(raw['tabs']['list']) ? (raw['tabs']['list'] as unknown[]) : [];
  const seen = new Set<string>();
  const list: Tab[] = [];
  for (const x of tabsRaw) {
    const what = whatOf(isObj(x) ? x['what'] : undefined);
    if (what === undefined) continue;
    const tab = tabOf(what);
    if (seen.has(tab.id)) continue;
    seen.add(tab.id);
    list.push(tab);
  }
  const want = isObj(raw['tabs']) ? raw['tabs']['active'] : undefined;
  const tabs: Tabs = list.length === 0 ? FIRST : { list, active: list.some((x) => x.id === want) ? (want as string) : (list[0] as Tab).id };
  const w = isObj(raw['widths']) ? raw['widths'] : {};
  const width = (k: WidthOf) => (typeof w[k] === 'number' ? clampW(w[k]) : WIDTHS[k]);
  const recent = (Array.isArray(raw['recent']) ? (raw['recent'] as unknown[]) : []).map(entityOf).filter((e): e is Entity => e !== undefined).slice(0, RECENT_MAX);
  return { open: raw['open'] === true, tabs, widths: { rows: width('rows'), shell: width('shell'), page: width('page') }, recent };
}
