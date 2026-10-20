import { describe, expect, it } from 'vitest';
import type { Pending } from '@/store/types';
import { drawerRows } from './ThreadQueue';

const P = 'shop-ab9f3c3b';
const row = (over: Partial<Pending>): Pending => ({ cid: 1, project: P, agent: 'main', text: 'and the changelog', mode: 'queued', at_ms: 0, state: 'sending', ...over });

describe('drawerRows: the hub queue, then his queued sends it does not list yet', () => {
  it('a queued send on its way, no answer yet: a row of its own, sending', () => {
    expect(drawerRows([], [row({ cid: 3 })])).toEqual([{ id: 3, text: 'and the changelog', extra: '', sending: true }]);
  });
  it('late (the core gave up waiting for the hub): still there', () => {
    expect(drawerRows([], [row({ cid: 3, state: 'late' })])).toHaveLength(1);
  });
  it('answered: the hub queue says where it is, one row, the hub one', () => {
    expect(drawerRows([], [row({ cid: 3, msgId: 41 })])).toEqual([]);
    expect(drawerRows([{ id: 41, text: 'and the changelog' }], [row({ cid: 3, msgId: 41 })])).toEqual([{ id: 41, text: 'and the changelog', extra: '' }]);
  });
  it('the hub queue first (older), his sends after', () => {
    expect(drawerRows([{ id: 7, text: 'first' }], [row({ cid: 9, text: 'then' })]).map((r) => r.text)).toEqual(['first', 'then']);
  });
  it('never a steer, never a failed one (the thread shows that with try again)', () => {
    expect(drawerRows([], [row({ mode: 'now' }), row({ cid: 2, state: 'failed', why: 'no' })])).toEqual([]);
  });
});
