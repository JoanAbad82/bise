// Which window shows a settings route (bise fait mac, mockup 10: settings is a window of its own,
// ⌘,). The main window hands every settings route to the settings window and stays where it is;
// the settings window hands every other route (a link inside settings: a project's thread, a
// report) to the main window. The 15 places that go to { screen: 'settings', page } keep doing so:
// the router's Outside (app/router.ts) is the one funnel. Owner: nm-settings.
import type { Outside } from '@/app/router';
import { formatRoute, type Route } from '@/app/route';
import type { WindowOpen } from '@/shared/api';

/**
 * The settings window a settings route opens: on its page, or with no page on the page it was
 * left on (route '': OwnWindows only brings it to the front, App.tsx's start route keeps its
 * page). Pure.
 */
export function settingsOpen(r: Route & { screen: 'settings' }): WindowOpen {
  return { kind: 'settings', route: r.page === undefined ? '' : formatRoute(r) };
}

/** The window.bise.openWindow this page has (none: a component test, the browser). */
type Open = (to?: string | WindowOpen) => void;

const openOf = (): Open | undefined => (typeof window === 'undefined' ? undefined : (window as Partial<Window>).bise?.openWindow);

/** The main window's: a settings route opens the settings window. */
export function toSettingsWindow(open: Open | undefined = openOf()): Outside {
  return {
    elsewhere: (r) => r.screen === 'settings',
    send: (r) => {
      if (r.screen === 'settings') open?.(settingsOpen(r));
    },
  };
}

/**
 * The settings window's: any other route goes to the main window; ⌘, (settings with no page) in
 * the settings window keeps its page (nothing moves, nothing goes).
 */
export function toMainWindow(open: Open | undefined = openOf()): Outside {
  return {
    elsewhere: (r) => r.screen !== 'settings' || r.page === undefined,
    send: (r) => {
      if (r.screen !== 'settings') open?.(formatRoute(r));
    },
  };
}
