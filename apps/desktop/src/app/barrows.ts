// The right bar's rows (designer's desktop-right-bar v5, desktop-agents-bar): one shape for the four
// sections, glyph, name, a dim second word (the role, or the project's name on bise's thread), the
// end on the right; an agent's row has the TUI's columns instead of an end (its time, its %, its
// worktree's mark: barplaces.ts), and its worktree's group head when it shares one.
// Pure: RightBar.tsx draws these (barrows.ts: a rightbar.ts would clash with RightBar.tsx on macOS's case-blind disk). Owner: amb-win.
import type { Item } from '@/artifacts/model';
import { glyphOf, leaves } from '@/artifacts/model';
import type { Task } from '@/scheduled/model';
import { howOften, nextWords } from '@/scheduled/model';
import { shortAge } from '@/agents/model';
import { alarms, pauseLine, waitLen } from '@/thread/wake';
import type { Agent, Card, ComputerAgent, Place } from '@/proto';
import { asksMerge, livePr, markOf, orphanPlaces, placeLabel, placeOf, sharedPlaces, tipWords, type Mark } from './barplaces';
import { computerDot, signOf, type Sign, type Tone } from './side';
import { archivedAgeTip, madeTip, NEW_CHIP_TIP, pctTip, signTip, timeTip } from './tipwords';

/** One agent with its project, across the projects shown. */
export interface ProjAgent {
  readonly project: string;
  readonly projectName: string;
  readonly a: Agent;
}

export interface BarRow {
  readonly key: string;
  readonly project: string;
  /** the agent it opens (agents, archived, waits) */
  readonly agent?: string;
  /** the artifact it opens */
  readonly id?: string;
  /** an agent's row, a worktree's head, an open PR with no agent; none: the other sections' rows */
  readonly kind?: 'agent' | 'group' | 'orphan';
  readonly glyph: string;
  readonly tone: 'ink' | 'acc' | 'err' | 'dim' | 'mid';
  readonly name: string;
  readonly sub: string;
  readonly end: string;
  readonly endTone: 'dim' | 'ink' | 'acc' | 'err';
  readonly title: string;
  readonly testId: string;
  /** it waits on him: never hidden by a cap (designer v5) */
  readonly waits: boolean;
  /** a feature's group head: the feature it opens */
  readonly feature?: string;
  /** an agent's columns (desktop-agents-bar §2): its turn's or wait's length, its context used; '' empty, the column stays */
  readonly time?: string;
  readonly pct?: string;
  /** its context used, 1-100, for the % column's ring (his ask m_26205); none: no usage, or 0 */
  readonly ctx?: number;
  /** its worktree's mark, last (§3): '↑' '…' 'ψ', tinted, its tip */
  readonly mark?: Mark;
  /** the worktree group it is in (its head's too): the 1 px rule in the margin */
  readonly group?: string;
  /** an orphan PR's or a head's branch (an orphan opens it) */
  readonly branch?: string;
  /** at work: the DS's breeze '∿' (a Dot) in the glyph's place */
  readonly working?: boolean;
  /** it uses his computer: the core's mark after its name (S29/L19 W3) */
  readonly cu?: { readonly g: string; readonly tone: Tone; readonly title: string };
  /** a browser-only artifact: '↗' 4 px after its title, text-3 (designer m_21742) */
  readonly leaves?: boolean;
  /** its sub cuts after a whole word with '…' (an alarm's note, agent-waiting-states A) */
  readonly fit?: boolean;
  /** an alarm: its watch's id; the row opens its detail (stop watching) */
  readonly watch?: number;
  /** the hover tips of its compact marks (tipwords.ts): its sign, its end, its time and % columns */
  readonly tips?: { readonly glyph?: string; readonly end?: string; readonly time?: string; readonly pct?: string };
}

/** What AGENTS reads besides the agents: their next wakes ('<project>/<agent>' -> ms), the project's worktrees and cards, the computer rows, the ⌥ numbers. */
export interface AgentExtras {
  readonly wakes?: ReadonlyMap<string, number>;
  /** the project's worktrees and their PRs (hub/agents places); none on bise's thread */
  readonly places?: readonly Place[];
  /** the project's cards: a 'merge' one tints its PR's '↑' pink */
  readonly cards?: readonly Card[];
  readonly computer?: readonly ComputerAgent[];
  /** the TUI's ⌥ numbers (agents/model numbersOf): the order and ⌥N; none: start order */
  readonly numbers?: ReadonlyMap<string, number>;
}

/**
 * An agent's role words as the bar draws them: never a raw `<tag>` (a
 * model's `<think>` once reached its title, main m_22156; the hub drops it
 * at the source, role.rs `clean`). Such words read 'thinking'.
 */
