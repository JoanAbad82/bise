// The hero film (bise.dev/desktop, page bims-film v4): the app's own town renderer (render/town.ts)
// in the page's box (the whole town at its fit, the page's paper round it), every office posed live, driven by the film's offices (run.ts)
// and its director (director.ts); the words over it (overlay.ts); the visitor's hands (gestures.ts).
// One frame per animation frame while the box is on screen and the tab shown; none otherwise, and
// the film's clock waits (it goes on where it was); 30 fps while nothing of his moves and the camera
// holds (designer m_30837). The sky is the page's paper. Reduced motion: no film, the 0:00 frame posed
// still, his pan and zoom drawn on demand, cuts. Loaded by hero.ts (this chunk holds three).
// Owner: hero-town.
import type { Label } from '../bims/model';
import { siteOf, toScreen, type Fit } from '../bims/render/camera';
import { makeTownRenderer } from '../bims/render/town';
import { growOf } from '../bims/growth';
import { layoutOf } from '../bims/maps';
import { sleepers } from '../bims/zzz';
import { NO_ATTENTION, type Step } from '../bims/office-driver';
import type { Cam } from '../bims/zoom';
import type { TownSite } from '../bims/town/types';
import { BUBBLE_S, BUBBLES, CAST, FOLD_S, PAGE, REDUCED_T, SHOTS, STAMP, type Bubble, type Shot } from './cast';
import { makeFeed } from './feed';
import { makePage, type KilnLoader } from './page';
import { aimCam, drift, GLIDE_IN_S, glideCam, glideOf, holdCam, LEAD_S, officeOf, OFFICE_BOX, fitCam, present, RESUME_S, resumes, shotAt, shotCam, springStep, still, type At, type Box, type Geometry, type Hands, type Spring } from './director';
import { easeInOut, ENTRY, feedOpacity, makeEntry, wordsAt } from './entry';
import { makeGestures } from './gestures';
import { eggWords, makeOverlay } from './overlay';
import { advance, makeRuns, stepOf, type Run } from './run';
import { eggsAt, filmT, ORIGIN, rowsAt, growthOf } from './world';

export type Theme = 'light' | 'dark';

export interface FilmOpts {
  readonly theme?: Theme;
  /** the page's paper by theme: the town's sky, so the canvas has no edge */
  readonly ground?: { readonly light: string; readonly dark: string };
  readonly reduced?: boolean;
  /** the checks' probe: window.__bimsHero */
  readonly probe?: boolean;
  /** film time to start at, s (a check's shot: no entry build) */
  readonly startT?: number;
  /** the entry build held at this ms (a check's frame of the build strip) */
  readonly entryAt?: number;
  /** with the probe: no loop, the check draws each frame (probe.step) */
  readonly manual?: boolean;
  /** kiln's shop, its own chunk, loaded by the entry (hero.ts: both lazy imports there keep the entry whole) */
  readonly kiln?: KilnLoader;
  /** the visitor took the camera ('control'), the film took it back ('film'); the first frame is drawn ('ready'); no WebGL ('lost') */
  readonly on?: (e: 'control' | 'film' | 'ready' | 'lost') => void;
}

export interface Film {
  setTheme(t: Theme): void;
  /** the film takes the camera back (the page's '▶ back to the film') */
  resumeFilm(): void;
  /** his + and − (the page's buttons): zoom around the frame's middle */
  zoomBy(factor: number): void;
  dispose(): void;
}

interface Probe {
  frames: number;
  ms: number[];
  T: number;
  hands: string;
  shot: number;
  cam: Cam;
  /** the last frames' phases, ms: the offices' brains, their poses, the draw, the words */
  phases: { brain: number; pose: number; draw: number; words: number }[];
  /** each office at the last frame: drawn live, its bims (where the driver poses them, on the canvas or not) */
  offices: { id: string; live: boolean; bims: { name: string; k: string; x: number; z: number; head: boolean }[] }[];
  /** the entry build's ms at the last frame (≥ 2800: the film runs) */
  entry?: number;
  /** FilmOpts.manual: draw one frame, ms after the last */
  step?: (ms: number) => void;
  /** a check's camera (the pop-in strip): held where it is put, or on a bim at that zoom; the visitor's hands */
  look?: (at: Cam | { office: string; name: string; zoom: number }) => void;
}

