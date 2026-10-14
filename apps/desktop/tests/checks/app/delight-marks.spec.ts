// app/delight-marks · designer's desktop-delight v2 (his yes on all of it), the marks and touches 1
// and 5, and what the head and the right bar tuck away. Passes when: the sidebar's 18 px column has
// bise's ':*' (the accent while something waits) and each project's mark (at work the TUI's breath,
// his pick #9: · ~ ∿ ≈ ∿ ~ at 220 ms, one 12 px cell centred, text-2, a still '∿' under reduced
// motion; '?' accent when it asks him, '·' quiet), each with its tip words, and no 'all quiet' /
// '∿ 2' left (the pink count stays; the working number is app/working-count's); an agent that finishes gets the kiss (':*' lifts into '✓', 600 ms) in the
// right bar and on its project's mark, once, and under reduced motion only the final '✓'; the
// pointer on bise's ':*' winks it; the head has no name (the crumb has it), no 'idle' chip, and
// '± 3 files' only with changes; the right bar's % only from 70 %, else in the row's tip. Shots
// light and dark at 1400, 1100 and 800, and a frame strip per touch, for designer's sign. And
// bise's ':*' while bise works (his pick #5 on bise-s-mark-25-variations): the star breathes,
// scale 1 → .72 → 1 over 2.64 s, no turn and no branch of its own moving; asks wins (waits and
// works: the pink star, still); <html data-still> (the window away) pauses it; reduced motion, none.
// Close-ups at 2x DPR, enlarged 2×, of quiet / working (full and .72) / asks / both, light and dark. The scripted
// core (FakeCore). Owner: amb-win.
import { writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { FakeCore, Recorder, launchDesktop, test, expect } from '../../harness';
import type { Frame } from '../../harness/frames';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const TS = 'tspat-0a0b0c0d';
const DOCS = 'docs-cff418c0';
const NOW = Date.now();
const MIN = 60_000;
const use = (pct: number) => ({ usage: { model: 'm', context: pct * 1000, window: 100_000, words: `${String(pct)}k · ${String(pct)}%`, short: `${String(pct)}%` } });
const agent = (name: string, status: string, over: Record<string, unknown> = {}) => ({
  name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 2 * MIN, waits: 0, ...over,
});
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const projects = (storefrontWorking: number, tsWaits = 1) => ({
  ev: 'projects',
  projects: [
    { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
    { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 4, working: storefrontWorking, waits: 0, running: true },
    { project: TS, name: 'ts-pattern', path: '/nowhere/ts-pattern', git: true, home: false, order: 2, agents: 1, working: 0, waits: tsWaits, running: true },
    { project: DOCS, name: 'docs-site', path: '/nowhere/docs-site', git: true, home: false, order: 3, agents: 0, working: 0, waits: 0, running: true },
  ],
});
const storefront = (docs: string, extra: Record<string, unknown>[] = []) => ({
  ev: 'agents',
  project: P,
  agents: [
    agent('main', 'idle'),
    agent('perf', 'working', { turn_ms: 6 * MIN, branch: 'sb/perf', ...use(31) }),
    agent('search', 'working', { turn_ms: 3 * MIN, ...use(82) }),
    agent('docs', docs, { title: 'the readme' }),
    agent('lint', 'idle'),
    ...extra,
  ],
});
const world = () => [
  prefs('light'),
  projects(3),
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  storefront('working'),
  { ev: 'agents', project: TS, agents: [agent('main', 'idle'), agent('pattern-error-dx', 'blocked', { waits: 1 })] },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'found it: the hero image ships at 2.4 MB.' }], before: null, more: false },
];

const shot = (name: string) => test.info().outputPath(`${name}.png`);

