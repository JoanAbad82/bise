// artifacts/video-play · a video artifact plays in bise's viewer, in the app (video-view, his ask main
// m_32004: « les artifacts videos devraient avoir un video viewer embeddé »). The NEW app on the REAL
// core over the throwaway world (../world.ts): shop's main adds an 8 s clip made here by ffmpeg
// (testsrc, never his files) with sb artifact add; it is opened from the right bar. Passes when,
// light and dark:
//   - the frame's src is the hub's viewer, /a/<id>/view, and the player is drawn (kit/office/video.js:
//     data-state paused, the frame fit), its copy served by ranges (a Range ask is a 206 of that part);
//   - a click on the frame plays (time moves), space pauses; paused, the moment is the selection
//     (a `time` anchor) and the note button offers it;
//   - → jumps 5 s, . steps one frame, the speed and loop buttons change the player;
//   - a hover on the track shows that moment's frame and its time;
//   - a box drawn on the frame is the selection with its rect, and goes in his message as an anchor.
// Shots for designer at 1400 (side panel) and 800 (full width): paused, playing, peek, box × light, dark.
// Owner: video-view.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import type { Frame, Page } from '@playwright/test';
import { frameInput, test, expect } from '../../harness';
import { hubOf, launchReal, realWorld, worldSay, type World } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  frame: 'iframe[data-testid="artifact.page"]',
  open: '[data-testid="artifact.open"]',
};

/** An 8 s, 640×360, 25 fps H.264 clip: ffmpeg's test pattern with a moving counter. */
function makeClip(file: string): void {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=25:duration=8', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-movflags', '+faststart', file]);
  if (r.status !== 0) throw new Error(`ffmpeg could not make the clip: ${String(r.stderr)}`);
}

async function open(w: World, project: string, size: string) {
  const [width, height] = size.split('x').map(Number) as [number, number];
  const go = () => launchReal(w, { route: `project/${project}`, size });
  let s = await go();
  const skip = s.page.locator('[data-testid="setup.skip"]');
  await s.page.locator(`${T.field}, [data-testid="setup.skip"]`).first().waitFor({ timeout: 15_000 }).catch(() => undefined);
  if (await skip.isVisible()) {
    await skip.click();
    await s.page.waitForTimeout(500);
    await s.close();
    s = await go();
  }
  await s.page.setViewportSize({ width, height });
  return s;
}

async function openRow(page: Page, project: string, title: string): Promise<void> {
  const row = page.locator(`[data-testid^="app.right.artifact.${project}."]`, { hasText: title }).first();
  await expect(row, `the right bar lists '${title}'`).toBeVisible({ timeout: 45_000 });
  await row.click();
  await expect(page.locator(T.open)).toBeVisible({ timeout: 10_000 });
}

type Player = { t: number; paused: boolean; rate: number; loop: boolean; state: string; sel: { kind: string; t: number; rect?: { w: number; h: number } } | null };
/** The player's facts, read in the viewer's own frame (cross-origin: the window can't read it). */
const player = (frame: Frame): Promise<Player> =>
  frame.evaluate(() => {
    const v = document.querySelector('.office-video video') as HTMLVideoElement;
    const win = window as unknown as { biseOffice?: { view?: { selection?: () => unknown } } };
    const root = document.querySelector('.office-video') as HTMLElement;
    return { t: v.currentTime, paused: v.paused, rate: v.playbackRate, loop: v.loop, state: root.dataset.state ?? '', sel: (win.biseOffice?.view?.selection?.() ?? null) as Player['sel'] };
  });
/** A key as the frame's document gets it (frameInput types space and esc only). */
const key = (frame: Frame, k: string) => frame.evaluate((name) => document.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true })), k);

