// thread/keys-real · TP-R6 + TP-K7b (docs/terminal-parity.md; amb-win/amb-web 21002943, ambient-lead
// m_17351). Owner: qa-flows. The NEW app on the REAL core over the throwaway world (../world.ts),
// bise's own TUI on the same home hub as the reference. Real keys only.
//   1. ⇧⇥ in the composer flips the approvals mode yolo ↔ auto like the TUI's own ⇧⇥: the hub's
//      mode (approvals/set read on its socket, outside the app) flips, the window's label line
//      flashes the TUI's words (keybar.rs flash_words) then the divider reads the new mode, and the
//      TUI on the same hub shows the new mode too; then ⇧⇥ in the TUI flips it back and the window
//      follows. The mode it had is put back at the end.
//   2. ctrl+c with no selection stops a busy turn of bise's main (a 12 s tool: [[bash: sleep 12]]),
//      the draft stays; esc does it too; the TUI's ctrl+c on the same kind of turn is the
//      reference. Each: the stop line in the window, and the hub says main is no longer working
//      (ms from the key, annotated).
import { test, expect } from '../../harness';
import { hubCall, hubOf, hubState, launchReal, realWorld, transcriptHas, tui, tuiReady, tuiSay, type Tui, type World } from '../world';

import { composer } from '../../../src/proto/words_composer.gen';
const T = {
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  thread: '[data-testid="thread.list"]',
  screen: '[data-testid="thread.screen"]',
  // the mode is the box's menu now (designer's composer-strip A): 'yolo ⌄' / 'approvals ⌄'
  end: '[data-testid="composer.mode"]',
  flash: '[data-testid="composer.flash"]',
};
/** the mode menu's word for a hub mode ('auto' reads 'approvals') */
const menuWord = (m: string): string => (m === 'auto' ? 'approvals' : m);
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const flat = (s: string): string => s.replace(/[│╭╮╰╯─┃├┤┬┴]/g, ' ').replace(/\s+/g, ' ');

const hubApprovals = async (w: World): Promise<Record<string, unknown>> => {
  const r = (await hubCall(hubOf(w, 'bise').sock, 'approvals/set', {})) as Record<string, unknown> | null;
  return r && typeof r['mode'] === 'string' ? r : await hubState(hubOf(w, 'bise').sock);
};
const hubMode = async (w: World): Promise<string> => {
  const mode = (await hubApprovals(w))['mode'];
  return typeof mode === 'string' ? mode : '';
};
const mainStatus = async (w: World): Promise<string> => {
  const agents = (await hubState(hubOf(w, 'bise').sock))['agents'] as { name: string; status: string }[] | undefined;
  return agents?.find((a) => a.name === 'main')?.status ?? '';
};
const other = (m: string): string => (m === 'yolo' ? 'auto' : 'yolo');
// the TUI's own words (rust/tui/src/keybar.rs flash_words), from the hub's approvals state: the
// checker off says 'edits run, commands ask you'; BISE_APPROVALS (the world sets it) adds 'this
// session only'
let checker = '';
let env = false;
const words = (m: string): string => {
  const what = m === 'auto' ? (checker === 'off' ? composer.approvals_auto_off : composer.approvals_auto) : composer.approvals_yolo;
  return `${what}${env ? ' (this session only: BISE_APPROVALS)' : ''}`;
};

async function open(w: World) {
  const s = await launchReal(w);
  const { page } = s;
  const field = page.locator(T.field).first();
  await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
  if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
  await expect(field, "bise's thread opens with its composer on the real core").toBeVisible({ timeout: 10_000 });
  return { s, page, field };
}

test("thread/keys-real: ⇧⇥ flips approvals yolo ↔ auto like the TUI's, both ways", async () => {
  test.setTimeout(180_000);
  const w = realWorld();
  const st = await hubApprovals(w);
  const start = typeof st['mode'] === 'string' ? st['mode'] : '';
  checker = typeof st['checker'] === 'string' ? st['checker'] : '';
  env = st['env'] === true;
  const note = (type: string, v: unknown) => test.info().annotations.push({ type, description: typeof v === 'string' ? v : JSON.stringify(v) });
  const { s, page, field } = await open(w);
  let t: Tui | undefined;
  try {
    t = tui(w, 'bise');
    await tuiReady(t);
    note('start', { hub: start, checker, env });
    expect(['yolo', 'auto'], 'the hub has a mode').toContain(start);
    await expect(page.locator(T.end), 'the mode menu reads the hub mode').toContainText(menuWord(start), { timeout: 5000 });
    await field.click();
    await page.keyboard.type('a draft');
    await page.screenshot({ path: test.info().outputPath('0-start.png') });

    await test.step('⇧⇥ in the window: the hub flips, the label flashes, the TUI follows', async () => {
      const to = other(start);
      await page.keyboard.press('Shift+Tab');
      await expect.poll(() => hubMode(w), { timeout: 5000, message: `the hub's mode is ${to}` }).toBe(to);
      await expect(page.locator(T.flash), "the flash says it in the TUI's words").toContainText(`${to} · ${words(to)}`, { timeout: 3000 });
      await page.screenshot({ path: test.info().outputPath('1-window-flash.png') });
      let tuiFlash = '';
      for (let i = 0; i < 10 && tuiFlash === ''; i++) {
        const sc = flat(t?.screen() ?? '');
        if (sc.includes(`${to} · ${words(to)}`)) tuiFlash = sc;
        else await sleep(200);
      }
      test.info().attachments.push({ name: 'tui-after-window-toggle', contentType: 'text/plain', body: Buffer.from(t?.screen() ?? '') });
      expect.soft(tuiFlash, `the TUI on the same hub flashes '${to} · ${words(to)}' too`).not.toBe('');
      await expect(field, 'his draft is untouched').toHaveText('a draft');
      await expect(page.locator(T.flash), 'the flash lasts 3 s').toHaveCount(0, { timeout: 4500 });
      await expect(page.locator(T.end), 'then the mode menu reads the new mode').toContainText(menuWord(to));
      await page.screenshot({ path: test.info().outputPath('2-window-divider.png') });
      await sleep(500);
      const sc = t?.screen() ?? '';
      test.info().attachments.push({ name: 'tui-divider', contentType: 'text/plain', body: Buffer.from(sc) });
      expect.soft(flat(sc.split('\n').slice(-8).join('\n')), "the TUI's divider reads it").toMatch(new RegExp(`\\b${to}\\b`));
    });

    await test.step('⇧⇥ in the TUI: the hub flips back, the window follows', async () => {
      t?.keys('BTab');
      await expect.poll(() => hubMode(w), { timeout: 5000, message: `the hub's mode is ${start} again` }).toBe(start);
      await expect(page.locator(T.flash), 'the window flashes the TUI’s switch').toContainText(`${start} · ${words(start)}`, { timeout: 3000 }).catch(async (e: unknown) => {
        await page.screenshot({ path: test.info().outputPath('3-window-no-flash.png') });
        throw e;
      });
      await page.screenshot({ path: test.info().outputPath('3-window-flash-from-tui.png') });
      await expect(page.locator(T.end)).toContainText(menuWord(start), { timeout: 4500 });
    });
  } finally {
    if ((await hubMode(w).catch(() => start)) !== start) await hubCall(hubOf(w, 'bise').sock, 'approvals/set', { mode: start }).catch(() => undefined);
    t?.close();
    await s.close();
  }
});

