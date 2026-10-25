// bise.dev's home gags (page bims-home, Gabriel's pick A): one bim per section plays its gag once,
// then holds its last pose and blinks. Pure, no three: each sheet is a list of frames (the bims'
// Rigs, as pose.ts makes them for the app, and the few props the studio draws), the order they play
// in (`seq`, at FPS, a frame may repeat) and its last pose. studio.ts draws them with the app's own
// bims (render/bim.ts) and scripts/bims-sprites.mts exports them as WebP sheets into site/bims/,
// which site/bims-gags.ts plays on the page. Units are the office's: a standing bim is ~1.2 tall.
// Each sheet's origin (0, 0, 0) is its anchor on the page (a card's corner, a button's side), read
// by the page's script: the bims sit, hang or stand on that point, never over text.
import { NO_PROPS, type Rig, type Rot } from '../render/pose';

/** the sheets' frame rate */
export const FPS = 12;
/** a frame's height in the office's units (96 css px on the page, 72 on a phone) */
export const FRAME_H = 2;
/** unique frames per sheet: 8 to 16 (the brief's weight) */
export const MIN_FRAMES = 8;
export const MAX_FRAMES = 16;

/** what a bim holds beside the app's own props (bim.ts) */
export interface Actor {
  readonly name: string;
  readonly rig: Rig;
  /** a pencil in its right hand (the app's marker, drawn as a pencil) */
  readonly pencil?: boolean;
  /** a small book in both hands: 0 shut .. 1 open; `page` 0..1 a page turning */
  readonly book?: { readonly open: number; readonly page: number };
}

export interface Frame {
  readonly bims: readonly Actor[];
  /** music notes over the piano: x, y and how far through its rise (0..1, gone at 1) */
  readonly notes?: readonly (readonly [number, number, number])[];
  /** the pencil's strokes written so far */
  readonly marks?: number;
}

export interface Sheet {
  readonly id: string;
  /** the window drawn, in the office's units around the anchor: x from x0 to x1, y from y0 to y0 + FRAME_H */
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly frames: readonly Frame[];
  /** the frames' order as the gag plays, at FPS; its last is `idle` */
  readonly seq: readonly number[];
  /** the frame it holds after the gag (and under reduced motion) */
  readonly idle: number;
  /** on a phone (≤ 600 px) too */
  readonly phone: boolean;
  /** the upright piano (objects/music.ts), scaled, turned and placed in the sheet */
  readonly piano?: { readonly x: number; readonly z: number; readonly turn: number; readonly scale: number };
  /** a gag that travels (the skater): how far along its path (0..1) at each step of seq */
  readonly travel?: readonly number[];
}

const Z: Rot = [0, 0, 0];
const TAU = Math.PI * 2;

/** a bim standing at the origin, facing the camera: pose.ts's STAND, outside any office */
export const STAND: Rig = {
  x: 0, z: 0, dir: 0, y: 0, body: Z, head: Z, armL: Z, armR: Z, legL: 0, legR: 0, eyes: 1, mouth: 'smile',
  props: NO_PROPS, screen: 0, lamp: false, grey: 0, opacity: 1, motion: 'still',
};

const rig = (o: Partial<Rig>): Rig => ({ ...STAND, ...o });
const bim = (name: string, o: Partial<Rig>, more: Omit<Actor, 'name' | 'rig'> = {}): Actor => ({ name, rig: rig(o), ...more });
const one = (a: Actor, more: Omit<Frame, 'bims'> = {}): Frame => ({ bims: [a], ...more });
const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);
const times = (xs: readonly number[], n: number): number[] => range(n).flatMap(() => xs);

/** sitting on an edge at y 0: its seat on the edge (pose.ts SEATED's body, lowered onto it) */
const SEAT_Y = -0.2;
/** legs over an edge, out ahead (seen from the front, a seat reads by its feet) */
const HANG = -1.15;
/** hanging from an edge at y 0 by its hands, arms straight up */
const HANG_Y = -0.98;
/** a hand on the edge at y 0 from a body at y: the arm's turn (shoulder 0.66, arm 0.3) */
const reach = (y: number): number => -Math.acos(Math.max(-1, Math.min(1, (y + 0.66) / 0.3)));

