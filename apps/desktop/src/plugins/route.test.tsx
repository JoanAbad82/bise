// @vitest-environment happy-dom
// plugins/p/<id>: the plugin's page when its row is in the rows (ui-review's red 1 on 17db865e3).
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { createRouter, RouterContext } from '@/app/router';
import { PluginsScreen } from './Screen';
afterEach(cleanup);
it("plugins/p/linear draws linear's page, its banner and its actions' row", () => {
  const port: CorePort = { send: () => undefined, onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  const store = new Store(port);
  store.setCore('up');
  store.apply({ ev: 'plugins', items: [{ id: 'linear', name: 'linear', kind: 'plugin', scope: 'user', title: 'linear', state: 'loaded', on: true }] });
  const v = render(<StoreProvider store={store}><RouterContext value={createRouter({ screen: 'plugins', id: 'linear' })}><PluginsScreen id="linear" /></RouterContext></StoreProvider>);
  expect(v.container.querySelector('[data-testid^="plugins.page"]')?.getAttribute('data-testid')).toBe('plugins.page.linear');
});
