import { describe, expect, it } from 'vitest';
import { formatRoute, MAIN, parseRoute, projectOf, routeOfOpen, startRouteOf, type Route } from './route';
import { createRouter } from './router';

const every: Route[] = [
  { screen: 'bise' },
  { screen: 'thread', project: 'shop-ab9f3c3b', agent: MAIN },
  { screen: 'thread', project: 'shop-ab9f3c3b', agent: 'perf' },
  { screen: 'agents', project: 'p' },
  { screen: 'changes', project: 'p' },
  { screen: 'review', project: 'p', agent: 'perf' },
  { screen: 'commit', project: 'p', sha: '155ffb0' },
  { screen: 'artifacts', project: 'p' },
  { screen: 'artifacts', project: 'p', id: 'a-1' },
  { screen: 'environments', project: 'p' },
  { screen: 'inbox' },
  { screen: 'settings' },
  { screen: 'settings', page: 'projects' },
  { screen: 'onboarding' },
];

describe('routes', () => {
  it('every route goes to its string and back', () => {
    for (const r of every) expect(parseRoute(formatRoute(r))).toEqual(r);
  });

  it("a project's main is project/<p>, the old window's links carry over", () => {
    expect(formatRoute({ screen: 'thread', project: 'shop', agent: MAIN })).toBe('project/shop');
    expect(parseRoute('agent/shop/main')).toEqual({ screen: 'thread', project: 'shop', agent: MAIN });
    expect(parseRoute('agent/bise-5f15b45e/helper')).toEqual({ screen: 'thread', project: 'bise-5f15b45e', agent: 'helper' });
  });

  it('a wrong link is notfound with its words, never bise', () => {
    for (const p of ['', 'telemetry/p99', 'agent/x', 'agent/x/y/z', 'commit/p/not-a-sha', 'bise/more', 'project/a b'])
      expect(parseRoute(p)).toEqual({ screen: 'notfound', path: p });
  });

  it('the project of a route', () => {
    expect(projectOf({ screen: 'review', project: 'p', agent: 'a' })).toBe('p');
    expect(projectOf({ screen: 'inbox' })).toBeUndefined();
  });

  it("the core's open becomes a route", () => {
    expect(routeOfOpen({ project: 'p', what: 'thread' })).toEqual({ screen: 'thread', project: 'p', agent: MAIN });
    expect(routeOfOpen({ project: 'p', what: 'review', agent: 'perf' })).toEqual({ screen: 'review', project: 'p', agent: 'perf' });
    expect(routeOfOpen({ project: 'p', what: 'artifact', id: 'x' })).toEqual({ screen: 'artifacts', project: 'p', id: 'x' });
    expect(routeOfOpen({ project: 'p', what: 'worktree' })).toEqual({ screen: 'environments', project: 'p' });
  });
});

describe('the start route of a test run', () => {
  it('#route=<route> opens that screen; none without it; a wrong one is notfound', () => {
    expect(startRouteOf('#route=agent/shop-ab9f3c3b/perf')).toEqual({ screen: 'thread', project: 'shop-ab9f3c3b', agent: 'perf' });
    expect(startRouteOf('#route=commit%2Fp%2F155ffb0')).toEqual({ screen: 'commit', project: 'p', sha: '155ffb0' });
    expect(startRouteOf('')).toBeUndefined();
    expect(startRouteOf('#other')).toBeUndefined();
    expect(startRouteOf('#route=nope/x')).toEqual({ screen: 'notfound', path: 'nope/x' });
  });
});

describe('router', () => {
  it('go, back, forward; the same route twice is one step and no call', () => {
    const r = createRouter({ screen: 'bise' });
    let calls = 0;
    r.subscribe(() => calls++);
    r.go({ screen: 'inbox' });
    r.go({ screen: 'inbox' });
    expect(calls).toBe(1);
    r.go({ screen: 'agents', project: 'p' });
    r.back();
    expect(r.get()).toEqual({ screen: 'inbox' });
    r.forward();
    expect(r.get()).toEqual({ screen: 'agents', project: 'p' });
    r.back();
    r.go({ screen: 'settings' });
    expect(r.canForward()).toBe(false);
    r.back();
    r.back();
    expect(r.get()).toEqual({ screen: 'bise' });
    expect(r.canBack()).toBe(false);
    r.back();
    expect(r.get()).toEqual({ screen: 'bise' });
  });
});
