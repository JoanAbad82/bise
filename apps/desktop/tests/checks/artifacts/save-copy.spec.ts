// artifacts/save-copy · 'save a copy…' and 'show in Finder' (art-save, his words: « pouvoir
// télécharger le document … un Open in Finder dans les options du menu de l'artifact »). Passes
// when, on the scripted core (FakeCore, fake files in a throwaway project folder), off-screen:
//   - a file (bench.csv): ⤓ in the head saves the current bytes under its own name; test mode's
//     panel is BISE_DESKTOP_TEST_SAVE_TO (never a real panel), the 'save-copy' line records
//     {from, name, to}, the bytes are there, the strip says 'saved to …';
//   - an office file (deck.pptx, v2): ⋯ › save a copy… and ⌘S (File › Save a Copy…) save the version
//     shown: v2 is bise's copy of v2, v1 picked in the versions menu is v1's copy, named deck-v1.pptx;
//     ⋯ › show in Finder selects the file itself ('reveal' line);
//   - an archived agent's file gone from its folder: show in Finder selects bise's copy, save a copy
//     copies it;
//   - a bise page: no ⤓, no 'save a copy…' row.
// Owner: art-save.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { FakeCore, test, expect } from '../../harness';
import { onWorld } from '../native/world';

const HOME = 'bise-home-00000000';
const ROOT = mkdtempSync(path.join(tmpdir(), 'save-copy-'));
const PROJECT = path.join(ROOT, 'shop');
const STORE = path.join(PROJECT, '.store');
const SAVED = path.join(ROOT, 'saved.out');
const file = (p: string, bytes: string) => {
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, bytes);
  return p;
};
const BENCH = file(path.join(PROJECT, 'out', 'bench.csv'), 'a,b\n1,2\n');
const DECK = file(path.join(PROJECT, 'out', 'deck.pptx'), 'deck v2, as he edited it since');
const DECK1 = file(path.join(STORE, 'deck', 'v1', 'deck-v1.pptx'), 'deck v1 bytes');
const DECK2 = file(path.join(STORE, 'deck', 'v2', 'deck.pptx'), 'deck v2 bytes');
const GONE = path.join(PROJECT, 'tmp-of-old-agent', 'report.docx');
const GONE_COPY = file(path.join(STORE, 'report', 'v1', 'report.docx'), 'report bytes');
test.afterAll(() => {
  rmSync(ROOT, { recursive: true, force: true });
});

const world = (now: number) => {
  const base = { agent: 'perf', version: 1, new: false, at_ms: now - 3600_000 };
  return [
    { ev: 'prefs', prefs: { onboarded: true, theme: 'light' } },
    { ev: 'projects', projects: [{ project: HOME, name: 'shop', path: PROJECT, git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }] },
    { ev: 'welcome', project: HOME, proto: 1, workspace: PROJECT, name: 'shop' },
    { ev: 'agents', project: HOME, agents: [{ name: 'main', dir: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: now, waits: 0 }] },
    {
      ev: 'artifacts',
      project: HOME,
      items: [
        { ...base, id: 'bench', kind: 'file', title: 'bench numbers', url: BENCH, path: BENCH, target: BENCH },
        {
          ...base, id: 'deck', kind: 'file', title: 'launch deck', version: 2, url: DECK2, path: DECK, target: DECK, copy: DECK2,
          versions: [{ v: 1, at_ms: now - 7200_000, target: path.join(PROJECT, 'out', 'deck-v1.pptx'), copy: DECK1 }, { v: 2, at_ms: now - 3600_000, target: DECK, copy: DECK2 }],
        },
        { ...base, id: 'report', kind: 'file', title: 'quarter report', agent: 'old-agent', archived: true, gone: true, url: GONE_COPY, path: GONE, target: GONE, copy: GONE_COPY },
        { ...base, id: 'notes', kind: 'page', title: 'launch notes', url: 'http://127.0.0.1:9/p/notes', by: 'page' },
      ],
    },
  ];
};

type Rec = { from: string; name: string; to: string | null };

