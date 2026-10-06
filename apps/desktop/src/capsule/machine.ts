// What the capsule shows and when (pure, for the checks): fn space opens the spotlight at the top
// with the keys; holding fn talks (the talk at the bottom, never the keys, bise holds the mic), its
// release thinks; fn fn talks hands-free until the next tap (the helper reports that tap as
// talk_end, its one meaning: ambient-lead m_9998; a 'tap' event ends it too); bise's answer replaces the talk; a
// card bise pushes shows at the bottom only when nothing else is up (his action first) and waits
// through a quiet moment (a call, sharing, full screen), then shows when it ends; his own action
// (fn space, fn talk) is never held. esc or fn esc closes; the tray's click opens the dropdown; a
// blur that hid the window closes the view. Effects: the capsule window (show, hide), the main
// window (open), the helper's mic (own_mic, so its quiet sampling skips bise's own use).
import type { FnAct } from '@/proto';

export type View =
  | { readonly kind: 'none' }
  | { readonly kind: 'spot' }
  | { readonly kind: 'talk'; readonly phase: 'listen' | 'think'; readonly handsFree: boolean }
  | { readonly kind: 'answer' }
  | { readonly kind: 'card'; readonly id: string }
  | { readonly kind: 'menu' };

export interface State {
  readonly view: View;
  /** a quiet moment: pushed cards wait */
  readonly quiet: boolean;
  /** the cards pushed while something was up or quiet, oldest first */
  readonly held: readonly string[];
}

export type CapEvent =
  | { readonly ev: 'fn'; readonly act: FnAct; readonly key?: string | null }
  /** the capsule window's state changed (src/main/capsule.ts) */
  | { readonly ev: 'window'; readonly shown: boolean; readonly why: 'asked' | 'tray' | 'blur' }
  | { readonly ev: 'quiet'; readonly on: boolean }
  /** bise's answer to what he said or typed started */
  | { readonly ev: 'answer' }
  /** bise pushes a card (a question or an approval while he's elsewhere) */
  | { readonly ev: 'card'; readonly id: string }
  /** a card was answered or went away */
  | { readonly ev: 'card_done'; readonly id: string }
  /** esc, a close, or an 'open in bise' that moved him to the window */
  | { readonly ev: 'close' };

export type Fx =
  | { readonly fx: 'show'; readonly at: 'top' | 'bottom' | 'menu'; readonly keys: boolean }
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
export const START: State = { view: NONE, quiet: false, held: [] };

const talking = (v: View): boolean => v.kind === 'talk' && v.phase === 'listen';

/** The view goes to `view`; the mic follows the talk; when nothing is up, a held card shows. */
function go(s: State, view: View, ...fx: Fx[]): Step {
  const out: Fx[] = [...fx];
  if (talking(s.view) && !talking(view)) out.push({ fx: 'mic', open: false });
  if (!talking(s.view) && talking(view)) out.push({ fx: 'mic', open: true });
  const next: State = { ...s, view };
  const [id, ...rest] = next.held;
  if (view.kind === 'none' && !next.quiet && id !== undefined) {
    const kept = out.filter((f) => f.fx !== 'hide');
    return { state: { ...next, view: { kind: 'card', id }, held: rest }, fx: [...kept, { fx: 'show', at: 'bottom', keys: false }] };
  }
  return { state: next, fx: out };
}

const stay = (s: State): Step => ({ state: s, fx: [] });
const cancelTalk = (s: State): Step => go(s, NONE, { fx: 'hide' }, ...(talking(s.view) ? [{ fx: 'talk', cmd: 'talk_cancel' } as const] : []));
const close = (s: State): Step => (s.view.kind === 'none' ? stay(s) : go(s, NONE, { fx: 'hide' }));

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
          return go(s, { kind: 'talk', phase: 'listen', handsFree: false }, { fx: 'show', at: 'bottom', keys: false }, { fx: 'talk', cmd: 'talk_start' });
        case 'double':
          return go(s, { kind: 'talk', phase: 'listen', handsFree: true }, { fx: 'show', at: 'bottom', keys: false }, { fx: 'talk', cmd: 'talk_start' });
        case 'talk_end':
          return v.kind === 'talk' && v.phase === 'listen' ? go(s, { kind: 'talk', phase: 'think', handsFree: v.handsFree }, { fx: 'talk', cmd: 'talk_end' }) : stay(s);
        case 'tap':
          return v.kind === 'talk' && v.handsFree && v.phase === 'listen' ? go(s, { kind: 'talk', phase: 'think', handsFree: true }, { fx: 'talk', cmd: 'talk_end' }) : stay(s);
        case 'cancel':
          return v.kind === 'talk' ? cancelTalk(s) : stay(s);
        case 'esc':
          return talking(v) ? cancelTalk(s) : close(s);
      }
      return stay(s);
    case 'window':
      if (e.why === 'tray' && e.shown) return go(s, { kind: 'menu' });
      if (!e.shown && v.kind !== 'none') return go(s, NONE);
      return stay(s);
    case 'quiet':
      if (e.on) return stay({ ...s, quiet: true });
      return v.kind === 'none' ? go({ ...s, quiet: false }, NONE) : stay({ ...s, quiet: false });
    case 'answer':
      return v.kind === 'talk' ? go(s, { kind: 'answer' }) : stay(s);
    case 'card':
      if (s.held.includes(e.id) || (v.kind === 'card' && v.id === e.id)) return stay(s);
      if (v.kind === 'none' && !s.quiet) return go(s, { kind: 'card', id: e.id }, { fx: 'show', at: 'bottom', keys: false });
      return stay({ ...s, held: [...s.held, e.id] });
    case 'card_done': {
      const held = s.held.filter((h) => h !== e.id);
      return v.kind === 'card' && v.id === e.id ? close({ ...s, held }) : stay({ ...s, held });
    }
    case 'close':
      return close(s);
  }
}
