// What the capsule shows and when (pure, for the checks): fn space opens the spotlight at the top
// with the keys; holding fn talks (the talk at the bottom, never the keys), its release thinks,
// bise's answer replaces the talk; a pushed card shows at the bottom only when nothing else is up
// (his action first); esc or fn esc closes; the tray's click opens the dropdown; a blur that hid
// the window closes the view. The effects are the capsule window's (window.bise.capsule) and the
// main window's (openWindow); CapsuleRoot runs them.
import type { FnAct } from '@/proto';

export type View =
  | { readonly kind: 'none' }
  | { readonly kind: 'spot' }
  | { readonly kind: 'talk'; readonly phase: 'listen' | 'think' }
  | { readonly kind: 'answer' }
  | { readonly kind: 'card'; readonly id: string }
  | { readonly kind: 'menu' };

export type CapEvent =
  | { readonly ev: 'fn'; readonly act: FnAct; readonly key?: string | null }
  /** the capsule window's state changed (src/main/capsule.ts) */
  | { readonly ev: 'window'; readonly shown: boolean; readonly why: 'asked' | 'tray' | 'blur' }
  /** bise's answer to what he said or typed started */
  | { readonly ev: 'answer' }
  /** bise pushes a card (a question or an approval while he's elsewhere) */
  | { readonly ev: 'card'; readonly id: string }
  /** the shown card was answered or put off */
  | { readonly ev: 'card_done'; readonly id: string }
  /** esc, a close, or an 'open in bise' that moved him to the window */
  | { readonly ev: 'close' };

export type Fx =
  | { readonly fx: 'show'; readonly at: 'top' | 'bottom' | 'menu'; readonly keys: boolean }
  | { readonly fx: 'hide' }
  | { readonly fx: 'open'; readonly route?: string };

export interface Step {
  readonly view: View;
  readonly fx: readonly Fx[];
}

export const NONE: View = { kind: 'none' };

const to = (view: View, ...fx: Fx[]): Step => ({ view, fx });
const stay = (view: View): Step => ({ view, fx: [] });
const close = (view: View): Step => (view.kind === 'none' ? stay(view) : to(NONE, { fx: 'hide' }));

export function step(view: View, e: CapEvent): Step {
  switch (e.ev) {
    case 'fn':
      switch (e.act) {
        case 'key':
          if (e.key === 'space') return view.kind === 'spot' ? close(view) : to({ kind: 'spot' }, { fx: 'show', at: 'top', keys: true });
          if (e.key === 'i') return to(NONE, ...(view.kind === 'none' ? [] : [{ fx: 'hide' } as const]), { fx: 'open', route: 'inbox' });
          return stay(view);
        case 'talk_start':
          return to({ kind: 'talk', phase: 'listen' }, { fx: 'show', at: 'bottom', keys: false });
        case 'talk_end':
          return view.kind === 'talk' ? stay({ kind: 'talk', phase: 'think' }) : stay(view);
        case 'cancel':
          return view.kind === 'talk' ? close(view) : stay(view);
        case 'esc':
          return close(view);
        case 'tap':
        case 'double':
          return stay(view);
      }
      return stay(view);
    case 'window':
      if (e.why === 'tray' && e.shown) return stay({ kind: 'menu' });
      if (!e.shown) return stay(NONE);
      return stay(view);
    case 'answer':
      return view.kind === 'talk' ? stay({ kind: 'answer' }) : stay(view);
    case 'card':
      return view.kind === 'none' ? to({ kind: 'card', id: e.id }, { fx: 'show', at: 'bottom', keys: false }) : stay(view);
    case 'card_done':
      return view.kind === 'card' && view.id === e.id ? close(view) : stay(view);
    case 'close':
      return close(view);
  }
}
