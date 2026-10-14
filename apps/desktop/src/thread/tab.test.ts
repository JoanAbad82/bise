import { describe, expect, it } from 'vitest';
import { folderName, tabFit, tabPlace, wordCut, worktreeName } from './tab';

describe("the composer's tab (designer's composer-strip A)", () => {
  const w = { gap: 16, label: 60, branch: 80, project: 90, context: 120 };
  it('shows every item when they fit', () => {
    expect(tabFit({ ...w, avail: 60 + 80 + 90 + 120 + 3 * 16 })).toEqual({ branch: true, project: true, context: true });
  });
  it('drops whole items: the project first, then the context, then the branch; the label stays', () => {
    expect(tabFit({ ...w, avail: 60 + 80 + 90 + 120 + 3 * 16 - 1 })).toEqual({ branch: true, project: false, context: true });
    expect(tabFit({ ...w, avail: 60 + 80 + 120 + 2 * 16 - 1 })).toEqual({ branch: true, project: false, context: false });
    expect(tabFit({ ...w, avail: 60 + 80 + 16 - 1 })).toEqual({ branch: false, project: false, context: false });
    expect(tabFit({ ...w, avail: 10 })).toEqual({ branch: false, project: false, context: false });
  });
  it('an item that is not there takes no room and no gap', () => {
    expect(tabFit({ gap: 16, label: 60, branch: 80, project: 0, context: 120, avail: 60 + 80 + 120 + 2 * 16 })).toEqual({ branch: true, project: true, context: true });
  });
  it("says where it works by its folder's name: a worktree after the ψ, his checkout bare, nothing for bise's own main (his m_24782)", () => {
    const t = (p: string) => p.replace('/Users/g', '~');
    const wt = { path: '/Users/g/.bise/worktrees/harness-3abb2bd8/composer-strip/harness', tip: 'ψ worktree: its own copy of the repo, on sb/composer-strip · ~/.bise/worktrees/harness-3abb2bd8/composer-strip/harness' };
    expect(tabPlace({ branch: 'sb/composer-strip' }, false, wt, '/Users/g/code/harness', t)).toEqual({ name: 'composer-strip', worktree: true, tip: wt.tip });
    expect(tabPlace({ branch: null }, false, undefined, '/Users/g/lab/bend-lab/harness', t)).toEqual({ name: 'harness', worktree: false, tip: 'your own folder: ~/lab/bend-lab/harness' });
    expect(tabPlace({ branch: 'sb/ui', worktree: '/Users/g/.bise/worktrees/h-1/ui/storefront' }, false, undefined, '/p', t)).toEqual({ name: 'ui', worktree: true, tip: 'ψ worktree: ~/.bise/worktrees/h-1/ui/storefront' });
    expect(tabPlace({ branch: 'x' }, true, wt, '/p', t)).toBeUndefined();
    expect(tabPlace(undefined, false, wt, '/p', t)).toBeUndefined();
    expect(worktreeName('/w/x/repo')).toBe('repo');
    expect(folderName('/a/b/harness/')).toBe('harness');
  });

});

describe("the tab's label cut (designer m_24325)", () => {
  const w = (s: string) => s.length * 10;
  const label = 'answering search · which size system should the filter use?';
  it('whole when it fits', () => {
    expect(wordCut(label, 10_000, w)).toBe(label);
  });
  it("after a whole word, with one '…', never mid-word", () => {
    expect(wordCut(label, 300, w)).toBe('answering search · which size…');
    expect(wordCut(label, 290, w)).toBe('answering search · which…');
  });
  it("a cut right after the '·' leaves the '·' out", () => {
    expect(wordCut(label, 200, w)).toBe('answering search…');
  });
  it('not even the first word: the first word and the …', () => {
    expect(wordCut(label, 20, w)).toBe('answering…');
  });
});
