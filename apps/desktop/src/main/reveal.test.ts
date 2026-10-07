import { describe, expect, it } from 'vitest';
import { allowedPath, projectRoots } from './reveal';

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
