import { describe, expect, it } from 'vitest';
import { themeSourceOf } from './theme';

describe('themeSourceOf (lead m_10834)', () => {
  it("'light' and 'dark' set the native theme; the rest follows the system", () => {
    expect(themeSourceOf({ theme: 'light' })).toBe('light');
    expect(themeSourceOf({ theme: 'dark' })).toBe('dark');
    for (const p of [{ theme: 'system' }, { theme: 'auto' }, { theme: 'sepia' }, { theme: 1 }, {}, null, undefined, 'dark', ['dark']]) {
      expect(themeSourceOf(p)).toBe('system');
    }
  });
});
