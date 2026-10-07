// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Artifact } from '@/proto';
import { Store, StoreProvider } from '@/store';
import { RouterContext, createRouter } from '@/app/router';
import type { Route } from '@/app/route';
import { formatRoute, parseRoute } from '@/app/route';
import { byDay, dayWords, filterItems, glyphOf, kindWords, ALL, versions, whenWords, type Item } from './model';
import { ArtifactList, ArtifactOpen, ArtifactsScreen, versionUrl } from './index';

afterEach(cleanup);

// a fixed noon, local time, so 'today' and 'yesterday' don't depend on when the test runs
const NOW = new Date(2026, 9, 3, 15, 0).getTime();
const at = (daysAgo: number, h: number, m: number) => new Date(2026, 9, 3 - daysAgo, h, m).getTime();
const art = (id: string, kind: string, extra: Partial<Artifact> = {}): Artifact => ({ id, kind, title: id, agent: 'perf', version: 1, at_ms: at(0, 14, 2), url: `http://127.0.0.1:47123/p/${id}`, new: false, ...extra });
const item = (a: Artifact, project = 'shop-1', projectName = 'storefront'): Item => ({ project, projectName, a });

describe('artifacts model', () => {
  it("says each kind as the signed screen: glyph, kind words, days, times", () => {
    expect(['page', 'file', 'pr', 'shots'].map(glyphOf)).toEqual(['↗', '▤', '⇡', '◫']);
    expect(kindWords(art('a', 'page', { version: 2 }))).toBe('page · v2');
    expect(kindWords(art('b', 'pr'))).toBe('PR');
    expect(dayWords(at(0, 9, 0), NOW)).toBe('today');
    expect(dayWords(at(1, 9, 0), NOW)).toBe('yesterday');
    expect(dayWords(at(2, 9, 0), NOW)).toBe('the 1st of October');
    expect(whenWords(at(0, 14, 2), NOW)).toBe('14:02');
    expect(whenWords(at(5, 9, 5), NOW)).toBe('28 Sep 09:05');
    expect(versions(art('a', 'page', { version: 2 }))).toEqual([{ v: 2, words: 'the current one' }, { v: 1, words: '' }]);
    expect(versionUrl('http://h/p/x', 3, 1)).toBe('http://h/p/x/v/1');
  });

  it('filters by project, agent, kind and words; groups by day, newest first', () => {
    const items = [
      item(art('notes', 'page', { at_ms: at(0, 10, 0) })),
      item(art('bench', 'file', { agent: 'api', at_ms: at(1, 10, 0) }), 'acme-2', 'acme'),
      item(art('pr-12', 'pr', { at_ms: at(0, 12, 0) })),
    ];
    expect(filterItems(items, ALL).map((it) => it.a.id)).toEqual(['pr-12', 'notes', 'bench']);
    expect(filterItems(items, { ...ALL, project: 'acme-2' }).map((it) => it.a.id)).toEqual(['bench']);
    expect(filterItems(items, { ...ALL, agent: 'api' }).map((it) => it.a.id)).toEqual(['bench']);
    expect(filterItems(items, { ...ALL, kinds: ['pr', 'file'] }).map((it) => it.a.id)).toEqual(['pr-12', 'bench']);
    expect(filterItems(items, { ...ALL, q: 'NOT' }).map((it) => it.a.id)).toEqual(['notes']);
    expect(byDay(filterItems(items, ALL), NOW).map((g) => [g.title, g.items.length])).toEqual([['today', 2], ['yesterday', 1]]);
  });

  it("the global route is 'artifacts' (project ''), round trip", () => {
    const r: Route = { screen: 'artifacts', project: '' };
    expect(formatRoute(r)).toBe('artifacts');
    expect(parseRoute('artifacts')).toEqual(r);
    expect(parseRoute('artifacts/shop-1/notes')).toEqual({ screen: 'artifacts', project: 'shop-1', id: 'notes' });
  });
});

