// The try app's swap to the staged gated build, from inside (ambient-lead
// m_22832), the pure part; the shell is tryrun.ts. Owner: amb-mac.
//
// His try app is 'bise try.app' packed in his try checkout
// (<checkout>/apps/desktop/dist/<arch>/bise try.app). Its staged build, the
// try stamp and the swap belong to scripts/desktop_try.py: the app never reads
// them itself, it runs that checkout's scripts/desktop_try_swap.py ('state'
// for window.bise.app.update(), 'swap' after it saved, the --real path:
// quit by pid, the renames, the open; his hubs keep running), so there is one
// reader of the stamp and the state says 'staged' only when the swap would
// really happen. Here: where the script is (tryBundle), on which home the
// swap may run and with what environment (swapEnv: his own, or a stand-in
// under ~/.bise/gate, never the try home), its answer read (parseState), the
// bundle's own build (versionCommit) and the refusal (swapRefusal).
import { join, resolve, sep } from 'node:path';
import type { AppUpdate } from '../../shared/api';
import { childEnv } from '../childenv';

/** The try bundle the app runs from and its checkout's swap script, or null (a dev run, a candidate, his app). */
export function tryBundle(execPath: string): { readonly bundle: string; readonly script: string } | null {
  const m = /^(\/.+\/apps\/desktop\/dist\/[^/]+\/bise try\.app)\/Contents\/MacOS\/[^/]+$/.exec(execPath);
  if (m === null) return null;
  const bundle = m[1] ?? '';
  return { bundle, script: join(resolve(bundle, '..', '..', '..', '..', '..'), 'scripts', 'desktop_try_swap.py') };
}

/** The commit a bundle's runtime VERSION names (`commit=<sha>`), or null. */
export function versionCommit(text: string | null): string | null {
  const m = /^commit=([0-9a-f]{7,40})\s*$/m.exec(text ?? '');
  return m?.[1] ?? null;
}

const SYSTEM_PATH = '/usr/bin:/bin:/usr/sbin:/sbin';

/**
 * The swap script's environment, or why there is no swap from this home. His own run (HOME his,
 * BISE_HOME none or his ~/.bise): his variables, no agent's or the app's (childEnv). A stand-in
 * (HOME under his ~/.bise/gate, BISE_HOME none or HOME/.bise: a gate's real-shaped world): the same
 * plus its HOME, so the script finds the stand-in's build dir and opens it there, off-screen when
 * the app was. Any other home (the try's ~/.bise/try/desktop): none, its swap is --try --replace.
 */
export function swapEnv(
  env: Readonly<Record<string, string | undefined>>,
  realHome: string,
): { readonly env: Record<string, string> } | { readonly why: string } {
  const real = resolve(realHome);
  const home = resolve(env['HOME'] ?? real);
  const bise = env['BISE_HOME'] === undefined || env['BISE_HOME'] === '' ? null : resolve(env['BISE_HOME']);
  const his = home === real && (bise === null || bise === join(real, '.bise'));
  const standIn = home.startsWith(join(real, '.bise', 'gate') + sep) && (bise === null || bise === join(home, '.bise'));
  if (!his && !standIn) {
    return { why: `this app runs on ${bise ?? home}, not on your home: 'bise-ambient --try --replace' swaps the try` };
  }
  const out = childEnv(env, false);
  delete out['BISE_HOME'];
  out['HOME'] = home;
  out['PATH'] = out['PATH'] ?? SYSTEM_PATH;
  if (standIn && env['BISE_DESKTOP_OFFSCREEN'] === '1') out['BISE_DESKTOP_OFFSCREEN'] = '1';
  return { env: out };
}

const STATES: ReadonlySet<string> = new Set(['current', 'staged', 'none']);

function strOrNull(v: unknown): string | null | undefined {
  if (v === null) return null;
  return typeof v === 'string' && v !== '' ? v : undefined;
}

/** The script's one JSON line (or a test's), or null when it isn't one. */
export function parseState(text: string): AppUpdate | null {
  let v: unknown;
  try {
    v = JSON.parse(text.trim());
  } catch {
    return null;
  }
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  const [live, staged, why] = [strOrNull(o['live']), strOrNull(o['staged']), strOrNull(o['why'])];
  const state = o['state'];
  if (typeof state !== 'string' || !STATES.has(state) || live === undefined || staged === undefined || why === undefined) return null;
  if ((state === 'staged') !== (staged !== null)) return null;
  return { state: state as AppUpdate['state'], live, staged, why };
}

/** Why swap() refuses, or null when it may go. */
export function swapRefusal(u: AppUpdate): string | null {
  if (u.state === 'staged') return null;
  return u.why ?? 'nothing is staged: this app is the newest gated build';
}
