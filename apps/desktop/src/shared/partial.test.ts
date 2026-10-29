// The streaming draft's reader (amb-core m_12358's fixtures): whole text (no off: an older hub),
// replace, a new call replaces, '' clears at once, at most one update per 250 ms; R40's deltas
// (text at off, UTF-16 units, the cases of bise-proto's LiveText law).
import { describe, expect, it } from 'vitest';
import { PARTIAL_EVERY_MS, followPartial, partialOf, type LivePartial } from './partial';

const P = 'acme-1a2b3c4d';
const ev = (text: string, call = '48.1', agent = 'perf', project = P): Record<string, unknown> => ({ ev: 'partial', project, agent, call, text });
const A = 'The cold bench takes 4.1 s because';
const B = 'The cold bench takes 4.1 s because the index is walked twice.';

describe('partialOf', () => {
  it('replaces with the whole text, keeps the first time of a call, clears on ""', () => {
    const a = partialOf(null, ev(A), P, 'perf', 100);
    expect(a).toEqual({ call: '48.1', text: A, at_ms: 100 });
    const b = partialOf(a ?? null, ev(B), P, 'perf', 400);
    expect(b).toEqual({ call: '48.1', text: B, at_ms: 100 });
    expect(partialOf(b ?? null, ev(''), P, 'perf', 500)).toBeNull();
  });
  it('a new call (or attempt) starts again; other agents and events are not ours', () => {
    const a = partialOf(null, ev(A), P, 'perf', 100) ?? null;
    expect(partialOf(a, ev('Then', '48.2'), P, 'perf', 900)).toEqual({ call: '48.2', text: 'Then', at_ms: 900 });
    expect(partialOf(a, ev(B, '48.1', 'search'), P, 'perf', 900)).toBeUndefined();
    expect(partialOf(a, ev(B, '48.1', 'perf', 'other'), P, 'perf', 900)).toBeUndefined();
    expect(partialOf(a, { ev: 'typing', project: P, agent: 'perf', text: 'x' }, P, 'perf', 900)).toBeUndefined();
  });
});

describe('partialOf deltas (R40: text at off, UTF-16 units)', () => {
  const d = (off: number, text: string, call = '48.1'): Record<string, unknown> => ({ ev: 'partial', project: P, agent: 'perf', call, off, text });
  const fold = (evs: Record<string, unknown>[]): LivePartial | null => evs.reduce<LivePartial | null>((p, e) => partialOf(p, e, P, 'perf', 7) ?? p, null);

  it('appends at the end, and a delta that comes twice changes nothing', () => {
    const at = A.length;
    expect(fold([d(0, A), d(at, B.slice(at))])?.text).toBe(B);
    expect(fold([d(0, A), d(at, B.slice(at)), d(at, B.slice(at))])?.text).toBe(B);
  });
  it('an off inside the text rewrites from there; off 0 starts again; "" at 0 clears', () => {
    expect(fold([d(0, 'The cold bench'), d(4, 'warm bench')])?.text).toBe('The warm bench');
    expect(fold([d(0, A), d(0, 'Then')])?.text).toBe('Then');
    expect(partialOf(fold([d(0, A)]), d(0, ''), P, 'perf', 9)).toBeNull();
  });
  it('counts UTF-16 units: an emoji before the cut is two', () => {
    // 'a😀b' is 4 units: off 4 appends after b, off 3 rewrites after the emoji
    expect(fold([d(0, 'a😀b'), d(4, 'c')])?.text).toBe('a😀bc');
    expect(fold([d(0, 'a😀b'), d(3, 'x')])?.text).toBe('a😀x');
    expect(fold([d(0, '日😀'), d(3, '!')])?.text).toBe('日😀!');
  });
  it('a gap clears until the next off 0: past the end, inside a surrogate pair, another call', () => {
    expect(partialOf(fold([d(0, 'abc')]), d(5, 'x'), P, 'perf', 9)).toBeNull();
    expect(partialOf(fold([d(0, 'a😀b')]), d(2, 'x'), P, 'perf', 9)).toBeNull();
    expect(partialOf(fold([d(0, 'abc')]), d(3, 'x', '48.2'), P, 'perf', 9)).toBeNull();
    expect(partialOf(null, d(3, 'x'), P, 'perf', 9)).toBeNull();
    expect(fold([d(0, 'abc'), d(5, 'x'), d(3, 'd'), d(0, 'again')])?.text).toBe('again');
  });
  it('a bad off is not ours', () => {
    expect(partialOf(null, d(-1, 'x'), P, 'perf', 9)).toBeUndefined();
    expect(partialOf(null, d(1.5, 'x'), P, 'perf', 9)).toBeUndefined();
  });
});

describe('followPartial', () => {
  const rig = (): { send: (e: Record<string, unknown>) => void; tick: (ms: number) => void; shown: (LivePartial | null)[]; stop: () => void } => {
    let now = 0;
    let listener: ((e: Record<string, unknown>) => void) | null = null;
    const timers: { at: number; fn: () => void; live: boolean }[] = [];
    const shown: (LivePartial | null)[] = [];
    const stop = followPartial(
      {
        onEvent: (l) => {
          listener = l;
          return () => {
            listener = null;
          };
        },
      },
      P,
      'perf',
      (p) => shown.push(p),
      {
        now: () => now,
        later: (fn, ms) => {
          const t = { at: now + ms, fn, live: true };
          timers.push(t);
          return () => {
            t.live = false;
          };
        },
      },
    );
    return {
      send: (e) => listener?.(e),
      tick: (ms) => {
        now += ms;
        for (const t of timers) {
          if (t.live && t.at <= now) {
            t.live = false;
            t.fn();
          }
        }
      },
      shown,
      stop,
    };
  };

  it('the first update at once, then the newest at most every 250 ms', () => {
    const r = rig();
    r.send(ev('The'));
    expect(r.shown.map((p) => p?.text)).toEqual(['The']);
    r.tick(50);
    r.send(ev('The cold'));
    r.tick(50);
    r.send(ev(A));
    expect(r.shown).toHaveLength(1);
    r.tick(PARTIAL_EVERY_MS - 100);
    expect(r.shown.map((p) => p?.text)).toEqual(['The', A]);
  });

  it('a clear goes at once and drops the waiting update', () => {
    const r = rig();
    r.send(ev(A));
    r.tick(10);
    r.send(ev(B));
    r.send(ev(''));
    r.tick(1000);
    expect(r.shown.map((p) => p?.text ?? null)).toEqual([A, null]);
    // the next call shows at once again
    r.send(ev('Then', '49.1'));
    expect(r.shown.at(-1)).toMatchObject({ call: '49.1', text: 'Then' });
    r.stop();
    r.send(ev('ignored', '49.1'));
    expect(r.shown.at(-1)?.text).toBe('Then');
  });
});
