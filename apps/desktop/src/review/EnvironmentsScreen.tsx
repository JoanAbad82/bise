// A project's environments (tui-parity W5; the TUI panel's worktree
// sections, sb/places.rs): where its agents work. A worktree two or more
// agents share is one section titled by its branch; an agent alone in one
// carries its branch; the shared checkout is 'the shared folder'. Its
// agents' dev servers under it. Owner: amb-win.
import { useEffect } from 'react';
import { Empty, Head, Row, SectionHead } from '@/ds';
import type { Agent, DevServer, Worktree } from '@/proto';
import { useAgents, useDevServers, useStore, useWorktrees } from '@/store';
import { useRouter } from '@/app/router';
import { dotOf } from '@/agents/model';
import { branchEnd } from './model';
import './review.css';

export interface Place {
  /** the worktree's path; '' the shared checkout */
  readonly path: string;
  readonly title: string;
  readonly worktree?: Worktree;
  readonly agents: readonly Agent[];
  readonly servers: readonly DevServer[];
}

/** Agents grouped by where they work, shared places first, then the shared checkout. Pure. */
export function placesOf(agents: readonly Agent[], worktrees: readonly Worktree[], servers: readonly DevServer[]): Place[] {
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
      servers: servers.filter((s) => names.has(s.agent)),
    };
  });
  return places.sort((a, b) => Number(a.path === '') - Number(b.path === '') || b.agents.length - a.agents.length || a.title.localeCompare(b.title));
}

export function EnvironmentsScreen({ project }: { project: string }) {
  const store = useStore();
  const router = useRouter();
  const agents = useAgents(project);
  const worktrees = useWorktrees(project);
  const servers = useDevServers(project);

  useEffect(() => {
    store.command({ cmd: 'worktrees', project });
    store.command({ cmd: 'dev_servers', project });
  }, [store, project]);

  const places = placesOf(agents, worktrees, servers);
  return (
    <section className="rv-screen" data-testid="environments.screen" data-project={project}>
      <Head title="environments" sub={`${String(places.length)} places · ${String(servers.filter((s) => s.up).length)} servers up`} />
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
                kind="ag"
                name={a.name}
                dot={dotOf(a.status)}
                end={a.branch ?? ''}
                onClick={() => {
                  router.go({ screen: 'thread', project, agent: a.name });
                }}
                testId={`environments.agent.${a.name}`}
              />
            ))}
            {p.servers.map((s) => (
              <Row
                key={`${s.agent}/${s.cmd}`}
                name={s.name ?? s.cmd}
                sub={s.cmd}
                dot={s.up ? 'ok' : 'off'}
                end={s.url ?? (s.port == null ? '' : `:${String(s.port)}`)}
                onClick={
                  s.url == null
                    ? undefined
                    : () => {
                        if (s.url != null) void (window as Partial<Window>).bise?.openExternal(s.url);
                      }
                }
                testId={`environments.server.${s.agent}`}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
