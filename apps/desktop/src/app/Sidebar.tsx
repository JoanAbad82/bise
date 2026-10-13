// The sidebar (designer's desktop-screens v6/v7, signed): 'search or jump
// ⌘K', bise, '↗ artifacts' and '◷ scheduled' for every project at once,
// then his projects, each with its pearl (its bise: a click opens 'bise ·
// storefront'), what works in it and his pink count; the archived agents
// are in the project's ⋯ menu; '+ add a project' and settings at the foot.
// Places only (designer's desktop-right-bar v5, ambient-lead m_20087): the
// agents of the place shown are in the right bar (RightBar.tsx). Owner: amb-win.
//
// It reads only projects, the route and counts (numbers, so a snapshot never
// changes for nothing): a thread's entries never re-render it.
import { memo, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { IconButton, Kbd, Menu, MenuItem, MenuSep, Pearl, SearchButton, SectionHead, Side } from '@/ds';
import type { ProjectRow } from '@/proto';
import { useAgents, useHubRefused, useProjects, useStore, type Store } from '@/store';
import { RefusedLine } from './Refused';
import { archivedOf } from '@/agents/model';
import { MAIN, projectOf, type Route } from './route';
import { addProject } from './addProject';
import { useRoute, useRouter } from './router';
import { projectSide } from './side';
import { useKeptScroll } from './keep';
import { BisePearl } from './BisePearl';
import { useModHeld } from './held';

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

/** '2 new · designer': the 'n new' part in the accent, as the artifacts' own 'new' chip (amb-kit, try gate D4); its words say it without the color. */
function NewEnd({ words }: { words: string }) {
  if (words === '') return null;
  const at = words.indexOf(' · ');
  return (
    <>
      <span className="app-new">{at < 0 ? words : words.slice(0, at)}</span>
      {at < 0 ? '' : words.slice(at)}
    </>
  );
}

/** One sidebar row: a lead (pearl or sign), the name, its end words, his pink count; ⌘ held: its number. */
function SRow({ kind, lead, name, end, endErr, count, hint, on, title, onClick, testId, children }: {
  kind: 'top' | 'pj' | 'ag' | 'more' | 'ft';
  lead: ReactNode;
  name: ReactNode;
  end?: ReactNode;
  endErr?: boolean;
  count?: number;
  /** ⌘ held: its ⌘ digit, a 16 px kbd at the row's end in place of the count (held.ts) */
  hint?: number | undefined;
  on?: boolean;
  title?: string;
  onClick?: () => void;
  testId?: string;
  children?: ReactNode;
}) {
  const tail = (
    <>
      {end != null && end !== '' && <span className={endErr === true ? 'app-m err' : 'app-m'}>{end}</span>}
      {hint !== undefined ? (
        <span className="app-keyhint" title={`⌘${String(hint)}`} data-testid={testId === undefined ? undefined : `${testId}.hint`}>
          <Kbd>{hint}</Kbd>
        </span>
      ) : (
        count !== undefined && count > 0 && <span className="app-cnt">{count}</span>
      )}
    </>
  );
  return (
    <div className={`b-row app-r ${kind}${on === true ? ' on' : ''}`} role="button" tabIndex={-1} aria-current={on === true || undefined} title={title}
      onClick={onClick} data-testid={testId}>
      <span className="app-g">{lead}</span>
      <span className="nm">{name}</span>
      {children}
      {children != null ? (
        // a row with buttons (a project's folder, ⋯): its end words in a box of a kept width, so
        // the buttons never move when they change ('∿ 1' going away moved them under the
        // pointer: app/clicks)
        <span className="app-tail">{tail}</span>
      ) : (
        tail
      )}
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

/** The window in macOS full screen (amb-mac f58585d2: told at once, then on each enter/leave). */
function useFullScreen(): boolean {
  const [full, setFull] = useState(false);
  useEffect(() => {
    // the page outside Electron (a component test) has no preload
    const on = (window as Partial<Window>).bise?.onFullScreen;
    return on === undefined ? undefined : on(setFull);
  }, []);
  return full;
}

/** The sidebar's list scrolled off its top (its rows pass under the field): for the fade. */
function useSideScrolled(): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('[data-testid="app.sidebar"]');
    if (el === null) return;
    const f = () => {
      setScrolled(el.scrollTop > 0);
    };
    f();
    el.addEventListener('scroll', f, { passive: true });
    return () => {
      el.removeEventListener('scroll', f);
    };
  }, []);
  return scrolled;
}

