// The thread's live row: an agent's reply while it is written (amb-core's
// partial, read by amb-web's usePartialText, at most every 250 ms), drawn as
// the entry it becomes. Owner: amb-win.
//
// - it shows from the call's first partial, the whole text so far each time;
// - '' clears it, but the row stays with its last words until the next entry
//   lands (or 1 s: a stop or an error with no entry), so nothing collapses
//   between the clear and the entry;
// - the agent's own entry that lands after it takes its place in the same
//   row (the same React key: no unmount, no jump; text-appearing v2 (4)),
//   even when it lands before the clear (amb-core's belt);
// - any other entry (a tool, a notice) leaves it where it is: the hub clears
//   a call's text before its tool runs.
import { useEffect, useState } from 'react';
import type { Entry } from '@/proto';
import type { LivePartial } from '@/shared/partial';

export interface LiveState {
  readonly call: string;
  readonly text: string;
  readonly at_ms: number;
  /** the last entry's pos when the call began: an entry after it ends the row */
  readonly since: number;
  /** cleared ('') and waiting for its entry */
  readonly ending: boolean;
}

/** How long a cleared row waits for its entry. */
export const ENDING_MS = 1000;

/** The live state after the reader's value changed. Pure. */
export function liveNext(s: LiveState | null, p: LivePartial | null, lastPos: number): LiveState | null {
  if (p === null) return s === null || s.ending ? s : { ...s, ending: true };
  if (s !== null && s.call === p.call) return s.text === p.text && !s.ending ? s : { ...s, text: p.text, ending: false };
  return { call: p.call, text: p.text, at_ms: p.at_ms, since: lastPos, ending: false };
}

/**
 * What the row is now, given the thread's last entry: 'live' (drawn),
 * 'handed' (the agent's entry took its place: give that entry the row's
 * key), 'gone'. Pure.
 */
export function liveFate(s: LiveState | null, lastPos: number, lastKind: string | undefined): 'live' | 'handed' | 'gone' {
  if (s === null) return 'gone';
  if (lastPos <= s.since) return 'live';
  if (lastKind === 'agent') return 'handed';
  return s.ending ? 'gone' : 'live';
}

/** The row's React key: the entry that takes its place gets it too. */
export const liveKey = (call: string): string => `live:${call}`;

/** The fake entry the row draws (the entry it will be). Pure. */
export function liveEntry(s: LiveState): Entry {
  return { pos: -1, at_ms: s.at_ms, kind: 'agent', text: s.text };
}

/**
 * The live row of a thread: its entry while it shows, and the keys of the
 * entries that took its place (pos -> the row's React key).
 */
export function useLive(partial: LivePartial | null, lastPos: number, lastKind: string | undefined): { entry: Entry | null; call: string | null; handed: ReadonlyMap<number, string> } {
  const [seen, setSeen] = useState<LivePartial | null>(null);
  const [state, setState] = useState<LiveState | null>(null);
  const [handed, setHanded] = useState<ReadonlyMap<number, string>>(new Map());
  // React's "state from the previous render": no effect, no extra frame
  let s = state;
  if (partial !== seen) {
    setSeen(partial);
    s = liveNext(state, partial, lastPos);
    if (s !== state) setState(s);
  }
  const fate = liveFate(s, lastPos, lastKind);
  if (fate === 'handed' && s !== null && !handed.has(lastPos)) {
    setHanded(new Map(handed).set(lastPos, liveKey(s.call)));
    setState(null);
  } else if (fate === 'gone' && s !== null && lastPos > s.since) setState(null);
  // a cleared row with no entry: gone after ENDING_MS
  const ending = s?.ending === true;
  useEffect(() => {
    if (!ending) return;
    const t = window.setTimeout(() => {
      setState((x) => (x?.ending === true ? null : x));
    }, ENDING_MS);
    return () => {
      window.clearTimeout(t);
    };
  }, [ending]);
  return { entry: fate === 'live' && s !== null ? liveEntry(s) : null, call: fate === 'live' && s !== null ? s.call : null, handed };
}

/** The live row's key in the thread's list (never an entry's: those are 'e:<pos>'). */
export const LIVE = 'live';

function stillNow(): boolean {
  if (typeof document === 'undefined') return true;
  const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return reduced || !document.hasFocus();
}

/**
 * No fade now (text-appearing v2 (6)): reduced motion, or the window not in
 * front. The text still comes with each update; the ∿ is still.
 */
export function useStill(): boolean {
  const [still, setStill] = useState(stillNow);
  useEffect(() => {
    const again = () => {
      setStill(stillNow());
    };
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    window.addEventListener('focus', again);
    window.addEventListener('blur', again);
    mq?.addEventListener('change', again);
    return () => {
      window.removeEventListener('focus', again);
      window.removeEventListener('blur', again);
      mq?.removeEventListener('change', again);
    };
  }, []);
  return still;
}