/** Frames side by side, cropped to a box (CSS px), at most `n` evenly picked: a touch's strip. */
function strip(frames: Frame[], box: { x: number; y: number; width: number; height: number }, n: number, name: string): number {
  const picked = frames.length <= n ? frames : Array.from({ length: n }, (_, i) => frames[Math.round((i * (frames.length - 1)) / (n - 1))] as Frame);
  const s = picked[0]?.scale ?? 1;
  const w = Math.round(box.width * s);
  const h = Math.round(box.height * s);
  const out = new PNG({ width: w * picked.length + 4 * (picked.length - 1), height: h });
  out.data.fill(255);
  picked.forEach((f, i) => {
    PNG.bitblt(f.png, out, Math.round(box.x * s), Math.round(box.y * s), Math.min(w, f.png.width - Math.round(box.x * s)), Math.min(h, f.png.height - Math.round(box.y * s)), i * (w + 4), 0);
  });
  writeFileSync(test.info().outputPath(`${name}.png`), PNG.sync.write(out));
  return picked.length;
}

test('app/delight-marks: the sidebar marks and their tips, the done kiss, the wink, what the head and the right bar tuck away; shots and strips', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1400x860' });
  try {
    const { page, cdp } = s;
    const mark = (p: string) => page.getByTestId(`app.sidebar.project.${p}.mark`);
    await expect(page.getByTestId('app.right.agent.perf')).toBeVisible({ timeout: 10_000 });

    // MARK: bise's ':*' (text-3, no wait at home... but ts-pattern waits: the accent), the projects' marks
    const bise = page.getByTestId('app.sidebar.bise.mark');
    await expect(bise).toHaveAttribute('data-waits', 'true');
    await expect(bise).toHaveAttribute('data-tip', 'bise: 1 thing waits for you');
    await expect(page.getByTestId('app.sidebar.bise').getByTestId('bise.pearl.rest'), 'the orb left the sidebar').toHaveCount(0);
    await expect(page.getByTestId('app.sidebar').locator('.b-pearl'), 'no pearl in the sidebar').toHaveCount(0);
    await expect(mark(P)).toHaveAttribute('data-mark', 'works');
    // at work: the TUI's breath (his pick #9), one 12 px mono cell in text-2, 220 ms a frame
    const breath = mark(P).locator('.wk-sign');
    await expect(breath, 'the breath, one cell').toHaveCount(1);
    await expect(mark(P).locator('svg'), 'no SVG gust left').toHaveCount(0);
    const look = await breath.evaluate((el) => {
      const cell = el.firstElementChild as HTMLElement;
      const probe = document.createElement('span');
      probe.style.color = 'var(--c-text-2)';
      document.body.append(probe);
      const t2 = getComputedStyle(probe).color;
      probe.remove();
      const col = (el.closest('.mk-pj') as HTMLElement).getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { size: getComputedStyle(el).fontSize, color: getComputedStyle(cell).color, t2, off: Math.abs(r.x + r.width / 2 - (col.x + col.width / 2)) };
    });
    expect(look.size, '12 px').toBe('12px');
    expect(look.color, 'text-2').toBe(look.t2);
    expect(look.off, 'centred in the column').toBeLessThanOrEqual(1);
    const seen = await breath.evaluate(async (el) => {
      const out: { t: number; g: string }[] = [];
      const t0 = performance.now();
      while (performance.now() - t0 < 2700) {
        const g = el.textContent;
        if (out.length === 0 || out[out.length - 1]?.g !== g) out.push({ t: performance.now(), g });
        await new Promise((r) => requestAnimationFrame(r));
      }
      return out;
    });
    const steps = seen.map((x) => x.g).join('');
    expect('·~∿≈∿~'.repeat(4), `the frames · ~ ∿ ≈ ∿ ~ in order (${steps})`).toContain(steps);
    const gaps = seen.slice(2).map((x, i) => x.t - (seen[i + 1]?.t ?? 0));
    expect(gaps.length, 'about 12 frames in 2.7 s').toBeGreaterThanOrEqual(9);
    // the frame comes from the time (clock.ts): a late timer on a busy machine stretches one gap and
    // shortens the next, so the median says the pace
    const mid = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)] ?? 0;
    expect(Math.abs(mid - 220), `220 ms a frame (median ${String(Math.round(mid))}; ${gaps.map((g) => String(Math.round(g))).join(' ')})`).toBeLessThan(40);
    // reduced motion: one still '∿' in text-2
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(breath, "still: '∿'").toHaveText('∿');
    expect(await breath.evaluate((el) => getComputedStyle(el.firstElementChild as HTMLElement).color), 'still in text-2').toBe(look.t2);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(mark(P)).toHaveAttribute('data-tip', 'storefront: perf, search and docs are working · 3 agents');
    await expect(mark(TS)).toHaveAttribute('data-mark', 'asks');
    await expect(mark(TS)).toHaveText('?');
    await expect(mark(TS)).toHaveAttribute('data-tip', 'ts-pattern: pattern-error-dx waits for you');
    await expect(mark(DOCS)).toHaveText('·');
    await expect(mark(DOCS)).toHaveAttribute('data-tip', 'docs-site: all quiet');
    const col = await mark(P).evaluate((el) => (el.closest('.app-g') as HTMLElement).getBoundingClientRect().width);
    expect(col, 'the 18 px mark column').toBe(18);
    // the row drops 'all quiet' and '∿ n'; the pink count stays
    await expect(page.getByTestId(`app.sidebar.project.${P}`)).not.toContainText('∿');
    await expect(page.getByTestId(`app.sidebar.project.${DOCS}`)).not.toContainText('all quiet');
    await expect(page.getByTestId(`app.sidebar.project.${TS}`).locator('.app-cnt')).toHaveText('1');
    const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--c-accent').trim());
    expect(accent).not.toBe('');

    // TUCK AWAY: the head has its role, not its name (the crumb has it); no '± files' without changes
    await expect(page.getByTestId('app.title.crumb')).toHaveText('storefront›perf');
    await expect(page.getByTestId('thread.head.name')).toHaveCount(0);
    await expect(page.getByTestId('thread.head.role')).toHaveText("perf's job");
    await expect(page.getByTestId('thread.head.changes'), 'no changes: no button').toHaveCount(0);
    // the right bar's %: perf's 31 % in its tip only, search's 82 % in the column
    await expect(page.getByTestId('app.right.agent.perf.pct')).toHaveText('');
    await expect(page.getByTestId('app.right.agent.perf.sign'), "in its sign's tip").toHaveAttribute('data-tip', /31% of perf's context used/u);
    await expect(page.getByTestId('app.right.agent.search.pct')).toHaveText('82%');
    await page.mouse.move(700, 500);
    await page.screenshot({ path: shot('w1400-light') });
    await core.send(prefs('dark') as never);
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot('w1400-dark') });
    await core.send(prefs('light') as never);

    // TOUCH 1: docs finishes: the kiss in the right bar and on storefront's mark, recorded
    const rec = new Recorder(cdp, page);
    await rec.start();
    await core.send(storefront('done') as never);
    await core.send(projects(2) as never);
    await expect(page.getByTestId('app.right.agent.docs.kiss')).toBeVisible();
    await expect(mark(P)).toHaveAttribute('data-mark', 'kiss');
    await page.waitForTimeout(900);
    const kiss = await rec.stop();
    await expect(page.getByTestId('app.right.agent.docs.kiss'), 'once: after 600 ms the plain ✓').toHaveCount(0);
    await expect(page.locator('[data-testid="app.right.agent.docs"] .app-rb-g')).toHaveText('✓');
    await expect(mark(P), 'then its state again').toHaveAttribute('data-mark', 'works', { timeout: 3000 });
    const sign = await page.locator('[data-testid="app.right.agent.docs"] .app-rb-g').boundingBox();
    const pj = await mark(P).boundingBox();
    expect(kiss.length, 'frames recorded').toBeGreaterThan(4);
    if (sign !== null) strip(kiss, { x: sign.x - 8, y: sign.y - 14, width: sign.width + 16, height: sign.height + 18 }, 10, 'strip-kiss-rightbar');
    if (pj !== null) strip(kiss, { x: pj.x - 4, y: pj.y - 14, width: 140, height: pj.height + 22 }, 10, 'strip-kiss-project');
    // a reload of the same agents: no second kiss
    await core.send(storefront('done') as never);
    await page.waitForTimeout(100);
    await expect(page.getByTestId('app.right.agent.docs.kiss')).toHaveCount(0);

    // reduced motion: the final state only
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await core.send(storefront('done', [agent('typos', 'working')]) as never);
    await core.send(storefront('done', [agent('typos', 'done')]) as never);
    const still = page.getByTestId('app.right.agent.typos.kiss');
    await expect(still).toBeVisible();
    const op = await still.evaluate((el: Element) => Array.from(el.children, (c) => getComputedStyle(c).opacity));
    expect(op, "reduced motion: ':*' hidden, '✓' shown at once").toEqual(['0', '1']);
    await page.emulateMedia({ reducedMotion: null });

    // TOUCH 5: the wink on bise's ':*'
    await page.mouse.move(5, 5);
    const box = await bise.boundingBox();
    const wrec = new Recorder(cdp, page);
    await wrec.start();
    await bise.hover();
    await page.waitForTimeout(400);
    const wink = await wrec.stop();
    if (box !== null) strip(wink, { x: box.x - 6, y: box.y - 6, width: box.width + 12, height: box.height + 12 }, 8, 'strip-wink');

    // the head: no 'idle' chip on an agent at rest
    await page.getByTestId('app.right.agent.lint').click();
    await expect(page.getByTestId('app.title.crumb')).toHaveText('storefront›lint');
    await expect(page.getByTestId('thread.head.state'), "no 'idle' chip").toHaveCount(0);

    // 1100 and 800: shots light and dark (800: the sidebar slid over), once storefront's '✓' went
    await page.getByTestId('app.right.agent.perf').click();
    await expect(mark(P)).toHaveAttribute('data-mark', 'works', { timeout: 3000 });
    for (const w of [1100, 800]) {
      await page.setViewportSize({ width: w, height: 760 });
      await page.waitForTimeout(200);
      if (w === 800) {
        await page.keyboard.press('Meta+Backslash');
        await expect(page.getByTestId('app.over.left').getByTestId('app.sidebar')).toBeVisible();
      }
      await page.mouse.move(w - 20, 700);
      await page.screenshot({ path: shot(`w${String(w)}-light`) });
      await core.send(prefs('dark') as never);
      await page.waitForTimeout(300);
      await page.screenshot({ path: shot(`w${String(w)}-dark`) });
      await core.send(prefs('light') as never);
    }
  } finally {
    await s.close();
    core.dispose();
  }
});

