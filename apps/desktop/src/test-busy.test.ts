import { describe, expect, it, vi } from 'vitest';
import { BUSY_MAX_MS, busyFault, busyWatch } from './test-busy';

describe('the busy-loop guard (src/test-busy.ts)', () => {
  it('passes a test under the limit and names one over it, with the fix', () => {
    expect(busyFault('a quick one', BUSY_MAX_MS)).toBeNull();
    const f = busyFault('cozy: nothing through the world', 61_000);
    expect(f).toContain("'cozy: nothing through the world' kept the event loop busy 61.0 s");
    expect(f).toContain('setTimeout(done, 0)');
  });

  it('measures a busy stretch with no macrotask, and a yield ends it', async () => {
    const w = busyWatch();
    const spin = (ms: number): void => { const end = Date.now() + ms; while (Date.now() < end) { /* busy */ } };
    w.reset();
    spin(400);
    expect(w.worst()).toBeGreaterThanOrEqual(400);
    w.reset();
    for (let i = 0; i < 4; i++) {
      spin(100);
      await new Promise((done) => { setTimeout(done, 300); });
    }
    expect(w.worst()).toBeLessThan(400);
  });

  it("keeps the real clock under a test's fake timers", () => {
    const w = busyWatch();
    vi.useFakeTimers();
    try {
      w.reset();
      vi.advanceTimersByTime(3_600_000);
      expect(w.worst()).toBeLessThan(1_000);
    } finally {
      vi.useRealTimers();
    }
  });
});
