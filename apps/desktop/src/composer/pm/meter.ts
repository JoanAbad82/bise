// The dictation node's meter, the TUI's voice chip (rust/tui/src/voice/chip.rs, tui-parity m_22697):
//   - listening: the last BARS levels of his voice, the newest on the right, one each SAMPLE_MS;
//     a level is one of 8 steps (the TUI's ▁▂▃▄▅▆▇█), silence the lowest (never an empty bar);
//   - transcribing: the bars stop following the mic and roll the fixed WAVE one bar each WAVE_MS.
// Pure: the node view (schema.ts) keeps the clock and the DOM.

/** The meter's bars. */
export const BARS = 6;
/** One level per 100 ms (the TUI's one per 100 ms block of audio). */
export const SAMPLE_MS = 100;
/** The transcribing wave moves one bar this often. */
export const WAVE_MS = 120;
/** The listening ● blinks: on, then off, this long each (the TUI's BLINK_MS). */
export const BLINK_MS = 600;
/** The steps of a bar (the TUI's PEAK_BLOCKS ▁▂▃▄▅▆▇█). */
export const STEPS = 8;
/** The rolling wave, in steps: ▂▃▅▆▅▃. */
export const WAVE: readonly number[] = [1, 2, 4, 5, 4, 2];

/** A level (0-1, the core's loudness on a dB scale) as a step 0-7 (the TUI's peak_glyph). */
export const step = (v: number): number => {
  const c = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
  return Math.min(STEPS - 1, Math.floor(c * STEPS));
};

/** Silence: every bar at the lowest step. */
export const flat = (): number[] => Array.from({ length: BARS }, () => 0);

/** The bars after one more level: the oldest goes left, the newest comes in on the right. */
export const push = (bars: readonly number[], v: number): number[] => [...bars.slice(1 - BARS), step(v)].slice(-BARS);

/** The chip's time, m:ss (the TUI's timer). */
export const timeOf = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60))}:${String(s % 60).padStart(2, '0')}`;
};

/** The chip's forms, widest first: all, no timer, 3 bars (the TUI's Fit). */
export type Fit = 'full' | 'no-timer' | 'three';
/** The free text the chip leaves on its line, at least (designer m_22700). */
export const FREE_MIN = 160;
/** The widest form that leaves FREE_MIN of a `fieldW` field (`width` measures a form). */
export const fitFor = (fieldW: number, width: (f: Fit) => number): Fit =>
  (['full', 'no-timer'] as const).find((f) => fieldW - width(f) >= FREE_MIN) ?? 'three';

/** The wave's frame `n` (0: ▂▃▅▆▅▃, then rolled one bar left each frame). */
export const wave = (n: number): number[] => {
  const k = ((n % BARS) + BARS) % BARS;
  return [...WAVE.slice(k), ...WAVE.slice(0, k)];
};
