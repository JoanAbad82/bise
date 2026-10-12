// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CoreCmd, CorePort } from '@/shared/api';
import { core_ev } from '@/proto/fixtures.gen';
import { replay, Store, StoreProvider } from '@/store';
import { createRouter, RouterContext } from '@/app/router';
import { SettingsScreen } from '@/settings';

afterEach(cleanup);

const fake = (): { port: CorePort; sent: CoreCmd[] } => {
  const sent: CoreCmd[] = [];
  return {
    sent,
    port: {
      send: (c) => sent.push(c),
      onEvent: () => () => undefined,
      onState: () => () => undefined,
      state: () => Promise.resolve('up'),
    },
  };
};

const mount = (node: React.ReactNode) => {
  const f = fake();
  const store = new Store(f.port);
  replay(store, core_ev);
  const router = createRouter({ screen: 'settings' });
  render(
    <StoreProvider store={store}>
      <RouterContext value={router}>{node}</RouterContext>
    </StoreProvider>,
  );
  return { ...f, store, router };
};

describe('the store-fed screens', () => {
  it('settings read the prefs event and send prefs_set through the store; the nav moves the route', () => {
    const { sent, router } = mount(<SettingsScreen page="quiet" />);
    fireEvent.click(screen.getByTestId('settings.pref.quiet.share'));
    expect(sent).toEqual([{ cmd: 'prefs_set', key: 'quiet.share', value: false }]);
    act(() => {
      fireEvent.click(screen.getByTestId('settings.nav.models'));
    });
    expect(router.get()).toEqual({ screen: 'settings', page: 'models' });
  });
});
