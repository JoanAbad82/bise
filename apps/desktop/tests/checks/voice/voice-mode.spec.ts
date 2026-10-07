// voice/voice-mode · voice mode in the window (ambient's spec m_11632, amb-core's 473d5757 events).
// Passes when, on acme's perf thread with the scripted core (FakeCore: fake voice, no mic):
//   - ctrl+r twice in the composer within 400 ms asks the core for voice mode on perf;
//   - the core's voice_mode events swap the composer for the pane (label 'you ⇄ perf · voice
//     mode'), and each state reads as specced: listening, hearing with his words, sending,
//     thinking, speaking with the said words, muted, failed with its text; typing brings the
//     composer back under 'typing: the mic waits';
//   - space tapped sends now, m mutes, esc leaves (the core gets voice_send, voice_mute, voice_mode
//     off); fn refused while it is on (the core's error on talk_start) reads 'fn waits: voice mode
//     is on here' on the label line;
//   - nothing of the pane leaves the window.
// Writes one sheet (every state, light + dark, and the fn-refused line) for ambient. Owner: amb-home.
import { writeFileSync } from 'node:fs';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
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
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'the cold bench runs 3 times slower than the warm one.' }], before: null, more: false },
];

const vm = (state: string, extra: Record<string, unknown> = {}) => ({ ev: 'voice_mode', project: P, agent: 'perf', on: true, state, ...extra });
const STATES: readonly [string, Record<string, unknown>][] = [
  ['listening', {}],
  ['hearing', { heard: 'why is the cold bench so much slower than the warm one' }],
  ['sending', {}],
  ['thinking', {}],
  ['speaking', { said: 'the cold bench reloads the cache from disk on every run, the warm one keeps it' }],
  ['muted', { muted: true }],
  ['failed', { fail: 'the voice model is unreachable.' }],
  ['typing', {}],
];

test('voice/voice-mode: ctrl+r twice, every state in the pane, its keys, fn refused', async () => {
  test.setTimeout(120_000);
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  const shots: { label: string; png: Buffer }[] = [];
  try {
    const { page } = s;
    const field = page.locator('[data-testid="composer.field"]');
    await expect(field).toBeVisible({ timeout: 10_000 });
    await field.click();
    // ctrl+r twice: voice mode on perf
    await page.keyboard.press('Control+r');
    await page.keyboard.press('Control+r');
    const on = await core.waitCmd((c) => c.cmd === 'voice_mode', 3000);
    expect(on).toMatchObject({ project: P, agent: 'perf', on: true });

    const theme = async (t: 'light' | 'dark') => {
      await core.send(prefs(t) as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
    };
    const inWindow = async () =>
      page.evaluate(() => {
        const r = document.querySelector('[data-testid="voice.pane"]')?.getBoundingClientRect();
        return r !== undefined && r.left >= 0 && r.right <= window.innerWidth + 0.5 && r.bottom <= window.innerHeight + 0.5;
      });
    for (const t of ['light', 'dark'] as const) {
      await theme(t);
      for (const [state, extra] of STATES) {
        await core.send(vm(state, extra) as never);
        if (state === 'typing') {
          await expect(page.getByTestId('voice.typing')).toBeVisible({ timeout: 2000 });
          await expect(page.locator('[data-testid="composer.field"]')).toBeVisible();
        } else {
          await expect(page.getByTestId('voice.pane')).toHaveAttribute('data-state', state, { timeout: 2000 });
          await expect(page.getByTestId('voice.label')).toHaveText('you ⇄ perf · voice mode');
          if (typeof extra['heard'] === 'string') await expect(page.getByTestId('voice.words')).toContainText(extra['heard']);
          if (typeof extra['said'] === 'string') await expect(page.getByTestId('voice.words')).toContainText(extra['said']);
          if (typeof extra['fail'] === 'string') await expect(page.getByTestId('voice.words')).toContainText(extra['fail']);
          expect(await inWindow(), `${state}: the pane inside the window`).toBe(true);
        }
        if (state === 'speaking') await core.send({ ev: 'level', who: 'agent', v: 0.7 } as never);
        if (state === 'hearing') await core.send({ ev: 'level', who: 'you', v: 0.6 } as never);
        shots.push({ label: `${t} · ${state}`, png: await page.screenshot() });
      }
    }

    // its keys: space sends, m mutes, esc leaves; fn refused reads on the label line
    await core.send(vm('hearing', { heard: 'why is it slow' }) as never);
    const pane = page.getByTestId('voice.pane');
    await expect(pane).toHaveAttribute('data-state', 'hearing');
    await pane.focus();
    await page.keyboard.press('Space');
    await core.waitCmd((c) => c.cmd === 'voice_send', 2000);
    await page.keyboard.press('m');
    expect(await core.waitCmd((c) => c.cmd === 'voice_mute', 2000)).toMatchObject({ on: true });
    await core.send({ ev: 'error', cmd: 'talk_start', text: 'voice mode is on with perf · ⌃R to leave' } as never);
    await expect(page.getByTestId('voice.label')).toHaveText('fn waits: voice mode is on here', { timeout: 2000 });
    shots.push({ label: 'dark · fn refused', png: await page.screenshot() });
    await page.keyboard.press('Escape');
    expect(await core.waitCmd((c) => c.cmd === 'voice_mode' && !c.on, 2000)).toMatchObject({ project: P, agent: 'perf' });

    // the sheet: every still at half size, labelled
    await s.app.evaluate(({ BrowserWindow }) => {
      const w = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
      w?.setContentSize(2300, 1500);
    });
    const cells = shots.map((x) => `<figure><figcaption>${x.label}</figcaption><img src="data:image/png;base64,${x.png.toString('base64')}"></figure>`).join('');
    await page.setContent(
      `<style>body{margin:0;background:#777;font:12px ui-monospace,monospace;color:#eee}main{display:flex;flex-wrap:wrap;gap:10px;padding:10px;align-items:flex-start}figure{margin:0}figcaption{margin:0 0 3px}img{display:block;zoom:.4;border-radius:6px}</style><main>${cells}</main>`,
    );
    writeFileSync(test.info().outputPath('voice-mode-sheet.png'), await page.screenshot({ fullPage: true }));
  } finally {
    await s.close();
    core.dispose();
  }
});
