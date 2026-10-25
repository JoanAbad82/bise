// src/app/side3d · SideHost: the right side, folded (page native-mac §7, variant A): the bims'
// world floating at the top right (World), the 3D bubbles under it (Bubbles) and their 360 cards
// (Flyout*). Mounted at the shell's root by App.tsx, position fixed under the window's bar,
// outside .app-main and .app-screen, so no parent's overflow clips the world's or an object's
// shadow (plan §2; ds/noclip.ts checks it). It computes the window's sideLayout (place.ts: at a
// resize's end, a sidebar or panel fold) and hides while the tabbed panel is open (the world's
// office unmounted: no loop while hidden). The project is the route's (bise's home on a page with
// none). One card open at a time: a bubble's click or ⌥⌘1-⌥⌘4 (keys.ts) toggle it; esc and a click
// outside close it. Places, in px under the bar: the world 12 from the top and the right edge; the
// bubbles 12 from the right, 152 from the top, 80 apart (44 + 36), never moving (the big world
// floats over them, designer m_42536); with the world folded into a bubble, it is the stack's
// first, at 40; a card 68 from the right, 12 above its bubble's top, kept --float-room above the
// window's bottom. Under every palette, sheet and menu (z 15: over the composer's 10, under the
// palette's 20). Owner: nm-side.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNowFor } from '../clock';
import { useRoute, useRouter } from '../router';
import { MAIN, projectOf } from '../route';
import { useMenuAction } from '../menu';
import { inRank, agentCounts, bubbleCount, bubbleName, bubbleSays, bubbleTip, answerFrom, type Counts } from './model';
import { BUBBLES, type BubbleId } from './objects';
import { Bubble, WORLD_NAME } from './Bubbles';
import { World, WorldThumb } from './World';
import { Empty, Flyout, HeadButton, SideLink } from './Flyout';
import { AgentLine } from './FlyoutAgents';
import { ArtifactRow, ProcRow, TaskRow, WatchRows } from './FlyoutLists';
import { onResizeEnd, useLayoutDriver, useSideLayout } from './place';
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
/** a card's top over its bubble's */
const CARD_UP = 12;
/** the room the window keeps at its bottom for the floating composer (--float-room): a card stops above it */
const FLOAT_ROOM = 84;
/** how many rows a card lists before 'all … ›' */
const ROWS = 6;

/** Where each bubble's top goes, px under the bar. Pure. */
export function bubbleTops(world: 'small' | 'bubble'): { readonly world: number | null; readonly bubbles: Readonly<Record<BubbleId, number>> } {
  const first = world === 'bubble' ? TOP_STACK + STEP : TOP_SMALL;
  const tops = Object.fromEntries(BUBBLES.map((b, i) => [b, first + i * STEP])) as Record<BubbleId, number>;
  return { world: world === 'bubble' ? TOP_STACK : null, bubbles: tops };
}

/**
 * How low a card may go, px from the window's top: 12 above the composer on screen (the thread's,
 * or the floating one), else --float-room above the bottom (ui-review: a card never covers his
 * composer). Reads the composers' boxes.
 */
export function cardFloor(doc: Document, winH: number): number {
  let floor = winH - FLOAT_ROOM;
  for (const el of doc.querySelectorAll('[data-testid="composer"], [data-testid="composer.float"]')) {
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.top > 0) floor = Math.min(floor, r.top - EDGE);
  }
  return floor;
}

/**
 * Where a card goes: `sideTop` the side's top on screen, `top` its natural top in the side (on its
 * bubble), `h` its height, `floor` how low it may go (cardFloor). It rises by `lift` until it ends
 * at the floor, never above EDGE; taller than that room, it is capped (`maxH`) and scrolls. Pure.
 */
export function cardPlace(sideTop: number, top: number, h: number, floor: number): { readonly lift: number; readonly maxH: number | undefined } {
  const room = floor - sideTop - EDGE;
  const lift = Math.min(Math.max(0, sideTop + top + h - floor), Math.max(0, top - EDGE));
  return { lift, maxH: h > room ? Math.max(0, room) : undefined };
}

