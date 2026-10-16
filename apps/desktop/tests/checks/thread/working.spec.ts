// thread/working · the working mark beside the composer's label (designer's desktop-working v2,
// his m_21668, tui-parity m_21679: the TUI's divider).
// Passes when, with the scripted core (FakeCore, fake data):
//   - while perf works, its thread has no working row: the TUI's 5-cell gust sits 8 px after
//     'to perf' on the label line (its frames step at 110 ms, only the TUI's 9 frames, in a box
//     that never changes width), nothing else beside it; the label's right has no 'working';
//   - the head chip keeps its 1-cell breath before 'working · 14 min';
//   - hover on the gust: 'perf is working · 14 min';
//   - the step at work is drawn once: a running command keeps its '$' and ends with '∿ N s'; a
//     call the model described ('lecture du PDF…') is the growing fold '▸ lecture du PDF…  ∿ N s'
//     at the thread's end, with no mono line for it;
//   - while he types the gust goes calm: no cell in ink;
//   - idle: no mark, no '∿' on the tool row;
//   - reduced motion: one still ∿ in ink, no frame moves;
// and writes the shots for designer at 1100, light and dark: working (perf's command, docs' fold),
// a long turn read up, the hover tooltip, idle (in $SHOTS when set, else the test's output dir).
// Owner: amb-home (the gust's motion: amb-web's working/).
import { mkdirSync, writeFileSync } from 'node:fs';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { thread } from '../../../src/proto/words.gen';

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
const agents = (now: number, perf: 'working' | 'idle') => {
  const ag = (name: string, over: Record<string, unknown>) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: now - 60 * MIN, waits: 0, ...over });
  return {
    ev: 'agents',
    project: P,
    agents: [
      ag('main', {}),
      ag('perf', { status: perf, since_ms: now - 14 * MIN, purpose: 'product page speed', title: 'running the bench three more times', branch: 'sb/perf' }),
      ag('docs', { status: 'working', since_ms: now - 42_000, purpose: 'api examples', title: '', branch: 'sb/docs' }),
    ],
  };
};
const world = (now: number) => {
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
    agents(now, 'working'),
    {
      ev: 'thread',
      project: P,
      agent: 'perf',
      entries: [
        ...Array.from({ length: 30 }, (_, i) => said(i + 1)),
        {
          pos: 31,
          at_ms: now - 40_000,
          kind: 'tools',
          text: thread.did_run({ n: 2 }),
          tools: {
            count: 2,
            summary: thread.did_run({ n: 2 }),
            items: [
              { pos: 41, at_ms: now - 40_000, text: 'pnpm build web/product', kind: 'run', state: 'ok' },
              { pos: 42, at_ms: now - 15_000, text: 'pnpm bench web/product --runs 3', kind: 'run', state: 'run' },
            ],
          },
        },
      ],
      before: null,
      more: false,
    },
    {
      ev: 'thread',
      project: P,
      agent: 'docs',
      entries: [
        { pos: 1, at_ms: now - 30 * MIN, kind: 'you', text: 'write the api examples from the tariff PDF' },
        { pos: 2, at_ms: now - 29 * MIN, kind: 'agent', text: 'on it: one example per endpoint.' },
        {
          pos: 3,
          at_ms: now - 10_000,
          kind: 'tools',
          text: 'lecture du PDF de tarifs',
          tools: {
            count: 1,
            summary: thread.did_run({ n: 1 }),
            items: [{ pos: 51, at_ms: now - 10_000, text: "lecture du PDF de tarifs d'Efficience", intent: "lecture du PDF de tarifs d'Efficience", kind: 'run', state: 'run' }],
          },
        },
      ],
      before: null,
      more: false,
    },
    { ev: 'thread', project: P, agent: 'main', entries: [], before: null, more: false },
  ];
};

