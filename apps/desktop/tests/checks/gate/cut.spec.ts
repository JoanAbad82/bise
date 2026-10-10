// gate/cut · candidate f5ff0e72's rows (ambient-lead m_15946), on the packed app off-screen, rich world, FAKE_BODIES:
//   ASKLINE  a question in a thread is one dim line '? bise asks: … · in the inbox below', its '?' in the accent;
//            a click opens that card in the block;
//   APPROVAL an opened approval heads '! <who> asks · <project>', never a kind id;
//   TOOLOUT  opening a finished tool row shows its real output from the hub (> 200 chars, '… cut after 4 KB' when long);
//   SCHED    the scheduled list shows names; the opened task heads its name; 'stop' with a dim key;
//   MAINANS  main's own card answered with words + an image: ONE 'you answered main' row with its chip, '[Image #1]'
//            not in the words, 0 'switchboard' rows; the request to main carries the image (R41, one path);
//   DIVIDER  the composer's line names the gauge 'context …' (none at 0%).
// Out: BISE_CUT_OUT/index.md (appended) + shots. Every shot is looked at by a person before a row is green.
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { FakeHelper, test, type Session } from '../../harness';
import { launchReal, realWorld, worldSay } from '../world';
import { sleep } from '../native/world';

const OUT = process.env['BISE_CUT_OUT'] ?? path.join(os.homedir(), '.bise', 'gate', 'try-gate', 'cut');
const BODIES = process.env['FAKE_BODIES'] ?? '';
const FIELD = '[data-testid="composer.field"]';
const PNG = path.join(__dirname, '../fixtures/checker.png');
// BISE_CUT_ROWS=APPROVAL,TOOLOUT runs only those rows (ASKLINE and MAINANS go together)
const ONLY = (process.env['BISE_CUT_ROWS'] ?? '').split(',').map((x) => x.trim()).filter((x) => x !== '');
const on = (r: string): boolean => ONLY.length === 0 || ONLY.includes(r);

async function go(s: Session, route: string): Promise<void> {
  await s.page.evaluate((r) => { (window as unknown as { bise: { openWindow: (r?: string) => void } }).bise.openWindow(r); }, route);
  await sleep(1200);
}

/** Whether the last request holding `nonce` carries an image part, in any family the fake speaks (a cheap read). */
function imageWith(nonce: string): string {
  if (BODIES === '' || !existsSync(BODIES)) return 'no FAKE_BODIES';
  const lines = readFileSync(BODIES, 'utf8').split('\n').filter((l) => l.includes(nonce));
  const last = lines[lines.length - 1];
  if (last === undefined) return 'no request with his words';
  const m = /data:(image\/[a-z]+);base64|"media_type":\s*"(image\/[a-z]+)"|"mimeType":\s*"(image\/[a-z]+)"/.exec(last);
  return m ? `yes: ${m[1] ?? m[2] ?? m[3] ?? ''}` : 'no image part';
}

