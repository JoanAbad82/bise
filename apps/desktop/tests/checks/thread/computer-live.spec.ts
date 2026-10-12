// thread/computer-live · S29/L19 W1-W4 (amb-core's l19 plan, docs/desktop-bar.md:212): an agent
// that uses his computer shows it on one line under its head, from the core's computer_live rows
// (the core's mark + words, amb-core m_16595; the window adds ' · 2 min' while it drives).
// Passes when, on storefront's perf thread with the scripted core (FakeCore, fake data):
//   - no row: no line; perf drives Chrome: '↖ driving Chrome · amazon.fr · 2 min' with 'take the
//     wheel' and 'stop', and the sidebar's perf row has the '↖';
//   - 'take the wheel' sends computer {take, key} and the line stays as it is until the rows move;
//   - paused ('? you took the wheel' in the accent, the button 'give it back ⏎'; the head's chip
//     '? waiting for you'): ⏎ on the empty composer sends computer {hand_back, key} and nothing
//     else (no send);
//   - stopped: his message sends computer {hand_back, key} first, then the send;
//   - a click on the words asks a peek of its key and shows the still with 'a still from hh:mm ·
//     esc closes' under it; esc closes it and nothing
//     else (the turn goes on: no stop);
//   - the line sits on the head's left edge (16 px), at 1400 and 800;
//   - a row of another bise (no project) draws nothing.
// Writes shots (light + dark at 1400 and 800: driving, paused, stopped) for designer.
// Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'storefront-1a2b3c4d';
const KEY = '9f2c4e1a7b3d5e60.perf';
const MIN = 60_000;
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
const agent = (name: string, now: number, over: Record<string, unknown> = {}) => ({ name, dir: name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: now - 30 * MIN, waits: 0, ...over });
const world = (now: number) => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 2, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main', now), agent('perf', now, { status: 'working', since_ms: now - 3 * MIN, purpose: 'price watch', branch: 'sb/perf' })] },
  {
    ev: 'thread',
    project: P,
    agent: 'perf',
    entries: [
      { pos: 1, at_ms: now - 3 * MIN, kind: 'you', text: 'check the price of the standing desk on amazon.fr and tell me if it dropped' },
      { pos: 2, at_ms: now - 2 * MIN, kind: 'agent', text: 'opening amazon.fr in your Chrome to read the current price.' },
    ],
    before: null,
    more: false,
  },
];
const driving = (now: number) => ({ agent: 'perf', key: KEY, project: P, driving: 'Chrome', place: 'amazon.fr', since_ms: now - 2 * MIN, kind: 'driving', mark: '↖', words: 'driving Chrome · amazon.fr' });
const paused = (now: number) => ({ ...driving(now), paused: true, kind: 'paused', mark: '?', words: 'you took the wheel · ⏎ give it back' });
const stopped = (now: number) => ({ ...driving(now), stopped: true, kind: 'stopped', mark: '↖', words: 'you stopped it driving Chrome · write to it to go on' });
const other = { agent: 'perf', key: '0a1b2c3d4e5f6071.perf', driving: 'Notes', kind: 'driving', mark: '↖', words: 'driving Notes' };
// a 4x3 grey png: the still the fake core answers a peek with
const STILL = 'iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAAEklEQVR4nGNoaGj4jwQYSOUDABHcF/F7SIWMAAAAAElFTkSuQmCC';
type Cmd = { cmd?: string; act?: string; key?: string; text?: string };

