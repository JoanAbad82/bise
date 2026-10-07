import { describe, expect, it } from 'vitest';
import type { Entry } from '@/proto';
import { hub_ev } from '@/proto/fixtures.gen';
import { GROUP_GAP_MS, chipOf, dropAuthor, clock, dayLabel, entryKey, findText, groupHead, pendingKey, posOfKey, sameDay, stripContext, whenOf, whoOf } from './entry';
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

describe("the thread's reading (ambient m_11777)", () => {
  const ctx = { agent: 'main', bise: true };
  const T = Date.UTC(2026, 9, 6, 9, 46);

  it('a group opens on a new author, after 5 min of silence, on a new day; notices open nothing', () => {
    const a = e({ at_ms: T });
    expect(groupHead(undefined, a, ctx, 'UTC')).toBe(true);
    expect(groupHead(a, e({ at_ms: T + 60_000 }), ctx, 'UTC')).toBe(false);
    expect(groupHead(a, e({ at_ms: T + GROUP_GAP_MS + 1 }), ctx, 'UTC')).toBe(true);
    expect(groupHead(a, e({ kind: 'you', at_ms: T + 1 }), ctx, 'UTC')).toBe(true);
    expect(groupHead(e({ kind: 'you', at_ms: T }), e({ kind: 'you', at_ms: T + 1 }), ctx, 'UTC')).toBe(false);
    expect(groupHead(a, e({ kind: 'notice', at_ms: T + 1 }), ctx, 'UTC')).toBe(true);
    expect(groupHead(e({ kind: 'from_agent', from: 'docs' }), e({ kind: 'from_agent', from: 'perf' }), ctx, 'UTC')).toBe(true);
    const late = Date.UTC(2026, 9, 6, 23, 58);
    expect(groupHead(e({ at_ms: late }), e({ at_ms: late + 3 * 60_000 }), ctx, 'UTC')).toBe(true);
  });

  it("days: 'today', 'yesterday', then 'mon 6 oct'", () => {
    expect(sameDay(T, T + 3_600_000, 'UTC')).toBe(true);
    expect(sameDay(0, T, 'UTC')).toBe(true);
    expect(dayLabel(T, T + 3_600_000, 'UTC')).toBe('today');
    expect(dayLabel(T, T + 86_400_000, 'UTC')).toBe('yesterday');
    expect(dayLabel(T, T + 3 * 86_400_000, 'UTC')).toBe('tue 6 oct');
  });

  it('his words never show the screen_context block', () => {
    const t = 'why is this slow?\n\n<screen_context app="Ghostty">\nThis is what was in front of the user\ntitle: x\n</screen_context>\n';
    expect(stripContext(t)).toBe('why is this slow?');
    expect(stripContext('<screen_context app="X">a</screen_context>\nhi')).toBe('hi');
    expect(stripContext('a < b, no block')).toBe('a < b, no block');
  });

  it('the chip cuts the path, never the app or the host; a url opens, a shot alone is not kept', () => {
    expect(chipOf({ app: 'Chrome', url: 'http://localhost:4801/settings' })).toEqual({
      label: '◫ with Chrome · localhost:4801/sett…',
      open: { url: 'http://localhost:4801/settings' },
      tip: undefined,
    });
    expect(chipOf({ app: 'Zed', file: '/repo/src/main.rs', url: 'https://a.dev/' })?.label).toBe('◫ with Zed · a.dev/ +1');
    expect(chipOf({ app: 'Zed', file: '/repo/src/main.rs' })?.open).toEqual({ file: '/repo/src/main.rs' });
    expect(chipOf({ app: 'Ghostty', shot: 'x.png' })).toEqual({ label: '◫ with Ghostty', open: null, tip: "the screenshot isn't kept" });
    expect(chipOf({ app: 'Ghostty', title: 'zsh — harness' })?.label).toBe('◫ with Ghostty · zsh — harness');
    expect(chipOf({})).toBeNull();
  });

  it("a row that starts with its author's name drops it: the name line says it (ambient m_11934)", () => {
    expect(dropAuthor('perf: the parsed copy cuts it', 'perf')).toBe('the parsed copy cuts it');
    expect(dropAuthor('performance: fine', 'perf')).toBe('performance: fine');
    expect(dropAuthor('the perf: fine', 'perf')).toBe('the perf: fine');
    expect(dropAuthor('hi', '')).toBe('hi');
  });
});
