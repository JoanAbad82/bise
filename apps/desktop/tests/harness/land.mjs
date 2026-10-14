#!/usr/bin/env node
// `pnpm test:land`: the harness checks every apps/desktop land runs, after `pnpm check`
// (ambient-lead m_12443: the rule is in .agents/skills/bise-implement/SKILL.md). A fixed list,
// off-screen like every harness run, one app at a time, in one heavy slot (~/.bise/run/heavy-run:
// the first free of heavy.lock / heavy2.lock, nice 10; none taken again when already in one). Each check takes under 30 s; the set,
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
  // every list page walks with the TUI's list keys (ambient-lead m_22338)
  'checks/app/list-walk.spec.ts',
  // answering (inbox-fix, architect m_23524): a refused answer or close shows that card again with
  // the words, a taken one stays out across a reload and a switch, '✓ you answered' where he is
  'checks/inbox/answer-refused.spec.ts',
  'checks/inbox/block-views.spec.ts',
  // ghost-badge: a card the hub keeps after his answer is back in the block, the sidebar's count is
  // the block's; '/inbox' opens the item, or says nothing waits
  'checks/inbox/ghost-badge.spec.ts',
  'checks/thread/reading.spec.ts',
  'checks/thread/streaming.spec.ts',
  'checks/thread/esc-order.spec.ts',
  'checks/thread/first-run.spec.ts',
  'checks/composer/at-files.spec.ts',
  // any file a chip like an image's, in place in the parts, the bubble opens it (file-chips)
  'checks/thread/file-chips.spec.ts',
  'checks/spotlight/streaming.spec.ts',
  // the real pages server's CSP in the artifact view (ambient-lead m_20610, architect m_20628)
  'checks/artifacts/frame-csp.spec.ts',
  // an html artifact its script builds shows whole, follows a new version and a reopen; '↗ browser'
  // opens the hub's page (art-viewer, architect m_25527)
  'checks/artifacts/script-page.spec.ts',
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
const [bin, args] = heavyArgv([playwright, 'test', '-c', path.join(here, 'playwright.config.ts'), ...LAND.map((f) => path.join('tests', f))]);
const r = spawnSync(bin, args, { cwd: desktop, stdio: 'inherit', env: process.env });
console.log(`test:land: ${r.status === 0 ? 'green' : 'RED'} (${LAND.length} checks, ${Math.round((Date.now() - t0) / 1000)} s with the lock wait)`);
process.exit(r.status ?? 1);
