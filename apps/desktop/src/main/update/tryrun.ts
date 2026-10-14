// The try app's swap to the staged gated build, the shell (ambient-lead
// m_22832; what and why: tryswap.ts). Owner: amb-mac.
//
// window.bise.app.update(): this bundle's own build (its runtime VERSION),
// then the try checkout's scripts/desktop_try_swap.py 'state' answers.
// window.bise.app.swap(route): the state again (refused with its words unless
// 'staged'), the route written where the next start reads it (run.ts
// takeRoute), the swap script spawned on its own (detached: it outlives
// this app), then, ~1 s later (the row says 'restarting on …', designer's
// app-swap v2), the app quits as on ⌘Q: the window keeps its frame on
// 'close', the renderer flushes its keep on beforeunload, the core stops; the
// script waits for this pid, then quits what is left of the bundle by pid,
// swaps and opens the staged build, or reopens this one when the swap didn't
// go (the reopened app's state says 'failed'). Its words:
// <build>/desktop-try/restart.log, which window.bise.app.restartLog() reads
// at the path the state names.
//
// Test mode: never a script, never a quit. update() answers
// BISE_DESKTOP_TEST_APP_UPDATE's JSON; swap() prints `APP_SWAP_LINE <route>`;
// restartLog() answers BISE_DESKTOP_TEST_RESTART_LOG.
import { execFile, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { app, ipcMain } from 'electron';
import { APP_SWAP_LINE, IPC, TEST_APP_UPDATE_ENV, TEST_RESTART_LOG_ENV, type AppNone, type AppRefusal, type AppSwapResult, type AppUpdate, type CrashReport } from '../../shared/api';
import { firstLine, parseState, refusalWords, swapEnv, swapRefusal, tryBundle, versionCommit } from './tryswap';

export interface TrySwapDeps {
  readonly testMode: boolean;
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly execPath: string;
  readonly packaged: boolean;
  /** his home from the user database (os.userInfo().homedir): HOME can't fake it */
  readonly realHome: string;
  /** where run.ts takeRoute reads route.json at the next start */
  readonly updatesDir: string;
}

type Script = { readonly bundle: string; readonly script: string; readonly env: Record<string, string> };
type Where = Script | { readonly none: AppNone };

function where(d: TrySwapDeps): Where {
  // a test home first: an agent testing a candidate sees why (never his app)
  const e = swapEnv(d.env, d.realHome);
  if ('none' in e) return e;
  const t = d.packaged ? tryBundle(d.execPath) : null;
  if (t === null) return { none: 'not_try' };
  if (!existsSync(t.script)) return { none: 'old_checkout' };
  return { ...t, env: e.env };
}

function readLive(): string | null {
  try {
    return versionCommit(readFileSync(join(process.resourcesPath, 'bin', 'VERSION'), 'utf8'));
  } catch {
    return null;
  }
}

function runState(w: Script): Promise<string> {
  return new Promise((done) => {
    execFile('/usr/bin/env', ['python3', '-B', w.script, 'state', w.bundle], { env: w.env, timeout: 15_000 }, (err, out, errOut) => {
      done(err === null ? out : (errOut || err.message).trim().slice(-300));
    });
  });
}

const noneOf = (live: string | null, none: AppNone, line: string | null): AppUpdate => ({
  state: 'none',
  live,
  staged: null,
  why: refusalWords(none, line),
  none,
  failed: null,
});

/** The state, with restart.log's path the script names (none in a test or a refusal). */
async function stateOf(d: TrySwapDeps): Promise<{ readonly u: AppUpdate; readonly log: string | null; readonly line: string | null }> {
  if (d.testMode) {
    return { u: parseState(d.env[TEST_APP_UPDATE_ENV] ?? '') ?? noneOf(null, 'not_try', null), log: null, line: null };
  }
  const live = readLive();
  const w = where(d);
  if ('none' in w) return { u: noneOf(live, w.none, null), log: null, line: null };
  const out = await runState(w);
  const u = parseState(out);
  if (u === null) {
    const line = firstLine(out) || 'no answer';
    return { u: noneOf(live, 'unreadable', line), log: null, line };
  }
  return { u, log: logPath(out), line: null };
}

function logPath(out: string): string | null {
  try {
    const v = (JSON.parse(out.trim()) as { log?: unknown }).log;
    return typeof v === 'string' && v.startsWith('/') ? v : null;
  } catch {
    return null;
  }
}

async function update(d: TrySwapDeps): Promise<AppUpdate> {
  return (await stateOf(d)).u;
}

/** The last swap's restart.log, its last 400 lines (the newest swap at the end). */
async function restartLog(d: TrySwapDeps): Promise<CrashReport | null> {
  if (d.testMode) {
    const text = d.env[TEST_RESTART_LOG_ENV];
    return text === undefined ? null : { path: '/test/desktop-try/restart.log', text };
  }
  const { log } = await stateOf(d);
  if (log === null) return null;
  try {
    const text = await readFile(log, 'utf8');
    return { path: log, text: text.split('\n').slice(-400).join('\n') };
  } catch {
    return null;
  }
}

function spawnSwap(w: Script): Promise<string | null> {
  return new Promise((done) => {
    const child = spawn('/usr/bin/env', ['python3', '-B', w.script, 'swap', w.bundle, String(process.pid)], {
      env: w.env,
      detached: true,
      stdio: 'ignore',
    });
    child.once('error', (e) => {
      done(firstLine(e.message) || 'no answer');
    });
    child.once('spawn', () => {
      child.unref();
      done(null);
    });
  });
}

/** How long the row says 'restarting on …' before the app quits (designer's app-swap v2: ~1 s). */
export const QUIT_AFTER_MS = 1000;

const refused = (r: AppRefusal, line: string | null): AppSwapResult => ({ ok: false, refused: r, why: refusalWords(r, line) });

async function swap(d: TrySwapDeps, route: string | null): Promise<AppSwapResult> {
  const { u, line } = await stateOf(d);
  const no = swapRefusal(u);
  if (no !== null) return refused(no, line);
  if (route !== null) {
    await mkdir(d.updatesDir, { recursive: true });
    await writeFile(join(d.updatesDir, 'route.json'), JSON.stringify({ route }));
  }
  if (d.testMode) {
    process.stdout.write(`${APP_SWAP_LINE} ${route ?? ''}\n`);
    return { ok: true };
  }
  const w = where(d);
  if ('none' in w) return refused(w.none, null);
  const failed = await spawnSwap(w);
  if (failed !== null) return refused('not_started', failed);
  // the reply first, then the quit (keeps and frame saved on the way out)
  setTimeout(() => {
    app.quit();
  }, QUIT_AFTER_MS);
  return { ok: true };
}

/** Answers window.bise.app.update, .swap and .restartLog. */
export function installTrySwapIpc(d: TrySwapDeps): void {
  ipcMain.handle(IPC.appUpdate, () => update(d));
  ipcMain.handle(IPC.appSwap, (_e, route: unknown) => swap(d, typeof route === 'string' && route !== '' ? route : null));
  ipcMain.handle(IPC.appRestartLog, () => restartLog(d));
}
