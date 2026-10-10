// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Agent, HubCmd, Model, Worktree } from '@/proto';
import { hub_ev } from '@/proto/fixtures.gen';
import type { CoreCmd, CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { createRouter, RouterContext } from '@/app/router';
import { defaultWords, effortsFor, hasChanges, modelChoices, modelGroups, modelOf, nameProblem, newCmd, renameAgent, setEffort, setModel } from './actions';
import { AgentsScreen } from './AgentsScreen';

const P = 'acme-1a2b3c4d';
const ag = (name: string, over: Partial<Agent> = {}): Agent => ({ name, dir: name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1, waits: 0, ...over });
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
    // it waits for the hub: the field stays, saying so
    expect(v.getByTestId('agents.rename.p99.wait').textContent).toBe('renaming…');
    // refused: the hub's words in place, the field editable again, no 'renaming…'
    act(() => {
      store.apply({ ev: 'error', project: P, cmd: 'rename', text: 'invalid or taken name: perf' });
    });
    expect(v.getByTestId('agents.tune.p99.error').textContent).toBe('invalid or taken name: perf');
    expect(v.queryByTestId('agents.rename.p99.wait')).toBeNull();
    expect((v.getByTestId('agents.rename.p99') as HTMLInputElement).readOnly).toBe(false);
    expect((v.getByTestId('agents.rename.p99') as HTMLInputElement).value).toBe('perf');

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

  it('a rename that lands: renaming… until the agents event has the new name, then onRenamed with it (the thread follows)', async () => {
    const { Tune } = await import('./Tune');
    const cmds: CoreCmd[] = [];
    const port: CorePort = { send: (c) => cmds.push(c), onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
    const store = new Store(port);
    store.setCore('up');
    store.apply({ ev: 'agents', project: P, agents: [ag('main'), ag('p99')] });
    const renamed: string[] = [];
    const v = render(
      <StoreProvider store={store}>
        <RouterContext value={createRouter({ screen: 'bise' })}>
          <Tune project={P} a={ag('p99')} onRenamed={(to) => renamed.push(to)} />
        </RouterContext>
      </StoreProvider>,
    );
    fireEvent.change(v.getByTestId('agents.rename.p99'), { target: { value: 'perf' } });
    fireEvent.keyDown(v.getByTestId('agents.rename.p99'), { key: 'Enter' });
    expect(cmds).toContainEqual({ cmd: 'rename', project: P, agent: 'p99', to: 'perf' });
    expect(renamed).toEqual([]);
    expect(v.getByTestId('agents.rename.p99.wait')).toBeTruthy();
    act(() => {
      store.apply({ ev: 'agents', project: P, agents: [ag('main'), ag('perf')] });
    });
    expect(renamed).toEqual(['perf']);
  });

  it("the model list is the hub's catalog: under each provider then aliases, the catalog's words as they come, the current one marked, its default roles; reasoning follows the picked model", () => {
    const { store, cmds, v } = setup();
    const ev = hub_ev.find((e) => e.ev === 'models');
    if (ev?.ev !== 'models') throw new Error('no models fixture');
    act(() => {
      store.apply({ ...ev, project: P });
      store.apply({ ev: 'agents', project: P, agents: [ag('main'), ag('p99', { model: 'anthropic/claude-opus-5-5', effort: 'high' })] });
    });
    fireEvent.click(v.getByTestId('agents.more.p99'));
    const list = v.getByTestId('agents.models.p99');
    expect([...list.querySelectorAll('.ag-model-head')].map((h) => h.textContent)).toEqual(['Anthropic', 'Mistral', 'aliases']);
    const opus = v.getByTestId('agents.model.p99.pick.anthropic/claude-opus-5-5');
    expect(opus.getAttribute('aria-selected')).toBe('true');
    expect(opus.textContent).toContain('✓');
    expect(opus.textContent).toContain('opus 5.5');
    expect(opus.textContent).toContain('1M');
    expect(opus.textContent).toContain('default for main and agents');
    expect(v.getByTestId('agents.model.p99.pick.mistral/devstral-medium-latest').textContent).toContain('128k · config.toml');
    expect(v.getByTestId('agents.model.p99.pick.opus').textContent).toContain('= anthropic/claude-opus-5-5');
    // opus 5.5 takes low, medium, high, max
    expect(v.getByTestId('agents.effort.p99.max')).toBeTruthy();
    // devstral has no reasoning setting: picked, it says so and offers none
    fireEvent.click(v.getByTestId('agents.model.p99.pick.mistral/devstral-medium-latest'));
    expect(cmds).toContainEqual({ cmd: 'model', project: P, agent: 'p99', model: 'mistral/devstral-medium-latest' });
    expect(v.queryByTestId('agents.effort.p99.high')).toBeNull();
    expect(v.getByTestId('agents.effort.p99.none').textContent).toBe('devstral medium has no reasoning setting');
    // refused: back to the model it runs
    act(() => {
      store.apply({ ev: 'error', project: P, cmd: 'model', text: 'no key for mistral yet: /provider' });
    });
    expect(v.getByTestId('agents.model.p99.pick.anthropic/claude-opus-5-5').getAttribute('aria-selected')).toBe('true');
    expect(v.getByTestId('agents.effort.p99.max')).toBeTruthy();
  });
});

