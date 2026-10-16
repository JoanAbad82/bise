// app/menus · every menu is the ds Picker (his m_26194: « les menus avec pas de max-height et avec le
// carret pas centré ... de manière systémique », the inbox's 'all projects' / 'all agents' in his shot).
// On the real shell with the scripted core (FakeCore, fake data: 40 agents asked him something).
// Passes when, at 1400 / 1100 / 800 x 820 and in a short window (1100 x 560):
//   - every menu trigger on the screen (aria-haspopup=menu) has the ds caret (an 8x5 svg), centered
//     on the trigger's height (±1 px) and 8 px after its words: never a '⌄' glyph on the baseline;
//   - the inbox's agents menu (the projects menu at 800, which takes the agents) is a ds Picker in the
//     ds pop layer, at most half the window high, inside the window on all four sides, its list
//     scrolling inside (never the page);
//   - the current agent, far down the list, is scrolled into view when the menu opens again;
//   - a sidebar project's ⋯ menu is the same Picker under the same cap.
// Shots (for designer): the menu open at each size, light + dark.
// Owner: menus-ds.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { inbox } from '../../../src/proto/words_inbox.gen';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const AGENTS = Array.from({ length: 40 }, (_, i) => `agent-${String(i).padStart(2, '0')}`);
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string, archived = false) => ({ name, main: name === 'main', status: 'idle', archived, title: '', purpose: `${name}'s job`, since_ms: NOW - 3_600_000, waits: 0 });
const RECORDS = AGENTS.map((a, i) => ({
  card: i + 1, project: P, asker: a, kind: 'question', question: `does ${a} ship today?`, options: [], state: 'answered', said: 'yes',
  where: { kind: 'inbox' }, asked_ms: NOW - (i + 2) * 600_000, at_ms: NOW - (i + 1) * 600_000, line2: inbox.answered_at({ said: 'yes', place: inbox.where_inbox }),
}));
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: AGENTS.length + 1, working: 0, waits: 0, running: true, cards: [] },
    ],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: HOME, agents: [ag('main')] },
  { ev: 'agents', project: P, agents: [ag('main'), ...AGENTS.map((a, i) => ag(a, i >= 20))] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
  { ev: 'inbox_history', project: P, items: RECORDS, more: false, answered: RECORDS.length, withdrawn: 0 },
  { ev: 'inbox_history', project: HOME, items: [], more: false, answered: 0, withdrawn: 0 },
];

async function shoot(page: Page, core: FakeCore, name: string): Promise<void> {
  await page.waitForTimeout(200);
  await page.screenshot({ path: test.info().outputPath(`${name}-light.png`) });
  await core.send(prefs('dark') as never);
  await page.waitForTimeout(350);
  await page.screenshot({ path: test.info().outputPath(`${name}-dark.png`) });
  await core.send(prefs('light') as never);
  await page.waitForTimeout(250);
}

/** Every visible menu trigger: the ds caret, centered on the trigger, 8 px after the words. */
async function caretsCentered(page: Page): Promise<void> {
  const triggers = await page.locator('[aria-haspopup="menu"]').evaluateAll((els) =>
    els
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => {
        const t = el.getBoundingClientRect();
        const v = el.querySelector('svg.v')?.getBoundingClientRect();
        const w = el.querySelector('.w')?.getBoundingClientRect();
        return {
          id: el.getAttribute('data-testid') ?? el.textContent,
          glyph: el.textContent.includes('⌄'),
          dy: v === undefined ? 99 : Math.abs(v.top + v.height / 2 - (t.top + t.height / 2)),
          gap: v === undefined || w === undefined ? -1 : Math.round(v.left - w.right),
          size: v === undefined ? '' : `${String(v.width)}x${String(v.height)}`,
        };
      }),
  );
  expect(triggers.length, 'a menu trigger on the screen').toBeGreaterThan(0);
  for (const c of triggers) {
    expect(c.glyph, `${c.id}: no '⌄' glyph`).toBe(false);
    expect(c.size, `${c.id}: the ds 8x5 caret`).toBe('8x5');
    expect(c.dy, `${c.id}: the caret centered on the trigger`).toBeLessThanOrEqual(1);
    expect(c.gap, `${c.id}: 8 px after the words`).toBe(8);
  }
}

