// The office grows with the project (page bims-office v14 "un bureau qui grandit", bims m_27978):
// the desktop's drawing table over the hub's three counters (bise_proto rows::Growth, hub/growth):
// jobs done build the building (15 stages), days used grow the garden (8 levels), artifacts made
// fill the walls (a frame per 10, 30 at most, golden from 500). Never on the wire: the hub sends
// counts only (architect m_27970). The office never shrinks: the client keeps a high-water mark per
// project (`raise`), so a done agent that resumes (the hub's jobs_done goes down by one) takes
// nothing away. At 70% of the way to the next stage, cones and a striped barrier stand where the
// next piece goes. Pure; Office.tsx keeps the mark (keep.ts) and the unlock moment. Owner: bims-grow.
import type { Growth } from '@/proto';
import { bims } from '@/proto/words_bims.gen';

/** jobs done at which each stage starts: stage i from STAGE_AT[i] */
export const STAGE_AT = [0, 1, 3, 6, 10, 15, 25, 40, 60, 100, 150, 250, 400, 600, 1000] as const;
export const LAST_STAGE = STAGE_AT.length - 1;
/** days used at which each garden level starts: level i+1 from GARDEN_AT[i] */
export const GARDEN_AT = [1, 3, 7, 14, 30, 60, 100, 365] as const;
/** one wall frame per this many artifacts, at most FRAMES_MAX, golden from GOLDEN_AT */
export const FRAME_EVERY = 10;
export const FRAMES_MAX = 30;
export const GOLDEN_AT = 500;

/**
 * the nap place's beds built at each stage (bed i stands on lounge spot i): two from day one, the
 * map's base beds (page bims-cozy v2: nobody sleeps on a keyboard on the first day, render/cozy.ts),
 * then the map's own beds one by one, 8 at the top
 */
const BEDS = [2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 8] as const;
/** the base beds (spots 0 and 1): the cozy kit draws them, the map's look the ones past them */
export const BASE_BEDS = 2;

/** How many of the lounge's spots have a bed at this stage: a bim naps only on one (his bug, bims-fix: they lay in the air). Pure. */
export function bedsAt(stage: number): number {
  return BEDS[Math.max(0, Math.min(stage, BEDS.length - 1))] ?? 0;
}

/** The stage bed i comes with (its stage's group: the unlock moment brings it in). Pure. */
export function bedStage(i: number): number {
  const s = BEDS.findIndex((n) => n > i);
  return s < 0 ? LAST_STAGE + 1 : s;
}
/**
 * the terrace's deck chairs built at each stage (chair i stands on terrace spot i): the first done
 * bim's at stage 1 (bims m_28178), 8 from stage 10
 */
const CHAIRS = [0, 1, 1, 1, 2, 2, 2, 4, 4, 4, 8] as const;

/** How many of the terrace's spots have a deck chair at this stage: a done bim reclines only on one, past them it stands with a mug (bims-chair). Pure. */
export function chairsAt(stage: number): number {
  return CHAIRS[Math.max(0, Math.min(stage, CHAIRS.length - 1))] ?? 0;
}

/** The stage deck chair i comes with (its stage's group: the unlock moment brings it in). Pure. */
export function chairStage(i: number): number {
  const s = CHAIRS.findIndex((n) => n > i);
  return s < 0 ? LAST_STAGE + 1 : s;
}

/** what the stage has built for the bims to lie on: the lounge's bean bags, the terrace's deck chairs (the timeline reads it) */
export interface Built {
  readonly beds: number;
  readonly chairs: number;
}

/** The beds and deck chairs built at this stage. Pure. */
export const builtAt = (stage: number): Built => ({ beds: bedsAt(stage), chairs: chairsAt(stage) });

/** the share of the way to the next stage past which its cones stand */
export const BUILD_AT = 0.7;
/** the unlock moment: two bims walk the piece in from the door (s), then its label shows (s) */
export const UNLOCK_WALK = 3;
export const UNLOCK_LABEL = 3;

/** The unlock label's words while it shows at t (null: not now). Pure. */
export function unlockLabel(u: { readonly stage: number; readonly at: number } | undefined, t: number, reduced: boolean, things?: Things): string | null {
  if (!u) return null;
  const s = t - u.at;
  const from = reduced ? 0 : UNLOCK_WALK;
  return s >= from && s < from + UNLOCK_LABEL ? newLabel(u.stage, things) : null;
}

/** What the office draws from the counters. */
export interface Grow {
  /** 0 a bare room .. 14 main's golden statue */
  readonly stage: number;
  /** 0 .. 8 */
  readonly garden: number;
  readonly frames: number;
  readonly golden: boolean;
  /** the next stage's piece is under construction (cones, a barrier) */
  readonly building: boolean;
  /** the jobs done it read */
  readonly jobs: number;
}

export const NO_GROW: Grow = { stage: 0, garden: 0, frames: 0, golden: false, building: false, jobs: 0 };

/** how many thresholds of `at` the value has passed */
function levelOf(v: number, at: readonly number[]): number {
  let n = 0;
  for (const a of at) if (v >= a) n++;
  return n;
}

