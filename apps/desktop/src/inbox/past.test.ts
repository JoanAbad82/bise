import { describe, expect, it } from 'vitest';
import type { Card } from '@/proto';
import { ALL, dayHead, endWords, headWords, jumpOf, lineTwo, listsOf, mergeRecords, saidWords, whereWords, type InboxRecord } from './past';

const NOW = new Date(2026, 9, 14, 15, 0).getTime();
const at = (d: number, h: number, m: number) => new Date(2026, 9, 14 - d, h, m).getTime();

const card = (id: number, agent: string, q: string, page = false): Card => ({
  id, project: 'shop', kind: 'question', agent, question: q, options: [], urgent: false, since_ms: NOW - 12 * 60_000,
  ...(page ? { page: { id: 'launch', url: 'http://127.0.0.1:1/p/launch' } } : {}),
});

const rec = (card: number, over: Partial<InboxRecord>): InboxRecord => ({
  card, project: 'shop', asker: 'perf', kind: 'question', question: 'keep the webp next to the avif?', options: ['keep both', 'avif only'],
  state: 'answered', asked_ms: at(0, 13, 58), at_ms: at(0, 14, 2), line2: '', ...over,
});

const NAMES = { shop: 'storefront', bise: 'bise' };

describe('listsOf: waiting first, then the past by day', () => {
  const cards = [card(3, 'search', 'which size system?'), card(4, 'main', 'launch the newsletter?', true)];
  const records = [
    rec(1, { said: 'only for Safari 16', where: { kind: 'inbox' } }),
    rec(2, { asker: 'bise', question: 'merge #381 now?', at_ms: at(0, 11, 40), pick_n: 2, options: ['now', 'after the bench'], where: { kind: 'thread', agent: 'perf' } }),
    rec(5, { asker: 'checkout', question: 'retry the failed test?', state: 'withdrawn', reason: 'checkout answered itself', at_ms: at(1, 18, 30) }),
  ];
  it('groups and orders', () => {
    const l = listsOf(cards, records, NAMES, ALL, NOW);
    expect(l.waiting.map((w) => [w.glyph, w.title])).toEqual([['?', 'search'], ['¶', 'bise']]);
    expect(l.days.map((d) => [d.title, d.rows.map((r) => r.r.card)])).toEqual([['today', [1, 2]], ['yesterday', [5]]]);
    expect(l.order).toEqual(['w:shop/3', 'w:shop/4', 'p:shop/1', 'p:shop/2', 'p:shop/5']);
  });
  it('filters by state, asker and words', () => {
    expect(listsOf(cards, records, NAMES, { ...ALL, state: 'withdrawn' }, NOW).order).toEqual(['p:shop/5']);
    expect(listsOf(cards, records, NAMES, { ...ALL, state: 'waiting' }, NOW).days).toEqual([]);
    expect(listsOf(cards, records, NAMES, { ...ALL, agent: 'perf' }, NOW).order).toEqual(['p:shop/1']);
    // his answer's words are searched too
    expect(listsOf(cards, records, NAMES, { ...ALL, q: 'safari' }, NOW).order).toEqual(['p:shop/1']);
    expect(listsOf(cards, records, NAMES, { ...ALL, q: 'storefront size' }, NOW).order).toEqual(['w:shop/3']);
  });
  it('counts waiting and answered, not withdrawn', () => {
    expect(headWords(cards, records)).toBe('2 waiting · 2 answered');
  });
});

describe('the rows words', () => {
  it('says his answer in words, never the digit', () => {
    expect(saidWords(rec(1, { said: '2', pick_n: 2 }))).toBe('avif only');
    expect(saidWords(rec(1, { pick_n: 1 }))).toBe('keep both');
    expect(saidWords(rec(1, { said: 'only for Safari 16' }))).toBe('only for Safari 16');
  });
  it("says the record's second line, and drops the 'where' whole when narrow", () => {
    expect(whereWords({ kind: 'thread', agent: 'old' })).toBe("in old's thread");
    expect(whereWords({ kind: 'unknown' })).toBe('in the inbox');
    const r = rec(1, { said: 'yes', where: { kind: 'page', page: 'p' }, line2: 'you: yes · on a page' });
    expect(lineTwo(r)).toBe('you: yes · on a page');
    expect(lineTwo(r, true)).toBe('you: yes');
    const w = rec(1, { state: 'withdrawn', reason: 'agent stopped', line2: 'withdrawn: its agent stopped' });
    expect(lineTwo(w, true)).toBe('withdrawn: its agent stopped');
  });
  it('drops the project when narrow', () => {
    expect(endWords('shop', at(0, 14, 2), NAMES, false, null)).toBe('storefront · 14:02');
    expect(endWords('shop', at(0, 14, 2), NAMES, true, null)).toBe('14:02');
  });
});

it('heads a day as words::day_head', () => {
  expect(dayHead(at(0, 9, 0), NOW)).toBe('today');
  expect(dayHead(at(1, 9, 0), NOW)).toBe('yesterday');
  expect(dayHead(at(2, 9, 0), NOW)).toBe('oct 12');
  expect(dayHead(new Date(2024, 11, 30, 9, 0).getTime(), NOW)).toBe('dec 30 2024');
});

describe('jumpOf: where a past row goes', () => {
  it('goes to the thread that got his answer, else the asker', () => {
    expect(jumpOf(rec(7, { thread: { agent: 'perf', pos: 812 }, where: { kind: 'inbox' } }))).toEqual({ kind: 'thread', project: 'shop', agent: 'perf', card: 7, pos: 812 });
    expect(jumpOf(rec(7, { where: { kind: 'thread', agent: 'main' } }))).toEqual({ kind: 'thread', project: 'shop', agent: 'main', card: 7 });
    expect(jumpOf(rec(7, { state: 'withdrawn' }))).toEqual({ kind: 'thread', project: 'shop', agent: 'perf', card: 7 });
  });
  it('opens a page answer at its block', () => {
    expect(jumpOf(rec(7, { where: { kind: 'page', page: 'launch', block: 'q1' } }))).toEqual({ kind: 'page', project: 'shop', page: 'launch', block: 'q1' });
  });
});

it('mergeRecords keeps one per card, newest first', () => {
  const a = rec(1, { at_ms: 1 });
  const b = rec(2, { at_ms: 3 });
  expect(mergeRecords([[a, b], [{ ...a, at_ms: 2 }]]).map((r) => [r.card, r.at_ms])).toEqual([[2, 3], [1, 2]]);
});

describe('waitingCount: one number', () => {
  it("counts the list, and a row's waits when it carries no cards", async () => {
    const { waitingCount } = await import('./waiting');
    const c = card(3, 'perf', 'which bench?');
    expect(waitingCount([c, c], [{ cards: [c], waits: 1 }, { cards: undefined, waits: 2 }])).toBe(4);
    expect(waitingCount([], [{ cards: [], waits: 0 }])).toBe(0);
  });
});