test('thread/computer-live: the live line under the head, its acts with the key, ⏎ gives the wheel back, his message resumes a stopped agent', async () => {
  test.setTimeout(150_000);
  const now = Date.now();
  const core = new FakeCore(world(now) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  try {
    const { page } = s;
    const live = (items: unknown[]) => core.send({ ev: 'computer_live', items } as never);
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
    await size(1400, 900);
    await expect(page.getByTestId('thread.head')).toBeVisible({ timeout: 10_000 });
    const line = page.getByTestId('thread.computer');
    const words = page.getByTestId('thread.computer.words');
    const mark = page.getByTestId('app.right.agent.perf.computer');

    // no row, or another bise's row: nothing
    await live([other]);
    await page.waitForTimeout(300);
    await expect(line).toHaveCount(0);
    await expect(mark).toHaveCount(0);

    // driving
    await live([other, driving(now)]);
    await expect(words).toHaveText('↖ driving Chrome · amazon.fr · 2 min');
    await expect(page.getByTestId('thread.computer.take')).toHaveText('take the wheel');
    await expect(page.getByTestId('thread.computer.stop')).toHaveText('stop');
    await expect(mark).toHaveText('↖');
    await page.getByTestId('thread.computer.take').click();
    expect(await core.waitCmd((c) => c.cmd === 'computer' && c.act === 'take', 3000)).toMatchObject({ key: KEY });
    await page.waitForTimeout(300);
    await expect(line, 'nothing drawn before the rows move').toHaveAttribute('data-state', 'driving');

    // paused: ⏎ on the empty composer gives it back, sends nothing
    await live([paused(now)]);
    await expect(words).toHaveText('? you took the wheel');
    await expect(page.getByTestId('thread.computer.back')).toHaveText('give it back ⏎');
    // it waits for him until he gives it back: the head's chip says so, like the sidebar's '?'
    await expect(page.getByTestId('thread.head.state')).toHaveText('? waiting for you');
    await expect(page.getByTestId('thread.head.state')).toHaveAttribute('data-needs', 'true');
    const field = page.locator('[data-testid="composer.field"]').first();
    await field.click();
    const before = core.cmds().length;
    await page.keyboard.press('Enter');
    expect(await core.waitCmd((c) => c.cmd === 'computer' && c.act === 'hand_back', 3000)).toMatchObject({ key: KEY });
    expect((core.cmds().slice(before) as Cmd[]).filter((c) => c.cmd === 'send'), 'no send').toEqual([]);

    // stopped: his message gives it back first, then goes
    await live([stopped(now)]);
    await expect(words).toHaveText('↖ you stopped it driving Chrome · write to it to go on');
    await expect(page.getByTestId('thread.head.state'), 'given back: the chip is its own again').toHaveText(/working/);
    await expect(page.getByTestId('thread.computer.take')).toHaveCount(0);
    const at = core.cmds().length;
    await field.click();
    await page.keyboard.type('the desk, not the chair: go on');
    await page.keyboard.press('Enter');
    await core.waitCmd((c) => c.cmd === 'send', 3000);
    const after = (core.cmds().slice(at) as Cmd[]).filter((c) => c.cmd === 'computer' || c.cmd === 'send');
    expect(after.map((c) => `${c.cmd ?? ''}${c.act !== undefined ? `:${c.act}` : ''}`), 'hand_back, then the send').toEqual(['computer:hand_back', 'send']);

    // the peek: a click on the words asks its key's still, esc closes it
    await live([driving(now)]);
    await expect(line).toHaveAttribute('data-state', 'driving');
    await words.click();
    expect(await core.waitCmd((c) => c.cmd === 'computer' && c.act === 'peek', 3000)).toMatchObject({ key: KEY });
    await core.send({ ev: 'computer_peek', key: KEY, shot: { mime: 'image/png', data: STILL, width: 480, height: 300 } } as never);
    await expect(page.getByTestId('thread.computer.peek').locator('img')).toBeVisible();
    await expect(page.getByTestId('thread.computer.peek.cap')).toHaveText(/^a still from \d\d:\d\d · esc closes$/);
    await page.screenshot({ path: test.info().outputPath('peek-light-1400.png') });
    const stops = core.cmds().length;
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('thread.computer.peek')).toHaveCount(0);
    await page.waitForTimeout(300);
    expect((core.cmds().slice(stops) as Cmd[]).filter((c) => c.cmd === 'stop' || c.cmd === 'interrupt'), 'esc closes the still only: the turn goes on').toEqual([]);
    await expect(page.getByText('stopping perf…')).toHaveCount(0);
    // the line sits on the head's left edge (its 16 px padding)
    const x = async (id: string) => (await page.getByTestId(id).boundingBox())?.x ?? -1;
    expect(Math.round((await x('thread.computer.words')) - (await x('thread.head')))).toBe(16);
    await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); });

    // shots: each state, light + dark, 1400 + 800
    const states = [
      ['driving', driving(now)],
      ['paused', paused(now)],
      ['stopped', stopped(now)],
    ] as const;
    for (const t of ['light', 'dark'] as const) {
      await theme(t);
      for (const [name, row] of states) {
        await live([row]);
        await expect(line).toHaveAttribute('data-state', name);
        for (const w of [1400, 800]) {
          await size(w, 900);
          await expect(words, 'the words show').toBeVisible();
          // (polled: the sidebar slides back in at 1400 and the column moves while it does)
          await expect.poll(async () => Math.round((await x('thread.computer.words')) - (await x('thread.head'))), { message: "on the head's left edge" }).toBe(16);
          await page.screenshot({ path: test.info().outputPath(`cu-${name}-${t}-${String(w)}.png`) });
        }
      }
    }
  } finally {
    await s.close();
    core.dispose();
  }
});
