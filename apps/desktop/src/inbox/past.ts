// The inbox screen's list (designer's inbox-history pick A, m_24212 (2)-(6)): what waits on him
// first, then what he answered or what was withdrawn, by day, read-only. Pure: the rows, their
// words, the filters and where a past row goes (his answer in a thread, or the page at its block).
// The records are inbox-record's (the hub's record of an answered or withdrawn item, one per card);
// `InboxRecord` is its draft shape until the generated type lands. Owner: inbox-screen.
import type { Card } from '@/proto';
import { shownName } from '@/agents/model';
import { dayOf, dayWords, timeOf } from '@/artifacts/model';
import { age, titleOf } from './InboxCard';

/** Where he answered: the inbox, an agent's thread, or a page (at a block). */
export type InboxWhere = { kind: 'inbox' } | { kind: 'thread'; agent: string } | { kind: 'page'; page: string; block?: string; url?: string };

/** One answered or withdrawn item (inbox-record's draft shape). */
export interface InboxRecord {
  readonly card: number;
  readonly project: string;
  readonly asker: string;
  readonly kind: string;
  readonly question: string;
  /** its options' words ([]: free text) */
  readonly options: readonly string[];
  readonly state: 'answered' | 'withdrawn';
  /** his words; the option's words when he picked one, never the digit */
  readonly said?: string;
  readonly pick_n?: number;
  readonly where?: InboxWhere;
  readonly reason?: string;
  readonly asked_ms: number;
  readonly at_ms: number;
  /** the thread his answer went in, and its position there */
  readonly thread?: { readonly agent: string; readonly pos: number };
}

export type StateFilter = 'all' | 'waiting' | 'answered' | 'withdrawn';
export const STATES: readonly StateFilter[] = ['all', 'waiting', 'answered', 'withdrawn'];

export interface Filter {
  /** a project id; '' all */
  readonly project: string;
  /** an asker; '' all */
  readonly agent: string;
  readonly state: StateFilter;
  /** words in the question, the asker, the project, his answer or the reason */
  readonly q: string;
}

export const ALL: Filter = { project: '', agent: '', state: 'all', q: '' };

/** A row that waits on him: an open card. */
export interface WaitRow {
  readonly key: string;
  readonly card: Card;
  /** '?' a question or an approval, '¶' a page's item */
  readonly glyph: '?' | '¶';
  readonly title: string;
  readonly question: string;
  readonly project: string;
}

/** A past row: an answered or withdrawn record. */
export interface PastRow {
  readonly key: string;
  readonly r: InboxRecord;
  readonly glyph: '✓' | '–';
}

export interface Day {
  readonly day: string;
  readonly title: string;
  readonly rows: readonly PastRow[];
}

export interface Lists {
  readonly waiting: readonly WaitRow[];
  readonly days: readonly Day[];
  /** every row's key in the order they show (the list keys' order) */
  readonly order: readonly string[];
}

export const waitKey = (c: { project: string; id: number }): string => `w:${c.project}/${String(c.id)}`;
export const pastKey = (r: { project: string; card: number }): string => `p:${r.project}/${String(r.card)}`;

const words = (q: string): string[] => q.toLowerCase().split(/\s+/u).filter((w) => w !== '');
const hasAll = (hay: string, ws: readonly string[]): boolean => {
  const h = hay.toLowerCase();
  return ws.every((w) => h.includes(w));
};

/** The askers he can filter on, from both lists, sorted. Pure. */
export function askersOf(cards: readonly Card[], records: readonly InboxRecord[]): string[] {
  return [...new Set([...cards.map((c) => c.agent), ...records.map((r) => r.asker)])].sort();
}

/** The head's counts: '3 waiting · 41 answered' (withdrawn ones are not 'answered'). Pure. */
export function headWords(cards: readonly Card[], records: readonly InboxRecord[]): string {
  const answered = records.filter((r) => r.state === 'answered').length;
  return `${String(cards.length)} waiting · ${String(answered)} answered`;
}

/** The rows the filter keeps: what waits (in the hub's order, given), then the past by day, newest first. Pure. */
export function listsOf(cards: readonly Card[], records: readonly InboxRecord[], names: Readonly<Record<string, string>>, f: Filter, now: number): Lists {
  const ws = words(f.q);
  const pname = (p: string) => names[p] ?? p;
  const keepWait = f.state === 'all' || f.state === 'waiting';
  const waiting: WaitRow[] = keepWait
    ? cards
        .filter((c) => (f.project === '' || c.project === f.project) && (f.agent === '' || c.agent === f.agent))
        .filter((c) => ws.length === 0 || hasAll(`${c.question} ${shownName(c.agent)} ${c.agent} ${pname(c.project)}`, ws))
        .map((c) => ({ key: waitKey(c), card: c, glyph: c.page != null ? '¶' : '?', title: shownName(c.agent), question: c.question, project: c.project }))
    : [];
  const past = records
    .filter((r) => f.state === 'all' || f.state === r.state)
    .filter((r) => (f.project === '' || r.project === f.project) && (f.agent === '' || r.asker === f.agent))
    .filter((r) => ws.length === 0 || hasAll(`${r.question} ${shownName(r.asker)} ${r.asker} ${pname(r.project)} ${r.said ?? ''} ${r.reason ?? ''}`, ws))
    .slice()
    .sort((a, b) => b.at_ms - a.at_ms || b.card - a.card);
  const days: Day[] = [];
  for (const r of past) {
    const d = dayOf(r.at_ms);
    const row: PastRow = { key: pastKey(r), r, glyph: r.state === 'answered' ? '✓' : '–' };
    const last = days[days.length - 1];
    if (last !== undefined && last.day === d) (last.rows as PastRow[]).push(row);
    else days.push({ day: d, title: dayWords(r.at_ms, now), rows: [row] });
  }
  return { waiting, days, order: [...waiting.map((w) => w.key), ...days.flatMap((d) => d.rows.map((r) => r.key))] };
}

