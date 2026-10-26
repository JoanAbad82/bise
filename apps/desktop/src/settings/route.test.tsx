// @vitest-environment happy-dom
// Settings as a route of the main window (r2-settings, his m_44293; designer m_44311): ⌘, opens
// the route, the nav (the frame's sidebar shows it there) lists every page with its tile and the
// page in view current, '‹ Settings' and esc go back where he was, and each page renders its lead
// line with no banner, no hero and no second title, in light and in dark.
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createRouter, RouterContext } from '@/app/router';
import { routeOfMenu } from '@/app/menu';
import { Sidebar } from '@/app/Sidebar';
import { Store, StoreProvider } from '@/store';
import { settings } from '@/proto/words.gen';
import { PAGES } from './pages';
import { SettingsNav } from './nav';
import { SettingsScreen } from './screen';

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
});

function open(page: string | undefined, from = true) {
  const router = createRouter(from ? { screen: 'inbox' } : { screen: 'settings', page });
  if (from) router.go({ screen: 'settings', page });
  const Route = () => {
    const r = router.get();
    return r.screen === 'settings' ? <SettingsScreen page={r.page} /> : <div data-testid="left" />;
  };
  const view = render(
    <StoreProvider store={new Store(null)}>
      <RouterContext value={router}>
        <SettingsNav />
        <Route />
      </RouterContext>
    </StoreProvider>,
  );
  router.subscribe(() => {
    view.rerender(
      <StoreProvider store={new Store(null)}>
        <RouterContext value={router}>
          <SettingsNav />
          <Route />
        </RouterContext>
      </StoreProvider>,
    );
  });
  return router;
}

describe('settings, a route of the main window', () => {
  it('⌘, (the menu bar, the tray) is the settings route, no window', () => {
    expect(routeOfMenu('settings')).toBe('settings');
  });

  for (const theme of ['light', 'dark'] as const) {
    for (const p of PAGES) {
      it(`${p.id}, ${theme}: the nav with its tiles and the page current, the page's lead, no banner or second title`, () => {
        document.documentElement.dataset.theme = theme;
        open(p.id);
        const nav = screen.getByTestId('settings.nav');
        expect(nav.getAttribute('aria-label')).toBe(settings.nav_label);
        for (const q of PAGES) expect(within(nav).getByTestId(`settings.nav.${q.id}.open`).querySelector('.b-snav-tile svg')).not.toBeNull();
        expect(within(nav).getByTestId(`settings.nav.${p.id}.open`).getAttribute('aria-current')).toBe('true');
        const page = screen.getByTestId(`settings.page.${p.id}`);
        expect(page.querySelector('.b-settings-lead')?.textContent).toBe(p.sub);
        const root = screen.getByTestId('settings.root');
        expect(root.querySelector('h1')).toBeNull();
        expect(root.querySelector('[data-testid$=".hero"], .b-banner, .b-hero')).toBeNull();
        expect(screen.queryByTestId('settings.window')).toBeNull();
      });
    }
  }

  it("the frame's sidebar shows the settings nav in place of the projects on the route, and the projects elsewhere", () => {
    const router = createRouter({ screen: 'settings', page: 'models' });
    const ui = () => (
      <StoreProvider store={new Store(null)}>
        <RouterContext value={router}>
          <Sidebar onSearch={() => undefined} />
        </RouterContext>
      </StoreProvider>
    );
    const view = render(ui());
    const side = screen.getByTestId('app.sidebar');
    expect(within(side).getByTestId('settings.nav')).toBeTruthy();
    expect(within(side).queryByTestId('app.side.list')).toBeNull();
    act(() => {
      router.go({ screen: 'inbox' });
    });
    view.rerender(ui());
    expect(within(screen.getByTestId('app.sidebar')).queryByTestId('settings.nav')).toBeNull();
    expect(within(screen.getByTestId('app.sidebar')).getByTestId('app.side.list')).toBeTruthy();
  });

  it('a page of the nav replaces the page in view: back still leaves settings', () => {
    const router = open('general');
    act(() => {
      fireEvent.click(screen.getByTestId('settings.nav.computer.open'));
    });
    expect(router.get()).toEqual({ screen: 'settings', page: 'computer' });
    expect(screen.getByTestId('settings.page.computer')).toBeTruthy();
    act(() => {
      fireEvent.click(screen.getByTestId('settings.nav.back'));
    });
    expect(router.get()).toEqual({ screen: 'inbox' });
  });

  it("esc on the page goes back where he was; with nowhere back, to bise's thread", () => {
    const router = open('models');
    act(() => {
      fireEvent.keyDown(screen.getByTestId('settings.root'), { key: 'Escape' });
    });
    expect(router.get()).toEqual({ screen: 'inbox' });
    cleanup();
    const alone = open('keys', false);
    act(() => {
      fireEvent.keyDown(screen.getByTestId('settings.root'), { key: 'Escape' });
    });
    expect(alone.get()).toEqual({ screen: 'bise' });
  });
});
