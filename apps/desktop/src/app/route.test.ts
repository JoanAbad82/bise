import { describe, expect, it } from 'vitest';
import { bottomTarget, formatRoute, inboxAtOf, MAIN, parseRoute, projectOf, routeOfOpen, shownOf, startRouteOf, type Route } from './route';
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
  { screen: 'lab', lab: 'composer' },
  { screen: 'lab', lab: 'pearl' },
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
    for (const p of ['', 'telemetry/p99', 'agent/x', 'agent/x/y/z', 'commit/p/not-a-sha', 'bise/more', 'project/a b', 'lab/other', 'lab'])
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

describe('the core line (bar S.5)', () => {
  it("says when the core is down or coming back, never on a quick first start, gone once it's up", async () => {
    const { coreLine } = await import('./CoreLine');
    expect(coreLine('up', { wasUp: true, slow: true })).toBeUndefined();
    expect(coreLine('down', { wasUp: true, slow: false })).toBe("bise isn't running · starting it again…");
    expect(coreLine('starting', { wasUp: true, slow: false })).toBe('starting bise again…');
    expect(coreLine('starting', { wasUp: false, slow: false })).toBeUndefined();
    expect(coreLine('starting', { wasUp: false, slow: true })).toBe('starting bise…');
  });

  it('says how the core ended while it comes back; a panic or a fatal signal is a crash', async () => {
    const { coreLine, exitWords } = await import('./CoreLine');
    const base = { code: null, signal: null, crash: false, last: '', log: null, at_ms: 1 };
    const code2 = { ...base, how: 'code' as const, code: 2 };
    expect(coreLine('down', { wasUp: true, slow: false, exit: code2 })).toBe('bise stopped (exit 2) · starting it again…');
    expect(coreLine('starting', { wasUp: true, slow: false, exit: code2 })).toBe('bise stopped (exit 2) · starting it again…');
    expect(coreLine('up', { wasUp: true, slow: false, exit: code2 }), 'gone once it is up').toBeUndefined();
    const panic = { ...base, how: 'code' as const, code: 101, crash: true, last: 'no hub for acme', log: '/u/core.log' };
    expect(coreLine('down', { wasUp: true, slow: false, exit: panic })).toBe('bise crashed · starting it again…');
    expect(exitWords({ ...base, how: 'signal', signal: 'SIGSEGV', crash: true })).toBe('bise crashed');
    expect(exitWords({ ...base, how: 'signal', signal: 'SIGTERM' })).toBe('bise stopped (SIGTERM)');
    expect(exitWords({ ...base, how: 'clean', code: 0 })).toBe('bise stopped');
    expect(exitWords({ ...base, how: 'failed', last: 'spawn ENOENT' })).toBe("bise couldn't start");
  });
});

describe("the projects the window shows (the core's 'shown')", () => {
  // pure, in route.ts: no import of App (which timed out at 5 s under load, ambient-lead m_11471)
  it('home first, then the route project, deduped; empty until one is known', () => {
    expect(shownOf('home-1', { screen: 'thread', project: 'shop', agent: 'perf' })).toEqual(['home-1', 'shop']);
    expect(shownOf('home-1', { screen: 'bise' })).toEqual(['home-1']);
    expect(shownOf('home-1', { screen: 'thread', project: 'home-1', agent: 'main' })).toEqual(['home-1']);
    expect(shownOf(undefined, { screen: 'review', project: 'shop', agent: 'a' })).toEqual(['shop']);
    // the sidebar's open folders show their agents (R26): their running hubs too, once each
    expect(shownOf('home-1', { screen: 'thread', project: 'shop', agent: 'perf' }, ['shop', 'docs'])).toEqual(['home-1', 'shop', 'docs']);
    expect(shownOf(undefined, { screen: 'inbox' })).toEqual([]);
  });
});

describe('b1: the bottom block writes to whom the route says', () => {
  it("a review to its agent, a project's screen to its main, a screen of no project to bise; none where a composer is", () => {
    expect(bottomTarget({ screen: 'review', project: 'shop', agent: 'perf' }, 'home-1')).toEqual({ project: 'shop', agent: 'perf' });
    expect(bottomTarget({ screen: 'agents', project: 'shop' }, 'home-1')).toEqual({ project: 'shop', agent: MAIN });
    expect(bottomTarget({ screen: 'changes', project: 'shop' }, 'home-1')).toEqual({ project: 'shop', agent: MAIN });
    expect(bottomTarget({ screen: 'artifacts', project: '' }, 'home-1')).toEqual({ project: 'home-1', agent: MAIN });
    expect(bottomTarget({ screen: 'settings' }, 'home-1')).toEqual({ project: 'home-1', agent: MAIN });
    expect(bottomTarget({ screen: 'scheduled' }, 'home-1')).toEqual({ project: 'home-1', agent: MAIN });
    expect(bottomTarget({ screen: 'settings' }, undefined)).toBeNull();
    expect(bottomTarget({ screen: 'thread', project: 'shop', agent: 'perf' }, 'home-1')).toBeNull();
    expect(bottomTarget({ screen: 'bise' }, 'home-1')).toBeNull();
    expect(bottomTarget({ screen: 'onboarding' }, 'home-1')).toBeNull();
  });
});

describe('inboxAtOf (b1/b2: ⌘I and a notification open the block in place, never a screen)', () => {
  it("reads 'inbox' as its first item and 'inbox?card=<project>/<id>' as that card", () => {
    expect(inboxAtOf('inbox')).toEqual({});
    expect(inboxAtOf('/inbox')).toEqual({});
    expect(inboxAtOf('inbox?card=shop-ab9f3c3b/12')).toEqual({ at: { project: 'shop-ab9f3c3b', card: 12 } });
  });
  it('leaves every other route to the router', () => {
    expect(inboxAtOf('bise')).toBeUndefined();
    expect(inboxAtOf('inboxes')).toBeUndefined();
    expect(inboxAtOf('inbox?card=shop')).toBeUndefined();
    expect(inboxAtOf('settings/general')).toBeUndefined();
  });
  it('gives the ⌘I screen no second inbox under it', () => {
    expect(bottomTarget({ screen: 'inbox' }, 'home-1')).toBeNull();
  });
});
