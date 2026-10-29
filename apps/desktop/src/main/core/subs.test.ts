import { describe, expect, it } from 'vitest';
import { SubRoutes } from './subs';

const sub = (agent = 'main') => ({ cmd: 'subscribe', project: 'home', agent });
const unsub = (agent = 'main') => ({ cmd: 'unsubscribe', project: 'home', agent });

describe('thread subscriptions across windows (his bug 6 / R18)', () => {
  it("one window leaving a thread keeps the capsule's subscription; the last one out unsubscribes once", () => {
    const s = new SubRoutes();
    const WINDOW = 1;
    const CAPSULE = 2;
    expect(s.sent(WINDOW, sub())).toEqual([sub()]);
    expect(s.sent(CAPSULE, sub())).toEqual([sub()]);
    // the window leaves bise's main thread: the capsule still gets main's entries
    expect(s.sent(WINDOW, unsub())).toEqual([]);
    // the capsule closes: one unsubscribe, sent once
    expect(s.gone(CAPSULE)).toEqual([unsub()]);
    expect(s.gone(CAPSULE)).toEqual([]);
    expect(s.gone(WINDOW)).toEqual([]);
  });

  it('a window gone gives up only the threads nobody else holds; other commands pass as they are', () => {
    const s = new SubRoutes();
    s.sent(1, sub('main'));
    s.sent(1, sub('perf'));
    s.sent(2, sub('main'));
    expect(s.gone(1)).toEqual([unsub('perf')]);
    expect(s.sent(2, unsub('main'))).toEqual([unsub('main')]);
    // an unsubscribe of a thread main never saw held goes through (nothing to keep)
    expect(s.sent(3, unsub('docs'))).toEqual([unsub('docs')]);
    const send = { cmd: 'send', project: 'home', agent: 'main', text: 'hi' };
    expect(s.sent(1, send)).toEqual([send]);
  });

  it('a second subscribe of the same window still reaches the core (its page), and one unsubscribe frees it', () => {
    const s = new SubRoutes();
    s.sent(1, sub());
    expect(s.sent(1, { ...sub(), limit: 40 })).toEqual([{ ...sub(), limit: 40 }]);
    expect(s.sent(1, unsub())).toEqual([unsub()]);
  });

  it('a new core: the counts start over (the windows subscribe again)', () => {
    const s = new SubRoutes();
    s.sent(1, sub());
    s.sent(2, sub());
    s.clear();
    s.sent(2, sub());
    expect(s.sent(2, unsub())).toEqual([unsub()]);
  });
});
