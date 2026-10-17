#!/usr/bin/env node
// `pnpm test:land`: the harness checks every apps/desktop land runs, after `pnpm check`
// (ambient-lead m_12443: the rule is in .agents/skills/bise-implement/SKILL.md). A fixed list,
// off-screen like every harness run, one app at a time, in one heavy slot (~/.bise/run/heavy-run:
// the first free of heavy.lock / heavy2.lock, nice 10; none taken again when already in one). Each check takes under 30 s; the set,
// under 3 min. Needs `pnpm build` first (pnpm check builds).
//   node tests/harness/land.mjs [--list]
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LAND = [
  'checks/app/keep.spec.ts',
  'checks/app/keep-all.spec.ts',
  'checks/app/sidebar-v6.spec.ts',
  'checks/app/core-line.spec.ts',
  // every list page walks with the TUI's list keys (ambient-lead m_22338)
  'checks/app/list-walk.spec.ts',
  // every menu is the ds Picker: ≤ 50vh, inside the window, its caret centered (menus-ds, his m_26194)
  'checks/app/menus.spec.ts',
  // no menu trigger crops a descender, a squeezed one ends in '…' (trigger-crop, his 'opus 5.5 high')
  'checks/app/trigger-ink.spec.ts',
  // the right bar's heads: no part meets another, the scope words on their own line (bar-heads, his m_26417)
  'checks/app/bar-heads.spec.ts',
  // the right bar never scrolls sideways: focused, hovered, ⌥ held, scoped at 0 rows (bar-overflow, his m_26733)
  'checks/app/bar-overflow.spec.ts',
  // the context dial after Codex's: 2 px track and arc, round caps inside 0..pct, ink from 70 %, no hue (ring-look)
  'checks/app/ring-look.spec.ts',
  // 'show 50 more' opens 50 at a time, 'show less' back to the cap, kept per section and scope (bar-more, his m_26894)
  'checks/app/bar-more.spec.ts',
  // main first in AGENTS as 'bise', out of the count, its click opens its thread, its hover lights its bim (bar-main, his m_28881)
  'checks/app/bar-main.spec.ts',
  // a project's ⋯ menu by priority: active (needs him, then at work), quiet, archived capped (his m_26450)
  'checks/app/proj-menu.spec.ts',
  // what slid over at 800 goes when the window grows past 1000: one bar, no scrim (try-gate dc4770c1)
  'checks/app/bar-slide.spec.ts',
  // a hovered row's now line slides left at once, is home within 200 ms of the leave, still under
  // reduced motion (slide-fix, his ask)
  'checks/app/row-slide.spec.ts',
  // answering (inbox-fix, architect m_23524): a refused answer or close shows that card again with
  // the words, a taken one stays out across a reload and a switch, '✓ you answered' where he is
  'checks/inbox/answer-refused.spec.ts',
  'checks/inbox/block-views.spec.ts',
  // ghost-badge: a card the hub keeps after his answer is back in the block, the sidebar's count is
  // the block's; '/inbox' opens the item, or says nothing waits
  'checks/inbox/ghost-badge.spec.ts',
  // inbox-open (his ask): ⏎ opens a past item whole in the pane beside the list, ⌘⏎ lands on his
  // answer 23 pages back in its thread (the store's window around it, the gap row loads newer)
  'checks/inbox/inbox-open.spec.ts',
  'checks/thread/reading.spec.ts',
  // a 50k-entry thread with lines appending: ⌘F counts every hit via the hub, jumps far back, the read
  // row and the current match never move, no long task while he scrolls (his m_26614, thread-perf)
  'checks/thread/history-perf.spec.ts',
  'checks/thread/streaming.spec.ts',
  'checks/thread/esc-order.spec.ts',
  'checks/thread/first-run.spec.ts',
  'checks/composer/at-files.spec.ts',
  // the @ / $ lists stay the same node, visible with rows, on every frame while he types (his flicker, at-steady)
  'checks/composer/picker-steady.spec.ts',
  'checks/composer/answer-target.spec.ts',
  // any file a chip like an image's, in place in the parts, the bubble opens it (file-chips)
  'checks/thread/file-chips.spec.ts',
  // an @-picked image or code file is a chip at the @, the caret after it, its parts in the send (at-chips)
  'checks/composer/at-chips.spec.ts',
  'checks/spotlight/streaming.spec.ts',
  // the real pages server's CSP in the artifact view (ambient-lead m_20610, architect m_20628)
  'checks/artifacts/frame-csp.spec.ts',
  // an html artifact its script builds shows whole, follows a new version and a reopen; '↗ browser'
  // opens the hub's page (art-viewer, architect m_25527)
  'checks/artifacts/script-page.spec.ts',
  // a link in the panel's artifact (html, bise page, office viewer): his browser, another artifact
  // in the panel, an anchor scrolls; the frame never leaves its artifact (art-links, architect m_26370)
  'checks/artifacts/links.spec.ts',
  // save a copy… (⤓, ⋯, ⌘S) and show in Finder: a file, an office file's older version, an archived
  // agent's gone file through bise's copy; the panel stubbed (art-save)
  'checks/artifacts/save-copy.spec.ts',
  // a bise page's frame keeps every control whole from 1400 to 320 px, the words give way first
  // (page-head, his m_26492)
  'checks/artifacts/page-head.spec.ts',
  // an app from the DMG or Downloads asks once to move to Applications; 'Not now' is kept for its
  // build; settings › update moves it (apple-signing ag-move; the alert and the move stubbed)
  'checks/native/move-apps.spec.ts',
  // les bims: the list never loads three, a still office draws nothing (~8 fps typing, 0 hidden),
  // WebGL lost shows the list under its line (bims-qa; the sizes and labels: checks/bims/office)
  'checks/bims/budget.spec.ts',
  // the live pearl draws at the display's rate seen, 0 frames blurred or hidden (pearl-idle, bims-fix m_28756)
  'checks/pearl/idle.spec.ts',
];

