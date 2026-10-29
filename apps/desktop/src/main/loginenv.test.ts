import { describe, expect, it } from 'vitest';
import { loginShell, MARK, mergeLoginEnv, parseEnv0, wantsLoginEnv } from './loginenv';

const body = (pairs: string[]): string => `${pairs.join('\0')}\0`;

describe('parseEnv0', () => {
  it("reads env -0 between the marks, whatever his rc files print around it", () => {
    const out = `Welcome to zsh!\n${MARK}${body(['PATH=/opt/homebrew/bin:/usr/bin', 'MISTRAL_API_KEY=k', 'MULTI=a\nb', 'EMPTY='])}${MARK}bye\n`;
    expect(parseEnv0(out)).toEqual({ PATH: '/opt/homebrew/bin:/usr/bin', MISTRAL_API_KEY: 'k', MULTI: 'a\nb', EMPTY: '' });
  });
  it('null without both marks or without a PATH; junk names dropped', () => {
    expect(parseEnv0(`${MARK}${body(['PATH=/bin'])}`)).toBeNull();
    expect(parseEnv0(`${MARK}${body(['HOME=/h'])}${MARK}`)).toBeNull();
    expect(parseEnv0(`${MARK}${body(['PATH=/bin', '=x', '1BAD=y', 'with space=z'])}${MARK}`)).toEqual({ PATH: '/bin' });
  });
});

describe('mergeLoginEnv', () => {
  it("his shell's values over launchd's; the probe's shell vars and the app's own settings kept out", () => {
    const current = { PATH: '/usr/bin:/bin', HOME: '/Users/g', BISE_DESKTOP_WORKSPACE: '/w', __CFBundleIdentifier: 'dev.bise' };
    const shell = { PATH: '/opt/homebrew/bin:/usr/bin', OPENAI_API_KEY: 'k', PWD: '/Users/g', SHLVL: '2', _: '/usr/bin/env', TERM: 'dumb', BISE_DESKTOP_WORKSPACE: '/other', ELECTRON_RUN_AS_NODE: '1' };
    expect(mergeLoginEnv(current, shell)).toEqual({ PATH: '/opt/homebrew/bin:/usr/bin', HOME: '/Users/g', BISE_DESKTOP_WORKSPACE: '/w', __CFBundleIdentifier: 'dev.bise', OPENAI_API_KEY: 'k' });
  });
});

describe('wantsLoginEnv and loginShell', () => {
  it('never in a test run, under a jail or on Windows', () => {
    expect(wantsLoginEnv('darwin', false, {})).toBe(true);
    expect(wantsLoginEnv('darwin', true, {})).toBe(false);
    expect(wantsLoginEnv('darwin', false, { BISE_TEST_HOME: '/t' })).toBe(false);
    expect(wantsLoginEnv('win32', false, {})).toBe(false);
  });
  it('$SHELL when absolute, else zsh', () => {
    expect(loginShell({ SHELL: '/opt/homebrew/bin/fish' })).toBe('/opt/homebrew/bin/fish');
    expect(loginShell({ SHELL: 'zsh' })).toBe('/bin/zsh');
    expect(loginShell({})).toBe('/bin/zsh');
  });
});
