// src/app/panel · the tabbed panel's live state, one per window: folded or open (folded by default,
// page native-mac §7), its tabs (model.ts) and each kind's width, kept across a reload, an update
// swap or the next day (keep.ts, no age: a Mac app reopens as he left it). Outside React's tree, as
// the terminal's panel.ts: a tab opened or a width dragged re-renders the panel and the bar's tabs,
// never the shell or the composer. Every door in: openTab (tabs.ts), the bar's ▯ and ⌥⌘B (⌥⌘0)
// (panelToggle), ⌃` (openShell), the launcher's picks. Owner: nm-panel.
import { useSyncExternalStore } from 'react';
import { keep } from '@/app/keep';
import { useLeftWidth } from '@/app/frame-state';
import { iconKindOf } from '@/ds';
import { useAllArtifacts } from '@/artifacts';
import { armHandoff } from '@/composer/handoff';
import { activate, artFit, clampShare, shareOf, closable, closeBack, closeIn, closeOthers, moveIn, nextBrowser, nextLauncher, nextShell, openIn, parseKept, pushRecent, stepIn, widenFor, clampW, fitW, fullFit, withOpen, FOLDED, dropGone, type Before, type PanelFit, type PanelKept, type TabWhat, type Tabs } from './model';

const KEY = 'panel';

let state: PanelKept = parseKept(keep.view(KEY));
const listeners = new Set<() => void>();

