// One heavy job on this Mac (main m_13151, ambient-lead m_13161): the argv that runs a command in a
// heavy slot (~/.bise/run/heavy-run, the first free of two), shared by test:land (land.mts) and the
// coverage-map run (coverage/covmap.mts).
import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const run = path.join(os.homedir(), '.bise', 'run');

/** A heavy-run slot's lock file: heavy.lock, heavy2.lock, and on AC power heavy3/heavy4 (since
 *  2026-10-18; only the first two here made a test:land in slot 3 or 4 take a second slot and
 *  deadlock against a --alone job, 40 min on 10-19, pr20). */
const SLOT_LOCK = /\/\.bise\/run\/heavy[234]?\.lock\b/;

/** True when this process runs under a `lockf … heavy[234]?.lock` of its own ancestry (a
 * heavy-run around `pnpm test:land`): taking a slot again would hold both, or wait on itself. */
export function underHeavySlot(env = process.env) {
  // heavy-run's own rule (it refuses a nested call): the job pid of its HEAVY_SLOT="<slot> <pid>"
  // among this process's ancestors
  const tail = (env.HEAVY_SLOT ?? '').split(' ').pop() ?? '';
  const job = /^\d+$/.test(tail) ? Number(tail) : null;
  let pid = process.pid;
  for (let i = 0; i < 32 && pid > 1; i++) {
    if (pid === job) return true;
    const r = spawnSync('ps', ['-o', 'ppid=,command=', '-p', String(pid)], { encoding: 'utf8' });
    const line = (r.stdout || '').trim();
    if (!line) return false;
    const [ppid, ...rest] = line.split(/\s+/);
    const cmd = rest.join(' ');
    if ((cmd.split(' ')[0] ?? '').endsWith('lockf') && SLOT_LOCK.test(cmd)) return true;
    pid = Number(ppid) || 0;
  }
  return false;
}

/** One heavy job (main m_13151, ambient-lead m_13161): already in a slot, nice 10 alone (never a
 * second slot, never nested); else through ~/.bise/run/heavy-run (its first free slot of two);
 * else, without heavy-run, the old single lock. */
export function heavyArgv(cmd: string[]): [string, string[]] {
  mkdirSync(run, { recursive: true });
  if (underHeavySlot()) return ['nice', ['-n', '10', ...cmd]];
  const heavyRun = path.join(run, 'heavy-run');
  if (spawnSync('test', ['-x', heavyRun]).status === 0) return [heavyRun, cmd];
  return ['/usr/bin/lockf', ['-k', path.join(run, 'heavy.lock'), 'nice', '-n', '10', ...cmd]];
}

