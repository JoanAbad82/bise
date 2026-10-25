// running/processes · procs-polish (Gabriel: « afficher la commande en entier en wrappant et en
// highlightant en bash, dans le side panel de droite … il faut un empty state … polish la UI de
// processes »; designer m_41694). On FakeCore, light and dark at 1400, 1100 and 800: acme's agents
// left five processes (a long heavy-run command, a python http server under its full interpreter
// path, a dev server in its own worktree behind 'cd … &&', one that ended today, one that ended
// yesterday). Passes when the rows show the program by name, 'ended today' counts today only, the
// pane shows the whole command wrapped as highlighted bash, a quiet one says 'running for … ·
// nothing printed yet' where its first line will be, and its output keeps the box's size when its
// first bytes come. Shots: processes-<theme>-<width>-<out|quiet>.png for designer's sign.
// Owner: procs-polish.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { running } from '../../../src/proto/words_running.gen';

// the fixture world, onboarded (else the window opens the onboarding over the route)
const FIX = path.resolve(__dirname, '..', '..', '..', '..', '..', 'rust', 'proto', 'fixtures');
const jsonl = (f: string) => readFileSync(path.join(FIX, f), 'utf8').split(String.fromCharCode(10)).map((l) => l.trim()).filter(Boolean).map((l) => JSON.parse(l) as { ev?: string; prefs?: object });
function world(theme: string, now: number) {
  const evs = [...jsonl('core_ev.jsonl'), ...jsonl('hub_ev.jsonl')]
    .filter((e) => e.ev !== 'broken' && !(e.ev === 'processes'))
    .map((e) => (e.ev === 'prefs' ? { ...e, prefs: { ...e.prefs, onboarded: true, theme } } : e));
  return [...evs, { ev: 'processes', project: ACME, items: procs(now) }];
}

const ACME = 'acme-1a2b3c4d';
const MIN = 60_000;
const WT = '/Users/camille/.bise/worktrees/acme-1a2b3c4d';
const HEAVY = `export BEND_MEM_LIMIT_MB=16384; R=$PWD; (scripts/heavy-run --low -- cargo test -p sb-core --release -- --nocapture 2>&1 | tee ${WT}/compact-expand/tmp/heavy.log | tail -n 40) && echo "rc=$?" || echo "failed: see $R/tmp/heavy.log"`;
const PY = '/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/bin/python3 -m http.server 8765 --directory site/out';

function procs(now: number) {
  const base = { pid: 48211, cpu: 0.4, rss_mb: 38, procs: 1, out: 'bg', ports: [] as number[] };
  return [
    { ...base, id: 'bg3', agent: 'perf', kind: { is: 'bg', n: 3 }, cmd: HEAVY, cwd: `${WT}/perf/acme`, started_ms: now - 6 * MIN, state: { is: 'running' }, cpu: 312, rss_mb: 2140, procs: 9 },
    { ...base, id: 'bg5', agent: 'perf', kind: { is: 'bg', n: 5 }, cmd: `cd ${WT}/perf/acme && pnpm dev --port 5173`, cwd: `${WT}/perf/acme`, started_ms: now - 53 * MIN, state: { is: 'running' }, ports: [5173], url: 'http://127.0.0.1:5173', pid: 50112 },
    { ...base, id: 'bg1', agent: 'docs', kind: { is: 'bg', n: 1 }, cmd: PY, cwd: `${WT}/docs/acme`, started_ms: now - 23 * 60 * MIN + 10 * MIN, state: { is: 'running' }, ports: [8765], url: 'http://127.0.0.1:8765', pid: 47961 },
    { ...base, id: 'bg2', agent: 'docs', kind: { is: 'bg', n: 2 }, cmd: 'pnpm test --run docs', cwd: `${WT}/docs/acme`, started_ms: now - 30 * MIN, state: { is: 'exited', rc: 1 }, ended_ms: now - 4 * MIN, cpu: 0, rss_mb: 0 },
    { ...base, id: 'bg9', agent: 'docs', kind: { is: 'bg', n: 9 }, cmd: 'make watch', cwd: `${WT}/docs/acme`, started_ms: now - 30 * 60 * MIN, state: { is: 'exited', rc: 0 }, ended_ms: now - 26 * 60 * MIN, cpu: 0, rss_mb: 0 },
  ];
}

