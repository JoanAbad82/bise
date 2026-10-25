// The empty home's rule (mockup 5, designer's pick (c)): when it shows, and its line's facts.
import { describe, expect, it } from 'vitest';
import type { ThreadOrder } from '@/store/types';
import { homeFacts, homeShows } from './rule';

const view = (o: Partial<ThreadOrder> = {}): ThreadOrder => ({ order: [], loaded: true, more: false, ...o }) as ThreadOrder;

describe('homeShows', () => {
  it('over main while its thread is empty, once loaded from its start', () => {
    expect(homeShows(view(), false, 0)).toBe(true);
    expect(homeShows(view({ order: [1, 2] }), false, 0), 'main wrote already: the home would sit on its lines').toBe(false);
  });
  it('gone at his first words, his first send on its way, or while the thread is not known from its start', () => {
    expect(homeShows(view(), true, 0)).toBe(false);
    expect(homeShows(view(), false, 1)).toBe(false);
    expect(homeShows(view({ loaded: false }), false, 0)).toBe(false);
    expect(homeShows(view({ more: true }), false, 0)).toBe(false);
  });
});

describe('homeFacts', () => {
  const rows = [
    { home: true, project: 'home-1', working: 1, waits: 1 },
    { home: false, project: 'acme', working: 3, waits: 1 },
    { home: false, project: 'shop', working: 1, waits: 0 },
  ];
  it("a project's main counts its own; bise's main every project's but its own hub", () => {
    expect(homeFacts(rows, 'acme')).toEqual({ working: 3, waits: 1 });
    expect(homeFacts(rows, null)).toEqual({ working: 4, waits: 1 });
  });
});
