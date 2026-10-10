// The sidebar's words and signs (designer's desktop-screens v6/v7, signed): one
// sign per agent in a 15 px mono column, the same signs as the TUI's, what
// a project's row says on its right, which done agents fold into 'n more
// today', and the window's widths (the sidebar slides over under 1000 px,
// the right panel is open by default from 1100 px). Owner: amb-win. Pure:
// Sidebar.tsx and App.tsx draw these.
import type { Agent, ComputerAgent, ProjectRow } from '@/proto';
import { MAIN, type Route } from './route';
import { shortAge, shownName } from '@/agents/model';

/** A sign's tone: ink (at work), accent (asks him), err (failed), dim (the rest). */
export type Tone = 'ink' | 'acc' | 'err' | 'dim';

export interface Sign {
  /** the mono glyph: ∿ ? ⋯ ✗ ◷ ✓ – */
  readonly g: string;
  readonly tone: Tone;
  /** the row's end words ('14m', 'done', '14:20'); '' when a count says it */
  readonly end: string;
  readonly endTone: 'dim' | 'err';
  /** the pink count of what it asks him (0: none) */
  readonly count: number;
  /** the hover words: its state in full (never by color alone) */
  readonly title: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const hm = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** A turn's length, in the one short age (ambient m_12439): 'now', '6 min', '2 h', '3 d'. */
export function turnShort(ms: number): string {
  return shortAge(ms);
}

/**
 * An agent's sign: what it asks him first (? and a pink count), then at work
 * (∿ and its turn time), waiting on someone (⋯, who on hover), failed (✗),
 * a next wake (◷ and its time), done (✓), at rest (–). `wake`: the next run
 * of a scheduled task that wakes it. Pure.
 */
export function signOf(a: Agent, now: number, wake?: number): Sign {
  const what = a.title !== '' ? a.title : a.purpose;
  if (a.waits > 0) return { g: '?', tone: 'acc', end: '', endTone: 'dim', count: a.waits, title: `asks you · ${what}` };
  // R9/S3: whom it waits on, typed by the hub (the TUI's panel: ? when it is him, … another agent)
  if (a.waiting_on?.who === 'you') return { g: '?', tone: 'acc', end: '', endTone: 'dim', count: 0, title: `asks you · ${what}` };
  if (a.waiting_on?.who === 'agent') return { g: '⋯', tone: 'dim', end: 'waiting', endTone: 'dim', count: 0, title: `waiting on ${shownName(a.waiting_on.name)} · ${what}` };
  switch (a.status) {
    case 'working':
      return { g: '∿', tone: 'ink', end: turnShort(a.turn_ms ?? now - a.since_ms), endTone: 'dim', count: 0, title: `working · ${what}` };
    case 'waiting':
    case 'blocked':
      return { g: '⋯', tone: 'dim', end: 'waiting', endTone: 'dim', count: 0, title: `waiting · ${what}` };
    case 'failed':
      return { g: '✗', tone: 'err', end: 'failed', endTone: 'err', count: 0, title: `failed · ${what}` };
    default:
      break;
  }
  if (wake !== undefined) return { g: '◷', tone: 'dim', end: hm(wake), endTone: 'dim', count: 0, title: `wakes at ${hm(wake)} · ${what}` };
  if (a.status === 'done') return { g: '✓', tone: 'dim', end: 'done', endTone: 'dim', count: 0, title: `done · ${what}` };
  return { g: '–', tone: 'dim', end: 'stopped', endTone: 'dim', count: 0, title: `stopped · ${what}` };
}

/**
 * S29/L19 W3: the core's mark beside an agent that uses his computer (amb-core m_16595): '↖' in
 * ink while it drives, '?' in the accent when he took the wheel, dim when stopped; its words on
 * hover; none without a row. Pure.
 */
export function computerDot(r: ComputerAgent | undefined): { g: string; tone: Tone; title: string } | null {
  if (r === undefined) return null;
  const tone: Tone = r.kind === 'driving' ? 'ink' : r.kind === 'paused' ? 'acc' : 'dim';
  return { g: r.mark, tone, title: r.words };
}

/** How long a done agent stays in the sidebar before it folds. */
export const FOLD_AFTER_MS = 3_600_000;

/**
 * A done agent quiet for over an hour (not one that waits, works, failed or wakes). An idle one
 * stays: it is at rest, waiting for his next message, not finished. Pure.
 */
export function folds(a: Agent, now: number, wake?: number): boolean {
  if (a.waits > 0 || wake !== undefined) return false;
  if (a.status !== 'done') return false;
  return now - a.since_ms > FOLD_AFTER_MS;
}

/** The fold's words: '3 more today', or '3 more' when some are older than today. Pure. */
export function moreWords(folded: readonly Agent[], now: number): string {
  const today = new Date(now).setHours(0, 0, 0, 0);
  const n = String(folded.length);
  return folded.every((a) => a.since_ms >= today) ? `${n} more today` : `${n} more`;
}

/** A project row's right side: its words (dim or err) and his pink count. Pure. */
export function projectSide(p: ProjectRow, refused = false): { text: string; err: boolean; count: number } {
  if (p.missing === true) return { text: 'folder gone', err: true, count: 0 };
  if (refused) return { text: 'refused', err: true, count: 0 };
  const working = p.working > 0 ? `∿ ${String(p.working)}` : '';
  return { text: working === '' && p.waits === 0 ? 'all quiet' : working, err: false, count: p.waits };
}

/**
 * The project the right panel shows here: the route's; on bise's own thread every project's ('',
 * designer m_12093), none while he has no project; none on the global screens. Pure.
 */
export function panelProject(route: Route, home: string | undefined, projects: number): string | undefined {
  const all = projects > 0 ? '' : undefined;
  switch (route.screen) {
    case 'bise':
      return all;
    case 'thread':
      return route.project === home ? all : route.project;
    case 'agents':
    case 'changes':
    case 'review':
    case 'feature':
    case 'prs':
    case 'commit':
    case 'branch':
    case 'environments':
      return route.project;
    default:
      return undefined;
  }
}

/** The titlebar's crumb: where he is, 'storefront › perf' (a project's main is the project). Pure. */
export function crumbOf(route: Route, name: (project: string) => string): string[] {
  switch (route.screen) {
    case 'bise':
      return ['bise'];
    case 'thread':
      return route.agent === MAIN ? [name(route.project)] : [name(route.project), route.agent];
    case 'agents':
    case 'changes':
    case 'prs':
    case 'environments':
      return [name(route.project), route.screen];
    case 'review':
      return [name(route.project), route.agent, 'changes'];
    case 'feature':
      return [name(route.project), `ψ ${route.name}`];
    case 'commit':
      return [name(route.project), route.sha.slice(0, 7)];
    case 'branch':
      return [name(route.project), route.branch];
    case 'artifacts':
      return route.project === '' ? ['artifacts'] : [name(route.project), 'artifacts'];
    case 'settings':
      return route.page === undefined ? ['settings'] : ['settings', route.page];
    case 'notfound':
      return ['not found'];
    case 'report':
      // the page's own words (designer m_17010)
      return ['crash report'];
    case 'lab':
      return ['lab', route.lab];
    default:
      return [route.screen];
  }
}

/** Under this width the sidebar (and the right panel) slide over the window. */
export const NARROW_PX = 1000;
/** From this width the right panel is open by default. */
export const PANEL_OPEN_PX = 1100;

/** The panel's state at a width: docked (open or closed) or sliding over. Pure. */
export function panelAt(width: number, kept: boolean | undefined): { docked: boolean; open: boolean } {
  if (width < NARROW_PX) return { docked: false, open: false };
  return { docked: true, open: kept ?? width >= PANEL_OPEN_PX };
}
