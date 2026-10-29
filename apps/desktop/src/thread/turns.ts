// A turn's fold (bise fait mac, mockup 1, QA §4): 'worked for 3m 10s ›' on the first row of each turn
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
  /** its first entry's pos: the fold line's row while it is open */
  readonly start: number;
  /** its first row that stays while it is folded: the fold line's row then (its start when every row is thinking) */
  readonly first: number;
  /** when it started (its first entry's time) */
  readonly at: number;
  /** how long it worked, ms; null while it runs */
  readonly ms: number | null;
  /** its thinking rows: what the fold hides */
  readonly hides: readonly number[];
}

/** The kinds that are a turn's work (a turn with none of them has no fold line). */
const WORK: ReadonlySet<string> = new Set(['tools', 'thinking']);

/**
 * The turns of a thread's rows in order: each from an entry the hub marked as a turn's start to
 * the next one, with its length when an entry carries its end. A turn that did no work (a plain
 * reply) gets none; neither does an older turn whose end the hub never said (a replay), nor one
 * that took under a second ('worked for 0s' reads as a bug: ui-review m_43792): only the last one
 * can still be at work. Pure.
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
    const ms = ended === null ? null : Math.max(0, ended - first.at_ms);
    if (ms !== null && ms < 1000) return;
    const thinking = members.filter((pos) => entry(pos)?.kind === 'thinking');
    const stays = members.find((pos) => !thinking.includes(pos));
    const start = members[0] ?? -1;
    out.push({ start, first: stays ?? start, at: first.at_ms, ms, hides: stays === undefined ? thinking.slice(1) : thinking });
  });
  return out;
}

/** The list's keys without the thinking rows of the turns folded. Pure. */
export function withTurns(keys: readonly string[], turns: readonly Turn[], open: ReadonlySet<number>, key: (pos: number) => string): string[] {
  const hidden = new Set(turns.filter((t) => !open.has(t.start)).flatMap((t) => t.hides.map(key)));
  return hidden.size === 0 ? [...keys] : keys.filter((k) => !hidden.has(k));
}

/**
 * The row each turn's fold line sits on, under that row's day and pause lines (a line before the
 * day read as the day's: ui-review's shot): the turn's start while open, its first row that stays
 * while folded. Pure.
 */
export function turnLines(turns: readonly Turn[], open: ReadonlySet<number>): Map<number, Turn> {
  return new Map(turns.map((t) => [open.has(t.start) ? t.start : t.first, t]));
}

/** A turn's length as the line says it: '4s', '42s', '3m 10s', '1h 5m'. Pure. */
export function turnTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${String(s)}s`;
  if (s < 3600) return `${String(Math.floor(s / 60))}m ${String(s % 60)}s`;
  return `${String(Math.floor(s / 3600))}h ${String(Math.floor((s % 3600) / 60))}m`;
}