/** Where he gave it: 'in the inbox', 'on a page', "in perf's thread". Pure. */
export function whereWords(w: InboxWhere | undefined): string {
  if (w === undefined) return '';
  switch (w.kind) {
    case 'inbox':
      return 'in the inbox';
    case 'page':
      return 'on a page';
    case 'thread':
      return `in ${shownName(w.agent)}'s thread`;
  }
}

/** His answer in words: what he wrote, else the picked option's words; never the digit. Pure. */
export function saidWords(r: InboxRecord): string {
  if (r.said !== undefined && r.said.trim() !== '' && !/^\d+$/u.test(r.said.trim())) return r.said.trim();
  const opt = r.pick_n === undefined ? undefined : r.options[r.pick_n - 1];
  return opt ?? r.said?.trim() ?? '';
}

/**
 * A past row's second line: 'you: only for Safari 16 · in the inbox', or 'withdrawn: <reason>'.
 * `narrow` (800): the 'where' goes, the detail keeps it. Pure.
 */
export function lineTwo(r: InboxRecord, narrow = false): string {
  if (r.state === 'withdrawn') return r.reason !== undefined && r.reason !== '' ? `withdrawn: ${r.reason}` : 'withdrawn';
  const where = narrow ? '' : whereWords(r.where);
  return where === '' ? `you: ${saidWords(r)}` : `you: ${saidWords(r)} · ${where}`;
}

/** A row's right column: 'storefront · 14:02' (the project left out when narrow and it is the one in view). Pure. */
export function endWords(project: string, ms: number, names: Readonly<Record<string, string>>, narrow: boolean, here: string | null): string {
  const t = timeOf(ms);
  if (narrow && (here === null || here === project)) return t;
  return `${names[project] ?? project} · ${t}`;
}

/** A waiting row's right column: 'storefront · 12 min', 'bise · page · 1 d'. Pure. */
export function waitEnd(w: WaitRow, names: Readonly<Record<string, string>>, now: number, narrow: boolean): string {
  const a = age(now - w.card.since_ms);
  if (narrow) return a;
  const p = names[w.project] ?? w.project;
  return w.glyph === '¶' ? `${p} · page · ${a}` : `${p} · ${a}`;
}

/** A waiting row's words: the card's title ('perf asks', 'merge #381?') is the asker's, the question after. */
export const waitTitle = (w: WaitRow): string => titleOf(w.card);

/**
 * Where a past row goes (his ask, m_24212 (5)): a page answer opens the page at its block; else
 * the thread that received his answer, at his answer. A withdrawn item has no answer: the asker's
 * thread. Pure.
 */
export type Jump =
  | { kind: 'thread'; project: string; agent: string; card: number; pos?: number }
  | { kind: 'page'; project: string; page: string; block?: string; url?: string };

export function jumpOf(r: InboxRecord): Jump {
  const w = r.where;
  if (r.state === 'answered' && w?.kind === 'page') {
    return { kind: 'page', project: r.project, page: w.page, ...(w.block === undefined ? {} : { block: w.block }), ...(w.url === undefined ? {} : { url: w.url }) };
  }
  const agent = r.thread?.agent ?? (w?.kind === 'thread' ? w.agent : r.asker);
  return { kind: 'thread', project: r.project, agent, card: r.card, ...(r.thread === undefined ? {} : { pos: r.thread.pos }) };
}

/** The jump's words, for the detail's link: "open it in perf's thread", 'open the page'. Pure. */
export function jumpWords(j: Jump): string {
  return j.kind === 'page' ? 'open the page at your answer' : `open it in ${shownName(j.agent)}'s thread`;
}

/** The detail's 'where and when': 'you answered in the inbox · 14:02'. Pure. */
export function whenWhere(r: InboxRecord, now: number): string {
  const when = dayWords(r.at_ms, now) === 'today' ? timeOf(r.at_ms) : `${dayWords(r.at_ms, now)} ${timeOf(r.at_ms)}`;
  if (r.state === 'withdrawn') return `withdrawn · ${when}`;
  const where = whereWords(r.where);
  return where === '' ? `you answered · ${when}` : `you answered ${where} · ${when}`;
}

/** Merge each project's records (each hub's own list), one per card, newest first. Pure. */
export function mergeRecords(lists: readonly (readonly InboxRecord[])[]): InboxRecord[] {
  const by = new Map<string, InboxRecord>();
  for (const l of lists) for (const r of l) by.set(pastKey(r), r);
  return [...by.values()].sort((a, b) => b.at_ms - a.at_ms || b.card - a.card);
}
