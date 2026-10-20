// The working mark on the composer's label line (designer's desktop-working page v2 (2), his
// m_21668, the TUI's divider): '<to bise>' + 8 px + the 1-cell breath while the addressee works
// (one glyph at a time in a 1ch box, a still is one '∿': designer m_34075; the 5-cell gust read as
// stray characters in a shot), nothing else beside it; hover: 'bise is working · 40 s' (the turn's
// age). Starting: the '·' pulse in the same place. Idle, waiting on him, waiting for an event,
// paused: nothing. The motion (110 ms, the hush while he types, still under reduced motion or a
// window that isn't key) is the signs' own (working/gust.ts). Owner: amb-home.
import { useState } from 'react';
import { tipAttrs } from '@/ds';
import type { Agent } from '@/proto';
import { useAgents } from '@/store';
import { Breath, Pulse } from '@/working/Signs';
import { turnAge } from '@/working/gust';
import { workingRowShows } from './head';

/** The tooltip's words: '<name> is working · 40 s', the turn's age when known. Pure. */
export function markTip(name: string, a: Pick<Agent, 'turn_ms' | 'since_ms'>, now: number): string {
  const age = a.turn_ms != null ? turnAge(a.turn_ms) : a.since_ms > 0 ? turnAge(now - a.since_ms) : '';
  return age === '' ? `${name} is working` : `${name} is working · ${age}`;
}

/** The mark itself, or nothing; `starting`: the agent's empty thread says it is starting. */
export function LabelMark({ project, agent, name, starting }: { project: string; agent: string; name: string; starting: boolean }) {
  const a = useAgents(project).find((x) => x.name === agent);
  // the age is read when the pointer comes in, not ticked under a tooltip nobody sees; the app's
  // one tip layer draws the words (the ds tip, in body: the label line clips its overflow)
  const [at, setAt] = useState<number | null>(null);
  if (starting && a !== undefined && !a.archived) {
    return (
      <span className="th-mark" data-testid="thread.mark" data-state="starting" role="img" aria-label={`${name} is starting`}>
        <Pulse kind="starting" testId="thread.mark.pulse" />
      </span>
    );
  }
  if (a === undefined || !workingRowShows(a)) return null;
  return (
    <span
      className="th-mark"
      data-testid="thread.mark"
      data-state="working"
      role="img"
      aria-label={`${name} is working`}
      {...tipAttrs(at === null ? `${name} is working` : markTip(name, a, at))}
      onMouseEnter={() => {
        setAt(Date.now());
      }}
      onMouseLeave={() => {
        setAt(null);
      }}
    >
      <Breath testId="thread.mark.breath" />
    </span>
  );
}
