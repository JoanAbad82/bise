// event-wake in the window (designer's page event-wake, ambient-lead m_17770): an agent that waits
// for an event (a background command, a pid, a file, a launchd job) no longer looks idle. Its
// sidebar row says '…' and how long it waits, its head a dim chip '… waiting for cargo test · 2m',
// the thread's end the same live line; when the watch ends, the hub's wake line with its folded
// output. Never the accent: nothing of it waits on him; only a non-zero rc is red. Owner: amb-win.
//
// The words are bise-proto's (rust/proto/src/thread/words.rs: wait_age, watch_label, waiting_for,
// wake_tail), the TUI's too, said here with the same rules (the live age needs the window's clock,
// so it can't come from the hub); wake.test.ts holds words.rs's own examples. A wake line's head
// is the hub's own text (the entry's text is words::wake_head), never rebuilt here. Pure.
import type { Agent, AgentWatch, Entry, WatchKind } from '@/proto';

/** A wait's age, as the row's time and the live line say it: '40s', '2m', '3h', '2d' (words::wait_age). */
export function waitAge(ms: number): string {
  const s = Math.floor(Math.max(0, ms) / 1000);
  if (s < 60) return `${String(s)}s`;
  if (s < 3600) return `${String(Math.floor(s / 60))}m`;
  if (s < 86_400) return `${String(Math.floor(s / 3600))}h`;
  return `${String(Math.floor(s / 86_400))}d`;
}

/** What a watch waits for: 'cargo test', a file's 'build.rc to appear', a note names it itself (words::watch_label). */
export function watchLabel(kind: WatchKind, what: string, noted: boolean): string {
  return kind === 'file' && !noted ? `${what} to appear` : what;
}

/** The live words of an agent that waits: 'waiting for cargo test · 2m', '… and 1 more'; null: none (words::waiting_for). */
export function waitingFor(watching: readonly AgentWatch[], now: number): string | null {
  const first = [...watching].sort((a, b) => a.since_ms - b.since_ms || a.id - b.id)[0];
  if (first === undefined) return null;
  const more = watching.length > 1 ? ` and ${String(watching.length - 1)} more` : '';
  return `waiting for ${watchLabel(first.kind, first.what, first.noted === true)}${more} · ${waitAge(now - first.since_ms)}`;
}

// desktop-status-line (designer's pick A, architect m_22744): the twin of words.rs `wait_when` and
// `waiting_line`'s join, only what the window's clock forces. Both read
// rust/proto/fixtures/wait_words.json (wake.test.ts here, words.rs wait_words_follow_the_fixture).
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
const pad2 = (n: number): string => String(n).padStart(2, '0');

/** This machine's offset at an instant, seconds east of UTC (one per instant, never one for both). */
export const localOffset = (ms: number): number => -new Date(ms).getTimezoneOffset() * 60;

/**
 * How long, or since when, a wait runs (words::wait_when): under an hour 'for 40 s', 'for 12 min'
 * (short: '40s', '12m'); then 'since 04:12' the same local day, 'since mon 23:10' within 6 days,
 * 'since 5 oct 23:10' before (day, then month). A since after now is 'for 0 s'.
 */
export function waitWhen(sinceMs: number, sinceOff: number, nowMs: number, nowOff: number, short: boolean): string {
  const d = Math.floor(Math.max(0, nowMs - sinceMs) / 1000);
  if (d < 60) return short ? `${String(d)}s` : `for ${String(d)} s`;
  if (d < 3600) return short ? `${String(Math.floor(d / 60))}m` : `for ${String(Math.floor(d / 60))} min`;
  const s = Math.floor(sinceMs / 1000) + sinceOff;
  const n = Math.floor(nowMs / 1000) + nowOff;
  const sd = Math.floor(s / 86_400);
  const nd = Math.floor(n / 86_400);
  const sec = s - sd * 86_400;
  const hm = `${pad2(Math.floor(sec / 3600))}:${pad2(Math.floor((sec % 3600) / 60))}`;
  if (sd === nd) return `since ${hm}`;
  // day 0 (1970-01-01) was a thursday
  if (nd - sd <= 6) return `since ${WEEKDAYS[(((sd + 4) % 7) + 7) % 7] ?? ''} ${hm}`;
  const day = new Date(sd * 86_400_000);
  return `since ${String(day.getUTCDate())} ${MONTHS[day.getUTCMonth()] ?? ''} ${hm}`;
}

