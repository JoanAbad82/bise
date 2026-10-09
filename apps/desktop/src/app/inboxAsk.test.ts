// b1/b2: a notification's card opens once the core's rows list it; the composer answers the open card's project.
import { describe, expect, it } from 'vitest';
import { listsCard } from './inboxAsk';
import { answerOf } from '@/thread/ThreadScreen';
import type { ProjectRow } from '@/proto';

const row = (project: string, ids: number[]) => ({ project, cards: ids.map((id) => ({ id })) }) as unknown as ProjectRow;

describe('the inbox asks', () => {
  it('a card is listed only in its own project', () => {
    const rows = [row('shop', [1, 2]), row('docs', [])];
    expect(listsCard(rows, { project: 'shop', card: 2 })).toBe(true);
    expect(listsCard(rows, { project: 'docs', card: 2 })).toBe(false);
    expect(listsCard([], { project: 'shop', card: 1 })).toBe(false);
  });
  it("the composer answers the open question in ITS project, an approval never", () => {
    expect(answerOf({ project: 'shop', answer: 4 })).toEqual({ project: 'shop', card: 4 });
    expect(answerOf({ project: 'shop', answer: null })).toBeNull();
    expect(answerOf(null)).toBeNull();
  });
});