/** the bim that hangs from an edge's corner and pulls itself up; `side` 1: the edge is to its left */
function hanging(name: string, y: number, o: Partial<Rig> = {}): Actor {
  const a = reach(y);
  return bim(name, { x: 0.24, dir: -1.15, y, armL: [a, 0, 0], armR: [a, 0, 0], mouth: 'oh', ...o });
}

// 1. desktop or terminal?: one sits on the desktop card's top edge, legs swinging; another climbs the
// terminal card's top right corner, slips, and makes it on its second try.
function waysSit(): Sheet {
  const name = 'wallet';
  const sit = (t: number, o: Partial<Rig> = {}): Actor => {
    const s = Math.sin(t * TAU);
    return bim(name, {
      dir: 0.3, y: SEAT_Y, legL: HANG + 0.3 * s, legR: HANG - 0.3 * s, armL: [0.1, 0, -0.3], armR: [0.1, 0, 0.3],
      head: [0.05 * s, 0.25 + 0.12 * Math.sin(t * Math.PI), 0.06 * s], ...o,
    });
  };
  const frames = [...range(10).map((i) => one(sit(i / 10))), one(sit(0, { legL: HANG, legR: HANG, head: [0, 0.2, 0] }))];
  return { id: 'ways-sit', x0: -0.8, x1: 0.8, y0: -0.75, frames, seq: [...times(range(10), 3), 10], idle: 10, phone: true };
}

function waysClimb(): Sheet {
  const name = 'stock';
  const kick = (k: number): Partial<Rig> => ({ legL: 0.25 * k, legR: -0.25 * k });
  const frames: Frame[] = [
    one(hanging(name, HANG_Y, kick(1))), // 0 hanging
    one(hanging(name, HANG_Y, kick(-1))), // 1 kicking
    one(hanging(name, -0.82, { ...kick(0.5), eyes: 0.3 })), // 2 pulling
    one(hanging(name, -0.68, { eyes: 0.3, body: [0.15, 0, 0] })), // 3 nearly there
    one(hanging(name, -0.86, { eyes: 1, mouth: 'oh', legL: -0.5, legR: 0.4, body: [-0.15, 0, 0] })), // 4 it slips
    one(hanging(name, HANG_Y, { legL: 0.4, legR: -0.5, head: [-0.2, 0.3, 0] })), // 5 swinging, looks at you
    one(hanging(name, -0.8, { ...kick(0.4), eyes: 0.3 })), // 6 again
    one(hanging(name, -0.62, { eyes: 0.3, body: [0.2, 0, 0] })), // 7 again, nearly there
    // 8 over the edge: leaning on its hands, a knee up
    one(bim(name, { x: 0.1, dir: -1.15, y: -0.42, body: [0.7, 0, 0], armL: [-0.6, 0, 0], armR: [-0.6, 0, 0], legL: -1.0, legR: 0.1, eyes: 0.3, mouth: 'oh' })),
    // 9 up on the corner, turning to sit
    one(bim(name, { x: -0.12, dir: -0.6, y: -0.15, body: [0.3, 0, 0], armL: [-0.3, 0, -0.4], armR: [-0.3, 0, 0.4], legL: -1.2, legR: -0.6 })),
    // 10 sitting, arms up: made it
    one(bim(name, { x: -0.3, dir: 0.3, y: SEAT_Y, legL: HANG, legR: HANG, armL: [0, 0, -2.4], armR: [0, 0, 2.4], eyes: 0.3, mouth: 'laugh' })),
    // 11 sitting on the corner
    one(bim(name, { x: -0.3, dir: 0.3, y: SEAT_Y, legL: HANG - 0.1, legR: HANG + 0.1, armL: [0.1, 0, -0.3], armR: [0.1, 0, 0.3], head: [0, 0.15, 0] })),
  ];
  const seq = [0, 0, 1, 1, 0, 0, 1, 1, 2, 2, 3, 3, 3, 4, 5, 5, 5, 0, 1, 0, 6, 6, 7, 7, 8, 8, 9, 10, 10, 10, 10, 10, 11];
  return { id: 'ways-climb', x0: -0.85, x1: 0.75, y0: -1.05, frames, seq, idle: 11, phone: true };
}

