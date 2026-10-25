// bise.dev's home bims (page bims-home v7, Gabriel's pick « les îles », on the whole home): each
// section's gag lives on its own little clay island, the hero town's cube in miniature, in the
// section's margin beside its title (seven: 'so here's how bise does it.' has no free side, designer
// m_41966). Pure, no three: each island is its slab's top, its props (a tiny desk, the upright piano,
// a beanbag, a quarter pipe, a floor lamp and a pouf), its bims' frames (the app's Rigs, as pose.ts
// makes them), the bits that move with them (music notes, a paper plane, a book, a sleeper's z's) and the order they play in at FPS, then the
// pose it holds and that pose's blink. studio.ts draws them with the app's own bims (render/bim.ts)
// and scripts/bims-sprites.mts exports them into site/bims/, which site/bims-islands.ts plays on the
// page. Units are the office's: a standing bim is ~1.2 tall, the island's top is y 0, its middle
// x 0 z 0; the camera is the town's 2:1 iso (camera.ts). Owner: bims-islands.
import { AZ } from '../render/camera';
import { NO_PROPS, type Rig, type Rot } from '../render/pose';

/** the sheets' frame rate */
export const FPS = 12;
/** unique frames per island: 8 to 16 (the brief's weight) */
export const MIN_FRAMES = 8;
export const MAX_FRAMES = 16;
/** the island's slab: as wide as deep, its dirt side, its top's layer */
export const SLAB = { w: 2.2, h: 0.55, top: 0.12, r: 0.22 } as const;

export interface Actor {
  readonly name: string;
  readonly rig: Rig;
}

/** a point in the world: x, y, z */
export type V = readonly [number, number, number];

/** what moves with a gag's bims, frame by frame (scene.ts draws each kind) */
export type Bit =
  /** a music note rising, how far through its rise (0..1, gone at 1); `fade` shrinks it away (1 whole .. 0 gone) */
  | { readonly kind: 'note'; readonly at: V; readonly k: number; readonly fade?: number }
  /** a sleeper's z rising, how far through (0..1) */
  | { readonly kind: 'z'; readonly at: V; readonly k: number }
  /** a sleep bubble swelling, how far through (0..1: it pops just before 1, gone at 1) */
  | { readonly kind: 'bubble'; readonly at: V; readonly k: number }
  /** the paper plane (render/plane.ts): its heading, its nose's pitch (up > 0), its bank, its fold (0 folded .. 1 open) */
  | { readonly kind: 'plane'; readonly at: V; readonly dir: number; readonly pitch: number; readonly fold: number; readonly roll?: number }
  /** a small open book in its reader's hands: its reader's way, how far a page has turned (0..1) */
  | { readonly kind: 'book'; readonly at: V; readonly dir: number; readonly flip: number };

export interface Frame {
  readonly bims: readonly Actor[];
  readonly bits?: readonly Bit[];
}

/** what stands on an island, drawn once in its base; `turn` is the way its front faces */
export type Prop =
  /** the tiny desk: its top's height and size; the little window on its back half at `win` along it */
  | { readonly kind: 'desk'; readonly x: number; readonly z: number; readonly h: number; readonly w: number; readonly d: number; readonly win: number }
  /** the upright piano (objects/music.ts), scaled */
  | { readonly kind: 'piano'; readonly x: number; readonly z: number; readonly turn: number; readonly scale: number }
  | { readonly kind: 'beanbag'; readonly x: number; readonly z: number }
  /** a little quarter pipe, rising away from its front */
  | { readonly kind: 'ramp'; readonly x: number; readonly z: number; readonly turn: number }
  | { readonly kind: 'lamp'; readonly x: number; readonly z: number }
  /** a round pouf, its seat `h` high */
  | { readonly kind: 'pouf'; readonly x: number; readonly z: number; readonly h: number };

export type IslandId = 'ways' | 'why' | 'arts' | 'fun' | 'hard' | 'faq' | 'end';

export interface Island {
  readonly id: IslandId;
  /** its top: the office's floor or the lawn's grass */
  readonly top: 'floor' | 'grass';
  readonly props: readonly Prop[];
  readonly frames: readonly Frame[];
  /** the frames' order as the gag plays, at FPS; its last is `idle` */
  readonly seq: readonly number[];
  /** the frame it holds after the gag (and under reduced motion) */
  readonly idle: number;
  /** the held pose with its eyes shut, every ~8 s */
  readonly blink: number;
}

