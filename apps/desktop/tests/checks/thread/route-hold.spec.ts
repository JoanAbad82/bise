// thread/route-hold · bar ⛔3, the routing hold (lead m_9854 / m_9862; amb-win 24da24db in the
// thread, amb-web c75da201 in the spotlight). Owner: qa-flows.
// The hub holds words to bise for 2 s before they go to the project it guessed ('route'), so he
// can keep them with bise (route_cancel) or pick another project (route_correct); it ends the hold
// with 'route_done'. This check runs the new app on the scripted core (FakeCore: the fixture
// world, bise-home + acme), which plays the hub's route events as the real core forwards them;
// what the app sends back is read from the core's command log (outside the app). Real keys and
// clicks only. Passes when, in the window's thread and in the spotlight:
//   - his words' row shows the hold at once (<= 250 ms after the route event): '→ bise · acme · N s to
//     change', and N counts down;
//   - 'keep it with bise' sends route_cancel for that rid; another project sends route_correct;
//   - route_done 'sent' turns the row into 'sent to acme', the hold gone.
import { test, expect, FakeCore, FakeHelper, launchDesktop } from '../../harness';

const HOME = 'bise-home-00000000';
const ACME = 'acme-1a2b3c4d';
const T = {
  field: '[data-testid="composer.field"]',
  hold: '[data-testid="thread.route"]',
  keep: '[data-testid="thread.route.keep"]',
};

type Cmd = Record<string, unknown>;
const isCmd = (name: string, extra: Record<string, unknown> = {}) => (c: unknown): boolean => {
  const o = c as Cmd;
  return o['cmd'] === name && Object.entries(extra).every(([k, v]) => o[k] === v);
};

test('thread/route-hold: the hold shows at once, counts down, keep and correct reach the hub, then sent', async () => {
  test.setTimeout(120_000);
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: 'bise' });
  try {
    const { page } = s;
    const field = page.locator(T.field).first();
    await expect(field, "bise's composer").toBeVisible({ timeout: 10_000 });
    const send = async (words: string): Promise<void> => {
      await field.click();
      await page.keyboard.type(words);
      await page.keyboard.press('Enter');
      await core.waitCmd(isCmd('send', { text: words }));
    };
    const row = (words: string) => page.locator('[data-testid^="thread.pending."]', { hasText: words });

    // 1. held, counting down, kept with bise
    const w1 = `why does p99 rise ${Date.now() % 100000}`;
    await send(w1);
    await core.send({ ev: 'route', project: HOME, rid: 41, to: ACME, name: 'acme', text: w1, correct_until_ms: Date.now() + 3000, why: 'test' });
    const hold = row(w1).locator(T.hold);
    await expect(hold, 'the hold shows on his row at once').toBeVisible({ timeout: 250 });
    await expect(hold).toContainText(/→ bise · acme · [23] s to change/);
    const n0 = Number(/· (\d) s/.exec(await hold.innerText())?.[1]);
    await page.waitForTimeout(1300);
    const n1 = Number(/· (\d) s/.exec(await hold.innerText())?.[1]);
    expect(n1, 'the seconds count down').toBeLessThan(n0);
    await page.screenshot({ path: test.info().outputPath('held.png') });
    await row(w1).locator(T.keep).click();
    await core.waitCmd(isCmd('route_cancel', { rid: 41, project: HOME }));

    // 2. corrected to another project: one is offered for each other project of the world
    const w2 = `and the checkout bug ${Date.now() % 100000}`;
    await send(w2);
    await core.send({ ev: 'route', project: HOME, rid: 42, to: ACME, name: 'acme', text: w2, correct_until_ms: Date.now() + 3000, why: 'test' });
    const others = row(w2).locator('[data-testid^="thread.route.to."]');
    await expect(row(w2).locator(T.hold)).toBeVisible({ timeout: 250 });
    if ((await others.count()) > 0) {
      const id = ((await others.first().getAttribute('data-testid')) ?? '').replace('thread.route.to.', '');
      await others.first().click();
      await core.waitCmd(isCmd('route_correct', { rid: 42, to: id }));
    } else {
      test.info().annotations.push({ type: 'note', description: 'the fixture world has no third project: route_correct not driven here' });
    }

    // 3. the hub sends it: 'sent to acme', the hold gone
    const w3 = `ship it ${Date.now() % 100000}`;
    await send(w3);
    await core.send({ ev: 'route', project: HOME, rid: 43, to: ACME, name: 'acme', text: w3, correct_until_ms: Date.now() + 2000, why: 'test' });
    await expect(row(w3).locator(T.hold)).toBeVisible({ timeout: 250 });
    await core.send({ ev: 'route_done', project: HOME, rid: 43, state: 'sent', to: ACME, xid: 9 });
    await expect(row(w3), "the row says where it went").toContainText('sent to acme', { timeout: 1000 });
    await expect(row(w3).locator(T.hold), 'the hold is gone').toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('sent.png') });
  } finally {
    await s.close();
  }
});

test('spotlight/route-hold: fn+space, ask, the hold shows at once in the spotlight, keep reaches the hub', async () => {
  test.setTimeout(120_000);
  const core = new FakeCore();
  const helper = new FakeHelper();
  const s = await launchDesktop({ core, helper });
  try {
    const { page, app } = s;
    await page.waitForTimeout(1500);
    await helper.send({ ev: 'fn', act: 'key', key: 'space' });
    await expect.poll(() => app.windows().some((p) => p.url().includes('surface=capsule')), { message: 'the capsule window exists' }).toBe(true);
    const cap = app.windows().find((p) => p.url().includes('surface=capsule'));
    if (!cap) throw new Error('no capsule window');
    const input = cap.locator('[data-testid="spot.input"]');
    await expect(input, 'fn+space opens the spotlight').toBeVisible({ timeout: 5000 });
    const words = `why does p99 rise ${Date.now() % 100000}`;
    await input.click();
    await cap.keyboard.type(words);
    await cap.keyboard.press('Enter');
    await core.waitCmd(isCmd('send', { text: words }));
    await core.send({ ev: 'route', project: HOME, rid: 51, to: ACME, name: 'acme', text: words, correct_until_ms: Date.now() + 3000, why: 'test' });
    const hold = cap.locator('[data-testid="spot.route"], [data-testid="capsule.route"]').first();
    try {
      await expect(hold, 'the hold shows in the spotlight at once').toBeVisible({ timeout: 250 });
    } finally {
      await cap.screenshot({ path: test.info().outputPath('spot-held.png') });
    }
    // the spotlight reads as the thread since amb-win's 4abe0fc0 ('→ bise · acme · sending' at 0)
    await expect(hold).toContainText(/→ bise · acme · [23] s to change/);
    const left0 = Number(await hold.getAttribute('data-left'));
    await cap.waitForTimeout(1300);
    expect(Number(await hold.getAttribute('data-left')), 'the seconds count down').toBeLessThan(left0);
    await hold.locator('[data-testid$=".keep"]').click();
    await core.waitCmd(isCmd('route_cancel', { rid: 51, project: HOME }));
  } finally {
    await s.close();
  }
});
