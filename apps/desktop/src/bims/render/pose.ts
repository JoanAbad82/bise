// A bim's body at time t (pure, no three): the per-kind poses of the spec's §4, the §5 transitions,
// his paper plane's catch, and where the bim stands under reduced motion (fades, never a walk).
// bim.ts applies a Rig to the meshes; index.ts sums the Motion. Every still pose reads without
// motion (asleep: eyes closed, head down; idle: sunk in the bean bag; failed: slumped; in line: the
// box). Loops (typing, hot's sweat, the '?' hops) are 'loop' at LOOP_FPS; reduced motion has none.
import type { ActivityKind, Motion, Pose } from '../model';

/** rotations in radians: [x, y, z] */
export type Rot = readonly [number, number, number];

export interface Props {
  readonly crate: boolean;
  readonly mug: boolean;
  readonly orange: boolean;
  readonly pine: boolean;
  /** a sheet held in both hands: main's paper, an urgent ask's form to sign */
  readonly sheet: boolean;
  /** his paper plane, caught, in the right hand */
  readonly plane: boolean;
  readonly skate: boolean;
  readonly glasses: boolean;
  /** the grey cloud over the laptop (failed), 0..1 */
  readonly cloud: number;
  /** hot: the sweat and steam loop's phase, null when not hot */
  readonly hot: number | null;
}

export interface Rig {
  /** where the bim's group stands: the pose's point plus an offset (asks steps aside), and its way */
  readonly x: number;
  readonly z: number;
  readonly dir: number;
  /** the body's lift and rotation, the head's rotation */
  readonly y: number;
  readonly body: Rot;
  readonly head: Rot;
  readonly armL: Rot;
  readonly armR: Rot;
  readonly legL: number;
  readonly legR: number;
  /** 1 open, 0.15 closed */
  readonly eyes: number;
  readonly mouth: 'smile' | 'laugh' | 'oh';
  readonly props: Props;
  /** its desk's laptop, 0 off .. 1 lit */
  readonly screen: number;
  /** its desk lamp */
  readonly lamp: boolean;
  /** 0 its colours .. 1 grey (stopped) */
  readonly grey: number;
  /** 0 gone .. 1 shown (reduced motion's fades) */
  readonly opacity: number;
  readonly motion: Motion;
}

export interface RigInput {
  readonly pose: Pose;
  readonly t: number;
  readonly main: boolean;
  /** the bim's own loop phase (palette.outfitOf) */
  readonly phase: number;
  readonly reduced: boolean;
}

const NO_PROPS: Props = {
  crate: false, mug: false, orange: false, pine: false, sheet: false, plane: false,
  skate: false, glasses: false, cloud: 0, hot: null,
};

const Z: Rot = [0, 0, 0];

/** a pose before placement: the body's parts only */
interface Body {
  readonly y: number;
  readonly body: Rot;
  readonly head: Rot;
  readonly armL: Rot;
  readonly armR: Rot;
  readonly legL: number;
  readonly legR: number;
  readonly eyes: number;
  readonly mouth: Rig['mouth'];
  readonly props: Props;
  readonly screen: number;
  readonly lamp: boolean;
  readonly grey: number;
  /** offset from the spot, in the bim's own frame (x to its left/right, z ahead) */
  readonly dx: number;
  readonly dz: number;
  /** a fixed way to face (the lounge, the camera), else the pose's */
  readonly face: number | null;
}

const STAND: Body = {
  y: 0, body: Z, head: Z, armL: Z, armR: Z, legL: 0, legR: 0, eyes: 1, mouth: 'smile',
  props: NO_PROPS, screen: 0, lamp: true, grey: 0, dx: 0, dz: 0, face: null,
};

const SEATED = { y: -0.05, legL: -1.45, legR: -1.45 } as const;

/** the kinds that type at a lit screen (a loop) */
const TYPING: ReadonlySet<ActivityKind> = new Set(['work', 'hot', 'main']);

/** the loop phase of time t: frozen under reduced motion so a loop pose holds still */
const loopT = (t: number, reduced: boolean): number => (reduced ? 0 : t);

