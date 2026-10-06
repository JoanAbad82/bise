// How the core is started (pure), as the Swift app does (apps/ambient/mac
// Core.swift, Support.swift CoreEnv/BisePick/Backoff): `<bise> ambient-core
// --workspace <ws>`, or `--home` with no workspace; never PATH's `bise`
// (a path or nothing: lead m_8079); the env without the launcher's agent
// plumbing; a restart backoff that resets after a healthy run.

/** Where main reads its config (set by the launcher, or the harness in test mode). */
export const BISE_ENV = 'BISE_DESKTOP_BISE';
export const WORKSPACE_ENV = 'BISE_DESKTOP_WORKSPACE';

export interface CoreConfig {
  /** the bise binary: an absolute path, never a bare name looked up on PATH */
  readonly bise: string;
  /** the workspace folder; '' = bise's home workspace (--home) */
  readonly workspace: string;
}

/** The config from main's env; null when no usable bise path was given. */
export function configOf(env: Readonly<Record<string, string | undefined>>): CoreConfig | null {
  const bise = env[BISE_ENV] ?? '';
  if (!bise.includes('/')) return null;
  return { bise, workspace: env[WORKSPACE_ENV] ?? '' };
}

export function coreArgs(workspace: string): string[] {
  return workspace === '' ? ['ambient-core', '--home'] : ['ambient-core', '--workspace', workspace];
}

/** A variable of the launcher's that the core must never inherit (Support.swift CoreEnv.dropped). */
export function dropped(k: string): boolean {
  if (k.startsWith('SB_') || k.startsWith('BISE_AGENT') || k.startsWith('GHOSTTY_')) return true;
  if (k === 'BISE_ROLE' || k === 'BEND_STDIN') return true;
  if (k.startsWith('BEND_') && k.endsWith('SOCKET')) return true;
  if (k === 'TERM' || k === 'TERM_PROGRAM' || k === 'TERM_PROGRAM_VERSION') return true;
  // the app's own config and Electron's: not the core's
  if (k.startsWith('BISE_DESKTOP_') || k.startsWith('ELECTRON_')) return true;
  return false;
}

export function coreEnv(base: Readonly<Record<string, string | undefined>>): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(base)) {
    if (v !== undefined && !dropped(k)) env[k] = v;
  }
  return env;
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
