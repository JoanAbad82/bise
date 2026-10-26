// @vitest-environment happy-dom
// The frame of mockup 1, drawn from the store: the rail's places (the current one marked, inbox's
// dot only while something waits), the sidebar's projects (round 2: one row each, no agent under
// it; round 3, H1: its name and pill or age, its sentence, a quiet one on one line; ⌘ held its
// digit), its head bise, Search ⌘K, New project ⌘N (no New agent row).
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HINT_HOLD_MS } from './held';
import type { Agent, ProjectRow } from '@/proto';
import type { CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { ev, projects as projectsEv, row } from '../../tests/feature/inputs';
import { createRouter, RouterContext } from './router';
import type { Route } from './route';
import { Sidebar } from './Sidebar';
import { projects } from '@/proto/words_projects.gen';
import { common } from '@/proto/words.gen';
import { waitsTip, workingTip } from './tipwords';
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
  store.apply(projectsEv(row({ project: HOME, name: 'bise', home: true }), row({ project: ACME, name: 'acme', order: 1, ...acme }), row({ project: DOCS, name: 'docs', order: 2 })));
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

  it("H1: a project's pill, its sentence, its tip; a quiet one is one line with no sentence", () => {
    const working = [agent('main', { status: 'working' }), agent('perf', { status: 'working' })];
    const waits = frame({ screen: 'bise' }, working, [], { cards: null as never, waits: 1 }).v;
    expect(waits.getByTestId(`app.side.project.${ACME}.pill`).textContent).toBe('1');
    expect(waits.getByTestId(`app.side.project.${ACME}.pill`).getAttribute('data-tip')).toBe(projects.pill_tip({ n: 1 }));
    expect(waits.getByTestId(`app.side.project.${ACME}.say`).textContent).toBe(projects.working({ n: 2 }));
    expect(waits.getByTestId(`app.side.project.${ACME}`).getAttribute('data-tip')).toBe(`acme · ${workingTip(2)} · ${waitsTip(1)}`);
    // no marks: the words say it
    expect(waits.getByTestId(`app.side.project.${ACME}`).querySelector('.wk-sign, svg:not(.app-s-week)')).toBeNull();
    // docs: nothing works or waits, no pulse yet: quiet, one line
    const docs = waits.getByTestId(`app.side.project.${DOCS}`);
    expect(docs.classList.contains('quiet')).toBe(true);
    expect(waits.queryByTestId(`app.side.project.${DOCS}.say`)).toBeNull();
    expect(docs.getAttribute('data-tip')).toBe(common.all_quiet);
  });

  it("H1 with the hub's pulse: the age, a failure in the error colour, the week's sparkline", () => {
    const NOW = Date.now();
    const pulse = { from_ms: NOW - 20 * 8 * 3_600_000, busy_ms: Array.from({ length: 21 }, (_, i) => i * 60_000), last_ms: NOW - 40 * 60_000, news: { at_ms: NOW - 60_000, what: { kind: 'failed', agent: 'migrate' } }, counting: false };
    const { v } = frame({ screen: 'bise' }, [agent('main')], [], { pulse } as Partial<ProjectRow>);
    expect(v.getByTestId(`app.side.project.${ACME}.age`).textContent).toBe('40 min');
    const say = v.getByTestId(`app.side.project.${ACME}.say`);
    expect(say.textContent).toBe(projects.failed({ agent: 'migrate' }));
    expect(say.classList.contains('err')).toBe(true);
    // the week: 7 day bars, its label read aloud, each bar its own tip over the row's (designer m_45992)
    const week = v.getByTestId(`app.side.project.${ACME}.week`);
    expect(week.getAttribute('aria-label')).toBe(projects.week_tip);
    expect(week.querySelectorAll('.app-s-day')).toHaveLength(7);
    // busy_ms 0..20 min per 8 h: today's 3 buckets are 18+19+20 = 57 min
    const today = v.getByTestId(`app.side.project.${ACME}.week.6`);
    expect(today.classList.contains('today')).toBe(true);
    expect(today.getAttribute('data-tip')).toBe(projects.day_work({ day: 'today', work: '57 min' }));
    expect(v.getByTestId(`app.side.project.${ACME}.week.0`).getAttribute('data-tip')).toMatch(/· 3 min of agent work$/);
  });

  it("the hub's real pulse (the proto fixture's hub/pulse, folded into acme's row by the core): its new artifacts, its news in the tip, its age, 7 days", () => {
    const { pulse } = ev('pulse');
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime((pulse.last_ms ?? 0) + 3 * 3_600_000);
    try {
      const { v } = frame({ screen: 'bise' }, [agent('main')], [], { pulse });
      // never looked: the week's 2 artifacts are new, 3 entries for him unread, perf's land the news
      expect(v.getByTestId(`app.side.project.${ACME}.say`).textContent).toBe(projects.new_artifacts({ n: 2 }));
      expect(v.getByTestId(`app.side.project.${ACME}.age`).textContent).toBe('3 h');
      expect(v.getByTestId(`app.side.project.${ACME}`).getAttribute('data-tip')).toBe(
        ['acme', projects.new_artifacts({ n: 2 }), projects.unread({ n: 3 }), projects.landed({ agent: 'perf', target: 'main' }), projects.last_activity({ age: '3 h' })].join(' · '),
      );
      expect(v.getByTestId(`app.side.project.${ACME}.week`).querySelectorAll('.app-s-day')).toHaveLength(7);
    } finally {
      vi.useRealTimers();
    }
  });

  it('marks the project he opens seen, and again when he leaves it (prefs seen.<project>)', () => {
    const sent: unknown[] = [];
    const { router } = frame({ screen: 'thread', project: ACME, agent: 'main' }, [agent('main')], sent);
    const seen = () => sent.filter((c) => (c as { cmd: string; key?: string }).cmd === 'prefs_set' && (c as { key: string }).key === `seen.${ACME}`);
    expect(seen()).toHaveLength(1);
    act(() => {
      router.go({ screen: 'thread', project: DOCS, agent: 'main' });
    });
    expect(seen()).toHaveLength(2);
    expect(sent.some((c) => (c as { key?: string }).key === `seen.${DOCS}`)).toBe(true);
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
      expect(v.queryByTestId(`app.side.project.${ACME}.age`)).toBeNull();
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
