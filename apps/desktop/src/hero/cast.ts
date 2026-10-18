// The hero film's score (page bims-film v8, bims m_30855, m_30867, m_31057): bise.dev/desktop's town, three offices
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

/** the shot sizes (bims-film): the three offices, one office (tight: closer), a bim followed, a close-up, the clap's (×4) */
export type Size = 'wide' | 'office' | 'tight' | 'follow' | 'close' | 'closest';

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
  /** its glide in, s, past the director's own (the seam's long move back to 0:00's frame) */
  readonly glide?: number;
  /** where its subject sits, fractions of the frame, past the director's safe point (the opening: main at 65%, bims m_31467) */
  readonly frame?: { readonly x: number; readonly y: number };
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
      // the cold open's task: his plane leaves at 0:00.5, main has it at 0:03.5; idle again once its day is over
      { name: 'main', main: true, life: [[0, { k: 'mainidle' }], [s(0, 3.5), { k: 'main' }], [s(4, 20), { k: 'mainidle' }]] },
      {
        // in by the door at 0:04, asks you at 0:10, your answer lands at 0:17 (the hop and the coin),
        // the 3rd land at 3:02 (combo ×2 with dark-mode), off on its board at 4:18
        name: 'signup-flow',
        life: [[0, gone], [s(0, 4), work], [s(0, 10), { k: 'asks' }], [s(0, 17), think], [s(2, 57), { k: 'landing', rank: 1 }], [s(3, 5.5), done], [s(4, 18), gone]],
      },
      {
        // the day's first land: its crate carried to main's queue from 0:18, over its head in the queue, then the deck chairs
        name: 'dark-mode',
        life: [[0, gone], [s(0, 4.6), work], [s(0, 18), { k: 'landing', rank: 1 }], [s(0, 26.5), done], [s(4, 21), gone]],
      },
      { name: 'fix-flaky-test', life: [[0, work], [s(0, 54), { k: 'failed' }], [s(1, 48), work]] },
      {
        // an island trip at the seam (up from its bean bag at 4:57), the golden pineapple at 1:11,
        // trips through the day (the town's '2 island trips at any time'), then its bean bag from 3:42
        name: 'docs-sync',
        life: [
          [0, { k: 'snack', fruit: 1, trip: 1 }],
          [s(0, 20), idle],
          [s(1, 5), { k: 'snack', fruit: 1, trip: 2 }],
          [s(1, 9), { k: 'snack', fruit: 0, trip: 3 }],
          [s(1, 20), idle],
          [s(2, 0), { k: 'snack', fruit: 2, trip: 4 }],
          [s(2, 14), idle],
          [s(3, 28), { k: 'snack', fruit: 1, trip: 5 }],
          [s(3, 42), idle],
          // on its way to the island at 0:00 (the cold open's first frame)
          [s(4, 57), { k: 'snack', fruit: 1, trip: 1 }],
        ],
      },
      { name: 'perf-audit', life: [[0, { k: 'sleep' }], [s(3, 38), work], [s(4, 10), { k: 'sleep' }]] },
    ],
  },
  {
    id: SITE,
    name: 'bise.dev',
    map: 'california',
    stage: 11,
    bims: [
      // his plane at 0:41 starts its day; 'line clear' at 3:12, then nothing waits here: up from its work for the clap (3:15)
      { name: 'main', main: true, life: [[0, { k: 'mainidle' }], [s(0, 44), { k: 'main' }], [s(3, 14.5), { k: 'mainidle' }]] },
      {
        // in at 0:46, the second '?' at 1:56 (two loops on its answer's way), the 4th land at 3:12, off at 4:34
        name: 'pricing-page',
        life: [[0, gone], [s(0, 46), work], [s(1, 56), { k: 'asks' }], [s(2, 7), work], [s(3, 6), { k: 'landing', rank: 1 }], [s(3, 13), done], [s(4, 34), gone]],
      },
      // in at 0:46.6, lands at 2:33 ('1:47' over its head), off down the road at 2:36
      { name: 'og-images', life: [[0, gone], [s(0, 46.6), work], [s(2, 28), { k: 'landing', rank: 1 }], [s(2, 33), done], [s(2, 36), gone]] },
      // idle: bean bags and the island, never the park (bims-film v8: no skater, run.ts pastimes off)
      { name: 'seo-meta', life: [[0, idle], [s(2, 50), { k: 'snack', fruit: 2, trip: 1 }], [s(3, 4), idle]] },
      // up from its bean bag to the island at 3:44, eats at 3:47
      { name: 'i18n', life: [[0, idle], [s(3, 43), { k: 'snack', fruit: 1, trip: 1 }], [s(3, 58), idle]] },
    ],
  },
  {
    id: ACME,
    name: 'acme-web',
    map: 'riad',
    stage: 9,
    bims: [
      { name: 'main', main: true, life: [[0, { k: 'main' }]] },
      // they wait on each other ('…' over both, 1:17-1:28), a message, a coffee (1:36), checkout's moonwalk back (1:41)
      { name: 'api-tests', life: [[0, work], [s(1, 17), { k: 'wait', on: 'checkout' }], [s(1, 28), work]] },
      { name: 'checkout', life: [[0, work], [s(1, 17), { k: 'wait', on: 'api-tests' }], [s(1, 28), idle], [s(1, 31), work]] },
      // in with the hop and the coin at 1:02, the 2nd land at 2:55, off at 4:38
      { name: 'invoice-pdf', life: [[0, gone], [s(0, 59.5), work], [s(2, 51), { k: 'landing', rank: 1 }], [s(2, 58), done], [s(4, 38), gone]] },
    ],
  },
];

