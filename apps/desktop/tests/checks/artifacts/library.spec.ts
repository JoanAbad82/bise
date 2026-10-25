// artifacts/library · the artifacts page in folders (artifacts-folders brief part 4, page
// artifacts-gallery v7): the shots the designer agent signs, every tab of the page, at 1400, 1100
// and 800, light and dark, on FakeCore with the fake library (library-world.ts). Passes when, at
// each size and theme: the column (or, under 900, the crumb) lists the folders; a theme opens onto
// its task tiles; a task's folder, unfiled, the m picker (typing filters and offers '+ new folder'),
// a card's right-click menu, three picked with the selection bar, a folder's menu, the merge picker,
// the delete dialog, the inline new folder, a search grouped by folder, a search that finds
// nothing, the scope menu, one project ('14 of 74'), and the empty pages each show. It sends
// nothing to a hub but what his gestures send. Shots: lib-<tab>-<w>-<theme>.png. art-grid adds its
// card tabs. Owner: art-folders.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { library } from '../../../src/proto/words_library.gen';
import { libraryWorld, P, type Real } from './library-world';

// the fixture's real files (shots, md, a pdf, a sheet) and its pages, served on 127.0.0.1: each
// card shows the picture the app makes of it, as for him
const FILES = join(__dirname, 'files');
async function realFiles(): Promise<Real & { close: () => void }> {
  const server = createServer((req, res) => {
    const name = basename(req.url ?? '');
    readFile(join(FILES, 'pages', name)).then(
      (body) => { res.writeHead(200, { 'content-type': name.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8' }).end(body); },
      () => { res.writeHead(404).end(); },
    );
  });
  await new Promise<void>((ok) => { server.listen(0, '127.0.0.1', ok); });
  const at = server.address();
  const port = typeof at === 'object' && at !== null ? at.port : 0;
  return { dir: FILES, pages: `http://127.0.0.1:${String(port)}`, close: () => { server.close(); } };
}

const NOW = Date.now();
const SIZES = ['1400x900', '1100x820', '800x820'] as const;
const THEMES = ['light', 'dark'] as const;

const id = (page: Page, testId: string) => page.getByTestId(testId);
const narrowOf = (size: string) => Number(size.split('x')[0]) < 900;

for (const theme of THEMES) {
  for (const size of SIZES) {
    const w = size.split('x')[0] ?? '';
    test(`artifacts/library: every tab of the folders page (${w}, ${theme})`, async () => {
      const real = await realFiles();
      const core = new FakeCore(libraryWorld(theme, NOW, false, real) as never);
      // the cards' pictures: made by main in a cache of this run's (the fake core's thumbs_dir)
      const s = await launchDesktop({ core, route: 'artifacts', size, env: { BISE_HARNESS_THUMBS_DIR: test.info().outputPath('thumbs') } });
      const page = s.page;
      // the window's size: the harness's own is fixed, the viewport is the page's
      await page.setViewportSize({ width: Number(w), height: Number(size.split('x')[1]) });
      const shot = async (tab: string) => {
        await page.waitForTimeout(250);
        await page.screenshot({ path: test.info().outputPath(`lib-${tab}-${w}-${theme}.png`) });
      };
      // the column, or under 900 the crumb that opens it
      const go = async (testId: string) => {
        if (narrowOf(size)) {
          await id(page, 'artifacts.fold').click();
          await id(page, 'artifacts.fold.pop').getByTestId(testId).click();
        } else await id(page, testId).click();
      };
      try {
        await expect(id(page, 'artifacts.lead')).toContainText(library.say);
        await expect(id(page, 'artifacts.tiles')).toBeVisible();
        // the bims still beside the lead, drawn (the vignette, no card: designer's lead rule)
        if (Number(w) > 800) expect(await page.locator('.art-vignette img.art-hero-still:visible').evaluate((i) => (i as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
        await shot('home');

        if (narrowOf(size)) {
          await id(page, 'artifacts.fold').click();
          await expect(id(page, 'artifacts.fold.pop')).toContainText('desktop app');
          await shot('fold-open');
          await page.keyboard.press('Escape');
        }

        // the scope at the search, then one project: the folders say 'n of m'
        await id(page, 'artifacts.projects').click();
        await expect(id(page, 'artifacts.projects.menu')).toContainText('ai-docs');
        await shot('scope');
        await id(page, `artifacts.projects.${P.ai}`).click();
        await expect(id(page, 'artifacts.lead')).toContainText('ai-docs');
        await shot('one-project');
        await id(page, 'artifacts.projects.clear').click();

        // a theme: its task tiles, then its cards
        await go('artifacts.col.f.f-desktop00');
        await expect(id(page, 'artifacts.tasks')).toBeVisible();
        await shot('theme');

        // a task's folder, its menu, the merge picker, the delete dialog
        await go('artifacts.col.f.f-agentview');
        await expect(id(page, 'artifacts.head')).toContainText('agent view');
        await shot('task');
        // art-grid's tabs: a card hovered (its marks), the stack open with a chip on, the ☰ list
        const card0 = page.locator('[data-testid^="artifacts.grid.card."]').first();
        await card0.hover();
        await shot('card-hover');
        // one click opens it (ba2cb2d60); a double click's second click opens a sheet item
        await page.locator('[data-testid^="artifacts.grid.card.stack:"]').first().click();
        await expect(id(page, 'artifacts.sheet')).toBeVisible();
        await page.locator('[data-testid^="artifacts.sheet.chip."]').nth(1).click();
        await shot('stack-open');
        // esc closes the chip, then the stack; one esc more would go up a folder: back to the task to be sure
        for (let i = 0; i < 3 && await id(page, 'artifacts.sheet').isVisible(); i++) await page.keyboard.press('Escape');
        await expect(id(page, 'artifacts.sheet')).toBeHidden();
        await go('artifacts.col.f.f-agentview');
        await expect(id(page, 'artifacts.head')).toContainText('agent view');
        await id(page, 'artifacts.view.list').click();
        await shot('list');
        await id(page, 'artifacts.view.grid').click();
        await id(page, 'artifacts.head.more').click();
        await expect(id(page, 'artifacts.fmenu')).toContainText(library.menu_merge);
        await shot('folder-menu');
        await id(page, 'artifacts.fmenu.merge').click();
        await expect(id(page, 'artifacts.merge')).toBeVisible();
        await shot('merge');
        await page.keyboard.press('Escape');
        await id(page, 'artifacts.head.more').click();
        await id(page, 'artifacts.fmenu.delete').click();
        await expect(id(page, 'artifacts.delete.go')).toBeVisible();
        await shot('delete');
        await id(page, 'artifacts.delete.cancel').click();

        // the m picker on the first card, then typing
        // ⌘-click picks without opening (a plain click opens it, ba2cb2d60)
        const first = page.locator('[data-testid="artifacts.grid"] [data-row]').first();
        await first.click({ modifiers: ['Meta'] });
        await page.keyboard.press('m');
        await expect(id(page, 'artifacts.move')).toContainText(library.all_folders);
        await shot('move');
        await id(page, 'artifacts.move.field').fill('pa');
        await expect(id(page, 'artifacts.move.new')).toBeVisible();
        await shot('move-typing');
        await page.keyboard.press('Escape');

        // a card's right-click menu; three picked and the bar
        await first.click({ button: 'right' });
        await expect(id(page, 'artifacts.menu')).toContainText(library.menu_move);
        await shot('card-menu');
        await page.keyboard.press('Escape');
        const cards = page.locator('[data-testid="artifacts.grid"] [data-row]');
        // the picks of the m picker go first (its esc, the bar's esc), then three ⌘-clicks
        if (await id(page, 'artifacts.selbar.esc').isVisible()) await id(page, 'artifacts.selbar.esc').click();
        await cards.nth(0).click({ modifiers: ['Meta'] });
        await cards.nth(1).click({ modifiers: ['Meta'] });
        await cards.nth(2).click({ modifiers: ['Meta'] });
        await expect(id(page, 'artifacts.selbar')).toContainText(library.picked({ n: 3 }));
        await shot('picked');
        await page.keyboard.press('Escape');

        // a new folder in the column, inline
        if (!narrowOf(size)) {
          await id(page, 'artifacts.col.new').click();
          await expect(id(page, 'artifacts.col.field')).toBeFocused();
          await shot('new-folder');
          await page.keyboard.press('Escape');
        }

        // unfiled; a folder he just made, empty
        await go('artifacts.col.unfiled');
        await expect(id(page, 'artifacts.head')).toContainText(library.unfiled_say);
        await shot('unfiled');
        await go('artifacts.col.f.f-offre0000');
        await expect(id(page, 'artifacts.none')).toContainText(library.empty_folder_title);
        await shot('empty-folder');

        // search across folders, and nothing found
        await id(page, 'artifacts.search.input').fill('dark');
        await expect(id(page, 'artifacts.results.head')).toContainText('"dark"');
        await shot('search');
        await id(page, 'artifacts.search.input').fill('pitch v3');
        await expect(id(page, 'artifacts.nothing')).toContainText('bise pitch investisseurs');
        await shot('nothing-found');
      } finally {
        await s.close();
        real.close();
      }
    });
  }
}

for (const theme of THEMES) {
  test(`artifacts/library: the first run says what fills it (${theme})`, async () => {
    const core = new FakeCore(libraryWorld(theme, NOW, true) as never);
    const s = await launchDesktop({ core, route: 'artifacts', size: '1100x820' });
    try {
      await s.page.setViewportSize({ width: 1100, height: 820 });
      await expect(s.page.getByTestId('artifacts.empty')).toContainText(library.first_title);
      await s.page.screenshot({ path: test.info().outputPath(`lib-first-run-1100-${theme}.png`) });
    } finally {
      await s.close();
    }
  });
}
