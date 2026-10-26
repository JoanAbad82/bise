// A project row's facts in the sidebar (round 3, Gabriel's pick H1 on page sidebar-projects,
// designer m_44783): line 1 its name and, at its right, the inbox pill (what waits on him) or the
// age of its last activity; line 2 one plain sentence and its week's day bars (weekBars, designer
// m_45992: Gabriel's m_45988, the trend as small bars, each with its day's tip); a quiet project
// (nothing works, nothing waits, nothing new since he last looked) is one line, its age alone.
// The one adapter between the hub's facts and the row (native-lead m_44796): the project's row,
// its live agents' working count, the inbox's count, the hub's Pulse (architect m_44801: its
// 7-day busy series, its last activity, its one last news, the week's artifacts and the entries
// written for him) and when he last looked at it (`seen`). No pulse (a hub that does not send it
// yet): the pill from the inbox, 'N working' from the agents, no age, no news, no bars.
// Nothing here decides what is news: the hub picks it (pulse::news); this only says it in words.
// Pure: Sidebar.tsx draws it. Owner: r3-projects.
import type { News, ProjectRow, Pulse } from '@/proto';
import { projects } from '@/proto/words_projects.gen';
import { common } from '@/proto/words.gen';
import { shortAge } from '@/agents/model';
import { ahead } from '@/scheduled/model';
import { dayLabel } from '@/thread/entry';
import { waitsTip, workingTip } from './tipwords';

/** The week: 21 buckets of 8 h. */
export const BUCKETS = 21;
export const BUCKET_MS = 8 * 3_600_000;

const DAY = 86_400_000;
/** A project's age: shortAge's ('now', '40 min', '5 h', '3 d'), in weeks from 7 days ('2 w': the mockup's). Pure. */
export const ageWords = (ms: number): string => (ms >= 7 * DAY ? `${String(Math.floor(ms / (7 * DAY)))} w` : shortAge(ms));

/** The row's line 2: its words, and the error colour for a failure. */
export interface Sentence {
  readonly text: string;
  readonly err: boolean;
}

export interface ProjectFacts {
  /** one line: nothing works, nothing waits, nothing new since he looked */
  readonly quiet: boolean;
  /** what waits on him (the inbox's count), the accent pill; null: the age shows instead */
  readonly pill: number | null;
  /** the age of its last activity ('now', '40 min', '2 d'); null when the hub has not said */
  readonly age: string | null;
  /** line 2's words; null on a quiet row */
  readonly sentence: Sentence | null;
  /** the week's busy time, 7 days (3 buckets each) ending with now's; null while unknown or on a quiet row */
  readonly week: readonly number[] | null;
  /** the row's tip: everything at once */
  readonly tip: string;
}

/**
 * The week's buckets as of `now`: a stopped hub's pulse stops moving, so its buckets slide left by
 * the 8 h steps since from_ms's window and the new ones are empty. Pure.
 */
export function weekOf(p: Pulse, now: number): number[] {
  const busy = p.busy_ms.slice(0, BUCKETS);
  while (busy.length < BUCKETS) busy.unshift(0);
  const shift = Math.max(0, Math.floor((now - p.from_ms) / BUCKET_MS) - (BUCKETS - 1));
  return shift >= BUCKETS ? new Array<number>(BUCKETS).fill(0) : [...busy.slice(shift), ...new Array<number>(shift).fill(0)];
}

/** The week's 21 buckets summed into its 7 days, oldest first (designer m_44915: 7 points, not a wave). Pure. */
export function daysOf(week: readonly number[]): number[] {
  const days: number[] = [];
  for (let i = 0; i < week.length; i += 3) days.push((week[i] ?? 0) + (week[i + 1] ?? 0) + (week[i + 2] ?? 0));
  return days;
}

/** How many times are after `seen` (none seen yet: all of them). Pure. */
export const since = (at: readonly number[], seen: number | undefined): number => at.filter((t) => seen === undefined || t > seen).length;

/** The news in his words ('brush landed on main'); null for a kind this window doesn't know. Pure. */
export function newsWords(n: News, now: number): Sentence | null {
  switch (n.what.kind) {
    case 'failed':
      return { text: projects.failed({ agent: n.what.agent }), err: true };
    case 'landed':
      return { text: projects.landed({ agent: n.what.agent, target: n.what.target }), err: false };
    case 'artifact':
      return { text: projects.ready({ title: n.what.title }), err: false };
    case 'scheduled':
      return { text: projects.next_run({ when: ahead(n.at_ms, now) }), err: false };
    default:
      return null;
  }
}

/**
 * A project's facts (designer m_44783). The sentence, the first that applies: '<agent> failed'
 * (its last news, in the error colour); 'N working · M new artifacts' (either part alone); its last
 * news; 'N unread'; what waits on him. A scheduled run ahead is news until it runs; a past news
 * counts only when it is newer than his last look. Pure.
 */
