// The town on bise's thread (page bims-maps v9 « une ville moins robotique », Gabriel: « La ville pour
// bise global c'est une bonne idée aussi! »): the right bar's office for every project at once, one
// office per project on its own map and growth (town/sites.ts), laid out with its road and river
// (town/plan.ts), each with a sign in front: its name, ∿ its agents at work, a pink ? n for his open
// questions. A click on an office or its sign dives in (bims m_28719, m_28737): the camera eases
// (DIVE_S) to the exact fit that project's Office opens with, then that Office takes over in the
// same box (its bims live, its cards, its clicks), the sign keeps an 'open' that opens the project's
// main thread; esc or '⤢ town' fades the town back in at that framing and eases out. Reduced motion:
// cuts. The dive is kept per window (keep.ts). Each office is its project's own (page town-live):
// one brain per project (office-driver.ts, the minimap's) fed its rows; from afar its scene baked
// still with the real bims at their state's spot, baked again only when a still pose changes; close
// up (the dive) the offices in view posed live at the minimap's own rates (loop.ts). An idle town
// draws nothing. Owner: maps-e.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Press, tipAttrs } from '@/ds';
import { reducedMotion } from '@/ds/hooks';
import { bims } from '@/proto/words_bims.gen';
import { keep } from '@/app/keep';
import type { ActivitiesFn, LayoutFn } from '../model';
import { Office, type Parts } from '../Office';
import { growOf } from '../growth';
import { growHigh } from '../grow-keep';
import { CHECK_MS, nextAfter } from '../loop';
import { awayNow, nightNow, testMode } from '../room';
import { localOf } from '../eggs';
import { makeDriver, NO_ATTENTION, type Clock, type OfficeDriver } from '../office-driver';
import type { Fit } from '../render/camera';
import { atFit, DRAG_PX, FIT, panBy, sameCam, wheelCam, type Cam } from '../zoom';
import { DIVE_S, diveAt } from './dive';
import { liveAgents, signOf, townProjects, type TownProject } from './sites';
import type { MakeTownRenderer, TownRenderer, TownSite } from './types';
import { placeSigns as placeSignsAt, type SignIn } from './signs';

/** The town's parts: the office's (its dive opens one), the pure modules it reads, its renderer's loader. */
export interface TownParts {
  readonly office: Parts;
  readonly activities: ActivitiesFn;
  readonly layoutOf: LayoutFn;
  readonly load: () => Promise<MakeTownRenderer>;
}

/** where the town is: the town, diving in, the Office fading in over it, the Office, the town fading back, easing out */
type Phase = 'town' | 'in' | 'swapIn' | 'office' | 'swapOut' | 'out';

const DIVE_KEY = 'bims.town.dive';
/** a compact sign's padding round its pills (office.css .bims-sign) */
const SIGN_PAD = 8;
/** offices baked again per frame at most (page town-live: ~85 ms each, the town fills in) */
const BAKES_PER_FRAME = 1;
/** the fade between the town and the Office (office.css .bims-town-top) */
const SWAP_MS = 260;

/** test mode: why each frame was asked for (window.__biseTownWhy, the idle checks print it) */
const whyFrame = (why: string): void => {
  if (!testMode()) return;
  const w = window as { __biseTownWhy?: { t: number; why: string }[] };
  w.__biseTownWhy = [...(w.__biseTownWhy ?? []).slice(-99), { t: Date.now(), why }];
};

/** One project's office for the plan: its office on its map, its growth (the office's high-water mark). */
function siteOf(p: TownProject, parts: TownParts): TownSite {
  return { id: p.id, office: parts.layoutOf(liveAgents(p), p.map), grow: growOf(testMode() ? p.growth : growHigh(p.id, p.growth)), ...(p.home === true ? { home: true } : {}) };
}

/** the clock a town frame is drawn at (office-driver.ts Clock); a check's town rolls no egg */
const clockAt = (t: number): Clock => ({ t, local: localOf(new Date(t * 1000)), night: nightNow(), reduced: reducedMotion(), ...(testMode() ? { forced: null } : {}) });

