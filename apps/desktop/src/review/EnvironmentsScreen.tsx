// A project's environments (tui-parity W5; the TUI panel's worktree
// sections, sb/places.rs): where its agents work. A worktree two or more
// agents share is one section titled by its branch; an agent alone in one
// carries its branch; the shared checkout is 'the shared folder'. What its
// agents left running under it (the hub's processes rows, running ones).
// Owner: amb-win.
import { useEffect } from 'react';
import { Empty, Head, Row, SectionHead } from '@/ds';
import type { Agent, Worktree } from '@/proto';
import { useAgents, useProcesses, useStore, useWorktrees } from '@/store';
import { isRunning, stateOf, urlWords, type Proc } from '@/running/model';
import { useRouter } from '@/app/router';
import { dotOf } from '@/agents/model';
import { branchEnd } from './model';
import './review.css';
import { useKeptScroll } from '@/app/keep';

export interface Place {
  /** the worktree's path; '' the shared checkout */
  readonly path: string;
  readonly title: string;
  readonly worktree?: Worktree;
  readonly agents: readonly Agent[];
  /** what its agents left running */
  readonly procs: readonly Proc[];
}

/** Agents grouped by where they work, shared places first, then the shared checkout; their running processes under them. Pure. */
export function placesOf(agents: readonly Agent[], worktrees: readonly Worktree[], procs: readonly Proc[]): Place[] {
  const live = agents.filter((a) => !a.archived);
  const byPath = new Map<string, Agent[]>();
  for (const a of live) {
    const p = a.worktree ?? '';
    byPath.set(p, [...(byPath.get(p) ?? []), a]);
  }
  const places: Place[] = [...byPath.entries()].map(([path, as]) => {
    const wt = worktrees.find((w) => w.path === path);
    const names = new Set(as.map((a) => a.name));
    return {
      path,
      title: path === '' ? 'the shared folder' : (wt?.branch ?? as[0]?.branch ?? path),
      ...(wt ? { worktree: wt } : {}),
      agents: as,
      procs: procs.filter((p) => isRunning(p) && names.has(p.agent)),
    };
  });
  return places.sort((a, b) => Number(a.path === '') - Number(b.path === '') || b.agents.length - a.agents.length || a.title.localeCompare(b.title));
}

export function EnvironmentsScreen({ project }: { project: string }) {
  useKeptScroll(`environments:${project}`, () => document.querySelector<HTMLElement>('[data-testid="environments.screen"] .rv-body'));
  const store = useStore();
  const router = useRouter();
  const agents = useAgents(project);
  const worktrees = useWorktrees(project);
  const procs = useProcesses(project);

  useEffect(() => {
    store.command({ cmd: 'worktrees', project });
    store.command({ cmd: 'processes', project });
  }, [store, project]);

  const places = placesOf(agents, worktrees, procs);
  const listening = procs.filter((p) => isRunning(p) && (p.ports?.length ?? 0) > 0).length;
  return (
    <section className="rv-screen" data-testid="environments.screen" data-project={project}>
      <Head title="environments" sub={`${String(places.length)} places · ${String(listening)} servers up`} />
      <div className="rv-body">
        {places.length === 0 && <Empty title="no agents at work here" />}
        {places.map((p, i) => (
          <div key={p.path} data-testid={`environments.place.${String(i)}`}>
            <SectionHead>
              {p.title}
              {p.worktree ? ` · ${branchEnd(p.worktree)}` : ''}
            </SectionHead>
            {p.agents.map((a) => (
              <Row
                key={a.name}
                // a place's agents and servers are siblings: one edge, each its sign slot (designer m_21379 (2))
                name={a.name}
                dot={dotOf(a.status)}
                end={a.branch == null || a.branch === '' ? '' : <span className="rv-mono">{a.branch}</span>}
                onClick={() => {
                  router.go({ screen: 'thread', project, agent: a.name });
                }}
                testId={`environments.agent.${a.name}`}
              />
            ))}
            {p.procs.map((s) => {
              const u = urlWords(s, stateOf(s));
              return (
                <Row
                  key={`${s.agent}/${s.id}`}
                  name={s.name ?? s.cmd}
                  sub={s.cmd}
                  dot="ok"
                  end={u === null ? '' : <span className="rv-mono">{u.label}</span>}
                  onClick={() => {
                    // its output on the running screen; its address is the end's
                    router.go({ screen: 'running', open: { project, agent: s.agent, id: s.id } });
                  }}
                  testId={`environments.server.${s.agent}.${s.id}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
