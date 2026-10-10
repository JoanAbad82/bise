// gate/right · candidate f640424d's rows (ambient-lead m_16361), packed app off-screen, rich world on amb-tools'
// seeds (63eb6c0a bar seeds + 7335fde7 messages-right seeds):
//   MSGRIGHT  his rows right in a bubble, agents left, at 1100 + 600, light + dark: the quoted message (telemetry
//             main), the steered one (telemetry · dashboards), the queued one (telemetry · ingest: dashed, no
//             edit/drop); 4 px within a run, the bubble's corners 16/16/6/16, '✓ you answered' heads right;
//   TYPE      focus on no field (the thread list clicked): 'a', 'é', a text paste, an image paste each land in the
//             composer, caret at the end, the thread doesn't scroll; ⌘K, arrows and esc are left alone;
//   INBOXDRAFT a draft per inbox item survives a reload; ctrl+o in the inbox opens a long ask;
//   FOLDS2    the thinking row ('thought …') and '▸ 1 other step' in dashboards' thread, each opened by a click;
//   P99ROW    the docked 'answered … for you' row at the bottom of telemetry's thread.
// Out: BISE_RIGHT_OUT/index.md (appended) + shots. A row is green only after a person looked at its shots.
import { appendFileSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { FakeHelper, test, type Session } from '../../harness';
import { launchReal, realWorld, worldSay } from '../world';
import { sleep } from '../native/world';

const OUT = process.env['BISE_RIGHT_OUT'] ?? path.join(os.homedir(), '.bise', 'gate', 'try-gate', 'right');
const FIELD = '[data-testid="composer.field"]';
const PNG = path.join(__dirname, '../fixtures/checker.png');
const ONLY = (process.env['BISE_RIGHT_ROWS'] ?? '').split(',').map((x) => x.trim()).filter((x) => x !== '');
const on = (r: string): boolean => ONLY.length === 0 || ONLY.includes(r);

async function go(s: Session, route: string): Promise<void> {
  await s.page.evaluate((r) => { (window as unknown as { bise: { openWindow: (r?: string) => void } }).bise.openWindow(r); }, route);
  await sleep(1200);
}

test('gate/right: messages right, type anywhere, inbox drafts + ctrl+o, folds, the p99 row', async () => {
  test.setTimeout(15 * 60_000);
  mkdirSync(OUT, { recursive: true });
  const w = realWorld();
  const helper = new FakeHelper();
  const s = await launchReal(w, { helper });
  const p = s.page;
  const run = Date.now() % 1_000_000;
  const rows: string[] = [];
  const row = (id: string, t: string): void => { rows.push(`| ${id} | ${t.replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`); };
  const shot = async (name: string, pg: Page = p): Promise<void> => { await pg.screenshot({ path: path.join(OUT, `${name}.png`) }).catch(() => undefined); };
  const size = (wd: number): Promise<void> =>
    s.app.evaluate(({ BrowserWindow }, v) => {
      for (const b of BrowserWindow.getAllWindows()) if (b.webContents.getURL().includes('index.html')) b.setContentSize(v, b.getContentSize()[1] ?? 720);
    }, wd);
  const theme = async (t: 'light' | 'dark'): Promise<string> => {
    await go(s, 'settings');
    await p.getByText(new RegExp(`^${t}$`, 'i')).first().click({ timeout: 10_000 }).catch(() => undefined);
    await sleep(800);
    return p.evaluate(() => document.documentElement.getAttribute('data-theme') ?? '');
  };
  const stage = (c: { file?: string; text?: string }): Promise<boolean> =>
    Promise.race([
      s.app.evaluate((_e, a) => (globalThis as unknown as { __biseTestClip?: (x: { file?: string; text?: string }) => Promise<boolean> }).__biseTestClip?.(a) ?? Promise.resolve(false), c),
      sleep(10_000).then(() => false),
    ]);
  try {
    await p.locator(`${FIELD}, [data-testid="setup.skip"]`).first().waitFor({ timeout: 30_000 }).catch(() => undefined);
    const skip = p.getByTestId('setup.skip');
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await sleep(2500);
    const ids: Record<string, string> = {};
    for (const id of await p.locator('[data-testid^="app.sidebar.project."]').evaluateAll((es) => es.map((e) => e.getAttribute('data-testid') ?? ''))) {
      const name = (await p.getByTestId(id).innerText().catch(() => '')).trim().split(/\s/)[0] ?? '';
      if (name !== '' && ids[name] === undefined) ids[name] = id.slice('app.sidebar.project.'.length).split('.')[0] ?? '';
    }
    const tel = ids['telemetry'] ?? 'telemetry';
    const shop = ids['shop'] ?? 'shop';

    // MSGRIGHT: the three seeded kinds, at two widths and two themes
    if (on('MSGRIGHT')) {
      const measure = (): Promise<string> =>
        p.evaluate(() => {
          const list = document.querySelector('[data-testid="thread.list"]')?.getBoundingClientRect();
          const you = Array.from(document.querySelectorAll<HTMLElement>('[data-testid^="thread.you."]')).filter((e) => /^thread\.you\.\d+$/.test(e.dataset['testid'] ?? ''));
          const bubbles = you.map((e) => e.querySelector<HTMLElement>('.th-bubble')).filter((b): b is HTMLElement => b !== null);
          const last = bubbles[bubbles.length - 1];
          const lr = last?.getBoundingClientRect();
          const agentRow = document.querySelector<HTMLElement>('[data-testid^="thread.text."], .th-row:not([data-side="you"]) .b-text');
          const ar = agentRow?.getBoundingClientRect();
          // gaps between consecutive bubbles of one run (adjacent rows on his side)
          const gaps: number[] = [];
          for (let i = 1; i < bubbles.length; i++) {
            const a = bubbles[i - 1]?.getBoundingClientRect();
            const b = bubbles[i]?.getBoundingClientRect();
            if (a && b && b.top - a.bottom >= 0 && b.top - a.bottom < 30) gaps.push(Math.round(b.top - a.bottom));
          }
          const q = document.querySelector<HTMLElement>('[data-testid^="thread.queued."][data-testid$=".bubble"] .th-bubble');
          const quote = document.querySelector<HTMLElement>('[data-testid*=".quote.1"]');
          const steer = Array.from(document.querySelectorAll<HTMLElement>('[data-testid$=".under"]')).map((u) => u.innerText).find((t) => t.startsWith('steered')) ?? '';
          return JSON.stringify({
            bubbles: bubbles.length,
            lastRightGap: list && lr ? Math.round(list.right - lr.right) : null,
            agentLeftGap: list && ar ? Math.round(ar.left - list.left) : null,
            radius: last ? getComputedStyle(last).borderRadius : '',
            gaps,
            queued: q ? { border: getComputedStyle(q).borderStyle, buttons: q.closest('[data-testid^="thread.queued."]')?.querySelectorAll('button').length ?? 0, under: q.closest('.th-you')?.querySelector('.th-you-under')?.textContent ?? '' } : null,
            quoteInBubble: quote ? quote.closest('.th-bubble') !== null : null,
            steered: steer,
          });
        });
      const views: [string, string][] = [['quoted', `project/${tel}`], ['steered', `agent/${tel}/dashboards`], ['queued', `agent/${tel}/ingest`]];
      for (const t of ['light', 'dark'] as const) {
        const got = await theme(t);
        for (const wd of [1100, 600]) {
          await size(wd);
          for (const [name, route] of views) {
            await go(s, route);
            await sleep(800);
            await shot(`MSGRIGHT-${name}-${String(wd)}-${t}`);
            row(`MSGRIGHT ${name} ${String(wd)} ${t}`, `data-theme ${got}; ${await measure()}`);
          }
        }
      }
      await size(1100);
      await theme('light');
      // '✓ you answered' heads right: shop main (the rich world's answered approval)
      await go(s, `project/${shop}`);
      const head = await p.evaluate(() => {
        const h = Array.from(document.querySelectorAll<HTMLElement>('[data-testid$=".head"]')).find((e) => /you answered/.test(e.innerText));
        const list = document.querySelector('[data-testid="thread.list"]')?.getBoundingClientRect();
        if (!h || !list) return 'no you-answered head';
        const r = h.getBoundingClientRect();
        return `'${h.innerText.trim().slice(0, 60)}': right gap ${String(Math.round(list.right - r.right))} px, left gap ${String(Math.round(r.left - list.left))} px, text-align ${getComputedStyle(h).textAlign}`;
      });
      await shot('MSGRIGHT-answered-head');
      row('MSGRIGHT answered head', head);
    }

    // TYPE: focus on no field, then keys and pastes
    if (on('TYPE')) {
      await go(s, `project/${tel}`);
      const field = p.locator(FIELD);
      const state = (): Promise<string> =>
        p.evaluate(() => {
          // the composer is a ProseMirror contenteditable: its text, and whether the caret sits at its end
          const f = document.querySelector<HTMLElement>('[data-testid="composer.field"]');
          const list = document.querySelector<HTMLElement>('[data-testid="thread.list"]');
          const scroller = list?.closest<HTMLElement>('[data-scroll], .th-scroll') ?? list?.parentElement ?? null;
          const text = f?.textContent ?? '';
          const sel = window.getSelection();
          let caretAtEnd: boolean | null = null;
          if (f && sel && sel.rangeCount > 0 && f.contains(sel.anchorNode)) {
            const r = document.createRange();
            r.selectNodeContents(f);
            r.setEnd(sel.anchorNode as Node, sel.anchorOffset);
            caretAtEnd = r.toString().length === text.length;
          }
          return JSON.stringify({ value: text, caretAtEnd, focused: f !== null && f.contains(document.activeElement), scroll: scroller?.scrollTop ?? -1 });
        });
      const offInput = async (): Promise<void> => {
        await p.getByTestId('thread.list').click({ position: { x: 20, y: 20 } }).catch(() => undefined);
        await p.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); });
        await sleep(200);
      };
      await field.fill('');
      for (const [name, act] of [
        ['a', async () => { await p.keyboard.press('a'); }],
        // 'é' as a French layout sends it: a keydown whose key is 'é' with its text (CDP; Playwright has no such key).
        // A dead key's composition (´ then e) is the OS's: not reachable off-screen
        ['é', async () => {
          const cdp = await p.context().newCDPSession(p);
          await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'é', code: 'Digit2', text: 'é', unmodifiedText: 'é' });
          await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'é', code: 'Digit2' });
          await cdp.detach();
        }],
        ['paste text', async () => { await stage({ text: ` pasted-${String(run)}` }); await p.keyboard.press('Meta+V'); }],
        ['paste image', async () => { await stage({ file: PNG }); await p.keyboard.press('Meta+V'); }],
      ] as const) {
        await offInput();
        const before = await state();
        await act();
        await sleep(600);
        const after = await state();
        const chips = await p.locator('[data-testid^="composer.chip."][data-kind="image"]').count();
        row(`TYPE ${name}`, `before ${before}; after ${after}; image chips ${String(chips)}`);
      }
      await shot('TYPE-1-after');
      // left alone: arrows and esc with focus on no field, ⌘K opens its palette
      await offInput();
      const v0 = await state();
      await p.keyboard.press('ArrowUp');
      await p.keyboard.press('Escape');
      await sleep(300);
      const v1 = await state();
      await p.keyboard.press('Meta+k');
      await sleep(700);
      const palette = await p.locator('[data-testid^="palette"], [role="dialog"]').first().isVisible().catch(() => false);
      await shot('TYPE-2-cmdK');
      await p.keyboard.press('Escape');
      row('TYPE left alone', `arrows + esc off-input: before ${v0}; after ${v1}; ⌘K palette shown ${String(palette)}`);
      await field.fill('');
    }

    // INBOXDRAFT: a draft per item survives a reload; ctrl+o opens a long ask
    if (on('INBOXDRAFT')) {
      const sd = path.join(w.world, 'rich', 'scripts');
      mkdirSync(sd, { recursive: true });
      const k = `long-${String(run)}`;
      const long = [`${k} which plan for the cart?`, ...Array.from({ length: 14 }, (_, i) => `line ${String(i + 1)}: the cart page loads its totals twice when the coupon field is open`), '1. fix totals first 2. ship as is'].join('\\n');
      const tmp = path.join(sd, `.right-${k}.tmp`);
      writeFileSync(tmp, JSON.stringify({ match: `${k}-start`, calls: [{ tool: 'bash', arg: `sb card "$(printf '${long}')"` }], reply: 'Asked you.' }));
      renameSync(tmp, path.join(sd, `right-${k}.json`));
      worldSay('shop', `${k}-start please ask me`);
      await go(s, `project/${shop}`);
      const blk = p.getByTestId('inbox.block');
      // the long ask in front: its row, else ↓ until it is
      let found = false;
      for (let t = 0; t < 60 && !found; t++) {
        await blk.locator('[data-testid^="inbox.block.row."], [data-testid="inbox.block.more"]').first().click().catch(() => undefined);
        for (let i = 0; i < 10 && !found; i++) {
          await sleep(400);
          found = (await p.locator('[data-testid^="inbox.block.open."]').first().innerText().catch(() => '')).includes(k);
          if (!found) await p.keyboard.press('ArrowDown');
        }
        if (!found) { await p.keyboard.press('Escape'); await sleep(1500); }
      }
      if (found) {
        const open = p.locator('[data-testid^="inbox.block.open."]').first();
        const h0 = (await open.boundingBox())?.height ?? 0;
        await shot('INBOXDRAFT-1-long-folded');
        await p.keyboard.press('Control+o');
        await sleep(700);
        const h1 = (await open.boundingBox())?.height ?? 0;
        await shot('INBOXDRAFT-2-ctrl-o');
        const whole = (await open.innerText()).includes('line 14');
        // a second ctrl+o folds it again (7b06587c)
        await p.keyboard.press('Control+o');
        await sleep(700);
        const h2 = (await open.boundingBox())?.height ?? 0;
        await shot('INBOXDRAFT-2b-ctrl-o-again');
        row('INBOXDRAFT ctrl+o', `the long ask's card ${String(Math.round(h0))} px -> ${String(Math.round(h1))} px after ctrl+o ('line 14' shown: ${String(whole)}) -> ${String(Math.round(h2))} px after a second ctrl+o`);
        // a draft for this item, then a reload
        const words = `draft-${String(run)} fix totals first`;
        await p.locator(FIELD).click();
        await p.keyboard.type(words);
        await sleep(800);
        await p.reload();
        await sleep(3500);
        await go(s, `project/${shop}`);
        let back = '';
        for (let i = 0; i < 12; i++) {
          await blk.locator('[data-testid^="inbox.block.row."], [data-testid="inbox.block.more"]').first().click().catch(() => undefined);
          for (let j = 0; j < 10; j++) {
            await sleep(400);
            if ((await p.locator('[data-testid^="inbox.block.open."]').first().innerText().catch(() => '')).includes(k)) { back = await p.locator(FIELD).innerText().catch(() => ''); break; }
            await p.keyboard.press('ArrowDown');
          }
          if (back !== '') break;
          await sleep(1000);
        }
        await shot('INBOXDRAFT-3-after-reload');
        row('INBOXDRAFT draft', `typed ${JSON.stringify(words)} on the long ask, reloaded; the composer on that item after: ${JSON.stringify(back)}`);
      } else {
        await shot('INBOXDRAFT-1-long-folded');
        row('INBOXDRAFT', `the long ask '${k}' never came in front of shop's block`);
      }
    }

    // the thread may draw only what is near the view: scroll its scroller up until `sel` (with `text`) is there
    const scrollUpTo = async (sel: string, text: RegExp | null): Promise<boolean> => {
      for (let i = 0; i < 40; i++) {
        const loc = text ? p.locator(sel).filter({ hasText: text }) : p.locator(sel);
        if ((await loc.count()) > 0) { await loc.last().scrollIntoViewIfNeeded().catch(() => undefined); return true; }
        const top = await p.evaluate(() => {
          let el: HTMLElement | null = document.querySelector<HTMLElement>('[data-testid="thread.list"]');
          while (el && !(el.scrollHeight > el.clientHeight && /auto|scroll/.test(getComputedStyle(el).overflowY))) el = el.parentElement;
          if (!el) return true;
          el.scrollTop = Math.max(0, el.scrollTop - 500);
          return el.scrollTop === 0;
        });
        await sleep(300);
        if (top && i > 0) { const last = text ? p.locator(sel).filter({ hasText: text }) : p.locator(sel); return (await last.count()) > 0; }
      }
      return false;
    };

    // FOLDS2: dashboards' thinking row and '▸ 1 other step' (amb-tools 63eb6c0a)
    if (on('FOLDS2')) {
      // every press is measured the same way: the pressed row's top in the window, then 700 ms later; < 2 px holds
      const yOf = async (l: Locator): Promise<number | null> => (await l.boundingBox().catch(() => null))?.y ?? null;
      const press = async (l: Locator, act: () => Promise<void>): Promise<string> => {
        const y0 = await yOf(l);
        await act();
        await sleep(700);
        const y1 = await yOf(l);
        const d = y0 === null || y1 === null ? null : Math.round(Math.abs(y1 - y0) * 10) / 10;
        // a row off screen at the press is scrolled in by the click itself: that move is Playwright's, not the app's
        const vh = await p.evaluate(() => window.innerHeight);
        const off = y0 !== null && (y0 < 0 || y0 > vh);
        return `${String(y0)} -> ${String(y1)} px (${d === null ? 'not measured' : off ? 'off screen at the press: not measured' : d < 2 ? `moved ${String(d)} px: holds` : `moved ${String(d)} px: RED`})`;
      };
      const opened = (): Promise<number> => p.locator('[data-testid="thread.list"] [aria-expanded="true"], [data-testid="thread.list"] .th-think-body').count();

      // (1) at the thread's end: the list stuck to its end, the lowest fold toggle in view
      await go(s, `agent/${tel}/dashboards`);
      await sleep(1500);
      const stuck = await p.getByTestId('thread.list').getAttribute('data-stuck').catch(() => null);
      const endId = await p.evaluate(() => {
        const sel = '[data-testid^="thread.think."][data-testid$=".head"], [data-testid^="thread.tools."], [data-testid^="thread.fold."], [data-testid^="thread.tool."][role="button"]';
        const inView = Array.from(document.querySelectorAll<HTMLElement>(sel)).filter((e) => {
          const r = e.getBoundingClientRect();
          return r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight;
        });
        return inView[inView.length - 1]?.dataset['testid'] ?? '';
      });
      if (endId === '') {
        await shot('FOLDS2-end-a');
        row('FOLDS2 at the end', `data-stuck=${String(stuck)}; no fold toggle in view at the thread's end`);
      } else {
        const t = p.getByTestId(endId).first();
        await shot('FOLDS2-end-a');
        const o = await press(t, () => t.click());
        await shot('FOLDS2-end-b-open');
        const c = await press(t, () => t.click());
        await shot('FOLDS2-end-c-closed');
        row('FOLDS2 at the end', `data-stuck=${String(stuck)} before; ${endId} (${JSON.stringify((await t.innerText().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 50))}) open: ${o}; close: ${c}`);
      }
      // a click holds its row for 1.5 s (ThreadList HOLD_MS) against any scroll that isn't his wheel or keys: the
      // scripted scroll-up below must start after it, or the hold pulls the view back and the next row is off screen
      await sleep(2000);

      // (2) the thinking row and '▸ 1 other step' up the thread: open, then close
      for (const [name, sel, text] of [['thinking', '[data-testid^="thread.think."][data-testid$=".head"]', null], ['pill', '[data-testid^="thread.tools."]', /1 other step/]] as const) {
        const there = await scrollUpTo(sel, text);
        const el = text ? p.locator(sel).filter({ hasText: text }).last() : p.locator(sel).last();
        if (!there) { await shot(`FOLDS2-${name}-a-closed`); row(`FOLDS2 ${name}`, 'not in the thread after scrolling to its top'); continue; }
        await el.scrollIntoViewIfNeeded().catch(() => undefined);
        await sleep(400);
        const t0 = (await el.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
        await shot(`FOLDS2-${name}-a-closed`);
        const n0 = await opened();
        const o = await press(el, () => el.click());
        const n1 = await opened();
        await shot(`FOLDS2-${name}-b-open`);
        await el.screenshot({ path: path.join(OUT, `FOLDS2-${name}-c-row.png`) }).catch(() => undefined);
        const c = await press(el, () => el.click());
        await shot(`FOLDS2-${name}-d-closed`);
        row(`FOLDS2 ${name}`, `${JSON.stringify(t0.slice(0, 60))}; open: ${o} (open folds ${String(n0)} -> ${String(n1)}); close: ${c}`);
      }

      // (3) ⌘E (open everything, the TUI's ctrl+o) from the composer: the row at the top of the view stays
      const topIdx = await p.evaluate(() => {
        const list = document.querySelector('[data-testid="thread.list"]');
        const edge = list === null ? 0 : list.getBoundingClientRect().top;
        const r = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="thread.list"] [data-item-index]')).find((e) => e.getBoundingClientRect().top >= edge);
        return r?.dataset['itemIndex'] ?? '';
      });
      if (topIdx === '') row('FOLDS2 ⌘E', 'no row at the top of the view');
      else {
        const top = p.locator(`[data-testid="thread.list"] [data-item-index="${topIdx}"]`);
        await p.locator(FIELD).first().click().catch(() => undefined);
        const n0 = await opened();
        const e1 = await press(top, () => p.keyboard.press('Meta+e'));
        const n1 = await opened();
        await shot('FOLDS2-cmdE-a-open');
        const e2 = await press(top, () => p.keyboard.press('Meta+e'));
        await shot('FOLDS2-cmdE-b-folded');
        row('FOLDS2 ⌘E', `top row (item ${topIdx}) open all: ${e1} (open folds ${String(n0)} -> ${String(n1)}); fold all: ${e2}`);
      }
    }

    // STEERRX: his bubbles' delivery marks (sent ✓ / read ✓✓, sb-core's steer-rx + steered receipts, a712b0f2) in
    // dashboards' thread, where the seeded steer is
    // (amb-win 0bc66c22: thread.you.<pos>.mark after the time, ✓ got it / ✓✓ read it / ▲ not sent; a steered one has
    // no mark, its 'steered · … read it mid-turn' line is its ✓✓). Crops of each marked under-line, light + dark,
    // for designer's sheet (STEERRX-crop-<theme>-<n>.png).
    const marksOf = (): Promise<{ id: string; words: string; under: string; mark: string; tone: string; title: string; color: string; time: string }[]> =>
      p.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>('[data-testid^="thread.you."]'))
          .filter((e) => /^thread\.you\.\d+$/.test(e.dataset['testid'] ?? ''))
          .map((e) => {
            const id = e.dataset['testid'] ?? '';
            const m = document.querySelector<HTMLElement>(`[data-testid="${id}.mark"]`);
            const under = m?.parentElement ?? null;
            const time = under?.querySelector<HTMLElement>('time, .th-time, [class*="time"]') ?? null;
            return {
              id,
              words: (e.querySelector<HTMLElement>('.th-bubble')?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 40),
              under: (under?.innerText ?? '').replace(/\s+/g, ' '),
              mark: m?.innerText ?? '',
              tone: m?.dataset['tone'] ?? '',
              title: m?.getAttribute('title') ?? '',
              color: m === null ? '' : getComputedStyle(m).color,
              time: time === null ? '' : getComputedStyle(time).color,
            };
          }),
      );
    const crops = async (sel: string, name: string, max: number): Promise<number> => {
      const l = p.locator(sel);
      const n = Math.min(await l.count(), max);
      let k = 0;
      for (let i = 0; i < n; i++) {
        const el = l.nth(i);
        await el.scrollIntoViewIfNeeded().catch(() => undefined);
        await sleep(200);
        if ((await el.boundingBox().catch(() => null)) === null) continue;
        const target = el.locator('xpath=ancestor::*[@data-item-index][1]');
        await ((await target.count()) > 0 ? target : el).screenshot({ path: path.join(OUT, `${name}-${String(k)}.png`) }).catch(() => undefined);
        k++;
      }
      return k;
    };
    if (on('STEERRX')) {
      for (const [where, route] of [['dashboards', `agent/${tel}/dashboards`], ['telemetry main', `project/${tel}`]] as const) {
        await go(s, route);
        await sleep(2000);
        const all = await marksOf();
        const marked = all.filter((m) => m.mark !== '');
        await shot(`STEERRX-${where.replace(' ', '-')}`);
        row(`STEERRX ${where}`, `${String(all.length)} of his bubbles, ${String(marked.length)} with a mark: ${JSON.stringify(marked.slice(-6))}; the last 3 without: ${JSON.stringify(all.filter((m) => m.mark === '').slice(-3).map((m) => [m.words, m.under]))}`);
      }
      for (const t of ['light', 'dark'] as const) {
        await theme(t);
        await go(s, `agent/${tel}/dashboards`);
        await sleep(2000);
        const k = await crops('[data-testid^="thread.you."][data-testid$=".mark"]', `STEERRX-crop-${t}`, 3);
        const st = await crops('[data-testid="thread.list"] .th-row:has-text("steered · ")', `STEERRX-steered-${t}`, 1);
        row(`STEERRX crops ${t}`, `${String(k)} marked rows + ${String(st)} steered row cropped`);
      }
      await theme('light');
    }

    // TOOLCOUNT: an edit's line reads '± <file>' with '+N −M' dim after it (amb-home 29ec1b92: thread.tool.<pos>.count)
    if (on('TOOLCOUNT')) {
      for (const t of ['light', 'dark'] as const) {
        await theme(t);
        await go(s, `agent/${tel}/dashboards`);
        await sleep(2000);
        const counts = await p.evaluate(() =>
          Array.from(document.querySelectorAll<HTMLElement>('[data-testid^="thread.tool."][data-testid$=".count"]')).map((c) => {
            const line = c.closest<HTMLElement>('[data-testid^="thread.tool."]:not([data-testid$=".count"])') ?? c.parentElement;
            const words = line?.querySelector<HTMLElement>('.th-tool-text') ?? null;
            const wr = words?.getBoundingClientRect();
            const cr = c.getBoundingClientRect();
            return {
              id: c.dataset['testid'] ?? '',
              line: (line?.innerText ?? '').replace(/\s+/g, ' '),
              words: words?.innerText ?? '',
              count: c.innerText,
              gap: wr === undefined ? null : Math.round(cr.left - wr.right),
              countColor: getComputedStyle(c).color,
              wordsColor: words === null ? '' : getComputedStyle(words).color,
            };
          }),
        );
        await shot(`TOOLCOUNT-${t}`);
        const k = await crops('[data-testid^="thread.tool."][data-testid$=".count"]', `TOOLCOUNT-crop-${t}`, 3);
        row(`TOOLCOUNT ${t}`, `${String(counts.length)} edit lines with counts in dashboards (${String(k)} cropped): ${JSON.stringify(counts.slice(-4))}`);
      }
      await theme('light');
    }

    // HEADFIT: the agent head shows each meta item whole or not at all (amb-home 69192579): at 1400, 1100 with the
    // artifacts panel, 800; light + dark; on telemetry · p99 and shop · gift-ui (a blocked one: its chip)
    if (on('HEADFIT')) {
      const headOf = (): Promise<string> =>
        p.evaluate(() => {
          const h = document.querySelector<HTMLElement>('[data-testid="thread.head"]');
          if (h === null) return 'no head';
          const it = (id: string): string => {
            const e = h.querySelector<HTMLElement>(`[data-testid="${id}"]`);
            if (e === null) return '-';
            if (e.classList.contains('ah-gone')) return 'gone';
            const r = e.getBoundingClientRect();
            if (r.width === 0) return 'hidden';
            const cut = e.scrollWidth > e.clientWidth + 1;
            return `${cut ? 'CUT' : 'whole'} ${JSON.stringify(e.innerText.replace(/\s+/g, ' ').trim().slice(0, 40))}`;
          };
          const hr = h.getBoundingClientRect();
          const over = Array.from(h.querySelectorAll<HTMLElement>('*')).some((e) => !e.classList.contains('ah-gone') && e.getBoundingClientRect().right > hr.right + 1);
          return `drop=${h.dataset['drop'] ?? '?'}; name ${it('thread.head.name')}; role ${it('thread.head.role')}; context ${it('thread.usage')}; branch ${it('thread.head.branch')}; changes ${it('thread.head.changes')}; past the head's right edge: ${String(over)}`;
        });
      for (const t of ['light', 'dark'] as const) {
        await theme(t);
        for (const [who, route] of [['p99', `agent/${tel}/p99`], ['gift-ui', `agent/${shop}/gift-ui`]] as const) {
          await go(s, route);
          for (const wd of [1400, 1100, 800]) {
            await size(wd);
            await sleep(900);
            await shot(`HEADFIT-${who}-${String(wd)}-${t}`);
            await p.getByTestId('thread.head').screenshot({ path: path.join(OUT, `HEADFIT-${who}-${String(wd)}-${t}-head.png`) }).catch(() => undefined);
            row(`HEADFIT ${who} ${String(wd)} ${t}`, await headOf());
          }
          await size(1100);
        }
      }
      await theme('light');
    }

    // B16 (ambient-pm m_17235): the narrow window, light: its minimum width (MAIN_SIZE.minWidth 680), then 600 and 520
    // with the minimum lowered for the shot (the app itself never goes under its minimum: said in each row). Screens:
    // a thread with a long answer and a tool row, the inbox block with a card's options open, settings · models,
    // scheduled with a task open, review, and the sidebar folded/unfolded. Each row: the real width, anything past
    // the window's right edge, any element scrolled sideways, the composer's and the keys line's line count.
    if (on('B16')) {
      await theme('light');
      const min = await s.app.evaluate(({ BrowserWindow }) => {
        const b = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().includes('index.html'));
        return b?.getMinimumSize()[0] ?? 0;
      });
      const narrow = (w: number): Promise<number> =>
        s.app.evaluate(({ BrowserWindow }, [v, lower]) => {
          const b = BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().includes('index.html'));
          if (b === undefined) return 0;
          if (lower === 1) b.setMinimumSize(Math.min(v ?? 0, b.getMinimumSize()[0] ?? 0), b.getMinimumSize()[1] ?? 0);
          b.setContentSize(v ?? 0, b.getContentSize()[1] ?? 720);
          return b.getContentSize()[0] ?? 0;
        }, [w, w < min ? 1 : 0]);
      const look = (): Promise<string> =>
        p.evaluate(() => {
          const W = document.documentElement.clientWidth;
          const past = Array.from(document.querySelectorAll<HTMLElement>('body *')).filter((e) => {
            const r = e.getBoundingClientRect();
            const st = getComputedStyle(e);
            return r.width > 0 && r.right > W + 1 && st.visibility !== 'hidden' && st.position !== 'fixed' && e.closest('[aria-hidden="true"], .ah-gone') === null;
          });
          const sideways = Array.from(document.querySelectorAll<HTMLElement>('body *')).filter((e) => {
            const st = getComputedStyle(e);
            return e.scrollLeft > 0 || (e.scrollWidth > e.clientWidth + 1 && /auto|scroll/.test(st.overflowX) && !/^(PRE|CODE)$/.test(e.tagName));
          });
          const lines = (sel: string): string => {
            const e = document.querySelector<HTMLElement>(sel);
            if (e === null) return '-';
            const lh = parseFloat(getComputedStyle(e).lineHeight) || 18;
            return String(Math.round(e.getBoundingClientRect().height / lh));
          };
          const tag = (e: HTMLElement): string => e.dataset['testid'] ?? e.getAttribute('class')?.split(' ')[0] ?? e.tagName;
          return `doc ${String(W)} px, scrollWidth ${String(document.documentElement.scrollWidth)}; past the right edge: ${String(past.length)} ${JSON.stringify(past.slice(0, 4).map(tag))}; scrolled sideways: ${String(sideways.length)} ${JSON.stringify(sideways.slice(0, 4).map(tag))}; keys line ~${lines('.composer-keys, [data-testid="composer.keys"]')} lines; sidebar ${document.querySelector<HTMLElement>('[data-testid="app.sidebar"]')?.getBoundingClientRect().width.toFixed(0) ?? 'none'} px`;
        });
      const screens: [string, () => Promise<void>][] = [
        ['thread-long', async () => { await go(s, `project/${tel}`); await sleep(1500); }],
        ['thread-tools', async () => { await go(s, `agent/${tel}/dashboards`); await sleep(1500); }],
        ['inbox-card', async () => {
          await go(s, `project/${shop}`);
          await sleep(1200);
          await p.locator(FIELD).first().click().catch(() => undefined);
          await p.keyboard.press('Control+1');
          await sleep(900);
        }],
        ['settings-models', async () => { await go(s, 'settings/models'); await sleep(1200); }],
        ['scheduled', async () => {
          await go(s, 'scheduled');
          await sleep(1200);
          await p.locator('[data-testid^="scheduled.row."]').first().click().catch(() => undefined);
          await sleep(800);
        }],
        ['review', async () => { await go(s, `review/${shop}/gift-ui`); await sleep(1500); }],
      ];
      for (const w of [min, 600, 520]) {
        const real = await narrow(w);
        await sleep(600);
        for (const [name, open] of screens) {
          await open();
          await shot(`B16-${name}-${String(w)}`);
          row(`B16 ${name} ${String(w)}`, `${w < min ? `under the app's minimum ${String(min)} (lowered for the shot); ` : ''}content width ${String(real)}; ${await look()}`);
        }
        // the sidebar: its toggle, if the narrow window has one (folded, then unfolded)
        const toggle = p.locator('[data-testid*="sidebar.toggle"], [data-testid*="sidebar.fold"], [aria-label*="sidebar" i]').first();
        if ((await toggle.count()) > 0 && (await toggle.isVisible().catch(() => false))) {
          await go(s, `project/${tel}`);
          await sleep(800);
          await shot(`B16-sidebar-a-${String(w)}`);
          const a = await look();
          await toggle.click().catch(() => undefined);
          await sleep(700);
          await shot(`B16-sidebar-b-${String(w)}`);
          row(`B16 sidebar ${String(w)}`, `before: ${a} · after its toggle: ${await look()}`);
          await toggle.click().catch(() => undefined);
          await sleep(500);
        } else row(`B16 sidebar ${String(w)}`, 'no sidebar toggle in view at this width');
      }
      await s.app.evaluate(({ BrowserWindow }, m) => {
        const b = BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().includes('index.html'));
        b?.setMinimumSize(m, b.getMinimumSize()[1] ?? 0);
        b?.setContentSize(1100, b.getContentSize()[1] ?? 720);
      }, min);
    }

    // SETKEYS (designer m_17479, fa91c73a): settings › keys with the keychain switch at its head, light, 1100
    if (on('SETKEYS')) {
      await theme('light');
      await size(1100);
      await go(s, 'settings/keys');
      await sleep(1200);
      await shot('SETKEYS-1100-light');
      const words = await p.evaluate(() => (document.querySelector<HTMLElement>('main, [data-testid^="settings"]')?.innerText ?? document.body.innerText).replace(/\s+/g, ' ').slice(0, 400));
      row('SETKEYS settings › keys 1100 light', JSON.stringify(words));
    }

    // P99ROW: the bottom of telemetry's thread
    if (on('P99ROW')) {
      await go(s, `project/${tel}`);
      await sleep(1000);
      const there = await scrollUpTo('[data-testid="thread.list"] *', /answered p99 for you|answered .* for you/);
      const r = p.getByTestId('thread.list').locator('*').filter({ hasText: /answered p99 for you/ }).last();
      // later turns (R41's dock) push it up: bring this row itself into the frame before the shot
      await r.scrollIntoViewIfNeeded().catch(() => undefined);
      await sleep(400);
      await shot('P99ROW');
      await r.screenshot({ path: path.join(OUT, 'P99ROW-row.png') }).catch(() => undefined);
      row('P99ROW', there ? JSON.stringify((await r.innerText()).replace(/\s+/g, ' ').trim().slice(0, 200)) : "no 'answered … for you' row in telemetry's thread");
      // names: the quote's source in a main's thread says 'bise' (lead m_16742)
      const src = await p.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('[data-testid*=".quote."]')).map((q) => q.innerText.split('\n')[0] ?? '').slice(-2));
      row('NAMES quote source in telemetry main', JSON.stringify(src));
    }

  } finally {
    appendFileSync(path.join(OUT, 'index.md'), ['', `## gate/right (${new Date().toISOString()})`, '', '| row | what the app did |', '|---|---|', ...rows, ''].join('\n'));
    await s.close().catch(() => undefined);
    helper.dispose();
  }
});
