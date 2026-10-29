// Zen while you type (the TUI's rust/tui/src/zen.rs, BISE-121/124/128; his ask, zen-hints): while
// he writes in a composer, the window's chrome steps back.
//
// - Enters on a key that changes a composer's text (a character with any modifier that types, an
//   accent or dead key, backspace/delete, a new line ⇧⏎ ⌥⏎, an IME step) or a paste into it, with
//   no / @ $ : list open (zen.rs:4-7).
// - Holds (its 5 s start again) on a key that moves inside the composer without changing it: the
//   arrows, home/end, their ⌥ ⌘ ctrl ⇧ forms, ⌘A (zen.rs:8-11). A lone modifier, caps lock: nothing.
// - Leaves ZEN_HOLD_MS (5 s, zen.rs:47) after the last typing key, or at once on: ⏎ send, esc, tab,
//   page up/down, any key an app shortcut takes or that leaves the text as it was (⌘K, ⌥1, ctrl+r),
//   a list opening, a key outside a composer, a mouse move, click or scroll, the window losing the
//   focus, and a change of what waits on him (the inbox's count: a card, a message to you).
// - The look is CSS (zen.css): the root's data-zen moves --zen 0 -> 45% (zen.rs DEPTH) over
//   250 ms (FADE), back the same way; a remap of the text and line tokens in the chrome mixes them
//   that far toward transparent, i.e. toward their own ground. Faded: the title bar, the sidebar,
//   the right bar, the composer's tools row and key line. Kept as they are: the thread (what he
//   reads), the composer's text, caret and tab label, the inbox block (the card box), and every
//   accent or err (what needs him: those tokens are never remapped). Reduced motion: no ramp.
//
// Pure decisions (zenStep, zenKey) with unit laws in zen.test.ts; the window wiring (one listener
// set, mounted by App's useZenWatch) reads the composers' text before and after each key, as the
// TUI's loop does (run.rs zen_input). Owner: amb-win.
import { useEffect, useRef, useSyncExternalStore } from 'react';

/** Zen lasts this long after the last typing key (the TUI's zen::HOLD, BISE-128). */
export const ZEN_HOLD_MS = 5000;
/** The fade in and out (zen::FADE); the CSS transition says the same. */
export const ZEN_FADE_MS = 250;

/** How an input counts for zen (zen.rs Input). */
export type ZenInput = 'typing' | 'hold' | 'other' | 'neutral';

export interface ZenState {
  /** the last typing (or holding) key's time; none: never in zen */
  readonly last: number | null;
  /** zen was left at once (send, a click, a list...) since `last` */
  readonly broken: boolean;
}

export const ZEN_REST: ZenState = { last: null, broken: false };

/** In zen at `now`. Pure. */
export function zenActive(s: ZenState, now: number): boolean {
  return s.last !== null && !s.broken && now < s.last + ZEN_HOLD_MS;
}

/** The state after an input at `now` (zen.rs Zen::input). Pure. */
export function zenStep(s: ZenState, i: ZenInput, now: number): ZenState {
  switch (i) {
    case 'typing':
      return { last: now, broken: false };
    case 'hold':
      return zenActive(s, now) ? { last: now, broken: false } : s;
    case 'other':
      return zenActive(s, now) ? { ...s, broken: true } : s;
    case 'neutral':
      return s;
  }
}

export interface ZenKey {
  readonly key: string;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
}

/** Where a key went: `composer` the focus is in a composer's field after it, `changed` a composer's
 *  text changed, `popup` a list was open before or after it. */
export interface KeyWhere {
  readonly composer: boolean;
  readonly changed: boolean;
  readonly popup: boolean;
}

const IDLE = new Set(['Alt', 'Meta', 'Control', 'Shift', 'CapsLock', 'Fn', 'FnLock', 'NumLock', 'ScrollLock', 'Hyper', 'Super', 'OS', 'Unidentified']);
const MOVES = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

