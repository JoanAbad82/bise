// The test home fence (main m_9883, lead m_9887: a harness run with his real
// HOME made the app's core start his real global hub, ~/bise, through
// launchd). Pure: in test mode (BISE_DESKTOP_TEST=1) the app only starts in a
// throwaway home the harness made: HOME set and not his real home, BISE_HOME
// set and inside HOME, the core's workspace (BISE_DESKTOP_WORKSPACE, when
// given) inside HOME. index.ts checks it before anything else and exits 3
// with the reason on stderr, before any window, helper or core.
import { isAbsolute, relative, resolve } from 'node:path';

/** `p` is `root` or inside it (both absolute; no '..' escape). */
export function inside(p: string, root: string): boolean {
  if (!isAbsolute(p) || !isAbsolute(root)) return false;
  const r = relative(resolve(root), resolve(p));
  return r === '' || (!r.startsWith('..') && !isAbsolute(r));
}

/**
 * Why this test run may not start, or null when its home is a throwaway one.
 * `realHome`: his home from the user database (os.userInfo().homedir), which
 * HOME can't fake.
 */
export function testHomeProblem(env: Readonly<Record<string, string | undefined>>, realHome: string): string | null {
  const home = env['HOME'] ?? '';
  if (home === '' || !isAbsolute(home)) return 'HOME is not set to an absolute throwaway folder';
  if (inside(realHome, home)) return `HOME (${home}) is his real home or holds it (${realHome})`;
  const biseHome = env['BISE_HOME'] ?? '';
  if (biseHome === '') return 'BISE_HOME is not set (bise would pick a home of its own)';
  if (!inside(biseHome, home)) return `BISE_HOME (${biseHome}) is outside the test HOME (${home})`;
  const jail = env['BISE_TEST_HOME'] ?? '';
  if (jail !== '' && !inside(home, jail)) return `HOME (${home}) is outside BISE_TEST_HOME (${jail})`;
  const ws = env['BISE_DESKTOP_WORKSPACE'] ?? '';
  if (ws !== '' && !inside(ws, home)) return `BISE_DESKTOP_WORKSPACE (${ws}) is outside the test HOME (${home})`;
  return null;
}
