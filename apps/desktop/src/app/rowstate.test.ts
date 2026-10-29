// An agent row's state in words (page agents-float v1, his ask m_45828): who works and each one's state, put forward.
import { describe, expect, it } from 'vitest';
import type { Agent } from '@/proto';
import { side } from '@/proto/words_side.gen';
import { headParts, rowState } from './rowstate';

const NOW = new Date(2026, 9, 7, 14, 14).getTime();
const agent = (name: string, status: Agent['status'], over: Partial<Agent> = {}): Agent => ({
  name, dir: name, main: false, status, archived: false, title: 'collecte des sources', purpose: '', since_ms: NOW - 4 * 60_000, waits: 0, watching: [], ...over,
});

describe("an agent row's state", () => {
  it('at work: ∿ working and its turn time, in ink; its tip says since when', () => {
    const s = rowState(agent('con', 'working', { turn_ms: 12 * 60_000 }), NOW);
    expect(s).toMatchObject({ g: '∿', words: 'working · 12 min', tone: 'work', back: false });
    expect(s.tip).toBe('working since 14:02 · 12 min');
  });
  it('asks him: ? asks you in the accent, whatever else it does', () => {
    expect(rowState(agent('rel', 'working', { waits: 1 }), NOW)).toMatchObject({ g: '?', words: side.row_asks, tone: 'ask', back: false });
    expect(rowState(agent('rel', 'idle', { waiting_on: { who: 'you' } }), NOW).tone).toBe('ask');
  });
  it('another agent holds it: … waits for an agent, its line 2 names which (main is bise)', () => {
    const s = rowState(agent('rev', 'working', { waiting_on: { who: 'agent', name: 'connaissances-vente' } }), NOW);
    expect(s).toMatchObject({ g: '…', words: 'waits for an agent', tone: 'wait', l2: 'waits for connaissances-vente', back: false });
    expect(rowState(agent('rev', 'working', { waiting_on: { who: 'agent', name: 'main' } }), NOW).l2).toBe('waits for bise');
  });
  it("a command it resumes on: … waiting and how long, its tip names the command (designer m_45847)", () => {
    const s = rowState(agent('perf', 'idle', { watching: [{ id: 3, kind: 'bg', resumes: true, since_ms: NOW - 3 * 60_000, what: 'cargo test' }] }), NOW);
    expect(s).toMatchObject({ g: '…', words: 'waiting · 3 min', tone: 'wait', tip: 'waiting for cargo test · 3 min', back: false });
  });
  it('idle and done step back, with how long; failed in red, with what failed on line 2', () => {
    expect(rowState(agent('bise', 'idle'), NOW)).toMatchObject({ g: '', words: 'idle · 4 min', tone: 'rest', back: true });
    expect(rowState(agent('cad', 'done', { since_ms: NOW - 3_600_000 }), NOW)).toMatchObject({ g: '✓', words: 'done · 1 h', tone: 'rest', back: true });
    const f = rowState(agent('imp', 'failed', { since_ms: NOW - 20 * 60_000, report: { kind: 'failed', text: 'turn failed: provider 500', at_ms: NOW } }), NOW);
    expect(f).toMatchObject({ g: '✗', words: 'failed · 20 min', tone: 'err', back: false, l2: 'turn failed: provider 500' });
  });
  it('the head counts the working rows; a part at 0 drops', () => {
    const w = rowState(agent('a', 'working'), NOW);
    const i = rowState(agent('b', 'idle'), NOW);
    expect(headParts([w, w, i], 1)).toEqual({ working: '2 working', waiting: '1 waiting for you' });
    expect(headParts([i], 0)).toEqual({ working: '', waiting: '' });
  });
});
