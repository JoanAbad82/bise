import { describe, expect, it } from 'vitest';
import type { Card } from '@/proto';
import { hub_ev } from '@/proto/fixtures.gen';
import { cardKey, sortCards } from './order';
import { current, digitWords, pickWaits, prune, START, step, takesWords, visible, withConfirmOptions, type InboxState, type Key } from './model';

const card = (id: number, kind: string, rank: number | undefined, since_ms: number, project = 'acme', extra: Partial<Card> = {}): Card => ({
  id,
  project,
  kind,
  agent: 'perf',
  question: `q${String(id)}`,
  options: [
    { n: 1, label: 'yes' },
    { n: 2, label: 'no' },
  ],
  urgent: false,
  since_ms,
  ...(rank === undefined ? {} : { rank }),
  ...extra,
});

/** The hub fixture's cards (a question, a confirm, a question with a page). */
const fixture = (): Card[] => {
  const ev = hub_ev.find((e) => e.ev === 'cards');
  if (ev?.ev !== 'cards') throw new Error('no cards fixture');
  return ev.cards;
};

describe('order', () => {
  it("is the TUI's on one hub: the approval first, then the rank-1 items (questions, the sign-in) by id", () => {
    expect(sortCards(fixture()).map((c) => c.id)).toEqual([10, 9, 11, 14]);
  });

  it('ranks on the hub-sent rank, then the oldest, across projects', () => {
    const cs = [card(3, 'done', 6, 10, 'b'), card(1, 'question', 1, 30, 'a'), card(7, 'question', 1, 20, 'b'), card(2, 'confirm', 0, 99, 'a')];
    expect(sortCards(cs).map(cardKey)).toEqual(['a-2', 'b-7', 'a-1', 'b-3']);
  });

  it("a card from an older hub without rank sorts as an unknown kind (done's)", () => {
    const cs = [card(1, 'mystery', undefined, 1), card(2, 'failed', 3, 2), card(3, 'setup', 7, 0)];
    expect(sortCards(cs).map((c) => c.id)).toEqual([2, 1, 3]);
  });
});

describe('keys', () => {
  const list = sortCards([card(1, 'confirm', 0, 1, 'a', { approval: true }), card(2, 'question', 1, 2), card(3, 'done', 6, 3)]);
  const run = (keys: Key[], text = '', s0: InboxState = START) => {
    let s = s0;
    const acts = [];
    for (const k of keys) {
      const r = step(s, visible(list, s), k, text);
      s = r.s;
      if (r.act) acts.push(r.act);
    }
    return { s, acts };
  };

  it('opens on the top item with no option on: a reflex ⏎ never answers', () => {
    const { s, acts } = run([{ k: 'enter' }]);
    expect(current(visible(list, s), s)?.id).toBe(1);
    expect(acts).toEqual([]);
  });

  it('←→ walk the options, ⏎ picks the one on', () => {
    const { acts } = run([{ k: 'right' }, { k: 'right' }, { k: 'enter' }]);
    expect(acts).toEqual([{ t: 'answer', project: 'a', card: 1, reply: '2' }]);
  });

  it('a digit picks at once; the next item becomes current and the answered one leaves', () => {
    const { s, acts } = run([{ k: 'digit', n: 1 }]);
    expect(acts).toEqual([{ t: 'answer', project: 'a', card: 1, reply: '1' }]);
    const v = visible(list, s);
    expect(v.map((c) => c.id)).toEqual([2, 3]);
    expect(current(v, s)?.id).toBe(2);
  });

  it('a digit that is no option does nothing; with text, digits and arrows belong to the text', () => {
    expect(run([{ k: 'digit', n: 5 }]).acts).toEqual([]);
    const { s, acts } = run([{ k: 'down' }, { k: 'digit', n: 1 }], 'a 1');
    expect(acts).toEqual([]);
    expect(s.cur).toBeNull();
  });

  it('typed words answer a question, never an approval', () => {
    expect(run([{ k: 'enter' }], ' cold, then warm ').acts).toEqual([]);
    const { acts } = run([{ k: 'down' }, { k: 'enter' }], '');
    expect(acts).toEqual([]);
    const words = step({ ...START, cur: 'acme-2' }, visible(list, START), { k: 'enter' }, ' cold, then warm ');
    expect(words.act).toEqual({ t: 'answer', project: 'acme', card: 2, reply: 'cold, then warm' });
  });

  it('ctrl+n / ctrl+p walk the items with words in the field too (bar I3, the TUI card view)', () => {
    expect(run([{ k: 'next' }], 'a draft').s.cur).toBe('acme-2');
    expect(run([{ k: 'next' }, { k: 'next' }, { k: 'prev' }], 'a draft').s.cur).toBe('acme-2');
    expect(run([{ k: 'down' }], 'a draft').s.cur).toBeNull();
  });

  it("R19: ctrl+n / ctrl+p wrap around as the TUI's step(); ↑↓ stop at the ends", () => {
    const v = visible(list, START);
    const a = v[0];
    const z = v.at(-1);
    if (a === undefined || z === undefined) throw new Error('the fixture has items');
    const first = cardKey(a);
    const last = cardKey(z);
    expect(run(Array.from({ length: v.length + 2 }, () => ({ k: 'down' as const }))).s.cur).toBe(last);
    expect(run(Array.from({ length: v.length }, () => ({ k: 'next' as const }))).s.cur).toBe(first);
    expect(run([{ k: 'prev' }]).s.cur).toBe(last);
  });

  it('↑↓ move between items and stop at the ends; done takes ⏎ with no words', () => {
    const { s, acts } = run([{ k: 'down' }, { k: 'down' }, { k: 'down' }, { k: 'enter' }]);
    expect(acts).toEqual([{ t: 'answer', project: 'acme', card: 3, reply: '' }]);
    expect(current(visible(list, s), s)?.id).toBe(2);
  });

  it('close leaves without an answer; esc goes back', () => {
    expect(run([{ k: 'close' }]).acts).toEqual([{ t: 'close', project: 'a', card: 1 }]);
    expect(run([{ k: 'esc' }]).acts).toEqual([{ t: 'back' }]);
  });

  it('an acted-on item stays out until the core drops it, then is forgotten', () => {
    const { s } = run([{ k: 'digit', n: 1 }]);
    expect(prune(s, list)).toBe(s);
    const later = prune(s, list.slice(1));
    expect(later.gone.size).toBe(0);
  });
});

