// The window's marks (desktop-delight v2): bise's ':*', a project's mark, the done kiss, their tips.
import { describe, expect, it } from 'vitest';
import type { Agent, ProjectRow } from '@/proto';
import { biseMark, finished, KISS_HOLD_MS, KISS_MS, projectMark, whoOf } from './markstates';
import { biseTip, namesWords, projectTip } from './tipwords';

const row = (over: Partial<ProjectRow> = {}): ProjectRow => ({ project: 'acme-1', name: 'storefront', path: '/x', git: true, home: false, order: 1, agents: 3, working: 0, waits: 0, running: true, ...over });
const agent = (name: string, status: Agent['status'], over: Partial<Agent> = {}): Agent => ({
  name, dir: name, main: false, status, archived: false, title: '', purpose: '', since_ms: 0, waits: 0, watching: [], ...over,
});

describe("bise's ':*'", () => {
  it('the accent when anything waits anywhere; its star turns while agents work anywhere', () => {
    expect(biseMark([row({ waits: 1 }), row({ waits: 2 })])).toEqual({ waits: 3, working: 0 });
    expect(biseMark([row({ home: true, working: 1 }), row({ working: 2 })])).toEqual({ waits: 0, working: 3 });
  });
  it("its tip, bise-presence's words", () => {
    expect(biseTip(1, 0)).toBe('bise: 1 thing waits for you');
    expect(biseTip(3, 2)).toBe('bise: 3 things wait for you');
    expect(biseTip(0, 3)).toBe('bise: working with 3 agents');
    expect(biseTip(0, 1)).toBe('bise: working with 1 agent');
    expect(biseTip(0, 0)).toBe('bise: all quiet');
  });
});

describe("a project's mark", () => {
  it("'?' when it asks him (over work), the gust at work, '·' quiet; a gone folder is quiet", () => {
    expect(projectMark(row({ waits: 1, working: 2 }))).toBe('asks');
    expect(projectMark(row({ working: 2 }))).toBe('works');
    expect(projectMark(row())).toBe('quiet');
    expect(projectMark(row({ missing: true, working: 1 }))).toBe('quiet');
  });
  it('who works and who asks, the live agents only', () => {
    const who = whoOf([agent('perf', 'working'), agent('search', 'working'), agent('pe', 'idle', { waits: 1 }), agent('old', 'working', { archived: true })]);
    expect(who).toEqual({ working: ['perf', 'search'], asking: ['pe'] });
  });
  it("its tip: designer's words, the counts when the window has no names", () => {
    expect(projectTip(row({ working: 2 }), { working: ['perf', 'search'], asking: [] })).toBe('storefront: perf and search are working · 2 agents');
    expect(projectTip(row({ working: 1 }), { working: ['perf'], asking: [] })).toBe('storefront: perf is working');
    expect(projectTip(row({ name: 'ts-pattern', waits: 1 }), { working: [], asking: ['pattern-error-dx'] })).toBe('ts-pattern: pattern-error-dx waits for you');
    expect(projectTip(row({ name: 'ts-pattern', waits: 2, working: 1 }), { working: [], asking: [] })).toBe('ts-pattern: 2 things wait for you · 1 agent working');
    expect(projectTip(row({ name: 'docs-site' }), { working: [], asking: [] })).toBe('docs-site: all quiet');
    expect(projectTip(row({ working: 3 }), { working: [], asking: [] })).toBe('storefront: 3 agents working');
  });
  it('names: two with and, four and more cut', () => {
    expect(namesWords(['a', 'b', 'c'])).toBe('a, b and c');
    expect(namesWords(['a', 'b', 'c', 'd'])).toBe('a, b and 2 more');
  });
});

describe('the done kiss', () => {
  it('only for a finish the window saw: not done before, done now', () => {
    const seen = new Map<string, Agent['status']>([['p/perf', 'working'], ['p/docs', 'done']]);
    expect(finished(seen, 'p', [agent('perf', 'done'), agent('docs', 'done'), agent('new', 'done')])).toEqual(['perf']);
  });
  it('plays 600 ms; a project holds its ✓ one more second', () => {
    expect([KISS_MS, KISS_HOLD_MS]).toEqual([600, 1000]);
  });

});
