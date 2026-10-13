// ds/slash-search · his words (ambient-lead m_22845), designer m_22848: a list's search that '/'
// focuses says so, GitHub's way: the sidebar's boxed key, '/', at the field's right end (8 px from
// the edge, centred); the placeholder says what it searches. The box hides once the field has the
// focus or words, and drops whole under 160 px of field. One DS Field (`slash`), on every list
// screen whose '/' focuses its search: artifacts and scheduled. Shots rest, hover, focused, with
// words; light and dark; 1100 and 800, for designer's sign. The scripted core (FakeCore), fake
// data. Owner: amb-web.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const SHOP = 'shop-1a2b3c4d';
const H = 3600_000;
const M = 60_000;

function world(now: number) {
  const art = (id: string, kind: string, title: string, agent: string, ago: number) =>
    ({ id, kind, title, agent, version: 1, at_ms: now - ago, url: `http://127.0.0.1:9/p/${id}`, new: false });
  return [
    { ev: 'prefs', prefs: { onboarded: true, theme: 'light' } },
    { ev: 'projects', projects: [{ project: SHOP, name: 'storefront', path: '/nowhere/shop', git: true, home: false, order: 0, agents: 3, working: 0, waits: 0, running: true }] },
    {
      ev: 'artifacts', project: SHOP, items: [
        art('product-page', 'page', 'product page, before / after', 'perf', 1 * H),
        art('bench-csv', 'file', 'bench results.csv', 'perf', 3 * H),
      ],
    },
    {
      ev: 'scheduled', project: SHOP, items: [
        { id: 4, name: 'deploy watch', agent: 'deploy-watch', by: 'main', words: 'check the deploy of the storefront', every: '5m', done: 6, next_ms: now + 3 * M },
        { id: 7, name: 'bench rerun', agent: 'perf', by: 'perf', words: 'rerun the product page bench', every: '1h', done: 3, next_ms: now + 41 * M },
      ],
    },
  ];
}

const PLACEHOLDER = { artifacts: 'search artifacts', scheduled: 'search scheduled tasks' } as const;

