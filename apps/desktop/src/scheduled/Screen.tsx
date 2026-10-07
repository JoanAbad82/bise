// The scheduled screen (desktop-screens v6, designer m_11837; sidebar row '◷ scheduled', route
// scheduled): what wakes his agents, and when. The list (what it asks | wakes | how often | next
// run) and one task in a 400 px pane at the right (under 1000 px it replaces the list, with
// '‹ scheduled'). x stops one after asking in place. Owner: amb-kit.
import { useState } from 'react';
import { Button } from '@/ds';
import { useStore } from '@/store';
import { useAllScheduled } from './hooks';
import { asks, bySoonest, endsWords, howOften, keyOf, nextRunWords, nextWords, runsWords, wakes, type Task } from './model';
import './scheduled.css';

export interface ScheduledPorts {
  /** stop a task (HubCmd scheduled_stop {project, id}) */
  stop: (project: string, id: number) => void;
  /** run it now (none: the hub has no typed command for it yet, the button is hidden) */
  runNow?: (project: string, id: number) => void;
}

/** The screen as the shell mounts it: every project's live tasks, the hub's commands through the store. */
export function ScheduledScreen() {
  const store = useStore();
  const tasks = useAllScheduled();
  return (
    <ScheduledView
      tasks={tasks}
      ports={{
        stop: (project, id) => {
          store.command({ cmd: 'scheduled_stop', project, id } as never);
        },
      }}
    />
  );
}

/** The screen from props (tests, shots). */
export function ScheduledView({ tasks, ports, now: pinned }: { tasks: readonly Task[]; ports: ScheduledPorts; now?: number }) {
  const [opened] = useState(() => Date.now());
  const now = pinned ?? opened;
  const list = bySoonest(tasks);
  const [sel, setSel] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const cur = list.find((x) => keyOf(x) === (open ?? '')) ?? null;
  const selKey = sel ?? (list[0] ? keyOf(list[0]) : null);
  const move = (d: number) => {
    const i = list.findIndex((x) => keyOf(x) === selKey);
    const next = list[Math.max(0, Math.min(list.length - 1, (i < 0 ? 0 : i) + d))];
    if (next) setSel(keyOf(next));
  };
  const stop = (x: Task) => {
    ports.stop(x.project, x.t.id);
    setAsking(false);
    setOpen(null);
  };
  return (
    <section
      className={`sch-screen${cur ? ' has-pane' : ''}`}
      data-testid="scheduled.screen"
      tabIndex={-1}
      onKeyDown={(e) => {
        const at = list.find((x) => keyOf(x) === selKey);
        if (asking && cur) {
          if (e.key === 'Enter' || e.key === 'y') stop(cur);
          else if (e.key === 'Escape' || e.key === 'n') setAsking(false);
          e.preventDefault();
          return;
        }
        if (e.key === 'ArrowDown') move(1);
        else if (e.key === 'ArrowUp') move(-1);
        else if (e.key === 'Enter' && at) setOpen(keyOf(at));
        else if (e.key === 'Escape' && cur) setOpen(null);
        else if (e.key === 'x' && (cur ?? at)) {
          if (!cur && at) setOpen(keyOf(at));
          setAsking(true);
        } else if (e.key === 'r' && ports.runNow && (cur ?? at)) {
          const x = cur ?? at;
          if (x) ports.runNow(x.project, x.t.id);
        } else return;
        e.preventDefault();
      }}
    >
      <div className="sch-main">
        <header className="sch-head">
          <div className="sch-h1">scheduled</div>
          <div className="sch-h2">what wakes your agents, and when</div>
          <span className="sch-count" data-testid="scheduled.count">{`active · ${String(list.length)}`}</span>
        </header>
        {list.length === 0 ? (
          <div className="sch-empty" data-testid="scheduled.empty">nothing scheduled. agents set them with sb every; tell one “check the build every 5m”.</div>
        ) : (
          <div className="sch-list" role="listbox" data-testid="scheduled.list">
            <div className="sch-row sch-cols" aria-hidden="true">
              <span>what it asks</span>
              <span>wakes</span>
              <span>how often</span>
              <span>next run</span>
            </div>
            {list.map((x) => (
              <div key={keyOf(x)} className={`sch-row${keyOf(x) === selKey ? ' on' : ''}${cur && keyOf(cur) === keyOf(x) ? ' open' : ''}`} role="option"
                aria-selected={keyOf(x) === selKey} data-testid={`scheduled.row.${String(x.t.id)}`}
                onClick={() => { setSel(keyOf(x)); setOpen(keyOf(x)); setAsking(false); }}>
                <span className="sch-asks">{asks(x.t)}</span>
                <span className="sch-dim">{wakes(x)}</span>
                <span className="sch-dim">{`${howOften(x.t)} · ${runsWords(x.t)}`}</span>
                <span className="sch-next">{nextWords(x.t, now)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="sch-keys" data-testid="scheduled.keys">
          <span><b>⏎</b> open</span>
          {ports.runNow && <span><b>r</b> run now</span>}
          <span><b>x</b> stop</span>
        </div>
      </div>
      {cur && (
        <aside className="sch-pane" data-testid="scheduled.pane">
          <Button kind="ghost" onClick={() => { setOpen(null); setAsking(false); }} testId="scheduled.back">‹ scheduled</Button>
          <div className="sch-k3">{`scheduled task #${String(cur.t.id)} · ${cur.t.agent}`}</div>
          <div className="sch-title" data-testid="scheduled.pane.title">{asks(cur.t)}</div>
          <div className="sch-label">the words it sends</div>
          <blockquote className="sch-quote" data-testid="scheduled.pane.words">{cur.t.words}</blockquote>
          <dl className="sch-kv">
            <dt>wakes</dt><dd>{wakes(cur)}</dd>
            <dt>set by</dt><dd>{cur.t.by}</dd>
            <dt>how often</dt><dd>{howOften(cur.t)}</dd>
            <dt>next run</dt><dd>{nextRunWords(cur.t, now)}</dd>
            <dt>it ends</dt><dd>{endsWords(cur.t, now)}</dd>
            {cur.t.page != null && cur.t.page !== '' && (<><dt>keeps fresh</dt><dd>{`↗ ${cur.t.page}`}</dd></>)}
          </dl>
          <div className="sch-label">its runs</div>
          <div className="sch-runs">{cur.t.done === 0 ? 'none yet' : runsWords(cur.t)}</div>
          {asking ? (
            <div className="sch-ask" role="group" data-testid="scheduled.ask">
              <span>{`stop this scheduled task? it won't wake ${cur.t.agent} again.`}</span>
              <span className="sch-acts">
                <Button kind="danger" onClick={() => { stop(cur); }} testId="scheduled.ask.stop">stop ⏎</Button>
                <Button kind="ghost" onClick={() => { setAsking(false); }} testId="scheduled.ask.keep">keep esc</Button>
              </span>
            </div>
          ) : (
            <div className="sch-acts">
              {ports.runNow && <Button kind="pri" onClick={() => { ports.runNow?.(cur.project, cur.t.id); }} testId="scheduled.run">run now R</Button>}
              <Button kind="danger" onClick={() => { setAsking(true); }} testId="scheduled.stop">stop X</Button>
            </div>
          )}
        </aside>
      )}
    </section>
  );
}
