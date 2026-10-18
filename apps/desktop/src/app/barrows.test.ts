import { describe, expect, it } from 'vitest';
import type { Agent } from '@/proto';
import { agentRows, archivedRows, pageRows, roleWords, watchRows, type ProjAgent } from './barrows';

const NOW = 1_791_100_000_000;
const ag = (name: string, over: Partial<Agent> = {}): ProjAgent => ({
  project: 'shop',
  projectName: 'storefront',
  a: { name, main: false, status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 60_000, waits: 0, watching: [], ...over } as Agent,
});

describe('the right bar rows (designer desktop-right-bar v5)', () => {
  it('AGENTS: main first as bise, then the live ones in start order, the waiting one says waits in the accent', () => {
    const rows = agentRows([ag('perf', { status: 'working' }), ag('main', { main: true }), ag('search', { waits: 1 }), ag('old', { archived: true })], NOW, false);
    expect(rows.map((r) => r.name)).toEqual(['bise', 'perf', 'search']);
    expect(rows[0]).toMatchObject({ kind: 'agent', main: true, agent: 'main', glyph: '○', sub: "main's job", testId: 'app.right.agent.main' });
    expect(rows[1]?.main).toBeUndefined();
    expect(rows[2]).toMatchObject({ glyph: '?', tone: 'acc', end: '', waits: true, sub: "search's job" });
  });
  it("main stays first past the ⌥ numbers and the worktrees, ⌥0 when ⌥ is held, its title as its line, the breeze while it works", () => {
    const nums = new Map([['main', 0], ['docs', 1], ['perf', 2]]);
    const list = [ag('perf'), ag('docs'), ag('main', { main: true, status: 'working', title: 'routing his asks' })];
    const rows = agentRows(list, NOW, false, false, { numbers: nums });
    expect(rows.map((r) => [r.name, r.sub, r.working ?? false])).toEqual([
      ['bise', 'routing his asks', true],
      ['docs', "docs's job", false],
      ['perf', "perf's job", false],
    ]);
    expect(agentRows(list, NOW, false, true, { numbers: nums }).map((r) => r.glyph)).toEqual(['⌥0', '⌥1', '⌥2']);
  });
  it("bise's thread: bise's own main first (the home project's), its doing line; no other project's main; an archived main none", () => {
    const home = (n: string, over: Partial<Agent> = {}): ProjAgent => ({ ...ag(n, over), project: 'home', projectName: 'bise' });
    const list = [ag('main', { main: true }), ag('perf'), home('main', { main: true, title: 'routing his asks' })];
    expect(agentRows(list, NOW, true, false, { home: 'home' }).map((r) => [r.name, r.sub, r.testId])).toEqual([
      ['bise', 'routing his asks', 'app.right.agent.home.main'],
      ['perf', 'storefront', 'app.right.agent.shop.perf'],
    ]);
    expect(agentRows([ag('main', { main: true, archived: true }), ag('perf')], NOW, false).map((r) => r.name)).toEqual(['perf']);
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
    const { shown, hidden } = pageRows(agentRows(list, NOW, false), 8);
    expect(shown.map((r) => r.name)).toEqual(['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a10']);
    expect(hidden).toBe(3);
  });
  it("'show 50 more' opens 50 at a time, 'show less' goes back to the cap (his m_26894): 370 rows, cap 5", () => {
    const rows = agentRows(Array.from({ length: 370 }, (_, i) => ag(`a${String(i + 1)}`, i === 300 ? { waits: 1 } : {})), NOW, false);
    const at = (p: number) => pageRows(rows, 5, p);
    expect([at(0).shown.length, at(0).hidden, at(0).more, at(0).less]).toEqual([6, 364, 'show 50 more · 364 left', false]);
    expect([at(1).shown.length, at(1).hidden, at(1).more, at(1).less]).toEqual([56, 314, 'show 50 more · 314 left', true]);
    expect(at(1).shown.at(-1)?.name).toBe('a301');
    expect([at(7).shown.length, at(7).hidden, at(7).more]).toEqual([355, 15, 'show 15 more']);
    expect([at(8).shown.length, at(8).hidden, at(8).more, at(8).less]).toEqual([370, 0, '', true]);
    // more pages than the list has (it shrank): clamped, 'show less' still there
    expect([at(40).pages, at(40).hidden]).toEqual([8, 0]);
    // under the cap: no row at all, whatever was kept
    expect(pageRows(rows.slice(0, 4), 5, 3)).toMatchObject({ pages: 0, hidden: 0, more: '', less: false });
  });
  it("never draws a raw tag as an agent's role: '<think>' reads 'thinking' (main m_22156)", () => {
    expect(roleWords('<think>')).toBe('thinking');
    expect(roleWords('</think> fixing the login')).toBe('thinking');
    expect(roleWords('fixing a < b in the parser')).toBe('fixing a < b in the parser');
    const rows = agentRows([ag('perf', { status: 'working', title: '<think>' })], NOW, false);
    expect(rows[0]?.sub).toBe('thinking');
  });
});
