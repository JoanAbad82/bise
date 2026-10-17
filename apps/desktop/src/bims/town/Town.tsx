// The town on bise's thread (page bims-maps v9 « une ville moins robotique », Gabriel: « La ville pour
// bise global c'est une bonne idée aussi! »): the right bar's office for every project at once, one
// office per project on its own map and growth (town/sites.ts), laid out with its road and river
// (town/plan.ts), each with a sign in front: its name, ∿ its agents at work, a pink ? n for his open
// questions. A click on an office or its sign dives in (bims m_28719, m_28737): the camera eases
// (DIVE_S) to the exact fit that project's Office opens with, then that Office takes over in the
// same box (its bims live, its cards, its clicks), the sign keeps an 'open' that opens the project's
// main thread; esc or '⤢ town' fades the town back in at that framing and eases out. Reduced motion:
// cuts. The dive is kept per window (keep.ts). The far offices are merged objects with still
// silhouettes; the town draws one frame on a change (a row, a size, the theme) and during the dive,
// never on a timer: an idle town draws nothing. Owner: maps-e.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Press, tipAttrs } from '@/ds';
import { reducedMotion } from '@/ds/hooks';
import { bims } from '@/proto/words_bims.gen';
import { keep } from '@/app/keep';
import type { ActivitiesFn, LayoutFn } from '../model';
import { Office, type Parts } from '../Office';
import { bedsAt, growOf } from '../growth';
import { growHigh } from '../grow-keep';
import { away, CHECK_MS } from '../loop';
import type { Fit } from '../render/camera';
import { DIVE_S, diveAt } from './dive';
import { liveAgents, signOf, townProjects, type TownProject } from './sites';
import { stillOf, stillSig } from './stand';
import type { MakeTownRenderer, TownOffice, TownRenderer } from './types';
import { placeTags, type TagIn } from '../tags';

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
/** the fade between the town and the Office (office.css .bims-town-top) */
const SWAP_MS = 260;

const testMode = (): boolean => (window as { bise?: { test?: boolean } }).bise?.test === true;
const awayNow = (): boolean => away({ hidden: document.hidden, focused: document.hasFocus(), test: testMode() });
const nightNow = (): boolean => {
  const set = document.documentElement.dataset.theme;
  if (set !== undefined) return set === 'dark';
  return !(typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches);
};

/** One project's office for the town: its plan's office on its map, its growth (the office's high-water mark), its still bims. */
function townOfficeOf(p: TownProject, parts: TownParts, t: number): TownOffice {
  const agents = liveAgents(p);
  const office = parts.layoutOf(agents, p.map);
  const grow = growOf(testMode() ? p.growth : growHigh(p.id, p.growth));
  const main = agents.find((a) => a.main)?.name ?? 'main';
  const acts = parts.activities({ agents: p.agents, cards: p.cards, places: p.places }, t);
  return { id: p.id, office, main, grow, still: stillOf(office, acts, main, bedsAt(grow.stage)) };
}

