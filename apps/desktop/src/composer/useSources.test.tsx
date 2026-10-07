// @vitest-environment happy-dom
import type { ReactNode } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { CorePort } from '@/shared/api';
import { Store, StoreProvider, replay } from '@/store';
import { useComposerSources } from './useSources';

const P = 'acme-1a2b3c4d';

function setup() {
  const port: CorePort = {
    send: () => undefined,
    onEvent: () => () => undefined,
    onState: () => () => undefined,
    state: () => Promise.resolve('up'),
  };
  const store = new Store(port);
  store.setCore('up');
  replay(store);
  const wrapper = ({ children }: { children: ReactNode }) => <StoreProvider store={store}>{children}</StoreProvider>;
  return { store, wrapper };
}

const agentsEv = (perf: Record<string, unknown>) => ({
  ev: 'agents',
  project: P,
  agents: [
    { archived: false, main: true, name: 'main', purpose: '', since_ms: 1, status: 'idle', title: '', waits: 0 },
    { archived: false, main: false, name: 'perf', parent: 'main', purpose: 'p', since_ms: 1, status: 'working', title: 't', waits: 0, ...perf },
  ],
});

afterEach(cleanup);

describe('K4: the agent in view refuses images only when its model reads none', () => {
  it("a catalog model without vision names the model; another agent or no agent refuses nothing", () => {
    const { wrapper } = setup();
    // the fixture's perf runs mistral/codestral-latest with vision: false
    expect(renderHook(() => useComposerSources(P, {}, 'perf'), { wrapper }).result.current.noVision).toBe('mistral/codestral-latest');
    expect(renderHook(() => useComposerSources(P, {}, 'main'), { wrapper }).result.current.noVision).toBeUndefined();
    expect(renderHook(() => useComposerSources(P), { wrapper }).result.current.noVision).toBeUndefined();
  });

  it('a /model switch follows the next agents event; an unknown model is never refused on a guess', () => {
    const { store, wrapper } = setup();
    const { result } = renderHook(() => useComposerSources(P, {}, 'perf'), { wrapper });
    expect(result.current.noVision).toBe('mistral/codestral-latest');
    act(() => {
      store.apply(agentsEv({ model: 'mistral/mistral-medium-latest', vision: true }));
    });
    expect(result.current.noVision).toBeUndefined();
    act(() => {
      store.apply(agentsEv({ model: 'someone/unlisted' }));
    });
    expect(result.current.noVision).toBeUndefined();
    act(() => {
      store.apply(agentsEv({ vision: false }));
    });
    expect(result.current.noVision).toBe('perf');
  });
});

describe("the TUI's lists (qa-type b37dc4c1 reds 1 and 2)", () => {
  it("'@' lists the other agents, never the one he writes to; an agent argument never offers main", () => {
    const { store, wrapper } = setup();
    act(() => {
      store.apply({
        ev: 'agents',
        project: P,
        agents: [
          { archived: false, main: true, name: 'main', purpose: '', since_ms: 1, status: 'idle', title: '', waits: 0 },
          { archived: false, main: false, name: 'p99', purpose: '', since_ms: 1, status: 'done', title: '', waits: 0 },
          { archived: false, main: false, name: 'alerts', purpose: '', since_ms: 1, status: 'working', title: '', waits: 0 },
        ],
      });
    });
    const inMain = renderHook(() => useComposerSources(P, {}, 'main'), { wrapper }).result.current;
    expect(inMain.agents.map((a) => a.name)).toEqual(['p99', 'alerts']);
    expect(inMain.choices?.('agent', '').map((c) => c.value)).toEqual(['p99', 'alerts']);
    const inP99 = renderHook(() => useComposerSources(P, {}, 'p99'), { wrapper }).result.current;
    expect(inP99.agents.map((a) => a.name)).toEqual(['main', 'alerts']);
    expect(inP99.choices?.('agent', '').map((c) => c.value), 'main is never an agent argument').toEqual(['p99', 'alerts']);
  });
});
