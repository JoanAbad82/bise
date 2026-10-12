// thread/working · the working indicator (designer's desktop-working page, tui-parity m_20165).
// Passes when, with the scripted core (FakeCore, fake data):
//   - perf's thread ends on the working row: the TUI's 5-cell gust (its frames step at 110 ms, only
//     the TUI's 9 frames, in a box that never changes width), then 'perf is working · running the
//     bench three more times · 14 min';
//   - the head chip carries the 1-cell breath (one of · ~ ∿ ≈) before 'working · 14 min';
//   - while he types in the composer the gust goes calm: no cell in ink;
//   - an agent with no action yet says 'docs is working · 42 s', never invented words;
//   - read up the thread, the row stays in view; a click on it brings the thread to its end;
//   - reduced motion: one still ∿ in ink, no frame moves;
// and writes the row's shots at 1400 / 1100 / 800, light and dark, plus three frames of the gust,
// in one sheet for designer (working-sheet.png).
// Owner: amb-web.
import { mkdirSync, writeFileSync } from 'node:fs';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'storefront-1a2b3c4d';
const MIN = 60_000;
const GUST5 = ['≈    ', '∿≈   ', '~∿≈  ', '·~∿≈ ', ' ·~∿≈', '  ·~∿', '   ·~', '    ·', '     '];
const prefs = (theme: 'light' | 'dark') => ({
  ev: 'prefs',
  prefs: {
    onboarded: true,
    theme,
    context: { shot: true, url: true, file: true, window_text: false },
    excluded_apps: [],
    quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
    voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
    shots_keep_days: 7,
  },
});
const world = (now: number) => {
  const ag = (name: string, over: Record<string, unknown>) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: now - 60 * MIN, waits: 0, ...over });
  const said = (i: number) => ({ pos: i, at_ms: now - (40 - i) * 20_000, kind: i % 2 === 1 ? 'you' : 'agent', text: i % 2 === 1 ? `run number ${String(i)} please` : `run ${String(i)}: the page paints in ${String(2 + (i % 7) / 10)} s on mobile, the hero image still dominates the first paint and the reviews widget blocks it while it loads.` });
  return [
    prefs('light'),
    {
      ev: 'projects',
      projects: [
        { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
        { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 3, working: 2, waits: 0, running: true },
      ],
    },
    { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
    {
      ev: 'agents',
      project: P,
      agents: [
        ag('main', {}),
        ag('perf', { status: 'working', since_ms: now - 14 * MIN, purpose: 'product page speed', title: 'running the bench three more times', branch: 'sb/perf' }),
        ag('docs', { status: 'working', since_ms: now - 42_000, purpose: 'api examples', title: '', branch: 'sb/docs' }),
      ],
    },
    { ev: 'thread', project: P, agent: 'perf', entries: Array.from({ length: 30 }, (_, i) => said(i + 1)), before: null, more: false },
    {
      ev: 'thread',
      project: P,
      agent: 'docs',
      entries: [
        { pos: 1, at_ms: now - 30 * MIN, kind: 'you', text: 'write the api examples' },
        { pos: 2, at_ms: now - 29 * MIN, kind: 'agent', text: 'on it: one example per endpoint.' },
      ],
      before: null,
      more: false,
    },
    { ev: 'thread', project: P, agent: 'main', entries: [], before: null, more: false },
  ];
};

test('thread/working: the gust and its words at the thread end, the breath in the chip, calm while he types, still under reduced motion', async () => {
  test.setTimeout(150_000);
  const now = Date.now();
  const core = new FakeCore(world(now) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  const shots: { label: string; png: Buffer }[] = [];
  try {
    const { page } = s;
    const size = async (w: number, h: number) => {
      await s.app.evaluate(({ BrowserWindow }, [w, h]) => {
        const win = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
        win?.setContentSize(w, h);
      }, [w, h] as const);
      await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(w);
    };
    const theme = async (t: 'light' | 'dark') => {
      await core.send(prefs(t) as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
    };
    const row = page.getByTestId('thread.live');
    const gust = page.getByTestId('thread.live.gust');
    /** the gust's cells over `ms`, every 30 ms: text, tones, box width */
    const sample = (ms: number) =>
      page.evaluate(async (ms) => {
        const el = document.querySelector('[data-testid="thread.live.gust"]') as HTMLElement;
        const out: { text: string; tones: string[]; w: number }[] = [];
        const end = Date.now() + ms;
        while (Date.now() < end) {
          out.push({ text: el.textContent, tones: Array.from(el.children).filter((c) => c.textContent !== ' ').map((c) => (c as HTMLElement).dataset['tone'] ?? ''), w: el.getBoundingClientRect().width });
          await new Promise((r) => setTimeout(r, 30));
        }
        return out;
      }, ms);

    await size(1400, 900);
    await expect(row).toBeVisible({ timeout: 10_000 });
    // (1) the words: name, 'is working', the core's action, the turn's age
    await expect(row).toHaveText(/perf is working · running the bench three more times · 14 min$/);
    await expect(row).toHaveAttribute('role', 'status');
    await expect(gust).toHaveAttribute('aria-hidden', 'true');
    // (1) the gust steps through the TUI's frames, in a fixed box
    const run = await sample(700);
    const seen = new Set(run.map((x) => x.text));
    expect(seen.size, `the gust moves (several frames in 700 ms): ${JSON.stringify([...seen])}`).toBeGreaterThanOrEqual(4);
    for (const t of seen) expect(GUST5, `'${t}' is one of the TUI's frames`).toContain(t);
    expect(new Set(run.map((x) => Math.round(x.w))).size, 'the box keeps its width').toBe(1);
    // (2) the head chip's breath
    await expect(page.getByTestId('thread.head.state')).toHaveText(/^[·~∿≈] working · 14 min$/);
    await expect(page.getByTestId('thread.head.state.breath')).toHaveCount(1);
    // (2b) designer m_20262: one place only, the label's right drops 'working · 14 min' while the row shows
    const label = page.getByTestId('composer').locator('.div').first();
    await expect(label).toContainText('to perf');
    await expect(label).not.toContainText('working');
    // the thread's end gap: 20 px from the row's bottom to the label
    const rowBox = await row.boundingBox();
    const labelBox = await label.boundingBox();
    if (rowBox === null || labelBox === null) throw new Error('no row or label');
    expect(Math.abs(labelBox.y - (rowBox.y + rowBox.height) - 20), `20 px under the row (${String(labelBox.y - rowBox.y - rowBox.height)})`).toBeLessThanOrEqual(1);
    // the gust's box starts on the thread's text column ('run 30:' above), no indent
    const gustBox = await gust.boundingBox();
    const textBox = await page.getByText(/^run 30:/).last().boundingBox();
    if (gustBox === null || textBox === null) throw new Error('no gust or text');
    expect(Math.abs(gustBox.x - textBox.x), `the gust at the text column (gust ${String(gustBox.x)}, text ${String(textBox.x)})`).toBeLessThanOrEqual(0.5);
    // (3) he types: calm (each tone one step down: no cell in ink)
    await page.locator('[data-testid="composer.field"]').first().click();
    await page.keyboard.type('compute it for 25 years too', { delay: 40 });
    const calm = await sample(500);
    expect(calm.flatMap((x) => x.tones), 'calm: no cell in ink while he types').not.toContain('ink');
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    // (5) read up the thread: the row stays in view; a click on it brings the thread to its end
    // the list's scrolling box is Virtuoso's scroller inside it
    const list = page.locator('[data-testid="thread.list"] [data-virtuoso-scroller="true"]').first();
    const gap = () => list.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop);
    await list.evaluate((el) => {
      el.scrollTop = 0;
    });
    await expect.poll(gap, { message: 'read up' }).toBeGreaterThan(200);
    await expect(row).toBeInViewport();
    await row.click();
    await expect.poll(gap, { message: 'a click on the row brings the thread to its end' }).toBeLessThan(4);

    // the shots: the row and the composer under it, 1400 / 1100 / 800, light and dark
    for (const t of ['light', 'dark'] as const) {
      await theme(t);
      for (const w of [1400, 1100, 800]) {
        await size(w, 760);
        await expect(row).toBeVisible();
        const box = await row.boundingBox();
        if (box === null) throw new Error('no row');
        const clip = { x: 0, y: Math.max(0, box.y - 120), width: w, height: Math.min(760 - Math.max(0, box.y - 120), 300) };
        // a frame with the gust's crest in it (its last frames are the tail and a blank)
        await expect(gust).toHaveText(/∿/);
        shots.push({ label: `${String(w)} · ${t}`, png: await page.screenshot({ clip }) });
      }
    }
    // three frames of the gust, close
    await size(1100, 760);
    await theme('light');
    for (let i = 0; i < 3; i++) {
      const box = await row.boundingBox();
      if (box === null) throw new Error('no row');
      shots.push({ label: `gust frame ${String(i + 1)}`, png: await page.screenshot({ clip: { x: box.x - 8, y: box.y - 6, width: 420, height: box.height + 12 } }) });
      await page.waitForTimeout(220);
    }

    // (4) no action yet: the name and the age alone
    await size(1400, 760);
    await page.getByTestId('app.right.agent.docs').click();
    await expect(page.getByTestId('thread.head.name')).toHaveText('docs', { timeout: 10_000 });
    await expect(row).toHaveText(/docs is working · 4\d s$/);
    await expect(page.getByTestId('thread.live.act')).toHaveCount(0);

    // (6) reduced motion: one still ∿ in ink
    // (no esc here: with no field focused it goes up, docs → main, and the row would go)
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // the media change reaches the window's clock as an event: wait for it, then it stays still
    await expect(gust).toHaveText('∿    ', { timeout: 2000 });
    const still = await sample(600);
    expect(new Set(still.map((x) => x.text)), 'still: one ∿').toEqual(new Set(['∿    ']));
    expect(still.every((x) => x.tones.join() === 'ink'), 'the still ∿ is in ink').toBe(true);
    await page.emulateMedia({ reducedMotion: null });
  } finally {
    const dir = test.info().outputDir;
    mkdirSync(dir, { recursive: true });
    for (const sh of shots) writeFileSync(`${dir}/working-${sh.label.replace(/[^a-z0-9]+/gi, '-')}.png`, sh.png);
    await s.close();
  }
});
