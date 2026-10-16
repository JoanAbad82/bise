// The office in the right bar's AGENTS section (page bims-office v7; spec les-bims-sc-narios-du-bureau
// §1-§2): the canvas above the section's rows at the office's natural height (the renderer fits it
// to the width), a DOM overlay for the labels, the hover card and the '?' / '✗' pills over the
// bims' heads, and the loop. His camera (zoom.ts): a pinch (a ctrl wheel in Chromium) zooms around
// the pointer, two fingers or a drag move the view while zoomed, '⤢ fit', esc or a double-click on
// the floor go back to the whole office; each move draws one frame. The renderer (three.js) comes with import('./render') only once the office shows: the list
// never asks for it. The loop draws on demand (loop.ts): a kick (new rows, his message, a hover,
// ctrl held, a size or theme change) draws one frame, the next comes only while something moves;
// none while the window is away. A lost WebGL context (or a renderer that fails to load) shows one
// line over the rows, never a blank section. Hover: the bim under the pointer (renderer.pick) shows
// its card after the tip's 400 ms (at once for 1 s after one closed, the ds tips' warmth); a click
// opens it as its row's click does. Owner: bims-wire.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Press, tipAttrs } from '@/ds';
import { reducedMotion, textWidth } from '@/ds/hooks';
import type { Agent, Card, Place } from '@/proto';
import { bims } from '@/proto/words_bims.gen';
import { useModHeld } from '@/app/held';
import type { ActivitiesFn, ActivityKind, BimEvent, BimFrame, Label, LabelsFn, LayoutFn, Look, MakeRenderer, NewTimelineFn, Office as OfficeMap, OfficeRenderer, Snapshot, Timeline } from './model';
import { away, CHECK_MS, HOVER_MS, nextAfter, TICK_MS } from './loop';
import { useOfficeEvents } from './events';
import { bimsView, type BimsView } from './view';
import { cutLines, cutWords, placeTags, TAG_INSET, type TagIn } from './tags';
import { atFit, DRAG_PX, FIT, panBy, pinchFactor, sameCam, zoomAt, type Cam } from './zoom';
import { clockSig, eggLabels, eggsAt, konamiDone, localOf, NO_EGGS, noteLands, withForced, type Forced, type Land } from './eggs';
import './office.css';

/** The pure modules and the renderer's loader: feed.ts's, or fakes in a test. */
export interface Parts {
  readonly activities: ActivitiesFn;
  readonly layoutOf: LayoutFn;
  readonly newTimeline: NewTimelineFn;
  readonly labelsOf: LabelsFn;
  readonly load: () => Promise<MakeRenderer>;
}

export type OfficeState = 'loading' | 'on' | 'lost';

/** The AGENTS head's toggles: 'bims' (the office above the rows), and with it on '320 | wide' (view.ts keeps them per window). */
export function BimsSwitch({ view }: { view: BimsView }) {
  const opt = (id: string, label: string, tip: string, on: boolean, pick: () => void) => (
    <Press look="bims-opt" aria-pressed={on} {...tipAttrs(tip)} onClick={pick} data-testid={`app.right.agents.${id}`}>
      {label}
    </Press>
  );
  return (
    <>
      {view.view === 'bims' && !view.lost && (
        <span className="bims-switch" data-testid="app.right.agents.width">
          {opt('width.narrow', bims.width_narrow, bims.width_narrow_tip, !view.wide, () => {
            bimsView.setWide(false);
          })}
          {opt('width.wide', bims.width_wide, bims.width_wide_tip, view.wide, () => {
            bimsView.setWide(true);
          })}
        </span>
      )}
      <span className="bims-switch" data-testid="app.right.agents.view">
        {opt('view.bims', bims.view_bims, bims.view_bims_tip, view.view === 'bims', () => {
          bimsView.setView(view.view === 'bims' ? 'list' : 'bims');
        })}
      </span>
    </>
  );
}

