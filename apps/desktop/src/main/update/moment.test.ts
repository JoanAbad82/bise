import { describe, expect, it } from 'vitest';
import { AWAY_MS, bounded, drivingOf, IDLE_S, idleOfText, notQuiet, type MomentFacts } from './moment';

const away: MomentFacts = { sinceFrontMs: AWAY_MS, idleS: 0, picker: false, mic: false, driving: false, sending: false };

describe('a quiet moment (desktop-dist v7)', () => {
  it('is him away from bise for 5 min, or away from the Mac for 10', () => {
    expect(notQuiet(away)).toBeNull();
    expect(notQuiet({ ...away, sinceFrontMs: AWAY_MS - 1 })).toBe('in_use');
    expect(notQuiet({ ...away, sinceFrontMs: 0, idleS: IDLE_S })).toBeNull();
    expect(notQuiet({ ...away, sinceFrontMs: 0, idleS: IDLE_S - 1 })).toBe('in_use');
  });

  it('is never while he types in bise: a window in front, keys pressed', () => {
    expect(notQuiet({ ...away, sinceFrontMs: 0, idleS: 0 })).toBe('in_use');
  });

  it('is never with a panel open, the mic on, an agent driving or a send in flight, however long he is away', () => {
    const gone = { ...away, sinceFrontMs: 10 * AWAY_MS, idleS: 10 * IDLE_S };
    expect(notQuiet({ ...gone, picker: true })).toBe('picker');
    expect(notQuiet({ ...gone, mic: true })).toBe('mic');
    expect(notQuiet({ ...gone, driving: true })).toBe('driving');
    expect(notQuiet({ ...gone, sending: true })).toBe('sending');
  });

  it('counts an agent driving, or paused while he took over; a stopped one is not driving', () => {
    expect(drivingOf([])).toBe(false);
    expect(drivingOf([{ kind: 'stopped' }])).toBe(false);
    expect(drivingOf([{ kind: 'stopped' }, { kind: 'driving' }])).toBe(true);
    expect(drivingOf([{ kind: 'paused' }])).toBe(true);
  });

  it("reads a test's idle file as seconds, anything else as never idle", () => {
    expect(idleOfText('900\n')).toBe(900);
    expect(idleOfText(null)).toBe(0);
    expect(idleOfText('soon')).toBe(0);
    expect(idleOfText('-5')).toBe(0);
  });

  it('a quit waits for the swap at most its bound: a slow one is left behind, a failed one too', async () => {
    expect(await bounded(Promise.resolve(), 50)).toBe('done');
    expect(await bounded(new Promise<void>((ok) => setTimeout(ok, 500)), 20)).toBe('late');
    expect(await bounded(Promise.reject(new Error('rename')), 50).catch(() => 'thrown')).toBe('thrown');
  });
});
