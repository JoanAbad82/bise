// composer/picker-height · his m_25470 (the model menu ran off a short window): a ds Picker fits the
// room between its anchor and the window's edge. Passes when, in storefront on the scripted core
// (FakeCore, fake data), with 30 models in 4 providers and the agent's model the last one, at 800
// and 500 px of window height:
//   (1) the model menu sits whole inside the window (8 px from its top), above the box;
//   (2) its list scrolls (y only), the effort row stays outside the scroll, whole and visible;
//   (3) the current model's row is scrolled into view on open, with its ✓.
// Writes a shot per height. Owner: amb-win.
import { writeFileSync } from 'node:fs';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'storefront-1a2b3c4d';
const HOME = 'bise-home-00000000';
const PROVIDERS = ['Anthropic', 'Anthropic (foundry proxy)', 'OpenAI', 'Mistral'];
const MODELS = PROVIDERS.flatMap((provider, p) =>
  Array.from({ length: p === 3 ? 6 : 8 }, (_, i) => ({ id: `${provider.toLowerCase().replace(/[^a-z]+/gu, '-')}/model-${String(i + 1)}`, label: `${provider.split(' ')[0] ?? ''} model ${String(i + 1)}`, provider, short: '200k', context: 200000, vision: true, efforts: ['low', 'medium', 'high', 'max'], default_effort: 'high' })),
);
const LAST = MODELS[MODELS.length - 1]?.id ?? '';
const world = (now: number) => [
  { ev: 'prefs', prefs: { onboarded: true, theme: 'light', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 } },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'approvals', project: P, mode: 'yolo', env: false, checker: 'off', checker_who: '', repo: '/nowhere/storefront', rules: [] },
  { ev: 'agents', project: P, agents: [{ name: 'perf', main: false, status: 'idle', archived: false, title: '', purpose: 'product page speed', since_ms: now - 60 * 60_000, waits: 0, model: LAST, effort: 'high' }] },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: now - 9 * 60_000, kind: 'agent', text: 'the bench is ready.' }], before: null, more: false },
];

test('composer/picker-height: the model menu fits a short window, its list scrolls, the effort row and the current model show', async () => {
  test.setTimeout(120_000);
  const core = new FakeCore(world(Date.now()) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  try {
    const { page } = s;
    const size = async (w: number, h: number) => {
      await s.app.evaluate(({ BrowserWindow }, [w, h]) => {
        const win = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
        win?.setContentSize(w, h);
      }, [w, h] as const);
      await expect.poll(() => page.evaluate(() => window.innerHeight)).toBe(h);
    };
    await size(1100, 800);
    await expect(page.getByTestId('composer.box')).toBeVisible({ timeout: 10_000 });
    await core.send({ ev: 'models', project: P, items: MODELS } as never);
    await expect(page.getByTestId('composer.model')).toContainText('Mistral model 6');
    for (const h of [800, 500]) {
      await size(1100, h);
      await page.getByTestId('composer.model').click();
      const menu = page.getByTestId('composer.model.menu');
      await expect(menu).toBeVisible();
      await page.waitForTimeout(250);
      const m = await page.evaluate(() => {
        const el = document.querySelector('[data-testid="composer.model.menu"]');
        const list = el?.querySelector('.b-picker-list');
        const seg = el?.querySelector('.b-picker-seg');
        const cur = el?.querySelector('.b-picker-row[aria-checked="true"]');
        const box = document.querySelector('[data-testid="composer.box"]')?.getBoundingClientRect();
        const r = (x: Element | null | undefined) => x?.getBoundingClientRect();
        return {
          menu: r(el)?.toJSON() as DOMRect | undefined,
          list: r(list)?.toJSON() as DOMRect | undefined,
          seg: r(seg)?.toJSON() as DOMRect | undefined,
          cur: r(cur)?.toJSON() as DOMRect | undefined,
          curText: cur?.textContent ?? '',
          scrolls: list ? list.scrollHeight > list.clientHeight : false,
          xs: list ? list.scrollWidth - list.clientWidth : -1,
          boxTop: box?.top ?? 0,
          winH: window.innerHeight,
        };
      });
      writeFileSync(test.info().outputPath(`model-menu-${String(h)}.png`), await page.screenshot());
      expect(m.menu, 'the menu is drawn').toBeDefined();
      expect(m.menu?.top ?? -1, `${String(h)}: 8 px from the window's top at least`).toBeGreaterThanOrEqual(8);
      expect(m.menu?.bottom ?? 9999, `${String(h)}: above the box`).toBeLessThanOrEqual(m.boxTop);
      expect(m.scrolls, `${String(h)}: its list scrolls`).toBe(true);
      expect(m.xs, `${String(h)}: never an x scroll`).toBeLessThanOrEqual(0);
      expect((m.seg?.top ?? -1) >= (m.list?.bottom ?? 9999) - 1, `${String(h)}: the effort row sits under the scroll, outside it`).toBe(true);
      expect((m.seg?.bottom ?? 9999) <= (m.menu?.bottom ?? 0) + 1 && (m.seg?.bottom ?? 9999) <= m.winH, `${String(h)}: the effort row is whole in the window`).toBe(true);
      expect(m.curText, 'the current model has its ✓').toContain('✓');
      expect((m.cur?.top ?? -1) >= (m.list?.top ?? 0) - 1 && (m.cur?.bottom ?? 9999) <= (m.list?.bottom ?? 0) + 1, `${String(h)}: the current model is scrolled into view`).toBe(true);
      await page.keyboard.press('Escape');
      await expect(menu).toHaveCount(0);
    }
  } finally {
    await s.close();
    core.dispose();
  }
});