/** What a bim's tag shows: its line (null: none) and its pill; the hover card's first line is its name. Pure. */
export function tagOf(l: Label): { readonly text: string | null; readonly pill: Label['pill'] } {
  // 'pill': the '?' / '✗' alone at rest, no name; hover, ctrl or an event give it its line
  if (l.mode === 'pill') return { text: null, pill: l.pill };
  if (l.mode === 'hover') return { text: l.name, pill: l.pill };
  // an easter egg's words stand alone ('1:47', 'combo ×2', '!'): the egg is the bim's, not news
  if (l.mode === 'egg') return { text: l.words, pill: l.pill };
  return { text: l.words === '' ? l.name : `${l.name} · ${l.words}`, pill: l.pill };
}

/** A bim's place in line for a label's room (designer m_27799): with a pill first, then working, then quiet. Pure. */
export function tagRank(k: ActivityKind): number {
  if (k === 'asks' || k === 'failed') return 1;
  if (k === 'work' || k === 'hot' || k === 'main' || k === 'starting' || k === 'landing' || k === 'visit' || k === 'report') return 2;
  return 3;
}

/** px a label's chip adds to its words (its padding), and a pill beside it with its gap */
const CHIP_PAD = 8;
const PILL_ROOM = 20;
/** the hover card: its widest (css px), its padding each side (--s-2), its title's lines, its gap under a flipped bim's feet */
const CARD_W = 240;
const CARD_PAD = 8;
const CARD_LINES = 3;
const CARD_GAP = 4;
/** after a card closes, the next one shows at once for this long (the ds tips' warmth) */
const WARM_MS = 1000;

/** The labels' font for measuring a cut: the ds's sans at 12 px (office.css .bims-label). */
function labelFont(weight = ''): string {
  const ui = typeof document === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue('--font-ui').trim();
  return `${weight}12px ${ui === '' ? 'sans-serif' : ui}`;
}

/** The labels' content, to re-render the overlay only when it changes (not at each frame). Pure. */
export function labelsSig(labels: ReadonlyMap<string, Label>): string {
  let s = '';
  for (const l of labels.values()) s += `${l.name}\u0000${l.mode}\u0000${l.words}\u0000${l.title}\u0000${l.pill ?? ''}\u0001`;
  return s;
}

const testMode = (): boolean => (window as { bise?: { test?: boolean } }).bise?.test === true;
const awayNow = (): boolean => away({ hidden: document.hidden, focused: document.hasFocus(), test: testMode() });
const nightNow = (): boolean => {
  const set = document.documentElement.dataset.theme;
  if (set !== undefined) return set === 'dark';
  return !(typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches);
};

/** What the loop reads, kept fresh by React and read by the frames. */
interface Live {
  snap: Snapshot;
  agents: readonly Agent[];
  /** the snapshot changed since the timeline last heard of it */
  fresh: boolean;
  events: BimEvent[];
  hover: string | null;
  held: boolean;
}

/** The office's agents in a stable shape: the live rows (archived ones have left). */
const officeKey = (agents: readonly Agent[]): string => agents.map((a) => `${a.name}${a.main ? '*' : ''}`).join(',');

