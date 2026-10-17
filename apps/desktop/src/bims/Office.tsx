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
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Press, tipAttrs } from '@/ds';
import { reducedMotion, textWidth } from '@/ds/hooks';
import type { Agent, Card, Place } from '@/proto';
import { bims } from '@/proto/words_bims.gen';
import { useModHeld } from '@/app/held';
import type { ActivitiesFn, ActivityKind, BimEvent, BimFrame, Label, LabelsFn, LayoutFn, Look, MakeRenderer, NewTimelineFn, Office as OfficeMap, OfficeRenderer, Snapshot, Timeline } from './model';
import { away, CHECK_MS, HOVER_MS, nextAfter } from './loop';
import { dayOf, wakeIn } from './skate';
import { useOfficeEvents } from './events';
import { bimsView, type BimsView } from './view';
import { cutLines, cutWords, placeTags, TAG_INSET, type TagIn } from './tags';
import { atFit, DRAG_PX, FIT, panBy, pinchFactor, sameCam, zoomAt, type Cam } from './zoom';
import { clockSig, eggLabels, eggsAt, konamiDone, localOf, NO_EGGS, noteLands, withForced, type Forced, type Land } from './eggs';
import { bedsAt, cropped, growOf, tipOf, UNLOCK_LABEL, UNLOCK_WALK, unlockLabel, unlockOf, type Grow } from './growth';
import { growHigh } from './grow-keep';
import { FOLD_MS } from './Fold';
import { placeZzz, sleepers } from './zzz';
import { aimAt, bimsLit, easeCam, edgeOf, useBimsLit } from './focus';
import type { Growth } from '@/proto';
import { DEFAULT_MAP, type MapId, mapOf } from './maps/ids';
import { planOf } from './maps';
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

/** the office's last width / height in this window: the fold grows to it before the renderer has loaded (Fold.tsx) */
let lastRatio = 1.4;

/** The AGENTS head's '320 | wide' while the office shows (view.ts keeps it per window); the title bar's icon opens and closes the office (Frame.tsx). */
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
          {/* hiding it where he looks (his ask, bims-fix: the title bar's cube alone, he couldn't find it) */}
          <span className="bims-sep" aria-hidden="true">·</span>
          <Press look="bims-opt" {...tipAttrs(bims.hide_tip)} onClick={() => { bimsView.setView('list'); }} data-testid="app.right.agents.hide">
            {bims.hide}
          </Press>
        </span>
      )}
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
/** from this width the camera fits a little ground past the building (render/index.ts), under it the building only */
const WIDE_FIT_PX = 480;

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
/** a check says the window lost focus (window.__biseBlur): the harness's window never has it, so focus only counts then */
const blurred = (): boolean => (window as { __biseBlur?: boolean }).__biseBlur === true;
const awayNow = (): boolean => away({ hidden: document.hidden, focused: document.hasFocus() && !blurred(), test: testMode() && !blurred() });
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
  /** the agent whose row the pointer is on (focus.ts): a halo under its bim */
  lit: string | null;
  /** the project's map (/bims, his prefs): another one crossfades the office to it */
  map: MapId;
}

/** The follow camera (focus.ts): the bim it aims at ('fit': back to the whole office, then null), and its last step's time. */
interface Follow {
  target: { readonly name: string } | 'fit' | null;
  at: number;
}

/** The office's agents in a stable shape: the live rows (archived ones have left). */
const officeKey = (agents: readonly Agent[], map: MapId): string => `${map}|${agents.map((a) => `${a.name}${a.main ? '*' : ''}`).join(',')}`;

/** the map's crossfade (/bims): the old office over the new one, faded out (office.css .bims-xfade, ~300 ms) */
function crossfade(r: OfficeRenderer, cv: HTMLCanvasElement, fx: HTMLCanvasElement): void {
  fx.width = cv.width;
  fx.height = cv.height;
  fx.style.width = `${String(cv.clientWidth)}px`;
  fx.style.height = `${String(cv.clientHeight)}px`;
  r.copyTo(fx);
  fx.dataset.on = '';
  // the next frame lets it go: the transition runs from full to none
  requestAnimationFrame(() => {
    delete fx.dataset.on;
  });
}

