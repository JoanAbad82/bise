// The sidebar (bise fait mac, page native-mac §6, mockup 1): beside the rail under the bar, 240
// wide (200-320 by its border, kept: frame-state.ts), --p-raised 82% with a 12 top-left corner.
// 'New agent ⌘N' and 'Search ⌘K' first, then 'Pinned' (pins.ts) and 'Projects': each project a
// folder row (a click folds it), its live agents in the hub's rank under it, the first 4 then
// 'Show N more', at a row's end only the dot (it waits on him) or the ring (it works): siderows.ts
// decides, this draws. Its head stays, its list scrolls; a right click on an agent or a project
// opens its menu (useEntityMenu, nm-menus'). On the artifacts library (decision d2) it shows
// '← Projects' and the library (artifacts' ArtLibrary) at the same width, a 160 ms crossfade.
// Owner: nm-frame.
//
// Each project's block and each pin read their own project's agents (useAgents): an event
// re-renders the block it touches, never the sidebar, and a thread's entries never do.
import { memo, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { AppIcon, Input, tipAttrs, type AppIconName, Press } from '@/ds';
import type { ProjectRow } from '@/proto';
import { frame } from '@/proto/words_frame.gen';
import { panel } from '@/proto/words_panel.gen';
import { useAgents, useProjects, useStore } from '@/store';
import { numbersOf } from '@/agents/model';
import { ArtLibrary } from '@/artifacts';
import { useWaitingCount } from '@/inbox/waiting';
import { useEntityMenu } from './menus/use';
import { useEntityAction } from './menus/actions';
import { MAIN, projectOf } from './route';
import { useRoute, useRouter } from './router';
import { keep, useKeptScroll } from './keep';
import { useModHeld } from './held';
import { usePinned, type Pin } from './pins';
import { newAgent } from './newagent';
import { addProject } from './addProject';
import { pinRowOf, projectBlockOf, projectsOf, type RowEnd, type SideRow } from './siderows';

/** What waits on him, one number everywhere: the inbox's own list (designer m_25690). */
export function useWaitingTotal(): number {
  return useWaitingCount();
}

/** A row's name; cut ('…'), it carries the ds tip with the whole name (designer m_38093). */
function CutName({ name }: { name: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el === null) return undefined;
    const sync = () => {
      if (el.scrollWidth > el.clientWidth) el.setAttribute('data-tip', name);
      else el.removeAttribute('data-tip');
    };
    sync();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [name]);
  return (
    <span ref={ref} className="nm">
      {name}
    </span>
  );
}

/** A row's end: the accent dot (it waits on him) or the ring (it works), each with its tip; nothing else. */
function End({ end, testId }: { end: RowEnd; testId: string }) {
  if (end === 'waits') return <span className="app-s-dot" {...tipAttrs(panel.asks_you)} data-testid={`${testId}.waits`} />;
  if (end === 'works') return <span className="app-s-ring" {...tipAttrs(panel.state_working)} data-testid={`${testId}.works`} />;
  return null;
}

function Row({ kind, icon, name, end, on, stopped, expanded, onClick, onContextMenu, testId }: {
  kind: 'top' | 'project' | 'agent' | 'more' | 'back';
  icon?: AppIconName;
  name: string;
  end?: ReactNode;
  on?: boolean;
  stopped?: boolean;
  /** a project's row: its agents shown */
  expanded?: boolean;
  onClick: () => void;
  onContextMenu?: (e: MouseEvent<HTMLElement>) => void;
  testId: string;
}) {
  return (
    <Press
      look={`app-s-row ${kind}${on === true ? ' on' : ''}${stopped === true ? ' stopped' : ''}`}
      aria-current={on === true ? 'page' : undefined}
      aria-expanded={expanded}
      onClick={onClick}
      onContextMenu={onContextMenu}
      data-testid={testId}
    >
      {icon !== undefined && <AppIcon name={icon} size={16} />}
      <CutName name={name} />
      {end != null && <span className="app-s-end">{end}</span>}
    </Press>
  );
}

function Label({ children, end, testId }: { children: string; end?: ReactNode; testId: string }) {
  return (
    <div className="app-s-label" role="heading" aria-level={2} data-testid={testId}>
      <span>{children}</span>
      {end}
    </div>
  );
}

