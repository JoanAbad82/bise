// The sidebar (designer's desktop-screens v6/v7, signed): 'search or jump
// ⌘K', bise, '↗ artifacts' and '◷ scheduled' for every project at once,
// then his projects, each with its pearl (its bise: a click opens 'bise ·
// storefront') and its agents, one sign each in a mono column (side.ts),
// never a 'main' row; done agents quiet for an hour fold into 'n more
// today'; the archived ones are in the project's ⋯ menu; '+ add a project'
// and settings at the foot. Owner: amb-win.
//
// It reads only projects, the route, the agents of each open folder and
// counts (numbers, so a snapshot never changes for nothing): a thread's
// entries never re-render it.
import { Fragment, memo, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Dot, Menu, MenuItem, MenuSep, Pearl, SectionHead, Side } from '@/ds';
import type { Agent, Feature, ProjectRow } from '@/proto';
import { useAgents, useFeatures, useHubRefused, useProjects, useStore, type Store } from '@/store';
import { RefusedLine } from './Refused';
import { groupsOf } from '@/review/feature';
import { archivedOf, liveOf } from '@/agents/model';
import { MAIN, projectOf, type Route } from './route';
import { useRoute, useRouter } from './router';
import { useNow } from './clock';
import { Tip } from '@/setup';
import { useTour } from '@/setup/useTour';
import { Hint, hintUsed, useHint } from './hints';
import { folds, moreWords, projectSide, signOf } from './side';
import { useKeptScroll } from './keep';
import { BisePearl } from './BisePearl';

/** His projects in his order, bise's own out (it is the bise row). Pure. */
export function projectsOf(rows: readonly ProjectRow[]): ProjectRow[] {
  return rows.filter((p) => !p.home).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/** What waits on him across every project: bise's pink count, the narrow titlebar's 'n waiting'. */
export function useWaitingTotal(): number {
  return useProjects().reduce((n, p) => n + p.waits, 0);
}

/** A number summed over projects' store slices, re-read when one of them changes. */
function useSum(prefix: string, ids: string, count: (store: Store, project: string) => number): number {
  const store = useStore();
  return useSyncExternalStore(
    (cb) => {
      const offs = ids === '' ? [] : ids.split('\n').map((p) => store.subscribe(`${prefix}:${p}`, cb));
      return () => {
        for (const off of offs) off();
      };
    },
    () => (ids === '' ? 0 : ids.split('\n').reduce((n, p) => n + count(store, p), 0)),
  );
}

/** Who made the new artifacts across these projects, in a stable order. */
function useNewMakers(ids: string): string[] {
  const store = useStore();
  const names = useSyncExternalStore(
    (cb) => {
      const offs = ids === '' ? [] : ids.split('\n').map((p) => store.subscribe(`artifacts:${p}`, cb));
      return () => {
        for (const off of offs) off();
      };
    },
    () => {
      const who = new Set<string>();
      for (const p of ids === '' ? [] : ids.split('\n')) for (const a of store.artifacts(p)) if (a.new && a.agent !== '') who.add(a.agent);
      return [...who].sort().join('\n');
    },
  );
  return useMemo(() => (names === '' ? [] : names.split('\n')), [names]);
}

/** The artifacts row's end: '1 new · designer' when one agent made them, else '3 new'; '' when none is new. Pure. */
export function newWords(fresh: number, makers: readonly string[]): string {
  if (fresh <= 0) return '';
  return makers.length === 1 ? `${String(fresh)} new · ${makers[0] ?? ''}` : `${String(fresh)} new`;
}

/** Each agent's next wake in a project (its scheduled tasks' soonest run), as 'agent ms' lines. */
function useWakes(project: string): ReadonlyMap<string, number> {
  const store = useStore();
  const lines = useSyncExternalStore(
    (cb) => store.subscribe(`scheduled:${project}`, cb),
    () => {
      const soonest = new Map<string, number>();
      for (const t of store.scheduled(project)) {
        if (t.next_ms == null) continue;
        const was = soonest.get(t.agent);
        if (was === undefined || t.next_ms < was) soonest.set(t.agent, t.next_ms);
      }
      return [...soonest].map(([a, ms]) => `${a} ${String(ms)}`).join('\n');
    },
  );
  return useMemo(() => new Map(lines === '' ? [] : lines.split('\n').map((l) => [l.slice(0, l.lastIndexOf(' ')), Number(l.slice(l.lastIndexOf(' ') + 1))] as const)), [lines]);
}

/** One sidebar row: a lead (pearl or sign), the name, its end words, his pink count. */
function SRow({ kind, lead, name, end, endErr, count, on, title, onClick, testId, children }: {
  kind: 'top' | 'pj' | 'ag' | 'more' | 'ft';
  lead: ReactNode;
  name: ReactNode;
  end?: ReactNode;
  endErr?: boolean;
  count?: number;
  on?: boolean;
  title?: string;
  onClick?: () => void;
  testId?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`b-row app-r ${kind}${on === true ? ' on' : ''}`} role="button" tabIndex={-1} aria-current={on === true || undefined} title={title}
      onClick={onClick} data-testid={testId}>
      <span className="app-g">{lead}</span>
      <span className="nm">{name}</span>
      {children}
      {end != null && end !== '' && <span className={endErr === true ? 'app-m err' : 'app-m'}>{end}</span>}
      {count !== undefined && count > 0 && <span className="app-cnt">{count}</span>}
    </div>
  );
}