export function Town({
  projects,
  parts,
  onOpenProject,
  onOpenAgent,
}: {
  /** every project, bise's home among them (town/useTown.ts) */
  projects: readonly TownProject[];
  parts: TownParts;
  /** 'open' on the dived office's sign: the project's main thread */
  onOpenProject: (project: string) => void;
  /** a click on a bim in the dived Office: that agent's thread */
  onOpenAgent: (project: string, agent: string) => void;
}) {
  const shown = useMemo(() => townProjects(projects), [projects]);
  const [state, setState] = useState<'loading' | 'on' | 'lost'>('loading');
  // the dived project, kept per window; gone from the town (no such project now): the town
  const [dive, setDive] = useState<string | null>(() => {
    const k = keep.view(DIVE_KEY);
    return typeof k === 'string' ? k : null;
  });
  const dived = dive !== null && shown.some((p) => p.id === dive) ? dive : null;
  const [kept, setPhase] = useState<Phase>(dived !== null ? 'office' : 'town');
  // a kept dive whose project left the town: the town
  const phase: Phase = dived === null && (kept === 'swapIn' || kept === 'office' || kept === 'swapOut') ? 'town' : kept;
  const phaseRef = useRef<Phase>(phase);
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const signs = useRef(new Map<string, HTMLDivElement>());
  const rRef = useRef<TownRenderer | null>(null);
  const kickRef = useRef<(why?: string) => void>(() => undefined);
  // the dive's way: from the town's fit to the Office's, its start time (s, set by its first frame); null: still
  const anim = useRef<{ from: Fit; to: Fit; at: number | null; back: boolean } | null>(null);
  const [pointer, setPointer] = useState(false);
  // the office under his pointer: its sign shows whole first (its name back, bims m_30199)
  const hoverRef = useRef<string | null>(null);
  // his camera over the town (zoom.ts, the minimap's): pinch to zoom, two fingers or a drag to move,
  // esc or a double-click on the lawn back to the whole town; `fitted` re-renders the box's data-zoomed
  const camRef = useRef<Cam>(FIT);
  const [fitted, setFitted] = useState(true);
  const moveCam = useCallback((c: Cam) => {
    if (sameCam(c, camRef.current)) return;
    camRef.current = c;
    setFitted(atFit(c));
    rRef.current?.setCam(c);
    kickRef.current('cam');
  }, []);
  // a drag moves the view while zoomed; past DRAG_PX it is never a click
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const dragged = useRef(false);

  // the town's offices: each project's ground for the plan (laid again only when a ground changes),
  // and its brain (office-driver.ts, the minimap's), told of its rows: the same office as its minimap
  const sites = useMemo(() => shown.map((p) => siteOf(p, parts)), [shown, parts]);
  const drivers = useRef(new Map<string, OfficeDriver>());
  useEffect(() => {
    const t = Date.now() / 1000;
    const keepIds = new Set(shown.map((p) => p.id));
    for (const id of [...drivers.current.keys()]) if (!keepIds.has(id)) drivers.current.delete(id);
    for (const p of shown) {
      let d = drivers.current.get(p.id);
      if (d === undefined) {
        d = makeDriver(parts.office);
        drivers.current.set(p.id, d);
      }
      const agents = liveAgents(p);
      d.rows({ agents: p.agents, cards: p.cards, places: p.places }, agents, p.map);
      d.grow(sites.find((x) => x.id === p.id)?.grow ?? growOf(null), t);
    }
    kickRef.current('rows');
  }, [shown, parts, sites]);
  const live = useRef({ sites, dived });
  useLayoutEffect(() => {
    live.current = { sites, dived };
    phaseRef.current = phase;
  });
  const signsOf = useMemo(() => new Map(shown.map((p) => [p.id, signOf(p)])), [shown]);

  /**
   * The offices not posed live, baked still again where a still pose changed (the renderer compares):
   * BAKES_PER_FRAME at most (a bake is ~85 ms), the town filling in a few frames; true: more to bake.
   */
  const stills = useCallback((r: TownRenderer): boolean => {
    const c = clockAt(Date.now() / 1000);
    const on = new Set(r.liveIds());
    let baked = 0;
    for (const [id, d] of drivers.current) {
      if (on.has(id)) continue;
      const st = d.still(c);
      if (st === null) continue;
      if (baked >= BAKES_PER_FRAME) return true;
      if (r.still(id, st)) baked++;
    }
    return false;
  }, []);

  // a still town looks at its rows' clock now and then (a long turn, a trip): a frame only when an
  // office was baked again (an agent's state changed), never for office life
  useEffect(() => {
    const id = setInterval(() => {
      const r = rRef.current;
      if (awayNow() || r === null) return;
      const c = clockAt(Date.now() / 1000);
      const stale = [...drivers.current.values()].map((d) => d.stale(c)).some(Boolean);
      if (!stale) return;
      if (r.liveIds().length > 0) {
        kickRef.current('check-live');
        return;
      }
      const on = new Set(r.liveIds());
      let baked = false;
      for (const [pid, d] of drivers.current) {
        if (on.has(pid)) continue;
        const st = d.still(c);
        if (st !== null && r.still(pid, st)) baked = true;
      }
      if (baked) kickRef.current('check-baked');
    }, CHECK_MS);
    return () => {
      clearInterval(id);
    };
  }, [shown, parts]);

  /** each sign over its office (tags.ts placeTags: none over another), the dived one alone while the Office shows */
  const placeSigns = useCallback((r: TownRenderer) => {
    const box = holder.current;
    if (box === null) return;
    const ins: SignIn[] = [];
    const ph = phaseRef.current;
    const only = ph === 'office' || ph === 'swapIn' || ph === 'swapOut';
    for (const [id, el] of signs.current) {
      const at = only && id !== live.current.dived ? null : r.signAt(id);
      el.style.visibility = at === null ? 'hidden' : '';
      if (at === null) continue;
      // measured whole (a compact sign shows its pills alone: office.css)
      delete el.dataset.compact;
      const pill = el.querySelector<HTMLElement>('.bims-pill');
      const first = id === live.current.dived || id === hoverRef.current;
      ins.push({ id, x: at.x, y: at.y, w: el.offsetWidth, h: el.offsetHeight, pillW: pill === null ? 0 : pill.offsetWidth + SIGN_PAD, pillH: pill === null ? 0 : pill.offsetHeight + SIGN_PAD, rank: first ? 0 : pill !== null ? 1 : 2 });
    }
    // at the town's fit a sign with no room keeps its pills alone; zoomed in or dived, every name shows
    const atFitNow = !only && atFit(camRef.current) && anim.current === null;
    const fit = only ? null : r.townFit();
    const w = box.clientWidth;
    const h = fit?.heightPx ?? box.clientHeight;
    const at = placeSignsAt(ins, w, h, atFitNow);
    for (const t of ins) {
      const el = signs.current.get(t.id);
      const p = at.get(t.id);
      if (el === undefined) continue;
      el.style.visibility = p === undefined ? 'hidden' : '';
      if (p === undefined) continue;
      if (p.compact) el.dataset.compact = '';
      el.style.transform = `translate(${p.left.toFixed(1)}px, ${p.top.toFixed(1)}px)`;
    }
  }, []);

  // the renderer: loaded once, fed the town at each change, one frame per kick
  useEffect(() => {
    const cv = canvas.current;
    const box = holder.current;
    if (cv === null || box === null) return undefined;
    let gone = false;
    let raf = 0;
    let tick: ReturnType<typeof setTimeout> | undefined;
    let r: TownRenderer | null = null;
    const draw = () => {
      raf = 0;
      tick = undefined;
      if (r === null || gone || awayNow()) return;
      const a = anim.current;
      let more = false;
      if (a !== null) {
        const now = performance.now() / 1000;
        a.at ??= now;
        const f = reducedMotion() ? 1 : Math.min(1, (now - a.at) / DIVE_S);
        const view = a.back ? diveAt(a.to, a.from, f) : diveAt(a.from, a.to, f);
        r.setView(a.back && f >= 1 ? null : view);
        box.style.height = `${String(view.heightPx)}px`;
        more = f < 1;
        if (!more) {
          anim.current = null;
          if (!a.back) setPhase('swapIn');
          else setPhase('town');
        }
      } else if (phaseRef.current === 'town') {
        const fit = r.townFit();
        if (fit !== null) box.style.height = `${String(fit.heightPx)}px`;
      }
      // the offices from afar baked still (again only on a change), the ones close up posed live:
      // each asks for its next frame as its minimap would (loop.ts nextAfter), the soonest wins
      const baking = stills(r);
      const t = Date.now() / 1000;
      const c = clockAt(t);
      let next: number | null = null;
      for (const id of r.liveIds()) {
        const step = drivers.current.get(id)?.step(c, NO_ATTENTION);
        if (step == null) continue;
        const motion = r.live(id, step, t);
        const n = nextAfter({ motion, moving: step.moving, labels: new Map(), away: awayNow(), lost: false });
        if (n !== null) next = next === null ? n : Math.min(next, n);
      }
      r.frame(nightNow());
      placeSigns(r);
      if (more || baking || next === 0) {
        whyFrame(more ? 'dive' : baking ? 'baking' : 'live');
        raf = requestAnimationFrame(draw);
      } else if (next !== null) {
        whyFrame('live-tick');
        tick = setTimeout(draw, next);
      }
    };
    const kick = (why = 'kick') => {
      if (r === null || gone || awayNow() || raf !== 0) return;
      whyFrame(why);
      if (tick !== undefined) clearTimeout(tick);
      tick = undefined;
      raf = requestAnimationFrame(draw);
    };
    kickRef.current = kick;
    const resize = () => {
      if (r === null) return;
      const w = box.clientWidth;
      if (w <= 0) return;
      r.setSize(w, 4000);
      const d = live.current.dived;
      const ph = phaseRef.current;
      // the Office's own view at the new width, so the way out starts where it is
      if (d !== null && ph !== 'town') {
        const to = r.diveFit(d, w);
        if (to !== null) r.setView(to);
      } else r.setView(null);
    };
    const sized = new ResizeObserver(() => {
      resize();
      kick('resize');
    });
    sized.observe(box);
    // a pinch (Chromium: a wheel with ctrlKey) zooms the town around the pointer; two fingers move it while zoomed
    const onWheel = (e: WheelEvent) => {
      if (phaseRef.current !== 'town') return;
      const at = box.getBoundingClientRect();
      const c = wheelCam(camRef.current, { dx: e.deltaX, dy: e.deltaY, mode: e.deltaMode, ctrl: e.ctrlKey }, e.clientX - at.left, e.clientY - at.top, at.width, at.height, box.clientHeight);
      if (c === null) return;
      e.preventDefault();
      moveCam(c);
    };
    box.addEventListener('wheel', onWheel, { passive: false });
    const onWindow = () => {
      if (!awayNow()) kick('window');
    };
    document.addEventListener('visibilitychange', onWindow);
    window.addEventListener('focus', onWindow);
    const onTheme = (): void => {
      kick('theme');
    };
    const theme = new MutationObserver(onTheme);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const schemeMq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: light)') : null;
    schemeMq?.addEventListener('change', onTheme);
    parts
      .load()
      .then((make) => {
        if (gone) return;
        const made = make(cv);
        r = made;
        rRef.current = made;
        made.onLost(() => {
          if (!gone) setState('lost');
        });
        made.setTown(live.current.sites);
        made.setCam(camRef.current);
        resize();
        setState('on');
        kick('load');
      })
      .catch(() => {
        if (!gone) setState('lost');
      });
    return () => {
      gone = true;
      if (raf !== 0) cancelAnimationFrame(raf);
      if (tick !== undefined) clearTimeout(tick);
      sized.disconnect();
      box.removeEventListener('wheel', onWheel);
      document.removeEventListener('visibilitychange', onWindow);
      window.removeEventListener('focus', onWindow);
      theme.disconnect();
      schemeMq?.removeEventListener('change', onTheme);
      kickRef.current = () => undefined;
      rRef.current = null;
      r?.dispose();
    };
  }, [parts, placeSigns, stills, moveCam]);

  // a change of the town: its plan again if a ground changed, the offices' rows heard at the next frame
  useEffect(() => {
    const r = rRef.current;
    if (r === null) return;
    r.setTown(sites);
    if (phaseRef.current === 'town') r.setView(null);
    kickRef.current('sites');
  }, [sites]);
  // the signs' words changed (a count): placed again
  useEffect(() => {
    kickRef.current('signs');
  }, [signsOf, phase]);

  const keepDive = (id: string | null) => {
    keep.setView(DIVE_KEY, id ?? undefined);
    setDive(id);
  };
  /** into an office: the camera eases to the Office's own fit, then the Office fades in */
  const diveInto = (id: string) => {
    const r = rRef.current;
    const box = holder.current;
    if (r === null || box === null || phaseRef.current !== 'town') return;
    const from = r.shownFit();
    const to = r.diveFit(id, box.clientWidth);
    if (from === null || to === null) return;
    keepDive(id);
    // the way out eases to the whole town
    camRef.current = FIT;
    setFitted(true);
    r.setCam(FIT);
    anim.current = { from, to, at: null, back: false };
    setPhase('in');
    phaseRef.current = 'in';
    kickRef.current('dive');
  };
  /** back to the town: it fades in over the Office at the Office's framing, then eases out */
  const backOut = useCallback(() => {
    const ph = phaseRef.current;
    if (ph !== 'office' && ph !== 'swapIn') return;
    setPhase('swapOut');
  }, []);
  // the swaps: the Office shows under the town, the town fades; and back
  useEffect(() => {
    const reduced = reducedMotion();
    if (phase === 'swapIn') {
      const id = setTimeout(() => {
        setPhase('office');
      }, reduced ? 0 : SWAP_MS + 120);
      return () => {
        clearTimeout(id);
      };
    }
    if (phase === 'swapOut') {
      const r = rRef.current;
      const box = holder.current;
      const d = live.current.dived;
      const to = r !== null && box !== null && d !== null ? r.diveFit(d, box.clientWidth) : null;
      if (r !== null && box !== null && to !== null) {
        r.setView(to);
        box.style.height = `${String(to.heightPx)}px`;
        kickRef.current('swapOut');
        const id = setTimeout(() => {
          const from = r.townFit();
          keepDive(null);
          if (from === null) {
            setPhase('town');
            return;
          }
          anim.current = { from, to, at: null, back: true };
          setPhase('out');
          phaseRef.current = 'out';
          kickRef.current('swapOut2');
        }, reduced ? 0 : SWAP_MS);
        return () => {
          clearTimeout(id);
        };
      }
      keepDive(null);
      setPhase('town');
    }
    return undefined;
  }, [phase]);
  const pickAt = (e: { clientX: number; clientY: number }): string | null => {
    const box = holder.current;
    const r = rRef.current;
    if (box === null || r === null || phaseRef.current !== 'town') return null;
    const at = box.getBoundingClientRect();
    return r.pick(e.clientX - at.left, e.clientY - at.top);
  };

  if (state === 'lost' || shown.length === 0)
    return state === 'lost' ? (
      <div key="lost" className="bims-lost" data-testid="app.right.bims.lost">
        {bims.lost}
      </div>
    ) : null;
  const officeOn = phase === 'swapIn' || phase === 'office' || phase === 'swapOut';
  const project = dived === null ? undefined : shown.find((p) => p.id === dived);
  return (
    <div
      className="bims-town-box"
      data-phase={phase}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || !officeOn) return;
        e.stopPropagation();
        backOut();
      }}
    >
      {officeOn && project !== undefined && (
        <Office
          project={project.id}
          agents={liveAgents(project)}
          cards={project.cards}
          places={project.places}
          growth={project.growth}
          map={project.map}
          parts={parts.office}
          onOpen={(agent) => {
            onOpenAgent(project.id, agent);
          }}
        />
      )}
      <div
        ref={holder}
        className="bims-office bims-town"
        tabIndex={0}
        aria-label={bims.town_label}
        data-testid="app.right.bims.town"
        data-state={state}
        data-shown={state === 'on' || undefined}
        data-phase={phase}
        data-dive={dived ?? undefined}
        data-pointer={pointer || undefined}
        data-top={officeOn || undefined}
        data-fade={phase === 'swapIn' ? 'out' : undefined}
        data-zoomed={!fitted || undefined}
        onPointerDown={(e) => {
          if (e.button !== 0 || fitted || phaseRef.current !== 'town') return;
          drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
          dragged.current = false;
        }}
        onPointerUp={() => {
          if (drag.current?.moved === true) dragged.current = true;
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
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
            }
            d.x = e.clientX;
            d.y = e.clientY;
            const box = e.currentTarget.getBoundingClientRect();
            moveCam(panBy(camRef.current, dx, dy, box.width, box.height));
            return;
          }
          const over = pickAt(e);
          setPointer(over !== null);
          if (over !== hoverRef.current) {
            hoverRef.current = over;
            const r = rRef.current;
            if (r !== null) placeSigns(r);
          }
        }}
        onPointerLeave={() => {
          setPointer(false);
          if (hoverRef.current !== null) {
            hoverRef.current = null;
            const r = rRef.current;
            if (r !== null) placeSigns(r);
          }
        }}
        onClick={(e) => {
          if (dragged.current) {
            dragged.current = false;
            return;
          }
          const id = pickAt(e);
          if (id !== null) diveInto(id);
        }}
        onDoubleClick={(e) => {
          // on the lawn only: a click on an office already dived into it
          if (pickAt(e) === null) moveCam(FIT);
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return;
          if (officeOn) {
            e.stopPropagation();
            backOut();
          } else if (!fitted) {
            e.stopPropagation();
            moveCam(FIT);
          }
        }}
      >
        <canvas ref={canvas} className="bims-canvas" data-testid="app.right.bims.town.canvas" />
        <div className="bims-overlay" data-testid="app.right.bims.town.signs">
          {shown.map((p) => {
            const s = signsOf.get(p.id) ?? signOf(p);
            const here = p.id === dived && officeOn;
            return (
              <div
                key={p.id}
                className="bims-sign"
                data-here={here || undefined}
                data-testid={`app.right.bims.town.sign.${p.id}`}
                aria-label={bims.town_sign_label({ project: s.name, at_work: s.working, asks: s.asks })}
                ref={(el) => {
                  if (el === null) signs.current.delete(p.id);
                  else signs.current.set(p.id, el);
                }}
                {...(here ? {} : tipAttrs(bims.town_sign_tip({ project: s.name })))}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!here) diveInto(p.id);
                }}
              >
                <span className="bims-sign-name">{s.name}</span>
                <span className="bims-sign-work" data-testid={`app.right.bims.town.working.${p.id}`}>∿ {s.working}</span>
                {s.asks > 0 && (
                  <span className="bims-pill asks" data-testid={`app.right.bims.town.asks.${p.id}`}>
                    ? {s.asks}
                  </span>
                )}
                {here && (
                  <Press
                    look="bims-sign-open"
                    data-testid="app.right.bims.town.open"
                    {...tipAttrs(bims.town_open_tip({ project: s.name }))}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProject(p.id);
                    }}
                  >
                    {bims.town_open} ›
                  </Press>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {officeOn && (
        <Press
          look="bims-town-back"
          data-testid="app.right.bims.town.back"
          {...tipAttrs(bims.town_back_tip, 'esc')}
          onClick={(e) => {
            e.stopPropagation();
            backOut();
          }}
        >
          <span aria-hidden="true">⤢</span> {bims.town_back}
        </Press>
      )}
    </div>
  );
}

