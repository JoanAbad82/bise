// The marks of the window's left column (designer's desktop-delight v2, his yes on A): bise is ':*'
// (text-3 at rest, the accent when anything waits on him, its '*' turning while bise works); a
// project is its state: the '∿' gust while an agent works, '?' in the accent when something waits
// on him, '·' when quiet. And the done touch: an agent that finishes gets a kiss (':*' lifts and
// fades, '✓' comes), once per finish, in the right bar and on its project's mark.
// Pure: Marks.tsx draws these, tipwords.ts words them (markstates.ts: a marks.ts would clash with Marks.tsx on macOS's case-blind disk). Owner: amb-win.
import type { Agent, ProjectRow } from '@/proto';

/** bise's ':*': the accent when anything waits on him; its star turns while its agents work. */
export interface BiseMarkState {
  readonly waits: number;
  /** the agents at work in every project (bise-presence's count: the capsule and the tray say it too) */
  readonly working: number;
}

/** bise's mark from his projects: what waits on him and who works, everywhere. Pure. */
export function biseMark(rows: readonly ProjectRow[]): BiseMarkState {
  let waits = 0;
  let working = 0;
  for (const p of rows) {
    waits += p.waits;
    working += p.working;
  }
  return { waits, working };
}

/** A project's mark: '?' (asks him), the gust (at work), '·' (quiet). */
export type ProjectMarkKind = 'asks' | 'works' | 'quiet';

/** What waits on him wins over work (the accent says what needs him); a gone folder is quiet. Pure. */
export function projectMark(p: Pick<ProjectRow, 'waits' | 'working' | 'missing'>): ProjectMarkKind {
  if (p.missing === true) return 'quiet';
  if (p.waits > 0) return 'asks';
  if (p.working > 0) return 'works';
  return 'quiet';
}

/** The names of a project's agents at work and of those that ask him, in its agents' order. Pure. */
export function whoOf(agents: readonly Agent[]): { working: string[]; asking: string[] } {
  const working: string[] = [];
  const asking: string[] = [];
  for (const a of agents) {
    if (a.archived) continue;
    if (a.waits > 0 || a.waiting_on?.who === 'you') asking.push(a.name);
    else if (a.status === 'working') working.push(a.name);
  }
  return { working, asking };
}

/** How long the done kiss plays: ':*' lifts and fades, '✓' fades in. */
export const KISS_MS = 600;
/** A project's mark holds the '✓' this long after the kiss, then shows its state again. */
export const KISS_HOLD_MS = 1000;

/** The statuses seen last, per '<project>/<agent>'. */
export type Seen = ReadonlyMap<string, Agent['status']>;

/**
 * The agents that just finished: seen before not done, now done. One first seen done (a window that
 * opens on a finished agent, a reload) never counts: the kiss is for a finish he could watch. Pure.
 */
export function finished(seen: Seen, project: string, agents: readonly Agent[]): string[] {
  const out: string[] = [];
  for (const a of agents) {
    const was = seen.get(`${project}/${a.name}`);
    if (a.status === 'done' && was !== undefined && was !== 'done') out.push(a.name);
  }
  return out;
}
