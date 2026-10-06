// Packaging bise desktop (electron-builder; `pnpm dist`). Owner: amb-mac.
// The app carries what it runs, so nothing is looked up on PATH:
//   Contents/Resources/bin/bise          the bise it runs (src/main/paths.ts binPath)
//   Contents/MacOS/bise-mac-helper       the native helper, next to the app's executable
//                                        so macOS charges its permissions to the app
//                                        (src/main/helper/run.ts helperPath)
//   Contents/Resources/pearl/*.png       the tray's pearl frames (src/main/tray.ts)
// Both binaries are built before, never here (the Rust build takes the heavy
// lock): BISE_PACK_BISE and BISE_PACK_HELPER give their paths; a missing one
// stops the build with its name.
import { existsSync } from 'node:fs';

function need(name) {
  const p = process.env[name];
  if (p === undefined || p === '' || !existsSync(p)) {
    throw new Error(`electron-builder.mjs: ${name} must be the path of a built binary (got '${p ?? ''}')`);
  }
  return p;
}

const bise = need('BISE_PACK_BISE');
const helper = need('BISE_PACK_HELPER');

export default {
  appId: 'dev.bise.desktop',
  productName: 'bise',
  directories: { output: 'dist' },
  files: ['out/**', 'package.json'],
  asar: true,
  extraResources: [
    { from: bise, to: 'bin/bise' },
    { from: 'resources/pearl', to: 'pearl', filter: ['*.png'] },
  ],
  mac: {
    category: 'public.app-category.developer-tools',
    target: ['dir'],
    // signing: electron-builder rewrites Info.plist and adds the helper and
    // bise, which breaks Electron's own seal, so a dir build is re-signed
    // deep. BISE_PACK_IDENTITY names a codesigning identity (with
    // CSC_KEYCHAIN: its keychain), e.g. the stable self-signed one the Swift
    // app uses so his grants survive rebuilds; else ad hoc ('-'). Notarizing
    // and the Developer ID come with the release work. No hardened runtime
    // until the entitlements exist.
    identity: process.env['BISE_PACK_IDENTITY'] ?? '-',
    hardenedRuntime: false,
    extraFiles: [{ from: helper, to: 'MacOS/bise-mac-helper' }],
    extendInfo: {
      NSMicrophoneUsageDescription: 'bise listens while you hold fn, to hear what you ask.',
      NSCalendarsFullAccessUsageDescription: 'bise stays quiet during your meetings, when you turn that on.',
      NSAppleEventsUsageDescription: 'bise reads the address of the tab in front when you hold fn.',
    },
  },
};
