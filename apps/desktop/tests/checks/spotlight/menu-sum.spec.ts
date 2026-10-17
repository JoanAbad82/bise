// spotlight/menu-sum · a live project's summary and its agents' submenu in the tray menu (his
// ask, main m_29563; designer m_29577). The new app on the scripted core (FakeCore): the hub's
// project rows, agents and cards, then the tray's click as main sends it (the capsule at 'menu').
// Passes when:
//   - a live line is 40 px with its second line: what waits on him first ('? search · which…'),
//     else its newest-active agent's note ('perf · merging…  +1'); bise's: main's note; quiet
//     ones stay 28 px, one line, no '›'; a long summary cuts after a whole word, the name whole;
//   - keys: ↓ moves the row (the 9% tint), → opens the submenu on its first row, ↓ moves in it,
//     ← closes it, esc closes it then the menu stays until a second esc;
//   - pointer: resting on a live line opens its submenu (head, live agents waiting first, ages,
//     'open <project>'), the window grows 340 → 620 with the menu where it was; a quiet line
//     closes it, the window back to 340; a click on an agent opens its thread in the window.
// Shots: menu-sum-{keys,sub}-{light,dark}.png.
import { test, expect, FakeCore, FakeHelper, launchDesktop } from '../../harness';

const HOME = 'bise-home-00000000';
const T0 = 1791100000000;
type Ev = Parameters<FakeCore['send']>[0];
const prefs = (theme: 'light' | 'dark'): Ev =>
  ({
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
  }) as unknown as Ev;
const row = (project: string, name: string, order: number, waits = 0, working = 0): Record<string, unknown> => ({
  project, name, path: `/nowhere/${name}`, git: true, branch: 'main', home: false, order, agents: waits + working, working, waits, running: true,
});
const home = (waits: number, working: number): Record<string, unknown> => ({ ...row(HOME, 'bise', 0, waits, working), home: true, git: false });
const agent = (name: string, status: string, title: string, minsAgo: number, more: Record<string, unknown> = {}): Record<string, unknown> => {
  const since = Date.now() - minsAgo * 60_000;
  return { name, main: name === 'main', status, archived: false, title, purpose: title, since_ms: since, waits: 0, watching: [], ...(status === 'working' ? { doing: { kind: 'tool', since_ms: since } } : {}), ...more };
};
const card = (id: number, agent: string, question: string): Record<string, unknown> => ({
  id, kind: 'question', rank: 1, agent, question, options: [{ n: 1, label: 'yes' }, { n: 2, label: 'no' }], urgent: false, since_ms: T0 + id * 1000,
});
const PROJECTS = [home(0, 1), row('store-1', 'storefront', 1, 1, 2), row('api-2', 'api', 2, 0, 2), row('site-3', 'site', 3, 0, 1), row('docs-4', 'docs', 4), row('ops-5', 'ops', 5)];

