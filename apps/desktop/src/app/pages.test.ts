import { describe, expect, it } from 'vitest';
import { PAGES } from '@/settings';
import { settings } from '@/proto/words.gen';
import { searchList, type SearchData } from '@/search/rank';
import { appPages, ASKS, SCREENS } from './pages';
import { formatRoute, parseRoute, type Route } from './route';

const projects = [
  { id: 'home-1', name: 'home', home: true },
  { id: 'acme-2', name: 'acme' },
];
const inThread: Route = { screen: 'thread', project: 'acme-2', agent: 'perf' };
const pages = appPages({ projects, route: inThread, settings: PAGES });
const data = (route: Route = inThread): SearchData => ({ projects, agents: [], artifacts: [], scheduled: [], pages: appPages({ projects, route, settings: PAGES }) });

describe('the app pages ⌘K finds (ambient-lead m_21499)', () => {
  it('every page listed is a route the router reads back, of the screen it is listed under', () => {
    for (const p of pages) {
      if (!('route' in p.go)) continue;
      const r = parseRoute(p.go.route);
      expect(r.screen, p.go.route).not.toBe('notfound');
      expect(formatRoute(r)).toBe(p.go.route);
      expect(SCREENS[r.screen].some((x) => !('no' in x)), `${r.screen} says it lists pages`).toBe(true);
    }
  });

  it('every screen that says it has pages gives one; the others say why not', () => {
    const shown = new Set(pages.flatMap((p) => ('route' in p.go ? [parseRoute(p.go.route).screen] : [])));
    for (const [screen, rules] of Object.entries(SCREENS)) {
      if (rules.every((r) => 'no' in r)) for (const r of rules) expect('no' in r && r.no.length > 0, screen).toBe(true);
      else expect(shown.has(screen as Route['screen']), screen).toBe(true);
    }
  });

  it('each settings page, the inbox and help are there, ids unique', () => {
    for (const s of PAGES) expect(pages.some((p) => p.id === `settings/${s.id}` && p.parent === 'settings' && p.name === s.title), s.id).toBe(true);
    for (const a of ASKS) expect(pages).toContainEqual(a);
    expect(new Set(pages.map((p) => p.id)).size).toBe(pages.length);
  });

  it("a project's pages read 'changes · acme', the project in view first; the log is the agent in view's", () => {
    const changes = pages.filter((p) => p.name === 'changes');
    expect(changes.map((p) => p.of)).toEqual(['acme', 'bise']);
    // /debug is the only way in: no page row for it
    expect(pages.some((p) => p.name === 'log' || p.name === 'debug')).toBe(false);
  });

  it('a key only where it does exactly that row', () => {
    const key = (id: string, route: Route = inThread) => appPages({ projects, route, settings: PAGES }).find((p) => p.id === id)?.key;
    expect(key('settings')).toBe('⌘,');
    expect(key('inbox')).toBe('⌘I');
    // ⇧⌘A is the rail's artifacts, every project's library (rail-keys)
    expect(key('artifacts')).toBe('⇧⌘A');
    expect([key('inbox/all'), key('scheduled'), key('plugins')]).toEqual(['⇧⌘I', '⌘Y', '⇧⌘X']);
    expect(key('artifacts/acme-2')).toBe('');
    expect(key('artifacts/home-1')).toBe('');
    // ⌘D from an agent's thread is its review, from a project's main its changes
    expect(key('changes/acme-2')).toBe('');
    expect(key('changes/acme-2', { screen: 'thread', project: 'acme-2', agent: 'main' })).toBe('⌘D');
  });
});

describe('the pages group (designer m_21505)', () => {
  const group = (q: string, route?: Route) => searchList(data(route), q, 'all', 0).groups.find((g) => g.id === 'pages');
  it('none with no query; after the agents, before the artifacts', () => {
    expect(searchList(data(), '', 'all', 0).groups.some((g) => g.id === 'pages')).toBe(false);
    const d: SearchData = {
      ...data(),
      agents: [{ project: 'acme-2', name: 'settler', main: false, archived: false, status: 'idle', title: '', waits: 0, since_ms: 1 }],
      artifacts: [{ project: 'acme-2', id: 'a', title: 'set list', kind: 'page', what: 'page', agent: 'x', at_ms: 1 }],
    };
    expect(searchList(d, 'set', 'all', 0).groups.map((g) => g.id)).toEqual(['agents', 'pages', 'artifacts']);
  });
  it("'set' finds settings and its setup page; 'keys' the keys page and help; ⏎ goes like its key", () => {
    const set = group('set')?.hits ?? [];
    expect(set[0]?.name).toBe('settings');
    expect(set.some((h) => h.parent === 'settings' && h.name === settings.page_setup)).toBe(true);
    const keys = group('keys')?.hits ?? [];
    // the keys page is Shortcuts now (designer m_43851): 'keys' still finds it by its id
    expect(keys.find((h) => h.parent === 'settings')).toMatchObject({ name: settings.page_keys, parent: 'settings', open: { to: 'page', go: { route: 'settings/keys' } } });
    expect(keys.some((h) => h.name === 'help' && h.key === '⌘/')).toBe(true);
    expect(group('inbox')?.hits[0]).toMatchObject({ glyph: '#', key: '⌘I', open: { to: 'page', go: { inbox: true } } });
  });
  it("a project's name alone finds no page; with a page's word, its page first", () => {
    expect(group('acme')).toBeUndefined();
    expect(group('changes acme')?.hits[0]).toMatchObject({ name: 'changes', of: 'acme' });
  });
  it('only in the all scope', () => {
    expect(searchList(data(), 'settings', 'agents', 0).groups.some((g) => g.id === 'pages')).toBe(false);
  });
});
