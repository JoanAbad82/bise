// The floating composer's three states (page native-mac §6, mockups 6-8): what his gestures do.
import { describe, expect, it } from 'vitest';
import { floatNext, type FloatEvent, type FloatState } from './state';

const walk = (from: FloatState, evs: readonly FloatEvent[]): FloatState => evs.reduce(floatNext, from);

describe('floatNext', () => {
  it('a focus or an item opened by ^1-3 brings the pill to focus; neither folds an open thread', () => {
    expect(floatNext('rest', 'focus')).toBe('focus');
    expect(floatNext('rest', 'item')).toBe('focus');
    expect(floatNext('open', 'focus')).toBe('open');
    expect(floatNext('open', 'item')).toBe('open');
  });
  it('esc, ─ and a press outside fold it to rest, from focus and from open', () => {
    for (const ev of ['esc', 'fold', 'outside'] as const) {
      expect(floatNext('focus', ev)).toBe('rest');
      expect(floatNext('open', ev)).toBe('rest');
    }
  });
  it('a send opens the mini thread; the grip opens and closes it', () => {
    expect(floatNext('focus', 'sent')).toBe('open');
    expect(walk('focus', ['grip'])).toBe('open');
    expect(walk('focus', ['grip', 'grip'])).toBe('focus');
    expect(walk('rest', ['focus', 'sent', 'esc'])).toBe('rest');
  });
});
