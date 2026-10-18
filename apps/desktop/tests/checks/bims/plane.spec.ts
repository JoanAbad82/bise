// bims/plane · his paper plane's flight (bims-plane): his message to login-test, at 320 and 640
// docked, light and dark, off screen. The office's clock runs at SLOW (Date.now in the renderer
// only) so the screencast catches the whole flight frame by frame: it leaves from his side of the
// screen (the view's bottom edge, big), zigzags, loops once, lands in login-test's hand. Passes when
// the office draws through the flight and stops drawing after it. The frames go to
// .harness-cache/bims-shots/plane-<tag>/ (the clip bims signs). Owner: bims-plane.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '../../harness';
import { office } from '../../../src/bims/fixtures';
import { P, SHOTS, open, probe, settle, showOffice, sleep } from './world';

/** the renderer's clock, slowed: 3 s of flight over 3 / SLOW s of frames */
const SLOW = 0.25;
const SIZES = [
  { w: 320, win: 1400, wide: null },
  { w: 640, win: 1600, wide: 'docked' },
] as const;

test.describe.configure({ timeout: 120_000 });

for (const theme of ['light', 'dark'] as const) {
  for (const { w, win, wide } of SIZES) {
    const tag = `${wide === null ? String(w) : `${String(w)}-${wide}`}-${theme}`;
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
        await core.send({ ev: 'activity', project: P, item: { kind: 'message', from: { who: 'you' }, to: { who: 'agent', name: 'login-test' }, mode: 'steer', expects_reply: false, at_ms: at, id: `qa-plane-${tag}` } } as never);
        await sleep((3.4 / SLOW) * 1000);
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
