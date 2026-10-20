// thread/send-image-echo · qa-native's 7b27e678 gate red (R41-dock.png, designer m_14029 RED b,
// ambient-lead m_14034): after a send with a pasted image, a second greyed 'you · sending…
// [Image #1] what is in this picture …' row stayed forever under the delivered one: the hub's echo
// carries its image marker ('<image name="[Image #1]" path=… mime=… b64=…>') before his words, and
// the pending row was matched on the exact text. Passes when: ⌘V of a PNG + words + ⏎ shows his
// pending row at once; when the hub's 'you' entry lands with the marker and his words, the pending
// row is gone and only the delivered row stays (one row with his words). The scripted core
// (FakeCore). Owner: amb-win.
import path from 'node:path';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const PNG_FILE = path.join(__dirname, '../fixtures/checker.png');
const WORDS = 'what is in this picture';
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
  { ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'hi. what are we doing today?' }], before: null, more: false },
];

test("thread/send-image-echo: a send with an image leaves 'sending…' when its echo lands with the hub's marker", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${HOME}/main` });
  try {
    const { page, app } = s;
    const field = page.getByTestId('composer.field');
    await expect(field).toBeVisible({ timeout: 10_000 });
    await field.click();
    const staged = await app.evaluate(
      (_e, file) => (globalThis as unknown as { __biseTestClip?: (o: unknown) => Promise<boolean> }).__biseTestClip?.({ file }) ?? false,
      PNG_FILE,
    );
    expect(staged).toBe(true);
    await page.keyboard.press('Meta+V');
    await expect(page.locator('[data-testid^="composer.chip."][data-kind="image"]')).toHaveCount(1, { timeout: 5000 });
    await page.keyboard.type(WORDS);
    // the hub answers his send with its message id; its echo carries it (A1: no words match)
    await core.result('send', undefined, { msg_id: 2, reason: 'made' });
    await page.keyboard.press('Enter');
    const sent = (await core.waitCmd((c) => c.cmd === 'send', 5000)) as Record<string, unknown>;
    const img = ((sent['parts'] ?? []) as Record<string, unknown>[]).find((p) => p['kind'] === 'image');
    const file = typeof img?.['source'] === 'string' ? img['source'] : '';
    expect(file, 'the image goes as a typed part with its source').not.toBe('');
    const pending = page.locator('[data-testid^="thread.pending."]');
    await expect(pending, 'his row at once, sending').toHaveCount(1);
    // the hub's echo: the marker it rendered for the model, then his words (rust/images marker())
    const marker = `<image name="[Image #1]" path="${file}" mime="image/png" b64="/h/images/ab12.b64">`;
    await core.send({ ev: 'entry', project: HOME, agent: 'main', entry: { pos: 2, at_ms: Date.now(), kind: 'you', msg_id: 2, text: `${marker} ${WORDS}` } } as never);
    await expect(page.getByTestId('thread.row.2'), 'the delivered row').toBeVisible({ timeout: 5000 }).catch(() => undefined);
    await expect(pending, "the pending row leaves when its echo lands (never a second greyed 'sending…')").toHaveCount(0, { timeout: 3000 });
    await expect(page.locator('.th-row', { hasText: WORDS }), 'one row with his words').toHaveCount(1);
    await page.screenshot({ path: test.info().outputPath('after-echo.png') });
  } finally {
    await s.close();
    core.dispose();
  }
});