const Z: Rot = [0, 0, 0];
const TAU = Math.PI * 2;

/** a bim standing at the origin, facing +z: pose.ts's STAND, outside any office */
export const STAND: Rig = {
  x: 0, z: 0, dir: 0, y: 0, body: Z, head: Z, armL: Z, armR: Z, legL: 0, legR: 0, eyes: 1, mouth: 'smile',
  props: NO_PROPS, screen: 0, lamp: false, grey: 0, opacity: 1, motion: 'still',
};

const bim = (name: string, o: Partial<Rig>): Actor => ({ name, rig: { ...STAND, ...o } });
const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);
const times = (xs: readonly number[], n: number): number[] => range(n).flatMap(() => xs);
const shut = (f: Frame): Frame => ({ ...f, bims: f.bims.map((b) => ({ ...b, rig: { ...b.rig, eyes: 0.15 } })) });
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** the page's axes on the island: u to the screen's right, f toward the viewer (camera.ts RIGHT, BACK) */
const RX = Math.cos(AZ), RZ = -Math.sin(AZ), FX = Math.sin(AZ), FZ = Math.cos(AZ);
/** the island's point u right, f toward you */
export const spot = (u: number, f: number): { x: number; z: number } => ({ x: u * RX + f * FX, z: u * RZ + f * FZ });
/** the way that faces u right, f toward you (dir 0 faces +z) */
export const facing = (u: number, f: number): number => Math.atan2(u * RX + f * FX, u * RZ + f * FZ);
/** what a bim holds before its chest: `fwd` ahead of it, `up` over its seat or feet */
const held = (r: Partial<Rig>, fwd: number, up: number): V => {
  const d = r.dir ?? 0;
  return [(r.x ?? 0) + Math.sin(d) * fwd, (r.lift ?? 0) + (r.y ?? 0) + up, (r.z ?? 0) + Math.cos(d) * fwd];
};

/** sitting on an edge: its seat that far under the edge (pose.ts SEATED's body, lowered onto it) */
const SEAT_Y = -0.2;
/** legs over an edge, out ahead */
const HANG = -1.15;

// desktop or terminal?: on the tiny desk's edge beside its little window, legs swinging; then it waves once.
export const DESK = { kind: 'desk', x: -0.1, z: -0.35, h: 0.62, w: 1.2, d: 0.55, win: -0.3 } as const;
function ways(): Island {
  const name = 'wallet';
  const at: Partial<Rig> = { x: DESK.x + 0.36, z: DESK.z + DESK.d / 2 - 0.06, dir: AZ, y: DESK.h + SEAT_Y };
  const sit = (t: number, o: Partial<Rig> = {}): Actor => {
    const s = Math.sin(t * TAU);
    return bim(name, {
      ...at, legL: HANG + 0.35 * s, legR: HANG - 0.35 * s, armL: [0.1, 0, -0.3], armR: [0.1, 0, 0.3],
      head: [0.05 * s, 0.1 * Math.sin(t * Math.PI), 0.06 * s], ...o,
    });
  };
  const wave = (k: number): Actor => {
    const s = Math.sin(k * TAU) * 0.4;
    return bim(name, { ...at, legL: HANG, legR: HANG, armL: [0.1, 0, -0.3], armR: [0, 0, 2.5 - s], eyes: 0.3, mouth: 'laugh', head: [0, 0, -0.08] });
  };
  const frames: Frame[] = [
    ...range(8).map((i) => ({ bims: [sit(i / 8)] })), // 0-7 legs swinging
    ...range(4).map((i) => ({ bims: [wave(i / 4)] })), // 8-11 the wave
    { bims: [sit(0, { legL: HANG, legR: HANG + 0.08, head: [0, 0, 0.05] })] }, // 12 holds
  ];
  frames.push(shut(frames[12] as Frame)); // 13 its blink
  const seq = [...times(range(8), 3), 8, 9, 10, 11, 8, 9, 10, 11, 8, 12];
  return { id: 'ways', top: 'floor', props: [DESK], frames, seq, idle: 12, blink: 13 };
}

