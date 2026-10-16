// inbox/answer-rows-real · his inbox picks leave a row (ambient-lead m_22128, his try ad753852: «
// je ne vois pas d'élément dans l'historique qui correspond »). Owner: amb-home.
// The new app on the REAL core over the throwaway world (../world.ts; tests/checks/real.sh runs it).
// Each case answers one of the world's cards from the inbox block docked over a thread (a click,
// a digit after ⌘I, words in the composer), then reads the row his answer left where the window is
// after it: the same thread for a card of that project; for another project's card (or from bise's
// view) the asking project's main thread, where the window went (answer-in-thread A), its row
// saying 'answered from …'; and the hub's rows in the asker's thread. Nothing in bise's thread.
import path from 'node:path';
import { test, expect, type Session } from '../../harness';
import { hubOf, launchOn, realWorld, type World } from '../world';

import { thread } from '../../../src/proto/words_thread.gen';
const T = {
  field: '[data-testid="composer.field"]',
  list: '[data-testid="thread.list"]',
  block: '[data-testid="inbox.block"]',
};

const dirOf = (w: World, project: string): string => path.basename(path.dirname(hubOf(w, project).sock));

/** The thread's rows that hold the words, 'testid: text', each row once ('thread.<kind>.<n>', never its parts). */
async function rowsWith(s: Session, words: string): Promise<string[]> {
  return s.page.evaluate((w) => {
    const list = document.querySelector('[data-testid="thread.list"]');
    if (list === null) return ['(no thread list)'];
    return Array.from(list.querySelectorAll<HTMLElement>('[data-testid^="thread."]'))
      .filter((el) => /^thread\.[a-z]+\.\d+$/u.test(el.dataset['testid'] ?? '') && el.textContent.includes(w))
      .map((el) => `${el.dataset['testid'] ?? ''}: ${el.textContent.replace(/\s+/gu, ' ').trim().slice(0, 160)}`);
  }, words);
}

/** Opens a thread and waits for its rows to hold the words (the hub's row, written by the step). */
async function rowsIn(w: World, route: string, words: string): Promise<string[]> {
  const s = await launchOn(w, route, T.field);
  try {
    await expect(s.page.locator(T.list)).toContainText(words, { timeout: 20_000 });
    return await rowsWith(s, words);
  } finally {
    await s.close();
  }
}

/** Opens a thread, waits for it to draw, and gives the rows that hold the words (none: []). */
async function rowsWith2(w: World, route: string, words: string): Promise<string[]> {
  const s = await launchOn(w, route, T.field);
  try {
    await expect(s.page.locator(T.list)).toBeVisible({ timeout: 20_000 });
    await s.page.waitForTimeout(1500);
    return await rowsWith(s, words);
  } finally {
    await s.close();
  }
}

type How = 'click' | 'digit' | 'words';