const here = path.dirname(fileURLToPath(import.meta.url));
const desktop = path.resolve(here, '..', '..');
if (process.argv.includes('--list')) {
  console.log(LAND.join('\n'));
  process.exit(0);
}
const missing = LAND.filter((f) => !existsSync(path.join(desktop, 'tests', f)));
if (missing.length) {
  console.error(`test:land: missing checks: ${missing.join(', ')}`);
  process.exit(2);
}
if (!existsSync(path.join(desktop, 'out', 'main', 'index.js'))) {
  console.error('test:land: no build in out/: pnpm build first (pnpm check builds)');
  process.exit(2);
}
const run = path.join(os.homedir(), '.bise', 'run');
mkdirSync(run, { recursive: true });

/** True when this process runs under a `lockf … heavy.lock|heavy2.lock` of its own ancestry (a
 * heavy-run around `pnpm test:land`): taking a slot again would hold both, or wait on itself. */
function underHeavySlot() {
  let pid = process.pid;
  for (let i = 0; i < 32 && pid > 1; i++) {
    const r = spawnSync('ps', ['-o', 'ppid=,command=', '-p', String(pid)], { encoding: 'utf8' });
    const line = (r.stdout || '').trim();
    if (!line) return false;
    const [ppid, ...rest] = line.split(/\s+/);
    const cmd = rest.join(' ');
    if (cmd.split(' ')[0].endsWith('lockf') && ['heavy.lock', 'heavy2.lock'].some((n) => cmd.includes(`/.bise/run/${n}`))) return true;
    pid = Number(ppid) || 0;
  }
  return false;
}

/** One heavy job (main m_13151, ambient-lead m_13161): already in a slot, nice 10 alone (never a
 * second slot, never nested); else through ~/.bise/run/heavy-run (its first free slot of two);
 * else, without heavy-run, the old single lock. */
function heavyArgv(cmd) {
  if (underHeavySlot()) return ['nice', ['-n', '10', ...cmd]];
  const heavyRun = path.join(run, 'heavy-run');
  if (spawnSync('test', ['-x', heavyRun]).status === 0) return [heavyRun, cmd];
  return ['/usr/bin/lockf', ['-k', path.join(run, 'heavy.lock'), 'nice', '-n', '10', ...cmd]];
}

const playwright = path.join(desktop, 'node_modules', '.bin', 'playwright');
const t0 = Date.now();
// the list on screen, a JSON report on the side: the red checks' names (issue 28)
const report = path.join(os.tmpdir(), `test-land-${process.pid}.json`);
const [bin, args] = heavyArgv([playwright, 'test', '-c', path.join(here, 'playwright.config.ts'), '--reporter=list,json', ...LAND.map((f) => path.join('tests', f))]);
const r = spawnSync(bin, args, { cwd: desktop, stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: report } });
console.log(`test:land: ${r.status === 0 ? 'green' : 'RED'} (${LAND.length} checks, ${Math.round((Date.now() - t0) / 1000)} s with the lock wait)`);
if (r.status !== 0) {
  // which reds are known (tests/known_reds.txt, their owner on it) and which are new
  const reds = redChecks(report);
  if (reds.length) spawnSync('python3', [path.resolve(desktop, '..', '..', 'tests', 'known_reds.py'), 'split', ...reds], { stdio: 'inherit' });
}
rmSync(report, { force: true });
process.exit(r.status ?? 1);

/** The red checks of a Playwright JSON report, by spec name (`history-perf` for
 * checks/app/history-perf.spec.ts): known_reds.txt's names. */
function redChecks(file) {
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
  const red = new Set();
  const walk = (suite) => {
    for (const spec of suite.specs ?? []) {
      const bad = (spec.tests ?? []).some((t) => !['expected', 'skipped', 'flaky'].includes(t.status));
      if (bad) red.add(path.basename(spec.file ?? suite.file ?? '').replace(/\.spec\.ts$/, ''));
    }
    for (const s of suite.suites ?? []) walk(s);
  };
  for (const s of data.suites ?? []) walk(s);
  return [...red].filter(Boolean);
}
