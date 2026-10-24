import { describe, expect, it } from 'vitest';
import type { Proc } from '@/proto';
import { barProcs, procOfCall, countsOf, endWords, groupsOf, inScope, keyOf, markOf, matches, metaOf, portWords, shortCmd, shortCwd, stateOf, tipOf, urlWords, whereOf, worktreeName, type ProcItem } from './model';

const NOW = new Date(2026, 9, 23, 14, 6).getTime();
const MIN = 60_000;

const proc = (over: Partial<Proc> & Pick<Proc, 'id' | 'agent'>): Proc => ({
  // 'bg3' is bg job 3
  kind: { is: 'bg', n: Number(/^bg(\d+)$/u.exec(over.id)?.[1] ?? 0) },
  cmd: 'pnpm dev',
  cwd: '/Users/g/.bise/worktrees/shop/perf',
  pid: 48211,
  started_ms: NOW - 14 * MIN,
  ports: [],
  state: { is: 'running' },
  cpu: 12.4,
  rss_mb: 340,
  procs: 3,
  out: 'bg',
  ...over,
});
const item = (project: string, p: Proc): ProcItem => ({ project, projectName: project, p });

describe('a row', () => {
  it('runs: a dim ∿ and its age; a web page: localhost:<port> ↗, opening 127.0.0.1', () => {
    const p = proc({ id: 'bg3', agent: 'perf', ports: [5173, 24678], url: 'http://127.0.0.1:5173' });
    const s = stateOf(p);
    expect(markOf(s)).toEqual({ glyph: '∿', tone: 'dim' });
    expect(endWords(p, s, NOW)).toBe('14 min');
    expect(urlWords(p, s)).toEqual({ label: 'localhost:5173 ↗', url: 'http://127.0.0.1:5173' });
    expect(portWords(p, s)).toBe('');
    // the hub's url is the port that answered HTTP, not the first one
    const late = proc({ id: 'bg3', agent: 'perf', ports: [5173, 24678], url: 'http://127.0.0.1:24678' });
    expect(urlWords(late, stateOf(late))?.label).toBe('localhost:24678 ↗');
  });

  it("listening, no web page there (procs-bar: a click opened an empty tab): no link, its port plain", () => {
    const p = proc({ id: 'p51829.1', agent: 'perf', kind: { is: 'detached' }, ports: [9229] });
    expect(urlWords(p, stateOf(p))).toBeNull();
    expect(portWords(p, stateOf(p))).toBe(':9229');
    expect(portWords(proc({ id: 'bg3', agent: 'perf' }), stateOf(proc({ id: 'bg3', agent: 'perf' })))).toBe('');
    const gone = proc({ id: 'bg3', agent: 'perf', ports: [9229], state: { is: 'exited', rc: 0 }, ended_ms: NOW });
    expect(portWords(gone, stateOf(gone))).toBe('');
  });

  it('ended: ✓ for rc 0, ✗ (the only red) with its rc, – stopped by him or with its agent', () => {
    const ok = proc({ id: 'bg1', agent: 'perf', state: { is: 'exited', rc: 0 }, ended_ms: NOW - 3 * MIN });
    const bad = proc({ id: 'bg2', agent: 'checkout', state: { is: 'exited', rc: 1 }, ended_ms: NOW - 3 * MIN, ports: [4242] });
    const mine = proc({ id: 'bg4', agent: 'main', state: { is: 'stopped_by_you' }, ended_ms: new Date(2026, 9, 23, 10, 12).getTime() });
    const withIt = proc({ id: 'bg5', agent: 'search', state: { is: 'stopped_with' }, ended_ms: NOW });
    expect([ok, bad, mine, withIt].map((p) => markOf(stateOf(p)))).toEqual([
      { glyph: '✓', tone: 'ink' },
      { glyph: '✗', tone: 'err' },
      { glyph: '–', tone: 'dim' },
      { glyph: '–', tone: 'dim' },
    ]);
    expect(endWords(ok, stateOf(ok), NOW)).toBe('ended 3 min ago');
    expect(endWords(bad, stateOf(bad), NOW)).toBe('ended 3 min ago · rc 1');
    expect(endWords(mine, stateOf(mine), NOW)).toBe('stopped by you · 10:12');
    expect(endWords(withIt, stateOf(withIt), NOW)).toBe('stopped with search');
    // an ended one no longer opens its port
    expect(urlWords(bad, stateOf(bad))).toBeNull();
    // its code unknown (a detached one): '–' dim, no rc, never a red ✗
    const unknown = proc({ id: 'p47500.1791', agent: 'docs', kind: { is: 'detached' }, state: { is: 'exited' }, ended_ms: NOW - 3 * MIN });
    expect(markOf(stateOf(unknown))).toEqual({ glyph: '–', tone: 'dim' });
    expect(endWords(unknown, stateOf(unknown), NOW)).toBe('ended 3 min ago');
  });

  it('he stopped it and its hub still lists it: stopping…', () => {
    const p = proc({ id: 'bg3', agent: 'perf' });
    expect(endWords(p, stateOf(p, true), NOW)).toBe('stopping…');
    // the hub's ended row wins over his click
    expect(stateOf(proc({ id: 'bg3', agent: 'perf', state: { is: 'stopped_by_you' }, ended_ms: NOW }), true).k).toBe('by_you');
  });

  it('its tip: id, start, folder; a detached one says it was started outside its agent', () => {
    expect(tipOf(proc({ id: 'bg3', agent: 'perf', started_ms: new Date(2026, 9, 23, 13, 52).getTime() }), '/Users/g')).toBe('bg3 · started 13:52 · ~/…/shop/perf');
    // the row's id carries its start; the tip says the short name
    expect(tipOf(proc({ id: 'bg3.1791100100', agent: 'perf', cwd: undefined, kind: { is: 'bg', n: 3 }, started_ms: new Date(2026, 9, 23, 13, 52).getTime() }))).toBe('bg3 · started 13:52');
    expect(tipOf(proc({ id: 'p48211.1791', agent: 'perf', kind: { is: 'detached' }, cwd: undefined, started_ms: new Date(2026, 9, 23, 13, 52).getTime() }))).toBe(
      "p48211 · started 13:52\nstarted outside perf's commands (a script or nohup)",
    );
  });

  it('the output head: state, address, pid, cpu and memory while it runs, folder', () => {
    const p = proc({ id: 'bg3', agent: 'perf', ports: [5173], url: 'http://127.0.0.1:5173' });
    expect(metaOf(p, stateOf(p), NOW, '/Users/g')).toEqual(['∿ running · 14 min', 'localhost:5173', 'pid 48211', 'cpu 12% · 340 MB', '~/…/shop/perf']);
    const gone = proc({ id: 'bg3', agent: 'perf', ports: [5173], cwd: undefined, state: { is: 'exited', rc: 2 }, ended_ms: NOW - MIN });
    expect(metaOf(gone, stateOf(gone), NOW)).toEqual(['✗ ended 1 min ago · rc 2', 'pid 48211']);
  });

  it('a folder short: home as ~, the last two folders', () => {
    expect(shortCwd('/Users/g/code/shop', '/Users/g')).toBe('~/code/shop');
    expect(shortCwd('/Users/g/.bise/worktrees/shop/perf', '/Users/g')).toBe('~/…/shop/perf');
    expect(shortCwd('/srv/a/b/c')).toBe('/…/b/c');
  });

  it("the bar's command: past a package runner's exec, its program by name and its arguments, a path by its last part", () => {
    expect(shortCmd('pnpm exec playwright test --ui')).toBe('playwright test --ui');
    expect(shortCmd('pnpm dev')).toBe('pnpm dev');
    expect(shortCmd('stripe listen --forward-to localhost:4242')).toBe('stripe listen --forward-to localhost:4242');
    expect(shortCmd('/opt/homebrew/bin/python3 -m http.server 8000')).toBe('python3 -m http.server 8000');
    expect(shortCmd('node /Users/g/code/shop/server.js --port 3000 --watch')).toBe('node server.js --port 3000 --watch');
    expect(shortCmd("sh -c 'while true; do date; done'")).toBe("sh -c 'while true; do");
  });

  it('where it runs: past the project root, a worktree by its name, elsewhere its last folder; never a home path', () => {
    const roots = [
      { path: '/Users/g/code/shop', name: '' },
      { path: '/Users/g/.bise/worktrees/shop-1/perf/shop', name: worktreeName('/Users/g/.bise/worktrees/shop-1/perf/shop', 'shop') },
    ];
    expect(roots[1]?.name).toBe('perf');
    expect(whereOf('/Users/g/code/shop', roots)).toBe('');
    expect(whereOf('/Users/g/code/shop/apps/web/', roots)).toBe('apps/web');
    expect(whereOf('/Users/g/.bise/worktrees/shop-1/perf/shop', roots)).toBe('perf');
    expect(whereOf('/Users/g/.bise/worktrees/shop-1/perf/shop/apps/web', roots)).toBe('perf/apps/web');
    expect(whereOf('/Users/g/.local/state/switchboard/versions/cea5f1d2a', roots)).toBe('cea5f1d2a');
    // a sibling whose name starts like the root's is not under it
    expect(whereOf('/Users/g/code/shop-old', roots)).toBe('shop-old');
    expect(whereOf(undefined, roots)).toBe('');
    expect(worktreeName('/w/trees/perf', 'shop')).toBe('perf');
  });
});