/** the page's paper (designer m_30837) */
const PAPER = { light: '#f7f2e9', dark: '#24201c' } as const;
/** the frame rate while nothing of his moves and the camera holds (designer: 30 when the page is idle) */
const IDLE_MS = 1000 / 30;
/** 'ready' on the first frame after the warm one this cheap, ms, or READY_WAIT frames after it at most */
const READY_MS = 30;
const READY_WAIT = 4;
/** the night's light on a dark page, times the app's (bims m_31057: the town sank into the page) */
const NIGHT_LIFT = 1.25;
/** where a word over a bim may sit, fractions of the box's width (the left fades into the page's text) */
const SAFE_X = { x0: 0.3, x1: 0.85 } as const;
/** an egg's words show this long from its start (designer m_30865) */
const EGG_S = 2;
/** a bim's body's middle over the floor, world units */
const BODY_Y = 0.9;
/** an office's walls' height, world units: its box on the fit goes that high */
const WALL_Y = 2.6;

export function playFilm(box: HTMLElement, opts: FilmOpts = {}): Film {
  let dark = opts.theme === 'dark';
  const night = (): boolean => dark;
  const reduced = opts.reduced === true;
  const emit = opts.on ?? ((): void => undefined);
  const ground = opts.ground ?? PAPER;
  const canvas = document.createElement('canvas');
  canvas.className = 'bh-canvas';
  box.append(canvas);
  // the entry build (design's hero-entry §2) is the film's first 2.8 s, every loop: the town grows
  // from its middle; the fold (PAGE.fold to FILM_S) is the build backwards, from the edge in (bims-film
  // v13: the loop's seam). None in reduced motion (the map is there, the film's still pose).
  let building = !reduced;
  /** the renderer draws the loose town (the build, the fold), not its merged copies */
  let held = !reduced;
  const entry = makeEntry();
  /** the film's clock runs: from the frame after 'ready' (a check's startT: at once) */
  let started = reduced || opts.startT !== undefined;
  let warmed = false;
  /** frames since the warm one (-1: none yet): 'ready' waits for a cheap one */
  let sinceWarm = -1;
  const r = makeTownRenderer(canvas, { allLive: true, box: true, sky: { day: ground.light, night: ground.dark }, nightLift: NIGHT_LIFT, entry: !reduced, clearView: true });
  const overlay = makeOverlay(box);
  const feed = makeFeed(box);
  // a click in the shop takes the camera, as a drag would (bims-film v13)
  const page = makePage(overlay.root, dark ? 'dark' : 'light', opts.kiln ?? null, () => {
    lastTouch = wall();
    setHands({ k: 'visitor', last: wall(), follow: null });
  });
  /** the reviewer's ✓ on checkout's crate */
  const stamp = document.createElement('div');
  stamp.className = 'bh-stamp';
  stamp.textContent = '✓';
  stamp.style.display = 'none';
  overlay.root.append(stamp);
  const sites: TownSite[] = CAST.map((c) => ({ id: c.id, office: layoutOf(rowsAt(c, 0).agents, c.map), grow: growOf(growthOf(c)) }));
  r.setTown(sites);
  const runs = makeRuns();
  // reduced motion: the still of kiln full, every line ticked, the shop up with its cart open (bims-film v11)
  let t = ORIGIN + Math.max(0, opts.startT ?? (reduced ? REDUCED_T : 0));
  for (const run of runs) advance(run, t, night(), reduced);

  const probe: Probe | null = opts.probe === true ? { frames: 0, ms: [], T: 0, hands: 'film', shot: 0, cam: { zoom: 1, u: 0.5, v: 0.5 }, phases: [], offices: [] } : null;
  if (probe) (window as unknown as { __bimsHero?: Probe }).__bimsHero = probe;

  // ---- the geometry the director reads: the fit's fractions of the plan and the poses
  const steps = new Map<string, Step>();
  const fit = (): Fit | null => r.townFit();
  const frac = (f: Fit, x: number, y: number, z: number): At => {
    const p = toScreen(f, { x, y, z });
    return { u: p.x / f.widthPx, v: p.y / f.heightPx };
  };
  /** an office's building on the fit (its walls, its terrace; not its garden): what an OFFICE shot frames */
  const officeBox = (id: string): Box | null => {
    const f = fit();
    const p = r.placedOf(id);
    const o = steps.get(id)?.office;
    if (!f || !p || !o) return null;
    const site = siteOf(o);
    const pts = [site.x0, site.x1].flatMap((x) => [site.z0, site.z1].flatMap((z) => [0, WALL_Y].map((y) => frac(f, p.x + x, y, p.z + z))));
    return { u0: Math.min(...pts.map((q) => q.u)), u1: Math.max(...pts.map((q) => q.u)), v0: Math.min(...pts.map((q) => q.v)), v1: Math.max(...pts.map((q) => q.v)) };
  };
  /** an office's park on the fit (bise.dev's skatepark), null without one */
  const parkBox = (id: string): Box | null => {
    const f = fit();
    const p = r.placedOf(id);
    const park = steps.get(id)?.office.park;
    if (!f || !p || !park || park.spots.length === 0) return null;
    const pts = park.spots.map((q) => frac(f, p.x + q.x, 0, p.z + q.z));
    const pad = 0.01;
    return { u0: Math.min(...pts.map((q) => q.u)) - pad, u1: Math.max(...pts.map((q) => q.u)) + pad, v0: Math.min(...pts.map((q) => q.v)) - pad, v1: Math.max(...pts.map((q) => q.v)) + pad };
  };
  const geo: Geometry = {
    town() {
      const bs = CAST.flatMap((c) => [officeBox(c.id), parkBox(c.id)]).filter((b): b is Box => b !== null);
      if (bs.length === 0) return null;
      return { u0: Math.min(...bs.map((b) => b.u0)), u1: Math.max(...bs.map((b) => b.u1)), v0: Math.min(...bs.map((b) => b.v0)), v1: Math.max(...bs.map((b) => b.v1)) };
    },
    office: officeBox,
    ground() {
      const f = fit();
      const l = r.entry.parts()?.lawn;
      if (!f || !l) return null;
      // its top's four corners, round it: on screen, the diamond a film shot keeps under its frame
      return [frac(f, l.x0, 0, l.z0), frac(f, l.x1, 0, l.z0), frac(f, l.x1, 0, l.z1), frac(f, l.x0, 0, l.z1)];
    },
    spot(id, kind) {
      const f = fit();
      const p = r.placedOf(id);
      const o = steps.get(id)?.office;
      if (!f || !p || !o) return null;
      const pts = kind === 'island' ? o.islandSpots : kind === 'lounge' ? o.lounge : kind === 'park' ? (o.park?.spots ?? []) : [o.mainDesk];
      if (pts.length === 0) return null;
      const x = pts.reduce((a, q) => a + q.x, 0) / pts.length;
      const z = pts.reduce((a, q) => a + q.z, 0) / pts.length;
      return frac(f, p.x + x, BODY_Y, p.z + z);
    },
    bim(id, name) {
      const f = fit();
      const p = r.placedOf(id);
      const b = steps.get(id)?.frames.find((x) => x.name === name);
      if (!f || !p || !b) return null;
      return frac(f, p.x + b.pose.x, BODY_Y, p.z + b.pose.z);
    },
  };
  const officeZoom = (id: string | null): number | null => {
    if (id === null) return null;
    const b = officeBox(id);
    return b ? fitCam(b, OFFICE_BOX).zoom : null;
  };

  // ---- the camera: the film's (a glide into each shot, then the follow spring) or his
  let hands: Hands = reduced ? { k: 'visitor', last: Infinity, follow: null } : { k: 'film' };
  let shotIx = -1;
  let glide: { from: Cam; start: number; dur: number; rise: number | null; to: (() => Cam | null) | null } | null = null;
  let spring: Spring = still({ zoom: 1, u: 0.5, v: 0.5 });
  /** whether the shot's subject was in the world last frame (null: a new shot) */
  let subjectIn: boolean | null = null;
  let hover: { id: string; name: string } | null = null;
  let pointerOn = false;
  /** when his last gesture was (wall s): the loop runs at full rate a while after it */
  let lastTouch = -Infinity;
  const wall = (): number => performance.now() / 1000;

  const setHands = (h: Hands): void => {
    const was = hands.k;
    hands = h;
    if (was === h.k) return;
    box.dataset.hands = h.k;
    emit(h.k === 'film' ? 'film' : 'control');
  };

  /** the three offices (the build's frame, his double-click's): never the film's first shot, which is close */
  const wide = (): Cam | null => shotCam({ at: 0, size: 'wide', subject: { k: 'town' } }, geo);

  function filmCam(dt: number): void {
    const T = filmT(t);
    const i = shotAt(SHOTS, T);
    const shot = SHOTS[i];
    if (!shot) return;
    if (i !== shotIx) {
      const prev: Shot | null = shotIx >= 0 ? (SHOTS[shotIx] ?? null) : null;
      const g = glideOf(prev, shot);
      const rise = g.across ? Math.min(officeZoom(officeOf(prev?.subject ?? { k: 'town' })) ?? 1, officeZoom(officeOf(shot.subject)) ?? 1) : null;
      if (shotIx >= 0) glide = { from: spring.cam, start: t, dur: g.dur, rise, to: null };
      shotIx = i;
      subjectIn = null;
    }
    // a subject not in yet (it comes in by the door) or gone: the camera holds where it is, and
    // glides to it once it's there (bims m_31555: never back to its office's frame, never a cut)
    const here = present(shot, geo);
    if (here && subjectIn === false && !reduced) glide = { from: spring.cam, start: t, dur: GLIDE_IN_S, rise: null, to: null };
    subjectIn = here;
    const framed = here ? shotCam(shot, geo) : null;
    // a wide never holds still (bims-film v7): it sways from its camera's leaving on
    // (the fold's wide holds still: the next loop's wave starts from that very frame)
    const sways = shot.size === 'wide' && shot.at < PAGE.fold;
    const target = framed === null ? spring.cam : sways ? drift(framed, T - (shot.at - LEAD_S)) : framed;
    move(target, dt);
  }

  /** the camera one frame on: along its glide, else the spring towards the target */
  function move(target: Cam, dt: number): void {
    const to = glide?.to?.() ?? target;
    if (glide !== null) {
      const f = reduced ? 1 : (t - glide.start) / glide.dur;
      spring = still(glideCam(glide.from, to, Math.min(1, f), glide.rise));
      if (f >= 1) glide = null;
      return;
    }
    spring = reduced ? still(target) : springStep(spring, target, dt);
  }

  function visitorCam(dt: number, now: number): void {
    if (hands.k !== 'visitor') return;
    if (!reduced && resumes(hands, now, pointerOn)) {
      resume();
      return;
    }
    const fl = hands.follow;
    if (fl !== null) {
      const at = geo.bim(fl.office, fl.name);
      if (at !== null) move(aimCam(at, spring.cam.zoom, 0.5, 0.5), dt);
      return;
    }
    if (glide !== null) move(spring.cam, dt);
  }

  function resume(): void {
    setHands({ k: 'film' });
    const shot = SHOTS[shotAt(SHOTS, filmT(t))];
    shotIx = shotAt(SHOTS, filmT(t));
    glide = shot ? { from: spring.cam, start: t, dur: RESUME_S, rise: null, to: () => shotCam(shot, geo) } : null;
    kick();
  }

  // ---- what the visitor does
  const gestures = makeGestures(box, {
    cam: () => spring.cam,
    take(cam, follow) {
      glide = null;
      spring = still(holdCam(cam));
      lastTouch = wall();
      setHands({ k: 'visitor', last: wall(), follow: follow ?? null });
      kick();
    },
    pick: (x, y) => r.pickBim(x, y),
    hover(b) {
      const same = b?.id === hover?.id && b?.name === hover?.name;
      hover = b;
      if (hands.k === 'visitor' && b !== null) setHands({ ...hands, last: wall() });
      if (!same) kick();
    },
    inside(on) {
      pointerOn = on;
      if (hands.k === 'visitor') setHands({ ...hands, last: wall() });
    },
    follow(b) {
      lastTouch = wall();
      setHands({ k: 'visitor', last: wall(), follow: b });
      kick();
    },
    wide() {
      const w = wide();
      if (w === null) return;
      glide = { from: spring.cam, start: t, dur: reduced ? 0 : RESUME_S, rise: null, to: null };
      setHands({ k: 'visitor', last: wall(), follow: null });
      glide.to = () => w;
      kick();
    },
  });

  // ---- the loop
  let raf = 0;
  let lastMs = 0;
  let onScreen = false;
  let gone = false;
  const running = (): boolean => !gone && onScreen && !document.hidden;
  // a check's film by the frame (the entry strip, its mp4): no loop, each frame drawn by probe.step
  const manual = probe !== null && opts.manual === true;
  let manualMs = 1;
  if (probe && manual) {
    probe.step = (ms) => {
      manualMs += ms;
      draw(manualMs);
    };
    probe.look = (at) => {
      glide = null;
      lastTouch = wall();
      if ('name' in at) {
        spring = still(holdCam({ ...spring.cam, zoom: at.zoom }));
        setHands({ k: 'visitor', last: wall(), follow: { office: at.office, name: at.name } });
        return;
      }
      spring = still(holdCam(at));
      setHands({ k: 'visitor', last: wall(), follow: null });
    };
  }

  function draw(nowMs: number): void {
    raf = 0;
    if (!running()) return;
    const t0 = performance.now();
    const dt = lastMs === 0 ? 0 : Math.min(0.1, Math.max(0, (nowMs - lastMs) / 1000));
    lastMs = nowMs;
    // the clock from the frame after 'ready' (the first frames bake and compile everything, unseen:
    // build()); a check's entryAt holds the film at that ms of the build
    if (!started && warmed && box.dataset.ready === 'true') started = true;
    if (opts.entryAt !== undefined) t = ORIGIN + opts.entryAt / 1000;
    else if (started && !reduced) t += dt;
    const T = filmT(t);
    const ems = reduced ? null : entryMs(T);
    building = ems !== null;
    /** the wave at the loop's start (its camera: entryCam), not the fold at its end (the fold's shot) */
    const waving = ems !== null && T < PAGE.fold;
    const n = night();
    for (const run of runs) {
      advance(run, t, n, reduced);
      const st = stepOf(run, n, reduced, attentionOf(run));
      if (st) steps.set(run.cast.id, st);
    }
    if (waving && hands.k === 'film') entryCam(ems);
    else if (hands.k === 'film') filmCam(dt);
    else visitorCam(dt, wall());
    // the first frame: the film's shot at once, no glide from nowhere
    if (!waving && (probe?.frames === 0 || r.shownFit() === null)) {
      const now = SHOTS[shotAt(SHOTS, filmT(t))];
      const c = hands.k === 'film' && now !== undefined ? shotCam(now, geo) : wide();
      if (c) spring = still(c);
    }
    r.setCam(spring.cam);
    const t1 = performance.now();
    // the build's first frame bakes every office's walls and draws the whole map once, unseen, then
    // the paper and the empty slab ('ready'): every stall before the clock starts
    const ids = r.liveIds();
    for (const id of ids) {
      const st = steps.get(id);
      if (st) r.live(id, st, t);
    }
    const warmFrame = !reduced && build(ems, ids.length, n);
    const t2 = performance.now();
    r.frame(n);
    const t3 = performance.now();
    // the words come in last in the build and leave first in the fold
    overlay.root.style.opacity = ems === null ? '' : String(wordsAt(ems));
    words();
    // the feed: nothing on the paper while the town grows, in as the camera leaves the wide; out with the words in the fold
    feed.root.style.opacity = ems === null ? '' : String(T < PAGE.fold ? feedOpacity(ems) : wordsAt(ems));
    feed.draw(T);
    page.draw(T);
    stamped(T);
    const t4 = performance.now();
    // ready (the page drops its still): the first cheap frame after the warm one, at most READY_WAIT
    // frames on (the GPU catches up on the warm frame under the still: a 56-96 ms frame after it, on
    // a quiet M1), the clock starts the frame after
    if (warmFrame) sinceWarm = 0;
    else if (sinceWarm >= 0) sinceWarm++;
    const cheap = performance.now() - t0 <= READY_MS;
    if (box.dataset.ready !== 'true' && !warmFrame && (reduced || sinceWarm < 0 || cheap || sinceWarm >= READY_WAIT)) {
      box.dataset.ready = 'true';
      emit('ready');
    }
    if (probe) {
      probe.frames++;
      probe.ms = [...probe.ms.slice(-299), performance.now() - t0];
      probe.phases = [...probe.phases.slice(-299), { brain: t1 - t0, pose: t2 - t1, draw: t3 - t2, words: t4 - t3 }];
      probe.T = filmT(t);
      // the build's ms in the wave, else the film's (≥ ENTRY.done: the checks read the build's frames by it)
      probe.entry = waving ? ems : T * 1000;
      probe.hands = hands.k;
      probe.shot = shotIx;
      probe.cam = spring.cam;
      const live = new Set(r.liveIds());
      probe.offices = CAST.map((c) => ({
        id: c.id,
        live: live.has(c.id),
        bims: (steps.get(c.id)?.played ?? []).map((f) => ({ name: f.name, k: f.pose.seg.act.k, x: f.pose.x, z: f.pose.z, head: r.headOf(c.id, f.name) !== null })),
      }));
    }
    // reduced motion: a frame only when something moves (his gesture, a cut); the film never plays
    if (!manual && (!reduced || glide !== null)) next();
  }

  /** the build's camera: the wide while the town grows, then an ease to the film's first shot */
  function entryCam(ems: number): void {
    const from = wide();
    if (from === null) return;
    // one target the whole glide: the shot the film plays when the glide ends (a shot leaving
    // mid-glide changed its target in one frame: the audit's cut), so the film takes over in place
    shotIx = shotAt(SHOTS, ENTRY.cam.to / 1000);
    const shot = SHOTS[shotIx];
    const to = shot ? shotCam(shot, geo) : null;
    const f = (ems - ENTRY.cam.from) / (ENTRY.cam.to - ENTRY.cam.from);
    spring = still(to === null || f <= 0 ? from : glideCam(from, to, Math.min(1, f), null, easeInOut));
  }

  /**
   * The build's (or the fold's) things where they are at ems: the town held loose while they move,
   * settled into its merged copies once it's all there (ems past ENTRY.built, or the film between).
   */
  function build(ems: number | null, offices: number, n: boolean): boolean {
    const parts = r.entry.parts();
    if (parts === null) return false;
    let warm = false;
    if (!warmed && held && parts.offices.length >= offices) {
      // before 'ready' (design m_31440: no frame of the build over 50 ms): the whole map drawn once,
      // unseen (frame 0 draws over it in the same task), the merged copies settle() shows too, so
      // every program (its shadows too) is compiled and every buffer uploaded before the clock starts
      warmed = true;
      warm = true;
      entry.apply(ENTRY.built - 1, parts, r.shownFit()?.scale ?? 0.05);
      r.entry.warm(true);
      r.frame(n);
      r.entry.warm(false);
    }
    if (ems !== null && ems < ENTRY.built) {
      if (!held) {
        // the fold: the loose town back (kept since the build: nothing to upload or compile)
        r.entry.hold();
        held = true;
        return warm;
      }
      entry.apply(ems, parts, r.shownFit()?.scale ?? 0.05);
      return warm;
    }
    if (held) {
      entry.finish(parts);
      r.entry.settle();
      held = false;
    }
    return warm;
  }

  /** where the build is at film time T, ms (the fold: the build backwards, from ENTRY.built to 0), null in the film between. Pure. */
  function entryMs(T: number): number | null {
    if (T * 1000 < ENTRY.done) return T * 1000;
    if (T >= PAGE.fold) return ENTRY.built * Math.max(0, 1 - (T - PAGE.fold) / FOLD_S);
    return null;
  }

  /** the next frame: at the display's rate while the camera glides, the town builds or he just moved it, else 30 fps */
  function next(): void {
    const busy = building || glide !== null || wall() - lastTouch < 1;
    if (busy) {
      raf = requestAnimationFrame(draw);
      return;
    }
    const at = lastMs;
    const wait = (now: number): void => {
      raf = 0;
      if (!running()) return;
      if (now - at < IDLE_MS - 2 && glide === null && wall() - lastTouch >= 1) {
        raf = requestAnimationFrame(wait);
        return;
      }
      draw(now);
    };
    raf = requestAnimationFrame(wait);
  }

  function kick(): void {
    if (manual || raf !== 0 || !running()) return;
    raf = requestAnimationFrame(draw);
  }

  /** the bim the camera follows in this office (its one name shown), or the one under his pointer */
  function focusOf(): { id: string; name: string } | null {
    if (hover !== null) return hover;
    if (hands.k === 'visitor') return hands.follow ? { id: hands.follow.office, name: hands.follow.name } : null;
    const shot = SHOTS[shotIx];
    if (!shot || shot.subject.k !== 'bim' || (shot.size !== 'follow' && shot.size !== 'close' && shot.size !== 'closest')) return null;
    return { id: shot.subject.office, name: shot.subject.name };
  }

  function attentionOf(run: Run) {
    const f = focusOf();
    if (f === null || f.id !== run.cast.id) return NO_ATTENTION;
    return { ...NO_ATTENTION, hover: hover?.id === run.cast.id ? hover.name : null, follow: f.name };
  }

  /** the bims the film's shot is about now (its followed bim, the pair): their eggs' words stay while they play */
  function subjectsOf(): Set<string> {
    const out = new Set<string>();
    const f = focusOf();
    if (f !== null) out.add(`${f.id}\u0000${f.name}`);
    const shot = hands.k === 'film' ? SHOTS[shotIx] : undefined;
    if (shot?.subject.k === 'pair') for (const n of shot.subject.names) out.add(`${shot.subject.office}\u0000${n}`);
    return out;
  }

  /** the reviewer's ✓ on checkout's crate (carried before its chest: a little under its head), from the stamp to the fold */
  function stamped(T: number): void {
    const head = T >= STAMP.at && T < PAGE.fold ? r.headOf(STAMP.office, STAMP.on) : null;
    stamp.style.display = head === null ? 'none' : '';
    if (head !== null) stamp.style.transform = `translate(${head.x.toFixed(1)}px, ${(head.y + 14).toFixed(1)}px)`;
  }

  /** the bubble a bim says now (one at a time, BUBBLE_S), null none */
  const bubbleAt = (T: number): Bubble | null => BUBBLES.find((b) => T >= b.at && T < b.at + BUBBLE_S) ?? null;

  function words(): void {
    const f = focusOf();
    const subjects = subjectsOf();
    const w = Math.max(1, box.clientWidth);
    // no name while the camera glides (it shows on arrival), never one outside the safe frame (bims m_31057)
    const inSafe = (h: { x: number } | null): boolean => h !== null && h.x / w >= SAFE_X.x0 && h.x / w <= SAFE_X.x1;
    const naming = !(hands.k === 'film' && glide !== null);
    const ls: { key: string; label: Label; head: { x: number; y: number } | null; rank: number }[] = [];
    const heads = new Map<string, { x: number; y: number }>();
    const own: typeof ls = [];
    const others: { key: string; label: Label; head: { x: number; y: number } | null; since: number; near: number }[] = [];
    const T = filmT(t);
    for (const id of r.liveIds()) {
      const st = steps.get(id);
      if (!st) continue;
      const forced = eggsAt(id, T).bims ?? {};
      for (const l of st.labels.values()) {
        const key = `${id}\u0000${l.name}`;
        const head = r.headOf(id, l.name);
        if (l.mode === 'egg') {
          const label = { ...l, words: eggWords(l.words) };
          const since = forced[l.name]?.since ?? Infinity;
          // a subject's egg plays out (the stare's '…' over both); anyone else's shows EGG_S, one at a time
          if (subjects.has(key)) {
            if (inSafe(head)) own.push({ key, label, head, rank: 0 });
          } else if (since < EGG_S) others.push({ key, label, head, since, near: f?.id === id ? 0 : 1 });
          continue;
        }
        if (l.mode === 'pill' || l.pill !== null) ls.push({ key, label: { ...l, mode: 'pill', words: '' }, head, rank: 2 });
      }
      if (!reduced) for (const name of sleepers(st.frames)) {
        const h = r.headOf(id, name);
        if (h) heads.set(`${id}/${name}`, h);
      }
    }
    // a bubble: its words over its speaker, and no name meanwhile (a pair shows the bubble only: bims-film v9)
    const bub = bubbleAt(T);
    if (bub !== null) {
      const head = r.headOf(bub.office, bub.bim);
      if (inSafe(head)) own.push({ key: `${bub.office}\u0000${bub.bim}`, label: { name: bub.bim, mode: 'egg', words: bub.words, title: '', pill: null }, head, rank: 0 });
    }
    // the followed bim: its egg's words, else its name (labels.ts names a bim only while it walks);
    // no name while it plays an egg: its prop wins (the hop's coin pops where the name sits, bims m_31600)
    if (f !== null && naming && bub === null && eggsAt(f.id, T).bims?.[f.name] === undefined) {
      const key = `${f.id}\u0000${f.name}`;
      const head = r.headOf(f.id, f.name);
      if (!own.some((x) => x.key === key) && inSafe(head) && steps.get(f.id)?.frames.some((x) => x.name === f.name) === true) {
        const pill = ls.find((x) => x.key === key)?.label.pill ?? null;
        own.push({ key, label: { name: f.name, mode: 'name', words: '', title: '', pill }, head, rank: 0 });
      }
    }
    // at most one egg's words besides the subjects' (designer m_30865): its office's first, else the newest
    const egg = own.length > 0 ? undefined : others.filter((e) => e.head !== null).sort((a, b) => a.near - b.near || a.since - b.since)[0];
    if (egg !== undefined) own.push({ key: egg.key, label: egg.label, head: egg.head, rank: 1 });
    const mine = new Set(own.map((x) => x.key));
    overlay.labels([...ls.filter((x) => !mine.has(x.key)), ...own]);
    overlay.zzz(heads);
  }

  const sized = new ResizeObserver(() => {
    const w = box.clientWidth;
    const h = box.clientHeight;
    if (w <= 0 || h <= 0) return;
    r.setSize(w, h);
    kick();
  });
  sized.observe(box);
  const seen = new IntersectionObserver((es) => {
    onScreen = es.some((e) => e.isIntersecting);
    lastMs = 0;
    kick();
  });
  seen.observe(box);
  const onVis = (): void => {
    lastMs = 0;
    kick();
  };
  document.addEventListener('visibilitychange', onVis);
  r.onLost(() => {
    box.dataset.lost = 'true';
    emit('lost');
  });

  return {
    setTheme(th) {
      dark = th === 'dark';
      box.dataset.theme = th;
      page.setTheme(th);
      kick();
    },
    resumeFilm() {
      if (!reduced) resume();
    },
    zoomBy(factor) {
      gestures.zoomBy(factor);
    },
    dispose() {
      gone = true;
      if (raf !== 0) cancelAnimationFrame(raf);
      sized.disconnect();
      seen.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      gestures.dispose();
      page.dispose();
      feed.dispose();
      overlay.dispose();
      r.dispose();
      canvas.remove();
      if (probe) delete (window as unknown as { __bimsHero?: Probe }).__bimsHero;
    },
  };
}
