// A project's agents (bar A.2-A.4): the live ones as the TUI's panel
// shows them (status, what it does, age, its last report), each opening
// its thread; stop and archive where the hub has a typed command; the
// archived ones below with restore; '+ new agent' (A.1) and each agent's
// '…' (rename, model, reasoning: A.5) through amb-feed's typed commands
// (actions.ts). Owner: amb-win.
import { memo, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Peek } from './Peek';
import { Button, Empty, Head, Row, SectionHead } from '@/ds';
import type { Agent } from '@/proto';
import { useAgents, useStore } from '@/store';
import { useRouter } from '@/app/router';
import { useNow } from '@/app/clock';
import { keep, useKeptScroll } from '@/app/keep';
import { archivedOf, dotOf, endOf, lineOf, liveOf } from './model';
import { NewAgentSheet, Tune } from './Tune';
import './agents.css';

/** What a key does on the list (W6/K18): move the selection, preview it, open it. Pure. */
export function listKey(key: string, order: readonly string[], sel: string | null, peek: string | null): { sel: string | null; peek: string | null; open?: string } | null {
  const i = sel === null ? -1 : order.indexOf(sel);
  switch (key) {
    case 'ArrowDown':
      return { sel: order[Math.min(order.length - 1, i + 1)] ?? null, peek };
    case 'ArrowUp':
      return { sel: order[Math.max(0, i - 1)] ?? null, peek };
    case ' ':
      if (sel === null || i < 0) return null;
      return { sel, peek: peek === sel ? null : sel };
    case 'Escape':
      return peek === null ? null : { sel, peek: null };
    case 'Enter':
      return sel === null || i < 0 ? null : { sel, peek, open: sel };
    default:
      return null;
  }
}

export function AgentsScreen({ project, projectName }: { project: string; projectName?: string }) {
  useKeptScroll(`agents:${project}`, () => document.querySelector<HTMLElement>('[data-testid="agents.screen"] .ag-body'));
  const agents = useAgents(project);
  const live = liveOf(agents);
  const archived = archivedOf(agents);
  const [showArchived, setShowArchived] = useState(false);
  // the new-agent sheet stays open across a reload (keep.ts: an open panel, no age)
  const addKey = `new.open:${project}`;
  const [adding, setAddingState] = useState(() => keep.view(addKey) === true);
  const setAdding = (f: boolean | ((x: boolean) => boolean)) => {
    setAddingState((x) => {
      const on = typeof f === 'function' ? f(x) : f;
      keep.setView(addKey, on ? true : undefined);
      return on;
    });
  };
  const router = useRouter();
  // W6/K18: ↑↓ select an agent, space shows its feed in place, space again (or esc) closes it
  // the selected row comes back after a reload, an update swap or a core restart (keep.ts: 10 minutes)
  const selKey = `agents.sel:${project}`;
  const [sel, setSelState] = useState<string | null>(() => {
    const k = keep.view(selKey);
    return typeof k === 'string' ? k : null;
  });
  const setSel = (name: string | null) => {
    keep.setView(selKey, name ?? undefined, true);
    setSelState(name);
  };
  const [peek, setPeek] = useState<string | null>(null);
  const order = [...live, ...(showArchived ? archived : [])].map((a) => a.name);
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    // the list takes the keys when nothing else has the focus
    if (document.activeElement === null || document.activeElement === document.body) section.current?.focus();
  }, []);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement;
    if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t.isContentEditable || (t !== section.current && t.closest('button') !== null)) return;
    const next = listKey(e.key, order, sel, peek);
    if (next === null) return;
    e.preventDefault();
    setSel(next.sel);
    setPeek(next.peek);
    if (next.open !== undefined) router.go({ screen: 'thread', project, agent: next.open });
  };
  return (
    <section ref={section} tabIndex={-1} onKeyDown={onKeyDown} className="ag-screen" data-testid="agents.screen" data-project={project}>
      <Head
        title="agents"
        sub={`${projectName ?? project} · ${live.length} live`}
        end={
          <Button
            kind="ghost"
            onClick={() => {
              setAdding((x) => !x);
            }}
            testId="agents.new"
          >
            + new agent
          </Button>
        }
      />
      <div className="ag-body">
        {adding && (
          <NewAgentSheet
            project={project}
            onDone={() => {
              setAdding(false);
            }}
          />
        )}
        {live.length === 0 && <Empty title="no agents yet" />}
        {live.map((a) => (
          <AgentItem key={a.name} project={project} a={a} sel={sel === a.name} peek={peek === a.name} />
        ))}
        {archived.length > 0 && (
          <>
            <SectionHead>
              <span
                role="button"
                tabIndex={0}
                onClick={() => {
                  setShowArchived((x) => !x);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setShowArchived((x) => !x);
                }}
                data-testid="agents.archived"
              >
                {showArchived ? '▾' : '▸'} archived · {archived.length}
              </span>
            </SectionHead>
            {showArchived && archived.map((a) => <AgentItem key={a.name} project={project} a={a} sel={sel === a.name} peek={peek === a.name} />)}
          </>
        )}
      </div>
    </section>
  );
}

