// The busy-loop guard of the unit tests (gate-reds, review-gates m_33209): vitest's worker reads
// its RPC replies only between macrotasks, and a test that keeps the event loop busy ~60 s fails
// the whole run with 'Timeout calling onTaskUpdate', every test green, on a loaded machine (-43's
// and -44's gates: lying.test.ts, then cozy.test.ts). A test busy more than BUSY_MAX_MS without a
// macrotask fails here, by its name, on any machine, before it reaches a gate. Its fix: one
// `await new Promise((done) => { setTimeout(done, 0); })` per stage of its loop (lying, cozy).
// src/test-setup.ts runs it around every test; the pure part is here, with its test.
import { setInterval as realInterval } from 'node:timers';

/** the longest stretch a test may run without a macrotask: a third of the RPC's 60 s */
export const BUSY_MAX_MS = 20_000;

/** the failure for a test whose longest busy stretch was `busyMs`, or null */
export function busyFault(name: string, busyMs: number, max = BUSY_MAX_MS): string | null {
  if (busyMs <= max) return null;
  return `'${name}' kept the event loop busy ${(busyMs / 1000).toFixed(1)} s without a macrotask (at most ${String(max / 1000)} s): ` +
    "vitest's worker RPC times out at 60 s on a loaded machine ('Timeout calling onTaskUpdate'). " +
    'Yield once per stage of its loop: await new Promise((done) => { setTimeout(done, 0); }) (src/test-busy.ts)';
}

/** A clock of the process (not Date or performance: a test's fake timers replace those) and a
 *  real 250 ms tick (node's, not the window's or a fake one) that notes the longest gap. */
export function busyWatch(): { reset: () => void; worst: () => number } {
  const hr = process.hrtime.bigint.bind(process.hrtime);
  const now = (): number => Number(hr()) / 1e6;
  let last = now();
  let worst = 0;
  realInterval(() => {
    const t = now();
    worst = Math.max(worst, t - last);
    last = t;
  }, 250).unref();
  return {
    reset: () => { last = now(); worst = 0; },
    worst: () => Math.max(worst, now() - last),
  };
}
