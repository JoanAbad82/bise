// fn's permissions, just in time (desktop-onboarding v4 §3): the first launch no longer asks them;
// the first time he holds fn (or fn space, fn fn) with one missing, the capsule shows one sheet
// with the three, [allow] (macOS's prompts in turn) and 'not now' (his words still go to bise,
// typed in the spotlight). Once shown, never again: the `hints.fn_perms` preference (rust/home
// prefs.rs DESKTOP_HINTS) says shown, never granted; whether one is missing comes from the
// helper's perms each time. Never asked if he never uses fn; settings › privacy keeps its rows.
// Pure. Owner: amb-home.
import type { AppCmd, FnAct, Grant, Perm } from '@/proto';

/** The three permissions fn needs: all the helper has. */
export const PERMS: readonly Perm[] = ['mic', 'accessibility', 'screen'];

export type Perms = Readonly<Partial<Record<Perm, Grant>>>;

/** The preference that says the sheet was shown once. */
export const SHOWN_KEY = 'hints.fn_perms';

export function allAllowed(p: Perms): boolean {
  return PERMS.every((x) => p[x] === 'allowed');
}

/** The helper's perms are known (its first perms event came): none known, nothing is missing yet. */
export function known(p: Perms): boolean {
  return PERMS.some((x) => p[x] !== undefined);
}

/** Whether this fn act opens the sheet: a hold, fn fn or fn space, a permission missing, never shown before. */
export function sheetOpens(act: FnAct, key: string | null | undefined, p: Perms, shown: boolean): boolean {
  if (shown || !known(p) || allAllowed(p)) return false;
  return act === 'talk_start' || act === 'double' || (act === 'key' && key === 'space');
}

/** The sheet shows: it is marked shown at once (he quits the app with it up: never again either). */
export const MARK_SHOWN: AppCmd = { cmd: 'prefs_set', key: SHOWN_KEY, value: true };

/** Whether the prefs say the sheet was shown (`hints.fn_perms` true). */
export function shownIn(prefs: unknown): boolean {
  if (typeof prefs !== 'object' || prefs === null) return false;
  const hints = (prefs as { hints?: unknown }).hints;
  return typeof hints === 'object' && hints !== null && (hints as Record<string, unknown>)['fn_perms'] === true;
}

/** [allow]: the next permission to ask, in order: one not asked yet gets macOS's prompt, a refused one its pane. */
export function nextAsk(p: Perms): { perm: Perm; action: 'ask' | 'open' } | null {
  for (const x of PERMS) {
    const g = p[x];
    if (g === 'allowed') continue;
    return { perm: x, action: g === 'denied' ? 'open' : 'ask' };
  }
  return null;
}
