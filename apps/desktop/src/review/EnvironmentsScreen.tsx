// A project's environments (bise fait mac, page native-mac §9; tui-parity W5, the TUI panel's worktree
// sections, sb/places.rs): where its agents work. Under the window's bar its banner (ds PageBanner:
// 'Environments', its sentence, how many places and servers up, the signed vignette), then one ds
// GroupLabel per place: a worktree two or more agents share is titled by its branch, an agent alone
// in one carries its branch, the shared checkout is 'the shared folder'; under it one ds ListRow per
// agent (its thread) and per server its agents left running (its output on the processes page). Each
// row's '…' and right click are its menu (useEntityMenu). The floating composer's room at the foot
// (--float-room). Owner: nm-pages-b (amb-win's before).
import { useEffect } from 'react';
import { AppIcon, Empty, GroupLabel, ListRow, MoreButton, PageBanner, tipAttrs } from '@/ds';
import { hero } from '@/proto/words_hero.gen';
import { pages } from '@/proto/words_pages.gen';
import type { Agent, Worktree } from '@/proto';
import { useAgents, useProcesses, useStore, useWorktrees } from '@/store';
import { isRunning, markOf, stateOf, urlWords, type Proc } from '@/running/model';
import { PageVignette, useBannerGutter } from '@/artifacts/hero/vignettes';
import { useRouter } from '@/app/router';
import { useEntityMenu } from '@/app/menus/use';
import { StateMark } from '@/agents/AgentsScreen';
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
      title: path === '' ? pages.shared_folder : (wt?.branch ?? as[0]?.branch ?? path),
      ...(wt ? { worktree: wt } : {}),
      agents: as,
      procs: procs.filter((p) => isRunning(p) && names.has(p.agent)),
    };
  });
  return places.sort((a, b) => Number(a.path === '') - Number(b.path === '') || b.agents.length - a.agents.length || a.title.localeCompare(b.title));
}

export function EnvironmentsScreen({ project }: { project: string }) {
  useKeptScroll(`environments:${project}`, () => document.querySelector<HTMLElement>('[data-testid="environments.scroll"]'));
  const store = useStore();
  const gutter = useBannerGutter();
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
      <div className="rv-scroll" data-testid="environments.scroll">
        <PageBanner title={hero.environments_title} sentence={hero.environments_say}
          facts={`${hero.places_n({ n: places.length })} · ${hero.servers_up({ n: listening })}`}
          visual={<PageVignette page="environments" />} icon="place" gutter={gutter} testId="environments.lead" />
        <div className="rv-col">
          {places.length === 0 && <Empty testId="environments.empty" title={pages.no_places} />}
          {places.map((p, i) => (
            <div key={p.path} role="group" aria-label={p.title} data-testid={`environments.place.${String(i)}`}>
              <GroupLabel>{p.worktree ? `${p.title} · ${branchEnd(p.worktree)}` : p.title}</GroupLabel>
              {p.agents.map((a) => <AgentRow key={a.name} project={project} a={a} />)}
              {p.procs.map((s) => <ServerRow key={`${s.agent}/${s.id}`} project={project} s={s} />)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** One agent of a place: its status dot, its name, its branch (mono); a click opens its thread. */
function AgentRow({ project, a }: { project: string; a: Agent }) {
  const router = useRouter();
  const menu = useEntityMenu({ kind: 'agent', project, agent: a.name });
  const tid = `environments.agent.${a.name}`;
  return (
    <ListRow testId={tid} state={<StateMark a={a} />}
      title={a.main ? 'bise' : a.name}
      {...(a.branch == null || a.branch === '' ? {} : { sub: <span className="rv-mono">{a.branch}</span> })}
      onContextMenu={menu.onContextMenu}
      end={<MoreButton menu={menu} testId={`${tid}.more`} />}
      onClick={() => {
        router.go({ screen: 'thread', project, agent: a.name });
      }} />
  );
}

/** One server an agent left running: its name, then its command and its address; a click shows its output. */
function ServerRow({ project, s }: { project: string; s: Proc }) {
  const router = useRouter();
  const menu = useEntityMenu({ kind: 'process', project, agent: s.agent, id: s.id });
  const st = stateOf(s);
  const u = urlWords(s, st);
  const tid = `environments.server.${s.agent}.${s.id}`;
  return (
    // the processes page's marks (designer m_43401): '∿' in text-3 while it runs, no green dot; its
    // address with the 'open' line icon, never a text arrow
    <ListRow testId={tid} tip={s.cmd} state={<span className="rv-wave" {...tipAttrs(pages.server_up)}>{markOf(st).glyph}</span>}
      title={s.name ?? s.cmd}
      sub={<><span className="rv-mono">{s.cmd}</span>{u !== null && <span className="rv-url">{' · '}<span className="rv-mono">{u.row}</span><AppIcon name="open" size={14} /></span>}</>}
      onContextMenu={menu.onContextMenu}
      end={<MoreButton menu={menu} testId={`${tid}.more`} />}
      onClick={() => {
        // its output on the processes page; its address is in its menu
        router.go({ screen: 'running', open: { project, agent: s.agent, id: s.id } });
      }} />
  );
}
