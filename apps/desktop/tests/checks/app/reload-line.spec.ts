// app/reload-line · designer's desktop-notices page (1), architect m_20576 (amb-feed's switch row
// 8e5ce0e4): bise's version switch on the window's ONE status line under the title bar. Passes when
// the home hub's 'reloading' shows 'reloading bise on <to>' as app.reload; 'up' (at_ms now) turns
// it into '✓ reloaded on <to>', which folds and goes ~3.2 s later; a stale 'up' at hello (an old
// at_ms) shows nothing; 'rolled_back' shows "▲ couldn't reload: <why>" until his click, retry
// sends main '/version <to>', ✕ folds it, and the next switch shows again.
// The scripted core (FakeCore). Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { thread } from '../../../src/proto/words.gen';

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
    expect(look.h, "the pill is the title bar's control height (24 px, desktop-notices v2)").toBe(24);
    expect(await line.evaluate((el) => el.parentElement?.dataset.testid), 'in the title bar, not under it').toBe('app.title.status');
    expect(look.sha, 'the sha is machine text').not.toBe(look.words);
    await page.screenshot({ path: test.info().outputPath('reloading.png') });
    // up: ✓, then it folds and goes
    await core.send(sw('up'));
    await expect(page.getByTestId('app.reload.text')).toHaveText(`✓ reloaded on ${TO}`, { timeout: 3000 });
    await page.screenshot({ path: test.info().outputPath('reloaded.png') });
    await expect(line, 'folded after its 3 s').toHaveCount(0, { timeout: 5000 });
    // rolled back: stays, retry sends main /version <to>, ✕ folds it
    await core.send(sw('rolled_back', { reason: 'the hub died during its probation' }));
    await expect(page.getByTestId('app.reload.text')).toHaveText(thread.reload_failed({ why: thread.reload_died({ from: '2065c746' }) }), { timeout: 3000 });
    expect(await line.evaluate((el) => el.getBoundingClientRect().height), 'with retry and ✕, still 24 px').toBe(24);
    // at most 480 px, never a red banner from the crumb to the toggle (designer m_21244): the reason cuts with …
    const wide = await page.evaluate(() => {
      const pill = document.querySelector<HTMLElement>('[data-testid="app.reload"]');
      const words = document.querySelector<HTMLElement>('[data-testid="app.reload.text"]');
      const slot = document.querySelector<HTMLElement>('[data-testid="app.title.status"]');
      return {
        w: Math.round(pill?.getBoundingClientRect().width ?? 0),
        room: slot?.clientWidth ?? 0,
        cut: words !== null && words.scrollWidth > words.clientWidth,
        ellipsis: words === null ? '' : getComputedStyle(words).textOverflow,
      };
    });
    test.info().annotations.push({ type: 'room', description: `1100 wide: ${String(wide.room)} px, the failed pill ${String(wide.w)} px, cut ${String(wide.cut)}` });
    expect(wide.w, 'the pill is 480 px at most').toBeLessThanOrEqual(480);
    if (wide.room > 480) expect(wide.cut, 'the reason is cut, not the pill widened').toBe(true);
    expect(wide.ellipsis).toBe('ellipsis');
    await expect(line).toHaveAttribute('role', 'alert');
    await page.waitForTimeout(3600);
    await expect(line, 'a failure stays').toBeVisible();
    await page.screenshot({ path: test.info().outputPath('rolled-back.png') });
    // a click on the words: the 320 px popover with the whole words, retry and ✕; a click away closes it
    await page.getByTestId('app.reload.open').click();
    const pop = page.getByTestId('app.reload.pop');
    await expect(pop).toContainText("you're still on 2065c746.");
    expect(await pop.evaluate((el) => el.getBoundingClientRect().width), 'the popover is 320 px').toBe(320);
    await expect(page.getByTestId('app.reload.pop.retry')).toBeVisible();
    await expect(page.getByTestId('app.reload.pop.close')).toBeVisible();
    await page.screenshot({ path: test.info().outputPath('rolled-back-pop.png') });
    await page.getByTestId('app.main').click({ position: { x: 300, y: 300 } });
    await expect(pop, 'a click away closes it').toHaveCount(0);
    // narrower: the pill never cuts the crumb; under 160 px of room (the slot's data-narrow) only the
    // short words show, and a click still opens the whole words
    for (const w of [800, 680]) {
      await s.app.evaluate(({ BrowserWindow }, ww) => {
        const win = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
        win?.setContentSize(ww, 700);
      }, w);
      await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(w);
      await page.waitForTimeout(200);
      const room = await page.getByTestId('app.title.status').evaluate((el) => ({ w: el.clientWidth, narrow: el.dataset.narrow === 'true' }));
      test.info().annotations.push({ type: 'room', description: `${String(w)} wide: ${String(room.w)} px, narrow ${String(room.narrow)}` });
      const pill = await line.evaluate((el) => {
        const crumb = document.querySelector<HTMLElement>('[data-testid="app.title.crumb"]');
        return { right: el.getBoundingClientRect().right, crumbWhole: crumb !== null && crumb.scrollWidth <= crumb.clientWidth };
      });
      expect(pill.crumbWhole, `${String(w)}: the crumb is never cut for it`).toBe(true);
      if (room.narrow) {
        await expect(page.getByTestId('app.reload.short'), `${String(w)}: the short words`).toHaveText(thread.reload_short_failed);
        await expect(page.getByTestId('app.reload.text'), `${String(w)}: no long words`).toBeHidden();
        await expect(page.getByTestId('app.reload.retry'), `${String(w)}: the actions are in the popover`).toBeHidden();
        await page.getByTestId('app.reload.open').click();
        await expect(page.getByTestId('app.reload.pop.retry')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(pop).toHaveCount(0);
      } else {
        await expect(page.getByTestId('app.reload.text'), `${String(w)}: the words, cut with … if need be`).toBeVisible();
        await expect(page.getByTestId('app.reload.short')).toBeHidden();
      }
      await page.screenshot({ path: test.info().outputPath(`rolled-back-${String(w)}.png`) });
      if (w === 800) {
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.waitForTimeout(200);
        await page.screenshot({ path: test.info().outputPath('rolled-back-800-dark.png') });
        await page.emulateMedia({ colorScheme: 'light' });
      }
    }
    // 680 is the window's least width and still leaves ~440 px: a long crumb takes the room under 160 px
    const LONG = ' › a very long agent name that takes nearly all of the title bar';
    await page.getByTestId('app.title.crumb').evaluate((el, t) => {
      const s = document.createElement('span');
      s.dataset['zz'] = 'long';
      s.textContent = t;
      el.appendChild(s);
    }, LONG);
    await expect(page.getByTestId('app.title.status')).toHaveAttribute('data-narrow', 'true');
    const narrowRoom = await page.getByTestId('app.title.status').evaluate((el) => el.clientWidth);
    test.info().annotations.push({ type: 'room', description: `680 wide, long crumb: ${String(narrowRoom)} px, narrow true` });
    expect(
      await page.getByTestId('app.title.crumb').evaluate((el) => el.scrollWidth <= el.clientWidth),
      'narrow: the crumb is never cut for it',
    ).toBe(true);
    // '▲ couldn't reload' needs ~110 px: under that, the sign alone in a 24 px square (designer m_21244)
    expect(narrowRoom, 'the long crumb leaves less room than the short words need').toBeLessThan(110);
    await expect(line, 'tight: the short words do not fit either').toHaveAttribute('data-tight', 'true');
    const sq = await line.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const slot = el.parentElement?.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), inside: slot !== undefined && r.left >= slot.left - 0.5 && r.right <= slot.right + 0.5 };
    });
    expect(sq, 'a 24 px square, inside its room').toEqual({ w: 24, h: 24, inside: true });
    await expect(page.getByTestId('app.reload.glyph'), 'tight: the sign alone').toHaveText('▲');
    await expect(page.getByTestId('app.reload.glyph')).toBeVisible();
    await expect(page.getByTestId('app.reload.short'), 'tight: no short words').toBeHidden();
    await expect(page.getByTestId('app.reload.text'), 'narrow: no long words').toBeHidden();
    await expect(page.getByTestId('app.reload.retry'), 'narrow: the actions are in the popover').toBeHidden();
    await page.screenshot({ path: test.info().outputPath('rolled-back-narrow.png') });
    await page.getByTestId('app.reload.open').click();
    await expect(page.getByTestId('app.reload.pop.retry')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(pop).toHaveCount(0);
    await page.locator('[data-zz="long"]').evaluate((el) => {
      el.remove();
    });
    await expect(page.getByTestId('app.title.status')).toHaveAttribute('data-narrow', 'false');
    await s.app.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
      win?.setContentSize(1100, 720);
    });
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