function world() {
  const store = new Store(null);
  store.apply({ ev: 'projects', projects: [{ project: 'shop-1', name: 'storefront', path: '/x/shop' }, { project: 'acme-2', name: 'acme', path: '/x/acme' }] });
  store.apply({ ev: 'artifacts', project: 'shop-1', items: [art('notes', 'page', { new: true, version: 2, title: 'product page, before / after' }), art('bench', 'file', { at_ms: at(1, 9, 0) })] });
  store.apply({ ev: 'artifacts', project: 'acme-2', items: [art('pr-12', 'pr', { agent: 'api', title: 'fix the checkout' })] });
  return store;
}

function mount(node: React.ReactNode, start: Route = { screen: 'artifacts', project: '' }) {
  const store = world();
  const router = createRouter(start);
  render(<StoreProvider store={store}><RouterContext.Provider value={router}>{node}</RouterContext.Provider></StoreProvider>);
  return router;
}

describe('artifacts screens', () => {
  it('the screen lists every project by day, the new chip, filters by kind and words, ⏎ opens one', () => {
    const router = mount(<ArtifactsScreen />);
    const list = screen.getByTestId('artifacts.list');
    expect(list.querySelectorAll('[role=option]').length).toBe(3);
    expect(screen.getByTestId('artifacts.list.row.notes.new').textContent).toBe('new');
    expect(screen.getByTestId('artifacts.list.row.notes').textContent).toContain('perf · storefront');
    fireEvent.click(screen.getByTestId('artifacts.kind.pr'));
    expect(screen.getByTestId('artifacts.list').querySelectorAll('[role=option]').length).toBe(1);
    fireEvent.click(screen.getByTestId('artifacts.kind.pr'));
    fireEvent.change(screen.getByTestId('artifacts.search').querySelector('input') ?? screen.getByTestId('artifacts.search'), { target: { value: 'checkout' } });
    const rows = screen.getByTestId('artifacts.list').querySelectorAll('[role=option]');
    expect(rows.length).toBe(1);
    fireEvent.keyDown(screen.getByTestId('artifacts.list'), { key: 'Enter' });
    expect(router.get()).toEqual({ screen: 'artifacts', project: 'acme-2', id: 'pr-12' });
  });

  it("panel A's list: one project's two-line rows; empty says the TUI's words", () => {
    const opened: string[] = [];
    mount(<ArtifactList project="shop-1" onOpen={(id) => opened.push(id)} />);
    const list = screen.getByTestId('artifacts.panel');
    expect(list.querySelectorAll('[role=option]').length).toBe(2);
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    fireEvent.keyDown(list, { key: 'Enter' });
    expect(opened).toEqual(['notes']);
    cleanup();
    mount(<ArtifactList project="nowhere" onOpen={() => undefined} />);
    expect(screen.getByTestId('artifacts.panel.empty').textContent).toContain('nothing yet. when an agent makes a page');
  });

  it('one artifact open: its head, the version menu points the page at an older version, back to the list', () => {
    const router = mount(<ArtifactOpen project="shop-1" id="notes" />, { screen: 'artifacts', project: 'shop-1', id: 'notes' });
    expect(screen.getByTestId('artifact.title').textContent).toBe('product page, before / after');
    expect(screen.getByTestId('artifact.open').textContent).toContain('page · by perf in storefront');
    expect(screen.getByTestId('artifact.version').textContent).toContain('v2 · the current one');
    fireEvent.click(screen.getByTestId('artifact.version'));
    fireEvent.click(screen.getByTestId('artifact.versions.v1'));
    expect(screen.getByTestId('artifact.page').getAttribute('src')).toBe('http://127.0.0.1:47123/p/notes/v/1');
    fireEvent.click(screen.getByTestId('artifact.back'));
    expect(router.get()).toEqual({ screen: 'artifacts', project: '' });
  });
});
