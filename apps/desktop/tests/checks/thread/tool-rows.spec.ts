// thread/tool-rows · R11/S9 (ambient-lead m_14022; amb-feed's typed tool items, proto ToolItem
// state/ms/exit/err/code/out): each tool call's line says its state as the TUI's tool row
// (rust/tui/src/toolrow.rs): '✓ 0.3 s' dim when it went well, '✗ exit 1 · 2.1 s' in the error tone
// with its first error line under it, '∿' and its running time while it runs; a failed read is
// its own line too; a click opens its code and output (the TUI's ctrl+o), ⌘E opens them all.
// The scripted core (FakeCore), light and dark shots. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string, status: string) => ({ name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 5 * MIN, waits: 0 });
const world = () => [
  prefs('light'),
  { ev: 'projects', projects: [{ project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 0, agents: 2, working: 1, waits: 0, running: true }] },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [ag('main', 'idle'), ag('perf', 'idle')] },
  {
    ev: 'thread',
    project: P,
    agent: 'perf',
    entries: [
      { pos: 1, at_ms: NOW - 4 * MIN, kind: 'you', text: 'run the tests and the lint' },
      {
        pos: 2,
        at_ms: NOW - 3 * MIN,
        kind: 'tools',
        text: 'ran 2 commands, read 2 files',
        tools: {
          count: 4,
          summary: 'ran 2 commands, read 2 files',
          items: [
            { pos: 3, at_ms: NOW - 3 * MIN, text: 'cargo test', kind: 'run', state: 'ok', ms: 300, code: 'cargo test -p perf', out: 'running 12 tests\ntest result: ok. 12 passed' },
            { pos: 4, at_ms: NOW - 3 * MIN + 1000, text: 'npm run lint', kind: 'run', state: 'err', ms: 2100, exit: 1, err: 'src/a.ts:3:7 error: x is unused', code: 'npm run lint', out: 'exit 1: src/a.ts:3:7 error: x is unused' },
            { pos: 5, at_ms: NOW - 3 * MIN + 4000, text: 'read_file: {"path":"gone.rs"}', kind: 'read', state: 'err', err: 'no such file: gone.rs' },
            { pos: 6, at_ms: NOW - 3 * MIN + 5000, text: 'src/b.rs', kind: 'read', state: 'ok', ms: 10 },
          ],
        },
      },
      { pos: 7, at_ms: NOW - 2 * MIN, kind: 'agent', text: 'tests pass; the lint fails on an unused x in src/a.ts.' },
    ],
    before: null,
    more: false,
  },
];

test("thread/tool-rows: each call says ✓ time or ✗ exit · time with its error line, as the TUI's; a click or ⌘E opens its code and output", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1100x760' });
  try {
    const { page } = s;
    const line = (pos: number) => page.getByTestId(`thread.tool.${String(pos)}`);
    await expect(line(3)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('thread.tool.3.end')).toHaveText('✓ 0.3 s');
    await expect(page.getByTestId('thread.tool.4.end')).toHaveText('✗ exit 1 · 2.1 s');
    await expect(page.getByTestId('thread.tool.4.err'), 'its first error line under it').toHaveText('src/a.ts:3:7 error: x is unused');
    await expect(line(5), 'a failed read is its own line').toContainText('read gone.rs');
    await expect(page.getByTestId('thread.tool.5.end')).toHaveText('✗');
    await expect(page.getByTestId('thread.tool.5.err')).toHaveText('no such file: gone.rs');
    await expect(line(6), 'a good read folds into the words').toHaveCount(0);
    // the error tone is the DS's err, and the ✗ says it without the colour
    const tone = await page.getByTestId('thread.tool.4.end').evaluate((el) => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--c-err)';
      el.parentElement?.appendChild(probe);
      const want = getComputedStyle(probe).color;
      probe.remove();
      return { got: getComputedStyle(el).color, want };
    });
    expect(tone.got).toBe(tone.want);
    await page.mouse.move(1, 300);
    await page.screenshot({ path: test.info().outputPath('tools-light.png') });

    // a click opens its code and output; again closes
    await line(4).click();
    await expect(page.getByTestId('thread.tool.4.open')).toContainText('npm run lint');
    await expect(page.getByTestId('thread.tool.4.open')).toContainText('exit 1: src/a.ts:3:7 error: x is unused');
    await expect(page.getByTestId('thread.tool.4.err'), 'open, the box says the error: the red line goes').toHaveCount(0);
    // open, it asks the hub for the call's real output once (amb-feed dece0fe9: up to 4 KB, cut)
    const ask = (await core.waitCmd((c) => (c as { cmd?: string }).cmd === 'tool_out', 5000)) as Record<string, unknown>;
    expect(ask).toMatchObject({ cmd: 'tool_out', project: P, agent: 'perf', pos: 4 });
    await core.send({ ev: 'tool_out', project: P, agent: 'perf', pos: 4, out: 'exit 1: src/a.ts:3:7 error: x is unused\nsrc/b.ts:9:1 warning: y is never read\n2 problems (1 error, 1 warning)', cut: true } as never);
    await expect(page.getByTestId('thread.tool.4.out'), 'the real output replaces the preview').toContainText('2 problems (1 error, 1 warning)');
    await expect(page.getByTestId('thread.tool.4.cut'), 'and says it was cut').toHaveText('… cut after 4 KB');
    await page.mouse.move(1, 300);
    await page.screenshot({ path: test.info().outputPath('tools-open-light.png') });
    await core.send(prefs('dark') as never);
    await page.waitForTimeout(300);
    await page.screenshot({ path: test.info().outputPath('tools-open-dark.png') });
    await line(4).click();
    await expect(page.getByTestId('thread.tool.4.open')).toHaveCount(0);
    // ⌘E (the TUI's ctrl+o): every call with code or output opens
    await page.getByTestId('thread.screen').click({ position: { x: 5, y: 200 } });
    await page.keyboard.press('Meta+E');
    await expect(page.getByTestId('thread.tool.3.open')).toContainText('test result: ok. 12 passed');
    await expect(page.getByTestId('thread.tool.4.open')).toBeVisible();
  } finally {
    await s.close();
    core.dispose();
  }
});
