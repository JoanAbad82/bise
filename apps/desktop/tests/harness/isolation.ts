// Every launch's own home, and the sentinel that fails a run that reaches outside it.
// Why (main m_9882): a harness run of the app inherited his REAL HOME, so the app's bise call
// started his real global hub (~/bise) through launchd at 22:33. So:
//   - testHome(): every launch gets a throwaway HOME (+ BISE_HOME inside it, TMPDIR, ~/bise),
//     made by the harness itself; harnessEnv() builds the app's whole environment from a short
//     allowlist plus that home: the caller's HOME, BISE_HOME, TMPDIR, SB_*, XDG_* never pass,
//     and a caller env that tries to set them (or a workspace outside the home) is refused;
//   - Sentinel: from launch to close it reads the process table (ps, with each process's own
//     environment, of which it keeps only HOME and BISE_HOME and never prints anything else):
//       a process of the app's tree that runs sbd or launchctl without pointing into the test
//       home, or ANY new hub (sbd) whose bise home is his real ~/.bise, is a breach: the app is
//       killed at once and the run fails;
//     at close it kills what the run left whose HOME or BISE_HOME is the test home (a hub started
//     through launchd) and removes the launchd jobs that ran them, then deletes the home.
import { execFile, execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type TestHome = { root: string; home: string; biseHome: string; tmp: string };

/** A throwaway home under /tmp (short: bise's sockets live under BISE_HOME, 104 bytes max). */
export function testHome(): TestHome {
  const root = mkdtempSync(path.join('/tmp', 'bh-'));
  const home = path.join(root, 'home');
  const biseHome = path.join(home, '.bise');
  const tmp = path.join(root, 'tmp');
  for (const d of [home, biseHome, tmp, path.join(home, 'bise')]) mkdirSync(d, { recursive: true });
  return { root, home, biseHome, tmp };
}

/** His real home, from the user database (never $HOME, which a caller can set). */
export const realHome = (): string => os.userInfo().homedir;

const KEEP = ['PATH', 'LANG', 'LC_ALL', 'LC_CTYPE', 'USER', 'LOGNAME', 'SHELL', 'TERM', '__CF_USER_TEXT_ENCODING'];
const FORBIDDEN = /^(HOME|BISE_HOME|BISE_HOME_WORKSPACE|TMPDIR|XDG_.*|SB_.*|BISE_AGENT.*|BISE_ROLE|BEND_.*|CODEX_HOME|CLAUDE_CONFIG_DIR)$/;

const inside = (p: string, dir: string): boolean => {
  const r = path.relative(dir, path.resolve(p));
  return r === '' || (!r.startsWith('..') && !path.isAbsolute(r));
};

/**
 * The app's whole environment: the allowlist, the test home, then `harness` (the harness's own
 * BISE_HARNESS_* / BISE_DESKTOP_* values) and `caller` (LaunchOptions.env). Throws on a caller key
 * that would choose a home, or a workspace outside the test home. Pure.
 */
export function harnessEnv(h: TestHome, harness: Record<string, string>, caller: Record<string, string> = {}, base: NodeJS.ProcessEnv = process.env): Record<string, string> {
  for (const [k, v] of Object.entries(caller)) {
    if (FORBIDDEN.test(k)) throw new Error(`harness: a launch can't set ${k}: every launch has its own throwaway home (main m_9882)`);
    if (k === 'BISE_DESKTOP_WORKSPACE' && v !== '' && !inside(v, h.home)) throw new Error(`harness: BISE_DESKTOP_WORKSPACE=${v} is outside the test home ${h.home}`);
  }
  const env: Record<string, string> = {};
  for (const k of KEEP) { const v = base[k]; if (v !== undefined) env[k] = v; }
  return { ...env, HOME: h.home, BISE_HOME: h.biseHome, TMPDIR: h.tmp, ...harness, ...caller };
}

/** stateDir: SB_STATE_DIR, the hub state folder a test hub (a gate's e2e) points elsewhere than ~/.bise */
type Proc = { pid: number; ppid: number; command: string; home?: string; biseHome?: string; stateDir?: string };

/** The process table with each process's HOME and BISE_HOME (ps -E); nothing else of the env is kept. */
function processes(): Promise<Proc[]> {
  return new Promise((resolve) => {
    execFile('/bin/ps', ['-axwwE', '-o', 'pid=,ppid=,command='], { maxBuffer: 64 * 1024 * 1024 }, (err, out) => {
      if (err) { resolve([]); return; }
      const procs: Proc[] = [];
      for (const line of out.split('\n')) {
        const m = /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(line);
        if (!m) continue;
        const rest = m[3] ?? '';
        const envAt = rest.search(/\s[A-Za-z_][A-Za-z0-9_]*=/);
        const command = envAt < 0 ? rest : rest.slice(0, envAt);
        const home = / HOME=(\S+)/.exec(rest)?.[1];
        const biseHome = / BISE_HOME=(\S+)/.exec(rest)?.[1];
        const stateDir = / SB_STATE_DIR=(\S+)/.exec(rest)?.[1];
        procs.push({ pid: Number(m[1]), ppid: Number(m[2]), command, ...(home ? { home } : {}), ...(biseHome ? { biseHome } : {}), ...(stateDir ? { stateDir } : {}) });
      }
      resolve(procs);
    });
  });
}

const isHub = (c: string): boolean => /(^|\/)(bise|sb)\s+sbd\b/.test(c) || /(^|\/)sbd(\s|$)/.test(c);
const isLaunchctl = (c: string): boolean => /(^|\/)launchctl(\s|$)/.test(c);

/** What breaks the isolation in one table (pure: self/isolation.spec.ts). */
export function breaches(procs: Proc[], baseline: Set<number>, appPid: number, h: TestHome, real: string): string[] {
  const parent = new Map(procs.map((p) => [p.pid, p.ppid]));
  const ours = (pid: number): boolean => {
    for (let p = pid, i = 0; p > 1 && i < 64; i++) { if (p === appPid) return true; p = parent.get(p) ?? 0; }
    return false;
  };
  const out: string[] = [];
  const realBise = path.join(real, '.bise');
  for (const p of procs) {
    if (baseline.has(p.pid)) continue;
    const hub = isHub(p.command), lctl = isLaunchctl(p.command);
    if (!hub && !lctl) continue;
    const biseHome = p.biseHome ?? (p.home ? path.join(p.home, '.bise') : undefined);
    // a gate's test hub keeps its state in SB_STATE_DIR (not his hubs) even with his HOME: not his hub
    const testState = p.stateDir !== undefined && !inside(p.stateDir, path.join(realBise, 'hubs'));
    if (hub && biseHome !== undefined && inside(biseHome, realBise) && !testState) {
      out.push(`a hub on his real bise home started during the run (pid ${p.pid}: ${p.command.slice(0, 120)})`);
      continue;
    }
    if (ours(p.pid)) {
      const pointsHome = p.command.includes(h.root) || (p.home !== undefined && inside(p.home, h.home)) || (p.biseHome !== undefined && inside(p.biseHome, h.home));
      if (!pointsHome) out.push(`the app ran ${hub ? 'sbd' : 'launchctl'} outside the test home (pid ${p.pid}: ${p.command.slice(0, 120)})`);
    }
  }
  return out;
}

/** Every process under `root` in one table. Pure. */
export function descendants(procs: Proc[], root: number): number[] {
  const kids = new Map<number, number[]>();
  for (const p of procs) kids.set(p.ppid, [...(kids.get(p.ppid) ?? []), p.pid]);
  const out: number[] = [];
  const walk = (pid: number, depth: number): void => {
    if (depth > 64) return;
    for (const k of kids.get(pid) ?? []) { out.push(k); walk(k, depth + 1); }
  };
  if (root > 1) walk(root, 0);
  return out;
}

/** Reads the process table every second from launch to close; the first breach calls onBreach. */
export class Sentinel {
  readonly breaches: string[] = [];
  private timer: NodeJS.Timeout | undefined;
  private baseline = new Set<number>();
  private appPid = -1;
  private busy = false;
  /** every pid ever seen under the app's pid: an orphan (ppid 1 once the app is gone) is still the run's */
  private readonly seen = new Set<number>();

  constructor(private readonly h: TestHome, private readonly onBreach: (why: string) => void) {}

  async start(): Promise<void> {
    this.baseline = new Set((await processes()).map((p) => p.pid));
    this.timer = setInterval(() => { void this.scan(); }, 1000);
  }

  /** The app's pid, once launched: its tree is checked from then on. */
  follow(pid: number): void {
    this.appPid = pid;
  }

  async scan(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      const procs = await processes();
      for (const pid of descendants(procs, this.appPid)) this.seen.add(pid);
      const found = breaches(procs, this.baseline, this.appPid, this.h, realHome());
      const fresh = found.filter((b) => !this.breaches.includes(b));
      if (fresh.length && !this.breaches.length) this.onBreach(fresh.join('; '));
      this.breaches.push(...fresh);
    } finally {
      this.busy = false;
    }
  }

  /**
   * Every process ever seen under the app's pid (its core, helper, their children), scans and a fresh
   * table: still right after the app is gone (its orphans have ppid 1 by then).
   */
  async tree(): Promise<number[]> {
    for (const pid of descendants(await processes(), this.appPid)) this.seen.add(pid);
    return [...this.seen];
  }

  /**
   * Last scan, then kills what the run left: the app's tree as read before it was killed (`tree`),
   * and anything whose HOME or BISE_HOME is the test home (a hub started through launchd), removing
   * the launchd jobs that ran them. Returns what was left in the test home.
   */
  async stop(tree: number[] = []): Promise<string[]> {
    if (this.timer) clearInterval(this.timer);
    await this.scan();
    // the final scan's table too: a child the periodic scans never saw (a launch under 1 s)
    for (const pid of new Set([...tree, ...(await this.tree())])) { try { process.kill(pid, 'SIGKILL'); } catch { /* gone */ } }
    const left = (await processes()).filter((p) =>
      p.pid !== process.pid && ((p.home !== undefined && inside(p.home, this.h.home)) || (p.biseHome !== undefined && inside(p.biseHome, this.h.home))));
    const cleaned: string[] = [];
    if (left.length) {
      const pids = new Set(left.map((p) => p.pid));
      let jobs = '';
      try { jobs = execFileSync('/bin/launchctl', ['list']).toString(); } catch { /* none */ }
      for (const line of jobs.split('\n')) {
        const [pid, , label] = line.trim().split(/\s+/);
        if (label && pids.has(Number(pid))) {
          try { execFileSync('/bin/launchctl', ['remove', label]); cleaned.push(`launchd job ${label}`); } catch { /* gone */ }
        }
      }
      for (const p of left) {
        try { process.kill(p.pid, 'SIGKILL'); cleaned.push(`pid ${p.pid}`); } catch { /* gone */ }
      }
    }
    rmSync(this.h.root, { recursive: true, force: true });
    return cleaned;
  }
}
