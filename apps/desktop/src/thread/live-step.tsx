// The step at work, drawn once (designer's desktop-working page v2 (4), his m_21668): the thread's
// last row while a turn runs is either the running command's tool row ('$ cmd   ∿ 15 s', mono,
// rows-tools.tsx) or, for the model's own words about a call (its tool_intent: 'lecture du PDF…'),
// the growing fold '▸ lecture du PDF…   ∿ 10 s' (sans). Never both: a live call with an intent is
// not drawn as a mono line. Owner: amb-home.
import { useEffect, useState } from 'react';
import { Fold } from '@/ds';
import type { Entry } from '@/proto';
import { useAgents, useEntry, useThreadOrder } from '@/store';
import { Pulse } from '@/working/Signs';

/** The call at work: its entry, its pos, since when, and the model's words for it ('' for a plain command). */
export interface LiveStep {
  entry: number;
  pos: number;
  at: number;
  intent: string;
}

/** The last call of the thread's last entry while its agent works; none otherwise. Pure. */
export function liveStepOf(working: boolean, e: Entry | undefined): LiveStep | undefined {
  const last = e?.tools?.items.at(-1);
  if (!working || e === undefined || last === undefined) return undefined;
  return { entry: e.pos, pos: last.pos, at: last.at_ms, intent: (last.intent ?? '').trim() };
}

/** liveStepOf for a thread in the store. */
export function useLiveStep(tkey: string, project: string, agent: string): LiveStep | undefined {
  const { order } = useThreadOrder(tkey);
  const e = useEntry(tkey, order.at(-1) ?? -1);
  const working = useAgents(project).some((a) => a.name === agent && a.status === 'working');
  return liveStepOf(working, e);
}

/** Milliseconds since `at`, ticking once a second while shown (the live step's '∿ 12 s'). */
export function useSecondsSince(at: number | undefined): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (at === undefined) return;
    const t = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(t);
    };
  }, [at]);
  return at === undefined ? 0 : Math.max(0, now - at);
}

/** The live step's time: '0 s', '12 s', '1 m 4 s'. Pure. */
export function liveTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${String(s)} s`;
  return `${String(Math.floor(s / 60))} m ${String(s % 60)} s`;
}

/**
 * What the fold says: the live call's intent; with no call at work yet, the hub's typing line
 * (the same tool_intent words, sent as they come). A running plain command: nothing (its tool row
 * carries the '∿'). The typing line shows as the hub sends it, even before the agents list says
 * working (the hub clears it when the turn ends); a call's intent only while it works. Pure.
 */
export function stepWords(working: boolean, live: LiveStep | undefined, typing: string): string {
  if (working && live !== undefined) return live.intent;
  return typing.trim();
}

/** The growing fold at the thread's end: '▸ lecture du PDF…   ∿ 10 s'. */
export function StepLine({ tkey, project, agent, working, typing }: { tkey: string; project: string; agent: string; working: boolean; typing: string }) {
  const live = useLiveStep(tkey, project, agent);
  const words = stepWords(working, live, typing);
  // since the call started; before its entry comes (a moment), the pulse alone
  const at = words === '' || live === undefined || live.at <= 0 ? undefined : live.at;
  const runFor = useSecondsSince(at);
  if (words === '') return null;
  return (
    <div className="th-typing th-step" data-testid="thread.typing" aria-live="polite">
      <Fold>{words}</Fold>
      <span className="th-step-end" data-testid="thread.typing.end">
        <Pulse kind="tool" testId="thread.typing.pulse" />
        {at !== undefined && <span aria-hidden="true"> {liveTime(runFor)}</span>}
      </span>
    </div>
  );
}
