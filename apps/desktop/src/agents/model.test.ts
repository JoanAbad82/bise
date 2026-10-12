import { describe, expect, it } from 'vitest';
import type { Agent } from '@/proto';
import { hub_ev } from '@/proto/fixtures.gen';
import { ago, archivedEnd, archivedOf, assign, dotOf, endOf, lineOf, liveOf, numbersOf } from './model';

const T = 1_791_100_000_000;
const ag = (name: string, over: Partial<Agent> = {}): Agent => ({ name, dir: name, main: false, status: 'idle', archived: false, title: '', purpose: '', since_ms: T, waits: 0, watching: [], ...over });

describe('the agents list', () => {
  it("the fixture's agents: main first, then the hub's order", () => {
    const ev = hub_ev.find((e) => e.ev === 'agents');
    if (ev?.ev !== 'agents') throw new Error('no agents fixture');
    const names = liveOf(ev.agents).map((a) => a.name);
    expect(names[0]).toBe('main');
    expect(new Set(names)).toEqual(new Set(ev.agents.filter((a) => !a.archived).map((a) => a.name)));
  });

  it("main, then the hub's (start) order as the TUI's panel: a status never moves a row; archived apart", () => {
    const list = [
      ag('rest', { since_ms: T + 9 }),
      ag('done', { status: 'done' }),
      ag('work-old', { status: 'working', since_ms: T }),
      ag('work-new', { status: 'working', since_ms: T + 5 }),
      ag('asks', { status: 'working', waits: 2 }),
      ag('stuck', { status: 'blocked' }),
      ag('broke', { status: 'failed' }),
      ag('gone', { archived: true }),
      ag('main', { main: true }),
    ];
    expect(liveOf(list).map((a) => a.name)).toEqual(['main', 'rest', 'done', 'work-old', 'work-new', 'asks', 'stuck', 'broke']);
    expect(archivedOf(list).map((a) => a.name)).toEqual(['gone']);
  });

  it('dots, ends and ages', () => {
    expect(dotOf('working')).toBe('wk');
    expect(dotOf('waiting')).toBe('nd');
    expect(dotOf('failed')).toBe('er');
    expect(endOf(ag('a', { waits: 3 }), T)).toEqual({ text: '3', needs: true });
    expect(endOf(ag('a', { status: 'working' }), T + 12 * 60_000)).toEqual({ text: '12 min', needs: false });
    expect(endOf(ag('a', { status: 'done' }), T)).toEqual({ text: 'done', needs: false });
    // an archived one on /archived (designer m_19489): how it ended, then how long ago
    expect(archivedEnd(ag('a', { archived: true, status: 'done' }), T + 50 * 3_600_000)).toBe('✓ done · 2 d');
    expect(archivedEnd(ag('a', { archived: true, status: 'idle' }), T + 3 * 3_600_000)).toBe('– stopped · 3 h');
    expect(archivedEnd(ag('a', { archived: true, status: 'failed' }), T)).toBe('– stopped · now');
    expect(ago(T, T + 30_000)).toBe('now');
    expect(ago(T, T + 3 * 3_600_000)).toBe('3 h');
    expect(ago(T, T + 50 * 3_600_000)).toBe('2 d');
    expect(lineOf(ag('a', { purpose: 'make it fast' }))).toBe('make it fast');
    expect(lineOf(ag('a', { title: 'profiling', purpose: 'x' }))).toBe('profiling');
  });

  it("⌥ numbers as the TUI's (sb/panel.rs assign): start order, kept while alive, the smallest free one for a newcomer", () => {
    const main = ag('main', { main: true });
    const [p99, alerts, docs] = [ag('p99'), ag('alerts', { status: 'blocked', waits: 1 }), ag('docs')];
    const first = assign(new Map(), [main, p99, alerts]);
    expect([...first]).toEqual([['main', 0], ['p99', 1], ['alerts', 2]]);
    // p99 archived: alerts keeps 2, nobody is renumbered
    const after = assign(first, [main, alerts]);
    expect([...after]).toEqual([['main', 0], ['alerts', 2]]);
    // a newcomer takes the free 1
    expect(assign(after, [main, alerts, docs]).get('docs')).toBe(1);
  });

  it('numbersOf keeps a project\'s numbers between calls', () => {
    const main = ag('main', { main: true });
    expect(numbersOf('p-num', [main, ag('a'), ag('b')]).get('b')).toBe(2);
    expect(numbersOf('p-num', [main, ag('b')]).get('b')).toBe(2);
  });
});

describe('R9/S3: the agents list end says whom it waits on', () => {
  it("'waiting on bise' dim, 'waiting on you' in the accent", () => {
    expect(endOf(ag('a', { status: 'working', waiting_on: { who: 'agent', name: 'main' } }), T)).toEqual({ text: 'waiting on bise', needs: false });
    expect(endOf(ag('a', { waiting_on: { who: 'you' } }), T)).toEqual({ text: 'waiting on you', needs: true });
  });
});
