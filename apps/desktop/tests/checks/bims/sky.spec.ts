// bims/sky · the living sky (bims-sky, sky.ts): the office's light follows his local time and the
// weather, on a still office (budget.spec's: nothing moves but the sky), off screen. Each moment is pinned (test mode:
// window.__biseLocal his calendar and time, window.__biseSky its weather), then the office blends to
// it (SKY_FADE_S, 30 s at ~10 fps) and rests; one light in both themes (bims-light, direction A). Passes when, light and dark:
//   (1) the day sweep (night, dawn, morning, noon, golden hour, dusk; a clear June day) and each
//       weather at noon (clouds, overcast, rain, fog; snow on a January noon) draw, then rest: 0
//       frames once the blend is done, rain and snow included (their CSS layer is no WebGL frame);
//       the lamps are on at night and off at a clear noon (light UI); rain and snow show their layer,
//       a dry sky none;
//   (2) a transition: a slot change draws a blend of SKY_FADE_S at ~10 fps (BLEND_FPS), then 0;
//   (3) reduced motion: the rain held still (no animation), no blend: a cut to the hour's light;
//   (4) 320: a rainy night and a dusk, the pills read. (1) is the wide bar (640).
// Shots: .harness-cache/bims-shots/sky-*.png and index.html (bims signs them); the transition's
// frames in .harness-cache/bims-shots/sky-clip/. Owner: bims-sky.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { test, expect, Recorder, type Session } from '../../harness';
import { agent, snap, watch } from '../../../src/bims/fixtures';
import { SKY_FADE_S } from '../../../src/bims/sky';
import { BLEND_FPS } from '../../../src/bims/loop';
import { SHOTS, drawnIn, open, probe, settle, shotOf, showOffice, sleep, writeIndex, type Shot } from './world';

const shots: Shot[] = [];

/** asleep, failed, blocked, done, stopped, main reading (budget.spec's STILL): nothing moves but the sky */
const office = snap([
  agent('main', { main: true, place_id: '', status: 'idle' }),
  agent('login-test', { status: 'waiting', watching: [watch('cargo test')] }),
  agent('cookie-banner', { status: 'blocked' }),
  agent('search-index', { status: 'failed' }),
  agent('copy-fix', { status: 'done' }),
  agent('import', { status: 'done', phase: 'stopped' }),
]);
test.describe.configure({ timeout: 240_000 });

interface Moment {
  readonly key: string;
  readonly title: string;
  readonly mo: number;
  readonly d: number;
  readonly h: number;
  readonly m: number;
  readonly weather: string;
}

const at = (key: string, title: string, mo: number, d: number, h: number, m: number, weather = 'clear'): Moment => ({ key, title, mo, d, h, m, weather });

/** the day sweep: a clear June day in Paris (sky.ts LAT 46°N, summer time) */
const DAY: readonly Moment[] = [
  at('night', 'night 02:00', 6, 21, 2, 0),
  at('dawn', 'dawn 06:15 (sun 1.5°)', 6, 21, 6, 15),
  at('morning', 'morning 09:00', 6, 21, 9, 0),
  at('noon', 'noon 13:50', 6, 21, 13, 50),
  at('golden', 'golden hour 21:00 (sun 5.6°)', 6, 21, 21, 0),
  at('dusk', 'dusk 22:00 (sun -3°)', 6, 21, 22, 0),
];
/** each weather at noon (snow: a January noon) */
const WEATHER: readonly Moment[] = [
  at('clouds', 'clouds, noon', 6, 21, 13, 50, 'clouds'),
  at('overcast', 'overcast, noon', 6, 21, 13, 50, 'overcast'),
  at('rain', 'rain, noon', 6, 21, 13, 50, 'rain'),
  at('fog', 'fog, noon', 6, 21, 13, 50, 'fog'),
  at('snow', 'snow, January noon', 1, 15, 13, 0, 'snow'),
];

/** pin a moment and wake the office (its focus handler draws a frame: the blend starts) */
async function pin(s: Session, m: Moment): Promise<void> {
  await s.page.evaluate((x) => {
    const w = window as unknown as { __biseLocal?: unknown; __biseSky?: unknown };
    w.__biseLocal = { y: 2026, mo: x.mo, d: x.d, s: x.h * 3600 + x.m * 60 };
    w.__biseSky = { weather: x.weather };
    window.dispatchEvent(new Event('focus'));
  }, m);
}

