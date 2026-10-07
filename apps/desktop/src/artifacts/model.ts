// What his agents made (desktop-screens v6 'artifacts', designer m_11837; the TUI's
// artifacts_screen.rs words): the rows across his projects, their kind's glyph and words, the day
// groups, the filters. Pure. Owner: amb-kit.
import type { Artifact } from '@/proto';

/** One artifact with the project it belongs to (the artifacts event is per project). */
export interface Item {
  readonly project: string;
  /** the project's name as the sidebar says it */
  readonly projectName: string;
  readonly a: Artifact;
}

export type KindFilter = 'page' | 'file' | 'pr' | 'shots';
export const KIND_FILTERS: readonly { id: KindFilter; label: string }[] = [
  { id: 'page', label: 'pages' },
  { id: 'file', label: 'files' },
  { id: 'pr', label: 'PRs' },
  { id: 'shots', label: 'shots' },
];

/** The kind the filters and glyphs know ('shot', 'image' read as shots; a link as a page). */
export function kindOf(kind: string): KindFilter {
  const k = kind.toLowerCase();
  if (k === 'pr') return 'pr';
  if (k === 'shot' || k === 'shots' || k === 'image' || k === 'png') return 'shots';
  if (k === 'page' || k === 'link' || k === 'site' || k === 'url') return 'page';
  return 'file';
}

/** The row's glyph, mono: ↗ page, ▤ file, ⇡ PR, ◫ shots. */
export function glyphOf(kind: string): string {
  return { page: '↗', file: '▤', pr: '⇡', shots: '◫' }[kindOf(kind)];
}

/** The kind column: 'page · v2', 'file', 'PR', 'shots' (a version only from v2). */
export function kindWords(a: Artifact): string {
  const k = kindOf(a.kind);
  const word = k === 'pr' ? 'PR' : k === 'shots' ? 'shots' : k;
  return a.version > 1 ? `${word} · v${String(a.version)}` : word;
}

/** Who made it, where: 'perf · storefront' (the project left out when the list is one project's). */
export function madeBy(it: Item, withProject = true): string {
  return withProject && it.projectName !== '' ? `${it.a.agent} · ${it.projectName}` : it.a.agent;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** The local day of a time, as 'YYYY-MM-DD'. */
export function dayOf(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** A day's group title (ambient's day separators): 'today', 'yesterday', else 'sun 5 oct'. */
export function dayWords(ms: number, now: number): string {
  if (dayOf(ms) === dayOf(now)) return 'today';
  if (dayOf(ms) === dayOf(now - 86_400_000)) return 'yesterday';
  const d = new Date(ms);
  return `${DAYS[d.getDay()] ?? ''} ${String(d.getDate())} ${MONTHS[d.getMonth()] ?? ''}`;
}

/** A row's time, '16:02': its day group already says the day. */
export function timeOf(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** A time out of any day group (the open header, the versions): '14:02' today, else 'yesterday 14:02', 'sun 5 oct 14:02'. */
export function whenWords(ms: number, now: number): string {
  const day = dayWords(ms, now);
  return day === 'today' ? timeOf(ms) : `${day} ${timeOf(ms)}`;
}

export interface Filter {
  /** a project id; '' all */
  project: string;
  /** an agent's name; '' all */
  agent: string;
  /** the kinds shown; empty: all */
  kinds: readonly KindFilter[];
  /** words in the title, the agent or the project */
  q: string;
}

export const ALL: Filter = { project: '', agent: '', kinds: [], q: '' };

/** The items the filter keeps, newest first. */
export function filterItems(items: readonly Item[], f: Filter): Item[] {
  const words = f.q.toLowerCase().split(/\s+/).filter((w) => w !== '');
  return items
    .filter((it) => f.project === '' || it.project === f.project)
    .filter((it) => f.agent === '' || it.a.agent === f.agent)
    .filter((it) => f.kinds.length === 0 || f.kinds.includes(kindOf(it.a.kind)))
    .filter((it) => {
      const hay = `${it.a.title} ${it.a.agent} ${it.projectName}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    })
    .sort((x, y) => y.a.at_ms - x.a.at_ms);
}

/** The items by day, newest day first: [{title, items}]. */
export function byDay(items: readonly Item[], now: number): { day: string; title: string; items: Item[] }[] {
  const out: { day: string; title: string; items: Item[] }[] = [];
  for (const it of items) {
    const day = dayOf(it.a.at_ms);
    const last = out.at(-1);
    if (last?.day === day) last.items.push(it);
    else out.push({ day, title: dayWords(it.a.at_ms, now), items: [it] });
  }
  return out;
}

/** The agents of the items, by name, for the 'all agents ⌄' menu. */
export function agentsOf(items: readonly Item[]): string[] {
  return [...new Set(items.map((it) => it.a.agent).filter((a) => a !== ''))].sort();
}

/** The key of an item (its project and id): the route's and the list's. */
export const keyOf = (it: Item): string => `${it.project}/${it.a.id}`;

/**
 * What amb-feed adds to the artifact row (m_11959): its file on disk, and each version's time and
 * print-only note. Read as optional until bise-proto's TS has them; absent, the menus hide.
 */
interface Coming {
  readonly path?: string | null;
  readonly versions?: readonly { readonly v: number; readonly at_ms?: number; readonly note?: string | null }[] | null;
}

/** The artifact's file on disk (show in Finder, quick look), else null. Pure. */
export function pathOf(a: Artifact): string | null {
  const p = (a as Artifact & Coming).path;
  return typeof p === 'string' && p !== '' ? p : null;
}

/** The versions popover's rows, newest first: 'v2  the current one  14:02', 'v1  <its note>  13:20'. */
export function versions(a: Artifact, now = Date.now()): { v: number; words: string; when?: string }[] {
  const known = (a as Artifact & Coming).versions ?? [];
  return Array.from({ length: Math.max(1, a.version) }, (_, i) => {
    const v = Math.max(1, a.version) - i;
    const k = known.find((x) => x.v === v);
    const at = k?.at_ms ?? (i === 0 ? a.at_ms : undefined);
    const words = i === 0 ? 'the current one' : (k?.note ?? '');
    return k === undefined && i > 0 ? { v, words } : { v, words, ...(at === undefined ? {} : { when: whenWords(at, now) }) };
  });
}
