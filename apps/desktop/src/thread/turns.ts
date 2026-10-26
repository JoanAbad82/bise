// A turn's fold (bise fait mac, mockup 1, QA §4): 'worked for 3m 10s ›' at the start of each turn
// that did work, its thinking rows folded under it (each tools row keeps its own summary line);
// the turn at work says 'working for 42s ›'. A view over the hub's facts on the entries: a turn
// starts at the entry after its turn_started line (Entry.turn_start) and ends on the entry that
// carries its turn_done time (Entry.turn_end_ms); no order or state is made up here. Desktop only:
// a fold, no new data (native-lead m_43274). Owner: nm-thread. Pure.

/** What a turn needs of an entry. */
export interface TurnEntry {
  readonly kind: string;
  readonly at_ms: number;
  readonly turn_start?: boolean | null;
  readonly turn_end_ms?: number | null;
}

export interface Turn {
  /** its first entry's pos: the fold line sits right before it */
  readonly start: number;
  /** when it started (its first entry's time) */
  readonly at: number;
  /** how long it worked, ms; null while it runs */
  readonly ms: number | null;
  /** its thinking rows: what the fold hides */
  readonly hides: readonly number[];
}

/** The kinds that are a turn's work (a turn with none of them has no fold line). */
const WORK: ReadonlySet<string> = new Set(['tools', 'thinking']);

/** The fold line's key: 't:<its turn's first pos>' (never an entry's 'e:', a run's 'r:'). */
export const turnKey = (start: number): string => `t:${String(start)}`;

/**
 * The turns of a thread's rows in order: each from an entry the hub marked as a turn's start to
 * the next one, with its length when an entry carries its end. A turn that did no work (a plain
 * reply) gets none; neither does an older turn whose end the hub never said (a replay): only the
 * last one can still be at work. Pure.
 */
export function turnsOf(order: readonly number[], entry: (pos: number) => TurnEntry | undefined): Turn[] {
  const starts = order.flatMap((pos, i) => (entry(pos)?.turn_start === true ? [i] : []));
  const out: Turn[] = [];
  starts.forEach((s, k) => {
    const end = starts[k + 1] ?? order.length;
    const members = order.slice(s, end);
    const first = entry(members[0] ?? -1);
    if (first === undefined) return;
    const kinds = members.map((pos) => entry(pos));
    if (!kinds.some((e) => e !== undefined && WORK.has(e.kind))) return;
    const ended = kinds.reduce<number | null>((t, e) => (e?.turn_end_ms != null && e.turn_end_ms > 0 ? e.turn_end_ms : t), null);
    const last = k === starts.length - 1;
    if (ended === null && !last) return;
    out.push({
      start: members[0] ?? -1,
      at: first.at_ms,
      ms: ended === null ? null : Math.max(0, ended - first.at_ms),
      hides: members.filter((pos) => entry(pos)?.kind === 'thinking'),
    });
  });
  return out;
}

/** The list's keys with each turn's fold line before its first row, its thinking rows out while it is folded. Pure. */
export function withTurns(keys: readonly string[], turns: readonly Turn[], open: ReadonlySet<number>, key: (pos: number) => string): string[] {
  if (turns.length === 0) return [...keys];
  const lines = new Map(turns.map((t) => [key(t.start), turnKey(t.start)]));
  const hidden = new Set(turns.filter((t) => !open.has(t.start)).flatMap((t) => t.hides.map(key)));
  const out: string[] = [];
  for (const k of keys) {
    const line = lines.get(k);
    if (line !== undefined) out.push(line);
    if (!hidden.has(k)) out.push(k);
  }
  return out;
}

/** A turn's length as the line says it: '4s', '42s', '3m 10s', '1h 5m'. Pure. */
export function turnTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${String(s)}s`;
  if (s < 3600) return `${String(Math.floor(s / 60))}m ${String(s % 60)}s`;
  return `${String(Math.floor(s / 3600))}h ${String(Math.floor((s % 3600) / 60))}m`;
}