// babysit robots: asleep on a beanbag, eyes two lines, z's rising; it wakes as you arrive and stretches.
export const BEANBAG = { kind: 'beanbag', ...spot(0.05, -0.2) } as const;
function why(): Island {
  const name = 'search';
  const at: Partial<Rig> = { ...spot(0.05, 0.02), dir: facing(0.1, 1), y: 0.16, legL: -1.3, legR: -1.25 };
  const zAt = (k: number, j: number): Bit => {
    const p = spot(0.35 + k * 0.25, -0.15);
    return { kind: 'z', at: [p.x, 1.2 + k * 0.45 + j * 0.02, p.z], k };
  };
  const sleep = (i: number): Actor => bim(name, {
    ...at, body: [-0.42 + 0.03 * Math.sin((i / 3) * TAU), 0, 0], head: [-0.1, 0.3, 0.22], armL: [-0.15, 0, -0.55], armR: [-0.15, 0, 0.55], eyes: 0.1,
  });
  const stretch = (k: number, o: Partial<Rig> = {}): Actor => bim(name, {
    ...at, body: [-0.2 - 0.1 * k, 0, 0], head: [-0.25 * k, 0, 0], armL: [-0.2 * k, 0, -0.4 - 2.3 * k], armR: [-0.2 * k, 0, 0.4 + 2.3 * k], ...o,
  });
  const frames: Frame[] = [
    ...range(3).map((i) => ({ bims: [sleep(i)], bits: [zAt(i / 3, 0), zAt((i / 3 + 0.5) % 1, 1)] })), // 0-2 asleep, breathing
    { bims: [bim(name, { ...at, body: [-0.3, 0, 0], head: [0, 0.15, 0.1], armL: [-0.15, 0, -0.5], armR: [-0.15, 0, 0.5], eyes: 0.45, mouth: 'oh' })] }, // 3 an eye opens
    { bims: [bim(name, { ...at, body: [-0.2, 0, 0], head: [-0.05, 0, 0], armL: [-0.2, 0, -0.45], armR: [-0.2, 0, 0.45] })] }, // 4 awake
    { bims: [stretch(0.45, { eyes: 0.6 })] }, // 5 arms going up
    { bims: [stretch(1, { eyes: 0.15, mouth: 'oh' })] }, // 6 the stretch, a yawn
    { bims: [stretch(1.08, { eyes: 0.15, mouth: 'oh', body: [-0.34, 0, 0] })] }, // 7 further
    { bims: [stretch(0.4, { eyes: 0.8, mouth: 'laugh' })] }, // 8 arms coming down
    { bims: [bim(name, { ...at, body: [-0.12, 0, 0], head: [0, 0, 0.08], armL: [-0.45, 0, -0.3], armR: [-0.45, 0, 0.3] })] }, // 9 holds
  ];
  frames.push(shut(frames[9] as Frame)); // 10 its blink
  const seq = [...times([0, 1, 2], 3), 3, 3, 3, 4, 4, 5, 6, 6, 7, 7, 7, 6, 8, 9];
  return { id: 'why', top: 'grass', props: [BEANBAG], frames, seq, idle: 9, blink: 10 };
}

