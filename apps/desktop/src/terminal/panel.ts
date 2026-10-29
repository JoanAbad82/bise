// The terminal's own state: where it lives (a tab of the tabbed panel on the
// right, his pref and the default, or the panel under the screen after 'move to
// bottom'; page native-mac §4 #2), the bottom panel's shown and height, and the
// project in view (its first shell is ⌃`'s), outside React's tree so toggling
// it re-renders the panel only, never the shell or the composer. ⌃` and View >
// Terminal go where the place says. Owner: nm-panel (bise fait mac; amb-win
// before). The height and the place are kept across launches.
import { useSyncExternalStore } from 'react';
import { DEFAULT_H } from './model';
import { keep } from '@/app/keep';
import { openWhat, toggleShell } from '@/app/panel/state';

/** Where the terminal lives: a tab on the right (default), or the panel under the screen. */
export type TermPlace = 'right' | 'bottom';

export interface PanelState {
  /** the panel is on screen */
  readonly shown: boolean;
  /** it was shown once: its shell runs, kept while hidden */
  readonly opened: boolean;
  readonly height: number;
  readonly place: TermPlace;
}

const KEY = 'bise.terminal.height';

function savedHeight(): number {
  try {
    const n = Number(localStorage.getItem(KEY));
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_H;
  } catch {
    return DEFAULT_H;
  }
}

// shown across a reload, an update swap or the next day (keep.ts: an open panel, no age)
const SHOWN = 'terminal';
const PLACE = 'terminal.place';
const keptPlace: TermPlace = keep.view(PLACE) === 'bottom' ? 'bottom' : 'right';
const keptShown = keptPlace === 'bottom' && keep.view(SHOWN) === true;
let state: PanelState = { shown: keptShown, opened: keptShown, height: savedHeight(), place: keptPlace };
/** The project in view (RouteTerminal's): ⌃` on the right opens its first shell. */
let here: string | undefined;
const listeners = new Set<() => void>();

function set(next: PanelState) {
  if (next.shown !== state.shown) keep.setView(SHOWN, next.shown ? true : undefined);
  if (next.place !== state.place) keep.setView(PLACE, next.place === 'bottom' ? 'bottom' : undefined);
  state = next;
  for (const l of listeners) l();
}

/** The last time a key toggled it: the menu's echo of the same ⌃` is dropped. */
let keyAt = -Infinity;

export const panel = {
  get: (): PanelState => state,
  subscribe: (l: () => void): (() => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  show(): void {
    if (!state.shown) set({ ...state, shown: true, opened: true });
  },
  hide(): void {
    if (state.shown) set({ ...state, shown: false });
  },
  /** ⌃` in the page */
  toggleByKey(now: number): void {
    keyAt = now;
    toggle();
  },
  /** View > Terminal (the menu's MenuAction): the key's own echo within 300 ms is dropped */
  toggleByMenu(now: number): void {
    if (now - keyAt < 300) return;
    toggle();
  },
  /** View > Terminal while another window had the keys: the terminal shows here, where it lives */
  reveal(): void {
    if (state.place === 'bottom') panel.show();
    else if (here !== undefined) openWhat({ kind: 'terminal', project: here, n: 0 });
  },
  /** 'move to bottom' (a terminal tab's menu) and back to the right */
  setPlace(place: TermPlace): void {
    if (place !== state.place) set({ ...state, place });
  },
  /** the project in view, said by RouteTerminal on each route */
  setHere(project: string | undefined): void {
    here = project;
  },
  setHeight(h: number): void {
    if (h === state.height) return;
    set({ ...state, height: h });
    try {
      localStorage.setItem(KEY, String(h));
    } catch {
      // no storage (a test page): the height lives until reload
    }
  },
  /** tests only */
  reset(): void {
    keyAt = -Infinity;
    here = undefined;
    set({ shown: false, opened: false, height: DEFAULT_H, place: 'right' });
  },
};

/** ⌃`: the bottom panel shown or hidden, or the project's first shell's tab on the right. */
function toggle(): void {
  if (state.place === 'bottom') {
    if (state.shown) panel.hide();
    else panel.show();
  } else if (here !== undefined) toggleShell(here);
}

export function usePanel(): PanelState {
  return useSyncExternalStore(panel.subscribe, panel.get);
}
