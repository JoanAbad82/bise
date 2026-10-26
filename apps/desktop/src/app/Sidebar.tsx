// The sidebar (bise fait mac, page native-mac §6, mockup 1): beside the rail under the bar, 240
// wide (200-320 by its border, kept: frame-state.ts), --p-raised 82% with a 12 top-left corner.
// 'New project ⌘N' first (his m_44225: he rarely makes an agent by hand, he talks to main), then
// 'New agent ⇧⌘N' and 'Search ⌘K'; then bise's own row (its ':*', what waits in all his projects,
// ⌘0; as on main), 'Pinned' (pins.ts, his own shortcuts) and 'Projects': one
// row per project, a click opens it (its main), no agent under it (round 2, his r2-img11: the
// agents live on the right side), at its end one fact (what waits on him, else its agents at work)
// and, ⌘ held, its ⌘1-9 digit: siderows.ts decides, this draws. Its head stays, its list scrolls;
// a right click on a pin or a project opens its menu (useEntityMenu, nm-menus'). On the artifacts
// library (decision d2) it shows '← Projects' and the library (artifacts' ArtLibrary) at the same
// width, a 160 ms crossfade. Owner: r2-pointer this round (nm-frame's, archived).
//
// Each project row and each pin read their own project's agents (useAgents): an event re-renders
// the row it touches, never the sidebar, and a thread's entries never do.
import { memo, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { AppIcon, Input, tipAttrs, type AppIconName, Press } from '@/ds';
import type { ProjectRow } from '@/proto';
import { frame } from '@/proto/words_frame.gen';
import { panel } from '@/proto/words_panel.gen';
import { useAgents, useProjects, useStore } from '@/store';
import { ArtLibrary } from '@/artifacts';
import { SettingsNav } from '@/settings/nav';
import { useProjectWaiting, useWaitingCount } from '@/inbox/waiting';
import { common } from '@/proto/words.gen';
import { useEntityMenu } from './menus/use';
import { useEntityAction } from './menus/actions';
import { MAIN, projectOf } from './route';
import { useRoute, useRouter } from './router';
import { useKeptScroll } from './keep';
import { useModHeld } from './held';
import { LiveBiseMark } from './Marks';
import { usePinned, type Pin } from './pins';
import { newAgent } from './newagent';
import { addProject } from './addProject';
import { pinRowOf, projectRowOf, projectsOf, type ProjectEnd, type RowEnd } from './siderows';
import { waitsTip, workingTip } from './tipwords';

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

/** A project row's end (designer m_44271, the bubbles' grammar): the count in the accent when
 * something waits on him, else the ring and the count in text-3; ⌘ held, its digit in their place. */
function ProjectEndView({ end, digit, testId }: { end: ProjectEnd; digit: number | undefined; testId: string }) {
  if (digit !== undefined) return <kbd data-testid={`${testId}.digit`}>{`⌘${String(digit)}`}</kbd>;
  if (end === null) return null;
  if (end.kind === 'waits') return <span className="app-s-cnt waits" data-testid={`${testId}.waits`}>{end.n}</span>;
  return (
    <span className="app-s-cnt" data-testid={`${testId}.works`}>
      <span className="app-s-ring" />
      {end.n}
    </span>
  );
}

/** A project's tip: '2 agents working · 1 waiting for you', 'all quiet'. Pure. */
export function projectRowTip(working: number, waits: number): string {
  const parts = [...(working > 0 ? [workingTip(working)] : []), ...(waits > 0 ? [waitsTip(waits)] : [])];
  return parts.length === 0 ? common.all_quiet : parts.join(' · ');
}

/** A pinned agent's end: the accent dot (it waits on him) or the ring (it works), each with its tip; nothing else. */
function End({ end, testId }: { end: RowEnd; testId: string }) {
  if (end === 'waits') return <span className="app-s-dot" {...tipAttrs(panel.asks_you)} data-testid={`${testId}.waits`} />;
  if (end === 'works') return <span className="app-s-ring" {...tipAttrs(panel.state_working)} data-testid={`${testId}.works`} />;
  return null;
}

function Row({ kind, icon, name, end, on, stopped, tip, onClick, onContextMenu, testId }: {
  kind: 'top' | 'project' | 'agent' | 'back';
  icon?: AppIconName;
  name: string;
  end?: ReactNode;
  on?: boolean;
  stopped?: boolean;
  /** the row's whole story on hover (a project's: '2 agents working · 1 waiting for you') */
  tip?: string;
  onClick: () => void;
  onContextMenu?: (e: MouseEvent<HTMLElement>) => void;
  testId: string;
}) {
  return (
    <Press
      look={`app-s-row ${kind}${on === true ? ' on' : ''}${stopped === true ? ' stopped' : ''}`}
      aria-current={on === true ? 'page' : undefined}
      {...tipAttrs(tip)}
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

export function Sidebar({ onSearch }: { onSearch: () => void }) {
  const route = useRoute();
  const router = useRouter();
  const home = useProjects().find((p) => p.home)?.project;
  // d2: the artifacts library takes the projects' place on artifacts, at the same width
  const library = route.screen === 'artifacts';
  const here = projectOf(route) ?? home;
  return (
    <aside className="app-side" data-testid="app.sidebar" data-library={library || undefined}>
      {/* on settings the sidebar is the settings nav alone (designer m_44447) */}
      {route.screen !== 'settings' && (
        <div className="app-s-head">
          <Row
            kind="top"
            icon="folderPlus"
            name={frame.new_project}
            end={<kbd>⌘N</kbd>}
            onClick={() => {
              addProject(router);
            }}
            testId="app.side.new-project"
          />
          <Row
            kind="top"
            icon="rename"
            name={frame.new_agent}
            end={<kbd>⇧⌘N</kbd>}
            onClick={() => {
              if (here !== undefined) newAgent(here);
            }}
            testId="app.side.new"
          />
          <Row kind="top" icon="search" name={frame.search} end={<kbd>⌘K</kbd>} onClick={onSearch} testId="app.side.search" />
        </div>
      )}
      {/* the swap is a crossfade (app.css .app-s-swap): a new key fades the other list in */}
      <div className="app-s-swap" key={library ? 'library' : route.screen === 'settings' ? 'settings' : 'projects'}>
        {library ? <LibraryList /> : route.screen === 'settings' ? <SettingsNav /> : <ProjectList />}
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
  // ⌘ held: each project row shows its ⌘1-9 (keys.ts opens it), the held hints' delay (held.ts)
  const cmd = useModHeld('Meta');
  const route = useRoute();
  // where he was in a long sidebar comes back after a reload (keep.ts)
  useKeptScroll('sidebar', () => document.querySelector<HTMLElement>('[data-testid="app.side.list"]'));
  const projects = projectsOf(rows);
  const here = projectOf(route);
  return (
    <div className="app-s-list" data-testid="app.side.list">
      <BiseRow cmd={cmd} />
      {pins.length > 0 && <PinnedList pins={pins} />}
      <Label testId="app.side.label.projects" end={<AddProject />}>
        {frame.projects}
      </Label>
      {projects.map((p, i) => (
        <ProjectItem key={p.project} p={p} index={i} on={p.project === here} cmd={cmd} />
      ))}
    </div>
  );
}

/**
 * bise's own row above the projects, as on main (native-lead m_44419): its live ':*' mark, 'bise',
 * what waits on him in all his projects (the inbox's one number, in the accent); ⌘ held, ⌘0. It
 * opens bise's place; marked there and on bise's own main (the home project stays out of the list).
 */
function BiseRow({ cmd }: { cmd: boolean }) {
  const route = useRoute();
  const router = useRouter();
  const waits = useWaitingTotal();
  const home = useProjects().find((p) => p.home)?.project;
  const on = route.screen === 'bise' || (home !== undefined && route.screen === 'thread' && route.project === home && route.agent === MAIN);
  const id = 'app.side.bise';
  return (
    <Press
      look={`app-s-row bise${on ? ' on' : ''}`}
      aria-current={on ? 'page' : undefined}
      onClick={() => {
        router.go({ screen: 'bise' });
      }}
      data-testid={id}
    >
      <LiveBiseMark size={16} testId={`${id}.mark`} />
      <CutName name={panel.bise} />
      {cmd ? (
        <span className="app-s-end">
          <kbd data-testid={`${id}.digit`}>⌘0</kbd>
        </span>
      ) : (
        waits > 0 && (
          <span className="app-s-end">
            <span className="app-s-cnt waits" {...tipAttrs(waitsTip(waits, true))} data-testid={`${id}.waits`}>
              {waits}
            </span>
          </span>
        )
      )}
    </Press>
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
  return r === null || r.kind !== 'agent' ? null : <PinRow project={r.project} name={r.a.name} main={r.a.main} on={r.on} end={r.end} stopped={r.stopped} />;
}

/** '+' at the Projects label's end: add a project (the add-a-project sheet). */
function AddProject() {
  const router = useRouter();
  return (
    <Press
      look="app-s-add"
      aria-label={frame.add_project}
      {...tipAttrs(frame.add_project)}
      onClick={() => {
        addProject(router);
      }}
      data-testid="app.side.add"
    >
      <AppIcon name="plus" size={14} />
    </Press>
  );
}

/** One project's row: it reads its own agents and its waiting count, so an event re-renders it alone. */
const ProjectItem = memo(function ProjectItem({ p, index, on, cmd }: { p: ProjectRow; index: number; on: boolean; cmd: boolean }) {
  const store = useStore();
  const router = useRouter();
  const agents = useAgents(p.project);
  // what waits on him: the inbox's own count for this project (what he just answered left out)
  const waits = useProjectWaiting(p);
  const r = projectRowOf({ p, agents, waits, index, on, cmd });
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
      on={r.kind === 'project' && r.on}
      tip={r.kind === 'project' ? projectRowTip(r.working, r.waits) : undefined}
      end={r.kind === 'project' ? <ProjectEndView end={r.end} digit={r.digit} testId={id} /> : null}
      onClick={() => {
        router.go({ screen: 'thread', project: p.project, agent: MAIN });
      }}
      onContextMenu={menu.onContextMenu}
      testId={id}
    />
  );
});

/** A pinned agent's row: his own shortcut to it (pins.ts); its end the dot or the ring. */
function PinRow({ project, name, main, on, end, stopped }: { project: string; name: string; main: boolean; on: boolean; end: RowEnd; stopped: boolean }) {
  const router = useRouter();
  const menu = useEntityMenu({ kind: 'agent', project, agent: name });
  const id = `app.side.pin.${project}.${name}`;
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
