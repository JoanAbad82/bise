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
import type { Page } from '@playwright/test';
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
      await go(s, `agent/${tel}/dashboards`);
      await sleep(1000);
      for (const [name, sel, text] of [['thinking', '[data-testid^="thread.think."]', null], ['pill', '[data-testid="thread.list"] *', /^▸?\s*1 other step/]] as const) {
        const there = await scrollUpTo(sel, text);
        const el = text ? p.locator(sel).filter({ hasText: text }).last() : p.locator(sel).last();
        if (!there) { await shot(`FOLDS2-${name}-a-closed`); row(`FOLDS2 ${name}`, 'not in the thread after scrolling to its top'); continue; }
        const t0 = (await el.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
        await shot(`FOLDS2-${name}-a-closed`);
        const len0 = (await p.getByTestId('thread.list').innerText()).length;
        const y0 = (await el.boundingBox())?.y ?? null;
        await el.click();
        await sleep(700);
        const len1 = (await p.getByTestId('thread.list').innerText()).length;
        // does the opened row stay where his click was, or does the view jump away from it?
        const y1 = (await el.boundingBox().catch(() => null))?.y ?? null;
        await shot(`FOLDS2-${name}-b-open`);
        await el.screenshot({ path: path.join(OUT, `FOLDS2-${name}-c-row.png`) }).catch(() => undefined);
        row(`FOLDS2 ${name}`, `${JSON.stringify(t0.slice(0, 80))}; a click: thread text ${String(len0)} -> ${String(len1)} chars; the row's top in the window ${String(y0)} -> ${String(y1)} px`);
      }
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