test('spotlight/menu-sum: a summary under each live project, its agents in a submenu (keys and pointer)', async () => {
  test.setTimeout(150_000);
  const core = new FakeCore();
  const helper = new FakeHelper();
  const s = await launchDesktop({ core, helper });
  try {
    const { app } = s;
    await s.page.waitForTimeout(1500);
    await core.send({ ev: 'projects', projects: PROJECTS } as unknown as Ev);
    await core.send({ ev: 'agents', project: HOME, agents: [agent('main', 'working', '', 3, { note: 'watching the launch replies on hn and bluesky' })] } as unknown as Ev);
    await core.send({ ev: 'agents', project: 'store-1', agents: [agent('main', 'idle', '', 90), agent('search', 'idle', 'the filter sizes', 30), agent('perf', 'working', 'cache', 4, { note: 'merging the cache fix into the checkout path' }), agent('cart', 'working', 'the cart totals', 12), agent('old', 'done', 'old work', 600)] } as unknown as Ev);
    await core.send({ ev: 'agents', project: 'api-2', agents: [agent('main', 'idle', '', 90), agent('ingest', 'working', 'find why the ingest p99 doubled after the batch writer moved to the new queue and the retries piled up', 25), agent('auth', 'working', 'rotate keys', 2)] } as unknown as Ev);
    await core.send({ ev: 'agents', project: 'site-3', agents: [agent('main', 'idle', '', 90), agent('blog', 'working', 'the launch post', 7)] } as unknown as Ev);
    await core.send({ ev: 'cards', project: HOME, cards: [] } as unknown as Ev);
    await core.send({ ev: 'cards', project: 'store-1', cards: [card(4, 'search', 'which size system should the filter use for kids shoes: EU, US or both side by side?')] } as unknown as Ev);
    await helper.send({ ev: 'fn', act: 'key', key: 'space' });
    await expect.poll(() => app.windows().some((p) => p.url().includes('surface=capsule'))).toBe(true);
    const cap = app.windows().find((p) => p.url().includes('surface=capsule'));
    if (!cap) throw new Error('no capsule window');
    await expect(cap.locator('[data-testid="spot.input"]')).toBeVisible({ timeout: 5000 });
    await app.evaluate(({ BrowserWindow }) => {
      const w = BrowserWindow.getAllWindows().find((b) => b.webContents.getURL().includes('surface=capsule'));
      w?.webContents.send('bise:capsule-state', { shown: true, at: 'menu', keys: true, why: 'tray' });
    });
    const backdrop = async (t: 'light' | 'dark'): Promise<void> => {
      await cap.emulateMedia({ reducedMotion: 'reduce', colorScheme: t });
      await cap.evaluate((c) => {
        document.documentElement.style.background = c;
      }, t === 'dark' ? '#2a2a2c' : '#ececec');
      await cap.waitForTimeout(400);
    };
    const winWidth = (): Promise<number> =>
      app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((b) => b.webContents.getURL().includes('surface=capsule'))?.getBounds().width ?? 0);
    const winX = (): Promise<number> =>
      app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((b) => b.webContents.getURL().includes('surface=capsule'))?.getBounds().x ?? 0);
    const line = (id: string) => cap.locator(`[data-testid="capsule.menu.project.${id}"]`);
    const sum = (id: string) => cap.locator(`[data-testid="capsule.menu.project.${id}.sum"]`);
    const sub = cap.locator('[data-testid="capsule.menu.sub"]');

    // the summaries
    await expect(sum('store-1'), 'what waits first').toContainText('?search · which size system', { timeout: 5000 });
    await expect(sum('api-2'), "else the newest-active agent's words and the others at work").toContainText('auth · rotate keys');
    await expect(sum('api-2').locator('.more')).toHaveText('+1');
    await expect(sum('bise'), "bise's: main's note").toContainText('watching the launch');
    await expect(sum('docs-4'), 'a quiet line has none').toHaveCount(0);
    await expect(line('docs-4').locator('.go'), "and no '›'").toHaveCount(0);
    await expect(line('store-1').locator('.go')).toHaveText('›');
    for (const [id, h] of [['store-1', 40], ['api-2', 40], ['bise', 40], ['docs-4', 28]] as const) {
      const got = await cap.locator(`[data-testid="capsule.menu.project.${id}.line"]`).evaluate((el) => el.getBoundingClientRect().height);
      expect(got, `${id}: ${String(h)} px`).toBeCloseTo(h, 0);
    }
    // a long summary cuts after a whole word with a glued '…', the name never cuts
    const cut = await sum('store-1').locator('.t').evaluate((el) => ({ text: el.textContent, title: el.getAttribute('title') }));
    expect(cut.text, 'cut after a whole word').toMatch(/\S…$/u);
    expect(cut.title, 'its whole words on hover').toBe('search · which size system should the filter use for kids shoes: EU, US or both side by side?');
    const name = await line('store-1').locator('.pj').evaluate((el) => el.scrollWidth <= el.clientWidth);
    expect(name, 'the name whole').toBe(true);
    expect(await winWidth(), 'the menu alone: 340 px').toBe(340);

    // keys: ↓ to storefront (bise, then storefront: no inbox rows above? one card: its row first)
    const items = await cap.locator('[data-testid^="capsule.menu.item."]').count();
    for (let i = 0; i < items + 2; i++) await cap.keyboard.press('ArrowDown');
    await expect(line('store-1'), '↓ selects storefront').toHaveClass(/\bon\b/u);
    for (const t of ['light', 'dark'] as const) {
      await core.send(prefs(t));
      await backdrop(t);
      await cap.screenshot({ path: test.info().outputPath(`menu-sum-keys-${t}.png`) });
    }
    const x0 = await winX();
    await cap.keyboard.press('ArrowRight');
    await expect(sub, '→ opens the submenu').toBeVisible({ timeout: 3000 });
    await expect(cap.locator('[data-testid="capsule.menu.sub.head"]')).toHaveText('storefront2 working · 1 waiting for you');
    const names = await sub.locator('[data-testid^="capsule.menu.sub.agent."]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')?.split('.').pop()));
    expect(names, 'waiting first, then at work newest first; idle and done out').toEqual(['search', 'perf', 'cart']);
    await expect(cap.locator('[data-testid="capsule.menu.sub.agent.perf"] .end')).toHaveText(/^[45]m$/u);
    await expect(cap.locator('[data-testid="capsule.menu.sub.agent.search"]'), '→ lands on its first row').toHaveClass(/\bon\b/u);
    await expect.poll(winWidth, 'the window grows to 620').toBe(620);
    expect(await winX(), 'the menu never moves (it opens on the side with room)').toBe(x0);
    await cap.keyboard.press('ArrowDown');
    await expect(cap.locator('[data-testid="capsule.menu.sub.agent.perf"]')).toHaveClass(/\bon\b/u);
    await cap.keyboard.press('ArrowLeft');
    await expect(sub, '← closes it').toHaveCount(0);
    await expect.poll(winWidth, 'back to 340').toBe(340);
    await cap.keyboard.press('ArrowRight');
    await expect(sub).toBeVisible();
    await cap.keyboard.press('Escape');
    await expect(sub, 'esc closes the submenu first').toHaveCount(0);
    await expect(cap.locator('[data-testid="capsule.menu"]'), 'the menu stays').toBeVisible();

    // pointer: resting on api opens its submenu level with its row
    await line('api-2').hover();
    await expect(sub, 'a rest on a live line opens it').toBeVisible({ timeout: 3000 });
    await expect(cap.locator('[data-testid="capsule.menu.sub.open"]')).toHaveText('open api');
    const level = await cap.evaluate(() => {
      const r = document.querySelector('[data-testid="capsule.menu.project.api-2"]')?.getBoundingClientRect();
      const first = document.querySelector('[data-testid^="capsule.menu.sub.agent."]')?.getBoundingClientRect();
      return r !== undefined && first !== undefined ? Math.abs(r.top - first.top) : 999;
    });
    expect(level, 'its rows start level with the row').toBeLessThan(14);
    await cap.locator('[data-testid="capsule.menu.sub.agent.ingest"]').hover();
    await expect(cap.locator('[data-testid="capsule.menu.sub.agent.ingest"]')).toHaveClass(/\bon\b/u);
    for (const t of ['light', 'dark'] as const) {
      await core.send(prefs(t));
      await backdrop(t);
      await cap.screenshot({ path: test.info().outputPath(`menu-sum-sub-${t}.png`) });
    }
    await line('docs-4').hover();
    await expect(sub, 'a quiet line closes it').toHaveCount(0, { timeout: 3000 });
    // a click on an agent opens its thread in the window
    await line('site-3').hover();
    await expect(sub).toBeVisible({ timeout: 3000 });
    await cap.locator('[data-testid="capsule.menu.sub.agent.blog"]').click();
    await expect(s.page.getByTestId('app.sidebar.project.site-3'), "the window shows site's project").toHaveAttribute('aria-current', 'true', { timeout: 5000 });
  } finally {
    await s.close();
    core.dispose();
  }
});