export function roleWords(t: string): string {
  return /<\/?[a-z][a-z0-9_-]*(\s[^>]*)?>/i.test(t) ? 'thinking' : t;
}

const idOf = (all: boolean, project: string, name: string) => (all ? `${project}.${name}` : name);

/**
 * The bar's sign (desktop-agents-bar §2), the TUI's: the breeze while it works, '?' pink when it
 * waits for him, '✓' pink done, '✗' red failed (designer m_26248: '▲' is a cut turn), '…' when it waits on an event or another agent,
 * '○' text-3 at rest (a next wake too: its time is in the hover). No state words. Pure.
 */
export function barSign(s: Sign): { g: string; tone: BarRow['tone']; working: boolean } {
  switch (s.g) {
    case '?':
      return { g: '?', tone: 'acc', working: false };
    case '∿':
      return { g: '∿', tone: 'ink', working: true };
    case '…':
      return { g: '…', tone: 'ink', working: false };
    case '⋯':
      return { g: '…', tone: 'dim', working: false };
    case '✗':
      return { g: '✗', tone: 'err', working: false };
    case '✓':
      return { g: '✓', tone: 'acc', working: false };
    default:
      return { g: '○', tone: 'dim', working: false };
  }
}

/** Its context used, in the % column: '17%'; '' when nothing worth saying (none, 0%). Pure. */
export function pctOf(a: Agent): string {
  const u = a.usage;
  if (u == null || u.window == null || u.window <= 0) return '';
  const n = Math.round((u.context / u.window) * 100);
  return n > 0 ? `${String(Math.min(n, 100))}%` : '';
}

/** The % column shows from this much context used: below it, the row's tip says it (desktop-delight v2). */
export const PCT_LOUD = 70;

/** Whether a '17%' is loud enough for the column. Pure. */
export function pctLoud(pct: string): boolean {
  return pct !== '' && Number.parseInt(pct, 10) >= PCT_LOUD;
}

/** The time column: the turn's length while it works, the wait's while it waits on an event; '' else. Never a state word. */
export function timeOf(a: Agent, now: number): string {
  const pause = pauseLine(a, now);
  if (pause !== null) return pause.len;
  if (a.status === 'working') return waitLen(a.turn_ms ?? now - a.since_ms);
  return '';
}

function agentRow(x: ProjAgent, now: number, all: boolean, n: number | undefined, alt: boolean, extras: AgentExtras, mark: Mark | undefined, group: string | undefined): BarRow {
  const s = signOf(x.a, now, extras.wakes?.get(`${x.project}/${x.a.name}`));
  const sign = barSign(s);
  const numbered = alt && n !== undefined && n >= 1 && n <= 9;
  const cu = computerDot(extras.computer?.find((r) => r.project === x.project && r.agent === x.a.name));
  const wake = extras.wakes?.get(`${x.project}/${x.a.name}`);
  // its context used: in the column from 70 %, else in its sign's tip only (desktop-delight v2)
  const pct = pctOf(x.a);
  const loud = pctLoud(pct);
  const signWords = signTip(sign.g, x.a, now, wake === undefined ? '' : hm(wake));
  return {
    key: `a:${x.project}/${x.a.name}`,
    kind: 'agent',
    project: x.project,
    agent: x.a.name,
    glyph: numbered ? `⌥${String(n)}` : sign.g,
    tone: numbered ? 'dim' : sign.tone,
    name: x.a.name,
    sub: all ? x.projectName : roleWords(x.a.title !== '' ? x.a.title : x.a.purpose),
    end: '',
    endTone: 'dim',
    time: timeOf(x.a, now),
    pct: loud ? pct : '',
    title: s.title,
    tips: { glyph: pct === '' || loud ? signWords : `${signWords} · ${pctTip(x.a, pct)}`, time: timeTip(x.a, now), pct: pctTip(x.a, pct) },
    testId: `app.right.agent.${idOf(all, x.project, x.a.name)}`,
    waits: s.g === '?',
    ...(!numbered && sign.working ? { working: true } : {}),
    ...(cu === null ? {} : { cu }),
    ...(pct === '' ? {} : { ctx: Number.parseInt(pct, 10) }),
    ...(mark === undefined ? {} : { mark }),
    ...(group === undefined ? {} : { group }),
  };
}

