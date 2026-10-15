import { describe, expect, it } from 'vitest';
import type { Agent } from '@/proto';
import { agentRows, archivedRows, capRows, roleWords, watchRows, type ProjAgent } from './barrows';

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
    expect(rows[1]).toMatchObject({ glyph: '?', tone: 'acc', end: '', waits: true, sub: "search's job" });
  });
  it("bise's thread: the project's name in place of the role; ⌥ held: ⌥1-⌥9", () => {
    const rows = agentRows([ag('perf'), ag('docs')], NOW, true, true);
    expect(rows.map((r) => [r.glyph, r.sub, r.testId])).toEqual([
      ['⌥1', 'storefront', 'app.right.agent.shop.perf'],
      ['⌥2', 'storefront', 'app.right.agent.shop.docs'],
    ]);
  });
  it("SCHEDULED & WATCHING: an alarm, '◌', its agent, 'if …', until a clock ahead; a pause is no row here", () => {
    const off = () => 7200;
    const now = 1791843420000; // tue 13 oct 00:17 (+02:00), the fixture's capture
    const gate = { id: 4, kind: 'file' as const, what: 'the nightly gate goes red', noted: true, since_ms: 1791785220000, until_ms: 1791871620000 };
    const bench = { id: 7, kind: 'bg' as const, what: 'cargo bench', since_ms: now - 180_000, resumes: true };
    const rows = watchRows([ag('main', { watching: [gate] }), ag('perf', { watching: [bench] }), ag('old', { archived: true, watching: [gate] })], now, false, off);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      glyph: '◌',
      tone: 'dim',
      name: 'main',
      sub: 'if the nightly gate goes red',
      fit: true,
      end: 'until 08:07',
      title: 'bise wakes main if the nightly gate goes red · set yesterday 08:07 · stops watching at 08:07',
      testId: 'app.right.watching.main.4',
      watch: 4,
    });
  });
  it("ARCHIVED: sign, name, age, no 'done ·': ✓ done, ✗ red failed, – stopped", () => {
    const rows = archivedRows(
      [
        ag('release-32', { archived: true, status: 'done', since_ms: NOW - 2 * 3_600_000 }),
        ag('import', { archived: true, status: 'failed', since_ms: NOW - 86_400_000 }),
        ag('b', { archived: true, since_ms: NOW - 2 * 86_400_000 }),
      ],
      NOW,
      false,
    );
    expect(rows.map((r) => `${r.glyph} ${r.name} ${r.end}`)).toEqual(['✓ release-32 2 h', '✗ import 1 d', '– b 2 d']);
    expect(rows.map((r) => r.tone)).toEqual(['dim', 'err', 'dim']);
    expect(rows[0]?.title).toBe("done · release-32's job");
  });
  it('the cap never hides what waits on him: 12 agents, the 10th waits', () => {
    const list = Array.from({ length: 12 }, (_, i) => ag(`a${String(i + 1)}`, i === 9 ? { waits: 1 } : {}));
    const { shown, hidden } = capRows(agentRows(list, NOW, false), 8);
    expect(shown.map((r) => r.name)).toEqual(['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a10']);
    expect(hidden).toBe(3);
  });
  it("never draws a raw tag as an agent's role: '<think>' reads 'thinking' (main m_22156)", () => {
    expect(roleWords('<think>')).toBe('thinking');
    expect(roleWords('</think> fixing the login')).toBe('thinking');
    expect(roleWords('fixing a < b in the parser')).toBe('fixing a < b in the parser');
    const rows = agentRows([ag('perf', { status: 'working', title: '<think>' })], NOW, false);
    expect(rows[0]?.sub).toBe('thinking');
  });
});
