// @vitest-environment happy-dom
// The tabbed panel drawn (native-mac-qa §7, §12's testids): folded by default, ▯ unfolds it on
// Overview, '+' opens New tab whose rows act, × closes a tab, the last one folds the panel, a tab
// in front always shows past six.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { ev, projects, row } from '../../../tests/feature/inputs';
import { createRouter, RouterContext } from '@/app/router';
import { BarTabs } from './BarTabs';
import { PanelHost } from './Host';
import { panelState } from './state';
import { openTab } from './tabs';
import { PANEL_KEYS } from './keys';
import { panel } from '@/proto/words_panel.gen';

afterEach(cleanup);
beforeEach(() => {
  panelState.reset();
  // a wide window: the panel's width is what its tab asks (fitW keeps the thread 560 beside the left)
  Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
});
const ACME = 'acme-1a2b3c4d';

function shell() {
  const port: CorePort = { send: () => undefined, onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  const notify = { listed: () => undefined, state: () => Promise.resolve('granted'), onState: () => () => undefined };
  (window as unknown as { bise: unknown }).bise = { notify };
  const store = new Store(port);
  store.setCore('up');
  store.apply(projects(row({ project: 'bise-home-00000000', name: 'bise', home: true }), row({ project: ACME, name: 'acme' })));
  // the fixtures' agents: perf has a diff (3 files), so New tab shows Changes
  store.apply(ev('agents', { project: ACME }));
  const router = createRouter({ screen: 'thread', project: ACME, agent: 'perf' });
  return render(
    <StoreProvider store={store}>
      <RouterContext value={router}>
        <BarTabs />
        <PanelHost />
      </RouterContext>
    </StoreProvider>,
  );
}

describe('the tabbed panel', () => {
  it('is folded by default: ▯ in the bar, the panel 0 wide and inert (no Tab, no VoiceOver)', () => {
    const v = shell();
    expect(v.getByTestId('app.panel.toggle').getAttribute('aria-pressed')).toBe('false');
    expect(v.getByTestId('app.panel').style.width).toBe('0px');
    expect(v.getByTestId('app.panel').hasAttribute('inert')).toBe(true);
    expect(v.queryByTestId('app.right')).toBeNull();
  });
  it('▯ unfolds it on Overview at 384, its tabs in its own top row; again folds it', () => {
    const v = shell();
    fireEvent.click(v.getByTestId('app.panel.toggle'));
    expect(v.getByTestId('app.panel.tab.overview').getAttribute('aria-selected')).toBe('true');
    expect(v.getByTestId('app.panel.top').contains(v.getByTestId('app.panel.tabs'))).toBe(true);
    expect(v.getByTestId('app.panel').contains(v.getByTestId('app.panel.top'))).toBe(true);
    expect(v.getByTestId('app.panel').style.width).toBe('384px');
    expect(v.getByTestId('app.panel').hasAttribute('inert')).toBe(false);
    expect(v.getByTestId('app.right')).toBeTruthy();
    fireEvent.click(v.getByTestId('app.panel.toggle'));
    expect(v.getByTestId('app.panel').style.width).toBe('0px');
  });
  it("'+' opens New tab: search, Open's rows with their keys, Recent", () => {
    const v = shell();
    fireEvent.click(v.getByTestId('app.panel.toggle'));
    fireEvent.click(v.getByTestId('app.panel.add'));
    expect(v.getByTestId('app.panel.tab.new:1').getAttribute('aria-selected')).toBe('true');
    expect(v.getByTestId('app.panel.launcher.search')).toBeTruthy();
    for (const k of ['artifacts', 'terminal', 'browser', 'office']) expect(v.getByTestId(`app.panel.launcher.${k}`)).toBeTruthy();
    expect(v.getByTestId('app.panel.launcher.terminal').textContent).toContain('⌃`');
    expect(v.getByTestId('app.panel.launcher.none')).toBeTruthy();
  });
  it("New tab's Changes opens the agent in view's changes in its place", () => {
    const v = shell();
    fireEvent.click(v.getByTestId('app.panel.toggle'));
    fireEvent.click(v.getByTestId('app.panel.add'));
    fireEvent.click(v.getByTestId('app.panel.launcher.changes'));
    expect(v.queryByTestId('app.panel.tab.new:1')).toBeNull();
    expect(v.getByTestId(`app.panel.tab.diff:${ACME}/perf`).getAttribute('aria-selected')).toBe('true');
  });
  it('openTab unfolds it on the thing; × closes it; Overview, the home, has no ×', () => {
    const v = shell();
    act(() => {
      openTab({ kind: 'pr', project: ACME, number: 6 });
    });
    const tab = v.getByTestId(`app.panel.tab.pr:${ACME}/6`);
    expect(tab.getAttribute('aria-selected')).toBe('true');
    expect(tab.textContent).toContain('PR #6');
    expect(v.getByTestId('app.panel').style.width).toBe('640px');
    fireEvent.click(v.getByTestId(`app.panel.tab.pr:${ACME}/6.close`));
    expect(v.getByTestId('app.panel.tab.overview').getAttribute('aria-selected')).toBe('true');
    expect(v.queryByTestId('app.panel.tab.overview.close')).toBeNull();
    expect(panelState.get().open).toBe(true);
  });
  it('past six tabs: an overflow button, the tab in front still shows', () => {
    const v = shell();
    act(() => {
      for (let n = 1; n <= 7; n++) openTab({ kind: 'commit', project: ACME, sha: `abcdef${String(n)}` });
    });
    expect(v.getAllByRole('tab')).toHaveLength(6);
    expect(v.getByTestId('app.panel.over').textContent).toContain('2');
    expect(v.getByTestId(`app.panel.tab.commit:${ACME}/abcdef7`)).toBeTruthy();
    expect(v.getByTestId(`app.panel.tab.commit:${ACME}/abcdef7`).getAttribute('aria-selected')).toBe('true');
  });
  it('every tab has a VoiceOver name, a tip only when its title is cut; the strip has its name', () => {
    const v = shell();
    fireEvent.click(v.getByTestId('app.panel.toggle'));
    expect(v.getByRole('tablist').getAttribute('aria-label')).toBe('Panel tabs');
    const t = v.getByTestId('app.panel.tab.overview');
    expect(t.getAttribute('aria-label')).toBe('Overview');
    // its whole title shows: no tip repeating it (ui-review m_42619 #5)
    fireEvent.pointerEnter(t);
    expect(t.getAttribute('data-tip')).toBeNull();
    expect(v.getByTestId('app.panel.toggle').getAttribute('data-tip')).toContain('⌥⌘0');
  });
  it("a narrow window: a sheet over the thread, the bar's ▯ its only one (designer m_44391); esc or a click outside folds it (ui-review m_42642)", () => {
    Object.defineProperty(window, 'innerWidth', { value: 1100, configurable: true });
    const v = shell();
    fireEvent.click(v.getByTestId('app.panel.toggle'));
    expect(v.getByTestId('app.panel').hasAttribute('data-over')).toBe(true);
    expect(v.getByTestId('app.panel').style.width).toBe('0px');
    // the sheet's row starts with its tabs: one 'Hide panel' ▯ in the window, the bar's (pressed)
    expect(v.getAllByLabelText(panel.panel_hide({ key: PANEL_KEYS.toggle }))).toEqual([v.getByTestId('app.panel.toggle')]);
    expect(v.getByTestId('app.panel.top').firstElementChild?.nextElementSibling?.getAttribute('data-testid')).toBe('app.panel.tabs');
    expect(v.getByTestId('app.panel.toggle').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(v.getByTestId('app.panel.toggle'));
    expect(v.getByTestId('app.panel').hasAttribute('data-open')).toBe(false);
    fireEvent.click(v.getByTestId('app.panel.toggle'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(v.getByTestId('app.panel').hasAttribute('data-open')).toBe(false);
    fireEvent.click(v.getByTestId('app.panel.toggle'));
    fireEvent.pointerDown(document.body);
    expect(v.getByTestId('app.panel').hasAttribute('data-open')).toBe(false);
  });
  it('a wide window: no sheet, no ▯ in the panel', () => {
    const v = shell();
    fireEvent.click(v.getByTestId('app.panel.toggle'));
    expect(v.getByTestId('app.panel').hasAttribute('data-over')).toBe(false);
    expect(v.getAllByLabelText(panel.panel_hide({ key: PANEL_KEYS.toggle }))).toEqual([v.getByTestId('app.panel.toggle')]);
  });
});
