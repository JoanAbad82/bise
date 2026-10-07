// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { applyTheme, themeOf } from '.';

afterEach(() => {
  applyTheme(document.documentElement, null);
});

describe('his theme pref (lead m_10785)', () => {
  it("'light' and 'dark' pick that theme", () => {
    expect(themeOf({ theme: 'light' })).toBe('light');
    expect(themeOf({ theme: 'dark' })).toBe('dark');
  });

  it("'system', the old 'auto', an unknown word, no pref or no prefs yet follow the system", () => {
    expect(themeOf({ theme: 'system' })).toBeNull();
    expect(themeOf({ theme: 'auto' })).toBeNull();
    expect(themeOf({ theme: 'sepia' })).toBeNull();
    expect(themeOf({ theme: 3 })).toBeNull();
    expect(themeOf({})).toBeNull();
    expect(themeOf(null)).toBeNull();
    expect(themeOf(['light'])).toBeNull();
  });

  it('applies on the root: the attribute the tokens switch on and the color-scheme; system clears both', () => {
    const root = document.documentElement;
    applyTheme(root, 'light');
    expect(root.getAttribute('data-theme')).toBe('light');
    expect(root.style.getPropertyValue('color-scheme')).toBe('light');
    applyTheme(root, 'dark');
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(root.style.getPropertyValue('color-scheme')).toBe('dark');
    applyTheme(root, null);
    expect(root.hasAttribute('data-theme')).toBe(false);
    expect(root.style.getPropertyValue('color-scheme')).toBe('');
  });
});
