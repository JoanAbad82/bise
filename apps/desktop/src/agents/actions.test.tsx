// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Agent, HubCmd, Worktree } from '@/proto';
import type { CoreCmd, CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { createRouter, RouterContext } from '@/app/router';
import { hasChanges, modelChoices, nameProblem, newCmd, renameAgent, setEffort, setModel } from './actions';
import { AgentsScreen } from './AgentsScreen';

const P = 'acme-1a2b3c4d';
const ag = (name: string, over: Partial<Agent> = {}): Agent => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1, waits: 0, ...over });
const wt = (over: Partial<Worktree> = {}): Worktree => ({ path: '/p', branch: 'main', dirty: false, ahead: 0, behind: 0, ...over });

describe('agent actions, pure', () => {
  it('new: the brief, a name only when given, with_changes only with its own worktree', () => {
    expect(newCmd(P, { brief: '  ' })).toBeUndefined();
    expect(newCmd(P, { brief: ' fix the cart ' })).toEqual({ cmd: 'new', project: P, brief: 'fix the cart' });
    expect(newCmd(P, { brief: 'x', name: ' cart ', worktree: true, withChanges: true })).toEqual({ cmd: 'new', project: P, brief: 'x', name: 'cart', worktree: true, with_changes: true });
    expect(newCmd(P, { brief: 'x', withChanges: true })).toEqual({ cmd: 'new', project: P, brief: 'x' });
  });
  it('a name: not empty, letters digits dashes, not main, not taken (its own is fine)', () => {
    const list = [ag('main'), ag('p99'), ag('alerts')];
    expect(nameProblem('', list)).toBe('a name, please');
    expect(nameProblem('a b', list)).toBe('letters, digits and dashes only');
    expect(nameProblem('main', list)).toBe("'main' is the project's own");
    expect(nameProblem('p99', list)).toBe('p99 exists already');
    expect(nameProblem('p99', list, 'p99')).toBeUndefined();
    expect(nameProblem('perf-2', list)).toBeUndefined();
  });
  it('rename, model, effort send their typed commands; nothing for an empty or unchanged value', () => {
    const sent: HubCmd[] = [];
    const s = { command: (c: HubCmd) => sent.push(c) };
    expect(renameAgent(s, P, 'p99', 'p99')).toBe(false);
    expect(renameAgent(s, P, 'p99', ' perf ')).toBe(true);
    expect(setModel(s, P, 'p99', '')).toBe(false);
    expect(setModel(s, P, 'p99', 'anthropic/claude-opus-4', true)).toBe(true);
    expect(setEffort(s, P, 'p99', 'high')).toBe(true);
    expect(sent).toEqual([
      { cmd: 'rename', project: P, agent: 'p99', to: 'perf' },
      { cmd: 'model', project: P, agent: 'p99', model: 'anthropic/claude-opus-4', default: true },
      { cmd: 'effort', project: P, agent: 'p99', effort: 'high' },
    ]);
  });
  it('models offered: its own first, then the ones in use; his changes from his checkout only', () => {
    expect(modelChoices([ag('a', { model: 'x/1' }), ag('b', { model: 'y/2' }), ag('c', { model: 'x/1' })], 'y/2')).toEqual(['y/2', 'x/1']);
    expect(hasChanges([wt({ dirty: true, agent: 'p99' })])).toBe(false);
    expect(hasChanges([wt({ dirty: true })])).toBe(true);
  });
});

