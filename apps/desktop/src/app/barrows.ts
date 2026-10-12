// The right bar's rows (designer's desktop-right-bar v5): one shape for the four sections, glyph,
// name, a dim second word (the role, or the project's name on bise's thread), the end on the right.
// Pure: RightBar.tsx draws these (barrows.ts: a rightbar.ts would clash with RightBar.tsx on macOS's case-blind disk). Owner: amb-win.
import type { Item } from '@/artifacts/model';
import { glyphOf } from '@/artifacts/model';
import type { Task } from '@/scheduled/model';
import { howOften, nextWords } from '@/scheduled/model';
import { shortAge } from '@/agents/model';
import { waitingFor, waitSince, waitsEvent } from '@/thread/wake';
import type { Agent, ComputerAgent, Feature } from '@/proto';
import { groupsOf } from '@/review/feature';
import { computerDot, gaugeSays, signOf, type Tone } from './side';

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
  readonly glyph: string;
  readonly tone: 'ink' | 'acc' | 'err' | 'dim';
  readonly name: string;
  readonly sub: string;
  readonly end: string;
  readonly endTone: 'dim' | 'ink' | 'acc' | 'err';
  readonly title: string;
  readonly testId: string;
  /** it waits on him: never hidden by a cap (designer v5) */
  readonly waits: boolean;
  /** the feature it opens (its 'ψ' head in AGENTS) */
  readonly feature?: string;
  /** at work: the DS's breeze '∿' (a Dot) in the glyph's place */
  readonly working?: boolean;
  /** it uses his computer: the core's mark after its name (S29/L19 W3) */
  readonly cu?: { readonly g: string; readonly tone: Tone; readonly title: string };
  /** its context gauge, the hub's short words, only when it says something (designer D12) */
  readonly gauge?: string;
}

/** What AGENTS reads besides the agents: their next wakes ('<project>/<agent>' -> ms), the project's features, the computer rows. */
export interface AgentExtras {
  readonly wakes?: ReadonlyMap<string, number>;
  readonly features?: readonly Feature[];
  readonly computer?: readonly ComputerAgent[];
}

/** A feature's end: what it waits for, else how far it is. Pure. */
export function featureEnd(f: Feature): string {
  if (f.building) return 'building';
  if (f.trial) return 'on trial';
  return `${String(f.ahead)} ahead`;
}

const idOf = (all: boolean, project: string, name: string) => (all ? `${project}.${name}` : name);

/**
 * AGENTS: the live ones but main, in start order (the TUI panel's: ⌥N = the TUI's, ambient-lead
 * m_20087): the ones in no feature, then each feature's head ('ψ gift-cards', opens the feature)
 * with its agents, as the TUI's panel. What waits on him says it with '?' and 'waits' in the accent,
 * never by moving. `alt`: ⌥ held, the agents' glyphs become ⌥1-⌥9 (heads take no number). Pure.
 */
