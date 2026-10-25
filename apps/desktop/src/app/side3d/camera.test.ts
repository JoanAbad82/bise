// camera.ts: the world's beats (designer m_42974): their order, the 20 s gap, never the same agent
// twice, reduced motion, the lead framing.
import { describe, expect, it } from 'vitest';
import type { Agent } from '@/proto';
import { FOLLOW_ZOOM } from '@/bims/focus';
import { BEAT_EVERY_MS, BEAT_JITTER_MS, BEAT_SOON_MS, beatDelay, GAP_MS, happenedOf, leadZoom, pickBeat, RECENT_MS, seenOf, shotOf, stillRecent, tickSoon, type Happened } from './camera';

const agent = (name: string, o: Partial<Agent> = {}): Agent => ({ name, main: false, status: 'working', archived: false, waits: 0, ...o }) as unknown as Agent;

describe('what happened', () => {
  it('an agent that starts asking, one that changes state, a new one; main and the archived ones never', () => {
    const before = seenOf([agent('main', { main: true }), agent('perf'), agent('docs'), agent('old', { archived: true })]);
    expect([...before.keys()]).toEqual(['perf', 'docs']);
    const after = seenOf([agent('main', { main: true, status: 'idle' }), agent('perf', { waits: 1 }), agent('docs', { status: 'done' }), agent('ci')]);
    expect(happenedOf(before, after, 5)).toEqual([
      { agent: 'perf', why: 'asks', at: 5 },
      { agent: 'docs', why: 'state', at: 5 },
      { agent: 'ci', why: 'state', at: 5 },
    ]);
    // still asking: nothing new
    expect(happenedOf(after, after, 6)).toEqual([]);
  });
});

describe('the beat picker', () => {
  const h = (agent: string, why: Happened['why'], at: number): Happened => ({ agent, why, at });
  it('asks first, then a state change; the newest first among equals', () => {
    const now = 100_000;
    expect(pickBeat([h('a', 'state', now - 1000), h('b', 'asks', now - 9000), h('c', 'state', now - 500)], now, null)?.agent).toBe('b');
    expect(pickBeat([h('a', 'state', now - 1000), h('c', 'state', now - 500)], now, null)?.agent).toBe('c');
  });
  it(`only what happened in the last ${String(RECENT_MS / 1000)} s; nothing: no beat`, () => {
    const now = 100_000;
    expect(pickBeat([h('a', 'asks', now - RECENT_MS - 1)], now, null)).toBeNull();
    expect(pickBeat([], now, null)).toBeNull();
    expect(stillRecent([h('a', 'asks', now - RECENT_MS - 1), h('b', 'state', now)], now)).toEqual([h('b', 'state', now)]);
  });
  it(`never two beats within ${String(GAP_MS / 1000)} s`, () => {
    const last = { agent: 'x', at: 100_000 };
    expect(pickBeat([h('a', 'asks', 110_000)], 100_000 + GAP_MS - 1, last)).toBeNull();
    expect(pickBeat([h('a', 'asks', 110_000)], 100_000 + GAP_MS, last)?.agent).toBe('a');
  });
  it('never the same agent twice in a row, unless it asks again after its beat', () => {
    const last = { agent: 'a', at: 100_000 };
    const now = 100_000 + GAP_MS;
    expect(pickBeat([h('a', 'state', now - 1000)], now, last)).toBeNull();
    expect(pickBeat([h('a', 'asks', last.at - 1)], now, last)).toBeNull();
    expect(pickBeat([h('a', 'asks', now - 1000)], now, last)?.agent).toBe('a');
    expect(pickBeat([h('a', 'state', now - 100), h('b', 'state', now - 1000)], now, last)?.agent).toBe('b');
  });
  it('something just happened: the next tick comes within 2 s, or 20 s after the last beat, never later than planned', () => {
    expect(tickSoon(100_000, 130_000, null)).toBe(100_000 + BEAT_SOON_MS);
    expect(tickSoon(100_000, 130_000, { agent: 'a', at: 95_000 })).toBe(95_000 + GAP_MS);
    expect(tickSoon(100_000, 101_000, null)).toBe(101_000);
    // an ask right after a beat still gets its own within the 20 s it stays recent
    const at = tickSoon(100_000, 140_000, { agent: 'a', at: 100_000 });
    expect(at - 100_000).toBeLessThanOrEqual(RECENT_MS);
    expect(pickBeat([h('b', 'asks', 100_000)], at, { agent: 'a', at: 100_000 })?.agent).toBe('b');
  });
  it('every 30 s ± 8', () => {
    expect(beatDelay(0)).toBe(BEAT_EVERY_MS - BEAT_JITTER_MS);
    expect(beatDelay(0.5)).toBe(BEAT_EVERY_MS);
    expect(beatDelay(0.999999)).toBe(BEAT_EVERY_MS + BEAT_JITTER_MS);
  });
});

describe('the shot', () => {
  const o = { lead: 'main', zoom: 2.2, beat: null, hover: false, reduced: false };
  it('at rest the lead at its framing; a beat its agent at the follow zoom', () => {
    expect(shotOf(o)).toEqual({ follow: 'main', zoom: 2.2 });
    expect(shotOf({ ...o, beat: 'perf' })).toEqual({ follow: 'perf', zoom: FOLLOW_ZOOM });
  });
  it('hovered: the whole office; no main: the whole office', () => {
    expect(shotOf({ ...o, beat: 'perf', hover: true }).follow).toBeNull();
    expect(shotOf({ ...o, lead: null }).follow).toBeNull();
  });
  it('reduced motion: the lead only, never a beat', () => {
    expect(shotOf({ ...o, beat: 'perf', reduced: true })).toEqual({ follow: 'main', zoom: 2.2 });
  });
  it('while he talks to the main: the lead holds, a beat waits', () => {
    expect(shotOf({ ...o, beat: 'perf', talking: true })).toEqual({ follow: 'main', zoom: 2.2 });
    expect(shotOf({ ...o, beat: 'perf', talking: true, hover: true }).follow).toBeNull();
  });
  it('the lead framing: 6 tiles across, never past the fit', () => {
    // a 12 × 6 office: (12 + 6) / √2 ≈ 12.7 tiles across the fit
    expect(leadZoom(12, 6)).toBeCloseTo(18 / Math.SQRT2 / 6, 5);
    expect(leadZoom(3, 3)).toBe(1);
    expect(leadZoom(200, 200)).toBe(6);
  });
});
