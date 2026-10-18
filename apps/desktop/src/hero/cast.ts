// The hero film's score (page bims-film v6, bims m_30855, m_30867, m_31057): bise.dev/desktop's town, three offices
// (three-a's: harness loft, bise.dev california, acme-web riad), 15 bims, 5 minutes in a loop. Each
// bim's life is a list of [time, state] changes; the state at T is the last change at or before T,
// else the list's last one: the loop closes by construction (an agent that leaves at 4:31 is gone at
// 0:00 and comes back at 0:20). His messages (paper planes), the agents' messages, the eggs (written
// here, never rolled) and the director's shots are timed the same way (no captions: Gabriel's pick,
// bims-film v5; the page draws its first-visit line). Data only;
// world.ts reads it into the app's rows, director.ts into the camera. Owner: hero-town.
import type { DoingKind } from '@/proto';
import type { EggKind } from '../bims/eggs';
import type { MapId } from '../bims/maps/ids';

/** the loop, s */
export const FILM_S = 300;

/** What a bim does from a change on (world.ts turns it into the app's row, or its office life). */
export type Mode =
  | { readonly k: 'gone' }
  | { readonly k: 'work'; readonly doing?: DoingKind }
  /** idle: in a bean bag (on a map with a park, the app's pastimes may send it skating) */
  | { readonly k: 'idle' }
  /** idle, a trip to the island: its fruit (0 the pineapple), its trip number */
  | { readonly k: 'snack'; readonly fruit: number; readonly trip: number }
  /** asleep at its desk on a watch */
  | { readonly k: 'sleep' }
  /** asks you: the '?' pill */
  | { readonly k: 'asks' }
  /** failed: the '✗' pill */
  | { readonly k: 'failed' }
  /** waits on another agent */
  | { readonly k: 'wait'; readonly on: string }
  /** in main's land queue at that rank, its box carried */
  | { readonly k: 'landing'; readonly rank: number }
  /** done: on the terrace */
  | { readonly k: 'done' }
  /** main at work */
  | { readonly k: 'main' }
  /** main idle: reads the paper */
  | { readonly k: 'mainidle' };

export type Change = readonly [at: number, mode: Mode];

export interface Bim {
  readonly name: string;
  readonly main?: boolean;
  readonly life: readonly Change[];
}

export interface Cast {
  readonly id: string;
  readonly name: string;
  readonly map: MapId;
  /** its growth stage (growth.ts STAGE_AT): never changes in the film (an office never shrinks) */
  readonly stage: number;
  readonly bims: readonly Bim[];
}

/** a message: from you (a paper plane to the agent) or from an agent to another */
export interface Note {
  readonly at: number;
  readonly office: string;
  /** an agent's name, or 'you' (his paper plane) */
  readonly from: string;
  readonly to: string;
}

/** an egg forced on a bim from `at` for `dur` s */
export interface Egg {
  readonly at: number;
  readonly dur: number;
  readonly office: string;
  readonly bim: string;
  readonly kind: EggKind;
}

/** the shot sizes (bims-film): the three offices, one office (tight: closer), a bim followed, a close-up */
export type Size = 'wide' | 'office' | 'tight' | 'follow' | 'close';

/** what a shot frames: the town, an office, a spot of an office, a bim (its name shown), two bims (no name) */
export type Subject =
  | { readonly k: 'town' }
  | { readonly k: 'office'; readonly office: string }
  | { readonly k: 'spot'; readonly office: string; readonly spot: 'island' | 'lounge' | 'park' | 'main' }
  | { readonly k: 'bim'; readonly office: string; readonly name: string }
  | { readonly k: 'pair'; readonly office: string; readonly names: readonly [string, string] };

export interface Shot {
  /** when the action starts: the camera leaves LEAD_S before (director.ts) */
  readonly at: number;
  readonly size: Size;
  readonly subject: Subject;
}

const s = (m: number, sec: number): number => m * 60 + sec;

const work: Mode = { k: 'work', doing: 'edit' };
const think: Mode = { k: 'work', doing: 'think' };
const gone: Mode = { k: 'gone' };
const idle: Mode = { k: 'idle' };
const done: Mode = { k: 'done' };

