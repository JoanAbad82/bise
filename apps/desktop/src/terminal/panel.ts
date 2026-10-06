// The terminal panel's own state (shown, height), outside React's tree so
// toggling it re-renders the panel only, never the shell or the composer.
// Owner: amb-win. The height is kept across launches (localStorage).
import { useSyncExternalStore } from 'react';
import { DEFAULT_H } from './model';

export interface PanelState {
  /** the panel is on screen */
  readonly shown: boolean;
  /** it was shown once: its shell runs, kept while hidden */
  readonly opened: boolean;
  readonly height: number;
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

let state: PanelState = { shown: false, opened: false, height: savedHeight() };
const listeners = new Set<() => void>();

function set(next: PanelState) {
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
    if (state.shown) panel.hide();
    else panel.show();
  },
  /** View > Terminal (the menu's MenuAction): the key's own echo within 300 ms is dropped */
  toggleByMenu(now: number): void {
    if (now - keyAt < 300) return;
    if (state.shown) panel.hide();
    else panel.show();
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
    set({ shown: false, opened: false, height: DEFAULT_H });
  },
};

export function usePanel(): PanelState {
  return useSyncExternalStore(panel.subscribe, panel.get);
}
