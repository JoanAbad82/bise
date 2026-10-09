// thread/tools-real · bar R11 / S9 (a tool call's line says its state as the TUI's tool row:
// '✓ 0.3 s' when it went well, '✗ exit 1 · 2.1 s' and its first error line when it failed; ⌘E opens
// every call's code and output), amb-win 65f88c68 on amb-feed's typed tool items f430dd0b,
// ambient-lead m_14101. Owner: qa-flows.
// The NEW app on the REAL core over the throwaway world, next to the TUI on the same hub. shop's
// fake main runs three bash calls in one turn (world say, fake_provider's [[bash: …]]): one that
// succeeds, one that exits 1 with an error line, and a long one (2 s, ~9 KB of output, past the
// 4 KB cap). Passes when, for each call:
//   - the window's line ends as the TUI's row: the same mark (✓ / ✗), the same exit and the same
//     time (the TUI writes '0.3s', the window '0.3 s': spaces aside, equal);
//   - the failed one has its first error line under it in both, its end in the err tone (the ✗ and
//     'exit 1' say it without the colour), and the good ones show no exit;
//   - ⌘E opens every call's code and output in the window (the command, then its output; the long
//     one's first lines), ⌘E again closes them.
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubOf, launchOn, realWorld, transcriptHas, tui, tuiReady, worldSay, type Tui } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  list: '[data-testid="thread.list"]',
  tools: '[data-testid^="thread.tool."]',
};

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
/** '✓ 0.3 s' and '✓ 0.3s' are the same words: spaces aside. */
const squash = (s: string): string => s.replace(/\s+/g, '');

type Line = { id: string; text: string; end: string; endClass: string; err: string };

