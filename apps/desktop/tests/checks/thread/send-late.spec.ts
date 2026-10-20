// thread/send-late · his sends while the hub is slow (queue-drawer-fix, his « Le message n'apparait
// pas dans le tiroir entre le composer et la destination » and « des messages fantomes qui restent
// la en sending pour toujours », on 400fbd1eb with a hub stalled 90 s). On the REAL thread screen
// (FakeCore, fake data):
//   - a tab-queued send the hub has not listed in its queue yet is in the drawer at once, with his
//     words (its buttons wait for the hub's id); once the hub lists it, still one row;
//   - a send the core gave up on (no answer from its hub in 30 s: its LATE words) never stays
//     'sending…': it says why, with try again; the hub's late echo (his entry, minutes later) takes
//     the row away and his bubble lands, never a ghost and never twice; the same for a queued send.
// Shots light + dark at 1100 for designer. Owner: queue-drawer-fix.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { thread } from '../../../src/proto/words.gen';

const HOME = 'bise-home-00000000';
const P = 'shop-ab9f3c3b';
const MIN = 60_000;
/** the core's words when its hub didn't answer a request in 30 s (rust/tui ambient/core/hub_rpc.rs LATE) */
const LATE = "its hub didn't answer. try again in a moment.";
const prefs = (theme: 'light' | 'dark') => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
type Q = { id: number; text: string; created_ms: number };
const ag = (name: string, now: number, over: Record<string, unknown> = {}) => ({ name, dir: name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: now - 9 * MIN, waits: 0, ...over });
const agents = (now: number, queued: readonly Q[]) => ({ ev: 'agents', project: P, agents: [ag('main', now, { status: 'working', since_ms: now - 2 * MIN, queued }), ag('perf', now)] });
const world = (now: number) => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 2, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'shop' },
  agents(now, []),
  {
    ev: 'thread',
    project: P,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: now - 5 * MIN, kind: 'you', text: 'fix the order of the lands in the queue' },
      { pos: 2, at_ms: now - 4 * MIN, kind: 'agent', text: 'on it: reading land_queue.rs first.' },
    ],
    before: null,
    more: false,
  },
];
type Cmd = { cmd?: string; mode?: string; text?: string; cid?: number };
const is = (f: (c: Cmd) => boolean) => (x: unknown): boolean => f(x as Cmd);

test('thread/send-late: a queued send is in the drawer before the hub lists it, one row once it does', async () => {
  test.setTimeout(180_000);
  const now = Date.now();
  const core = new FakeCore(world(now) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x760' });
  try {
    const { page } = s;
    const drawer = page.getByTestId('composer.queue');
    const rows = page.locator('[data-testid="composer.queue.rows"] > [role="listitem"]');
    const field = page.locator('[data-testid="composer.field"]').first();
    const list = page.getByTestId('thread.list');
    const pending = page.locator('[data-testid^="thread.pending."]');
    const shot = async (name: string) => {
      await page.mouse.move(1, 1);
      await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
      });
      await page.screenshot({ path: test.info().outputPath(`${name}.png`) });
    };
    const type = async (words: string, key: 'Tab' | 'Enter') => {
      await field.click();
      await page.keyboard.type(words);
      await page.keyboard.press(key);
      return (await core.waitCmd(is((c) => c.cmd === 'send' && c.text === words), 3000)) as Cmd;
    };
    await expect(list).toContainText('on it: reading land_queue.rs first.');

    await test.step('tab queues: his words are in the drawer before the hub lists them, one row once it does', async () => {
      const words = 'and the changelog';
      // the hub stalls: the core gives up waiting (late, 30 s), the hub answers a minute later
      await core.refuse('send', undefined, LATE, 'late');
      const sent = await type(words, 'Tab');
      expect(sent).toMatchObject({ mode: 'queued' });
      await expect(drawer, 'the drawer opens on his queued send').toBeVisible();
      await expect(rows).toHaveCount(1);
      await expect(page.getByTestId('composer.queue.1.text')).toHaveText(words);
      await expect(page.getByTestId('composer.queue.1'), 'on its way: no hub id to act on yet').toHaveAttribute('data-state', 'sending');
      await expect(pending, 'never a bubble in the thread while it waits').toHaveCount(0);
      for (const t of ['light', 'dark'] as const) {
        await core.send(prefs(t) as never);
        await shot(`in-flight-${t}-1100`);
      }
      await core.send(prefs('light') as never);
      await core.send(agents(now, [{ id: 41, text: words, created_ms: Date.now() }]) as never, { ev: 'send_answered', project: P, agent: 'main', cid: sent.cid, result: { msg_id: 41, reason: 'made' } } as never);
      await expect(page.getByTestId('composer.queue.1')).not.toHaveAttribute('data-state', 'sending');
      await expect(rows, 'the hub lists it: still one row').toHaveCount(1);
      // the turn ends: his entry, the queue empty
      await core.send(
        { ev: 'entry', project: P, agent: 'main', entry: { pos: 3, at_ms: Date.now(), kind: 'agent', text: 'done: the lands keep their order.' } } as never,
        { ev: 'entry', project: P, agent: 'main', entry: { pos: 4, at_ms: Date.now(), kind: 'you', text: words, msg_id: 41, delivery: 'sent' } } as never,
        agents(now, []) as never,
      );
      await expect(page.getByTestId('thread.you.4')).toContainText(words);
      await expect(drawer).toHaveCount(0);
    });

  } finally {
    await s.close();
    core.dispose();
  }
});