/** Crops of the page (CSS px), each enlarged `k`× (nearest), side by side with a 12 px gutter: a close-up sheet. */
function sheet(crops: PNG[], k: number, name: string): void {
  const gut = 12;
  const w = crops.reduce((n, c) => n + c.width * k, 0) + gut * (crops.length - 1);
  const h = Math.max(...crops.map((c) => c.height * k));
  const out = new PNG({ width: w, height: h });
  out.data.fill(255);
  let x0 = 0;
  for (const c of crops) {
    for (let y = 0; y < c.height * k; y++)
      for (let x = 0; x < c.width * k; x++) {
        const s = (Math.floor(y / k) * c.width + Math.floor(x / k)) * 4;
        const d = (y * w + x0 + x) * 4;
        for (let j = 0; j < 4; j++) out.data[d + j] = c.data[s + j] ?? 255;
      }
    x0 += c.width * k + gut;
  }
  writeFileSync(test.info().outputPath(`${name}.png`), PNG.sync.write(out));
}

test("app/delight-marks: bise's ':*' breathes while bise works (#5), asks wins, holds when away and under reduced motion; close-ups", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1400x860' });
  try {
    const { page } = s;
    const bise = page.getByTestId('app.sidebar.bise.mark');
    await expect(page.getByTestId('app.right.agent.perf')).toBeVisible({ timeout: 10_000 });
    const motion = () => bise.evaluate((el) => {
      const star = getComputedStyle(el.querySelector('.b-bise-star') as Element);
      const arms = Array.from(el.querySelectorAll('.b-bise-arm'), (a) => getComputedStyle(a).animationName);
      return { name: star.animationName, dur: star.animationDuration, play: star.animationPlayState, arms: [...new Set(arms)] };
    });

    // both (storefront works, ts-pattern waits): asks wins, the pink star, no breath
    await expect(bise).toHaveAttribute('data-waits', 'true');
    await expect(bise).toHaveAttribute('data-working', 'true');
    expect((await motion()).name, 'both: asks wins, the star holds').toBe('none');
    // working only: the star breathes, 2.64 s, and no branch moves on its own (no tumble)
    await core.send(projects(3, 0) as never);
    await expect(bise).not.toHaveAttribute('data-waits', 'true');
    expect(await motion()).toEqual({ name: 'b-bise-breathe', dur: '2.64s', play: 'running', arms: ['none'] });
    const scales = await bise.evaluate((el) => {
      const star = el.querySelector('.b-bise-star') as SVGGElement;
      const anim = star.getAnimations()[0] as Animation;
      anim.pause();
      const at = (ms: number) => { anim.currentTime = ms; return getComputedStyle(star).transform; };
      const out = [at(0), at(1320)];
      anim.play();
      return out;
    });
    expect(scales, 'scale 1 at the start, .72 at the middle, no rotation').toEqual(['matrix(1, 0, 0, 1, 0, 0)', 'matrix(0.72, 0, 0, 0.72, 0, 0)']);
    // the window away: it holds where it is
    await page.evaluate(() => { document.documentElement.dataset.still = ''; });
    expect((await motion()).play, '<html data-still>: paused').toBe('paused');
    await page.evaluate(() => { delete document.documentElement.dataset.still; });
    expect((await motion()).play).toBe('running');
    // reduced motion: the still ':*'
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect((await motion()).name, 'reduced motion: still').toBe('none');
    await page.emulateMedia({ reducedMotion: null });
    // quiet: nothing moves
    await core.send(projects(0, 0) as never);
    await expect(bise).not.toHaveAttribute('data-working', 'true');
    expect((await motion()).name).toBe('none');

    // close-ups at his Retina's 2x, enlarged 2× (4× the CSS px), light then dark: quiet, working at
    // 1, working at .72, asks, both
    await s.cdp.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 860, deviceScaleFactor: 2, mobile: false });
    await page.mouse.move(700, 500);
    for (const theme of ['light', 'dark']) {
      await core.send(prefs(theme) as never);
      await page.waitForTimeout(300);
      const crops: PNG[] = [];
      const grab = async () => {
        await page.waitForTimeout(450); // past the kisses
        const b = await bise.boundingBox();
        if (b === null) throw new Error('no mark');
        crops.push(PNG.sync.read(await page.screenshot({ clip: { x: b.x - 6, y: b.y - 6, width: b.width + 12, height: b.height + 12 } })));
      };
      await core.send(projects(0, 0) as never);
      await grab();
      await core.send(projects(3, 0) as never);
      await expect(bise).toHaveAttribute('data-working', 'true');
      for (const ms of [0, 1320]) {
        await bise.evaluate((el, t) => { const a = (el.querySelector('.b-bise-star') as SVGGElement).getAnimations()[0]; if (a) { a.pause(); a.currentTime = t; } }, ms);
        await grab();
      }
      // crisp: at scale 1 the breathing star draws like the still one, give or take a few edge
      // pixels of anti-aliasing (9 seen at 2x); a composited layer resamples it soft (168 seen)
      const [still, breath] = crops as [PNG, PNG];
      let soft = 0;
      for (let i = 0; i < still.data.length; i += 4)
        if ([0, 1, 2].some((j) => Math.abs((still.data[i + j] ?? 0) - (breath.data[i + j] ?? 0)) > 24)) soft++;
      expect(soft, `${theme}: the breath at 1 draws like the still star, not a soft layer`).toBeLessThan(40);
      await core.send(projects(0, 1) as never);
      await expect(bise).toHaveAttribute('data-waits', 'true');
      await grab();
      await core.send(projects(3, 1) as never);
      await expect(bise).toHaveAttribute('data-working', 'true');
      await grab();
      sheet(crops, 2, `closeup-${theme}`);
    }
  } finally {
    await s.close();
    core.dispose();
  }
});
