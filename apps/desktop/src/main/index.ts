// Electron's main process, minimal: one window on the renderer, the preload as
// its only bridge. Owner: amb-mac (windows, panel, tray, menus, helper);
// src/main/core (spawning `bise ambient-core`) is amb-core's.
//
// Test mode (BISE_DESKTOP_TEST=1), for the harness: nothing ever in his face.
// The page renders offscreen (webPreferences.offscreen) in a window that is
// never shown (also placed at -30000 and not focusable: a shown window there
// is clamped back onto his display), the app is an accessory with no
// Dock icon, userData is BISE_DESKTOP_USER_DATA or a temp folder (never his
// Application Support), and main prints READY_LINE on stdout once the page
// has loaded.
import { mkdtempSync } from 'node:fs';
import { tmpdir, userInfo } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { app, ipcMain, Menu } from 'electron';
import { BADGE_LINE, IPC, TEST_ENV, TEST_USER_DATA_ENV } from '../shared/api';
import { Capsule, installCapsuleIpc } from './capsule';
import { badgeOf, CountKeeper, titleOf } from './counts';
import { installGuard } from './guard';
import { startHelper } from './helper/run';
import { onCoreEvent, startCore, stopCore } from './core/ipc';
import { configOfPrefs } from './helper/config';
import { installIpc, sendClip, sendMenu } from './ipc';
import { menuTemplate } from './menu';
import { startTerms, type TermHost } from './term/host';
import { startTray } from './tray';
import { testHomeProblem } from './testhome';
import { MainWindow } from './windows';

const testMode = process.env[TEST_ENV] === '1';

// a test run starts only in the throwaway home its harness made (testhome.ts):
// else it says why and stops here, before any window, helper or core (main
// m_9883: a run with his real HOME started his real global hub)
if (testMode) {
  const problem = testHomeProblem(process.env, userInfo().homedir);
  if (problem !== null) {
    process.stderr.write(`bise-desktop: test mode refused: ${problem}\n`);
    process.exit(3);
  }
  // every bise this run starts (the core, the hubs it starts) is jailed in it
  // too: bise_home's test_home::jail refuses any path outside BISE_TEST_HOME
  process.env['BISE_TEST_HOME'] ??= process.env['HOME'];
}

// the menu bar says 'bise' (Quit bise, Hide bise, About bise), not the
// package's name (qa-native m_9724)
app.setName('bise');

if (testMode) {
  // never his ~/Library/Application Support: the harness's folder, else a fresh temp one
  const userData = process.env[TEST_USER_DATA_ENV] ?? mkdtempSync(join(tmpdir(), 'bise-desktop-test-'));
  app.setPath('userData', userData);
  if (process.platform === 'darwin') {
    app.setActivationPolicy('accessory');
    app.dock?.hide();
  }
}

// every page guarded from birth: no new window, no navigation away (guard.ts)
installGuard(
  {
    file: pathToFileURL(join(__dirname, '../renderer/index.html')).href,
    ...(!app.isPackaged && process.env['ELECTRON_RENDERER_URL'] ? { dev: process.env['ELECTRON_RENDERER_URL'] } : {}),
  },
  testMode,
);

// the terminal panel's shells (term/host.ts), ended at quit
let terms: TermHost | null = null;

void app.whenReady().then(() => {
  installIpc(testMode);
  const helper = startHelper(testMode);
  // his prefs (excluded apps...) reach the helper now and on every change
  if (helper !== null) {
    onCoreEvent((ev) => {
      if (ev['ev'] === 'prefs') helper.config(configOfPrefs(ev['prefs']));
    });
  }
  startCore();
  terms = startTerms(testMode);
  Menu.setApplicationMenu(
    Menu.buildFromTemplate(
      menuTemplate({
        platform: process.platform,
        appName: app.name,
        dev: !app.isPackaged,
        send: (action) => {
          sendMenu(action, main);
        },
        ...(testMode ? { clip: sendClip } : {}),
      }),
    ),
  );
  const main = new MainWindow(testMode);
  const capsule = new Capsule(testMode);
  installCapsuleIpc(capsule);
  ipcMain.on(IPC.quit, () => {
    app.quit();
  });
  ipcMain.on(IPC.openWindow, (_e, route: unknown) => {
    main.open(typeof route === 'string' ? route : undefined);
  });
  if (!testMode) startTray(capsule, main);
  // the counts outside the app (counts.ts): the Dock's badge, the window's title
  const counts = new CountKeeper();
  onCoreEvent((ev) => {
    const c = counts.apply(ev);
    if (c === null) return;
    main.setTitle(titleOf(c));
    // test mode has no Dock icon: the badge is a stdout line the harness reads
    if (testMode) process.stdout.write(`${BADGE_LINE} ${JSON.stringify(badgeOf(c))}
`);
    else app.dock?.setBadge(badgeOf(c));
  });
  main.create();
  app.on('activate', () => {
    main.open();
  });
});

app.on('will-quit', () => {
  terms?.stopAll();
  stopCore();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' || testMode) app.quit();
});
