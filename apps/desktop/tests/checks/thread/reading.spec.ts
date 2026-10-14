// thread/reading · his try round 3, point 3 (ambient's spec m_11777): the window's thread reads
// like a page. Passes when, in bise's own thread with the scripted core (FakeCore, fake data):
//   - (a) the rows sit in one column, 720 px at most, centred, 24 px each side when narrower; the
//     composer has the same width and left edge; a code block takes the whole column and scrolls
//     sideways (it never wraps), no row is wider than the column;
//   - (b) his message never shows the '<screen_context>' block: a chip '◫ with Chrome ·
//     localhost:4801/sett…' under his words instead;
//   - (c) a thinking of 0.0 s shows no row;
//   - (d) three identical 'session restored' notices in a row show once, as 'session restored · <clock>';
//   - (e) the time sits on the name line ('bise 09:46'); a row inside a group (same author, under
//     5 min) has no name line and shows its time there on hover only; days are separated
//     ('yesterday', 'today');
//   - (f) no avatar circles: bise's pearl at 14 px on its name line; every row's text starts at the
//     column edge, and a row never repeats its author ('perf: …' under 'perf').
// Writes one sheet (light + dark, 1400 and 800 px windows, top and bottom, a hover row) for
// ambient. Owner: amb-home.
import { writeFileSync } from 'node:fs';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
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
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
const MIN = 60_000;
const CODE = [
  '```rust',
  'fn cold_bench(cache: &mut Cache, runs: usize) -> Duration {',
  '    let start = Instant::now(); for _ in 0..runs { cache.reload_from_disk_every_time_because_the_warm_path_is_skipped(); }',
  '    start.elapsed()',
  '}',
  '```',
].join('\n');
const TABLE = ['| run | cold | warm |', '| --- | ---: | ---: |', '| 1 | 412 ms | 131 ms |', '| 2 | 405 ms | 128 ms |', '| 3 | 419 ms | 133 ms |'].join('\n');
const PROSE =
  'the cold bench reloads the whole cache from disk on every run, while the warm one keeps it in memory between runs, so most of the gap is the disk read and the parse, not the work itself. one fix is to keep a parsed copy next to the raw file.';
const ASK = 'why is the cold bench three times slower than the warm one on this page?';
const CONTEXT_BLOCK = '\n\n<screen_context app="Chrome">\nThis is what was in front of the user when they spoke.\nurl: http://localhost:4801/settings\ntitle: settings · bench\n</screen_context>\n';

const world = (now: number) => {
  const y = now - 86_400_000;
  const restored = (pos: number, at: number) => ({ pos, at_ms: at, kind: 'notice', text: 'session restored · 6 messages', notice: { level: 'info', text: 'session restored · 6 messages' } });
  return [
    prefs('light'),
    { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }] },
    { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
    { ev: 'agents', project: HOME, agents: [agent('main')] },
    {
      ev: 'thread',
      project: HOME,
      agent: 'main',
      entries: [
        { pos: 1, at_ms: y, kind: 'you', text: ASK + CONTEXT_BLOCK, context: { app: 'Chrome', url: 'http://localhost:4801/settings', title: 'settings · bench' } },
        { pos: 2, at_ms: y + 1000, kind: 'thinking', text: 'thought for 0.0s', thinking: { ms: 0, text: '' } },
        { pos: 3, at_ms: y + MIN, kind: 'agent', text: `${PROSE}\n\n${CODE}` },
        { pos: 4, at_ms: y + 2 * MIN, kind: 'agent', text: `the three runs:\n\n${TABLE}` },
        restored(5, now - 30 * MIN),
        restored(6, now - 30 * MIN + 10),
        restored(7, now - 30 * MIN + 20),
        { pos: 8, at_ms: now - 20 * MIN, kind: 'from_agent', from: 'perf', to: 'main', text: 'perf: the parsed copy cuts the cold run to 140 ms.' },
        { pos: 9, at_ms: now - 19 * MIN, kind: 'from_agent', from: 'perf', to: 'main', text: 'perf: landed on sb/perf, tests green.' },
        { pos: 10, at_ms: now - 5 * MIN, kind: 'agent', text: PROSE },
      ],
      before: null,
      more: false,
    },
  ];
};

