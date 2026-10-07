// S36 one-time hints: off without a store under the tests, seen ones never again, an up one
// stays until used or his message, a used one never comes back in the session.
import { afterEach, describe, expect, it } from 'vitest';
import { hintUsed, hintsUserMessage, resetHints, seenOf, shows } from './hints';

afterEach(resetHints);

describe('one-time hints', () => {
  it('reads the TUI pref: absent = none seen for him, off under the test harness', () => {
    expect(seenOf({ theme: 'dark' }, false)).toEqual({});
    expect(seenOf({ theme: 'dark' }, true)).toBeNull();
    expect(seenOf({ hints: { first_card: true, first_agent: false } }, true)).toEqual({ first_card: true, first_agent: false });
    expect(seenOf(null, false)).toBeNull();
  });

  it('shows when its thing happens and it was never seen; a seen one never again', () => {
    expect(shows('first_agent', true, {}, false, false)).toBe(true);
    expect(shows('first_agent', false, {}, false, false)).toBe(false);
    expect(shows('first_agent', true, { first_agent: true }, false, false)).toBe(false);
    expect(shows('first_agent', true, null, false, false)).toBe(false);
  });

  it('once up it stays (its own mark comes back seen) until used; used, never in the session again', () => {
    expect(shows('first_agent', true, { first_agent: true }, true, false)).toBe(true);
    expect(shows('first_agent', true, {}, false, true)).toBe(false);
  });

  it('used or his message: done (nothing happens to a hint never up)', () => {
    hintUsed('first_card');
    hintsUserMessage();
    expect(shows('first_card', true, {}, false, false)).toBe(true);
  });
});
