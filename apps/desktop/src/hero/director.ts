// The hero film's camera (page bims-film v4, the director's rules): which shot plays at film time T
// (cast.ts SHOTS, written ahead from bims' interest table, so it replays), how the camera gets there
// (it leaves LEAD_S before the action; it glides, never cuts: GLIDE_IN_S inside an office, GLIDE_ACROSS_S
// from one to another with a rise to OFFICE size halfway, like a drone), how it follows a moving
// subject (a damped spring, ~0.5 s behind, never a shake), where the subject sits in the frame (SAFE:
// the town's middle, the left 20% fading into the page's text), and when the visitor has the camera
// (a drag, a pinch, a click on a bim) and gives it back (RESUME_IDLE_S without a gesture, his
// pointer off the town, or resumeFilm()). A Cam is zoom.ts's: the town's fit seen `zoom` times closer, centred at (u, v),
// fractions of the fit. Pure: the film hands it the geometry and the time. Owner: hero-town.
import type { Cam } from '../bims/zoom';
import { FILM_S, type Shot, type Size, type Subject } from './cast';

/** the camera leaves this long before a shot's action (it arrives as it starts) */
export const LEAD_S = 1.5;
/** a glide inside one office, s */
export const GLIDE_IN_S = 1.6;
/** a glide from one office (or the wide) to another, s: it rises to OFFICE size halfway */
export const GLIDE_ACROSS_S = 2.4;
/** the shortest glide (designer m_30848) */
export const GLIDE_MIN_S = 0.6;
/** the follow spring's stiffness (critically damped: ~2/W s behind a walking bim) */
export const SPRING_W = 4;
/** without a gesture this long (and his pointer off the town), the film takes the camera back (designer m_30837) */
export const RESUME_IDLE_S = 20;
/** its glide back to the film's shot */
export const RESUME_S = 2.4;
/** the closest the visitor (or a close-up) gets, over the town's fit */
export const MAX_ZOOM = 28;

/** where the subject sits, fractions of the frame: the town's middle, past the fade on the left */
export const SAFE = { x: 0.575, y: 0.5 } as const;
/** what a whole-town or a whole-office shot fits into, fractions of the frame */
/** the wide: the offices' bounding box centred at ~58% across, past the box's 22% fade (designer m_31061), the band at mid height (bims m_31230) */
export const WIDE_BOX = { x0: 0.27, x1: 0.89, y0: 0.11, y1: 0.89 } as const;
export const OFFICE_BOX = { x0: 0.3, x1: 0.85, y0: 0.1, y1: 0.9 } as const;
/** an OFFICE shot this much closer than its box's fit (bims m_31057: the office ~70% of the frame) */
export const OFFICE_TIGHT = 1.3;
/** each size past OFFICE: how much closer than that office's own OFFICE shot (follow: a bim ≥ 22 px at 1440, bims m_31555) */
export const CLOSER: Readonly<Record<Exclude<Size, 'wide' | 'office'>, number>> = { tight: 1.6, follow: 2.6, close: 3.2, closest: 13 };

/** a rectangle on the fit, fractions (u right, v down) */
export interface Box {
  readonly u0: number;
  readonly u1: number;
  readonly v0: number;
  readonly v1: number;
}

/** a point on the fit, fractions */
export interface At {
  readonly u: number;
  readonly v: number;
}

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

/**
 * the farthest the camera goes: just past the town's fit. the renderer shows its plain fit for any
 * zoom ≤ 1 and drops the pan (zoom.ts atFit), so the wide stays above 1 to centre the offices
 */
export const MIN_ZOOM = 1.001;
/** how far past the town's fit the view may slide, fractions of the view (the page's paper shows there) */
export const PAST = 0.2;

/**
 * A cam held on the town: zoom in [MIN_ZOOM, MAX_ZOOM], its view never more than PAST of itself off
 * the fit's edges (closer than the fit) or the fit never more than that out of view (farther). Pure.
 */
export function holdCam(c: Cam): Cam {
  const zoom = clamp(Number.isFinite(c.zoom) ? c.zoom : 1, MIN_ZOOM, MAX_ZOOM);
  const half = 0.5 / zoom;
  // the view may slide PAST of its own size off the fit (the paper round the lawn): the wide centres the offices
  const past = PAST / zoom;
  const lo = Math.min(half, 1 - half) - past;
  const hi = Math.max(half, 1 - half) + past;
  return { zoom, u: clamp(c.u, lo, hi), v: clamp(c.v, lo, hi) };
}

