// app/hub-moments · main's newer hub events the window acts on (amb-feed m_16785, ambient-lead
// m_16770). Passes when, on the scripted core (FakeCore, fake data):
//   - focused: the hub moved this connection's focus back to main (perf archived): the open thread
//     of perf follows to storefront's bise; while perf is live (a focused said again by a replayed
//     world), and on another project, nothing moves;
//   - card_open: the hub asks to open card 7 (its /update found a release): the inbox block opens
//     it in place, on the screen he is on;
//   - update: bise's /update builds: 'updating bise · 1152b33 · 2 min' at the top of the window;
//     failed: the hub's words with the build's last lines under them; built: the line goes.
// Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'storefront-1a2b3c4d';
const MIN = 60_000;
const agent = (name: string, now: number) => ({ name, dir: name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: now - 30 * MIN, waits: 0 });
const card = (now: number) => ({ id: 7, project: P, kind: 'question', rank: 1, agent: 'main', question: 'bise 2026.10.3 is out: switch to it now?', options: [{ n: 1, label: 'switch' }, { n: 2, label: 'later' }], urgent: false, since_ms: now - MIN });
const world = (now: number) => [
  {
    ev: 'prefs',
    prefs: {
      onboarded: true,
      theme: 'light',
      context: { shot: true, url: true, file: true, window_text: false },
      excluded_apps: [],
      quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
      voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
      shots_keep_days: 7,
    },
  },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 2, working: 0, waits: 1, running: true, cards: [card(now)] },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main', now), agent('perf', now)] },
  { ev: 'cards', project: P, cards: [card(now)] },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: now - 2 * MIN, kind: 'agent', text: 'the bench is done.' }], before: null, more: false },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: now - 3 * MIN, kind: 'agent', text: 'perf is on the bench.' }], before: null, more: false },
];

test('app/hub-moments: focused moves the open thread, card_open opens the card in place, the /update line', async () => {
  test.setTimeout(90_000);
  const now = Date.now();
  const core = new FakeCore(world(now) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  try {
    const { page } = s;
    await expect(page.getByTestId('thread.head')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'perf');

    // a focused while perf is live (a world said again) moves nothing
    await core.send({ ev: 'focused', project: P, focus: 'main' } as never);
    await page.waitForTimeout(400);
    await expect(page.getByTestId('thread.screen'), 'perf is live: it stays').toHaveAttribute('data-agent', 'perf');
    // focused: perf is archived, the hub put this connection back on main
    await core.send({ ev: 'agents', project: P, agents: [agent('main', now), { ...agent('perf', now), archived: true }] } as never);
    await core.send({ ev: 'focused', project: P, focus: 'main' } as never);
    await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'main');
    await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-project', P);

    // card_open: card 7 opens in the inbox block, in place
    await core.send({ ev: 'card_open', project: P, id: 7 } as never);
    await expect(page.getByTestId(`inbox.block.card.${P}-7`)).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('thread.screen'), 'still on the same screen').toHaveAttribute('data-agent', 'main');

    // update: building, failed, built
    const line = page.getByTestId('app.hubupdate');
    await core.send({ ev: 'update', project: HOME, state: 'building', rev: '1152b33', elapsed: 130 } as never);
    await expect(line).toHaveText('updating bise · 1152b33 · 2 min');
    await page.screenshot({ path: test.info().outputPath('update-building.png') });
    await core.send({ ev: 'update', project: HOME, state: 'failed', rev: '1152b33', text: "couldn't build 1152b33, you're still on 9f0e2aa", tail: ['error[E0425]: cannot find value `x`', 'error: could not compile `bise`'] } as never);
    await expect(line).toContainText("▲ couldn't build 1152b33, you're still on 9f0e2aa");
    await expect(page.getByTestId('app.hubupdate.tail')).toContainText('error: could not compile `bise`');
    await page.screenshot({ path: test.info().outputPath('update-failed.png') });
    await core.send({ ev: 'update', project: HOME, state: 'built', rev: '1152b33' } as never);
    await expect(line).toHaveCount(0);

    // another project's focused: nothing moves
    await core.send({ ev: 'focused', project: 'shop-00000000', focus: 'main' } as never);
    await page.waitForTimeout(400);
    await expect(page.getByTestId('thread.screen'), "another project's focus moves nothing here").toHaveAttribute('data-agent', 'main');
  } finally {
    await s.close();
    core.dispose();
  }
});
