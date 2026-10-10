// voice/fn-voice-window · fn fn with bise's window in front, the page's side (src/voicemode/fn.ts):
// main sends IPC 'bise:fn-voice' to that window (amb-mac's dba197c7, window.bise.onFnVoice); here
// main's own send stands in for the helper. A thread in view: fn fn toggles voice mode with its
// agent like ctrl+r twice (off → on, on with it → off, on with another agent → moves here). No
// thread in view (the inbox): bise's own thread opens and voice mode starts there with its main.
// Owner: amb-web. FakeCore records the window's commands.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
const world = () => [
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'all quiet: nothing waits on you.' }], before: null, more: false },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf')] },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'the thumbnails are 380 KB now.' }], before: null, more: false },
];
const vm = (project: string, name: string, on: boolean) => ({ ev: 'voice_mode', project, agent: name, on, state: 'listening' });

type Session = Awaited<ReturnType<typeof launchDesktop>>;
/** main's side of fn fn with the window in front: IPC 'bise:fn-voice' to the window (never the capsule). */
const fnFn = (s: Session): Promise<void> =>
  s.app.evaluate(({ BrowserWindow }) => {
    for (const w of BrowserWindow.getAllWindows()) if (!w.webContents.getURL().includes('surface=capsule')) w.webContents.send('bise:fn-voice', null);
  });
const voiceCmds = (core: FakeCore) => core.cmds().filter((c) => c.cmd === 'voice_mode');

test('voice/fn-voice-window: fn fn toggles voice mode with the thread in view, like ctrl+r twice', async () => {
  test.setTimeout(90_000);
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  try {
    const { page } = s;
    await expect(page.locator('[data-testid="composer.field"]')).toBeVisible({ timeout: 10_000 });
    // off: on with perf
    await fnFn(s);
    await expect.poll(() => voiceCmds(core), { timeout: 3000 }).toHaveLength(1);
    expect(voiceCmds(core)[0]).toMatchObject({ project: P, agent: 'perf', on: true });
    await core.send(vm(P, 'perf', true) as never);
    await expect(page.getByTestId('voice.pane')).toBeVisible({ timeout: 3000 });
    await page.screenshot({ path: test.info().outputPath('1-fn-fn-on-perf.png') });
    // on with perf: off
    await fnFn(s);
    await expect.poll(() => voiceCmds(core), { timeout: 3000 }).toHaveLength(2);
    expect(voiceCmds(core)[1]).toMatchObject({ project: P, agent: 'perf', on: false });
    await core.send(vm(P, 'perf', false) as never);
    await expect(page.getByTestId('voice.pane')).toHaveCount(0, { timeout: 3000 });
    // on with another agent (bise's main): it moves to perf. Nothing on perf's screen shows voice
    // mode with main, so a later entry in perf's thread proves the window has the voice_mode event
    // (the core's events arrive in order) before fn fn reads it.
    await core.send(vm(HOME, 'main', true) as never);
    await core.send({
      ev: 'thread',
      project: P,
      agent: 'perf',
      entries: [
        { pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'the thumbnails are 380 KB now.' },
        { pos: 2, at_ms: 1791100002000, kind: 'agent', text: 'and the cache keeps them a day.' },
      ],
      before: null,
      more: false,
    } as never);
    await expect(page.getByText('and the cache keeps them a day.')).toBeVisible({ timeout: 3000 });
    await fnFn(s);
    await expect.poll(() => voiceCmds(core), { timeout: 3000 }).toHaveLength(3);
    expect(voiceCmds(core)[2]).toMatchObject({ project: P, agent: 'perf', on: true });
  } finally {
    await s.close();
    core.dispose();
  }
});

test("voice/fn-voice-window: fn fn with no thread in view opens bise's own thread and starts voice mode there", async () => {
  test.setTimeout(90_000);
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'inbox' });
  try {
    const { page } = s;
    await expect(page.getByTestId('app.root')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="composer.field"]')).toHaveCount(0);
    await fnFn(s);
    await expect.poll(() => voiceCmds(core), { timeout: 3000 }).toHaveLength(1);
    expect(voiceCmds(core)[0]).toMatchObject({ project: HOME, agent: 'main', on: true });
    // bise's own thread is in view, and the core's answer puts the bar in its composer's place
    await expect(page.getByText('all quiet: nothing waits on you.')).toBeVisible({ timeout: 5000 });
    await core.send(vm(HOME, 'main', true) as never);
    await expect(page.getByTestId('voice.pane')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('voice.label')).toHaveText('voice mode · with bise'); // labelOf: the home's main is 'bise'
    await page.screenshot({ path: test.info().outputPath('2-fn-fn-from-inbox-bise.png') });
  } finally {
    await s.close();
    core.dispose();
  }
});
