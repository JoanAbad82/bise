// @vitest-environment happy-dom
// A project's page column beside the right side (his m_46849): the agents page (and changes, PRs,
// environments, review...) put their column where the thread's goes, centred in what the outer card
// leaves, never under it, in the card's form and the coins' (side-mini), wide and narrow.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Agent } from '@/proto';
import type { CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { createRouter, RouterContext } from '@/app/router';
import { AgentsScreen } from '@/agents/AgentsScreen';
import { ChangesScreen } from '@/review/ChangesScreen';
import { OUTER_BAND, sideLayout } from './side3d/layout';
import { setSideLayout } from './side3d/place';
import { pageColumn } from './pagecol';

/** rail 56 + sidebar 240: the page starts where the left ends */
const LEFT = 296;
const P = 'acme-1a2b3c4d';

describe('the page column from the sideLayout', () => {
  it('the card shown: centred in what the card leaves, its right margin past the card', () => {
    for (const winW of [1280, 1440, 1920, 2560]) {
      const lay = sideLayout(winW, LEFT, false);
      expect(lay.coins).toBe('card');
      const c = pageColumn(lay, LEFT, winW - LEFT);
      expect(c).not.toBeNull();
      if (c === null) continue;
      // never under the card: the column ends before its band
      expect(c.r).toBeGreaterThanOrEqual(OUTER_BAND);
      // centred between the sidebar and the card (to the px)
      expect(Math.abs(c.l - (c.r - OUTER_BAND))).toBeLessThanOrEqual(1);
    }
  });

  it('the coins by hand (side-mini) and narrow windows: the column ends before the coins\' band', () => {
    for (const [winW, compact] of [[1440, true], [1920, true], [1100, false], [900, false]] as const) {
      const lay = sideLayout(winW, LEFT, false, undefined, true, undefined, compact);
      const c = pageColumn(lay, LEFT, winW - LEFT);
      expect(c).not.toBeNull();
      if (c === null) continue;
      expect(c.r).toBeGreaterThanOrEqual(lay.gutter);
      expect(c.l).toBeGreaterThanOrEqual(24);
    }
  });

  it('no side drawn, or the column not in this box (a panel tab): none, the CSS centres it', () => {
    expect(pageColumn(sideLayout(1440, LEFT, false, undefined, false), LEFT, 1440 - LEFT)).toBeNull();
    const lay = sideLayout(1920, LEFT, false);
    expect(pageColumn(lay, 1500, 420)).toBeNull();
  });
});

const ag = (name: string): Agent => ({ name, dir: name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1, waits: 0, watching: [] });

function page(ui: React.ReactNode, route: Parameters<typeof createRouter>[0]) {
  const port: CorePort = { send: () => undefined, onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  const store = new Store(port);
  store.setCore('up');
  store.apply({ ev: 'agents', project: P, agents: [ag('main'), ag('p99')] });
  return render(
    <StoreProvider store={store}>
      <RouterContext value={createRouter(route)}>{ui}</RouterContext>
    </StoreProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('the pages beside the card (his m_46849)', () => {
  const winW = 1440;
  const cases = [
    { name: 'agents', ui: <AgentsScreen project={P} />, route: { screen: 'agents', project: P } as const, root: 'agents.screen' },
    { name: 'changes', ui: <ChangesScreen project={P} />, route: { screen: 'changes', project: P } as const, root: 'changes.screen' },
  ];
  for (const c of cases) {
    it(`${c.name}: its column's margins are the thread's, the right one past the card`, () => {
      setSideLayout(sideLayout(winW, LEFT, false));
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: LEFT, top: 0, width: winW - LEFT, height: 800, right: winW, bottom: 800, x: LEFT, y: 0, toJSON: () => ({}) } as DOMRect);
      const v = page(c.ui, c.route);
      const s = v.getByTestId(c.root).style;
      const l = parseFloat(s.getPropertyValue('--page-col-l'));
      const r = parseFloat(s.getPropertyValue('--page-col-r'));
      expect(r).toBeGreaterThanOrEqual(OUTER_BAND);
      expect(Math.abs(l - (r - OUTER_BAND))).toBeLessThanOrEqual(1);
    });
  }
});
