import { describe, expect, it } from 'vitest';
import { DictationRoutes } from './dictation';

const partial = { ev: 'dictation', id: 'd1', text: 'fix the', final: false };
const final = { ev: 'dictation', id: 'd1', text: 'fix the login test', final: true };

describe('dictation routes (bar I, architect m_10537)', () => {
  it("a dictation's words go only to the window that started it, never to all", () => {
    const r = new DictationRoutes();
    r.sent(7, { cmd: 'dictate_start', id: 'd1' });
    expect(r.route(partial)).toEqual({ to: 'window', window: 7, ev: partial });
    expect(r.route(final)).toEqual({ to: 'window', window: 7, ev: final });
    // after the final: nobody (a late event never leaks to another window)
    expect(r.route(partial)).toEqual({ to: 'none' });
    // an id no window started: nobody
    expect(r.route({ ev: 'dictation', id: 'x', text: 'secret', final: false })).toEqual({ to: 'none' });
    // every other event still goes to every window
    expect(r.route({ ev: 'level', who: 'you', v: 0.3 })).toEqual({ to: 'all' });
    expect(r.route({ ev: 'error', cmd: 'send', text: 'other' })).toEqual({ to: 'all' });
  });

  it('a busy refusal goes to the window that asked, the running dictation keeps its route', () => {
    const r = new DictationRoutes();
    r.sent(1, { cmd: 'dictate_start', id: 'd1' });
    r.sent(2, { cmd: 'dictate_start', id: 'd2' });
    const busy = { ev: 'dictation', id: 'd2', text: '', final: true, error: 'the mic is busy.' };
    expect(r.route(busy)).toEqual({ to: 'window', window: 2, ev: busy });
    expect(r.route(partial)).toEqual({ to: 'window', window: 1, ev: partial });
    // a failure is its final: the route ends
    const failed = { ev: 'dictation', id: 'd1', text: 'fix the', final: true, error: 'no microphone' };
    expect(r.route(failed)).toEqual({ to: 'window', window: 1, ev: failed });
    expect(r.route(partial)).toEqual({ to: 'none' });
  });

  it("a window gone cancels its dictations (the mic goes off), not another window's", () => {
    const r = new DictationRoutes();
    r.sent(1, { cmd: 'dictate_start', id: 'd1' });
    r.sent(2, { cmd: 'dictate_start', id: 'd2' });
    expect(r.gone(1)).toEqual([{ cmd: 'dictate_cancel', id: 'd1' }]);
    expect(r.gone(1)).toEqual([]);
    // the core's cancelled final for d1 reaches nobody now
    expect(r.route({ ev: 'dictation', id: 'd1', text: '', final: true, cancelled: true })).toEqual({ to: 'none' });
    expect(r.route({ ev: 'dictation', id: 'd2', text: 'hi', final: false })).toMatchObject({ to: 'window', window: 2 });
  });

  it('a core gone ends each dictation for its window', () => {
    const r = new DictationRoutes();
    r.sent(3, { cmd: 'dictate_start', id: 'd3' });
    r.sent(3, { cmd: 'send', text: 'not a dictation' });
    expect(r.coreGone()).toEqual([{ to: 'window', window: 3, ev: { ev: 'dictation', id: 'd3', text: '', final: true, cancelled: true } }]);
    expect(r.coreGone()).toEqual([]);
  });
});