/** The cam that shows `box` whole inside `into` (fractions of the frame), as close as that allows. Pure. */
export function fitCam(box: Box, into: { x0: number; x1: number; y0: number; y1: number }): Cam {
  const zw = (into.x1 - into.x0) / Math.max(1e-6, box.u1 - box.u0);
  const zh = (into.y1 - into.y0) / Math.max(1e-6, box.v1 - box.v0);
  const zoom = Math.max(MIN_ZOOM, Math.min(zw, zh));
  const cu = (box.u0 + box.u1) / 2;
  const cv = (box.v0 + box.v1) / 2;
  const fx = (into.x0 + into.x1) / 2;
  const fy = (into.y0 + into.y1) / 2;
  return holdCam({ zoom, u: cu - (fx - 0.5) / zoom, v: cv - (fy - 0.5) / zoom });
}

/** The cam that puts `at` on the frame's point (fx, fy) at this zoom. Pure. */
export function aimCam(at: At, zoom: number, fx: number = SAFE.x, fy: number = SAFE.y): Cam {
  return holdCam({ zoom, u: at.u - (fx - 0.5) / zoom, v: at.v - (fy - 0.5) / zoom });
}

/** Where a point of the fit shows in a cam's frame, fractions. Pure. */
export function inFrame(c: Cam, at: At): At {
  return { u: 0.5 + (at.u - c.u) * c.zoom, v: 0.5 + (at.v - c.v) * c.zoom };
}

/** What the film tells the director of its world now (fit fractions); null: not known yet. */
export interface Geometry {
  /** the three offices together, their buildings and the park */
  town(): Box | null;
  office(id: string): Box | null;
  /** an office's spot (its island, lounge, park, main's desk) */
  spot(office: string, spot: 'island' | 'lounge' | 'park' | 'main'): At | null;
  /** a bim: its body's middle; null when it is not in the office (gone, not posed yet) */
  bim(office: string, name: string): At | null;
}

/** The office a subject is in, null for the town. Pure. */
export const officeOf = (s: Subject): string | null => (s.k === 'town' ? null : s.office);

/** The cam a shot wants now (its subject where it is now), `back` times farther. null: its subject is not there. Pure. */
export function shotCam(shot: Shot, g: Geometry): Cam | null {
  const c = sizedCam(shot, g);
  return c === null || shot.back === undefined ? c : { ...c, zoom: Math.max(MIN_ZOOM, c.zoom / shot.back) };
}

function sizedCam(shot: Shot, g: Geometry): Cam | null {
  const s = shot.subject;
  if (shot.size === 'wide' || s.k === 'town') {
    const b = g.town();
    return b ? fitCam(b, WIDE_BOX) : null;
  }
  const ob = g.office(s.office);
  if (!ob) return null;
  const office = fitCam(ob, OFFICE_BOX);
  let at: At | null;
  switch (s.k) {
    case 'office':
      at = null;
      break;
    case 'spot':
      at = g.spot(s.office, s.spot);
      break;
    case 'bim':
      at = g.bim(s.office, s.name);
      break;
    case 'pair': {
      const a = g.bim(s.office, s.names[0]);
      const b = g.bim(s.office, s.names[1]);
      at = a && b ? { u: (a.u + b.u) / 2, v: (a.v + b.v) / 2 } : (a ?? b);
      break;
    }
  }
  if (shot.size === 'office') {
    const c = at ?? { u: office.u + (SAFE.x - 0.5) / office.zoom, v: office.v + (SAFE.y - 0.5) / office.zoom };
    return aimCam(c, office.zoom * OFFICE_TIGHT);
  }
  // a whole office closer than its OFFICE shot (the cold open's tight loft): its middle, that much closer
  if (s.k === 'office') return aimCam({ u: office.u + (SAFE.x - 0.5) / office.zoom, v: office.v + (SAFE.y - 0.5) / office.zoom }, office.zoom * CLOSER[shot.size]);
  // a subject gone missing (it left): its office's shot, never an empty frame
  if (at === null) return office;
  return aimCam(at, office.zoom * CLOSER[shot.size], shot.frame?.x ?? SAFE.x, shot.frame?.y ?? SAFE.y);
}

/** The shot playing at film time T: the last one whose camera has left (LEAD_S before its action). Pure. */
export function shotAt(shots: readonly Shot[], T: number): number {
  // the first shot's camera leaves at the end of the loop before (0:00's LEAD_S is 4:58.5)
  const first = shots[0];
  if (first !== undefined && T >= first.at - (first.lead ?? LEAD_S) + FILM_S) return 0;
  let i = shots.length - 1;
  for (let k = 0; k < shots.length; k++) {
    const s = shots[k];
    if (s !== undefined && s.at - (s.lead ?? LEAD_S) <= T) i = k;
  }
  return i;
}

