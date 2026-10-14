// inbox/inbox-screen · designer's inbox-history pick A (m_24212 (2)-(6)): the inbox screen, on the real
// shell with the scripted core (FakeCore, fake data). Passes when:
//   - the sidebar's '? inbox' row carries the pink waiting count (bise's row keeps its pearl, no count);
//     a click opens the screen (route inbox/all);
//   - the head says 'inbox' and '3 waiting · 2 answered' (bise's notifications ask counts, as in the block
//     and the sidebar); 'waiting for you · 3' comes first, then the
//     past by day (today, yesterday), two lines each ('you: <his words> · in the inbox'), the withdrawn
//     one dim with its reason;
//   - ⏎ on a waiting item opens it above this screen's composer ('answering perf · which bench?'), as ⌘I;
//   - ⏎ on a past one goes to perf's thread at his answer, flashed once (answered-link's openAnswer; a
//     history step: ⌘[ comes back to the inbox);
//   - the history is asked of each project's hub (inbox_history) when the screen opens;
//   - space opens the read-only detail, esc back; '/' searches;
//   - no folded block above the composer at rest (the list is the inbox), only the item he opens; the key
//     line says '⏎ answer' on a waiting row, '⏎ go to it' on a past one (designer m_25639);
//   - 1400 / 1100 / 800 x 820: at 800 the agents filter and 'withdrawn' leave the head row, the rows drop
//     the project and the 'where' whole; no text clipped.
// Shots (for designer): the list at 1400/1100/800, the detail, the jump, each light + dark.
// Owner: inbox-screen.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect, textProblems } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const today = (h: number, m: number) => {
  const d = new Date(NOW);
  d.setHours(h, m, 0, 0);
  return Math.min(d.getTime(), NOW - 60_000);
};
const yesterday = (h: number, m: number) => today(h, m) - 86_400_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 3_600_000, waits: 0 });
const two = (a: string, b: string) => [
  { n: 1, label: a },
  { n: 2, label: b },
];
const CARDS = [
  { id: 9, project: P, kind: 'question', rank: 1, agent: 'perf', question: 'which bench?', options: two('cold', 'warm'), urgent: false, since_ms: NOW - 12 * 60_000 },
  { id: 11, project: P, kind: 'question', rank: 1, agent: 'search', question: 'which size system should the filter use?', options: two('EU', 'US'), urgent: false, since_ms: NOW - 9 * 3_600_000 },
];
const RECORDS = [
  { card: 7, project: P, asker: 'perf', kind: 'question', question: 'keep the webp next to the avif?', options: ['keep both', 'avif only'], state: 'answered', said: 'only for Safari 16', where: { kind: 'inbox' }, asked_ms: today(13, 58) - 240_000, at_ms: today(13, 58), thread: { agent: 'perf', pos: 2 }, line2: 'you: only for Safari 16 · in the inbox' },
  { card: 5, project: P, asker: 'main', kind: 'question', question: 'merge #381 now or after the bench?', options: ['now', 'after the bench'], state: 'answered', said: 'after the bench', pick_n: 2, where: { kind: 'thread', agent: 'perf' }, asked_ms: today(11, 30), at_ms: today(11, 40), thread: { agent: 'perf', pos: 1 }, line2: "you: after the bench · in perf's thread" },
  { card: 3, project: P, asker: 'checkout', kind: 'question', question: 'retry the failed payment test?', options: [], state: 'withdrawn', reason: 'checkout answered itself', asked_ms: yesterday(18, 0), at_ms: yesterday(18, 30), line2: 'withdrawn: checkout answered itself' },
];
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 4, working: 0, waits: CARDS.length, running: true, cards: CARDS },
    ],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: HOME, agents: [ag('main')] },
  { ev: 'agents', project: P, agents: [ag('main'), ag('perf'), ag('search'), ag('checkout')] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
  {
    ev: 'thread', project: P, agent: 'perf', before: null, more: false,
    entries: [
      { pos: 1, at_ms: today(11, 40), kind: 'approval', text: 'you answered perf: after the bench', approval: { ok: true, text: 'you answered perf: after the bench', card: 5 } },
      { pos: 2, at_ms: today(13, 58), kind: 'approval', text: 'you answered perf: only for Safari 16', approval: { ok: true, text: 'you answered perf: only for Safari 16', card: 7 } },
      { pos: 3, at_ms: today(14, 0), kind: 'agent', text: 'kept a webp fallback for Safari 16' },
    ],
  },
  { ev: 'inbox_history', project: P, items: RECORDS, more: false, answered: 2, withdrawn: 1 },
  { ev: 'inbox_history', project: HOME, items: [], more: false, answered: 0, withdrawn: 0 },
];

async function shoot(page: Page, core: FakeCore, name: string): Promise<void> {
  await page.mouse.move(1, 300);
  await page.waitForTimeout(250);
  await page.screenshot({ path: test.info().outputPath(`${name}-light.png`) });
  await core.send(prefs('dark') as never);
  await page.waitForTimeout(400);
  await page.screenshot({ path: test.info().outputPath(`${name}-dark.png`) });
  await core.send(prefs('light') as never);
  await page.waitForTimeout(300);
}

const rows = (page: Page) => page.getByTestId('inbox.list').locator('[role=option]');

