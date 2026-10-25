import { describe, expect, it } from 'vitest';
import type { Card } from '@/proto';
import { cardKeyOf, fitRows, rowWords, stripKey } from './stripRows';

const card = (id: number, rank: number, project = 'acme', question = `q${String(id)}`): Card => ({
  id,
  project,
  kind: 'question',
  agent: `t${String(id)}`,
  question,
  options: [],
  urgent: false,
  since_ms: id,
  rank,
});

const key = (code: string, mods: Partial<Record<'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey', boolean>> = {}) => ({
  code,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...mods,
});

describe("the inbox block's rows (W7/K24)", () => {
  it('ctrl+N (ctrl alone, by code) opens row N, as the TUI', () => {
    expect(stripKey(key('Digit2', { ctrlKey: true }))).toBe(2);
    expect(stripKey(key('Digit0', { ctrlKey: true }))).toBeUndefined();
    expect(stripKey(key('Digit2'))).toBeUndefined();
    expect(stripKey(key('Digit2', { ctrlKey: true, metaKey: true }))).toBeUndefined();
    expect(stripKey(key('Digit2', { ctrlKey: true, shiftKey: true }))).toBeUndefined();
  });

  it("a row's words as the TUI's box_row: who, '$ ' and a command's lines, a patch's counts, the first line with words, the note", () => {
    const c = card(7, 0);
    expect(rowWords({ ...c, question: '\n  npm publish?\nit is 2.5.0', note: 'answered\n another way' })).toEqual({ who: 't7', cmd: false, what: 'npm publish?', note: 'answered another way' });
    expect(rowWords({ ...c, kind: 'approval', question: 'npm publish' })).toEqual({ who: 't7', cmd: true, what: 'npm publish', note: '' });
    expect(rowWords({ ...c, kind: 'approval', question: 'make test\n  --all\n\nthe gate' }).what).toBe('make test · 2 lines');
    const patch = 'diff --git a/a.rs b/a.rs\n--- a/a.rs\n+++ b/a.rs\n+x\n-y\n+z\n+++ b/b.rs\n+w';
    expect(rowWords({ ...c, kind: 'approval', question: patch })).toEqual({ who: 't7', cmd: false, what: 'a.rs +1 file · +3 −1', note: '' });
    // the agent alone on every row, whatever the kind (designer m_26234: the sign says what it is)
    expect(rowWords({ ...c, kind: 'feature_merge', question: 'merge sb/perf into main?' }).who).toBe('t7');
  });

  it('a short window gives rows back, 3 → 2 → 1, so the thread keeps 40% of it; never 0', () => {
    // 820 high, 200 px of head and composer, 28 px rows: 3 rows + more is 312, the thread keeps 508
    expect(fitRows({ win: 820, fixed: 200, row: 28, items: 5 })).toBe(3);
    // 500 high (the thread wants 200): 3 + more leaves 188, 2 + more 216
    expect(fitRows({ win: 500, fixed: 200, row: 28, items: 5 })).toBe(2);
    expect(fitRows({ win: 450, fixed: 200, row: 28, items: 5 })).toBe(1);
    expect(fitRows({ win: 300, fixed: 280, row: 28, items: 5 })).toBe(1);
    // 3 items: no '+ n more' row, 3 rows fit where 3 + more did not
    expect(fitRows({ win: 500, fixed: 200, row: 28, items: 3 })).toBe(3);
  });
});

describe("the keys on an open card (cardKeyOf)", () => {
  it('digits that are options pick, ←→ walk, ⌘⌫ closes, esc puts off', () => {
    const k = (k_: string, mods: Partial<Record<'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey', boolean>> = {}) => ({ key: k_, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...mods });
    const c: Card = { ...card(1, 0), options: [{ n: 1, label: "a" }, { n: 2, label: "b" }] };
    expect(cardKeyOf(k('2'), c, null)).toEqual({ t: 'pick', n: 2 });
    expect(cardKeyOf(k('3'), c, null)).toBeNull();
    expect(cardKeyOf(k('ArrowRight'), c, null)).toEqual({ t: 'on', n: 1 });
    expect(cardKeyOf(k('ArrowRight'), c, 2)).toEqual({ t: 'on', n: 2 });
    expect(cardKeyOf(k('ArrowLeft'), c, null)).toEqual({ t: 'on', n: 2 });
    expect(cardKeyOf(k('Backspace', { metaKey: true }), c, null)).toEqual({ t: 'close' });
    expect(cardKeyOf(k('Escape'), c, null)).toEqual({ t: 'later' });
    expect(cardKeyOf(k('2', { ctrlKey: true }), c, null)).toBeNull();
  });
});
