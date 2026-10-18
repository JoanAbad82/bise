// The sidebar (designer's desktop-screens v6/v7, signed): 'search or jump
// ⌘K', bise, '? inbox' (the pink waiting count), '↗ artifacts' and '◷ scheduled' for every project at once,
// then his projects, each with its mark (desktop-delight v2: the '∿' gust at
// work, '?' when it asks him, '·' quiet; a click opens 'bise · storefront')
// and his pink count; bise's row leads with its ':*' (Marks.tsx); the project's ⋯ menu
// lists its agents by priority (active, quiet, archived: projmenu.ts); '+ add a project' and settings at the foot.
// Places only (designer's desktop-right-bar v5, ambient-lead m_20087): the
// agents of the place shown are in the right bar (RightBar.tsx). Owner: amb-win.
//
// It reads only projects, the route and counts (numbers, so a snapshot never
// changes for nothing): a thread's entries never re-render it.
import { memo, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from 'react';
import { IconButton, Kbd, PickerPop, SearchButton, SectionHead, Side, tipAttrs } from '@/ds';
import type { ProjectRow } from '@/proto';
import { panel } from '@/proto/words_panel.gen';
import { useAgents, useHubRefused, useProjects, useStore, type Store } from '@/store';
import { RefusedLine } from './Refused';
import { useProjectWaiting, useWaitingCount } from '@/inbox/waiting';
import { useNow } from './clock';
import { menuGroupsOf } from './projmenu';
import { MAIN, projectOf, type Route } from './route';
import { addProject } from './addProject';
import { useRoute, useRouter } from './router';
import { projectSide } from './side';
import { useKeptScroll } from './keep';
import { LiveBiseMark, ProjectMark } from './Marks';
import { whoOf } from './markstates';
import { useModHeld } from './held';
import { goneTip, newTip, projectTip, scheduledTip, waitsTip, workingTip } from './tipwords';

/** His projects in his order, bise's own out (it is the bise row). Pure. */
export function projectsOf(rows: readonly ProjectRow[]): ProjectRow[] {
  return rows.filter((p) => !p.home).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/** What waits on him across every project: bise's pink count, the narrow titlebar's 'n waiting'. */
/** What waits on him, one number everywhere: the inbox's own list, bise's asks included (designer m_25690). */
export function useWaitingTotal(): number {
  return useWaitingCount();
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
  return makers.length === 1 ? panel.count_new_by({ n: fresh, who: makers[0] ?? '' }) : panel.count_new({ n: fresh });
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

/** One sidebar row: a lead (pearl or sign), the name, its end words, his pink count, each mark with its tip; ⌘ held: its number. */
function SRow({ kind, lead, name, end, endErr, endTip, count, countTip, hint, on, title, onClick, testId, children }: {
  kind: 'top' | 'pj' | 'ag' | 'more' | 'ft';
  lead: ReactNode;
  name: ReactNode;
  end?: ReactNode;
  endErr?: boolean;
  /** the end's hover tip (tipwords.ts) */
  endTip?: string | undefined;
  count?: number;
  /** the count's hover tip */
  countTip?: string;
  /** ⌘ held: its ⌘ digit, a 16 px kbd at the row's end in place of the count (held.ts) */
  hint?: number | undefined;
  on?: boolean;
  title?: string;
  onClick?: () => void;
  testId?: string;
  children?: ReactNode;
}) {
  // ⌘ held: the digit takes the whole right end, its words hide like the count (designer m_21692)
  const tail =
    hint !== undefined ? (
      <span className="app-keyhint" title={`⌘${String(hint)}`} data-testid={testId === undefined ? undefined : `${testId}.hint`}>
        <Kbd>{hint}</Kbd>
      </span>
    ) : (
      <>
        {end != null && end !== '' && (
          <span className={endErr === true ? 'app-m err' : 'app-m'} {...tipAttrs(endTip)} data-testid={testId === undefined ? undefined : `${testId}.end`}>
            {end}
          </span>
        )}
        {count !== undefined && count > 0 && (
          <span className="app-cnt" {...tipAttrs(countTip)} data-testid={testId === undefined ? undefined : `${testId}.count`}>
            {count}
          </span>
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
        // a row with a ⋯ (a project's): its end words in a box of a kept width at the row's end;
        // the ⋯ shows over it, flush right, and the words give way (app.css .app-more)
        <span className="app-tail">{tail}</span>
      ) : (
        tail
      )}
    </div>
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
          <SRow kind="ft" lead="+" name={panel.add_project} end={<kbd>⌘N</kbd>} onClick={add} testId="app.sidebar.add" />
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
        <SearchButton label={panel.search} keys="⌘K" onClick={onSearch} testId="app.sidebar.search" />
      </div>
      <SRow
        kind="top"
        lead={<LiveBiseMark testId="app.sidebar.bise.mark" />}
        name={panel.bise}
        hint={cmd ? 0 : undefined}
        on={route.screen === 'bise' || (home !== undefined && inView === home.project && route.screen === 'thread' && route.agent === MAIN)}
        onClick={() => { router.go({ screen: 'bise' }); }}
        testId="app.sidebar.bise"
      />
      <SRow kind="top" lead="?" name={panel.inbox} count={waits} countTip={waitsTip(waits, true)}
        on={route.screen === 'inbox'} onClick={() => { router.go({ screen: 'inbox' }); }} testId="app.sidebar.inbox" />
      <SRow kind="top" lead="↗" name={panel.artifacts} end={<NewEnd words={newWords(fresh, makers)} />} endTip={newTip(fresh, makers)}
        on={route.screen === 'artifacts' && route.project === ''}
        onClick={() => { router.go({ screen: 'artifacts', project: '' }); }} testId="app.sidebar.artifacts" />
      <SRow kind="top" lead="◷" name={panel.scheduled} end={scheduled > 0 ? String(scheduled) : ''} endTip={scheduledTip(scheduled)} on={route.screen === 'scheduled'}
        onClick={() => { router.go({ screen: 'scheduled' }); }} testId="app.sidebar.scheduled" />
      <SectionHead>{panel.projects}</SectionHead>
      {projects.length === 0 && <SRow kind="more" lead="+" name={panel.add_project} end={<kbd>⌘N</kbd>} onClick={add} testId="app.sidebar.empty-add" />}
      {projects.map((p, i) => (
        <ProjectItem key={p.project} p={p} on={inView === p.project} route={route} hint={cmd && i < 9 ? i + 1 : undefined} />
      ))}
    </Side>
  );
}

const ProjectItem = memo(function ProjectItem({ p, on, route, hint }: { p: ProjectRow; on: boolean; route: Route; hint: number | undefined }) {
  const router = useRouter();
  const refused = useHubRefused(p.project) !== null;
  // his pink count: the inbox's own items of this project (what he just answered left out), never the row's raw count
  const side = projectSide(p, refused, useProjectWaiting(p));
  const who = whoOf(useAgents(p.project));
  const [menu, setMenu] = useState(false);
  const more = useRef<HTMLButtonElement>(null);
  return (
    <>
      <SRow
        kind="pj"
        lead={<ProjectMark p={p} tip={projectTip(p, who)} testId={`app.sidebar.project.${p.project}.mark`} />}
        name={p.name}
        end={side.text}
        endErr={side.err}
        endTip={side.err ? (p.missing === true ? goneTip(p.path) : undefined) : workingTip(p.working)}
        count={side.count}
        countTip={waitsTip(side.count)}
        hint={hint}
        on={on && route.screen === 'thread' && route.agent === MAIN}
        onClick={() => { router.go({ screen: 'thread', project: p.project, agent: MAIN }); }}
        testId={`app.sidebar.project.${p.project}`}
      >
        {/* ⋯, the ds's row IconButton: on hover or focus, flush at the row's right end */}
        <span className={menu ? 'app-more on' : 'app-more'}>
          <IconButton
            ref={more}
            size="row"
            label={panel.project_menu({ name: p.name })}
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
      {menu && <ProjectMenu p={p} anchor={more} onClose={() => { setMenu(false); }} />}
      {/* its hub refused this core: the hub's words and a retry, open or closed (lead m_11347) */}
      <RefusedLine project={p.project} name={p.name} className="app-refused" testId={`app.sidebar.project.${p.project}.refused`} />
    </>
  );
});

/** A project's ⋯ menu (the ds PickerPop from its ⋯), by priority (projmenu.ts): 'all agents',
 *  then 'active', 'quiet', 'archived' (the newest 5, '+ N more' to /archived); each row wears the
 *  right bar's mark, its end in sans words ('waits' in the accent); a row opens its thread. */
function ProjectMenu({ p, anchor, onClose }: { p: ProjectRow; anchor: RefObject<HTMLButtonElement | null>; onClose: () => void }) {
  const router = useRouter();
  const now = useNow();
  const groups = menuGroupsOf(useAgents(p.project), now);
  const id = `app.sidebar.project.${p.project}.menu`;
  return (
    <PickerPop
      anchor={anchor}
      align="start"
      groups={[
        { id: 'all', rows: [{ id: 'agents', name: panel.all_agents, testId: `${id}.agents` }] },
        ...groups.map((g) => ({
          id: g.head,
          head: g.head,
          rows: [
            ...g.rows.map((r) => ({
              id: `a:${r.agent.name}`,
              name: r.agent.name,
              text: r.agent.name,
              glyph: <span className={`app-sign ${r.tone}`} data-testid={`${id}.${g.head}.${r.agent.name}.mark`}>{r.glyph}</span>,
              trailing: <span className={r.acc ? 'app-pm-end acc' : 'app-pm-end'}>{r.end}</span>,
              testId: `${id}.${g.head}.${r.agent.name}`,
            })),
            ...(g.more > 0 ? [{ id: 'more', name: `+ ${String(g.more)} more`, testId: `${id}.archived.more` }] : []),
          ],
        })),
      ]}
      onPick={(pick) => {
        onClose();
        router.go(
          pick === 'agents' ? { screen: 'agents', project: p.project }
          : pick === 'more' ? { screen: 'agents', project: p.project, archived: true }
          : { screen: 'thread', project: p.project, agent: pick.slice(2) },
        );
      }}
      onClose={onClose}
      testId={`${id}.list`}
    />
  );
}
