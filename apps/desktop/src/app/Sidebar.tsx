// The sidebar (bise fait mac, page native-mac §6, mockup 1): beside the rail under the bar, 240
// wide (200-320 by its border, kept: frame-state.ts), --p-raised 82% with a 12 top-left corner.
// Its head, in his order (round 3, main m_44657): bise's own row (its ':*', what waits in all his
// projects, ⌘0; as on main), 'Search ⌘K', 'New project ⌘N' (no New agent row: he talks to main;
// ⇧⌘N stays in keys.ts, the File menu, the project menu and ⌘K). Then 'Pinned' (pins.ts, his own
// shortcuts) and 'Projects': one
// row per project, a click opens it (its main), no agent under it (round 2, his r2-img11: the
// agents live on the right side), as Gabriel's H1 (round 3, designer m_44783): its name and the
// inbox pill or its age, one plain sentence and its week's day bars, a quiet one on one line; ⌘
// held, its ⌘1-9 digit: siderows.ts and projectfacts.ts decide, this draws; the project in view is
// marked seen (seen.ts). Its head stays, its list scrolls;
// a right click on a pin or a project opens its menu (useEntityMenu, nm-menus'). On the artifacts
// library (decision d2) it shows '← Projects' and the library (artifacts' ArtLibrary) at the same
// width, a 160 ms crossfade. Owner: r3-projects this round (nm-frame's, archived).
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
import { PLACE_KEYS } from '@/settings/keys';
import { useProjectWaiting, useWaitingCount } from '@/inbox/waiting';
import { useEntityMenu } from './menus/use';
import { useEntityAction } from './menus/actions';
import { MAIN, projectOf } from './route';
import { useRoute, useRouter } from './router';
import { useKeptScroll } from './keep';
import { useModHeld } from './held';
import { LiveBiseMark, WorkingMark } from './Marks';
import { usePinned, type Pin } from './pins';
import { addProject } from './addProject';
import { pinRowOf, projectRowOf, projectsOf, type RowEnd } from './siderows';
import { BAR_GAP, BAR_H, BAR_W, weekBars, type DayBar, type ProjectFacts } from './projectfacts';
import { useMarkSeen, useSeen } from './seen';
import { useNow } from './clock';
import { projects } from '@/proto/words_projects.gen';
import { waitsTip } from './tipwords';

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

/** A bar's shape: bottom-aligned, its top corners rounded 1 (a stub of 1 px stays square). */
function barPath(b: DayBar): string {
  const y = BAR_H - b.h;
  const r = b.h >= 2 ? 1 : 0;
  return `M${String(b.x)} ${String(BAR_H)}V${String(y + r)}Q${String(b.x)} ${String(y)} ${String(b.x + r)} ${String(y)}H${String(b.x + BAR_W - r)}Q${String(b.x + BAR_W)} ${String(y)} ${String(b.x + BAR_W)} ${String(y + r)}V${String(BAR_H)}Z`;
}

/**
 * A project's week (H1, designer m_45992): 7 day bars in 40 x 12, text-3, today's in text-2; the
 * row's hover wakes them all to text-2, the bar under the pointer goes to ink and its tip (its day,
 * its work) shows instead of the row's. Each bar's hover column is its full height and half of
 * each gap beside it.
 */
function Week({ week, now, testId }: { week: readonly number[]; now: number; testId: string }) {
  const bars = weekBars(week, now);
  const width = bars.length * (BAR_W + BAR_GAP) - BAR_GAP;
  return (
    <svg className="app-s-week" viewBox={`0 0 ${String(width)} ${String(BAR_H)}`} role="img" aria-label={projects.week_tip} data-testid={testId}>
      {bars.map((b, i) => (
        <g key={i} className={`app-s-day${b.today ? ' today' : ''}`} {...tipAttrs(b.tip)} data-testid={`${testId}.${String(i)}`}>
          <rect x={b.hx} y={0} width={b.hw} height={BAR_H} />
          <path d={barPath(b)} />
        </g>
      ))}
    </svg>
  );
}

/** A project's line-1 end: ⌘ held, its digit; else the inbox pill (what waits on him), else its age. */
function ProjectEnd({ facts, digit, testId }: { facts: ProjectFacts; digit: number | undefined; testId: string }) {
  if (digit !== undefined) return <kbd data-testid={`${testId}.digit`}>{`⌘${String(digit)}`}</kbd>;
  if (facts.pill !== null)
    return (
      <span className="app-s-pill" {...tipAttrs(projects.pill_tip({ n: facts.pill }))} data-testid={`${testId}.pill`}>
        {facts.pill}
      </span>
    );
  if (facts.age === null) return null;
  return (
    <span className="app-s-age" data-testid={`${testId}.age`}>
      {facts.age}
    </span>
  );
}

/**
 * A project's row, Gabriel's H1 (designer m_44783): two calm lines, its name and its pill or age,
 * then one plain sentence and its week; a quiet one is its name in text-2 and its age, one line.
 * No icon, no mark, no border: the words say it, the tip says it all.
 */