describe("a gated call (the hub's confirm card) gets the TUI's options (qa-flows O.1 on the real core)", () => {
  const gate = (question: string) =>
    ({ id: 4, project: 'shop-0feaf4e7', kind: 'confirm', rank: 0, agent: 'main', question, options: [], urgent: true, since_ms: 1 }) as Card;
  it('a hard rule: allow (1) and no (3), answered by an option', () => {
    const c = withConfirmOptions(gate('wants to run\n| git push --force /x HEAD:y\nreason: it rewrites the history of y. this one always asks.'));
    expect(c.options).toEqual([
      { n: 1, label: 'allow' },
      { n: 3, label: 'no' },
    ]);
    expect(c.approval).toBe(true);
  });
  it('rules named: always allow <rules> here is 2; a sandbox rerun says so', () => {
    expect(withConfirmOptions(gate('wants to run\n| make\nalways: make')).options.map((o) => o.label)).toEqual(['allow', 'always allow make here', 'no']);
    expect(withConfirmOptions(gate('wants to run it outside the sandbox\n| make\nalways: make')).options.map((o) => o.label)).toEqual([
      'run it again without the sandbox',
      'always run it outside the sandbox here',
      'no',
    ]);
  });
  it('a card with options, or another kind, is left as is', () => {
    const q = { ...gate('which?'), kind: 'question', options: [{ n: 1, label: 'a' }] };
    expect(withConfirmOptions(q)).toBe(q);
    const withOpts = { ...gate('wants to run\n| ls'), options: [{ n: 1, label: 'yes' }] };
    expect(withConfirmOptions(withOpts)).toBe(withOpts);
  });
});

describe('which items his words answer (ambient m_8773, the TUI and hub choice_kind)', () => {
  const two = [{ n: 1, label: 'merge' }, { n: 2, label: 'not yet' }];
  it('a question takes words; an approval and every choice item only their options', () => {
    expect(takesWords({ kind: 'question' })).toBe(true);
    expect(takesWords({ kind: 'question', approval: true })).toBe(false);
    for (const kind of ['merge', 'feature_try', 'feature_merge', 'update', 'signin']) expect(takesWords({ kind }), kind).toBe(false);
  });
  it("a docked item only options decide says what it waits for; a question says nothing", () => {
    expect(pickWaits({ kind: 'merge', options: two })).toBe('the merge waits for 1 or 2');
    expect(pickWaits({ kind: 'question', approval: true, options: two })).toBe('the approval waits for 1 or 2');
    expect(pickWaits({ kind: 'feature_merge', options: [...two, { n: 3, label: 'drop' }] })).toBe('the merge waits for 1 to 3');
    expect(pickWaits({ kind: 'question', options: two })).toBeNull();
    expect(digitWords(1)).toBe('1');
  });
});
