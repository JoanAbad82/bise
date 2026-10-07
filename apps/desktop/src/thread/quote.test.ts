import { describe, expect, it } from 'vitest';
import { quoteFrom, quoteKey, quoteText } from './quote';

const k = (key: string, m: Partial<{ metaKey: boolean; ctrlKey: boolean; altKey: boolean }> = {}) => ({ key, metaKey: false, ctrlKey: false, altKey: false, ...m });

describe('quoting the thread (his bug 3, quote.rs)', () => {
  it('a printable key types after the quote; cmd+quote quotes alone; moves, copies and window keys do nothing', () => {
    expect(quoteKey(k('p'))).toBe('type');
    expect(quoteKey(k(' '))).toBe('type');
    expect(quoteKey(k('é'))).toBe('type');
    expect(quoteKey(k('ø', { altKey: true }))).toBe('type');
    expect(quoteKey(k("'", { metaKey: true }))).toBe('quote');
    expect(quoteKey(k('c', { metaKey: true }))).toBeUndefined();
    expect(quoteKey(k('a', { ctrlKey: true }))).toBeUndefined();
    expect(quoteKey(k('ArrowDown'))).toBeUndefined();
    expect(quoteKey(k('Escape'))).toBeUndefined();
    expect(quoteKey(k('Enter'))).toBeUndefined();
  });
  it("who said it: his row is 'you', another agent's message is that agent, else the thread's agent", () => {
    expect(quoteFrom('you', null, 'main')).toBe('you');
    expect(quoteFrom('from_agent', 'docs', 'main')).toBe('docs');
    expect(quoteFrom('agent', null, 'gift-ui')).toBe('gift-ui');
    expect(quoteFrom(undefined, undefined, 'main')).toBe('main');
  });
  it('the words as selected, trailing newlines dropped; blank is nothing', () => {
    expect(quoteText('one\ntwo\n\n')).toBe('one\ntwo');
    expect(quoteText('  \n ')).toBe('');
  });
});
