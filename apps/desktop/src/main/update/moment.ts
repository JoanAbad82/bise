// When a downloaded, checked update installs by itself (desktop-dist v7, his
// pick: at quit, at a quiet moment, or on his click; architect m_25198), the
// pure part. The shell (run.ts) gathers the facts each tick while an update
// is ready; here, whether this tick is a quiet moment, and if not, why (a
// test-mode line says it).
//
// A quiet moment: he is away from bise (no bise window in front for
// AWAY_MS) or away from the Mac (no key or mouse for IDLE_S), and nothing of
// his is in flight: no open panel (a folder or file pick), no dictation or
// voice mode, no agent driving his apps or browser (computer use), no
// message being sent. Typing in bise is never quiet: a window in front and
// keys pressed.

/** No bise window in front for this long: he is elsewhere. */
export const AWAY_MS = 5 * 60_000;
/** No key or mouse on the Mac for this long: he is away. */
export const IDLE_S = 10 * 60;
/** How often a ready update looks for a quiet moment. */
export const TICK_MS = 30_000;

export interface MomentFacts {
  /** ms since a bise window was last in front (0: one is now) */
  readonly sinceFrontMs: number;
  /** seconds since his last key or mouse move, Mac-wide */
  readonly idleS: number;
  /** a panel is open (window.bise.pickFolder / pickFiles) */
  readonly picker: boolean;
  /** a dictation or voice mode holds the mic */
  readonly mic: boolean;
  /** an agent drives one of his apps, or waits for him to hand it back */
  readonly driving: boolean;
  /** a window has a message on its way (the store's pending rows) */
  readonly sending: boolean;
}

/** Why a tick isn't a quiet moment. */
export type Busy = 'picker' | 'mic' | 'driving' | 'sending' | 'in_use';

/** Whether this tick may install: null yes, else why not. Pure. */
export function notQuiet(f: MomentFacts): Busy | null {
  if (f.picker) return 'picker';
  if (f.mic) return 'mic';
  if (f.driving) return 'driving';
  if (f.sending) return 'sending';
  const away = f.sinceFrontMs >= AWAY_MS || f.idleS >= IDLE_S;
  return away ? null : 'in_use';
}

/** The computer-use rows (core `computer_live` items): any agent driving, or paused while he took over. */
export function drivingOf(items: ReadonlyArray<{ readonly kind?: unknown }>): boolean {
  return items.some((i) => i.kind === 'driving' || i.kind === 'paused');
}

/** A test-mode idle file's seconds (BISE_DESKTOP_TEST_IDLE_FILE): a number, else 0 (never idle). */
export function idleOfText(text: string | null): number {
  const n = Number((text ?? '').trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** `p` within `ms`, else on (the quit goes on without it: a quit never hangs on an update). */
export async function bounded(p: Promise<void>, ms: number): Promise<'done' | 'late'> {
  const timer: { t?: NodeJS.Timeout } = {};
  const late = new Promise<'late'>((ok) => {
    timer.t = setTimeout(() => {
      ok('late');
    }, ms);
  });
  try {
    return await Promise.race([p.then(() => 'done' as const), late]);
  } finally {
    clearTimeout(timer.t);
  }
}
