// The Electron binary the harness launches: Electron's own dist, cloned and marked as a background
// app (LSUIElement=1, ad-hoc re-signed), so a test run never shows a Dock icon or takes the menu
// bar, even in the first milliseconds before the app's own app.dock.hide() runs.
//
// Where it comes from, first hit wins:
//   1. $BISE_HARNESS_ELECTRON_DIST: a folder holding Electron.app (already patched, used as is);
//   2. .harness-cache/electron-<version>/ (made once by step 3);
//   3. node_modules/electron/dist cloned with `cp -cR` (APFS clone: no data written, so it works
//      under the agent shells' 100 MB file-size limit), then patched.
// node_modules/electron/dist missing: Electron's postinstall didn't run (pnpm 10 skips it unless
// allowed; in an agent shell the 130 MB download fails with EFBIG). Run `node
// node_modules/electron/install.js` once from a launchd job (README.md says how).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const DESKTOP_DIR = path.resolve(__dirname, '..', '..');
const CACHE_DIR = path.join(DESKTOP_DIR, '.harness-cache');

const exeIn = (dist: string): string => path.join(dist, 'Electron.app', 'Contents', 'MacOS', 'Electron');

const isBackgroundApp = (dist: string): boolean => {
  try {
    const out = execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Print :LSUIElement', path.join(dist, 'Electron.app', 'Contents', 'Info.plist')]);
    return out.toString().trim() === 'true';
  } catch {
    return false;
  }
};

const electronDist = (): string => path.join(DESKTOP_DIR, 'node_modules', 'electron', 'dist');

/** Path of the harness's Electron executable (makes the patched clone on first use). */
export function harnessElectron(): string {
  const env = process.env['BISE_HARNESS_ELECTRON_DIST'];
  if (env) {
    if (!existsSync(exeIn(env))) throw new Error(`BISE_HARNESS_ELECTRON_DIST=${env} holds no Electron.app`);
    if (!isBackgroundApp(env)) throw new Error(`BISE_HARNESS_ELECTRON_DIST=${env}: Electron.app lacks LSUIElement=1 (it would show a Dock icon)`);
    return exeIn(env);
  }
  const src = electronDist();
  if (!existsSync(exeIn(src))) {
    throw new Error(`no Electron at ${src}: electron's postinstall didn't run; see tests/harness/README.md 'Electron'`);
  }
  const version = readFileSync(path.join(src, 'version'), 'utf8').trim();
  const dist = path.join(CACHE_DIR, `electron-${version}`);
  if (existsSync(exeIn(dist)) && isBackgroundApp(dist)) return exeIn(dist);
  mkdirSync(dist, { recursive: true });
  execFileSync('/bin/rm', ['-rf', path.join(dist, 'Electron.app')]);
  execFileSync('/bin/cp', ['-cR', path.join(src, 'Electron.app'), dist]);
  const plist = path.join(dist, 'Electron.app', 'Contents', 'Info.plist');
  execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Add :LSUIElement bool true', plist]);
  execFileSync('/usr/bin/codesign', ['-f', '-s', '-', path.join(dist, 'Electron.app')], { stdio: 'ignore' });
  return exeIn(dist);
}