export const NOTES: readonly Note[] = [
  // the story's (bims-film v7): your task, your two answers, the agents' notes
  { at: s(0, 0.5), office: HARNESS, from: 'you', to: 'main' },
  { at: s(0, 14), office: HARNESS, from: 'you', to: 'signup-flow' },
  { at: s(0, 41), office: SITE, from: 'you', to: 'main' },
  { at: s(1, 29), office: ACME, from: 'api-tests', to: 'checkout' },
  // bims-film v8: api-tests' post-it on checkout's desk (0:32), invoice-pdf taps api-tests' shoulder (2:20)
  { at: s(0, 28.5), office: ACME, from: 'api-tests', to: 'checkout' },
  { at: s(2, 15.5), office: ACME, from: 'invoice-pdf', to: 'api-tests' },
  { at: s(2, 2), office: SITE, from: 'you', to: 'pricing-page' },
  { at: s(3, 52), office: ACME, from: 'api-tests', to: 'main' },
  // the town's background life: a plane of his to a working bim about every 20 s
  { at: s(0, 22), office: ACME, from: 'you', to: 'main' },
  { at: s(1, 0), office: HARNESS, from: 'you', to: 'main' },
  { at: s(1, 20), office: ACME, from: 'you', to: 'invoice-pdf' },
  { at: s(1, 40), office: HARNESS, from: 'you', to: 'signup-flow' },
  { at: s(2, 22), office: ACME, from: 'you', to: 'main' },
  { at: s(2, 44), office: HARNESS, from: 'you', to: 'fix-flaky-test' },
  { at: s(3, 24), office: ACME, from: 'you', to: 'api-tests' },
  { at: s(3, 45), office: HARNESS, from: 'you', to: 'perf-audit' },
  { at: s(4, 1), office: ACME, from: 'you', to: 'checkout' },
  { at: s(4, 24), office: ACME, from: 'you', to: 'invoice-pdf' },
  { at: s(4, 42), office: HARNESS, from: 'you', to: 'fix-flaky-test' },
];

export const EGGS: readonly Egg[] = [
  // the cold open: your answer loops before signup-flow catches it, then its hop and coin
  { at: s(0, 14), dur: 3.5, office: HARNESS, bim: 'signup-flow', kind: 'loop' },
  { at: s(0, 17.2), dur: 0.6, office: HARNESS, bim: 'signup-flow', kind: 'hop' },
  // in the queue with its crate: the crate over its head, then the deck chairs at 0:26.5
  { at: s(0, 23.5), dur: 2.5, office: HARNESS, bim: 'dark-mode', kind: 'itemget' },
  // invoice-pdf's hop and coin on its way in
  { at: s(1, 2), dur: 0.6, office: ACME, bim: 'invoice-pdf', kind: 'hop' },
  { at: s(1, 11), dur: 8, office: HARNESS, bim: 'docs-sync', kind: 'golden' },
  { at: s(1, 17.5), dur: 10.5, office: ACME, bim: 'api-tests', kind: 'stare' },
  { at: s(1, 17.5), dur: 10.5, office: ACME, bim: 'checkout', kind: 'stare' },
  { at: s(1, 36), dur: 0.8, office: ACME, bim: 'checkout', kind: 'tap' },
  { at: s(1, 41), dur: 6, office: ACME, bim: 'checkout', kind: 'moonwalk' },
  // pricing-page's answer: two loops (a longer egg), then the hop
  { at: s(2, 2), dur: 5, office: SITE, bim: 'pricing-page', kind: 'loop' },
  { at: s(2, 7.5), dur: 0.6, office: SITE, bim: 'pricing-page', kind: 'hop' },
  { at: s(2, 33), dur: 3, office: SITE, bim: 'og-images', kind: 'speedrun' },
  { at: s(3, 3), dur: 3, office: HARNESS, bim: 'dark-mode', kind: 'combo' },
  { at: s(3, 3), dur: 3, office: HARNESS, bim: 'signup-flow', kind: 'combo' },
  { at: s(3, 12), dur: 3, office: SITE, bim: 'main', kind: 'tetris' },
  { at: s(3, 15), dur: 3, office: SITE, bim: 'main', kind: 'clap' },
  { at: s(3, 30), dur: 1.2, office: HARNESS, bim: 'dark-mode', kind: 'kickflip' },
  { at: s(4, 16), dur: 0.9, office: HARNESS, bim: 'signup-flow', kind: 'salto' },
];

