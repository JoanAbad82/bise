// A modifier held alone shows its keys where they act (his ask, main m_21494; designer m_21507,
// m_21510; ctrl: zen-hints, the TUI's rust/tui/src/ctrlhint.rs): ⌥ held numbers the right bar's
// agents ⌥1-9, ⌘ held numbers the left bar's places (bise ⌘0, the projects ⌘1-9 in keys.ts's
// order) and puts ⌘[ ⌘] beside ‹ ›, ⌘I on the inbox's head; ctrl held lights the inbox rows'
// numbers (ctrl+N), says ⌃O on each fold and ⌃Y on a code block's copy. ONE
// delay for all three, so a quick ⌘K, ⌥1 or ctrl+r never flashes them; release, any other key, a
// click, a scroll or the window losing focus hides them all at once, no fade. One listener for the
// window (a store), however many rows read it. Owner: amb-win.
import { useEffect, useState, useSyncExternalStore } from 'react';

/** How long the modifier is held alone before its keys show: the terminal app's delay for its ctrl
 *  hints (rust/tui/src/ctrlhint.rs:43, DELAY 150 ms; his ask main m_22199), one for ⌘, ⌥ and ctrl. */
export const HINT_HOLD_MS = 150;

/** 'AltMeta': ⌥ and ⌘ held together, nothing else (the panel's ⌥⌘B on its button, designer m_45008). */
export type Mod = 'Alt' | 'Meta' | 'Control' | 'AltMeta';

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
  const mine = (key: string) => armed !== null && (key === armed || (armed === 'AltMeta' && (key === 'Alt' || key === 'Meta')));
  if (e.type === 'keyup') return mine(e.key) ? 'hide' : 'none';
  if (mine(e.key)) return 'none';
  // ⌥ then ⌘ (or ⌘ then ⌥), no shift or ctrl: the pair arms
  const pair = (armed === 'Alt' && e.key === 'Meta') || (armed === 'Meta' && e.key === 'Alt');
  if (pair) return e.shiftKey || e.ctrlKey ? 'hide' : { arm: 'AltMeta' };
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

/** each hold's number: a long hold (useModHeldFor) is this hold's, never a past one's */
let holds = 0;

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
    // ⌘ held, then ⌥: the ⌘ hints go at once, the pair's show after the same delay
    clearTimeout(timer);
    set(null);
    armed = step.arm;
    holds += 1;
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

/** True while `mod` has been held alone for `ms` (at least HINT_HOLD_MS): the same hold, so any
 *  other key, its release, a click, a scroll or the window losing focus ends it at once; the
 *  folded side's cards (page folded-side v9: ⌥ alone 300 ms, ⌥ is a typing key on a French
 *  keyboard). */
export function useModHeldFor(mod: Mod, ms: number): boolean {
  const on = useModHeld(mod);
  // the hold that has lasted `ms`, by its number: a new hold starts short again
  const [longHold, setLongHold] = useState(-1);
  const hold = on ? holds : -1;
  useEffect(() => {
    if (hold < 0) return;
    const t = setTimeout(() => {
      setLongHold(hold);
    }, Math.max(0, ms - HINT_HOLD_MS));
    return () => {
      clearTimeout(t);
    };
  }, [hold, ms]);
  return hold >= 0 && longHold === hold;
}