export function projectFacts(c: {
  readonly p: ProjectRow;
  /** its name, the tip's first word (a cut name says itself whole there) */
  readonly name?: string;
  /** its live agents at work now */
  readonly working: number;
  /** the inbox's count for it (inbox/waiting) */
  readonly waits: number;
  /** when he last looked at it (prefs seen.<project>); none: never */
  readonly seen?: number | undefined;
  readonly now: number;
}): ProjectFacts {
  const { p, working, waits, seen, now } = c;
  const pulse = p.pulse ?? null;
  const arts = pulse === null ? 0 : since(pulse.artifacts_at ?? [], seen);
  const unread = pulse === null ? 0 : since(pulse.said_at ?? [], seen);
  const n = pulse?.news ?? null;
  const fresh = n !== null && (n.what.kind === 'scheduled' ? n.at_ms > now : seen === undefined || n.at_ms > seen);
  const news = fresh ? newsWords(n, now) : null;
  const quiet = working === 0 && waits === 0 && arts === 0 && unread === 0 && news === null;
  const busy = [...(working > 0 ? [projects.working({ n: working })] : []), ...(arts > 0 ? [projects.new_artifacts({ n: arts })] : [])];
  const sentence: Sentence | null = quiet
    ? null
    : news?.err === true
      ? news
      : busy.length > 0
        ? { text: busy.join(' · '), err: false }
        : (news ?? { text: unread > 0 ? projects.unread({ n: unread }) : waitsTip(waits), err: false });
  const last = pulse?.last_ms ?? null;
  const age = working > 0 && pulse !== null ? ageWords(0) : last === null ? null : ageWords(now - last);
  // the tip adds what the row doesn't say (designer m_44915): its whole name, then the facts, then the last activity in words
  const lastWords = age === null ? [] : [working > 0 && pulse !== null ? projects.active_now : projects.last_activity({ age })];
  const facts = [
    ...(news?.err === true ? [news.text] : []),
    ...(working > 0 ? [workingTip(working)] : []),
    ...(waits > 0 ? [waitsTip(waits)] : []),
    ...(arts > 0 ? [projects.new_artifacts({ n: arts })] : []),
    ...(unread > 0 ? [projects.unread({ n: unread })] : []),
    ...(news !== null && !news.err ? [news.text] : []),
  ];
  const tip = facts.length === 0 ? [common.all_quiet, ...lastWords] : [...(c.name === undefined ? [] : [c.name]), ...facts, ...lastWords];
  return {
    quiet,
    pill: waits > 0 ? waits : null,
    age,
    sentence,
    week: quiet || pulse === null || pulse.counting ? null : daysOf(weekOf(pulse, now)),
    tip: tip.join(' · '),
  };
}

/** The week's bars (designer m_45992): each 4 wide, 2 apart, 12 high at most; 7 of them make the 40 x 12 box. */
export const BAR_W = 4;
export const BAR_GAP = 2;
export const BAR_H = 12;

/** A day's bar in the row's week: its left, its height (bottom-aligned), its hover column, its tip. */
export interface DayBar {
  /** the bar's left in the box */
  readonly x: number;
  /** its height: the busiest day BAR_H, a day with no work a 1 px stub, any work at least 2 */
  readonly h: number;
  /** its hover column: the bar and half of each gap beside it (the box's edges cut it) */
  readonly hx: number;
  readonly hw: number;
  /** the last one: today's */
  readonly today: boolean;
  /** 'today · 2 h 10 min of agent work', 'sat 24 oct · no agent work' */
  readonly tip: string;
}

/** A day's agent work in words: '40 min', '3 h', '2 h 10 min'; any work at all is at least '1 min'. Pure. */
export function workWords(ms: number): string {
  const m = Math.max(1, Math.ceil(ms / 60_000));
  if (m < 60) return `${String(m)} min`;
  const h = Math.floor(m / 60);
  return m % 60 === 0 ? `${String(h)} h` : `${String(h)} h ${String(m % 60)} min`;
}

/**
 * The week's days as bars, oldest first, today's last: heights scaled to its busiest day, each with
 * its day (the thread's day words: 'today', 'yesterday', 'sat 24 oct') and its work as its tip. Pure.
 */
export function weekBars(week: readonly number[], now: number): DayBar[] {
  const max = Math.max(0, ...week);
  const step = BAR_W + BAR_GAP;
  const width = week.length * step - BAR_GAP;
  return week.map((v, i) => {
    const x = i * step;
    const hx = Math.max(0, x - BAR_GAP / 2);
    const day = dayLabel(now - (week.length - 1 - i) * DAY, now);
    return {
      x,
      h: v <= 0 || max <= 0 ? 1 : Math.max(2, Math.round((v / max) * BAR_H)),
      hx,
      hw: Math.min(width, x + BAR_W + BAR_GAP / 2) - hx,
      today: i === week.length - 1,
      tip: v > 0 ? projects.day_work({ day, work: workWords(v) }) : projects.day_idle({ day }),
    };
  });
}