// questions you can actually answer: a paper plane (the hero's) lands in its hand; it unfolds it and reads.
function arts(): Island {
  const name = 'perf';
  const at: Partial<Rig> = { ...spot(0.3, 0.1), dir: facing(-0.35, 1) };
  const hand = held({ ...at, x: (at.x ?? 0) - 0.12, z: (at.z ?? 0) + 0.12 }, 0.3, 0.82);
  const start = spot(-0.85, -0.45);
  const path = (t: number): V => [lerp(start.x, hand[0], t), lerp(1.95, hand[1], t) + 0.25 * Math.sin(Math.PI * t), lerp(start.z, hand[2], t)];
  const heading = Math.atan2(hand[0] - start.x, hand[2] - start.z);
  const plane = (t: number, pitch: number, fold = 0): Bit => ({ kind: 'plane', at: path(t), dir: heading, pitch, fold });
  const look = (t: number): Rot => [-0.35 * (1 - t), -0.5 * (1 - t), 0];
  const catchArm: Rot = [-1.7, 0, 0.35];
  const read: Partial<Rig> = { ...at, armL: [-1.3, 0, 0.35], armR: [-1.3, 0, -0.35], props: { ...NO_PROPS, sheet: true } };
  const frames: Frame[] = [
    { bims: [bim(name, { ...at, head: look(0), eyes: 1 })], bits: [plane(0, 0.1)] }, // 0 it sees it coming
    { bims: [bim(name, { ...at, head: look(0.3), armR: [-0.8, 0, 0.3], mouth: 'oh' })], bits: [plane(0.3, 0)] },
    { bims: [bim(name, { ...at, head: look(0.55), armR: [-1.3, 0, 0.35], mouth: 'oh' })], bits: [plane(0.55, -0.1)] },
    { bims: [bim(name, { ...at, head: look(0.8), armR: catchArm, mouth: 'oh' })], bits: [plane(0.8, -0.05)] },
    { bims: [bim(name, { ...at, head: [0.2, 0, 0], armR: catchArm, mouth: 'laugh', eyes: 0.3 })], bits: [plane(1, 0.25)] }, // 4 caught
    { bims: [bim(name, { ...at, head: [0.2, 0, 0], armL: [-1.4, 0, 0.3], armR: [-1.4, 0, -0.3] })], bits: [{ kind: 'plane', at: held(at, 0.36, 0.62), dir: at.dir ?? 0, pitch: 1.2, fold: 0.55 }] }, // 5 unfolding
    { bims: [bim(name, { ...read, head: [0.25, 0.12, 0] })] }, // 6 reading
    { bims: [bim(name, { ...read, head: [0.25, -0.12, 0] })] },
    { bims: [bim(name, { ...read, head: [0.15, 0, 0], mouth: 'oh' })] }, // 8 oh!
    { bims: [bim(name, { ...read, head: [-0.05, 0, 0.06], mouth: 'laugh', eyes: 0.3 })] }, // 9 looks up, delighted
    { bims: [bim(name, { ...read, head: [-0.05, 0, 0.06] })] }, // 10 holds
  ];
  frames.push(shut(frames[10] as Frame)); // 11 its blink
  const seq = [0, 0, 0, 1, 2, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 6, 6, 7, 7, 8, 8, 8, 9, 9, 9, 10];
  return { id: 'arts', top: 'grass', props: [], frames, seq, idle: 10, blink: 11 };
}

// it talks back: at its little upright piano, four silent notes while the voice demo talks.
export const PIANO = { kind: 'piano', x: -0.2, z: -0.3, turn: AZ - Math.PI / 2 + 0.45, scale: 0.72 } as const;
function fun(): Island {
  const name = 'cart';
  // its seat on the stool (objects/music.ts: the stool's top at 0.54, ahead of the keys), turned with the piano
  const sz = 0.84 * PIANO.scale;
  const x = PIANO.x + Math.sin(PIANO.turn) * sz;
  const z = PIANO.z + Math.cos(PIANO.turn) * sz;
  const y = 0.54 * PIANO.scale - 0.15;
  const play = (l: number, r: number, o: Partial<Rig> = {}): Actor[] =>
    [bim(name, { x, z, dir: PIANO.turn + Math.PI, y, legL: -1.45, legR: -1.45, armL: [-1.05 - l, 0, 0.1], armR: [-1.05 - r, 0, -0.1], head: [0.1, 0, 0], ...o })];
  // the notes rise over the piano's top, along its width
  const ax = Math.cos(PIANO.turn);
  const az = -Math.sin(PIANO.turn);
  const note = (n: number, k: number): Bit => {
    const u = -0.3 + n * 0.2;
    return { kind: 'note', at: [PIANO.x + ax * u, 1.05 * PIANO.scale + 0.1, PIANO.z + az * u], k };
  };
  const frames: Frame[] = [
    { bims: play(0, 0) }, // 0
    { bims: play(0.35, 0, { head: [0.1, 0.15, 0.08] }), bits: [note(0, 0)] }, // 1 note 1
    { bims: play(0, 0), bits: [note(0, 0.35)] },
    { bims: play(0, 0.35, { head: [0.1, -0.15, -0.08] }), bits: [note(0, 0.7), note(1, 0)] }, // 3 note 2
    { bims: play(0, 0), bits: [note(1, 0.35)] },
    { bims: play(0.35, 0, { head: [0.1, 0.15, 0.08] }), bits: [note(1, 0.7), note(2, 0)] }, // 5 note 3
    { bims: play(0, 0), bits: [note(2, 0.35)] },
    { bims: play(0.35, 0.35, { head: [-0.1, 0, 0], eyes: 0.3, mouth: 'laugh' }), bits: [note(2, 0.7), note(3, 0)] }, // 7 note 4, both hands
    { bims: play(0, 0, { eyes: 0.3, mouth: 'laugh' }), bits: [note(3, 0.35)] },
    { bims: play(0, 0, { eyes: 0.3, mouth: 'laugh' }), bits: [note(3, 0.7)] },
    { bims: play(0, 0, { head: [0, -1.0, 0] }) }, // 10 turned to you
  ];
  frames.push(shut(frames[10] as Frame)); // 11 its blink
  const seq = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 0, 0, 10];
  return { id: 'fun', top: 'grass', props: [PIANO], frames, seq, idle: 10, blink: 11 };
}