/** The artifacts card's foot: how many, and in how many projects when more than one. Pure. */
export function artFoot(n: number, projects: number): string {
  if (n === 0) return '';
  return projects > 1 ? side.in_projects({ n, p: projects }) : side.artifact_count({ n });
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
  useLayoutDriver(winW, leftW, panel);
  const layout = useSideLayout();
  const route = useRoute();
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
  useMenuAction('side-1', () => {
    toggle('agents');
  });
  useMenuAction('side-2', () => {
    toggle('artifacts');
  });
  useMenuAction('side-3', () => {
    toggle('scheduled');
  });
  useMenuAction('side-4', () => {
    toggle('processes');
  });
  // esc and a click outside close the open card
  const root = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (open === null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(null);
    };
    const down = (e: PointerEvent) => {
      if (root.current !== null && e.target instanceof Node && root.current.contains(e.target)) return;
      setOpen(null);
    };
    window.addEventListener('keydown', key, true);
    window.addEventListener('pointerdown', down, true);
    return () => {
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('pointerdown', down, true);
    };
  }, [open]);
  // a card stays inside the window: measured once drawn, lifted when it would pass the bottom
  const card = useRef<HTMLDivElement | null>(null);
  const [place, setPlace] = useState<{ readonly lift: number; readonly maxH: number | undefined }>({ lift: 0, maxH: undefined });
  useLayoutEffect(() => {
    const el = card.current?.firstElementChild;
    const side = root.current;
    if (!(el instanceof HTMLElement) || side === null || open === null) {
      setPlace({ lift: 0, maxH: undefined });
      return;
    }
    // from its natural top (on its bubble) and its own height, never from where it was drawn last
    const measure = () => {
      setPlace(cardPlace(side.getBoundingClientRect().top, tops.bubbles[open] - CARD_UP, el.offsetHeight, cardFloor(document, window.innerHeight)));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- its bubble's top follows `open` and the layout
  }, [open, world]);
  const lift = place.lift;
  const here = route.screen === 'thread' ? { project: route.project, agent: route.agent } : { project: null, agent: null };
  const at = answerFrom(here, home);
  const openAgent = (agent: string) => {
    router.go({ screen: 'thread', project, agent });
  };
  const addPlace = useAddPlace(project);
  const cardTop = (b: BubbleId) => Math.max(EDGE, tops.bubbles[b] - CARD_UP - lift);
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
        <Bubble key={b} id={b} count={bubbleCount(b, counts)} tip={bubbleTip(b, counts)} open={open === b} top={tops.bubbles[b]} onClick={() => {
          toggle(b);
        }} />
      ))}
      <div ref={card}>
        {open === 'agents' && (
          <Flyout id="agents" name={bubbleName('agents')} says={bubbleSays('agents', counts)} top={cardTop('agents')} maxH={place.maxH}
            add={<HeadButton icon="plus" tip={side.new_agent} onClick={() => { newAgent(project); }} testId="app.flyout.agents.add" />}
            onPin={() => { openOverview(project, 'agents'); }}
            foot={{ left: archived > 0 ? side.archived({ n: archived }) : '', right: side.all_agents, onRight: () => { router.go({ screen: 'agents', project }); } }}>
            {live.length === 0 ? <Empty>{side.no_agents}</Empty> : live.map((a) => (
              <AgentLine key={a.name} project={project} a={a} cards={cards} at={at} onOpen={openAgent} />
            ))}
          </Flyout>
        )}
        {open === 'artifacts' && (
          <Flyout id="artifacts" name={bubbleName('artifacts')} says={bubbleSays('artifacts', counts)} top={cardTop('artifacts')} maxH={place.maxH}
            add={<AddButton place={addPlace} testId="app.flyout.artifacts.add" />}
            onPin={() => { openOverview(project, 'artifacts'); }}
            foot={{ left: artFoot(artifacts.length, new Set(artifacts.map((x) => x.project)).size), right: side.all_artifacts, onRight: () => { router.go({ screen: 'artifacts', project }); } }}>
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
            <Flyout id={open} name={bubbleName(open)} says={bubbleSays(open, counts)} top={cardTop(open)} maxH={place.maxH}
              onPin={() => { openOverview(project, 'processes'); }}
              link={{ text: open === 'processes' ? side.all_processes : side.all_scheduled, onClick: goAll[open] }}
              foot={null}>
              {rowsOf(open)}
              <div className="s3-card-sub" data-testid={`app.flyout.${open}.${other}`}>
                <b>{bubbleName(other)}</b>
                <span className="s3-card-says">{bubbleSays(other, counts)}</span>
                <SideLink onClick={goAll[other === 'processes' ? 'processes' : 'scheduled']} testId={`app.flyout.${open}.${other}.all`}>
                  {other === 'processes' ? side.all_processes : side.all_scheduled}
                </SideLink>
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
