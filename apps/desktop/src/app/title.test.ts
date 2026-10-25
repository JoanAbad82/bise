// The bar's title is what he looks at, its subtitle where it sits (nearest first), each earlier
// part still a way back; the window's title is the bar's.
import { describe, expect, it } from 'vitest';
import { barTitleOf, windowTitleOf } from './title';

const name = (p: string) => (p === 'acme-1' ? 'acme' : p);

describe('barTitleOf', () => {
  it("an agent's thread: the agent, then its own title and its project (a way back to the project's main)", () => {
    const t = barTitleOf({ screen: 'thread', project: 'acme-1', agent: 'perf' }, name, () => [], 'profiling the hub');
    expect(t.title).toBe('perf');
    expect(t.sub).toEqual([{ c: 'profiling the hub' }, { c: 'acme', go: { screen: 'thread', project: 'acme-1', agent: 'main' } }]);
    expect(windowTitleOf(t)).toBe('perf');
  });

  it('a page is its own word, nothing under it', () => {
    expect(barTitleOf({ screen: 'inbox' }, name)).toEqual({ title: 'inbox', sub: [] });
    expect(barTitleOf({ screen: 'scheduled' }, name).title).toBe('scheduled');
  });

  it("a project's screen: its word, then the project", () => {
    const t = barTitleOf({ screen: 'changes', project: 'acme-1' }, name);
    expect(t.title).toBe('changes');
    expect(t.sub.map((p) => p.c)).toEqual(['acme']);
  });
});
