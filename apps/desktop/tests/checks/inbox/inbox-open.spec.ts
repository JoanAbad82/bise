// inbox/inbox-open · his ask (main m_26588): on the inbox screen, a past item's first action opens it
// whole in the pane beside the list; the second (⌘⏎, the pane's button) goes to the thread entry of
// his answer, however far back. On the real shell with the scripted core (FakeCore, fake data; the
// world's `transcript` line makes the stub page search's 300-entry thread as the hub does). Passes when:
//   - ⏎ on a past row opens the pane beside the list (both visible at 1400): the question whole,
//     every option with the one he picked marked ✓ (aria-current), no bubble; his own words as his
//     bubble on another; 'you answered in the inbox · <time>'; the page he answered on as a chip;
//     the button 'go to your answer in search's thread ⌘⏎'; ↑↓ moves the list and the pane follows;
//   - at 800 the pane takes the list's place, '‹ inbox' brings the list back;
//   - ⌘⏎ goes to search's thread at his answer, pos 50 of 1000 (the tail is 961-1000: 23 pages back):
//     ONE page asked around it (thread/page before 75, never a walk of older pages), his entry shown
//     and flashed once, no 'your answer is further up';
//   - the gap row ('newer messages…') sits between that part and the latest; drawn as he scrolls
//     down, it asks the next newer page (before 224: 150 lines past the window); the thread's own ↓
//     shows the newest entry.
// Shots (for designer): the pane at 1400 and 800, the jump with its gap row, each light + dark.
// Owner: inbox-open.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect, textProblems } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const DAY = 86_400_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 3_600_000, waits: 0 });
// search's thread: 1000 entries over three weeks; his answer to card 21 at pos 50
const ANSWER = 50;
const LEN = 1000;
const ENTRIES = Array.from({ length: LEN }, (_, i) => {
  const pos = i + 1;
  const at_ms = NOW - 21 * DAY + i * (20 * DAY / LEN);
  if (pos === ANSWER) return { pos, at_ms, kind: 'approval', text: 'you answered search: EU sizes, with a US hint', approval: { ok: true, text: 'you answered search: EU sizes, with a US hint', card: 21 } };
  return { pos, at_ms, kind: 'agent', text: `search note ${String(pos)}: checked the size filter on page ${String(pos)}` };
});
const asked = (d: number) => NOW - d * DAY;
const RECORDS = [
  { card: 21, project: P, asker: 'search', kind: 'question', question: 'which size system should the filter use?', options: ['EU', 'US', 'both, by locale'], state: 'answered', said: 'EU', pick_n: 1, where: { kind: 'inbox' }, asked_ms: (ENTRIES[ANSWER - 1]?.at_ms ?? asked(18)) - 600_000, at_ms: ENTRIES[ANSWER - 1]?.at_ms ?? asked(18), thread: { agent: 'search', pos: ANSWER }, line2: 'you: EU · in the inbox' },
  { card: 22, project: P, asker: 'search', kind: 'question', question: 'keep the old size chart as a fallback?', options: [], state: 'answered', said: 'only for the kids range', where: { kind: 'inbox' }, asked_ms: asked(17) - 300_000, at_ms: asked(17), thread: { agent: 'search', pos: 60 }, line2: 'you: only for the kids range · in the inbox' },
  { card: 23, project: P, asker: 'designer', kind: 'question', question: 'the size chips: which look?', options: ['A', 'B'], state: 'answered', said: 'B', pick_n: 2, where: { kind: 'page', page: 'size-chips', block: 'q1' }, asked_ms: asked(16) - 300_000, at_ms: asked(16), line2: 'you: B · on a page' },
];
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 3, working: 0, waits: 0, running: true, cards: [] },
    ],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: HOME, agents: [ag('main')] },
  { ev: 'agents', project: P, agents: [ag('main'), ag('search'), ag('designer')] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
  { ev: 'transcript', project: P, agent: 'search', entries: ENTRIES },
  { ev: 'inbox_history', project: P, items: RECORDS, more: false, answered: 3, withdrawn: 0 },
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

type Cmd = { cmd?: string; project?: string; agent?: string; before?: number; limit?: number };

test('inbox/inbox-open: ⏎ opens the item whole in the pane, ⌘⏎ lands on his answer 23 pages back, the gap row', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'inbox/all', size: '1400x820' });
  try {
    const { page } = s;
    await test.step('⏎ on a past row opens the pane beside the list', async () => {
      await expect(page.getByTestId('inbox.screen')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId(`inbox.row.p:${P}/21`)).toBeVisible({ timeout: 5000 });
      await page.getByTestId('inbox.screen').focus();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('.ip-row.on')).toHaveAttribute('data-row', `p:${P}/21`);
      await expect(page.getByTestId('inbox.keys.enter')).toHaveText('⏎ open');
      await expect(page.getByTestId('inbox.keys.go')).toHaveText('⌘⏎ go to your answer');
      await page.keyboard.press('Enter');
      const pane = page.getByTestId('inbox.detail');
      await expect(pane).toBeVisible();
      await expect(page.getByTestId('inbox.list')).toBeVisible();
      await expect(page.getByTestId('inbox.screen')).toBeVisible();
      await expect(page.getByTestId('inbox.detail.question')).toHaveText('which size system should the filter use?');
      await expect(page.getByTestId('inbox.detail.option.1')).toHaveAttribute('aria-current', 'true');
      await expect(page.getByTestId('inbox.detail.option.1')).toHaveText('✓EU');
      await expect(page.getByTestId('inbox.detail.option.3')).toHaveText('3both, by locale');
      await expect(page.getByTestId('inbox.detail.said')).toHaveCount(0);
      await expect(page.getByTestId('inbox.detail.where')).toContainText('you answered in the inbox · ');
      await expect(page.getByTestId('inbox.detail.go')).toHaveText("go to your answer in search's thread⌘⏎");
      // side by side
      const list = await page.getByTestId('inbox.list').boundingBox();
      const box = await pane.boundingBox();
      expect(list && box && box.x >= list.x + list.width - 1, 'the pane sits right of the list').toBe(true);
      expect(await textProblems(page, '[data-testid="inbox.screen"]', 11)).toEqual([]);
      await shoot(page, core, 'pane-1400');
      // ↑ the pane follows: his own words, his bubble
      await page.keyboard.press('ArrowUp');
      await expect(page.getByTestId('inbox.detail.question')).toHaveText('keep the old size chart as a fallback?');
      await expect(page.getByTestId('inbox.detail.said')).toHaveText('only for the kids range');
      // ↑ a page answer: the page as a chip
      await page.keyboard.press('ArrowUp');
      await expect(page.getByTestId('inbox.detail.option.2')).toHaveText('✓B');
      await expect(page.getByTestId('inbox.detail.page')).toHaveText('↗ size-chips · page');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await expect(page.getByTestId('inbox.detail.question')).toHaveText('which size system should the filter use?');
    });

    await test.step('at 800 the pane takes the list’s place; ‹ inbox brings it back', async () => {
      await page.setViewportSize({ width: 800, height: 820 });
      await page.waitForTimeout(250);
      await expect(page.getByTestId('inbox.list')).toBeHidden();
      await expect(page.getByTestId('inbox.detail.back')).toBeVisible();
      expect(await textProblems(page, '[data-testid="inbox.screen"]', 11)).toEqual([]);
      await shoot(page, core, 'pane-800');
      await page.getByTestId('inbox.detail.back').click();
      await expect(page.getByTestId('inbox.list')).toBeVisible();
      await expect(page.getByTestId('inbox.detail')).toHaveCount(0);
      await page.setViewportSize({ width: 1400, height: 820 });
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('inbox.detail')).toBeVisible();
    });

    await test.step('⌘⏎ lands on his answer, 5 pages back: one page around it, flashed once', async () => {
      await page.keyboard.press('Meta+Enter');
      await expect(page.getByTestId('inbox.screen')).toHaveCount(0);
      const around = (await core.waitCmd((c) => (c as Cmd).cmd === 'page' && (c as Cmd).agent === 'search', 5000)) as Cmd;
      expect(around.before, 'the page around pos 50').toBe(ANSWER + 25);
      const entry = page.getByTestId(`thread.entry.${String(ANSWER)}`);
      await expect(entry).toBeVisible({ timeout: 5000 });
      await expect(entry).toContainText('EU sizes, with a US hint');
      await expect(page.locator('.th-flash')).toHaveCount(1, { timeout: 3000 });
      await expect(page.locator('.th-flash')).toContainText('EU sizes, with a US hint');
      await expect(page.getByText('your answer is further up')).toHaveCount(0);
      // never a walk of older pages from the tail (its first page ends at 961)
      const pages = core.cmds().filter((c) => (c as Cmd).cmd === 'page' && (c as Cmd).agent === 'search') as Cmd[];
      expect(pages.map((c) => c.before).filter((b) => b === LEN - 39), 'no page asked from the tail down').toEqual([]);
      expect(pages[0]?.before).toBe(ANSWER + 25);
      await page.waitForTimeout(200);
      await shoot(page, core, 'jump');
    });

    await test.step('the gap row loads newer as he scrolls to it; the thread’s ↓ goes to the latest', async () => {
      // the list is virtual: scrolled down from his answer, the gap row is drawn under the window (its
      // last row, 73) and asks the next newer page, 150 lines past it (before 224)
      const newer = () => core.cmds().some((c) => (c as Cmd).cmd === 'page' && (c as Cmd).agent === 'search' && (c as Cmd).before === ANSWER + 25 + 149);
      let seen = false;
      for (let i = 0; i < 80 && !newer(); i++) {
        await page.evaluate(() => document.querySelector('[data-testid="thread.list"] [data-virtuoso-scroller]')?.scrollBy(0, 200));
        await page.waitForTimeout(60);
        if (!seen && (await page.getByTestId('thread.gap').isVisible())) {
          seen = true;
          await expect(page.getByTestId('thread.gap')).toHaveText('newer messages…');
          await page.screenshot({ path: test.info().outputPath('gap-light.png') });
        }
      }
      expect(newer(), 'the gap row asked the next newer page (before 224)').toBe(true);
      await page.getByTestId('thread.to-end').click();
      await expect(page.getByTestId(`thread.entry.${String(LEN)}`)).toBeVisible({ timeout: 3000 });
    });
  } finally {
    await s.close();
  }
});
