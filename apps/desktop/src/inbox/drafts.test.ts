// A half answer per inbox card (bar I6/B3, min-tests for inbox/drafts): card A's and card B's
// words live under keys of their own, so going A -> B -> A gives each its own words back (the swap
// itself, card key in and out, is composer/pm/engine.test.tsx's); the prune drops only the drafts
// of cards gone from a project whose cards came, never another project's.
import { describe, expect, it } from 'vitest';
import { cardDraftKey, deadDraft, projectOf } from './drafts';

describe("a card's draft", () => {
  it('one key per card and project; only a gone card of a known project is pruned', () => {
    const a = cardDraftKey({ project: 'shop-5e6f', card: 12 });
    const b = cardDraftKey({ project: 'shop-5e6f', card: 13 });
    expect(a).not.toBe(b);
    expect(cardDraftKey({ project: 'home-1', card: 12 })).not.toBe(a);
    expect(projectOf('shop-5e6f-12')).toBe('shop-5e6f');
    const dead = deadDraft(new Set(['shop-5e6f-12']));
    expect(dead(`ls:${a}`)).toBe(false);
    expect(dead(`ls:${b}`)).toBe(true);
    expect(dead(`ls:${cardDraftKey({ project: 'home-1', card: 4 })}`)).toBe(false);
    expect(deadDraft(new Set())(`ls:${b}`)).toBe(false);
  });
});
