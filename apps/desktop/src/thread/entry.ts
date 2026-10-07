// What a thread row shows of an entry (the hub folds the transcript; this
// only picks words and the ds part). Owner: amb-win. Pure.
import type { Entry } from '@/proto';

/** A row's key in the thread list: an entry by its pos, a send not confirmed by its cid. */
export const entryKey = (pos: number) => `e:${pos}`;
export const pendingKey = (cid: string) => `p:${cid}`;

/** The pos of an entry key, else undefined. */
export function posOfKey(key: string): number | undefined {
  if (!key.startsWith('e:')) return undefined;
  const n = Number(key.slice(2));
  return Number.isSafeInteger(n) ? n : undefined;
}

/** "14:05" in his time zone. */
export function clock(ms: number, tz?: string): string {
  if (ms <= 0) return '';
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(ms);
}

/**
 * A turn's time on hover (M14, the TUI's BISE-271): '14:05' today, '12 Oct 14:05' an
 * older day, '' without a time. Pure (`now` and `tz` given).
 */
export function whenOf(ms: number, now: number, tz?: string): string {
  if (ms <= 0) return '';
  const day = (t: number) => new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz }).format(t);
  if (day(ms) === day(now)) return clock(ms, tz);
  const d = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: tz }).format(ms);
  return `${d} ${clock(ms, tz)}`;
}

/** An agent's name as shown: main is 'bise' (agents/model shownName, kept local: entry.ts stays pure of the agents module). */
const shown = (agent: string): string => (agent === 'main' ? 'bise' : agent);

/** Who speaks in a message row: his words, the shown agent's (bise's pearl on bise's main), another agent's. */
export function whoOf(e: Entry, ctx: { agent: string; bise: boolean }): { from: 'you' | 'bise' | 'agent'; name: string; indent: boolean } {
  switch (e.kind) {
    case 'you':
      return { from: 'you', name: 'you', indent: false };
    case 'from_agent':
      // batch 3a: a message between two other agents says to whom ('perf → docs')
    {
      // a project's main is 'bise' in every name the window shows (ambient m_11437)
      const from = shown(e.from ?? 'an agent');
      return { from: 'agent', name: e.to != null && e.to !== '' && e.to !== ctx.agent ? `${from} → ${shown(e.to)}` : from, indent: true };
    }
    default:
      return ctx.bise && ctx.agent === 'main' ? { from: 'bise', name: 'bise', indent: false } : { from: 'agent', name: shown(ctx.agent), indent: false };
  }
}

/** The text ⌘F searches in an entry: its words, plus a tools entry's steps and a card's options. */
export function findText(e: Entry): string {
  const parts = [e.text];
  if (e.tools) for (const t of e.tools.items) parts.push(t.text);
  if (e.card) {
    parts.push(e.card.question);
    for (const o of e.card.options) parts.push(o.label);
  }
  if (e.page) parts.push(e.page.title);
  return parts.join('\n');
}

// ---- the thread's reading (ambient's spec m_11777, his try round 3; amb-home)

/** A name line opens a group when the author changes or after this much silence. */
export const GROUP_GAP_MS = 5 * 60_000;

/** The day a time falls on, in his time zone ('2026-10-06'). */
function dayOf(ms: number, tz?: string): string {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz }).format(ms);
}

/** Two times on the same day (a time of 0 is never a new day). */
export function sameDay(a: number, b: number, tz?: string): boolean {
  return a <= 0 || b <= 0 || dayOf(a, tz) === dayOf(b, tz);
}

/** The day separator's words: 'today', 'yesterday', 'mon 6 oct'. Pure. */
export function dayLabel(ms: number, now: number, tz?: string): string {
  if (sameDay(ms, now, tz)) return 'today';
  if (sameDay(ms, now - 86_400_000, tz)) return 'yesterday';
  const f = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz }).formatToParts(ms);
  const part = (t: string) => f.find((p) => p.type === t)?.value ?? '';
  return `${part('weekday')} ${part('day')} ${part('month')}`.toLowerCase();
}

/** Under this a thinking shows nothing (ambient m_11777 (c), the TUI's: nothing was thought). */
export const THOUGHT_MS = 1000;

/** A thinking row with nothing in it: under 1 s, no words of its own (or the hub's 'thought for 0.0s'). Pure. */
export function thoughtNothing(e: Entry): boolean {
  return e.kind === 'thinking' && (e.thinking?.ms ?? 0) < THOUGHT_MS && (e.text === '' || /^thought for 0(\.\d+)?s$/.test(e.text));
}

/** Who a row is by, for its group: his words, another agent's, the agent's own words and work; none: a line of the thread's own (a notice, a news line, a separator, a hidden thinking) that opens nothing, so the next message shows its name. */
export function authorOf(e: Entry, ctx: { agent: string; bise: boolean }): string | null {
  if (thoughtNothing(e)) return null;
  switch (e.kind) {
    case 'you':
      return 'you';
    case 'from_agent':
      return `from:${e.from ?? ''}:${e.to ?? ''}`;
    case 'to_agent':
      return `to:${e.to ?? ''}`;
    case 'notice':
    case 'compacting':
    case 'compacted':
    case 'not_delivered':
    case 'unknown':
    case 'card':
    case 'page':
    case 'report':
    case 'stopped':
    case 'landed':
    case 'pr':
    case 'artifact':
    case 'answered':
    case 'approval':
    case 'scheduled':
      return null;
    default:
      return `agent:${ctx.agent}`;
  }
}

