// How an agent's waits read in the window (designer's agent-waiting-states, his pick A): two
// families, the hub says which (AgentWatch.resumes). A pause: its turn ended and it continues when
// a command ends or another agent answers; the line over the composer says it ('continues when
// cargo bench ends · running for 3 min'), the head chip and the right bar's row its duration. An
// alarm: the agent is free (idle), bise wakes it if the event comes; only the right bar's
// 'scheduled & watching' says it ('◌ main · if the nightly gate goes red · until 08:07'). The time
// rule: what runs now is a duration, what's ahead a clock, a past clock only on hover and relative.
// Never the accent: nothing of it waits on him; only a non-zero rc is red. Owner: amb-win.
//
// The words are bise-proto's (rust/proto/src/thread/words.rs: wait_len, clock_ahead, clock_past,
// watch_event, pause_line, alarms), the TUI's too, said here with the same rules (the live age
// needs the window's clock, so it can't come from the hub); both read
// rust/proto/fixtures/wait_words.json (wake.test.ts here, words.rs wait_words_follow_the_fixture).
// A wake line's head is the hub's own text (the entry's text is words::wake_head). Pure.
import type { Agent, AgentWatch, Entry, WatchKind } from '@/proto';

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
const pad2 = (n: number): string => String(n).padStart(2, '0');

/** This machine's offset at an instant, seconds east of UTC (one per instant, never one for both). */
export const localOffset = (ms: number): number => -new Date(ms).getTimezoneOffset() * 60;

/** How long something that runs now has run: '40 s', '3 min', '2 h', '2 d' (short: '40s', '3m'...) (words::wait_len). */
export function waitLen(ms: number, short = false): string {
  const s = Math.floor(Math.max(0, ms) / 1000);
  const [n, unit, tight] = s < 60 ? [s, 's', 's'] : s < 3600 ? [Math.floor(s / 60), 'min', 'm'] : s < 86_400 ? [Math.floor(s / 3600), 'h', 'h'] : [Math.floor(s / 86_400), 'd', 'd'];
  return short ? `${String(n)}${tight}` : `${String(n)} ${unit}`;
}

/** An instant on the local clock: its day number and '08:07'. */
function localDay(ms: number, off: number): [number, string] {
  const s = Math.floor(ms / 1000) + off;
  const day = Math.floor(s / 86_400);
  const sec = s - day * 86_400;
  return [day, `${pad2(Math.floor(sec / 3600))}:${pad2(Math.floor((sec % 3600) / 60))}`];
}

/** A day out of the near ones: its weekday within 6 days, else its date, day then month. */
function farDay(day: number, gap: number, hm: string): string {
  // day 0 (1970-01-01) was a thursday
  if (gap <= 6) return `${WEEKDAYS[(((day + 4) % 7) + 7) % 7] ?? ''} ${hm}`;
  const d = new Date(day * 86_400_000);
  return `${String(d.getUTCDate())} ${MONTHS[d.getUTCMonth()] ?? ''} ${hm}`;
}

/** What's ahead, the clock part alone: '08:07', 'tomorrow 08:07', 'fri 08:07', '5 oct 08:07' (words::clock_ahead). */
export function clockAhead(atMs: number, atOff: number, nowMs: number, nowOff: number): string {
  const [ad, hm] = localDay(atMs, atOff);
  const gap = ad - localDay(nowMs, nowOff)[0];
  if (gap <= 0) return hm;
  if (gap === 1) return `tomorrow ${hm}`;
  return farDay(ad, gap, hm);
}

/** A past clock, hover only: 'at 08:07' today, 'yesterday 08:07', 'tue 08:07', '5 oct 08:07' (words::clock_past). */
export function clockPast(atMs: number, atOff: number, nowMs: number, nowOff: number): string {
  const [ad, hm] = localDay(atMs, atOff);
  const gap = localDay(nowMs, nowOff)[0] - ad;
  if (gap <= 0) return `at ${hm}`;
  if (gap === 1) return `yesterday ${hm}`;
  return farDay(ad, gap, hm);
}

/** What a watch waits for, after 'continues when' / 'if': 'cargo bench ends', 'build.rc appears', a note as is (words::watch_event). */
export function watchEvent(kind: WatchKind, what: string, noted: boolean): string {
  if (noted) return what;
  if (kind === 'reply') return `${what} answers`;
  return kind === 'file' ? `${what} appears` : `${what} ends`;
}

/**
 * A pause's line in parts (words::PauseLine): 'continues when' (whole), the note (the part that
 * cuts), who it waits on (its name opens it; '' for a watch), ' and 1 more', the duration after
 * ' · ' (whole), the bare duration (the head chip, the right bar), the title (every pause).
 */