/** a kind's pose at rest, at loop time lt (lt is 0 under reduced motion) */
function rest(k: ActivityKind, lt: number, ph: number, urgent: boolean, fruit: number): Body {
  switch (k) {
    case 'work':
    case 'main':
    case 'hot': {
      const hot = k === 'hot';
      const sp = hot ? 22 : 12;
      return {
        ...STAND, ...SEATED,
        armL: [-1.2 + Math.sin(lt * sp + ph) * 0.18, 0, 0],
        armR: [-1.2 + Math.sin(lt * sp + ph + 2) * 0.18, 0, 0],
        head: [0.15 + Math.sin(lt * 2 + ph) * 0.04, Math.sin(lt * 0.7 + ph) * 0.15, 0],
        body: hot ? [0, 0, Math.sin(lt * 30) * 0.015] : Z,
        mouth: hot ? 'oh' : 'smile',
        screen: 0.9,
        props: hot ? { ...NO_PROPS, hot: (lt * 0.9 + ph) % 1 } : NO_PROPS,
      };
    }
    case 'starting':
      // at the door: looks around, a little wave
      return { ...STAND, head: [0, 0.35, 0], armR: [0, 0, 2.4], face: Math.PI };
    case 'sleep':
    case 'waitagent':
      // asleep at its desk: head down on the arms, eyes closed, screen off
      return {
        ...STAND, ...SEATED, body: [0.5, 0, 0], head: [0.55, 0, 0], armL: [-1.4, 0, 0], armR: [-1.4, 0, 0],
        eyes: 0.15, mouth: 'oh',
      };
    case 'nap':
      // sunk in a bean bag, facing the room
      return {
        ...STAND, y: 0.22, dz: 0.15, body: [-0.9, 0, 0], legL: -0.4, legR: -0.4, armL: [0, 0, -0.5], armR: [0, 0, 0.5],
        eyes: 0.15, mouth: 'oh', face: 0,
      };
    case 'snack': {
      const props = { ...NO_PROPS, pine: fruit === 0, orange: fruit === 1, mug: fruit === 2 };
      return { ...STAND, armR: [-1.5, 0, 0], head: [-0.1, 0, 0.06], mouth: 'laugh', eyes: 0.3, props };
    }
    case 'asks': {
      // standing by its desk, hand up, hops (faster and with a sheet when urgent)
      const sp = urgent ? 5.2 : 2.6;
      return {
        ...STAND, dx: 0.65, dz: 0.15, face: 0,
        y: Math.abs(Math.sin(lt * sp + ph)) * 0.08,
        armR: [0, 0, 2.7 + Math.sin(lt * 5 + ph) * 0.25],
        armL: urgent ? [-1.3, 0, 0] : Z,
        mouth: 'oh', screen: 0.6,
        props: urgent ? { ...NO_PROPS, sheet: true } : NO_PROPS,
      };
    }
    case 'blocked':
      return { ...STAND, ...SEATED, armL: [-1.2, 0, 0.9], armR: [-1.2, 0, -0.9], head: [0.25, 0, 0], mouth: 'oh', screen: 0.4 };
    case 'failed':
      // slumped on its desk, a grey cloud over the laptop
      return {
        ...STAND, ...SEATED, body: [0.35, 0, 0], head: [0.7, 0, 0], armL: [-0.2, 0, 0], armR: [-0.2, 0, 0],
        eyes: 0.3, mouth: 'oh', props: { ...NO_PROPS, cloud: 1 },
      };
    case 'landing':
      return { ...STAND, armL: [-1.3, 0, 0], armR: [-1.3, 0, 0], props: { ...NO_PROPS, crate: true } };
    case 'done':
      // on a deck chair, sunglasses
      return {
        ...STAND, y: 0.25, dz: 0.1, body: [-1.0, 0, 0], legL: -0.6, legR: -0.6, armL: [0, 0, -2.6], armR: [0, 0, 2.6],
        props: { ...NO_PROPS, glasses: true },
      };
    case 'stopped':
      return { ...STAND, ...SEATED, armL: [-0.9, 0, 0], armR: [-0.9, 0, 0], head: [0.1, 0, 0], lamp: false, grey: 1 };
    case 'mainidle':
      // reads the paper
      return { ...STAND, ...SEATED, armL: [-1.3, 0, 0.35], armR: [-1.3, 0, -0.35], head: [0.25, 0, 0], props: { ...NO_PROPS, sheet: true } };
    // the hub's events (bims-facts): a coffee at the island, a visit to a busy bim's desk, a report to main
    case 'coffee':
      return { ...STAND, armR: [-1.5, 0, 0], head: [-0.1, 0, 0.06], mouth: 'laugh', eyes: 0.3, props: { ...NO_PROPS, mug: true } };
    case 'visit':
      return { ...STAND, armR: [-1.2, 0, -0.3], head: [0.1, 0, 0] };
    case 'report':
      return { ...STAND, armL: [-1.3, 0, 0], armR: [-1.3, 0, 0], props: { ...NO_PROPS, sheet: true } };
  }
}