export function Office({
  project,
  agents,
  cards,
  places,
  growth = null,
  map = DEFAULT_MAP,
  parts,
  follow = null,
  onOpen,
}: {
  project: string;
  /** the project's live agents (main among them) */
  agents: readonly Agent[];
  cards: readonly Card[];
  places: readonly Place[];
  /** how much the project has done (hub/growth); the office draws its high-water mark (growth.ts) */
  growth?: Growth | null;
  /** the project's map (his /bims pick, prefs bims.map.<project>); the loft when he never picked one */
  map?: MapId;
  parts: Parts;
  /** the agent whose thread is open (focus.ts followOf): the office zooms on its bim and follows it */
  follow?: string | null;
  /** a click on a bim: open that agent, as its row's click */
  onOpen: (agent: string) => void;
}) {
  const [state, setState] = useState<OfficeState>('loading');
  // the scene fades in once its first frame is drawn and the fold has grown (Fold.tsx)
  const [drawn, setDrawn] = useState(false);
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setGrown(true);
    }, reducedMotion() ? 0 : FOLD_MS - 40);
    return () => {
      clearTimeout(t);
    };
  }, []);
  const [labels, setLabels] = useState<ReadonlyMap<string, Label>>(new Map());
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const xfade = useRef<HTMLCanvasElement>(null);
  const tags = useRef(new Map<string, HTMLDivElement>());
  const leaders = useRef<SVGSVGElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  // the sleepers' z's (zzz.ts): placed by hand at each draw, a CSS loop between draws
  const zzzRef = useRef<HTMLDivElement>(null);
  // each bim's place in line for a label's room this frame (tagRank)
  const ranks = useRef(new Map<string, number>());
  // the office's width, for the cut of a long line (whole words, a glued '…')
  const [boxW, setBoxW] = useState(0);
  const measure = useMemo(() => textWidth(labelFont()), []);
  const measureBold = useMemo(() => textWidth(labelFont('600 ')), []);
  const heads = useRef(new Map<string, { x: number; y: number; feet: number; edge?: 'left' | 'right' | 'up' | 'down' }>());
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
  // the follow camera: his own pinch, drag, esc or '⤢ fit' (moveCam) stops it until he opens another agent
  const followRef = useRef<Follow>({ target: follow === null ? null : { name: follow }, at: 0 });
  const moveCam = useCallback((c: Cam) => {
    followRef.current = { target: null, at: 0 };
    if (sameCam(c, camRef.current)) return;
    camRef.current = c;
    setFitted(atFit(c));
    applyCam.current(c);
  }, []);
  const live = useRef<Live>({ snap: { agents, cards, places }, agents, fresh: true, events: [], hover: null, held, lit: null, map });
  useEffect(() => {
    const was = followRef.current.target;
    if (follow === (was === null || was === 'fit' ? null : was.name)) return;
    // another agent's thread: follow it; none (main's, bise's, a screen): back to the whole office if it followed one
    followRef.current = { target: follow !== null ? { name: follow } : was === null ? null : 'fit', at: 0 };
    kickRef.current();
  }, [follow]);
  // the office grows (growth.ts): its high-water mark, the last growth drawn (an unlock is a stage
  // past it), the unlock moment, its label over the piece and the ground corner's tip
  // in test mode no kept mark: the fixture's growth, or a check's own (window.__biseGrow, read when
  // the `growth` prop changes) so a check can go back to a lower stage
  const high = useMemo(() => (testMode() ? ((window as { __biseGrow?: Growth }).__biseGrow ?? growth) : growHigh(project, growth)), [project, growth]);
  const growNow = useMemo(() => growOf(high), [high]);
  const grow = useRef<Grow>(growNow);
  const seen = useRef<Grow | null>(null);
  const unlockAt = useRef<{ stage: number; at: number } | undefined>(undefined);
  const [newTag, setNewTag] = useState<{ text: string; x: number; y: number } | null>(null);
  useEffect(() => {
    grow.current = growNow;
    if (high === null) return;
    // the first growth drawn is no moment; a stage past the last drawn one is
    const u = unlockOf(seen.current, growNow);
    if (u !== null) unlockAt.current = { stage: u, at: Date.now() / 1000 };
    seen.current = growNow;
    // the timeline hears of it too: a napper at its desk takes a bean bag the stage built (timeline.ts bedFor)
    live.current = { ...live.current, fresh: true };
    kickRef.current();
  }, [high, growNow]);

  // a fresh snapshot (the store gives new arrays only on a change): the timeline hears of it
  useEffect(() => {
    live.current = { ...live.current, snap: { agents, cards, places }, agents, fresh: true };
    kickRef.current();
  }, [agents, cards, places]);
  // his /bims pick: the office crossfades to the new map at the next frame
  useEffect(() => {
    if (live.current.map === map) return;
    live.current = { ...live.current, map, fresh: true };
    kickRef.current();
  }, [map]);
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
      if ((el.dataset.edge ?? '') !== (h.edge ?? '')) {
        if (h.edge === undefined) delete el.dataset.edge;
        else el.dataset.edge = h.edge;
      }
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
    let lastNew = 'null';
    let lastActs = '';
    let lastEggs = '';
    let reduced = reducedMotion();
    let firstDrawn = false;

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
      if (h > 0) lastRatio = w / h;
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
        const key = officeKey(L.agents, L.map);
        if (office === null || key !== shape) {
          shape = key;
          const next = parts.layoutOf(L.agents, L.map);
          // another map: the old office fades out over the new one; reduced motion: a cut
          const fx = xfade.current;
          if (office !== null && office.map !== next.map && !reduced && fx !== null) crossfade(r, cv, fx);
          office = next;
          // what he picked (data-want) and what is drawn (data-map: the loft for a map not ready yet)
          if (holder.current !== null) Object.assign(holder.current.dataset, { want: L.map, map: office.map });
          r.setOffice(office, L.agents);
          resize();
        }
        const acts = parts.activities(L.snap, t);
        lastActs = JSON.stringify([...acts]);
        // a map with a park: who skates reads the stage, the jobs' high-water mark (never the live count), his day, reduced motion
        const day = localOf(new Date());
        const g = grow.current;
        timeline.update(acts, office, t, L.events, bedsAt(g.stage), { stage: g.stage, jobs: g.jobs, dow: day.dow, day: dayOf(day.y, day.mo, day.d), reduced });
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
        : eggsAt({ t, frames, agents: L.agents, cards: L.snap.cards.length, local, night, reduced, lands: lands.current.lands, konami: konamiAt.current, stage: grow.current.stage });
      lastEggs = clockSig(local, night, L.agents);
      const ft = followRef.current.target;
      const fol = ft === null || ft === 'fit' ? null : ft.name;
      const played = frames.map((f) => {
        const e = eg.bims.get(f.name);
        const lit = f.name === L.lit || f.name === fol;
        return e === undefined ? (lit ? { ...f, lit } : f) : { ...f, egg: e, ...(lit ? { lit } : {}) };
      });
      // the office grows: what it draws, and the unlock moment while it lasts
      const u = unlockAt.current;
      const look: Look = { night, reduced, eggs: eg.office, grow: grow.current, ...(u ? { unlock: u } : {}) };
      const motion = r.frame(t, played, look);
      if (!firstDrawn) {
        firstDrawn = true;
        setDrawn(true);
      }
      // the follow camera, from where the bims stand now: the next frame draws the new view
      const chasing = chase(r, t, reduced);
      const said = unlockLabel(u, t, reduced, planOf(mapOf(office.map)).things);
      const at = said !== null && u ? r.pieceOf(u.stage) : null;
      const tag = said !== null && at !== null ? { text: said, x: Math.round(at.x), y: Math.round(at.y) } : null;
      if (JSON.stringify(tag) !== lastNew) {
        lastNew = JSON.stringify(tag);
        setNewTag(tag);
      }
      if (u && t - u.at > UNLOCK_WALK + UNLOCK_LABEL) unlockAt.current = undefined;
      const shown = parts.labelsOf(played, { t, hover: L.hover, held: L.held, agents: L.agents, eggs: eggLabels(eg), follow: fol, park: office.park });
      ranks.current = new Map(frames.map((f) => [f.name, tagRank(f.pose.seg.act.k)]));
      heads.current = new Map();
      const box = holder.current;
      for (const [name, l] of shown) {
        const h = r.headOf(name);
        if (h !== null) heads.current.set(name, h);
        else if (l.pill !== null && box !== null) {
          // a '?' / '✗' whose bim is out of the frame stays at its nearest edge, an arrow towards it (bims m_28199)
          const s = r.spotOf(name);
          if (s === null) continue;
          const e = edgeOf(s.x, s.y, box.clientWidth, box.clientHeight, TAG_INSET);
          heads.current.set(name, { x: e.x, y: e.y, feet: e.y, ...(e.side === null ? {} : { edge: e.side }) });
        }
      }
      layoutTags();
      if (zzzRef.current !== null) {
        const zs = new Map<string, { x: number; y: number }>();
        for (const name of sleepers(frames)) {
          const h = r.headOf(name);
          if (h !== null) zs.set(name, h);
        }
        placeZzz(zzzRef.current, zs);
      }
      const sig = labelsSig(shown);
      if (sig !== lastLabels) {
        lastLabels = sig;
        setLabels(shown);
      }
      // a resting skater (skate.ts): no frame during its rest, a timer for its next line
      const next = chasing && !awayNow() ? 0 : nextAfter({ motion, moving: timeline.moving(t), labels: shown, away: awayNow(), lost, wake: wakeIn(frames, office.park) });
      if (next === 0) raf = requestAnimationFrame(draw);
      else if (next !== null) tick = setTimeout(draw, next);
    };
    // one step of the follow camera (focus.ts): ease towards its bim (or back to the fit); true while it moves
    const chase = (rr: OfficeRenderer, t: number, still: boolean): boolean => {
      const F = followRef.current;
      if (F.target === null) return false;
      let to: Cam | null = FIT;
      if (F.target !== 'fit') {
        const s = rr.spotOf(F.target.name);
        to = s === null ? null : aimAt(s.u, s.v);
      }
      if (to === null) return false;
      const dt = F.at === 0 ? 1 / 60 : Math.min(0.1, t - F.at);
      F.at = t;
      const c = easeCam(camRef.current, to, dt, still);
      if (F.target === 'fit' && sameCam(c, FIT)) followRef.current = { target: null, at: 0 };
      if (sameCam(c, camRef.current)) return false;
      camRef.current = c;
      rr.setCam(c);
      setFitted(atFit(c));
      return true;
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
    // the z's' CSS loop (zzz.ts) pauses on the same flag (architect m_28263)
    const onWindow = () => {
      const isAway = awayNow();
      box.toggleAttribute('data-away', isAway);
      if (isAway) cancel();
      else kick();
    };
    box.toggleAttribute('data-away', awayNow());
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
  // his pointer on an AGENTS row (focus.ts): the halo under its bim at once, its card after the
  // tip's delay (warm after one closed), so a sweep down the list never flashes a card per row
  const lit = useBimsLit();
  const rowLit = lit?.from === 'row' ? lit.name : null;
  useEffect(() => {
    live.current.lit = rowLit;
    kickRef.current();
    clearTimeout(hoverTimer.current);
    pending.current = rowLit;
    if (rowLit === null) {
      setHover(null);
      return;
    }
    if (Date.now() < warmUntil.current) setHover(rowLit);
    else
      hoverTimer.current = setTimeout(() => {
        setHover(rowLit);
      }, HOVER_MS);
  }, [rowLit]);
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
      data-shown={(drawn && grown) || undefined}
      style={state === 'loading' ? ({ '--bims-ratio': String(lastRatio) } as CSSProperties) : undefined}
      data-pointer={pointer || undefined}
      data-zoomed={!fitted || undefined}
      data-stage={growNow.stage}
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
        bimsLit.set(name === null ? null : { name, from: 'bim' }, 'bim');
        if (name === null) setHover(null);
        else if (Date.now() < warmUntil.current) setHover(name);
        else
          hoverTimer.current = setTimeout(() => {
            setHover(name);
          }, HOVER_MS);
      }}
      onPointerLeave={() => {
        bimsLit.set(null, 'bim');
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
      <canvas
        ref={canvas}
        // the garden past what the camera fits is cropped; a soft fade at the sides says there is more
        className={`bims-canvas${boxW > 0 && cropped(growNow, boxW >= WIDE_FIT_PX) ? ' bims-fade' : ''}`}
        data-testid="app.right.bims.canvas"
      />
      <canvas ref={xfade} className="bims-xfade" aria-hidden="true" data-testid="app.right.bims.xfade" />
      <div className="bims-overlay">
        <svg ref={leaders} className="bims-leaders" aria-hidden="true" />
        <div ref={zzzRef} className="bims-zzzs" data-testid="app.right.bims.zzzs" />
        <div ref={moreRef} className="bims-more" data-testid="app.right.bims.more" />
        {/* the ground's corner: hover says the level, the jobs done, the next piece (the map's own) */}
        <span className="bims-level" data-testid="app.right.bims.level" {...tipAttrs(tipOf(growNow, planOf(map).things))} />
        {newTag !== null && (
          <div className="bims-label bims-new" data-mode="event" style={{ left: `${String(newTag.x)}px`, top: `${String(newTag.y)}px` }} data-testid="app.right.bims.new">
            {newTag.text}
          </div>
        )}
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
