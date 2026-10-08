// composer/stop-dark · designer m_13906 (ambient-lead m_13909): the composer's stop button (■
// while the agent works) is a dark square on the dark field, almost invisible. It is filled with
// the text color in both themes (light: a dark square on the light field; dark: a light square on
// the dark field), its ■ in the field's color. Owner: amb-web. The new app on the scripted core:
// a working agent's thread, dark then light, the button's fill against the box behind it.
import { FakeCore, FakeHelper, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'telemetry-cf9cb2fe';
const agent = (name: string, over: Record<string, unknown> = {}) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0, ...over });
const prefs = (theme: 'light' | 'dark') => ({
  ev: 'prefs',
  prefs: {
    onboarded: true,
    theme,
    context: { shot: true, url: true, file: true, window_text: false },
    excluded_apps: [],
    quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
    voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
    shots_keep_days: 7,
  },
});
const world = () => [
  prefs('dark'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'telemetry', path: '/nowhere/telemetry', git: true, home: false, order: 1, agents: 2, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  { ev: 'agents', project: P, agents: [agent('main'), agent('p99', { status: 'working' })] },
  { ev: 'thread', project: P, agent: 'p99', entries: Array.from({ length: 6 }, (_, i) => ({ pos: i + 1, at_ms: 1791100001000 + i * 1000, kind: 'agent', text: `step ${i + 1} of the cache work` })), before: null, more: false },
];

/** WCAG relative luminance and contrast of sRGB colors in 0..1. */
type Rgba = [number, number, number, number];
const lum = ([r, g, b]: Rgba): number => {
  const ch = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};
const contrast = (a: Rgba, b: Rgba): number => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m) as [number, number];
  return (x + 0.05) / (y + 0.05);
};

test('composer/stop-dark: the stop button is filled with the text color, readable on the field in dark and light', async () => {
  test.setTimeout(60_000);
  const core = new FakeCore(world() as never);
  const s = await launchDesktop({ helper: new FakeHelper(), core, route: `agent/${P}/p99` });
  try {
    const { page } = s;
    const stop = page.getByTestId('composer.stop');
    await expect(stop, 'a working agent: the send button is the stop').toBeVisible({ timeout: 10_000 });
    const read = async (t: 'light' | 'dark') => {
      await core.send(prefs(t) as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      await page.mouse.move(1, 1);
      await page.waitForTimeout(300); // the ds transitions end
      const seen = await stop.evaluate((el) => {
        // each color painted on a 1x1 canvas, so oklab/color-mix/srgb all come back as sRGB bytes
        const px = (c: string): [number, number, number, number] => {
          const cv = document.createElement('canvas');
          cv.width = cv.height = 1;
          const g = cv.getContext('2d');
          if (!g) return [0, 0, 0, 0];
          g.fillStyle = c;
          g.fillRect(0, 0, 1, 1);
          const [r = 0, gr = 0, b = 0, a = 0] = g.getImageData(0, 0, 1, 1).data;
          return [r / 255, gr / 255, b / 255, a / 255];
        };
        const css = getComputedStyle(el);
        const text = getComputedStyle(document.documentElement).getPropertyValue('--p-text').trim();
        const bg = getComputedStyle(document.documentElement).getPropertyValue('--p-bg').trim();
        return { fill: px(css.backgroundColor), mark: px(css.color), text: px(text), field: px(bg), raw: css.backgroundColor };
      });
      await page.getByTestId('composer').screenshot({ path: test.info().outputPath(`stop-${t}.png`) });
      return seen;
    };
    for (const t of ['dark', 'light'] as const) {
      const seen = await read(t);
      test.info().annotations.push({ type: `stop ${t}`, description: JSON.stringify(seen) });
      const near = (a: Rgba, b: Rgba) => a.slice(0, 3).every((v, i) => Math.abs(v - (b[i] ?? 0)) < 0.03);
      expect.soft(near(seen.fill, seen.text), `${t}: the stop is filled with the text color (${seen.raw})`).toBe(true);
      expect.soft(seen.fill[3], `${t}: the fill is solid`).toBeGreaterThan(0.95);
      expect.soft(contrast(seen.fill, seen.field), `${t}: the stop stands out from the field`).toBeGreaterThan(7);
      expect.soft(contrast(seen.mark, seen.fill), `${t}: the ■ reads on its fill`).toBeGreaterThan(7);
    }
  } finally {
    await s.close();
  }
});