/** The menu: a ds Picker in the pop layer, ≤ 50vh, inside the window, its list scrolling inside. */
async function menuFits(page: Page, id: string, scrolls: boolean): Promise<void> {
  const m = await page.getByTestId(id).evaluate((el) => {
    const r = el.getBoundingClientRect();
    const list = el.querySelector('.b-picker-list');
    const cur = el.querySelector('[aria-checked="true"]')?.getBoundingClientRect();
    const lr = list?.getBoundingClientRect();
    return {
      picker: el.classList.contains('b-picker') && el.closest('.b-picker-pop') !== null,
      h: r.height, vh: window.innerHeight, vw: window.innerWidth, top: r.top, bottom: r.bottom, left: r.left, right: r.right,
      scrolls: list !== null && list.scrollHeight > list.clientHeight,
      pageScrolls: document.scrollingElement !== null && document.scrollingElement.scrollHeight > window.innerHeight,
      curIn: cur === undefined || lr === undefined ? null : cur.top >= lr.top - 1 && cur.bottom <= lr.bottom + 1,
    };
  });
  expect(m.picker, `${id}: the ds Picker in the ds pop layer`).toBe(true);
  expect(m.h, `${id}: at most half the window`).toBeLessThanOrEqual(m.vh / 2 + 1);
  expect(m.top, `${id}: inside the window (top)`).toBeGreaterThanOrEqual(0);
  expect(m.bottom, `${id}: inside the window (bottom)`).toBeLessThanOrEqual(m.vh);
  expect(m.left, `${id}: inside the window (left)`).toBeGreaterThanOrEqual(0);
  expect(m.right, `${id}: inside the window (right)`).toBeLessThanOrEqual(m.vw);
  expect(m.pageScrolls, `${id}: never a page scroll`).toBe(false);
  if (scrolls) expect(m.scrolls, `${id}: its list scrolls inside`).toBe(true);
  if (m.curIn !== null) expect(m.curIn, `${id}: the current row in view`).toBe(true);
}

test('app/menus: every menu is the ds Picker, ≤ 50vh, inside the window, its caret centered (1400/1100/800, short)', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'inbox/all', size: '1400x820' });
  try {
    const { page } = s;
    await expect(page.getByTestId('inbox.screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId(`inbox.row.p:${P}/1`)).toBeVisible({ timeout: 5000 });

    for (const [w, h] of [[1400, 820], [1100, 820], [800, 820], [1100, 560]] as const) {
      const name = `${String(w)}x${String(h)}`;
      await test.step(`the inbox's menus at ${name}`, async () => {
        await page.setViewportSize({ width: w, height: h });
        await page.waitForTimeout(250);
        await caretsCentered(page);
        // at 800 the agents go into the projects menu (past.css)
        const trigger = w === 800 ? 'inbox.projects' : 'inbox.agents';
        await page.getByTestId(trigger).click();
        await expect(page.getByTestId(`${trigger}.menu`)).toBeVisible();
        await menuFits(page, `${trigger}.menu`, true);
        await shoot(page, core, `inbox-${name}`);
        await page.keyboard.press('Escape');
        await expect(page.getByTestId(`${trigger}.menu`)).toHaveCount(0);
        await expect(page.getByTestId(trigger)).toBeFocused();
      });
    }

    await test.step('the current agent, far down, is in view when the menu opens again', async () => {
      await page.setViewportSize({ width: 1400, height: 820 });
      await page.getByTestId('inbox.agents').click();
      await page.getByTestId('inbox.agents.menu').locator('[role="menu"], .b-picker-list').first().evaluate((el) => { el.scrollTop = el.scrollHeight; });
      await page.getByTestId('inbox.agents.agent-33').click();
      await expect(page.getByTestId('inbox.agents')).toHaveText('agent-33');
      await caretsCentered(page);
      await page.getByTestId('inbox.agents').click();
      await expect(page.getByTestId('inbox.agents.agent-33')).toHaveAttribute('aria-checked', 'true');
      await menuFits(page, 'inbox.agents.menu', true);
      // ↓ walks from the current one; a letter jumps
      await page.keyboard.press('ArrowDown');
      await expect(page.getByTestId('inbox.agents.agent-34')).toHaveClass(/\bon\b/u);
      await page.keyboard.press('Escape');
    });

    await test.step("a sidebar project's ⋯ menu is the same Picker", async () => {
      const row = page.getByTestId(`app.sidebar.project.${P}`);
      await row.hover();
      await page.getByTestId(`app.sidebar.project.${P}.menu`).click();
      await expect(page.getByTestId(`app.sidebar.project.${P}.menu.list`)).toBeVisible();
      await menuFits(page, `app.sidebar.project.${P}.menu.list`, true);
      await shoot(page, core, 'sidebar-more-1400');
      await page.keyboard.press('Escape');
      await expect(page.getByTestId(`app.sidebar.project.${P}.menu.list`)).toHaveCount(0);
    });
  } finally {
    await s.close();
  }
});