export interface PauseLine {
  state: string;
  note: string;
  who: string;
  more: string;
  dur: string;
  len: string;
  title: string;
}

type Waits = Pick<Agent, 'status' | 'since_ms'> & { waiting_on?: Agent['waiting_on']; watching?: readonly AgentWatch[] | undefined };

/** An agent's pause line; null: nothing it continues on (an alarm is no pause) (words::pause_line). */
export function pauseLine(a: Waits, nowMs: number, short = false): PauseLine | null {
  const state = 'continues when';
  if (a.waiting_on?.who === 'agent') {
    // held again on a reply an earlier hold left pending (ask-wait): counted from the ask
    const name = a.waiting_on.name;
    const asked = (a.watching ?? []).filter((w) => w.kind === 'reply' && w.what === name).map((w) => w.since_ms);
    const len = waitLen(nowMs - Math.min(a.since_ms, ...asked), short);
    const note = `${name} answers`;
    return { state, note, who: name, more: '', dur: len, len, title: `${state} ${note} · ${len}` };
  }
  if (a.status !== 'idle') return null;
  const ws = (a.watching ?? []).filter((w) => w.resumes === true).sort((x, y) => x.since_ms - y.since_ms || x.id - y.id);
  const first = ws[0];
  if (first === undefined) return null;
  const len = (w: AgentWatch): string => waitLen(nowMs - w.since_ms, short);
  const dur = (w: AgentWatch): string =>
    short || w.kind === 'reply' ? len(w) : w.kind === 'bg' || w.kind === 'pid' ? `running for ${len(w)}` : `for ${len(w)}`;
  const event = (w: AgentWatch): string => watchEvent(w.kind, w.what, w.noted === true);
  return {
    state,
    note: event(first),
    who: first.kind === 'reply' ? first.what : '',
    more: ws.length > 1 ? ` and ${String(ws.length - 1)} more` : '',
    dur: dur(first),
    len: len(first),
    title: ws.map((w) => `${state} ${event(w)} · ${dur(w)}`).join('\n'),
  };
}

/** It is paused: a pause line shows over its composer. */
export const paused = (a: Waits): boolean => pauseLine(a, 0) !== null;

/** Its pause reads in seconds at `now` ('· 12 s'): its reader needs the window's second clock (clock.ts useNowFor). */
export const pauseInSeconds = (a: Waits, now: number): boolean => /\ds$/.test(pauseLine(a, now, true)?.len ?? '');

/** An alarm (words::Alarm): 'if <event>', when it stops watching (the clock alone, '' unknown), the hover. */
export interface Alarm {
  id: number;
  note: string;
  end: string;
  title: string;
}

/** An agent's alarms, oldest first, whatever its status. `off` gives each instant's offset (words::alarms). */
export function alarms(a: Pick<Agent, 'name'> & { watching?: readonly AgentWatch[] | undefined }, nowMs: number, off: (ms: number) => number = localOffset): Alarm[] {
  return (a.watching ?? [])
    .filter((w) => w.resumes !== true)
    .sort((x, y) => x.since_ms - y.since_ms || x.id - y.id)
    .map((w) => {
      const event = watchEvent(w.kind, w.what, w.noted === true);
      const set = clockPast(w.since_ms, off(w.since_ms), nowMs, off(nowMs));
      const end = w.until_ms == null ? '' : clockAhead(w.until_ms, off(w.until_ms), nowMs, off(nowMs));
      let title = `bise wakes ${a.name} if ${event} · set ${set}`;
      if (end !== '') {
        // 'at 08:07', 'tomorrow at 08:07', 'fri at 08:07' (designer m_23038)
        const cut = end.lastIndexOf(' ');
        title += ` · stops watching ${cut < 0 ? `at ${end}` : `${end.slice(0, cut)} at ${end.slice(cut + 1)}`}`;
      }
      return { id: w.id, note: `if ${event}`, end, title };
    });
}

/**
 * A note as it fits in `avail` px: whole, else cut after a whole word with '…'; under 3 words
 * left, null (the line keeps its whole parts alone). `width` measures a text.
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

/** A wait's words in runs, the digits apart (they go mono): 'running for 3 min' → ['running for ', '3', ' min']. */
export function digitRuns(s: string): { text: string; digits: boolean }[] {
  return s
    .split(/(\d[\d:]*)/u)
    .filter((x) => x !== '')
    .map((text) => ({ text, digits: /^\d/u.test(text) }));
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
