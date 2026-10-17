// gate/more · the 387ad740 rows the rich world doesn't hold by itself (ambient-lead m_14445), made with
// the world's live fake scripts ($FAKE_SCRIPTS) and read on the packed app, every shot looked at:
//   FOLDS2  a thread with a '▸ N other step' pill and a thinking row: telemetry main runs a script that
//           thinks ([[think: …]]) and calls bash + a tool of kind other; a click opens each;
//   DOCKOPT an options-only docked item (docs' feature_try card): typed words go as a plain message,
//           never an answer (4ccfa1d2), the card stays, the docked label is one line;
//   PUSH    1-4 in a card bise pushes while his keys are in the window (b4e92e8a): over an empty
//           composer '1' picks, over words '2' types.
// Out: BISE_MORE_OUT/index.md (appended), shots next to it. Needs a rich world with FAKE_BODIES.
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { FakeHelper, test, type Session } from '../../harness';
import { launchReal, realWorld, worldSay } from '../world';
import { capsulePage, CAPSULE, Lines, sleep } from '../native/world';

const OUT = process.env['BISE_MORE_OUT'] ?? path.join(os.homedir(), '.bise', 'gate', 'try-gate', 'more');
const BODIES = process.env['FAKE_BODIES'] ?? '';
const FIELD = '[data-testid="composer.field"]';

async function go(s: Session, route: string): Promise<void> {
  await s.page.evaluate((r) => { (window as unknown as { bise: { openWindow: (r?: string) => void } }).bise.openWindow(r); }, route);
  await sleep(1200);
}

