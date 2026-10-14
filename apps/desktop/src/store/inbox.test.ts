import { describe, expect, it } from 'vitest';
import type { InboxRecord } from '@/proto';
import { Store } from './store';

const P = 'acme-1a2b3c4d';
const rec = (card: number, state: 'answered' | 'withdrawn' = 'answered'): InboxRecord => ({
  card, project: P, asker: 'perf', kind: 'question', question: `q${String(card)}`, options: [], state, asked_ms: card, at_ms: card, line2: '',
});

describe("the store's inbox history (inbox_history, inbox_recorded)", () => {
  it('keeps a first page, adds an older one after it, and a new record on top with the totals', () => {
    const s = new Store();
    s.apply({ ev: 'inbox_history', project: P, items: [rec(9), rec(8)], more: true, answered: 3, withdrawn: 0 });
    s.apply({ ev: 'inbox_history', project: P, items: [rec(4)], more: false, answered: 3, withdrawn: 0 });
    expect(s.inbox(P)?.items.map((r) => r.card)).toEqual([9, 8, 4]);
    expect(s.inbox(P)?.more).toBe(false);
    s.apply({ ev: 'inbox_recorded', project: P, record: rec(10, 'withdrawn') });
    expect(s.inbox(P)?.items.map((r) => r.card)).toEqual([10, 9, 8, 4]);
    expect([s.inbox(P)?.answered, s.inbox(P)?.withdrawn]).toEqual([3, 1]);
    // the screen asked again (a fresh first page): it replaces
    s.apply({ ev: 'inbox_history', project: P, items: [rec(10, 'withdrawn'), rec(9)], more: true, answered: 3, withdrawn: 1 });
    expect(s.inbox(P)?.items.map((r) => r.card)).toEqual([10, 9]);
  });
});
