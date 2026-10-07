// An agent's reply while it is written (the streaming draft, amb-core m_12358; his decision via
// main m_12381: streamed in the window, the spotlight and the capsule, at most every 250 ms).
// The hub's HubEv {ev:'partial', project, agent, call:'<call>.<attempt>', text} carries the WHOLE
// text so far of one model call: it replaces, never appends; a new call replaces the old one;
// text '' clears it (the entry landed, turn done, stop, error, retry). One reader for the
// thread (amb-win's live row), the spotlight and the capsule (amb-web).
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

/**
 * What a raw core event does to the live partial of `project`/`agent`: undefined when the event
 * is not about it, null when it clears it, else the new one (a new call starts a new at_ms).
 */
export function partialOf(prev: LivePartial | null, ev: Record<string, unknown>, project: string, agent: string, now: number): LivePartial | null | undefined {
  if (ev['ev'] !== 'partial' || ev['project'] !== project || ev['agent'] !== agent) return undefined;
  const call = ev['call'];
  const text = ev['text'];
  if (typeof call !== 'string' || typeof text !== 'string') return undefined;
  if (text === '') return null;
  return { call, text, at_ms: prev !== null && prev.call === call ? prev.at_ms : now };
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
  const [live, setLive] = useState<LivePartial | null>(null);
  const p = port === undefined ? windowPort() : port;
  useEffect(() => {
    setLive(null);
    if (p === null || project === null || agent === null) return;
    return followPartial(p, project, agent, setLive);
  }, [p, project, agent]);
  return live;
}
