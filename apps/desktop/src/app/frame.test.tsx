// @vitest-environment happy-dom
// The frame of mockup 1, drawn from the store: the rail's places (the current one marked, inbox's
// dot only while something waits), the sidebar's projects (round 2: one row each, no agent under
// it, its one fact, ⌘ held its digit), its head bise, Search ⌘K, New project ⌘N (no New agent row).
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HINT_HOLD_MS } from './held';
import type { Agent, ProjectRow } from '@/proto';
import type { CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { ev, projects, row } from '../../tests/feature/inputs';
import { createRouter, RouterContext } from './router';
import type { Route } from './route';
import { projectRowTip, Sidebar } from './Sidebar';
import { SideRail } from './SideRail';
import { askEntityAction } from './menus/actions';
import { act } from '@testing-library/react';

afterEach(cleanup);
const HOME = 'bise-home-00000000';
const ACME = 'acme-1a2b3c4d';
const DOCS = 'docs-5e6f7a8b';

const AGENT = (ev('agents').agents[0] ?? {}) as Agent;
const agent = (name: string, o: Partial<Agent> = {}): Agent => ({ ...AGENT, name, main: name === 'main', status: 'idle', waits: 0, archived: false, ...o });

function frame(route: Route, agents: Agent[], sent: unknown[] = [], acme: Partial<ProjectRow> = {}) {
  const port: CorePort = { send: (c) => { sent.push(c); }, onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  (window as unknown as { bise: unknown }).bise = { notify: { listed: () => undefined, state: () => Promise.resolve('granted'), onState: () => () => undefined } };
  const store = new Store(port);
  store.setCore('up');
  store.apply(projects(row({ project: HOME, name: 'bise', home: true }), row({ project: ACME, name: 'acme', order: 1, ...acme }), row({ project: DOCS, name: 'docs', order: 2 })));
  store.apply(ev('agents', { project: ACME, agents }));
  const router = createRouter(route);
  const v = render(
    <StoreProvider store={store}>
      <RouterContext value={router}>
        <SideRail />
        <Sidebar onSearch={() => undefined} />
      </RouterContext>
    </StoreProvider>,
  );
  return { v, router };
}

describe('the rail', () => {
  it('marks the place he is in and goes to each place', () => {
    const { v, router } = frame({ screen: 'inbox' }, [agent('main')]);
    expect(v.getByTestId('app.rail.inbox').getAttribute('aria-current')).toBe('page');
    expect(v.getByTestId('app.rail.bise').getAttribute('aria-current')).toBeNull();
    fireEvent.click(v.getByTestId('app.rail.scheduled'));
    expect(router.get()).toEqual({ screen: 'scheduled' });
    fireEvent.click(v.getByTestId('app.rail.artifacts'));
    expect(router.get()).toEqual({ screen: 'artifacts', project: '' });
  });

  it("a thread is bise's place; every button has its tip", () => {
    const { v } = frame({ screen: 'thread', project: ACME, agent: 'perf' }, [agent('main'), agent('perf')]);
    expect(v.getByTestId('app.rail.bise').getAttribute('aria-current')).toBe('page');
    for (const p of ['bise', 'inbox', 'scheduled', 'artifacts', 'plugins', 'settings']) expect(v.getByTestId(`app.rail.${p}`).getAttribute('data-tip')).not.toBe('');
    // nothing waits: no dot
    expect(v.queryByTestId('app.rail.inbox.dot')).toBeNull();
  });
});

describe('the sidebar', () => {
  // light and dark (designer's shots): the same rows, the theme only paints them
  for (const theme of ['light', 'dark'] as const) {
    it(`${theme}: one row per project in his order, no agent under it; a click opens its main, the one in view marked`, () => {
      document.documentElement.dataset.theme = theme;
      const { v, router } = frame({ screen: 'thread', project: ACME, agent: 'perf' }, [agent('main'), agent('perf'), agent('docs')]);
      const list = v.getByTestId('app.side.list');
      const ids = [...list.querySelectorAll('[data-testid^="app.side."]')].map((e) => e.getAttribute('data-testid')).filter((id) => /^app\.side\.(project|agent|more)\.[^.]+$/.test(id ?? ''));
      expect(ids).toEqual([`app.side.project.${ACME}`, `app.side.project.${DOCS}`]);
      expect(v.getByTestId(`app.side.project.${ACME}`).getAttribute('aria-current')).toBe('page');
      expect(v.getByTestId(`app.side.project.${DOCS}`).getAttribute('aria-current')).toBeNull();
      fireEvent.click(v.getByTestId(`app.side.project.${DOCS}`));
      expect(router.get()).toEqual({ screen: 'thread', project: DOCS, agent: 'main' });
      delete document.documentElement.dataset.theme;
    });
  }

  it("ends a project's row with one fact: what waits on him, else its agents at work, else nothing; its tip says both", () => {
    const working = [agent('main', { status: 'working' }), agent('perf', { status: 'working' })];
    const waits = frame({ screen: 'bise' }, working, [], { cards: null as never, waits: 1 }).v;
    expect(waits.getByTestId(`app.side.project.${ACME}.waits`).textContent).toBe('1');
    expect(waits.queryByTestId(`app.side.project.${ACME}.works`)).toBeNull();
    expect(waits.getByTestId(`app.side.project.${ACME}`).getAttribute('data-tip')).toBe(projectRowTip(2, 1));
    cleanup();
    const works = frame({ screen: 'bise' }, working).v;
    // the breath's one cell, then the count
    expect(works.getByTestId(`app.side.project.${ACME}.works`).textContent).toMatch(/^.2$/u);
    expect(works.getByTestId(`app.side.project.${ACME}.works.mark`).getAttribute('data-mark')).toBe('working');
    expect(works.queryByTestId(`app.side.project.${DOCS}.works`)).toBeNull();
    expect(works.queryByTestId(`app.side.project.${DOCS}.waits`)).toBeNull();
  });

  it('⌘ held shows each project its ⌘ digit, in his order (⌘1-9 opens it)', () => {
    vi.useFakeTimers();
    try {
      const { v } = frame({ screen: 'bise' }, [agent('main', { status: 'working' })]);
      expect(v.queryByTestId(`app.side.project.${ACME}.digit`)).toBeNull();
      act(() => {
        fireEvent.keyDown(window, { key: 'Meta', code: 'MetaLeft', metaKey: true });
        vi.advanceTimersByTime(HINT_HOLD_MS + 10);
      });
      expect(v.getByTestId(`app.side.project.${ACME}.digit`).textContent).toBe('⌘1');
      expect(v.getByTestId(`app.side.project.${DOCS}.digit`).textContent).toBe('⌘2');
      expect(v.queryByTestId(`app.side.project.${ACME}.works`)).toBeNull();
      act(() => {
        fireEvent.keyUp(window, { key: 'Meta', code: 'MetaLeft' });
      });
      expect(v.queryByTestId(`app.side.project.${ACME}.digit`)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("bise's own row (native-lead m_44419): what waits in all his projects, ⌘0 held, opens bise; home stays out of the list", () => {
    vi.useFakeTimers();
    try {
      const { v, router } = frame({ screen: 'thread', project: HOME, agent: 'main' }, [agent('main')], [], { cards: null as never, waits: 2 });
      expect(v.queryByTestId(`app.side.project.${HOME}`)).toBeNull();
      // on bise's own main: marked
      expect(v.getByTestId('app.side.bise').getAttribute('aria-current')).toBe('page');
      expect(v.getByTestId('app.side.bise.waits').textContent).toBe('2');
      act(() => {
        fireEvent.keyDown(window, { key: 'Meta', code: 'MetaLeft', metaKey: true });
        vi.advanceTimersByTime(HINT_HOLD_MS + 10);
      });
      expect(v.getByTestId('app.side.bise.digit').textContent).toBe('⌘0');
      act(() => {
        fireEvent.keyUp(window, { key: 'Meta', code: 'MetaLeft' });
      });
      fireEvent.click(v.getByTestId(`app.side.project.${ACME}`));
      expect(v.getByTestId('app.side.bise').getAttribute('aria-current')).toBeNull();
      fireEvent.click(v.getByTestId('app.side.bise'));
      expect(router.get()).toEqual({ screen: 'bise' });
    } finally {
      vi.useRealTimers();
    }
  });

  // light and dark (designer's shots): the same rows, the theme only paints them
  for (const theme of ['light', 'dark'] as const) {
    it(`${theme}: the head in his order (round 3, main m_44657): bise, Search, New project, no New agent row; then Projects`, () => {
      document.documentElement.dataset.theme = theme;
      const { v, router } = frame({ screen: 'thread', project: ACME, agent: 'main' }, [agent('main')]);
      const side = v.getByTestId('app.sidebar');
      const head = [...side.querySelectorAll('.app-s-head > [data-testid]')].map((e) => e.getAttribute('data-testid'));
      expect(head).toEqual(['app.side.bise', 'app.side.search', 'app.side.new-project']);
      expect(v.queryByTestId('app.side.new')).toBeNull();
      // the head stands over the list: bise is no longer a row of it, Projects follows the head
      expect(v.getByTestId('app.side.list').querySelector('[data-testid="app.side.bise"]')).toBeNull();
      const order = [...side.querySelectorAll('[data-testid="app.side.new-project"],[data-testid="app.side.label.projects"]')].map((e) => e.getAttribute('data-testid'));
      expect(order).toEqual(['app.side.new-project', 'app.side.label.projects']);
      // no sheet mounted in this test: settings › projects is the way in (addProject.ts)
      fireEvent.click(v.getByTestId('app.side.new-project'));
      expect(router.get()).toEqual({ screen: 'settings', page: 'projects' });
      delete document.documentElement.dataset.theme;
    });
  }

  it("the menu's Rename takes the new name inline on the project's row", () => {
    const sent: unknown[] = [];
    const { v } = frame({ screen: 'bise' }, [agent('main')], sent);
    let took = false;
    act(() => {
      took = askEntityAction('rename', { kind: 'project', project: ACME });
    });
    expect(took).toBe(true);
    const field = v.getByTestId(`app.side.project.${ACME}.rename.field`) as HTMLInputElement;
    fireEvent.change(field, { target: { value: 'engine' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(sent).toContainEqual(expect.objectContaining({ cmd: 'project_rename', project: ACME, name: 'engine' }));
    expect(v.queryByTestId(`app.side.project.${ACME}.rename.field`)).toBeNull();
  });

  it("on artifacts: '← Projects' and the library in the projects' place", () => {
    const { v } = frame({ screen: 'artifacts', project: '' }, [agent('main')]);
    expect(v.getByTestId('app.side.back')).toBeTruthy();
    expect(v.queryByTestId('app.side.list')).toBeNull();
  });
});
