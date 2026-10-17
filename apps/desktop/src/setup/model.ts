// The first launch (bar S.2, S.4, S.7, S.9; desktop-app v9 "le premier
// lancement"; the old window's winsetup.js onboarding, ported): five
// steps, hello, permissions, model, projects, fn. Pure: which step, what
// ⏎ does on each, what it sends. Owner: amb-home.
//
// The rules kept from the old window: the model step goes on only once a
// provider's live check works (pay.ts: an agent with no model can't answer); the
// projects step scans his folder when it comes up and adds the repos he
// ticked (his recent ones come ticked: last commit under 30 days); the
// last step, or skip, writes onboarded true (absent = a fresh home, the
// core's for_window says false) and opens bise. Permissions never block:
// each has allow and "continue for now"; a refused one says how to grant it.
import type { AppCmd, Found, Grant, Perm } from '@/proto';

export const STEPS = ['hello', 'permissions', 'model', 'projects', 'fn'] as const;
export type Step = (typeof STEPS)[number];

/** The three permissions the first launch asks: all the helper has. */
export const PERMS: readonly Perm[] = ['mic', 'accessibility', 'screen'];

export type Perms = Readonly<Partial<Record<Perm, Grant>>>;

/** A repo found less than 30 days ago comes ticked. */
export const RECENT_MS = 30 * 86_400_000;

export interface OnbState {
  readonly at: number;
  /** the found repos he ticked or unticked, by path (absent: its default) */
  readonly picks: Readonly<Record<string, boolean>>;
  /** the folders he chose by hand ('choose a folder…'), newest first; ticked unless he unticks them */
  readonly chosen: readonly string[];
  /** fn: held now, and held once at least */
  readonly fn: 'up' | 'down';
  readonly tried: boolean;
}

export const START: OnbState = { at: 0, picks: {}, chosen: [], fn: 'up', tried: false };

/** A folder he chose by hand joins the list at the top, ticked (one already found is just ticked). */
export function choose(s: OnbState, path: string, found: readonly Found[]): OnbState {
  const picks = { ...s.picks, [path]: true };
  if (found.some((f) => f.path === path) || s.chosen.includes(path)) return { ...s, picks };
  return { ...s, picks, chosen: [path, ...s.chosen] };
}

/** A chosen folder is ticked unless he unticked it. */
export function chosenTicked(s: OnbState, path: string): boolean {
  return s.picks[path] ?? true;
}

/** The found repos whose name or path holds every word he typed (case aside). Pure. */
export function filterFound<T extends { name: string; path: string }>(items: readonly T[], q: string): readonly T[] {
  const words = q.toLowerCase().split(/\s+/).filter((w) => w !== '');
  if (words.length === 0) return items;
  return items.filter((f) => {
    const hay = `${f.name} ${f.path}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

export function stepOf(s: OnbState): Step {
  return STEPS[Math.max(0, Math.min(STEPS.length - 1, s.at))] ?? 'hello';
}

/** A found repo is ticked: his pick, else recent and not his yet. */
export function ticked(s: OnbState, f: Found, now: number): boolean {
  return s.picks[f.path] ?? (!f.known && now - f.last_ms < RECENT_MS);
}

export function allAllowed(p: Perms): boolean {
  return PERMS.every((x) => p[x] === 'allowed');
}

export interface Ctx {
  /** the model step's check works (pay.ts ready) */
  signedIn: boolean;
  found: readonly Found[];
  now: number;
}

/** ⏎ (or the step's button): what it sends, the next state, and whether the first launch ends. */
export function next(s: OnbState, c: Ctx): { s: OnbState; cmds: AppCmd[]; done: boolean } {
  const at = stepOf(s);
  const cmds: AppCmd[] = [];
  if (at === 'model' && !c.signedIn) return { s, cmds, done: false };
  if (at === 'projects') {
    for (const p of s.chosen) if (chosenTicked(s, p)) cmds.push({ cmd: 'project_add', path: p });
    for (const f of c.found) if (!f.known && ticked(s, f, c.now)) cmds.push({ cmd: 'project_add', path: f.path });
  }
  if (at === 'fn') return finish(s, cmds);
  const n = { ...s, at: s.at + 1 };
  if (stepOf(n) === 'projects' && c.found.length === 0) cmds.push({ cmd: 'found_scan' });
  return { s: n, cmds, done: false };
}

/** skip, or the last step: onboarded true, then bise. */
export function finish(s: OnbState, cmds: AppCmd[] = []): { s: OnbState; cmds: AppCmd[]; done: boolean } {
  return { s, cmds: [...cmds, { cmd: 'prefs_set', key: 'onboarded', value: true }], done: true };
}

export function back(s: OnbState): OnbState {
  return { ...s, at: Math.max(0, s.at - 1) };
}

export function pick(s: OnbState, f: Found, now: number): OnbState {
  return { ...s, picks: { ...s.picks, [f.path]: !ticked(s, f, now) } };
}

/** Tick or untick a folder he chose by hand. */
export function pickChosen(s: OnbState, path: string): OnbState {
  return { ...s, picks: { ...s.picks, [path]: !chosenTicked(s, path) } };
}

/** The helper's fn: held, let go (a hold counts as a try once he lets go). */
export function fnAct(s: OnbState, act: string): OnbState {
  if (act === 'talk_start') return { ...s, fn: 'down' };
  if (act === 'talk_end' || act === 'cancel') return { ...s, fn: 'up', tried: s.tried || s.fn === 'down' };
  return s;
}