/** The waiting line in parts (words::waiting_line): its state, the oldest note, ' and N more', the title (every watch). */
export interface WaitLine {
  state: string;
  note: string;
  more: string;
  title: string;
}

/** An agent's waiting line; null: it waits for nothing. `off` gives each instant's offset (localOffset). */
export function waitingLine(watching: readonly AgentWatch[], nowMs: number, short = false, off: (ms: number) => number = localOffset): WaitLine | null {
  const ws = [...watching].sort((a, b) => a.since_ms - b.since_ms || a.id - b.id);
  const first = ws[0];
  if (first === undefined) return null;
  const when = (w: AgentWatch): string => waitWhen(w.since_ms, off(w.since_ms), nowMs, off(nowMs), short);
  const label = (w: AgentWatch): string => watchLabel(w.kind, w.what, w.noted === true);
  return {
    state: `waiting ${when(first)}`,
    note: label(first),
    more: ws.length > 1 ? ` and ${String(ws.length - 1)} more` : '',
    title: ws.map((w) => `${label(w)} · ${when(w)}`).join('\n'),
  };
}

/** The line whole, for a title: 'waiting since 04:12 · cargo test and 1 more'. */
export const waitWords = (l: WaitLine): string => `${l.state} · ${l.note}${l.more}`;

/** The when alone, a row's end ('for 12 min', 'since 04:12'): the same rule as the line's. */
export const waitEnd = (l: WaitLine): string => l.state.replace(/^waiting /u, '');

/**
 * The note as it fits in `avail` px (desktop-status-line A): whole, else cut after a whole word
 * with '…'; under 3 words left, null (the line keeps its state alone). `width` measures a text.
 */
export function fitNote(note: string, avail: number, width: (s: string) => number): string | null {
  if (width(note) <= avail) return note;
  const words = note.split(/\s+/u).filter((x) => x !== '');
  for (let k = words.length - 1; k >= 3; k--) {
    const cut = `${words.slice(0, k).join(' ')}…`;
    if (width(cut) <= avail) return cut;
  }
  return null;
}

/** A wait's words in runs, the digits apart (they go mono): 'since 04:12' → ['since ', '04:12']. */
export function digitRuns(s: string): { text: string; digits: boolean }[] {
  return s
    .split(/(\d[\d:]*)/u)
    .filter((x) => x !== '')
    .map((text) => ({ text, digits: /^\d/u.test(text) }));
}

/** It waits for an event (the TUI's waits_event): a live watch while it is idle (the typed Status has no empty word). */
export function waitsEvent(a: Pick<Agent, 'status'> & { watching?: readonly AgentWatch[] | undefined }): boolean {
  return (a.watching?.length ?? 0) > 0 && a.status === 'idle';
}

/** Since when it waits: its oldest watch's set (ms); none without one. */
export function waitSince(watching: readonly AgentWatch[] | undefined): number | undefined {
  if (watching === undefined || watching.length === 0) return undefined;
  return Math.min(...watching.map((w) => w.since_ms));
}

/** A wake's folded output: 'its last 3 lines', 'its last line'; null without one (words::wake_tail). */
export function wakeTail(lines: number): string | null {
  if (lines <= 0) return null;
  return lines === 1 ? 'its last line' : `its last ${String(lines)} lines`;
}

/**
 * A wake line's head in parts, from the hub's own text ('cargo test ended · rc 101 · after 3m10s'),
 * each with whether it is red (only the 'rc N' part of a non-zero rc), and its mark: '·' when it
 * ended or still runs, '–' when he stopped waiting (stopped, expired). Pure.
 */
export function wakeLine(e: Pick<Entry, 'text' | 'wake'>): { mark: string; parts: { text: string; err: boolean }[] } {
  const w = e.wake;
  const rc = w?.rc;
  const red = rc != null && rc !== 0 ? `rc ${String(rc)}` : null;
  const mark = w?.ev === 'stopped' || w?.ev === 'expired' ? '–' : '·';
  return { mark, parts: e.text.split(' · ').map((t) => ({ text: t, err: t === red })) };
}
