// les bims (page bims-office v7, spec artifact les-bims-sc-narios-du-bureau): the right bar's AGENTS
// section drawn as an isometric office, one bim per agent row. This file is the contract between
// the pure parts (activity.ts, maps/ (each map's plan), paths.ts, timeline.ts, labels.ts: no three, no DOM, unit
// tests on fake rows) and the effectful ones (render/: three.js; Office.tsx: the canvas, the label
// overlay, the loop). Time is real time in seconds (`t`), read by the shell and passed in.
// It reads the rows (the spec's [a]) and the hub's two facts for his q-planes / q-data answers
// (bims-facts, architect m_27522): Agent.doing -> Activity.doing, hub/activity -> BimEvent, both
// mapped in the feed only, never from thread text. Owner: bims-lead.
import type { Agent, Card, Place } from '@/proto';
import type { Cam } from './zoom';
import type { BimEgg, OfficeEggs } from './eggs';
import type { Grow } from './growth';
import type { MapId } from './maps/ids';

/** The office's maps (maps/ids.ts MAP_IDS); the project's pick, the loft when he never picked one. */
export type { MapId };

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
  | 'mainidle' // main idle: reads the paper
  // from events (timeline.ts makes them, a few seconds each, then the row's activity again)
  | 'coffee' // a message to an idle bim: both at the island
  | 'visit' // a message to a busy bim: the sender at its desk (post-it or tap, Activity.mode)
  | 'report'; // a report: the sender at main's desk with a sheet

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
  /** what its turn does now (q-data, the hub's Agent.doing, bims-facts): working poses follow it (spec §4 [t]) */
  readonly doing?: Doing;
  /** the other bim of a message ('coffee', 'visit') */
  readonly with?: string;
  /** how the message went ('visit': queued = a post-it on its desk, steer = a tap on the shoulder) */
  readonly mode?: 'steer' | 'queued';
}

/** The hub's Agent.doing kinds (architect m_27522, bims-facts m_27638); absent = nothing running. */
export type Doing = 'think' | 'tool' | 'edit' | 'search' | 'computer' | 'image' | 'publish' | 'compact' | 'build' | 'unknown';

/** Who a message is from or to: typed, never a name compared with 'you'. */
export type Party = { readonly who: 'you' } | { readonly who: 'agent'; readonly name: string };

/**
 * What happened between two snapshots that the rows don't carry, from the hub's hub/activity
 * notification (bims-facts) mapped in one place (the feed). His message is a message from
 * { who: 'you' }: the paper plane. A message to an idle bim = coffee at the island; queued = a
 * post-it; steer = a tap; a report = a sheet to main's desk. The timeline turns them into short
 * segments ('coffee', 'visit', 'report') and planes; it never invents one.
 */
export type BimEvent =
  | {
      readonly kind: 'message';
      readonly from: Party;
      readonly to: Party;
      readonly mode: 'steer' | 'queued' | 'unknown';
      readonly expectsReply: boolean;
      readonly t: number;
    }
  | { readonly kind: 'report'; readonly agent: string; readonly report: 'progress' | 'done' | 'failed' | 'blocked'; readonly t: number };

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

/** A piece of furniture's floor box; `of`: the spot it belongs to (a bim sits in its bean bag). */
export interface Box {
  readonly x0: number;
  readonly x1: number;
  readonly z0: number;
  readonly z1: number;
  readonly of?: Pt;
}

/** A straight leg of a walk graph, between two points. */
export type Leg = readonly [Pt, Pt];

/**
 * The office for N agents on one map (its plan, maps/<map>.ts): pure numbers the renderer builds the
 * world from and the walks follow. Every map gives the same places (desks, main's desk and its land
 * queue, the eating place and its spots, the nap place, the board, the door, the terrace, the way
 * out) and its own walk graph; maps/contract.test.ts checks every plan against this contract.
 */
export interface Office {
  /** the map its plan drew */
  readonly map: MapId;
  /** what places the desks (the loft: its columns and rows): when it changes the world is rebuilt and every bim stands at its spot again */
  readonly size: string;
  /** floor size and its left edge (x right, z towards the viewer, 0 at the back wall) */
  readonly W: number;
  readonly D: number;
  readonly x0: number;
  /** the eating place's floor box (the loft's kitchen island, a riad's fountain): an egg puts its cake on it */
  readonly island: Box;
  /** one desk per non-main agent, by name, in start order; never moves while the agent lives */
  readonly desks: ReadonlyMap<string, Spot>;
  readonly mainDesk: Spot;
  readonly islandSpots: readonly Spot[];
  readonly lounge: readonly Spot[];
  readonly boardSpots: readonly Spot[];
  readonly queue: readonly Spot[];
  readonly door: Spot;
  readonly terrace: readonly Spot[];
  /** where a leaving (archived) bim walks to, out of the map */
  readonly exit: Spot;
  /** the land queue past its last place: bims wait along this leg of `walks`, from its first end, QUEUE_GAP apart */
  readonly queueMore: Leg;
  /**
   * The plan's walk graph: straight legs a bim walks along. Each place above is an end of a leg,
   * the graph is connected, and no leg crosses `furniture` but the box of a place at its end
   * (paths.ts splits it at its junctions and finds the walks).
   */
  readonly walks: readonly Leg[];
  /** what a walk never crosses, where the look draws it: desks, main's desk, the eating place, each bed and deck chair */
  readonly furniture: readonly Box[];
}