export const HARNESS = 'harness';
export const SITE = 'bise.dev';
export const ACME = 'acme-web';

export const CAST: readonly Cast[] = [
  {
    id: HARNESS,
    name: 'harness',
    map: 'loft',
    stage: 13,
    bims: [
      { name: 'main', main: true, life: [[0, { k: 'mainidle' }], [s(0, 12), { k: 'main' }], [s(3, 50), { k: 'mainidle' }]] },
      {
        name: 'signup-flow',
        life: [[0, gone], [s(0, 20), work], [s(3, 36), { k: 'landing', rank: 1 }], [s(3, 42), done], [s(4, 31), gone]],
      },
      {
        name: 'dark-mode',
        life: [[0, gone], [s(0, 24), work], [s(2, 30), think], [s(2, 50), work], [s(3, 2), { k: 'landing', rank: 1 }], [s(3, 8), done], [s(4, 33), gone]],
      },
      { name: 'fix-flaky-test', life: [[0, work], [s(1, 16), { k: 'failed' }], [s(1, 40), work]] },
      {
        name: 'docs-sync',
        life: [[0, idle], [s(2, 0), { k: 'snack', fruit: 1, trip: 1 }], [s(2, 8), { k: 'snack', fruit: 0, trip: 2 }], [s(2, 16), idle]],
      },
      { name: 'perf-audit', life: [[0, { k: 'sleep' }]] },
    ],
  },
  {
    id: SITE,
    name: 'bise.dev',
    map: 'california',
    stage: 11,
    bims: [
      { name: 'main', main: true, life: [[0, { k: 'main' }], [s(4, 4), { k: 'mainidle' }]] },
      {
        name: 'pricing-page',
        life: [[0, gone], [s(0, 58), work], [s(1, 6), { k: 'asks' }], [s(1, 26), work], [s(3, 58), { k: 'landing', rank: 1 }], [s(4, 3), done], [s(4, 32), gone]],
      },
      { name: 'og-images', life: [[0, gone], [s(1, 20), work], [s(3, 12), { k: 'landing', rank: 1 }], [s(3, 16), done], [s(3, 52), gone]] },
      // idle: they skate (the app's pastimes, 2 at most). A trip to their desk starts a skate session
      // at the same film time every loop, so every loop rides the same lines: seo-meta's from 1:46
      // bails at 2:44 (its 3rd line), i18n's from 4:50 kickflips at 0:47 (run.ts PRE_S covers both)
      { name: 'seo-meta', life: [[0, idle], [s(1, 40), think], [s(1, 46), idle]] },
      { name: 'i18n', life: [[0, idle], [s(4, 44), think], [s(4, 50), idle]] },
    ],
  },
  {
    id: ACME,
    name: 'acme-web',
    map: 'riad',
    stage: 9,
    bims: [
      { name: 'main', main: true, life: [[0, { k: 'main' }]] },
      { name: 'api-tests', life: [[0, work], [s(2, 12), { k: 'wait', on: 'checkout' }], [s(2, 23), work]] },
      { name: 'checkout', life: [[0, work], [s(2, 12), { k: 'wait', on: 'api-tests' }], [s(2, 23), idle], [s(2, 26), work]] },
      { name: 'invoice-pdf', life: [[0, gone], [s(0, 58), work], [s(3, 22), { k: 'landing', rank: 1 }], [s(3, 28), done], [s(4, 46), gone]] },
    ],
  },
];

export const NOTES: readonly Note[] = [
  { at: s(0, 11), office: HARNESS, from: 'you', to: 'main' },
  { at: s(1, 24), office: SITE, from: 'you', to: 'pricing-page' },
  { at: s(2, 24), office: ACME, from: 'api-tests', to: 'checkout' },
];

