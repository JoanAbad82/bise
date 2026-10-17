// composer/cmd-notice · his m_29126: «J'ai fait une erreur de commande il y a plusieurs message et
// le message d'erreur ne part jamais […] ça le bouge vers le haut»: a refused '/bime' stayed in a
// red box under the composer's key line for many messages and pushed the composer up. On the real
// shell with the scripted core (FakeCore, fake data). Passes when:
//   - the hub's refusal of '/bime' shows on the key line's place ('✗ unknown command: …', as an
//     error), and the composer's frame has the same rect before, during and after it;
//   - it goes at his next send, at his first key, or after its time (LINE_MS), whichever first;
//   - nothing shows under the screen any more (no box after the composer).
// Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const REFUSED = 'unknown command: /bime · see /help';
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: NOW - 3_600_000, waits: 0 });
const world = [
  {
    ev: 'prefs',
    prefs: { onboarded: true, theme: 'dark', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
  },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true, cards: [] },
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true, cards: [] },
    ],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: HOME, agents: [ag('main')] },
  { ev: 'agents', project: P, agents: [ag('main')] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: NOW - 300_000, kind: 'agent', text: 'the build is green.' }], before: null, more: false },
];
type Cmd = { cmd?: string; line?: string };
type Rect = { x: number; y: number; width: number; height: number };

test("composer/cmd-notice: a refused '/bime' says so on the key line, the composer never moves, and it goes at the next send", async () => {
  const core = new FakeCore(world as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/main`, size: '1100x760' });
  try {
    const { page } = s;
    const frame = page.getByTestId('composer').first();
    const field = page.getByTestId('composer.field').first();
    const line = page.locator('[data-testid="composer"] .keys [data-testid="confirm.notice"]');
    const rect = async (): Promise<Rect> => {
      const b = await frame.boundingBox();
      if (b === null) throw new Error('no composer');
      return { x: Math.round(b.x), y: Math.round(b.y), width: Math.round(b.width), height: Math.round(b.height) };
    };
    await expect(field).toBeVisible({ timeout: 10_000 });
    const keys = page.getByTestId('composer.keys').first();
    await expect(keys).toBeVisible();
    // the old box under the screen (ConfirmBar's refused line): never again
    const boxes = () => page.locator('.confirm-bar').count();
    let tries = 0;
    const refuse = async () => {
      tries += 1;
      await field.click();
      await page.keyboard.type('/bime');
      await page.waitForTimeout(300); // the '/' list matches nothing: ⏎ sends the line (commands.spec's say)
      await page.keyboard.press('Enter');
      await expect.poll(() => core.cmds().filter((c) => (c as Cmd).cmd === 'slash' && (c as Cmd).line === '/bime').length, { timeout: 5000 }).toBe(tries);
      await core.send({ ev: 'error', cmd: 'slash', project: P, text: REFUSED } as never);
    };

    const before = await rect();
    await page.screenshot({ path: test.info().outputPath('1-before.png') });

    await test.step('refused: on the key line, as an error, the composer in place', async () => {
      await refuse();
      await expect(line, 'the refusal on the key line').toBeVisible({ timeout: 3000 });
      await expect(line).toContainText(REFUSED);
      await expect(line).toHaveAttribute('data-level', 'err');
      await expect(page.getByTestId('composer.keys'), 'the keys step out while it shows').toHaveCount(0);
      expect(await boxes(), 'no box under the screen').toBe(0);
      expect(await rect(), 'the composer has the same rect while it shows').toEqual(before);
      // his line back in the field, all selected: one key replaces it (designer m_29135)
      await expect(field, 'the refused line is back in the field').toHaveText('/bime');
      expect(await page.evaluate(() => window.getSelection()?.toString() ?? ''), 'all of it selected').toBe('/bime');
      await page.screenshot({ path: test.info().outputPath('2-during.png') });
    });

    await test.step('an error has no timer: still there after 9 s', async () => {
      await page.waitForTimeout(9000);
      await expect(line).toBeVisible();
    });

    await test.step('his next message: his first key ends it, the composer in place', async () => {
      await page.keyboard.type('and now a real message');
      await expect(line, 'his first key ends it').toHaveCount(0, { timeout: 1000 });
      await expect(field, 'his key replaced the selected line').toHaveText('and now a real message');
      await page.keyboard.press('Enter');
      await core.waitCmd((c) => (c as Cmd).cmd === 'send', 5000);
      await expect(line).toHaveCount(0);
      await expect(keys, 'the keys are back').toBeVisible();
      expect(await rect(), 'the composer has the same rect after').toEqual(before);
      await page.screenshot({ path: test.info().outputPath('3-after.png') });
    });

    await test.step('esc ends it', async () => {
      await refuse();
      await expect(line).toBeVisible({ timeout: 3000 });
      await page.keyboard.press('Escape');
      await expect(line, 'esc ends it').toHaveCount(0, { timeout: 1000 });
      expect(await rect()).toEqual(before);
      await page.keyboard.press('Meta+a');
      await page.keyboard.press('Backspace');
    });

    await test.step('a send by the button ends it too', async () => {
      await refuse();
      await expect(line).toBeVisible({ timeout: 3000 });
      // his line is back in the field: the button sends it again, no key pressed
      await page.getByTestId('composer.send').first().click();
      tries += 1;
      await expect.poll(() => core.cmds().filter((c) => (c as Cmd).cmd === 'slash' && (c as Cmd).line === '/bime').length, { timeout: 5000 }).toBe(tries);
      await expect(line, 'the send ends it').toHaveCount(0, { timeout: 1000 });
    });

    await test.step("a note (the composer's own: '/inbox' with nothing waiting) goes after its time", async () => {
      const note = page.locator('[data-testid="composer"] .keys [data-testid="composer.answer.note"]');
      await field.click();
      await page.keyboard.type('/inbox');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await expect(note, 'the note on the key line').toBeVisible({ timeout: 3000 });
      expect(await rect(), 'the composer in place').toEqual(before);
      await page.screenshot({ path: test.info().outputPath('4-note.png') });
      await expect(note, 'gone after LINE_MS (8 s)').toHaveCount(0, { timeout: 10_000 });
      expect(await rect()).toEqual(before);
    });
  } finally {
    await s.close();
    core.dispose();
  }
});
