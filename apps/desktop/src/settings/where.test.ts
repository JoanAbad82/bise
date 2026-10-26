// The settings window's funnel (where.ts) through the router (app/router.ts Outside): the main
// window hands settings routes to the settings window and stays where it is; the settings window
// hands every other route to the main window. Pure: openWindow is a fake that records.
import { describe, expect, it } from 'vitest';
import { createRouter, restoreHistory } from '@/app/router';
import { formatRoute, type Route } from '@/app/route';
import type { WindowOpen } from '@/shared/api';
import { settingsOpen, toMainWindow, toSettingsWindow } from './where';

const thread: Route = { screen: 'thread', project: 'acme', agent: 'perf' };

function fakeOpen() {
  const opened: (string | WindowOpen | undefined)[] = [];
  return { opened, open: (to?: string | WindowOpen) => opened.push(to) };
}

describe('settings in its own window', () => {
  it('a settings route opens the settings window on its page, or on the page it was left on', () => {
    expect(settingsOpen({ screen: 'settings', page: 'models' })).toEqual({ kind: 'settings', route: 'settings/models' });
    expect(settingsOpen({ screen: 'settings' })).toEqual({ kind: 'settings', route: '' });
  });

  it('the main window stays where it is when settings opens: no step, no listener call', () => {
    const f = fakeOpen();
    const r = createRouter(thread, undefined, toSettingsWindow(f.open));
    let calls = 0;
    r.subscribe(() => (calls += 1));
    r.go({ screen: 'settings', page: 'computer' });
    r.go({ screen: 'settings' });
    r.replace({ screen: 'settings', page: 'keys' });
    expect(r.get()).toEqual(thread);
    expect(r.canBack()).toBe(false);
    expect(calls).toBe(0);
    expect(f.opened).toEqual([
      { kind: 'settings', route: 'settings/computer' },
      { kind: 'settings', route: '' },
      { kind: 'settings', route: 'settings/keys' },
    ]);
    // any other route still moves the main window
    r.go({ screen: 'inbox' });
    expect(r.get()).toEqual({ screen: 'inbox' });
  });

  it("the main window's old settings steps drop from its restored history", () => {
    const saved = { past: ['settings/models', 'inbox'], now: formatRoute(thread), future: ['settings'] };
    const { elsewhere } = toSettingsWindow(() => undefined);
    const { past, future } = restoreHistory(thread, saved, elsewhere);
    expect(past.map((x) => x.screen)).not.toContain('settings');
    expect(future).toEqual([]);
  });

  it('the settings window moves between its pages and sends any other route to the main window', () => {
    const f = fakeOpen();
    const r = createRouter({ screen: 'settings', page: 'general' }, undefined, toMainWindow(f.open));
    r.go({ screen: 'settings', page: 'projects' });
    expect(r.get()).toEqual({ screen: 'settings', page: 'projects' });
    // ⌘, in the settings window keeps its page and opens nothing
    r.go({ screen: 'settings' });
    expect(r.get()).toEqual({ screen: 'settings', page: 'projects' });
    r.go(thread);
    expect(r.get()).toEqual({ screen: 'settings', page: 'projects' });
    expect(f.opened).toEqual([formatRoute(thread)]);
  });
});
