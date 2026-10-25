#!/usr/bin/env node
// `pnpm test:land`: the harness checks every apps/desktop land runs, after `pnpm check`
// (ambient-lead m_12443: the rule is in .agents/skills/bise-implement/SKILL.md). A fixed list,
// off-screen like every harness run, one app at a time, in one heavy slot (~/.bise/run/heavy-run:
// the first free of heavy.lock / heavy2.lock, nice 10; none taken again when already in one). Each check takes under 30 s; the set,
// under 3 min. Needs `pnpm build` first (pnpm check builds).
//   node tests/harness/land.mts [--list]   (pnpm test:land: it sets NODE_OPTIONS for type stripping)
import { spawnSync } from 'node:child_process';
import { heavyArgv } from './heavy.mts';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LAND = [
  'checks/app/keep-all.spec.ts',
  // the real pages server's CSP in the artifact view (ambient-lead m_20610, architect m_20628)
  'checks/artifacts/frame-csp.spec.ts',
  // an app from the DMG or Downloads asks once to move to Applications; 'Not now' is kept for its
  // build; settings › update moves it (apple-signing ag-move; the alert and the move stubbed)
  'checks/native/move-apps.spec.ts',
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
function redChecks(file: string): string[] {
  // Playwright's JSON report: the fields this walk reads
  type Suite = { file?: string; specs?: { file?: string; tests?: { status: string }[] }[]; suites?: Suite[] };
  let data: { suites?: Suite[] };
  try {
    data = JSON.parse(readFileSync(file, 'utf8')) as { suites?: Suite[] };
  } catch {
    return [];
  }
  const red = new Set<string>();
  const walk = (suite: Suite) => {
    for (const spec of suite.specs ?? []) {
      const bad = (spec.tests ?? []).some((t) => !['expected', 'skipped', 'flaky'].includes(t.status));
      if (bad) red.add(path.basename(spec.file ?? suite.file ?? '').replace(/\.spec\.ts$/, ''));
    }
    for (const s of suite.suites ?? []) walk(s);
  };
  for (const s of data.suites ?? []) walk(s);
  return [...red].filter(Boolean);
}
