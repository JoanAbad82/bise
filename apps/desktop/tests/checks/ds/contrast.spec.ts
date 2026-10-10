// ds/contrast · bar N2 'color alone' (docs/desktop-bar.md): with macOS increase contrast on, every
// state still reads without its color, by a glyph or a word (amb-kit's a824752f: src/ds/css/live.css's
// @media (prefers-contrast: more) block, Dot's aria-label). Passes when, on the built app with the
// scripted core (FakeCore, fake data) and prefers-contrast: more emulated:
//   - storefront's thread: the sidebar's working dot and the inbox block's done and failed dots each
//     carry their own glyph (∿ working, ✓ done, ! error), and every dot says its state in words;
//   - settings › models: the '✓ signed in' chip carries its ✓ stand-in;
//   - without increase contrast, the dots keep their words (the glyphs are the media's).
// src/ds/check.mjs's law checks the CSS covers every colored tone; this checks the screens use it.
// Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import type { Page } from '@playwright/test';

const HOME = 'bise-home-00000000';
const P = 'storefront-1a2b3c4d';
const card = (id: number, kind: string, question: string) => ({ id, project: P, kind, rank: id, agent: 'perf', question, options: [], urgent: false, since_ms: 1791100100000 + id });
const agent = (name: string, status: string) => ({ name, main: name === 'main', status, archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
const world = () => [
  { ev: 'prefs', prefs: { onboarded: true, theme: 'light' } },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      {
        project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 2, working: 1, waits: 2, running: true,
        cards: [card(1, 'done', 'the product page bench is done: p95 180 ms'), card(2, 'failed', 'the e2e run failed twice: out of disk')],
      },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main', 'idle'), agent('perf', 'working')] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'perf is on the bench.' }], before: null, more: false },
  { ev: 'accounts', items: [{ id: 'chatgpt', kind: 'subscription', label: 'ChatGPT', state: 'signed_in', who: 'camille@example.com', provider: 'chatgpt' }] },
];

/** Every visible status dot and toned chip: its state class, its words, and its stand-in glyph. */
const cues = (page: Page) =>
  page.evaluate(() => {
    const on = (e: Element) => e.getClientRects().length > 0;
    const glyph = (e: Element, at: '::before' | '::after') => {
      const c = getComputedStyle(e, at).content;
      return c === 'none' || c === 'normal' || c === '""' ? '' : c.replace(/^"|"$/g, '');
    };
    const state = (e: Element, of: readonly string[]) => of.find((s) => e.classList.contains(s)) ?? '';
    const dots = Array.from(document.querySelectorAll('.b-dot')).filter(on).map((e) => ({
      state: state(e, ['wk', 'nd', 'ok', 'er', 'off']),
      words: e.getAttribute('aria-label') ?? '',
      glyph: glyph(e, '::after'),
    }));
    const chips = Array.from(document.querySelectorAll('.b-chip.ok, .b-chip.err')).filter(on).map((e) => ({
      state: state(e, ['ok', 'err']),
      glyph: glyph(e, '::before'),
    }));
    return { dots, chips };
  });

test('ds/contrast: with increase contrast every state reads by a glyph or a word, never by its color alone', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/main` });
  const { page } = s;
  try {
    await expect(page.getByTestId('inbox.block')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('app.sidebar.agent.perf')).toBeVisible({ timeout: 5000 });

    await test.step('without increase contrast: every dot says its state in words', async () => {
      const { dots } = await cues(page);
      expect(dots.length, 'dots on screen').toBeGreaterThan(0);
      expect(dots.filter((d) => d.words === ''), 'a dot with no words').toEqual([]);
    });

    await test.step('increase contrast, the thread: the working, done and failed dots carry ∿ ✓ !', async () => {
      await page.emulateMedia({ contrast: 'more' });
      await page.waitForTimeout(150);
      const { dots } = await cues(page);
      const by = (st: string) => dots.filter((d) => d.state === st);
      expect(by('wk').length, "the sidebar's working dot").toBeGreaterThan(0);
      expect(by('ok').length, "the inbox's done dot").toBeGreaterThan(0);
      expect(by('er').length, "the inbox's failed dot").toBeGreaterThan(0);
      expect(dots.filter((d) => d.state !== '' && d.glyph === ''), 'a state dot with no glyph').toEqual([]);
      // each state its own glyph, so working, done and failed differ without their color (working is
      // the DS's '∿', done '✓', an error '!')
      const glyphs = ['wk', 'ok', 'er'].map((st) => new Set(by(st).map((d) => d.glyph)));
      expect(glyphs.map((g) => g.size), `one glyph per state: ${JSON.stringify(dots)}`).toEqual([1, 1, 1]);
      expect(new Set(glyphs.map((g) => [...g][0])).size, `the states' glyphs differ: ${JSON.stringify(dots)}`).toBe(3);
      expect(dots.filter((d) => d.words === ''), 'a dot with no words').toEqual([]);
      await page.screenshot({ path: test.info().outputPath('thread-contrast.png') });
    });

    await test.step("increase contrast, settings › models: the '✓ signed in' chip has its stand-in", async () => {
      await page.getByTestId('app.sidebar.settings').click();
      await page.getByTestId('settings.nav.models').click();
      await expect(page.getByTestId('settings.account.chatgpt.ok')).toBeVisible({ timeout: 5000 });
      const { chips } = await cues(page);
      expect(chips.length, 'toned chips on screen').toBeGreaterThan(0);
      expect(chips.filter((c) => c.glyph === ''), 'a toned chip with no glyph').toEqual([]);
      await page.screenshot({ path: test.info().outputPath('settings-contrast.png') });
    });
  } finally {
    await s.close();
    core.dispose();
  }
});
