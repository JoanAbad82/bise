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
// under ~/.bise/gate, never a test home), its answer read (parseState), the
// bundle's own build (versionCommit), the refusal (swapRefusal) and its words,
// the same on every surface (refusalWords, designer's app-swap v2).
import { join, resolve, sep } from 'node:path';
import type { AppNone, AppRefusal, AppUpdate } from '../../shared/api';
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
 * The swap script's environment, or 'test_home': no swap from this home. His own run (HOME his,
 * BISE_HOME none or his ~/.bise): his variables, no agent's or the app's (childEnv). A stand-in
 * (HOME under his ~/.bise/gate, BISE_HOME none or HOME/.bise: a gate's real-shaped world): the same
 * plus its HOME, so the script finds the stand-in's build dir and opens it there, off-screen when
 * the app was. Any other home (the try's ~/.bise/try/desktop, a candidate's, a harness's): a test
 * app, whose update comes from the try ('bise-ambient --try --replace').
 */
export function swapEnv(
  env: Readonly<Record<string, string | undefined>>,
  realHome: string,
): { readonly env: Record<string, string> } | { readonly none: 'test_home' } {
  const real = resolve(realHome);
  const home = resolve(env['HOME'] ?? real);
  const bise = env['BISE_HOME'] === undefined || env['BISE_HOME'] === '' ? null : resolve(env['BISE_HOME']);
  const his = home === real && (bise === null || bise === join(real, '.bise'));
  const standIn = home.startsWith(join(real, '.bise', 'gate') + sep) && (bise === null || bise === join(home, '.bise'));
  if (!his && !standIn) return { none: 'test_home' };
  const out = childEnv(env, false);
  delete out['BISE_HOME'];
  out['HOME'] = home;
  out['PATH'] = out['PATH'] ?? SYSTEM_PATH;
  if (standIn && env['BISE_DESKTOP_OFFSCREEN'] === '1') out['BISE_DESKTOP_OFFSCREEN'] = '1';
  return { env: out };
}

const STATES: ReadonlySet<string> = new Set(['current', 'staged', 'none']);
const NONES: ReadonlySet<string> = new Set(['test_home', 'not_try', 'old_checkout', 'unreadable', 'not_gated']);

function strOrNull(v: unknown): string | null | undefined {
  if (v === null) return null;
  return typeof v === 'string' && v !== '' ? v : undefined;
}

/** The script's one JSON line (or a test's), or null when it isn't one. `none` and `failed` may be
 * absent (an older script, a test's line): none then, and a 'none' state is 'not_try'. */
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
  const failed = o['failed'] === undefined ? null : strOrNull(o['failed']);
  const none = o['none'] === undefined || o['none'] === null ? null : typeof o['none'] === 'string' && NONES.has(o['none']) ? (o['none'] as AppNone) : undefined;
  const state = o['state'];
  if (typeof state !== 'string' || !STATES.has(state) || live === undefined || staged === undefined || why === undefined) return null;
  if (failed === undefined || none === undefined) return null;
  if ((state === 'staged') !== (staged !== null)) return null;
  return {
    state: state as AppUpdate['state'],
    live,
    staged,
    why,
    none: state === 'none' ? (none ?? 'not_try') : null,
    failed: state === 'staged' ? failed : null,
  };
}

/** Why swap() refuses, or null when it may go. */
export function swapRefusal(u: AppUpdate): AppRefusal | null {
  if (u.state === 'staged') return null;
  if (u.state === 'current') return 'newest';
  return u.none ?? 'not_try';
}

/** A text's first non-empty line, trimmed (an error's, a traceback's last words are below). */
export function firstLine(text: string): string {
  return (
    text
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l !== '') ?? ''
  );
}

/** The refusal in his words (designer's app-swap v2 'les phrases, réécrites'); `line` the first
 * line of what went wrong, for 'unreadable' and 'not_started'. Pure. */
export function refusalWords(r: AppRefusal, line: string | null): string {
  switch (r) {
    case 'newest':
    case 'not_gated':
      return 'nothing new to install: this is the newest build.';
    case 'test_home':
      return "this app runs on a test home, not yours: it can't update itself.";
    case 'old_checkout':
      return 'this build is too old to update from here. the next try updates it.';
    case 'unreadable':
      return `couldn't read the update's state: ${line ?? 'no answer'}`;
    case 'not_started':
      return `the update didn't start: ${line ?? 'no answer'}`;
    case 'not_try':
      return "this app isn't your try's build: it can't update itself.";
  }
}
