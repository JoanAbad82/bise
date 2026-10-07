// A project's agents (bar A.2-A.4): the live ones as the TUI's panel
// shows them (status, what it does, age, its last report), each opening
// its thread; stop and archive where the hub has a typed command; the
// archived ones below with restore; '+ new agent' (A.1) and each agent's
// '…' (rename, model, reasoning: A.5) through amb-feed's typed commands
// (actions.ts). Owner: amb-win.
import { memo, useState } from 'react';
import { Button, Empty, Head, Row, SectionHead } from '@/ds';
import type { Agent } from '@/proto';
import { useAgents, useStore } from '@/store';
import { useRouter } from '@/app/router';
import { useNow } from '@/app/clock';
import { archivedOf, dotOf, endOf, lineOf, liveOf } from './model';
import { NewAgentSheet, Tune } from './Tune';
import './agents.css';

export function AgentsScreen({ project, projectName }: { project: string; projectName?: string }) {
  const agents = useAgents(project);
  const live = liveOf(agents);
  const archived = archivedOf(agents);
  const [showArchived, setShowArchived] = useState(false);
  const [adding, setAdding] = useState(false);
  return (
    <section className="ag-screen" data-testid="agents.screen" data-project={project}>
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
          <AgentItem key={a.name} project={project} a={a} />
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
            {showArchived && archived.map((a) => <AgentItem key={a.name} project={project} a={a} />)}
          </>
        )}
      </div>
    </section>
  );
}

const AgentItem = memo(function AgentItem({ project, a }: { project: string; a: Agent }) {
  const store = useStore();
  const router = useRouter();
  const now = useNow();
  const end = endOf(a, now);
  const id = a.name;
  const [tuning, setTuning] = useState(false);
  return (
    <div className="ag-item" data-testid={`agents.row.${id}`} data-status={a.status}>
      <Row
        kind={a.archived ? 'arch' : 'ag'}
        name={a.main ? 'main' : a.name}
        dot={a.archived ? undefined : dotOf(a.status)}
        end={end.text}
        needs={end.needs}
        onClick={() => {
          router.go({ screen: 'thread', project, agent: a.name });
        }}
        testId={`agents.open.${id}`}
      />
      <p className="ag-line">{lineOf(a)}</p>
      {a.report != null && (
        <p className="ag-report" data-testid={`agents.report.${id}`}>
          {a.report.kind} · {a.report.text}
        </p>
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
