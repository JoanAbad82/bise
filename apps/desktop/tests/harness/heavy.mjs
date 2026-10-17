// One heavy job on this Mac (main m_13151, ambient-lead m_13161): the argv that runs a command in a
// heavy slot (~/.bise/run/heavy-run, the first free of two), shared by test:land (land.mjs) and the
// coverage-map run (coverage/covmap.mjs).
import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const run = path.join(os.homedir(), '.bise', 'run');

/** True when this process runs under a `lockf … heavy.lock|heavy2.lock` of its own ancestry (a
 * heavy-run around `pnpm test:land`): taking a slot again would hold both, or wait on itself. */
export function underHeavySlot() {
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
export function heavyArgv(cmd) {
  mkdirSync(run, { recursive: true });
  if (underHeavySlot()) return ['nice', ['-n', '10', ...cmd]];
  const heavyRun = path.join(run, 'heavy-run');
  if (spawnSync('test', ['-x', heavyRun]).status === 0) return [heavyRun, cmd];
  return ['/usr/bin/lockf', ['-k', path.join(run, 'heavy.lock'), 'nice', '-n', '10', ...cmd]];
}