/** A kept set of project ids (the folded ones, the ones whose 'Show N more' is open): keep.ts. */
function useKeptSet(key: string): readonly [ReadonlySet<string>, (id: string) => void] {
  const [set, setSet] = useState<ReadonlySet<string>>(() => {
    const v = keep.view(key);
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  });
  const flip = (id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    keep.setView(key, [...next]);
    setSet(next);
  };
  return [set, flip];
}

export function Sidebar({ onSearch }: { onSearch: () => void }) {
  const route = useRoute();
  const home = useProjects().find((p) => p.home)?.project;
  // d2: the artifacts library takes the projects' place on artifacts, at the same width
  const library = route.screen === 'artifacts';
  const here = projectOf(route) ?? home;
  return (
    <aside className="app-side" data-testid="app.sidebar" data-library={library || undefined}>
      <div className="app-s-head">
        <Row
          kind="top"
          icon="rename"
          name={frame.new_agent}
          end={<kbd>⌘N</kbd>}
          onClick={() => {
            if (here !== undefined) newAgent(here);
          }}
          testId="app.side.new"
        />
        <Row kind="top" icon="search" name={frame.search} end={<kbd>⌘K</kbd>} onClick={onSearch} testId="app.side.search" />
      </div>
      {/* the swap is a crossfade (app.css .app-s-swap): a new key fades the other list in */}
      <div className="app-s-swap" key={library ? 'library' : 'projects'}>
        {library ? <LibraryList /> : <ProjectList />}
      </div>
    </aside>
  );
}

/** d2: '← Projects' back (esc and ⌘[ too: router's back), then the library (nm-pages-a's ArtLibrary). */
function LibraryList() {
  const router = useRouter();
  return (
    <div className="app-s-list" data-testid="app.side.library">
      <Row
        kind="back"
        icon="back"
        name={frame.projects}
        onClick={() => {
          if (router.canBack()) router.back();
          else router.go({ screen: 'bise' });
        }}
        testId="app.side.back"
      />
      <ArtLibrary />
    </div>
  );
}

function ProjectList() {
  const rows = useProjects();
  const pins = usePinned();
  const [folded, fold] = useKeptSet('frame.side.folded');
  const [more, showMore] = useKeptSet('frame.side.more');
  // where he was in a long sidebar comes back after a reload (keep.ts)
  useKeptScroll('sidebar', () => document.querySelector<HTMLElement>('[data-testid="app.side.list"]'));
  const projects = projectsOf(rows);
  return (
    <div className="app-s-list" data-testid="app.side.list">
      {pins.length > 0 && <PinnedList pins={pins} />}
      <Label testId="app.side.label.projects" end={<AddProject />}>
        {frame.projects}
      </Label>
      {projects.map((p) => (
        <ProjectBlock
          key={p.project}
          p={p}
          pinned={pins.filter((x) => x.project === p.project).map((x) => x.agent)}
          folded={folded.has(p.project)}
          all={more.has(p.project)}
          fold={fold}
          showMore={showMore}
        />
      ))}
    </div>
  );
}

/** 'Pinned' and its rows; nothing while no pin is live (a pin whose agent left is never shown). */
function PinnedList({ pins }: { pins: readonly Pin[] }) {
  const rows = pins.map((p) => <PinItem key={`${p.project}/${p.agent}`} pin={p} />);
  return (
    <div className="app-s-pins" data-testid="app.side.pinned">
      <Label testId="app.side.label.pinned">{frame.pinned}</Label>
      {rows}
    </div>
  );
}

function PinItem({ pin }: { pin: Pin }) {
  const route = useRoute();
  const agents = useAgents(pin.project);
  const at = route.screen === 'thread' && route.project === pin.project ? route.agent : undefined;
  const r = pinRowOf(pin.project, pin.agent, agents, at);
  return r === null ? null : <SideItem r={r} />;
}

