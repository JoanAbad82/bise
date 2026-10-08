// One search for the app (lead m_11844, designer's signed block s-k on desktop-screens v7): the
// window's ⌘K and the bar's spotlight find things with the same rules, so a word finds the same
// agent in both. Pure (`now` given).
//
// Sources: every agent of every project, archived ones too; the artifacts; the scheduled tasks.
// With a query: a group per kind (agents, artifacts, scheduled), each word of the query matching one
// of a thing's fields; the name's start first, then a word's start, then anywhere in the name, then
// what it is about, then its project; an archived agent always after the live ones. Without one:
// 'waiting for you' (the agents with a question for him), then 'recent' (agents, a project's bise,
// artifacts, scheduled, mixed by recency).
// The inputs are this module's own view types: the screen maps the store's (generated) shapes to
// them, so a protocol change doesn't reach the rules.

export type AgentStatus = 'waiting' | 'blocked' | 'working' | 'idle' | 'done' | 'failed';

export interface SearchProject {
  readonly id: string;
  readonly name: string;
  /** bise's home: its main is just 'bise' */
  readonly home?: boolean;
}

export interface SearchAgent {
  readonly project: string;
  readonly name: string;
  readonly main: boolean;
  readonly archived: boolean;
  readonly status: AgentStatus;
  readonly title: string;
  readonly purpose?: string;
  /** cards waiting on him */
  readonly waits: number;
  /** since when it has this status */
  readonly since_ms: number;
  /** its question for him, when it waits (the first open card's words) */
  readonly ask?: string;
  /** a project's bise: its agents at work */
  readonly atWork?: number;
}

export interface SearchArtifact {
  readonly project: string;
  readonly id: string;
  readonly title: string;
  /** page, file, image, pr, link... */
  readonly kind: string;
  /** 'page · v2', '2 shots', 'PR · merged' */
  readonly what: string;
  readonly agent: string;
  readonly at_ms: number;
}

/** A live scheduled task (`sb every`), as amb-feed's typed list carries it. */
export interface SearchScheduled {
  readonly project: string;
  readonly id: number;
  /** the agent it wakes */
  readonly agent: string;
  readonly words: string;
  /** '30 min', 'day 07:30' */
  readonly every: string;
  readonly next_ms?: number;
  /** when it was set or last ran (its place in 'recent') */
  readonly at_ms?: number;
}

export interface SearchData {
  readonly projects: readonly SearchProject[];
  readonly agents: readonly SearchAgent[];
  readonly artifacts: readonly SearchArtifact[];
  readonly scheduled: readonly SearchScheduled[];
}

export type Scope = 'all' | 'agents' | 'artifacts' | 'scheduled';
export const SCOPES: readonly Scope[] = ['all', 'agents', 'artifacts', 'scheduled'];

export type HitKind = 'agent' | 'artifact' | 'scheduled';

/** What ⏎ does on a result; ⌘⏎ on an archived agent restores it, then opens it. */
export type HitOpen =
  | { readonly to: 'thread'; readonly project: string; readonly agent: string }
  | { readonly to: 'artifact'; readonly project: string; readonly id: string };

export interface Hit {
  readonly kind: HitKind;
  /** unique in a list: `<kind>.<project>.<name or id>` */
  readonly id: string;
  readonly project: string;
  /** the sign in the glyph column: an agent's status sign, an artifact's kind, ◷ */
  readonly glyph: string;
  /** the glyph's tone: acc (waits on him), err (failed), ink (working), '' dim */
  readonly tone: '' | 'acc' | 'err' | 'ink' | 'pearl';
  readonly name: string;
  /** the dim words after the name */
  readonly detail: string;
  /** the right column's where ('storefront', 'perf · storefront'); '' none */
  readonly where: string;
  /** the right column's state or time ('working · 6m', '14:02', 'next 14:20') */
  readonly when: string;
  readonly archived: boolean;
  /** an agent with a question for him: ⏎ answers */
  readonly waiting: boolean;
  readonly at_ms: number;
  readonly score: number;
  readonly open: HitOpen;
}

export interface Group {
  readonly id: 'waiting' | 'recent' | 'agents' | 'artifacts' | 'scheduled';
  readonly label: string;
  readonly hits: readonly Hit[];
}

export interface SearchList {
  /** start: no query; found: one or two words with hits (⏎ opens); ask: a sentence (⏎ asks bise,
   * what it names below); none: one or two words, nothing (⏎ asks bise); blank: nothing to search */
  readonly mode: 'start' | 'found' | 'ask' | 'none' | 'blank';
  readonly groups: readonly Group[];
}