/** A project's pearl, still (one live pearl per window is bise's own; a dozen would cost the GPU). */
function StillPearl({ pink }: { pink?: boolean }) {
  return (
    <Pearl size={14}>
      <i className={pink === true ? 'app-pearl pk' : 'app-pearl'} />
    </Pearl>
  );
}

export function Sidebar({ onSearch }: { onSearch: () => void }) {
  const router = useRouter();
  // where he was in a long sidebar comes back after a reload (keep.ts)
  useKeptScroll('sidebar', () => document.querySelector<HTMLElement>('[data-testid="app.sidebar"]'));
  const route = useRoute();
  const rows = useProjects();
  const home = rows.find((p) => p.home);
  const inView = projectOf(route);
  const waits = useWaitingTotal();
  const ids = rows.map((p) => p.project).join('\n');
  const fresh = useSum('artifacts', ids, (s, p) => s.artifacts(p).filter((a) => a.new).length);
  // tui-parity R17: who made the new ones ('↗ 1 new · designer'), until he opens the artifacts
  const makers = useNewMakers(ids);
  const scheduled = useSum('scheduled', ids, (s, p) => s.scheduled(p).length);
  const projects = projectsOf(rows);
  const add = () => {
    router.go({ screen: 'settings', page: 'projects' });
  };
  return (
    <Side
      testId="app.sidebar"
      foot={
        <>
          <SRow kind="ft" lead="+" name="add a project" end={<kbd>⌘N</kbd>} onClick={add} testId="app.sidebar.add" />
          <SRow kind="ft" lead="⚙" name="settings" end={<kbd>⌘,</kbd>} onClick={() => { router.go({ screen: 'settings' }); }} testId="app.sidebar.settings" />
        </>
      }
    >
      <button type="button" className="app-search" onClick={onSearch} data-testid="app.sidebar.search">
        <span aria-hidden="true">⌕</span>
        <span className="app-search-w">search or jump</span>
        <kbd>⌘K</kbd>
      </button>
      <SRow
        kind="top"
        lead={<BisePearl size={14} />}
        name="bise"
        count={waits}
        title={waits > 0 ? `${String(waits)} waiting for you` : 'every project'}
        on={route.screen === 'bise' || (home !== undefined && inView === home.project && route.screen === 'thread' && route.agent === MAIN)}
        onClick={() => { router.go({ screen: 'bise' }); }}
        testId="app.sidebar.bise"
      />
      <SRow kind="top" lead="↗" name="artifacts" end={newWords(fresh, makers)} title={makers.length > 0 ? `new from ${makers.join(', ')}` : undefined}
        on={route.screen === 'artifacts' && route.project === ''}
        onClick={() => { router.go({ screen: 'artifacts', project: '' }); }} testId="app.sidebar.artifacts" />
      <SRow kind="top" lead="◷" name="scheduled" end={scheduled > 0 ? String(scheduled) : ''} on={route.screen === 'scheduled'}
        onClick={() => { router.go({ screen: 'scheduled' }); }} testId="app.sidebar.scheduled" />
      {home !== undefined && inView === home.project && <Agents project={home.project} route={route} />}
      <SectionHead>projects</SectionHead>
      {projects.length === 0 && <SRow kind="more" lead="+" name="add a project" end={<kbd>⌘N</kbd>} onClick={add} testId="app.sidebar.empty-add" />}
      {projects.map((p) => (
        <ProjectItem key={p.project} p={p} on={inView === p.project} route={route} />
      ))}
    </Side>
  );
}

// A project's folder (his try round 2, ambient-lead m_11456 item 3): open by default, his close
// remembered per project for the next launches (localStorage, this window's own).
const CLOSED_KEY = 'bise.sidebar.closed';
let closed: ReadonlySet<string> = readClosed();
const closedSubs = new Set<() => void>();

