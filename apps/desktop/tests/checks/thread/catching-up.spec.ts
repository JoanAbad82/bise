// thread/catching-up · thread-loading (Gabriel: « je vois mon message et rien après […] j'ai aucune
// indication que c'est en train de loader »). Owner: thread-loading.
// On the scripted core (fixture world), real keys and clicks only. He opens perf's thread, his
// message is its last row; he leaves (the window no longer follows it), comes back with ⌘[ while
// the hub is slow to answer (the stub holds subscribe's page). Passes when:
//   - the cue (thread.sync) shows under his message within 1 s, and his message's box is the same
//     before and while it shows (it is out of the layout);
//   - nothing newer (the held page comes, with nothing after his message): the cue goes and his
//     message's box is still the same: the thread looks as before the cue;
//   - something newer (the agent's answer comes in the page): the cue goes, the answer's row is
//     under his message.
// Shots: thread-catching-up-*.png in the test's output (light), for designer.
import type { Locator, Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const ACME = 'acme-1a2b3c4d';
const MINE = 100;
const you = { pos: MINE, at_ms: 1791100100000, kind: 'you', text: 'where are we on the cache?', delivery: 'read', msg_id: 900 } as const;
const answer = { pos: MINE + 1, at_ms: 1791100101000, kind: 'agent', text: 'the cache is in: 41 ms a page now.' } as const;

type Box = { x: number; y: number; width: number; height: number };
const boxOf = async (l: Locator): Promise<Box> => {
  const b = await l.boundingBox();
  if (b === null) throw new Error('no box');
  return { x: Math.round(b.x), y: Math.round(b.y), width: Math.round(b.width), height: Math.round(b.height) };
};
const cueOpacity = (page: Page): Promise<number> => page.getByTestId('thread.sync').evaluate((el) => Number(getComputedStyle(el).opacity));

/** Leaves perf's thread (the project's main), the hub holds subscribe's page, back with ⌘[. */
async function leaveAndComeBack(page: Page, core: FakeCore): Promise<void> {
  await page.getByTestId(`app.side.agent.${ACME}.main`).click();
  await expect(page.getByTestId(`thread.you.${String(MINE)}`)).toHaveCount(0);
  await core.hold('subscribe');
  await page.keyboard.press('Meta+BracketLeft');
  await expect(page.getByTestId(`thread.you.${String(MINE)}`), 'his message, held from before, shows at once').toBeVisible();
}

test('thread/catching-up: a cue under his message while the newest page comes, nothing moves', async () => {
  test.setTimeout(90_000);
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${ACME}/perf` });
  try {
    const { page } = s;
    const mine = page.getByTestId(`thread.you.${String(MINE)}`);
    await expect(page.getByTestId('thread.list')).toBeVisible({ timeout: 15_000 });
    await core.send({ ev: 'entry', project: ACME, agent: 'perf', entry: you } as never);
    await expect(mine).toBeVisible();
    expect(await cueOpacity(page), 'no cue once the thread is current').toBe(0);

    // nothing newer: the cue comes and goes, his message never moves
    await leaveAndComeBack(page, core);
    const before = await boxOf(mine);
    await expect.poll(() => cueOpacity(page), { timeout: 2000, message: 'the cue shows while the page is on its way' }).toBe(1);
    expect(await boxOf(mine), 'his message stays put while the cue shows').toEqual(before);
    const cue = await boxOf(page.getByTestId('thread.sync'));
    expect(cue.y, 'the cue is under his message').toBeGreaterThanOrEqual(before.y + before.height - 1);
    await page.screenshot({ path: test.info().outputPath('thread-catching-up-cue.png') });
    await core.release();
    await expect.poll(() => cueOpacity(page), { timeout: 2000, message: 'the cue goes with the page' }).toBe(0);
    expect(await boxOf(mine), 'nothing after his message: the thread is as before the cue').toEqual(before);
    await page.screenshot({ path: test.info().outputPath('thread-catching-up-empty.png') });

    // something newer: the agent's answer lands under his message, the cue goes
    await leaveAndComeBack(page, core);
    const again = await boxOf(mine);
    await expect.poll(() => cueOpacity(page), { timeout: 2000 }).toBe(1);
    expect(await boxOf(mine), 'his message stays put while the cue shows').toEqual(again);
    await core.send({ ev: 'thread', project: ACME, agent: 'perf', entries: [you, answer], before: null, more: false } as never);
    await core.release();
    await expect(page.getByText(answer.text), "the agent's answer shows").toBeVisible();
    await expect.poll(() => cueOpacity(page), { timeout: 2000 }).toBe(0);
    const mineAfter = await boxOf(mine);
    const row = await boxOf(page.getByText(answer.text));
    expect(row.y, 'the answer is under his message').toBeGreaterThanOrEqual(mineAfter.y + mineAfter.height - 1);
    await page.screenshot({ path: test.info().outputPath('thread-catching-up-newer.png') });

    // dark (his prefs from the core): the cue's shot for designer
    await core.send({ ev: 'prefs', prefs: { theme: 'dark' } } as never);
    await leaveAndComeBack(page, core);
    await expect.poll(() => cueOpacity(page), { timeout: 2000 }).toBe(1);
    await page.waitForTimeout(400);
    await page.screenshot({ path: test.info().outputPath('thread-catching-up-cue-dark.png') });
    await core.release();
    await expect.poll(() => cueOpacity(page), { timeout: 2000 }).toBe(0);
  } finally {
    await s.close();
    core.dispose();
  }
});
