import { describe, expect, it } from 'vitest';
import { signInKeys, WAITING } from './signin';

describe('R15: the expired sign-in in the thread', () => {
  it("says the TUI's words: waiting, then c copy the link (c copied for 2 s), esc cancel", () => {
    expect(WAITING).toBe('waiting for you to sign in to ChatGPT in your browser…');
    expect(signInKeys(false)).toBe('c copy the link   esc cancel');
    expect(signInKeys(true)).toBe('c copied   esc cancel');
  });
});
