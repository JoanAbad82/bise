// The harness never spawns Electron on an app it can't load (main m_24105: a run with no build in
// out/ made Electron's own 'Error launching app · Cannot find module …/out/main/index.js' alert loop
// on his screen). Electron shows that alert only when the app's entry is missing, so the launcher
// asks here first and refuses with one line: the alert can't happen in a harness run.
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * Why `app` (the path the launcher gives Electron: an app folder, or a main script) can't start, or
 * null when its entry is there. A folder's entry is its package.json `main` (index.js when none).
 */
export function appEntryMissing(app: string): string | null {
  if (!existsSync(app)) return `harness: no app at ${app}`;
  if (!statSync(app).isDirectory()) return null;
  let main = 'index.js';
  try {
    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8')) as { main?: unknown };
    if (typeof pkg.main === 'string' && pkg.main !== '') main = pkg.main;
  } catch {
    return `harness: no package.json in ${app}`;
  }
  const entry = path.resolve(app, main);
  return existsSync(entry) ? null : `harness: no app build at ${entry}: pnpm build first (never launched Electron)`;
}