function set(raw: PanelKept): void {
  if (raw === state) return;
  const next = withOpen(raw);
  // the thread's composer and the floating one swap (full width on or off): his caret goes across
  if (state.open && next.full !== state.full) armHandoff();
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

/**
 * The panel in this window now: an artifact in front takes its kind's share of the window, the
 * thread keeping 400 (artFit); any other tab the one width, the thread keeping 560 (fitW).
 */
export function usePanelFit(): PanelFit {
  const s = usePanelState();
  const kind = useFrontArtKind();
  const win = useWindowWidth();
  const left = useLeftWidth();
  const fit = kind === undefined ? fitW(widthNow(s), win, left) : artFit(shareOf(kind, s.shares), win, left);
  return s.open && s.full ? fullFit(fit, win, left) : fit;
}

/** The kind (ds's iconKindOf) of the artifact in front of the panel; undefined for any other tab. */
export function useFrontArtKind(): string | undefined {
  const s = usePanelState();
  const front = s.tabs.list.find((t) => t.id === s.tabs.active)?.what;
  const e = front?.kind === 'thing' && front.e.kind === 'artifact' ? front.e : undefined;
  // no artifact in front: a project no row has, so it reads nothing ('' would read every project's)
  const a = useAllArtifacts(e?.project ?? '\u0000').find((x) => x.a.id === e?.id)?.a;
  if (e === undefined) return undefined;
  return a === undefined ? 'page' : iconKindOf(a);
}

/** His drag on the border with an artifact of `kind` in front: that kind's share, 50-70%, kept. */
export function setArtShare(kind: string, share: number): void {
  const v = clampShare(share);
  if (state.shares[kind] !== v) set({ ...state, shares: { ...state.shares, [kind]: v } });
}

/** A double click on the border with an artifact in front: that kind's own share again. */
export function resetArtShare(kind: string): void {
  if (!(kind in state.shares)) return;
  set({ ...state, shares: Object.fromEntries(Object.entries(state.shares).filter(([k]) => k !== kind)) });
}

/**
 * Open or folded, and the column it takes (0 folded, 0 as a sheet over the thread): what the right
 * side (nm-side's sideLayout) and the shell read. `over`: it is a sheet now.
 */
export function usePanelBox(): { readonly open: boolean; readonly width: number; readonly over: boolean; readonly full: boolean } {
  const s = usePanelState();
  const f = usePanelFit();
  return { open: s.open, width: s.open && !f.over ? f.width : 0, over: s.open && f.over, full: s.open && s.full && !f.over };
}

/** Full width now (model.ts fullFit): open, full, and not a sheet. The thread hides, the floating composer comes over the panel. */
export function usePanelFull(): boolean {
  return usePanelBox().full;
}

/** The bar's ▯ and ⌥⌘B (⌥⌘0): fold or unfold, on the tab he left in front. */
export function panelToggle(): void {
  set({ ...state, open: !state.open });
}

/** Full width on or off (his drag past the thread's 400, a drag back, ⇧⌥⌘B, the tab row's 'show the thread'); on unfolds the panel. */
export function setFull(on: boolean): void {
  if (on === (state.open && state.full)) return;
  set({ ...state, open: state.open || on, full: on });
}

/** ⇧⌥⌘B and View › Panel Full Width: full width or back beside the thread. */
export function toggleFull(): void {
  setFull(!(state.open && state.full));
}

/** His drag on the border is past the thread's 400 now (Host.tsx Border): the thread dims as a preview. Not kept. */
let fullPreview = false;
const previewSubs = new Set<() => void>();

export function setFullPreview(on: boolean): void {
  if (on === fullPreview) return;
  fullPreview = on;
  for (const l of previewSubs) l();
}

/** The drag's preview, live (App.tsx dims the thread with it). */
export function useFullPreview(): boolean {
  return useSyncExternalStore(
    (l) => {
      previewSubs.add(l);
      return () => {
        previewSubs.delete(l);
      };
    },
    () => fullPreview,
  );
}

/** Opens `what` in a tab (an open one comes to the front), unfolding the panel; `instead`: the launcher it replaces. */
export function openWhat(what: TabWhat, instead?: string): void {
  const recent = what.kind === 'thing' ? pushRecent(state.recent, what.e) : state.recent;
  const tabs = openIn(state.tabs, what, instead);
  if (!state.open || tabs.active !== state.tabs.active) before.set(tabs.active, { open: state.open, active: state.tabs.active });
  // a page newly opened may widen the panel once (widenFor); an open one coming to the front doesn't
  const isNew = !state.tabs.list.some((t) => t.id === tabs.active);
  set({ ...state, open: true, tabs, recent, width: isNew ? widenFor(state, what) : state.width });
}

/** '+' and ⌘T: a New tab (the launcher). */
export function openLauncher(): void {
  openWhat(nextLauncher(state.tabs));
}

/**
 * ⌘P and the launcher's Artifacts: the picker of the latest artifacts, in `instead` (the launcher
 * it came from), else in the New tab in front, else in a new one.
 */
export function openArtifacts(instead?: string): void {
  const at = instead ?? state.tabs.active;
  const front = state.open ? state.tabs.list.find((t) => t.id === at) : undefined;
  if (front?.what.kind === 'launcher') openWhat({ kind: 'launcher', n: front.what.n, artifacts: true }, front.id);
  else openWhat(nextLauncher(state.tabs, true), instead);
}

/** The picker's esc on an empty field: the New tab `id` back on its Open list. */
export function launcherHome(id: string): void {
  const t = state.tabs.list.find((x) => x.id === id);
  if (t?.what.kind === 'launcher') openWhat({ kind: 'launcher', n: t.what.n }, id);
}

/** ⌘L and the launcher's Browser: a browser tab, its address field focused (Browser.tsx). */
export function openBrowser(instead?: string): void {
  openWhat(nextBrowser(state.tabs), instead);
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

/** What was in front when each tab came by openWhat (model.ts Before); a reload forgets it. */
const before = new Map<string, Before>();

/** Esc on the tab `id`: it closes, the panel as it was before it came (model.ts closeBack, app/escape.ts). */
export function closeTabBack(id: string): void {
  const b = closeBack(state.tabs, id, before.get(id));
  before.delete(id);
  set({ ...state, tabs: b.tabs, open: b.open });
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