const LINES = [
  'bins: sb-core: compiling (sb-core ~15 s, a REPL 1-2 min, bend-jsrt 1-5 min)...',
  'bins: sb-core: built in 165 s (/Users/camille/.bise/dev/build/cache/sb-core-3f9a1c0d2e/target/release/sb-core, a path long enough to wrap at the box)',
  'running 412 tests',
  'test laws::hub::wake_once ... ok',
  'test laws::hub::queued_after_turn ... ok',
  'test result: ok. 412 passed; 0 failed; 0 ignored',
  'rc=0',
];
const b64 = (s: string) => Buffer.from(s).toString('base64');

for (const theme of ['light', 'dark'] as const) {
  test(`running/processes: the whole command as bash, the quiet state, the list (${theme})`, async () => {
    test.setTimeout(180_000);
    const core = new FakeCore(world(theme, Date.now()) as never);
    const s = await launchDesktop({ core, route: 'running' });
    try {
      const { page } = s;
      await expect(page.getByTestId('running.screen')).toBeVisible({ timeout: 15_000 });
      for (const w of [1400, 1100, 800]) {
        await s.app.evaluate(({ BrowserWindow }, width) => {
          BrowserWindow.getAllWindows().find((b) => b.webContents.getURL().includes('surface=window'))?.setContentSize(width, 860);
        }, w);
        await expect.poll(() => page.evaluate(() => window.innerWidth), { timeout: 5000 }).toBe(w);
        // the list alone (at 800 the pane replaces it)
        if (w === 800) {
          await page.waitForTimeout(300);
          await page.screenshot({ path: test.info().outputPath(`processes-${theme}-${String(w)}-list.png`) });
        }
        // 'ended today' is today only: yesterday's make watch is in neither tab
        await expect(page.getByTestId('running.filter.ended')).toHaveText(`${running.ended_today} 1`);
        // the row: the program by name, its own worktree's cd gone
        await expect(page.getByTestId(`running.row.${ACME}/docs/bg1.cmd`)).toHaveText('python3 -m http.server 8765 --directory site/out');
        await expect(page.getByTestId(`running.row.${ACME}/perf/bg5.cmd`)).toHaveText('pnpm dev --port 5173');

        // the heavy-run: the whole command wrapped as bash, its output
        await page.getByTestId(`running.row.${ACME}/perf/bg3`).click();
        await expect(page.getByTestId('running.pane.cmd')).toContainText('echo "failed: see $R/tmp/heavy.log"');
        await core.send({ ev: 'proc_out', project: ACME, agent: 'perf', id: 'bg3', at: 0, data: b64(LINES.join('\n') + '\n'), end: 0 } as never);
        await page.waitForTimeout(400);
        await page.screenshot({ path: test.info().outputPath(`processes-${theme}-${String(w)}-out.png`) });

        // the dev server has printed nothing: the quiet line, where its first line will be
        await page.keyboard.press('Escape');
        await page.getByTestId(`running.row.${ACME}/perf/bg5`).click();
        const quiet = page.getByTestId('running.out.quiet');
        await expect(quiet).toHaveText(running.quiet_running({ age: '53 min' }));
        const box = await page.getByTestId('running.out.term').boundingBox();
        // it fades in late (a quick answer never flashes it)
        await page.waitForTimeout(700);
        await page.screenshot({ path: test.info().outputPath(`processes-${theme}-${String(w)}-quiet.png`) });
        // one line: the pane's head (designer m_41800 #1 #2); no key line at the foot any more (bise
        // fait mac §6): ⌘F is the find button's tip
        const tops = await page.getByTestId('running.pane.meta').evaluate((e) => Array.from(e.children).filter((c) => (c as HTMLElement).offsetWidth > 0).map((c) => (c as HTMLElement).offsetTop));
        expect(new Set(tops).size, 'running.pane.meta on one line').toBe(1);
        await expect(page.getByTestId('running.keys')).toHaveCount(0);
        await expect(page.getByTestId('running.pane.find')).toHaveAttribute('data-tip', running.find_tip);
        // its first bytes: the quiet line goes, the box keeps its size
        await core.send({ ev: 'proc_out', project: ACME, agent: 'perf', id: 'bg5', at: 0, data: b64('  VITE v6.0.1  ready in 412 ms\n'), end: 0 } as never);
        await expect(quiet).toHaveCount(0);
        expect(await page.getByTestId('running.out.term').boundingBox()).toEqual(box);
        await page.keyboard.press('Escape');
      }
    } finally {
      await s.close();
    }
  });
}
