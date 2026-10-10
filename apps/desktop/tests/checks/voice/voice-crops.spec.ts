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
const NARROW = 1100;
const NARROW_STATES: readonly [string, Record<string, unknown>][] = [
  ['listening', {}],
  ['hearing', { heard: 'why is the cold bench so much slower than the warm one' }],
  ['speaking', { said: ANSWER }],
  ['muted', { muted: true }],
  ['failed', { fail: 'microphone access denied' }],
];
/** the whole key line per state, before any trim (model.ts pairsOf / failedPairs) */
const FULL: Record<string, readonly string[]> = {
  listening: ['space send', 'hold space keep the floor', 'm mute', 'tab type', 'esc leave'],
  hearing: ['space send now', 'hold space keep the floor', 'm mute', 'tab type', 'esc leave'],
  speaking: ['hold space cut in', 'm mute', 'tab type', 'esc leave'],
  muted: ['m unmute', 'tab type', 'esc leave'],
  failed: ['tab type instead', 'esc leave'],
};

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
        const pane = q('[data-testid="voice.pane"]') ?? q('[data-testid="composer"]');
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
      if (clip === null) return null;
      const png = await page.screenshot({ clip });
      writeFileSync(test.info().outputPath(`voice-${name}@2x.png`), png);
      return png;
    };

    for (const t of ['light', 'dark'] as const) {
      await core.send(prefs(t) as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      for (const [state, extra] of STATES) {
        await core.send(vm(state, extra) as never);
        if (state === 'typing') {
          // typing: the composer is back with its grey pearl (/p/voice-window)
          await expect(page.getByTestId('voice.typing.pearl')).toBeVisible({ timeout: 2000 });
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
      await expect(page.getByTestId('voice.label')).toHaveText('fn talks to bise again when you leave voice mode', { timeout: 2000 });
      await shoot(`${t}-fn-refused`);
      // the label line again (3 s) before the next theme's stills
      await expect(page.getByTestId('voice.label')).toHaveText('voice mode · with perf', { timeout: 6000 });
    }

    // at 1100 (designer m_16975): the key line never wraps ('tab type' goes first, then 'm mute',
    // 'esc leave' stays last), and a refused mic reads its words with [open settings] [leave esc]
    // and no hint
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: NARROW, height: H, deviceScaleFactor: 2, mobile: false });
    const narrow: string[] = [];
    const cells: { label: string; png: Buffer }[] = [];
    for (const t of ['light', 'dark'] as const) {
      await core.send(prefs(t) as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      for (const [state, extra] of NARROW_STATES) {
        await core.send(vm(state, extra) as never);
        await expect(page.getByTestId('voice.pane')).toHaveAttribute('data-state', state, { timeout: 2000 });
        await page.waitForTimeout(250);
        const line = await page.getByTestId('voice.keys').evaluate((el) => {
          const keys = Array.from(el.querySelectorAll('[data-testid^="voice.key."]'));
          return {
            words: keys.map((k) => k.textContent.trim()),
            tops: new Set(keys.map((k) => Math.round(k.getBoundingClientRect().top))).size,
            over: el.scrollWidth - el.clientWidth,
          };
        });
        const name = state === 'failed' ? 'mic-refused' : state;
        expect(line.tops, `${t} ${name} at ${NARROW}: the key line is one line`).toBe(1);
        expect(line.over, `${t} ${name} at ${NARROW}: no key cut off`).toBeLessThanOrEqual(1);
        expect(line.words.at(-1), `${t} ${name}: esc leave last`).toBe('esc leave');
        // what goes, in order: tab type, then m mute; the rest of the line stays
        const all = FULL[state] ?? [];
        const kept = all.filter((w) => line.words.includes(w));
        expect(line.words, `${t} ${name}: only tab type, then m mute, drop`).toEqual(kept);
        const gone = all.filter((w) => !line.words.includes(w));
        const order = ['tab type', 'm mute', 'm unmute'].filter((w) => all.includes(w));
        expect(gone, `${t} ${name}: tab type goes first, then m mute`).toEqual(order.slice(0, gone.length));
        if (state === 'failed') {
          await expect(page.getByTestId('voice.words')).toHaveText("▲ bise can't hear you: the mic is off for bise.");
          await expect(page.locator('[data-testid^="voice.btn."]')).toHaveText(['open settings', 'leaveesc']);
        }
        narrow.push(`${t} ${name}: ${line.words.join('   ')}`);
        const png = await shoot(`${NARROW}-${t}-${name}`);
        if (png !== null) cells.push({ label: `${NARROW} · ${t} · ${name} · ${line.words.join('   ')}`, png });
      }
    }
    writeFileSync(test.info().outputPath(`key-lines-${NARROW}.txt`), `${narrow.join('\n')}\n`);
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    // designer's one sheet: the 1100 crops, light then dark, each with its key line
    const figs = cells.map((c) => `<figure><figcaption>${c.label}</figcaption><img src="data:image/png;base64,${c.png.toString('base64')}"></figure>`).join('');
    await page.setContent(
      `<style>body{margin:0;background:#777;font:12px ui-monospace,monospace;color:#eee}main{display:grid;grid-template-columns:repeat(2,max-content);gap:12px;padding:12px}figure{margin:0}figcaption{margin:0 0 4px}img{display:block;zoom:.5;border-radius:6px}</style><main>${figs}</main>`,
    );
    writeFileSync(test.info().outputPath(`voice-crops-${NARROW}-sheet.png`), await page.screenshot({ fullPage: true }));
  } finally {
    await s.close();
    core.dispose();
  }
});