// the hard parts, done right: on its skateboard by a tiny quarter pipe, one clean ollie.
/** at the island's right, its front (and its curve's foot) to the left: its side shows the curve */
export const RAMP = { kind: 'ramp', ...spot(0.62, -0.25), turn: facing(-1, 0) } as const;
/** a rider's lift: its feet on the deck (bim.ts: the deck's top 0.17 over the floor) */
const DECK = 0.17;
function hard(): Island {
  const name = 'qa';
  const dir = facing(1, 0);
  const ride = (u: number, o: Partial<Rig> = {}): Actor => bim(name, {
    ...spot(u - 0.25, 0.3), dir, lift: DECK, armL: [0, 0, -0.75], armR: [0, 0, 0.75], head: [0, -0.5, 0], props: { ...NO_PROPS, skate: true }, ...o,
  });
  /** in the air `h` over the floor, the board kept under the feet, pitched `p` */
  const air = (u: number, h: number, p: number, o: Partial<Rig> = {}): Actor =>
    ride(u, { lift: DECK + h, board: { x: 0, y: 0.08, z: 0, rot: [p, 0, 0] }, armL: [0, 0, -1.3], armR: [0, 0, 1.3], ...o });
  const crouch: Partial<Rig> = { y: -0.12, body: [0.25, 0, 0], head: [-0.2, -0.4, 0] };
  const frames: Frame[] = [
    { bims: [ride(-0.4)] }, // 0 rolling in
    { bims: [ride(-0.27)] },
    { bims: [ride(-0.15, crouch)] }, // 2 crouch
    { bims: [air(-0.03, 0.2, -0.45, { mouth: 'oh' })] }, // 3 pop, the nose up
    { bims: [air(0.09, 0.36, 0, { mouth: 'laugh', eyes: 0.3 })] }, // 4 its top, the board level
    { bims: [air(0.2, 0.18, 0.15, { mouth: 'laugh', eyes: 0.3 })] }, // 5 coming down
    { bims: [ride(0.3, { ...crouch, mouth: 'laugh', eyes: 0.3 })] }, // 6 landed, knees bent
    { bims: [ride(0.36, { armR: [0, 0, 2.6], mouth: 'laugh', eyes: 0.3, head: [0, -0.8, 0] })] }, // 7 yes!
    { bims: [ride(0.38, { armL: [0, 0, -0.3], armR: [0, 0, 0.3], head: [0, -0.9, 0.06] })] }, // 8 holds, turned to you
  ];
  frames.push(shut(frames[8] as Frame)); // 9 its blink
  const seq = [0, 0, 1, 1, 2, 2, 2, 3, 4, 4, 5, 6, 6, 7, 7, 7, 7, 8];
  return { id: 'hard', top: 'floor', props: [RAMP], frames, seq, idle: 8, blink: 9 };
}