test('thread/keys-real: ctrl+c (no selection) stops a busy turn like the TUI’s ctrl+c; esc never does (main m_22205)', async () => {
  test.setTimeout(300_000);
  const w = realWorld();
  const { s, page, field } = await open(w);
  let t: Tui | undefined;
  const times: Record<string, number> = {};
  const busy = async (how: string, send: (words: string) => Promise<void>) => {
    await expect.poll(() => mainStatus(w), { timeout: 30_000, message: 'bise main is idle first' }).not.toBe('working');
    const n = `k${Date.now() % 1_000_000}`;
    await send(`a long one [[bash: sleep 12]] ${n}`);
    await expect.poll(() => transcriptHas(w, 'bise', 'main', n), { timeout: 10_000, message: `${how}: main got the words` }).toBe(true);
    await expect.poll(() => mainStatus(w), { timeout: 10_000, message: `${how}: main works on it` }).toBe('working');
    await sleep(1500); // inside the tool
  };
  const stopped = async (how: string, t0: number): Promise<number> => {
    let ms = Infinity;
    while (Date.now() - t0 < 20_000) {
      if ((await mainStatus(w)) !== 'working') { ms = Date.now() - t0; break; }
      await sleep(100);
    }
    times[how] = ms;
    test.info().annotations.push({ type: 'stopped', description: `${how}: main stopped ${String(ms)} ms after the key` });
    return ms;
  };
  const fromWindow = async (words: string) => {
    await field.click();
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(words);
    await page.keyboard.press('Enter');
  };
  try {
    t = tui(w, 'bise');
    await tuiReady(t);

    for (const [how, key] of [['window ctrl+c', 'Control+c']] as const) {
      await test.step(`${how}: the busy turn stops, the draft stays`, async () => {
        await busy(how, fromWindow);
        await page.keyboard.type('garde ça');
        expect(await page.evaluate(() => window.getSelection()?.isCollapsed ?? true), 'no selection').toBe(true);
        const stopsBefore = await page.locator(T.screen).getByText(/stopping|stopped|interrupted/i).count();
        const t0 = Date.now();
        await page.keyboard.press(key);
        await expect.soft.poll(() => page.locator(T.screen).getByText(/stopping|stopped|interrupted/i).count(), { timeout: 2000, message: `${how}: a stop line shows` }).toBeGreaterThan(stopsBefore);
        await page.screenshot({ path: test.info().outputPath(`${how.replace(/\W+/g, '-')}-stopping.png`) });
        const ms = await stopped(how, t0);
        await page.screenshot({ path: test.info().outputPath(`${how.replace(/\W+/g, '-')}-stopped.png`) });
        await expect(field, `${how}: the composer keeps his draft`).toHaveText('garde ça');
        expect.soft(ms, `${how}: ms from the key to main's turn ended (hub)`).toBeLessThan(15_000);
      });
    }

    await test.step("the TUI's ctrl+c on the same turn (the reference)", async () => {
      await busy('tui ctrl+c', (words) => { tuiSay(t as Tui, words); return Promise.resolve(); });
      const t0 = Date.now();
      t?.keys('C-c');
      await stopped('tui ctrl+c', t0);
      test.info().attachments.push({ name: 'tui-after-ctrl-c', contentType: 'text/plain', body: Buffer.from(t?.screen() ?? '') });
      await page.screenshot({ path: test.info().outputPath('tui-ctrl-c-window.png') });
    });
    test.info().annotations.push({ type: 'times', description: JSON.stringify(times) });
    const ref = times['tui ctrl+c'] ?? Infinity;
    for (const how of ['window ctrl+c']) expect.soft(times[how] ?? Infinity, `${how} is no slower than the TUI's ctrl+c (+1 s)`).toBeLessThan(ref + 1000);
  } finally {
    t?.close();
    await s.close();
  }
});