/** the sky as drawn (the probe) and the rain layer's kind */
async function skyNow(s: Session): Promise<{ lamps: number; keyI: number; blending: boolean; falling: string | null } | null> {
  return s.page.evaluate(() => {
    const p = (window as unknown as { __biseBims?: { sky(): { light: { lamps: number; keyI: number }; blending: boolean } | null } }).__biseBims;
    const k = p?.sky() ?? null;
    const el = document.querySelector<HTMLElement>('[data-testid="app.right.bims.falling"]');
    return k === null ? null : { lamps: k.light.lamps, keyI: k.light.keyI, blending: k.blending, falling: el?.dataset.kind ?? null };
  });
}

async function shot(s: Session, file: string, title: string, says: string): Promise<void> {
  const box = await s.page.getByTestId('app.right.bims').boundingBox();
  if (box === null) throw new Error(`no office for the shot ${file}`);
  await shotOf(s.cdp, s.page, box, file);
  shots.push({ file, title, says });
}

test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

/** a moment pinned, its blend done, then rest */
async function show(s: Session, m: Moment): Promise<void> {
  await pin(s, m);
  await sleep(300);
  await settle(s, 1500, (SKY_FADE_S + 6) * 1000);
}

for (const theme of ['light', 'dark'] as const) {
  test(`(1) the day and the weathers, wide, ${theme}`, async () => {
    // 11 moments, each a 30 s blend (SKY_FADE_S) then rest
    test.setTimeout((DAY.length + WEATHER.length) * (SKY_FADE_S + 15) * 1000 + 60_000);
    const { s } = await open(office, { theme, width: 1600 });
    try {
      await s.page.evaluate(() => {
        (window as unknown as { __biseSky?: unknown }).__biseSky = { weather: 'clear' };
      });
      await showOffice(s);
      // wide: the 640 bar (docked or slid over, as the window has room)
      await s.page.getByTestId('app.right.agents.width.wide').click();
      await expect.poll(async () => (await s.page.getByTestId('app.right.bims').boundingBox())?.width ?? 0, { timeout: 3000 }).toBeGreaterThan(600);
      for (const m of [...DAY, ...WEATHER]) {
        await show(s, m);
        const k = await skyNow(s);
        expect(k, `${m.key}: a sky is drawn`).not.toBeNull();
        expect(k?.blending, `${m.key}: its blend is done`).toBe(false);
        // at rest: 0 frames, rain and snow included (their layer is CSS)
        const { frames } = await drawnIn(s, 1500);
        expect(frames, `${m.key}: 0 frames at rest`).toBe(0);
        expect(k?.falling ?? null, `${m.key}: what falls`).toBe(m.weather === 'rain' ? 'rain' : m.weather === 'snow' ? 'snow' : null);
        if (theme === 'light' && m.key === 'night') expect(k?.lamps, 'the lamps are on at night').toBe(1);
        if (theme === 'light' && m.key === 'noon') expect(k?.lamps, 'the lamps are off at a clear noon').toBe(0);
        await shot(s, `sky-${theme}-wide-${m.key}.png`, `sky · ${m.title} · wide · ${theme}`, 'the light of that moment; the slab stays a slab; rain/snow outside the building only');
      }
    } finally {
      await s.close();
    }
  });

  test(`(4) 320: a rainy night and a dusk, ${theme}`, async () => {
    const { s } = await open(office, { theme, width: 1400 });
    try {
      await s.page.evaluate(() => {
        (window as unknown as { __biseSky?: unknown }).__biseSky = { weather: 'clear' };
      });
      await showOffice(s);
      for (const m of [at('night-rain', 'a rainy night 23:30', 10, 15, 23, 30, 'rain'), at('dusk', 'dusk 19:15 (October)', 10, 15, 19, 15)]) {
        await show(s, m);
        expect((await drawnIn(s, 1500)).frames, `${m.key}: 0 frames at rest`).toBe(0);
        await shot(s, `sky-${theme}-320-${m.key}.png`, `sky · ${m.title} · 320 · ${theme}`, 'the pills and names read; the lamps light the room');
      }
    } finally {
      await s.close();
    }
  });
}

