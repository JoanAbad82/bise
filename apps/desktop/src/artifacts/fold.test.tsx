// @vitest-environment happy-dom
// The fold under 900 px (page artifacts-gallery v7 'à 800 px'). Owner: art-folders.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Store, StoreProvider } from '@/store';
import { RouterContext, createRouter } from '@/app/router';
import { ArtifactsScreen } from './index';

afterEach(cleanup);

describe('the folders page under 900 px', () => {
  it('the place\'s title is the crumb: it opens the column with the place\'s theme open, a task goes there', () => {
  Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
  const store = new Store(null);
  store.apply({ ev: 'projects', projects: [{ project: 'h', name: 'h', path: '/x' }] });
  const folders = [{ id: 'f-d', name: 'desk', by: 'main', named_by_you: false }, { id: 'f-v', name: 'view', parent: 'f-d', by: 'main', named_by_you: false }];
  store.apply({ ev: 'artifacts', project: 'h', folders, items: [{ id: 'a', kind: 'file', title: 'a', agent: 'x', version: 1, at_ms: 1, url: '', new: false, folder: 'f-v' }] });
  const router = createRouter({ screen: 'artifacts', project: '', at: 'f/f-d' });
  render(<StoreProvider store={store}><RouterContext.Provider value={router}><ArtifactsScreen at="f/f-d" /></RouterContext.Provider></StoreProvider>);
  fireEvent.click(screen.getByTestId('artifacts.fold'));
  expect(screen.getByTestId('artifacts.fold.pop')).toBeTruthy();
  fireEvent.click(screen.getByTestId('artifacts.col.f.f-v'));
  expect(router.get()).toEqual({ screen: 'artifacts', project: '', at: 'f/f-v' });
});
});
