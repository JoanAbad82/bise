// The right side's words and decisions: counts, the object per kind, an agent's speech, the ask buttons' intent.
import { describe, expect, it } from 'vitest';
import type { Agent, Card } from '@/proto';
import { side } from '@/proto/words_side.gen';
import { agentCounts, askButtons, bubbleCount, bubbleTip, inRank, pickIntent, speechOf, type Counts } from './model';
import { artifactObj, bubbleThing, laterObj, procObj } from './objects';

const agent = (name: string, over: Partial<Agent> = {}): Agent => ({
  name, dir: name, main: false, status: 'idle', archived: false, title: 'speed', purpose: 'make it fast', since_ms: 0, waits: 0, watching: [], ...over,
});
const card = (id: number, agentName: string, over: Partial<Card> = {}): Card => ({
  id, project: 'acme', kind: 'question', agent: agentName, question: 'run it?', options: [{ n: 1, label: 'yes' }, { n: 2, label: 'no' }, { n: 3, label: 'later' }], urgent: false, since_ms: id, ...over,
});
const COUNTS: Counts = { working: 3, asks: 1, busy: 3, artifacts: 12, newArtifacts: 2, timers: 1, watches: 1, running: 2 };

describe('the counts', () => {
  it('agents: working without main, asking by its open cards, busy each once', () => {
    const c = agentCounts([
      agent('main', { main: true, status: 'working' }),
      agent('perf', { status: 'working', waits: 1 }),
      agent('docs', { status: 'working' }),
      agent('old', { status: 'working', archived: true }),
      agent('idle'),
    ]);
    expect(c).toEqual({ working: 2, asks: 1, busy: 2 });
  });
  it('a bubble shows its count, the agents in the accent only when one asks', () => {
    expect(bubbleCount('agents', COUNTS)).toEqual({ n: 3, accent: true });
    expect(bubbleCount('agents', { ...COUNTS, asks: 0 }).accent).toBe(false);
    expect(bubbleCount('artifacts', COUNTS)).toEqual({ n: 2, accent: false });
    expect(bubbleCount('scheduled', COUNTS).n).toBe(2);
    expect(bubbleCount('processes', COUNTS).n).toBe(2);
  });
  it('a tip names the bubble and what it counts, "nothing" when empty', () => {
    expect(bubbleTip('agents', COUNTS)).toBe(side.bubble_tip({ name: side.agents, says: `${side.working({ n: 3 })} · ${side.asks({ n: 1 })}` }));
    const none: Counts = { working: 0, asks: 0, busy: 0, artifacts: 0, newArtifacts: 0, timers: 0, watches: 0, running: 0 };
    expect(bubbleTip('processes', none)).toBe(side.bubble_tip({ name: side.processes, says: side.bubble_none }));
  });
});

describe('the object of each thing', () => {
  it('the bubbles: bise\'s head, the easel, the hourglass, the rack', () => {
    expect(bubbleThing('agents')).toEqual({ head: 'main', main: true });
    expect(bubbleThing('artifacts')).toEqual({ obj: 'easel' });
    expect(bubbleThing('scheduled')).toEqual({ obj: 'hourglass' });
    expect(bubbleThing('processes')).toEqual({ obj: 'rack' });
  });
  it('an artifact by its kind', () => {
    expect(['pr', 'page', 'deck', 'sheet', 'link', 'image', 'video', 'file'].map(artifactObj)).toEqual(['mailbox', 'lectern', 'blackboard', 'charts', 'globe', 'easel', 'crt', 'lectern']);
  });
  it('a process by its typed facts: a web page, a port, nothing', () => {
    expect(procObj({ url: 'http://localhost:5173', ports: [5173] })).toBe('retro');
    expect(procObj({ url: null, ports: [9229] })).toBe('electronics');
    expect(procObj({ ports: [] })).toBe('rack');
  });
  it('a timer, a watch', () => {
    expect([laterObj('timer'), laterObj('watch')]).toEqual(['hourglass', 'telescope']);
  });
});

describe('the agents card', () => {
  it('the agents in the hub\'s rank, main first, the archived out', () => {
    const list = [agent('b', { rank: 2 }), agent('main', { main: true }), agent('a', { rank: 1 }), agent('gone', { archived: true })];
    expect(inRank(list).map((a) => a.name)).toEqual(['main', 'a', 'b']);
  });
  it('asks: its first card in the inbox order (rank, then oldest)', () => {
    const cards = [card(7, 'perf', { rank: 3 }), card(9, 'perf', { rank: 1 }), card(2, 'docs')];
    expect(speechOf(agent('perf', { status: 'working' }), cards)).toMatchObject({ k: 'asks', card: { id: 9 } });
  });
  it('thinks while it works (its note first), talks its report after, else idle on its title', () => {
    expect(speechOf(agent('a', { status: 'working', note: 'reading the flow' }), [])).toEqual({ k: 'thinks', text: 'reading the flow' });
    expect(speechOf(agent('a', { report: { kind: 'progress', text: 'readme done', at_ms: 1 } }), [])).toEqual({ k: 'talks', text: 'readme done' });
    expect(speechOf(agent('a'), [])).toEqual({ k: 'idle', text: 'speed' });
  });
  it('the buttons: the card\'s first two options, answer… when words answer it, none on an approval', () => {
    expect(askButtons(card(1, 'perf'))).toEqual({ opts: [{ n: 1, label: 'yes' }, { n: 2, label: 'no' }], words: true });
    expect(askButtons(card(1, 'perf', { approval: true })).words).toBe(false);
  });
  it('an option sends the inbox\'s pick, from the thread in view', () => {
    expect(pickIntent(card(4, 'perf'), 1, { project: 'acme', agent: 'docs' })).toEqual({ i: 'pick', project: 'acme', card: 4, n: 1, from: { at: { project: 'acme', agent: 'docs' } } });
  });
});
