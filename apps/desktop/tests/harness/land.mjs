#!/usr/bin/env node
// `pnpm test:land`: the harness checks every apps/desktop land runs, after `pnpm check`
// (ambient-lead m_12443: the rule is in .agents/skills/bise-implement/SKILL.md). A fixed list,
// off-screen like every harness run, one app at a time, under the heavy lock
// (/usr/bin/lockf -k ~/.bise/run/heavy.lock nice -n 10). Each check takes under 30 s; the set,
// under 3 min. Needs `pnpm build` first (pnpm check builds).
//   node tests/harness/land.mjs [--list]
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LAND = [
  'checks/app/keep.spec.ts',
  'checks/app/keep-all.spec.ts',
  'checks/app/sidebar-v6.spec.ts',
  'checks/app/core-line.spec.ts',
  'checks/thread/reading.spec.ts',
  'checks/thread/streaming.spec.ts',
  'checks/thread/esc-order.spec.ts',
  'checks/thread/first-run.spec.ts',
  'checks/composer/at-files.spec.ts',
  'checks/spotlight/streaming.spec.ts',
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
const lock = path.join(os.homedir(), '.bise', 'run', 'heavy.lock');
mkdirSync(path.dirname(lock), { recursive: true });
const playwright = path.join(desktop, 'node_modules', '.bin', 'playwright');
const t0 = Date.now();
const r = spawnSync('/usr/bin/lockf', ['-k', lock, 'nice', '-n', '10', playwright, 'test', '-c', path.join(here, 'playwright.config.ts'),
  ...LAND.map((f) => path.join('tests', f))], { cwd: desktop, stdio: 'inherit', env: process.env });
console.log(`test:land: ${r.status === 0 ? 'green' : 'RED'} (${LAND.length} checks, ${Math.round((Date.now() - t0) / 1000)} s with the lock wait)`);
process.exit(r.status ?? 1);
