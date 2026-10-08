// Scheduled tasks (desktop-screens v6 'scheduled', designer m_11837; the TUI's scheduled_screen.rs
// words): what wakes his agents, and when. Pure. Owner: amb-kit.
//
// The task is amb-feed's typed rows::ScheduledTask (284bd5c6: HubEv scheduled {project, items},
// HubCmd scheduled {project} and scheduled_stop {project, id}).
import type { ScheduledTask } from '@/proto';

export type { ScheduledTask };

/** A task with its project (the event is per project). */
export interface Task {
  readonly project: string;
  readonly projectName: string;
  readonly t: ScheduledTask;
}

const pad = (n: number) => String(n).padStart(2, '0');
const hm = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const dayKey = (ms: number) => new Date(ms).toDateString();

/** 1st, 2nd, 3rd, 4th, 11th, 22nd. */
export function ordinal(n: number): string {
  const th = n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
  return `${String(n)}${th}`;
}

/** A time ahead as the TUI says it: '14:22', 'tomorrow 07:30', else 'the 9th, 07:30'. */
export function ahead(ms: number, now: number): string {
  if (dayKey(ms) === dayKey(now)) return hm(ms);
  if (dayKey(ms) === dayKey(now + 86_400_000)) return `tomorrow ${hm(ms)}`;
  return `the ${ordinal(new Date(ms).getDate())}, ${hm(ms)}`;
}

/** 'every 5m', 'every day 07:30'. */
export const howOften = (t: ScheduledTask): string => {
  const e = t.every.trim();
  // the hub may already say it ('every 5m'): never 'every every 5m' (designer D11)
  return /^every\b/iu.test(e) ? e : `every ${e}`;
};

/** The runs: '3 of 24', '3 runs so far'. */
export function runsWords(t: ScheduledTask): string {
  if (t.times != null) return `${String(t.done)} of ${String(t.times)}`;
  return t.done === 1 ? '1 run so far' : `${String(t.done)} runs so far`;
}

/** The next run's column: '14:22', 'tomorrow 07:30', '—' when none is due. */
export const nextWords = (t: ScheduledTask, now: number): string => (t.next_ms != null ? ahead(t.next_ms, now) : '—');

/** The pane's 'next run': 'the 7th of 24 · 14:22'. */
export function nextRunWords(t: ScheduledTask, now: number): string {
  const which = t.times != null ? `the ${ordinal(t.done + 1)} of ${String(t.times)}` : `the ${ordinal(t.done + 1)}`;
  return t.next_ms != null ? `${which} · ${ahead(t.next_ms, now)}` : which;
}

/** When it ends: 'after its 24th run', 'at 18:00', 'when it's stopped' (the TUI's). */
export function endsWords(t: ScheduledTask, now: number): string {
  if (t.times === 1) return 'after its run';
  if (t.times != null) return `after its ${ordinal(t.times)} run`;
  if (t.until_ms != null) return `at ${ahead(t.until_ms, now)}`;
  return "when it's stopped";
}

/** What it asks: its words' first line. */
export const asks = (t: ScheduledTask): string => t.words.split('\n')[0]?.trim() ?? '';

/** 'deploy-watch · storefront' (the project left out for one project's list). */
export const wakes = (x: Task, withProject = true): string => (withProject && x.projectName !== '' ? `${x.t.agent} · ${x.projectName}` : x.t.agent);

/** The tasks by next run, soonest first (none due last). */
export function bySoonest(items: readonly Task[]): Task[] {
  return [...items].sort((a, b) => (a.t.next_ms ?? Number.MAX_SAFE_INTEGER) - (b.t.next_ms ?? Number.MAX_SAFE_INTEGER) || a.t.id - b.t.id);
}

export const keyOf = (x: Task): string => `${x.project}#${String(x.t.id)}`;
