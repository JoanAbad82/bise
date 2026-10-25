// src/app/panel · the tabbed panel's live state, one per window: folded or open (folded by default,
// page native-mac §7), its tabs (model.ts) and each kind's width, kept across a reload, an update
// swap or the next day (keep.ts, no age: a Mac app reopens as he left it). Outside React's tree, as
// the terminal's panel.ts: a tab opened or a width dragged re-renders the panel and the bar's tabs,
// never the shell or the composer. Every door in: openTab (tabs.ts), the bar's ▯ and ⌥⌘0
// (panelToggle), ⌃` (openShell), the launcher's picks. Owner: nm-panel.
import { useSyncExternalStore } from 'react';
import { keep } from '@/app/keep';
import { useLeftWidth } from '@/app/frame-state';
import { activate, closable, closeIn, closeOthers, moveIn, nextLauncher, nextShell, openIn, parseKept, pushRecent, stepIn, widenFor, clampW, fitW, FOLDED, dropGone, type PanelFit, type PanelKept, type TabWhat, type Tabs } from './model';

const KEY = 'panel';

let state: PanelKept = parseKept(keep.view(KEY));
const listeners = new Set<() => void>();

function set(next: PanelKept): void {
  if (next === state) return;
  state = next;
  keep.setView(KEY, next);
  for (const l of listeners) l();
}

function setTabs(tabs: Tabs): void {
  if (tabs !== state.tabs) set({ ...state, tabs });
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

/** The window's width, live. */
function useWindowWidth(): number {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('resize', cb);
      return () => {
        window.removeEventListener('resize', cb);
      };
    },
    () => window.innerWidth,
  );
}

/** The panel in this window now: what the tab in front asks, beside the thread or over it (fitW). */
export function usePanelFit(): PanelFit {
  return fitW(widthNow(usePanelState()), useWindowWidth(), useLeftWidth());
}

/**
 * Open or folded, and the column it takes (0 folded, 0 as a sheet over the thread): what the right
 * side (nm-side's sideLayout) and the shell read. `over`: it is a sheet now.
 */
export function usePanelBox(): { readonly open: boolean; readonly width: number; readonly over: boolean } {
  const s = usePanelState();
  const f = usePanelFit();
  return { open: s.open, width: s.open && !f.over ? f.width : 0, over: s.open && f.over };
}

/** The bar's ▯ and ⌥⌘0: fold or unfold, on the tab he left in front. */
export function panelToggle(): void {
  set({ ...state, open: !state.open });
}

/** Opens `what` in a tab (an open one comes to the front), unfolding the panel; `instead`: the launcher it replaces. */
export function openWhat(what: TabWhat, instead?: string): void {
  const recent = what.kind === 'thing' ? pushRecent(state.recent, what.e) : state.recent;
  const tabs = openIn(state.tabs, what, instead);
  // a page newly opened may widen the panel once (widenFor); an open one coming to the front doesn't
  const isNew = !state.tabs.list.some((t) => t.id === tabs.active);
  set({ ...state, open: true, tabs, recent, width: isNew ? widenFor(state, what) : state.width });
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

/** ⌘W on the panel: the tab in front closes; on Overview (the home, never closed) the panel folds. */
export function closeActive(): void {
  if (!state.open) return;
  if (closable(state.tabs.active)) closeTabId(state.tabs.active);
  else set({ ...state, open: false });
}

/** The panel's width now: its one width, whatever tab is in front (designer m_43050 #7a). */
export function widthNow(s: PanelKept): number {
  return s.width;
}

/** His drag on the panel's border: the window's panel width, kept; no artifact widens it after. */
export function setWidth(w: number): void {
  const v = clampW(w);
  if (state.width !== v || !state.dragged) set({ ...state, width: v, dragged: true });
}

/** A double click on the border: back to the width it starts with, an artifact may widen it again. */
export function resetWidth(): void {
  set({ ...state, width: FOLDED.width, dragged: false });
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
  setTabs(dropGone(state.tabs, known));
}
