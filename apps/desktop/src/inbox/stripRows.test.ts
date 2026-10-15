import { describe, expect, it } from 'vitest';
import type { Card } from '@/proto';
import { cardKey } from './order';
import { fitRows, rowWords, STRIP_ROWS, stripKey, stripList, stripOpen, stripView, stripWords } from './stripRows';

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

describe('the inbox strip (W7/K24)', () => {
  const cards = [card(4, 1), card(1, 2), card(2, 0), card(3, 1, 'other'), card(5, 3), card(6, 3)];

  it("lists the project's items in the inbox's order, the ones acted on here left out", () => {
    expect(stripList(cards, 'acme', new Set()).map((c) => c.id)).toEqual([2, 4, 1, 5, 6]);
    expect(stripList(cards, 'acme', new Set(['acme-4'])).map((c) => c.id)).toEqual([2, 1, 5, 6]);
  });

  it("shows STRIP_ROWS rows numbered from 1, the rest as '+ n more'", () => {
    const list = stripList(cards, 'acme', new Set());
    const v = stripView(list, null);
    expect(STRIP_ROWS).toBe(3);
    expect(v.rows.map((r) => [r.card.id, r.n])).toEqual([
      [2, 1],
      [4, 2],
      [1, 3],
    ]);
    expect(v.more).toBe(2);
    expect(v.next?.id).toBe(5);
  });

  it('an open item further down shows where its number puts it, out of the more', () => {
    const list = stripList(cards, 'acme', new Set());
    const v = stripView(list, 'acme-6');
    expect(v.rows.map((r) => [r.card.id, r.n, r.open])).toEqual([
      [2, 1, false],
      [4, 2, false],
      [1, 3, false],
      [6, 5, true],
    ]);
    expect(v.more).toBe(1);
    expect(v.next?.id).toBe(5);
  });

  it('ctrl+N (ctrl alone, by code) opens row N, as the TUI; ctrl+2 opens item 2', () => {
    const list = stripList(cards, 'acme', new Set());
    expect(stripKey(key('Digit2', { ctrlKey: true }))).toBe(2);
    expect(stripOpen(list, 2)).toBe(cardKey(card(4, 1)));
    expect(stripOpen(list, 5)).toBe('acme-6');
    expect(stripOpen(list, 6)).toBeUndefined();
    expect(stripKey(key('Digit0', { ctrlKey: true }))).toBeUndefined();
    expect(stripKey(key('Digit2'))).toBeUndefined();
    expect(stripKey(key('Digit2', { ctrlKey: true, metaKey: true }))).toBeUndefined();
    expect(stripKey(key('Digit2', { ctrlKey: true, shiftKey: true }))).toBeUndefined();
  });

  it("a row says who and the question's first line", () => {
    expect(stripWords(card(7, 0, 'acme', 'npm publish?\nit is 2.5.0'))).toEqual({ who: 't7', what: 'npm publish?' });
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
