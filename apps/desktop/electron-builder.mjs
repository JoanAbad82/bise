// Packaging bise desktop (electron-builder; `pnpm dist`). Owner: amb-mac.
// The app carries what it runs, so nothing is looked up on PATH:
//   Contents/Resources/bin/bise          the bise it runs (src/main/paths.ts binPath)
//   Contents/MacOS/bise-mac-helper       the native helper, next to the app's executable
//                                        so macOS charges its permissions to the app
//                                        (src/main/helper/run.ts helperPath)
//   Contents/Resources/pearl/*.png       the tray's pearl frames (src/main/tray.ts)
//   Contents/Resources/VERSION           the app's build (id=, built= UTC with a Z), from
//                                        BISE_PACK_VERSION when given: the updater says it to
//                                        the core (src/main/update); none = a dev build, never
//                                        offered an update
// Its icon is resources/icon.png (1024 px, the Swift app's), made an .icns here.
// A try build (amb-tools' 'bise-ambient --try') gets its own identity so it
// never shares his app's userData, single-instance lock or permissions:
// BISE_PACK_APP_ID (default dev.bise.desktop) and BISE_PACK_NAME (default
// 'bise'; it names the .app, the menus and ~/Library/Application Support/<name>).
// Both binaries are built before, never here (the Rust build takes the heavy
// lock): BISE_PACK_BISE and BISE_PACK_HELPER give their paths; a missing one
// stops the build with its name.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function need(name) {
  const p = process.env[name];
  if (p === undefined || p === '' || !existsSync(p)) {
    throw new Error(`electron-builder.mjs: ${name} must be the path of a built binary (got '${p ?? ''}')`);
  }
  return p;
}

const bise = need('BISE_PACK_BISE');
const helper = need('BISE_PACK_HELPER');
// optional: the release's VERSION file (make-release writes id= and built=)
const version = process.env['BISE_PACK_VERSION'] ? need('BISE_PACK_VERSION') : null;

// BISE_PACK_SIGN_DIR: bise's stable self-signed identity ('bise ambient dev'
// in <dir>/sign.keychain-db, made once by scripts/sign-identity.sh when
// missing; the Swift app's build made the same one), so macOS keeps his
// grants across rebuilds. Its
// certificate isn't trusted by the codesigning policy, so electron-builder
// won't pick it: the app is signed here, deep, after packing.
const signDir = process.env['BISE_PACK_SIGN_DIR'];

function signStable(appPath) {
  const kc = join(signDir, 'sign.keychain-db');
  const pass = readFileSync(join(signDir, 'pass'), 'utf8');
  execFileSync('security', ['unlock-keychain', '-p', pass, kc]);
  const ids = execFileSync('security', ['find-identity', '-p', 'codesigning', kc], { encoding: 'utf8' });
  const id = /\b([0-9A-F]{40}) "bise ambient dev"/.exec(ids)?.[1];
  if (id === undefined) throw new Error(`electron-builder.mjs: no 'bise ambient dev' identity in ${kc}`);
  // codesign finds identities only in the search list: the keychain joins it for the signing
  const orig = execFileSync('security', ['list-keychains', '-d', 'user'], { encoding: 'utf8' })
    .split('\n')
    .map((l) => l.trim().replace(/"/g, ''))
    .filter((l) => l !== '');
  execFileSync('security', ['list-keychains', '-d', 'user', '-s', ...orig, kc]);
  try {
    execFileSync('codesign', ['--force', '--deep', '--sign', id, '--keychain', kc, appPath]);
  } finally {
    execFileSync('security', ['list-keychains', '-d', 'user', '-s', ...orig]);
  }
  execFileSync('codesign', ['--verify', '--deep', '--strict', appPath]);
}

const appId = process.env['BISE_PACK_APP_ID'] || 'dev.bise.desktop';
const productName = process.env['BISE_PACK_NAME'] || 'bise';

export default {
  appId,
  afterPack: (ctx) => {
    if (signDir !== undefined && ctx.electronPlatformName === 'darwin') {
      signStable(join(ctx.appOutDir, `${ctx.packager.appInfo.productFilename}.app`));
    }
  },
  productName,
  // BISE_PACK_OUT: another output dir (the try's staging, while his try runs from dist: amb-tools)
  directories: { output: process.env['BISE_PACK_OUT'] || 'dist' },
  files: ['out/**', 'package.json'],
  asar: true,
  extraResources: [
    { from: bise, to: 'bin/bise' },
    ...(version === null ? [] : [{ from: version, to: 'VERSION' }]),
    { from: 'resources/pearl', to: 'pearl', filter: ['*.png'] },
  ],
  mac: {
    category: 'public.app-category.developer-tools',
    icon: 'resources/icon.png',
    target: ['dir'],
    // signing: electron-builder rewrites Info.plist and adds the helper and
    // bise, which breaks Electron's own seal, so a dir build is re-signed
    // deep: with BISE_PACK_SIGN_DIR by signStable (above), else
    // BISE_PACK_IDENTITY names a codesigning identity (CSC_KEYCHAIN: its
    // keychain), else ad hoc ('-'). Notarizing
    // and the Developer ID come with the release work. No hardened runtime
    // until the entitlements exist.
    identity: signDir === undefined ? (process.env['BISE_PACK_IDENTITY'] ?? '-') : null,
    hardenedRuntime: false,
    extraFiles: [{ from: helper, to: 'MacOS/bise-mac-helper' }],
    extendInfo: {
      NSMicrophoneUsageDescription: 'bise listens while you hold fn, to hear what you ask.',
      NSCalendarsFullAccessUsageDescription: 'bise stays quiet during your meetings, when you turn that on.',
      NSAppleEventsUsageDescription: 'bise reads the address of the tab in front when you hold fn.',
    },
  },
};
