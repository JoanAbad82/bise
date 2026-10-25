// @vitest-environment happy-dom
// The frame of mockup 1, drawn from the store: the rail's places (the current one marked, inbox's
// dot only while something waits), the sidebar's two levels (an agent's thread from its row, the
// dot and the ring, 'Show N more'), and New agent ⌘N on the project in view.
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Agent } from '@/proto';
import type { CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { ev, projects, row } from '../../tests/feature/inputs';
import { createRouter, RouterContext } from './router';
import type { Route } from './route';
import { Sidebar } from './Sidebar';
import { SideRail } from './SideRail';
import { NewAgentHost, useNewAgentAsked } from './newagent';
import { askEntityAction } from './menus/actions';
import { act } from '@testing-library/react';

afterEach(cleanup);
const HOME = 'bise-home-00000000';
const ACME = 'acme-1a2b3c4d';

const AGENT = (ev('agents').agents[0] ?? {}) as Agent;
const agent = (name: string, o: Partial<Agent> = {}): Agent => ({ ...AGENT, name, main: name === 'main', status: 'idle', waits: 0, archived: false, ...o });

function Asked() {
  return <span data-testid="asked">{useNewAgentAsked() ?? ''}</span>;
}

function frame(route: Route, agents: Agent[], sent: unknown[] = []) {
  const port: CorePort = { send: (c) => { sent.push(c); }, onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  (window as unknown as { bise: unknown }).bise = { notify: { listed: () => undefined, state: () => Promise.resolve('granted'), onState: () => () => undefined } };
  const store = new Store(port);
  store.setCore('up');
  store.apply(projects(row({ project: HOME, name: 'bise', home: true }), row({ project: ACME, name: 'acme' })));
  store.apply(ev('agents', { project: ACME, agents }));
  const router = createRouter(route);
  const v = render(
    <StoreProvider store={store}>
      <RouterContext value={router}>
        <SideRail />
        <Sidebar onSearch={() => undefined} />
        <Asked />
        <NewAgentHost />
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
  it("lists a project's agents in the hub's rank, an agent's row opens its thread, the one in view marked", () => {
    const { v, router } = frame({ screen: 'thread', project: ACME, agent: 'docs' }, [agent('main'), agent('docs', { rank: 2 }), agent('perf', { rank: 1 })]);
    const list = v.getByTestId('app.side.list');
    const ids = [...list.querySelectorAll('[data-testid^="app.side.agent."]')].map((e) => e.getAttribute('data-testid'));
    expect(ids).toEqual([`app.side.agent.${ACME}.main`, `app.side.agent.${ACME}.perf`, `app.side.agent.${ACME}.docs`]);
    expect(v.getByTestId(`app.side.agent.${ACME}.docs`).getAttribute('aria-current')).toBe('page');
    fireEvent.click(v.getByTestId(`app.side.agent.${ACME}.perf`));
    expect(router.get()).toEqual({ screen: 'thread', project: ACME, agent: 'perf' });
    fireEvent.click(v.getByTestId(`app.side.agent.${ACME}.main`));
    expect(router.get()).toEqual({ screen: 'thread', project: ACME, agent: 'main' });
  });

  it('ends a row with the dot when it waits on him, the ring at work, nothing else', () => {
    const { v } = frame({ screen: 'bise' }, [agent('main'), agent('perf', { waits: 2 }), agent('docs', { status: 'working' })]);
    expect(v.getByTestId(`app.side.agent.${ACME}.perf.waits`)).toBeTruthy();
    expect(v.getByTestId(`app.side.agent.${ACME}.docs.works`)).toBeTruthy();
    expect(v.queryByTestId(`app.side.agent.${ACME}.main.waits`)).toBeNull();
    expect(v.getByTestId(`app.side.agent.${ACME}.perf`).textContent).toBe('perf');
  });

  it("'Show N more' after 4 agents opens the rest", () => {
    const { v } = frame({ screen: 'bise' }, ['main', 'a', 'b', 'c', 'd', 'e'].map((n, i) => agent(n, { rank: i })));
    const more = v.getByTestId(`app.side.more.${ACME}`);
    expect(more.textContent).toBe('Show 2 more');
    expect(v.queryByTestId(`app.side.agent.${ACME}.e`)).toBeNull();
    fireEvent.click(more);
    expect(v.getByTestId(`app.side.agent.${ACME}.e`)).toBeTruthy();
  });

  it('a click on the project folds its agents', () => {
    const { v } = frame({ screen: 'bise' }, [agent('main'), agent('perf')]);
    fireEvent.click(v.getByTestId(`app.side.project.${ACME}`));
    expect(v.queryByTestId(`app.side.agent.${ACME}.perf`)).toBeNull();
    expect(v.getByTestId(`app.side.project.${ACME}`).getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(v.getByTestId(`app.side.project.${ACME}`));
  });

  it('New agent asks for an agent in the project in view', () => {
    const { v } = frame({ screen: 'thread', project: ACME, agent: 'main' }, [agent('main')]);
    fireEvent.click(v.getByTestId('app.side.new'));
    expect(v.getByTestId('asked').textContent).toBe(ACME);
  });

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
