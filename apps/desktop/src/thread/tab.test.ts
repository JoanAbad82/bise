import { describe, expect, it } from 'vitest';
import { answerFit, answerHead, contextOf, folderName, pinkState, ringTip, tabFit, tabPlace, wordCut, worktreeName } from './tab';

describe("the composer's one pink state (composer-target A, art-target, agent-target)", () => {
  const base = { answer: null, aboutPink: undefined, about: false, agent: 'perf', voiceTyping: false, otherTip: (a: string) => `to ${a}, not bise` };
  it('is pink, with its place and context, when his words go to an agent that is not main', () => {
    expect(pinkState(base)).toEqual({ pink: true, tip: 'to perf, not bise', bare: false, whole: false, quiet: true });
  });
  it("main stays plain, and voice typing (as art-target)", () => {
    expect(pinkState({ ...base, agent: 'main' }).pink).toBe(false);
    expect(pinkState({ ...base, voiceTyping: true }).pink).toBe(false);
  });
  it("an open artifact decides by its maker alone: its pink bare and whole, else plain (one not listed yet, main's)", () => {
    expect(pinkState({ ...base, about: true, aboutPink: 'tip' })).toEqual({ pink: true, tip: 'tip', bare: true, whole: true, quiet: false });
    expect(pinkState({ ...base, about: true })).toEqual({ pink: false, tip: undefined, bare: false, whole: false, quiet: false });
  });
  it("an open item wins: a question pink with its tip, a closed one or an approval plain, the tab bare", () => {
    expect(pinkState({ ...base, answer: { tip: 'q' }, aboutPink: 'tip' })).toEqual({ pink: true, tip: 'q', bare: true, whole: false, quiet: false });
    expect(pinkState({ ...base, answer: { message: true } })).toMatchObject({ pink: false, bare: true });
    expect(pinkState({ ...base, answer: { closed: true }, agent: 'main' })).toMatchObject({ pink: false, bare: true });
  });
});

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

describe("the answering tab at a narrow width (composer-target A, designer m_26531)", () => {
  const w = (s: string) => s.length * 10;
  const label = '↳ answering search · which size system…';
  const end = 200; // 'esc to bise instead' and its gap
  it("its head is the label's first part, never cut", () => {
    expect(answerHead(label)).toBe('↳ answering search');
    expect(answerHead('↳ answering perf · telemetry · which bench?')).toBe('↳ answering perf');
  });
  it('both whole when they fit', () => {
    expect(answerFit(label, 10_000, end, w)).toEqual({ label, end: true });
  });
  it('the question goes first, after a whole word, the end stays', () => {
    expect(answerFit(label, 330 + end, end, w)).toEqual({ label: '↳ answering search · which size…', end: true });
    expect(answerFit(label, 190 + end, end, w)).toEqual({ label: '↳ answering search…', end: true });
  });
  it("then the end; '↳ answering search' never goes", () => {
    expect(answerFit(label, 270, end, w)).toEqual({ label: '↳ answering search · which…', end: false });
    expect(answerFit(label, 190, end, w)).toEqual({ label: '↳ answering search…', end: false });
    expect(answerFit(label, 60, end, w)).toEqual({ label: '↳ answering search', end: false });
  });
  it("an open artifact's '· about “…”' shows whole or goes whole, never 'about…'; then the end (designer m_27021)", () => {
    const about = '↳ to perf · about “product page”'; // 32 chars, head 9
    expect(answerFit(about, 320 + end, end, w, true)).toEqual({ label: about, end: true });
    expect(answerFit(about, 310 + end, end, w, true)).toEqual({ label: '↳ to perf', end: true });
    expect(answerFit(about, 90 + end, end, w, true)).toEqual({ label: '↳ to perf', end: true });
    expect(answerFit(about, 89 + end, end, w, true)).toEqual({ label: '↳ to perf', end: false });
  });
});

describe("the tab's context ring (designer m_24404 touch 4)", () => {
  it("reads the hub's words, named or not", () => {
    expect(contextOf('42k · 17%')).toEqual({ tokens: '42k', pct: 17 });
    expect(contextOf('context 263k · 26%')).toEqual({ tokens: '263k', pct: 26 });
    expect(contextOf('')).toBeNull();
    expect(contextOf(undefined)).toBeNull();
    expect(contextOf('lots')).toBeNull();
  });
  it('its tip says what the ring means', () => {
    expect(ringTip('perf', { tokens: '42k', pct: 17 })).toBe("17% of perf's context used · 42k tokens · compacts at 90%");
  });
});