function setup() {
  const cmds: CoreCmd[] = [];
  const port: CorePort = { send: (c) => cmds.push(c), onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  const store = new Store(port);
  store.setCore('up');
  store.apply({ ev: 'agents', project: P, agents: [ag('main'), ag('p99', { model: 'openai/gpt-5', effort: 'medium' })] });
  store.apply({ ev: 'worktrees', project: P, items: [wt({ dirty: true })] });
  const router = createRouter({ screen: 'bise' });
  const v = render(
    <StoreProvider store={store}>
      <RouterContext value={router}>
        <AgentsScreen project={P} />
      </RouterContext>
    </StoreProvider>,
  );
  return { store, cmds, v };
}

afterEach(cleanup);

describe('the agents screen: new, rename, model, reasoning', () => {
  it('+ new agent: a sheet; ⏎ sends new with its fields; with my changes only when he has some and a worktree; a refusal shows in place', () => {
    const { store, cmds, v } = setup();
    fireEvent.click(v.getByTestId('agents.new'));
    expect(v.queryByTestId('agents.new.changes')).toBeNull();
    fireEvent.click(v.getByTestId('agents.new.worktree'));
    fireEvent.click(v.getByTestId('agents.new.changes'));
    fireEvent.change(v.getByTestId('agents.new.name'), { target: { value: 'cart' } });
    fireEvent.change(v.getByTestId('agents.new.brief'), { target: { value: 'fix the cart totals' } });
    fireEvent.keyDown(v.getByTestId('agents.new.brief'), { key: 'Enter' });
    expect(cmds).toContainEqual({ cmd: 'new', project: P, brief: 'fix the cart totals', name: 'cart', worktree: true, with_changes: true });
    act(() => {
      store.apply({ ev: 'error', project: P, cmd: 'new', text: 'cart exists already' });
    });
    expect(v.getByTestId('agents.new.error').textContent).toBe('cart exists already');
    // another command's refusal never lands in the sheet
    act(() => {
      store.apply({ ev: 'error', project: P, cmd: 'stop', text: 'other' });
    });
    expect(v.getByTestId('agents.new.error').textContent).toBe('cart exists already');
  });

  it('the sheet closes when the named agent appears', () => {
    const { store, v } = setup();
    fireEvent.click(v.getByTestId('agents.new'));
    fireEvent.change(v.getByTestId('agents.new.name'), { target: { value: 'cart' } });
    fireEvent.change(v.getByTestId('agents.new.brief'), { target: { value: 'fix it' } });
    fireEvent.click(v.getByTestId('agents.new.send'));
    act(() => {
      store.apply({ ev: 'agents', project: P, agents: [ag('main'), ag('p99'), ag('cart', { status: 'working' })] });
    });
    expect(v.queryByTestId('agents.newsheet')).toBeNull();
    expect(v.getByTestId('agents.row.cart')).toBeTruthy();
  });

  it("…: rename inline (⏎), a taken name said before sending; model and reasoning from the row's values", () => {
    const { store, cmds, v } = setup();
    fireEvent.click(v.getByTestId('agents.more.p99'));
    const name = v.getByTestId('agents.rename.p99');
    fireEvent.change(name, { target: { value: 'main' } });
    fireEvent.keyDown(name, { key: 'Enter' });
    expect(v.getByTestId('agents.tune.p99').textContent).toContain("'main' is the project's own");
    expect(cmds.some((c) => c.cmd === 'rename')).toBe(false);
    fireEvent.change(name, { target: { value: 'perf' } });
    fireEvent.keyDown(name, { key: 'Enter' });
    expect(cmds).toContainEqual({ cmd: 'rename', project: P, agent: 'p99', to: 'perf' });

    fireEvent.click(v.getByTestId('agents.more.p99'));
    expect((v.getByTestId('agents.model.p99') as HTMLInputElement).value).toBe('openai/gpt-5');
    expect(v.getByTestId('agents.effort.p99.medium').getAttribute('aria-checked')).toBe('true');
    fireEvent.click(v.getByTestId('agents.effort.p99.high'));
    expect(cmds).toContainEqual({ cmd: 'effort', project: P, agent: 'p99', effort: 'high' });
    fireEvent.change(v.getByTestId('agents.model.p99'), { target: { value: 'anthropic/claude-opus-4' } });
    fireEvent.click(v.getByTestId('agents.model.p99.set'));
    expect(cmds).toContainEqual({ cmd: 'model', project: P, agent: 'p99', model: 'anthropic/claude-opus-4' });
    act(() => {
      store.apply({ ev: 'error', project: P, cmd: 'model', text: 'no key for anthropic: /provider' });
    });
    expect(v.getByTestId('agents.tune.p99.error').textContent).toBe('no key for anthropic: /provider');
  });
});
