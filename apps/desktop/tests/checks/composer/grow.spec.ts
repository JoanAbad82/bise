// composer/grow · his bug (m_45466, 2026-10-26): answering a card with 2 attachments and a long
// numbered text, the composer grew DOWN past the window's bottom and pushed the whole top of the
// window out (the bar, the sidebar's head). Owner: composer-grow.
// On the scripted core (fixture world), real keys only. He opens acme's question 'which bench?'
// (it takes his words: the composer's reply head), pastes 2 long texts (2 attachment rows) and types
// a long numbered text, in the thread's docked composer at 1280x720, 1280x800 and 1440x900, and in
// the floating composer (a page that is no thread) at 1280x720. Passes when: no box of the frame
// scrolled and the window's bar is at its top, the composer is inside the window (its top at 0 or
// below, its bottom at the window's bottom or above), and his text scrolls inside the field (the
// field is shorter than its text, the caret's line is in the field).
// Red before the fix (1280x720, docked): the shell scrolled 40 px (the bar at -40), the composer's
// bottom at 784 in a 720 window.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect, type Session } from '../../harness';

const FIXTURES = path.join(__dirname, '../fixtures');
const PROTO = path.join(__dirname, '../../../../../rust/proto/fixtures');
/** The fixture world (FakeCore's default), without its voice answer to card 9: its 1.5 s 'heard
 *  "the first one"' answers the question under his words and closes it while he types. */
const world = (): never[] =>
  ['core_ev.jsonl', 'hub_ev.jsonl']
    .flatMap((f) => readFileSync(path.join(PROTO, f), 'utf8').split('\n').filter((l) => l.trim() !== ''))
    .map((l) => JSON.parse(l) as { ev?: string })
    .filter((e) => e.ev !== 'broken' && e.ev !== 'voice_answer') as never[];
const LINES = [
  "1. J'aime bien D1, mais je pense qu'on pourrait afficher ces infos que quand j'appuie sur la touche option (pour tous les 4 éléments du menu) ou au hover (un par un dans ce cas là)",
  '2. Je garderais la sidebar à droite du chat, même quand un panel est ouvert. le panel s’ouvre à droite de la sidebar.',
  "3. J'aime aussi beaucoup cette option où les items du menu vont dans le header quand il n'y a plus de place!",
  '4. Pour le contenu lui-même du menu, j’aime la proposition (celle qui est faite dans option A)',
];

type Place = { name: 'docked' | 'float'; route: string; root: string; composer: string };
const DOCKED: Place = { name: 'docked', route: 'bise', root: '.th-screen', composer: '.th-screen [data-testid="composer"]' };
const FLOAT: Place = { name: 'float', route: 'scheduled', root: '[data-testid="composer.float"]', composer: '[data-testid="composer.float"]' };

type Box = { top: number; bottom: number; left: number; right: number };
type Fit = { win: number; barTop: number; scrolled: string[]; top: number; bottom: number; field: { client: number; scroll: number }; caretBottom: number; fieldBottom: number; opts: Box | null; card: Box | null; plus: Box | null; send: Box | null; more: string | null };

