// A forwarded message (msg-forward, designer m_41546; architect m_41547): its parts carry a
// 'forwarded' part (bise_proto::parts::Part::Forwarded, made by sb-core only). What comes before it
// is the forwarder's note, what comes after it the original. The window draws the note as the
// message's own words, then '↪ forwarded from you → main · 12:26' (his local time; the id in the
// tip), then the original quoted. Never the header the model reads. The TUI does the same
// (rust/tui/src/forwarded.rs). Pure.
import type { Part } from '@/proto';
import { thread } from '@/proto/words.gen';

export type ForwardedPart = Extract<Part, { kind: 'forwarded' }>;

/** A forward's pieces: the note's parts, the forwarded part, the original's parts. */
export interface Forward {
  readonly note: readonly Part[];
  readonly fwd: ForwardedPart;
  readonly original: readonly Part[];
}

/** The forward in `parts`; null: not a forward. */
export function forwardOf(parts: readonly Part[] | null | undefined): Forward | null {
  if (parts == null) return null;
  const i = parts.findIndex((p) => p.kind === 'forwarded');
  const fwd = parts[i];
  if (fwd?.kind !== 'forwarded') return null;
  return { note: parts.slice(0, i), fwd, original: parts.slice(i + 1) };
}

/** The moment a 'YYYY-MM-DD HH:MM UTC' time names (the hub's fmt_utc), in ms; another shape: null. */
export function utcMs(at: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}) UTC$/u.exec(at);
  if (m === null) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number) as [number, number, number, number, number];
  return Date.UTC(y, mo - 1, d, h, mi);
}

/** Who wrote it or got it, as he reads it: 'you' for him. */
function who(name: string): string {
  return name === 'user' ? thread.forwarded_you : name;
}

/** Its line: '↪ forwarded from you → main · 12:26' (`clock`: ms to his '14:02'); no time: none. */
export function forwardLine(f: ForwardedPart, clock: (ms: number) => string): string {
  const ms = utcMs(f.at ?? '');
  return ms === null ? thread.forwarded_from_untimed({ from: who(f.from), to: who(f.to) }) : thread.forwarded_from({ from: who(f.from), to: who(f.to), at: clock(ms) });
}

/** The hover of its '↪': who forwarded it to whom, and the original's id (an agent's 'sb show m_3'). */
export function forwardTip(f: ForwardedPart, to: string): string {
  return thread.forwarded_tip({ by: who(f.by), to, id: `m_${String(f.id)}` });
}
