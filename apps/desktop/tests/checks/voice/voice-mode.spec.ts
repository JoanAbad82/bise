// voice/voice-mode · voice mode in the window, to designer's voice-window page (1) (ambient-lead
// m_16793; amb-core's 473d5757 events, its lit field m_16806). Passes when, on acme's perf thread
// with the scripted core (FakeCore: fake voice, no mic):
//   - the composer's ∿ button, and ctrl+r twice in the composer within 400 ms, ask the core for
//     voice mode on perf;
//   - the core's voice_mode events swap the composer's box for the bar in the same place and width:
//     label 'voice mode · with perf' with the voice role's model 'Voxtral · Mistral' at its right, the
//     live pearl 40 px at its left, mute and leave on its right, the key line under it; each state
//     reads as the page: listening, hearing (his words in ink, in the bar only), sending, thinking
//     ('∿ perf is on it'), speaking, muted ('speaking · ○ muted', unmute), failed (a refused mic:
//     the page's words, 'open settings' opens nothing in test mode), typing (the composer back
//     with 'to perf · voice paused', 'tab back to voice', '⏎ send   tab back to voice   esc leave',
//     a grey small pearl in the box);
//   - his sent turn lands as his right bubble with 'said · 0:0N' under it; the answer it speaks is
//     lit (said words in ink, the rest faint, '∿ speaking' under it), a cut leaves 'you cut in';
//   - space tapped sends now, m mutes, tab types, tab in the composer goes back to voice, esc
//     leaves (the core gets voice_send, voice_mute, voice_type, voice_mode off); fn refused while it
//     is on (the core's error on talk_start) reads 'fn talks to bise again when you leave voice mode';
//   - nothing of the bar leaves the window.
// Writes one sheet (every state, light + dark, the lit answer, the fn-refused line) for designer.
// Owner: amb-home (the page's v2: amb-web).
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
const ANSWER = 'done for the tablets: 410 KB, the page shows phone and tablet side by side. want the desktop size too?';
const SAID = 'done for the tablets: 410 KB, the page shows ';
const ASKED = 'good, now do the same for the tablet sizes and show me both';
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'roles', items: [{ about: 'speech to text', kind: 'voice', model: 'mistral/voxtral-mini-latest', name: 'voice', role: 'voice', source: 'env' }] },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf')] },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'the thumbnails are 380 KB now.' }], before: null, more: false },
];

const vm = (state: string, extra: Record<string, unknown> = {}) => ({ ev: 'voice_mode', project: P, agent: 'perf', on: true, state, ...extra });
const STATES: readonly [string, Record<string, unknown>, string][] = [
  ['listening', {}, '● listening'],
  ['hearing', { heard: ASKED }, `${ASKED} …`],
  ['sending', { heard: ASKED }, 'sending…'],
  ['thinking', {}, '∿ perf is on it'],
  ['speaking', { said: ANSWER }, 'speaking'],
  ['muted', { muted: true }, 'speaking · ○ muted'],
  ['failed', { fail: 'microphone access denied' }, "▲ bise can't hear you: the mic is off for bise."],
  ['typing', {}, ''],
];
const KEYS: Record<string, string> = {
  listening: 'space send   hold space keep the floor   m mute   tab type   esc leave',
  hearing: 'space send now   hold space keep the floor   m mute   tab type   esc leave',
  sending: 'space cut in   m mute   tab type   esc leave',
  thinking: 'space cut in   m mute   tab type   esc leave',
  speaking: 'hold space cut in   m mute   tab type   esc leave',
  muted: 'm unmute   tab type   esc leave',
  failed: 'tab type instead   esc leave',
};