test('thread/reading: one column, no raw context, no empty thinking, one restored row, times on the name line, no avatars', async () => {
  test.setTimeout(150_000);
  // a fixed clock: noon of today, so yesterday's rows (noon + 1, + 2 min) and today's (11:30 to 11:55)
  // never straddle midnight, whatever the hour the check runs (it was red at 23:5x and 00:05);
  // the app's 'today' is the real date, which noon of today always shares
  const now = new Date().setHours(12, 0, 0, 0);
  const core = new FakeCore(world(now) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${HOME}` });
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
    const scroll = async (to: 'top' | 'bottom') => {
      await page.evaluate((to) => {
        const el = document.querySelector('.th-list [data-virtuoso-scroller="true"]');
        if (el) el.scrollTop = to === 'top' ? 0 : el.scrollHeight;
      }, to);
      await page.waitForTimeout(250);
    };
    await size(1400, 1000);
    await expect(page.getByTestId('thread.entry.10')).toBeVisible({ timeout: 10_000 });
    await scroll('top');
    await expect(page.getByTestId('thread.entry.1')).toBeVisible();

    // (b) never the block, a chip instead
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toContain('screen_context');
    expect(body).not.toContain('This is what was in front of the user');
    await expect(page.getByTestId('thread.entry.1')).toContainText(ASK);
    await expect(page.getByTestId('thread.context.1')).toHaveText('◫ with Chrome · localhost:4801/sett…');
    // (c) no 0.0 s thinking
    await expect(page.getByTestId('thread.think.2')).toHaveCount(0);
    expect(body).not.toContain('thought for 0.0s');
    // (f) no avatars; bise's ':*' on its name line (bise-presence v10: still and ink, designer m_24599)
    await expect(page.locator('.b-av')).toHaveCount(0);
    await expect(page.locator('[data-testid="thread.entry.3"] .b-who .b-bise')).toHaveCount(1);
    // (e) the name line opens a group, with its time; the next row is in the group
    const clockOf = (ms: number) => page.evaluate((ms) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(ms), ms);
    await expect(page.getByTestId('thread.entry.3')).toHaveAttribute('data-head', 'true');
    await expect(page.locator('[data-testid="thread.entry.3"] .b-who').first()).toHaveText(`bise${await clockOf(now - 86_400_000 + MIN)}`);
    await expect(page.getByTestId('thread.entry.4')).toHaveAttribute('data-head', 'false');
    const hover = page.locator('[data-testid="thread.entry.4"] .b-who.b-hover');
    await expect(hover, 'a grouped row hides its time').toHaveCSS('opacity', '0');
    await expect(hover).toHaveText(await clockOf(now - 86_400_000 + 2 * MIN));
    await expect(page.getByTestId('thread.day.1')).toHaveText('yesterday');

    // (a) the measure at 1400: rows 720 wide, centred, the composer on the same edge, code full width
    const geo = () =>
      page.evaluate(() => {
        const r = (sel: string) => document.querySelector(sel)?.getBoundingClientRect();
        const list = r('.th-list');
        const row = r('[data-testid="thread.entry.3"]');
        const comp = r('.th-screen .b-composer');
        const pre = document.querySelector('[data-testid="thread.entry.3"] .th-pre');
        const p = r('[data-testid="thread.entry.3"] .b-text p');
        const rows = Array.from(document.querySelectorAll('.th-row')).map((x) => x.getBoundingClientRect());
        return {
          list: list && { left: list.left, width: list.width },
          row: row && { left: row.left, width: row.width },
          comp: comp && { left: comp.left, width: comp.width },
          pre: pre && { width: pre.getBoundingClientRect().width, scrolls: pre.scrollWidth > pre.clientWidth, ws: getComputedStyle(pre).whiteSpace },
          p: p?.width ?? 0,
          widest: Math.max(...rows.map((x) => x.width)),
        };
      });
    const fits = async (w: number) => {
      const g = await geo();
      if (!g.list || !g.row || !g.comp || !g.pre) throw new Error(`missing boxes at ${String(w)}: ${JSON.stringify(g)}`);
      const col = Math.min(720, g.list.width - 48);
      expect(Math.abs(g.row.width - col), `the column at ${String(w)}`).toBeLessThan(1.5);
      expect(Math.abs(g.row.left - (g.list.left + (g.list.width - col) / 2)), `centred at ${String(w)}`).toBeLessThan(1.5);
      expect(Math.abs(g.comp.left - g.row.left), `the composer's edge at ${String(w)}`).toBeLessThan(1.5);
      expect(Math.abs(g.comp.width - g.row.width), `the composer's width at ${String(w)}`).toBeLessThan(1.5);
      expect(Math.abs(g.pre.width - col), `code takes the column at ${String(w)}`).toBeLessThan(1.5);
      expect(g.pre.ws).toBe('pre');
      expect(g.pre.scrolls, 'the long code line scrolls sideways').toBe(true);
      expect(g.p).toBeLessThanOrEqual(col + 0.5);
      expect(g.widest).toBeLessThanOrEqual(col + 1);
    };
    await fits(1400);

    // the bottom: one restored row, today's separator, perf's group
    await scroll('bottom');
    await expect(page.getByTestId('thread.notice.5')).toHaveText(`session restored · ${await clockOf(now - 30 * MIN)}`);
    await expect(page.getByTestId('thread.notice.6')).toHaveCount(0);
    await expect(page.getByTestId('thread.notice.7')).toHaveCount(0);
    await expect(page.getByTestId('thread.day.5')).toHaveText('today');
    // designer's tiers (m_19387): perf's two messages to main fold to one dim row on the text column
    await expect(page.getByTestId('thread.run.8')).toHaveText('▸ 2 messages between 2 agents');
    await expect(page.getByTestId('thread.entry.8')).toHaveCount(0);
    await expect(page.getByTestId('thread.entry.10')).toHaveAttribute('data-head', 'true');
    // open: no 'perf:' under 'perf' (ambient m_11934)
    await page.getByTestId('thread.run.8').click();
    // the first message of an open run sits 8 px under its fold row, no new group (designer m_19912 (2))
    await expect(page.getByTestId('thread.entry.8')).toHaveAttribute('data-head', 'false');
    await expect(page.getByTestId('thread.entry.8')).toHaveAttribute('data-gap', 'row');
    await expect(page.getByTestId('thread.from.8.text')).not.toContainText('perf:');
    const edges = await page.evaluate(() =>
      [8, 9, 10].map((n) => {
        const row = document.querySelector(`[data-testid="thread.entry.${String(n)}"]`)?.getBoundingClientRect();
        const text = document.querySelector(`[data-testid="thread.entry.${String(n)}"] .b-text`)?.getBoundingClientRect();
        return row && text ? Math.abs(text.left - row.left) : -1;
      }),
    );
    for (const d of edges) expect(d, `every row's text on the column edge: ${JSON.stringify(edges)}`).toBeLessThan(1);

    // shots: light + dark, 1400 and 800, top and bottom
    for (const t of ['light', 'dark'] as const) {
      await theme(t);
      for (const w of [1400, 800]) {
        await size(w, 1000);
        await scroll('top');
        if (w === 800) await fits(800);
        shots.push({ label: `${t} · ${String(w)} · top`, png: await page.screenshot() });
        await scroll('bottom');
        shots.push({ label: `${t} · ${String(w)} · bottom`, png: await page.screenshot() });
      }
    }
    // the hover time of a grouped row
    await size(1400, 1000);
    await scroll('top');
    await page.getByTestId('thread.entry.4').hover();
    await expect(hover, 'shown on hover').toHaveCSS('opacity', '1');
    shots.push({ label: 'dark · 1400 · hover row 4 (grouped)', png: await page.screenshot() });

    await s.app.evaluate(({ BrowserWindow }) => {
      const w = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
      w?.setContentSize(2400, 1500);
    });
    const cells = shots.map((x) => `<figure><figcaption>${x.label}</figcaption><img src="data:image/png;base64,${x.png.toString('base64')}"></figure>`).join('');
    await page.setContent(
      `<style>body{margin:0;background:#777;font:12px ui-monospace,monospace;color:#eee}main{display:flex;flex-wrap:wrap;gap:10px;padding:10px;align-items:flex-start}figure{margin:0}figcaption{margin:0 0 3px}img{display:block;zoom:.5;border-radius:6px}</style><main>${cells}</main>`,
    );
    writeFileSync(test.info().outputPath('reading-sheet.png'), await page.screenshot({ fullPage: true }));
  } finally {
    await s.close();
    core.dispose();
  }
});
