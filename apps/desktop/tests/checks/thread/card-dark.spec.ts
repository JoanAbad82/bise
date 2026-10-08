// thread/card-dark · a question card's option chips stay readable in dark (designer's red m_13906 on
// report-rows-dark.png: '1 cold' '2 warm' drew a near-white fill with pale text). Passes when, on the
// scripted core (FakeCore, fake data), perf's thread with an open card shows each option chip, in
// dark, on a dark fill with light words and the number in the accent; checked with his theme pref
// dark from the start, and again after a live switch light -> dark through his prefs (the app's own
// path), once the chip's background transition has had its time. Shots: dark and light, 1100 wide.
// Owner: amb-kit (src/ds Opts / .b-opt).
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const ACME = 'acme-1a2b3c4d';
const AT = 1791100000000;
const entries = [
  { pos: 1, at_ms: AT, kind: 'you', text: 'make the product page fast' },
  { pos: 2, at_ms: AT + 60_000, kind: 'card', text: 'which bench?', card: { answered: false, id: 9, question: 'which bench?', options: [{ n: 1, label: 'cold' }, { n: 2, label: 'warm' }] } },
];

/** Relative luminance (0 black .. 1 white) of a css rgb()/rgba() color, over the page's own paper when translucent. */
function lum(css: string): number {
  const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(css);
  if (m === null) return -1;
  const ch = [m[1], m[2], m[3]].map((v) => {
    const c = Number(v) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (ch[0] ?? 0) + 0.7152 * (ch[1] ?? 0) + 0.0722 * (ch[2] ?? 0);
}

test('thread/card-dark: a question card\'s option chips are a dark fill with light words in dark, from the start and after a switch', async () => {
  // the fixtures' world (projects, agents), then his dark pref before the card comes
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${ACME}/perf` });
  const { page } = s;
  try {
    await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'perf', { timeout: 10_000 });
    await core.send({ ev: 'prefs', prefs: { onboarded: true, theme: 'dark' } } as never);
    await core.send({ ev: 'thread', project: ACME, agent: 'perf', entries, before: null, more: false } as never);
    await expect(page.getByTestId('thread.card.9.opt.1')).toBeVisible({ timeout: 5000 });
    const chips = () => page.locator('[data-testid^="thread.card.9.opt."]').evaluateAll((els) => els.map((e) => {
      const c = getComputedStyle(e);
      const b = e.querySelector('b');
      return { fill: c.backgroundColor, words: c.color, num: b === null ? '' : getComputedStyle(b).color };
    }));
    const theme = async (t: 'light' | 'dark') => {
      await core.send({ ev: 'prefs', prefs: { onboarded: true, theme: t } } as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      // the chip's background eases over --d-fast (140 ms): judge it after
      await page.waitForTimeout(500);
    };
    const darkOk = async (when: string) => {
      for (const c of await chips()) {
        expect.soft(lum(c.fill), `${when}: the chip's fill is dark (${c.fill})`).toBeLessThan(0.2);
        expect.soft(lum(c.words), `${when}: the chip's words are light (${c.words})`).toBeGreaterThan(0.5);
        expect.soft(c.num, `${when}: the number is the accent, not the words' color`).not.toBe(c.words);
      }
    };
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe('dark');
    await page.waitForTimeout(500);
    await darkOk('dark from the start');
    const shot = async (name: string) => {
      await page.getByTestId('thread.card.9.opt.1').first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: test.info().outputPath(name) });
    };
    await shot('card-dark-start.png');
    await theme('light');
    for (const c of await chips()) expect.soft(lum(c.fill), `light: the chip's fill is light (${c.fill})`).toBeGreaterThan(0.6);
    await shot('card-light.png');
    await theme('dark');
    await darkOk('dark after a switch');
    await shot('card-dark-switched.png');
  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});
