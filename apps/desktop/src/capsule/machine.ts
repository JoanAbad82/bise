// What the capsule shows and when (pure, for the checks): fn space opens the spotlight at the top
// with the keys; holding fn talks (the talk at the bottom, never the keys, bise holds the mic), its
// release thinks; fn fn talks hands-free until the next tap (the helper reports that tap as
// talk_end, its one meaning: ambient-lead m_9998; a 'tap' event ends it too); bise's answer replaces the talk.
// The capsule never pushes a card (the user's decision 2026-10-09, card #476, ambient-lead
// m_14205): a question shows in the window's inbox block when bise's window is in front, and as
// the native notification when it isn't; a card shows here only when he opens it from the
// spotlight's 'waiting for you' rows (⏎) or the tray menu's rows (a click, fn+n), its answer in
// place, esc back to that list.
// esc or fn esc closes; the tray's click opens the dropdown; a blur that hid the window closes the
// view. Effects: the capsule window (show, hide), the main window (open), the helper's mic
// (own_mic, so its quiet sampling skips bise's own use).
import type { FnAct } from '@/proto';
import type { CapsuleFit } from '../shared/api';

/** The voice view grows down from where it showed and never moves (lead m_11532); its glass is at most 320 px (capsule.css). */
export const TALK_FIT: CapsuleFit = { grow: 'down', maxHeight: 320 };

export type View =
  | { readonly kind: 'none' }
  | { readonly kind: 'spot' }
  | { readonly kind: 'talk'; readonly phase: 'listen' | 'think'; readonly handsFree: boolean }
  | { readonly kind: 'answer' }
  /**
   * opened from the spotlight's waiting row (⏎ '↵ answer') or the tray menu's (a click, fn+n:
   * `from` 'menu'): esc and its answer go back to that list
   */
  | { readonly kind: 'card'; readonly id: string; readonly from?: 'menu' }
  | { readonly kind: 'menu' };

export interface State {
  readonly view: View;
}

export type CapEvent =
  | { readonly ev: 'fn'; readonly act: FnAct; readonly key?: string | null }
  /** the capsule window's state changed (src/main/capsule.ts) */
  | { readonly ev: 'window'; readonly shown: boolean; readonly why: 'asked' | 'tray' | 'blur' }
  /** bise's answer to what he said or typed started */
  | { readonly ev: 'answer' }
  /** a card was answered or went away */
  | { readonly ev: 'card_done'; readonly id: string }
  /** ⏎ on a spotlight waiting row: that card's answer, in place (qa-native R03: it closed to nothing) */
  | { readonly ev: 'open_card'; readonly id: string }
  /** the card's 'esc later': back to the spotlight */
  | { readonly ev: 'later' }
  /** esc, a close, or an 'open in bise' that moved him to the window */
  | { readonly ev: 'close' };

export type Fx =
  | { readonly fx: 'show'; readonly at: 'top' | 'bottom' | 'menu'; readonly keys: boolean; readonly fit?: CapsuleFit }
  | { readonly fx: 'hide' }
  | { readonly fx: 'open'; readonly route?: string }
  | { readonly fx: 'mic'; readonly open: boolean }
  /** the core listens: talk_start on a hold or fn fn, talk_end on the release or the next tap, talk_cancel */
  | { readonly fx: 'talk'; readonly cmd: 'talk_start' | 'talk_end' | 'talk_cancel' };

export interface Step {
  readonly state: State;
  readonly fx: readonly Fx[];
}

export const NONE: View = { kind: 'none' };
export const START: State = { view: NONE };

const talking = (v: View): boolean => v.kind === 'talk' && v.phase === 'listen';

/** The view goes to `view`; the mic follows the talk. */
function go(s: State, view: View, ...fx: Fx[]): Step {
  const out: Fx[] = [...fx];
  if (talking(s.view) && !talking(view)) out.push({ fx: 'mic', open: false });
  if (!talking(s.view) && talking(view)) out.push({ fx: 'mic', open: true });
  return { state: { ...s, view }, fx: out };
}

const stay = (s: State): Step => ({ state: s, fx: [] });
const cancelTalk = (s: State): Step => go(s, NONE, { fx: 'hide' }, ...(talking(s.view) ? [{ fx: 'talk', cmd: 'talk_cancel' } as const] : []));
const close = (s: State): Step => (s.view.kind === 'none' ? stay(s) : go(s, NONE, { fx: 'hide' }));
/** a card goes back to the list it was opened from (the spotlight or the tray menu); any other view closes */
const back = (s: State): Step => (s.view.kind === 'card' ? go(s, s.view.from === 'menu' ? { kind: 'menu' } : { kind: 'spot' }) : close(s));

export function step(s: State, e: CapEvent): Step {
  const v = s.view;
  switch (e.ev) {
    case 'fn':
      switch (e.act) {
        case 'key':
          if (e.key === 'space') return v.kind === 'spot' ? close(s) : go(s, { kind: 'spot' }, { fx: 'show', at: 'top', keys: true });
          if (e.key === 'i') return v.kind === 'none' ? { state: s, fx: [{ fx: 'open', route: 'inbox' }] } : go(s, NONE, { fx: 'hide' }, { fx: 'open', route: 'inbox' });
          return stay(s);
        case 'talk_start':
          return go(s, { kind: 'talk', phase: 'listen', handsFree: false }, { fx: 'show', at: 'bottom', keys: false, fit: TALK_FIT }, { fx: 'talk', cmd: 'talk_start' });
        case 'double':
          return go(s, { kind: 'talk', phase: 'listen', handsFree: true }, { fx: 'show', at: 'bottom', keys: false, fit: TALK_FIT }, { fx: 'talk', cmd: 'talk_start' });
        case 'talk_end':
          return v.kind === 'talk' && v.phase === 'listen' ? go(s, { kind: 'talk', phase: 'think', handsFree: v.handsFree }, { fx: 'talk', cmd: 'talk_end' }) : stay(s);
        case 'tap':
          return v.kind === 'talk' && v.handsFree && v.phase === 'listen' ? go(s, { kind: 'talk', phase: 'think', handsFree: true }, { fx: 'talk', cmd: 'talk_end' }) : stay(s);
        case 'cancel':
          return v.kind === 'talk' ? cancelTalk(s) : stay(s);
        case 'esc':
          return talking(v) ? cancelTalk(s) : back(s);
      }
      return stay(s);
    case 'window':
      if (e.why === 'tray' && e.shown) return go(s, { kind: 'menu' });
      if (!e.shown && v.kind !== 'none') return go(s, NONE);
      return stay(s);
    case 'answer':
      return v.kind === 'talk' ? go(s, { kind: 'answer' }) : stay(s);
    case 'card_done':
      return v.kind === 'card' && v.id === e.id ? back(s) : stay(s);
    case 'open_card':
      if (v.kind === 'spot') return go(s, { kind: 'card', id: e.id });
      return v.kind === 'menu' ? go(s, { kind: 'card', id: e.id, from: 'menu' }) : stay(s);
    case 'later':
      return back(s);
    case 'close':
      return close(s);
  }
}
