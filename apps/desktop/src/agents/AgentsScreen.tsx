// A project's agents (bar A.2-A.4): the live ones as the TUI's panel
// shows them (status, what it does, age, its last report), each opening
// its thread; stop and archive where the hub has a typed command; the
// archived ones on their own list (/archived) with restore; '+ new agent' (A.1) and each agent's
// '…' (rename, model, reasoning: A.5) through amb-feed's typed commands
// (actions.ts). Owner: amb-win.
import { memo, useState } from 'react';
import { Peek } from './Peek';
import { Act, Button, cx, Empty, Head, IconButton, Row } from '@/ds';
import type { Agent } from '@/proto';
import { useAgents, useStore } from '@/store';
import { useRouter } from '@/app/router';
import { useNow } from '@/app/clock';
import { keep, useKeptScroll } from '@/app/keep';
import { useListKeys } from '@/app/listkeys';
import { archivedEnd, archivedOf, dotOf, endOf, lineOf, liveOf } from './model';
import { NewAgentSheet, Tune } from './Tune';
import './agents.css';

/**
 * The row's keys beside the list keys (app/listkeys.ts: ↑↓ jk pgup pgdn home end, ⏎ opens; W6/K18):
 * space shows the selected agent's feed in place, space again closes it, esc closes it. The new
 * preview; null: not its key. Pure.
 */
export function peekKey(key: string, sel: string | null, peek: string | null): { peek: string | null } | null {
  if (key === ' ') return sel === null ? null : { peek: peek === sel ? null : sel };
  if (key === 'Escape') return peek === null ? null : { peek: null };
  return null;
}

/**
 * As the TUI (his try on a43609b2): /agents lists the live agents only, /archived (`archived`)
 * only the archived ones, each with restore. No archived row on the live list (designer's v6:
 * the archived ones are under /archived and the project's ⋯ menu).
 */
