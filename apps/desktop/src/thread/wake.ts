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
