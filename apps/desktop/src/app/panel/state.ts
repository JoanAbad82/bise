// src/app/panel · the tabbed panel's live state, one per window: folded or open (folded by default,
// page native-mac §7), its tabs (model.ts) and each kind's width, kept across a reload, an update
// swap or the next day (keep.ts, no age: a Mac app reopens as he left it). Outside React's tree, as
// the terminal's panel.ts: a tab opened or a width dragged re-renders the panel and the bar's tabs,
// never the shell or the composer. Every door in: openTab (tabs.ts), the bar's ▯ and ⌥⌘0
// (panelToggle), ⌃` (openShell), the launcher's picks. Owner: nm-panel.
import { useSyncExternalStore } from 'react';
import { keep } from '@/app/keep';
import { activate, closeIn, closeOthers, FIRST, moveIn, nextLauncher, nextShell, openIn, parseKept, pushRecent, stepIn, widthOf, clampW, dropGone, type PanelKept, type TabWhat, type Tabs } from './model';

const KEY = 'panel';

let state: PanelKept = parseKept(keep.view(KEY));
const listeners = new Set<() => void>();

function set(next: PanelKept): void {
  if (next === state) return;
  state = next;
  keep.setView(KEY, next);
  for (const l of listeners) l();
}

function setTabs(tabs: Tabs | undefined): void {
  // the last tab closed: the panel folds, and opens again on Overview
  set(tabs === undefined ? { ...state, open: false, tabs: FIRST } : { ...state, tabs });
}

export const panelState = {
  get: (): PanelKept => state,
  subscribe: (l: () => void): (() => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  /** tests only: back to a fresh window */
  reset(next: PanelKept = parseKept(undefined)): void {
    state = next;
    for (const l of listeners) l();
  },
};

/** The panel's state, live. */
export function usePanelState(): PanelKept {
  return useSyncExternalStore(panelState.subscribe, panelState.get);
}

/** Open or folded, and its width now (0 folded): what the right side (nm-side's sideLayout) and the shell read. */
export function usePanelBox(): { readonly open: boolean; readonly width: number } {
  const s = usePanelState();
  return { open: s.open, width: s.open ? widthNow(s) : 0 };
}

/** The bar's ▯ and ⌥⌘0: fold or unfold, on the tab he left in front. */
export function panelToggle(): void {
  set({ ...state, open: !state.open });
}

/** Opens `what` in a tab (an open one comes to the front), unfolding the panel; `instead`: the launcher it replaces. */
export function openWhat(what: TabWhat, instead?: string): void {
  const recent = what.kind === 'thing' ? pushRecent(state.recent, what.e) : state.recent;
  set({ ...state, open: true, tabs: openIn(state.tabs, what, instead), recent });
}

/** '+' and ⌘T: a New tab (the launcher). */
export function openLauncher(): void {
  openWhat(nextLauncher(state.tabs));
}

/** A new shell of `project` in a tab (the launcher's Terminal, a terminal's '+'). */
export function openShell(project: string, instead?: string): void {
  openWhat({ kind: 'terminal', project, n: nextShell(state.tabs, project) }, instead);
}

/**
 * ⌃` with the terminal on the right (his pref): the project's first shell in front, or the panel
 * folded when it already is.
 */
export function toggleShell(project: string): void {
  const id = `term:${project}#0`;
  if (state.open && state.tabs.active === id) set({ ...state, open: false });
  else openWhat({ kind: 'terminal', project, n: 0 });
}

export function closeTabId(id: string): void {
  setTabs(closeIn(state.tabs, id));
}

export function closeOthersId(id: string): void {
  setTabs(closeOthers(state.tabs, id));
}

export function activateTab(id: string): void {
  setTabs(activate(state.tabs, id));
}

export function moveTabTo(id: string, to: number): void {
  setTabs(moveIn(state.tabs, id, to));
}

/** ⌘⇧] and ⌘⇧[ (only while the panel is open). */
export function stepTab(dir: 1 | -1): void {
  if (state.open) setTabs(stepIn(state.tabs, dir));
}

/** ⌘W on the panel: the tab in front closes; false when the panel is folded (the key is not its). */
export function closeActive(): boolean {
  if (!state.open) return false;
  closeTabId(state.tabs.active);
  return true;
}

/** The panel's width now: the width the tab in front asks (kept per kind). */
export function widthNow(s: PanelKept): number {
  const tab = s.tabs.list.find((x) => x.id === s.tabs.active);
  return s.widths[tab === undefined ? 'rows' : widthOf(tab.what)];
}

/** His drag on the panel's border: the width of what is in front, kept. */
export function setWidth(w: number): void {
  const tab = state.tabs.list.find((x) => x.id === state.tabs.active);
  const k = tab === undefined ? 'rows' : widthOf(tab.what);
  const v = clampW(w);
  if (state.widths[k] !== v) set({ ...state, widths: { ...state.widths, [k]: v } });
}

/** A double click on the border: back to the width he started with. */
export function resetWidth(): void {
  const tab = state.tabs.list.find((x) => x.id === state.tabs.active);
  const k = tab === undefined ? 'rows' : widthOf(tab.what);
  set({ ...state, widths: { ...state.widths, [k]: parseKept(undefined).widths[k] } });
}

/** An Overview section a card asked for (nm-side's ▯ 'pin as a tab'): the Overview scrolls to it once. */
export type OverviewSection = 'agents' | 'artifacts' | 'processes';
let sectionAsk: OverviewSection | null = null;

/** The Overview of `project` in front, scrolled to `section`. */
export function openOverviewAt(project: string, section: OverviewSection): void {
  sectionAsk = section;
  openWhat({ kind: 'overview', project });
}

/** The section asked, once: the Overview takes it and scrolls there. */
export function takeSection(): OverviewSection | null {
  const s = sectionAsk;
  sectionAsk = null;
  return s;
}

/** The rows came: the tabs of agents no longer in them go (model.ts dropGone). */
export function dropGoneTabs(known: (project: string) => ReadonlySet<string> | undefined): void {
  const next = dropGone(state.tabs, known);
  if (next !== state.tabs) setTabs(next);
}