test("voice/voice-mode: ∿ and ctrl+r twice, every state in the composer's box, said · 0:0N, the lit answer, its keys", async () => {
  test.setTimeout(150_000);
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  const shots: { label: string; png: Buffer }[] = [];
  const keyLines: string[] = [];
  try {
    const { page } = s;
    const field = page.locator('[data-testid="composer.field"]');
    await expect(field).toBeVisible({ timeout: 10_000 });
    // the composer's box: the bar takes its place and width
    const boxOf = async (sel: string) => page.locator(sel).first().boundingBox();
    const composerBox = await boxOf('[data-testid="composer.box"]');
    // the ∿ button: voice mode on perf
    await page.getByTestId('composer.voice').click();
    expect(await core.waitCmd((c) => c.cmd === 'voice_mode', 3000)).toMatchObject({ project: P, agent: 'perf', on: true });
    // ctrl+r twice in the composer: the same
    await field.click();
    await page.keyboard.press('Control+r');
    await page.keyboard.press('Control+r');
    await expect.poll(() => core.cmds().filter((c) => c.cmd === 'voice_mode' && c.on).length, { timeout: 3000 }).toBe(2);

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
      for (const [state, extra, words] of STATES) {
        if (state === 'muted') await core.send(vm('speaking', { said: ANSWER }) as never);
        await core.send(vm(state, extra) as never);
        if (state === 'typing') {
          await expect(field).toBeVisible({ timeout: 2000 });
          await expect(page.getByTestId('voice.pane')).toHaveCount(0);
          await expect(page.locator('[data-testid="composer"] .div')).toHaveText('to perf · voice paused' + 'tab back to voice');
          await expect(page.getByTestId('composer.keys')).toHaveText('⏎ send   tab back to voice   esc leave');
          await expect(page.getByTestId('voice.typing.pearl')).toBeVisible();
          await field.click();
          await page.keyboard.type('yes, and the 1440 one');
        } else {
          await expect(page.getByTestId('voice.pane')).toHaveAttribute('data-state', state, { timeout: 2000 });
          await expect(page.getByTestId('voice.label')).toHaveText('voice mode · with perf');
          await expect(page.getByTestId('voice.model')).toHaveText('Voxtral · Mistral');
          await expect(page.getByTestId('voice.words')).toHaveText(words);
          // each pair is its own button (the gap is CSS): read them pair by pair. The line stays one
          // line (designer m_16975): when it doesn't fit, 'tab type' goes first, then 'm mute';
          // 'esc leave' always stays, last
          const trim = Number((await page.getByTestId('voice.keys').getAttribute('data-trim')) ?? '0');
          const gone = ['tab type', 'm mute', 'm unmute'].slice(0, trim === 0 ? 0 : trim === 1 ? 1 : 3);
          const want = (KEYS[state] ?? '').split('   ').filter((p) => !gone.includes(p)).join('   ');
          await expect.poll(async () => (await page.locator('[data-testid^="voice.key."]').allTextContents()).map((s) => s.trim()).join('   ')).toBe(want);
          expect(want.endsWith('esc leave'), `${state}: esc leave last`).toBe(true);
          const tops = await page.locator('[data-testid^="voice.key."]').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
          expect(new Set(tops).size, `${state}: the key line is one line`).toBe(1);
          const over = await page.getByTestId('voice.keys').evaluate((e) => e.scrollWidth - e.clientWidth);
          expect(over, `${state}: no key cut off`).toBeLessThanOrEqual(1);
          keyLines.push(`${t} ${state}: trim ${trim} · ${want}`);
          expect(await inWindow(), `${state}: the bar inside the window`).toBe(true);
          // his live words stay in the bar, never in the thread before they go
          if (state === 'hearing') await expect(page.getByText(ASKED, { exact: true })).toHaveCount(0);
          // the bar is the composer's box: same left and width (±2 px), the pearl 40 px
          const bar = await boxOf('[data-testid="voice.bar"]');
          if (composerBox !== null && bar !== null) {
            expect(Math.abs(bar.x - composerBox.x), `${state}: the bar's left`).toBeLessThanOrEqual(2);
            expect(Math.abs(bar.width - composerBox.width), `${state}: the bar's width`).toBeLessThanOrEqual(2);
          }
          const pearl = await boxOf('[data-testid="voice.pearl"]');
          expect(Math.round(pearl?.width ?? 0)).toBe(40);
        }
        if (state === 'speaking') await core.send({ ev: 'level', who: 'agent', v: 0.7 } as never);
        if (state === 'hearing') await core.send({ ev: 'level', who: 'you', v: 0.6 } as never);
        shots.push({ label: `${t} · ${state}`, png: await page.screenshot() });
        if (state === 'typing') {
          await page.keyboard.press('Meta+a');
          await page.keyboard.press('Backspace');
        }
      }
    }

    // his turn: heard, then sent; it lands as his bubble with 'said · 0:0N'; the answer lights as it is said
    await core.send(vm('listening') as never);
    await core.send(vm('hearing', { heard: ASKED }) as never);
    await page.waitForTimeout(1100);
    await core.send(vm('sending', { heard: ASKED }) as never);
    await core.send(vm('thinking') as never);
    await core.send({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 2, at_ms: Date.now(), kind: 'you', text: ASKED } } as never);
    await expect(page.getByTestId('thread.you.2.under')).toHaveText(/^said · 0:0[1-3]$/u, { timeout: 3000 });
    await core.send({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 3, at_ms: Date.now(), kind: 'agent', text: ANSWER } } as never);
    const said = SAID.length;
    await core.send(vm('speaking', { said: ANSWER, lit: { pos: 3, said, cut: false } }) as never);
    await expect(page.locator('[data-testid="thread.lit.3"] .vm-said')).toHaveText(SAID, { timeout: 2000 });
    await expect(page.locator('[data-testid="thread.lit.3"] .vm-unsaid')).toHaveText(ANSWER.slice(SAID.length));
    await expect(page.getByTestId('thread.voice.3')).toHaveText('∿ speaking');
    const tones = await page.evaluate(() => {
      const c = (sel: string) => {
        const el = document.querySelector(sel);
        return el === null ? '' : getComputedStyle(el).color;
      };
      return { said: c('[data-testid="thread.lit.3"] .vm-said'), unsaid: c('[data-testid="thread.lit.3"] .vm-unsaid') };
    });
    expect(tones.said, 'said in ink, the rest faint').not.toBe(tones.unsaid);
    shots.push({ label: 'dark · the answer lit', png: await page.screenshot() });
    // he cuts in: the rest stays faint with 'you cut in'
    await core.send(vm('listening', { lit: { pos: 3, said, cut: true } }) as never);
    await expect(page.getByTestId('thread.voice.3')).toHaveText('you cut in', { timeout: 2000 });
    shots.push({ label: 'dark · you cut in', png: await page.screenshot() });
    // all said, no cut: the answer as any answer, nothing under it
    await core.send(vm('listening', { lit: { pos: 3, said: ANSWER.length, cut: false } }) as never);
    await expect(page.getByTestId('thread.voice.3')).toHaveCount(0, { timeout: 2000 });
    await expect(page.getByTestId('thread.lit.3')).toHaveCount(0);

    // its keys: space sends, m mutes, tab types, tab in the composer back to voice; fn refused; esc leaves
    await core.send(vm('hearing', { heard: 'why is it slow' }) as never);
    const pane = page.getByTestId('voice.pane');
    await expect(pane).toHaveAttribute('data-state', 'hearing');
    await pane.focus();
    await page.keyboard.press('Space');
    await core.waitCmd((c) => c.cmd === 'voice_send', 2000);
    await page.keyboard.press('m');
    expect(await core.waitCmd((c) => c.cmd === 'voice_mute', 2000)).toMatchObject({ on: true });
    await page.keyboard.press('Tab');
    expect(await core.waitCmd((c) => c.cmd === 'voice_type' && c.on, 2000)).toMatchObject({ on: true });
    await core.send(vm('typing') as never);
    await expect(field).toBeVisible({ timeout: 2000 });
    await field.click();
    await page.keyboard.press('Tab');
    expect(await core.waitCmd((c) => c.cmd === 'voice_type' && !c.on, 2000)).toMatchObject({ on: false });
    await core.send(vm('failed', { fail: 'microphone access denied' }) as never);
    await page.getByTestId('voice.btn.settings').click();
    await core.send(vm('listening') as never);
    await core.send({ ev: 'error', cmd: 'talk_start', text: 'voice mode is on with perf · ⌃R to leave' } as never);
    await expect(page.getByTestId('voice.label')).toHaveText('fn talks to bise again when you leave voice mode', { timeout: 2000 });
    shots.push({ label: 'dark · fn refused', png: await page.screenshot() });
    await page.getByTestId('voice.pane').focus();
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
    writeFileSync(test.info().outputPath('key-lines.txt'), `${keyLines.join('\n')}\n`);
    for (const [n, x] of shots.entries()) writeFileSync(test.info().outputPath(`${String(n).padStart(2, '0')}-${x.label.replace(/[^a-z0-9]+/giu, '-')}.png`), x.png);
  } finally {
    await s.close();
    core.dispose();
  }
});
