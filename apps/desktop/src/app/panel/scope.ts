// src/app/panel · the panel per project (his m_45500: « le state des panels est scopé par
// projet », architect m_45519), pure: each project keeps its own panel (open or folded, its tabs,
// the one in front, its width, full width), switching projects shows that project's last one, a
// project that never opened a panel has none (FOLDED). His Recent and his artifact shares stay
// the window's: they are his, across projects. state.ts keeps one PanelRec per window in keep and
// shows the PanelKept of the scope in front (viewOf), so every reader keeps reading a PanelKept.
// Owner: panel-scope.
import { projectOf, type Route } from '@/app/route';
import { FOLDED, parseKept, type PanelKept } from './model';

/** One project's panel: the kept state but his Recent and his shares (the window's). */
export type Scoped = Omit<PanelKept, 'recent' | 'shares'>;

/** The window's panels: one per project (the hub id, as Entity.project), the one in front `at`. */
export interface PanelRec {
  /** the project in front ('' before the first route said one) */
  readonly at: string;
  readonly byProject: Readonly<Record<string, Scoped>>;
  readonly recent: PanelKept['recent'];
  readonly shares: PanelKept['shares'];
}

export const EMPTY_REC: PanelRec = { at: '', byProject: {}, recent: FOLDED.recent, shares: FOLDED.shares };

/**
 * The project whose panel shows on `route`: the route's project; bise's own screen is the home's
 * (once the rows said which it is); a screen of no project (the inbox, settings, the report)
 * keeps `was`. The one place that says it. Pure.
 */
export function scopeOf(route: Route, home: string | undefined, was: string): string {
  const p = route.screen === 'bise' ? home : projectOf(route);
  return p === undefined || p === '' ? was : p;
}

/** A kept state's own part (its project's), without the window's Recent and shares. Pure. */
function scopedOf(k: PanelKept): Scoped {
  return Object.fromEntries(Object.entries(k).filter(([key]) => key !== 'recent' && key !== 'shares')) as Scoped;
}

/** The panel in front: the scope's, else FOLDED (a project that never opened one), with the window's Recent and shares. Pure. */
export function viewOf(rec: PanelRec): PanelKept {
  const own = rec.byProject[rec.at] ?? scopedOf(FOLDED);
  return { ...own, recent: rec.recent, shares: rec.shares };
}

/** The panel in front changed: only its own scope is written, Recent and shares the window's. Pure. */
export function putView(rec: PanelRec, k: PanelKept): PanelRec {
  if (rec.at === '') return { ...rec, recent: k.recent, shares: k.shares };
  return { ...rec, byProject: { ...rec.byProject, [rec.at]: scopedOf(k) }, recent: k.recent, shares: k.shares };
}

/** Another project in front: its own panel shows, the others stay as they were. Pure. */
export function switchTo(rec: PanelRec, at: string): PanelRec {
  return at === rec.at || at === '' ? rec : { ...rec, at };
}

/**
 * The projects rows came: the panels of projects no longer in them go. Only on a full list: an
 * empty one (the core not up, the registry not read yet) drops nothing. Pure.
 */
export function pruneScopes(rec: PanelRec, projects: readonly string[]): PanelRec {
  if (projects.length === 0) return rec;
  const keep = new Set(projects);
  const gone = Object.keys(rec.byProject).filter((p) => !keep.has(p));
  if (gone.length === 0) return rec;
  return { ...rec, byProject: Object.fromEntries(Object.entries(rec.byProject).filter(([p]) => keep.has(p))) };
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/**
 * A record from before the panel was per project: the window's one panel, its tabs at the top.
 * TODO(panel-scope): goes in desktop-v2026.10.22, once every window wrote a per-project record.
 */
export function isFlat(raw: unknown): boolean {
  return isObj(raw) && !isObj(raw['byProject']) && isObj(raw['tabs']);
}

/**
 * The kept record read back; each project's panel as parseKept reads it (anything unreadable
 * dropped). A flat record from before (isFlat) becomes the panel of `at`, the project the window
 * starts on, so his tabs stay across the update (TODO(panel-scope), architect m_45519 #3). Pure.
 */
export function parseRec(raw: unknown, at = ''): PanelRec {
  if (!isObj(raw)) return at === '' ? EMPTY_REC : { ...EMPTY_REC, at };
  // the window's own part reads the same as a project's (parseKept), with no tabs
  const mine = parseKept({ recent: raw['recent'], shares: raw['shares'] });
  if (isFlat(raw)) {
    const flat = parseKept(raw);
    return at === '' ? { ...EMPTY_REC, recent: flat.recent, shares: flat.shares } : { at, byProject: { [at]: scopedOf(flat) }, recent: flat.recent, shares: flat.shares };
  }
  const byProject: Record<string, Scoped> = {};
  if (isObj(raw['byProject'])) for (const [p, k] of Object.entries(raw['byProject'])) if (p !== '' && isObj(k)) byProject[p] = scopedOf(parseKept(k));
  const was = typeof raw['at'] === 'string' ? raw['at'] : '';
  return { at: at !== '' ? at : was, byProject, recent: mine.recent, shares: mine.shares };
}