test('thread/send-late: a send the core gave up on stays sending…, its late answer and echo clear it once; a reload leaves no ghost', async () => {
  test.setTimeout(180_000);
  const now = Date.now();
  const core = new FakeCore(world(now) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x760' });
  try {
    const { page } = s;
    const rows = page.locator('[data-testid="composer.queue.rows"] > [role="listitem"]');
    const field = page.locator('[data-testid="composer.field"]').first();
    const list = page.getByTestId('thread.list');
    const pending = page.locator('[data-testid^="thread.pending."]');
    const type = async (words: string, key: 'Tab' | 'Enter') => {
      await field.click();
      await page.keyboard.type(words);
      await page.keyboard.press(key);
      return (await core.waitCmd(is((c) => c.cmd === 'send' && c.text === words), 3000)) as Cmd;
    };
    // the core's late answer at last: the hub made his message `msg_id` a minute after he sent it
    const answered = (cid: number | undefined, msg_id: number) => ({ ev: 'send_answered', project: P, agent: 'main', cid, result: { msg_id, reason: 'made' } });
    await expect(list).toContainText('on it: reading land_queue.rs first.');

    await test.step('the core gave up waiting (late): still sending…, no try again; the late answer and its echo clear it once', async () => {
      const words = 'is the hub stuck?';
      await core.refuse('send', undefined, LATE, 'late');
      const sent = await type(words, 'Enter');
      expect(sent).toMatchObject({ mode: 'now' });
      await expect(pending).toHaveCount(1);
      await page.waitForTimeout(500);
      await expect(pending.first(), 'not answered yet, never not sent').not.toHaveAttribute('data-state', 'failed');
      await expect(pending.first()).toContainText(thread.sending);
      await expect(page.locator('[data-testid^="thread.retry."]'), 'no try again: it may be on its way').toHaveCount(0);
      await page.mouse.move(1, 1);
      await page.screenshot({ path: test.info().outputPath('late-light-1100.png') });
      await core.send(answered(sent.cid, 52) as never, { ev: 'entry', project: P, agent: 'main', entry: { pos: 5, at_ms: Date.now() + MIN, kind: 'you', text: words, msg_id: 52, delivery: 'sent' } } as never);
      await expect(page.getByTestId('thread.you.5')).toContainText(words);
      await expect(pending, 'the late answer cleared it').toHaveCount(0);
      await expect(list.getByText(words, { exact: true }), 'his bubble once').toHaveCount(1);
    });

    await test.step('a queued one the core gave up on: in the drawer while late, then his bubble once', async () => {
      const words = 'then open a PR';
      await core.refuse('send', undefined, LATE, 'late');
      const sent = await type(words, 'Tab');
      expect(sent).toMatchObject({ mode: 'queued' });
      await expect(rows, 'still on its way: the drawer has it').toHaveCount(1);
      await expect(pending, 'never a bubble in the thread while it waits').toHaveCount(0);
      // its echo first, its late answer after: the same end
      await core.send({ ev: 'entry', project: P, agent: 'main', entry: { pos: 6, at_ms: Date.now() + 2 * MIN, kind: 'you', text: words, msg_id: 53, delivery: 'sent' } } as never, answered(sent.cid, 53) as never);
      await expect(page.getByTestId('thread.you.6')).toContainText(words);
      await expect(rows).toHaveCount(0);
      await expect(pending).toHaveCount(0);
    });

    await test.step('its connection went (gone): not sent with try again, never sending… forever', async () => {
      const words = 'one more';
      await core.refuse('send', undefined, LATE, 'late');
      const sent = await type(words, 'Enter');
      await core.send({ ev: 'send_answered', project: P, agent: 'main', cid: sent.cid } as never);
      await expect(pending.first()).toHaveAttribute('data-state', 'failed');
      await expect(page.locator('[data-testid^="thread.retry."]')).toHaveCount(1);
      await page.locator('[data-testid^="thread.dismiss."]').first().click();
      await expect(pending).toHaveCount(0);
    });

    await test.step("a reload while late: the hub's entry brings his words back, no ghost", async () => {
      const words = 'after the reload';
      await core.refuse('send', undefined, LATE, 'late');
      await type(words, 'Enter');
      await expect(pending).toHaveCount(1);
      await page.reload();
      await expect(list).toContainText('on it: reading land_queue.rs first.');
      await expect(pending, 'the window forgot its row: nothing stuck').toHaveCount(0);
      await core.send({ ev: 'entry', project: P, agent: 'main', entry: { pos: 7, at_ms: Date.now() + MIN, kind: 'you', text: words, msg_id: 54, delivery: 'sent' } } as never);
      await expect(page.getByTestId('thread.you.7')).toContainText(words);
      await expect(pending).toHaveCount(0);
    });
  } finally {
    await s.close();
    core.dispose();
  }
});

test('thread/send-late: his sending rows are the end of the scrollable thread, never a sticky band over it', async () => {
  test.setTimeout(180_000);
  const now = Date.now();
  // a thread that scrolls: 40 entries
  const long = world(now).map((ev) =>
    (ev as { ev: string }).ev === 'thread'
      ? { ...ev, entries: Array.from({ length: 40 }, (_, i) => ({ pos: i + 1, at_ms: now - (40 - i) * MIN, kind: i % 2 === 0 ? 'you' : 'agent', text: i % 2 === 0 ? `question ${String(i)}` : `a long answer ${String(i)}: ${'words that fill the line. '.repeat(6)}` })) }
      : ev,
  );
  const core = new FakeCore(long as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x760' });
  try {
    const { page } = s;
    const field = page.locator('[data-testid="composer.field"]').first();
    const list = page.getByTestId('thread.list');
    const scroller = list.locator('[data-virtuoso-scroller]');
    await expect(list).toContainText('a long answer 39');
    const words = 'is the hub stuck?';
    const before = await scroller.boundingBox();
    await core.refuse('send', undefined, LATE, 'late');
    await field.click();
    await page.keyboard.type(words);
    await page.keyboard.press('Enter');
    const row = page.locator('[data-testid^="thread.pending."]');
    await expect(row).toHaveCount(1);
    await expect(row, 'at the end of the list, in view').toBeInViewport();
    await expect(scroller.locator('[data-testid^="thread.pending."]'), 'inside the scrollable list').toHaveCount(1);
    // the list's scroll area is the same with or without it: nothing pinned under the list
    const after = await scroller.boundingBox();
    expect(before && after && Math.abs(before.height - after.height), 'the scroll area keeps its height').toBeLessThanOrEqual(1);
    await page.mouse.move(1, 1);
    await page.screenshot({ path: test.info().outputPath('sending-in-list-light-1100.png') });
    // scrolled up: it goes with the list, out of view
    await scroller.hover();
    await page.mouse.wheel(0, -2500);
    await expect(row, 'scrolls with the thread').not.toBeInViewport();
    await expect(page.getByTestId('thread.to-end')).toBeVisible();
    await page.getByTestId('thread.to-end').click();
    await expect(row).toBeInViewport();
  } finally {
    await s.close();
    core.dispose();
  }
});
