// The busy-loop guard of the unit tests (gate-reds, review-gates m_33209, m_33544): vitest's worker
// reads its RPC replies only between macrotasks, and a test that keeps the event loop busy ~60 s
// fails the whole run with 'Timeout calling onTaskUpdate', every test green, on a loaded machine
// (-43's and -44's gates: lying.test.ts, then cozy.test.ts). A test that burns more than
// BUSY_CPU_MAX_MS of CPU without a macrotask fails here, by its name, on any machine, before it
// reaches a gate. CPU, not wall time: on a loaded gate an 8 s stretch can take 30 s of wall time,
// and that test is fine alone; the CPU it burns is the same on every machine. Its fix: one
// `await new Promise((done) => { setTimeout(done, 0); })` per stage of its loop (lying, cozy).
// src/test-setup.ts runs it around every test; the pure part is here, with its test.
import { setInterval as realInterval } from 'node:timers';

/** the most CPU a test may burn without a macrotask: at load ~5 that is the RPC's 60 s of wall time */
export const BUSY_CPU_MAX_MS = 10_000;

/** a stretch without a macrotask: the CPU it burnt (user + sys) and the wall time it took */
export interface Stretch {
  readonly cpuMs: number;
  readonly wallMs: number;
}

/** the failure for a test whose busiest stretch was `s`, or null */
export function busyFault(name: string, s: Stretch, max = BUSY_CPU_MAX_MS): string | null {
  if (s.cpuMs <= max) return null;
  return `'${name}' burnt ${(s.cpuMs / 1000).toFixed(1)} s of CPU without a macrotask (${(s.wallMs / 1000).toFixed(1)} s of wall time; ` +
    `at most ${String(max / 1000)} s of CPU): vitest's worker RPC times out at 60 s on a loaded machine ('Timeout calling onTaskUpdate'). ` +
    'Yield once per stage of its loop: await new Promise((done) => { setTimeout(done, 0); }) (src/test-busy.ts)';
}

/** the process's clocks: hrtime and cpuUsage, taken at load (a test's fake timers replace Date,
 *  performance and process.hrtime; these keep the real ones) */
const hr = process.hrtime.bigint.bind(process.hrtime);
const usage = process.cpuUsage.bind(process);
const wallNow = (): number => Number(hr()) / 1e6;
const cpuNow = (): number => { const u = usage(); return (u.user + u.system) / 1000; };

/** A real 50 ms tick (node's, not the window's or a fake one) that notes, between two ticks (two
 *  macrotasks), the CPU burnt and the wall time: worst() is the stretch that burnt the most CPU. */
export function busyWatch(): { reset: () => void; worst: () => Stretch } {
  let wall = wallNow();
  let cpu = cpuNow();
  let worst: Stretch = { cpuMs: 0, wallMs: 0 };
  const note = (): Stretch => {
    const s = { cpuMs: cpuNow() - cpu, wallMs: wallNow() - wall };
    return s.cpuMs > worst.cpuMs ? s : worst;
  };
  realInterval(() => {
    worst = note();
    wall = wallNow();
    cpu = cpuNow();
  }, 50).unref();
  return {
    reset: () => { wall = wallNow(); cpu = cpuNow(); worst = { cpuMs: 0, wallMs: 0 }; },
    worst: note,
  };
}
