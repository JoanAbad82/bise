// How the core is started (pure), as the Swift app did (its
// Core.swift, Support.swift CoreEnv/BisePick/Backoff): `<bise> ambient-core
// --workspace <ws>`, or `--home` with no workspace; never PATH's `bise`
// (a path or nothing: lead m_8079); a restart backoff that resets after a
// healthy run. Its environment is ../childenv.ts's, shared with `bise pty`.
import { join } from 'node:path';

/**
 * The workspace the core runs on (set by the launcher, scripts/desktop.sh open, or the harness in
 * test mode); '' or unset = home. The app's own variable: only Electron reads it (never Rust), so
 * it isn't in bise_home::env::VARS (architect m_12200).
 */
export const WORKSPACE_ENV = 'BISE_DESKTOP_WORKSPACE';

export interface CoreConfig {
  /** the bise binary: an absolute path, never a bare name looked up on PATH */
  readonly bise: string;
  /** the workspace folder; '' = bise's home workspace (--home) */
  readonly workspace: string;
}

/**
 * The config from the bise path (src/main/paths.ts binPath: shipped, BISE_DESKTOP_BISE,
 * or the repo's build) and main's env; null when there is no usable bise path.
 */
export function configOf(bise: string | null, env: Readonly<Record<string, string | undefined>>): CoreConfig | null {
  if (bise === null || !bise.includes('/')) return null;
  return { bise, workspace: env[WORKSPACE_ENV] ?? '' };
}

/**
 * The core's stderr file: core.log in the app's userData as it is once the app has set it (a
 * stand-in's, userdata.ts, or Electron's own), read at the core's start, never captured before
 * (ambient-lead m_19260). The app logs this path once at start.
 */
export function coreLogOf(userData: string): string {
  return join(userData, 'core.log');
}

/**
 * `offscreen`: an off-screen run (offscreen.ts noAsks): the core never opens his mic, it decides
 * fake voice or none and answers each mic command itself (architect m_22483).
 */
export function coreArgs(workspace: string, offscreen = false): string[] {
  const at = workspace === '' ? ['--home'] : ['--workspace', workspace];
  return ['ambient-core', ...at, ...(offscreen ? ['--offscreen'] : [])];
}

/** The restart delay (seconds): 0.5 doubling to 30, back to 0.5 after a run of 60 s or more. */
export class Backoff {
  static readonly first = 0.5;
  static readonly max = 30;
  static readonly healthy = 60;
  private next = Backoff.first;

  after(livedS: number): number {
    if (livedS >= Backoff.healthy) this.next = Backoff.first;
    const wait = this.next;
    this.next = Math.min(this.next * 2, Backoff.max);
    return wait;
  }

  reset(): void {
    this.next = Backoff.first;
  }
}
