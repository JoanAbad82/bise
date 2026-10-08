// thread/paste-image · R41 (his words via main m_13700: « le modèle doit voir ces images que je
// paste »; ambient-lead m_13762). The REAL thread screen on the scripted core, not the composer lab:
// composer/paste-image passed on the lab's fake save while the app had no saveImage at all (the
// thread's ⌘V of an image made nothing). Owner: amb-web.
// Passes when:
//   - a real ⌘V of a PNG (staged on the test clipboard through main's TEST_CLIP_HOOK) in bise main's
//     composer makes an image chip with its thumbnail drawn;
//   - ⏎ sends {cmd:'send', project: home, agent:'main', files: [one absolute path]} to the core,
//     his words in text and no path in them;
//   - the path is a file in the test home's image store (BISE_HOME/images/<sha256>.png) holding the
//     PNG's bytes, so the hub can make the image block the model sees (qa-native's $FAKE_BODIES read
//     is the model side of R41).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const PNG_FILE = path.join(__dirname, '../fixtures/checker.png');
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
  { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 }] },
  {
    ev: 'thread',
    project: HOME,
    agent: 'main',
    entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'hi. what are we doing today?' }],
    before: null,
    more: false,
  },
];

test("thread/paste-image: ⌘V of a PNG in bise main's composer is a chip, ⏎ sends it as a file in the image store", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${HOME}/main` });
  try {
    const { page, app } = s;
    const field = page.getByTestId('composer.field');
    await expect(field, "bise main's composer").toBeVisible({ timeout: 10_000 });
    await field.click();
    const staged = await app.evaluate(
      (_e, file) => (globalThis as unknown as { __biseTestClip?: (o: unknown) => Promise<boolean> }).__biseTestClip?.({ file }) ?? false,
      PNG_FILE,
    );
    expect(staged, "main's test hook read the PNG and every window took it").toBe(true);
    await page.keyboard.press('Meta+V');
    const chip = page.locator('[data-testid^="composer.chip."][data-kind="image"]');
    await expect(chip, 'the pasted PNG is an image chip').toHaveCount(1, { timeout: 5000 });
    expect(await chip.locator('img').first().evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0), 'its thumbnail is drawn').toBe(true);
    await expect(page.locator('[data-testid^="composer.strip."]').filter({ hasText: '[Image #' }), "no '[Image #1] name' strip line in the window: the chip says it (designer m_13808)").toHaveCount(0);
    await page.keyboard.type('what is wrong in this');
    await page.screenshot({ path: test.info().outputPath('chip.png') });

    await page.keyboard.press('Enter');
    const sent = (await core.waitCmd((c) => c.cmd === 'send', 5000)) as Record<string, unknown>;
    expect(sent['project']).toBe(HOME);
    expect(sent['agent']).toBe('main');
    const files = sent['files'];
    expect(Array.isArray(files), `the send carries files: ${JSON.stringify(sent)}`).toBe(true);
    const list = files as string[];
    expect(list).toHaveLength(1);
    const f = list[0] ?? '';
    expect(path.isAbsolute(f), f).toBe(true);
    expect(f, "in the image store, the TUI's").toMatch(/\/images\/[0-9a-f]{64}\.png$/u);
    expect(readFileSync(f).equals(readFileSync(PNG_FILE)), `${f} holds the PNG's bytes`).toBe(true);
    const text = typeof sent['text'] === 'string' ? sent['text'] : '';
    expect(text, 'his words are sent').toContain('what is wrong in this');
    expect(text, 'no path in his words').not.toContain(f);
  } finally {
    await s.close();
  }
});