/** How a word matches a field (the name counts most). */
const HOW = { whole: 100, start: 80, word: 60, inside: 40 } as const;
const WEIGHT = { name: 1, about: 0.45, where: 0.3 } as const;

/** A query's words, lowercase. */
export const queryWords = (q: string): string[] => q.toLowerCase().split(/\s+/u).filter((w) => w !== '');

const wordsOf = (s: string): string[] => s.split(/[^\p{L}\p{N}]+/u).filter((w) => w !== '');

/** How one word (lowercase) matches one field: 0 = not at all. */
export function wordScore(w: string, field: string): number {
  const f = field.toLowerCase();
  if (w === '' || f === '') return 0;
  if (f === w) return HOW.whole;
  if (f.startsWith(w)) return HOW.start;
  if (wordsOf(f).some((x) => x.startsWith(w))) return HOW.word;
  if (f.includes(w)) return HOW.inside;
  return 0;
}

export interface Fields {
  readonly name: readonly string[];
  readonly about?: readonly string[];
  readonly where?: readonly string[];
}

/** A query's score on a thing's fields: -1 when a word matches none, 0 for an empty query. */
export function matchScore(q: string | readonly string[], f: Fields): number {
  const ws = typeof q === 'string' ? queryWords(q) : q;
  let total = 0;
  for (const w of ws) {
    let best = 0;
    for (const x of f.name) best = Math.max(best, wordScore(w, x) * WEIGHT.name);
    for (const x of f.about ?? []) best = Math.max(best, wordScore(w, x) * WEIGHT.about);
    for (const x of f.where ?? []) best = Math.max(best, wordScore(w, x) * WEIGHT.where);
    if (best === 0) return -1;
    total += best;
  }
  return total;
}

// --- what ⏎ does with a typed line (main's decision m_12973, q-enter) -----------------------------
// The spotlight and ⌘K decide it here, the same way: one or two words that name something: ⏎ opens
// it; anything longer (or words that name nothing): ⏎ asks bise, what the sentence names one row
// down (↓⏎ opens it).

/** How many words still read as a name. */
export const NAME_WORDS = 2;

/** ⏎ asks bise: the line is longer than a name, or names nothing (`named`: it found something). */
export function asksBise(q: string, named: boolean): boolean {
  const n = queryWords(q).length;
  return n > 0 && (n > NAME_WORDS || !named);
}

/** A text's words, lowercase, '-' and '_' kept inside a name ('amb-web'). */
export const textWords = (s: string): string[] => s.toLowerCase().split(/[^\p{L}\p{N}_-]+/u).filter((w) => w !== '');

/** A sentence names an agent: one of its words is the agent's name, or two of its title's 4+ letter words are in it. */
export function sentenceNames(q: string, a: { readonly name: string; readonly title: string }): boolean {
  const ws = textWords(q);
  if (ws.includes(a.name.toLowerCase())) return true;
  const big = new Set(ws.filter((w) => w.length >= 4));
  return new Set(textWords(a.title).filter((w) => big.has(w))).size >= 2;
}

