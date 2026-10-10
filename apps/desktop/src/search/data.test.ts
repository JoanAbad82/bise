import { describe, expect, it } from 'vitest';
import type { Agent, Artifact, IndexRow, ProjectRow, ScheduledTask } from '@/proto';
import { searchDataOf } from './data';

const agent = (name: string, archived = false): Agent =>
  ({ name, main: name === 'main', archived, status: 'idle', title: `${name} work`, waits: 0, since_ms: 1 }) as unknown as Agent;
const artifact = (id: string): Artifact => ({ id, title: id, kind: 'page', version: 1, agent: 'main', at_ms: 1 }) as unknown as Artifact;
const project = (id: string, order: number, home = false): ProjectRow => ({ project: id, name: id, home, order, working: 0 }) as unknown as ProjectRow;

describe('search data: held projects live, the others from amb-core index', () => {
  it("a project the core doesn't hold is searched from its index row; a held one keeps its live slice", () => {
    const index: IndexRow[] = [
      { project: 'docs', up: false, written_ms: 5, agents: [agent('main'), agent('old-links', true)], artifacts: [artifact('links')] },
      { project: 'acme', up: true, agents: [agent('stale')], artifacts: [] },
      { project: 'lost', up: false, agents: [agent('ghost')], artifacts: [] },
    ];
    const d = searchDataOf({
      projects: [project('home', 0, true), project('acme', 1), project('docs', 2)],
      agents: (p) => (p === 'acme' ? [agent('main'), agent('perf')] : []),
      artifacts: () => [],
      cards: () => [],
      index,
    });
    const names = d.agents.map((a) => `${a.project}/${a.name}${a.archived ? ' (archived)' : ''}`);
    expect(names).toEqual(['acme/main', 'acme/perf', 'docs/main', 'docs/old-links (archived)', 'lost/ghost']);
    expect(d.artifacts.map((a) => `${a.project}/${a.id}`)).toEqual(['docs/links']);
    expect(d.projects.map((p) => p.name)).toEqual(['home', 'acme', 'docs', 'lost']);
  });

  it("a held project's scheduled tasks (amb-feed's typed list) are searched: words, the agent it wakes, how often, next run", () => {
    const task: ScheduledTask = { id: 48, agent: 'checkout', by: 'you', words: 're-run the flaky checkout test', every: 'every 30m', done: 3, next_ms: 1_000 };
    const d = searchDataOf({
      projects: [project('sf', 1)],
      agents: () => [],
      artifacts: () => [],
      cards: () => [],
      scheduled: (p) => (p === 'sf' ? [task] : []),
    });
    expect(d.scheduled).toEqual([{ project: 'sf', id: 48, agent: 'checkout', words: 're-run the flaky checkout test', every: '30m', next_ms: 1_000 }]);
    // sched-names: the hub's short name rides along (absent from an older hub, as above)
    const named = searchDataOf({
      projects: [project('sf', 1)],
      agents: () => [],
      artifacts: () => [],
      cards: () => [],
      scheduled: (p) => (p === 'sf' ? [{ ...task, name: 'flaky checkout' }] : []),
    });
    expect(named.scheduled[0]?.name).toBe('flaky checkout');
  });

  it("a project the core doesn't hold has its scheduled tasks from its index row (26b2400b); a held one keeps its live list", () => {
    const task = (id: number, words: string): ScheduledTask => ({ id, agent: 'writer', by: 'main', words, every: 'every day 07:30', done: 3 });
    const d = searchDataOf({
      projects: [project('acme', 1), project('docs', 2)],
      agents: () => [],
      artifacts: () => [],
      cards: () => [],
      scheduled: (p) => (p === 'acme' ? [task(1, 'live check')] : []),
      index: [
        { project: 'acme', up: true, agents: [], artifacts: [], scheduled: [task(9, 'stale check')] },
        { project: 'docs', up: false, written_ms: 5, agents: [], artifacts: [], scheduled: [task(48, 'refresh the Q3 notes')] },
      ],
    });
    expect(d.scheduled.map((t) => `${t.project}#${String(t.id)} ${t.words} · ${t.every}`)).toEqual(['acme#1 live check · day 07:30', 'docs#48 refresh the Q3 notes · day 07:30']);
  });
});
