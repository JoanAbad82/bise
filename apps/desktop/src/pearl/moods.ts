// The pearl's moods and how it moves between them (SPEC §1's table, the capsule's pearl.js as is).
// Pure, for the checks: every value eases toward its mood's target with 1 - e^(-dt/0.3) (a change
// takes ~0.9 s: never a jump, his bug 2), and the smoke's flow integrates
// dt · speed · (1 + 1.2 · voice · level). Under reduced motion the pearl stands still in every mood.

export type Mood = 'rest' | 'still' | 'listen' | 'speak' | 'work' | 'need' | 'done' | 'fail' | 'away';

export interface MoodValues {
  readonly speed: number;
  readonly think: number;
  readonly need: number;
  readonly done: number;
  readonly away: number;
  readonly listen: number;
  readonly voice: number;
  readonly still: number;
}

export interface PearlState extends MoodValues {
  readonly flow: number;
}

export const MOODS: Readonly<Record<Mood, MoodValues>> = {
  rest: { speed: 0.18, think: 0, need: 0, done: 0, away: 0, listen: 0, voice: 0, still: 0 },
  still: { speed: 0, think: 0, need: 0, done: 0, away: 0.25, listen: 0, voice: 0, still: 1 },
  listen: { speed: 0.7, think: 0, need: 0, done: 0, away: 0, listen: 1, voice: 1, still: 0 },
  speak: { speed: 0.5, think: 0, need: 0, done: 0, away: 0, listen: 0.4, voice: 0.6, still: 0 },
  work: { speed: 0.45, think: 1, need: 0, done: 0, away: 0, listen: 0, voice: 0, still: 0 },
  need: { speed: 0.2, think: 0, need: 1, done: 0, away: 0, listen: 0, voice: 0, still: 0 },
  done: { speed: 0.25, think: 0, need: 0, done: 1, away: 0, listen: 0, voice: 0, still: 0 },
  fail: { speed: 0, think: 0, need: 0, done: 0, away: 0.5, listen: 0, voice: 0, still: 1 },
  away: { speed: 0.06, think: 0, need: 0, done: 0, away: 1, listen: 0, voice: 0, still: 0 },
};

const KEYS = ['speed', 'think', 'need', 'done', 'away', 'listen', 'voice', 'still'] as const;

/** The mood's targets; under reduced motion: no speed, no voice, still. */
export function target(mood: Mood, reduce: boolean): MoodValues {
  const m = MOODS[mood];
  return reduce ? { ...m, speed: 0, still: 1, voice: 0 } : m;
}

export const start = (flow = 0): PearlState => ({ flow, ...MOODS.rest });

/** One step of `dt` seconds toward `mood`; a step over 1 s lands on the targets. */
export function ease(s: PearlState, mood: Mood, level: number, dt: number, reduce: boolean): PearlState {
  const m = target(mood, reduce);
  const k = dt > 1 ? 1 : 1 - Math.exp(-dt / 0.3);
  const n = { ...s };
  for (const key of KEYS) n[key] = s[key] + (m[key] - s[key]) * k;
  n.flow = s.flow + dt * n.speed * (1 + 1.2 * n.voice * level);
  return n;
}

/** Every value at its target: under reduced motion there is nothing left to draw. */
export function settled(s: PearlState, mood: Mood, reduce: boolean): boolean {
  const m = target(mood, reduce);
  return KEYS.every((key) => Math.abs(s[key] - m[key]) < 0.002);
}
