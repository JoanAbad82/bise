// native/update-moments · desktop-dist v7 (his picks: our updater extended; it installs at quit, at
// a quiet moment or on his click; stable + beta). Owner: dist-updater. The new app on the REAL core
// (tests/checks/real.sh), in the world's throwaway home, with the file:// feed of ../fixtures/update
// (desktop.json on two channels) and a fake running .app in that home (BISE_DESKTOP_UPDATE_TARGET):
// never his app, his screen or a real feed. His idle time is the test's file
// (BISE_DESKTOP_TEST_IDLE_FILE), never powerMonitor's. Effects are read outside the app: main's
// stdout lines and the files on disk.
//   quit      ready, then he quits: the swap happens on the way out ('update at quit <v>'), no
//             relaunch; .old and swap.json; the next start confirms them away
//   quit-ro   the swap can't happen at quit (the bundle's folder turned read-only): the app quits
//             anyway, the bundle untouched
//   quiet     ready while he types in bise (idle 0): 'in_use', nothing installs; he steps away
//             (idle 900 s): 'now', the swap, the relaunch, route.json {route, quiet, shown}; the
//             next start reopens the same screen
//   beta      a build on desktop-beta only: a stable app is offered nothing; with his pref
//             desktop_channel: beta, the same app gets it
//   paused    stable's desktop.json says paused: nothing is offered
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect, type Session } from '../../harness';
import { makeUpdateFeed, OFFERED, type FeedOpts } from '../fixtures/update';
import { launchReal, realWorld, type World } from '../world';
import { clickMenu, Lines, sleep } from './world';

const UPDATE = 'bise-desktop: update';
const RELAUNCH = 'bise-desktop: relaunch';
const MOMENT = 'bise-desktop: update moment';
const AT_QUIT = 'bise-desktop: update at quit';

type State = { state: string; version?: string; why?: string; reason?: string };
const states = (out: Lines): State[] => out.of(UPDATE).filter((l) => l.startsWith('{')).map((l) => JSON.parse(l) as State);

async function launch(w: World, env: Record<string, string>, userData: string): Promise<{ s: Session; out: Lines }> {
  const s = await launchReal(w, { env: { ...env, BISE_DESKTOP_USER_DATA: userData } });
  const out = new Lines();
  s.app.process().stdout?.setEncoding('utf8');
  s.app.process().stdout?.on('data', (d: string) => {
    out.push(d);
  });
  return { s, out };
}

const now = (page: Page): Promise<State> =>
  page.evaluate(() => (window as unknown as { bise: { update: { now: () => Promise<State> } } }).bise.update.now()).catch((e: unknown) => ({ state: `error: ${String(e)}` }));

async function waitState(page: Page, out: Lines, pred: (s: State) => boolean, what: string, ms = 60_000): Promise<State> {
  const end = Date.now() + ms;
  for (;;) {
    const hit = states(out).find(pred);
    if (hit) return hit;
    const n = await now(page);
    if (pred(n)) return n;
    if (Date.now() > end) throw new Error(`no update state for ${what} in ${ms} ms; lines ${JSON.stringify(states(out))}; main said: ${JSON.stringify(out.lines.slice(-15))}`);
    await sleep(250);
  }
}

