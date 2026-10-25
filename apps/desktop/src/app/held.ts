// A modifier held alone shows its keys where they act (his ask, main m_21494; designer m_21507,
// m_21510; ctrl: zen-hints, the TUI's rust/tui/src/ctrlhint.rs): ⌥ held numbers the right bar's
// agents ⌥1-9, ⌘ held numbers the left bar's places (bise ⌘0, the projects ⌘1-9 in keys.ts's
// order) and puts ⌘[ ⌘] beside ‹ ›, ⌘I on the inbox's head; ctrl held lights the inbox rows'
// numbers (ctrl+N), says ⌃O on each fold and ⌃Y on a code block's copy. ONE
// delay for all three, so a quick ⌘K, ⌥1 or ctrl+r never flashes them; release, any other key, a
// click, a scroll or the window losing focus hides them all at once, no fade. One listener for the
// window (a store), however many rows read it. Owner: amb-win.
import { useSyncExternalStore } from 'react';

/** How long the modifier is held alone before its keys show: the terminal app's delay for its ctrl
 *  hints (rust/tui/src/ctrlhint.rs:43, DELAY 150 ms; his ask main m_22199), one for ⌘, ⌥ and ctrl. */
export const HINT_HOLD_MS = 150;

export type Mod = 'Alt' | 'Meta' | 'Control';

const MODS: readonly string[] = ['Alt', 'Meta', 'Control', 'Shift'];

export interface KeyLike {
  readonly type: string;
  readonly key: string;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
}

/** What a key event does to the hold, `armed` the modifier down alone now (none: nothing). Pure,
 *  as the TUI's Hold::event: the held one alone arms; its release, another modifier with it, or any
 *  other key hides; another key's release, or the held one again (a repeat), changes nothing. */
export function heldStep(armed: Mod | null, e: KeyLike): { arm: Mod } | 'hide' | 'none' {
  if (e.type === 'keyup') return armed !== null && e.key === armed ? 'hide' : 'none';
  if (armed !== null && e.key === armed) return 'none';
  if (armed !== null || !MODS.includes(e.key) || e.key === 'Shift') return 'hide';
  const mod = e.key as Mod;
  const others = (mod !== 'Alt' && e.altKey) || (mod !== 'Meta' && e.metaKey) || (mod !== 'Control' && e.ctrlKey) || e.shiftKey;
  return others ? 'hide' : { arm: mod };
}

// ---- the window's one hold ----
let armed: Mod | null = null;
let held: Mod | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const set = (h: Mod | null): void => {
  if (h === held) return;
  held = h;
  for (const l of [...listeners]) l();
};
const hide = (): void => {
  clearTimeout(timer);
  timer = undefined;
  armed = null;
  set(null);
};
const onKey = (e: KeyboardEvent): void => {
  const step = heldStep(armed, e);
  if (step === 'hide') hide();
  else if (step !== 'none') {
    armed = step.arm;
    timer = setTimeout(() => {
      timer = undefined;
      set(armed);
    }, HINT_HOLD_MS);
  }
};
const install = (): (() => void) => {
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('keyup', onKey, true);
  window.addEventListener('mousedown', hide, true);
  window.addEventListener('wheel', hide, { capture: true, passive: true });
  window.addEventListener('blur', hide);
  return () => {
    hide();
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('keyup', onKey, true);
    window.removeEventListener('mousedown', hide, true);
    window.removeEventListener('wheel', hide, { capture: true });
    window.removeEventListener('blur', hide);
  };
};
let uninstall: (() => void) | undefined;

function subscribe(l: () => void): () => void {
  listeners.add(l);
  uninstall ??= install();
  return () => {
    listeners.delete(l);
    if (listeners.size === 0) {
      uninstall?.();
      uninstall = undefined;
    }
  };
}

/** The modifier held alone for HINT_HOLD_MS, none while nothing is. */
export function useHeld(): Mod | null {
  return useSyncExternalStore(subscribe, () => held);
}

/** True while `mod` has been held alone for HINT_HOLD_MS. */
export function useModHeld(mod: Mod): boolean {
  return useHeld() === mod;
}
