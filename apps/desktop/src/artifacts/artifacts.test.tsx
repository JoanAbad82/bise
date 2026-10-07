// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Artifact } from '@/proto';
import { Store, StoreProvider } from '@/store';
import { RouterContext, createRouter } from '@/app/router';
import type { Route } from '@/app/route';
import { formatRoute, parseRoute } from '@/app/route';
import { byDay, dayWords, filterItems, glyphOf, kindWords, ALL, timeOf, versions, whenWords, type Item } from './model';
import { ArtifactList, ArtifactOpen, ArtifactsScreen, versionUrl } from './index';
import { putInDraft } from './put';
import { themedUrl } from './Open';
import { aboutText } from '@/thread/ThreadScreen';
import { load } from '@/composer/drafts';
import { entryOf, entrySegments } from '@/composer/entry';

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
    expect(dayWords(at(2, 9, 0), NOW)).toBe('thu 1 oct');
    expect(timeOf(at(2, 16, 2))).toBe('16:02');
    expect(whenWords(at(1, 14, 2), NOW)).toBe('yesterday 14:02');
    expect(whenWords(at(0, 14, 2), NOW)).toBe('14:02');
    expect(whenWords(at(5, 9, 5), NOW)).toBe('mon 28 sep 09:05');
    expect(versions(art('a', 'page', { version: 2 }), NOW)).toEqual([{ v: 2, words: 'the current one', when: '14:02' }, { v: 1, words: '' }]);
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
  store.apply({ ev: 'artifacts', project: 'shop-1', items: [art('notes', 'page', { new: true, version: 2, title: 'product page, before / after' }), art('bench', 'file', { at_ms: at(1, 9, 0), path: '/x/shop/bench.csv' })] });
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

  it("under the page, the composer asks the agent that made it: 'about “…” · to perf'", () => {
    mount(<ArtifactOpen project="shop-1" id="notes" />, { screen: 'artifacts', project: 'shop-1', id: 'notes' });
    const c = screen.getByTestId('artifact.composer');
    expect(c.textContent).toContain('about “product page, before / after” · to perf');
    expect(c.innerHTML).toContain('ask perf about it, then ⏎');
    expect(aboutText({ title: 'Q3 [plan]', url: 'http://h/p/q3' }, 'why v2?')).toBe('about [Q3 plan](http://h/p/q3): why v2?');
  });

  it("⋯ puts it in a message: a chip at the end of perf's draft, then perf's thread; show in Finder only with a file and the bridge", () => {
    window.localStorage.clear();
    window.localStorage.setItem('bise.composer.v1.shop-1/perf', JSON.stringify({ draft: entryOf([{ kind: 'text', text: 'look at' }]), history: [], queue: [] }));
    const router = mount(<ArtifactOpen project="shop-1" id="notes" />, { screen: 'artifacts', project: 'shop-1', id: 'notes' });
    fireEvent.click(screen.getByTestId('artifact.more'));
    expect(screen.queryByTestId('artifact.finder')).toBeNull();
    fireEvent.click(screen.getByTestId('artifact.put'));
    expect(router.get()).toEqual({ screen: 'thread', project: 'shop-1', agent: 'perf' });
    const draft = load(window.localStorage, 'shop-1/perf').draft ?? '';
    expect(entrySegments(draft)).toEqual([
      { kind: 'text', text: 'look at ' },
      { kind: 'chip', chip: { kind: 'artifact', n: 1, id: 'notes', title: 'product page, before / after', url: 'http://127.0.0.1:47123/p/notes' } },
      { kind: 'text', text: ' ' },
    ]);
    cleanup();
    const shown: string[] = [];
    const g = globalThis as { bise?: unknown };
    g.bise = { showInFinder: (p: string) => { shown.push(p); return Promise.resolve(true); } };
    try {
      mount(<ArtifactOpen project="shop-1" id="bench" />, { screen: 'artifacts', project: 'shop-1', id: 'bench' });
      fireEvent.click(screen.getByTestId('artifact.more'));
      fireEvent.click(screen.getByTestId('artifact.finder'));
      expect(shown).toEqual(['/x/shop/bench.csv']);
    } finally {
      delete g.bise;
    }
  });

  it('the list: @ puts the row in a message, space looks at its file (else opens it)', async () => {
    window.localStorage.clear();
    const looked: string[] = [];
    const g = globalThis as { bise?: unknown };
    g.bise = { quickLook: (p: string) => { looked.push(p); return Promise.resolve(true); } };
    try {
      const opened: string[] = [];
      mount(<ArtifactList project="shop-1" onOpen={(id) => opened.push(id)} />);
      const list = screen.getByTestId('artifacts.panel');
      fireEvent.keyDown(list, { key: 'ArrowDown' });
      fireEvent.keyDown(list, { key: ' ' });
      expect(opened).toEqual(['notes']);
      fireEvent.keyDown(list, { key: 'ArrowDown' });
      fireEvent.keyDown(list, { key: ' ' });
      await Promise.resolve();
      expect(looked).toEqual(['/x/shop/bench.csv']);
      expect(opened).toEqual(['notes']);
      fireEvent.keyDown(list, { key: '@' });
      expect(load(window.localStorage, 'shop-1/perf').draft).toContain('"id":"bench"');
    } finally {
      delete g.bise;
    }
  });

  it("the keys line says only what works: '⏎ open', 'v versions', '@ put it in a message', '⌘C copy'; v opens with the versions shown, ⌘C copies the link", () => {
    const copied: string[] = [];
    const g = globalThis as { bise?: unknown };
    g.bise = { copy: (t: string) => { copied.push(t); } };
    try {
      const router = mount(<ArtifactsScreen />);
      expect(screen.getByTestId('artifacts.keys').textContent).toBe('⏎ openspace quick lookv versions@ put it in a message⌘C copy');
      const list = screen.getByTestId('artifacts.list');
      fireEvent.keyDown(list, { key: 'c', metaKey: true });
      expect(copied).toEqual(['http://127.0.0.1:47123/p/notes']);
      fireEvent.keyDown(list, { key: 'v' });
      expect(router.get()).toEqual({ screen: 'artifacts', project: 'shop-1', id: 'notes' });
      cleanup();
      mount(<ArtifactOpen project="shop-1" id="notes" />, { screen: 'artifacts', project: 'shop-1', id: 'notes' });
      expect(screen.getByTestId('artifact.versions')).toBeTruthy();
      cleanup();
      mount(<ArtifactOpen project="shop-1" id="notes" />, { screen: 'artifacts', project: 'shop-1', id: 'notes' });
      expect(screen.queryByTestId('artifact.versions')).toBeNull();
    } finally {
      delete g.bise;
    }
  });

  it("the page follows his theme: opened with ?theme=<his pref>, as is with none (the system's)", () => {
    expect(themedUrl('http://h/p/x', 'dark')).toBe('http://h/p/x?theme=dark');
    expect(themedUrl('http://h/p/x/v/1#s-3', 'light')).toBe('http://h/p/x/v/1?theme=light#s-3');
    expect(themedUrl('http://h/p/x?a=1', 'dark')).toBe('http://h/p/x?a=1&theme=dark');
    expect(themedUrl('http://h/p/x', null)).toBe('http://h/p/x');
    mount(<ArtifactOpen project="shop-1" id="notes" />, { screen: 'artifacts', project: 'shop-1', id: 'notes' });
    expect(screen.getByTestId('artifact.page').getAttribute('src')).toBe('http://127.0.0.1:47123/p/notes');
    cleanup();
    const store = world();
    store.apply({ ev: 'prefs', prefs: { theme: 'dark' } });
    render(<StoreProvider store={store}><RouterContext.Provider value={createRouter({ screen: 'artifacts', project: 'shop-1', id: 'notes' })}><ArtifactOpen project="shop-1" id="notes" /></RouterContext.Provider></StoreProvider>);
    expect(screen.getByTestId('artifact.page').getAttribute('src')).toBe('http://127.0.0.1:47123/p/notes?theme=dark');
  });
});

