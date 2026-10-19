// thread/image-deleted · D14 (the image store keeps an image his shots_keep_days, then deletes it;
// docs/images.md "Retention", designer m_23410, m_31912): an old bubble whose image the store
// deleted keeps its chip with the no-file look and says 'deleted · images are kept 7 days ·
// settings', never a broken image; 'settings' opens settings › privacy, whose kept row reads
// 'images · pasted, made by agents or taken with fn · deleted after'. The scripted core
// (FakeCore). Shots at 1100, light then dark: the bubble, the row. Owner: debt-t9.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { settings, thread } from '../../../src/proto/words.gen';

const HOME = 'bise-home-00000000';
const NOW = Date.now();
const DAY = 86_400_000;
// a store file that is gone: its .b64 named, its image beside it not there
const B64 = '/nowhere/bise/images/0123456789abcdef0123456789abcdef.b64';
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const world = () => [
  prefs('light'),
  { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: NOW - 20 * DAY, waits: 0, watching: [] }] },
  {
    ev: 'thread',
    project: HOME,
    agent: 'main',
    entries: [
      {
        pos: 1,
        at_ms: NOW - 12 * DAY,
        kind: 'you',
        text: `what is wrong on this page? <image name="[Image #1]" path="/nowhere/shot.png" mime="image/png" b64="${B64}">`,
        parts: [
          { kind: 'text', text: 'what is wrong on this page? ' },
          { kind: 'image', name: '[Image #1]', source: '/nowhere/shot.png', mime: 'image/png', b64_file: B64 },
        ],
      },
      { pos: 2, at_ms: NOW - 12 * DAY + 60_000, kind: 'agent', text: 'the total is drawn twice: the cart and the summary both add the tax.' },
    ],
    before: null,
    more: false,
  },
];

/** `<name>-light.png` and `<name>-dark.png`, the pointer off the chips; light again after */
async function shots(page: Page, core: FakeCore, name: string): Promise<void> {
  await page.mouse.move(1, 300);
  await page.screenshot({ path: test.info().outputPath(`${name}-light.png`) });
  await core.send(prefs('dark') as never);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark', { timeout: 3000 }).catch(() => undefined);
  await page.screenshot({ path: test.info().outputPath(`${name}-dark.png`) });
  await core.send(prefs('light') as never);
}

test("thread/image-deleted: an old bubble's deleted image says so and links to settings › privacy", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${HOME}/main`, size: '1100x760' });
  try {
    const { page } = s;
    const words = page.locator('[data-testid$=".image.1.deleted"]');
    await expect(words, 'the no-file chip says it was deleted, with today\'s rule').toHaveText(thread.image_deleted({ days: settings.days({ n: 7 }) }), { timeout: 10_000 });
    await expect(page.locator('.th-parts img'), 'never a broken image').toHaveCount(0);
    await shots(page, core, 'bubble');
    await page.locator('[data-testid$=".image.1.settings"]').click();
    const row = page.getByText(settings.privacy_shots_sub);
    await expect(row, 'settings › privacy, the kept row').toBeVisible({ timeout: 5000 });
    await shots(page, core, 'row');
  } finally {
    await s.close();
    core.dispose();
  }
});
