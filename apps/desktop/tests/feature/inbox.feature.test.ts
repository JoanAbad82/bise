// The inbox, in his words (fast-try p5): typed inputs in, what the inbox shows and the commands
// sent out. Nothing else is read.
import { describe, expect, it } from 'vitest';
import { answer, card, cardAnswered, cardRefused, close, open, projects, retry, row } from './inputs';
import { feature } from './run';

const BISE = 'bise-home-00000000';
const ACME = 'acme-1a2b3c4d';
const which = card({ project: ACME, id: 9, agent: 'perf', question: 'which bench?' });
const home = row({ project: BISE, name: 'bise', home: true });
const acme = (...cards: (typeof which)[]) => row({ project: ACME, name: 'acme', cards, waits: cards.length });
/** The ids the inbox lists, as `project-id`. */
const ids = (cards: readonly { project: string; id: number }[]): string[] => cards.map((c) => `${c.project}-${String(c.id)}`);

describe('the inbox', () => {
  it('a card answered from another project never comes back, through a switch and a reload, while the hub still lists it', () => {
    const w = feature().given(projects(home, acme(which)));
    expect(ids(w.view.inbox())).toEqual([`${ACME}-9`]);

    w.does(answer(ACME, 9, '1', { project: BISE, agent: 'main' }));
    expect(ids(w.view.inbox())).toEqual([]);
    expect(w.sent()).toContainEqual({ cmd: 'answer', project: ACME, card: 9, reply: '1' });

    // the hub's rows lag behind his answer: still listed there, never here
    w.given(projects(home, acme(which)));
    expect(ids(w.view.inbox())).toEqual([]);
    w.does(open(ACME), open(BISE));
    expect(ids(w.view.inbox())).toEqual([]);
    w.reload();
    expect(ids(w.view.inbox())).toEqual([]);

    // the hub drops it and says it took the answer: gone for good
    w.given(projects(home, acme()), cardAnswered(ACME, 9));
    expect(ids(w.view.inbox())).toEqual([]);
    w.reload();
    expect(ids(w.view.inbox())).toEqual([]);
  });

  it('a card the hub keeps open after his answer (it took the answer, its rows still list it) shows again', () => {
    const w = feature().given(projects(home, acme(which)));
    w.does(answer(ACME, 9, '1'));
    w.given(cardAnswered(ACME, 9), projects(home, acme(which)));
    expect(ids(w.view.inbox())).toEqual([`${ACME}-9`]);
  });

  it('a card closed without an answer leaves at once and the close goes to the hub', () => {
    const w = feature().given(projects(home, acme(which)));
    w.does(close(ACME, 9));
    expect(ids(w.view.inbox())).toEqual([]);
    expect(w.sent()).toContainEqual({ cmd: 'close', project: ACME, card: 9 });
  });

  it('a refused answer shows the card again, and try again sends the same words', () => {
    const w = feature().given(projects(home, acme(which)));
    w.does(answer(ACME, 9, 'the cold one'));
    w.given(cardRefused(ACME, 9, 'the card is gone'));
    expect(ids(w.view.inbox())).toEqual([`${ACME}-9`]);

    w.does(retry(ACME, 9));
    expect(ids(w.view.inbox())).toEqual([]);
    expect(w.sent().filter((c) => c.cmd === 'answer')).toEqual([
      { cmd: 'answer', project: ACME, card: 9, reply: 'the cold one' },
      { cmd: 'answer', project: ACME, card: 9, reply: 'the cold one' },
    ]);
  });
});
