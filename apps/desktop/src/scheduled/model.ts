// Scheduled tasks (desktop-screens v6 'scheduled', designer m_11837; the TUI's scheduled_screen.rs
// words): what wakes his agents, and when. Pure. Owner: amb-kit.
//
// The task is amb-feed's typed rows::ScheduledTask (284bd5c6: HubEv scheduled {project, items},
// HubCmd scheduled {project} and scheduled_stop {project, id}).
import type { ScheduledTask } from '@/proto';
import { scheduled } from '@/proto/words_scheduled.gen';
import { hero } from '@/proto/words_hero.gen';

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

/** A rhythm in the window's one age form (designer m_20461 (2)): '10m' '10 min', '2h' '2 h'. Pure. */
export const rhythmWords = (e: string): string =>
  e.replace(/\b(\d+)\s*m\b/gu, '$1 min').replace(/\b(\d+)\s*h\b/gu, '$1 h').replace(/\b(\d+)\s*s\b/gu, '$1 s');

/** 'every 5 min', 'every day 07:30', 'once' (one run: the hub's every_words rule, never 'every once'). */
export const howOften = (t: ScheduledTask): string => {
  if (t.times === 1) return scheduled.once;
  const e = rhythmWords(t.every.trim());
  if (e === scheduled.once) return e;
  // the hub may already say it ('every 5m'): never 'every every 5 min' (designer D11)
  return /^every\b/iu.test(e) ? e : scheduled.every({ when: e });
};

/** The runs: '3 of 24', '3 runs so far'. */
export function runsWords(t: ScheduledTask): string {
  if (t.times != null) return scheduled.n_of({ count: t.done, total: t.times });
  return scheduled.runs_so_far({ n: t.done });
}

/** The next run's column: '14:22', 'tomorrow 07:30', '—' when none is due. */
export const nextWords = (t: ScheduledTask, now: number): string => (t.next_ms != null ? ahead(t.next_ms, now) : scheduled.next_none);

/** The pane's 'next run': 'the 7th of 24 · 14:22'. */
export function nextRunWords(t: ScheduledTask, now: number): string {
  const nth = ordinal(t.done + 1);
  const which = t.times != null ? scheduled.nth_of({ nth, total: t.times }) : scheduled.nth({ nth });
  return t.next_ms != null ? `${which} · ${ahead(t.next_ms, now)}` : which;
}

/** When it ends: 'after its 24th run', 'at 18:00', 'when it's stopped' (the TUI's). */
export function endsWords(t: ScheduledTask, now: number): string {
  if (t.times === 1) return scheduled.ends_after_run;
  if (t.times != null) return scheduled.ends_after_nth({ nth: ordinal(t.times) });
  if (t.until_ms != null) return scheduled.ends_at({ at: ahead(t.until_ms, now) });
  return scheduled.ends_when_stopped;
}

/** What it does, as lists show it: the hub's short name (sched-names), else its words' first line
 * (an older hub sends no name). The words themselves show on open and hover. */
export const asks = (t: ScheduledTask): string => t.name?.trim() || (t.words.split('\n')[0]?.trim() ?? '');

/** 'deploy-watch · storefront' (the project left out for one project's list). */
export const wakes = (x: Task, withProject = true): string => (withProject && x.projectName !== '' ? `${x.t.agent} · ${x.projectName}` : x.t.agent);

/** The hero's facts line (designer m_39021): how many run and the soonest run, '4 running · next at 07:30'. Pure. */
export function heroFacts(items: readonly Task[], now: number): string {
  const next = Math.min(...items.map((x) => x.t.next_ms ?? Number.MAX_SAFE_INTEGER));
  const n = hero.running({ n: items.length });
  return next === Number.MAX_SAFE_INTEGER || items.length === 0 ? n : `${n} · ${hero.next_at({ at: ahead(next, now) })}`;
}

/** The tasks by next run, soonest first (none due last). */
export function bySoonest(items: readonly Task[]): Task[] {
  return [...items].sort((a, b) => (a.t.next_ms ?? Number.MAX_SAFE_INTEGER) - (b.t.next_ms ?? Number.MAX_SAFE_INTEGER) || a.t.id - b.t.id);
}

export const keyOf = (x: Task): string => `${x.project}#${String(x.t.id)}`;

/** The tasks by project (the page's groups), in the order given (bySoonest's: the group of the
 *  soonest task first); a group's name is its project's, else its id. Pure. */
export function byProject(items: readonly Task[]): { project: string; name: string; items: Task[] }[] {
  const out: { project: string; name: string; items: Task[] }[] = [];
  for (const x of items) {
    const g = out.find((o) => o.project === x.project);
    if (g) g.items.push(x);
    else out.push({ project: x.project, name: x.projectName !== '' ? x.projectName : x.project, items: [x] });
  }
  return out;
}

/** The search: its name or words, who it wakes, its project; case does not count. Pure. */
export const matches = (x: Task, q: string): boolean =>
  [x.t.name ?? '', x.t.words, x.t.agent, x.projectName].some((s) => s.toLowerCase().includes(q.trim().toLowerCase()));