describe('the model mark follows the hub (qa-flows a8758ee6)', () => {
  it('a model changed elsewhere (TUI /model) moves the mark, with or without a pick of his before', () => {
    const { store, cmds, v } = setup();
    const ev = hub_ev.find((e) => e.ev === 'models');
    if (ev?.ev !== 'models') throw new Error('no models fixture');
    const runs = (model: string) => {
      act(() => {
        store.apply({ ev: 'agents', project: P, agents: [ag('main'), ag('p99', { model })] });
      });
    };
    act(() => {
      store.apply({ ...ev, project: P });
    });
    runs('anthropic/claude-opus-5-5');
    fireEvent.click(v.getByTestId('agents.more.p99'));
    const on = (id: string) => v.getByTestId(`agents.model.p99.pick.${id}`).getAttribute('aria-selected');
    // no pick: the row moves, the mark follows
    runs('mistral/devstral-medium-latest');
    expect(on('mistral/devstral-medium-latest')).toBe('true');
    expect(on('anthropic/claude-opus-5-5')).toBe('false');
    // his pick, held until the row moves...
    fireEvent.click(v.getByTestId('agents.model.p99.pick.anthropic/claude-opus-5-5'));
    expect(cmds).toContainEqual({ cmd: 'model', project: P, agent: 'p99', model: 'anthropic/claude-opus-5-5' });
    expect(on('anthropic/claude-opus-5-5')).toBe('true');
    // ...then the TUI sets another one: the row wins
    runs('opus');
    expect(on('opus')).toBe('true');
    expect(on('anthropic/claude-opus-5-5')).toBe('false');
  });
});

describe('the catalog, pure', () => {
  it('groups, aliases resolved, efforts, default roles', () => {
    const ev = hub_ev.find((e) => e.ev === 'models');
    if (ev?.ev !== 'models') throw new Error('no models fixture');
    const ms = ev.items;
    expect(modelGroups(ms).map((g) => [g.head, g.rows.map((m) => m.id)])).toEqual([
      ['Anthropic', ['anthropic/claude-opus-5-5']],
      ['Mistral', ['mistral/devstral-medium-latest']],
      ['aliases', ['opus']],
    ]);
    expect(modelOf(ms, 'opus')?.id).toBe('anthropic/claude-opus-5-5');
    expect(effortsFor(ms, 'opus')).toEqual(['low', 'medium', 'high', 'max']);
    expect(effortsFor(ms, 'mistral/devstral-medium-latest')).toEqual([]);
    expect(effortsFor(ms, 'openai/unknown')).toEqual(['low', 'medium', 'high']);
    expect(defaultWords(ms[0] as Model)).toBe('default for main and agents');
    expect(defaultWords(ms[1] as Model)).toBe('');
  });
});


describe('L5: a model whose provider has no key yet (amb-kit 6078b20c)', () => {
  it("Tune's pick of it opens settings · models and sends nothing; a ready model is sent at once", async () => {
    const { releaseHeld } = await import('@/settings');
    const { Tune } = await import('./Tune');
    const cmds: CoreCmd[] = [];
    const port: CorePort = { send: (c) => cmds.push(c), onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
    const store = new Store(port);
    store.setCore('up');
    store.apply({ ev: 'agents', project: P, agents: [ag('main'), ag('p99', { model: 'anthropic/claude-opus-5-5' })] });
    store.apply({
      ev: 'models',
      project: P,
      items: [
        { id: 'anthropic/claude-opus-5-5', label: 'opus 5.5', provider: 'Anthropic', short: '1M', provider_id: 'anthropic', key_ready: true },
        { id: 'mistral/devstral-medium-latest', label: 'devstral medium', provider: 'Mistral', short: '128k', provider_id: 'mistral', key_ready: false },
      ],
    });
    const router = createRouter({ screen: 'agents', project: P });
    const v = render(
      <StoreProvider store={store}>
        <RouterContext value={router}>
          <Tune project={P} a={ag('p99', { model: 'anthropic/claude-opus-5-5' })} />
        </RouterContext>
      </StoreProvider>,
    );
    fireEvent.click(v.getByTestId('agents.model.p99.pick.mistral/devstral-medium-latest'));
    expect(cmds.filter((c) => c.cmd === 'model'), 'nothing sent before the key').toEqual([]);
    expect(router.get()).toEqual({ screen: 'settings', page: 'models' });
    releaseHeld();
    fireEvent.click(v.getByTestId('agents.model.p99.pick.anthropic/claude-opus-5-5'));
    expect(cmds.filter((c) => c.cmd === 'model')).toEqual([{ cmd: 'model', project: P, agent: 'p99', model: 'anthropic/claude-opus-5-5' }]);
  });
});
