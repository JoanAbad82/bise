// composer/at-chips · his words: "quand je fais un @ pour chercher une image et que je la
// selectionne: [...] la chip est ajoutée là où il y avait mon @ et mon curseur est positionné juste
// après. [...] aussi pour les autres fichiers: le path / autres infos en attachment, et une chip avec
// une référence au fichier inline". The REAL thread screen on the scripted core, real keys; the
// project is a temp folder holding shots/logo.png and computer-use/extension/test/e2e.mjs. Passes
// when:
//   - '@logo' then ⏎ puts the image's chip where the @ was (its thumbnail, its number), the words
//     around it kept, the caret right after it (what he types next lands after the chip), and its
//     row in the attachment list says logo.png and its pixels;
//   - '@e2e' then ⏎ does the same for code: a file chip, its row 'e2e.mjs' with its folder, no
//     path as text in the field;
//   - the send carries them where they were: an image part (its absolute path) and a file part
//     (its absolute path), his words around them;
//   - shots for designer: an image and two code files at the @, their rows, light and dark.
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { FakeCore, test, expect } from '../../harness';
import { onWorld } from '../native/world';

const HOME = 'bise-home-00000000';
const ROOT = mkdtempSync(path.join(tmpdir(), 'at-chips-'));
const LOGO = 'shots/logo.png';
const E2E = 'computer-use/extension/test/e2e.mjs';
const MAIN = 'rust/tui/src/main.rs';
mkdirSync(path.join(ROOT, 'shots'), { recursive: true });
mkdirSync(path.join(ROOT, path.dirname(E2E)), { recursive: true });
mkdirSync(path.join(ROOT, path.dirname(MAIN)), { recursive: true });
writeFileSync(path.join(ROOT, MAIN), 'fn main() {}\n');
copyFileSync(path.join(__dirname, '../fixtures/checker.png'), path.join(ROOT, LOGO));
writeFileSync(path.join(ROOT, E2E), "import { test } from 'node:test';\n");
test.afterAll(() => {
  rmSync(ROOT, { recursive: true, force: true });
});

const prefs = { ev: 'prefs', prefs: { onboarded: true, theme: 'light', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 } };
const world = () => [
  prefs,
  { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: ROOT, git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: ROOT, name: 'bise' },
  { ev: 'agents', project: HOME, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 }] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'hello' }], before: null, more: false },
];

const rows = (page: Page) => page.locator('[data-testid^="composer.attach."][role="listitem"]');

/** Types `@query`, answers the core's files ask with `rel`, and picks it with ⏎. */
async function pick(page: Page, core: FakeCore, query: string, rel: string): Promise<void> {
  await page.keyboard.type(`@${query}`);
  const ask = (await core.waitCmd((c) => c.cmd === 'files' && c.q === query, 3000)) as unknown as { rid: number };
  await core.send({ ev: 'files', project: HOME, rid: ask.rid, q: query, items: [{ path: rel, dir: false }] } as never);
  await expect(page.getByTestId(`composer.pick.file.${rel}`), `${rel} in the @ list`).toBeVisible({ timeout: 2000 });
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('composer.pick'), 'the pick closes the list').toBeHidden();
}

test('composer/at-chips: an @-picked image and code file are chips at the @, the caret after them, their rows in the list, their parts in the send', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  await onWorld(
    async ({ s }) => {
      const { page } = s;
      const field = page.getByTestId('composer.field');
      await expect(field, "bise main's composer").toBeVisible({ timeout: 10_000 });
      await field.click();

      // an image: its chip where '@logo' was, then what he types goes after it
      await page.keyboard.type('voir ');
      await pick(page, core, 'logo', LOGO);
      await page.keyboard.type('et ');
      const img = page.locator('[data-testid="composer.chip.1"]');
      await expect(img, 'the image chip').toHaveAttribute('data-kind', 'image');
      await expect(img.locator('img.thumb'), "the image chip shows the image's thumbnail").toHaveCount(1, { timeout: 3000 });
      await expect(page.getByTestId('composer.attach.1')).toContainText('logo.png');
      await expect(page.getByTestId('composer.attach.1').locator('.in3'), "its row: the image's pixels and size").toHaveText(/^\d+×\d+ · \d+ (B|kB)$/u);

      // code: a file chip where '@e2e' was, never its path as text
      await pick(page, core, 'e2e', E2E);
      await page.keyboard.type('stp');
      const file = page.locator('[data-testid="composer.chip.2"]');
      await expect(file, 'the file chip').toHaveAttribute('data-kind', 'file');
      await expect(file, "it says the file's name, not its number (designer m_27881)").toHaveText('▯e2e.mjs');
      await expect(page.getByTestId('composer.attach.2')).toContainText('e2e.mjs');
      await expect(page.getByTestId('composer.attach.2').locator('.in3'), 'its row: its size and folder, whole folders from the left').toHaveText(/^\d+ B · .*\/…\/[^…]*extension\/test$/u);
      await expect(rows(page)).toHaveCount(2);
      // the field's order: words, image chip, words, file chip, words (the caret was after each chip)
      const order = await field.evaluate((el) =>
        Array.from(el.querySelector('p')?.childNodes ?? [], (n) => (n instanceof HTMLElement && n.dataset.kind !== undefined ? `<${n.dataset.kind}>` : (n.textContent ?? ''))).join(''),
      );
      expect(order, 'each chip at its @, the words typed after it after it').toBe('voir <image> et <file> stp');
      expect(await field.evaluate((el) => el.textContent), 'no path as text').not.toContain('extension/test');
      // a second code file, for designer's shot: an image and two code files at the @
      await page.keyboard.type(' ');
      await pick(page, core, 'main', MAIN);
      await expect(page.locator('[data-testid="composer.chip.3"]')).toHaveText('▯main.rs');
      await page.keyboard.press('Backspace');
      await page.mouse.move(4, 4);
      await page.waitForTimeout(300);
      await page.screenshot({ path: test.info().outputPath('at-chips-light.png') });
      await core.send({ ...prefs, prefs: { ...prefs.prefs, theme: 'dark' } } as never);
      await page.waitForTimeout(400);
      await page.screenshot({ path: test.info().outputPath('at-chips-dark.png') });
      await core.send(prefs as never);
      await page.waitForTimeout(200);
      // the third chip goes (backspace after it): the send below has the image and e2e.mjs
      await page.keyboard.press('Backspace');
      await expect(page.locator('[data-testid="composer.chip.3"]')).toHaveCount(0);

      // the send: the image and the file as parts where they were, by their absolute paths
      await page.keyboard.press('Enter');
      const sent = (await core.waitCmd((c) => c.cmd === 'send', 3000)) as unknown as { parts?: unknown[] };
      expect(sent.parts, 'what the model receives').toEqual([
        { kind: 'text', text: 'voir ' },
        { kind: 'image', name: '[Image #1]', source: path.join(ROOT, LOGO) },
        { kind: 'text', text: ' et ' },
        { kind: 'file', name: '[File #2]', path: path.join(ROOT, E2E) },
        { kind: 'text', text: ' stp' },
      ]);
    },
    { core, route: `agent/${HOME}/main` },
  );
});
