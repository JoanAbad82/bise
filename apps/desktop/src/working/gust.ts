// The working indicator's frames (designer's desktop-working page, tui-parity m_20165): the TUI's
// gust (rust/tui/src/gust.rs, motif W1, 'a puff crossing left to right'), its 1-cell breath, the
// '∿' pulse of a running tool and the '·' pulse of a starting agent, as cells (a glyph and its
// tone) at a moment. Pure: the window's one clock (clock.ts) says the moment, Signs.tsx draws the
// cells. The frames step, never fade: the terminal's character.
//
// Tones: ≈ and ∿ ink (--c-text), ~ text-2, · text-3. Calm (he types in this composer): half speed,
// each tone one step down. Hush (he types; any other agent's sign): one ∿ that steps text-2 /
// text-3. Still (reduced motion, the window not in front, a slow frame): one ∿ in ink, every size.
// Owner: amb-web.

/** ms a frame (gust.rs:91); a calm gust runs at half speed */
export const GUST_MS = 110;
export const CALM_MS = 220;
/** the tool / starting pulse: one phase per 4 ticks of 80 ms (theme.rs working_frame) */
export const PULSE_MS = 320;
/** the hush: a tone step every 12 frames */
export const HUSH_MS = 12 * GUST_MS;
/** he types: a key in the composer under this long ago */
export const TYPING_MS = 1500;

/** The 5-cell gust, 9 frames (the last, a calm beat): a 990 ms loop. */
export const GUST5: readonly string[] = [
  "≈    ",
  "∿≈   ",
  "~∿≈  ",
  "·~∿≈ ",
  " ·~∿≈",
  "  ·~∿",
  "   ·~",
  "    ·",
  "     ",
];
/** The 1-cell breath, 6 frames: a 660 ms loop. */
export const BREATH: readonly string[] = ["·", "~", "∿", "≈", "∿", "~"];

export type Tone = "ink" | "t2" | "t3";
export interface Cell {
  readonly g: string;
  readonly tone: Tone;
}

/** The window's motion at a moment: ms on its clock, whether it holds still, whether he types. */
export interface Motion {
  readonly elapsed: number;
  readonly still: boolean;
  readonly typing: boolean;
}

const STILL: Cell = { g: "∿", tone: "ink" };
const BLANK: Cell = { g: " ", tone: "t3" };

/** A glyph's tone; calm: one step down (text-3 stays). */
export function toneOf(g: string, calm = false): Tone {
  const t: Tone = g === "≈" || g === "∿" ? "ink" : g === "~" ? "t2" : "t3";
  if (!calm) return t;
  return t === "ink" ? "t2" : "t3";
}

const frame = (elapsed: number, ms: number, n: number): number =>
  Math.floor(Math.max(0, elapsed) / ms) % n;

/** The working row's gust: 5 cells. Calm while he types; still: one ∿ in ink, then blanks. */
export function gustCells(m: Motion): readonly Cell[] {
  if (m.still) return [STILL, BLANK, BLANK, BLANK, BLANK];
  const f =
    GUST5[frame(m.elapsed, m.typing ? CALM_MS : GUST_MS, GUST5.length)] ?? "";
  // the glyphs are single code units (≈ ∿ ~ · and a space)
  return f.split("").map((g) =>
    g === " " ? BLANK : { g, tone: toneOf(g, m.typing) },
  );
}

/** The 1-cell breath (right bar, head chip, spotlight); the hush while he types; still: ∿ ink. */
export function breathCell(m: Motion): Cell {
  if (m.still) return STILL;
  if (m.typing)
    return { g: "∿", tone: frame(m.elapsed, HUSH_MS, 2) === 0 ? "t2" : "t3" };
  const g = BREATH[frame(m.elapsed, GUST_MS, BREATH.length)] ?? "∿";
  return { g, tone: toneOf(g) };
}

/**
 * A pulse: 'tool' (a running call's '∿ 12 s': ink / text-2) or 'starting' (an agent starting:
 * '·' text-2 / text-3), 320 ms a phase. It holds its first phase while still or while he types.
 */
export function pulseCell(kind: "tool" | "starting", m: Motion): Cell {
  const off = !m.still && !m.typing && frame(m.elapsed, PULSE_MS, 2) === 1;
  if (kind === "tool") return { g: "∿", tone: off ? "t2" : "ink" };
  return { g: "·", tone: off ? "t3" : "t2" };
}

/** The turn's age on the working row: '42 s' under a minute, then '2 min', '3 h' (the head chip's). */
export function turnAge(ms: number): string {
  const s = Math.floor(Math.max(0, ms) / 1000);
  if (s < 60) return `${String(s)} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${String(m)} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${String(h)} h` : `${String(Math.floor(h / 24))} d`;
}

/** ms from `elapsed` to the next moment any cell can change (a gust frame or a pulse phase). */
export function nextChange(elapsed: number): number {
  const e = Math.max(0, elapsed);
  return Math.min(GUST_MS - (e % GUST_MS), PULSE_MS - (e % PULSE_MS));
}
