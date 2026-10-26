// @vitest-environment happy-dom
// One title bar across the window's top (his m_44307, r2-titlebar): the bar (Frame.tsx Bar) and the
// open panel's tab row share the one 52 row on the one material; the bar's right group (the state
// line, the page's slot, ▯) ends on the thread's right edge while the panel is beside the thread,
// on the window's edge when it is folded or a sheet (under 1176 with a 240 sidebar). The real frame
// (Bar, PanelHost in app.css's grid) with app.css and panel.css, read back with getComputedStyle:
// happy-dom has no layout, so the bar's end is the grid's arithmetic on what the stylesheet places
// (the bar over columns 1-3: rail, sidebar, screen; the panel's column 4 as wide as PanelHost's
// width) — barEnd below. Mutation: app.css's .app-bar back to grid-column 1 / -1, or .app-panelcol
// back to grid-row 2, or the sheet's top back to 0, turns this red.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { HINT_HOLD_MS } from './held';
import { FRAME_KEYS } from './keys';
import type { CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { projects, row } from '../../tests/feature/inputs';
import { createRouter, RouterContext } from './router';
import { Bar, type FrameState } from './Frame';
import { PanelHost } from './panel/Host';
import { panelState } from './panel/state';
import { frameLeft, resetFrameLeft } from './frame-state';

const ACME = 'acme-1a2b3c4d';

beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = ['../ds/tokens.css', 'app.css', 'panel/panel.css'].map((f) => readFileSync(join(__dirname, f), 'utf8')).join(String.fromCharCode(10));
  document.head.append(style);
});
beforeEach(() => {
  panelState.reset();
  resetFrameLeft();
});
afterEach(cleanup);

const FRAME: FrameState = {
  width: 'wide', side: true, over: null, sideW: 240,
  toggle: () => undefined, close: () => undefined, resize: () => undefined, reset: () => undefined,
};

