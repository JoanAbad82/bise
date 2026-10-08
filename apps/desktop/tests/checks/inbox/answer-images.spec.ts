// inbox/answer-images · R41 (ambient-lead m_13889, hub side amb-feed b4d4c5c0: HubCmd::Answer.files):
// he answers a card with an image. Passes when, on the scripted core (FakeCore, fake data, a fixture PNG):
//   - ⌘I: a PNG pasted in the item's answer field is a chip '[Image #1] checker.png'; his words + ⏎
//     send answer {card 9, reply, files: [the image's path in the test home's store]};
//   - an image alone (no words) + ⏎ answers with the image only (reply '');
//   - the thread's docked answer: a PNG pasted in the composer goes with his words as answer {files}.
// That the asking agent's request carries the image block is the hub's (amb-feed's laws) and
// qa-native's R41 (4)(5) on FAKE_BODIES. Owner: amb-home.
import path from 'node:path';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { pasteImage } from '../../harness/inputs';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const PNG = path.join(__dirname, '../fixtures/checker.png');
const agent = (name: string) => ({ name, main: name === 'main', status: name === 'perf' ? 'waiting' : 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: name === 'perf' ? 1 : 0 });
const card = (id: number, question: string) => ({ id, project: P, kind: 'question', rank: 1, agent: 'perf', question, options: [{ n: 1, label: 'cold' }, { n: 2, label: 'warm' }], urgent: false, since_ms: 1791100310000 + id });
const projects = (cards: unknown[]) => ({
  ev: 'projects',
  projects: [
    { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
    { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 0, waits: cards.length, running: true, cards },
  ],
});
const world = () => [
  { ev: 'prefs', prefs: { onboarded: true, theme: 'light', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 } },
  projects([card(9, 'which bench?'), card(10, 'which page?')]),
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf')] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'hello' }], before: null, more: false },
];
type Cmd = { cmd?: string; card?: number; reply?: string; files?: string[] };
const answers = (core: FakeCore) => core.cmds().filter((c) => (c as Cmd).cmd === 'answer') as Cmd[];

test('inbox/answer-images: an image pasted on a card answer (⌘I or the docked answer) goes with it as files', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'inbox' });
  const { page } = s;
  try {
    const field = '[data-testid="inbox.answer"]';
    await expect(page.locator(field)).toBeVisible({ timeout: 10_000 });

    await test.step("⌘I: a pasted PNG is a chip; words + ⏎ send answer {files}", async () => {
      await pasteImage(page, field, PNG);
      // the composer's chip inside the field, before his words: thumbnail + '[Image #1]', no file name
      const chip = page.getByTestId('inbox.answer.image.1');
      await expect(chip).toHaveText('[Image #1]', { timeout: 5000 });
      await expect(chip.locator('img.thumb'), 'a 16 px thumbnail').toHaveCount(1);
      await expect(page.getByTestId('inbox.answer.box').getByTestId('inbox.answer.image.1'), 'inside the field').toHaveCount(1);
      const look = await chip.evaluate((el) => {
        const cs = getComputedStyle(el);
        const root = getComputedStyle(document.documentElement);
        const probe = (v: string): string => {
          const d = document.createElement('i');
          d.style.color = v;
          document.body.append(d);
          const c = getComputedStyle(d).color;
          d.remove();
          return c;
        };
        return { color: cs.color, accent: probe(root.getPropertyValue('--c-accent')), bg: cs.backgroundColor, soft: probe(root.getPropertyValue('--c-accent-soft')), thumb: (el.querySelector('img.thumb') as HTMLElement).getBoundingClientRect().width };
      });
      expect(look.color, 'accent words').toBe(look.accent);
      expect(look.bg, 'on accent-soft').toBe(look.soft);
      expect(look.thumb).toBe(16);
      await page.screenshot({ path: test.info().outputPath('inbox-image.png') });
      // ⌫ at the start of the words removes it, as the composer's ⌫ before a chip
      await page.locator(field).press('Backspace');
      await expect(chip).toHaveCount(0);
      await pasteImage(page, field, PNG);
      await expect(page.getByTestId('inbox.answer.image.1')).toBeVisible({ timeout: 5000 });
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.setProperty('color-scheme', 'dark');
      });
      await page.waitForTimeout(400);
      await page.screenshot({ path: test.info().outputPath('inbox-image-dark.png') });
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.style.setProperty('color-scheme', 'light');
      });
      await page.waitForTimeout(300);
      await page.locator(field).fill('this one, see the shot');
      await page.locator(field).press('Enter');
      await expect.poll(() => answers(core).length, { timeout: 3000 }).toBe(1);
      const a = answers(core)[0];
      expect(a).toMatchObject({ card: answers(core)[0]?.card, reply: 'this one, see the shot' });
      expect(a?.files?.length, 'one image').toBe(1);
      expect(a?.files?.[0] ?? '', "the image's path in the test home's store").toMatch(/\/images\/[0-9a-f]+\.png$/);
    });

    await test.step('an image alone + ⏎ answers with the image only', async () => {
      await core.send(projects([card(10, 'which page?')]) as never);
      await expect(page.locator(field)).toBeVisible({ timeout: 3000 });
      await pasteImage(page, field, PNG);
      await expect(page.getByTestId('inbox.answer.image.1')).toBeVisible({ timeout: 5000 });
      await page.locator(field).press('Enter');
      await expect.poll(() => answers(core).length, { timeout: 3000 }).toBe(2);
      expect(answers(core)[1]).toMatchObject({ card: 10, reply: '' });
      expect(answers(core)[1]?.files?.length).toBe(1);
    });

    await test.step("the docked answer: a PNG pasted in the composer goes with his words", async () => {
      await core.send(projects([card(9, 'which bench?')]) as never);
      await page.getByTestId(`app.sidebar.project.${P}`).click();
      await expect(page.getByTestId('strip.row.1')).toBeVisible({ timeout: 5000 });
      await page.getByTestId('strip.row.1').click();
      await expect(page.getByTestId('strip.dock')).toBeVisible({ timeout: 3000 });
      const composer = '[data-testid="composer.field"]';
      await pasteImage(page, composer, PNG);
      await expect(page.locator('[data-testid="composer"]')).toContainText('[Image #1]', { timeout: 5000 });
      await page.locator(composer).first().click();
      await page.keyboard.press('End');
      await page.keyboard.type(' warm, like this');
      await page.keyboard.press('Enter');
      await expect.poll(() => answers(core).length, { timeout: 3000 }).toBe(3);
      const a = answers(core)[2];
      expect(a).toMatchObject({ card: 9 });
      expect(a?.reply ?? '').toContain('warm, like this');
      expect(a?.files?.length, 'the pasted image goes with the answer').toBe(1);
    });
  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});
