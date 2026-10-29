// @vitest-environment happy-dom
// The agents list's selected row comes back after a reload (keep.ts; lead m_12068's known gap).
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Agent } from '@/proto';
import type { CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { createRouter, RouterContext } from '@/app/router';
import { keep } from '@/app/keep';
import { AgentsScreen } from './AgentsScreen';

const P = 'acme-1a2b3c4d';
const ag = (name: string): Agent => ({ name, dir: name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1, waits: 0, watching: [] });

function screen() {
  const port: CorePort = { send: () => undefined, onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  const store = new Store(port);
  store.setCore('up');
  store.apply({ ev: 'agents', project: P, agents: [ag('main'), ag('p99'), ag('alerts')] });
  return render(
    <StoreProvider store={store}>
      <RouterContext value={createRouter({ screen: 'agents', project: P })}>
        <AgentsScreen project={P} />
      </RouterContext>
    </StoreProvider>,
  );
}

afterEach(cleanup);

describe('the agents list, kept', () => {
  it('the row he selected is selected again after a reload', () => {
    const v = screen();
    const list = v.getByTestId('agents.screen');
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    const picked = v.container.querySelector('.b-lrow.on')?.getAttribute('data-testid');
    expect(picked).toBeTruthy();
    expect(keep.view(`agents.sel:${P}`)).toBeTypeOf('string');
    v.unmount();
    const again = screen();
    expect(again.container.querySelector('.b-lrow.on')?.getAttribute('data-testid')).toBe(picked);
  });
});
