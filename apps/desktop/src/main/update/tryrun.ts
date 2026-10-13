// The try app's swap to the staged gated build, the shell (ambient-lead
// m_22832; what and why: tryswap.ts). Owner: amb-mac.
//
// window.bise.app.update(): this bundle's own build (its runtime VERSION),
// then the try checkout's scripts/desktop_try_swap.py 'state' answers.
// window.bise.app.swap(route): the state again (refused with its words unless
// 'staged'), the route written where the next start reads it (run.ts
// takeRoute), the swap script spawned on its own (detached: it outlives
// this app), then the app quits as on ⌘Q: the window keeps its frame on
// 'close', the renderer flushes its keep on beforeunload, the core stops; the
// script waits for this pid, then quits what is left of the bundle by pid,
// swaps and opens the staged build. Its words: <build>/desktop-try/restart.log.
//
// Test mode: never a script, never a quit. update() answers
// BISE_DESKTOP_TEST_APP_UPDATE's JSON; swap() prints `APP_SWAP_LINE <route>`.
import { execFile, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { app, ipcMain } from 'electron';
import { APP_SWAP_LINE, IPC, TEST_APP_UPDATE_ENV, type AppUpdate } from '../../shared/api';
import { parseState, swapEnv, swapRefusal, tryBundle, versionCommit } from './tryswap';

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

type Where = { readonly bundle: string; readonly script: string; readonly env: Record<string, string> } | { readonly why: string };

function where(d: TrySwapDeps): Where {
  const t = d.packaged ? tryBundle(d.execPath) : null;
  if (t === null) return { why: "this app isn't his try's bundle (bise try.app in a try checkout)" };
  if (!existsSync(t.script)) return { why: `no ${t.script} (a try checkout older than the swap): it updates at the next try` };
  const e = swapEnv(d.env, d.realHome);
  return 'why' in e ? e : { ...t, env: e.env };
}

function readLive(): string | null {
  try {
    return versionCommit(readFileSync(join(process.resourcesPath, 'bin', 'VERSION'), 'utf8'));
  } catch {
    return null;
  }
}

function runState(w: { readonly bundle: string; readonly script: string; readonly env: Record<string, string> }): Promise<string> {
  return new Promise((done) => {
    execFile('/usr/bin/env', ['python3', '-B', w.script, 'state', w.bundle], { env: w.env, timeout: 15_000 }, (err, out, errOut) => {
      done(err === null ? out : `{"error": ${JSON.stringify((errOut || err.message).trim().slice(-300))}}`);
    });
  });
}

async function update(d: TrySwapDeps): Promise<AppUpdate> {
  if (d.testMode) {
    return parseState(d.env[TEST_APP_UPDATE_ENV] ?? '') ?? { state: 'none', live: null, staged: null, why: 'test mode: no try build' };
  }
  const live = readLive();
  const w = where(d);
  if ('why' in w) return { state: 'none', live, staged: null, why: w.why };
  const out = await runState(w);
  return parseState(out) ?? { state: 'none', live, staged: null, why: `the try's state script answered nothing readable: ${out.trim().slice(-300)}` };
}

function spawnSwap(w: { readonly bundle: string; readonly script: string; readonly env: Record<string, string> }): Promise<string | null> {
  return new Promise((done) => {
    const child = spawn('/usr/bin/env', ['python3', '-B', w.script, 'swap', w.bundle, String(process.pid)], {
      env: w.env,
      detached: true,
      stdio: 'ignore',
    });
    child.once('error', (e) => {
      done(`the swap didn't start: ${e.message}`);
    });
    child.once('spawn', () => {
      child.unref();
      done(null);
    });
  });
}

async function swap(d: TrySwapDeps, route: string | null): Promise<{ ok: true } | { ok: false; why: string }> {
  const why = swapRefusal(await update(d));
  if (why !== null) return { ok: false, why };
  if (route !== null) {
    await mkdir(d.updatesDir, { recursive: true });
    await writeFile(join(d.updatesDir, 'route.json'), JSON.stringify({ route }));
  }
  if (d.testMode) {
    process.stdout.write(`${APP_SWAP_LINE} ${route ?? ''}\n`);
    return { ok: true };
  }
  const w = where(d);
  if ('why' in w) return { ok: false, why: w.why };
  const failed = await spawnSwap(w);
  if (failed !== null) return { ok: false, why: failed };
  // the reply first, then the quit (keeps and frame saved on the way out)
  setTimeout(() => {
    app.quit();
  }, 50);
  return { ok: true };
}

/** Answers window.bise.app.update and .swap. */
export function installTrySwapIpc(d: TrySwapDeps): void {
  ipcMain.handle(IPC.appUpdate, () => update(d));
  ipcMain.handle(IPC.appSwap, (_e, route: unknown) => swap(d, typeof route === 'string' && route !== '' ? route : null));
}