/** One project's block: it reads its own agents and its own ⌥ numbers (held while ⌥ is down). */
const ProjectBlock = memo(function ProjectBlock({ p, pinned, folded, all, fold, showMore }: {
  p: ProjectRow;
  pinned: readonly string[];
  folded: boolean;
  all: boolean;
  fold: (p: string) => void;
  showMore: (p: string) => void;
}) {
  const route = useRoute();
  const agents = useAgents(p.project);
  // agent-rank: the hub's rank as ⌥ numbers, held while ⌥ is down and 5 s after a jump (agents/model)
  const alt = useModHeld('Alt');
  const at = route.screen === 'thread' && route.project === p.project ? route.agent : undefined;
  const rows = projectBlockOf({ p, agents, numbers: numbersOf(p.project, agents, alt), pinned, folded, all, ...(at === undefined ? {} : { at }) });
  return (
    <>
      {rows.map((r) => (
        <SideItem key={r.kind === 'agent' ? `a:${r.a.name}` : r.kind} r={r} fold={fold} showMore={showMore} />
      ))}
    </>
  );
});

function SideItem({ r, fold, showMore }: { r: SideRow; fold?: (p: string) => void; showMore?: (p: string) => void }) {
  switch (r.kind) {
    case 'label':
      return null;
    case 'project':
      return <ProjectItem p={r.p} open={r.open} end={r.end} fold={fold} />;
    case 'agent':
      return <AgentItem project={r.project} name={r.a.name} main={r.a.main} on={r.on} end={r.end} stopped={r.stopped} pinned={r.pinned} />;
    case 'more':
      return (
        <Row
          kind="more"
          name={r.open ? frame.show_less : frame.show_more({ n: r.n })}
          onClick={() => {
            showMore?.(r.project);
          }}
          testId={`app.side.more.${r.project}`}
        />
      );
  }
}

/** '+' at the Projects label's end: add a project (the add-a-project sheet). */
function AddProject() {
  const router = useRouter();
  return (
    <Press
      look="app-s-add"
      aria-label={panel.add_project}
      {...tipAttrs(panel.add_project)}
      onClick={() => {
        addProject(router);
      }}
      data-testid="app.side.add"
    >
      <AppIcon name="plus" size={14} />
    </Press>
  );
}

function ProjectItem({ p, open, end, fold }: { p: ProjectRow; open: boolean; end: RowEnd; fold: ((p: string) => void) | undefined }) {
  const store = useStore();
  const menu = useEntityMenu({ kind: 'project', project: p.project });
  const [renaming, setRenaming] = useState(false);
  // the menu's Rename takes its new name here, inline (app/menus/actions.ts)
  useEntityAction('rename', (e) => {
    if (e.kind !== 'project' || e.project !== p.project) return false;
    setRenaming(true);
    return true;
  });
  const id = `app.side.project.${p.project}`;
  if (renaming) {
    const done = (name: string | null) => {
      setRenaming(false);
      const n = name?.trim() ?? '';
      if (n !== '' && n !== p.name) store.command({ cmd: 'project_rename', project: p.project, name: n });
    };
    return (
      <div className="app-s-row project" data-testid={`${id}.rename`}>
        <AppIcon name="folder" size={16} />
        <Input
          look="app-s-rename"
          autoFocus
          defaultValue={p.name}
          aria-label={p.name}
          onFocus={(e) => {
            e.currentTarget.select();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') done(e.currentTarget.value);
            else if (e.key === 'Escape') {
              e.stopPropagation();
              done(null);
            }
          }}
          onBlur={(e) => {
            done(e.currentTarget.value);
          }}
          data-testid={`${id}.rename.field`}
        />
      </div>
    );
  }
  return (
    <Row
      kind="project"
      icon="folder"
      name={p.name}
      expanded={open}
      end={<End end={end} testId={id} />}
      onClick={() => {
        fold?.(p.project);
      }}
      onContextMenu={menu.onContextMenu}
      testId={id}
    />
  );
}

function AgentItem({ project, name, main, on, end, stopped, pinned }: { project: string; name: string; main: boolean; on: boolean; end: RowEnd; stopped: boolean; pinned: boolean }) {
  const router = useRouter();
  const menu = useEntityMenu({ kind: 'agent', project, agent: name });
  const id = pinned ? `app.side.pin.${project}.${name}` : `app.side.agent.${project}.${name}`;
  return (
    <Row
      kind="agent"
      // a project's lead is bise, as everywhere (the TUI's panel too)
      name={main ? panel.bise : name}
      on={on}
      stopped={stopped}
      end={<End end={end} testId={id} />}
      onClick={() => {
        router.go({ screen: 'thread', project, agent: main ? MAIN : name });
      }}
      onContextMenu={menu.onContextMenu}
      testId={id}
    />
  );
}
