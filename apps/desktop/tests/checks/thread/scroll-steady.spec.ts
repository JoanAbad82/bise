// thread/scroll-steady · scroll-steady (Gabriel: « il y a beaucoup de jumps et de glitches quand je
// scroll pendant qu'il y a des choses qui sont ajoutées en bas de l'historique […] que ce que je vois
// ne glitch pas »). Owner: scroll-steady.
// On FakeCore: perf's thread, long enough to scroll; the agent works fast at the bottom (a live
// reply that grows and lands, a tool row that runs, gets its output and ends, new rows one after
// the other) while he wheels up from the end, notch by notch, then stops to read. Every drawn
// frame, every row's top and height is read (steady.ts). Passes when what he reads moves only by
// his notches: 0 px of drift on every frame (a whole device px at most: scrollTop's rounding), his
// rows moved down by his notches and nothing else (never pulled back to the end), and he is still
// up there at the end. Before the fix: 20 to 186 px a frame (Virtuoso's following, a frame behind
// his wheel, and rows above measured late). The drift is printed, per added entry too.
// STEADY_REC=1: the screencast's frames in the test's output (steady-<n>.png), for designer.
import { writeFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { PNG } from 'pngjs';
import { FakeCore, launchDesktop, Recorder, test, expect } from '../../harness';
import { thread } from '../../../src/proto/words_thread.gen';
import { drift, type Frame } from './steady';

const ACME = 'acme-1a2b3c4d';
// the rows' times are 2 minutes ago: the live reply is stamped now (shared/partial.ts), and a day
// apart it would draw a day divider the landed entry doesn't (a 32 px change that isn't this test's)
const T0 = Date.now() - 120_000;
const WORDS = 'the cold run is slow because the index is rebuilt at every start of the hub, so we keep it warm between two runs of the gate and measure again';
/** One wheel notch (px), and how many he gives, how far apart. */
const NOTCH = 60;
const NOTCHES = 15;
const GAP_MS = 150;

type E = Record<string, unknown>;
const para = (n: number, i: number): string => Array.from({ length: n }, (_, k) => `${String(i)}.${String(k)} ${WORDS}.`).join(' ');
const you = (pos: number): E => ({ pos, at_ms: T0 + pos * 1000, kind: 'you', text: `where are we on step ${String(pos)}?`, delivery: 'read', msg_id: 1000 + pos });
const agent = (pos: number, text: string): E => ({ pos, at_ms: T0 + pos * 1000, kind: 'agent', text });
const tools = (pos: number, state: 'run' | 'ok', out?: string): E => ({
  pos,
  at_ms: T0 + pos * 1000,
  kind: 'tools',
  text: thread.did_run({ n: 1 }),
  tools: { count: 1, summary: thread.did_run({ n: 1 }), items: [{ pos, id: pos, at_ms: T0 + pos * 1000, text: `running the tests ${String(pos)}`, kind: 'run', state, code: 'cargo test -q', ...(state === 'ok' ? { ms: 2400 } : {}), ...(out === undefined ? {} : { out }) }] },
});

/** The first 60 entries: his asks, long answers, tools. */
function history(): E[] {
  const out: E[] = [];
  for (let pos = 1; pos <= 60; pos += 3) out.push(you(pos), agent(pos + 1, para(3, pos)), tools(pos + 2, 'ok', 'ok'));
  return out;
}

/** Starts reading every drawn frame (rows' tops and heights) and his wheel events' times. */
async function watchFrames(page: Page): Promise<void> {
  await page.evaluate(() => {
    const sc = document.querySelector<HTMLElement>('[data-testid="thread.list"] [data-virtuoso-scroller]');
    if (sc === null) throw new Error('no scroller');
    const w = window as unknown as { __steady: { frames: unknown[]; wheels: number[]; on: boolean } };
    w.__steady = { frames: [], wheels: [], on: true };
    sc.addEventListener('wheel', () => w.__steady.wheels.push(performance.now()), { passive: true, capture: true });
    const tick = (): void => {
      if (!w.__steady.on) return;
      const edge = sc.getBoundingClientRect().top;
      const rows: Record<string, { y: number; h: number }> = {};
      for (const r of Array.from(sc.querySelectorAll<HTMLElement>('[data-item-index]'))) {
        const b = (r.querySelector<HTMLElement>('.th-row') ?? r).getBoundingClientRect();
        rows[r.dataset['itemIndex'] ?? ''] = { y: b.top - edge, h: r.getBoundingClientRect().height };
      }
      w.__steady.frames.push({ t: performance.now(), rows, ch: sc.clientHeight, st: sc.scrollTop, sh: sc.scrollHeight, stuck: document.querySelector('[data-testid="thread.list"]')?.getAttribute('data-stuck') });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/** The list at its end (its last px in view). */
async function atEnd(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const sc = document.querySelector<HTMLElement>('[data-testid="thread.list"] [data-virtuoso-scroller]');
    return sc !== null && sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2;
  });
}

test('thread/scroll-steady: he scrolls up while the agent works at the bottom, what he reads never jumps', async () => {
  test.setTimeout(120_000);
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${ACME}/perf` });
  try {
    const { page } = s;
    await s.app.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows().find((b) => b.webContents.getURL().includes('surface=window'))?.setContentSize(1100, 900);
    });
    await expect(page.getByTestId('thread.list')).toBeVisible({ timeout: 15_000 });
    await core.send({ ev: 'thread', project: ACME, agent: 'perf', entries: history(), before: null, more: false } as never);
    await expect(page.getByTestId('thread.you.58')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
    await watchFrames(page);
    const rec = process.env['STEADY_REC'] === '1' ? new Recorder(s.cdp, page) : undefined;
    await rec?.start();

    // the agent at work: 3 rounds of his ask, a live reply in 5 parts that lands, a tool that runs
    let added = 0;
    let pos = 61;
    const send = async (ev: E): Promise<void> => {
      await core.send(ev as never);
      if (ev['ev'] === 'entry') added += 1;
      await page.waitForTimeout(60);
    };
    const work = (async () => {
      for (let k = 0; k < 4; k++) {
        await send({ ev: 'entry', project: ACME, agent: 'perf', entry: you(pos) });
        pos += 1;
        const call = `c${String(k)}`;
        let text = '';
        for (let p = 0; p < 5; p++) {
          text += `${para(1, pos * 10 + p)}\n\n`;
          await send({ ev: 'partial', project: ACME, agent: 'perf', call, off: 0, text });
        }
        await send({ ev: 'partial', project: ACME, agent: 'perf', call, off: 0, text: '' });
        await send({ ev: 'entry', project: ACME, agent: 'perf', entry: agent(pos, text.trim()) });
        pos += 1;
        await send({ ev: 'entry', project: ACME, agent: 'perf', entry: tools(pos, 'run') });
        await send({ ev: 'tool_out', project: ACME, agent: 'perf', pos, out: 'running 40 tests\ntest query::slow ... ok\n'.repeat(4), cut: false });
        await send({ ev: 'entry', project: ACME, agent: 'perf', entry: tools(pos, 'ok', 'ok') });
        pos += 1;
      }
    })().catch((e: unknown) => e);

    // at the end, the list follows the new rows, with no 'back to the bottom' (designer m_49719)
    await page.waitForTimeout(700);
    await expect(page.getByTestId('thread.list'), 'at the end, it sticks to the end').toHaveAttribute('data-stuck', 'true');
    await expect.poll(() => atEnd(page), { timeout: 1000, message: 'at the end, it follows the new rows' }).toBe(true);
    await expect(page.getByTestId('thread.to-end'), 'at the end: no pill').toBeHidden();

    // he wheels up from the end while it works, notch by notch, then reads
    const box = await page.getByTestId('thread.list').boundingBox();
    if (box === null) throw new Error('no list');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < NOTCHES; i++) {
      await page.mouse.wheel(0, -NOTCH);
      await page.waitForTimeout(GAP_MS);
    }
    const failed = await work;
    if (failed instanceof Error) throw failed;
    if (failed !== undefined) throw new Error(JSON.stringify(failed));
    await page.waitForTimeout(800);

    const seen = await page.evaluate(() => {
      const w = window as unknown as { __steady: { frames: Frame[]; wheels: number[]; on: boolean } };
      w.__steady.on = false;
      return w.__steady;
    });
    const frames = await rec?.stop();
    frames?.forEach((f, i) => {
      writeFileSync(test.info().outputPath(`steady-${String(i).padStart(4, '0')}.png`), PNG.sync.write(f.png));
    });
    writeFileSync(test.info().outputPath('steady-frames.json'), JSON.stringify(seen));
    const from = seen.wheels[0] ?? Infinity;
    const d = drift(seen.frames.filter((f) => f.t >= from), NOTCH);
    console.log(`drift: worst ${String(d.worst)} px, ${String(d.sum)} px in all over ${String(added)} added entries (${(d.sum / Math.max(1, added)).toFixed(1)} px per entry), his rows moved ${String(d.moved)} px for ${String(NOTCHES)} notches of ${String(NOTCH)}: ${JSON.stringify(d.bad)}`);
    test.info().annotations.push({ type: 'drift', description: JSON.stringify({ worst: d.worst, sum: d.sum, added, moved: d.moved, bad: d.bad }) });

    expect(added, 'the agent worked while he scrolled').toBeGreaterThan(10);
    expect(seen.wheels.length, 'every notch reached the list').toBe(NOTCHES);
    expect(d.worst, 'what he reads moves only by his notches, on every frame (px)').toBeLessThanOrEqual(1);
    // his rows moved by whole notches and nothing else: a jump the size of a notch hides in one
    // frame, never in the total. A notch whose frame has no row on screen before and after (the
    // first, at the end, while the live reply grows) is not counted: one or two at most
    expect(Math.abs(d.moved - Math.round(d.moved / NOTCH) * NOTCH), 'his rows moved by whole notches (px)').toBeLessThanOrEqual(1);
    expect(d.moved, 'never more than his notches').toBeLessThanOrEqual(NOTCHES * NOTCH + 1);
    expect(d.moved, 'his notches all moved the list').toBeGreaterThanOrEqual((NOTCHES - 2) * NOTCH - 1);
    await expect(page.getByTestId('thread.to-end'), 'still up where he scrolled: never taken back to the end').toBeVisible();

    // up there, a fold he opens (a tool row's steps) keeps its own row still and grows downward
    // (amb-win's fold-hold, designer m_49719): 0 px on every frame while it opens
    const fold = await page.evaluate(() => {
      const sc = document.querySelector<HTMLElement>('[data-testid="thread.list"] [data-virtuoso-scroller]');
      if (sc === null) return undefined;
      const top = sc.getBoundingClientRect().top;
      const heads = Array.from(sc.querySelectorAll<HTMLElement>('[data-testid^="thread.tools."][aria-expanded="false"]'));
      return heads.map((h) => ({ id: h.dataset['testid'] ?? '', y: h.getBoundingClientRect().top - top })).find((h) => h.y > 20 && h.y < sc.clientHeight - 120)?.id;
    });
    if (fold === undefined) throw new Error('no closed tool row in the view');
    const head = page.getByTestId(fold);
    const y0 = (await head.boundingBox())?.y ?? NaN;
    await page.evaluate((id) => {
      const w = window as unknown as { __fold: number[]; __foldOn: boolean };
      w.__fold = [];
      w.__foldOn = true;
      const tick = (): void => {
        if (!w.__foldOn) return;
        w.__fold.push(document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect().top ?? NaN);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, fold);
    await head.click();
    await expect(head).toHaveAttribute('aria-expanded', 'true');
    await page.waitForTimeout(600);
    const ys = await page.evaluate(() => {
      const w = window as unknown as { __fold: number[]; __foldOn: boolean };
      w.__foldOn = false;
      return w.__fold;
    });
    const foldMoved = Math.max(...ys.map((y) => Math.abs(y - y0)));
    console.log(`fold ${fold}: moved ${String(foldMoved)} px at most over ${String(ys.length)} frames while it opened`);
    expect(foldMoved, 'the fold he opened kept its row still (px)').toBeLessThanOrEqual(1);
  } finally {
    await s.close();
    core.dispose();
  }
});
