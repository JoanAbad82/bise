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
