// An agent's reply while it is written (the streaming draft, amb-core m_12358; his decision via
// main m_12381: streamed in the window, the spotlight and the capsule, at most every 250 ms).
// The hub's HubEv {ev:'partial', project, agent, call:'<call>.<attempt>', off, text} (R40, main
// 35509c3b) carries a DELTA: `text` goes at `off`, in UTF-16 code units (JS string indexes, as
// VoiceLit.said): the text keeps text[..off] and appends, so an event that comes twice changes
// nothing. off 0 starts again (a subscriber gets the whole text that way; an older hub without
// `off` sends whole texts, read as off 0); '' at 0 clears it (the entry landed, turn done, stop,
// error, retry). An off past the text, inside a surrogate pair, or another call's delta is a gap:
// it clears until the next off 0, never a guess. The fold is bise-proto's LiveText::apply.
// One reader for the thread (amb-win's live row), the spotlight and the capsule (amb-web).
//
// Read from the raw core port (window.bise.core.onEvent): the store narrows events to its known
// tags and 'partial' is not one yet. When amb-core's usePartial(threadKey(project, agent)) lands,
// this hook becomes a thin wrapper over it, with the same shape.

import { useEffect, useState } from 'react';
import type { CorePort } from './api';

/** One model call's text so far, and when its first partial arrived here (the live row's time). */
export interface LivePartial {
  readonly call: string;
  readonly text: string;
  readonly at_ms: number;
}

/** At most one update this often (his decision: a throttle; the core sends at most 4 a second). */
export const PARTIAL_EVERY_MS = 250;

/** `off` falls between the two halves of a surrogate pair in `s`. */
const splitsPair = (s: string, off: number): boolean => {
  if (off <= 0 || off >= s.length) return false;
  const hi = s.charCodeAt(off - 1);
  const lo = s.charCodeAt(off);
  return hi >= 0xd800 && hi <= 0xdbff && lo >= 0xdc00 && lo <= 0xdfff;
};

/**
 * What a raw core event does to the live partial of `project`/`agent`: undefined when the event
 * is not about it, null when it clears it (the end, or a gap), else the new one (a new call
 * starts a new at_ms). The delta fold of the header.
 */
export function partialOf(prev: LivePartial | null, ev: Record<string, unknown>, project: string, agent: string, now: number): LivePartial | null | undefined {
  if (ev['ev'] !== 'partial' || ev['project'] !== project || ev['agent'] !== agent) return undefined;
  const call = ev['call'];
  const text = ev['text'];
  const rawOff = ev['off'] ?? 0;
  if (typeof call !== 'string' || typeof text !== 'string' || typeof rawOff !== 'number' || !Number.isInteger(rawOff) || rawOff < 0) return undefined;
  const sameCall = prev !== null && prev.call === call;
  let kept: string;
  if (rawOff === 0) kept = '';
  else if (!sameCall || rawOff > prev.text.length || splitsPair(prev.text, rawOff)) return null;
  else kept = prev.text.slice(0, rawOff);
  const next = kept + text;
  if (next === '') return null;
  return { call, text: next, at_ms: sameCall ? prev.at_ms : now };
}

interface Clock {
  readonly now: () => number;
  readonly later: (fn: () => void, ms: number) => () => void;
}

const realClock: Clock = {
  now: () => Date.now(),
  later: (fn, ms) => {
    const t = setTimeout(fn, ms);
    return () => {
      clearTimeout(t);
    };
  },
};

/**
 * Follows one agent's partial on a port and calls `show` at most every PARTIAL_EVERY_MS: the
 * first update at once, then the newest one at the end of each window; a clear goes at once
 * (and drops a waiting update). Returns the unsubscribe.
 */
export function followPartial(port: Pick<CorePort, 'onEvent'>, project: string, agent: string, show: (p: LivePartial | null) => void, clock: Clock = realClock): () => void {
  let cur: LivePartial | null = null;
  let shownAt = -Infinity;
  let cancel: (() => void) | null = null;
  const flush = (): void => {
    cancel = null;
    shownAt = clock.now();
    show(cur);
  };
  const off = port.onEvent((ev) => {
    const next = partialOf(cur, ev, project, agent, clock.now());
    if (next === undefined) return;
    cur = next;
    if (next === null) {
      cancel?.();
      cancel = null;
      shownAt = -Infinity;
      show(null);
      return;
    }
    if (cancel !== null) return; // the waiting update will show the newest text
    const wait = shownAt + PARTIAL_EVERY_MS - clock.now();
    if (wait <= 0) flush();
    else cancel = clock.later(flush, wait);
  });
  return () => {
    cancel?.();
    off();
  };
}

const windowPort = (): Pick<CorePort, 'onEvent'> | null => (globalThis as { bise?: { core?: CorePort } }).bise?.core ?? null;

/**
 * The live partial of `agent` in `project` (null: none, or cleared), throttled to 250 ms. The
 * thread must be subscribed (the hub sends partials only to a thread's subscribers). `port`
 * defaults to window.bise.core (a test passes its own).
 */
export function usePartialText(project: string | null, agent: string | null, port?: Pick<CorePort, 'onEvent'> | null): LivePartial | null {
  // the partial with what it is of: another agent (or port) reads null until its own comes, as the
  // old setLive(null) in the effect did, without a second render (react-hooks/set-state-in-effect)
  const [live, setLive] = useState<{ readonly p: unknown; readonly project: string; readonly agent: string; readonly v: LivePartial | null } | null>(null);
  const p = port === undefined ? windowPort() : port;
  useEffect(() => {
    if (p === null || project === null || agent === null) return;
    return followPartial(p, project, agent, (v) => {
      setLive({ p, project, agent, v });
    });
  }, [p, project, agent]);
  return live !== null && live.p === p && live.project === project && live.agent === agent ? live.v : null;
}
