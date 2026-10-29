// Where a run on a stand-in home keeps its app data (amb-tools' incident
// m_18637, ambient-lead m_18642: a probe of 'bise-ambient --real' on its
// real-shaped world, opened with HOME=<stand-in>, wrote into his REAL
// ~/Library/Application Support/bise try: Electron finds its folders from the
// user database, never from HOME). A stand-in is a run whose HOME is not his
// home from the user database (os.userInfo().homedir, which HOME can't fake),
// or whose BISE_HOME is set and isn't <his home>/.bise (the try home, a gate
// home). Then the app's userData, session data, crash dumps, logs and temp go
// under it: <stand-in HOME>/Library/... when HOME is a stand-in, else
// <BISE_HOME>/dev/desktop/... His own run (no BISE_HOME, his HOME) changes
// nothing. Test mode keeps its own folder (TEST_USER_DATA_ENV) and wins. Pure.
import { isAbsolute, join, resolve } from 'node:path';

export interface AppPaths {
  readonly userData: string;
  readonly sessionData: string;
  readonly crashDumps: string;
  readonly logs: string;
  readonly temp: string;
}

/** The app's folders for a stand-in run, or null on his own home and bise home. */
export function standInPaths(env: Readonly<Record<string, string | undefined>>, realHome: string, name: string): AppPaths | null {
  const real = resolve(realHome);
  const homeVar = env['HOME'] ?? '';
  const home = homeVar !== '' && isAbsolute(homeVar) ? resolve(homeVar) : real;
  const biseVar = env['BISE_HOME'] ?? '';
  const bise = biseVar !== '' && isAbsolute(biseVar) ? resolve(biseVar) : null;
  if (home !== real) {
    const userData = join(home, 'Library', 'Application Support', name);
    return { userData, sessionData: userData, crashDumps: join(userData, 'Crashpad'), logs: join(home, 'Library', 'Logs', name), temp: join(userData, 'tmp') };
  }
  if (bise !== null && bise !== join(real, '.bise')) {
    const root = join(bise, 'dev', 'desktop', name);
    const userData = join(root, 'userdata');
    return { userData, sessionData: userData, crashDumps: join(userData, 'Crashpad'), logs: join(root, 'logs'), temp: join(root, 'tmp') };
  }
  return null;
}