test('gate/more: folds with a pill and a thinking row, an options-only docked item, digits in a pushed card', async () => {
  test.setTimeout(12 * 60_000);
  mkdirSync(OUT, { recursive: true });
  const w = realWorld();
  const helper = new FakeHelper();
  const s = await launchReal(w, { helper });
  const out = new Lines();
  s.app.process().stdout?.setEncoding('utf8');
  s.app.process().stdout?.on('data', (d: string) => { out.push(d); });
  const p = s.page;
  const run = Date.now() % 1_000_000;
  const notes: string[] = [];
  const note = (row: string, t: string): void => { notes.push(`| ${row} | ${t.replace(/\|/g, '\\|')} |`); };
  const shot = async (name: string, pg: Page = p): Promise<void> => { await pg.screenshot({ path: path.join(OUT, `${name}.png`) }).catch(() => undefined); };
  const sd = path.join(w.world, 'rich', 'scripts');
  const put = (name: string, match: string, calls: { tool: string; arg: string }[], reply: string): void => {
    mkdirSync(sd, { recursive: true });
    const tmp = path.join(sd, `.${name}.tmp`);
    writeFileSync(tmp, JSON.stringify({ match, calls, reply }));
    renameSync(tmp, path.join(sd, `${name}.json`));
  };
  const field = p.locator(FIELD);
  try {
    await p.locator(`${FIELD}, [data-testid="setup.skip"]`).first().waitFor({ timeout: 20_000 }).catch(() => undefined);
    const skip = p.getByTestId('setup.skip');
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await sleep(1500);
    const ids: Record<string, string> = {};
    for (const id of await p.locator('[data-testid^="app.sidebar.project."]').evaluateAll((es) => es.map((e) => e.getAttribute('data-testid') ?? ''))) {
      const name = (await p.getByTestId(id).innerText().catch(() => '')).trim().split(/\s/)[0] ?? '';
      if (name !== '' && ids[name] === undefined) ids[name] = id.slice('app.sidebar.project.'.length).split('.')[0] ?? '';
    }
    const tel = ids['telemetry'] ?? 'telemetry';
    const docs = ids['docs'] ?? 'docs';

    // FOLDS2: thinking + bash + a tool of kind other (any name outside read/edit/run/search)
    {
      const k = `fold-${String(run)}`;
      put(`more-${k}`, k, [{ tool: 'bash', arg: 'echo checked the p99 panel' }, { tool: 'browser', arg: 'open the latency dashboard' }], 'Looked at both panels.');
      worldSay('telemetry', `${k} [[think: comparing the two p99 panels before picking one]] please look at the panels`);
      await go(s, `project/${tel}`);
      const list = p.getByTestId('thread.list');
      const t0 = Date.now();
      while (!(await list.innerText().catch(() => '')).includes('Looked at both panels') && Date.now() - t0 < 60_000) await sleep(1000);
      await sleep(800);
      const pill = list.getByText(/other steps?/).last();
      const think = p.locator('[data-testid^="thread.think."][data-testid$=".head"]').last();
      for (const [name, el] of [['pill', pill], ['thinking', think]] as const) {
        if (!(await el.isVisible().catch(() => false))) { note('FOLDS2', `${name}: not on screen (thread text ends ${JSON.stringify((await list.innerText().catch(() => '')).slice(-160))})`); continue; }
        await el.scrollIntoViewIfNeeded().catch(() => undefined);
        await shot(`FOLDS2-${name}-a-closed`);
        const a = (await list.innerText()).length;
        await el.click();
        await sleep(600);
        await shot(`FOLDS2-${name}-b-open`);
        note('FOLDS2', `${name} ${JSON.stringify((await el.innerText().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 60))}: thread text ${String(a)} -> ${String((await list.innerText()).length)} chars after one click`);
      }
    }

    // DOCKOPT: docs' feature_try card (dark-mode is ready to try) docked; typed words go as a plain message
    {
      await go(s, `project/${docs}`);
      const rows = p.locator('[data-testid^="strip.row."]');
      const texts = await rows.allInnerTexts();
      const i = texts.findIndex((t) => /dark-mode|ready to try/i.test(t));
      if (i < 0) note('DOCKOPT', `no feature_try row in docs' strip (rows: ${JSON.stringify(texts.map((t) => t.replace(/\s+/g, ' ').slice(0, 50)))})`);
      else {
        await rows.nth(i).click();
        await p.getByTestId('strip.dock').waitFor({ timeout: 3000 }).catch(() => undefined);
        await field.click();
        const n = `dockopt-${String(run)}`;
        await p.keyboard.type(`what changed in the dark mode ${n}`);
        await sleep(300);
        const label = await p.evaluate(() => {
          const el = Array.from(document.querySelectorAll('*')).find((e) => e.children.length === 0 && /^(answering|to) /.test(e.textContent.trim()) && e.getBoundingClientRect().bottom > window.innerHeight - 160);
          const r = el?.getBoundingClientRect();
          return el ? `${el.textContent.trim().slice(0, 70)} (${String(Math.round(r?.height ?? 0))} px)` : 'none';
        });
        await shot('DOCKOPT-a-typed');
        await p.keyboard.press('Enter');
        const t0 = Date.now();
        let body = '';
        while (Date.now() - t0 < 30_000) {
          body = (BODIES !== '' && existsSync(BODIES) ? readFileSync(BODIES, 'utf8') : '').split('\n').filter((l) => l.includes(n)).pop() ?? '';
          if (body !== '') break;
          await sleep(500);
        }
        await sleep(1000);
        await shot('DOCKOPT-b-sent');
        const still = (await rows.allInnerTexts()).some((t) => /dark-mode|ready to try/i.test(t));
        note('DOCKOPT', `docked: ${JSON.stringify(texts[i]?.replace(/\s+/g, ' ').slice(0, 70) ?? '')}; label ${label}; the request with his words: ${body === '' ? 'none in 30 s' : /answered card/.test(body) ? "says 'the user answered card' (an ANSWER)" : 'a plain message (no answered card)'}; the card still in the strip after: ${String(still)}`);
      }
    }

    // PUSH: a new card from telemetry main while the window has the keys; '1' over an empty composer picks,
    // '2' over words types
    {
      const cap = await capsulePage(s);
      for (const [step, words] of [['a', ''], ['b', 'my words ']] as const) {
        const k = `push${step}-${String(run)}`;
        put(`more-${k}`, k, [{ tool: 'bash', arg: `sb notify "${k} which window for the alert? 1. five minutes 2. fifteen minutes"` }], 'Asked you.');
        await go(s, `project/${tel}`);
        await field.click();
        await p.keyboard.press('Meta+a');
        await p.keyboard.press('Backspace');
        if (words !== '') await p.keyboard.type(words);
        worldSay('telemetry', `${k} please ask me`);
        const shown = await out.wait(CAPSULE, (l) => /card/.test(l) || l.startsWith('show'), 60_000).then(() => true).catch(() => false);
        await sleep(800);
        const view = await cap.getByTestId('capsule').getAttribute('data-view').catch(() => '?');
        await shot(`PUSH-${step}-pushed`, cap);
        await field.click();
        await p.keyboard.press(step === 'a' ? '1' : '2');
        await sleep(1500);
        await shot(`PUSH-${step}-after-key`, p);
        const fieldText = (await field.innerText()).trim();
        const inbox = await p.locator('body').innerText();
        note('PUSH', `${step === 'a' ? "empty composer, '1'" : "words in the composer, '2'"}: capsule shown ${String(shown)} (view ${String(view)}); composer after: ${JSON.stringify(fieldText)}; the card '${k}' still listed: ${String(inbox.includes(k))}`);
        await p.keyboard.press('Meta+a');
        await p.keyboard.press('Backspace');
      }
    }
  } finally {
    appendFileSync(path.join(OUT, 'index.md'), ['', `## reshoot: FOLDS2, DOCKOPT, PUSH (${new Date().toISOString()})`, '', '| row | notes |', '|---|---|', ...notes, ''].join('\n'));
    await s.close().catch(() => undefined);
    helper.dispose();
  }
});
