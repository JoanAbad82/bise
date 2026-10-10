// The environment of every process main starts that runs bise: the core
// (`bise ambient-core`, core/process.ts) and the terminal panel's shells
// (`bise pty`, term/host.ts). The rule is bise_home::env::env_for's, from
// its generated table (env_vars.gen.ts, pinned by a Rust test against
// env::VARS): an internal name (SB_SOCKET, BISE_OWNERS, BEND_WIRE_LOG...)
// never passes, a test name passes only in test mode (the harness configures
// its core and shells through them), every other name passes. An app
// started from an agent's shell (dev, desktop_try) so hands none of that
// agent's plumbing to its children, and `sb` typed in his terminal never acts
// as that agent (architect's merge review B2).
//
// Pure: main passes process.env and its test mode.

import { INTERNAL_VARS, TEST_VARS } from './env_vars.gen';

const INTERNAL: ReadonlySet<string> = new Set(INTERNAL_VARS);
const TEST: ReadonlySet<string> = new Set(TEST_VARS);

/**
 * Names that are not bise's (so not in env::VARS) and never go to a child:
 * the launching terminal's, the Bend runtime's per-command stdin fifo,
 * Electron's and the app's own config (BISE_DESKTOP_*, read by main only).
 */
function launchers(k: string): boolean {
  return k === 'TERM' || k === 'TERM_PROGRAM' || k === 'TERM_PROGRAM_VERSION' || k === 'BEND_STDIN' || k.startsWith('GHOSTTY_') || k.startsWith('ELECTRON_') || k.startsWith('BISE_DESKTOP_');
}

/** Whether a child started in this mode inherits `k`. */
export function inherits(k: string, testMode: boolean): boolean {
  if (INTERNAL.has(k) || launchers(k)) return false;
  return testMode || !TEST.has(k);
}

/** A child's whole environment from main's (`spawn(.., { env })`). */
export function childEnv(base: Readonly<Record<string, string | undefined>>, testMode: boolean): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(base)) {
    if (v !== undefined && inherits(k, testMode)) env[k] = v;
  }
  return env;
}
