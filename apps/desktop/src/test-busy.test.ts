import { describe, expect, it, vi } from 'vitest';
import { BUSY_CPU_MAX_MS, busyFault, busyWatch } from './test-busy';

/** the process's CPU, user + sys, ms (the guard's clock) */
const cpu = (): number => { const u = process.cpuUsage(); return (u.user + u.system) / 1000; };
/** burn `n` ms of CPU on this thread, however loaded the machine (its wall time may be longer) */
const burn = (n: number): void => { const end = cpu() + n; while (cpu() < end) { /* busy */ } };
/** block this thread `n` ms of wall time with no CPU: a stretch that is only slow */
const sleep = (n: number): void => { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n); };

describe('the busy-loop guard (src/test-busy.ts), in CPU time (review-gates m_33544)', () => {
  it('fails a stretch of 12 s of CPU by its name and keeps its wall time; passes one at the limit', () => {
    const f = busyFault('cozy: nothing through the world', { cpuMs: 12_000, wallMs: 41_500 });
    expect(f).toContain("'cozy: nothing through the world' burnt 12.0 s of CPU without a macrotask (41.5 s of wall time");
    expect(f).toContain('setTimeout(done, 0)');
    expect(busyFault('at the limit', { cpuMs: BUSY_CPU_MAX_MS, wallMs: 60_000 })).toBeNull();
  });

  it('passes a long wall gap with little CPU: a test slowed by a loaded machine is not busy', () => {
    expect(busyFault('slow, not busy', { cpuMs: 2_000, wallMs: 45_000 })).toBeNull();
    const w = busyWatch();
    w.reset();
    sleep(1_500);
    const s = w.worst();
    expect(s.wallMs).toBeGreaterThanOrEqual(1_400);
    expect(s.cpuMs).toBeLessThan(300);
  });

  it('measures the CPU of a stretch with no macrotask, and a yield ends it', async () => {
    const w = busyWatch();
    w.reset();
    burn(300);
    expect(w.worst().cpuMs).toBeGreaterThanOrEqual(300);
    // the same 300 ms of CPU cut by a macrotask every 50: no stretch near 300
    w.reset();
    for (let i = 0; i < 6; i++) {
      burn(50);
      await new Promise((done) => { setTimeout(done, 0); });
    }
    // (a stretch is the time between two of the guard's 50 ms ticks: ~50-100 ms here)
    expect(w.worst().cpuMs).toBeLessThan(200);
    // 0.6 s of CPU in all; at load 42 that took 15 s of wall with 1.6 s (2128270cc's run 1): its own timeout
  }, 30_000);

  it("keeps the real clocks under a test's fake timers", () => {
    const w = busyWatch();
    vi.useFakeTimers();
    try {
      w.reset();
      vi.advanceTimersByTime(3_600_000);
      const s = w.worst();
      expect(s.wallMs).toBeLessThan(1_000);
      expect(s.cpuMs).toBeLessThan(1_000);
    } finally {
      vi.useRealTimers();
    }
  });
});