/**
 * AGENTS (desktop-agents-bar §2-§4), the TUI panel's order (sb.rs blocks, designer m_23651): the
 * live agents but main that share no worktree, by their ⌥ number (the shared checkout's and the
 * ones alone in theirs, each with its mark), then the open PRs with no live agent (no sign, the
 * branch text-3, its '↑'), then each worktree 2 or more live agents share: a 'ψ <branch>' head with
 * its PR's '↑ #418', its rows with no mark, in the order of their smallest number. A head waits on
 * him when one of its agents does: the cap never hides it. `alt`: ⌥ held, ⌥1-⌥9 for the signs.
 * On bise's thread (`all`) the agents stay in start order, no worktrees. Pure.
 */
export function agentRows(agents: readonly ProjAgent[], now: number, all: boolean, alt = false, extras: AgentExtras = {}): BarRow[] {
  const live = agents.filter((x) => !x.a.archived && !x.a.main);
  const num = (name: string) => extras.numbers?.get(name);
  const byNum = (a: ProjAgent, b: ProjAgent) => (num(a.a.name) ?? Number.MAX_SAFE_INTEGER) - (num(b.a.name) ?? Number.MAX_SAFE_INTEGER);
  const places = all ? [] : (extras.places ?? []);
  const cards = extras.cards ?? [];
  if (places.length === 0) {
    const order = extras.numbers === undefined ? live : live.slice().sort(byNum);
    return order.map((x, i) => agentRow(x, now, all, num(x.a.name) ?? i + 1, alt, extras, undefined, undefined));
  }
  const liveA = live.map((x) => x.a);
  const shared = sharedPlaces(places, liveA);
  const inGroup = new Set([...shared.values()].flat().map((a) => a.name));
  const project = live[0]?.project ?? agents[0]?.project ?? '';
  const rows: BarRow[] = live
    .filter((x) => !inGroup.has(x.a.name))
    .sort(byNum)
    .map((x) => {
      const p = placeOf(x.a, places);
      return agentRow(x, now, all, num(x.a.name), alt, extras, p === undefined ? undefined : markOf(p, asksMerge(p, cards)), undefined);
    });
  for (const p of orphanPlaces(places, liveA)) {
    const label = placeLabel(p);
    rows.push({
      key: `pr:${project}/${p.id}`,
      kind: 'orphan',
      project,
      branch: p.branch ?? undefined,
      glyph: '',
      tone: 'dim',
      name: label,
      sub: '',
      end: '',
      endTone: 'dim',
      title: tipWords(p),
      testId: `app.right.pr.${String(livePr(p)?.number ?? label)}`,
      waits: false,
      mark: markOf(p, asksMerge(p, cards)),
    });
  }
  const groups = places
    .flatMap((p) => {
      const members = live.filter((x) => shared.get(p.id)?.some((a) => a.name === x.a.name) === true).sort(byNum);
      return members.length >= 2 ? [{ p, members }] : [];
    })
    .sort((a, b) => byNum(a.members[0] as ProjAgent, b.members[0] as ProjAgent));
  for (const { p, members } of groups) {
    const head = markOf(p, asksMerge(p, cards));
    const memberRows = members.map((x) => agentRow(x, now, all, num(x.a.name), alt, extras, undefined, p.id));
    rows.push({
      key: `ψ:${project}/${p.id}`,
      kind: 'group',
      project,
      group: p.id,
      agent: members[0]?.a.name,
      branch: p.branch ?? undefined,
      ...(p.feature === true ? { feature: p.id.replace(/^feature:/, '') } : {}),
      glyph: p.feature === true && p.trying === true ? 'Δ' : 'ψ',
      tone: 'mid',
      name: placeLabel(p),
      sub: '',
      end: '',
      endTone: 'dim',
      title: tipWords(p),
      testId: `app.right.group.${placeLabel(p)}`,
      // one of its agents waits on him: the head shows past the cap too
      waits: memberRows.some((r) => r.waits),
      // the head's mark: the PR's '↑' with its number, or its land's '…'; nothing for a lone 'ψ'
      ...(head.g === 'ψ' || head.g === 'Δ' ? {} : { mark: head }),
    });
    rows.push(...memberRows);
  }
  return rows;
}

/**
 * ARCHIVED (desktop-agents-bar): its sign, its name, its age, newest first: '✓ release-32 2 h' done,
 * '✗ import 1 d' red failed, '– old 3 d' stopped; no state words (the hover says it). Pure.
 */