test('thread/working: only the gust beside the label while it works, the step drawn once, a hover says the age, calm while he types, still under reduced motion', async () => {
  test.setTimeout(150_000);
  const now = Date.now();
  const core = new FakeCore(world(now) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  const shots: { label: string; png: Buffer }[] = [];
  try {
    const { page } = s;
    const W = 1100;
    const H = 760;
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
    // the thread's end and the composer: the bottom 340 px
    const shot = async (label: string) => {
      await page.mouse.move(2, 2);
      shots.push({ label, png: await page.screenshot({ clip: { x: 0, y: H - 340, width: W, height: 340 } }) });
    };
    const mark = page.getByTestId('thread.mark');
    const gust = page.getByTestId('thread.mark.gust');
    const label = page.locator('.th-screen [data-testid="composer.tab"]').first();
    /** px from the bottom of the last element matching `sel` (the thread's last row) to the label's top */
    const endGap = (sel: string) =>
      page.evaluate((s) => {
        const all = document.querySelectorAll(s);
        const last = all.item(all.length - 1) as Element | null;
        const lbl = document.querySelector('.th-screen [data-testid="composer.tab"]');
        if (!last || !lbl) return -1;
        return Math.round(lbl.getBoundingClientRect().top - last.getBoundingClientRect().bottom);
      }, sel);
    /** the gust's cells over `ms`, every 30 ms: text, tones, box width */
    const sample = (ms: number) =>
      page.evaluate(async (ms) => {
        const el = document.querySelector('[data-testid="thread.mark.gust"]') as HTMLElement;
        const out: { text: string; tones: string[]; w: number }[] = [];
        const end = Date.now() + ms;
        while (Date.now() < end) {
          out.push({ text: el.textContent, tones: Array.from(el.children).filter((c) => c.textContent !== ' ').map((c) => (c as HTMLElement).dataset['tone'] ?? ''), w: el.getBoundingClientRect().width });
          await new Promise((r) => setTimeout(r, 30));
        }
        return out;
      }, ms);

    await size(W, H);
    await expect(mark).toBeVisible({ timeout: 10_000 });
    // (1) no working row at the thread's end
    await expect(page.getByTestId('thread.live')).toHaveCount(0);
    await expect(page.getByTestId('thread.screen')).not.toContainText('is working');
    // (2) the gust on the label line, 8 px after 'to perf', nothing else beside it
    await expect(mark).toHaveAttribute('data-state', 'working');
    await expect(label.locator('[data-testid="composer.tab.to"] [data-testid="thread.mark"]')).toHaveCount(1);
    const gap = await page.evaluate(() => {
      const lbl = document.querySelector('.th-screen [data-testid="composer.tab.to"]');
      const words = lbl?.firstChild;
      const m = lbl?.querySelector('[data-testid="thread.mark"]');
      if (!words || !m) return { words: '', gap: -1 };
      const r = document.createRange();
      r.selectNodeContents(words);
      return { words: words.textContent ?? '', gap: m.getBoundingClientRect().left - r.getBoundingClientRect().right };
    });
    expect(gap.words).toBe('to perf');
    expect(Math.abs(gap.gap - 8), `8 px after the words (${String(gap.gap)})`).toBeLessThanOrEqual(1);
    await expect(gust).toHaveAttribute('aria-hidden', 'true');
    // the label's right: model · effort · mode · context, never 'working' (the gust says it)
    await expect(label).not.toContainText('working');
    // (2) the gust steps through the TUI's frames, in a fixed box
    const run = await sample(700);
    const seen = new Set(run.map((x) => x.text));
    expect(seen.size, `the gust moves (several frames in 700 ms): ${JSON.stringify([...seen])}`).toBeGreaterThanOrEqual(4);
    for (const t of seen) expect(GUST5, `'${t}' is one of the TUI's frames`).toContain(t);
    expect(new Set(run.map((x) => Math.round(x.w))).size, 'the box keeps its width').toBe(1);
    // (5) the head chip's breath, unchanged
    await expect(page.getByTestId('thread.head.state')).toHaveText(/^[·~∿≈] working · 14 min$/);
    await expect(page.getByTestId('thread.head.state.breath')).toHaveCount(1);
    // (4) a running command: its '$' stays, '∿ 15 s' at its end; no fold repeats it
    await expect(page.getByTestId('thread.tool.42')).toHaveText(/^\$ pnpm bench web\/product --runs 3/);
    await expect(page.getByTestId('thread.tool.42.time')).toHaveText(/^∿ 1\d s$/);
    await expect(page.getByTestId('thread.typing')).toHaveCount(0);
    const toolEnd = await endGap('.th-list .th-row');
    expect(toolEnd, `the thread's end gap under the tool row (${String(toolEnd)})`).toBeGreaterThanOrEqual(18);
    // (2) hover: the turn's age, in the ds tip (hover-tips)
    await expect(page.getByTestId('tip')).toHaveCount(0);
    await mark.hover();
    await expect(page.getByTestId('tip')).toHaveText('perf is working · 14 min');
    await page.mouse.move(2, 2);
    await expect(page.getByTestId('tip')).toHaveCount(0);
    // (3) he types: calm (each tone one step down: no cell in ink)
    await page.locator('[data-testid="composer.field"]').first().click();
    await page.keyboard.type('compute it for 25 years too', { delay: 40 });
    const calm = await sample(500);
    expect(calm.flatMap((x) => x.tones), 'calm: no cell in ink while he types').not.toContain('ink');
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.locator('.th-screen').first().click({ position: { x: 4, y: 200 } });

    const list = page.locator('[data-testid="thread.list"] [data-virtuoso-scroller="true"]').first();
    const toEnd = () => list.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop);
    for (const t of ['light', 'dark'] as const) {
      await theme(t);
      await page.getByTestId('app.right.agent.perf').click();
      await expect(mark).toBeVisible();
      await list.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await expect(gust).toHaveText(/∿/);
      await shot(`${t}-working-command`);
      // a long turn, read up a bit: the label's gust stays, nothing else at the end
      await list.evaluate((el) => {
        el.scrollTop = Math.max(0, el.scrollTop - 400);
      });
      await expect.poll(toEnd, { message: 'read up' }).toBeGreaterThan(200);
      await expect(mark).toBeInViewport();
      await shot(`${t}-long-turn-read-up`);
      await list.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await mark.hover();
      await expect(page.getByTestId('tip')).toBeVisible();
      shots.push({ label: `${t}-hover`, png: await page.screenshot({ clip: { x: 0, y: H - 340, width: W, height: 340 } }) });
      await page.mouse.move(2, 2);
      // (4) docs: the model's words about its call, the growing fold, once
      await page.getByTestId('app.right.agent.docs').click();
      await expect(page.getByTestId('app.title.crumb')).toHaveText(/›docs$/u, { timeout: 10_000 });
      await expect(page.getByTestId('thread.typing')).toContainText("lecture du PDF de tarifs d'Efficience");
      await expect(page.getByTestId('thread.typing.end')).toHaveText(/^∿ \d+ s$/);
      await expect(page.getByTestId('thread.tool.51'), 'no mono line for the same step').toHaveCount(0);
      const font = await page.getByTestId('thread.typing').locator('.b-fold').evaluate((el) => getComputedStyle(el).fontFamily);
      expect(font, 'the model\'s words are sans').not.toMatch(/mono/i);
      // the thread's end gap is the same under the fold as under a tool row (designer m_21721)
      const foldEnd = await endGap('[data-testid="thread.typing"]');
      expect(Math.abs(foldEnd - toolEnd), `the end gap under the fold (${String(foldEnd)}) is the tool row's (${String(toolEnd)})`).toBeLessThanOrEqual(1);
      await expect(page.locator('.th-screen [data-testid="composer.tab.to"] [data-testid="thread.mark"]')).toHaveCount(1);
      await shot(`${t}-working-fold`);
    }

    // idle: no mark, the command's row loses its '∿'
    await page.getByTestId('app.right.agent.perf').click();
    await expect(page.getByTestId('app.title.crumb')).toHaveText(/›perf$/u, { timeout: 10_000 });
    await core.send(agents(now, 'idle') as never);
    await expect(mark).toHaveCount(0);
    await expect(page.getByTestId('thread.tool.42')).not.toHaveAttribute('data-live', 'true');
    await expect(page.getByTestId('thread.typing')).toHaveCount(0);
    for (const t of ['dark', 'light'] as const) {
      await theme(t);
      await list.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await shot(`${t}-idle`);
    }

    // reduced motion: one still ∿ in ink (docs still works)
    await page.getByTestId('app.right.agent.docs').click();
    await expect(page.getByTestId('app.title.crumb')).toHaveText(/›docs$/u, { timeout: 10_000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(gust).toHaveText('∿    ', { timeout: 2000 });
    const still = await sample(600);
    expect(new Set(still.map((x) => x.text)), 'still: one ∿').toEqual(new Set(['∿    ']));
    expect(still.every((x) => x.tones.join() === 'ink'), 'the still ∿ is in ink').toBe(true);
    await page.emulateMedia({ reducedMotion: null });
  } finally {
    const dir = process.env['SHOTS'] ?? test.info().outputDir;
    mkdirSync(dir, { recursive: true });
    for (const sh of shots) writeFileSync(`${dir}/working-${sh.label.replace(/[^a-z0-9]+/gi, '-')}.png`, sh.png);
    await s.close();
  }
});
