// The office in the right bar's AGENTS section (page bims-office v7; spec les-bims-sc-narios-du-bureau
// §1-§2): the canvas at the section's top at the office's natural height (the renderer fits it to
// the width), a DOM overlay for the labels and the '?' / '✗' pills over the bims' heads, and the
// loop. The renderer (three.js) comes with import('./render') only once the office shows: the list
// never asks for it. The loop draws on demand (loop.ts): a kick (new rows, his message, a hover,
// ctrl held, a size or theme change) draws one frame, the next comes only while something moves;
// none while the window is away. A lost WebGL context (or a renderer that fails to load) shows the
// list with one line, never a blank section. Hover: the bim under the pointer (renderer.pick) shows
// its line after the tip's 400 ms; a click opens it as its row's click does. Owner: bims-wire.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Press, tipAttrs } from '@/ds';
import { reducedMotion, textWidth } from '@/ds/hooks';
import type { Agent, Card, Place } from '@/proto';
import { bims } from '@/proto/words_bims.gen';
import { useModHeld } from '@/app/held';
import type { ActivitiesFn, ActivityKind, BimEvent, BimFrame, Label, LabelsFn, LayoutFn, Look, MakeRenderer, NewTimelineFn, Office as OfficeMap, OfficeRenderer, Snapshot, Timeline } from './model';
import { away, CHECK_MS, HOVER_MS, nextAfter, TICK_MS } from './loop';
import { useOfficeEvents } from './events';
import { bimsView, type BimsView } from './view';
import { cutWords, placeTags, TAG_INSET, type TagIn } from './tags';
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

/** The AGENTS head's toggles: 'list | bims', and with bims on '320 | wide' (view.ts keeps them per window). */
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
        {opt('view.list', bims.view_list, bims.view_list_tip, view.view === 'list', () => {
          bimsView.setView('list');
        })}
        {opt('view.bims', bims.view_bims, bims.view_bims_tip, view.view === 'bims', () => {
          bimsView.setView('bims');
        })}
      </span>
    </>
  );
}

/** What a bim's tag shows: its line (null: none) and its pill. Pure. */
export function tagOf(l: Label): { readonly text: string | null; readonly pill: Label['pill'] } {
  // 'pill': the '?' / '✗' alone at rest, no name; hover, ctrl or an event give it its line
  if (l.mode === 'pill') return { text: null, pill: l.pill };
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

/** The labels' font for measuring a cut: the ds's sans at 12 px (office.css .bims-label). */
function labelFont(): string {
  const ui = typeof document === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue('--font-ui').trim();
  return `12px ${ui === '' ? 'sans-serif' : ui}`;
}

/** The labels' content, to re-render the overlay only when it changes (not at each frame). Pure. */
export function labelsSig(labels: ReadonlyMap<string, Label>): string {
  let s = '';
  for (const l of labels.values()) s += `${l.name}\u0000${l.mode}\u0000${l.words}\u0000${l.pill ?? ''}\u0001`;
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
  fallback,
}: {
  project: string;
  /** the project's live agents (main among them) */
  agents: readonly Agent[];
  cards: readonly Card[];
  places: readonly Place[];
  parts: Parts;
  /** a click on a bim: open that agent, as its row's click */
  onOpen: (agent: string) => void;
  /** the list, shown while the renderer loads and when WebGL is lost */
  fallback: ReactNode;
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
  const heads = useRef(new Map<string, { x: number; y: number }>());
  const kickRef = useRef<() => void>(() => undefined);
  // the bim under a point of the canvas, css px: the renderer's once loaded
  const pick = useRef<(x: number, y: number) => string | null>(() => null);
  const held = useModHeld('Control');
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
      const rank = el.dataset.mode === 'hover' ? 0 : (ranks.current.get(name) ?? 3);
      ins.push({ name, x: h.x, y: h.y, w: el.offsetWidth, h: el.offsetHeight, pill: el.dataset.mode === 'pill', rank });
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
      const look: Look = { night: nightNow(), reduced };
      const motion = r.frame(t, frames, look);
      const shown = parts.labelsOf(frames, { t, hover: L.hover, held: L.held, agents: L.agents });
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
      if (JSON.stringify([...parts.activities(live.current.snap, Date.now() / 1000)]) === lastActs) return;
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
      kickRef.current = () => undefined;
      pick.current = () => null;
      r?.dispose();
    };
  }, [parts, layoutTags]);

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
  const setHover = (name: string | null) => {
    if (live.current.hover === name) return;
    live.current.hover = name;
    kickRef.current();
  };
  const pickEvent = (e: { clientX: number; clientY: number }): string | null => {
    const box = holder.current;
    if (box === null) return null;
    const at = box.getBoundingClientRect();
    return pick.current(e.clientX - at.left, e.clientY - at.top);
  };

  if (state === 'lost')
    return (
      <>
        {/* its own element: React would reuse the holder's div here, the height resize() set on it
            by hand included (a 212 px line, bims-qa m_27786) */}
        <div key="lost" className="bims-lost" data-testid="app.right.bims.lost">
          {bims.lost}
        </div>
        {fallback}
      </>
    );
  return (
    <>
      <div
        key="office"
        className="bims-office"
        ref={holder}
        data-testid="app.right.bims"
        data-state={state}
        data-pointer={pointer || undefined}
        onPointerMove={(e) => {
          const name = pickEvent(e);
          setPointer(name !== null);
          if (name === pending.current) return;
          pending.current = name;
          clearTimeout(hoverTimer.current);
          if (name === null) setHover(null);
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
          const name = pickEvent(e);
          if (name !== null) onOpen(name);
        }}
      >
        <canvas ref={canvas} className="bims-canvas" data-testid="app.right.bims.canvas" />
        <div className="bims-overlay">
          <svg ref={leaders} className="bims-leaders" aria-hidden="true" />
          <div ref={moreRef} className="bims-more" data-testid="app.right.bims.more" />
          {[...labels.values()].map((l) => {
            const tag = tagOf(l);
            return (
              <div
                key={l.name}
                className="bims-tag"
                data-mode={l.mode}
                ref={(el) => {
                  if (el === null) tags.current.delete(l.name);
                  else {
                    tags.current.set(l.name, el);
                    layoutTags();
                  }
                }}
              >
                {tag.text !== null && (
                  <span className="bims-label" data-mode={l.mode} data-testid={`app.right.bims.label.${l.name}`}>
                    {boxW > 0 ? cutWords(tag.text, boxW - 2 * TAG_INSET - CHIP_PAD - (tag.pill === null ? 0 : PILL_ROOM), measure) : tag.text}
                  </span>
                )}
                {tag.pill !== null && (
                  <span
                    className={`bims-pill ${tag.pill}`}
                    data-pill={tag.pill}
                    data-testid={`app.right.bims.pill.${l.name}`}
                    {...tipAttrs(tag.pill === 'asks' ? bims.pill_asks_tip({ agent: l.name }) : bims.pill_failed_tip({ agent: l.name }))}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(l.name);
                    }}
                  >
                    {tag.pill === 'asks' ? '?' : '✗'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {state === 'loading' && fallback}
    </>
  );
}