test('artifacts/save-copy: save a copy… and show in Finder for a file, an office file, a gone file; never for a page', async () => {
  test.setTimeout(90_000);
  const now = Date.now();
  await onWorld(
    async ({ s, out }) => {
      const { page } = s;
      const saves = () => out.of('bise-desktop: save-copy').map((l) => JSON.parse(l) as Rec);
      // the project's artifacts list, then each one opened from its row
      await expect(page.getByTestId('artifacts.list.row.bench')).toBeVisible({ timeout: 10_000 });
      await page.getByTestId('artifacts.list.row.bench').dblclick();
      await expect(page.getByTestId('artifact.title')).toHaveText('bench numbers', { timeout: 10_000 });

      // a file: ⤓ in the head (the projects row reaches main a moment after load: poll)
      await expect.poll(async () => {
        await page.getByTestId('artifact.save').click();
        return saves().length;
      }, { timeout: 10_000 }).toBeGreaterThan(0);
      expect(saves()[0]).toEqual({ from: BENCH, name: 'bench.csv', to: SAVED });
      // the strip: the name whole, a long folder cut at a slash from the left, the whole path in its tip
      await expect(page.getByTestId('artifact.saved')).toContainText(/^saved to (…\/)?[^…]*\/saved\.outshow in Finder$/u);
      await expect(page.getByTestId('artifact.saved').locator('[title]')).toHaveAttribute('title', SAVED);
      await expect.poll(() => readFileSync(SAVED, 'utf8'), { message: 'the copy is written after its line' }).toBe('a,b\n1,2\n');
      await page.screenshot({ path: test.info().outputPath('saved-strip.png') });
      // designer's crop: the head and the strip, the ⤓ hovered
      await page.getByTestId('artifact.save').hover();
      const head = await page.getByTestId('artifact.head').boundingBox();
      const strip = await page.getByTestId('artifact.saved').boundingBox();
      if (head !== null && strip !== null) {
        await page.screenshot({ path: test.info().outputPath('head-strip.png'), clip: { x: head.x, y: head.y, width: head.width, height: strip.y + strip.height - head.y } });
      }

      // an office file: ⋯ › save a copy… saves v2's copy; the menu shot for designer
      await page.getByTestId('artifact.close').click();
      await page.getByTestId('artifacts.list.row.deck').dblclick();
      await expect(page.getByTestId('artifact.title')).toHaveText('launch deck');
      await page.getByTestId('artifact.more').click();
      await expect(page.getByTestId('artifact.save.menu')).toBeVisible();
      await page.screenshot({ path: test.info().outputPath('more-menu.png') });
      await page.getByTestId('artifact.save.menu').click();
      await expect.poll(() => saves().length).toBe(2);
      expect(saves()[1]).toEqual({ from: DECK2, name: 'deck.pptx', to: SAVED });
      await expect.poll(() => readFileSync(SAVED, 'utf8'), { message: 'the copy is written after its line' }).toBe('deck v2 bytes');
      // v1 picked, then ⌘S (File › Save a Copy…): v1's own bytes and name
      await page.getByTestId('artifact.version').click();
      await page.getByTestId('artifact.versions.v1').click();
      await s.app.evaluate(({ Menu }) => {
        const item = Menu.getApplicationMenu()?.items.flatMap((m) => m.submenu?.items ?? []).find((i) => i.accelerator === 'CmdOrCtrl+S');
        item?.click();
      });
      await expect.poll(() => saves().length).toBe(3);
      expect(saves()[2]).toEqual({ from: DECK1, name: 'deck-v1.pptx', to: SAVED });
      await expect.poll(() => readFileSync(SAVED, 'utf8'), { message: 'the copy is written after its line' }).toBe('deck v1 bytes');
      // show in Finder: the file itself while it is there
      await page.getByTestId('artifact.more').click();
      await page.getByTestId('artifact.finder').click();
      expect(await out.wait('bise-desktop: reveal', (p) => p === DECK, 3000)).toBe(DECK);

      // an archived agent's file, gone: bise's copy in Finder, and saved
      await page.getByTestId('artifact.close').click();
      await page.getByTestId('artifacts.list.row.report').dblclick();
      await expect(page.getByTestId('artifact.title')).toHaveText('quarter report');
      await page.getByTestId('artifact.more').click();
      await page.getByTestId('artifact.finder').click();
      expect(await out.wait('bise-desktop: reveal', (p) => p === GONE_COPY, 3000)).toBe(GONE_COPY);
      await page.getByTestId('artifact.save').click();
      await expect.poll(() => saves().length).toBe(4);
      expect(saves()[3]).toEqual({ from: GONE_COPY, name: 'report.docx', to: SAVED });

      // a bise page: neither ⤓ nor the row
      await page.getByTestId('artifact.close').click();
      await page.getByTestId('artifacts.list.row.notes').dblclick();
      await expect(page.getByTestId('artifact.title')).toHaveText('launch notes');
      await expect(page.getByTestId('artifact.save')).toHaveCount(0);
      await page.getByTestId('artifact.more').click();
      await expect(page.getByTestId('artifact.save.menu')).toHaveCount(0);
    },
    { core: new FakeCore(world(now) as unknown as ConstructorParameters<typeof FakeCore>[0]), route: `artifacts/${HOME}`, env: { BISE_DESKTOP_TEST_SAVE_TO: SAVED }, size: '1400x900' },
  );
});
