// les bims (page bims-office v7, spec artifact les-bims-sc-narios-du-bureau): the right bar's AGENTS
// section drawn as an isometric office, one bim per agent row. This file is the contract between
// the pure parts (activity.ts, layout.ts, paths.ts, timeline.ts, labels.ts: no three, no DOM, unit
// tests on fake rows) and the effectful ones (render/: three.js; Office.tsx: the canvas, the label
// overlay, the loop). Time is real time in seconds (`t`), read by the shell and passed in.
// v1 reads only the rows' existing fields (the spec's [a]); `BimEvent` and `Activity.doing` are
// the seam for his open questions q-planes / q-data (thread reads, a hub fact for who writes to
// whom): empty in v1, nothing downstream changes when they fill. Owner: bims-lead.
import type { Agent, Card, Place } from '@/proto';

/** What the office reads at one moment: the bar's rows for one project, nothing else. */
export interface Snapshot {
  readonly agents: readonly Agent[];
  readonly cards: readonly Card[];
  readonly places: readonly Place[];
}

/**
 * Where a bim is and what it does, from its row alone (activity.ts). `k` is the pose the renderer
 * draws; `at` the spot kind the layout resolves. The spec's §4 table, [a] lines only.
 */
export type ActivityKind =
  | 'work' // working at its desk
  | 'hot' // working, a long turn (turn_ms over HOT_MS)
  | 'sleep' // waiting on a watch (timer, pid, file): asleep at its desk
  | 'waitagent' // waiting on another agent's reply
  | 'nap' // idle: in a bean bag in the lounge
  | 'snack' // idle: office life, a trip to the island (computed ahead, replayable)
  | 'asks' // asks you: standing by its desk, '?' pill
  | 'blocked' // blocked with no card: arms crossed
  | 'failed' // slumped on its desk, '✗' pill
  | 'landing' // waits to land: in main's queue at its rank, carrying a box
  | 'done' // on the terrace
  | 'stopped' // stopped by you: grey at its desk, lamp off
  | 'starting' // came in by the door
  | 'main' // main working at the big desk
  | 'mainidle'; // main idle: reads the paper

export type SpotKind = 'desk' | 'main' | 'lounge' | 'island' | 'board' | 'queue' | 'door' | 'terrace';

export interface Activity {
  readonly k: ActivityKind;
  readonly at: SpotKind;
  /** the land queue's 1-based rank ('landing') */
  readonly rank?: number;
  /** the agent it waits on ('waitagent') */
  readonly on?: string;
  /** an office-life trip's number, so two trips in a row are two segments ('snack') */
  readonly key?: number;
  /** 0 pineapple, 1 orange, 2 coffee ('snack') */
  readonly fruit?: number;
  /** a card holds running work (asks, urgent: jumps faster, holds a sheet) */
  readonly urgent?: boolean;
  /** seam (q-data): what the thread says it does ('think', 'tool', ...). Never set in v1. */
  readonly doing?: string;
}

/**
 * Seam (q-planes / q-data): something that happened between two snapshots that the rows don't
 * carry (his message to an agent, A writes to B). The shell passes `[]` in v1.
 */
export type BimEvent =
  | { readonly kind: 'message'; readonly from: string; readonly to: string; readonly t: number }
  | { readonly kind: 'his'; readonly to: string; readonly t: number };

/** A point on the floor, in office units (1 = one floor tile); x right, z towards the viewer. */
export interface Pt {
  readonly x: number;
  readonly z: number;
}

/**
 * A place a bim stands or sits: the point, where it joins the walkway (`wz`) and its aisle (`ax`),
 * and the way it faces there (radians, three's y rotation).
 */
export interface Spot extends Pt {
  readonly wz: number;
  readonly ax: number;
  readonly face: number;
}

/** The office for N agents (layout.ts): pure numbers the renderer builds the world from. */
export interface Office {
  /** desk columns on each side of the island (2, 3 past 16 agents) */
  readonly side: number;
  readonly rows: number;
  /** floor size and its left edge */
  readonly W: number;
  readonly D: number;
  readonly x0: number;
  /** the two corridors' z (the back one, the front one) and the aisles' x (±ax) */
  readonly crossBack: number;
  readonly crossFront: number;
  readonly ax: number;
  readonly island: { readonly z0: number; readonly z1: number; readonly w: number };
  /** one desk per non-main agent, by name, in start order; never moves while the agent lives */
  readonly desks: ReadonlyMap<string, Spot>;
  readonly mainDesk: Spot;
  readonly islandSpots: readonly Spot[];
  readonly lounge: readonly Spot[];
  readonly boardSpots: readonly Spot[];
  readonly queue: readonly Spot[];
  readonly door: Spot;
  readonly terrace: readonly Spot[];
}

/** A walk: its corners and the length of each leg (paths.ts). */
export interface Path {
  readonly pts: readonly Pt[];
  readonly seg: readonly number[];
  readonly len: number;
}