export function Office({
  project,
  agents,
  cards,
  places,
  parts,
  onOpen,
}: {
  project: string;
  /** the project's live agents (main among them) */
  agents: readonly Agent[];
  cards: readonly Card[];
  places: readonly Place[];
  parts: Parts;
  /** a click on a bim: open that agent, as its row's click */
  onOpen: (agent: string) => void;
}) {
  const [state, setState] = useState<OfficeState>('loading');
  const [labels, setLabels] = useState<ReadonlyMap<string, Label>>(new Map());
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const tags = useRef(new Map<string, HTMLDivElement>());
  const leaders = useRef<SVGSVGElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  // each bim's place in line for a label's room this frame (tagRank)
  const ranks = useRef(new Map<string, number>());
  // the office's width, for the cut of a long line (whole words, a glued '…')
  const [boxW, setBoxW] = useState(0);
  const measure = useMemo(() => textWidth(labelFont()), []);
  const measureBold = useMemo(() => textWidth(labelFont('600 ')), []);
  const heads = useRef(new Map<string, { x: number; y: number; feet: number }>());
  const kickRef = useRef<() => void>(() => undefined);
  // the bim under a point of the canvas, css px: the renderer's once loaded
  const pick = useRef<(x: number, y: number) => string | null>(() => null);
  const held = useModHeld('Control');
  // the eggs' memory: today's lands (m6, m8) and when he typed the konami code (m1), with his last keys
  const lands = useRef<{ day: string; lands: readonly Land[] }>({ day: '', lands: [] });
  const konamiAt = useRef<number | null>(null);
  const keys = useRef<string[]>([]);
  // his camera (zoom.ts): the view the renderer draws; `fitted` re-renders only for the '⤢ fit' button
  const camRef = useRef<Cam>(FIT);
  const [fitted, setFitted] = useState(true);
  const applyCam = useRef<(c: Cam) => void>(() => undefined);
  const moveCam = useCallback((c: Cam) => {
    if (sameCam(c, camRef.current)) return;
    camRef.current = c;
    setFitted(atFit(c));
    applyCam.current(c);
  }, []);
  const live = useRef<Live>({ snap: { agents, cards, places }, agents, fresh: true, events: [], hover: null, held });

  // a fresh snapshot (the store gives new arrays only on a change): the timeline hears of it
  useEffect(() => {
    live.current = { ...live.current, snap: { agents, cards, places }, agents, fresh: true };
    kickRef.current();
  }, [agents, cards, places]);
  useEffect(() => {
    live.current.held = held;
    kickRef.current();
  }, [held]);
  // hub/activity: his message is a plane to its bim, an agent's to another a visit, a report a
  // sheet to main's desk (events.ts)
  useOfficeEvents(project, (e) => {
    live.current.events.push(e);
    live.current.fresh = true;
    kickRef.current();
  });

  // every tag over its bim, inside the office, none over another (tags.ts placeTags); a moved one
  // gets its 1 px leader, one with no room is left out and counted in the corner while ctrl is held
  // (designer m_27799). Room goes first to the hovered one, then to bims with a pill, then to
  // working ones, then to the quiet ones (tagRank), the labels' own order among equals.
  const layoutTags = useCallback(() => {
    const box = holder.current;
    if (box === null) return;
    const ins: TagIn[] = [];
    for (const [name, el] of tags.current) {
      const h = heads.current.get(name);
      el.style.visibility = h === undefined ? 'hidden' : '';
      if (h === undefined) continue;
      const w = el.offsetWidth;
      const th = el.offsetHeight;
      if (el.dataset.mode === 'hover') {
        // the card over its head; under its feet when it would leave the top, never over its bim
        // (designer m_27920); placed with the pills, first, never moved
        const top = h.y - th >= TAG_INSET ? h.y - th : h.feet + CARD_GAP;
        ins.push({ name, x: h.x, y: top + th, w, h: th, pill: true, rank: 0 });
        continue;
      }
      const rank = ranks.current.get(name) ?? 3;
      ins.push({ name, x: h.x, y: h.y, w, h: th, pill: el.dataset.mode === 'pill', rank });
    }
    const { at, left } = placeTags(ins, box.clientWidth, box.clientHeight);
    const more = left > 0 && live.current.held ? bims.held_left_out({ n: left }) : '';
    if (moreRef.current !== null && moreRef.current.textContent !== more) moreRef.current.textContent = more;
    let lines = '';
    for (const t of ins) {
      const p = at.get(t.name);
      const el = tags.current.get(t.name);
      if (el === undefined) continue;
      el.style.visibility = p === undefined ? 'hidden' : '';
      if (p === undefined) continue;
      el.style.transform = `translate(${p.left.toFixed(1)}px, ${p.top.toFixed(1)}px)`;
      if (!p.lead) continue;
      const lx = Math.min(Math.max(t.x, p.left), p.left + t.w);
      const ly = p.top + t.h <= t.y ? p.top + t.h : p.top;
      lines += `<line x1="${lx.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${t.x.toFixed(1)}" y2="${t.y.toFixed(1)}"/>`;
    }
    if (leaders.current !== null && leaders.current.innerHTML !== lines) leaders.current.innerHTML = lines;
  }, []);

  useEffect(() => {
    const cv = canvas.current;
    const box = holder.current;
    if (cv === null || box === null) return undefined;
    let gone = false;
    let r: OfficeRenderer | null = null;
    let timeline: Timeline | null = null;
    let office: OfficeMap | null = null;
    let shape = '';
    let lost = false;
    let raf = 0;
    let tick: ReturnType<typeof setTimeout> | undefined;
    let lastLabels = '';
    let lastActs = '';
    let lastEggs = '';
    let reduced = reducedMotion();

    const cancel = () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      raf = 0;
      if (tick !== undefined) clearTimeout(tick);
      tick = undefined;
    };
    const fail = () => {
      lost = true;
      cancel();
      if (!gone) setState('lost');
      bimsView.setLost(true);
    };
    const resize = () => {
      if (r === null) return;
      const w = box.clientWidth;
      if (w <= 0) return;
      const h = r.setSize(w, 4000);
      box.style.height = `${String(Math.round(h))}px`;
      setBoxW(w);
    };
    const draw = () => {
      raf = 0;
      tick = undefined;
      if (r === null || timeline === null || gone || lost) return;
      const L = live.current;
      const t = Date.now() / 1000;
      if (L.fresh) {
        L.fresh = false;
        const key = officeKey(L.agents);
        if (office === null || key !== shape) {
          shape = key;
          office = parts.layoutOf(L.agents);
          r.setOffice(office, L.agents);
          resize();
        }
        const acts = parts.activities(L.snap, t);
        lastActs = JSON.stringify([...acts]);
        timeline.update(acts, office, t, L.events);
        L.events = [];
      }
      if (office === null) return;
      const main = new Set(L.agents.filter((a) => a.main).map((a) => a.name));
      const frames: BimFrame[] = [];
      for (const name of timeline.names(t)) {
        const pose = timeline.poseAt(name, t);
        if (pose !== null) frames.push({ name, main: main.has(name), pose });
      }
      // his easter eggs (eggs.ts): one pass between the poses and the labels. In test mode only a
      // check's forced ones (window.__biseEggs), never a random roll
      const night = nightNow();
      const local = localOf(new Date());
      lands.current = noteLands(lands.current, frames, local);
      const forced = testMode() ? (window as { __biseEggs?: Forced }).__biseEggs : undefined;
      const eg = testMode()
        ? withForced(NO_EGGS, forced)
        : eggsAt({ t, frames, agents: L.agents, cards: L.snap.cards.length, local, night, reduced, lands: lands.current.lands, konami: konamiAt.current });
      lastEggs = clockSig(local, night, L.agents);
      const played = frames.map((f) => {
        const e = eg.bims.get(f.name);
        return e === undefined ? f : { ...f, egg: e };
      });
      const look: Look = { night, reduced, eggs: eg.office };
      const motion = r.frame(t, played, look);
      const shown = parts.labelsOf(played, { t, hover: L.hover, held: L.held, agents: L.agents, eggs: eggLabels(eg) });
      ranks.current = new Map(frames.map((f) => [f.name, tagRank(f.pose.seg.act.k)]));
      heads.current = new Map();
      for (const name of shown.keys()) {
        const h = r.headOf(name);
        if (h !== null) heads.current.set(name, h);
      }
      layoutTags();
      const sig = labelsSig(shown);
      if (sig !== lastLabels) {
        lastLabels = sig;
        setLabels(shown);
      }
      const next = nextAfter({ motion, moving: timeline.moving(t), labels: shown, away: awayNow(), lost });
      if (next === 'raf') raf = requestAnimationFrame(draw);
      else if (next === 'tick') tick = setTimeout(draw, TICK_MS);
    };
    const kick = () => {
      if (r === null || lost || gone || awayNow()) return;
      if (raf !== 0) return;
      if (tick !== undefined) clearTimeout(tick);
      tick = undefined;
      raf = requestAnimationFrame(draw);
    };
    kickRef.current = kick;
    applyCam.current = (c) => {
      r?.setCam(c);
      kick();
    };

    // a pinch (Chromium: a wheel with ctrlKey) zooms around the pointer; two fingers move the view
    // while zoomed, and scroll the bar at the fit (nothing to move there)
    const onWheel = (e: WheelEvent) => {
      const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? box.clientHeight : 1;
      const at = box.getBoundingClientRect();
      if (e.ctrlKey) {
        e.preventDefault();
        moveCam(zoomAt(camRef.current, pinchFactor(e.deltaY * k), e.clientX - at.left, e.clientY - at.top, at.width, at.height));
        return;
      }
      if (atFit(camRef.current)) return;
      e.preventDefault();
      moveCam(panBy(camRef.current, -e.deltaX * k, -e.deltaY * k, at.width, at.height));
    };
    box.addEventListener('wheel', onWheel, { passive: false });

    // the window away: nothing runs; back: one frame, and the loop if it moves
    const onWindow = () => {
      if (awayNow()) cancel();
      else kick();
    };
    document.addEventListener('visibilitychange', onWindow);
    window.addEventListener('focus', onWindow);
    window.addEventListener('blur', onWindow);
    const motionMq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    const schemeMq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: light)') : null;
    const onLook = () => {
      reduced = reducedMotion();
      kick();
    };
    motionMq?.addEventListener('change', onLook);
    schemeMq?.addEventListener('change', onLook);
    const theme = new MutationObserver(onLook);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const sized = new ResizeObserver(() => {
      resize();
      kick();
    });
    sized.observe(box);
    // a still office looks at its rows' clock now and then (a long turn going hot, a trip to the
    // island): it draws only when an activity changed
    const check = setInterval(() => {
      if (r === null || timeline === null || awayNow() || lost) return;
      // the clock's eggs (the eclipse, friday 17:00, midnight) start and end without a row change
      const clockNow = clockSig(localOf(new Date()), nightNow(), live.current.agents);
      if (clockNow === lastEggs && JSON.stringify([...parts.activities(live.current.snap, Date.now() / 1000)]) === lastActs) return;
      live.current.fresh = true;
      kick();
    }, CHECK_MS);

    parts
      .load()
      .then((make) => {
        if (gone) return;
        const made = make(cv);
        r = made;
        made.onLost(fail);
        pick.current = (x, y) => (lost ? null : made.pick(x, y));
        made.setCam(camRef.current);
        timeline = parts.newTimeline();
        live.current.fresh = true;
        setState('on');
        bimsView.setLost(false);
        resize();
        kick();
      })
      .catch(fail);

    return () => {
      gone = true;
      cancel();
      clearInterval(check);
      document.removeEventListener('visibilitychange', onWindow);
      window.removeEventListener('focus', onWindow);
      window.removeEventListener('blur', onWindow);
      motionMq?.removeEventListener('change', onLook);
      schemeMq?.removeEventListener('change', onLook);
      theme.disconnect();
      sized.disconnect();
      box.removeEventListener('wheel', onWheel);
      kickRef.current = () => undefined;
      applyCam.current = () => undefined;
      pick.current = () => null;
      r?.dispose();
    };
  }, [parts, layoutTags, moveCam]);

  // hover: the bim under the pointer, its line after the tip's delay; off it, at once
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef<string | null>(null);
  const [pointer, setPointer] = useState(false);
  useEffect(
    () => () => {
      clearTimeout(hoverTimer.current);
    },
    [],
  );
  // a card that just closed keeps the next one warm: it shows at once (the ds tips' rule)
  const warmUntil = useRef(0);
  const setHover = (name: string | null) => {
    if (live.current.hover === name) return;
    if (name === null && live.current.hover !== null) warmUntil.current = Date.now() + WARM_MS;
    live.current.hover = name;
    kickRef.current();
  };
  // a one-finger (or mouse) drag moves the view while zoomed; past DRAG_PX it is never a click
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const dragged = useRef(false);
  const [dragging, setDragging] = useState(false);
  const pickEvent = (e: { clientX: number; clientY: number }): string | null => {
    const box = holder.current;
    if (box === null) return null;
    const at = box.getBoundingClientRect();
    return pick.current(e.clientX - at.left, e.clientY - at.top);
  };

  if (state === 'lost')
    // its own element: React would reuse the holder's div here, the height resize() set on it by
    // hand included (a 212 px line, bims-qa m_27786); the rows show under it as always
    return (
      <div key="lost" className="bims-lost" data-testid="app.right.bims.lost">
        {bims.lost}
      </div>
    );
  const cardW = Math.min(CARD_W, boxW - 2 * TAG_INSET);
  return (
    <div
      key="office"
      className="bims-office"
      ref={holder}
      // esc goes back to the fit while the office has focus (a click gives it)
      tabIndex={0}
      aria-label={bims.view_bims_tip}
      data-testid="app.right.bims"
      data-state={state}
      data-pointer={pointer || undefined}
      data-zoomed={!fitted || undefined}
      data-drag={dragging || undefined}
      onKeyDown={(e) => {
        keys.current = [...keys.current.slice(-9), e.key];
        if (konamiDone(keys.current)) {
          keys.current = [];
          konamiAt.current = Date.now() / 1000;
          kickRef.current();
        }
        if (e.key !== 'Escape' || fitted) return;
        e.stopPropagation();
        moveCam(FIT);
      }}
      onPointerDown={(e) => {
        if (e.button !== 0 || fitted || (e.target as Element).closest('button, .bims-pill') !== null) return;
        drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
        dragged.current = false;
      }}
      onPointerUp={() => {
        if (drag.current?.moved === true) dragged.current = true;
        drag.current = null;
        setDragging(false);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setDragging(false);
      }}
      onDoubleClick={(e) => {
        // on the floor only: a double-click on a bim already opened it (designer m_27920)
        if (pickEvent(e) === null) moveCam(FIT);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (d !== null && d.id === e.pointerId) {
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          if (!d.moved && Math.hypot(dx, dy) < DRAG_PX) return;
          if (!d.moved) {
            d.moved = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging(true);
            pending.current = null;
            clearTimeout(hoverTimer.current);
            setHover(null);
          }
          d.x = e.clientX;
          d.y = e.clientY;
          const box = e.currentTarget.getBoundingClientRect();
          moveCam(panBy(camRef.current, dx, dy, box.width, box.height));
          return;
        }
        const name = pickEvent(e);
        setPointer(name !== null);
        if (name === pending.current) return;
        pending.current = name;
        clearTimeout(hoverTimer.current);
        if (name === null) setHover(null);
        else if (Date.now() < warmUntil.current) setHover(name);
        else
          hoverTimer.current = setTimeout(() => {
            setHover(name);
          }, HOVER_MS);
      }}
      onPointerLeave={() => {
        pending.current = null;
        clearTimeout(hoverTimer.current);
        setPointer(false);
        setHover(null);
      }}
      onClick={(e) => {
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        const name = pickEvent(e);
        if (name !== null) onOpen(name);
      }}
    >
      <canvas ref={canvas} className="bims-canvas" data-testid="app.right.bims.canvas" />
      <div className="bims-overlay">
        <svg ref={leaders} className="bims-leaders" aria-hidden="true" />
        <div ref={moreRef} className="bims-more" data-testid="app.right.bims.more" />
        {!fitted && (
          <Press
            look="bims-fit"
            data-testid="app.right.bims.fit"
            {...tipAttrs(bims.fit_tip, 'esc')}
            onClick={(e) => {
              e.stopPropagation();
              moveCam(FIT);
            }}
          >
            <span aria-hidden="true">⤢</span> {bims.fit}
          </Press>
        )}
        {[...labels.values()].map((l) => {
          const tagRef = (el: HTMLDivElement | null) => {
            if (el === null) tags.current.delete(l.name);
            else {
              tags.current.set(l.name, el);
              layoutTags();
            }
          };
          if (l.mode === 'hover')
            return <HoverCard key={l.name} label={l} width={cardW} measure={measure} measureBold={measureBold} tagRef={tagRef} onOpen={onOpen} />;
          const tag = tagOf(l);
          return (
            <div key={l.name} className="bims-tag" data-mode={l.mode} ref={tagRef}>
              {tag.text !== null && (
                <span className="bims-label" data-mode={l.mode} data-testid={`app.right.bims.label.${l.name}`}>
                  {boxW > 0 ? cutWords(tag.text, boxW - 2 * TAG_INSET - CHIP_PAD - (tag.pill === null ? 0 : PILL_ROOM), measure) : tag.text}
                </span>
              )}
              {tag.pill !== null && <Pill name={l.name} pill={tag.pill} onOpen={onOpen} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The '?' / '✗' pill: its own colours, its tip, a click opens its agent. */
function Pill({ name, pill, onOpen }: { name: string; pill: 'asks' | 'failed'; onOpen: (agent: string) => void }) {
  return (
    <span
      className={`bims-pill ${pill}`}
      data-pill={pill}
      data-testid={`app.right.bims.pill.${name}`}
      {...tipAttrs(pill === 'asks' ? bims.pill_asks_tip({ agent: name }) : bims.pill_failed_tip({ agent: name }))}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(name);
      }}
    >
      {pill === 'asks' ? '?' : '✗'}
    </span>
  );
}

/**
 * The hover card (Gabriel: multi-line, easy to read; designer m_27920): its name in 600 with its
 * pill, its state dim under it, its title on at most CARD_LINES lines cut on a whole word with one
 * glued '…' (tags.ts cutLines, measured, so the lines are ours, not the browser's). No accent but
 * the pill's. The office's layoutTags places it: over the head, or under the feet.
 */
function HoverCard({ label, width, measure, measureBold, tagRef, onOpen }: {
  label: Label;
  width: number;
  measure: (s: string) => number;
  measureBold: (s: string) => number;
  tagRef: (el: HTMLDivElement | null) => void;
  onOpen: (agent: string) => void;
}) {
  const room = width - 2 * CARD_PAD;
  const name = room > 0 ? cutWords(label.name, room - (label.pill === null ? 0 : PILL_ROOM), measureBold) : label.name;
  const state = room > 0 ? cutWords(label.words, room, measure) : label.words;
  const title = cutLines(label.title, room, CARD_LINES, measure);
  return (
    <div className="bims-card" data-mode="hover" ref={tagRef} style={width > 0 ? { maxWidth: `${String(width)}px` } : undefined} data-testid={`app.right.bims.label.${label.name}`}>
      <div className="bims-card-head">
        <span className="bims-card-name">{name}</span>
        {label.pill !== null && <Pill name={label.name} pill={label.pill} onOpen={onOpen} />}
      </div>
      {state !== '' && (
        <div className="bims-card-state" data-testid={`app.right.bims.card.state.${label.name}`}>
          {state}
        </div>
      )}
      {title.map((line, i) => (
        <div key={i} data-testid={i === 0 ? `app.right.bims.card.title.${label.name}` : undefined}>
          {line}
        </div>
      ))}
    </div>
  );
}