function readClosed(): ReadonlySet<string> {
  try {
    const v: unknown = JSON.parse(globalThis.localStorage.getItem(CLOSED_KEY) ?? '[]');
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

/** Opens or closes a project's folder, and remembers it. */
export function toggleFolder(project: string): void {
  const next = new Set(closed);
  if (next.has(project)) next.delete(project);
  else next.add(project);
  closed = next;
  try {
    globalThis.localStorage.setItem(CLOSED_KEY, JSON.stringify([...next]));
  } catch {
    // no storage (a unit test's DOM): kept for this session only
  }
  for (const f of closedSubs) f();
}

function useFolderOpen(project: string): boolean {
  return useSyncExternalStore(
    (f) => {
      closedSubs.add(f);
      return () => {
        closedSubs.delete(f);
      };
    },
    () => !closed.has(project),
  );
}

const ProjectItem = memo(function ProjectItem({ p, on, route }: { p: ProjectRow; on: boolean; route: Route }) {
  const router = useRouter();
  const refused = useHubRefused(p.project) !== null;
  const side = projectSide(p, refused);
  const open = useFolderOpen(p.project);
  const [menu, setMenu] = useState(false);
  return (
    <>
      <SRow
        kind="pj"
        lead={<StillPearl />}
        name={p.name}
        end={side.text}
        endErr={side.err}
        count={side.count}
        title={side.count > 0 ? `${String(side.count)} waiting for you` : undefined}
        on={on && route.screen === 'thread' && route.agent === MAIN}
        onClick={() => { router.go({ screen: 'thread', project: p.project, agent: MAIN }); }}
        testId={`app.sidebar.project.${p.project}`}
      >
        <button
          type="button"
          className={open ? 'app-fold' : 'app-fold shut'}
          aria-expanded={open}
          aria-label={open ? `close ${p.name}` : `open ${p.name}`}
          title={open ? 'close the folder' : 'open the folder'}
          onClick={(e) => {
            e.stopPropagation();
            toggleFolder(p.project);
          }}
          data-testid={`app.sidebar.project.${p.project}.fold`}
        >
          {open ? '▾' : '▸'}
        </button>
        <button
          type="button"
          className={menu ? 'app-more on' : 'app-more'}
          aria-label={`${p.name}: more`}
          aria-expanded={menu}
          onClick={(e) => {
            e.stopPropagation();
            setMenu((m) => !m);
          }}
          data-testid={`app.sidebar.project.${p.project}.menu`}
        >
          ⋯
        </button>
      </SRow>
      {menu && <ProjectMenu p={p} onClose={() => { setMenu(false); }} />}
      {/* its hub refused this core: the hub's words and a retry, open or closed (lead m_11347) */}
      <RefusedLine project={p.project} name={p.name} className="app-refused" testId={`app.sidebar.project.${p.project}.refused`} />
      {open && <Agents project={p.project} route={route} />}
    </>
  );
});

/** A project's ⋯ menu: its agents list, then its archived agents (each opens its thread). */
function ProjectMenu({ p, onClose }: { p: ProjectRow; onClose: () => void }) {
  const router = useRouter();
  const archived = archivedOf(useAgents(p.project));
  useEffect(() => {
    const away = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !(e.target instanceof Element && e.target.closest('.app-menu, .app-more') !== null)) onClose();
    };
    window.addEventListener('mousedown', away, true);
    window.addEventListener('keydown', away, true);
    return () => {
      window.removeEventListener('mousedown', away, true);
      window.removeEventListener('keydown', away, true);
    };
  }, [onClose]);
  const go = (r: Route) => {
    onClose();
    router.go(r);
  };
  return (
    <div className="app-menu">
      <Menu testId={`app.sidebar.project.${p.project}.menu.list`}>
        <MenuItem onClick={() => { go({ screen: 'agents', project: p.project }); }} testId={`app.sidebar.project.${p.project}.menu.agents`}>
          all agents
        </MenuItem>
        <MenuSep />
        {archived.length === 0 ? (
          <MenuItem disabled>no archived agent</MenuItem>
        ) : (
          archived.map((a) => (
            <MenuItem key={a.name} hotkey="archived" onClick={() => { go({ screen: 'thread', project: p.project, agent: a.name }); }}
              testId={`app.sidebar.project.${p.project}.menu.archived.${a.name}`}>
              – {a.name}
            </MenuItem>
          ))
        )}
      </Menu>
    </div>
  );
}

