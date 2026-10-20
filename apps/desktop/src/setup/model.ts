// The first launch (bar S.2, S.4, S.9; desktop-onboarding v4, his pick:
// the old window's winsetup.js onboarding, cut to four): hello, model,
// projects, first (his first message to bise). Pure: which step, what ⏎
// does on each, what it sends, the first message's ideas. Owner: amb-home.
//
// The rules kept from the old window: the model step goes on only once a
// provider's live check works (pay.ts: an agent with no model can't answer); the
// projects step scans his folder when it comes up and adds the repos he
// ticked (his recent ones come ticked: last commit under 30 days); the
// last step, or skip, writes onboarded true (absent = a fresh home, the
// core's for_window says false) and opens bise; the first message sends
// his words to bise first. The permissions are not a step: the capsule asks
// them the first time he holds fn (perms.ts).
import type { AppCmd, Found } from '@/proto';
import { settings } from '@/proto/words.gen';

export const STEPS = ['hello', 'model', 'projects', 'first'] as const;
export type Step = (typeof STEPS)[number];

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

/** The names of the projects he ticked (chosen by hand first, then found), in that order. */
export function tickedNames(s: OnbState, found: readonly Found[], now: number): string[] {
  const chosen = s.chosen.filter((p) => chosenTicked(s, p)).map(baseName);
  const picked = found.filter((f) => !f.known && ticked(s, f, now)).map((f) => f.name);
  return [...chosen, ...picked];
}

/** The first message's three ideas (designer's brief §2.4), from his ticked projects; none ticked: two. */
export function ideas(names: readonly string[]): string[] {
  const [a, b] = names;
  if (a === undefined) return [settings.onb_first_show, settings.onb_first_setup];
  return [settings.onb_first_moved({ project: a }), settings.onb_first_flaky({ project: b ?? a }), settings.onb_first_prs];
}

/** His first message: to bise (main), then the first launch ends (onboarded true) and opens bise. Blank: nothing. */
export function firstSend(s: OnbState, text: string): { s: OnbState; cmds: AppCmd[]; done: boolean } | null {
  if (text.trim() === '') return null;
  return finish(s, [{ cmd: 'send', text }]);
}

/** A path's last part, its name in the list. Pure. */
export function baseName(p: string): string {
  const parts = p.replace(/\/+$/, '').split('/');
  return parts[parts.length - 1] ?? p;
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
  // the first message's ⏎ is its composer's (firstSend); the step has no button
  if (at === 'first') return { s, cmds, done: false };
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

/** The helper's fn on the first message: held, let go (a hold counts once he lets go: he said it, bise has it). */
export function fnAct(s: OnbState, act: string): OnbState {
  if (act === 'talk_start') return { ...s, fn: 'down' };
  if (act === 'talk_end' || act === 'cancel') return { ...s, fn: 'up', tried: s.tried || s.fn === 'down' };
  return s;
}
