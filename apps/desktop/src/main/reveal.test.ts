import { describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { allowedPath, projectRoots, realLookable } from './reveal';

const roots = ['/Users/camille', '/Volumes/work/shop'];

describe('allowedPath (quickLook / showInFinder, lead m_11947)', () => {
  it('a file under his home or a project folder, resolved', () => {
    expect(allowedPath('/Users/camille/bise/pages/plan.png', roots)).toBe('/Users/camille/bise/pages/plan.png');
    expect(allowedPath('/Volumes/work/shop/out/report.pdf', roots)).toBe('/Volumes/work/shop/out/report.pdf');
    expect(allowedPath('/Users/camille/a/../b.txt', roots)).toBe('/Users/camille/b.txt');
  });
  it('anything else is refused: outside, an escape, a sibling prefix, relative, junk', () => {
    expect(allowedPath('/etc/hosts', roots)).toBeNull();
    expect(allowedPath('/Users/camille/../other/x', roots)).toBeNull();
    expect(allowedPath('/Users/camilleX/x', roots)).toBeNull();
    expect(allowedPath('bise/x.png', roots)).toBeNull();
    expect(allowedPath('', roots)).toBeNull();
    expect(allowedPath('/Users/camille/x\0y', roots)).toBeNull();
    expect(allowedPath(42, roots)).toBeNull();
    expect(allowedPath('/Users/camille/x', [])).toBeNull();
  });
});

describe('projectRoots', () => {
  it("a projects event's absolute paths; other events: null", () => {
    expect(projectRoots({ ev: 'projects', projects: [{ path: '/a' }, { path: 'rel' }, { name: 'x' }, null] })).toEqual(['/a']);
    expect(projectRoots({ ev: 'prefs', prefs: {} })).toBeNull();
  });
});

describe('realLookable (art-thumbs reads, architect m_39772)', () => {
  it("compares realpaths: a symlink in a project to a file outside it is refused, one inside kept", () => {
    const d = realpathSync(mkdtempSync(join(tmpdir(), 'reallook-')));
    const proj = join(d, 'proj');
    const out = join(d, 'out');
    mkdirSync(proj);
    mkdirSync(out);
    writeFileSync(join(out, 'secret.txt'), 's');
    writeFileSync(join(proj, 'plan.md'), 'p');
    symlinkSync(join(out, 'secret.txt'), join(proj, 'leak.txt'));
    symlinkSync(join(proj, 'plan.md'), join(proj, 'alias.md'));
    expect(realLookable(join(proj, 'plan.md'), [proj])).toBe(join(proj, 'plan.md'));
    expect(realLookable(join(proj, 'alias.md'), [proj])).toBe(join(proj, 'plan.md'));
    expect(realLookable(join(proj, 'leak.txt'), [proj])).toBeNull();
    expect(realLookable(join(proj, 'none.md'), [proj])).toBeNull();
    // a root that is itself a symlink still holds its files
    symlinkSync(proj, join(d, 'link'));
    expect(realLookable(join(d, 'link', 'plan.md'), [join(d, 'link')])).toBe(join(proj, 'plan.md'));
  });
});
