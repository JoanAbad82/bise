// src/app/side3d · SideHost: the right side, folded (page native-mac §7, variant A): the bims'
// world floating at the top right (World), the 3D bubbles under it (Bubbles) and their 360 cards
// (Flyout*). Mounted at the shell's root by App.tsx, position fixed under the window's bar,
// outside .app-main and .app-screen, so no parent's overflow clips the world's or an object's
// shadow (plan §2; ds/noclip.ts checks it). It computes the window's sideLayout (place.ts: at a
// resize's end, a sidebar or panel fold) and hides while the tabbed panel is open or on a page
// that is no project's (layout sideShows: the inbox, scheduled, plugins, artifacts...; the world's
// office unmounted: no loop while hidden). The project is the route's (bise's home on a page with
// none). One card open at a time: a bubble's click, ⌥1-⌥4 (folded) or ⌥⌘1-⌥⌘4 (keys.ts) toggle it
// (by its key, its first row takes the focus); ⌥ held shows each bubble's key; ↑ ↓ walk the rows,
// ⏎ opens one; esc closes it (the focus back on its bubble), a click outside too. Places, in px
// under the bar: the world 12 from the top and the right edge; the bubbles 12 from the right, 152
// from the top, 80 apart (44 + 36), never moving (the big world floats over them, designer
// m_42536); with the world folded into a bubble, it is the stack's first, at 40; a card 68 from
// the right, its top on its bubble's, kept 24 inside the window and at most min(window − 48, 560)
// high (layout cardTop, cardMaxH): placed on open, at a resize's end and when its own height
// changes, never from where it was drawn (no measure loop). Under every palette, sheet and menu
// (z 15: over the composer's 10, under the palette's 20). Owner: nm-side.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNowFor } from '../clock';
import { useRoute, useRouter } from '../router';
import { MAIN, projectOf } from '../route';
import { useMenuAction } from '../menu';
import { useModHeld } from '../held';
import { inRank, agentCounts, bubbleCount, bubbleName, bubbleSays, bubbleTip, answerFrom, type Counts } from './model';
import { BUBBLES, type BubbleId } from './objects';
import { Bubble, WORLD_NAME } from './Bubbles';
import { World, WorldThumb } from './World';
import { Empty, Flyout, HeadButton } from './Flyout';
import { AgentLine } from './FlyoutAgents';
import { ArtifactRow, ProcRow, TaskRow, WatchRows } from './FlyoutLists';
import { onResizeEnd, useLayoutDriver, useSideLayout } from './place';
import { cardMaxH, cardTop, sideShows } from './layout';
import { newAgent, openOverview, openTab, useLeftWidth, usePanelBox } from './ports';
import { alarms } from '@/thread/wake';
import { useAgents, useCards, useProjects, useStore } from '@/store';
import { useAllArtifacts } from '@/artifacts';
import { AddButton, useAddPlace } from '@/artifacts/Drops';
import { useAllScheduled } from '@/scheduled';
import { endedAt, isRunning, today, useAllProcesses } from '@/running';
import { side } from '@/proto/words_side.gen';
import './side3d.css';

/** the world's top and right, px */
const EDGE = 12;
/** the first bubble's top under the world (the big one floats over them: they never move), as the 5th bubble's stack */
const TOP_SMALL = 152;
const TOP_STACK = 40;
/** one bubble and the room to the next: 44 + 36 */
const STEP = 80;
/** how many rows a card lists before 'all … ›' */
const ROWS = 6;

/** Where each bubble's top goes, px under the bar. Pure. */
export function bubbleTops(world: 'small' | 'bubble'): { readonly world: number | null; readonly bubbles: Readonly<Record<BubbleId, number>> } {
  const first = world === 'bubble' ? TOP_STACK + STEP : TOP_SMALL;
  const tops = Object.fromEntries(BUBBLES.map((b, i) => [b, first + i * STEP])) as Record<BubbleId, number>;
  return { world: world === 'bubble' ? TOP_STACK : null, bubbles: tops };
}

/** A bubble's key while the side is folded ('⌥1' for the first, top to bottom: keys.ts). Pure. */
export const bubbleKey = (b: BubbleId): string => `⌥${String(BUBBLES.indexOf(b) + 1)}`;

