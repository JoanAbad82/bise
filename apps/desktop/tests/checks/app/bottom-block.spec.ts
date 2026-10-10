// app/bottom-block · b1 (his card #476, decision 2026-10-09, page inbox-native v2; ambient-lead
// m_14204): one inbox and one composer at the bottom of every view, like the terminal. On the REAL
// shell (FakeCore): on an agent's review, a project's agents, changes and artifacts, settings and
// scheduled, the bottom block (app.bottom) is there with its composer, under the screen, and
// writes to whom the route says: the review's agent, else the project's main, else bise's main
// (his words + ⏎ send {cmd:'send', project, agent}); the window never scrolls; on a thread (and
// bise's) there's no second block (the thread's own composer). Shots light and dark. Owner: amb-win.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 60_000, waits: 0 });
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: HOME, agents: [ag('main')] },
  { ev: 'agents', project: P, agents: [ag('main'), ag('perf')] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: NOW - 30_000, kind: 'agent', text: 'done.' }], before: null, more: false },
];

async function sendsTo(page: Page, core: FakeCore, words: string, project: string, agent: string): Promise<void> {
  const bottom = page.getByTestId('app.bottom');
  await expect(bottom).toHaveAttribute('data-project', project);
  await expect(bottom).toHaveAttribute('data-agent', agent);
  await bottom.getByTestId('composer.field').click();
  await page.keyboard.type(words);
  await page.keyboard.press('Enter');
  const sent = (await core.waitCmd((c) => c.cmd === 'send' && (c as { text?: string }).text === words, 5000)) as Record<string, unknown>;
  expect(sent['project']).toBe(project);
  expect(sent['agent']).toBe(agent);
}

const noScroll = (page: Page) =>
  page.evaluate(() => {
    const se = document.scrollingElement ?? document.documentElement;
    return se.scrollHeight <= se.clientHeight;
  });

// each screen in its own launch (the router follows no hash once started)
for (const [route, project, agent, words] of [
  [`agents/${P}`, P, 'main', 'list them by age'],
  [`review/${P}/perf`, P, 'perf', 'why this change'],
  [`changes/${P}`, P, 'main', 'merge it later'],
  ['settings', HOME, 'main', 'which model is best'],
  ['scheduled', HOME, 'main', 'stop the 2 am one'],
  ['artifacts', HOME, 'main', 'make a page of it'],
] as const) {
  test(`app/bottom-block: ${route} has the one inbox + composer block, writing to ${agent} of ${project === HOME ? 'bise' : 'acme'}`, async () => {
    const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route, size: '1100x720' });
    try {
      const { page } = s;
      await expect(page.getByTestId('app.bottom'), `${route} has the block`).toBeVisible({ timeout: 10_000 });
      // the scripted core never answers the diff: the review says what it waits for, never a bare bar
      if (route.startsWith('review/')) await expect(page.getByTestId('review.loading')).toHaveText("loading perf's changes…");
      await sendsTo(page, core, words, project, agent);
      expect(await noScroll(page), `${route}: the window never scrolls`).toBe(true);
      const name = route.replace(/\W+/g, '-');
      await page.mouse.move(1, 300);
      await page.screenshot({ path: test.info().outputPath(`${name}-light.png`) });
      await core.send(prefs('dark') as never);
      await page.waitForTimeout(300);
      await page.screenshot({ path: test.info().outputPath(`${name}-dark.png`) });
    } finally {
      await s.close();
      core.dispose();
    }
  });
}

test('app/bottom-block: a thread has its own composer, no second block', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1100x720' });
  try {
    const { page } = s;
    await expect(page.getByTestId('thread.screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('app.bottom')).toHaveCount(0);
    await expect(page.getByTestId('composer.field')).toHaveCount(1);
  } finally {
    await s.close();
    core.dispose();
  }
});
