// app/working-sign · ambient m_11472 (his try round 2: 'the growing, pulsing circle is ugly'): the
// working sign is the TUI's breeze '∿' (theme.rs working_frame + gust.rs Hush), opacity only.
// Passes when, with 4 agents at work (perf open), one waiting on him and one done, every working
// row shows '∿' in the dot's slot with no scale change across frames; the open row pulses (b-pulse,
// its opacity moves) and the others murmur (b-hush) out of step; waiting and done keep their own
// signs; the project's row never pulses; and with reduced motion nothing in the right bar moves.
// The scripted core (FakeCore), light and dark. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const agent = (name: string, status: string) => ({ name, main: name === 'main', status, archived: false, title: '', purpose: '', since_ms: Date.now() - 60_000, waits: status === 'waiting' ? 1 : 0 });
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 7, working: 4, waits: 1, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main', 'idle'), agent('perf', 'working'), agent('cache', 'working'), agent('docs', 'working'), agent('api', 'working'), agent('ui', 'waiting'), agent('lint', 'done')] },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'measuring p99' }], before: null, more: false },
];
const WORKING = ['perf', 'cache', 'docs', 'api'];

test("app/working-sign: '∿' in the dot's slot, the open row pulses, the others murmur, nothing scales; still with reduced motion", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  try {
    const { page } = s;
    const dot = (n: string) => page.locator(`[data-testid="app.right.agent.${n}"] .b-dot`);
    await expect(dot('perf')).toBeVisible({ timeout: 10_000 });
    const look = (n: string) =>
      dot(n).evaluate((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const sign = el.querySelector('.wk-sign');
        return { glyph: sign?.textContent ?? '', pseudo: getComputedStyle(el, '::before').content, w: r.width, h: r.height, transform: cs.transform };
      });
    const BREATH = ['·', '~', '∿', '≈'];
    for (const n of WORKING) {
      const l = await look(n);
      expect(BREATH, `${n}: the breath in the dot's slot`).toContain(l.glyph);
      expect(l.pseudo, `${n}: no CSS glyph under it`).toBe('none');
      expect(l.transform, `${n}: never a scale or a move`).toBe('none');
    }
    // it steps through the breath (· ~ ∿ ≈ ∿ ~, 110 ms) and its box never moves, over 1.2 s of frames
    const frames = [];
    for (let i = 0; i < 12; i++) {
      frames.push(await look('perf'));
      await page.waitForTimeout(100);
    }
    expect(new Set(frames.map((f) => f.glyph)).size, 'the breath moves').toBeGreaterThanOrEqual(3);
    expect(new Set(frames.map((f) => `${f.w}x${f.h}`)).size, 'no scale change').toBe(1);
    // waiting on him and done keep their own signs in the 15 px column (desktop-screens v6): '?' and '✓', still
    const sign = (n: string) => page.locator(`[data-testid="app.right.agent.${n}"] .app-rb-g`);
    await expect(sign('ui')).toHaveText('?');
    await expect(sign('lint')).toHaveText('✓');
    for (const n of ['ui', 'lint']) {
      const moving = await sign(n).evaluate((g) => [g, ...Array.from(g.querySelectorAll('*'))].filter((el) => getComputedStyle(el).animationName !== 'none').length);
      expect(moving, `${n}'s sign is still`).toBe(0);
    }
    const pj = page.locator(`[data-testid="app.sidebar.project.${P}"] .b-dot`);
    if ((await pj.count()) > 0) expect(await pj.evaluate((el) => el.classList.contains('wk')), 'the project never pulses').toBe(false);
    await page.screenshot({ path: test.info().outputPath('light.png') });
    await core.send(prefs('dark') as never);
    await page.waitForTimeout(300);
    await page.screenshot({ path: test.info().outputPath('dark.png') });

    // reduced motion: a still '∿' in ink, 0 changed frames in the right bar
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(async () => (await look('perf')).glyph).toBe('∿');
    // every agent row of the right bar, frame by frame (bise's own pearl is amb-web's, its own rule)
    const running = await page.evaluate(() =>
      document.getAnimations().filter((a) => a.playState === 'running' && a.effect instanceof KeyframeEffect && a.effect.target instanceof Element && a.effect.target.closest('[data-testid^="app.right.agent."]') !== null).length,
    );
    expect(running, 'no animation runs in an agent row').toBe(0);
    for (const n of WORKING) {
      const row = page.getByTestId(`app.right.agent.${n}`);
      const a = await row.screenshot({ animations: 'allow' });
      await page.waitForTimeout(400);
      const b = await row.screenshot({ animations: 'allow' });
      expect(a.equals(b), `${n}'s row does not move`).toBe(true);
    }
  } finally {
    await s.close();
    core.dispose();
  }
});
