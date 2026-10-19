// bims/plane · his paper plane's flight and catch (bims-plane, plane-catch): his message to
// login-test (at its desk), at 320 and 640 docked, light and dark, and to copy-fix (on the terrace:
// the pocket), off screen. The office's clock runs at SLOW (Date.now in the renderer only) so the
// screencast catches it frame by frame: it leaves from his side of the screen (the view's bottom
// edge, big), shrinks to the bim's size as it zigzags and loops once, lands in its raised hand,
// unfolds, is read, then laid on the desk (or slipped in the pocket). Passes when the office draws
// through it. The frames go to .harness-cache/bims-shots/plane-<tag>/ (the clips bims signs).
// Owner: plane-catch.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '../../harness';
import { office } from '../../../src/bims/fixtures';
import { P, SHOTS, open, probe, settle, showOffice, sleep } from './world';

/** the renderer's clock, slowed: 3 s of flight over 3 / SLOW s of frames */
const SLOW = 0.25;
const SIZES = [
  { w: 320, win: 1400, wide: null, to: 'login-test' },
  { w: 640, win: 1600, wide: 'docked', to: 'login-test' },
  { w: 640, win: 1600, wide: 'docked', to: 'copy-fix' },
] as const;
/** the flight (3 s), the catch (2.2 s) and a beat after, office seconds */
const WATCH_S = 5.8;

test.describe.configure({ timeout: 150_000 });

for (const theme of ['light', 'dark'] as const) {
  for (const { w, win, wide, to } of SIZES) {
    const tag = `${wide === null ? String(w) : `${String(w)}-${wide}`}${to === 'login-test' ? '' : `-${to}`}-${theme}`;
    test(`his plane's flight, ${tag}`, async () => {
      const { s, core } = await open(office, { theme });
      try {
        await s.app.evaluate(({ BrowserWindow }, v) => {
          const b = BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().includes('index.html'));
          b?.setContentSize(v, b.getContentSize()[1] ?? 900);
        }, win);
        await showOffice(s);
        if (wide !== null) {
          await s.page.getByTestId('app.right.agents.width.wide').click();
          await expect(s.page.getByTestId('app.panel')).toHaveAttribute('data-wide', wide, { timeout: 3000 });
        }
        await settle(s);
        const box = await s.page.getByTestId('app.right.bims').boundingBox();
        if (box === null) throw new Error('no office');
        // the office's clock slowed from now on; his message stamped on that clock
        const at = await s.page.evaluate((k) => {
          const real = Date.now.bind(Date);
          const t0 = real();
          Date.now = () => t0 + (real() - t0) * k;
          return t0;
        }, SLOW);
        const dir = path.join(SHOTS, `plane-${tag}`);
        rmSync(dir, { recursive: true, force: true });
        mkdirSync(dir, { recursive: true });
        const frames: { t: number; data: string }[] = [];
        const onFrame = (f: { data: string; sessionId: number; metadata: { timestamp?: number } }): void => {
          void s.cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => undefined);
          frames.push({ t: f.metadata.timestamp ?? 0, data: f.data });
        };
        s.cdp.on('Page.screencastFrame', onFrame);
        await s.cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
        const before = (await probe(s.page))?.frames ?? 0;
        await core.send({ ev: 'activity', project: P, item: { kind: 'message', from: { who: 'you' }, to: { who: 'agent', name: to }, mode: 'steer', expects_reply: false, at_ms: at, id: `qa-plane-${tag}` } } as never);
        await sleep((WATCH_S / SLOW) * 1000);
        await s.cdp.send('Page.stopScreencast').catch(() => undefined);
        s.cdp.off('Page.screencastFrame', onFrame);
        const drawn = ((await probe(s.page))?.frames ?? 0) - before;
        const t0 = frames[0]?.t ?? 0;
        frames.forEach((f, i) => {
          writeFileSync(path.join(dir, `${String(i).padStart(4, '0')}.png`), Buffer.from(f.data, 'base64'));
        });
        writeFileSync(path.join(dir, 'frames.json'), JSON.stringify({ box, slow: SLOW, times: frames.map((f) => f.t - t0) }));
        expect(drawn, 'the office draws through the flight').toBeGreaterThan(60);
      } finally {
        await s.close();
      }
    });
  }
}
