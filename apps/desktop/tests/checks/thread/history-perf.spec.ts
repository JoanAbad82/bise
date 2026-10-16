// thread/history-perf · his m_26614 (thread-perf): a thread with 50,000 entries and an agent that
// appends a line every 100 ms while he scrolls up and searches with ⌘F. Measures, off-screen on the
// scripted core (FakeCore), and writes them to history-perf.json in the test's output:
//   scrollP95   frame time p95 (ms, rAF deltas) while he wheels up through the history, lines appending
//   findP95     frame time p95 while ⌘F searches a word with 50 hits spread over the whole history
//   domNodes    the page's element count at the end of each phase (the most seen)
//   jumpMs      time from typing a word found once, at pos 1,200, to that row shown
//   driftPx     how far the current match's row moves while 30 lines append with find open
//   readDriftPx how far the row he reads (scrolled up) moves while 30 lines append
// The core answers each `page` command with the entries before `before` (default 50 a page), and
// each `find` command (thread/find) with the hits it has. Owner: thread-perf.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import type { Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import os from 'node:os';

const P = 'acme-1a2b3c4d';
const NOW = 1_791_100_000_000;
const N = 50_000;
const LIMIT = 50;
/** How long a find or a jump is waited for before it is counted as never (ms). */
const CAP = 60_000;
const prefs = {
  ev: 'prefs',
  prefs: { onboarded: true, theme: 'light', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
};
const agent = (name: string, status: string) => ({ name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW, waits: 0 });
const world = () => [
  prefs,
  {
    ev: 'projects',
    projects: [
      { project: 'bise-home-00000000', name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 2, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main', 'idle'), agent('perf', 'working')] },
];

/** Entry `pos`'s words: varied lengths (rows of 1 to 6 lines), 'kumquat' every 1,000th, 'zanzibar' once at 1,200. */
function textOf(pos: number): string {
  const n = 1 + ((pos * 7919) % 6);
  const lines = Array.from({ length: n }, (_, i) => `line ${String(i)} of row ${String(pos)}: the build went through the checks and the numbers moved a bit`);
  if (pos % 1000 === 500) lines.push('a kumquat on the table');
  if (pos === 1200) lines.push('the zanzibar note');
  return lines.join('\n');
}
const entry = (pos: number) => ({ pos, at_ms: NOW + pos * 1000, kind: pos % 3 === 0 ? 'you' : 'agent', text: textOf(pos) });
const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a) }, (_, i) => entry(a + i));

type Cmd = { cmd: string; agent?: string; before?: number; after?: number; limit?: number; needle?: string; rid?: number };

/** The scripted hub: pages and finds answered as they come, a line appended every `everyMs`. */
class Hub {
  last = N;
  private seen = 0;
  private stop = false;
  constructor(private readonly core: FakeCore) {}
  async serve(): Promise<void> {
    while (!this.stop) {
      const cmds = this.core.cmds() as unknown as Cmd[];
      for (const c of cmds.slice(this.seen)) {
        if (c.agent !== 'perf') continue;
        const limit = c.limit ?? LIMIT;
        if (c.cmd === 'page' && c.before !== undefined) {
          const from = Math.max(1, c.before - limit);
          await this.core.send({ ev: 'thread', project: P, agent: 'perf', entries: range(from, c.before), before: from, more: from > 1 } as never);
        } else if (c.cmd === 'page_after' && c.after !== undefined) {
          const to = Math.min(this.last + 1, c.after + 1 + limit);
          await this.core.send({ ev: 'thread', project: P, agent: 'perf', entries: range(c.after + 1, to), before: c.after + 1, more: true } as never);
        } else if (c.cmd === 'find' && c.needle !== undefined) {
          const n = c.needle.toLowerCase();
          const hits: { pos: number; n: number }[] = [];
          for (let p = 1; p <= this.last; p++) if (textOf(p).toLowerCase().includes(n)) hits.push({ pos: p, n: 1 });
          await this.core.send({ ev: 'thread_hits', project: P, agent: 'perf', rid: c.rid, needle: c.needle, hits, upto: this.last } as never);
        }
      }
      this.seen = cmds.length;
      await new Promise((r) => setTimeout(r, 30));
    }
  }
  async append(count: number, everyMs: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      this.last++;
      await this.core.send({ ev: 'entry', project: P, agent: 'perf', entry: entry(this.last) } as never);
      await new Promise((r) => setTimeout(r, everyMs));
    }
  }
  end(): void {
    this.stop = true;
  }
}

