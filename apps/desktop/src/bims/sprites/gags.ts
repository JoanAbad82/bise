// bise.dev's home bims, prototype A (page bims-home v4, Gabriel's pick « les îles »): each gag lives
// on its own little clay island, the hero town's cube in miniature, in the section's margin beside
// its content. Pure, no three: each island is its slab's top, its props (a tiny desk with a little
// window, the upright piano), its bim's frames (the app's Rigs, as pose.ts makes them) and the
// order they play in at FPS, then the pose it holds and that pose's blink. studio.ts draws them
// with the app's own bims (render/bim.ts) and scripts/bims-sprites.mts exports them into site/bims/,
// which site/bims-proto.ts plays on the page. Units are the office's: a standing bim is ~1.2 tall,
// the island's top is y 0, its middle x 0 z 0; the camera is the town's 2:1 iso (camera.ts).
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

/** a music note over the piano, in the world: x, y, z and how far through its rise (0..1, gone at 1) */
export type Note = readonly [number, number, number, number];

export interface Frame {
  readonly bim: Actor;
  readonly notes?: readonly Note[];
}

/** the tiny desk: its middle on the island, its top's height and size; the little window on its back half */
export interface Desk {
  readonly x: number;
  readonly z: number;
  readonly h: number;
  readonly w: number;
  readonly d: number;
  /** the window's middle along the desk (x) */
  readonly win: number;
}

/** the upright piano (objects/music.ts) on the island: placed, turned and scaled */
export interface Piano {
  readonly x: number;
  readonly z: number;
  readonly turn: number;
  readonly scale: number;
}

export interface Island {
  readonly id: 'ways' | 'fun';
  /** its top: the office's floor or the lawn's grass */
  readonly top: 'floor' | 'grass';
  readonly desk?: Desk;
  readonly piano?: Piano;
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
const shut = (f: Frame): Frame => ({ ...f, bim: { ...f.bim, rig: { ...f.bim.rig, eyes: 0.15 } } });

/** sitting on an edge: its seat that far under the edge (pose.ts SEATED's body, lowered onto it) */
const SEAT_Y = -0.2;
/** legs over an edge, out ahead */
const HANG = -1.15;

// desktop or terminal?: on the tiny desk's edge beside its little window, legs swinging; then it waves once.
export const DESK: Desk = { x: -0.1, z: -0.35, h: 0.62, w: 1.2, d: 0.55, win: -0.3 };
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
    ...range(8).map((i) => ({ bim: sit(i / 8) })), // 0-7 legs swinging
    ...range(4).map((i) => ({ bim: wave(i / 4) })), // 8-11 the wave
    { bim: sit(0, { legL: HANG, legR: HANG + 0.08, head: [0, 0, 0.05] }) }, // 12 holds
  ];
  frames.push(shut(frames[12] as Frame)); // 13 its blink
  const seq = [...times(range(8), 3), 8, 9, 10, 11, 8, 9, 10, 11, 8, 12];
  return { id: 'ways', top: 'floor', desk: DESK, frames, seq, idle: 12, blink: 13 };
}

// it talks back: at its little upright piano, four silent notes while the voice demo talks.
export const PIANO: Piano = { x: -0.2, z: -0.3, turn: AZ - Math.PI / 2 + 0.45, scale: 0.72 };
function fun(): Island {
  const name = 'cart';
  // its seat on the stool (objects/music.ts: the stool's top at 0.54, ahead of the keys), turned with the piano
  const sz = 0.84 * PIANO.scale;
  const x = PIANO.x + Math.sin(PIANO.turn) * sz;
  const z = PIANO.z + Math.cos(PIANO.turn) * sz;
  const y = 0.54 * PIANO.scale - 0.15;
  const play = (l: number, r: number, o: Partial<Rig> = {}): Actor =>
    bim(name, { x, z, dir: PIANO.turn + Math.PI, y, legL: -1.45, legR: -1.45, armL: [-1.05 - l, 0, 0.1], armR: [-1.05 - r, 0, -0.1], head: [0.1, 0, 0], ...o });
  // the notes rise over the piano's top, along its width
  const ax = Math.cos(PIANO.turn);
  const az = -Math.sin(PIANO.turn);
  const note = (k: number, f: number): Note => {
    const u = -0.3 + k * 0.2;
    return [PIANO.x + ax * u, 1.05 * PIANO.scale + 0.1, PIANO.z + az * u, f];
  };
  const frames: Frame[] = [
    { bim: play(0, 0) }, // 0
    { bim: play(0.35, 0, { head: [0.1, 0.15, 0.08] }), notes: [note(0, 0)] }, // 1 note 1
    { bim: play(0, 0), notes: [note(0, 0.35)] },
    { bim: play(0, 0.35, { head: [0.1, -0.15, -0.08] }), notes: [note(0, 0.7), note(1, 0)] }, // 3 note 2
    { bim: play(0, 0), notes: [note(1, 0.35)] },
    { bim: play(0.35, 0, { head: [0.1, 0.15, 0.08] }), notes: [note(1, 0.7), note(2, 0)] }, // 5 note 3
    { bim: play(0, 0), notes: [note(2, 0.35)] },
    { bim: play(0.35, 0.35, { head: [-0.1, 0, 0], eyes: 0.3, mouth: 'laugh' }), notes: [note(2, 0.7), note(3, 0)] }, // 7 note 4, both hands
    { bim: play(0, 0, { eyes: 0.3, mouth: 'laugh' }), notes: [note(3, 0.35)] },
    { bim: play(0, 0, { eyes: 0.3, mouth: 'laugh' }), notes: [note(3, 0.7)] },
    { bim: play(0, 0, { head: [0, -1.0, 0] }) }, // 10 turned to you
  ];
  frames.push(shut(frames[10] as Frame)); // 11 its blink
  const seq = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 0, 0, 10];
  return { id: 'fun', top: 'grass', piano: PIANO, frames, seq, idle: 10, blink: 11 };
}

/** the two islands, in the page's order */
export const ISLANDS: readonly Island[] = [ways(), fun()];
