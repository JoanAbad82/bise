// desktop-agents-bar §2-§4: the AGENTS rows' signs, columns, marks, groups and order, one test per rule.
import { describe, expect, it } from 'vitest';
import type { Agent, Card, Place, Pr } from '@/proto';
import { agentRows, capRows, type ProjAgent } from './barrows';
import { asksMerge, markOf, tipWords, waitsToLand } from './barplaces';

const NOW = 1_791_100_000_000;
const ag = (name: string, over: Partial<Agent> = {}): ProjAgent => ({
  project: 'shop',
  projectName: 'storefront',
  a: { name, main: false, status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 60_000, waits: 0, watching: [], dir: name, ...over },
});
const pr = (over: Partial<Pr> = {}): Pr => ({ number: 415, url: 'https://github.com/acme/shop/pull/415', branch: 'sb/x', agents: [], state: 'open', checks: 'pass', review: 'none', words: 'checks pass', text: '', ...over });
const place = (branch: string, agents: string[], over: Partial<Place> = {}): Place => ({ id: `wt:${branch}`, branch, agents, ...over });
const merge = (p: string): Card => ({ id: 9, project: 'shop', kind: 'merge', agent: 'x', question: 'merge it?', options: [], urgent: false, since_ms: NOW, place: p });
const nums = (...names: string[]) => new Map(names.map((n, i) => [n, i + 1] as const));

describe('AGENTS signs and columns (§2)', () => {
  it("the TUI's sign, no state word anywhere: breeze, ? pink, ✓ pink, ▲ red, ○ text-3, … on an event", () => {
    const rows = agentRows(
      [
        ag('w', { status: 'working', turn_ms: 4 * 60_000 }),
        ag('q', { waits: 1 }),
        ag('d', { status: 'done' }),
        ag('f', { status: 'failed' }),
        ag('r'),
        ag('e', { watching: [{ id: 1, kind: 'bg', what: 'cargo test', since_ms: NOW - 120_000, resumes: true }] }),
      ],
      NOW,
      false,
    );
    expect(rows.map((r) => [r.name, r.glyph, r.tone, r.working === true])).toEqual([
      ['w', '∿', 'ink', true],
      ['q', '?', 'acc', false],
      ['d', '✓', 'acc', false],
      ['f', '▲', 'err', false],
      ['r', '○', 'dim', false],
      ['e', '…', 'ink', false],
    ]);
    for (const r of rows) expect([r.end, r.time, r.pct].join(' ')).not.toMatch(/done|idle|now|waits|failed|waiting/);
  });
  it("time: the turn's or the wait's length, else empty; %: the context used, text-3, empty at 0", () => {
    const rows = agentRows(
      [
        ag('w', { status: 'working', turn_ms: 4 * 60_000, usage: { model: 'm', context: 31_000, window: 100_000, words: '', short: '' } }),
        ag('fresh', { status: 'working', turn_ms: 12_000 }),
        ag('e', { watching: [{ id: 1, kind: 'bg', what: 'cargo test', since_ms: NOW - 120_000, resumes: true }] }),
        ag('r', { usage: { model: 'm', context: 0, window: 100_000, words: '', short: '0%' } }),
      ],
      NOW,
      false,
    );
    expect(rows.map((r) => [r.time, r.pct])).toEqual([
      ['4 min', '31%'],
      ['12 s', ''],
      ['2 min', ''],
      ['', ''],
    ]);
  });
});

describe('marks (§3)', () => {
  it('↑ pink only for a merge card, red when checks fail, text-2 open, text-3 draft; … text-2 to land; ψ text-2 no PR', () => {
    const open = place('sb/a', ['a'], { pr: pr() });
    expect(markOf(open, false, 'a')).toMatchObject({ g: '↑', tone: 'mid', pr: 415 });
    expect(markOf(open, asksMerge(open, [merge('wt:sb/a')]), 'a').tone).toBe('acc');
    expect(asksMerge(open, [merge('wt:other')])).toBe(false);
    expect(markOf(place('sb/a', ['a'], { pr: pr({ checks: 'fail', failing: ['e2e/login'] }) }), false, 'a').tone).toBe('err');
    expect(markOf(place('sb/a', ['a'], { pr: pr({ checks: 'fail' }) }), true, 'a').tone).toBe('err');
    expect(markOf(place('sb/a', ['a'], { pr: pr({ state: 'draft' }) }), false, 'a').tone).toBe('dim');
    for (const review of ['changes', 'approved'] as const) expect(markOf(place('sb/a', ['a'], { pr: pr({ review }) }), false, 'a').tone).toBe('mid');
    expect(markOf(place('sb/a', ['a'], { pr: pr({ checks: 'running' }) }), false, 'a').tone).toBe('mid');
    const land = place('sb/a', ['a'], { lid: 'waits to land · 2nd', landing: 2 });
    expect(waitsToLand(land)).toBe(true);
    expect(waitsToLand(place('sb/a', ['a'], { lid: 'landing', landing: 1 }))).toBe(false);
    expect(markOf(land, false, 'a')).toMatchObject({ g: '…', tone: 'mid' });
    expect(markOf(place('sb/a', ['a']), false, 'a')).toMatchObject({ g: 'ψ', tone: 'mid' });
    expect(markOf(place('sb/a', ['a'], { pr: pr({ state: 'merged' }) }), false, 'a').g).toBe('ψ');
  });
  it("the tip: the TUI's words, the branch only when it isn't sb/<name>, always last", () => {
    const p = place('sb/checkout', ['pay'], { pr: pr({ checks: 'fail', words: 'checks fail: e2e/login' }) });
    expect(tipWords(p, 'pay')).toBe('#415 · checks fail: e2e/login · ψ sb/checkout');
    expect(tipWords(place('sb/checkout', ['checkout'], { pr: pr({ words: 'approved · checks pass' }) }), 'checkout')).toBe('#415 · approved · checks pass');
    expect(tipWords(place('sb/a', ['a'], { lid: 'waits to land · 2nd' }), 'a')).toBe('waits to land · 2nd');
  });
  it('the shared checkout: an empty mark; a solo worktree: its mark in the row', () => {
    const rows = agentRows([ag('docs'), ag('perf', { place_id: 'wt:sb/perf' })], NOW, false, false, { places: [place('sb/perf', ['perf'])], numbers: nums('docs', 'perf') });
    expect(rows.map((r) => [r.name, r.mark?.g])).toEqual([
      ['docs', undefined],
      ['perf', 'ψ'],
    ]);
  });
});

