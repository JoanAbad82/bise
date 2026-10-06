import { describe, expect, it } from 'vitest';
import { cleanLine, cleanPath, openPlan } from './openpath';

const has =
  (...schemes: string[]) =>
  (s: string): boolean =>
    schemes.includes(s);

describe('cleanPath', () => {
  it('keeps absolute paths, normalized', () => {
    expect(cleanPath('/w/src/a.ts')).toBe('/w/src/a.ts');
    expect(cleanPath('/w//src/./b/../a.ts')).toBe('/w/src/a.ts');
    expect(cleanPath('/')).toBe('/');
  });
  it('refuses relative, empty, NUL, too long and non-strings', () => {
    for (const p of ['a.ts', './a.ts', '~/a.ts', '', '/w/a\0.ts', '/' + 'a'.repeat(5000), 42, null, undefined]) expect(cleanPath(p)).toBeNull();
  });
});

describe('cleanLine', () => {
  it('a positive integer line only', () => {
    expect(cleanLine({ line: 12 })).toBe(12);
    for (const o of [{ line: 0 }, { line: -1 }, { line: 1.5 }, { line: '12' }, {}, null, 'x']) expect(cleanLine(o)).toBeUndefined();
  });
});

describe('openPlan', () => {
  it('his $EDITOR when it opens by URL and is installed, at the line', () => {
    expect(openPlan('/w/a b.ts', 7, { EDITOR: '/usr/local/bin/code --wait' }, has('vscode', 'cursor'))).toEqual({
      how: 'editor',
      url: 'vscode://file/w/a%20b.ts:7',
      path: '/w/a b.ts',
      line: 7,
    });
  });
  it('BISE_EDITOR before VISUAL before EDITOR', () => {
    const env = { BISE_EDITOR: 'zed', VISUAL: 'code', EDITOR: 'cursor' };
    expect(openPlan('/w/a.ts', undefined, env, has('zed', 'vscode', 'cursor'))).toMatchObject({ url: 'zed://file/w/a.ts' });
  });
  it('a terminal editor, or one not installed: the first known editor installed', () => {
    expect(openPlan('/w/a.ts', 3, { EDITOR: 'nvim' }, has('zed', 'vscode'))).toMatchObject({ url: 'vscode://file/w/a.ts:3' });
    expect(openPlan('/w/a.ts', 3, { EDITOR: 'zed' }, has('cursor'))).toMatchObject({ url: 'cursor://file/w/a.ts:3' });
  });
  it('a folder opens in the editor without a line', () => {
    expect(openPlan('/w', undefined, {}, has('cursor'))).toEqual({ how: 'editor', url: 'cursor://file/w', path: '/w' });
  });
  it('no editor bise knows: Finder shows it', () => {
    expect(openPlan('/w/a.ts', 3, { EDITOR: 'vim' }, has())).toEqual({ how: 'finder', path: '/w/a.ts' });
  });
});
