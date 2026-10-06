// @vitest-environment happy-dom
// The spotlight: its list rules (the capsule's, signed by ambient) and the input that stays one
// node while the list changes under it (bug 7).
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flat, spotList, type SpotData } from './list';
import { Spotlight, answerLines, ANSWER_MAX_LINES } from './Spotlight';
import { cardLine, shortPath } from './words';

afterEach(cleanup);

const D: SpotData = {
  projects: [
    { id: 'tel', name: 'telemetry', path: '/Users/me/code/telemetry', branch: 'main', agents: 2 },
    { id: 'shop', name: 'shop', path: '/Users/me/code/shop', branch: 'main', agents: 1 },
  ],
  agents: [
    { name: 'perf', project: 'tel', status: 'working', title: 'sort_unstable in the hot query' },
    { name: 'alerts', project: 'tel', status: 'idle', title: 'page on p99 regressions' },
  ],
  cards: [{ id: 'c1', agent: 'alerts', project: 'tel', kind: 'question', text: 'Which threshold?' }],
  front: { app: 'Chrome', title: 'Pricing · Acme', url: 'https://acme.test/pricing' },
};

describe('the spotlight list', () => {
  it('empty: waiting for you, at work, environments with what is in front first, no ⌘ on it', () => {
    const l = spotList(D, '');
    expect(l.sections.map((s) => s.label)).toEqual(['waiting for you', 'at work', 'environments']);
    const envs = l.sections[2]?.items ?? [];
    expect(envs[0]).toMatchObject({ kind: 'front', name: 'Pricing · Acme', sub: 'in front: acme.test · Chrome' });
    expect(envs[1]).toMatchObject({ kind: 'env', name: 'telemetry', n: 1, sub: '~/code/telemetry · main · 2 agents' });
  });
  it('a word names agents and projects; a sentence asks bise first', () => {
    expect(flat(spotList(D, 'perf')).map((i) => i.id)).toEqual(['agent.tel.perf']);
    expect(flat(spotList(D, 'tele')).map((i) => i.id)).toEqual(['agent.tel.alerts', 'agent.tel.perf', 'env.tel']);
    const ask = spotList(D, 'why is the hot query slow for perf');
    expect(ask.mode).toBe('ask');
    expect(flat(ask).map((i) => i.id)).toEqual(['ask', 'agent.tel.perf']);
  });
  it('words: card lines and paths as ambient signed them', () => {
    expect(cardLine('t1-97894 is ready to try\n1 commit on t1-97894 · +3 −0')).toBe('t1-97894 is ready to try · 1 commit · +3 −0');
    expect(shortPath('/Users/me/.bise/gate/w-ambtools/h/code/telemetry')).toBe('~/…/w-ambtools/h/code/telemetry');
  });
  it('a long answer shows its start and says the rest is in bise', () => {
    const long = Array.from({ length: 40 }, (_, i) => `line ${i}`).join('\n');
    expect(answerLines(long).cut).toBe(true);
    expect(answerLines(long).shown.split('\n').length).toBe(ANSWER_MAX_LINES);
    expect(answerLines('short').cut).toBe(false);
  });
});

describe('the spotlight', () => {
  it('keeps one input node while the list changes, ⏎ on a sentence asks bise', async () => {
    const onAsk = vi.fn();
    const ui = render(<Spotlight data={D} onAsk={onAsk} onOpen={vi.fn()} onClose={vi.fn()} />);
    const input = ui.getByTestId('spot.input') as HTMLInputElement;
    for (const v of ['w', 'wh', 'why is the hot query slow']) {
      await act(async () => {
        fireEvent.input(input, { target: { value: v } });
        await Promise.resolve();
      });
      expect(ui.getByTestId('spot.input')).toBe(input);
    }
    expect(ui.getByTestId('spot.row.ask')).toBeTruthy();
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
      await Promise.resolve();
    });
    expect(onAsk).toHaveBeenCalledWith('why is the hot query slow');
    expect(input.value).toBe('');
  });
});