/** The row ↑ (-1) or ↓ (+1) goes to from `at` (-1: none focused: ↓ the first, ↑ the last), kept in the card's `n` rows. Pure. */
export function rowStep(at: number, n: number, by: 1 | -1): number {
  if (at < 0) return by === 1 ? 0 : n - 1;
  return Math.min(n - 1, Math.max(0, at + by));
}

/** The artifacts card's foot: how many, and in how many projects when more than one. Pure. */
export function artFoot(n: number, projects: number): string {
  if (n === 0) return '';
  return projects > 1 ? side.in_projects({ n, p: projects }) : side.artifact_count({ n });
}

/** Where the open card is: its top (side px; null before its first measure: on its bubble) and whether its rows scroll (the 24 fade). */
interface CardPlace {
  readonly top: number | null;
  readonly scrolls: boolean;
}
const NO_PLACE: CardPlace = { top: null, scrolls: false };

/** The window's height, at each resize's end only. */
function useWinH(): number {
  const [h, setH] = useState(() => window.innerHeight);
  useEffect(() => onResizeEnd(() => {
    setH(window.innerHeight);
  }), []);
  return h;
}

/** The window's width, at each resize's end only. */
function useWinW(): number {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => onResizeEnd(setW), []);
  return w;
}

/** The world, the bubbles and their cards, over the window's right edge. */
export function SideHost() {
  const winW = useWinW();
  const leftW = useLeftWidth();
  const panel = usePanelBox();
  const route = useRoute();
  useLayoutDriver(winW, leftW, panel, sideShows(route));
  const layout = useSideLayout();
  const rows = useProjects();
  const home = rows.find((p) => p.home)?.project ?? '';
  const project = projectOf(route) ?? home;
  if (!layout.side || project === '') return null;
  return <Side key={project} project={project} home={home} world={layout.world} />;
}

