import { describe, expect, it } from 'vitest';
import { configOfPrefs, DEFAULT_CONFIG } from './config';

describe("the helper's config from his prefs", () => {
  it('his excluded apps go to the helper', () => {
    const c = configOfPrefs({ excluded_apps: ['com.apple.MobileSMS', 'com.tinyspeck.slackmacgap'], theme: 'dark' });
    expect(c).toEqual({ cmd: 'config', exclude: ['com.apple.MobileSMS', 'com.tinyspeck.slackmacgap'], right_option: true, meetings: false });
  });

  it('no prefs yet, or junk: the defaults (the helper keeps its built-in floor)', () => {
    expect(configOfPrefs(undefined)).toEqual(DEFAULT_CONFIG);
    expect(configOfPrefs([1])).toEqual(DEFAULT_CONFIG);
    expect(configOfPrefs({ excluded_apps: [1, 'a.b', null] }).exclude).toEqual(['a.b']);
  });

  it('right option and meetings when the prefs carry them', () => {
    const c = configOfPrefs({ right_option: false, quiet: { meetings: true } });
    expect(c.right_option).toBe(false);
    expect(c.meetings).toBe(true);
  });
});
