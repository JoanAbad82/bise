// The composer's pure parts: triggers, the send's text, drafts, the picker's rows.
import { describe, expect, it } from 'vitest';
import { argAt, filePick, prefixFirst, triggerAt } from './tokens';
import { buildMessage, chipStrip, isLongPaste, lineCount, nextChipNumber, type Segment } from './message';
import { enqueue, load, popNewest, remember, save, takeOldest, HISTORY_MAX, type Store } from './drafts';
import { argRows, commandLine, commandRows, completion, move } from './pick';

const memStore = (): Store & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

describe('triggers (the TUI rules)', () => {
  it('@ and $ open a word at a line start or after a space, not inside a word', () => {
    expect(triggerAt('look at @src/ma', false)).toMatchObject({ kind: 'at', query: 'src/ma', start: 8 });
    expect(triggerAt('$rev', false)).toMatchObject({ kind: 'skill', query: 'rev', start: 0 });
    expect(triggerAt('mail me@home', false)).toBeNull();
    expect(triggerAt('cost 5$', false)).toBeNull();
    expect(triggerAt('done @x ', false)).toBeNull();
  });
  it('/ only at the start of the message, one word', () => {
    expect(triggerAt('/mod', true)).toMatchObject({ kind: 'slash', query: 'mod' });
    expect(triggerAt('/mod', false)).toBeNull();
    expect(triggerAt('see /usr/bin', true)).toBeNull();
    expect(triggerAt('/usr/bin', true)).toBeNull();
  });
  it('@" opens a quoted path that may hold spaces', () => {
    expect(triggerAt('read @"docs/my no', false)).toMatchObject({ kind: 'at', query: 'docs/my no', quoted: true, start: 5 });
  });
  it('a pick inserts the bare path, quoted with a space; a folder keeps browsing', () => {
    expect(filePick('src/app.ts', false)).toEqual({ text: 'src/app.ts ', browse: false });
    expect(filePick('my notes/a.md', false)).toEqual({ text: '"my notes/a.md" ', browse: false });
    expect(filePick('src', true)).toEqual({ text: '@src/', browse: true });
  });
  it('prefix matches come before substring matches, each in order', () => {
    expect(prefixFirst(['xreview', 'review', 'rev2', 'other'], 'rev', (s) => s)).toEqual(['review', 'rev2', 'xreview']);
  });
});

describe('the send', () => {
  it('quotes go in front, pastes in place as tags, images as labels with their file', () => {
    const segs: Segment[] = [
      { kind: 'text', text: '  what about ' },
      { kind: 'chip', chip: { kind: 'paste', n: 2, text: 'a\nb' } },
      { kind: 'text', text: ' and ' },
      { kind: 'chip', chip: { kind: 'image', n: 3, path: '/tmp/x.png', name: 'x.png' } },
      { kind: 'chip', chip: { kind: 'quote', n: 1, text: 'fn main()', from: 'main' } },
      { kind: 'text', text: '?\n' },
    ];
    expect(buildMessage(segs)).toEqual({
      text: '<selection from="main">\nfn main()\n</selection>\nwhat about <pasted n="2" lines="2">\na\nb\n</pasted> and [Image #3]?',
      files: ['/tmp/x.png'],
    });
    expect(nextChipNumber(segs)).toBe(4);
  });
  it('a paste of 12 lines or 1200 characters is long', () => {
    expect(isLongPaste('x\n'.repeat(11))).toBe(false);
    expect(isLongPaste('x\n'.repeat(12))).toBe(true);
    expect(isLongPaste('é'.repeat(1200))).toBe(true);
    expect(lineCount('a\nb\n')).toBe(2);
  });
  it('the strip says what a chip holds', () => {
    expect(chipStrip({ kind: 'quote', n: 1, text: 'one\ntwo\nthree', from: 'main' })).toBe('❝ 1 “one two three”  main · 3 lines');
    expect(chipStrip({ kind: 'paste', n: 2, text: 'x\n'.repeat(240) })).toMatch(/^▤ 2 “x x x .*” {3}240 lines · 0\.5 kB$/u);
  });
});

