// @vitest-environment happy-dom
// Esc in the library goes up, never back down (designer m_44802, ui-review m_44788): a folder's esc
// replaces the step with its parent (‹ still reaches the folder), the root's leaves the library to
// where he was before he opened it, and a second esc never puts him back in the folder he left.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Store, StoreProvider } from '@/store';
import { RouterContext, createRouter, useRoute, type Router } from '@/app/router';
import { libraryExit } from '@/app/escape';
import type { Route } from '@/app/route';
import { ArtifactsScreen } from './index';

afterEach(cleanup);

const THREAD: Route = { screen: 'thread', project: 'h', agent: 'perf' };
const ROOT: Route = { screen: 'artifacts', project: 'h' };
const DESK: Route = { screen: 'artifacts', project: 'h', at: 'f/f-d' };
const VIEW: Route = { screen: 'artifacts', project: 'h', at: 'f/f-v' };

function Lib() {
  const r = useRoute();
  return r.screen === 'artifacts' ? <ArtifactsScreen project={r.project} at={r.at} /> : <div data-testid="elsewhere" />;
}

function library(steps: Route[]): Router {
  Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });
  const store = new Store(null);
  store.apply({ ev: 'projects', projects: [{ project: 'h', name: 'h', path: '/x' }] });
  const folders = [{ id: 'f-d', name: 'desk', by: 'main', named_by_you: false }, { id: 'f-v', name: 'view', parent: 'f-d', by: 'main', named_by_you: false }];
  store.apply({ ev: 'artifacts', project: 'h', folders, items: [{ id: 'a', kind: 'file', title: 'a', agent: 'x', version: 1, at_ms: 1, url: '', new: false, folder: 'f-v' }] });
  const [first, ...rest] = steps;
  const router = createRouter(first ?? ROOT);
  for (const s of rest) router.go(s);
  render(<StoreProvider store={store}><RouterContext.Provider value={router}><Lib /></RouterContext.Provider></StoreProvider>);
  return router;
}

const esc = () => {
  const el = screen.queryByTestId('artifacts.screen');
  if (el !== null) fireEvent.keyDown(el, { key: 'Escape' });
};

describe('esc in the library', () => {
  it('a folder → its parent → the root → out to the thread he came from, never back down', () => {
    const router = library([THREAD, ROOT, DESK, VIEW]);
    esc();
    expect(router.get()).toEqual(DESK);
    // the parent replaced the step: the folder he left is neither behind nor ahead; ‹ walks his own steps
    expect(router.places('back', 10)).toEqual([DESK, ROOT, THREAD]);
    expect(router.places('forward', 10)).toEqual([]);
    esc();
    expect(router.get()).toEqual(ROOT);
    esc();
    expect(router.get()).toEqual(THREAD);
    expect(screen.getByTestId('elsewhere')).toBeTruthy();
  });

  it('at the root, a folder visited before is skipped: out to where he was before the library', () => {
    const router = library([THREAD, ROOT, DESK, ROOT]);
    esc();
    expect(router.get()).toEqual(THREAD);
  });

  it('at the root with only the library behind: the esc is left to the window (esc-up)', () => {
    const router = library([ROOT]);
    esc();
    expect(router.get()).toEqual(ROOT);
  });

  it('libraryExit: the steps back past every library place, pure', () => {
    expect(libraryExit([DESK, ROOT, THREAD])).toBe(3);
    expect(libraryExit([THREAD])).toBe(1);
    expect(libraryExit([DESK, ROOT])).toBeNull();
    expect(libraryExit([{ screen: 'artifacts', project: 'h', id: 'a' }])).toBe(1);
  });
});
