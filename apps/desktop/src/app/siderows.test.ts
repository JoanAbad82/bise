// The sidebar's rows: a project's agents in the hub's rank (no order of its own), the first 4 then
// 'Show N more' (the agent in view always shows), the dot when it waits on him, the ring at work,
// nothing else; a pinned agent leaves its project's list; a folded project says what waits.
import { describe, expect, it } from 'vitest';
import type { Agent, ProjectRow } from '@/proto';
import { endOf, pinRowOf, projectBlockOf, projectsOf, SHOWN_AGENTS, type SideRow } from './siderows';

const agent = (name: string, o: Partial<Agent> = {}): Agent =>
  ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 0, waits: 0, ...o }) as Agent;
const project = (id: string, o: Partial<ProjectRow> = {}): ProjectRow => ({ project: id, name: id, order: 0, home: false, ...o }) as ProjectRow;
const names = (rows: readonly SideRow[]) => rows.map((r) => (r.kind === 'agent' ? r.a.name : r.kind === 'more' ? `more ${String(r.n)}` : r.kind === 'project' ? `[${r.p.name}]` : r.label));

const ACME = project('acme');
const nums = (order: string[]) => new Map(order.map((n, i) => [n, i]));

describe('projectBlockOf', () => {
  it("lists the live agents in the hub's rank, never its own order, archived ones out", () => {
    const agents = [agent('main'), agent('docs'), agent('perf'), agent('old', { archived: true })];
    const rows = projectBlockOf({ p: ACME, agents, numbers: nums(['main', 'perf', 'docs']), pinned: [], folded: false, all: false });
    expect(names(rows)).toEqual(['[acme]', 'main', 'perf', 'docs']);
  });

  it("shows the first 4, then 'Show N more'; open, all of them and 'Show less'", () => {
    const agents = ['main', 'a', 'b', 'c', 'd', 'e', 'f'].map((n) => agent(n));
    const numbers = nums(['main', 'a', 'b', 'c', 'd', 'e', 'f']);
    const shut = projectBlockOf({ p: ACME, agents, numbers, pinned: [], folded: false, all: false });
    expect(names(shut)).toEqual(['[acme]', 'main', 'a', 'b', 'c', 'more 3']);
    expect(SHOWN_AGENTS).toBe(4);
    const open = projectBlockOf({ p: ACME, agents, numbers, pinned: [], folded: false, all: true });
    expect(names(open)).toEqual(['[acme]', 'main', 'a', 'b', 'c', 'd', 'e', 'f', 'more 0']);
  });

  it('keeps the agent in view even past the first 4', () => {
    const agents = ['main', 'a', 'b', 'c', 'd', 'e'].map((n) => agent(n));
    const rows = projectBlockOf({ p: ACME, agents, numbers: nums(['main', 'a', 'b', 'c', 'd', 'e']), pinned: [], folded: false, all: false, at: 'e' });
    expect(names(rows)).toEqual(['[acme]', 'main', 'a', 'b', 'c', 'e', 'more 1']);
    expect(rows.find((r) => r.kind === 'agent' && r.a.name === 'e')).toMatchObject({ on: true });
  });

  it('leaves a pinned agent out (it sits in Pinned)', () => {
    const rows = projectBlockOf({ p: ACME, agents: [agent('main'), agent('perf')], numbers: nums(['main', 'perf']), pinned: ['perf'], folded: false, all: false });
    expect(names(rows)).toEqual(['[acme]', 'main']);
  });

  it('folded: only its row, the dot when one of its agents waits on him', () => {
    const rows = projectBlockOf({ p: ACME, agents: [agent('main'), agent('perf', { waits: 1 })], numbers: nums(['main', 'perf']), pinned: [], folded: true, all: false });
    expect(rows).toEqual([{ kind: 'project', p: ACME, open: false, end: 'waits' }]);
  });
});

describe('endOf', () => {
  it('the dot when it asks him, the ring at work, else nothing: no count, no date', () => {
    expect(endOf(agent('perf', { waits: 2, status: 'working' }))).toBe('waits');
    expect(endOf(agent('perf', { waiting_on: { who: 'you' } }))).toBe('waits');
    expect(endOf(agent('perf', { status: 'working' }))).toBe('works');
    expect(endOf(agent('perf', { status: 'done' }))).toBeNull();
    expect(endOf(agent('perf', { status: 'waiting' }))).toBeNull();
  });
});

describe('pinRowOf', () => {
  it("a pinned agent's row, none once it left the live rows", () => {
    const agents = [agent('main'), agent('perf', { status: 'done' })];
    expect(pinRowOf('acme', 'perf', agents, 'perf')).toMatchObject({ kind: 'agent', pinned: true, on: true, stopped: true });
    expect(pinRowOf('acme', 'gone', agents)).toBeNull();
  });
});

describe('projectsOf', () => {
  it("his projects in his order, bise's own out", () => {
    const rows = [project('b', { order: 2 }), project('home', { home: true }), project('a', { order: 1 })];
    expect(projectsOf(rows).map((p) => p.project)).toEqual(['a', 'b']);
  });
});
