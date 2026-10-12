import { describe, expect, it } from 'vitest';
import type { Agent } from '@/proto';
import { agentRows, archivedRows, capRows, type ProjAgent } from './barrows';

const NOW = 1_791_100_000_000;
const ag = (name: string, over: Partial<Agent> = {}): ProjAgent => ({
  project: 'shop',
  projectName: 'storefront',
  a: { name, main: false, status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 60_000, waits: 0, watching: [], ...over } as Agent,
});

describe('the right bar rows (designer desktop-right-bar v5)', () => {
  it('AGENTS: live ones but main, start order, the waiting one says waits in the accent', () => {
    const rows = agentRows([ag('main', { main: true }), ag('perf', { status: 'working' }), ag('search', { waits: 1 }), ag('old', { archived: true })], NOW, false);
    expect(rows.map((r) => r.name)).toEqual(['perf', 'search']);
    expect(rows[1]).toMatchObject({ glyph: '?', end: 'waits', endTone: 'acc', waits: true, sub: "search's job" });
  });
  it("bise's thread: the project's name in place of the role; ⌥ held: ⌥1-⌥9", () => {
    const rows = agentRows([ag('perf'), ag('docs')], NOW, true, true);
    expect(rows.map((r) => [r.glyph, r.sub, r.testId])).toEqual([
      ['⌥1', 'storefront', 'app.right.agent.shop.perf'],
      ['⌥2', 'storefront', 'app.right.agent.shop.docs'],
    ]);
  });
  it("ARCHIVED: ✓ done / – stopped with its age", () => {
    const rows = archivedRows([ag('a', { archived: true, status: 'done', since_ms: NOW - 2 * 3_600_000 }), ag('b', { archived: true, since_ms: NOW - 2 * 86_400_000 })], NOW, false);
    expect(rows.map((r) => `${r.glyph} ${r.name} ${r.end}`)).toEqual(['✓ a done · 2 h', '– b stopped · 2 d']);
  });
  it('the cap never hides what waits on him: 12 agents, the 10th waits', () => {
    const list = Array.from({ length: 12 }, (_, i) => ag(`a${String(i + 1)}`, i === 9 ? { waits: 1 } : {}));
    const { shown, hidden } = capRows(agentRows(list, NOW, false), 8);
    expect(shown.map((r) => r.name)).toEqual(['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a10']);
    expect(hidden).toBe(3);
  });
});
