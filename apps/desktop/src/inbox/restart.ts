// The truth on his /restart's row (ambient-lead m_22833, his go main m_22831): the hub restarts on
// its version, but this app may be an older build. amb-mac's window.bise.app.update() says which
// build runs (live), and whether a newer one is staged (a --promote); the hub's version is the
// versions' current. A staged build: 'this app is e91f98d7, a newer one is ready ⏎ restart the
// app' (⏎ / click: window.bise.app.swap, drafts and window kept). Nothing staged and another
// version than the hub's: 'this app is e91f98d7 · it updates at the next try'. The same version,
// a dev or test run (no live), or an app that can't swap from here: the hub's line alone. Pure,
// but for appBuild/appSwap, the two reads of window.bise. Owner: amb-home.

import type { AppUpdate, BiseApi } from '@/shared/api';

/** amb-mac's window.bise.app.update() (38a0bbe3). */
export type AppBuild = AppUpdate;

export type RestartTail = { readonly kind: 'staged'; readonly live: string } | { readonly kind: 'older'; readonly live: string };

const short = (sha: string): string => sha.trim().slice(0, 8).toLowerCase();

/** Two version ids name the same commit (one may be the other's short form). Pure. */
export function sameVersion(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  return x !== '' && y !== '' && (x.startsWith(y) || y.startsWith(x));
}

/** What the row adds after the hub's words, or null: the hub's line alone. Pure. */
export function restartTail(app: AppBuild | null, hub: string | null): RestartTail | null {
  if (app === null || app.live === null || app.live.trim() === '') return null;
  const live = short(app.live);
  if (app.state === 'staged') return { kind: 'staged', live };
  if (app.state !== 'current' || hub === null || sameVersion(app.live, hub)) return null;
  return { kind: 'older', live };
}

/** The tail's words (the act ⏎ restart to update is drawn apart). Pure. */
export function tailWords(t: RestartTail): string {
  return t.kind === 'staged' ? `this app is ${t.live}, a newer one is ready` : `this app is ${t.live} · it updates at the next try`;
}

type AppApi = BiseApi['app'];

/** amb-mac's window.bise.app, when this app has it (an older preload has none). */
function appApi(): AppApi | null {
  const app = (window.bise as unknown as { app?: Partial<AppApi> } | undefined)?.app;
  return typeof app?.update === 'function' && typeof app.swap === 'function' ? (app as AppApi) : null;
}

/** This app's build now; null when it can't say (an older shell, or the read failed). */
export async function appBuild(): Promise<AppBuild | null> {
  const api = appApi();
  if (api === null) return null;
  try {
    return await api.update();
  } catch {
    return null;
  }
}

/** The staged build in place of this one, reopening `route` (amb-mac m_22859): null when the swap
 * started (the app quits ~50 ms later), else the refusal's why. */
export async function appSwap(route: string | undefined): Promise<string | null> {
  const api = appApi();
  if (api === null) return 'this app cannot restart itself';
  try {
    const r = await api.swap(route);
    return r.ok ? null : r.why;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}
