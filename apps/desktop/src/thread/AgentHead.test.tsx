// @vitest-environment happy-dom
// The head's name beside its role (Gabriel: art-gallery's name drawn over 'Propose a redesign…').
// Happy-dom draws no boxes: the measured check (boxes never meet, 800/1100/1400, light and dark) is
// tests/checks/thread/head-fit.spec.ts. Here, what made it: a live name allowed to shrink under its text.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { CorePort } from '@/shared/api';
import type { Agent } from '@/proto';
import { Store, StoreProvider } from '@/store';
import { createRouter, RouterContext } from '@/app/router';
import { AgentHead } from './AgentHead';

const P = 'acme-1a2b3c4d';

const agent: Agent = {
  name: 'art-gallery-with-a-long-name',
  main: false,
  status: 'working',
  archived: false,
  title: '',
  purpose: 'Propose a redesign of the artifacts page (desktop app first, terminal after), with shelves by theme',
  since_ms: 1,
  waits: 0,
  dir: '/w/art-gallery',
  watching: [],
};

function head(restore?: () => void) {
  const port: CorePort = { send: () => undefined, onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  const store = new Store(port);
  store.setCore('up');
  return render(
    <StoreProvider store={store}>
      <RouterContext value={createRouter({ screen: 'bise' })}>
        <AgentHead project={P} a={agent} named starting {...(restore === undefined ? {} : { restore })} />
      </RouterContext>
    </StoreProvider>,
  );
}

afterEach(() => {
  cleanup();
});

describe("the agent head's name", () => {
  it('beside its artifact, a live name keeps its width: no min-width lets it shrink under its own text', () => {
    const v = head();
    const name = v.getByTestId('thread.head.name');
    expect(name.textContent).toBe(agent.name);
    expect(name.style.minWidth).toBe('');
    expect(v.getByTestId('thread.head.role').textContent).toBe(agent.purpose);
  });

  it("an archived maker's name still gets the width useArchivedFit keeps", () => {
    const v = head(() => undefined);
    // (happy-dom measures nothing: the kept width is 0 here, but it is set)
    expect(v.getByTestId('thread.head.name').style.minWidth).not.toBe('');
  });
});