test('inbox/inbox-screen: the sidebar row, waiting first then the past by day, ⏎ answers above the composer or goes to his answer, the detail, 1400/1100/800', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'bise', size: '1400x820' });
  try {
    const { page } = s;
    await test.step("the sidebar's '? inbox' row has the pink count; bise's row none", async () => {
      const row = page.getByTestId('app.sidebar.inbox');
      await expect(row).toBeVisible({ timeout: 10_000 });
      await expect(row).toContainText('inbox');
      // one number (designer m_25690): the screen's 3, bise's notifications ask included
      await expect(row.locator('.app-cnt')).toHaveText('3');
      await expect(page.getByTestId('app.sidebar.bise').locator('.app-cnt')).toHaveCount(0);
      await row.click();
      await expect(page.getByTestId('inbox.screen')).toBeVisible();
      await core.waitCmd((c) => (c as { cmd?: string; project?: string }).cmd === 'inbox_history' && (c as { project?: string }).project === P, 3000);
    });

    await test.step('waiting first, then the past by day, two lines each', async () => {
      // a fresh test home: bise's notifications ask waits too, in the list and the count as in the block (one number)
      await expect(page.getByTestId('inbox.counts')).toHaveText('3 waiting · 2 answered');
      await expect(page.getByTestId('inbox.waiting.head')).toHaveText('waiting for you · 3');
      await expect(rows(page)).toHaveCount(6);
      await expect(page.getByTestId(`inbox.row.p:${P}/7.said`)).toHaveText('you: only for Safari 16 · in the inbox');
      await expect(page.getByTestId(`inbox.row.p:${P}/5.said`)).toHaveText("you: after the bench · in perf's thread");
      await expect(page.getByTestId(`inbox.row.p:${P}/3`)).toHaveClass(/gone/);
      await expect(page.getByTestId(`inbox.row.p:${P}/3.said`)).toHaveText('withdrawn: checkout answered itself');
      const h = await page.getByTestId(`inbox.row.w:${P}/9`).evaluate((e) => e.getBoundingClientRect().height);
      expect(h, 'a waiting row is one 32 px line').toBe(32);
      expect(await textProblems(page, '[data-testid="inbox.screen"]', 11)).toEqual([]);
      // the list is the inbox here: no folded block above the composer at rest (designer m_25639)
      await expect(page.getByTestId('inbox.block')).toHaveCount(0);
      // the key line says what ⏎ does on the selected row
      await expect(page.getByTestId('inbox.keys.enter')).toHaveText('⏎ answer');
    });

    for (const [w, name] of [[1400, '1400'], [1100, '1100'], [800, '800']] as const) {
      await test.step(`at ${name}`, async () => {
        await page.setViewportSize({ width: w, height: 820 });
        await page.waitForTimeout(250);
        if (w === 800) {
          await expect(page.getByTestId('inbox.agents')).toBeHidden();
          await expect(page.getByTestId('inbox.state.withdrawn')).toBeHidden();
          await expect(page.getByTestId(`inbox.row.p:${P}/7`).locator('.ip-where')).toBeHidden();
          await expect(page.getByTestId(`inbox.row.p:${P}/7`).locator('.ip-proj')).toBeHidden();
        } else {
          await expect(page.getByTestId('inbox.agents')).toBeVisible();
          await expect(page.getByTestId(`inbox.row.p:${P}/7`).locator('.ip-where')).toBeVisible();
        }
        expect(await textProblems(page, '[data-testid="inbox.screen"]', 11)).toEqual([]);
        await shoot(page, core, `list-${name}`);
      });
    }
    await page.setViewportSize({ width: 1400, height: 820 });

    await test.step('space opens the read-only detail; esc back', async () => {
      await page.getByTestId('inbox.screen').focus();
      await page.keyboard.press('Home');
      for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
      await expect(page.getByTestId('inbox.keys.enter')).toHaveText('⏎ go to it');
      await page.keyboard.press(' ');
      await expect(page.getByTestId('inbox.detail.question')).toHaveText('keep the webp next to the avif?');
      await expect(page.getByTestId('inbox.keys')).toContainText('o open in its thread');
      await expect(page.getByTestId('inbox.detail')).toContainText('perf went on: kept a webp fallback for Safari 16');
      await shoot(page, core, 'detail-1400');
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('inbox.list')).toBeVisible();
    });

    await test.step('⏎ on a waiting item opens it above the composer, as ⌘I', async () => {
      const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName ?? '');
      expect(focused, 'back from the detail, the list keeps the keys').toBe('inbox.screen');
      // perf's 'which bench?' (rank 1, newer) sits under search's; ↓ then ⏎ opens it above the composer
      await page.keyboard.press('Home');
      await expect(page.locator('.ip-row.on')).toHaveAttribute('data-row', `w:${P}/11`);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await expect(page.getByTestId(`inbox.block.card.${P}-9`)).toBeVisible({ timeout: 3000 });
      await expect(page.getByTestId('composer').first()).toContainText('answering perf');
      await shoot(page, core, 'answer-1400');
      await page.keyboard.press('Escape');
    });

    await test.step("⏎ on a past one goes to his answer in perf's thread; ⌘[ back to the inbox", async () => {
      await page.getByTestId(`inbox.row.p:${P}/7`).click();
      await expect(page.getByTestId('inbox.screen')).toHaveCount(0);
      await expect(page.getByText('only for Safari 16').first()).toBeVisible({ timeout: 5000 });
      // his answer flashed once (answered-link's openAnswer, the one jump)
      await expect(page.locator('.th-flash')).toHaveCount(1, { timeout: 3000 });
      await expect(page.locator('.th-flash')).toContainText('only for Safari 16');
      await page.waitForTimeout(150);
      await page.screenshot({ path: test.info().outputPath('jump-light.png') });
      await page.keyboard.press('Meta+BracketLeft');
      await expect(page.getByTestId('inbox.screen')).toBeVisible({ timeout: 3000 });
    });
  } finally {
    await s.close();
  }
});
