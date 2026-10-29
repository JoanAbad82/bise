// What happened between two snapshots, for the office (q-planes / q-data, bims-lead m_27748): the
// hub's one-shot hub/activity event (bims-facts, 8d598a695), read through the store's onEvent like
// job_end, never replayed, mapped here in one place into the timeline's BimEvent. A message keeps
// its parties when they are you or an agent (bise, github, unknown draw nothing), its mode and
// expects_reply; a report goes to main's desk; anything else is nothing. Only the project shown.
// Time is the office's clock (seconds). The one source of his paper planes, from any client.
// Owner: bims-wire.
import { useCallback, useEffect, useRef } from 'react';
import { useCoreEvent, type Ev } from '@/store';
import type { Party as HubParty } from '@/proto';
import type { BimEvent, Party } from './model';

const party = (p: HubParty): Party | null => (p.who === 'you' ? { who: 'you' } : p.who === 'agent' ? { who: 'agent', name: p.name } : null);

/** The office's event for one store event of `project`, or null. Pure. */
export function bimEventOf(ev: Ev, project: string): BimEvent | null {
  if (ev.ev !== 'activity' || ev.project !== project) return null;
  const it = ev.item;
  if (it.kind === 'message') {
    const from = party(it.from);
    const to = party(it.to);
    if (from === null || to === null) return null;
    return { kind: 'message', from, to, mode: it.mode, expectsReply: it.expects_reply, t: it.at_ms / 1000 };
  }
  if (it.kind === 'report') return { kind: 'report', agent: it.agent, report: it.report, t: it.at_ms / 1000 };
  return null;
}

/** Calls `on` for each office event of `project` while mounted. */
export function useOfficeEvents(project: string, on: (e: BimEvent) => void): void {
  const cb = useRef(on);
  useEffect(() => {
    cb.current = on;
  });
  useCoreEvent(
    useCallback(
      (ev: Ev) => {
        const e = bimEventOf(ev, project);
        if (e !== null) cb.current(e);
      },
      [project],
    ),
  );
}
