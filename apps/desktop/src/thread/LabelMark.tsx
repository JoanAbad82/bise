// The working mark on the composer's label line (designer's desktop-working page v2 (2), his
// m_21668, the TUI's divider): '<to bise>' + 8 px + the 5-cell gust while the addressee works,
// nothing else beside it; hover: 'bise is working · 40 s' (the turn's age). Starting: the '·'
// pulse in the same place. Idle, waiting on him, waiting for an event, paused: nothing. The motion
// (110 ms, half speed and a tone down while he types, still under reduced motion or a window that
// isn't key) is the signs' own (working/gust.ts). Owner: amb-home.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Agent } from '@/proto';
import { useAgents } from '@/store';
import { Gust, Pulse } from '@/working/Signs';
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
  // the age is read when the pointer comes in, not ticked under a tooltip nobody sees; the tip
  // goes in body, fixed over the gust (the label line clips its overflow)
  const [hover, setHover] = useState<{ at: number; x: number; y: number } | null>(null);
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
      onMouseEnter={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setHover({ at: Date.now(), x: r.left, y: r.top });
      }}
      onMouseLeave={() => {
        setHover(null);
      }}
    >
      <Gust testId="thread.mark.gust" />
      {hover !== null &&
        createPortal(
          <span className="th-mark-tip" role="tooltip" data-testid="thread.mark.tip" style={{ left: hover.x, top: hover.y }}>
            {markTip(name, a, hover.at)}
          </span>,
          document.body,
        )}
    </span>
  );
}
