import { describe, expect, it } from 'vitest';
import type { Entry, EntryCard } from '@/proto';
import { ANSWER_PAGES, answerDone, answeredFromWords, answerPos, approvalTarget, cardTarget, escGoesBack, openAnswer, pendingAnswer, revealStep } from './answerlink';
import { answerLinkTitle } from './rows-cards';
import { rowWhole } from './ThreadList';

const card = (o: Partial<EntryCard>): EntryCard => ({ id: 7, question: 'comment lui donner accès ?', options: [], answered: true, ...o });
const entry = (pos: number, o: Partial<Entry>): Entry => ({ pos, at_ms: 0, kind: 'approval', to_you: false, text: '', ...o });

describe('answered-link: where a row goes', () => {
  it("an answered card: its asker's thread; an older hub's card (no @agent): this thread's own; an open one: none", () => {
    expect(cardTarget('shop', 'main', card({ agent: 'epargne-offre' }))).toEqual({ project: 'shop', agent: 'epargne-offre', card: 7 });
    expect(cardTarget('shop', 'main', card({}))).toEqual({ project: 'shop', agent: 'main', card: 7 });
    expect(cardTarget('shop', 'main', card({ answered: false, agent: 'docs' }))).toBeNull();
  });

  it("a 'you answered docs' row: docs' thread; in docs' own thread, a gate's approval, an older hub's row (no to): none", () => {
    const e = entry(4, { approval: { ok: true, text: 'you answered docs', card: 7, to: 'docs' } });
    expect(approvalTarget('shop', 'main', e)).toEqual({ project: 'shop', agent: 'docs', card: 7 });
    expect(approvalTarget('shop', 'docs', e)).toBeNull();
    expect(approvalTarget('shop', 'main', entry(4, { approval: { ok: true, text: 'you allowed perf' } }))).toBeNull();
    expect(approvalTarget('shop', 'main', entry(4, { approval: { ok: true, text: 'you answered docs', card: 7 } }))).toBeNull();
  });

  it("the line under his answer: 'answered from <the thread he was in> · time', its tip whole; made here: none", () => {
    const name = (p: string) => (p === 'ts' ? 'ts-pattern' : p);
    const here = { project: 'ts', agent: 'main' };
    expect(answeredFromWords({ project: 'home', agent: 'main' }, here, 'home', name, '09:55')).toEqual({ words: 'answered from bise · 09:55', tip: "you answered this from bise's thread at 09:55" });
    expect(answeredFromWords({ project: 'shop', agent: 'main' }, here, 'home', name, '09:55')?.words).toBe('answered from shop · 09:55');
    expect(answeredFromWords({ project: 'shop', agent: 'docs' }, here, 'home', name, '09:55')?.words).toBe('answered from docs · 09:55');
    expect(answeredFromWords('inbox', here, 'home', name, '09:55')).toEqual({ words: 'answered from the inbox screen · 09:55', tip: 'you answered this from the inbox screen at 09:55' });
    expect(answeredFromWords({ project: 'ts', agent: 'main' }, here, 'home', name, '09:55')).toBeNull();
  });

  it('its tooltip says where it goes', () => {
    expect(answerLinkTitle({ project: 'shop', agent: 'perf', card: 1 }, 'main')).toBe("open it in perf's thread");
    expect(answerLinkTitle({ project: 'shop', agent: 'main', card: 1 }, 'main')).toBe('show your answer');
  });
});

describe('answered-link: finding the answer', () => {
  it('the newest approval for that card, by its typed card, never by words', () => {
    const es = new Map<number, Entry>([
      [1, entry(1, { approval: { ok: true, text: 'you answered docs: 1', card: 7 } })],
      [2, entry(2, { kind: 'agent', text: 'card #7' })],
      [3, entry(3, { approval: { ok: true, text: 'you answered docs: 2', card: 8 } })],
      [5, entry(5, { approval: { ok: true, text: 'you answered docs: again', card: 7 } })],
    ]);
    expect(answerPos([1, 2, 3, 5], (p) => es.get(p), 7)).toBe(5);
    expect(answerPos([1, 2, 3], (p) => es.get(p), 7)).toBe(1);
    expect(answerPos([2, 3], (p) => es.get(p), 7)).toBeNull();
  });

  it('found: shown; not loaded or a page on its way: wait; older pages up to the bound; then the miss line', () => {
    const s = { loaded: true, found: null, more: true, asked: 0, waiting: false };
    expect(revealStep({ ...s, found: 12 })).toEqual({ kind: 'show', pos: 12 });
    expect(revealStep({ ...s, loaded: false })).toEqual({ kind: 'wait' });
    expect(revealStep({ ...s, waiting: true })).toEqual({ kind: 'wait' });
    expect(revealStep(s)).toEqual({ kind: 'older' });
    expect(revealStep({ ...s, asked: ANSWER_PAGES - 1 })).toEqual({ kind: 'older' });
    expect(revealStep({ ...s, asked: ANSWER_PAGES })).toEqual({ kind: 'miss' });
    expect(revealStep({ ...s, more: false })).toEqual({ kind: 'miss' });
  });

  it('a row whole in the view stays put; cut at either edge, it scrolls', () => {
    const view = { top: 100, bottom: 500 };
    expect(rowWhole({ top: 120, bottom: 200 }, view)).toBe(true);
    expect(rowWhole({ top: 80, bottom: 200 }, view)).toBe(false);
    expect(rowWhole({ top: 450, bottom: 520 }, view)).toBe(false);
  });
});

describe('answered-link: the jump', () => {
  it("goes to the asker's thread as a history step and pends until that thread takes it", () => {
    const went: unknown[] = [];
    const at = { project: 'shop', agent: 'docs', card: 7 };
    openAnswer({ go: (r) => went.push(r) }, at);
    expect(went).toEqual([{ screen: 'thread', project: 'shop', agent: 'docs' }]);
    expect(pendingAnswer()).toBe(at);
    // another jump's end doesn't drop this one
    answerDone({ ...at });
    expect(pendingAnswer()).toBe(at);
    answerDone(at);
    expect(pendingAnswer()).toBeNull();
    // there, esc goes back where he was; anywhere else, up as before
    expect(escGoesBack({ screen: 'thread', project: 'shop', agent: 'docs' })).toBe(true);
    expect(escGoesBack({ screen: 'thread', project: 'shop', agent: 'main' })).toBe(false);
  });
});