// you'll ask: on a pouf under a floor lamp, reading a small book; a page turns, a chuckle, it looks up.
export const LAMP = { kind: 'lamp', ...spot(-0.55, -0.3) } as const;
export const POUF = { kind: 'pouf', ...spot(0.1, -0.05), h: 0.34 } as const;
function faq(): Island {
  const name = 'docs';
  const at: Partial<Rig> = { x: POUF.x, z: POUF.z, dir: facing(-0.25, 1), y: POUF.h + SEAT_Y, legL: -1.45, legR: -1.45 };
  const arms: Partial<Rig> = { armL: [-1.25, 0, 0.4], armR: [-1.25, 0, -0.4] };
  const book = (flip: number, up = 0): Bit => ({ kind: 'book', at: held(at, 0.36, 0.6 + up), dir: at.dir ?? 0, flip });
  const read = (head: Rot, flip = 0, o: Partial<Rig> = {}): Frame => ({ bims: [bim(name, { ...at, ...arms, head, ...o })], bits: [book(flip)] });
  const frames: Frame[] = [
    read([0.35, 0.1, 0]), // 0 reading
    read([0.35, -0.1, 0]), // 1 the line's end
    read([0.3, 0.05, 0], 0.5), // 2 a page turns
    read([0.35, 0.1, 0], 1), // 3 turned
    read([0.35, 0, 0], 1, { mouth: 'oh' }), // 4 oh
    read([0.25, 0, 0.1], 1, { mouth: 'laugh', eyes: 0.3 }), // 5 a chuckle
    read([0.35, -0.1, 0], 1), // 6 back to it
    { bims: [bim(name, { ...at, ...arms, head: [-0.05, 0, 0.06] })], bits: [book(1, -0.03)] }, // 7 looks up at you, holds
  ];
  frames.push(shut(frames[7] as Frame)); // 8 its blink
  const seq = [0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 2, 3, 3, 3, 4, 4, 5, 5, 5, 5, 6, 6, 6, 7];
  return { id: 'faq', top: 'floor', props: [LAMP, POUF], frames, seq, idle: 7, blink: 8 };
}

// desktop or terminal? (the end): two bims on one island wave goodbye.
function end(): Island {
  const a: Partial<Rig> = { ...spot(-0.38, 0.05), dir: facing(0.3, 1) };
  const b: Partial<Rig> = { ...spot(0.38, -0.05), dir: facing(-0.3, 1) };
  const arm = (k: number): number => 2.5 - Math.sin(k * TAU) * 0.4;
  /** each waves its outer arm, half a beat apart */
  const both = (k: number, o: Partial<Rig> = {}): Actor[] => [
    bim('stock', { ...a, armR: [0, 0, 0.3], armL: [0, 0, -arm(k)], mouth: 'laugh', eyes: 0.3, head: [0, 0, -0.08], ...o }),
    bim('promo', { ...b, armL: [0, 0, -0.3], armR: [0, 0, arm(k + 0.5)], mouth: 'laugh', eyes: 0.3, head: [0, 0, 0.08], ...o }),
  ];
  const rest = (o: Partial<Rig> = {}): Actor[] => [
    bim('stock', { ...a, armL: [0, 0, -0.3], armR: [0, 0, 0.3], head: [0, 0, -0.06], ...o }),
    bim('promo', { ...b, armL: [0, 0, -0.3], armR: [0, 0, 0.3], head: [0, 0, 0.06], ...o }),
  ];
  const frames: Frame[] = [
    ...range(4).map((i) => ({ bims: both(i / 4) })), // 0-3 the waves
    { bims: rest({ body: [0.3, 0, 0], head: [0.25, 0, 0], eyes: 0.3, mouth: 'laugh' }) }, // 4 a little bow
    { bims: rest({ body: [0.12, 0, 0], eyes: 0.6 }) }, // 5 back up
    { bims: rest() }, // 6 holds
  ];
  frames.push(shut(frames[6] as Frame)); // 7 their blink
  const seq = [...times(range(4), 4), 5, 4, 4, 4, 5, 6];
  return { id: 'end', top: 'floor', props: [], frames, seq, idle: 6, blink: 7 };
}

/** the seven islands, in the page's order */
export const ISLANDS: readonly Island[] = [ways(), why(), arts(), fun(), hard(), faq(), end()];