/** the §5 transition's length into `to` from `from`, seconds (0: none, a plain blend of 0.6) */
export function transitionOf(from: ActivityKind | null, to: ActivityKind): number {
  if (from === null || from === to) return 0;
  if (to === 'sleep' || to === 'waitagent') return 1.5;
  if (to === 'failed') return 1.2;
  if (to === 'stopped') return 0.5;
  if (from === 'sleep' || from === 'waitagent' || from === 'failed' || from === 'stopped') return 1.0;
  return 0.6;
}

/** his plane: the flight, then the catch / read / thumbs up / sit back */
export const PLANE_FLIGHT = 1.5;
export const PLANE_CATCH = 2.0;

const ease = (x: number): number => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const mix = (a: number, b: number, f: number): number => a + (b - a) * f;
const mixR = (a: Rot, b: Rot, f: number): Rot => [mix(a[0], b[0], f), mix(a[1], b[1], f), mix(a[2], b[2], f)];

function blend(a: Body, b: Body, f: number): Body {
  const half = f >= 0.5;
  return {
    y: mix(a.y, b.y, f), body: mixR(a.body, b.body, f), head: mixR(a.head, b.head, f),
    armL: mixR(a.armL, b.armL, f), armR: mixR(a.armR, b.armR, f), legL: mix(a.legL, b.legL, f), legR: mix(a.legR, b.legR, f),
    eyes: mix(a.eyes, b.eyes, f), mouth: half ? b.mouth : a.mouth,
    props: { ...(half ? b.props : a.props), cloud: mix(a.props.cloud, b.props.cloud, f) },
    screen: mix(a.screen, b.screen, f), lamp: half ? b.lamp : a.lamp, grey: mix(a.grey, b.grey, f),
    dx: mix(a.dx, b.dx, f), dz: mix(a.dz, b.dz, f), face: half ? b.face : a.face,
  };
}

/** walking (or skating, or carrying the box) at time t */
function walking(k: ActivityKind, t: number): Body {
  if (k === 'done') {
    return {
      ...STAND, y: 0.1, legL: 0.2, legR: -0.3, armL: [0, 0, -1.1], armR: [0, 0, 1.1], body: [0, 0.5, 0],
      mouth: 'laugh', eyes: 0.3, props: { ...NO_PROPS, skate: true, glasses: true },
    };
  }
  const w = t * 9;
  const carry = k === 'landing';
  return {
    ...STAND,
    y: Math.abs(Math.sin(w)) * 0.05,
    legL: Math.sin(w) * 0.6, legR: -Math.sin(w) * 0.6,
    armL: [carry ? -1.3 : -Math.sin(w) * 0.5, 0, 0], armR: [carry ? -1.3 : Math.sin(w) * 0.5, 0, 0],
    props: carry ? { ...NO_PROPS, crate: true } : NO_PROPS,
  };
}

/** the special beats on top of a transition's blend (f: 0..1 through it) */
function beat(from: ActivityKind | null, to: ActivityKind, f: number, b: Body): Body {
  const bump = Math.sin(Math.PI * f);
  if ((to === 'sleep' || to === 'waitagent') && f < 0.6) {
    // a yawn and a stretch before the head goes down
    return { ...b, armL: [0, 0, -2.6 * bump], armR: [0, 0, 2.6 * bump], mouth: 'oh', eyes: 0.6 };
  }
  if ((from === 'sleep' || from === 'waitagent') && TYPING.has(to)) {
    // woken with a start: a little jump
    return { ...b, y: b.y + 0.18 * bump, eyes: 1 };
  }
  if (to === 'failed') return { ...b, armL: [-2.4 * bump, 0, 0.4], armR: [-2.4 * bump, 0, -0.4] };
  if (from === 'stopped') return { ...b, armL: [0, 0, -2.2 * bump], armR: [0, 0, 2.2 * bump] };
  return b;
}

