// His login shell's environment (architect m_10428). An app opened from the
// Finder or the Dock gets launchd's environment, not what his ~/.zshrc,
// ~/.zprofile or ~/.bash_profile export: the core, every hub and REPL it
// starts, and his terminal panel's shells would miss his API keys and PATH
// entries (models not ready, tools not found) while the TUI has them. So main
// asks his shell once at start, as VS Code's shell-env does:
// `$SHELL -i -l -c '<marker>; env -0; <marker>'`, with a timeout, and puts
// what it says under process.env before the core or any shell starts (the
// window opens at once: index.ts makes only the core and the shells wait).
// bise_home::env's rules still apply on top (the core's coreEnv, `bise pty`'s
// Child::Shell). On a failure or a timeout, the current environment stays.
//
// Never in test mode: there the harness's environment (its throwaway HOME and
// BISE_TEST_HOME) is the whole truth. Never on Windows (no login shell).
import { spawn } from 'node:child_process';

/** Between these, the shell's `env -0` (an rc file may print before or after). */
export const MARK = '__BISE_LOGIN_ENV_7f3a__';

/** Variables that describe the probe's own shell, not his session: never copied. */
const PROBE_ONLY = new Set(['PWD', 'OLDPWD', 'SHLVL', '_', 'TERM', 'TERM_PROGRAM', 'TERM_PROGRAM_VERSION', 'COLUMNS', 'LINES', 'PS1', 'PS2']);

/** `env -0`'s output between the two marks, as a map; null when the marks or a sane body are missing. */
export function parseEnv0(out: string): Record<string, string> | null {
  const a = out.indexOf(MARK);
  const b = out.lastIndexOf(MARK);
  if (a < 0 || b <= a) return null;
  const body = out.slice(a + MARK.length, b);
  const env: Record<string, string> = {};
  for (const entry of body.split('\0')) {
    const i = entry.indexOf('=');
    if (i <= 0) continue;
    const k = entry.slice(0, i).replace(/^\n+/, '');
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) continue;
    env[k] = entry.slice(i + 1);
  }
  return 'PATH' in env ? env : null;
}

/**
 * What process.env becomes: the app's environment with his shell's values
 * on top (his PATH, his keys), minus the probe's own shell variables. The
 * app's own settings (BISE_DESKTOP_*, ELECTRON_*) stay the app's.
 */
export function mergeLoginEnv(current: Readonly<Record<string, string | undefined>>, shell: Readonly<Record<string, string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(current)) if (v !== undefined) out[k] = v;
  for (const [k, v] of Object.entries(shell)) {
    if (PROBE_ONLY.has(k) || k.startsWith('BISE_DESKTOP_') || k.startsWith('ELECTRON_')) continue;
    out[k] = v;
  }
  return out;
}

/** Whether this run asks his shell at all. */
export function wantsLoginEnv(platform: string, testMode: boolean, env: Readonly<Record<string, string | undefined>>): boolean {
  if (platform === 'win32' || testMode) return false;
  // under a test run's jail, whatever started it: the harness's env stays
  return (env['BISE_TEST_HOME'] ?? '') === '';
}

/** His shell: $SHELL when absolute, else /bin/zsh (macOS's default). */
export function loginShell(env: Readonly<Record<string, string | undefined>>): string {
  const s = env['SHELL'] ?? '';
  return s.startsWith('/') ? s : '/bin/zsh';
}

/**
 * Asks his login shell for its environment; null on a failure or after
 * `timeoutMs` (the shell is killed then). Never throws.
 */
export function readLoginEnv(shell: string, timeoutMs = 5000): Promise<Record<string, string> | null> {
  return new Promise((done) => {
    let out = '';
    let settled = false;
    const finish = (v: Record<string, string> | null): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      done(v);
    };
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(shell, ['-i', '-l', '-c', `printf '%s' '${MARK}'; /usr/bin/env -0; printf '%s' '${MARK}'`], {
        stdio: ['ignore', 'pipe', 'ignore'],
        detached: true,
        env: { ...process.env, BISE_LOGIN_ENV_PROBE: '1' },
      });
    } catch {
      done(null);
      return;
    }
    const timer = setTimeout(() => {
      try {
        if (child.pid !== undefined) process.kill(-child.pid, 'SIGKILL');
      } catch {
        // already gone
      }
      finish(null);
    }, timeoutMs);
    child.stdout?.setEncoding('utf8');
    child.stdout?.on('data', (s: string) => {
      out += s;
    });
    child.on('error', () => {
      finish(null);
    });
    child.on('close', () => {
      const env = parseEnv0(out);
      if (env !== null) delete env['BISE_LOGIN_ENV_PROBE'];
      finish(env);
    });
  });
}

/**
 * process.env gets his login shell's environment (when this run wants it).
 * Resolves when done, failed or timed out; says on stderr which.
 */
export async function adoptLoginEnv(platform: string, testMode: boolean): Promise<void> {
  if (!wantsLoginEnv(platform, testMode, process.env)) return;
  const shell = loginShell(process.env);
  const t0 = Date.now();
  const env = await readLoginEnv(shell);
  if (env === null) {
    process.stderr.write(`bise-desktop: login env: ${shell} gave nothing (failed or timed out) in ${String(Date.now() - t0)} ms, launchd's env stays
`);
    return;
  }
  const merged = mergeLoginEnv(process.env, env);
  for (const k of Object.keys(merged)) process.env[k] = merged[k];
  process.stderr.write(`bise-desktop: login env: ${String(Object.keys(env).length)} variables from ${shell} in ${String(Date.now() - t0)} ms
`);
}