/** One case's folder in the world's home, its feed (made again), its userData and idle file. */
function caseOf(w: World, name: string, opts: FeedOpts = {}) {
  const dir = path.join(w.home, 'update-moments', name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const f = makeUpdateFeed(w.home, 'good', opts);
  const idle = path.join(dir, 'idle');
  writeFileSync(idle, '0\n');
  const userData = path.join(dir, 'userdata');
  return { f, idle, userData, updates: path.join(userData, 'updates'), env: { ...f.env, BISE_DESKTOP_TEST_IDLE_FILE: idle } };
}

/** The world's fresh home opens setup once; he leaves it. */
async function skipSetup(s: Session): Promise<void> {
  const skip = s.page.getByTestId('setup.skip');
  await skip.waitFor({ timeout: 10_000 }).then(() => skip.click()).catch(() => undefined);
}

/** His quit (⌘Q: app.quit), then the process's end. */
async function quit(s: Session): Promise<void> {
  const exited = new Promise<void>((ok) => {
    s.app.process().once('exit', () => {
      ok();
    });
  });
  await s.app.evaluate(({ app }) => {
    app.quit();
  }).catch(() => undefined);
  await Promise.race([exited, sleep(20_000)]);
}

test('setup/update (real core) at quit: ready, he quits, the swap happens on the way out; the next start confirms it', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const c = caseOf(w, 'quit');
  const ino = statSync(c.f.target).ino;
  const first = await launch(w, c.env, c.userData);
  try {
    await skipSetup(first.s);
    await waitState(first.s.page, first.out, (x) => x.state === 'ready' && x.version === OFFERED.version, 'ready');
    // idle 0: no quiet moment, it waits for the quit
    await sleep(2500);
    expect(first.out.of(MOMENT), 'he is at the app: in use').toContain('in_use');
    expect(statSync(c.f.target).ino, 'nothing installed before the quit').toBe(ino);
    await quit(first.s);
    expect(first.out.of(AT_QUIT), 'the swap at quit').toEqual([OFFERED.version]);
    expect(first.out.of(RELAUNCH), 'no relaunch: his next open is the new app').toEqual([]);
    expect(statSync(c.f.target).ino, '<target> is a new directory').not.toBe(ino);
    expect(existsSync(`${c.f.target}.old`), '.old keeps the previous app').toBe(true);
    expect(JSON.parse(readFileSync(path.join(c.updates, 'swap.json'), 'utf8'))).toMatchObject({ phase: 'swapped', to_version: OFFERED.version, attempts: 0, ok: false });
  } finally {
    await first.s.close().catch(() => undefined);
  }
  const second = await launch(w, c.env, c.userData);
  try {
    await expect
      .poll(() => existsSync(`${c.f.target}.old`) || existsSync(path.join(c.updates, 'swap.json')), { timeout: 30_000, message: 'confirmed: .old and swap.json gone' })
      .toBe(false);
  } finally {
    await second.s.close();
  }
});

test("setup/update (real core) at quit, read-only: the swap can't happen, the app quits anyway and the bundle is untouched", async () => {
  test.setTimeout(180_000);
  const w = realWorld();
  const c = caseOf(w, 'quit-ro');
  const ino = statSync(c.f.target).ino;
  const parent = path.dirname(c.f.target);
  const { s, out } = await launch(w, c.env, c.userData);
  try {
    await skipSetup(s);
    await waitState(s.page, out, (x) => x.state === 'ready', 'ready');
    chmodSync(parent, 0o555);
    const t0 = Date.now();
    await quit(s);
    expect(s.app.process().exitCode !== null || s.app.process().signalCode !== null, 'the app quit').toBe(true);
    expect(Date.now() - t0, 'within the quit bound and some').toBeLessThan(15_000);
    expect(out.of(AT_QUIT).join(' '), 'the swap failed at quit').toMatch(/^failed /);
    expect(statSync(c.f.target).ino, 'the running bundle is untouched').toBe(ino);
    expect(existsSync(`${c.f.target}.old`), 'no .old').toBe(false);
  } finally {
    chmodSync(parent, 0o755);
    await s.close().catch(() => undefined);
  }
});

