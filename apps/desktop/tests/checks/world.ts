// The new app on the REAL core and a throwaway world (qa-flows): no scripted core, no hooks.
// The world is ambient-qa's (plugins/ambient-qa/world.py): an isolated HOME under ~/.bise/gate
// with bise's home hub and 2 seeded projects, every hub on tests/fake_provider.py's scripted
// model. `realWorld()` reads it (`qa.py world state`) and brings one up when none is (it takes
// the heavy lock itself, ~1-2 min). `launchReal()` starts the built app (out/) with
// BISE_DESKTOP_BISE = the world's bise, so main's process runs `bise ambient-core` exactly as
// for him, with HOME = the world's: the core finds the world's hubs by his own rules, never his.
// `hub(project)` reads that hub straight from its socket (the effect outside the app), and
// `tui(project)` opens the terminal's own view of the same hub in a detached tmux session, the
// reference for every parity row (docs/desktop-bar.md).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { launchDesktop, type LaunchOptions, type Session } from '../harness';

const REPO = path.resolve(__dirname, '..', '..', '..', '..');
const QA = path.join(REPO, 'plugins', 'ambient-qa', 'qa.py');
const GATE = path.join(os.homedir(), '.bise', 'gate') + path.sep;

export type HubInfo = { project: string; home: boolean; ws: string; sock: string; alive: boolean };
export type World = { world: string; home: string; bise: string; hubs: HubInfo[] };

const qa = (args: string[], timeout: number): string =>
  execFileSync('python3', ['-B', QA, ...args], { cwd: REPO, encoding: 'utf8', timeout, stdio: ['ignore', 'pipe', 'pipe'] });

const parse = (out: string): World => JSON.parse(out.slice(out.indexOf('{'))) as World;

/** The world (brought up when none is). Refuses anything outside ~/.bise/gate. */
export function realWorld(): World {
  let w: World | undefined;
  try {
    w = parse(qa(['world', 'state'], 60_000));
    if (!w.hubs.every((h) => h.alive)) w = undefined;
  } catch {
    w = undefined;
  }
  w ??= parse(qa(['world', 'up', '--projects', '2'], 900_000));
  if (!path.resolve(w.home).startsWith(GATE)) throw new Error(`refused: the world's home ${w.home} is not under ~/.bise/gate`);
  if (!existsSync(w.bise)) throw new Error(`the world's bise is gone: ${w.bise}`);
  return w;
}

export const hubOf = (w: World, project: string): HubInfo => {
  const h = w.hubs.find((x) => x.project === project || (project === 'bise' && x.home));
  if (!h) throw new Error(`no project ${project} in the world (${w.hubs.map((x) => x.project).join(', ')})`);
  return h;
};

/** The world's env for any process of the test: its HOME, its run and temp folders, never his. */
export function worldEnv(w: World): Record<string, string> {
  const tmp = path.join(w.home, 'tmp');
  return {
    HOME: w.home,
    BISE_HOME_WORKSPACE: path.join(w.home, 'bise'),
    BEND_RUN_DIR: path.join(w.home, '.bise', 'run'),
    TMPDIR: tmp, TMP: tmp, TEMP: tmp,
  };
}

/** The new app on the real core of the world; workspace '' = bise's home (--home), as he starts it. */
export function launchReal(w: World, o: LaunchOptions & { workspace?: string } = {}): Promise<Session> {
  const env: Record<string, string> = {
    ...worldEnv(w),
    BISE_DESKTOP_BISE: w.bise,
    BISE_DESKTOP_WORKSPACE: o.workspace ?? '',
    ...(o.env ?? {}),
  };
  // the launcher's agent plumbing never reaches the app (its core drops it too: src/main/core/env.ts)
  for (const k of Object.keys(process.env)) if (k.startsWith('SB_') || k === 'BISE_ROLE') env[k] = '';
  return launchDesktop({ ...o, env });
}

/**
 * One hub's state, read from its socket like any client: {op: hello}, then the first state line.
 * The fields are the hub's own (agents, cards, ...): what the app's actions must change.
 */
export function hubState(sock: string, timeoutMs = 10_000): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const c = net.createConnection(sock);
    let buf = '';
    const t = setTimeout(() => { c.destroy(); reject(new Error(`no state from ${sock} in ${timeoutMs} ms`)); }, timeoutMs);
    c.on('connect', () => { c.write(JSON.stringify({ op: 'hello', client: 'qa-flows' }) + '\n'); });
    c.on('data', (d) => {
      buf += d.toString();
      for (;;) {
        const i = buf.indexOf('\n');
        if (i < 0) break;
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        try {
          const m = JSON.parse(line) as Record<string, unknown>;
          if (m['ev'] === 'state' || m['agents'] !== undefined) {
            clearTimeout(t);
            c.destroy();
            resolve((m['state'] as Record<string, unknown> | undefined) ?? m);
            return;
          }
        } catch { /* a partial or foreign line */ }
      }
    });
    c.on('error', (e) => { clearTimeout(t); reject(e); });
  });
}

/** Whether that agent's transcript in that hub holds the words: the hub really got them. */
export function transcriptHas(w: World, project: string, agent: string, words: string): boolean {
  const f = path.join(path.dirname(hubOf(w, project).sock), 'agents', agent, 'transcript.log');
  try {
    return readFileSync(f, 'utf8').includes(words);
  } catch {
    return false;
  }
}

/** The terminal on the same hub, in a detached tmux session of its own (never his tmux server). */
export type Tui = { screen: () => string; keys: (...k: string[]) => void; close: () => void };

export function tui(w: World, project: string, size = '160x50'): Tui {
  const h = hubOf(w, project);
  const sockDir = mkdtempSync(path.join(path.join(w.home, 'tmp'), 'tmux-'));
  const tsock = path.join(sockDir, 's');
  const name = `qaf${Date.now() % 1_000_000}`;
  const [cols, rows] = size.split('x');
  const env = { ...worldEnv(w), PATH: process.env['PATH'] ?? '/usr/bin:/bin', TERM: 'xterm-256color', LANG: 'en_US.UTF-8' };
  const tm = (args: string[]): string => execFileSync('tmux', ['-S', tsock, ...args], { encoding: 'utf8', env, timeout: 10_000 });
  const cmd = `cd ${JSON.stringify(h.ws)} && exec ${JSON.stringify(w.bise)}`;
  tm(['new-session', '-d', '-s', name, '-x', cols ?? '160', '-y', rows ?? '50', cmd]);
  return {
    screen: () => tm(['capture-pane', '-p', '-t', name]),
    keys: (...k) => { tm(['send-keys', '-t', name, ...k]); },
    close: () => { try { tm(['kill-server']); } catch { /* gone */ } },
  };
}