describe('groups, orphan PRs and order (§4)', () => {
  const places = [
    place('sb/flash-sale', ['stock', 'pricing'], { pr: pr({ number: 418 }) }),
    place('sb/search', ['search'], { pr: pr({ number: 416 }) }),
    place('sb/palette', [], { pr: pr({ number: 420 }) }),
    place('sb/gone', [], { pr: pr({ number: 421, state: 'merged' }) }),
  ];
  const agents = [ag('main', { main: true }), ag('stock'), ag('search'), ag('docs'), ag('pricing'), ag('launch')];
  const rows = agentRows(agents, NOW, false, false, { places, numbers: nums('stock', 'search', 'docs', 'pricing', 'launch') });
  it("the TUI's order: unshared agents by number, then PRs with no agent, then groups by their smallest number", () => {
    expect(rows.map((r) => `${r.kind ?? ''}:${r.name}`)).toEqual(['agent:search', 'agent:docs', 'agent:launch', 'orphan:sb/palette', 'group:sb/flash-sale', 'agent:stock', 'agent:pricing']);
  });
  it("a group: a 'ψ <branch>' head with its PR's mark and number, its rows with no mark, all on its rule", () => {
    const head = rows.find((r) => r.kind === 'group');
    expect(head).toMatchObject({ glyph: 'ψ', name: 'sb/flash-sale', mark: { g: '↑', pr: 418 }, group: 'wt:sb/flash-sale', testId: 'app.right.group.sb/flash-sale' });
    for (const n of ['stock', 'pricing']) expect([rows.find((r) => r.name === n)?.group, rows.find((r) => r.name === n)?.mark]).toEqual(['wt:sb/flash-sale', undefined]);
  });
  it('an open PR with no live agent: a row with no sign, its ↑; a merged one: nothing', () => {
    expect(rows.find((r) => r.kind === 'orphan')).toMatchObject({ glyph: '', branch: 'sb/palette', mark: { g: '↑', pr: 420 }, testId: 'app.right.pr.420' });
    expect(rows.some((r) => r.name === 'sb/gone')).toBe(false);
  });
  it('a group of one is a plain row with its mark again', () => {
    const one = agentRows([ag('stock')], NOW, false, false, { places: [place('sb/flash-sale', ['stock', 'pricing'], { pr: pr({ number: 418 }) })] });
    expect(one.map((r) => [r.kind, r.name, r.mark?.g, r.group])).toEqual([['agent', 'stock', '↑', undefined]]);
  });
  it('⌥ held: the TUI numbers, not the place in the list', () => {
    const alt = agentRows(agents, NOW, false, true, { places, numbers: nums('stock', 'search', 'docs', 'pricing', 'launch') });
    expect(alt.filter((r) => r.kind === 'agent').map((r) => `${r.glyph} ${r.name}`)).toEqual(['⌥2 search', '⌥3 docs', '⌥5 launch', '⌥1 stock', '⌥4 pricing']);
  });
  it('the 8-row cap never hides an agent that waits on him, in a group too (its head shows with it)', () => {
    const many = Array.from({ length: 9 }, (_, i) => ag(`a${String(i + 1)}`));
    const list = [...many, ag('g1'), ag('g2', { waits: 1 })];
    const r = agentRows(list, NOW, false, false, { places: [place('sb/g', ['g1', 'g2'])], numbers: nums(...list.map((x) => x.a.name)) });
    const { shown } = capRows(r, 8);
    expect(shown.map((x) => x.name)).toEqual(['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'sb/g', 'g2']);
  });
});