/** Starts collecting rAF deltas in the page. */
const framesOn = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __f?: number[]; __fOn?: boolean };
    w.__f = [];
    w.__fOn = true;
    let prev = performance.now();
    const tick = (t: number) => {
      w.__f?.push(t - prev);
      prev = t;
      if (w.__fOn === true) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
/** Stops it: the p95 and max of the deltas, and the page's element count. */
const framesOff = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __f?: number[]; __fOn?: boolean };
    w.__fOn = false;
    const f = [...(w.__f ?? [])].sort((a, b) => a - b);
    const at = (q: number) => f[Math.min(f.length - 1, Math.floor(q * f.length))] ?? 0;
    return { p95: Math.round(at(0.95) * 10) / 10, max: Math.round(at(1) * 10) / 10, frames: f.length, dom: document.getElementsByTagName('*').length };
  });
type ProfNode = { id: number; callFrame: { functionName: string; url: string; lineNumber: number }; hitCount?: number };
/** THREAD_PERF_PROFILE=1: a CPU profile around `run`, its top self-time functions (ms) in the output (off by default: it slows what it measures). */
/**
 * The renderer's main thread while `run` runs, from a CPU profile (sampled every 250 µs): each run
 * of busy samples is a task the page can't draw a frame during. Off-screen, Chromium throttles
 * requestAnimationFrame, so rAF deltas say nothing of jank there; the tasks do. taskP95 / taskMax:
 * the busy runs' lengths (ms); busy: the share of the time the thread worked. Its top self-time
 * functions go to profile-<name>.txt.
 */
async function profiled(s: { cdp: import('@playwright/test').CDPSession }, name: string, run: () => Promise<void>): Promise<{ taskP95: number; taskMax: number; busy: number }> {
  await s.cdp.send('Profiler.enable');
  await s.cdp.send('Profiler.setSamplingInterval', { interval: 250 });
  await s.cdp.send('Profiler.start');
  await run();
  const { profile } = (await s.cdp.send('Profiler.stop')) as unknown as { profile: { nodes: ProfNode[]; startTime: number; endTime: number; samples: number[]; timeDeltas: number[] } };
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const idle = (id: number) => {
    const f = byId.get(id)?.callFrame.functionName;
    return f === '(idle)';
  };
  // a sample's time is the delta to the next one
  const tasks: number[] = [];
  let cur = 0;
  let busy = 0;
  const self = new Map<string, number>();
  profile.samples.forEach((id, i) => {
    const dt = (profile.timeDeltas[i + 1] ?? 0) / 1000;
    if (idle(id)) {
      if (cur > 0) tasks.push(cur);
      cur = 0;
      return;
    }
    cur += dt;
    busy += dt;
    const f = byId.get(id)?.callFrame;
    if (f !== undefined) {
      const k = `${f.functionName || '(anon)'} ${f.url.split('/').pop() ?? ''}:${String(f.lineNumber)}`;
      self.set(k, (self.get(k) ?? 0) + dt);
    }
  });
  if (cur > 0) tasks.push(cur);
  tasks.sort((a, b) => a - b);
  const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, ms]) => `${ms.toFixed(1)} ms  ${k}`);
  writeFileSync(test.info().outputPath(`profile-${name}.txt`), top.join('\n'));
  const span = (profile.endTime - profile.startTime) / 1000;
  const r = (x: number) => Math.round(x * 10) / 10;
  return { taskP95: r(tasks[Math.floor(tasks.length * 0.95)] ?? 0), taskMax: r(tasks.at(-1) ?? 0), busy: r((100 * busy) / Math.max(1, span)) };
}
const yOf = async (page: Page, sel: string) => page.locator(sel).first().evaluate((e) => e.getBoundingClientRect().top, undefined, { timeout: 1000 }).catch(() => NaN);
/** What the list draws now: its first and last entry rows, the find count (for a red run's output). */
const drawn = (page: Page) =>
  page.evaluate(() => {
    const ids = Array.from(document.querySelectorAll('[data-testid^="thread.entry."]'), (e) => e.getAttribute('data-testid') ?? '');
    const list = document.querySelector<HTMLElement>('[data-testid="thread.list"]');
    return { first: ids[0], last: ids.at(-1), n: ids.length, count: document.querySelector('[data-testid="thread.find.count"]')?.textContent, gap: document.querySelector('[data-testid="thread.gap"]') !== null, stuck: list?.dataset.stuck, top: list?.querySelector('[data-virtuoso-scroller]')?.scrollTop };
  });