/**
 * A project's live agents, main out (it is the project's row), in the TUI
 * panel's order (⌥1-9 follow it): the ones in no feature, then each
 * feature's head ('ψ gift-cards', opens the feature) with its agents. Done
 * agents quiet for an hour fold into 'n more today' (one at rest stays).
 */
function Agents({ project, route }: { project: string; route: Route }) {
  const router = useRouter();
  const all = useAgents(project);
  const features = useFeatures(project);
  const wakes = useWakes(project);
  const now = useNow();
  const [unfolded, setUnfolded] = useState(false);
  const live = liveOf(all).filter((a) => !a.main);
  const folded = live.filter((a) => folds(a, now, wakes.get(a.name)) && !(route.screen === 'thread' && route.project === project && route.agent === a.name));
  const shown = unfolded ? live : live.filter((a) => !folded.includes(a));
  const { solo, groups } = groupsOf(shown, features);
  // L25: the demo's 'start' tip under the first demo agent, 'steer' under the one that waits for him
  const tour = useTour(project);
  const liveDemo = tour.snap.members.filter((m) => !m.archived);
  const tipAt = tour.tip === 'start' ? liveDemo[0]?.name : tour.tip === 'steer' ? liveDemo.at(-1)?.name : undefined;
  // S36: the first agent's one-time hint under the first agent's row (a demo tip there wins)
  const first = solo[0]?.name ?? groups[0]?.agents[0]?.name;
  const hint = useHint('first_agent', first !== undefined && tour.tip === null);
  const inAgent = route.screen === 'thread' && route.project === project && route.agent !== MAIN;
  useEffect(() => {
    if (inAgent) hintUsed('first_agent');
  }, [inAgent]);
  const row = (a: Agent) => {
    const r = <AgentRow key={a.name} project={project} a={a} route={route} now={now} wake={wakes.get(a.name)} />;
    if (tipAt === a.name && tour.tip !== null)
      return (
        <Fragment key={a.name}>
          {r}
          <div className="app-tip">
            <Tip tip={tour.tip} snap={tour.snap} />
          </div>
        </Fragment>
      );
    if (hint && first === a.name)
      return (
        <Fragment key={a.name}>
          {r}
          <div className="app-tip">
            <Hint name="first_agent" />
          </div>
        </Fragment>
      );
    return r;
  };
  return (
    <>
      {solo.map(row)}
      {groups.map((g) => (
        <Fragment key={`ψ ${g.feature.name}`}>
          <SRow
            kind="ag"
            lead="ψ"
            name={g.feature.name}
            end={distanceShort(g.feature)}
            on={route.screen === 'feature' && route.project === project && route.name === g.feature.name}
            onClick={() => { router.go({ screen: 'feature', project, name: g.feature.name }); }}
            testId={`app.sidebar.feature.${g.feature.name}`}
          />
          {g.agents.map(row)}
        </Fragment>
      ))}
      {folded.length > 0 && (
        <SRow kind="more" lead="" name={unfolded ? 'fold the quiet ones' : moreWords(folded, now)} title={folded.map((a) => a.name).join(', ')}
          onClick={() => { setUnfolded((u) => !u); }} testId={`app.sidebar.project.${project}.more`} />
      )}
    </>
  );
}

/** A feature's end in the sidebar: what it waits for, else how far it is. */
function distanceShort(f: Feature): string {
  if (f.building) return 'building';
  if (f.trial) return 'on trial';
  return `${String(f.ahead)} ahead`;
}

function AgentRow({ project, a, route, now, wake }: { project: string; a: Agent; route: Route; now: number; wake: number | undefined }) {
  const router = useRouter();
  const sign = signOf(a, now, wake);
  return (
    <SRow
      kind="ag"
      // at work: the DS's breeze '∿' (it pulses on the open row, murmurs on the others, still with reduced motion)
      lead={a.status === 'working' && sign.g === '∿' ? <Dot state="wk" /> : <span className={`app-sign ${sign.tone}`}>{sign.g}</span>}
      name={
        <>
          {a.name}
          {/* its context gauge, the TUI panel's short form as the hub sends it (amb-feed c317fc32) */}
          {a.usage != null && a.usage.short !== '' && (
            <span className="app-gauge" data-testid={`app.sidebar.agent.${a.name}.gauge`}>
              {a.usage.short}
            </span>
          )}
        </>
      }
      end={sign.end}
      endErr={sign.endTone === 'err'}
      count={sign.count}
      title={sign.title}
      on={route.screen === 'thread' && route.project === project && route.agent === a.name}
      onClick={() => { router.go({ screen: 'thread', project, agent: a.name }); }}
      testId={`app.sidebar.agent.${a.name}`}
    />
  );
}