// 2. babysit robots: asleep on its side on the highlight (its eyes two lines), it wakes, sits up and stretches.
function why(): Sheet {
  const name = 'docs';
  // lying on its side, its feet at the highlight's end, its head on its arm
  const lying = (breath: number, o: Partial<Rig> = {}): Actor =>
    bim(name, {
      x: -0.12, y: 0.21 + breath * 0.012, body: [0, 0, 1.5], head: [0.1, 0, -0.25], armL: [-0.9, 0, 0], armR: [-0.4, 0, 0.3],
      legL: -0.35, legR: -0.2, eyes: 0.15, mouth: 'oh', ...o,
    });
  const sat = (o: Partial<Rig> = {}): Actor => bim(name, { x: -0.5, y: SEAT_Y, legL: -1.45, legR: -1.45, armL: [0, 0, -0.25], armR: [0, 0, 0.25], ...o });
  const frames: Frame[] = [
    one(lying(0)), // 0
    one(lying(1)), // 1
    one(lying(0, { eyes: 1 })), // 2 awake
    one(bim(name, { x: -0.3, y: 0.05, body: [0, 0, 0.95], armL: [-0.4, 0, -0.4], armR: [0.2, 0, 0.6], legL: -0.9, legR: -0.7, eyes: 1 })), // 3 rising
    one(bim(name, { x: -0.45, y: -0.12, body: [0, 0, 0.35], armL: [0, 0, -0.5], armR: [0, 0, 0.5], legL: -1.3, legR: -1.2 })), // 4 nearly up
    one(sat({ armL: [-2.9, 0, -0.35], armR: [-2.9, 0, 0.35], eyes: 0.15, mouth: 'oh', head: [-0.2, 0, 0] })), // 5 the stretch, a yawn
    one(sat({ armL: [-3.0, 0, -0.6], armR: [-3.0, 0, 0.6], body: [-0.12, 0, 0], eyes: 0.15, mouth: 'oh', head: [-0.3, 0, 0] })), // 6 more
    one(sat({ head: [0, 0.2, 0] })), // 7 sitting, awake
  ];
  const seq = [0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 3, 4, 5, 5, 6, 6, 6, 6, 5, 7];
  return { id: 'why', x0: -1.35, x1: 0.25, y0: -0.4, frames, seq, idle: 7, phone: true };
}

// 3. another one ↻: it pushes the button from its side (never presses it), then gives up and smiles.
function lead(): Sheet {
  const name = 'perf';
  const push = (k: number): Actor =>
    bim(name, {
      x: 0.52, dir: -1.2, y: 0.02 * Math.abs(Math.sin(k * Math.PI)), body: [0.4, 0, 0], armL: [-1.25, 0, 0], armR: [-1.25, 0, 0],
      legL: 0.55 * Math.cos(k * TAU) + 0.2, legR: -0.55 * Math.cos(k * TAU) + 0.2, eyes: 0.3, mouth: 'oh', head: [-0.15, 0, 0],
    });
  const frames: Frame[] = [
    ...range(6).map((i) => one(push(i / 6))), // 0-5 pushing
    one(bim(name, { x: 0.55, dir: -0.6, armR: [-2.7, 0, -0.5], armL: [0, 0, -0.2], eyes: 0.3, mouth: 'oh', head: [0.1, 0.2, 0] })), // 6 wipes its brow
    one(bim(name, { x: 0.55, dir: 0.15, armL: [0, 0, -0.35], armR: [0, 0, 0.35], head: [0.05, 0, 0.12] })), // 7 standing by it
  ];
  const seq = [...times(range(6), 3), 6, 6, 6, 6, 6, 6, 7];
  return { id: 'lead', x0: -0.25, x1: 1.15, y0: -0.25, frames, seq, idle: 7, phone: false };
}