/** The parts of a text the query's words match (for the bold underline), as [start, end) pairs, merged. */
export function marks(text: string, q: string): Array<readonly [number, number]> {
  const t = text.toLowerCase();
  const out: Array<[number, number]> = [];
  for (const w of queryWords(q)) {
    // a word's start first (as the ranking reads it), else anywhere
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}`, 'u');
    const m = re.exec(t);
    const at = m?.index ?? t.indexOf(w);
    if (at >= 0) out.push([at, at + w.length]);
  }
  out.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const r of out) {
    const last = merged.at(-1);
    if (last !== undefined && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  return merged;
}

// --- the words of a row ---------------------------------------------------------------------------

const SIGN: Record<AgentStatus, { glyph: string; tone: Hit['tone'] }> = {
  waiting: { glyph: '?', tone: 'acc' },
  blocked: { glyph: '?', tone: 'acc' },
  working: { glyph: '∿', tone: 'ink' },
  idle: { glyph: '·', tone: '' },
  done: { glyph: '✓', tone: '' },
  failed: { glyph: '✗', tone: 'err' },
};

/** An artifact's sign: ↗ a page or link, ▤ a file, ⇡ a PR, ◫ images. */
export function artifactGlyph(kind: string): string {
  const k = kind.toLowerCase();
  if (k === 'pr' || k === 'pull') return '⇡';
  if (k === 'image' || k === 'images' || k === 'shot' || k === 'shots' || k === 'video') return '◫';
  if (k === 'file' || k === 'csv' || k === 'doc' || k === 'data') return '▤';
  return '↗';
}

const one = (s: string): string => s.replace(/\s+/gu, ' ').trim();

/** '6m', '2h', 'yesterday', '3 days': how long ago, short (the sidebar's words). */
export function since(ms: number, now: number): string {
  const m = Math.max(0, Math.floor((now - ms) / 60_000));
  if (m < 1) return 'now';
  if (m < 60) return `${String(m)}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${String(h)}h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${String(d)} days`;
}

/** '14:02' today, 'yesterday', 'mon' this week, else '12 oct'. */
export function dayTime(ms: number, now: number, tz?: string): string {
  if (ms <= 0) return '';
  const day = (t: number) => new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz }).format(t);
  if (day(ms) === day(now)) return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(ms);
  if (day(ms) === day(now - 86_400_000)) return 'yesterday';
  if (now - ms < 6 * 86_400_000) return new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: tz }).format(ms).toLowerCase();
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: tz }).format(ms).toLowerCase();
}

const clock = (ms: number, tz?: string): string => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(ms);

function agentHit(a: SearchAgent, pname: string, now: number): Hit {
  const waiting = !a.archived && a.waits > 0;
  const status: AgentStatus = waiting ? 'waiting' : a.status;
  const sign = a.archived ? { glyph: '–', tone: '' as const } : a.main ? { glyph: '', tone: 'pearl' as const } : SIGN[status];
  const about = one(a.title || a.purpose || '');
  const name = a.main ? (pname === 'bise' ? 'bise' : `bise · ${pname}`) : a.name;
  const detail = a.archived ? (about === '' ? 'archived' : `archived · ${about}`) : waiting && a.ask !== undefined ? one(a.ask) : a.main ? '' : about;
  const when = a.archived
    ? since(a.since_ms, now)
    : waiting
      ? since(a.since_ms, now)
      : a.main
        ? a.atWork !== undefined && a.atWork > 0
          ? `${String(a.atWork)} agent${a.atWork === 1 ? '' : 's'} at work`
          : ''
        : status === 'working'
          ? `working · ${since(a.since_ms, now)}`
          : `${status} · ${since(a.since_ms, now)}`;
  return {
    kind: 'agent',
    id: `agent.${a.project}.${a.name}`,
    project: a.project,
    glyph: sign.glyph,
    tone: sign.tone,
    name,
    detail,
    where: a.main ? '' : pname,
    when,
    archived: a.archived,
    waiting,
    at_ms: a.since_ms,
    score: 0,
    open: { to: 'thread', project: a.project, agent: a.name },
  };
}

function artifactHit(r: SearchArtifact, pname: string, now: number, tz?: string): Hit {
  return {
    kind: 'artifact',
    id: `artifact.${r.project}.${r.id}`,
    project: r.project,
    glyph: artifactGlyph(r.kind),
    tone: '',
    name: one(r.title),
    detail: r.what,
    where: r.agent === '' ? pname : `${r.agent} · ${pname}`,
    when: dayTime(r.at_ms, now, tz),
    archived: false,
    waiting: false,
    at_ms: r.at_ms,
    score: 0,
    open: { to: 'artifact', project: r.project, id: r.id },
  };
}

function scheduledHit(s: SearchScheduled, pname: string, tz?: string): Hit {
  return {
    kind: 'scheduled',
    id: `scheduled.${s.project}.${String(s.id)}`,
    project: s.project,
    glyph: '◷',
    tone: '',
    name: one(s.words),
    detail: '',
    where: `${s.agent} · ${pname}`,
    when: s.next_ms !== undefined && s.next_ms > 0 ? `next ${clock(s.next_ms, tz)}` : `every ${s.every}`,
    archived: false,
    waiting: false,
    at_ms: s.at_ms ?? 0,
    score: 0,
    open: { to: 'thread', project: s.project, agent: s.agent },
  };
}

/** How many rows 'recent' shows. */
export const RECENT = 12;

/** The list for a query in a scope. */
export function searchList(d: SearchData, q: string, scope: Scope, now: number, tz?: string): SearchList {
  const pname = (id: string): string => {
    const p = d.projects.find((x) => x.id === id);
    return p === undefined ? id : p.home === true ? 'bise' : p.name;
  };
  const blank = d.agents.every((a) => a.main) && d.artifacts.length === 0 && d.scheduled.length === 0;
  const want = (k: HitKind): boolean => scope === 'all' || `${k}s` === scope || (k === 'scheduled' && scope === 'scheduled');
  const ws = queryWords(q);

  if (ws.length === 0) {
    if (blank) return { mode: 'blank', groups: [] };
    const agents = want('agent') ? d.agents.map((a) => agentHit(a, pname(a.project), now)) : [];
    const waiting = agents.filter((h) => h.waiting).sort((a, b) => b.at_ms - a.at_ms);
    const recent = [
      ...agents.filter((h) => !h.waiting && !h.archived),
      ...(want('artifact') ? d.artifacts.map((r) => artifactHit(r, pname(r.project), now, tz)) : []),
      ...(want('scheduled') ? d.scheduled.map((s) => scheduledHit(s, pname(s.project), tz)) : []),
      ...agents.filter((h) => h.archived),
    ]
      .map((h, k) => ({ h, k }))
      .sort((a, b) => Number(a.h.archived) - Number(b.h.archived) || b.h.at_ms - a.h.at_ms || a.k - b.k)
      .slice(0, RECENT)
      .map((x) => x.h);
    const groups: Group[] = [];
    if (waiting.length > 0) groups.push({ id: 'waiting', label: 'waiting for you', hits: waiting });
    if (recent.length > 0) groups.push({ id: 'recent', label: 'recent', hits: recent });
    return { mode: groups.length === 0 ? 'blank' : 'start', groups };
  }

  // a sentence (main m_12973): bise is asked first; below it, what all its words match, and the
  // agents it names (archived ones too, after the live ones)
  const sentence = ws.length > NAME_WORDS;
  const ranked = <T>(xs: readonly T[], hit: (x: T) => Hit, fields: (x: T) => Fields, named?: (x: T) => boolean): Hit[] =>
    xs
      .map((x, k) => {
        const s = matchScore(ws, fields(x));
        return { x, k, s: s < 0 && sentence && named?.(x) === true ? 0 : s };
      })
      .filter((y) => y.s >= 0)
      .map((y) => ({ h: { ...hit(y.x), score: y.s }, k: y.k }))
      .sort((a, b) => Number(a.h.archived) - Number(b.h.archived) || b.h.score - a.h.score || b.h.at_ms - a.h.at_ms || a.k - b.k)
      .map((y) => y.h);
  const groups: Group[] = [];
  if (want('agent')) {
    const hits = ranked(
      d.agents,
      (a) => agentHit(a, pname(a.project), now),
      (a) => ({ name: a.main ? ['bise', a.name] : [a.name], about: [a.title, a.purpose ?? ''], where: [pname(a.project)] }),
      (a) => !a.main && sentenceNames(q, a),
    );
    if (hits.length > 0) groups.push({ id: 'agents', label: 'agents', hits });
  }
  if (want('artifact')) {
    const hits = ranked(
      d.artifacts,
      (r) => artifactHit(r, pname(r.project), now, tz),
      (r) => ({ name: [r.title, r.id], about: [r.what, r.kind, r.agent], where: [pname(r.project)] }),
    );
    if (hits.length > 0) groups.push({ id: 'artifacts', label: 'artifacts', hits });
  }
  if (want('scheduled')) {
    const hits = ranked(
      d.scheduled,
      (s) => scheduledHit(s, pname(s.project), tz),
      (s) => ({ name: [s.words], about: [s.agent, `#${String(s.id)}`], where: [pname(s.project)] }),
    );
    if (hits.length > 0) groups.push({ id: 'scheduled', label: 'scheduled', hits });
  }
  const found = groups.length > 0;
  return { mode: asksBise(q, found) ? (sentence ? 'ask' : 'none') : 'found', groups };
}

/** The list's hits in keyboard order. */
export const flatHits = (l: SearchList): Hit[] => l.groups.flatMap((g) => g.hits);

/** The next scope (tab), the previous one (shift+tab). */
export const nextScope = (s: Scope, back = false): Scope => SCOPES[(SCOPES.indexOf(s) + (back ? SCOPES.length - 1 : 1)) % SCOPES.length] ?? 'all';

/** The scope a group's head offers ('tab agents only'), from 'all'. */
export const scopeOf = (g: Group['id']): Scope | null => (g === 'agents' || g === 'artifacts' || g === 'scheduled' ? g : null);