/** Where the bar, the composer and its field are, and every box of the frame that scrolled although it never should. */
const fit = (page: Page, p: Place): Promise<Fit> =>
  page.evaluate((p) => {
    const q = (s: string): HTMLElement => {
      const e = document.querySelector<HTMLElement>(s);
      if (e === null) throw new Error(`no ${s}`);
      return e;
    };
    const composer = q(p.composer).getBoundingClientRect();
    const field = q(`${p.root} [data-testid="composer.field"]`);
    const sel = getSelection();
    const caret = sel !== null && sel.rangeCount > 0 ? sel.getRangeAt(0).getBoundingClientRect() : null;
    const frame = ['html', 'body', '.app-shell', '.app-frame', '.b-main', '.th-screen'];
    const box = (s: string): { top: number; bottom: number; left: number; right: number } | null => {
      const r = document.querySelector(s)?.getBoundingClientRect();
      return r === undefined ? null : { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    };
    return {
      win: window.innerHeight,
      barTop: q('[data-testid="app.bar"]').getBoundingClientRect().top,
      scrolled: frame.filter((s) => (document.querySelector(s)?.scrollTop ?? 0) !== 0),
      top: composer.top,
      bottom: composer.bottom,
      field: { client: field.clientHeight, scroll: field.scrollHeight },
      caretBottom: caret?.bottom ?? -1,
      fieldBottom: field.getBoundingClientRect().bottom,
      // the float's question options, its bottom row ('+' and send) and the cut list's '+ N more'
      opts: box(`${p.root} .inbox-block-open .ic-opts`),
      card: box(`${p.root} .inbox-block-open .ic`),
      plus: box(`${p.root} .b-composer .cmp-plus`),
      send: box(`${p.root} [data-testid="composer.send"]`),
      more: (() => {
        const m = document.querySelector<HTMLElement>(`${p.root} [data-testid="composer.attach.more"]`);
        return m !== null && m.offsetHeight > 0 ? m.textContent : null;
      })(),
    };
  }, p);

/** The app on the fixture world, its window at w x h. */
async function open(p: Place, w: number, h: number): Promise<Session> {
  const s = await launchDesktop({ core: new FakeCore(world()), route: p.route, env: { BISE_DESKTOP_TEST_CLIPBOARD: path.join(FIXTURES, '200-lines.txt') } });
  await s.app.evaluate(({ BrowserWindow }, size) => {
    BrowserWindow.getAllWindows().find((b) => b.webContents.getURL().includes('surface=window'))?.setContentSize(size.w, size.h);
  }, { w, h });
  await expect.poll(() => s.page.evaluate(() => [window.innerWidth, window.innerHeight]), { timeout: 5000 }).toEqual([w, h]);
  return s;
}

/** where, the window, how many pastes (attachment rows) */
const CASES: [Place, number, number, number][] = [[DOCKED, 1280, 720, 2], [DOCKED, 1280, 800, 2], [DOCKED, 1440, 900, 2], [FLOAT, 1280, 720, 2], [FLOAT, 1280, 720, 4]];

for (const [p, w, h, pastes] of CASES) {
  test(`composer/grow ${p.name} ${String(w)}x${String(h)}: long text + ${String(pastes)} attachments + reply head grow up, the field scrolls, the window's top stays`, async () => {
    test.setTimeout(90_000);
    const s = await open(p, w, h);
    try {
      const { page } = s;
      const field = page.locator(`${p.root} [data-testid="composer.field"]`);
      const answering = page.locator(`${p.root} [data-testid="composer.box"][data-answering]`);
      await expect(field).toBeVisible({ timeout: 15_000 });
      if (p.name === 'docked') {
        // bise's thread lists every project's items: his click on the question's row opens it in place
        const row = page.locator('.th-screen').getByRole('button', { name: /which bench\?/u });
        await row.first().click({ timeout: 15_000 });
      } else {
        // the float: focused, the inbox's own key opens the question over its head
        await field.click();
        const n = await page.getByRole('button', { name: /which bench\?/u }).first().textContent({ timeout: 15_000 }).catch(() => null);
        await page.keyboard.press(`Control+${(n ?? '2').trim().charAt(0)}`);
      }
      await expect(answering, 'the composer answers the question (its reply head)').toBeVisible({ timeout: 5000 });
      await field.click();
      // each paste of the same long text is a new attachment row (a chip pasted again is not: new text each time would be)
      for (let i = 0; i < pastes; i++) await page.keyboard.press('Meta+V');
      await expect(page.locator(`${p.root} [data-testid^="composer.attach."][role="listitem"]`), 'one attachment row per paste').toHaveCount(pastes);
      // 12 long lines: past the field's cap (40% of the window) at 1440 too
      for (const [i, line] of [...LINES, ...LINES, ...LINES].entries()) {
        if (i > 0) await page.keyboard.press('Shift+Enter');
        await page.keyboard.insertText(line);
      }
      await page.waitForTimeout(300);
      const f = await fit(page, p);
      await page.screenshot({ path: test.info().outputPath(`composer-grow-${p.name}-${String(w)}x${String(h)}-${String(pastes)}.png`) });
      test.info().annotations.push({ type: 'fit', description: JSON.stringify(f) });
      expect.soft(f.scrolled, 'no box of the frame scrolled (the bar, the sidebar stay in view)').toEqual([]);
      expect.soft(f.barTop, "the window's bar is at its top").toBe(0);
      expect.soft(f.bottom, "the composer's bottom is at the window's bottom or above").toBeLessThanOrEqual(f.win + 0.5);
      expect.soft(f.top, 'the composer grew up, inside the window').toBeGreaterThanOrEqual(0);
      expect.soft(f.field.scroll, 'his text is longer than the field: it scrolls inside').toBeGreaterThan(f.field.client);
      expect.soft(f.caretBottom, "the caret's line is in the field").toBeLessThanOrEqual(f.fieldBottom + 1);
      if (p.name === 'float') {
        // designer m_45666: the question's options never scroll out; '+' at the left and send at the
        // right, on one row under his words; 4 lines kept, then the list cut to 2 rows + '+ N more'
        expect.soft(f.opts !== null && f.card !== null && f.opts.top >= f.card.top - 0.5 && f.opts.bottom <= f.card.bottom + 0.5 && f.card.top >= f.top, "the question's options are whole in its card, in the float").toBe(true);
        expect.soft(f.plus !== null && f.send !== null && Math.abs(f.plus.top - f.send.top) < 8 && f.plus.top >= f.fieldBottom && f.plus.right < f.send.left, "'+' and send on one row under his words, '+' at the left").toBe(true);
        expect.soft(f.field.client, 'his field keeps 4 lines at least').toBeGreaterThanOrEqual(4 * 22 - 1);
        expect.soft(f.more, "the list cut to 2 rows says how many it hid").toBe(pastes > 2 ? `+ ${String(pastes - 2)} more` : null);
      }
    } finally {
      await s.close();
    }
  });
}
