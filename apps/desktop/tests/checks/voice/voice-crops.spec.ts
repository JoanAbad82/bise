// voice/voice-crops · designer's review stills of voice mode in the window (designer m_16811).
// One 2x png per state and theme, cropped to the thread's bottom half: from the last message to the
// key line, the column's full width. States: listening, hearing, sending, thinking, speaking (the
// answer it says is the thread's last message), muted, failed, typing, fn refused. FakeCore only.
// Passes when every state draws its pane (or, typing, the typing line) inside the window.
// Files: voice-<theme>-<state>@2x.png in the test's output folder. Owner: amb-core.
import { writeFileSync } from 'node:fs';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const W = 1400;
const H = 900;
const ANSWER = 'the cold bench reloads the cache from disk on every run, the warm one keeps it in memory.';
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
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
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf')] },
  {
    ev: 'thread',
    project: P,
    agent: 'perf',
    entries: [
      { pos: 1, at_ms: 1791100001000, kind: 'user', text: 'why is the cold bench so much slower than the warm one' },
      { pos: 2, at_ms: 1791100004000, kind: 'agent', text: ANSWER },
    ],
    before: null,
    more: false,
  },
];

const vm = (state: string, extra: Record<string, unknown> = {}) => ({ ev: 'voice_mode', project: P, agent: 'perf', on: true, state, ...extra });
const STATES: readonly [string, Record<string, unknown>][] = [
  ['listening', {}],
  ['hearing', { heard: 'why is the cold bench so much slower than the warm one' }],
  ['sending', {}],
  ['thinking', {}],
  ['speaking', { said: ANSWER }],
  ['muted', { muted: true }],
  ['failed', { fail: 'the voice model is unreachable.' }],
  ['typing', {}],
];

test('voice/voice-crops: each voice mode state as its own 2x crop, light + dark', async () => {
  test.setTimeout(120_000);
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  try {
    const { page } = s;
    const cdp = await page.context().newCDPSession(page);
    const field = page.locator('[data-testid="composer.field"]');
    await expect(field).toBeVisible({ timeout: 10_000 });
    await field.click();
    await page.keyboard.press('Control+r');
    await page.keyboard.press('Control+r');
    await core.waitCmd((c) => c.cmd === 'voice_mode', 3000);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: false });

    // the last message's top to the key line's (or the composer's) bottom, the column's full width
    const box = () =>
      page.evaluate(() => {
        const q = (sel: string): DOMRect | null => document.querySelector(sel)?.getBoundingClientRect() ?? null;
        const entries = document.querySelectorAll('[data-testid^="thread.entry."]');
        const last: DOMRect | null = entries.length > 0 ? (entries[entries.length - 1]?.getBoundingClientRect() ?? null) : null;
        const bottom = q('[data-testid="voice.keys"]') ?? q('[data-testid="composer.field"]');
        const pane = q('[data-testid="voice.pane"]') ?? q('[data-testid="voice.typing"]');
        if (last === null || bottom === null || pane === null) return null;
        const left = Math.min(last.left, pane.left) - 24;
        const right = Math.max(last.right, pane.right) + 24;
        const top = last.top - 24;
        const end = Math.max(bottom.bottom, pane.bottom) + 24;
        return { x: Math.max(0, left), y: Math.max(0, top), width: Math.min(window.innerWidth, right) - Math.max(0, left), height: Math.min(window.innerHeight, end) - Math.max(0, top) };
      });
    const shoot = async (name: string) => {
      const clip = await box();
      expect(clip, `${name}: the last message and the pane are on screen`).not.toBeNull();
      if (clip === null) return;
      writeFileSync(test.info().outputPath(`voice-${name}@2x.png`), await page.screenshot({ clip }));
    };

    for (const t of ['light', 'dark'] as const) {
      await core.send(prefs(t) as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      for (const [state, extra] of STATES) {
        await core.send(vm(state, extra) as never);
        if (state === 'typing') {
          await expect(page.getByTestId('voice.typing')).toBeVisible({ timeout: 2000 });
        } else {
          await expect(page.getByTestId('voice.pane')).toHaveAttribute('data-state', state, { timeout: 2000 });
        }
        if (state === 'speaking') await core.send({ ev: 'level', who: 'agent', v: 0.7 } as never);
        if (state === 'hearing') await core.send({ ev: 'level', who: 'you', v: 0.6 } as never);
        await page.waitForTimeout(250);
        await shoot(`${t}-${state}`);
      }
      // fn refused: the core's error on talk_start, read on the label line
      await core.send(vm('listening') as never);
      await expect(page.getByTestId('voice.pane')).toHaveAttribute('data-state', 'listening', { timeout: 2000 });
      await core.send({ ev: 'error', cmd: 'talk_start', text: 'voice mode is on with perf · ⌃R to leave' } as never);
      await expect(page.getByTestId('voice.label')).toHaveText('fn waits: voice mode is on here', { timeout: 2000 });
      await shoot(`${t}-fn-refused`);
      // the label line again (3 s) before the next theme's stills
      await expect(page.getByTestId('voice.label')).toHaveText('you ⇄ perf · voice mode', { timeout: 6000 });
    }
    await cdp.send('Emulation.clearDeviceMetricsOverride');
  } finally {
    await s.close();
    core.dispose();
  }
});
