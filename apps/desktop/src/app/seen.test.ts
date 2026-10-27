// What a project's pulse counts against his last look (seen.ts newestOf): its newest entry for him,
// artifact or past news; a scheduled run ahead is never "new".
import { describe, expect, it } from 'vitest';
import type { Pulse } from '@/proto';
import { newestOf } from './seen';

const pulse = (o: Partial<Pulse> = {}): Pulse => ({ from_ms: 0, busy_ms: [], counting: false, ...o });

describe('newestOf', () => {
  it('the newest of the entries for him, the artifacts and a past news', () => {
    expect(newestOf(pulse({ said_at: [30, 10], artifacts_at: [20], news: { at_ms: 25, what: { kind: 'failed', agent: 'perf' } } }))).toBe(30);
    expect(newestOf(pulse({ said_at: [10], artifacts_at: [40] }))).toBe(40);
  });

  it('none: no pulse, nothing in it, or only a scheduled run ahead', () => {
    expect(newestOf(null)).toBeUndefined();
    expect(newestOf(pulse())).toBeUndefined();
    expect(newestOf(pulse({ news: { at_ms: 99, what: { kind: 'scheduled', id: 't', name: 'nightly' } } }))).toBeUndefined();
  });
});