test('thread/history-perf: 50k entries, lines appending, scroll up and ⌘F stay smooth and still', async () => {
  test.setTimeout(420_000);
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  const hub = new Hub(core);
  // written at each number: a frozen window (the old find) still leaves what was measured
  const file = test.info().outputPath('history-perf.json');
  const out = new Proxy<Record<string, number>>({}, {
    set(t, k: string, v: number) {
      t[k] = v;
      writeFileSync(file, JSON.stringify(t, null, 2));
      return true;
    },
  });
  try {
    const { page } = s;
    // a scripted hub that stopped answering says so (else: 'never shown' with no cause)
    hub.serve().catch((e: unknown) => {
      console.error('history-perf: the scripted hub stopped:', e);
    });
    await core.waitCmd((c) => c.cmd === 'subscribe' && (c as unknown as Cmd).agent === 'perf', 10_000);
    await core.send({ ev: 'thread', project: P, agent: 'perf', entries: range(N - LIMIT + 1, N + 1), before: N - LIMIT + 1, more: true } as never);
    await expect(page.getByTestId(`thread.entry.${String(N)}`)).toBeVisible({ timeout: 10_000 });
    const list = page.getByTestId(`thread.entry.${String(N)}`);
    await list.hover();

    // 1. he wheels up through the history while lines append
    await framesOn(page);
    const appending = hub.append(40, 100);
    const st = await profiled(s, 'scroll', async () => {
      for (let i = 0; i < 80; i++) {
        await page.mouse.wheel(0, -600);
        await page.waitForTimeout(50);
      }
      await appending;
    });
    out.scrollTaskP95 = st.taskP95;
    out.scrollTaskMax = st.taskMax;
    out.scrollBusy = st.busy;
    const scroll = await framesOff(page);
    out.scrollP95 = scroll.p95;
    out.scrollMax = scroll.max;
    out.scrollDom = scroll.dom;

    // 2. the row he reads stays put while lines append
    await page.waitForTimeout(800);
    const read = await page.evaluate(() => {
      const box = document.querySelector('[data-testid="thread.list"] [data-virtuoso-scroller]') ?? document.querySelector('[data-virtuoso-scroller]');
      const top = box?.getBoundingClientRect().top ?? 0;
      const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-testid^="thread.entry."]'));
      return rows.find((r) => r.getBoundingClientRect().bottom > top + 40)?.dataset.testid ?? '';
    });
    const y0 = await yOf(page, `[data-testid="${read}"]`);
    let drift = 0;
    const app2 = hub.append(30, 60);
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(50);
      drift = Math.max(drift, Math.abs((await yOf(page, `[data-testid="${read}"]`)) - y0));
    }
    await app2;
    out.readDriftPx = Math.round(drift);

    // 3. ⌘F a word with 50 hits over the whole history, lines appending
    await page.getByTestId('composer.field').first().click();
    await page.keyboard.press('Meta+f');
    const field = page.getByTestId('thread.find.field');
    await expect(field).toBeFocused();
    await framesOn(page);
    const t0 = Date.now();
    const app3 = hub.append(50, 100);
    const count = page.getByTestId('thread.find.count');
    const all = { done: false };
    const ft = await profiled(s, 'find', async () => {
      await page.keyboard.type('kumquat');
      // capped at CAP: the old find paged the history in a page at a time (it never got there)
      all.done = await expect(count).toHaveText(/^\d+\/5\d$/, { timeout: CAP }).then(() => true, () => false);
      out.findAllMs = Date.now() - t0;
      await app3;
    });
    out.findTaskP95 = ft.taskP95;
    out.findTaskMax = ft.taskMax;
    out.findBusy = ft.busy;
    out.findAllDone = all.done ? 1 : 0;
    out.findCountAtEnd = Number(/\/(\d+)/.exec((await count.textContent({ timeout: 5000 })) ?? '')?.[1] ?? -1);
    const find = await framesOff(page);
    out.findP95 = find.p95;
    out.findMax = find.max;
    out.findDom = find.dom;

    // 4. find open on its current match: it doesn't move while lines append
    await page.waitForTimeout(1500);
    const hit = page.locator('[data-testid^="thread.entry."][data-hit]').first();
    const hitId = (await hit.getAttribute('data-testid', { timeout: 10_000 }).catch(() => null)) ?? '';
    out.hitShown = hitId === '' ? 0 : 1;
    writeFileSync(test.info().outputPath('at-hit.json'), JSON.stringify({ hitId, drawn: await drawn(page), cmds: (core.cmds() as unknown as Cmd[]).filter((c) => c.agent === 'perf').slice(-12) }, null, 2));
    await page.screenshot({ path: test.info().outputPath('at-hit.png') });
    const h0 = await yOf(page, `[data-testid="${hitId}"]`);
    let hdrift = 0;
    const app4 = hub.append(30, 60);
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(50);
      const y = await yOf(page, `[data-testid="${hitId}"]`);
      hdrift = Math.max(hdrift, Number.isNaN(y) ? 9999 : Math.abs(y - h0));
    }
    await app4;
    out.driftPx = Math.round(hdrift);

    // 5. a word found once, far back: time to its row shown
    await field.fill('');
    const t1 = Date.now();
    await field.pressSequentially('zanzibar');
    const jumped = await expect(page.getByTestId('thread.entry.1200')).toBeInViewport({ timeout: CAP }).then(() => true, () => false);
    out.jumpMs = Date.now() - t1;
    out.jumpDone = jumped ? 1 : 0;

    // 6. architect m_26633: back to the 50 hits, ⏎ to the oldest one (each hit a page read around
    // it), then he scrolls newer through the window with find open: the counter and the current
    // match stay right
    await field.fill('kumquat');
    await expect(count).toHaveText(/^1\/5\d$/, { timeout: 10_000 });
    const n = Number(/\/(\d+)/.exec((await count.textContent()) ?? '')?.[1] ?? 0);
    const t2 = Date.now();
    const wt = await profiled(s, 'walk', async () => {
      for (let i = 1; i < n; i++) {
        await page.keyboard.press('Enter');
        await expect(count).toHaveText(`${String(i + 1)}/${String(n)}`, { timeout: 5000 });
      }
      await expect(page.getByTestId('thread.entry.500'), 'the oldest hit, shown').toBeInViewport({ timeout: 10_000 });
    });
    out.walkMs = Date.now() - t2;
    out.walkTaskMax = wt.taskMax;
    await page.getByTestId('thread.entry.500').hover();
    const newer = await profiled(s, 'newer', async () => {
      for (let i = 0; i < 60; i++) {
        await page.mouse.wheel(0, 900);
        await page.waitForTimeout(50);
      }
    });
    out.newerTaskP95 = newer.taskP95;
    out.newerTaskMax = newer.taskMax;
    out.newerCountKept = (await count.textContent()) === `${String(n)}/${String(n)}` ? 1 : 0;
    const shownNow = await drawn(page);
    out.newerFirstShown = Number(shownNow.first?.split('.')[2] ?? -1);
    out.domEnd = await page.evaluate(() => document.getElementsByTagName('*').length);
    out.storeRows = await page.locator('[data-testid^="thread.entry."]').count();

    // what must hold (the before ran this to its limits: find never got there, the window froze)
    expect(out.findAllDone, 'find counts every hit of a 50k-entry thread').toBe(1);
    expect(out.findAllMs, 'in under 5 s').toBeLessThan(5000);
    expect(out.readDriftPx, 'the row he reads stays put while lines append').toBeLessThan(1);
    expect(out.driftPx, 'the current match stays put while lines append').toBeLessThan(1);
    expect(out.jumpDone, 'a hit 48,800 entries back is shown').toBe(1);
    expect(out.jumpMs, 'in under 5 s').toBeLessThan(5000);
    // a task's length is wall time: with more runnable jobs than cores (test:land beside other
    // agents' builds, load 15-24 on 12 cores) the renderer is preempted mid-task and 50 ms means
    // nothing (66-210 ms seen, 13-29 ms at load < 12). There the number is written, not judged
    const load = os.loadavg()[0] ?? 0;
    out.loadPerCore = Math.round((100 * load) / os.cpus().length) / 100;
    if (load <= os.cpus().length) expect(out.scrollTaskMax, 'no long task while he scrolls up').toBeLessThan(50);
    else test.info().annotations.push({ type: 'not judged', description: `scrollTaskMax ${String(out.scrollTaskMax)} ms at load ${load.toFixed(1)} on ${String(os.cpus().length)} cores` });
    expect(out.newerCountKept, 'scrolling newer with find open keeps its counter on the oldest hit').toBe(1);
    expect(out.newerFirstShown, 'he went newer through the window').toBeGreaterThan(500);
  } finally {
    hub.end();
    console.log('history-perf', JSON.stringify(out));
    await s.close();
    core.dispose();
  }
});