for (const theme of ['light', 'dark'] as const) {
  for (const size of ['1400x900', '800x800'] as const) {
    test(`artifacts/video-play (real core): a video plays in bise's viewer, by ranges; keys, speed, loop, the hover's frame; paused or boxed it is a note (${theme}, ${size})`, async () => {
      test.setTimeout(240_000);
      const w = realWorld();
      const shop = hubOf(w, 'shop');
      const project = path.basename(path.dirname(shop.sock));
      const n = `v${String(Date.now() % 1_000_000)}`;
      const title = `film ${n}`;
      makeClip(path.join(shop.ws, `film-${n}.mp4`));
      worldSay('shop', `[[bash: sb artifact add film-${n}.mp4 --title "${title}"]] added`);
      const s = await open(w, project, size);
      const shot = (name: string) => s.page.screenshot({ path: test.info().outputPath(`${name}-${theme}-${size}.png`) });
      try {
        const { page } = s;
        await page.emulateMedia({ colorScheme: theme });
        await openRow(page, project, title);
        await expect(page.locator(T.frame), 'the hub frames a video in its viewer, /a/<id>/view').toHaveAttribute('src', /\/a\/[^/?#]+\/view(\?|$)/u);
        const f = page.frameLocator(T.frame);
        const root = f.locator('.office-video');
        await expect(root).toHaveAttribute('data-state', 'paused', { timeout: 20_000 });
        await expect(root).toHaveAttribute('data-fit', 'true');
        await expect(f.locator('.office-video .time')).toHaveText('0:00 / 0:08');
        const frame = page.frames().find((x) => /\/a\/[^/?#]+\/view(\?|$)/u.test(x.url()));
        if (frame === undefined) throw new Error('no viewer frame');
        await shot('paused');

        await test.step("its copy is served by ranges: a 206 of the part asked, the whole file's length said", async () => {
          const r = await frame.evaluate(async () => {
            const file = (document.getElementById('bise-office') as HTMLElement).dataset.file ?? '';
            const res = await fetch(file, { headers: { Range: 'bytes=100-199' }, cache: 'no-store' });
            return { status: res.status, range: res.headers.get('content-range'), len: (await res.arrayBuffer()).byteLength };
          });
          expect(r.status).toBe(206);
          expect(r.range).toMatch(/^bytes 100-199\/\d+$/u);
          expect(r.len).toBe(100);
        });

        const fi = await frameInput(page, frame);
        const sb = await f.locator('.office-video .screen').boundingBox();
        if (sb === null) throw new Error('no screen');
        const cx = Math.round(sb.x + sb.width / 2);
        const cy = Math.round(sb.y + sb.height / 2);

        await test.step('a click on the frame plays, space pauses; paused, the moment is the note', async () => {
          await fi.click(cx, cy);
          await expect(root).toHaveAttribute('data-state', 'playing');
          await expect.poll(async () => (await player(frame)).t, { timeout: 5000 }).toBeGreaterThan(0.6);
          await shot('playing');
          await fi.press('Space');
          await expect(root).toHaveAttribute('data-state', 'paused');
          const p = await player(frame);
          expect(p.sel?.kind, 'paused: a time anchor').toBe('time');
          expect(Math.abs((p.sel?.t ?? -1) - p.t)).toBeLessThan(0.02);
          await expect(f.locator('.office-note-btn'), 'the note button offers the moment').toBeVisible();
        });

        await test.step('→ jumps 5 s, . steps one frame, speed and loop change the player', async () => {
          const t0 = (await player(frame)).t;
          await key(frame, 'ArrowRight');
          await expect.poll(async () => (await player(frame)).t).toBeCloseTo(Math.min(8, t0 + 5), 1);
          const t1 = (await player(frame)).t;
          await key(frame, '.');
          await expect.poll(async () => (await player(frame)).t - t1).toBeGreaterThan(0.02);
          expect((await player(frame)).paused).toBe(true);
          await f.locator('.office-video .rate').click();
          await expect(f.locator('.office-video .rate')).toHaveText('1.5×');
          expect((await player(frame)).rate).toBe(1.5);
          await f.locator('.office-video .loop').click();
          await expect(f.locator('.office-video .loop')).toHaveAttribute('aria-pressed', 'true');
          expect((await player(frame)).loop).toBe(true);
        });

        await test.step("a hover on the track shows that moment's frame and its time", async () => {
          const tb = await f.locator('.office-video .track').boundingBox();
          if (tb === null) throw new Error('no track');
          await fi.move(Math.round(tb.x + tb.width * 0.25), Math.round(tb.y + tb.height / 2));
          await expect(f.locator('.office-video .peek')).toBeVisible();
          await expect(f.locator('.office-video .peek .at')).toHaveText('0:02');
          await page.waitForTimeout(400);
          await shot('peek');
          await fi.move(cx, cy);
          await expect(f.locator('.office-video .peek')).toBeHidden();
        });

        await test.step('a box drawn on the frame is the note, with its rect, and goes in his message', async () => {
          await fi.drag({ x: cx - 80, y: cy - 50 }, { x: cx + 60, y: cy + 40 }, 6);
          await expect(f.locator('.office-video .office-box')).toBeVisible();
          const p = await player(frame);
          expect(p.paused).toBe(true);
          expect(p.sel?.kind).toBe('time');
          expect(p.sel?.rect?.w ?? 0, 'the box in % of the frame').toBeGreaterThan(5);
          await shot('box');
          const btn = f.locator('.office-note-btn');
          await expect(btn).toBeVisible();
          const bb = await btn.boundingBox();
          if (bb === null) throw new Error('no note button');
          await fi.click(Math.round(bb.x + bb.width / 2), Math.round(bb.y + bb.height / 2));
          await expect(page.locator('[data-testid^="composer.attach."][data-kind="anchor"]').first(), 'the moment and its box are an attachment in his message').toBeVisible({ timeout: 5000 });
        });
      } finally {
        await s.close();
      }
    });
  }
}
