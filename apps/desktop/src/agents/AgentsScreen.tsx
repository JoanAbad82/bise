// A project's agents (bar A.2-A.4): the live ones as the TUI's panel
// shows them (status, what it does, age, its last report), each opening
// its thread; stop and archive where the hub has a typed command; the
// archived ones below with restore. Owner: amb-win. Starting an agent,
// rename, isolate and per-agent model wait on typed commands (amb-core):
// shown greyed as 'not yet', never a silent gap.
import { memo, useState } from 'react';
import { Button, Empty, Head, Row, SectionHead } from '@/ds';
import type { Agent } from '@/proto';
import { useAgents, useStore } from '@/store';
import { useRouter } from '@/app/router';
import { useNow } from '@/app/clock';
import { archivedOf, dotOf, endOf, lineOf, liveOf } from './model';
import './agents.css';

export function AgentsScreen({ project, projectName }: { project: string; projectName?: string }) {
  const agents = useAgents(project);
  const live = liveOf(agents);
  const archived = archivedOf(agents);
  const [showArchived, setShowArchived] = useState(false);
  return (
    <section className="ag-screen" data-testid="agents.screen" data-project={project}>
      <Head
        title="agents"
        sub={`${projectName ?? project} · ${live.length} live`}
        end={
          <Button kind="ghost" disabled title="not yet: a typed /new comes with amb-core" testId="agents.new">
            + new agent
          </Button>
        }
      />
      <div className="ag-body">
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
    </div>
  );
});
