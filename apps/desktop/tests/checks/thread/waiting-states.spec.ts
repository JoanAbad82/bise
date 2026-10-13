// thread/waiting-states · a pause and an alarm (designer's agent-waiting-states, his pick A). The
// REAL views on the scripted core: main has an alarm only (bise wakes it if the nightly gate goes
// red), perf is paused on a command (cargo bench, 3 min), search waits on perf's reply (1 min).
// Passes when, light and dark at 1400, 1100 and 800:
//   - alarm (main's view): no line over the composer, the head chip says 'idle'; the right bar's
//     'SCHEDULED & WATCHING' has '◌ main · if the nightly gate goes red · until <clock>', the ◌ and
//     the note text-3, the note whole or cut after a whole word with '…'; its hover says 'bise wakes
//     main if … · set … · stops watching …'; a click opens its detail with 'stop watching', which
//     sends the hub's wake_stop;
//   - pause (perf's view): over the composer 'continues when cargo bench ends · running for 3 min',
//     'continues when' text-2 and whole, the rest text-3; the head chip '… waiting · 3 min'; its
//     right bar row ends on '3 min'; the label row never says waiting;
//   - reply (search's view): 'continues when perf answers · 1 min', the name opens perf;
//   - never 'since' anywhere.
// Shots for designer: waiting-<case>-<w>-<theme>.png (case: alarm, alarm-detail, pause, reply).
// Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string, over: Record<string, unknown> = {}) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 30 * MIN, waits: 0, watching: [], model: 'anthropic/claude-opus-5-5', effort: 'high', ...over });
const GATE = { id: 4, kind: 'file', what: 'the nightly gate goes red', noted: true, since_ms: NOW - 16 * HOUR, until_ms: NOW + 8 * HOUR };
const BENCH = { id: 9, kind: 'bg', what: 'cargo bench', since_ms: NOW - 3 * MIN - 5000, resumes: true };
const agents = {
  ev: 'agents',
  project: P,
  agents: [
    ag('main', { watching: [GATE] }),
    ag('perf', { purpose: 'product page speed', watching: [BENCH] }),
    ag('search', { purpose: 'search ranking', status: 'waiting', since_ms: NOW - MIN - 5000, waiting_on: { who: 'agent', name: 'perf' } }),
  ],
};
const thread = (agent: string, text: string) => ({ ev: 'thread', project: P, agent, entries: [{ pos: 1, at_ms: NOW - 4 * MIN, kind: 'agent', text }], before: null, more: false });
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: 'bise-home-00000000', name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 3, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  {
    ev: 'models',
    project: P,
    items: [{ id: 'anthropic/claude-opus-5-5', label: 'opus 5.5', provider: 'Anthropic', short: '1M', context: 1000000, vision: true, efforts: ['low', 'medium', 'high'], default_effort: 'high', default_for: ['main', 'agents'] }],
  },
  { ev: 'approvals', project: P, mode: 'yolo', env: false, checker: '', checker_who: '', repo: '/nowhere/acme', rules: [] },
  agents,
  thread('main', 'already on version 3e0330be. i set a watch on the nightly gate: bise wakes me if it goes red.'),
  thread('perf', "the bench runs on every target. i'll compare when it ends."),
  thread('search', 'i asked perf for the page weights; i go on when it answers.'),
];

const VIEWS = { alarm: 'main', pause: 'perf', reply: 'search' } as const;