function Side({ project, home, world }: { project: string; home: string; world: 'small' | 'big' | 'bubble' }) {
  const router = useRouter();
  const route = useRoute();
  const store = useStore();
  const rows = useProjects();
  const name = rows.find((p) => p.project === project)?.name || project;
  const agents = useAgents(project);
  const cards = useCards(project);
  const artifacts = useAllArtifacts(project);
  const tasks = useAllScheduled(project);
  const procs = useAllProcesses(project);
  // the processes are asked once here, as the old right bar did; the hub sends them again on each change
  useEffect(() => {
    store.command({ cmd: 'processes', project });
  }, [store, project]);
  const now = useNowFor(() => false);
  const live = useMemo(() => inRank(agents), [agents]);
  const watching = live.filter((a) => alarms(a, now).length > 0);
  const counts: Counts = {
    ...agentCounts(agents),
    artifacts: artifacts.length,
    newArtifacts: artifacts.filter((x) => x.a.new).length,
    timers: tasks.length,
    watches: live.reduce((n, a) => n + alarms(a, now).length, 0),
    running: procs.filter((x) => isRunning(x.p)).length,
    doneToday: procs.filter((x) => !isRunning(x.p) && today(endedAt(x.p) ?? 0, now)).length,
  };
  const [open, setOpen] = useState<BubbleId | null>(null);
  const tops = bubbleTops(world === 'bubble' ? 'bubble' : 'small');
  const toggle = (b: BubbleId) => {
    setOpen((o) => (o === b ? null : b));
  };
  // a card opened by its key (⌥1-4, ⌥⌘1-4): its first row takes the focus, so ⏎ opens it at once
  const keyed = useRef(false);
  const byKey = (b: BubbleId) => {
    keyed.current = true;
    toggle(b);
  };
  useMenuAction('side-1', () => {
    byKey('agents');
  });
  useMenuAction('side-2', () => {
    byKey('artifacts');
  });
  useMenuAction('side-3', () => {
    byKey('scheduled');
  });
  useMenuAction('side-4', () => {
    byKey('processes');
  });
  // ⌥ held alone: each bubble shows its key (held.ts; keys.ts gives ⌥1-4 to the folded side)
  const alt = useModHeld('Alt');
  // esc closes the open card and gives the focus back to its bubble, ↑ ↓ walk its rows (the
  // focus ring), ⏎ opens the focused one (its button's own); a click outside closes it
  const root = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (open === null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const rows = [...(root.current?.querySelectorAll<HTMLElement>('.s3-card [data-row]') ?? [])];
        if (rows.length === 0) return;
        e.preventDefault();
        e.stopPropagation();
        rows[rowStep(rows.indexOf(document.activeElement as HTMLElement), rows.length, e.key === 'ArrowDown' ? 1 : -1)]?.focus();
        root.current?.querySelector('.s3-card')?.setAttribute('data-kb', '');
        return;
      }
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(null);
      root.current?.querySelector<HTMLElement>(`[data-testid="app.bubble.${open}"]`)?.focus();
    };
    const down = (e: PointerEvent) => {
      // the pointer in the card: its rows' focus is the pointer's again (no ring on a clicked row)
      root.current?.querySelector('.s3-card')?.removeAttribute('data-kb');
      if (root.current !== null && e.target instanceof Node && root.current.contains(e.target)) return;
      setOpen(null);
    };
    // opened by its key: its first row focused, its ring shown at once (data-kb: a focus() after a
    // menu accelerator is not :focus-visible in Chromium)
    if (keyed.current) {
      root.current?.querySelector('.s3-card')?.setAttribute('data-kb', '');
      root.current?.querySelector<HTMLElement>('.s3-card [data-row]')?.focus();
    }
    keyed.current = false;
    window.addEventListener('keydown', key, true);
    window.addEventListener('pointerdown', down, true);
    return () => {
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('pointerdown', down, true);
    };
  }, [open]);
  // a card stays inside the window: on its bubble's top, lifted only as far as its drawn height
  // needs. Its height cap is the window's (cardMaxH), never its place's: a new measure of the same
  // card gives the same top, so nothing moves unless its rows, its bubble or the window change.
  const card = useRef<HTMLDivElement | null>(null);
  const winH = useWinH();
  const [place, setPlace] = useState<CardPlace>(NO_PLACE);
  // the place drawn last: a measure that finds it again sets nothing (not even a bailed-out render)
  const placed = useRef<CardPlace>(NO_PLACE);
  const put = (next: CardPlace) => {
    if (next.top === placed.current.top && next.scrolls === placed.current.scrolls) return;
    placed.current = next;
    setPlace(next);
  };
  useLayoutEffect(() => {
    const el = card.current?.firstElementChild;
    const side = root.current;
    if (!(el instanceof HTMLElement) || side === null || open === null) {
      put(NO_PLACE);
      return;
    }
    const sideTop = side.getBoundingClientRect().top;
    const bubble = tops.bubbles[open];
    const measure = () => {
      const body = el.querySelector('.s3-card-body');
      const next: CardPlace = { top: cardTop(sideTop, bubble, el.offsetHeight, winH), scrolls: body !== null && body.scrollHeight > body.clientHeight };
      put(next);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- its bubble's top follows `open` and the layout
  }, [open, world, winH]);
  const here = route.screen === 'thread' ? { project: route.project, agent: route.agent } : { project: null, agent: null };
  const at = answerFrom(here, home);
  const openAgent = (agent: string) => {
    router.go({ screen: 'thread', project, agent });
  };
  const addPlace = useAddPlace(project);
  const says = [side.at_desks({ n: live.length }), counts.asks > 0 ? side.asks({ n: counts.asks }) : ''].filter((s) => s !== '').join(' · ');
  const archived = agents.filter((a) => a.archived).length;
  const running = procs.filter((x) => isRunning(x.p));
  return (
    <div className="s3-side" ref={root} data-world={world} data-testid="app.side">
      {world !== 'bubble' && (
        <div className="s3-world-at" style={{ top: EDGE, right: EDGE }}>
          <World project={project} name={name} says={says} agents={live} cards={cards} frozen={open !== null} onOpen={() => {
            openTab({ kind: 'office', project });
          }} />
        </div>
      )}
      {tops.world !== null && (
        <Bubble id="world" count={{ n: 0, accent: false }} tip={WORLD_NAME} open={false} top={tops.world}
          pic={<WorldThumb project={project} agents={live} cards={cards} />} onClick={() => {
            openTab({ kind: 'office', project });
          }} />
      )}
      {BUBBLES.map((b) => (
        <Bubble key={b} id={b} count={bubbleCount(b, counts)} tip={bubbleTip(b, counts)} open={open === b} top={tops.bubbles[b]}
          hint={alt ? bubbleKey(b) : undefined} onClick={() => {
          toggle(b);
        }} />
      ))}
      <div ref={card}>
        {open === 'agents' && (
          <Flyout id="agents" name={bubbleName('agents')} says={bubbleSays('agents', counts)} top={place.top ?? tops.bubbles['agents']} maxH={cardMaxH(winH)} scrolls={place.scrolls}
            add={<HeadButton icon="plus" tip={side.new_agent} onClick={() => { newAgent(project); }} testId="app.flyout.agents.add" />}
            onPin={() => { openOverview(project, 'agents'); }}
            foot={{ left: archived > 0 ? side.archived({ n: archived }) : '', links: [{ text: side.all_agents, testId: 'app.flyout.agents.all', onClick: () => { router.go({ screen: 'agents', project }); } }] }}>
            {live.length === 0 ? <Empty>{side.no_agents}</Empty> : live.map((a) => (
              <AgentLine key={a.name} project={project} a={a} cards={cards} at={at} onOpen={openAgent} />
            ))}
          </Flyout>
        )}
        {open === 'artifacts' && (
          <Flyout id="artifacts" name={bubbleName('artifacts')} says={bubbleSays('artifacts', counts)} top={place.top ?? tops.bubbles['artifacts']} maxH={cardMaxH(winH)} scrolls={place.scrolls}
            add={<AddButton place={addPlace} testId="app.flyout.artifacts.add" />}
            onPin={() => { openOverview(project, 'artifacts'); }}
            foot={{ left: artFoot(artifacts.length, new Set(artifacts.map((x) => x.project)).size), links: [{ text: side.all_artifacts, testId: 'app.flyout.artifacts.all', onClick: () => { router.go({ screen: 'artifacts', project }); } }] }}>
            {artifacts.length === 0 ? <Empty>{side.no_artifacts}</Empty> : artifacts.slice(0, ROWS).map((it) => <ArtifactRow key={`${it.project}/${it.a.id}`} it={it} now={now} />)}
          </Flyout>
        )}
        {(open === 'processes' || open === 'scheduled') && (() => {
          // one card for both (mockup 15), the clicked kind first under the card's head, the other under it
          const other: BubbleId = open === 'processes' ? 'scheduled' : 'processes';
          const goAll: Record<'processes' | 'scheduled', () => void> = {
            processes: () => { router.go({ screen: 'running', scope: { project } }); },
            scheduled: () => { router.go({ screen: 'scheduled' }); },
          };
          const rowsOf = (k: 'processes' | 'scheduled') =>
            k === 'processes' ? (
              running.length === 0 ? <Empty>{side.no_processes}</Empty> : running.slice(0, ROWS).map((x) => <ProcRow key={`${x.p.agent}/${x.p.id}`} x={x} now={now} />)
            ) : tasks.length === 0 && watching.length === 0 ? <Empty>{side.no_scheduled}</Empty> : (
              <>
                {tasks.slice(0, ROWS).map((x) => <TaskRow key={x.t.id} x={x} now={now} />)}
                {watching.map((a) => <WatchRows key={a.name} project={project} a={a} now={now} onOpen={openAgent} />)}
              </>
            );
          return (
            <Flyout id={open} name={bubbleName(open)} says={bubbleSays(open, counts)} top={place.top ?? tops.bubbles[open]} maxH={cardMaxH(winH)} scrolls={place.scrolls}
              onPin={() => { openOverview(project, 'processes'); }}
              foot={{ left: '', links: [
                { text: open === 'processes' ? side.all_processes : side.all_scheduled, onClick: goAll[open], testId: `app.flyout.${open}.all` },
                { text: other === 'processes' ? side.all_processes : side.all_scheduled, onClick: goAll[other === 'processes' ? 'processes' : 'scheduled'], testId: `app.flyout.${open}.${other}.all` },
              ] }}>
              {rowsOf(open)}
              <div className="s3-card-sub" data-testid={`app.flyout.${open}.${other}`}>
                <b>{bubbleName(other)}</b>
                <span className="s3-card-says">{bubbleSays(other, counts)}</span>
              </div>
              {rowsOf(other === 'processes' ? 'processes' : 'scheduled')}
            </Flyout>
          );
        })()}
      </div>
    </div>
  );
}

/** main's name as a route's agent, for the world's legend */
export const LEAD = MAIN;