/** Answers the item asking `question` from the block over `route`'s thread; the rows there right after. */
async function answer(w: World, route: string, a: { question: string; how: How; n: number; words: string; cmdI?: boolean; shot: string }): Promise<string[]> {
  const s = await launchOn(w, route, T.field);
  try {
    const { page } = s;
    const block = page.locator(T.block);
    await expect(block, 'the inbox block over the composer').toBeVisible({ timeout: 30_000 });
    // ⌘I opens the block's first item; folded, '+ N more' walks to the next one, open in place
    if (a.cmdI === true) {
      // ⌘I is the app menu's accelerator, and the harness never makes the app active, so a pressed
      // key never reaches the menu: run the item's click as NSMenu does on the key (like inbox/cmd-i)
      const ran = await s.app.evaluate(({ Menu, BrowserWindow }) => {
        const find = (items: Electron.MenuItem[]): Electron.MenuItem | undefined => {
          for (const it of items) {
            if (it.accelerator === 'CmdOrCtrl+I') return it;
            const sub = it.submenu ? find(it.submenu.items) : undefined;
            if (sub) return sub;
          }
          return undefined;
        };
        const it = find(Menu.getApplicationMenu()?.items ?? []);
        if (!it) return '';
        const click = it.click as unknown as (e: unknown, w: Electron.BrowserWindow | null, c: unknown) => void;
        click.call(it, {}, BrowserWindow.getFocusedWindow(), undefined);
        return it.label;
      });
      expect(ran, 'the app menu has an item on ⌘I').not.toBe('');
      await expect(page.locator(`${T.block}[data-open]`), '⌘I opens an item').toBeVisible({ timeout: 5_000 });
    }
    const open = block.locator('[data-testid^="inbox.block.open."]');
    const row = block.locator('[data-testid^="inbox.block.row."]', { hasText: a.question });
    if ((await row.count()) > 0) await row.first().click();
    for (let i = 0; i < 12 && !((await open.count()) > 0 && ((await open.first().textContent()) ?? '').includes(a.question)); i++) {
      await block.locator('[data-testid="inbox.block.more"]').click({ timeout: 5_000 });
      await page.waitForTimeout(300);
    }
    await expect(open, 'the item opens in place').toContainText(a.question, { timeout: 10_000 });
    if (a.how === 'click') {
      // the world's main may still be answering a peer's card while the block opens: a row added
      // above can move the option under the pointer between Playwright's aim and its press. The
      // card leaves the block when the click takes; one more click if it did not (annotated).
      const opt = open.locator(`[data-testid$=".opt.${String(a.n)}"]`).first();
      await opt.click();
      try {
        await expect(open, 'the card leaves the block').not.toContainText(a.question, { timeout: 5_000 });
      } catch {
        test.info().annotations.push({ type: 'retry-click', description: `${a.shot}: the first click did not take` });
        if ((await open.count()) > 0 && ((await open.first().textContent()) ?? '').includes(a.question)) await opt.click();
      }
    } else if (a.how === 'digit') await page.keyboard.press(String(a.n));
    else {
      await page.locator(T.field).first().click();
      await page.keyboard.type(a.words);
      await page.keyboard.press('Enter');
    }
    try {
      await expect(page.locator(T.list), 'his answer shows where he is').toContainText(a.words, { timeout: 20_000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath(`${a.shot}.png`) });
    }
    // answer-in-thread A: from another project's thread (or bise's), the window went to the asking
    // project's main thread; his answer there says where he made it (designer signs its look)
    const aside = page.locator('[data-testid^="thread.approval."]', { hasText: 'answered from' }).filter({ hasText: a.words }).first();
    if ((await aside.count()) > 0) {
      // once the thread has a row, this one too, the empty centre goes (designer m_22749)
      await expect(page.locator('[data-testid="thread.first"]'), 'no first-run centre over his row').toHaveCount(0);
      for (const scheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme: scheme });
        await page.waitForTimeout(200);
        await page.screenshot({ path: test.info().outputPath(`${a.shot}-${scheme}.png`) });
        await aside.screenshot({ path: test.info().outputPath(`${a.shot}-row-${scheme}.png`) });
      }
      await page.emulateMedia({ colorScheme: null });
      // the window's row is the window's own (no hub has it): it comes back after a reload
      const rows = await rowsWith(s, a.words);
      await page.reload();
      await expect
        .poll(async () => (await rowsWith(s, a.words)).filter((r) => r.startsWith('thread.approval.')), { message: "his row and its 'answered from' after a reload, once", timeout: 20_000 })
        .toEqual(rows.filter((r) => r.startsWith('thread.approval.')));
      return rows;
    }
    return await rowsWith(s, a.words);
  } finally {
    await s.close();
  }
}

const one = (rows: string[], prefix: string, words: string[]): void => {
  const hit = rows.filter((r) => r.startsWith(prefix));
  expect(hit, `one ${prefix} row in ${JSON.stringify(rows)}`).toHaveLength(1);
  for (const w of words) expect(hit[0]).toContain(w);
};

test('inbox/answer-rows-real: an inbox pick leaves his row where he is and in the asker\'s thread', async () => {
  test.setTimeout(600_000);
  const w = realWorld();
  const home = dirOf(w, 'bise');
  const tele = dirOf(w, 'telemetry');
  const shop = dirOf(w, 'shop');

  // 1. main's own card, from its project's thread, by a click: the hub's row, the option's words
  const c1 = await answer(w, `project/${tele}`, { question: 'which window for the p99 alert', how: 'click', n: 1, words: '5 min', shot: 'c1-telemetry' });
  one(c1, 'thread.approval.', [thread.answered_to({ who: 'bise' }), '5 min']);
  expect(c1.join(' '), "made in that very thread: the time alone").not.toContain('answered from');

  // 2. an agent's card (gift-ui, shop), from bise's thread, ⌘I then a digit: the window goes to
  // shop's main thread, his row there says 'answered from bise', the option's words never the
  // digit; nothing in bise's thread; the hub's row in gift-ui's
  const c2 = await answer(w, `project/${home}`, { question: 'gift cards: show the balance', how: 'digit', n: 2, words: 'only at checkout', cmdI: true, shot: 'c2-bise' });
  one(c2, 'thread.approval.', [thread.answered_to({ who: 'gift-ui' }), 'only at checkout', thread.from_line({ place: 'bise' })]);
  expect(await rowsWith2(w, `project/${home}`, 'only at checkout'), "nothing in bise's thread").toEqual([]);
  one(await rowsIn(w, `agent/${shop}/gift-ui`, 'only at checkout'), 'thread.approval.', ['you answered', 'only at checkout']);

  // 3. main's card in shop, from another project's agent thread, by words: the window goes to
  // shop's main thread, his row there says 'answered from p99'
  const said = `not yet, the e2e first ${String(Date.now() % 100000)}`;
  const c3 = await answer(w, `agent/${tele}/p99`, { question: 'merge checkout into main', how: 'words', n: 0, words: said, shot: 'c3-p99' });
  one(c3, 'thread.approval.', [thread.answered_to({ who: 'bise' }), said, thread.from_line({ place: 'p99' })]);
});