describe('the list', () => {
  const dev = item('shop', proc({ id: 'bg3', agent: 'perf', started_ms: NOW - 14 * MIN, ports: [5173] }));
  const pw = item('shop', proc({ id: 'bg4', agent: 'perf', cmd: 'pnpm exec playwright test --ui', started_ms: NOW - 6 * MIN, ports: [9323] }));
  const stripe = item('shop', proc({ id: 'bg1', agent: 'checkout', cmd: 'stripe listen', started_ms: NOW - 22 * MIN }));
  const test = item('shop', proc({ id: 'bg2', agent: 'checkout', cmd: 'pnpm test checkout', state: { is: 'exited', rc: 1 }, ended_ms: NOW - 3 * MIN }));
  const bench = item('tele', proc({ id: 'bg1', agent: 'p99', cmd: 'cargo bench', started_ms: NOW - 2 * MIN }));
  const dock = item('tele', proc({ id: 'bg9', agent: 'main', cmd: 'docker compose up', state: { is: 'stopped_by_you' }, ended_ms: NOW - 60 * MIN }));
  const all = [pw, stripe, dev, test, bench, dock];

  it("'running': project > agent in the order they come, oldest first; ended ones are 'ended today'", () => {
    const g = groupsOf(all, 'running');
    expect(g.map((x) => x.key)).toEqual(['shop/perf', 'shop/checkout', 'tele/p99']);
    expect(g[0]?.items.map((x) => x.p.id)).toEqual(['bg3', 'bg4']);
    expect(groupsOf(all, 'ended').flatMap((x) => x.items.map(keyOf))).toEqual(['shop/checkout/bg2', 'tele/main/bg9']);
  });

  it("a row that ended while the screen is open stays in 'running' where it was (designer m_38389)", () => {
    const stopped = item('shop', { ...dev.p, state: { is: 'stopped_by_you' }, ended_ms: NOW });
    const kept = new Set([keyOf(dev)]);
    expect(groupsOf([stopped, pw], 'running', kept)[0]?.items.map((x) => x.p.id)).toEqual(['bg3', 'bg4']);
    expect(groupsOf([stopped, pw], 'running')[0]?.items.map((x) => x.p.id)).toEqual(['bg4']);
  });

  it("the counts: running, ended, projects that run something, the listening ones", () => {
    expect(countsOf(all)).toEqual({ running: 4, ended: 2, projects: 2, listening: 2 });
  });

  it('the search: the command, its agent, the project, a port', () => {
    expect(all.filter((x) => matches(x, '9323')).map(keyOf)).toEqual([keyOf(pw)]);
    expect(all.filter((x) => matches(x, 'CHECKOUT')).map(keyOf)).toEqual([keyOf(stripe), keyOf(test)]);
  });

  it("the bar: an agent's thread shows its own, main the project's, running only", () => {
    expect(barProcs(all, 'shop', 'perf').map(keyOf)).toEqual([keyOf(dev), keyOf(pw)]);
    expect(barProcs(all, 'shop', null).map(keyOf)).toEqual([keyOf(stripe), keyOf(dev), keyOf(pw)]);
  });

  it("the screen in the bar's scope ('all ›'): a project's, an agent's, or every project's, ended ones too", () => {
    expect(inScope(all, undefined)).toBe(all);
    expect(inScope(all, { project: 'tele' }).map(keyOf)).toEqual(all.filter((x) => x.project === 'tele').map(keyOf));
    expect(inScope(all, { project: 'shop', agent: 'checkout' }).map(keyOf)).toEqual([keyOf(stripe), keyOf(test)]);
  });

  it("a thread's '$' call finds the bg job it left running: its agent's, its command, the running one first", () => {
    const procs = all.filter((x) => x.project === 'shop').map((x) => x.p);
    expect(procOfCall(procs, 'perf', '  pnpm dev\n')).toBe(dev.p);
    // another agent's same command is not this call's
    expect(procOfCall(procs, 'checkout', 'pnpm dev')).toBeNull();
    // ran twice: the running one, not the one that ended
    const again = { ...dev.p, id: 'bg7', kind: { is: 'bg' as const, n: 7 }, started_ms: NOW - MIN, state: { is: 'exited' as const, rc: 0 }, ended_ms: NOW };
    expect(procOfCall([...procs, again], 'perf', 'pnpm dev')).toBe(dev.p);
    expect(procOfCall([again], 'perf', 'pnpm dev')).toBe(again);
  });
});
