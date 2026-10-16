// spotlight/menu-projects · the tray menu's projects (his ask, main m_27861; designer m_27872).
// The new app on the scripted core (FakeCore): the hub's project rows, then the tray's click as
// main sends it (the capsule at 'menu', why 'tray').
// Passes when:
//   - a normal day (bise + 4 projects): bise's line first, then his projects in his order, each
//     at the tight row (28 px), the end '? n' then '∿ n' only on a live one, the words as its tip;
//   - 9 projects with 2 live past the 6th: both live ones show, quiet ones fill up to 6, the last
//     row says '3 more in bise';
//   - a click on a line opens that project in the window.
// Shots: menu-projects-{day,many}-{light,dark}.png.
import { test, expect, FakeCore, FakeHelper, launchDesktop } from '../../harness';
import { panel } from '../../../src/proto/words_panel.gen';

const HOME = 'bise-home-00000000';
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
const row = (project: string, name: string, order: number, waits = 0, working = 0, more: Record<string, unknown> = {}): Record<string, unknown> => ({
  project, name, path: `/nowhere/${name}`, git: true, branch: 'main', home: false, order, agents: waits + working, working, waits, running: true, ...more,
});
const home = (waits: number, working: number): Record<string, unknown> => ({ ...row(HOME, 'bise', 0, waits, working), home: true, git: false });
const card = (id: number, agent: string, question: string, since: number): Record<string, unknown> => ({
  id, kind: 'question', rank: 1, agent, question, options: [{ n: 1, label: 'yes' }, { n: 2, label: 'no' }], urgent: false, since_ms: 1791100000000 + since * 1000,
});
const DAY = [
  home(1, 2),
  row('harness-1', 'harness', 1, 1, 3),
  row('site-2', 'bise-site', 2, 0, 1),
  row('dotfiles-3', 'dotfiles', 3),
  row('notes-4', 'a-project-with-a-very-long-name-that-cuts', 4, 0, 2),
];
const MANY = [
  home(0, 0),
  ...['api', 'web', 'docs', 'infra', 'mobile', 'design', 'billing', 'search', 'ops'].map((n, i) =>
    row(`${n}-${String(i)}`, n, i + 1, n === 'billing' ? 2 : 0, n === 'web' ? 1 : n === 'ops' ? 4 : 0),
  ),
];

