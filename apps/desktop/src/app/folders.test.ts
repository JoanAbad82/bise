// His try round 2 item 3: a project's folder in the sidebar is open by default; one the window
// has no agents of shows its counts.
import { describe, expect, it } from 'vitest';
import { folderLine } from './Sidebar';

describe('a project folder', () => {
  it("says its counts with the signed words, nothing when quiet", () => {
    expect(folderLine({ working: 2, waits: 1 })).toBe('2 at work · 1 waiting for you');
    expect(folderLine({ working: 0, waits: 3 })).toBe('3 waiting for you');
    expect(folderLine({ working: 1, waits: 0 })).toBe('1 at work');
    expect(folderLine({ working: 0, waits: 0 })).toBe('');
  });
});
