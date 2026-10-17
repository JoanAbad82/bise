// An option the window does itself, in his words (fast-try p4 slice 1d, architect m_29867): the
// hub's row gives an option an act (a merge's '2 open it on GitHub', a drafts card's '1 review');
// picking it opens that, sends nothing, and the item stays. Typed inputs in; the inbox's view, the
// commands sent and the effects run out. Nothing else is read.
import { describe, expect, it } from 'vitest';
import { card, ev, pick, projects, row } from './inputs';
import { feature } from './run';

const ACME = 'acme-1a2b3c4d';
const PR = 'https://github.com/gvergnaud/ts-pattern/pull/384';
const merge = card({
  project: ACME,
  id: 384,
  kind: 'merge',
  agent: 'pattern-error-dx',
  question: '#384 is ready to merge',
  options: [
    { n: 1, label: 'squash and merge' },
    { n: 2, label: 'open it on GitHub', act: { act: 'open', url: PR } },
    { n: 3, label: 'not yet' },
  ],
});
const PAGE = 'http://127.0.0.1:47123/p/issue-15';
const drafts = card({
  project: ACME,
  id: 540,
  question: '4 drafts wait for you',
  options: [
    { n: 1, label: 'review', act: { act: 'open', url: `${PAGE}#m-pr16`, artifact: 'issue-15', at: 'm-pr16' } },
    { n: 2, label: 'send all 4' },
  ],
});
const acme = (...cards: (typeof merge)[]) => row({ project: ACME, name: 'acme', cards, waits: cards.length });
const ids = (cards: readonly { project: string; id: number }[]): string[] => cards.map((c) => `${c.project}-${String(c.id)}`);
const issue15 = ev('artifacts', { project: ACME, items: [{ id: 'issue-15', kind: 'page', title: 'issue #15', agent: 'issue-15', url: PAGE, version: 1, at_ms: 1_791_100_000_000, new: false }] });

describe('an option the window does itself', () => {
  it("a merge card's '2 open it on GitHub' opens the PR in his browser, sends nothing, and the card stays", () => {
    const w = feature().given(projects(acme(merge)));
    w.does(pick(ACME, 384, 2));
    expect(w.sent()).toEqual([]);
    expect(w.effects()).toEqual([{ out: 'fx', fx: { fx: 'openExternal', args: [PR] } }]);
    expect(ids(w.view.inbox())).toEqual([`${ACME}-384`]);

    // its other options answer: the card leaves
    w.does(pick(ACME, 384, 1));
    expect(w.sent()).toContainEqual({ cmd: 'answer', project: ACME, card: 384, reply: '1' });
    expect(ids(w.view.inbox())).toEqual([]);
  });

  it("an option that opens an artifact: its view beside the thread when the project lists it, else its url in his browser", () => {
    const listed = feature().given(projects(acme(drafts)), issue15);
    listed.does(pick(ACME, 540, 1));
    expect(listed.effects()).toEqual([{ out: 'nav', to: { project: ACME, artifact: 'issue-15', at: 'm-pr16' } }]);
    expect(listed.sent()).toEqual([]);
    expect(ids(listed.view.inbox())).toEqual([`${ACME}-540`]);

    const gone = feature().given(projects(acme(drafts)));
    gone.does(pick(ACME, 540, 1));
    expect(gone.effects()).toEqual([{ out: 'fx', fx: { fx: 'openExternal', args: [`${PAGE}#m-pr16`] } }]);
    expect(gone.sent()).toEqual([]);
  });
});
