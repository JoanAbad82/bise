import { describe, expect, it } from 'vitest';
import type { ThumbAnswer, ThumbReq } from '@/shared/api';
import { reqKey, ThumbQueue } from './queue';

const req = (id: string): ThumbReq => ({ how: 'file', src: `/w/${id}.png`, project: 'p', id, v: 1, sig: '0000abcd' });

/** A run whose answers the test releases by hand, recording the order asked. */
function fake() {
  const asked: { id: string; want: boolean }[] = [];
  const open = new Map<string, (a: ThumbAnswer | null) => void>();
  const run = (r: ThumbReq, want: boolean): Promise<ThumbAnswer | null> => {
    asked.push({ id: r.id, want });
    return new Promise((res) => open.set(r.id, res));
  };
  const answer = async (id: string): Promise<void> => {
    open.get(id)?.({ img: `data:${id}` });
    open.delete(id);
    await new Promise((r) => setTimeout(r, 0));
  };
  return { asked, run, answer, open };
}

describe('the thumbnails queue', () => {
  it('asks the cards in view first, a few at once, then the rest one at a time', async () => {
    const f = fake();
    const q = new ThumbQueue(f.run, 2);
    q.fill([req('a'), req('b')]);
    // the fill starts at once when nothing else waits
    expect(f.asked).toEqual([{ id: 'a', want: false }]);
    void q.get(req('v1'), 'view');
    void q.get(req('v2'), 'view');
    void q.get(req('v3'), 'view');
    void q.get(req('n1'), 'near');
    expect(f.asked.map((x) => x.id)).toEqual(['a', 'v1', 'v2']);
    await f.answer('a');
    // two in view still run: the fill's b waits
    expect(f.asked.map((x) => x.id)).toEqual(['a', 'v1', 'v2']);
    await f.answer('v1');
    expect(f.asked.map((x) => x.id)).toEqual(['a', 'v1', 'v2', 'v3']);
    await f.answer('v2');
    await f.answer('v3');
    // then the near one, alone, then the fill
    expect(f.asked.map((x) => x.id)).toEqual(['a', 'v1', 'v2', 'v3', 'n1']);
    await f.answer('n1');
    expect(f.asked.at(-1)).toEqual({ id: 'b', want: false });
  });

  it('keeps the answers asked for, and moves a waiting fill up when a card asks it', async () => {
    const f = fake();
    const q = new ThumbQueue(f.run, 1);
    void q.get(req('x'), 'view');
    q.fill([req('y'), req('z')]);
    const z = q.get(req('z'), 'view');
    await f.answer('x');
    expect(f.asked.map((a) => a.id)).toEqual(['x', 'z']);
    expect(f.asked[1]?.want).toBe(true);
    await f.answer('z');
    await expect(z).resolves.toEqual({ img: 'data:z' });
    expect(q.known(reqKey(req('z')))).toEqual({ img: 'data:z' });
    expect(q.known(reqKey(req('y')))).toBeUndefined();
  });

  it('puts a card that left the view behind the ones in it', async () => {
    const f = fake();
    const q = new ThumbQueue(f.run, 1);
    void q.get(req('busy'), 'view');
    void q.get(req('gone'), 'view');
    void q.get(req('here'), 'view');
    q.lower(req('gone'));
    await f.answer('busy');
    expect(f.asked.map((a) => a.id)).toEqual(['busy', 'here']);
  });

  it('forgets the oldest answers past its keep', async () => {
    const f = fake();
    const q = new ThumbQueue(f.run, 3, 2);
    for (const id of ['a', 'b', 'c']) {
      void q.get(req(id), 'view');
      await f.answer(id);
    }
    expect(q.known(reqKey(req('a')))).toBeUndefined();
    expect(q.known(reqKey(req('c')))).toEqual({ img: 'data:c' });
  });
});