test('gate/cut: ask line, approval head, tool output, scheduled names, main answered with an image, divider', async () => {
  test.setTimeout(12 * 60_000);
  mkdirSync(OUT, { recursive: true });
  const w = realWorld();
  const helper = new FakeHelper();
  const s = await launchReal(w, { helper });
  const p = s.page;
  const run = Date.now() % 1_000_000;
  const rows: string[] = [];
  const row = (id: string, t: string): void => { rows.push(`| ${id} | ${t.replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`); };
  const shot = async (name: string, pg: Page = p): Promise<void> => { await pg.screenshot({ path: path.join(OUT, `${name}.png`) }).catch(() => undefined); };
  const text = async (sel: string): Promise<string> => (await p.locator(sel).first().innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
  const sd = path.join(w.world, 'rich', 'scripts');
  const put = (name: string, match: string, calls: { tool: string; arg: string }[], reply: string): void => {
    mkdirSync(sd, { recursive: true });
    const tmp = path.join(sd, `.${name}.tmp`);
    writeFileSync(tmp, JSON.stringify({ match, calls, reply }));
    renameSync(tmp, path.join(sd, `${name}.json`));
  };
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
    const shop = ids['shop'] ?? 'shop';
    const tel = ids['telemetry'] ?? 'telemetry';

    if (on('ASKLINE')) {
      // ASKLINE: shop's main asks him a question (sb card) -> one dim line in its thread, '?' in the accent
      const k = `cut-${String(run)}`;
      put(`cut-ask-${String(run)}`, `${k}-start`, [{ tool: 'bash', arg: `sb card "${k} which branch first? 1. checkout 2. gift-ui"` }], 'Asked you.');
      worldSay('shop', `${k}-start please ask me`);
      await go(s, `project/${shop}`);
      const line = p.locator('[data-testid^="thread.card."]').filter({ hasText: k }).first();
      for (let i = 0; i < 90 && !(await line.isVisible().catch(() => false)); i++) await sleep(1000);
      if (await line.isVisible().catch(() => false)) {
        await line.scrollIntoViewIfNeeded().catch(() => undefined);
        const look = await line.evaluate((el) => {
          const mark = el.querySelector('.th-card-mark');
          const words = getComputedStyle(el).color;
          const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
          return { text: (el as HTMLElement).innerText.replace(/\s+/g, ' ').trim(), mark: mark ? getComputedStyle(mark).color : 'none', words, accent, lines: Math.round(el.getBoundingClientRect().height) };
        });
        await shot('ASKLINE-1-line');
        await line.click();
        await sleep(1200);
        const open = await text('[data-testid^="inbox.block.open."]');
        await shot('ASKLINE-2-clicked');
        row('ASKLINE', `line ${JSON.stringify(look.text)} (${String(look.lines)} px tall); '?' colour ${look.mark}, words ${look.words}, --accent ${look.accent || '(unset)'}; after the click the block's open card: ${JSON.stringify(open.slice(0, 120))}`);
      } else {
        await shot('ASKLINE-1-line');
        row('ASKLINE', `no thread.card line with '${k}' in shop main's thread after 90 s`);
      }

      // MAINANS (+ R41 one path): that card answered from the block with words + an image
      {
        const n = `${k}-ans`;
        const opened = await text('[data-testid^="inbox.block.open."]');
        let note = `card in front: ${JSON.stringify(opened.slice(0, 60))}`;
        if (opened.includes(k)) {
          await p.locator(FIELD).click();
          const staged = await Promise.race([
            s.app.evaluate((_e, file) => (globalThis as unknown as { __biseTestClip?: (c: { file: string }) => Promise<boolean> }).__biseTestClip?.({ file }) ?? Promise.resolve(false), PNG),
            sleep(10_000).then(() => false),
          ]);
          await p.keyboard.press('Meta+V');
          await sleep(600);
          await p.keyboard.type(`the checkout one ${n}`);
          await shot('MAINANS-1-composer');
          await p.keyboard.press('Enter');
          await sleep(6000);
          await go(s, `project/${shop}`);
          await sleep(1500);
          const list = p.getByTestId('thread.list');
          const all = await list.innerText().catch(() => '');
          const answered = p.locator('[data-testid^="thread.answered."]').filter({ hasText: n });
          const count = await answered.count();
          const rowText = count > 0 ? (await answered.first().innerText()).replace(/\s+/g, ' ').trim() : '';
          const chips = count > 0 ? await answered.first().locator('img').count() : 0;
          const wordsLine = rowText.split(n)[0] ?? '';
          if (count > 0) await answered.first().scrollIntoViewIfNeeded().catch(() => undefined);
          await shot('MAINANS-2-row');
          note += `; staged ${String(staged)}; 'you answered' rows with his words: ${String(count)} (${JSON.stringify(rowText.slice(0, 140))}); images in it: ${String(chips)}; '[Image #1]' before his words in the row text: ${String(/\[Image #1\][^[]*$/.test(wordsLine))}; 'switchboard' rows: ${String(all.split('\n').filter((l) => l.trim() === 'switchboard').length)}; raw 'the user answered card': ${String(all.includes('the user answered card'))}; request to main: ${imageWith(n)}`;
        }
        row('MAINANS', note);
      }
    }

    // APPROVAL: walk shop's block items (first, then ↓) until the opened card's mark is '!'; read its head
    if (on('APPROVAL')) {
      await go(s, `project/${shop}`);
      const blk = p.getByTestId('inbox.block');
      await blk.locator('[data-testid^="inbox.block.row."]').first().click().catch(() => undefined);
      let head = '';
      let open = '';
      for (let i = 0; i < 12; i++) {
        await sleep(500);
        open = await text('[data-testid^="inbox.block.open."]');
        if (open.startsWith('!')) { head = open.split(/\s+now\s+|\s+\d+ (min|h)\s+/)[0] ?? open.slice(0, 60); break; }
        await p.keyboard.press('ArrowDown');
      }
      await shot('APPROVAL');
      row('APPROVAL', head !== '' ? `opened approval: ${JSON.stringify(open.slice(0, 200))}; a kind id in it (feature_try|tool_approval|kind|approval:) ${String(/feature_try|tool_approval|\bkind\b|approval:/.test(open))}` : `no item opened with '!' in 12 steps through shop's block (last: ${JSON.stringify(open.slice(0, 120))})`);
    }

    // TOOLOUT: telemetry · dashboards' finished tool lines; open one that opens, read its output
    if (on('TOOLOUT')) {
      await go(s, `agent/${tel}/dashboards`);
      await sleep(1500);
      const tools = p.locator('[data-testid^="thread.tool."][role="button"]');
      const n = await tools.count();
      let note = `tool lines that open: ${String(n)}`;
      if (n > 0) {
        const id = (await tools.nth(Math.max(0, n - 2)).getAttribute('data-testid')) ?? '';
        const t = p.getByTestId(id);
        await t.scrollIntoViewIfNeeded().catch(() => undefined);
        await t.click();
        await sleep(2500);
        const out = await p.getByTestId(`${id}.out`).innerText().catch(() => '');
        const cut = await p.getByTestId(`${id}.cut`).isVisible().catch(() => false);
        const none = await p.getByTestId(`${id}.none`).innerText().catch(() => '');
        await shot('TOOLOUT');
        note += `; opened ${id}: output ${String(out.length)} chars (${JSON.stringify(out.slice(0, 80))}), 'cut after 4 KB' ${String(cut)}${none !== '' ? `, error ${JSON.stringify(none)}` : ''}`;
      } else await shot('TOOLOUT');
      row('TOOLOUT', note);
    }

    // SCHED: names in the list, the opened task's head, 'stop' with its key dim
    if (on('SCHED')) {
      await go(s, 'scheduled');
      await sleep(1200);
      const list = await text('[data-testid="scheduled.list"]');
      const first = p.locator('[data-testid^="scheduled.row."]').first();
      await first.click().catch(() => undefined);
      await sleep(800);
      const title = await text('[data-testid="scheduled.pane.title"]');
      const stop = p.locator('[data-testid="scheduled.pane"] button').filter({ hasText: /stop/ }).first();
      const stopText = (await stop.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
      const keyDim = await stop.evaluate((el) => Array.from(el.querySelectorAll('*')).map((c) => `${(c as HTMLElement).innerText.trim()}:${getComputedStyle(c).color}`).join(' ')).catch(() => '');
      await shot('SCHED');
      row('SCHED', `list ${JSON.stringify(list.slice(0, 160))}; opened head ${JSON.stringify(title)}; stop button ${JSON.stringify(stopText)} (parts: ${keyDim})`);
    }

    // DIVIDER: the line above the composer on bise's main
    if (on('DIVIDER')) {
      await go(s, 'bise');
      await sleep(1000);
      const meta = await p.evaluate(() => {
        const field = document.querySelector('[data-testid="composer.field"]');
        let el: Element | null = field;
        for (let i = 0; i < 6 && el; i++) el = el.parentElement;
        const txt = (el as HTMLElement | null)?.innerText ?? '';
        return txt.split('\n').filter((l) => /yolo|high|idle|context|%/.test(l)).join(' / ');
      });
      await shot('DIVIDER');
      row('DIVIDER', `the composer's line: ${JSON.stringify(meta)}; 'context' named: ${String(meta.includes('context'))}; a bare '0%': ${String(/(^|\s)0%/.test(meta))}`);
    }
  } finally {
    appendFileSync(path.join(OUT, 'index.md'), ['', `## gate/cut (${new Date().toISOString()})`, '', '| row | what the app did |', '|---|---|', ...rows, ''].join('\n'));
    await s.close().catch(() => undefined);
    helper.dispose();
  }
});
