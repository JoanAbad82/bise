// His messages as paper planes (q-planes, his 'oui' bims m_27499; bims-lead m_27527): a send of his
// from this window is a typed fact the app already has, the store's pending row (cid, agent, at_ms),
// never the thread's text. Each new pending row of an agent of the office is one BimEvent message
// from { who: 'you' } (its mode: 'now' is a steer); the rows there when the office mounts are old
// news, no plane. A failed send is not a plane (it never left). Goes when bims-facts' hub/activity
// carries his sends from any client (bims-lead m_27665: one source). Owner: bims-wire.
import { useEffect, useRef } from 'react';
import { threadKey, useStore, type Pending } from '@/store';
import type { BimEvent } from './model';

/** The new sends among `rows` (cids not in `seen`, which it fills): their planes, t in seconds. Pure but for `seen`. */
export function planesOf(rows: readonly Pending[], seen: Set<number>): BimEvent[] {
  const out: BimEvent[] = [];
  for (const p of rows) {
    if (seen.has(p.cid)) continue;
    seen.add(p.cid);
    if (p.state === 'sending')
      out.push({
        kind: 'message',
        from: { who: 'you' },
        to: { who: 'agent', name: p.agent },
        mode: p.mode === 'queued' ? 'queued' : 'steer',
        expectsReply: false,
        t: p.at_ms / 1000,
      });
  }
  return out;
}

/** Calls `onPlane` for each message he sends to one of `names` of `project` while mounted. */
export function useHisSends(project: string, names: readonly string[], onPlane: (e: BimEvent) => void): void {
  const store = useStore();
  const seen = useRef(new Set<number>());
  const cb = useRef(onPlane);
  useEffect(() => {
    cb.current = onPlane;
  });
  const key = names.join('\n');
  useEffect(() => {
    if (project === '') return undefined;
    const offs = key.split('\n').filter((n) => n !== '').map((agent) => {
      const k = threadKey(project, agent);
      // what is pending now was sent before the office came: no plane for it
      planesOf(store.pending(k), seen.current);
      return store.subscribe(`pending:${k}`, () => {
        for (const e of planesOf(store.pending(k), seen.current)) cb.current(e);
      });
    });
    return () => {
      for (const off of offs) off();
    };
  }, [store, project, key]);
}