/** The row opens a group (its name line shows): a new author, 5 min of silence, a new day, or no row before it. Pure. */
export function groupHead(prev: Entry | undefined, e: Entry, ctx: { agent: string; bise: boolean }, tz?: string): boolean {
  const a = authorOf(e, ctx);
  if (prev === undefined || a === null) return true;
  if (authorOf(prev, ctx) !== a) return true;
  if (e.at_ms > 0 && prev.at_ms > 0 && e.at_ms - prev.at_ms > GROUP_GAP_MS) return true;
  return !sameDay(prev.at_ms, e.at_ms, tz);
}

const CONTEXT_BLOCK = /\n*<screen_context\b[^>]*>[\s\S]*?<\/screen_context>\s*/g;

/** His words without the fn context block the hub appended (the window shows a chip instead). Pure. */
export function stripContext(text: string): string {
  return text.replace(CONTEXT_BLOCK, '\n').trim();
}

/** The fn context chip: 'with Chrome · localhost:4801/sett…' (the app and the host whole, the path cut), what a click opens, and the other sources counted. Pure. */
export function chipOf(c: { app?: string | null; url?: string | null; title?: string | null; file?: string | null; shot?: string | null }): {
  label: string;
  open: { url: string } | { file: string } | null;
  tip: string | undefined;
} | null {
  const app = c.app ?? '';
  const sources: { what: string; open: { url: string } | { file: string } | null }[] = [];
  if (c.url) {
    const m = /^[a-z]+:\/\/([^/?#]+)(.*)$/i.exec(c.url);
    const host = m?.[1] ?? c.url;
    const rest = m?.[2] ?? '';
    const path = rest.length > 6 ? `${rest.slice(0, 5)}…` : rest;
    sources.push({ what: `${host}${path}`, open: { url: c.url } });
  }
  if (c.file) {
    const name = c.file.split('/').pop() ?? c.file;
    sources.push({ what: name.length > 24 ? `${name.slice(0, 23)}…` : name, open: { file: c.file } });
  }
  if (sources.length === 0 && c.title) sources.push({ what: c.title.length > 28 ? `${c.title.slice(0, 27)}…` : c.title, open: null });
  if (app === '' && sources.length === 0 && !c.shot) return null;
  const first = sources[0];
  const more = sources.length > 1 ? ` +${String(sources.length - 1)}` : '';
  const label = `◫ with ${app || 'the screen'}${first ? ` · ${first.what}` : ''}${more}`;
  const shotOnly = sources.length === 0 && Boolean(c.shot);
  return { label, open: first?.open ?? null, tip: shotOnly ? "the screenshot isn't kept" : undefined };
}

/** His agents often start with their own name ('perf: the parsed copy…'): the name line already
 *  says it, so the row drops that prefix (ambient m_11934). Pure. */
export function dropAuthor(text: string, name: string): string {
  if (name === '' || !text.startsWith(`${name}:`)) return text;
  return text.slice(name.length + 1).trimStart();
}

// ---- the agent view's tool rows (designer's desktop-screens v6 (2); amb-home)

/** A step's length, as designer's rows say it: '38 s', '1 m 12 s', '2 m'. Under 1 s: none. Pure. */
export function stepTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 1) return '';
  if (s < 60) return `${String(s)} s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r === 0 ? `${String(m)} m` : `${String(m)} m ${String(r)} s`;
}

/** At most this many command and edit lines show; the rest fold into the counted line. */
export const TOOL_LINES = 6;

/** A turn's tools: its commands ('$ …') and edits ('± …') as lines with their length (until the next step), and the counted words of the rest ('read 6 files'), which fold. Pure. */
export function toolLines(items: readonly { pos: number; at_ms: number; text: string; kind: string }[]): {
  lines: { pos: number; mark: '$' | '±'; text: string; time: string }[];
  rest: { pos: number; text: string }[];
  restWords: string;
} {
  const lines: { pos: number; mark: '$' | '±'; text: string; time: string }[] = [];
  const rest: { pos: number; text: string }[] = [];
  items.forEach((t, i) => {
    const next = items[i + 1];
    const time = next !== undefined && t.at_ms > 0 && next.at_ms > t.at_ms ? stepTime(next.at_ms - t.at_ms) : '';
    if ((t.kind === 'run' || t.kind === 'edit') && lines.length < TOOL_LINES) lines.push({ pos: t.pos, mark: t.kind === 'run' ? '$' : '±', text: t.text, time });
    else rest.push({ pos: t.pos, text: t.text });
  });
  const n = (k: string) => items.filter((t) => t.kind === k).length;
  const shownRun = lines.filter((l) => l.mark === '$').length;
  const shownEdit = lines.length - shownRun;
  const files = (x: number) => (x === 1 ? '1 file' : `${String(x)} files`);
  const parts: string[] = [];
  if (n('read') > 0) parts.push(`read ${files(n('read'))}`);
  if (n('edit') - shownEdit > 0) parts.push(`edited ${files(n('edit') - shownEdit)}`);
  if (n('run') - shownRun > 0) parts.push(`ran ${n('run') - shownRun === 1 ? '1 command' : `${String(n('run') - shownRun)} commands`}`);
  if (n('search') > 0) parts.push(`searched ${n('search') === 1 ? 'once' : `${String(n('search'))} times`}`);
  if (n('other') > 0) parts.push(`${String(n('other'))} other ${n('other') === 1 ? 'step' : 'steps'}`);
  return { lines, rest, restWords: parts.join(', ') };
}
