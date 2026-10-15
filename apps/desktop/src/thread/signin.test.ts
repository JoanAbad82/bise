import { describe, expect, it } from 'vitest';
import { signInKeys } from './signin';

describe('R15: the expired sign-in in the thread', () => {
  // the waiting words are bise_proto's common.signing_wait, the TUI's too (issue 29)
  it("says the TUI's keys: c copy the link (c copied for 2 s), esc cancel", () => {
    expect(signInKeys(false)).toBe('c copy the link   esc cancel');
    expect(signInKeys(true)).toBe('c copied   esc cancel');
  });
});