describe('put it in a message', () => {
  it('appends to the draft, numbers the chip after the others, keeps an unreadable draft aside', () => {
    const m = new Map<string, string>();
    const s = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, removeItem: (k: string) => { m.delete(k); } };
    const a = { id: 'a1', title: 'plan', url: 'http://h/p/a1' };
    putInDraft(s, 'p/perf', a);
    expect(entrySegments(load(s, 'p/perf').draft ?? '')).toEqual([{ kind: 'chip', chip: { kind: 'artifact', n: 1, ...a } }, { kind: 'text', text: ' ' }]);
    putInDraft(s, 'p/perf', { ...a, id: 'a2' });
    expect(entrySegments(load(s, 'p/perf').draft ?? '')?.flatMap((x) => (x.kind === 'chip' ? [x.chip.n] : []))).toEqual([1, 2]);
    m.set('bise.composer.v1.p/api', JSON.stringify({ draft: 'not an entry', history: [], queue: [] }));
    putInDraft(s, 'p/api', a);
    expect(m.get('bise.composer.v1.p/api.unread')).toContain('not an entry');
  });

  it("the versions menu says each version's note and time when the hub sends them", () => {
    const a = { ...art('a', 'page', { version: 2, at_ms: at(0, 14, 2) }), versions: [{ v: 2, at_ms: at(0, 14, 2) }, { v: 1, at_ms: at(0, 13, 20), note: 'before the fix' }] };
    expect(versions(a, NOW)).toEqual([{ v: 2, words: 'the current one', when: '14:02' }, { v: 1, words: 'before the fix', when: '13:20' }]);
  });
});