for (const screen of ['artifacts', 'scheduled'] as const) {
  test(`ds/slash-search (${screen}): a boxed '/' at the field's right end; '/' focuses, the box hides`, async () => {
    test.setTimeout(150_000);
    const core = new FakeCore(world(Date.now()) as never);
    const s = await launchDesktop({ core, route: screen });
    try {
      const { page } = s;
      const id = `${screen}.search`;
      const field = page.getByTestId(id);
      const cap = page.getByTestId(`${id}.slash`);
      await expect(page.getByTestId(`${screen}.screen`)).toBeVisible({ timeout: 10_000 });
      await expect(field).toBeVisible({ timeout: 5000 });
      const win = await s.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0]?.id ?? -1);
      const size = async (w: number) => {
        await s.app.evaluate(({ BrowserWindow }, [wid, w2]) => BrowserWindow.fromId(wid ?? -1)?.setContentSize(w2 ?? 0, 760), [win, w]);
        await expect.poll(() => page.evaluate(() => window.innerWidth), { timeout: 5000 }).toBe(w);
        await page.waitForTimeout(150);
      };
      const theme = async (t: 'light' | 'dark') => {
        await core.send({ ev: 'prefs', prefs: { onboarded: true, theme: t } } as never);
        await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
        await page.waitForTimeout(200);
      };
      const shot = (name: string) => page.screenshot({ path: test.info().outputPath(`${screen}-${name}.png`) });
      /** the field's box and the key's place in it */
      const geo = () => page.evaluate((tid) => {
        const f = document.querySelector(`[data-testid="${tid}"]`)?.closest('.b-field')?.getBoundingClientRect();
        const c = document.querySelector(`[data-testid="${tid}.slash"]`)?.getBoundingClientRect();
        const i = document.querySelector(`[data-testid="${tid}"]`)?.getBoundingClientRect();
        if (!f) return null;
        return { w: f.width, cap: c && c.width > 0 ? { right: f.right - c.right, top: c.top - f.top, bottom: f.bottom - c.bottom, gap: c.left - (i?.right ?? 0) } : null };
      }, id);
      const clear = async () => {
        await field.fill('');
        await page.getByTestId(`${screen}.screen`).focus();
      };

      expect(await field.getAttribute('placeholder'), 'the placeholder says what it searches').toBe(PLACEHOLDER[screen]);
      expect(await cap.textContent()).toBe('/');

      for (const t of ['light', 'dark'] as const) {
        await theme(t);
        for (const w of [1100, 800]) {
          await size(w);
          const tag = `${t}-${String(w)}`;
          await page.getByTestId(`${screen}.screen`).focus();
          const g = await geo();
          expect(g, `${tag}: the field shows`).not.toBeNull();
          if ((g?.w ?? 0) >= 160) {
            await expect(cap, `${tag}: the box shows at rest`).toBeVisible();
            expect.soft(g?.cap?.right ?? 99, `${tag}: 8 px from the right edge`).toBeCloseTo(8, 0);
            expect.soft(Math.abs((g?.cap?.top ?? 0) - (g?.cap?.bottom ?? 99)), `${tag}: centred`).toBeLessThanOrEqual(1);
            expect.soft(g?.cap?.gap ?? -1, `${tag}: the words never run under it`).toBeGreaterThanOrEqual(0);
          } else {
            await expect(cap, `${tag}: under 160 px of field the box drops`).toBeHidden();
          }
          await shot(`${tag}-0-rest`);
          await field.hover();
          await shot(`${tag}-1-hover`);
          await page.mouse.move(2, 400);
          await page.getByTestId(`${screen}.screen`).focus();
          await page.keyboard.press('/');
          await expect(field, `${tag}: '/' focuses the search`).toBeFocused();
          await expect(cap, `${tag}: focused, the box hides`).toBeHidden();
          expect(await field.inputValue(), "the '/' is not typed").toBe('');
          await shot(`${tag}-2-focused`);
          await page.keyboard.type('bench');
          await page.keyboard.press('Enter');
          await expect(field).not.toBeFocused();
          await expect(cap, `${tag}: with words, the box stays hidden`).toBeHidden();
          await shot(`${tag}-3-words`);
          await clear();
          if ((g?.w ?? 0) >= 160) await expect(cap, `${tag}: empty again, the box is back`).toBeVisible();
        }
      }
      // narrow: under 160 px of field the box drops whole
      await theme('light');
      await size(1100);
      await page.evaluate((tid) => {
        const f = document.querySelector<HTMLElement>(`[data-testid="${tid}"]`)?.closest<HTMLElement>('.b-field');
        if (f) f.style.width = '150px';
      }, id);
      await page.waitForTimeout(100);
      expect((await geo())?.w).toBeLessThan(160);
      await expect(cap, 'under 160 px of field the box drops').toBeHidden();
      await expect.poll(() => field.getAttribute('placeholder'), { message: "too narrow for its placeholder: the whole word 'search', never a cut one (designer m_22910)", timeout: 3000 })
        .toBe(screen === 'scheduled' ? 'search' : await field.getAttribute('placeholder'));
      const fits = await field.evaluate((el: HTMLInputElement) => {
        const ctx = document.createElement('canvas').getContext('2d');
        if (!ctx) return false;
        ctx.font = getComputedStyle(el).font;
        return ctx.measureText(el.placeholder).width <= el.clientWidth;
      });
      expect(fits, 'the narrow placeholder fits whole').toBe(true);
      await shot('light-1100-4-narrow');
      await page.evaluate((tid) => {
        const f = document.querySelector<HTMLElement>(`[data-testid="${tid}"]`)?.closest<HTMLElement>('.b-field');
        if (f) f.style.width = '';
      }, id);
      await expect.poll(() => field.getAttribute('placeholder'), { message: 'wide again, the whole placeholder is back', timeout: 3000 }).toBe(PLACEHOLDER[screen]);
    } finally {
      await s.close();
    }
  });
}