export function Sidebar({ onSearch }: { onSearch: () => void }) {
  const router = useRouter();
  // where he was in a long sidebar comes back after a reload (keep.ts)
  useKeptScroll('sidebar', () => document.querySelector<HTMLElement>('[data-testid="app.sidebar"]'));
  const full = useFullScreen();
  const scrolled = useSideScrolled();
  const route = useRoute();
  const rows = useProjects();
  const home = rows.find((p) => p.home);
  const inView = projectOf(route);
  // the route's project comes into view in a long sidebar (designer's R31 read: shop below the fold
  // on shop's route); nearest edge, so a row already in view never moves
  useEffect(() => {
    if (inView === undefined) return;
    document.querySelector(`[data-testid="app.sidebar.project.${CSS.escape(inView)}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [inView]);
  const waits = useWaitingTotal();
  const ids = rows.map((p) => p.project).join('\n');
  const fresh = useSum('artifacts', ids, (s, p) => s.artifacts(p).filter((a) => a.new).length);
  // tui-parity R17: who made the new ones ('↗ 1 new · designer'), until he opens the artifacts
  const makers = useNewMakers(ids);
  const scheduled = useSum('scheduled', ids, (s, p) => s.scheduled(p).length);
  const projects = projectsOf(rows);
  // ⌘ held alone: every place shows its ⌘ digit (bise 0, the projects 1-9 in keys.ts's order)
  const cmd = useModHeld('Meta');
  const add = () => {
    addProject(router);
  };
  return (
    <Side
      testId="app.sidebar"
      // the lights' room is drawn in the sticky top below, with the search (his shot m_14497)
      lights={false}
      foot={
        <>
          <SRow kind="ft" lead="+" name="add a project" end={<kbd>⌘N</kbd>} onClick={add} testId="app.sidebar.add" />
          <SRow kind="ft" lead="⚙" name="settings" end={<kbd>⌘,</kbd>} onClick={() => { router.go({ screen: 'settings' }); }} testId="app.sidebar.settings" />
        </>
      }
    >
      {/* his shot (ambient-lead m_14497): in a long sidebar the whole column scrolled, so the
          search field rode up under macOS's lights. The lights' 40 px room and the field stay put
          at the top; only the rows scroll under them. In full screen there are no lights: no room
          (amb-me's onFullScreen). Scrolled, the edge under the field fades over 16 px like the
          thread's top, so a half-hidden row reads as 'more above' (designer m_15023). */}
      <div className={`app-side-top${full ? ' full' : ''}${scrolled ? ' scrolled' : ''}`} data-testid="app.sidebar.top" data-full={full} data-scrolled={scrolled}>
        <div className="b-lights" data-testid="app.sidebar.lights" />
        <SearchButton label="search or jump" keys="⌘K" onClick={onSearch} testId="app.sidebar.search" />
      </div>
      <SRow
        kind="top"
        lead={<BisePearl size={14} />}
        name="bise"
        count={waits}
        hint={cmd ? 0 : undefined}
        title={waits > 0 ? `${String(waits)} waiting for you` : 'every project'}
        on={route.screen === 'bise' || (home !== undefined && inView === home.project && route.screen === 'thread' && route.agent === MAIN)}
        onClick={() => { router.go({ screen: 'bise' }); }}
        testId="app.sidebar.bise"
      />
      <SRow kind="top" lead="↗" name="artifacts" end={<NewEnd words={newWords(fresh, makers)} />} title={makers.length > 0 ? `new from ${makers.join(', ')}` : undefined}
        on={route.screen === 'artifacts' && route.project === ''}
        onClick={() => { router.go({ screen: 'artifacts', project: '' }); }} testId="app.sidebar.artifacts" />
      <SRow kind="top" lead="◷" name="scheduled" end={scheduled > 0 ? String(scheduled) : ''} on={route.screen === 'scheduled'}
        onClick={() => { router.go({ screen: 'scheduled' }); }} testId="app.sidebar.scheduled" />
      <SectionHead>projects</SectionHead>
      {projects.length === 0 && <SRow kind="more" lead="+" name="add a project" end={<kbd>⌘N</kbd>} onClick={add} testId="app.sidebar.empty-add" />}
      {projects.map((p, i) => (
        <ProjectItem key={p.project} p={p} on={inView === p.project} route={route} hint={cmd && i < 9 ? i + 1 : undefined} />
      ))}
    </Side>
  );
}

const ProjectItem = memo(function ProjectItem({ p, on, route, hint }: { p: ProjectRow; on: boolean; route: Route; hint: number | undefined }) {
  const router = useRouter();
  const refused = useHubRefused(p.project) !== null;
  const side = projectSide(p, refused);
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
        hint={hint}
        title={side.count > 0 ? `${String(side.count)} waiting for you` : undefined}
        on={on && route.screen === 'thread' && route.agent === MAIN}
        onClick={() => { router.go({ screen: 'thread', project: p.project, agent: MAIN }); }}
        testId={`app.sidebar.project.${p.project}`}
      >
        {/* ⋯, the ds's row IconButton: on hover or focus */}
        <span className={menu ? 'app-more on' : 'app-more'}>
          <IconButton
            size="row"
            label={`${p.name}: more`}
            pressed={menu}
            onClick={(e) => {
              e.stopPropagation();
              setMenu((m) => !m);
            }}
            testId={`app.sidebar.project.${p.project}.menu`}
          >
            ⋯
          </IconButton>
        </span>
      </SRow>
      {menu && <ProjectMenu p={p} onClose={() => { setMenu(false); }} />}
      {/* its hub refused this core: the hub's words and a retry, open or closed (lead m_11347) */}
      <RefusedLine project={p.project} name={p.name} className="app-refused" testId={`app.sidebar.project.${p.project}.refused`} />
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
