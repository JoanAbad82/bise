// A process's output as the window reads it (HubEv proc_out: a range at byte `at`, base64, and the
// output's size `end` when read), pure: which bytes the terminal writes, in order, once each, and
// which range to ask next. A range answer and the follow's notifications can cross: a chunk past
// what was written waits while the gap is asked for; asked once and still past (the start of that
// gap is no longer kept), the gap is let go. Owner: procs-desktop.

export interface Chunk {
  readonly at: number;
  readonly bytes: Uint8Array;
  /** the output's size when the hub read it */
  readonly end: number;
}

export interface OutState {
  /** the next byte to write; null: nothing came yet */
  readonly next: number | null;
  /** chunks past `next`, waiting for the gap */
  readonly held: readonly Chunk[];
  /** the offset last asked for (proc_out from), so one gap is asked once */
  readonly asked: number | null;
}

export const START: OutState = { next: null, held: [], asked: null };

export interface Step {
  readonly state: OutState;
  /** bytes for the terminal, in order */
  readonly write: readonly Uint8Array[];
  /** ask proc_out from this offset; null: nothing to ask */
  readonly ask: number | null;
}

/** The part of `c` past `next` (all of it when it starts there or before nothing came). */
const past = (c: Chunk, next: number): Uint8Array => (c.at >= next ? c.bytes : c.bytes.subarray(Math.min(c.bytes.length, next - c.at)));

/** One chunk in. */
export function take(s: OutState, c: Chunk): Step {
  const write: Uint8Array[] = [];
  let next = s.next;
  let held = [...s.held, c].sort((a, b) => a.at - b.at);
  let asked = s.asked;
  // what can be written now: from the start, or touching `next`; a gap asked once already is let go
  for (;;) {
    const i = held.findIndex((h) => next === null || h.at <= next || asked === next);
    if (i < 0) break;
    const h = held[i] as Chunk;
    held = held.filter((_, j) => j !== i);
    const part = next === null ? h.bytes : past(h, next);
    if (part.length > 0) write.push(part);
    next = Math.max(next ?? 0, h.at + h.bytes.length);
  }
  // a gap before a held chunk, or more than the answer carried: ask from `next`, once
  const more = held.length > 0 || (next !== null && next < c.end);
  const ask = more && next !== null && asked !== next ? next : null;
  if (ask !== null) asked = ask;
  return { state: { next, held, asked }, write, ask };
}

/** base64 to bytes (the window has atob). */
export function bytesOf(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** It has printed something: a byte was written. */
export const printed = (s: OutState): boolean => s.next !== null && s.next > 0;