export function Town({
  projects,
  parts,
  onOpenProject,
  onOpenAgent,
}: {
  /** every project but bise's home (town/useTown.ts) */
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
  const kickRef = useRef<() => void>(() => undefined);
  // the dive's way: from the town's fit to the Office's, its start time (s, set by its first frame); null: still
  const anim = useRef<{ from: Fit; to: Fit; at: number | null; back: boolean } | null>(null);
  const [pointer, setPointer] = useState(false);

  // the town's offices and its plan: the offices when a row changes, the plan only when a ground does
  const [at, setAt] = useState(() => Date.now() / 1000);
  const offices = useMemo(() => shown.map((p) => townOfficeOf(p, parts, at)), [shown, parts, at]);
  const live = useRef({ offices, dived });
  useLayoutEffect(() => {
    live.current = { offices, dived };
    phaseRef.current = phase;
  });
  const signsOf = useMemo(() => new Map(shown.map((p) => [p.id, signOf(p)])), [shown]);

  // a still town looks at its rows' clock now and then (a long turn, a trip): new stills only on a change
  useEffect(() => {
    const id = setInterval(() => {
      if (awayNow()) return;
      const t = Date.now() / 1000;
      const now = shown.map((p) => stillSig(townOfficeOf(p, parts, t).still)).join('|');
      if (now !== live.current.offices.map((o) => stillSig(o.still)).join('|')) setAt(t);
    }, CHECK_MS);
    return () => {
      clearInterval(id);
    };
  }, [shown, parts]);

  /** each sign over its office (tags.ts placeTags: none over another), the dived one alone while the Office shows */
  const placeSigns = useCallback((r: TownRenderer) => {
    const box = holder.current;
    if (box === null) return;
    const ins: TagIn[] = [];
    const ph = phaseRef.current;
    for (const [id, el] of signs.current) {
      const only = ph === 'office' || ph === 'swapIn' || ph === 'swapOut';
      const at = only && id !== live.current.dived ? null : r.signAt(id);
      el.style.visibility = at === null ? 'hidden' : '';
      if (at === null) continue;
      ins.push({ name: id, x: at.x, y: at.y, w: el.offsetWidth, h: el.offsetHeight, pill: id === live.current.dived, rank: id === live.current.dived ? 0 : 2 });
    }
    const fit = live.current.dived !== null && (ph === 'office' || ph === 'swapIn' || ph === 'swapOut') ? null : r.townFit();
    const w = box.clientWidth;
    const h = fit?.heightPx ?? box.clientHeight;
    const { at } = placeTags(ins, w, h);
    for (const t of ins) {
      const el = signs.current.get(t.name);
      const p = at.get(t.name);
      if (el === undefined) continue;
      el.style.visibility = p === undefined ? 'hidden' : '';
      if (p !== undefined) el.style.transform = `translate(${p.left.toFixed(1)}px, ${p.top.toFixed(1)}px)`;
    }
  }, []);

  // the renderer: loaded once, fed the town at each change, one frame per kick
  useEffect(() => {
    const cv = canvas.current;
    const box = holder.current;
    if (cv === null || box === null) return undefined;
    let gone = false;
    let raf = 0;
    let r: TownRenderer | null = null;
    const draw = () => {
      raf = 0;
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
      const ph = phaseRef.current;
      r.frame(nightNow(), ph === 'town' ? null : live.current.dived);
      placeSigns(r);
      if (more) raf = requestAnimationFrame(draw);
    };
    const kick = () => {
      if (r === null || gone || awayNow() || raf !== 0) return;
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
      kick();
    });
    sized.observe(box);
    const onWindow = () => {
      if (!awayNow()) kick();
    };
    document.addEventListener('visibilitychange', onWindow);
    window.addEventListener('focus', onWindow);
    const theme = new MutationObserver(kick);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const schemeMq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: light)') : null;
    schemeMq?.addEventListener('change', kick);
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
        made.setTown(live.current.offices);
        resize();
        setState('on');
        kick();
      })
      .catch(() => {
        if (!gone) setState('lost');
      });
    return () => {
      gone = true;
      if (raf !== 0) cancelAnimationFrame(raf);
      sized.disconnect();
      document.removeEventListener('visibilitychange', onWindow);
      window.removeEventListener('focus', onWindow);
      theme.disconnect();
      schemeMq?.removeEventListener('change', kick);
      kickRef.current = () => undefined;
      rRef.current = null;
      r?.dispose();
    };
  }, [parts, placeSigns]);

  // a change of the town: what changed is built again, one frame
  useEffect(() => {
    const r = rRef.current;
    if (r === null) return;
    r.setTown(offices);
    if (phaseRef.current === 'town') r.setView(null);
    kickRef.current();
  }, [offices]);
  // the signs' words changed (a count): placed again
  useEffect(() => {
    kickRef.current();
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
    const from = r.townFit();
    const to = r.diveFit(id, box.clientWidth);
    if (from === null || to === null) return;
    keepDive(id);
    anim.current = { from, to, at: null, back: false };
    setPhase('in');
    phaseRef.current = 'in';
    kickRef.current();
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
        kickRef.current();
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
          kickRef.current();
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
        onPointerMove={(e) => {
          setPointer(pickAt(e) !== null);
        }}
        onPointerLeave={() => {
          setPointer(false);
        }}
        onClick={(e) => {
          const id = pickAt(e);
          if (id !== null) diveInto(id);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && officeOn) {
            e.stopPropagation();
            backOut();
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

