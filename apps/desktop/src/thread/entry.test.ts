import { describe, expect, it } from 'vitest';
import type { Entry } from '@/proto';
import { hub_ev } from '@/proto/fixtures.gen';
import { clock, entryKey, findText, pendingKey, posOfKey, whenOf, whoOf } from './entry';
import { search } from './find';

const e = (over: Partial<Entry>): Entry => ({ pos: 1, at_ms: 0, kind: 'agent', text: '', ...over });

describe('thread rows', () => {
  it('keys: entries by pos, sends by cid, never the same', () => {
    expect(entryKey(12)).toBe('e:12');
    expect(posOfKey(entryKey(12))).toBe(12);
    expect(posOfKey(pendingKey('12'))).toBeUndefined();
  });

  it("who speaks: his words, bise's main with the pearl, an agent, a message from another agent", () => {
    expect(whoOf(e({ kind: 'you' }), { agent: 'perf', bise: false }).from).toBe('you');
    expect(whoOf(e({}), { agent: 'main', bise: true })).toEqual({ from: 'bise', name: 'bise', indent: false });
    expect(whoOf(e({}), { agent: 'main', bise: false })).toEqual({ from: 'agent', name: 'bise', indent: false });
    expect(whoOf(e({ kind: 'from_agent', from: 'docs' }), { agent: 'main', bise: false })).toEqual({ from: 'agent', name: 'docs', indent: true });
  });

  it('a clock in his zone', () => {
    expect(clock(Date.UTC(2026, 0, 2, 14, 5), 'UTC')).toBe('14:05');
    expect(clock(0)).toBe('');
  });

  it("⌘F finds a tools entry's steps in the fixture's thread", () => {
    const entries = hub_ev.flatMap((ev) => (ev.ev === 'thread' ? ev.entries : ev.ev === 'entry' ? [ev.entry] : []));
    const found = search(
      entries.map((x) => ({ pos: x.pos, text: findText(x) })),
      'slow',
    );
    expect(found.matches.length).toBeGreaterThan(0);
  });
});

describe('M14: a turn time on hover', () => {
  const NOW = Date.UTC(2026, 9, 14, 15, 0);
  it("today's turn shows its clock, an older day's its date too, no time shows nothing", () => {
    expect(whenOf(Date.UTC(2026, 9, 14, 9, 46), NOW, 'UTC')).toBe('09:46');
    expect(whenOf(Date.UTC(2026, 9, 12, 7, 0), NOW, 'UTC')).toBe('12 Oct 07:00');
    expect(whenOf(0, NOW, 'UTC')).toBe('');
  });
});

describe('batch 3a: a message between two other agents', () => {
  it("names both ('perf → docs'), and only the sender when it is to the agent in view", () => {
    const m = e({ kind: 'from_agent', from: 'perf', to: 'docs' });
    expect(whoOf(m, { agent: 'main', bise: false }).name).toBe('perf → docs');
    expect(whoOf(m, { agent: 'docs', bise: false }).name).toBe('perf');
    expect(whoOf(e({ kind: 'from_agent', from: 'perf' }), { agent: 'main', bise: false }).name).toBe('perf');
  });
});
