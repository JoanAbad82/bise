// 'scheduled here' (desktop-screens v6, panel A's second block under the artifacts; amb-win
// m_12088): one project's live scheduled tasks, soonest first, two-line rows ('check the build' /
// 'deploy-watch · every 5m · 14:22'). A row opens the scheduled screen. No task: no block at all.
// amb-win's Panel.tsx mounts <ScheduledHere project onOpen />. Owner: amb-kit.
import { useState } from 'react';
import { useAllScheduled } from './hooks';
import { ahead, asks, bySoonest, howOften, keyOf } from './model';
import './scheduled.css';

export function ScheduledHere({ project, onOpen, testId = 'scheduled.here' }: { project: string; onOpen: () => void; testId?: string }) {
  const tasks = bySoonest(useAllScheduled(project));
  // the clock of 'next run': when the panel mounted (a render reads no clock)
  const [now] = useState(() => Date.now());
  if (tasks.length === 0) return null;
  return (
    <section className="sch-here" data-testid={testId} aria-label="scheduled here">
      <div className="sch-here-h">scheduled here</div>
      {tasks.map((x) => (
        <button key={keyOf(x)} type="button" className="sch-here-row" onClick={onOpen} data-testid={`${testId}.row.${String(x.t.id)}`}>
          <span className="sch-here-g" aria-hidden="true">◷</span>
          <span className="sch-here-two">
            <span className="sch-here-t">{asks(x.t)}</span>
            <span className="sch-here-sub">
              {`${x.t.agent} · ${howOften(x.t)}${typeof x.t.next_ms === 'number' ? ` · ${ahead(x.t.next_ms, now)}` : ''}`}
            </span>
          </span>
        </button>
      ))}
    </section>
  );
}