// 4. the banner: a bim climbs the notification's right side, outside its edge (never over 'now'), and sits on its top to read it.
function banner(): Sheet {
  const name = 'search';
  const reading = (tilt: number): Actor =>
    bim(name, { x: -0.5, dir: -0.45, y: SEAT_Y, legL: HANG, legR: HANG - 0.15, armL: [0.1, 0, -0.3], armR: [0.1, 0, 0.3], head: [0.45, -0.35 + tilt, 0] });
  const side = (y: number, o: Partial<Rig> = {}): Actor => ({ ...hanging(name, y, o), rig: { ...hanging(name, y, o).rig, x: 0.32 } });
  const frames: Frame[] = [
    one(side(HANG_Y, { legL: 0.3, legR: -0.3 })), // 0
    one(side(HANG_Y, { legL: -0.3, legR: 0.3, head: [-0.15, 0.3, 0] })), // 1 kicking, a look at you
    one(side(-0.8, { eyes: 0.3 })), // 2
    one(side(-0.64, { eyes: 0.3, body: [0.2, 0, 0] })), // 3
    // 4 over the edge, its body still outside the banner's side
    one(bim(name, { x: 0.3, dir: -1.15, y: -0.3, body: [0.7, 0, 0], armL: [-0.6, 0, 0], armR: [-0.6, 0, 0], legL: -1.0, legR: 0.1, eyes: 0.3, mouth: 'oh' })),
    // 5 a knee up on the corner
    one(bim(name, { x: 0.05, dir: -0.8, y: -0.08, body: [0.3, 0, 0], armL: [-0.3, 0, -0.4], armR: [-0.3, 0, 0.4], legL: -1.2, legR: -0.6 })),
    one(reading(0)), // 6 reading
    one(reading(0.25)), // 7 its eyes along the line
  ];
  const seq = [0, 0, 1, 1, 0, 0, 2, 2, 3, 3, 3, 4, 4, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 6, 6, 6, 7, 7, 7, 6];
  return { id: 'banner', x0: -1.05, x1: 0.75, y0: -1.05, frames, seq, idle: 6, phone: false };
}

// 5. questions you can actually answer: on the window's top edge, in its empty middle, it writes a note in
// pencil on the page beside it (above the edge, never on the window's toolbar).
function arts(): Sheet {
  const name = 'qa';
  const pencil = { ...NO_PROPS, marker: true };
  const seat: Partial<Rig> = { dir: -0.45, y: SEAT_Y, legL: HANG, legR: HANG + 0.1, armL: [0.1, 0, -0.3], props: pencil };
  const writing = (k: number, marks: number): Frame =>
    one(bim(name, { ...seat, body: [0.1, 0, -0.12], head: [0.3, 0.75, 0], armR: [-0.35, 0, 0.7 + 0.18 * Math.sin(k * TAU)] }, { pencil: true }), { marks });
  const frames: Frame[] = [
    one(bim(name, { ...seat, armR: [-0.4, 0, 0.3], head: [0, 0.2, 0] }, { pencil: true })), // 0 to you, the pencil out
    writing(0, 0), writing(0.25, 1), writing(0.5, 1), writing(0.75, 2), writing(0, 2), writing(0.25, 3), writing(0.5, 3), // 1-7
    // 8 done: the pencil up, to you
    one(bim(name, { ...seat, armR: [-2.3, 0, 0.3], head: [0, 0.25, 0] }, { pencil: true }), { marks: 3 }),
  ];
  const seq = [0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 1, 2, 3, 4, 5, 6, 7, 6, 7, 8];
  return { id: 'arts', x0: -0.7, x1: 1.0, y0: -0.6, frames, seq, idle: 8, phone: false };
}