export function agentRows(agents: readonly ProjAgent[], now: number, all: boolean, alt = false, extras: AgentExtras = {}): BarRow[] {
  const live = agents.filter((x) => !x.a.archived && !x.a.main);
  const byName = new Map(live.map((x) => [x.a.name, x] as const));
  const pick = (list: readonly Agent[]) => list.flatMap((a) => byName.get(a.name) ?? []);
  // features are a project's: on bise's thread (every project) the agents stay in start order
  const { solo, groups } = all ? { solo: live.map((x) => x.a), groups: [] } : groupsOf(live.map((x) => x.a), extras.features ?? []);
  const seq: (ProjAgent | Feature)[] = [...pick(solo), ...groups.flatMap((g) => [g.feature, ...pick(g.agents)])];
  let n = 0;
  return seq.map((x): BarRow => {
    if (!('a' in x)) {
      const project = agents[0]?.project ?? '';
      return {
        key: `ψ:${project}/${x.name}`,
        project,
        feature: x.name,
        glyph: 'ψ',
        tone: 'dim',
        name: x.name,
        sub: '',
        end: featureEnd(x),
        endTone: 'dim',
        title: `feature ${x.name} · ${x.branch}`,
        testId: `app.right.feature.${x.name}`,
        waits: false,
      };
    }
    const i = n++;
    const s = signOf(x.a, now, extras.wakes?.get(`${x.project}/${x.a.name}`));
    const waits = s.g === '?';
    const role = x.a.title !== '' ? x.a.title : x.a.purpose;
    const numbered = alt && i < 9;
    const cu = computerDot(extras.computer?.find((r) => r.project === x.project && r.agent === x.a.name));
    const short = x.a.usage?.short;
    return {
      key: `a:${x.project}/${x.a.name}`,
      project: x.project,
      agent: x.a.name,
      glyph: numbered ? `⌥${String(i + 1)}` : s.g,
      tone: numbered ? 'dim' : s.tone,
      name: x.a.name,
      sub: all ? x.projectName : role,
      end: waits ? 'waits' : s.end,
      endTone: waits ? 'acc' : s.endTone,
      title: s.title,
      testId: `app.right.agent.${idOf(all, x.project, x.a.name)}`,
      waits,
      ...(!numbered && x.a.status === 'working' && s.g === '∿' ? { working: true } : {}),
      ...(cu === null ? {} : { cu }),
      ...(short != null && gaugeSays(short) ? { gauge: short } : {}),
    };
  });
}

/** ARCHIVED: ✓ done or – stopped, dim, newest first: 'done · 2 h'. Pure. */
export function archivedRows(agents: readonly ProjAgent[], now: number, all: boolean): BarRow[] {
  return agents
    .filter((x) => x.a.archived)
    .slice()
    .sort((a, b) => b.a.since_ms - a.a.since_ms)
    .map((x) => {
      const done = x.a.status === 'done';
      return {
        key: `r:${x.project}/${x.a.name}`,
        project: x.project,
        agent: x.a.name,
        glyph: done ? '✓' : '–',
        tone: 'dim',
        name: x.a.name,
        sub: all ? x.projectName : '',
        end: `${done ? 'done' : 'stopped'} · ${shortAge(now - x.a.since_ms)}`,
        endTone: 'dim',
        title: `${done ? 'done' : 'stopped'} · ${x.a.title !== '' ? x.a.title : x.a.purpose}`,
        testId: `app.right.archived.${idOf(all, x.project, x.a.name)}`,
        waits: false,
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
      end: it.a.new ? 'new' : now - it.a.at_ms < 86_400_000 ? hm(it.a.at_ms) : shortAge(now - it.a.at_ms),
      endTone: it.a.new ? 'ink' : 'dim',
      title: `${it.a.title} · ${it.projectName}`,
      testId: `app.right.artifact.${it.project}.${it.a.id}`,
      waits: false,
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
    end: nextWords(x.t, now),
    endTone: 'dim',
    title: x.t.words,
    testId: `app.right.scheduled.${x.project}.${String(x.t.id)}`,
    waits: false,
  }));
}

/** WAITING: an agent that waits for an event, '…', what it waits for, for how long. Pure. */
export function waitingRows(agents: readonly ProjAgent[], now: number, all: boolean): BarRow[] {
  return agents
    .filter((x) => !x.a.archived && waitsEvent(x.a))
    .map((x) => ({
      key: `w:${x.project}/${x.a.name}`,
      project: x.project,
      agent: x.a.name,
      glyph: '…',
      tone: 'ink',
      name: x.a.name,
      sub: x.a.watching[0]?.what ?? '',
      end: shortAge(now - (waitSince(x.a.watching) ?? now)),
      endTone: 'dim',
      title: waitingFor(x.a.watching, now) ?? 'waiting',
      testId: `app.right.waiting.${idOf(all, x.project, x.a.name)}`,
      waits: false,
    }));
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
