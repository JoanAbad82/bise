import { describe, expect, it } from 'vitest';
import type { Agent } from '@/proto';
import { hub_ev } from '@/proto/fixtures.gen';
import { ago, archivedOf, dotOf, endOf, lineOf, liveOf } from './model';

const T = 1_791_100_000_000;
const ag = (name: string, over: Partial<Agent> = {}): Agent => ({ name, main: false, status: 'idle', archived: false, title: '', purpose: '', since_ms: T, waits: 0, ...over });

describe('the agents list', () => {
  it("the fixture's agents: main first, then by need", () => {
    const ev = hub_ev.find((e) => e.ev === 'agents');
    if (ev?.ev !== 'agents') throw new Error('no agents fixture');
    const names = liveOf(ev.agents).map((a) => a.name);
    expect(names[0]).toBe('main');
    expect(new Set(names)).toEqual(new Set(ev.agents.filter((a) => !a.archived).map((a) => a.name)));
  });

  it('main, then cards and blocked, failed, at work, done, at rest; newest change first; archived apart', () => {
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
    expect(liveOf(list).map((a) => a.name)).toEqual(['main', 'asks', 'stuck', 'broke', 'work-new', 'work-old', 'done', 'rest']);
    expect(archivedOf(list).map((a) => a.name)).toEqual(['gone']);
  });

  it('dots, ends and ages', () => {
    expect(dotOf('working')).toBe('wk');
    expect(dotOf('waiting')).toBe('nd');
    expect(dotOf('failed')).toBe('er');
    expect(endOf(ag('a', { waits: 3 }), T)).toEqual({ text: '3', needs: true });
    expect(endOf(ag('a', { status: 'working' }), T + 12 * 60_000)).toEqual({ text: '12 min', needs: false });
    expect(endOf(ag('a', { status: 'done' }), T)).toEqual({ text: 'done', needs: false });
    expect(ago(T, T + 30_000)).toBe('now');
    expect(ago(T, T + 3 * 3_600_000)).toBe('3 h');
    expect(ago(T, T + 50 * 3_600_000)).toBe('2d');
    expect(lineOf(ag('a', { purpose: 'make it fast' }))).toBe('make it fast');
    expect(lineOf(ag('a', { title: 'profiling', purpose: 'x' }))).toBe('profiling');
  });
});