export function AgentsScreen({ project, projectName, archived: showArchived = false }: { project: string; projectName?: string; archived?: boolean }) {
  useKeptScroll(`agents:${project}${showArchived ? ':archived' : ''}`, () => document.querySelector<HTMLElement>('[data-testid="agents.screen"] .ag-body'));
  const agents = useAgents(project);
  const live = liveOf(agents);
  const archived = archivedOf(agents);
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
  const [peek, setPeek] = useState<string | null>(null);
  const shown = showArchived ? archived : live;
  // W6/K18: the list keys (app/listkeys.ts), space shows its feed in place, space again (or esc)
  // closes it; the selected row comes back after a reload, an update swap or a core restart (keep.ts: 10 minutes)
  const { sel, ref: section, onKeyDown } = useListKeys({
    order: shown.map((a) => a.name),
    keepAs: `agents.sel:${project}`,
    onOpen: (agent) => {
      router.go({ screen: 'thread', project, agent });
    },
    onKey: (e, at) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return false;
      const next = peekKey(e.key, at, peek);
      if (next === null) return false;
      setPeek(next.peek);
      return true;
    },
  });
  return (
    <section ref={section} tabIndex={-1} onKeyDown={onKeyDown} className="ag-screen" data-testid="agents.screen" data-project={project} data-archived={showArchived ? 'true' : undefined}>
      <Head
        title={showArchived ? 'archived' : 'agents'}
        sub={showArchived ? `${projectName ?? project} · ${archived.length} archived` : `${projectName ?? project} · ${live.length} live`}
        end={
          !showArchived && <Button
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
        {shown.length === 0 && <Empty title={showArchived ? 'no archived agent' : 'no agents yet'} />}
        {shown.map((a) => (
          <AgentItem key={a.name} project={project} a={a} sel={sel === a.name} peek={peek === a.name} />
        ))}
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
    <div className={sel ? 'ag-item is-sel' : 'ag-item'} data-row={a.name} data-testid={`agents.row.${id}`} data-status={a.status} data-sel={sel || undefined} aria-selected={sel}>
      {/* one row (designer m_19489): its sign, its name, then at its right its acts (shown on
          hover, on the ↑↓-selected row and with the focus in it; an archived one's restore always)
          and its end, so a row is one line high. bise's own row has no acts. */}
      <div className="ag-top">
        <Row
          kind={a.archived ? 'arch' : 'ag'}
          name={a.main ? 'bise' : a.name}
          dot={a.archived || a.status === 'done' ? undefined : dotOf(a.status)}
          // a finished one is a dim ✓, never green (designer m_19489: done lines are dim)
          {...(!a.archived && a.status === 'done' && a.waits === 0 && a.waiting_on == null ? { lead: <span className="app-sign dim" aria-label="done">✓</span> } : {})}
          // R9/S3: one that waits on someone starts with the sidebar's sign, not its status dot (designer m_14246)
          {...(!a.archived && a.waits === 0 && a.waiting_on?.who === 'agent' ? { lead: <span className="app-sign dim" aria-label="waiting">⋯</span> } : {})}
          // what waits on him (a card, or the hub's waiting_on him): the accent '?' in the dot's place, as the right bar
          {...(!a.archived && (a.waits > 0 || a.waiting_on?.who === 'you') ? { lead: <span className="app-sign acc" aria-label="asks you">?</span> } : {})}
          // an archived one keeps the sign's slot empty, so its name starts where the others' do
          {...(a.archived ? { lead: <span className="ag-slot" aria-hidden="true" /> } : {})}
          onClick={() => {
            router.go({ screen: 'thread', project, agent: a.name });
          }}
          testId={`agents.open.${id}`}
        />
        {a.archived ? (
          <span className="ag-ra is-on">
            <Act
              onClick={() => {
                store.command({ cmd: 'unarchive', project, agent: a.name });
              }}
              testId={`agents.restore.${id}`}
            >
              restore
            </Act>
          </span>
        ) : (
          !a.main && (
            <span className="ag-ra">
              {/* first: it comes and goes with the turn, and the acts are right-aligned, so it
                  never moves the ones after it (a click aimed at archive stays on archive when a
                  turn starts; qa-flows' app/clicks) */}
              {a.status === 'working' && (
                <Act
                  onClick={() => {
                    store.stop(project, a.name);
                  }}
                  testId={`agents.stop.${id}`}
                >
                  stop
                </Act>
              )}
              {a.branch != null && (
                <Act
                  onClick={() => {
                    router.go({ screen: 'review', project, agent: a.name });
                  }}
                  testId={`agents.review.${id}`}
                >
                  review
                </Act>
              )}
              <Act
                onClick={() => {
                  store.command({ cmd: 'archive', project, agent: a.name, force: a.status === 'working' });
                }}
                testId={`agents.archive.${id}`}
              >
                archive
              </Act>
              <IconButton
                size="row"
                label="rename, model, reasoning"
                pressed={tuning}
                onClick={() => {
                  setTuning((x) => !x);
                }}
                testId={`agents.more.${id}`}
              >
                ⋯
              </IconButton>
            </span>
          )
        )}
        <span className={cx('ag-end', !a.archived && end.needs && 'nd')} data-testid={`agents.end.${id}`}>
          {a.archived ? archivedEnd(a, now) : end.text}
        </span>
      </div>
      {/* one line each, full words on hover, and only when there are words: the acts sit on the
          row's own line now, so a line or a report that comes never moves them (qa-flows'
          app/clicks), and an agent with neither stays one line high (designer m_19489) */}
      {lineOf(a) !== '' && (
        <p className="ag-line" title={lineOf(a)}>
          {lineOf(a)}
        </p>
      )}
      {a.report != null && (
        <p className="ag-report" title={`${a.report.kind} · ${a.report.text}`} data-testid={`agents.report.${id}`}>
          {a.report.kind} · {a.report.text}
        </p>
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
