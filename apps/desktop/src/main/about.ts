// The macOS About panel (bise › About bise): what it says, in one place. The
// stock { role: 'about' } (menu.ts) opens Electron's default panel, whose name
// and version come from package.json ('bise-desktop', '0.0.0') — neither his
// app's name (appname.ts: the bundle's, 'bise' or a try's) nor its build (the
// bundle's Contents/Resources VERSION, the same one the updater and the
// settings' update row say: update/run.ts info().version, never package.json,
// which a release pack does not touch). app.setAboutPanelOptions (index.ts
// installs it) overrides the name and the version. macOS writes
// 'Version <applicationVersion> (<version>)', and `version` left out falls
// back to the bundle's CFBundleVersion (package.json's 0.0.0 on a pack before
// electron-builder.mjs fed it VERSION): so a packed app sets both, the build
// in parentheses being VERSION's commit (12 chars), else the version again.
// A dev run (no VERSION) sets only the name: the panel then says the running
// Electron.app's own version (node_modules' Electron, not a bise build).
// Pure.
import type { AboutPanelOptionsOptions } from 'electron';
import { shortVersion } from '../shared/version';

/** The About panel's options: the name everywhere, the version and its build on a packed app. */
export function aboutPanel(name: string, version: string | null, commit: string | null): AboutPanelOptionsOptions {
  if (version === null) return { applicationName: name };
  const short = shortVersion(version);
  return { applicationName: name, applicationVersion: short, version: commit === null ? short : commit.slice(0, 12) };
}