function shell(win: number) {
  Object.defineProperty(window, 'innerWidth', { value: win, configurable: true });
  const port: CorePort = { send: () => undefined, onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  (window as unknown as { bise: unknown }).bise = {
    notify: { listed: () => undefined, state: () => Promise.resolve('granted'), onState: () => () => undefined },
    update: { onState: () => () => undefined, now: () => Promise.resolve({ state: 'none' }), onAsk: () => () => undefined },
  };
  const store = new Store(port);
  store.setCore('up');
  store.apply(projects(row({ project: 'bise-home-00000000', name: 'bise', home: true }), row({ project: ACME, name: 'acme' })));
  const router = createRouter({ screen: 'thread', project: ACME, agent: 'perf' });
  return render(
    <StoreProvider store={store}>
      <RouterContext value={router}>
        <div className="app-frame">
          <Bar frame={FRAME} />
          <div className="app-panelcol" data-testid="panelcol">
            <PanelHost />
          </div>
        </div>
      </RouterContext>
    </StoreProvider>,
  );
}

/** A grid line's number in a `grid-column` / `grid-row` value ('1 / 4' -> [1, 4]; '-1' the last line). */
const lines = (v: string): readonly string[] => v.split('/').map((s) => s.trim());

/** Where the bar's right group ends: the bar spans columns 1-3, the panel's column 4 is PanelHost's width. */
function barEnd(v: ReturnType<typeof shell>, win: number): number {
  const bar = getComputedStyle(v.getByTestId('app.bar'));
  // the bar stops before the panel's column (line 4); over every column (-1) it would run under the tabs
  const end = lines(bar.gridColumn)[1];
  const panelW = Number.parseFloat(v.getByTestId('app.panel').style.width);
  return end === '4' ? win - panelW : win;
}

describe('one title bar across the top', () => {
  it("the panel's column runs the window's height: its tab row is in the bar's row, its border under the bar", () => {
    const v = shell(1440);
    expect(lines(getComputedStyle(v.getByTestId('panelcol')).gridRow)).toEqual(['1', '-1']);
    expect(getComputedStyle(v.getByTestId('app.bar')).gridRow).toBe('1');
    fireEvent.click(v.getByTestId('app.panel.toggle'));
    expect(getComputedStyle(v.getByTestId('app.panel.border')).top).toBe('52px');
  });

  it("at 1440 open, the bar's right group ends on the thread's edge (1440 - 384); folded, on the window's", () => {
    const v = shell(1440);
    expect(barEnd(v, 1440)).toBe(1440);
    fireEvent.click(v.getByTestId('app.panel.toggle'));
    expect(v.getByTestId('app.panel').hasAttribute('data-over')).toBe(false);
    expect(barEnd(v, 1440)).toBe(1440 - 384);
    // ▯ stays in the bar, in its right group, never in the panel's row
    expect(v.getByTestId('app.bar').contains(v.getByTestId('app.panel.toggle'))).toBe(true);
    expect(v.getByTestId('app.panel.top').contains(v.getByTestId('app.panel.toggle'))).toBe(false);
    act(() => {
      panelState.reset();
    });
    expect(barEnd(v, 1440)).toBe(1440);
  });

  it("at 1100 with the sidebar the panel is a sheet: the bar is as folded, the sheet starts under it", () => {
    const v = shell(1100);
    fireEvent.click(v.getByTestId('app.panel.toggle'));
    expect(v.getByTestId('app.panel').hasAttribute('data-over')).toBe(true);
    expect(barEnd(v, 1100)).toBe(1100);
    const col = v.getByTestId('app.panel.top').parentElement as HTMLElement;
    expect(getComputedStyle(col).top).toBe('52px');
  });

  it("at 1100 with the sidebar hidden the panel docks: the bar ends on the thread's edge", () => {
    const v = shell(1100);
    // the sidebar hidden by ⌘\: the left is the rail alone, room for the panel beside a 560 thread
    act(() => {
      frameLeft.hide(true);
    });
    fireEvent.click(v.getByTestId('app.panel.toggle'));
    expect(v.getByTestId('app.panel').hasAttribute('data-over')).toBe(false);
    expect(barEnd(v, 1100)).toBe(1100 - 384);
  });
});

describe('the two sides\' keys on their buttons (designer m_45008)', () => {
  const hold = (keys: readonly string[]) => {
    act(() => {
      for (const key of keys) fireEvent.keyDown(window, { key, metaKey: keys.includes('Meta'), altKey: keys.includes('Alt') && keys.indexOf(key) > 0 });
      vi.advanceTimersByTime(HINT_HOLD_MS + 10);
    });
  };
  const release = () => {
    act(() => {
      fireEvent.keyUp(window, { key: 'Meta' });
      fireEvent.keyUp(window, { key: 'Alt' });
    });
  };
  it('their tips say ⌘B and ⌥⌘B; ⌘ held: ⌘B on the sidebar\'s button; ⌥⌘ held: ⌥⌘B on the panel\'s; never both', () => {
    vi.useFakeTimers();
    try {
      const v = shell(1440);
      expect(v.getByTestId('app.bar.sidebar').getAttribute('data-tip')).toContain(FRAME_KEYS.sidebar);
      expect(v.getByTestId('app.panel.toggle').getAttribute('data-tip')).toContain(FRAME_KEYS.panel);
      expect(v.queryByTestId('app.bar.sidebar.hint')).toBeNull();
      hold(['Meta']);
      expect(v.getByTestId('app.bar.sidebar.hint').textContent).toBe('⌘B');
      expect(v.queryByTestId('app.panel.toggle.hint')).toBeNull();
      release();
      hold(['Meta', 'Alt']);
      expect(v.getByTestId('app.panel.toggle.hint').textContent).toBe('⌥⌘B');
      expect(v.queryByTestId('app.bar.sidebar.hint')).toBeNull();
      release();
      expect(v.queryByTestId('app.panel.toggle.hint')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