export const EGGS: readonly Egg[] = [
  // the plane loops before pricing-page catches it
  { at: s(1, 24), dur: 3.5, office: SITE, bim: 'pricing-page', kind: 'loop' },
  // invoice-pdf's hop and coin on its way in
  { at: s(1, 0.5), dur: 0.6, office: ACME, bim: 'invoice-pdf', kind: 'hop' },
  { at: s(2, 8), dur: 8, office: HARNESS, bim: 'docs-sync', kind: 'golden' },
  { at: s(2, 12.5), dur: 10.5, office: ACME, bim: 'api-tests', kind: 'stare' },
  { at: s(2, 12.5), dur: 10.5, office: ACME, bim: 'checkout', kind: 'stare' },
  { at: s(2, 31), dur: 0.8, office: ACME, bim: 'checkout', kind: 'tap' },
  { at: s(2, 36), dur: 6, office: ACME, bim: 'checkout', kind: 'moonwalk' },
  { at: s(3, 8), dur: 2.5, office: HARNESS, bim: 'dark-mode', kind: 'itemget' },
  { at: s(3, 16), dur: 4, office: SITE, bim: 'og-images', kind: 'speedrun' },
  { at: s(3, 42), dur: 3, office: HARNESS, bim: 'main', kind: 'tetris' },
  { at: s(3, 42), dur: 3, office: HARNESS, bim: 'dark-mode', kind: 'combo' },
  { at: s(3, 42), dur: 3, office: HARNESS, bim: 'signup-flow', kind: 'combo' },
  { at: s(4, 5), dur: 3, office: SITE, bim: 'main', kind: 'clap' },
  { at: s(4, 20), dur: 1.2, office: HARNESS, bim: 'dark-mode', kind: 'kickflip' },
  { at: s(4, 30), dur: 0.9, office: HARNESS, bim: 'signup-flow', kind: 'salto' },
];

const bim = (office: string, name: string): Subject => ({ k: 'bim', office, name });

export const SHOTS: readonly Shot[] = [
  { at: 0, size: 'wide', subject: { k: 'town' } },
  { at: s(0, 10), size: 'office', subject: { k: 'office', office: HARNESS } },
  { at: s(0, 20), size: 'follow', subject: bim(HARNESS, 'signup-flow') },
  { at: s(0, 34), size: 'office', subject: { k: 'office', office: HARNESS } },
  { at: s(0, 44), size: 'close', subject: bim(SITE, 'i18n') },
  { at: s(0, 58), size: 'wide', subject: { k: 'town' } },
  { at: s(1, 6), size: 'follow', subject: bim(SITE, 'pricing-page') },
  { at: s(1, 16), size: 'follow', subject: bim(HARNESS, 'fix-flaky-test') },
  { at: s(1, 24), size: 'office', subject: { k: 'office', office: SITE } },
  { at: s(1, 40), size: 'office', subject: { k: 'office', office: HARNESS } },
  { at: s(1, 52), size: 'wide', subject: { k: 'town' } },
  { at: s(2, 2), size: 'close', subject: bim(HARNESS, 'docs-sync') },
  { at: s(2, 14), size: 'follow', subject: { k: 'pair', office: ACME, names: ['api-tests', 'checkout'] } },
  { at: s(2, 24), size: 'follow', subject: bim(ACME, 'checkout') },
  { at: s(2, 34), size: 'close', subject: bim(ACME, 'checkout') },
  { at: s(2, 42), size: 'follow', subject: bim(SITE, 'seo-meta') },
  { at: s(2, 56), size: 'wide', subject: { k: 'town' } },
  { at: s(3, 4), size: 'follow', subject: bim(HARNESS, 'dark-mode') },
  { at: s(3, 16), size: 'close', subject: bim(SITE, 'og-images') },
  { at: s(3, 26), size: 'office', subject: { k: 'office', office: ACME } },
  { at: s(3, 38), size: 'close', subject: bim(HARNESS, 'main') },
  { at: s(3, 52), size: 'follow', subject: bim(SITE, 'og-images') },
  { at: s(3, 56), size: 'wide', subject: { k: 'town' } },
  { at: s(4, 2), size: 'close', subject: bim(SITE, 'main') },
  { at: s(4, 16), size: 'follow', subject: bim(HARNESS, 'dark-mode') },
  { at: s(4, 30), size: 'follow', subject: bim(HARNESS, 'signup-flow') },
  { at: s(4, 44), size: 'wide', subject: { k: 'town' } },
];