test('setup/update (real core) at a quiet moment: never while he types; once he steps away it installs and reopens his screen', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const c = caseOf(w, 'quiet');
  const ino = statSync(c.f.target).ino;
  const first = await launch(w, c.env, c.userData);
  try {
    const { s, out } = first;
    await skipSetup(s);
    await waitState(s.page, out, (x) => x.state === 'ready' && x.version === OFFERED.version, 'ready');
    // he types in the composer (idle 0, a key every 100 ms for 4 s): in use, nothing installs
    await s.page.getByTestId('composer.field').first().click();
    const until = Date.now() + 4000;
    while (Date.now() < until) {
      await s.page.keyboard.type('x');
      await sleep(100);
    }
    expect(out.of(MOMENT), 'typing is in use').toContain('in_use');
    expect(out.of(MOMENT), 'never now while he types').not.toContain('now');
    expect(out.of(RELAUNCH)).toEqual([]);
    expect(statSync(c.f.target).ino, 'nothing installed while he types').toBe(ino);
    // he leaves the window on his settings (a screen the next start must reopen)
    await clickMenu(s, 'bise/Settings…');
    await expect(s.page.getByTestId('settings.root')).toBeVisible({ timeout: 5000 });
    // he steps away from the Mac: 15 min idle
    writeFileSync(c.idle, '900\n');
    await out.wait(RELAUNCH, (r) => r === c.f.target, 15_000);
    expect(out.of(MOMENT)).toContain('now');
    expect(statSync(c.f.target).ino, 'swapped').not.toBe(ino);
    expect(existsSync(`${c.f.target}.old`)).toBe(true);
    // the off-screen window is never shown: it reopens hidden, on the same screen
    expect(JSON.parse(readFileSync(path.join(c.updates, 'route.json'), 'utf8'))).toEqual({ route: 'settings', quiet: true, shown: false });
    await s.page.screenshot({ path: test.info().outputPath('quiet-before.png') });
  } finally {
    await first.s.close();
  }
  const second = await launch(w, c.env, c.userData);
  try {
    await expect(second.s.page.getByTestId('settings.root'), 'the same screen reopens').toBeVisible({ timeout: 15_000 });
    await expect.poll(() => existsSync(`${c.f.target}.old`), { timeout: 30_000 }).toBe(false);
    await second.s.page.screenshot({ path: test.info().outputPath('quiet-after.png') });
  } finally {
    await second.s.close();
  }
});

/** The world's prefs.json with `desktop_channel` (null: taken out); returns the restore. */
function channelPref(w: World, channel: 'beta' | null): () => void {
  const file = path.join(w.home, '.bise', 'prefs.json');
  const before = existsSync(file) ? readFileSync(file, 'utf8') : null;
  const now = before === null ? {} : (JSON.parse(before) as Record<string, unknown>);
  if (channel === null) delete now['desktop_channel'];
  else now['desktop_channel'] = channel;
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(now));
  return () => {
    if (before === null) rmSync(file, { force: true });
    else writeFileSync(file, before);
  };
}

for (const channel of ['stable', 'beta'] as const) {
  test(`setup/update (real core) channels: a build on desktop-beta only, his app on ${channel}`, async () => {
    test.setTimeout(120_000);
    const w = realWorld();
    const c = caseOf(w, `channel-${channel}`, { channel: 'beta' });
    const restore = channelPref(w, channel === 'beta' ? 'beta' : null);
    const { s, out } = await launch(w, c.env, c.userData);
    try {
      await skipSetup(s);
      if (channel === 'beta') {
        await waitState(s.page, out, (x) => x.state === 'ready' && x.version === OFFERED.version, 'ready from beta');
      } else {
        await expect(s.page.getByTestId('app.root')).toBeVisible({ timeout: 15_000 });
        await sleep(6000);
        expect(states(out).filter((x) => x.state !== 'none'), 'stable offers nothing newer').toEqual([]);
      }
    } finally {
      restore();
      await s.close();
    }
  });
}

test('setup/update (real core) paused: stable says paused, nothing is offered', async () => {
  test.setTimeout(120_000);
  const w = realWorld();
  const c = caseOf(w, 'paused', { paused: true });
  const { s, out } = await launch(w, c.env, c.userData);
  try {
    await skipSetup(s);
    await expect(s.page.getByTestId('app.root')).toBeVisible({ timeout: 15_000 });
    await sleep(6000);
    expect(states(out).filter((x) => x.state !== 'none'), 'nothing offered').toEqual([]);
  } finally {
    await s.close();
  }
});
