// @vitest-environment happy-dom
// The settings window's render (mockup 10, native-mac-qa §10): settings.window holds the sidebar
// of pages (each with its tile, the page in view current), the bar with the page's title and the
// page under it with its sentence as a plain lead line, never a banner or a hero card; on every
// page, in light and in dark.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createRouter, RouterContext } from '@/app/router';
import { Store, StoreProvider } from '@/store';
import { PAGES } from './pages';
import { SettingsWindow } from './window';

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
});

function open(page: string) {
  const router = createRouter({ screen: 'settings', page });
  render(
    <StoreProvider store={new Store(null)}>
      <RouterContext value={router}>
        <SettingsWindow />
      </RouterContext>
    </StoreProvider>,
  );
  return router;
}

describe('the settings window', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const p of PAGES) {
      it(`${p.id}, ${theme}: the sidebar, the bar's title, the page and its lead, no banner`, () => {
        document.documentElement.dataset.theme = theme;
        open(p.id);
        const win = screen.getByTestId('settings.window');
        const nav = within(win).getByTestId('settings.nav');
        expect(nav.getAttribute('aria-label')).toBeTruthy();
        expect(within(nav).getAllByRole('button')).toHaveLength(PAGES.length);
        for (const q of PAGES) expect(within(nav).getByTestId(`settings.nav.${q.id}.open`).querySelector('.b-swin-tile svg')).not.toBeNull();
        expect(within(nav).getByTestId(`settings.nav.${p.id}.open`).getAttribute('aria-current')).toBe('true');
        expect(within(win).getByTestId('settings.bar').textContent).toBe(p.title);
        const page = within(win).getByTestId(`settings.page.${p.id}`);
        expect(page.querySelector('.b-swin-lead')?.textContent).toBe(p.sub);
        expect(win.querySelector('[data-testid$=".hero"], .b-banner, .b-hero')).toBeNull();
      });
    }
  }

  it('a click on a page goes to it in this window', () => {
    const router = open('general');
    fireEvent.click(screen.getByTestId('settings.nav.computer.open'));
    expect(router.get()).toEqual({ screen: 'settings', page: 'computer' });
    expect(screen.getByTestId('settings.bar').textContent).toBe(PAGES.find((p) => p.id === 'computer')?.title);
  });
});
