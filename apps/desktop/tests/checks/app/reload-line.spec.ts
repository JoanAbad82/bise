// app/reload-line · designer's desktop-notices page (1), architect m_20576 (amb-feed's switch row
// 8e5ce0e4): bise's version switch on the window's ONE status line under the title bar. Passes when
// the home hub's 'reloading' shows 'reloading bise on <to>' as app.reload; 'up' (at_ms now) turns
// it into '✓ reloaded on <to>', which folds and goes ~3.2 s later; a stale 'up' at hello (an old
// at_ms) shows nothing; 'rolled_back' shows "▲ couldn't reload: <why>" until his click, retry
// sends main '/version <to>', ✕ folds it, and the next switch shows again.
// The scripted core (FakeCore). Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const TO = 'f7178b72';
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
const world = () => [
  {
    ev: 'prefs',
    prefs: {
      onboarded: true,
      theme: 'system',
      context: { shot: true, url: true, file: true, window_text: false },
      excluded_apps: [],
      quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
      voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
      shots_keep_days: 7,
    },
  },
  {
    ev: 'projects',
    projects: [{ project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
];
const sw = (phase: string, extra: Record<string, unknown> = {}) =>
  ({ ev: 'switch', project: HOME, switch: { phase, to: TO, from: '2065c746', at_ms: Date.now(), ...extra } }) as never;

test('app/reload-line: reloading, then ✓ reloaded that folds; a stale one says nothing; a rollback stays with retry and ✕', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'bise' });
  try {
    const { page } = s;
    const line = page.getByTestId('app.reload');
    await expect(page.getByTestId('app.main')).toBeVisible({ timeout: 10_000 });
    // a stale 'up' (as at hello, minutes old): nothing
    await core.send(sw('up', { at_ms: Date.now() - 10 * 60_000 }));
    await page.waitForTimeout(500);
    await expect(line, 'a stale switch never shows as new').toHaveCount(0);
    // reloading
    await core.send(sw('reloading'));
    await expect(line, 'the line under the title bar').toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('app.reload.text')).toHaveText(`reloading bise on ${TO}`);
    // designer m_20853: the breath before the words, the elapsed time at the right end, the sha in
    // mono, one list row high (32 px)
    await expect(page.getByTestId('app.reload.breath'), 'the 1-cell breath').toBeVisible();
    await expect(page.getByTestId('app.reload.age'), "the elapsed time ('0 s')").toHaveText(/^\d+ s$/u);
    const look = await line.evaluate((el) => {
      const sha = el.querySelector('.app-reload-sha');
      const text = el.querySelector('[data-testid="app.reload.text"]');
      return {
        h: el.getBoundingClientRect().height,
        sha: sha === null ? '' : getComputedStyle(sha).fontFamily,
        words: text === null ? '' : getComputedStyle(text).fontFamily,
      };
    });
    expect(look.h, 'the line is one list row (32 px)').toBe(32);
    expect(look.sha, 'the sha is machine text').not.toBe(look.words);
    await page.screenshot({ path: test.info().outputPath('reloading.png') });
    // up: ✓, then it folds and goes
    await core.send(sw('up'));
    await expect(page.getByTestId('app.reload.text')).toHaveText(`✓ reloaded on ${TO}`, { timeout: 3000 });
    await page.screenshot({ path: test.info().outputPath('reloaded.png') });
    await expect(line, 'folded after its 3 s').toHaveCount(0, { timeout: 5000 });
    // rolled back: stays, retry sends main /version <to>, ✕ folds it
    await core.send(sw('rolled_back', { reason: 'the hub died during its probation' }));
    await expect(page.getByTestId('app.reload.text')).toHaveText("▲ couldn't reload: the new version stopped right after it started. you're still on 2065c746.", { timeout: 3000 });
    expect(await line.evaluate((el) => el.getBoundingClientRect().height), 'with retry and ✕, still one row').toBe(32);
    await expect(line).toHaveAttribute('role', 'alert');
    await page.waitForTimeout(3600);
    await expect(line, 'a failure stays').toBeVisible();
    await page.screenshot({ path: test.info().outputPath('rolled-back.png') });
    await page.getByTestId('app.reload.retry').click();
    const cmd = await core.waitCmd((c) => c.cmd === 'slash', 3000);
    expect(cmd).toMatchObject({ project: HOME, agent: 'main', line: `/version ${TO}` });
    await page.getByTestId('app.reload.close').click();
    await expect(line, '✕ folds it').toHaveCount(0, { timeout: 2000 });
    // the next switch shows again
    await core.send(sw('reloading'));
    await expect(line, 'the next switch shows').toBeVisible({ timeout: 3000 });
  } finally {
    await s.close();
    core.dispose();
  }
});