test('(2) a transition: a blend of 30 s at ~10 fps, then rest (the clip)', async () => {
  const { s } = await open(office, { theme: 'light', width: 1400 });
  try {
    await s.page.evaluate(() => {
      (window as unknown as { __biseSky?: unknown }).__biseSky = { weather: 'clear' };
    });
    await showOffice(s);
    const DUSK = at('golden', 'golden hour', 6, 21, 21, 0);
    await show(s, DUSK);
    const box = await s.page.getByTestId('app.right.bims').boundingBox();
    if (box === null) throw new Error('no office');
    const f0 = (await probe(s.page))?.frames ?? 0;
    const rec = new Recorder(s.cdp, s.page);
    await rec.start();
    await pin(s, at('dusk-rain', 'dusk, rain', 6, 21, 22, 0, 'rain'));
    await sleep((SKY_FADE_S + 1.5) * 1000);
    const frames = await rec.stop();
    const drawn = ((await probe(s.page))?.frames ?? 0) - f0;
    // SKY_FADE_S at ~BLEND_FPS (a loaded machine drops some), never the display's rate
    expect(drawn, 'the blend draws its 30 s').toBeGreaterThan(SKY_FADE_S * BLEND_FPS * 0.5);
    expect(drawn, `never more than ${String(BLEND_FPS)} fps`).toBeLessThan(SKY_FADE_S * BLEND_FPS + 12);
    expect((await drawnIn(s, 1500)).frames, 'then rest').toBe(0);
    // the clip's frames, cropped to the office, for bims
    const dir = path.join(SHOTS, 'sky-clip');
    mkdirSync(dir, { recursive: true });
    frames.forEach((f, i) => {
      const sc = f.scale;
      const x0 = Math.round(box.x * sc), y0 = Math.round(box.y * sc);
      const w = Math.min(Math.round(box.width * sc), f.png.width - x0), h = Math.min(Math.round(box.height * sc), f.png.height - y0);
      const out = new PNG({ width: w, height: h });
      PNG.bitblt(f.png, out, x0, y0, w, h, 0, 0);
      writeFileSync(path.join(dir, `f${String(i).padStart(4, '0')}-${String(Math.round(f.t * 1000))}.png`), PNG.sync.write(out));
    });
  } finally {
    await s.close();
  }
});

test('(3) reduced motion: the rain held still, a cut (no blend)', async () => {
  const { s } = await open(office, { theme: 'light', width: 1400, reduced: true });
  try {
    await s.page.evaluate(() => {
      (window as unknown as { __biseSky?: unknown }).__biseSky = { weather: 'clear' };
    });
    await showOffice(s);
    await show(s, at('noon', 'noon', 6, 21, 13, 50));
    const f0 = (await probe(s.page))?.frames ?? 0;
    await pin(s, at('dusk-rain', 'dusk, rain', 6, 21, 22, 0, 'rain'));
    await sleep(3000);
    const drawn = ((await probe(s.page))?.frames ?? 0) - f0;
    // the cut: the frame that draws the new light, never a blend's
    expect(drawn, 'a cut, no blend').toBeLessThanOrEqual(3);
    expect(drawn, 'the new light is drawn').toBeGreaterThanOrEqual(1);
    expect((await skyNow(s))?.blending, 'no blend runs').toBe(false);
    // the drops held still (bims m_33351: he can tell it rains), never moving
    expect((await skyNow(s))?.falling ?? null, 'the rain layer, still').toBe('rain');
    const anim = await s.page.evaluate(() => {
      const el = document.querySelector('[data-testid="app.right.bims.falling"]');
      return el === null ? '' : getComputedStyle(el, '::before').animationName;
    });
    expect(anim, 'no animation under reduced motion').toBe('none');
    await shot(s, 'sky-light-wide-reduced-dusk-rain.png', 'sky · reduced motion · dusk, rain · light', 'still drops: he can tell it rains; the light cut to the hour (no blend)');
  } finally {
    await s.close();
  }
});