const AgentItem = memo(function AgentItem({ project, a, sel, peek }: { project: string; a: Agent; sel: boolean; peek: boolean }) {
  const store = useStore();
  const router = useRouter();
  const now = useNow();
  const end = endOf(a, now);
  const id = a.name;
  // its tune panel stays open across a reload (keep.ts: an open panel, no age)
  const tuneKey = `tune.open:${project}/${a.name}`;
  const [tuning, setTuningState] = useState(() => keep.view(tuneKey) === true);
  const setTuning = (f: boolean | ((x: boolean) => boolean)) => {
    setTuningState((x) => {
      const on = typeof f === 'function' ? f(x) : f;
      keep.setView(tuneKey, on ? true : undefined);
      return on;
    });
  };
  return (
    <div className={sel ? 'ag-item is-sel' : 'ag-item'} data-testid={`agents.row.${id}`} data-status={a.status} data-sel={sel || undefined} aria-selected={sel}>
      <Row
        kind={a.archived ? 'arch' : 'ag'}
        name={a.main ? 'bise' : a.name}
        dot={a.archived ? undefined : dotOf(a.status)}
        // R9/S3: one that waits on someone starts with the sidebar's sign, not its status dot (designer m_14246)
        {...(!a.archived && a.waits === 0 && a.waiting_on?.who === 'agent' ? { lead: <span className="app-sign dim" aria-label="waiting">⋯</span> } : {})}
        {...(!a.archived && a.waits === 0 && a.waiting_on?.who === 'you' ? { lead: <span className="app-sign acc" aria-label="asks you">?</span> } : {})}
        end={end.text}
        needs={end.needs}
        onClick={() => {
          router.go({ screen: 'thread', project, agent: a.name });
        }}
        testId={`agents.open.${id}`}
      />
      {/* one line each, full words on hover, and the report's line always there (empty until one
          comes): words that come or change never move the buttons under them (qa-flows' app/clicks:
          a report arriving mid-click put the click on its words) */}
      <p className="ag-line" title={lineOf(a)}>
        {lineOf(a)}
      </p>
      {a.report != null ? (
        <p className="ag-report" title={`${a.report.kind} · ${a.report.text}`} data-testid={`agents.report.${id}`}>
          {a.report.kind} · {a.report.text}
        </p>
      ) : (
        !a.main && !a.archived && <p className="ag-report" aria-hidden="true" />
      )}
      {!a.main && (
        <div className="ag-acts">
          {a.archived ? (
            <Button
              kind="ghost"
              onClick={() => {
                store.command({ cmd: 'unarchive', project, agent: a.name });
              }}
              testId={`agents.restore.${id}`}
            >
              restore
            </Button>
          ) : (
            <>
              <Button
                kind="ghost"
                onClick={() => {
                  store.command({ cmd: 'archive', project, agent: a.name, force: a.status === 'working' });
                }}
                testId={`agents.archive.${id}`}
              >
                archive
              </Button>
              <Button
                kind="ghost"
                title="rename, model, reasoning"
                onClick={() => {
                  setTuning((x) => !x);
                }}
                testId={`agents.more.${id}`}
              >
                …
              </Button>
              {a.branch != null && (
                <Button
                  kind="ghost"
                  onClick={() => {
                    router.go({ screen: 'review', project, agent: a.name });
                  }}
                  testId={`agents.review.${id}`}
                >
                  review
                </Button>
              )}
              {/* last: it comes and goes with the turn, and never moves the buttons before it (a click
                  aimed at archive stays on archive when it starts; qa-flows' app/clicks) */}
              {a.status === 'working' && (
                <Button
                  kind="ghost"
                  onClick={() => {
                    store.stop(project, a.name);
                  }}
                  testId={`agents.stop.${id}`}
                >
                  stop
                </Button>
              )}
            </>
          )}
        </div>
      )}
      {a.main && !a.archived && (
        <div className="ag-acts">
          <Button
            kind="ghost"
            title="model, reasoning"
            onClick={() => {
              setTuning((x) => !x);
            }}
            testId={`agents.more.${id}`}
          >
            …
          </Button>
        </div>
      )}
      {peek && <Peek project={project} agent={a.name} />}
      {tuning && !a.archived && (
        <Tune
          key={a.name}
          project={project}
          a={a}
          onRenamed={() => {
            setTuning(false);
          }}
        />
      )}
    </div>
  );
});
