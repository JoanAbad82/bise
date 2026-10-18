// His messages, in his words (fast-try p5, before p4's slice 2): what a thread shows of a message
// on its way (sending, failed with why), whether one is still on its way, and the commands sent.
import { describe, expect, it } from 'vitest';
import { coreDown, coreUp, dismiss, resend, said, send, sendError, sent, ev } from './inputs';
import { feature } from './run';

const ACME = 'acme-1a2b3c4d';
const T0 = 1_791_100_000_000;
/** What the thread shows of each of his messages not echoed yet: its words and its state (and why). */
const rows = (w: ReturnType<typeof feature>, agent = 'main') =>
  w.view.pending(ACME, agent).map((p) => (p.state === 'failed' ? `${p.text} · failed: ${p.why ?? ''}` : `${p.text} · sending`));
const sends = (w: ReturnType<typeof feature>) => w.sent().filter((c) => c.cmd === 'send');

describe('his messages, in his words', () => {
  it('a message shows as sending at once and goes once, with its own cid; its echo takes the row away', () => {
    const w = feature(T0).does(send(ACME, 'main', 'make it fast'));
    expect(rows(w)).toEqual(['make it fast · sending']);
    expect(w.view.sending()).toBe(true);
    expect(sends(w)).toEqual([{ cmd: 'send', project: ACME, agent: 'main', text: 'make it fast', mode: 'now', cid: 1 }]);

    // the hub gives it its message id and writes it in the thread with that id (never by its words)
    w.given(sent(ACME, 'main', 1, 7), said(ACME, 'main', 7, 'make it fast', 7, T0 + 200));
    expect(rows(w)).toEqual([]);
    expect(w.view.sending()).toBe(false);
  });

  it("its echo in a page of the thread takes the row away too", () => {
    const w = feature(T0).does(send(ACME, 'main', 'hello'));
    w.given(sent(ACME, 'main', 1, 30));
    w.given(ev('thread', { project: ACME, agent: 'main', before: null, more: false, entries: [{ kind: 'you', pos: 3, at_ms: T0 + 100, msg_id: 30, text: 'hello' }] }));
    expect(rows(w)).toEqual([]);
  });

  it('never by its words: an entry with the same words and no id (an older transcript), or before its answer, takes no row (send-reason)', () => {
    const w = feature(T0).does(send(ACME, 'main', 'hello'));
    w.given(said(ACME, 'main', 3, 'hello', null, T0 + 100));
    expect(rows(w)).toEqual(['hello · sending']);
    w.given(said(ACME, 'main', 4, 'hello', 9, T0 + 150));
    expect(rows(w)).toEqual(['hello · sending']);
    // its answer comes: that entry was its own
    w.given(sent(ACME, 'main', 1, 9));
    expect(rows(w)).toEqual([]);
  });

  it('a send that made no message (a page took it, a command ran, an older hub) leaves its row on its answer, no entry needed (send-reason)', () => {
    for (const reason of ['page', 'command', null] as const) {
      const w = feature(T0).does(send(ACME, 'main', '/answer 4 1'));
      w.given(sent(ACME, 'main', 1, null, reason));
      expect(rows(w), String(reason)).toEqual([]);
      expect(w.view.sending()).toBe(false);
    }
  });

  it("the core dies before his message's answer: the hub made it, so its entry clears the 'not sent' row, never a retry that sends it twice (send-reason, until the cid of docs/issues/33)", () => {
    const w = feature(T0).does(send(ACME, 'main', 'ship it'));
    w.given(coreDown());
    expect(rows(w)).toEqual(['ship it · failed: not sent']);
    w.given(coreUp());
    // an id this window never heard: the hub made it before the core died
    w.given(said(ACME, 'main', 5, 'ship it', 42, T0 + 100));
    expect(rows(w)).toEqual([]);
  });

  it("after the core came back, the same words sent again are a new message: its echo, before its answer, never takes the 'not sent' row, and its own row leaves on its answer (review-refactor m_30778)", () => {
    const w = feature(T0).does(send(ACME, 'main', 'ok'));
    w.given(coreDown(), coreUp());
    w.later(60_000).does(send(ACME, 'main', 'ok'));
    w.given(said(ACME, 'main', 9, 'ok', 90, T0 + 60_000), sent(ACME, 'main', 2, 90));
    expect(rows(w)).toEqual(['ok · failed: not sent']);
  });

  it("the same words sent again within seconds of the core's return: whichever row its echo takes, the new send's answer still takes its own row away, none stays sending", () => {
    const w = feature(T0).does(send(ACME, 'main', 'ok'));
    w.given(coreDown(), coreUp());
    w.later(1_000).does(send(ACME, 'main', 'ok'));
    w.given(said(ACME, 'main', 9, 'ok', 90, T0 + 1_000), sent(ACME, 'main', 2, 90));
    expect(w.view.sending()).toBe(false);
    expect(rows(w).filter((r) => r.endsWith('sending'))).toEqual([]);
  });

  it('the hub gives the send its message id: only the entry with that id is its echo, never the same words sent again', () => {
    const w = feature(T0).does(send(ACME, 'main', 'again'), send(ACME, 'main', 'again'));
    w.given(sent(ACME, 'main', 1, 41), sent(ACME, 'main', 2, 42));
    w.given(said(ACME, 'main', 9, 'again', 42, T0 + 300));
    expect(w.view.pending(ACME, 'main').map((p) => p.cid)).toEqual([1]);
    w.given(said(ACME, 'main', 10, 'again', 41, T0 + 400));
    expect(rows(w)).toEqual([]);
  });

  it("an echo that comes before the send's answer: the answer takes the row when it comes", () => {
    const w = feature(T0).does(send(ACME, 'main', 'quick one'));
    w.given(sent(ACME, 'main', 1, 50));
    expect(rows(w)).toEqual(['quick one · sending']);
    const v = feature(T0).does(send(ACME, 'main', 'quick one'));
    v.given(said(ACME, 'main', 4, 'other words', 60, T0 + 50), sent(ACME, 'main', 1, 60));
    expect(rows(v)).toEqual([]);
  });

  it('a send refused by the hub (its cid) fails with the words, try again sends the same words under a new cid, dismiss drops it', () => {
    const w = feature(T0).does(send(ACME, 'main', 'deploy'), send(ACME, 'main', 'and test'));
    w.given(sendError(ACME, 'no agent main', 2, 'refused'));
    expect(rows(w)).toEqual(['deploy · sending', 'and test · failed: no agent main']);

    w.does(resend(ACME, 'main', 2));
    expect(rows(w)).toEqual(['deploy · sending', 'and test · sending']);
    expect(sends(w).map((c) => [c.text, 'cid' in c ? c.cid : null])).toEqual([['deploy', 1], ['and test', 2], ['and test', 3]]);

    w.given(sendError(ACME, 'no agent main', 3, 'refused'));
    w.does(dismiss(ACME, 'main', 3));
    expect(rows(w)).toEqual(['deploy · sending']);
  });

  it('try again on a queued message with a file sends it as it was: the same words, queued, the same file', () => {
    const parts = [{ kind: 'text' as const, text: 'after your turn: read this ' }, { kind: 'file' as const, path: '/Users/camille/acme/notes.md', name: '[File #1]' }];
    const w = feature(T0).does(send(ACME, 'perf', 'after your turn: read this', { mode: 'queued', parts }));
    w.given(sendError(ACME, 'the hub is busy', 1, 'refused'));
    w.does(resend(ACME, 'perf', 1));
    // his words go in the parts: a text beside parts is refused by the hub, so it goes empty
    expect(sends(w)).toEqual([
      { cmd: 'send', project: ACME, agent: 'perf', text: '', mode: 'queued', parts, cid: 1 },
      { cmd: 'send', project: ACME, agent: 'perf', text: '', mode: 'queued', parts, cid: 2 },
    ]);
    expect(rows(w, 'perf')).toEqual(['after your turn: read this · sending']);
  });

  it('a send the hub could not deliver (undelivered, its cid) leaves the thread, nothing to retry', () => {
    const w = feature(T0).does(send(ACME, 'perf', 'are you there?'));
    w.given(sendError(ACME, '@perf is archived: not delivered', 1, 'undelivered'));
    expect(rows(w, 'perf')).toEqual([]);
    expect(w.view.sending()).toBe(false);
  });

  it("an error with no cid (an older core) fails that project's oldest message on its way", () => {
    const SHOP = 'shop-3471b6b2';
    const w = feature(T0).does(send(SHOP, 'main', 'elsewhere first'), send(ACME, 'main', 'first'), send(ACME, 'perf', 'second'));
    w.given(sendError(ACME, "send: context isn't supported yet", null));
    expect(rows(w)).toEqual(["first · failed: send: context isn't supported yet"]);
    expect(rows(w, 'perf')).toEqual(['second · sending']);
    expect(w.view.pending(SHOP, 'main').map((p) => p.state)).toEqual(['sending']);
  });

  it('the core goes down: every message on its way fails as not sent; a message while it is down sends nothing', () => {
    const w = feature(T0).does(send(ACME, 'main', 'one'), send(ACME, 'perf', 'two'));
    w.given(coreDown());
    expect(w.view.pending(ACME, 'main').map((p) => p.state)).toEqual(['failed']);
    expect(w.view.pending(ACME, 'perf').map((p) => p.state)).toEqual(['failed']);
    expect(w.view.sending()).toBe(false);
    const before = sends(w).length;

    w.does(send(ACME, 'main', 'three'));
    expect(sends(w).length).toBe(before);
    expect(w.view.pending(ACME, 'main').map((p) => [p.text, p.state])).toEqual([['one', 'failed'], ['three', 'failed']]);

    // back up: try again sends it
    w.given(coreUp());
    const failed = w.view.pending(ACME, 'main')[1];
    if (failed === undefined) throw new Error('no failed row');
    w.does(resend(ACME, 'main', failed.cid));
    expect(sends(w).at(-1)).toMatchObject({ cmd: 'send', project: ACME, agent: 'main', text: 'three' });
  });
});