/** The building's stage for these jobs done (0 with none). */
export function stageOf(jobs: number): number {
  return Math.max(0, levelOf(jobs, STAGE_AT) - 1);
}

/** The drawing for these counters. */
export function growOf(g: Growth | null | undefined): Grow {
  if (!g) return NO_GROW;
  const jobs = g.jobs_done;
  const arts = g.artifacts_made;
  const stage = stageOf(jobs);
  const next: number | undefined = STAGE_AT[stage + 1];
  const from: number | undefined = STAGE_AT[stage];
  const building = next !== undefined && from !== undefined && jobs >= from + BUILD_AT * (next - from);
  return {
    stage,
    garden: levelOf(g.days_used, GARDEN_AT),
    frames: Math.min(FRAMES_MAX, Math.floor(arts / FRAME_EVERY)),
    golden: arts >= GOLDEN_AT,
    building,
    jobs,
  };
}

/** The high-water mark: each counter at its highest seen (the office never shrinks). */
export function raise(prev: Growth | null | undefined, g: Growth | null | undefined): Growth | null {
  if (!g) return prev ?? null;
  if (!prev) return g;
  const since = [prev.since_ms, g.since_ms].filter((x): x is number => typeof x === 'number');
  return {
    jobs_done: Math.max(prev.jobs_done, g.jobs_done),
    days_used: Math.max(prev.days_used, g.days_used),
    artifacts_made: Math.max(prev.artifacts_made, g.artifacts_made),
    ...(since.length ? { since_ms: Math.min(...since) } : {}),
  };
}

/** A kept mark read back (keep.ts): anything else is none. */
export function growthOfKept(v: unknown): Growth | null {
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  const n = (k: string): number => (typeof o[k] === 'number' && Number.isFinite(o[k]) ? Math.max(0, Math.floor(o[k])) : 0);
  const since = typeof o['since_ms'] === 'number' ? { since_ms: o['since_ms'] } : {};
  return { jobs_done: n('jobs_done'), days_used: n('days_used'), artifacts_made: n('artifacts_made'), ...since };
}

/** The stage a new mark unlocked over the one before it (null: none, or no mark before: no moment on first sight). */
export function unlockOf(before: Grow | null, now: Grow): number | null {
  if (!before || now.stage <= before.stage) return null;
  return now.stage;
}

/** a building stage past the bare room (STAGE_AT: 1 .. 14) */
export type Stage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

/** a map's words for each stage's piece (maps/plan.ts Plan.things; bims m_28856: Nordic 9 is the kubb set, not the skate ramp) */
export type Things = Readonly<Record<Stage, string>>;

const THINGS = [
  '',
  bims.stage_1, bims.stage_2, bims.stage_3, bims.stage_4, bims.stage_5, bims.stage_6, bims.stage_7,
  bims.stage_8, bims.stage_9, bims.stage_10, bims.stage_11, bims.stage_12, bims.stage_13, bims.stage_14,
] as const;

/** What a stage brings on a map, in words: its own (Plan.things, bims m_28856), else the loft's ('' for 0). */
export function thingOf(stage: number, things?: Things): string {
  const own = stage >= 1 && stage <= 14 ? things?.[stage as Stage] : undefined;
  return own ?? THINGS[stage] ?? '';
}

/** The unlock moment's label over the new piece. */
export function newLabel(stage: number, things?: Things): string {
  return bims.grow_new({ thing: thingOf(stage, things) });
}

/** The ground's corner tip: the level, the jobs done, the next piece and at how many. */
export function tipOf(g: Grow, things?: Things): string {
  const next = STAGE_AT[g.stage + 1];
  if (next === undefined) return bims.grow_tip_top({ n: g.jobs, level: g.stage });
  return bims.grow_tip({ n: g.jobs, level: g.stage, thing: thingOf(g.stage + 1, things), at: next });
}

/** what the ground grows by with the garden's level (the days used), each side, world units */
const GARDEN_M = [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1.0, 1.2, 1.4] as const;
/** stage 10's bigger ground (the fountain, then the pond and the statue, on the left) */
const BIG_GROUND = 1.7;
/** the ground the camera shows wide past the building, each side (render/camera.ts wideSiteOf) */
export const WIDE_GARDEN = 1.5;

/** How far the grass reaches past the building's site, each side. */
export function groundMargin(g: { readonly stage: number; readonly garden: number }): number {
  return (GARDEN_M[Math.min(g.garden, GARDEN_M.length - 1)] ?? 0) + (g.stage >= 10 ? BIG_GROUND : 0);
}

/** The garden reaches past what the camera fits (320: the building; wide: WIDE_GARDEN more): a soft side fade says so. */
export function cropped(g: Grow, wide: boolean): boolean {
  return groundMargin(g) > (wide ? WIDE_GARDEN : 0);
}

/** What makes the world rebuild: everything it draws from the counters. */
export function growSig(g: Grow): string {
  return `${g.stage}/${g.garden}/${g.frames}/${g.golden ? 1 : 0}/${g.building ? 1 : 0}`;
}