test("thread/tools-real: a call's state, time, exit and error line as the TUI's tool rows; ⌘E opens code and output", async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const shop = hubOf(w, 'shop');
  const project = path.basename(path.dirname(shop.sock));
  const n = `t${String(Date.now() % 1_000_000)}`;
  const calls = {
    ok: `echo qa-ok-${n}`,
    fail: `ls /nowhere-${n}`,
    long: `sleep 2; seq 1 400 | sed 's/^/qa-long-${n} /'`,
  } as const;
  const s = await launchOn(w, `project/${project}`, T.field);
  let t: Tui | undefined;
  const note = (type: string, v: unknown) => test.info().annotations.push({ type, description: typeof v === 'string' ? v : JSON.stringify(v) });
  try {
    const { page } = s;
    await expect(page.locator(T.field).first(), "shop's main thread").toBeVisible({ timeout: 15_000 });
    t = tui(w, 'shop', '200x60');
    await tuiReady(t);

    // the agents' side: shop's main runs the three calls in one turn
    worldSay('shop', `[[bash: ${calls.ok}]] [[bash: ${calls.fail}]] [[bash: ${calls.long}]] three calls ${n}`);
    // its output's first line (a long output is kept capped: its last lines may never be there)
    await expect.soft.poll(() => transcriptHas(w, 'shop', 'main', `qa-long-${n} 1`), { timeout: 90_000, message: 'the long call ran (main\'s transcript)' }).toBe(true);

    // the window's tool lines, by their own ids (thread.tool.<pos>, not .end/.err/.open)
    const lines = (): Promise<Line[]> =>
      page.locator(T.tools).evaluateAll((els) =>
        els
          .filter((e) => /^thread\.tool\.\d+$/.test(e.getAttribute('data-testid') ?? ''))
          .map((e) => {
            const id = e.getAttribute('data-testid') ?? '';
            const at = (suffix: string) => document.querySelector(`[data-testid="${id}${suffix}"]`);
            return {
              id,
              text: (e.querySelector('.th-tool-text')?.textContent ?? '').trim(),
              end: (at('.end')?.textContent ?? '').trim(),
              endClass: at('.end')?.className ?? '',
              err: (at('.err')?.textContent ?? '').trim(),
            };
          }),
      );
    const lineOf = (all: Line[], cmd: string): Line | undefined => all.filter((l) => l.text.includes(cmd.slice(0, 24))).at(-1);
    await expect
      .poll(async () => { const all = await lines(); return Object.values(calls).every((c) => (lineOf(all, c)?.end ?? '') !== ''); }, { timeout: 30_000, message: 'the three calls have their end in the window' })
      .toBe(true);
    const win = await lines();
    note('window-lines', win.filter((l) => l.text.includes(n)));
    const row = page.locator(`[data-testid="${lineOf(win, calls.long)?.id ?? 'none'}"]`);
    await row.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => undefined);
    await page.screenshot({ path: test.info().outputPath('lines.png') });

    // the TUI's rows for the same calls: its screen settles on them (the turn is done)
    await sleep(1500);
    const screen = t.screen();
    test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(screen) });
    const rows = screen.split('\n');
    const tuiRow = (cmd: string): { end: string; next: string } => {
      const i = rows.map((r, k) => [r, k] as const).filter(([r]) => r.includes(cmd.slice(0, 24))).at(-1)?.[1] ?? -1;
      if (i < 0) return { end: '', next: '' };
      const end = /(✓(?: [\d.]+m? ?s|[\d.]+s)?|✗ exit \d+(?: · [^│]+?s)?|✗(?: [\d.]+s)?)\s*(?:│|$)/.exec(rows[i] ?? '')?.[1] ?? '';
      return { end: end.trim(), next: (rows[i + 1] ?? '').trim() };
    };

    await test.step('ok: ✓ and its time, as the TUI; no exit, no error line', () => {
      const l = lineOf(win, calls.ok);
      const r = tuiRow(calls.ok);
      note('ok', { window: l?.end, tui: r.end });
      expect.soft(l?.end ?? '', 'window: ✓ and a time').toMatch(/^✓ \d+\.\d s$/);
      expect.soft(l?.err ?? '', 'window: no error line').toBe('');
      expect.soft(squash(l?.end ?? ''), "the TUI's row says the same").toBe(squash(r.end));
    });

    await test.step('fail: ✗ exit 1 · time and its first error line, as the TUI; the err tone', async () => {
      const l = lineOf(win, calls.fail);
      const r = tuiRow(calls.fail);
      note('fail', { window: l?.end, err: l?.err, tone: l?.endClass, tui: r.end, tuiNext: r.next });
      expect.soft(l?.end ?? '', 'window: ✗ exit 1 · a time').toMatch(/^✗ exit 1 · \d+\.\d s$/);
      expect.soft(l?.endClass ?? '', 'window: the err tone').toContain('err');
      expect.soft(l?.err ?? '', "window: the call's first error line").toContain('No such file or directory');
      expect.soft(squash(l?.end ?? ''), "the TUI's row says the same").toBe(squash(r.end));
      expect.soft(r.next, "the TUI's error line under it").toContain('No such file or directory');
      const id = l?.id ?? 'none';
      await page.locator(`[data-testid="${id}"]`).screenshot({ path: test.info().outputPath('fail-line.png') }).catch(() => undefined);
    });

    await test.step('long: ✓ and its 2 s, as the TUI', () => {
      const l = lineOf(win, calls.long);
      const r = tuiRow(calls.long);
      note('long', { window: l?.end, tui: r.end });
      expect.soft(l?.end ?? '', 'window: ✓ and at least 2 s').toMatch(/^✓ [2-9]\.\d s$/);
      expect.soft(squash(l?.end ?? ''), "the TUI's row says the same").toBe(squash(r.end));
    });

    await test.step('⌘E opens every call\'s code and output, again closes them', async () => {
      await page.locator(T.field).first().click();
      await page.keyboard.press('Meta+e');
      const opened = async () => {
        const out: Record<string, string> = {};
        for (const [k, c] of Object.entries(calls)) {
          const id = lineOf(await lines(), c)?.id ?? 'none';
          out[k] = ((await page.locator(`[data-testid="${id}.open"]`).textContent({ timeout: 500 }).catch(() => '')) ?? '').trim();
        }
        return out;
      };
      await expect.soft.poll(async () => Object.values(await opened()).every((x) => x !== ''), { timeout: 5000, message: '⌘E: every call open' }).toBe(true);
      const o = await opened();
      note('open', Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { chars: v.length, head: v.slice(0, 160) }])));
      expect.soft(o['ok'] ?? '', 'ok: its command and its output').toContain(`qa-ok-${n}`);
      expect.soft(o['fail'] ?? '', 'fail: its command').toContain(`/nowhere-${n}`);
      expect.soft(o['fail'] ?? '', 'fail: its output').toContain('No such file or directory');
      expect.soft(o['long'] ?? '', "long: its output's first lines").toContain(`qa-long-${n} 1`);
      await page.locator(`[data-testid="${lineOf(await lines(), calls.long)?.id ?? 'none'}"]`).scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => undefined);
      await page.screenshot({ path: test.info().outputPath('open.png') });
      await page.keyboard.press('Meta+e');
      await expect.soft.poll(async () => Object.values(await opened()).every((x) => x === ''), { timeout: 5000, message: '⌘E again: every call closed' }).toBe(true);
    });
  } finally {
    t?.close();
    await s.close();
  }
});
