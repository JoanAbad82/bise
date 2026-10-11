import { describe, expect, it } from 'vitest';
import type { AgentWatch, WatchKind } from '@/proto';
import { waitAge, waitingFor, waitsEvent, wakeLine, wakeTail, watchLabel } from './wake';

// bise-proto's own examples (rust/proto/src/thread/words.rs the_waiting_words_are_designers): the
// window says the TUI's words
const w = (id: number, kind: WatchKind, what: string, since_ms: number, noted = false): AgentWatch => ({ id, kind, what, since_ms, noted });

describe('event-wake words (designer page event-wake, words.rs)', () => {
  it('waiting for: the oldest watch, how many more, its age', () => {
    expect(waitingFor([], 0)).toBeNull();
    const one = [w(3, 'bg', 'cargo test', 1_000)];
    expect(waitingFor(one, 121_000)).toBe('waiting for cargo test · 2m');
    const two = [w(4, 'file', 'build.rc', 50_000), w(3, 'bg', 'cargo test', 1_000)];
    expect(waitingFor(two, 121_000)).toBe('waiting for cargo test and 1 more · 2m');
    expect(waitingFor(two.slice(0, 1), 60_000)).toBe('waiting for build.rc to appear · 10s');
    // a file watch with a note: the note names it (designer m_17730)
    expect(waitingFor([w(5, 'file', 'the reindex', 60_000, true)], 60_000)).toBe('waiting for the reindex · 0s');
  });

  it("a wait's age and a watch's label", () => {
    expect([waitAge(40_000), waitAge(121_000), waitAge(3 * 3_600_000), waitAge(2 * 86_400_000)]).toEqual(['40s', '2m', '3h', '2d']);
    expect(watchLabel('file', 'build.rc', false)).toBe('build.rc to appear');
    expect(watchLabel('file', 'the reindex', true)).toBe('the reindex');
    expect(watchLabel('pid', 'pid 4242', false)).toBe('pid 4242');
  });

  it('it waits for an event only while it has no turn running (the TUI waits_event)', () => {
    const watching = [w(3, 'bg', 'cargo test', 1_000)];
    expect(waitsEvent({ status: 'idle', watching })).toBe(true);
    expect(waitsEvent({ status: 'done', watching })).toBe(false);
    expect(waitsEvent({ status: 'working', watching })).toBe(false);
    expect(waitsEvent({ status: 'idle', watching: [] })).toBe(false);
    expect(waitsEvent({ status: 'idle' })).toBe(false);
  });

  it("the wake line: the hub's head, only a non-zero rc red, '–' when he stopped waiting; its folded output", () => {
    const ended = (rc: number | null, text: string) => wakeLine({ text, wake: { id: 1, ev: 'ended', kind: 'bg', what: 'cargo test', rc, after_ms: 1 } });
    expect(ended(101, 'cargo test ended · rc 101 · after 3m10s')).toEqual({
      mark: '·',
      parts: [
        { text: 'cargo test ended', err: false },
        { text: 'rc 101', err: true },
        { text: 'after 3m10s', err: false },
      ],
    });
    expect(ended(0, 'cargo test ended · rc 0 · after 2m04s').parts.some((p) => p.err)).toBe(false);
    expect(wakeLine({ text: 'stopped waiting for the reindex', wake: { id: 1, ev: 'stopped', kind: 'pid', what: 'the reindex', after_ms: 9 } }).mark).toBe('–');
    expect(wakeLine({ text: 'stopped waiting for npm run dev after 24h', wake: { id: 1, ev: 'expired', kind: 'bg', what: 'npm run dev', after_ms: 86_400_000 } }).mark).toBe('–');
    expect(wakeLine({ text: 'the reindex still running after 1h00m', wake: { id: 1, ev: 'still', kind: 'pid', what: 'the reindex', after_ms: 3_600_000 } }).mark).toBe('·');
    expect([wakeTail(0), wakeTail(1), wakeTail(3)]).toEqual([null, 'its last line', 'its last 3 lines']);
  });
});
