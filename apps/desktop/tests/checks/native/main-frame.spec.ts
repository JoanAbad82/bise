// native/main-frame · his try's item 1 (ambient-lead m_21496, designer m_21506): the main window
// opens at 1280 x 720 centred in the work area of the pointer's screen (clamped to it minus 24 px
// each side), then where he left it, per display; a kept frame off every screen (its display gone)
// is centred again at its size, clamped: never a window off-screen. The law is mainsize.test.ts;
// this runs the real window, off-screen: a test run's only screen is place.ts's OFF_DISPLAY
// (1920 x 1200 at -30000,-30000, id 'off'), so a frame kept on a real display is one whose display
// is gone. Four launches on one userData (window-frame.json, windows.ts FRAMES_FILE):
//   (a) none kept: 1280 x 720 centred on OFF_DISPLAY
//   (b) moved and resized: the frame is kept in userData as his last on 'off'
//   (c) relaunch: it opens at (b)'s frame
//   (d) a frame kept on display 42, gone (a real place, 1400 x 800): centred again at 1400 x 800 on
//       OFF_DISPLAY, never at its real place; (e) one larger than the screen: clamped to it minus 24
// Owner: amb-mac.
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { launchDesktop, testUserData, test, expect, type Session } from '../../harness';

const OFF = -30000;
const SCREEN = { width: 1920, height: 1200 };
type Frame = { x: number; y: number; width: number; height: number };

/** The main window's frame, read in Electron's main. */
async function mainFrame(s: Session): Promise<Frame> {
  return s.app.evaluate(({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows().find((b) => b.webContents.getURL().includes('surface=window'));
    if (!w) throw new Error('no main window');
    const { x, y, width, height } = w.getBounds();
    return { x, y, width, height };
  });
}

const centredOff = (width: number, height: number): Frame => ({
  x: OFF + Math.round((SCREEN.width - width) / 2),
  y: OFF + Math.round((SCREEN.height - height) / 2),
  width,
  height,
});

async function launched<T>(userData: string, f: (s: Session) => Promise<T>): Promise<T> {
  const s = await launchDesktop({ userData });
  try {
    return await f(s);
  } finally {
    await s.close();
  }
}

test('native/main-frame: 1280 x 720 centred first, then where he left it; a frame off every screen comes back centred', async () => {
  test.setTimeout(150_000);
  const userData = testUserData();
  const file = path.join(userData, 'window-frame.json');
  const moved: Frame = { x: OFF + 100, y: OFF + 50, width: 1500, height: 900 };
  try {
    // (a) none kept
    await launched(userData, async (s) => {
      expect(await mainFrame(s), '(a) 1280 x 720 centred on the pointer screen').toEqual(centredOff(1280, 720));
      // (b) he moves and resizes it
      await s.app.evaluate(({ BrowserWindow }, f) => {
        BrowserWindow.getAllWindows().find((b) => b.webContents.getURL().includes('surface=window'))?.setBounds(f);
      }, moved);
      await expect
        .poll(() => {
          try {
            return JSON.parse(readFileSync(file, 'utf8')) as unknown;
          } catch {
            return null;
          }
        }, { message: '(b) the frame is kept in userData as his last on its display', timeout: 5000 })
        .toEqual({ v: 1, last: 'off', frames: { off: moved } });
    });
    // (c) relaunch: where he left it
    await launched(userData, async (s) => {
      expect(await mainFrame(s), '(c) it opens where he left it').toEqual(moved);
    });
    // (d) kept on a display that is gone now, at a real place
    writeFileSync(file, JSON.stringify({ v: 1, last: '42', frames: { '42': { x: 100, y: 100, width: 1400, height: 800 } } }));
    await launched(userData, async (s) => {
      const f = await mainFrame(s);
      expect(f, '(d) centred again at its size on the screen there is').toEqual(centredOff(1400, 800));
      expect(f.x < OFF + SCREEN.width && f.y < OFF + SCREEN.height, '(d) never at its real place').toBe(true);
    });
    // (e) kept larger than any screen there is: clamped to the work area minus 24 px each side
    writeFileSync(file, JSON.stringify({ v: 1, last: '42', frames: { '42': { x: 0, y: 0, width: 3000, height: 2000 } } }));
    await launched(userData, async (s) => {
      expect(await mainFrame(s), '(e) clamped, centred').toEqual(centredOff(SCREEN.width - 48, SCREEN.height - 48));
    });
  } finally {
    rmSync(path.dirname(userData), { recursive: true, force: true });
  }
});
