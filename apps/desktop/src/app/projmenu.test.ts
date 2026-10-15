import { describe, expect, it } from 'vitest';
import type { Agent } from '@/proto';
import { menuGroupsOf } from './projmenu';
import { barSign } from './barrows';
import { signOf } from './side';

const T = 1_791_100_000_000;
const ag = (name: string, over: Partial<Agent> = {}): Agent => ({ name, dir: name, main: false, status: 'idle', archived: false, title: '', purpose: '', since_ms: T, waits: 0, watching: [], ...over });

describe("a project's ⋯ menu (his m_26450, designer m_26470): active, quiet, archived, by priority", () => {
  const world = [
    ag('rest-old', { since_ms: T }),
    ag('rest-new', { since_ms: T + 9 }),
    ag('done', { status: 'done', since_ms: T + 3 }),
    ag('work-old', { status: 'working', since_ms: T }),
    ag('work-new', { status: 'working', since_ms: T + 5 }),
    ag('asks', { status: 'working', waits: 2, since_ms: T + 1 }),
    ag('on-you', { status: 'idle', waiting_on: { who: 'you' }, since_ms: T + 6 }),
    ag('stuck', { status: 'blocked', since_ms: T + 2 }),
    ag('broke', { status: 'failed', since_ms: T }),
    ag('on-peer', { status: 'idle', waiting_on: { who: 'agent', name: 'rest-old' }, since_ms: T + 4 }),
    ag('main', { main: true, since_ms: T + 1 }),
    ...Array.from({ length: 7 }, (_, i) => ag(`gone-${String(i)}`, { archived: true, status: i === 6 ? 'failed' : i % 2 === 0 ? 'done' : 'idle', since_ms: T + i })),
  ];
  const now = T + 60 * 60_000;
  const shown = (cap?: number) => menuGroupsOf(world, now, cap).map((g) => [g.head, g.rows.map((r) => r.agent.name), g.more]);

  it('asks him or failed first, then at work, then the other live ones, then archived newest first, capped; main out', () => {
    expect(shown()).toEqual([
      ['active', ['on-you', 'asks', 'broke', 'work-new', 'work-old'], 0],
      ['quiet', ['rest-new', 'on-peer', 'done', 'stuck', 'rest-old'], 0],
      ['archived', ['gone-6', 'gone-5', 'gone-4', 'gone-3', 'gone-2'], 2],
    ]);
    expect(shown(10).at(-1)).toEqual(['archived', ['gone-6', 'gone-5', 'gone-4', 'gone-3', 'gone-2', 'gone-1', 'gone-0'], 0]);
  });

  it("every row wears the right bar's mark, one source; 'waits' in the accent only beside its '?'", () => {
    const rows = menuGroupsOf(world, now, 10).flatMap((g) => g.rows);
    for (const r of rows.filter((x) => !x.agent.archived)) expect(r.glyph, r.agent.name).toBe(barSign(signOf(r.agent, now)).g);
    const by = new Map(rows.map((r) => [r.agent.name, r]));
    const look = (n: string) => { const r = by.get(n); return [r?.glyph, r?.end, r?.acc]; };
    expect(look('asks')).toEqual(['?', 'waits', true]);
    expect(look('on-you')).toEqual(['?', 'waits', true]);
    expect(look('work-new')).toEqual(['∿', '59 min', false]);
    expect(look('stuck')).toEqual(['…', 'blocked', false]);
    expect(look('on-peer')).toEqual(['…', 'waiting on rest-old', false]);
    expect(look('done')).toEqual(['✓', 'done', false]);
    expect(look('rest-new')).toEqual(['○', '59 min', false]);
    expect(look('broke')).toEqual(['✗', 'failed', false]);
    expect(look('gone-0')).toEqual(['✓', '1 h', false]);
    expect(look('gone-1')).toEqual(['–', '59 min', false]);
    expect(look('gone-6')).toEqual(['✗', '59 min', false]);
  });

  it('an empty group is left out; main alone leaves none', () => {
    expect(menuGroupsOf([ag('main', { main: true })], T)).toEqual([]);
    expect(menuGroupsOf([ag('w', { status: 'working' }), ag('g', { archived: true })], T).map((g) => g.head)).toEqual(['active', 'archived']);
  });
});
