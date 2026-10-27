// artifacts/library · the artifacts page in folders (artifacts-folders brief part 4, page
// artifacts-gallery v7): the shots the designer agent signs, every tab of the page, at 1400, 1100
// and 800, light and dark, on FakeCore with the fake library (library-world.ts). Passes when, at
// each size and theme: the column (or, under 900, the crumb) lists the folders; a theme opens onto
// its task tiles; a task's folder, unfiled, the m picker (typing filters and offers '+ new folder'),
// a card's right-click menu, three picked with the selection bar, a folder's menu, the merge picker,
// the delete dialog, the inline new folder, a search grouped by folder, a search that finds
// nothing, the scope menu, one project ('14 of 74'), and the empty pages each show; the selection
// bar and the undo toast after a move sit on the floating composer's axis, 16 over it. It sends
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
      // the library's folders: in bise fait mac the sidebar's library (artifacts.lib, Sidebar.tsx)
      // when shown, else the page's column; under 900 the crumb that opens the column
      const colId = async (testId: string): Promise<string> =>
        (await id(page, 'artifacts.lib').isVisible()) ? testId.replace(/^artifacts\.col\./, 'artifacts.lib.') : testId;
      const go = async (testId: string) => {
        if (narrowOf(size)) {
          await id(page, 'artifacts.fold').click();
          await id(page, 'artifacts.fold.pop').getByTestId(testId).click();
        } else await id(page, await colId(testId)).click();
      };
      // the place's name is the window bar's crumb now, never the head's (Screen.tsx, designer's
      // rule on #5): the screen's title path says where he is
      const at = (name: string) => expect(id(page, 'artifacts.screen')).toHaveAttribute('data-title-path', new RegExp(name));
      try {
        await expect(id(page, 'artifacts.lead')).toContainText(library.say);
        await expect(id(page, 'artifacts.tiles')).toBeVisible();
        // the bims beside the lead, drawn: the page banner's vignette (3ad63b876), its live scene
        // drawn (banner.live.artifacts[data-drawn]) or, with no WebGL or reduced motion, its still
        // decoded (naturalWidth > 0), the theme's one shown (designer's lead rule: no card)
        if (Number(w) > 800)
          await expect
            .poll(() => id(page, 'artifacts.lead.visual').evaluate((el) => {
              if (el.querySelector('[data-testid="banner.live.artifacts"][data-drawn]') !== null) return 'live';
              const still = Array.from(el.querySelectorAll('img')).find((i) => i.offsetWidth > 0 && i.closest('.b-live') === null);
              return still !== undefined && still.naturalWidth > 0 ? 'still' : 'none';
            }), { message: 'the banner draws its vignette', timeout: 10_000 })
            .not.toBe('none');
        await shot('home');

        if (narrowOf(size)) {
          await id(page, 'artifacts.fold').click();
          await expect(id(page, 'artifacts.fold.pop')).toContainText('desktop app');
          await shot('fold-open');
          await page.keyboard.press('Escape');
        }

        // the scope at the search, then one project: the folders say 'n of m'
        // bise fait mac's toolbar (Toolbar.tsx): the scope is 'artifacts.projects' while the row has
        // room, else it folds with the kinds into one Filters menu ('artifacts.toolbar.fold')
        const folded = async (): Promise<boolean> => (await id(page, 'artifacts.toolbar').getAttribute('data-folded')) !== null;
        const narrowBar = await folded();
        const scopeId = narrowBar ? 'artifacts.toolbar.fold' : 'artifacts.projects';
        const scopeRow = (p: string): string => (narrowBar ? `artifacts.toolbar.fold.p.${p}` : `artifacts.projects.${p}`);
        await id(page, scopeId).click();
        await expect(id(page, `${scopeId}.menu`)).toContainText('ai-docs');
        await shot('scope');
        await id(page, scopeRow(P.ai)).click();
        await expect(id(page, 'artifacts.lead')).toContainText('ai-docs');
        await shot('one-project');
        // back to every project: the scope's × while the row has room, else the menu's 'all'
        if (await id(page, 'artifacts.projects.clear').isVisible()) await id(page, 'artifacts.projects.clear').click();
        else {
          await id(page, 'artifacts.toolbar.fold').click();
          await id(page, 'artifacts.toolbar.fold.p.all').click();
        }
        await expect(id(page, 'artifacts.lead')).not.toContainText('ai-docs');

        // a theme: its task tiles, then its cards
        await go('artifacts.col.f.f-desktop00');
        await expect(id(page, 'artifacts.tasks')).toBeVisible();
        await shot('theme');

        // a task's folder, its menu, the merge picker, the delete dialog
        await go('artifacts.col.f.f-agentview');
        await at('agent view');
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
        await at('agent view');
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
          await id(page, await colId('artifacts.col.new')).click();
          await expect(id(page, await colId('artifacts.col.field'))).toBeFocused();
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
        await id(page, 'artifacts.search.input').fill('zzqx');
        await expect(id(page, 'artifacts.nothing')).toContainText(library.nothing_matches({ q: 'zzqx' }));
        await shot('nothing-found');

        // last (it moves three cards): the bar and the undo toast on the floating composer's axis,
        // within 1 px, 16 over its top (selbar-float; ui-review m_48524: the toast sat 13.5 px right)
        // measured once its rise is over (the bar's 8 px, the toast's b-rise): their resting place
        const axis = async (testId: string) => {
          await id(page, testId).evaluate(async (el) => {
            await Promise.all(el.getAnimations({ subtree: true }).filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished));
          });
          const b = await id(page, testId).boundingBox();
          if (b === null) throw new Error(`${testId}: no box`);
          return { x: b.x + b.width / 2, bottom: b.y + b.height, top: b.y };
        };
        // a folder with cards (the page is still on the empty one)
        await id(page, 'artifacts.search.input').fill('');
        await go('artifacts.col.f.f-agentview');
        await expect(cards.nth(2)).toBeVisible();
        await cards.nth(0).click({ modifiers: ['Meta'] });
        await cards.nth(1).click({ modifiers: ['Meta'] });
        await cards.nth(2).click({ modifiers: ['Meta'] });
        await expect(id(page, 'artifacts.selbar')).toBeVisible();
        const pill = await axis('composer.float');
        const bar = await axis('artifacts.selbar');
        expect(Math.abs(bar.x - pill.x), 'the bar on the pill axis').toBeLessThanOrEqual(1);
        expect(pill.top - bar.bottom, 'the bar 16 over the pill').toBeGreaterThanOrEqual(15);
        await page.keyboard.press('m');
        await id(page, 'artifacts.move.field').fill('bims');
        await page.keyboard.press('Enter');
        await expect(id(page, 'artifacts.toast')).toBeVisible();
        const toast = await axis('artifacts.toast');
        const boxes = await id(page, 'artifacts.toast').evaluate((el) => {
          const r = (e: Element | null) => { const b = e?.getBoundingClientRect(); return b === undefined ? null : [b.x, b.width]; };
          return JSON.stringify({ toast: r(el), wrap: r(el.parentElement), wrapCss: el.parentElement === null ? null : getComputedStyle(el.parentElement).width });
        });
        expect(Math.abs(toast.x - pill.x), `the undo toast on the pill axis (${String(pill.x)}; ${boxes})`).toBeLessThanOrEqual(1);
        expect(pill.top - toast.bottom, 'the undo toast 16 over the pill').toBeGreaterThanOrEqual(15);
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
