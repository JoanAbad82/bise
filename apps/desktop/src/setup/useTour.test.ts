// The demo tour's holder (L25): the snapshot read from the store's rows, and one tour per project
// that observe() moves once per new snapshot, whichever screen saw it.
import { afterEach, describe, expect, it } from 'vitest';
import type { Agent, Card } from '@/proto';
import { cardOf, focusOf, membersOf, observeTour, resetTours, sentTour, snapOf, tipNow } from './useTour';

afterEach(resetTours);

const ag = (name: string, over: Partial<Agent> = {}): Agent => ({ name, dir: name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1, waits: 0, ...over });
const card = (id: number, agent: string, rank: number, since_ms = 1): Card => ({ id, project: 'p', kind: 'question', agent, question: 'q?', options: [], urgent: false, since_ms, rank });

const team = [ag('main'), ag('fix-login', { purpose: 'fix the login' }), ag('designer', { purpose: 'bise demo: the designer' }), ag('pm', { purpose: 'Bise demo: the pm' })];
const nums = new Map([['main', 0], ['fix-login', 1], ['designer', 2], ['pm', 3]]);

describe('the demo tour holder', () => {
  it('sees the demo agents only, in the hub order, with their ⌥ numbers; an archived one has none', () => {
    expect(membersOf(team, nums)).toEqual([
      { name: 'designer', number: 2, archived: false },
      { name: 'pm', number: 3, archived: false },
    ]);
    expect(membersOf([...team.slice(0, 3), ag('pm', { purpose: 'bise demo', archived: true })], nums).at(-1)).toEqual({ name: 'pm', number: null, archived: true });
  });

  it("the focus is the thread in view for this project, else main's", () => {
    expect(focusOf({ screen: 'thread', project: 'p', agent: 'pm' }, 'p')).toBe('pm');
    expect(focusOf({ screen: 'thread', project: 'q', agent: 'pm' }, 'p')).toBe('main');
    expect(focusOf({ screen: 'agents', project: 'p' }, 'p')).toBe('main');
  });

  it("the card is the inbox's first one (rank, then oldest)", () => {
    expect(cardOf([])).toBeNull();
    expect(cardOf([card(1, 'designer', 3), card(2, 'pm', 0, 5)])).toBe('pm');
  });

  it('walks start -> inside -> back, one observe per new snapshot, his send ends a tip', () => {
    const main = { screen: 'thread', project: 'p', agent: 'main' } as const;
    observeTour('p', snapOf([ag('main')], nums, main, 'p', [], false));
    const s1 = snapOf(team, nums, main, 'p', [], false);
    observeTour('p', s1);
    // a second screen sees the same snapshot: nothing moves twice
    observeTour('p', s1);
    expect(tipNow('p', s1)).toBe('start');
    // another project has its own tour
    expect(tipNow('q', s1)).toBeNull();
    const s2 = snapOf(team, nums, { screen: 'thread', project: 'p', agent: 'designer' }, 'p', [], false);
    observeTour('p', s2);
    expect(tipNow('p', s2)).toBe('inside');
    sentTour('p', s2);
    expect(tipNow('p', s2)).toBeNull();
  });

  it('a window opened during a demo shows no tip', () => {
    const s = snapOf(team, nums, { screen: 'bise' }, 'p', [], false);
    observeTour('p', s);
    observeTour('p', { ...s, focus: 'designer' });
    expect(tipNow('p', s)).toBeNull();
  });
});