/** a land queue's places, apart (layout and the queue's overflow) */
export const QUEUE_GAP = 0.5;

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

/** maps/index.ts `layoutOf`: the office for these agents (main and the others, start order) on the project's map. */
export type LayoutFn = (agents: readonly Agent[], map?: MapId) => Office;

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
  o: {
    readonly t: number;
    readonly hover: string | null;
    readonly held: boolean;
    readonly agents: readonly Agent[];
    /** the eggs' words by bim (eggs.ts eggLabels): shown where no hover or event label is */
    readonly eggs?: ReadonlyMap<string, string>;
  },
) => ReadonlyMap<string, Label>;

/** One bim's input to the renderer for a frame. */
export interface BimFrame {
  readonly name: string;
  readonly main: boolean;
  readonly pose: Pose;
  /** the easter egg it plays now (eggs.ts), on top of its pose; absent: none */
  readonly egg?: BimEgg;
  /** a soft halo on the floor under it (focus.ts): its row hovered, or the bim the office follows */
  readonly lit?: boolean;
}

/** The look of the moment: the app's theme (day light, night dark), reduced motion (no loops, fades for walks). */
export interface Look {
  readonly night: boolean;
  readonly reduced: boolean;
  /** the office's own easter eggs now (eggs.ts): the eclipse, the ghost, the tree...; absent: none */
  readonly eggs?: OfficeEggs;
  /** what the project's growth draws (growth.ts, the client's high-water mark); absent: a bare room */
  readonly grow?: Grow;
  /** the unlock moment (growth.ts unlockOf): the stage whose piece two bims bring in, and when it began (t) */
  readonly unlock?: { readonly stage: number; readonly at: number };
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
  /** his pinch and pan (zoom.ts): the view inside the fit; FIT is the whole office. The next frame shows it */
  setCam(cam: Cam): void;
  /** draw time t; how the loop must run next (Motion). Reduced motion: never 'loop' */
  frame(t: number, bims: readonly BimFrame[], look: Look): Motion;
  /** a bim's head on the canvas, css px from its top left (labels and pills go there), and its feet's y (the hover card flips under them); null off view */
  headOf(name: string): { readonly x: number; readonly y: number; readonly feet: number } | null;
  /** where a bim stands even off view (focus.ts): its head on the canvas (css px, maybe outside it) and its middle as fractions of the whole fit (the follow camera aims there); null: not drawn */
  spotOf(name: string): { readonly x: number; readonly y: number; readonly u: number; readonly v: number } | null;
  /** where a stage's piece stands on the canvas, css px (the unlock moment's label); null off view */
  pieceOf(stage: number): { readonly x: number; readonly y: number } | null;
  /** the bim (or its desk) under a canvas point, css px; null on nothing */
  pick(x: number, y: number): string | null;
  /** the office as drawn now, copied onto a 2d canvas of the same pixel size (the map's crossfade, /bims) */
  copyTo(target: HTMLCanvasElement): void;
  /** WebGL lost: the shell falls back to the list with one line */
  onLost(cb: () => void): void;
  dispose(): void;
}

/** render/index.ts's one export, behind `import('./render')`. */
export type MakeRenderer = (canvas: HTMLCanvasElement) => OfficeRenderer;

/** What the overlay shows over one bim (labels.ts): nothing at rest, the spec's §2. */
export interface Label {
  readonly name: string;
  /** 'name' while walking or ctrl held, 'event' the 3 s after an event, 'hover' the tip line, 'pill' the '?' / '✗' alone (no name drawn, words ''), 'egg' an easter egg's words alone ('1:47', '!') */
  readonly mode: 'name' | 'event' | 'hover' | 'pill' | 'egg';
  /** the words after the name ('done', '→ dark-mode'); the hover card's state line; '' for a name alone */
  readonly words: string;
  /** the hover card's title, under its state (its row's title); '' but on hover */
  readonly title: string;
  /** '?' pink (asks you) or '✗' red (failed): shown without a name, always */
  readonly pill: 'asks' | 'failed' | null;
}