/** A key, told by where it went and what it did (zen.rs key_input + composer_key). Pure. */
export function zenKey(e: ZenKey, w: KeyWhere): ZenInput {
  if (IDLE.has(e.key)) return 'neutral';
  // ⏎ sends (BISE-128); ⇧⏎ ⌥⏎ are new lines, typing below
  if (e.key === 'Enter' && !e.shiftKey && !e.altKey) return 'other';
  if (e.key === 'Escape' || e.key === 'Tab' || e.key === 'PageUp' || e.key === 'PageDown') return 'other';
  if (!w.composer || w.popup) return 'other';
  // an accent waiting for its letter changes the field's pending state, as the TUI's dead key
  if (w.changed || e.key === 'Dead' || e.key === 'Process') return 'typing';
  if (MOVES.has(e.key)) return 'hold';
  // ⌘A (and the Mac's ctrl+a / ctrl+e line moves) select or move in the field
  if (e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'a') return 'hold';
  if (e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'a' || e.key === 'e')) return 'hold';
  return 'other';
}

// ---- the window's one zen ----
let state: ZenState = ZEN_REST;
let on = false;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function sync(now: number): void {
  const next = zenActive(state, now);
  clearTimeout(timer);
  timer = undefined;
  if (next && state.last !== null) {
    timer = setTimeout(() => {
      sync(Date.now());
    }, state.last + ZEN_HOLD_MS - now);
  }
  if (next === on) return;
  on = next;
  for (const l of [...listeners]) l();
}

/** Feed an input now. */
export function zenInput(i: ZenInput): void {
  const now = Date.now();
  state = zenStep(state, i, now);
  sync(now);
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** True while the window is in zen. */
export function useZen(): boolean {
  return useSyncExternalStore(subscribe, () => on);
}

const FIELDS = '.b-composer [contenteditable="true"]';
const LISTS = '.b-composer .b-picker';

interface Look {
  readonly text: string;
  readonly popup: boolean;
}
const look = (): Look => ({
  text: Array.from(document.querySelectorAll(FIELDS), (el) => el.textContent).join('\u0000'),
  popup: document.querySelector(LISTS) !== null,
});
const inComposer = (): boolean => {
  const a = document.activeElement;
  return a instanceof HTMLElement && a.isContentEditable && a.closest('.b-composer') !== null;
};

/** The window's zen wiring, mounted once (App): every key, paste and mouse event, the focus, and
 *  the count of what waits on him (`calls`: a change leaves zen, zen.rs Zen::calls). */
export function useZenWatch(calls: number): void {
  useEffect(() => {
    // the pointer's last place: Chromium sends a mousemove without a move when the layout changes
    // under a still pointer (a row grows under it while he types); only a real move counts
    let at: { x: number; y: number } | null = null;
    const after = (before: Look, what: (w: KeyWhere) => ZenInput): void => {
      // the key's default action (the character, the paste) lands in the same task; the field's
      // own handlers ran: read the composers once it all settled
      setTimeout(() => {
        const now = look();
        zenInput(what({ composer: inComposer(), changed: now.text !== before.text, popup: before.popup || now.popup }));
      }, 0);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (IDLE.has(e.key)) return;
      after(look(), (w) => zenKey(e, w));
    };
    const onPaste = (): void => {
      after(look(), (w) => (!w.composer || w.popup ? 'other' : w.changed ? 'typing' : 'hold'));
    };
    const onMove = (e: MouseEvent): void => {
      const moved = at !== null && (Math.abs(e.screenX - at.x) > 1 || Math.abs(e.screenY - at.y) > 1);
      at = { x: e.screenX, y: e.screenY };
      if (moved) zenInput('other');
    };
    const leave = (): void => {
      zenInput('other');
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('paste', onPaste, true);
    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('mousedown', leave, true);
    window.addEventListener('wheel', leave, { capture: true, passive: true });
    window.addEventListener('blur', leave);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('paste', onPaste, true);
      window.removeEventListener('mousemove', onMove, true);
      window.removeEventListener('mousedown', leave, true);
      window.removeEventListener('wheel', leave, { capture: true });
      window.removeEventListener('blur', leave);
    };
  }, []);
  const seen = useRef(calls);
  useEffect(() => {
    if (calls === seen.current) return;
    seen.current = calls;
    zenInput('other');
  }, [calls]);
}
