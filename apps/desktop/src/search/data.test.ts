import { describe, expect, it } from 'vitest';
import type { Agent, Artifact, IndexRow, ProjectRow } from '@/proto';
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
});
