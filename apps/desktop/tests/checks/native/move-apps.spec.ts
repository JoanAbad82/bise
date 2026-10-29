// native/move-apps · 'Move to Applications' (apple-signing ag-move; main/update/move.ts, run.ts
// offerMove/move). A fake bise.app in the run's throwaway HOME (BISE_DESKTOP_UPDATE_TARGET), on a
// DMG-like path (<home>/Volumes/bise/bise.app: test mode's disk images are the test HOME's) or a
// translocated one (…/AppTranslocation/…). The alert is never shown (BISE_DESKTOP_TEST_MOVE answers
// it) and app.moveToApplicationsFolder never called: test mode copies the bundle into the test
// HOME's Applications, so the move is seen on disk. Never his /Applications, never his bundle.
//   not now    first start from the DMG asks; 'Not now' writes move.json for that build, the window
//              opens, the state says off here + move; a second start on the same userData never
//              asks again (an answer 'move' is not used: nothing copied); the settings' row
//              'move to Applications' moves on his click
//   move       first start from a translocated copy asks; 'Move' moves (the copy in Applications)
//   in place   an app in Applications that can update itself never asks
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, testUserData, test, expect } from '../../harness';
import { testHome } from '../../harness/isolation';

import { settings } from '../../../src/proto/words_settings.gen';
const BUILD = 'd25';

/** a fake bundle (never run: the app only reads its VERSION) at `app` */
function fakeApp(app: string): void {
  mkdirSync(path.join(app, 'Contents', 'Resources'), { recursive: true });
  mkdirSync(path.join(app, 'Contents', 'MacOS'), { recursive: true });
  writeFileSync(path.join(app, 'Contents', 'Resources', 'VERSION'), `id=${BUILD}\nversion=desktop-v2026.10.1\nbuilt=2026-10-07T10:00:00Z\n`);
}

type State = { state: string; cant?: string; move?: string };
const now = (page: Page): Promise<State> => page.evaluate(() => (window as unknown as { bise: { update: { now: () => Promise<State> } } }).bise.update.now());

/** one start of the app on `home`, the fake bundle at `target`, answering the alert with `answer` */
async function start(home: string, target: string, userData: string, answer: 'move' | 'not_now', route?: string) {
  return launchDesktop({
    core: new FakeCore(),
    home,
    userData,
    size: '1100x800',
    ...(route !== undefined ? { route } : {}),
    env: { BISE_DESKTOP_UPDATE_TARGET: target, BISE_DESKTOP_TEST_MOVE: answer },
  });
}

test("native/move-apps: from the DMG, 'Not now' is kept for the build; settings › update moves", async () => {
  const h = testHome();
  const home = realpathSync(h.home);
  const userData = testUserData();
  const target = path.join(home, 'Volumes', 'bise', 'bise.app');
  const moved = path.join(home, 'Applications', 'bise.app');
  fakeApp(target);
  try {
    const first = await start(home, target, userData, 'not_now');
    try {
      await expect.poll(() => now(first.page), { timeout: 10_000 }).toEqual({ state: 'none', cant: 'disk_image', move: 'can' });
      const kept = path.join(userData, 'updates', 'move.json');
      expect(existsSync(kept), "'Not now' is kept").toBe(true);
      expect(JSON.parse(readFileSync(kept, 'utf8'))).toEqual({ declined: BUILD });
      expect(existsSync(moved), "'Not now' moves nothing").toBe(false);
    } finally {
      await first.close();
    }
    // same build, same userData: no alert (an answer 'move' would copy it)
    const second = await start(home, target, userData, 'move', 'settings/general');
    try {
      await expect(second.page.getByTestId('settings.dist.label')).toHaveText(settings.dist_off, { timeout: 10_000 });
      expect(existsSync(moved), 'never asked again for that build').toBe(false);
      await expect(second.page.getByTestId('settings.dist.sub')).toHaveText(settings.dist_disk_image);
      await second.page.getByTestId('settings.dist.move').click();
      await expect.poll(() => existsSync(path.join(moved, 'Contents', 'Resources', 'VERSION')), { timeout: 10_000, message: 'his click moves it' }).toBe(true);
      await second.page.screenshot({ path: test.info().outputPath('move-apps-settings-1100.png') });
    } finally {
      await second.close();
    }
  } finally {
    rmSync(h.root, { recursive: true, force: true });
    rmSync(path.dirname(userData), { recursive: true, force: true });
  }
});

test("native/move-apps: from a translocated copy, 'Move' moves it to Applications", async () => {
  const h = testHome();
  const home = realpathSync(h.home);
  const userData = testUserData();
  const target = path.join(home, 'private', 'var', 'folders', 'xy', 'T', 'AppTranslocation', '1234-ABCD', 'd', 'bise.app');
  const moved = path.join(home, 'Applications', 'bise.app');
  fakeApp(target);
  try {
    const s = await start(home, target, userData, 'move');
    try {
      await expect.poll(() => existsSync(path.join(moved, 'Contents', 'Resources', 'VERSION')), { timeout: 10_000, message: "'Move' moves it" }).toBe(true);
      expect(existsSync(path.join(userData, 'updates', 'move.json')), "'Move' keeps no 'Not now'").toBe(false);
      expect(await now(s.page)).toEqual({ state: 'none', cant: 'translocated', move: 'can' });
    } finally {
      await s.close();
    }
  } finally {
    rmSync(h.root, { recursive: true, force: true });
    rmSync(path.dirname(userData), { recursive: true, force: true });
  }
});

test('native/move-apps: an app in Applications never asks', async () => {
  const h = testHome();
  const home = realpathSync(h.home);
  const userData = testUserData();
  const target = path.join(home, 'Applications', 'bise.app');
  fakeApp(target);
  try {
    const s = await start(home, target, userData, 'not_now');
    try {
      // it may update itself (the fake core's offer then fails on a non-local feed): never 'off here'
      const st = await now(s.page);
      expect(st.cant, 'it can update itself here').toBeUndefined();
      expect(st.move, 'nothing to move').toBeUndefined();
      expect(existsSync(path.join(userData, 'updates', 'move.json')), 'no alert, nothing kept').toBe(false);
    } finally {
      await s.close();
    }
  } finally {
    rmSync(h.root, { recursive: true, force: true });
    rmSync(path.dirname(userData), { recursive: true, force: true });
  }
});
