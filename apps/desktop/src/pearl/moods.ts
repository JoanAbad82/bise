// The pearl's moods and how it moves between them (SPEC §1's table, the capsule's pearl.js as is).
// Pure, for the checks: every value eases toward its mood's target with 1 - e^(-dt/0.3) (a change
// takes ~0.9 s: never a jump, his bug 2), and the smoke's flow integrates
// dt · speed · (1 + 1.2 · voice · level). The pearl moves only while bise works or listens (MOVES:
// listen, speak, work; ambient-lead m_11707: battery, and "the pearl clignote très bizarrement"):
// in every other mood its speed and motion ease to 0, so once settled it is one still frame and
// nothing is drawn. Its clock (the shader's breath and twinkle) runs at `motion`, so it stops with
// it and picks up where it was, never jumping on a wake. Under reduced motion it stands still always.

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
  /** 1 while it moves, 0 once still: eases like the rest */
  readonly motion: number;
  /** seconds the pearl has moved (the shader's t): advances at dt · motion */
  readonly clock: number;
}

/** The moods in which the pearl moves: bise works or listens. */
export const MOVES: ReadonlySet<Mood> = new Set<Mood>(['listen', 'speak', 'work']);

/** Whether the pearl moves in this mood: never under reduced motion. */
export const moves = (mood: Mood, reduce: boolean): boolean => !reduce && MOVES.has(mood);

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

const KEYS = ['speed', 'think', 'need', 'done', 'away', 'listen', 'voice', 'still', 'motion'] as const;

type Targets = MoodValues & { readonly motion: number };

/** The mood's targets: no speed and no motion unless it moves; under reduced motion also still, no voice. */
export function target(mood: Mood, reduce: boolean): Targets {
  const m = MOODS[mood];
  if (reduce) return { ...m, speed: 0, still: 1, voice: 0, motion: 0 };
  return moves(mood, reduce) ? { ...m, motion: 1 } : { ...m, speed: 0, motion: 0 };
}

/** A pearl at rest, still; `flow` (and its clock) set where its smoke starts. */
export const start = (flow = 0): PearlState => ({ flow, clock: flow, ...target('rest', false) });

/** One step of `dt` seconds toward `mood`; a step over 1 s lands on the targets. */
export function ease(s: PearlState, mood: Mood, level: number, dt: number, reduce: boolean): PearlState {
  const m = target(mood, reduce);
  const k = dt > 1 ? 1 : 1 - Math.exp(-dt / 0.3);
  const n = { ...s };
  for (const key of KEYS) n[key] = s[key] + (m[key] - s[key]) * k;
  n.flow = s.flow + dt * n.speed * (1 + 1.2 * n.voice * level);
  n.clock = s.clock + Math.min(dt, 1) * n.motion;
  return n;
}

/**
 * The mood's still frame, for a window he sees but is not in front (LivePearl's one frame there):
 * every value on its target, the smoke and its clock where they were (no jump when he comes back).
 */
export function settle(s: PearlState, mood: Mood, reduce: boolean): PearlState {
  return { ...s, ...target(mood, reduce), flow: s.flow, clock: s.clock };
}

/** Every value at its target: in a mood that does not move, nothing is left to draw. */
export function settled(s: PearlState, mood: Mood, reduce: boolean): boolean {
  const m = target(mood, reduce);
  return KEYS.every((key) => Math.abs(s[key] - m[key]) < 0.002);
}