const bim = (office: string, name: string): Subject => ({ k: 'bim', office, name });

/** the opening's frame (bims m_31467): main's desk at 65 % across, the door still in frame for 0:04 */
const OPEN_AT = { x: 0.65, y: 0.5 } as const;

export const SHOTS: readonly Shot[] = [
  // the cold open (0:00-0:30): close from the first second, the product in 30 s
  { at: 0, size: 'tight', subject: { k: 'spot', office: HARNESS, spot: 'main' }, frame: OPEN_AT },
  { at: s(0, 4), size: 'follow', subject: bim(HARNESS, 'signup-flow') },
  { at: s(0, 8), size: 'tight', subject: { k: 'office', office: HARNESS } },
  { at: s(0, 10), size: 'close', subject: bim(HARNESS, 'signup-flow') },
  { at: s(0, 14), size: 'follow', subject: bim(HARNESS, 'signup-flow') },
  { at: s(0, 20), size: 'follow', subject: bim(HARNESS, 'dark-mode') },
  { at: s(0, 23.5), size: 'close', subject: bim(HARNESS, 'dark-mode') },
  { at: s(0, 26), size: 'wide', subject: { k: 'town' } },
  // act 1: the town gets up
  { at: s(0, 30), size: 'tight', subject: { k: 'office', office: ACME } },
  { at: s(0, 38), size: 'follow', subject: bim(HARNESS, 'dark-mode') },
  { at: s(0, 44), size: 'office', subject: { k: 'office', office: SITE } },
  { at: s(0, 52), size: 'follow', subject: bim(HARNESS, 'fix-flaky-test') },
  { at: s(1, 0), size: 'office', subject: { k: 'office', office: ACME } },
  { at: s(1, 8), size: 'close', subject: bim(HARNESS, 'docs-sync') },
  { at: s(1, 16), size: 'wide', subject: { k: 'town' } },
  // act 2: the small dramas
  { at: s(1, 24), size: 'follow', subject: { k: 'pair', office: ACME, names: ['api-tests', 'checkout'] } },
  { at: s(1, 32), size: 'follow', subject: bim(ACME, 'checkout') },
  { at: s(1, 40), size: 'close', subject: bim(ACME, 'checkout') },
  { at: s(1, 46), size: 'office', subject: { k: 'office', office: HARNESS } },
  { at: s(1, 54), size: 'follow', subject: bim(SITE, 'pricing-page') },
  { at: s(2, 2), size: 'tight', subject: bim(SITE, 'pricing-page') },
  { at: s(2, 10), size: 'wide', subject: { k: 'town' } },
  // act 3: the break
  { at: s(2, 18), size: 'office', subject: { k: 'office', office: ACME } },
  { at: s(2, 26), size: 'close', subject: bim(SITE, 'og-images') },
  { at: s(2, 36), size: 'follow', subject: bim(SITE, 'og-images') },
  { at: s(2, 40), size: 'wide', subject: { k: 'town' } },
  // act 4: the lands
  { at: s(2, 52), size: 'follow', subject: bim(ACME, 'invoice-pdf') },
  { at: s(3, 0), size: 'office', subject: { k: 'office', office: HARNESS } },
  { at: s(3, 8), size: 'follow', subject: bim(SITE, 'pricing-page') },
  // the clap (3:15-3:18) seen closest (bims m_31230)
  { at: s(3, 14), size: 'closest', subject: bim(SITE, 'main') },
  { at: s(3, 20), size: 'wide', subject: { k: 'town' } },
  // act 5: the day's end, then again
  { at: s(3, 28), size: 'follow', subject: bim(HARNESS, 'dark-mode') },
  { at: s(3, 36), size: 'office', subject: { k: 'office', office: HARNESS } },
  { at: s(3, 44), size: 'follow', subject: bim(SITE, 'i18n') },
  { at: s(3, 52), size: 'office', subject: { k: 'office', office: ACME } },
  { at: s(4, 0), size: 'wide', subject: { k: 'town' } },
  { at: s(4, 8), size: 'office', subject: { k: 'office', office: HARNESS } },
  { at: s(4, 16), size: 'follow', subject: bim(HARNESS, 'signup-flow') },
  { at: s(4, 24), size: 'wide', subject: { k: 'town' } },
  // the seam: a long move from the wide down to 0:00's frame, there by 4:57
  { at: s(4, 50), size: 'tight', subject: { k: 'spot', office: HARNESS, spot: 'main' }, frame: OPEN_AT, glide: 8.5 },
];