describe('drafts', () => {
  it('one per target, kept across a reload, unreadable reads as empty', () => {
    const s = memStore();
    save(s, 'p/main', { draft: '{"a":1}', history: [], queue: [] });
    expect(load(s, 'p/main').draft).toBe('{"a":1}');
    expect(load(s, 'p/other').draft).toBeNull();
    s.setItem('bise.composer.v1.p/bad', '{nope');
    expect(load(s, 'p/bad')).toEqual({ draft: null, history: [], queue: [] });
    save(s, 'p/main', { draft: null, history: [], queue: [] });
    expect(s.m.size).toBe(1);
  });
  it('history is newest first, deduplicated, 50 kept', () => {
    let st = load(memStore(), 't');
    for (let i = 0; i < 60; i += 1) st = remember(st, `m${i}`);
    st = remember(st, 'm55');
    expect(st.history.length).toBe(HISTORY_MAX);
    expect(st.history.slice(0, 2)).toEqual(['m55', 'm59']);
  });
  it('the queue: ↑ pops the newest back, the turn end sends the oldest', () => {
    const st = enqueue(enqueue(load(memStore(), 't'), 'a'), 'b');
    expect(popNewest(st)?.entry).toBe('b');
    expect(takeOldest(st)?.entry).toBe('a');
    expect(takeOldest(st)?.rest.queue).toEqual(['b']);
  });
});

describe('the / list', () => {
  const cmds = [
    { name: '/model', desc: 'set the model', args: true, ready: true },
    { name: '/compact', desc: 'compact', args: false, ready: true },
    { name: '/inbox', desc: 'the inbox', args: false, ready: false },
  ];
  it('filters by prefix; a not-yet command shows greyed', () => {
    const t = { kind: 'slash', query: '', start: 0, quoted: false } as const;
    const rows = commandRows(t, cmds);
    expect(rows.map((r) => r.label)).toEqual(['/model', '/compact', '/inbox']);
    expect(rows[2]).toMatchObject({ off: true, desc: 'the inbox · not yet' });
    expect(commandRows({ ...t, query: 'co' }, cmds).map((r) => r.label)).toEqual(['/compact']);
  });
  it('⏎ runs a command without arguments, tab only completes', () => {
    const [, compact] = commandRows({ kind: 'slash', query: '', start: 0, quoted: false }, cmds);
    expect(compact?.pick).toEqual({ kind: 'run', name: '/compact' });
    expect(compact && completion(compact)).toEqual({ kind: 'insert', text: '/compact ', browse: false });
  });
  it('after a command, its argument popup: fixed words here, listed kinds from the screen', () => {
    const withArgs = [
      { name: '/model', desc: 'm', args: true, ready: true, argKinds: [{ words: [{ value: 'opus', desc: 'big' }, { value: 'haiku', desc: 'small' }] }] },
      { name: '/archive', desc: 'a', args: true, ready: true, argKinds: ['agent' as const] },
      { name: '/new', desc: 'n', args: true, ready: true, argKinds: ['text' as const, 'agent' as const] },
    ];
    const is = (n: string): boolean => withArgs.some((c) => c.name === n);
    const text = (n: string, i: number): boolean => withArgs.find((c) => c.name === n)?.argKinds[i] === 'text';
    const t = argAt('/model op', true, is, text);
    expect(t).toMatchObject({ kind: 'arg', command: '/model', index: 0, query: 'op', start: 7 });
    expect(t && argRows(t, withArgs, {}).map((r) => r.pick)).toEqual([{ kind: 'insert', text: 'opus ', browse: false }]);
    const a = argAt('/archive p', true, is, text);
    expect(a && argRows(a, withArgs, { choices: (k, q) => (k === 'agent' ? [{ value: `perf-${q}`, desc: '' }] : []) }).map((r) => r.label)).toEqual(['perf-p']);
    expect(argAt('/new fix the build', true, is, text)).toBeNull();
    expect(argAt('/model op', false, is, text)).toBeNull();
    expect(argAt('/nope x', true, is, text)).toBeNull();
  });
  it('a typed command line runs; an unknown /word is text', () => {
    expect(commandLine('/model opus ', cmds)).toEqual({ name: '/model', args: 'opus', ready: true });
    expect(commandLine('/usr/bin is odd', cmds)).toBeNull();
    expect(move(0, -1, 3)).toBe(2);
  });
});
