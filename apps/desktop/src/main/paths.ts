// Where the app finds its bise (pure: everything it reads comes in as an
// argument; src/main/core spawns `<bise> ambient-core` with it). Never a
// bare 'bise' looked up on PATH (lead m_8079): an absolute path or nothing.
//   packaged  <Resources>/bin/bise, the one shipped inside the app
//             (electron-builder.mjs puts it there)
//   dev       BISE_DESKTOP_BISE when it is a path, else the repo's own
//             build (rust/target/release, then debug), else none
import { join } from 'node:path';

export const BISE_ENV = 'BISE_DESKTOP_BISE';

export interface Where {
  readonly env: Readonly<Record<string, string | undefined>>;
  /** app.isPackaged */
  readonly packaged: boolean;
  /** process.resourcesPath (Contents/Resources when packaged) */
  readonly resourcesPath: string;
  /** app.getAppPath(): apps/desktop in dev */
  readonly appPath: string;
  readonly exists: (path: string) => boolean;
}

/** The bise binary this app runs, or null when there is none. */
export function binPath(w: Where): string | null {
  if (w.packaged) {
    const shipped = join(w.resourcesPath, 'bin', 'bise');
    return w.exists(shipped) ? shipped : null;
  }
  const set = w.env[BISE_ENV] ?? '';
  if (set.includes('/')) return set;
  const repo = join(w.appPath, '..', '..');
  for (const p of [join(repo, 'rust', 'target', 'release', 'bise'), join(repo, 'rust', 'target', 'debug', 'bise')]) {
    if (w.exists(p)) return p;
  }
  return null;
}