/** his plane landing in the bim's hand at s seconds after it left the top edge (s >= PLANE_FLIGHT) */
function caught(b: Body, s: number): Body {
  const c = s - PLANE_FLIGHT;
  if (c < 0 || c > PLANE_CATCH) return b;
  if (c < 0.4) return { ...b, armR: [0, 0, 2.6], eyes: 1, mouth: 'smile', screen: Math.max(b.screen, 0.4) };
  if (c < 1.3) return { ...b, armR: [-1.4, 0, -0.3], head: [0.35, 0, 0], props: { ...b.props, plane: true }, eyes: 1, mouth: 'smile' };
  if (c < 1.7) return { ...b, armR: [-0.4, 0, 2.2], mouth: 'laugh', eyes: 0.3 }; // thumbs up
  return blend({ ...b, armR: [-0.4, 0, 2.2] }, b, ease((c - 1.7) / 0.3));
}

/** where the bim stands under reduced motion: no walk, a fade out at the start then in at the end */
export const FADE = 0.8;
export function placeOf(pose: Pose, reduced: boolean): { x: number; z: number; opacity: number; fading: boolean } {
  const { path } = pose.seg;
  if (!reduced || path.len < 0.01 || pose.seg.from === null) return { x: pose.x, z: pose.z, opacity: 1, fading: false };
  const f = Math.min(FADE, path.len / pose.seg.speed);
  const s = pose.since;
  const a = path.pts[0];
  const b = path.pts[path.pts.length - 1];
  if (!a || !b) return { x: pose.x, z: pose.z, opacity: 1, fading: false };
  if (s < f / 2) return { x: a.x, z: a.z, opacity: 1 - s / (f / 2), fading: true };
  if (s < f) return { x: b.x, z: b.z, opacity: (s - f / 2) / (f / 2), fading: true };
  return { x: b.x, z: b.z, opacity: 1, fading: false };
}

/** the bim at time t: its body, its place, and how the loop must run for it */
export function rigOf(inp: RigInput): Rig {
  const { pose, t, phase, reduced } = inp;
  const { seg } = pose;
  const act = seg.act;
  const k: ActivityKind = act.k;
  const lt = loopT(t, reduced);
  const target = rest(k, lt, phase, act.urgent === true, act.fruit ?? 0);
  const place = placeOf(pose, reduced);
  const walkT = seg.path.len > 0.01 && seg.from !== null ? seg.path.len / seg.speed : 0;
  const arrived = reduced ? !place.fading : !pose.moving;
  const dur = reduced ? 0 : transitionOf(seg.from, k);
  const u = pose.since - (reduced ? Math.min(FADE, walkT) : walkT);

  let b: Body;
  let motion: Motion;
  if (!arrived && !reduced) {
    b = walking(k, t);
    motion = 'walk';
  } else if (!arrived) {
    b = target; // reduced: the end pose, fading in or out
    motion = 'walk';
  } else if (u < dur) {
    const from = walkT > 0 ? STAND : seg.from === null ? target : rest(seg.from, lt, phase, false, 0);
    const f = ease(u / dur);
    b = beat(seg.from, k, u / dur, blend(from, target, f));
    motion = 'walk';
  } else {
    b = target;
    motion = !reduced && (TYPING.has(k) || k === 'asks') ? 'loop' : 'still';
  }

  if (pose.plane && !reduced) {
    const s = pose.plane.since;
    if (s < PLANE_FLIGHT + PLANE_CATCH) motion = 'walk';
    if (arrived) b = caught(b, s);
  }

  const dir = b.face ?? pose.dir;
  const c = Math.cos(dir);
  const sn = Math.sin(dir);
  // the offset is in the bim's frame: z ahead along its way, x to its side
  const x = place.x + b.dx * c + b.dz * sn;
  const z = place.z - b.dx * sn + b.dz * c;
  return {
    x, z, dir, y: b.y, body: b.body, head: b.head, armL: b.armL, armR: b.armR, legL: b.legL, legR: b.legR,
    eyes: b.eyes, mouth: b.mouth, props: b.props, screen: b.screen, lamp: b.lamp, grey: b.grey,
    opacity: place.opacity, motion,
  };
}

/** the loudest of several motions: 'walk' over 'loop' over 'still' */
export function louder(a: Motion, b: Motion): Motion {
  if (a === 'walk' || b === 'walk') return 'walk';
  if (a === 'loop' || b === 'loop') return 'loop';
  return 'still';
}
