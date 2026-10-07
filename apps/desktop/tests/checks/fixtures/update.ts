// A throwaway update feed for qa-native's setup/update (bar S.6; owner:
// amb-mac). Everything goes inside the run's test HOME: a fake running app
// (<home>/Applications/bise.app, the updater's BISE_DESKTOP_UPDATE_TARGET),
// and a file:// channel (<home>/feed: latest.json naming a newer desktop
// build + its zip), for the core's BISE_DIST_URL. Never his app, his feed or
// his keychains.
//
// Signing: codesign signs only from keychains in his search list, so a
// throwaway identity would mean touching that list (lead m_11312: never).
// Both apps are ad-hoc signed instead: an ad-hoc app's designated
// requirement is its own cdhash, so the "newer" build that passes is an
// exact copy of the running one (newer by latest.json's id and built, the
// only thing the core compares), and the swap is seen on disk (a new
// directory in place, the old one at <name>.app.old). The bad variants
// prove the fail-closed path: 'tampered' (a sealed file changed after
// signing: --verify fails) and 'other' (validly signed but another build:
// the running app's requirement refuses it).
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type UpdateBuild = 'good' | 'tampered' | 'other';

export interface UpdateFeed {
  /** the fake running app (BISE_DESKTOP_UPDATE_TARGET) */
  readonly target: string;
  /** the channel's base URL (the core's BISE_DIST_URL) */
  readonly feedUrl: string;
  /** what latest.json offers */
  readonly version: string;
  /** the env to add to the app's launch (the core inherits BISE_DIST_URL) */
  readonly env: Record<string, string>;
}

/** The running app's build: older than the feed's. */
export const RUNNING = { id: 'd25', built: '2026-10-07T10:00:00Z' } as const;
/** The feed's build. */
export const OFFERED = { version: '2026.10.2-99', id: 'd99', built: '2026-10-08T10:00:00Z' } as const;

const run = (cmd: string, args: string[]): string => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/** A minimal ad-hoc-signed .app at `app` with this VERSION (never run: its executable is a copy of /usr/bin/true). */
function fakeApp(app: string, version: { id: string; built: string }): void {
  rmSync(app, { recursive: true, force: true });
  mkdirSync(join(app, 'Contents', 'MacOS'), { recursive: true });
  mkdirSync(join(app, 'Contents', 'Resources'), { recursive: true });
  writeFileSync(
    join(app, 'Contents', 'Info.plist'),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>dev.bise.desktop.updatetest</string>
<key>CFBundleExecutable</key><string>bise</string>
<key>CFBundleName</key><string>bise</string>
<key>CFBundlePackageType</key><string>APPL</string>
</dict></plist>
`,
  );
  cpSync('/usr/bin/true', join(app, 'Contents', 'MacOS', 'bise'));
  writeFileSync(join(app, 'Contents', 'Resources', 'VERSION'), `id=${version.id}\nbuilt=${version.built}\n`);
  run('/usr/bin/codesign', ['--force', '--sign', '-', join(app, 'Contents', 'MacOS', 'bise')]);
  run('/usr/bin/codesign', ['--force', '--sign', '-', app]);
}

/**
 * The fake running app and a file:// feed offering `build` in `home` (the
 * run's throwaway HOME, made by the harness). Returns the env for the launch.
 */
export function makeUpdateFeed(home: string, build: UpdateBuild = 'good'): UpdateFeed {
  const target = join(home, 'Applications', 'bise.app');
  const feed = join(home, 'feed');
  const stage = join(home, 'feed-stage');
  rmSync(feed, { recursive: true, force: true });
  rmSync(stage, { recursive: true, force: true });
  mkdirSync(feed, { recursive: true });
  mkdirSync(stage, { recursive: true });
  fakeApp(target, RUNNING);
  const next = join(stage, 'bise.app');
  if (build === 'other') {
    // signed fine, but another build: its cdhash isn't the running app's
    fakeApp(next, { id: OFFERED.id, built: OFFERED.built });
  } else {
    cpSync(target, next, { recursive: true, verbatimSymlinks: true });
    // a sealed resource changed after signing: --verify --strict fails
    if (build === 'tampered') writeFileSync(join(next, 'Contents', 'Resources', 'VERSION'), 'id=evil\n');
  }
  const zipName = 'bise-desktop.zip';
  const zip = join(feed, zipName);
  run('/usr/bin/ditto', ['-c', '-k', '--keepParent', next, zip]);
  rmSync(stage, { recursive: true, force: true });
  const sha256 = createHash('sha256').update(readFileSync(zip)).digest('hex');
  const entry = { version: OFFERED.version, id: OFFERED.id, url: zipName, sha256, built: OFFERED.built };
  const zeros = '0'.repeat(64);
  const targets = Object.fromEntries(['darwin-arm64', 'darwin-x86_64'].map((t) => [t, { url: `bise-${t}.tar.gz`, sha256: zeros, id: OFFERED.id }]));
  const latest = { version: OFFERED.version, id: OFFERED.id, targets, desktop: { 'darwin-arm64': entry, 'darwin-x86_64': entry } };
  writeFileSync(join(feed, 'latest.json'), `${JSON.stringify(latest, null, 2)}\n`);
  const feedUrl = `file://${feed}`;
  return { target, feedUrl, version: OFFERED.version, env: { BISE_DESKTOP_UPDATE_TARGET: target, BISE_DIST_URL: feedUrl } };
}
