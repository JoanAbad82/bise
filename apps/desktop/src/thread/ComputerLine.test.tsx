// @vitest-environment happy-dom
// S29/L19 W1-W4: the live line under an agent's head, from the core's computer_live rows only.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ComputerAgent } from '@/proto';
import type { CoreCmd, CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { ComputerLine, computerRowOf, computerState, computerWords } from './ComputerLine';

const P = 'acme-1a2b3c4d';
const NOW = 1_760_000_120_000;
const driving: ComputerAgent = { agent: 'perf', key: 'h.perf', project: P, driving: 'Chrome', place: 'amazon.fr', since_ms: NOW - 120_000, kind: 'driving', mark: '↖', words: 'driving Chrome · amazon.fr' };
const paused: ComputerAgent = { ...driving, paused: true, kind: 'paused', mark: '?', words: 'you took the wheel · ⏎ give it back' };
const stopped: ComputerAgent = { ...driving, stopped: true, kind: 'stopped', mark: '↖', words: 'you stopped it driving Chrome · write to it to go on' };

function setup() {
  const cmds: CoreCmd[] = [];
  const port: CorePort = { send: (c) => cmds.push(c), onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  const store = new Store(port);
  store.setCore('up');
  return { store, cmds };
}

afterEach(cleanup);

describe('the computer-use line (pure)', () => {
  it("draws the core's mark and words, and adds the age only while it drives", () => {
    expect(computerWords(driving, NOW)).toBe('↖ driving Chrome · amazon.fr · 2 min');
    expect(computerWords(paused, NOW)).toBe('? you took the wheel · ⏎ give it back');
    expect(computerWords(stopped, NOW)).toBe('↖ you stopped it driving Chrome · write to it to go on');
    expect(computerWords({ ...driving, since_ms: null }, NOW)).toBe('↖ driving Chrome · amazon.fr');
  });
  it("its state is the core's kind; its row is this project's agent, never another bise's", () => {
    expect([driving, paused, stopped].map(computerState)).toEqual(['driving', 'paused', 'stopped']);
    const other: ComputerAgent = { agent: 'perf', key: 'x.perf', kind: 'driving', mark: '↖', words: 'driving Notes' };
    expect(computerRowOf([other, driving], P, 'perf')).toBe(driving);
    expect(computerRowOf([other], P, 'perf')).toBeUndefined();
  });
});

describe('the computer-use line in the window', () => {
  const draw = (store: Store) => render(<StoreProvider store={store}><ComputerLine project={P} agent="perf" /></StoreProvider>);

  it('nothing without a row; the line follows the rows', () => {
    const { store } = setup();
    const v = draw(store);
    expect(v.queryByTestId('thread.computer')).toBeNull();
    act(() => { store.apply({ ev: 'computer_live', items: [driving] }); });
    expect(v.getByTestId('thread.computer').dataset.state).toBe('driving');
    act(() => { store.apply({ ev: 'computer_live', items: [] }); });
    expect(v.queryByTestId('thread.computer')).toBeNull();
  });

  it('take and stop send their act with the key and draw nothing until the rows move', () => {
    const { store, cmds } = setup();
    act(() => { store.apply({ ev: 'computer_live', items: [driving] }); });
    const v = draw(store);
    fireEvent.click(v.getByTestId('thread.computer.take'));
    expect(cmds).toContainEqual({ cmd: 'computer', act: 'take', key: 'h.perf' });
    expect(v.getByTestId('thread.computer').dataset.state).toBe('driving');
    fireEvent.click(v.getByTestId('thread.computer.stop'));
    expect(cmds).toContainEqual({ cmd: 'computer', act: 'stop', key: 'h.perf' });
    act(() => { store.apply({ ev: 'computer_live', items: [paused] }); });
    expect(v.queryByTestId('thread.computer.take')).toBeNull();
    fireEvent.click(v.getByTestId('thread.computer.back'));
    expect(cmds).toContainEqual({ cmd: 'computer', act: 'hand_back', key: 'h.perf' });
    act(() => { store.apply({ ev: 'computer_live', items: [stopped] }); });
    expect(v.queryByTestId('thread.computer.back')).toBeNull();
    expect(v.queryByTestId('thread.computer.take')).toBeNull();
  });

  it('a click on the words opens the still (a peek asked with its key), esc closes it', () => {
    const { store, cmds } = setup();
    act(() => { store.apply({ ev: 'computer_live', items: [driving] }); });
    const v = draw(store);
    fireEvent.click(v.getByTestId('thread.computer.words'));
    expect(cmds.some((c) => c.cmd === 'computer' && c.act === 'peek' && c.key === 'h.perf')).toBe(true);
    expect(v.getByTestId('thread.computer.peek').textContent).toBe('looking…');
    act(() => { store.apply({ ev: 'computer_peek', key: 'h.perf', why: 'not_found' }); });
    expect(v.getByTestId('thread.computer.peek').textContent).toBe('nothing to show');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(v.queryByTestId('thread.computer.peek')).toBeNull();
  });
});