for (const w of [1400, 1100, 800]) {
  for (const [view, agent] of Object.entries(VIEWS)) {
    test(`thread/waiting-states: ${view} (${String(w)})`, async () => {
      test.setTimeout(90_000);
      const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
      // launched wide then narrowed, as app/right-bar does (the window's own size settles first)
      const s = await launchDesktop({ core, route: `agent/${P}/${agent}`, size: '1400x760' });
      try {
        const { page } = s;
        if (w !== 1400) {
          await page.setViewportSize({ width: w, height: 760 });
          await page.evaluate(() => new Promise<void>((done) => { requestAnimationFrame(() => { requestAnimationFrame(() => { done(); }); }); }));
        }
        await expect(page.getByTestId('thread.head.state')).toBeVisible({ timeout: 10_000 });
        const color = (sel: string) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).color);
        const token = (name: string) =>
          page.evaluate((n) => {
            const probe = document.createElement('span');
            probe.style.color = `var(${n})`;
            document.body.appendChild(probe);
            const c = getComputedStyle(probe).color;
            probe.remove();
            return c;
          }, name);
        const shot = async (name: string) => {
          await page.waitForTimeout(150);
          await page.screenshot({ path: test.info().outputPath(`waiting-${name}-${String(w)}-${theme}.png`) });
        };
        // the right bar: docked from 1000 px, slid over under it (⌥⌘0)
        const openBar = async () => {
          if (w >= 1000) return page.getByTestId('app.panel');
          await page.keyboard.press('Meta+Alt+Digit0');
          const over = page.getByTestId('app.over.right').getByTestId('app.panel');
          await expect(over).toBeVisible();
          return over;
        };
        const closeBar = async () => {
          if (w < 1000) await page.keyboard.press('Escape');
        };
        let theme: 'light' | 'dark' = 'light';
        for (theme of ['light', 'dark'] as const) {
          await core.send(prefs(theme) as never);
          await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(theme);
          const text3 = await token('--c-text-3');
          const text2 = await token('--c-text-2');
          const line = page.getByTestId('thread.waiting');
          if (view === 'alarm') {
            // main is free: no line, no waiting chip
            await expect(line).toHaveCount(0);
            // (main's head says the project's chip, 'all quiet'): never a waiting chip
            await expect(page.getByTestId('thread.head.state')).not.toHaveText(/waiting/u);
            const bar = await openBar();
            await expect(bar.locator('[data-testid="app.right.scheduled.head"]')).toHaveText(/^SCHEDULED & WATCHING · 1/u);
            const row = bar.getByTestId('app.right.watching.main.4');
            await expect(row.locator('.app-rb-g')).toHaveText('◌');
            await expect(row.locator('.app-rb-end')).toHaveText(/^until (tomorrow )?\d\d:\d\d$/u);
            await expect(row).toHaveAttribute('title', /^bise wakes main if the nightly gate goes red · set yesterday \d\d:\d\d · stops watching (tomorrow )?at \d\d:\d\d$/u);
            expect(await color('[data-testid="app.right.watching.main.4"] .app-rb-g'), `${theme}: ◌ text-3`).toBe(text3);
            expect(await color('[data-testid="app.right.watching.main.4"] .app-rb-sub'), `${theme}: the note text-3`).toBe(text3);
            const sub = (await row.locator('.app-rb-sub').textContent()) ?? '';
            const full = 'if the nightly gate goes red';
            if (sub !== full) {
              expect(sub.endsWith('…'), `${theme}: a cut note ends with … (${sub})`).toBe(true);
              const kept = sub.slice(0, -1);
              expect(full.startsWith(kept) && full[kept.length] === ' ', `${theme}: cut after a whole word (${sub})`).toBe(true);
            }
            await page.mouse.move(1, 300);
            await shot('alarm');
            // a click opens its detail: its words, 'stop watching' sends the hub's wake_stop
            await row.click();
            const detail = bar.getByTestId('app.right.watching.main.4.detail');
            await expect(detail).toContainText('bise wakes main if the nightly gate goes red');
            await expect(detail).toContainText(/set yesterday \d\d:\d\d/u);
            await expect(bar.getByTestId('app.right.watching.main.4.stop')).toHaveText('stop watching');
            await page.mouse.move(1, 300);
            await shot('alarm-detail');
            await bar.getByTestId('app.right.watching.main.4.stop').click();
            await core.waitCmd((c) => (c as { cmd?: string; id?: number }).cmd === 'wake_stop' && (c as { id?: number }).id === 4);
            await closeBar();
          } else {
            const want = view === 'pause' ? 'continues when cargo bench ends · running for 3 min' : 'continues when perf answers · 1 min';
            await expect(line).toHaveText(want);
            expect(await color('[data-testid="thread.waiting"] .th-wait-state'), `${theme}: 'continues when' text-2`).toBe(text2);
            expect(await color('[data-testid="thread.waiting"] .th-wait-sep'), `${theme}: the duration text-3`).toBe(text3);
            const whole = await line.evaluate((el) => {
              const st = el.querySelector<HTMLElement>('.th-wait-state');
              return st !== null && st.scrollWidth <= st.clientWidth + 0.5 && el.scrollWidth <= el.clientWidth + 1;
            });
            expect(whole, `${theme}: the state whole, the line fits`).toBe(true);
            await expect(page.getByTestId('thread.head.state')).toHaveText(view === 'pause' ? '… waiting · 3 min' : '… waiting · 1 min');
            await expect(page.locator('[data-testid="composer"] .div')).not.toHaveText(/waiting|idle|since/u);
            const bar = await openBar();
            const row = bar.getByTestId(`app.right.agent.${agent}`);
            await expect(row.locator('.app-rb-g')).toHaveText('…');
            await expect(row.locator('.app-rb-end')).toHaveText(view === 'pause' ? '3 min' : '1 min');
            // perf's pause is no alarm: SCHEDULED & WATCHING has main's alarm alone
            await expect(bar.locator('[data-testid^="app.right.watching."]').first()).toHaveAttribute('data-testid', 'app.right.watching.main.4');
            await closeBar();
            await page.mouse.move(1, 300);
            await shot(view);
          }
          await expect(page.locator('body')).not.toContainText(/\bsince \d/u);
        }
        if (view === 'reply') {
          // the name opens the agent it waits on
          await page.getByTestId('thread.waiting.who').click();
          await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'perf');
        }
      } finally {
        await s.close();
        core.dispose();
      }
    });
  }
}
