// gate/empty · the try's empty thread (ambient-lead m_13851; amb-win 442ea0f1 + 2f22e7fc, first-run
// balance): on a fresh home, main's empty thread shows the first-run block centred in the column,
// and the window never scrolls, at 800, 1024, 1100 and 1400. Run on the packed app
// (BISE_HARNESS_ELECTRON_DIST) with its own bise as the core, in the harness's throwaway home (fresh:
// setup shows first and is skipped, as he does). Shots + numbers go to BISE_EMPTY_OUT/index.md.
import { appendFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { launchDesktop, test, expect } from '../../harness';
import { sleep } from '../native/world';

const OUT = process.env['BISE_EMPTY_OUT'] ?? path.join(os.homedir(), '.bise', 'gate', 'try-gate', 'empty');
const BISE = process.env['BISE_EMPTY_BISE'] ?? '';
const EMPTY_BLOCK = '[data-testid="thread.noproject"], [data-testid="setup.firstrun"]';

test('gate/empty: main\'s empty thread on a fresh home: the first-run block centred, no window scroll', async () => {
  test.setTimeout(5 * 60_000);
  expect(BISE, 'BISE_EMPTY_BISE: the packed app\'s own bise').not.toBe('');
  mkdirSync(OUT, { recursive: true });
  const s = await launchDesktop({ env: { BISE_DESKTOP_BISE: BISE, BISE_DESKTOP_WORKSPACE: '' } });
  const p = s.page;
  const lines: string[] = [];
  try {
    await p.locator('[data-testid="setup.skip"], [data-testid="setup.firstrun"]').first().waitFor({ timeout: 30_000 });
    const skip = p.getByTestId('setup.skip');
    if (await skip.isVisible().catch(() => false)) await skip.click();
    // bise's main thread, as he lands after setup (the first cut waited where skip left it: no first-run block in 20 s)
    await sleep(1000);
    await p.evaluate(() => { (window as unknown as { bise: { openWindow: (r?: string) => void } }).bise.openWindow('bise'); });
    try {
      // a fresh home with no project shows NoProject ('bise is here.'), a home with one shows FirstRun
      await p.locator(EMPTY_BLOCK).first().waitFor({ timeout: 40_000 });
    } catch (e) {
      await p.screenshot({ path: path.join(OUT, 'EMPTY-no-firstrun.png') });
      const seen = (await p.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 300);
      lines.push(`| EMPTY-no-firstrun.png | 1100 | no first-run block after 40 s on bise's main; the window reads: ${seen.replace(/\|/g, '\\|')} | — |`);
      throw e;
    }
    for (const px of [800, 1024, 1100, 1400]) {
      await s.app.evaluate(({ BrowserWindow }, w) => {
        const win = BrowserWindow.getAllWindows().find((b) => b.webContents.getURL().includes('surface=window'));
        win?.setContentSize(w, 760);
      }, px);
      await sleep(700);
      await p.screenshot({ path: path.join(OUT, `EMPTY-${String(px)}.png`) });
      const m = await p.evaluate(() => {
        const r = (sel: string): DOMRect | null => document.querySelector(sel)?.getBoundingClientRect() ?? null;
        const block = r('[data-testid="thread.noproject"]') ?? r('[data-testid="setup.firstrun"]');
        const col = r('.th-main') ?? r('[data-testid="thread.screen"]');
        const se = document.scrollingElement;
        // anything that scrolls in the window: an element whose content is taller than its box and may scroll
        const scrollers = Array.from(document.querySelectorAll('*')).filter((e) => {
          const st = getComputedStyle(e);
          return e.scrollHeight > e.clientHeight + 1 && /(auto|scroll)/.test(st.overflowY);
        }).map((e) => `${e.getAttribute('data-testid') ?? (e.getAttribute('class') ?? '').split(' ')[0] ?? e.tagName} +${String(e.scrollHeight - e.clientHeight)}`);
        return {
          block: block && { x: block.x, y: block.y, w: block.width, h: block.height },
          col: col && { x: col.x, y: col.y, w: col.width, h: col.height },
          page: se ? se.scrollHeight - se.clientHeight : -1,
          scrollers,
        };
      });
      const dx = m.block && m.col ? Math.round(m.block.x + m.block.w / 2 - (m.col.x + m.col.w / 2)) : NaN;
      const dy = m.block && m.col ? Math.round(m.block.y + m.block.h / 2 - (m.col.y + m.col.h / 2)) : NaN;
      lines.push(`| EMPTY-${String(px)}.png | ${String(px)} | block ${m.block ? `${String(Math.round(m.block.w))}x${String(Math.round(m.block.h))} at ${String(Math.round(m.block.x))},${String(Math.round(m.block.y))}` : 'none'}; its centre vs the column's: dx ${String(dx)}, dy ${String(dy)} | window scroll ${String(m.page)} px; scrolling boxes: ${m.scrollers.join(', ') || 'none'} |`);
    }
  } finally {
    appendFileSync(path.join(OUT, 'index.md'), ['', '## reshoot: EMPTY (fresh home, packed app, main\'s empty thread)', '', '| file | width | the first-run block | scroll |', '|---|---|---|---|', ...lines, ''].join('\n'));
    await s.close().catch(() => undefined);
  }
});