test('spotlight/menu-projects: one line per project, bise first, live ones never hidden, a click opens it', async () => {
  test.setTimeout(120_000);
  const core = new FakeCore();
  const helper = new FakeHelper();
  const s = await launchDesktop({ core, helper });
  try {
    const { app } = s;
    await s.page.waitForTimeout(1500);
    await core.send({ ev: 'cards', project: 'acme-1a2b3c4d', cards: [], others: [] } as unknown as Ev);
    await core.send({ ev: 'projects', projects: DAY } as unknown as Ev);
    // a true day: the inbox rows are the cards the rows count (designer m_27930: one set of counts)
    await core.send({ ev: 'cards', project: HOME, cards: [card(1, 'main', 'send the weekly update to the team?', 10)] } as unknown as Ev);
    await core.send({ ev: 'cards', project: 'harness-1', cards: [card(2, 'perf', 'merge the cache fix into main?', 20)] } as unknown as Ev);
    await helper.send({ ev: 'fn', act: 'key', key: 'space' });
    await expect.poll(() => app.windows().some((p) => p.url().includes('surface=capsule'))).toBe(true);
    const cap = app.windows().find((p) => p.url().includes('surface=capsule'));
    if (!cap) throw new Error('no capsule window');
    await expect(cap.locator('[data-testid="spot.input"]')).toBeVisible({ timeout: 5000 });
    const tray = async (): Promise<void> => {
      await app.evaluate(({ BrowserWindow }) => {
        const w = BrowserWindow.getAllWindows().find((b) => b.webContents.getURL().includes('surface=capsule'));
        w?.webContents.send('bise:capsule-state', { shown: true, at: 'menu', keys: true, why: 'tray' });
      });
    };
    await tray();
    // a stand-in for the glass behind the menu (the real one is macOS vibrancy over his screen),
    // as streaming.spec's shots do
    const backdrop = async (t: 'light' | 'dark'): Promise<void> => {
      await cap.emulateMedia({ reducedMotion: 'reduce', colorScheme: t });
      await cap.evaluate((c) => {
        document.documentElement.style.background = c;
      }, t === 'dark' ? '#2a2a2c' : '#ececec');
      await cap.waitForTimeout(400);
    };
    const block = cap.locator('[data-testid="capsule.menu.projects"]');
    await expect(block, 'the menu has its projects block').toBeVisible({ timeout: 3000 });
    await expect(cap.locator('[data-testid="capsule.menu.head"]'), 'the head reads the rows: every live project, bise in').toHaveText('8 at work · 2 waiting for you');
    await expect(cap.locator('[data-testid^="capsule.menu.item."]')).toHaveCount(2);
    const line = (id: string) => cap.locator(`[data-testid="capsule.menu.project.${id}"]`);
    const ids = async (): Promise<string[]> =>
      block.locator('[data-testid^="capsule.menu.project."]:not([data-testid$=".line"])').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid') ?? ''));
    expect(await ids(), "bise's line, then his order").toEqual(['bise', 'harness-1', 'site-2', 'dotfiles-3', 'notes-4'].map((i) => `capsule.menu.project.${i}`));
    await expect(line('harness-1').locator('.b-cap-pj-end')).toHaveText('? 1∿ 3');
    await expect(line('bise').locator('.b-cap-pj-end')).toHaveText('? 1∿ 2');
    await expect(line('dotfiles-3').locator('.b-cap-pj-end'), 'a quiet one has no end').toHaveCount(0);
    await expect(cap.locator('[data-testid="capsule.menu.project.harness-1.line"]')).toHaveAttribute('title', 'harness · 1 waiting for you · 3 agents at work · on main');
    for (const id of ['bise', 'harness-1', 'site-2', 'dotfiles-3', 'notes-4']) {
      const h = await line(id).evaluate((el) => el.getBoundingClientRect().height);
      expect(h, `${id} is the tight row (28 px)`).toBeCloseTo(28, 2);
    }
    const w = await cap.locator('[data-testid="capsule.menu"]').evaluate((el) => el.getBoundingClientRect().width);
    expect(w, 'the menu is 340 px wide with its projects').toBeCloseTo(340, 0);
    // the long name cuts with '…', its end stays whole
    const cut = await line('notes-4').evaluate((el) => {
      const nm = el.querySelector('.nm');
      const end = el.querySelector('.b-cap-pj-end');
      return { cut: nm !== null && nm.scrollWidth > nm.clientWidth, end: end === null ? 0 : end.scrollWidth - end.clientWidth };
    });
    expect(cut, 'the name cuts, the end never').toEqual({ cut: true, end: 0 });
    for (const t of ['light', 'dark'] as const) {
      await core.send(prefs(t));
      await backdrop(t);
      await cap.screenshot({ path: test.info().outputPath(`menu-projects-day-${t}.png`) });
    }
    await core.send({ ev: 'projects', projects: MANY } as unknown as Ev);
    await core.send({ ev: 'cards', project: HOME, cards: [] } as unknown as Ev);
    await core.send({ ev: 'cards', project: 'billing-6', cards: [card(3, 'refunds', 'refund the double charge?', 30), card(4, 'invoices', 'send the october invoices?', 40)] } as unknown as Ev);
    await expect(cap.locator('[data-testid="capsule.menu.projects.more"]')).toHaveText(panel.tray_more({ n: 3 }), { timeout: 3000 });
    await expect(cap.locator('[data-testid="capsule.menu.head"]')).toHaveText('5 at work · 2 waiting for you');
    expect(await ids(), 'live ones past the 6th show, quiet ones fill to 6').toEqual(
      ['bise', 'api-0', 'web-1', 'docs-2', 'infra-3', 'billing-6', 'ops-8'].map((i) => `capsule.menu.project.${i}`),
    );
    for (const t of ['light', 'dark'] as const) {
      await core.send(prefs(t));
      await backdrop(t);
      await cap.screenshot({ path: test.info().outputPath(`menu-projects-many-${t}.png`) });
    }
    // a click opens that project in the window
    await line('billing-6').click();
    await expect(s.page.getByTestId('app.sidebar.project.billing-6'), "the window shows billing's thread").toHaveAttribute('aria-current', 'true', { timeout: 5000 });
  } finally {
    await s.close();
    core.dispose();
  }
});