function ProjectRowView({ name, facts, on, digit, now, onClick, onContextMenu, testId }: {
  name: string;
  facts: ProjectFacts;
  on: boolean;
  /** the week's bars name their days from it */
  now: number;
  digit: number | undefined;
  onClick: () => void;
  onContextMenu: (e: MouseEvent<HTMLElement>) => void;
  testId: string;
}) {
  return (
    <Press
      look={`app-s-row project${facts.quiet ? ' quiet' : ''}${on ? ' on' : ''}`}
      aria-current={on ? 'page' : undefined}
      {...tipAttrs(facts.tip)}
      onClick={onClick}
      onContextMenu={onContextMenu}
      data-testid={testId}
    >
      <span className="app-s-l1">
        <CutName name={name} />
        <span className="app-s-end">
          <ProjectEnd facts={facts} digit={digit} testId={testId} />
        </span>
      </span>
      {facts.sentence !== null && (
        <span className="app-s-l2">
          <span className={`app-s-say${facts.sentence.err ? ' err' : ''}`} data-testid={`${testId}.say`}>
            {facts.sentence.text}
          </span>
          {facts.week !== null && <Week week={facts.week} now={now} testId={`${testId}.week`} />}
        </span>
      )}
    </Press>
  );
}

/** A pinned agent's end: the accent dot (it waits on him) or main's breath (it works), each with its tip; nothing else. */
export function AgentEnd({ end, testId }: { end: RowEnd; testId: string }) {
  if (end === 'waits') return <span className="app-s-dot" {...tipAttrs(panel.asks_you)} data-testid={`${testId}.waits`} />;
  if (end === 'works') return <WorkingMark testId={`${testId}.works`} />;
  return null;
}

function Row({ kind, icon, name, end, on, stopped, tip, onClick, onContextMenu, testId }: {
  kind: 'top' | 'agent' | 'back';
  icon?: AppIconName;
  name: string;
  end?: ReactNode;
  on?: boolean;
  stopped?: boolean;
  /** the row's whole story on hover */
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
  // d2: the artifacts library takes the projects' place on artifacts, at the same width
  const library = route.screen === 'artifacts';
  return (
    <aside className="app-side" data-testid="app.sidebar" data-library={library || undefined}>
      {/* on settings the sidebar is the settings nav alone (designer m_44447) */}
      {route.screen !== 'settings' && (
        <div className="app-s-head">
          <BiseRow />
          <Row kind="top" icon="search" name={frame.search} end={<kbd>{PLACE_KEYS.search}</kbd>} onClick={onSearch} testId="app.side.search" />
          <Row
            kind="top"
            icon="folderPlus"
            name={frame.new_project}
            end={<kbd>{PLACE_KEYS.newProject}</kbd>}
            onClick={() => {
              addProject(router);
            }}
            testId="app.side.new-project"
          />
        </div>
      )}
      {/* the swap is a crossfade (app.css .app-s-swap): a new key fades the other list in */}
      <div className="app-s-swap" key={library ? 'library' : route.screen === 'settings' ? 'settings' : 'projects'}>
        {library ? <LibraryList /> : route.screen === 'settings' ? <SettingsNav /> : <ProjectList />}
      </div>
    </aside>
  );
}

/** d2: '← Projects' back (esc and ⌘[ too: router's back), then the library (nm-pages-a's ArtLibrary);
 *  ⌘ held, its rows' ⌘1-9 as the projects' (keys.ts opens them; rail-keys). */
function LibraryList() {
  const router = useRouter();
  const cmd = useModHeld('Meta');
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
      <ArtLibrary digits={cmd} />
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
  const list = projectsOf(rows);
  const here = projectOf(route);
  // he looked at the project in view: its news, artifacts and unread are seen (seen.ts)
  useMarkSeen(here);
  const seen = useSeen();
  const now = useNow();
  return (
    <div className="app-s-list" data-testid="app.side.list">
      {pins.length > 0 && <PinnedList pins={pins} />}
      <Label testId="app.side.label.projects" end={<AddProject />}>
        {frame.projects}
      </Label>
      {list.map((p, i) => (
        <ProjectItem key={p.project} p={p} index={i} on={p.project === here} cmd={cmd} seen={seen(p.project)} now={now} />
      ))}
    </div>
  );
}

/**
 * bise's own row, the sidebar's first (his r3 order: bise, Search, New project): its live ':*' mark,
 * 'bise', what waits on him in all his projects (the inbox's one number, the projects' accent pill); ⌘ held, ⌘0.
 * It opens bise's place; marked there and on bise's own main (the home project stays out of the list).
 */
function BiseRow() {
  const cmd = useModHeld('Meta');
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
          <kbd data-testid={`${id}.digit`}>{PLACE_KEYS.bise}</kbd>
        </span>
      ) : (
        waits > 0 && (
          <span className="app-s-end">
            <span className="app-s-pill" {...tipAttrs(waitsTip(waits, true))} data-testid={`${id}.waits`}>
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
const ProjectItem = memo(function ProjectItem({ p, index, on, cmd, seen, now }: { p: ProjectRow; index: number; on: boolean; cmd: boolean; seen: number | undefined; now: number }) {
  const store = useStore();
  const router = useRouter();
  const agents = useAgents(p.project);
  // what waits on him: the inbox's own count for this project (what he just answered left out)
  const waits = useProjectWaiting(p);
  const r = projectRowOf({ p, agents, waits, index, on, cmd, seen, now });
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
      <div className="app-s-row project quiet" data-testid={`${id}.rename`}>
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
  if (r.kind !== 'project') return null;
  return (
    <ProjectRowView
      name={p.name}
      facts={r.facts}
      on={r.on}
      digit={r.digit}
      now={now}
      onClick={() => {
        router.go({ screen: 'thread', project: p.project, agent: MAIN });
      }}
      onContextMenu={menu.onContextMenu}
      testId={id}
    />
  );
});

/** A pinned agent's row: his own shortcut to it (pins.ts); its end the dot or the breath. */
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
      end={<AgentEnd end={end} testId={id} />}
      onClick={() => {
        router.go({ screen: 'thread', project, agent: main ? MAIN : name });
      }}
      onContextMenu={menu.onContextMenu}
      testId={id}
    />
  );
}