export function archivedRows(agents: readonly ProjAgent[], now: number, all: boolean): BarRow[] {
  return agents
    .filter((x) => x.a.archived)
    .slice()
    .sort((a, b) => b.a.since_ms - a.a.since_ms)
    .map((x) => {
      const st = x.a.status === 'done' ? 'done' : x.a.status === 'failed' ? 'failed' : 'stopped';
      return {
        key: `r:${x.project}/${x.a.name}`,
        project: x.project,
        agent: x.a.name,
        glyph: st === 'done' ? '✓' : st === 'failed' ? '✗' : '–',
        tone: st === 'failed' ? 'err' : 'dim',
        name: x.a.name,
        sub: all ? x.projectName : '',
        end: shortAge(now - x.a.since_ms),
        endTone: 'dim',
        title: `${st} · ${x.a.title !== '' ? x.a.title : x.a.purpose}`,
        testId: `app.right.archived.${idOf(all, x.project, x.a.name)}`,
        waits: false,
        tips: { glyph: `${st === 'done' ? '✓' : st === 'failed' ? '✗' : '–'} ${x.a.name} ${st === 'done' ? 'is done' : st}`, end: archivedAgeTip(st, now - x.a.since_ms) },
      };
    });
}

const hm = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** ARTIFACTS: newest first, its kind's glyph, 'new' in ink, else when (today's time, else its age). Pure. */
export function artifactRows(items: readonly Item[], now: number): BarRow[] {
  return items
    .filter((it) => it.a.archived_at == null)
    .slice()
    .sort((a, b) => b.a.at_ms - a.a.at_ms)
    .map((it) => ({
      key: `f:${it.project}/${it.a.id}`,
      project: it.project,
      id: it.a.id,
      glyph: glyphOf(it.a.kind),
      tone: 'dim',
      name: it.a.title,
      sub: '',
      leaves: leaves(it.a),
      end: it.a.new ? 'new' : now - it.a.at_ms < 86_400_000 ? hm(it.a.at_ms) : shortAge(now - it.a.at_ms),
      endTone: it.a.new ? 'ink' : 'dim',
      title: `${it.a.title} · ${it.projectName}`,
      testId: `app.right.artifact.${it.project}.${it.a.id}`,
      waits: false,
      tips: { end: it.a.new ? NEW_CHIP_TIP : madeTip(now - it.a.at_ms < 86_400_000 ? hm(it.a.at_ms) : shortAge(now - it.a.at_ms)) },
    }));
}

/** SCHEDULED: ◷, its name (else its words), how often, its next run. Pure. */
export function scheduledRows(tasks: readonly Task[], now: number): BarRow[] {
  return tasks.map((x) => ({
    key: `s:${x.project}/${String(x.t.id)}`,
    project: x.project,
    glyph: '◷',
    tone: 'dim',
    name: x.t.name != null && x.t.name !== '' ? x.t.name : (x.t.words.split('\n')[0] ?? ''),
    sub: howOften(x.t),
    // cut on a whole word, '…' glued to it ('every day…', designer m_25211), as an alarm's note
    fit: true,
    end: nextWords(x.t, now),
    endTone: 'dim',
    title: x.t.words,
    testId: `app.right.scheduled.${x.project}.${String(x.t.id)}`,
    waits: false,
  }));
}

/**
 * WATCHING (agent-waiting-states A): an alarm, its agent free; '◌' (set, not at work), its agent,
 * what wakes it ('if the nightly gate goes red', cut on a word), when it stops watching ('until
 * 08:07', a clock ahead); the hover says who bise wakes, when it was set, when it stops. A pause is
 * no row here: it shows over its composer and in AGENTS. `off`: each instant's offset. Pure.
 */
export function watchRows(agents: readonly ProjAgent[], now: number, all: boolean, off?: (ms: number) => number): BarRow[] {
  return agents
    .filter((x) => !x.a.archived)
    .flatMap((x) =>
      alarms(x.a, now, off).map((al) => ({
        key: `w:${x.project}/${String(al.id)}`,
        project: x.project,
        agent: x.a.name,
        glyph: '◌',
        tone: 'dim' as const,
        name: x.a.name,
        sub: al.note,
        fit: true,
        end: al.end === '' ? '' : `until ${al.end}`,
        endTone: 'dim' as const,
        title: al.title,
        testId: `app.right.watching.${idOf(all, x.project, x.a.name)}.${String(al.id)}`,
        waits: false,
        watch: al.id,
      })),
    );
}

/**
 * The rows a section shows under its cap (8 for AGENTS, 5 for the others) and how many '+ N more'
 * counts: a row that waits on him is never hidden, it shows in its place past the cap and the count
 * leaves it out (designer v5, ambient-lead m_20091). Pure.
 */
export function capRows(rows: readonly BarRow[], cap: number): { shown: BarRow[]; hidden: number } {
  const shown = rows.filter((r, i) => i < cap || r.waits);
  return { shown, hidden: rows.length - shown.length };
}
