// @vitest-environment happy-dom
// app/clicks, app/sidebar-foot (min-tests): one click acts. A project's row opens its main's
// thread, the foot's settings opens settings.
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { projects, row } from '../../tests/feature/inputs';
import { createRouter, RouterContext } from './router';
import { Sidebar } from './Sidebar';

afterEach(cleanup);
const ACME = 'acme-1a2b3c4d';

function bar() {
  const port: CorePort = { send: () => undefined, onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  const notify = { listed: () => undefined, state: () => Promise.resolve('granted'), onState: () => () => undefined };
  (window as unknown as { bise: unknown }).bise = { notify };
  const store = new Store(port);
  store.setCore('up');
  store.apply(projects(row({ project: 'bise-home-00000000', name: 'bise', home: true }), row({ project: ACME, name: 'acme' })));
  const router = createRouter({ screen: 'bise' });
  const v = render(
    <StoreProvider store={store}>
      <RouterContext value={router}>
        <Sidebar onSearch={() => undefined} />
      </RouterContext>
    </StoreProvider>,
  );
  return { v, router };
}

describe('the sidebar, one click', () => {
  it("a project's row opens its main's thread; the foot's settings opens settings", () => {
    const { v, router } = bar();
    fireEvent.click(v.getByTestId(`app.sidebar.project.${ACME}`));
    expect(router.get()).toEqual({ screen: 'thread', project: ACME, agent: 'main' });
    fireEvent.click(v.getByTestId('app.sidebar.settings'));
    expect(router.get()).toEqual({ screen: 'settings' });
  });
});