/** How long the glide into shot `to` lasts, and whether it rises on its way (from another office, or the wide). Pure. */
export function glideOf(from: Shot | null, to: Shot): { readonly dur: number; readonly across: boolean } {
  const a = from === null ? null : officeOf(from.subject);
  const b = officeOf(to.subject);
  const across = from !== null && a !== b && a !== null && b !== null;
  const dur = to.glide ?? (from === null ? GLIDE_MIN_S : a === b ? GLIDE_IN_S : GLIDE_ACROSS_S);
  return { dur: Math.max(GLIDE_MIN_S, dur), across };
}

/**
 * Whether a shot's subject is in the world now (a bim that has not come in yet, or has left, is
 * not): when that changes mid-shot the camera glides to its new target, never cuts. Pure.
 */
export function present(shot: Shot, g: Geometry): boolean {
  const s = shot.subject;
  if (s.k === 'bim') return g.bim(s.office, s.name) !== null;
  if (s.k === 'pair') return g.bim(s.office, s.names[0]) !== null || g.bim(s.office, s.names[1]) !== null;
  return true;
}

/** a wide's slow drift (bims-film v7: never still, 2-3 % of the frame a second): its sway, fractions of the frame */
export const DRIFT = { amp: 0.04, period: 10 } as const;

/**
 * A wide `e` s after its camera left, swaying side to side: still at first (no jolt), at most
 * 2π·amp/period (2.5 %) of the frame a second. Pure.
 */
export function drift(c: Cam, e: number): Cam {
  const x = Math.max(0, e);
  const sway = (DRIFT.amp / 2) * (1 - Math.cos((2 * Math.PI * x) / DRIFT.period));
  return holdCam({ ...c, u: c.u + sway / c.zoom });
}

/** ease in and out (smootherstep) */
export const ease = (x: number): number => {
  // ease-in-out expo (Gabriel's review, main m_31507: no cut, only fluid moves), its ends pinned to 0 and 1
  const t = clamp(x, 0, 1);
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2;
};

/**
 * The glide's cam at fraction f (0..1) from `from` to `to`: zoom eased in log space (it reads as a
 * steady move), the centre eased; `rise` (an across glide): never closer than that zoom at its
 * middle (the drone's rise). Pure.
 */
export function glideCam(from: Cam, to: Cam, f: number, rise: number | null): Cam {
  const s = ease(f);
  const la = Math.log(from.zoom);
  const lb = Math.log(to.zoom);
  let lz = la + (lb - la) * s;
  if (rise !== null) {
    const mid = (la + lb) / 2;
    const dip = Math.max(0, mid - Math.log(Math.max(1, rise)));
    lz -= dip * 4 * s * (1 - s);
  }
  return holdCam({ zoom: Math.exp(lz), u: from.u + (to.u - from.u) * s, v: from.v + (to.v - from.v) * s });
}

/** A follow spring's state: the cam and its speed (log zoom, u, v per s). */
export interface Spring {
  readonly cam: Cam;
  readonly vz: number;
  readonly vu: number;
  readonly vv: number;
}

export const still = (cam: Cam): Spring => ({ cam, vz: 0, vu: 0, vv: 0 });

/** One step of the critically damped follow towards `to` after dt s (no overshoot, no shake). Pure. */
export function springStep(s: Spring, to: Cam, dt: number): Spring {
  const h = clamp(dt, 0, 0.1);
  const w = SPRING_W;
  const one = (x: number, v: number, target: number): [number, number] => {
    // exact critically damped solution over h (stable at any frame rate)
    const d = x - target;
    const e = Math.exp(-w * h);
    const c = v + w * d;
    return [target + (d + c * h) * e, (v - w * c * h) * e];
  };
  const [lz, vz] = one(Math.log(s.cam.zoom), s.vz, Math.log(to.zoom));
  const [u, vu] = one(s.cam.u, s.vu, to.u);
  const [v, vv] = one(s.cam.v, s.vv, to.v);
  return { cam: holdCam({ zoom: Math.exp(lz), u, v }), vz, vu, vv };
}

/** Who has the camera: the film, or the visitor (since his last gesture, wall clock s; following a bim he clicked). */
export type Hands =
  | { readonly k: 'film' }
  | { readonly k: 'visitor'; readonly last: number; readonly follow: { readonly office: string; readonly name: string } | null };

/** Whether the film takes the camera back now: RESUME_IDLE_S since his last gesture, his pointer off the town. Pure. */
export function resumes(h: Hands, now: number, pointerOn: boolean): boolean {
  return h.k === 'visitor' && !pointerOn && now - h.last >= RESUME_IDLE_S;
}
