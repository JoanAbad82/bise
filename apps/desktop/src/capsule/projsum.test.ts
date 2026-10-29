// A live project's second line and its submenu's agents (designer m_29577).
import { describe, expect, it } from 'vitest';
import type { SpotAgent, SpotCard, SpotData } from '@/spotlight';
import { ageShort, inTriangle, subAgents, subHead, subSide, summaryOf } from './projsum';

const A = (name: string, status: SpotAgent['status'], more: Partial<SpotAgent> = {}): SpotAgent => ({ name, project: 'shop', status, title: `${name} title`, ...more });
const C = (agent: string, text: string, project = 'shop'): SpotCard => ({ id: `${project}.1`, card: 1, agent, project, text, kind: 'question' });
const D = (agents: SpotAgent[], cards: SpotCard[] = []): SpotData => ({ agents, cards, projects: [] });

describe('the second line', () => {
  it('what waits on him first: its first card, who asks and the first line', () => {
    const d = D([A('perf', 'working', { since: 5 })], [C('search', 'which size system should the filter use?\nmore'), C('perf', 'merge?')]);
    expect(summaryOf(d, 'shop')).toEqual({ kind: 'wait', who: 'search', text: 'which size system should the filter use?' });
  });

  it("else the newest-active working agent: its note, else its title, and how many others work", () => {
    const d = D([
      A('old', 'working', { since: 1, note: 'an old note' }),
      A('perf', 'working', { since: 9, note: 'merging the cache fix' }),
      A('docs', 'working', { since: 3 }),
      A('idle', 'idle', { since: 99 }),
      A('gone', 'working', { since: 100, archived: true }),
    ]);
    expect(summaryOf(d, 'shop')).toEqual({ kind: 'work', who: 'perf', text: 'merging the cache fix', more: 2 });
    expect(summaryOf(D([A('docs', 'working', { since: 3, note: '  ' })]), 'shop')).toEqual({ kind: 'work', who: 'docs', text: 'docs title', more: 0 });
  });

  it("nothing to say: null; main reads 'bise'", () => {
    expect(summaryOf(D([A('idle', 'idle')]), 'shop')).toBeNull();
    expect(summaryOf(D([], [C('main', 'send it?')]), 'shop')).toMatchObject({ who: 'bise' });
  });

  it("bise's line: what waits from bise, else main's note, else nothing (never another agent's work)", () => {
    const home = (agents: SpotAgent[], cards: SpotCard[] = []): SpotData => D(agents.map((a) => ({ ...a, project: 'home' })), cards);
    expect(summaryOf(home([A('main', 'working', { main: true, note: 'watching the launch' })]), 'home', true)).toEqual({ kind: 'note', text: 'watching the launch' });
    expect(summaryOf(home([A('main', 'working', { main: true, note: 'x' })], [C('main', 'send the update?', 'home')]), 'home', true)).toMatchObject({ kind: 'wait' });
    expect(summaryOf(home([A('perf', 'working', { since: 1 }), A('main', 'idle', { main: true })]), 'home', true)).toBeNull();
  });
});

describe('the submenu', () => {
  it('waiting on him first, then at work (newest first), then the rest live; never idle, done or archived', () => {
    const d = D(
      [
        A('a', 'working', { since: 1, sign: { g: '∿', tone: 'ink' } }),
        A('b', 'working', { since: 5, sign: { g: '∿', tone: 'ink' } }),
        A('c', 'blocked', { since: 2, sign: { g: '⋯', tone: 'dim' } }),
        A('d', 'idle', { sign: { g: '○', tone: 'dim' } }),
        A('e', 'done'),
        A('f', 'working', { archived: true }),
        A('g', 'idle', { since: 3, sign: { g: '…', tone: 'ink' } }),
        A('main', 'working', { since: 0, main: true, sign: { g: '∿', tone: 'ink' } }),
      ],
      [C('a', 'go?')],
    );
    const s = subAgents(d, 'shop');
    expect(s.map((x) => x.name)).toEqual(['a', 'b', 'main', 'g', 'c']);
    expect(s[0]?.sign).toEqual({ g: '?', tone: 'acc' });
    expect(s[2]?.shown).toBe('bise');
  });

  it("its head and its ages", () => {
    expect(subHead(2, 1)).toBe('2 working · 1 waiting for you');
    expect(subHead(0, 3)).toBe('3 waiting for you');
    expect([0, 59_000, 4 * 60_000, 2 * 3_600_000, 3 * 86_400_000].map(ageShort)).toEqual(['now', 'now', '4m', '2h', '3d']);
  });

  it('opens on the side with room: right, else left, right again when neither has room', () => {
    expect(subSide(100, 340, 0, 1440)).toBe('right');
    expect(subSide(1000, 340, 0, 1440)).toBe('left');
    expect(subSide(100, 340, 0, 600)).toBe('right');
  });

  it('the safe triangle: a move toward the submenu is in it, a move down the menu is not', () => {
    const from = { x: 100, y: 100 };
    const a = { x: 340, y: 60 };
    const b = { x: 340, y: 300 };
    expect(inTriangle({ x: 200, y: 130 }, from, a, b)).toBe(true);
    expect(inTriangle({ x: 100, y: 140 }, from, a, b)).toBe(false);
  });
});