/** One stretch of a bim's life: from `t`, it goes along `path` at `speed` to `spot` and does `act` there. */
export interface Segment {
  readonly t: number;
  readonly act: Activity;
  /** what makes two activities the same stretch (kind, rank, key) */
  readonly sig: string;
  readonly spot: Spot;
  readonly path: Path;
  /** tiles per second (walk 2.4, hurry 3.5, skate 3.4, carrying 1.8) */
  readonly speed: number;
  /** the activity before (the transition the renderer plays, spec §5), null for the first */
  readonly from: ActivityKind | null;
}

/** Where a bim is at a time t (timeline.ts `poseAt`): the renderer's only input for its place. */
export interface Pose extends Pt {
  /** the way it faces, radians */
  readonly dir: number;
  readonly moving: boolean;
  /** seconds since its segment started (the renderer's loops and transitions) */
  readonly since: number;
  readonly seg: Segment;
  /** his message flying to it (q-planes): seconds since the plane left the top edge (flight ~1.5 s, then the catch ~2 s) */
  readonly plane?: { readonly since: number };
}

/**
 * How the loop runs after a frame (battery, architect m_27495): 'walk' at the display's rate (a walk,
 * a transition, a plane, a fade), 'loop' at LOOP_FPS (only ambient loops: typing, the '?' jumps),
 * 'still' stopped until the next snapshot, hover, size or theme change. Asleep, napping, on the
 * terrace, failed, blocked, stopped or in line are still poses: no breathing loop in v1.
 */
export type Motion = 'walk' | 'loop' | 'still';
export const LOOP_FPS = 8;

// ---- the pure modules' entry points (each module exports a function of this type under that name)

/** activity.ts `activities`: every live agent's activity at t (archived rows absent). */
export type ActivitiesFn = (snap: Snapshot, t: number) => ReadonlyMap<string, Activity>;

/** layout.ts `layoutOf`: the office for these agents (main and the others, start order). */
export type LayoutFn = (agents: readonly Agent[]) => Office;

/** timeline.ts `newTimeline`: one per mounted office, fed at each snapshot change and each frame. */
export interface Timeline {
  /** a new snapshot's activities (or the same ones at a later t): new segments for what changed */
  update(acts: ReadonlyMap<string, Activity>, office: Office, t: number, events: readonly BimEvent[]): void;
  /** where a bim is at t; null for one the timeline doesn't know (or that has left) */
  poseAt(name: string, t: number): Pose | null;
  /** the bims on the map at t, a leaving one until it's out */
  names(t: number): readonly string[];
  /** whether anything moves at t (a walk, a transition, a plane): the loop stops when false */
  moving(t: number): boolean;
}
export type NewTimelineFn = () => Timeline;

/** labels.ts `labelsOf`: what the overlay shows at t; events are read from the poses' segments (seg.from, seg.t). */
export type LabelsFn = (
  bims: readonly BimFrame[],
  o: { readonly t: number; readonly hover: string | null; readonly held: boolean; readonly agents: readonly Agent[] },
) => ReadonlyMap<string, Label>;

/** One bim's input to the renderer for a frame. */
export interface BimFrame {
  readonly name: string;
  readonly main: boolean;
  readonly pose: Pose;
}

/** The look of the moment: the app's theme (day light, night dark), reduced motion (no loops, fades for walks). */
export interface Look {
  readonly night: boolean;
  readonly reduced: boolean;
}

/**
 * The three.js side (render/, loaded by a dynamic import so the list view never pays for it).
 * Office.tsx owns the canvas and the loop; the renderer only draws and answers where things are.
 */
export interface OfficeRenderer {
  /** the office changed (an agent came or left): rebuild the world */
  setOffice(office: Office, agents: readonly Agent[]): void;
  /** css px; the camera fits the office to the width (never cropped), returns the height it takes */
  setSize(widthPx: number, maxHeightPx: number): number;
  /** draw time t; how the loop must run next (Motion). Reduced motion: never 'loop' */
  frame(t: number, bims: readonly BimFrame[], look: Look): Motion;
  /** a bim's head on the canvas, css px from its top left (labels and pills go there); null off view */
  headOf(name: string): { readonly x: number; readonly y: number } | null;
  /** the bim (or its desk) under a canvas point, css px; null on nothing */
  pick(x: number, y: number): string | null;
  /** WebGL lost: the shell falls back to the list with one line */
  onLost(cb: () => void): void;
  dispose(): void;
}

/** render/index.ts's one export, behind `import('./render')`. */
export type MakeRenderer = (canvas: HTMLCanvasElement) => OfficeRenderer;

/** What the overlay shows over one bim (labels.ts): nothing at rest, the spec's §2. */
export interface Label {
  readonly name: string;
  /** 'name' while walking or ctrl held, 'event' the 3 s after an event, 'hover' the tip line */
  readonly mode: 'name' | 'event' | 'hover';
  /** the words after the name ('done', '→ dark-mode'); '' for a name alone */
  readonly words: string;
  /** '?' pink (asks you) or '✗' red (failed): shown without a name, always */
  readonly pill: 'asks' | 'failed' | null;
}
