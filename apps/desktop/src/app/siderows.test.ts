// The sidebar's rows (round 2, his r2-img11): one row per project, no agent under it; at its end
// one fact (designer m_44271): what waits on him (the count), else its agents at work (the ring and
// the count), else nothing; ⌘ held, its digit 1-9. A pinned agent's row keeps the dot or the ring.
import { describe, expect, it } from 'vitest';
import type { Agent, ProjectRow } from '@/proto';
import { endOf, pinRowOf, projectEndOf, projectRowOf, projectsOf, workingOf } from './siderows';

const agent = (name: string, o: Partial<Agent> = {}): Agent =>
  ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 0, waits: 0, ...o }) as Agent;
const project = (id: string, o: Partial<ProjectRow> = {}): ProjectRow => ({ project: id, name: id, order: 0, home: false, ...o }) as ProjectRow;

const ACME = project('acme');

describe('projectRowOf', () => {
  it('one fact at the end: what waits on him first, else its agents at work, else nothing', () => {
    expect(projectEndOf(2, 3)).toEqual({ kind: 'waits', n: 2 });
    expect(projectEndOf(0, 3)).toEqual({ kind: 'works', n: 3 });
    expect(projectEndOf(0, 0)).toBeNull();
  });

  it("counts its live agents at work, an archived one out; its row carries both counts for the tip", () => {
    const agents = [agent('main', { status: 'working' }), agent('perf', { status: 'working' }), agent('old', { status: 'working', archived: true }), agent('docs')];
    expect(workingOf(agents)).toBe(2);
    expect(projectRowOf({ p: ACME, agents, waits: 1, index: 0, on: true, cmd: false })).toEqual({ kind: 'project', p: ACME, on: true, end: { kind: 'waits', n: 1 }, working: 2, waits: 1 });
  });

  it('⌘ held: its digit, index + 1, the first 9 only (⌘1-9 in keys.ts)', () => {
    const row = (index: number, cmd: boolean) => projectRowOf({ p: ACME, agents: [], waits: 0, index, on: false, cmd });
    expect(row(0, true)).toMatchObject({ digit: 1 });
    expect(row(8, true)).toMatchObject({ digit: 9 });
    expect(row(9, true)).not.toHaveProperty('digit');
    expect(row(0, false)).not.toHaveProperty('digit');
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
    expect(pinRowOf('acme', 'perf', agents, 'perf')).toMatchObject({ kind: 'agent', on: true, stopped: true });
    expect(pinRowOf('acme', 'gone', agents)).toBeNull();
  });
});

describe('projectsOf', () => {
  it("his projects in his order, bise's own out", () => {
    const rows = [project('b', { order: 2 }), project('home', { home: true }), project('a', { order: 1 })];
    expect(projectsOf(rows).map((p) => p.project)).toEqual(['a', 'b']);
  });
});
