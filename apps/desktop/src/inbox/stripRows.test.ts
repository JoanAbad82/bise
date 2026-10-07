import { describe, expect, it } from 'vitest';
import type { Card } from '@/proto';
import { cardKey } from './order';
import { STRIP_ROWS, stripKey, stripList, stripOpen, stripView, stripWords } from './stripRows';

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
});
