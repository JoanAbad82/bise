// The tray menu's projects block (his ask, main m_27861; designer's layout m_27872): one line
// per project with what's useful at a glance, what waits on him and its agents at work, like
// Codex's menu-bar menu. bise's home first ('bise', its own counts), then his projects in the
// sidebar's order (stable: a line never jumps while he reads). At most MENU_PROJECTS projects,
// but never a live one hidden: every project with something waiting or working shows, quiet
// ones fill the rest; the last row counts what's left out ('3 more in bise', a click opens bise). The counts are
// the hub row's, the ones the sidebar's mark reads. Pure: Capsule's MenuProjects says them.
import { common } from '@/proto/words.gen';
import { panel } from '@/proto/words_panel.gen';
import type { SpotData } from '@/spotlight';
import { summaryOf, type Summary } from './projsum';

/** The tray menu lists this many projects (bise's own line apart), more when more are live. */
export const MENU_PROJECTS = 6;

export interface ProjectLine {
  /** the project's id; '' for bise's home */
  readonly id: string;
  readonly name: string;
  /** what waits on him there */
  readonly waits: number;
  /** its agents at work */
  readonly working: number;
  /** its folder is gone: quiet, whatever its counts */
  readonly missing: boolean;
  /** its hover words: 'harness · 1 waiting for you · 3 agents at work · on main' */
  readonly tip: string;
  /** where a click goes (a window route) */
  readonly route: string;
  /** a live line's second line (projsum.ts); null: one line */
  readonly summary: Summary | null;
  /** the project its agents and cards name (bise's home: its id; '' unknown) */
  readonly project: string;
}

/** Something goes on there: it waits on him or works (a gone folder never). */
export const isLive = (l: Pick<ProjectLine, 'waits' | 'working' | 'missing'>): boolean => !l.missing && l.waits + l.working > 0;

function tipOf(name: string, waits: number, working: number, branch: string | null): string {
  const parts = [name];
  if (waits > 0) parts.push(common.waiting_for_you({ n: waits }));
  if (working > 0) parts.push(common.agents_at_work({ n: working }));
  if (waits + working === 0) parts.push(common.all_quiet);
  if (branch !== null) parts.push(panel.tray_on_branch({ branch }));
  return parts.join(' · ');
}

/**
 * bise's line (when the home is known), then the projects that show, in his order; `more`: how
 * many projects are left out. Pure.
 */
export function projectLines(spot: SpotData, max = MENU_PROJECTS): { readonly lines: readonly ProjectLine[]; readonly more: number } {
  const all: ProjectLine[] = spot.projects.map((p) => {
    const waits = p.waits ?? 0;
    const working = p.working ?? 0;
    const missing = p.missing === true;
    const live = isLive({ waits, working, missing });
    return {
      id: p.id, name: p.name, waits, working, missing, tip: tipOf(p.name, missing ? 0 : waits, missing ? 0 : working, p.branch), route: `project/${p.id}`,
      summary: live ? summaryOf(spot, p.id) : null, project: p.id,
    };
  });
  const live = all.filter(isLive).length;
  let room = Math.max(0, max - live);
  const shown = all.filter((l) => {
    if (isLive(l)) return true;
    if (room === 0) return false;
    room -= 1;
    return true;
  });
  const h = spot.home;
  const home: ProjectLine[] =
    h === undefined
      ? []
      : [
          {
            id: '', name: panel.bise, waits: h.waits, working: h.working, missing: false, tip: tipOf(panel.bise, h.waits, h.working, null), route: 'bise',
            summary: h.id !== undefined && h.waits + h.working > 0 ? summaryOf(spot, h.id, true) : null, project: h.id ?? '',
          },
        ];
  return { lines: [...home, ...shown], more: all.length - shown.length };
}

/** The menu has a projects block: bise's home or a project is known. Pure. */
export const hasProjects = (spot: SpotData): boolean => spot.home !== undefined || spot.projects.length > 0;

/**
 * The head's counts, the same the project lines read (designer m_27930: the menu never
 * contradicts itself): the hub rows' sums, bise's home in; with no row known, the agents at work
 * and the cards. Pure.
 */
export function menuCounts(spot: SpotData): { readonly work: number; readonly waits: number } {
  if (!hasProjects(spot)) return { work: spot.agents.filter((a) => a.status === 'working').length, waits: spot.cards.length };
  const { lines } = projectLines(spot, Number.POSITIVE_INFINITY);
  return lines.reduce((n, l) => (l.missing ? n : { work: n.work + l.working, waits: n.waits + l.waits }), { work: 0, waits: 0 });
}
