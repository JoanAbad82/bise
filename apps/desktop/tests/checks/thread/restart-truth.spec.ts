// thread/restart-truth · his /restart row tells the truth about this app (ambient-lead m_22833, his
// go main m_22831): the hub restarts on its version, but the app may be an older build. amb-mac's
// window.bise.app.update() is faked by BISE_DESKTOP_TEST_APP_UPDATE. He types /restart in main's
// thread (FakeCore), the hub's line comes back with his cid. Staged: '· restarting the hub on
// 041168b2 · … · this app is e91f98d7, a newer one is ready ⏎ restart to update', ⏎ on an empty field
// swaps (test mode prints 'bise-desktop: app swap <route>'), and the row stays at the hub's hello.
// Nothing staged, another build: '… · this app is e91f98d7 · it updates at the next try', gone at
// the hello. The same build: the hub's line alone, gone at the hello. None of them after a reload.
// Frames: restart-truth-<case>-<theme>.png. Owner: amb-home.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'shop-ab9f3c3b';
const NOW = Date.now();
const MIN = 60_000;
const HUB = 'restarting the hub on 041168b2 · the agents keep running'; // versions.rs (amb-feed 58798722)
const FIELD = '[data-testid="composer.field"]';
const ROW = '[data-testid="confirm.notice"]';
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const welcome = { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'shop' };
const world = (theme: string) => [
  prefs(theme),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true },
    ],
  },
  welcome,
  { ev: 'agents', project: P, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: "main's job", since_ms: NOW - 9 * MIN, waits: 0, watching: [] }] },
  { ev: 'versions', project: P, current: '041168b2', items: [] },
  {
    ev: 'thread',
    project: P,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: NOW - 30 * MIN, kind: 'you', text: 'is the build in test yet?' },
      { pos: 2, at_ms: NOW - 29 * MIN, kind: 'agent', text: 'Not yet: it will be in the build after the one in test (37fa183d).' },
    ],
    before: null,
    more: false,
  },
];

interface Case {
  readonly name: string;
  readonly update: { state: 'current' | 'staged' | 'none'; live: string | null; staged: string | null; why: string | null };
  readonly words: string;
  readonly swap: boolean;
}
const CASES: readonly Case[] = [
  { name: 'staged', update: { state: 'staged', live: 'e91f98d7836a1b2c', staged: '5a5a5a5a0000', why: null }, words: `· ${HUB} · this app is e91f98d7, a newer one is ready ⏎ restart to update`, swap: true },
  { name: 'older', update: { state: 'current', live: 'e91f98d7836a1b2c', staged: null, why: null }, words: `· ${HUB} · this app is e91f98d7 · it updates at the next try`, swap: false },
  { name: 'same', update: { state: 'current', live: '041168b2aaaa', staged: null, why: null }, words: `· ${HUB}`, swap: false },
];
const flat = (s: string | null): string => (s ?? '').replace(/\s+/g, ' ').trim();
const rowText = async (page: Page): Promise<string> => flat(await page.locator(ROW).first().textContent().catch(() => ''));

for (const theme of ['light', 'dark']) {
  for (const c of CASES) {
    test(`thread/restart-truth: ${c.name}, ${theme}`, async () => {
      const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
      const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x800', env: { BISE_DESKTOP_TEST_APP_UPDATE: JSON.stringify(c.update) } });
      try {
        const { page } = s;
        await expect(page.getByTestId('thread.entry.2'), 'the thread').toBeVisible({ timeout: 10_000 });
        await page.locator(FIELD).first().click();
        await page.keyboard.type('/restart');
        await page.keyboard.press('Enter');
        const cmd = (await core.waitCmd((x) => x.cmd === 'slash' && /^\/restart/.test((x as { line?: string }).line ?? ''))) as { cid?: number };
        expect(cmd.cid, 'his /restart goes with a cid').toEqual(expect.any(Number));
        await core.send({ ev: 'notice', project: P, cmd: 'slash', text: HUB, cid: cmd.cid } as never);
        // the hub's version: 'versions' is said at the core's start, before this window loaded,
        // and main keeps no copy (shared/latest.ts), so the row asks; the hub answers like this
        await core.waitCmd((x) => x.cmd === 'versions' && (x as { project?: string }).project === P);
        await core.send({ ev: 'versions', project: P, current: '041168b2', items: [] } as never);
        await expect.poll(() => rowText(page), { timeout: 5000, message: 'the row says' }).toBe(c.words);
        await page.mouse.move(1, 400);
        await page.screenshot({ path: test.info().outputPath(`restart-truth-${c.name}-${theme}.png`) });
        if (c.swap) {
          const said: string[] = [];
          s.app.process().stdout?.on('data', (d: Buffer) => said.push(String(d)));
          await page.locator(FIELD).first().click();
          await page.keyboard.press('Enter');
          await expect.poll(() => said.join(''), { timeout: 5000, message: 'the app swaps, back on this screen' }).toContain(`bise-desktop: app swap project/${P}`);
        }
        await core.send(welcome as never);
        if (c.swap) {
          await expect.poll(() => rowText(page), { timeout: 2000, message: 'the hub is back: the tail stays' }).toBe('· this app is e91f98d7, a newer one is ready ⏎ restart to update');
        } else {
          await expect(page.locator(ROW), 'the hub is back: the row goes').toHaveCount(0, { timeout: 1000 });
        }
        await page.reload();
        await expect(page.getByTestId('thread.entry.2'), 'after a reload').toBeVisible({ timeout: 10_000 });
        await expect(page.locator(ROW), 'after a reload: no restart row').toHaveCount(0);
      } finally {
        await s.close();
      }
    });
  }
}
