// The app's edge (edge.tsx) runs what the store's machine decided: a move to an artifact's view at
// its block, through the router and the anchor the view reads; a window.bise call as named.
import { describe, expect, it } from 'vitest';
import { takeAnchor } from '@/artifacts/Open';
import { createRouter } from './router';
import { runEffect } from './edge';

describe('the edge', () => {
  it("a nav opens the artifact's view, at the block it names (the view reads it once)", () => {
    const router = createRouter({ screen: 'thread', project: 'acme', agent: 'main' });
    runEffect({ out: 'nav', to: { project: 'acme', artifact: 'issue-15', at: 'm-pr16' } }, router, undefined);
    expect(router.get()).toEqual({ screen: 'artifacts', project: 'acme', id: 'issue-15' });
    expect(takeAnchor('acme/issue-15')).toBe('m-pr16');
    expect(takeAnchor('acme/issue-15')).toBeNull();
  });

  it('a nav with no block opens the view at its top', () => {
    const router = createRouter({ screen: 'thread', project: 'acme', agent: 'main' });
    runEffect({ out: 'nav', to: { project: 'acme', artifact: 'plan', at: null } }, router, undefined);
    expect(router.get()).toEqual({ screen: 'artifacts', project: 'acme', id: 'plan' });
    expect(takeAnchor('acme/plan')).toBeNull();
  });

  it("an fx calls window.bise's method with its arguments, and moves nothing", () => {
    const router = createRouter({ screen: 'thread', project: 'acme', agent: 'main' });
    const opened: string[] = [];
    runEffect({ out: 'fx', fx: { fx: 'openExternal', args: ['https://github.com/x/pull/1'] } }, router, {
      openExternal: (u) => {
        opened.push(u);
        return Promise.resolve(true);
      },
    });
    expect(opened).toEqual(['https://github.com/x/pull/1']);
    expect(router.get()).toEqual({ screen: 'thread', project: 'acme', agent: 'main' });
  });
});