// 6. it talks back: at its little upright piano in the margin, four silent notes.
const PIANO = { x: -0.1, z: 0, turn: 0.95, scale: 0.72 };
function fun(): Sheet {
  const name = 'cart';
  // its seat on the stool (objects/music.ts: the stool's top at 0.54, 0.8 ahead), turned with the piano
  const sz = 0.84 * PIANO.scale;
  const px = PIANO.x + Math.sin(PIANO.turn) * sz;
  const pz = PIANO.z + Math.cos(PIANO.turn) * sz;
  const y = 0.54 * PIANO.scale - 0.15;
  const play = (l: number, r: number, o: Partial<Rig> = {}): Actor =>
    bim(name, { x: px, z: pz, dir: PIANO.turn + Math.PI, y, legL: -1.45, legR: -1.45, armL: [-1.05 - l, 0, 0.1], armR: [-1.05 - r, 0, -0.1], head: [0.1, 0, 0], ...o });
  const note = (k: number, f: number): readonly [number, number, number] => [PIANO.x - 0.3 + k * 0.22, 1.05 * PIANO.scale + 0.1, f];
  const frames: Frame[] = [
    one(play(0, 0)), // 0
    one(play(0.35, 0, { head: [0.1, 0.15, 0.08] }), { notes: [note(0, 0)] }), // 1 note 1
    one(play(0, 0), { notes: [note(0, 0.35)] }),
    one(play(0, 0.35, { head: [0.1, -0.15, -0.08] }), { notes: [note(0, 0.7), note(1, 0)] }), // 3 note 2
    one(play(0, 0), { notes: [note(1, 0.35)] }),
    one(play(0.35, 0, { head: [0.1, 0.15, 0.08] }), { notes: [note(1, 0.7), note(2, 0)] }), // 5 note 3
    one(play(0, 0), { notes: [note(2, 0.35)] }),
    one(play(0.35, 0.35, { head: [-0.1, 0, 0], eyes: 0.3, mouth: 'laugh' }), { notes: [note(2, 0.7), note(3, 0)] }), // 7 note 4, both hands
    one(play(0, 0, { eyes: 0.3, mouth: 'laugh' }), { notes: [note(3, 0.35)] }),
    one(play(0, 0, { eyes: 0.3, mouth: 'laugh' }), { notes: [note(3, 0.7)] }),
    one(play(0, 0, { head: [0, -1.0, 0] })), // 10 turned to you
  ];
  const seq = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 0, 0, 10];
  return { id: 'fun', x0: -1.15, x1: 0.85, y0: -0.2, frames, seq, idle: 10, phone: true, piano: PIANO };
}

// 7. the hard parts: a skater crosses the section's bottom and ollies over the last card's corner.
function hard(): Sheet {
  const name = 'promo';
  const ON = 0.17; // standing on its deck
  const skate = { ...NO_PROPS, skate: true };
  const ride = (o: Partial<Rig>): Actor => bim(name, { dir: 0.9, y: ON, armL: [0, 0, -0.45], armR: [0, 0, 0.45], props: skate, ...o });
  const frames: Frame[] = [
    one(ride({})), // 0 rolling
    one(ride({ legR: 0.45, y: ON - 0.03, body: [0.15, 0, 0] })), // 1 a push
    one(ride({ legR: 0.8, y: ON - 0.06, body: [0.2, 0, 0] })), // 2
    one(ride({ legR: 0.3, y: ON - 0.02, body: [0.1, 0, 0] })), // 3
    one(ride({ y: ON - 0.12, body: [0.3, 0, 0], legL: -0.4, legR: 0.4, armL: [-0.6, 0, -0.3], armR: [-0.6, 0, 0.3] })), // 4 crouch
    one(ride({ lift: 0.22, y: ON, legL: -0.3, legR: 0.3, armL: [0, 0, -1.2], armR: [0, 0, 1.2], board: { x: 0, y: 0.12, z: 0, rot: [-0.45, 0, 0] } })), // 5 the pop
    one(ride({ lift: 0.48, y: ON - 0.06, legL: -0.55, legR: -0.25, armL: [0, 0, -1.5], armR: [0, 0, 1.5], eyes: 0.3, mouth: 'laugh' })), // 6 in the air
    one(ride({ lift: 0.3, y: ON - 0.03, legL: -0.3, legR: -0.1, armL: [0, 0, -1.2], armR: [0, 0, 1.2], eyes: 0.3, mouth: 'laugh', board: { x: 0, y: 0.1, z: 0, rot: [0.25, 0, 0] } })), // 7 coming down
    one(ride({ y: ON - 0.12, body: [0.25, 0, 0], legL: -0.35, legR: 0.35, armL: [0, 0, -0.9], armR: [0, 0, 0.9] })), // 8 the landing
    one(ride({ eyes: 0.3, mouth: 'laugh' })), // 9
    one(ride({ dir: 0.2, head: [0, 0.1, 0], armL: [0, 0, -0.3], armR: [0, 0, 0.3] })), // 10 stopped, to you
  ];
  const roll = [0, 0, 1, 2, 2, 3, 0, 0, 0, 0];
  const seq = [...times(roll, 3), 0, 0, 4, 4, 5, 6, 6, 7, 8, 9, 9, 9, 0, 0, 0, 10];
  // along its path: steady, slowing to a stop at the end
  const n = seq.length;
  const travel = seq.map((_, i) => {
    const u = i / (n - 1);
    return Math.min(1, u < 0.85 ? u / 0.85 * 0.95 : 0.95 + (1 - (1 - (u - 0.85) / 0.15) ** 2) * 0.05);
  });
  return { id: 'hard', x0: -0.75, x1: 0.85, y0: -0.15, frames, seq, idle: 10, phone: false, travel };
}

