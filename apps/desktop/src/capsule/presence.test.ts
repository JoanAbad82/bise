import { describe, expect, it } from 'vitest';
import type { SpotData } from '@/spotlight';
import { beatOf, BEAT_CHARS, presenceOf, teamArms } from './presence';

const agent = (name: string, status: 'working' | 'idle' | 'waiting', archived = false) => ({ name, project: 'p', status, title: '', archived });
const data = (agents: SpotData['agents'], cards: SpotData['cards'] = []): SpotData => ({ agents, projects: [], cards });
const card = (id: string, agentName: string) => ({ id, card: 1, agent: agentName, project: 'p', text: 'ok?', kind: 'question' as const });

describe("the capsule's ':*' (bise-presence v10)", () => {
  it('listening, thinking, answering from the view', () => {
    const d = data([]);
    expect(presenceOf({ kind: 'talk', phase: 'listen', handsFree: false }, d, false)).toMatchObject({ listening: true, working: false, speaking: false, tip: 'bise: listening' });
    expect(presenceOf({ kind: 'talk', phase: 'think', handsFree: false }, d, false)).toMatchObject({ listening: false, working: true });
    expect(presenceOf({ kind: 'answer' }, d, true)).toMatchObject({ speaking: true });
    expect(presenceOf({ kind: 'answer' }, d, false)).toMatchObject({ speaking: false, tip: 'bise: all quiet' });
  });

  it('a wait: the accent, its key for the two kisses, the tip in words', () => {
    const p = presenceOf({ kind: 'spot' }, data([agent('a', 'waiting')], [card('p.4', 'a')]), false);
    expect(p).toMatchObject({ waits: true, kiss: 'p.4', tip: 'bise: 1 thing waits for you' });
  });

  it('the star is the team: a branch per running agent, the waiting ones in the accent, archived ones out, none the plain star', () => {
    expect(teamArms(data([]))).toBeUndefined();
    expect(teamArms(data([agent('a', 'idle')]))).toBeUndefined();
    expect(teamArms(data([agent('a', 'working'), agent('b', 'working'), agent('c', 'working', true)]))).toEqual(['run', 'run']);
    expect(teamArms(data([agent('a', 'working'), agent('b', 'waiting')], [card('p.1', 'b')]))).toEqual(['run', 'wait']);
    const many = data(Array.from({ length: 9 }, (_, i) => agent(`a${String(i)}`, 'working')));
    expect(teamArms(many)).toHaveLength(6);
    expect(presenceOf({ kind: 'spot' }, many, false).tip).toBe('bise: working with 9 agents');
  });

  it('one beat per chunk of the answer', () => {
    expect(beatOf('')).toBe(0);
    expect(beatOf('x'.repeat(BEAT_CHARS))).toBe(1);
    expect(beatOf('x'.repeat(BEAT_CHARS * 3 + 2))).toBe(3);
  });
});