// 8. you'll ask.: a bim reads a tiny book, sitting on the last question.
function faq(): Sheet {
  const name = 'pricing';
  const read = (open: number, page: number, o: Partial<Rig> = {}): Actor =>
    bim(name, { x: 0.45, dir: 0.15, y: SEAT_Y, legL: -1.45, legR: -1.45, armL: [-1.25, 0, 0.3], armR: [-1.25, 0, -0.3], head: [0.2, 0, 0], ...o }, { book: { open, page } });
  const frames: Frame[] = [
    one(read(0, 0, { head: [0, 0.2, 0] })), // 0 the book shut, looking at you
    one(read(0.5, 0)), // 1 opening
    one(read(1, 0)), // 2 open
    one(read(1, 0, { head: [0.2, 0.12, 0.05] })), // 3 reading along
    one(read(1, 0.5, { head: [0.18, -0.1, 0] })), // 4 a page turns
    one(read(1, 1, { head: [0.2, -0.12, -0.05] })), // 5
    one(read(1, 1, { eyes: 0.3, mouth: 'laugh', head: [0.25, 0, 0] })), // 6 a good bit
    one(read(1, 1, { head: [0.2, 0, 0] })), // 7 reading
  ];
  const seq = [0, 0, 0, 0, 1, 2, 2, 3, 3, 3, 2, 2, 3, 3, 4, 5, 5, 3, 3, 6, 6, 6, 7];
  return { id: 'faq', x0: -0.3, x1: 1.2, y0: -0.6, frames, seq, idle: 7, phone: false };
}

// 9. the end: two bims wave goodbye beside the download button.
function end(): Sheet {
  const a = 'checkout';
  const b = 'storefront';
  const wave = (t: number): Frame => {
    const s = Math.sin(t * TAU) * 0.4;
    return {
      bims: [
        // each waves its outer arm, so their hands never cross
        bim(a, { x: 0.45, dir: 0.2, armL: [0, 0, -2.5 + s], armR: [0, 0, 0.2], eyes: 0.3, mouth: 'laugh' }),
        bim(b, { x: 1.25, dir: -0.2, armR: [0, 0, 2.5 - s], armL: [0, 0, -0.2], eyes: 0.3, mouth: 'laugh', head: [0, 0, 0.1] }),
      ],
    };
  };
  const frames: Frame[] = [
    ...range(8).map((i) => wave(i / 8)),
    { bims: [bim(a, { x: 0.45, dir: 0.2, armL: [0, 0, -0.2], armR: [0, 0, 0.2], head: [0, 0, -0.1] }), bim(b, { x: 1.25, dir: -0.2, armL: [0, 0, -0.2], armR: [0, 0, 0.2], head: [0, 0, 0.1] })] },
  ];
  return { id: 'end', x0: 0, x1: 1.7, y0: -0.25, frames, seq: [...times(range(8), 3), 8], idle: 8, phone: true };
}

/** the sheets in the page's order; each section's one gag (desktop or terminal? has two bims, two sheets) */
export const SHEETS: readonly Sheet[] = [waysSit(), waysClimb(), why(), lead(), banner(), arts(), fun(), hard(), faq(), end()];

/** the idle sheet: its last pose and that pose's blink */
export function idleFrames(s: Sheet): readonly Frame[] {
  const f = s.frames[s.idle];
  if (!f) throw new Error(`${s.id}: no frame ${String(s.idle)}`);
  return [f, { ...f, bims: f.bims.map((b) => ({ ...b, rig: { ...b.rig, eyes: 0.15 } })) }];
}
