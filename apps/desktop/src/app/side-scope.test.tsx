// @vitest-environment happy-dom
// The right side is the project's in front (his m_45581, m_45583): in a project, the panel's
// Overview and the folded side's floats list only that project's agents, artifacts, schedules and
// processes; on bise's own screen, every project's. A card's ▯ never pins the Overview to a
// project: the next project's shows its own.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Agent, Proc, ScheduledTask } from '@/proto';
import type { CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { artifact, artifacts, ev, projects, row } from '../../tests/feature/inputs';
import { createRouter, RouterContext } from './router';
import type { Route } from './route';
import { panelProject } from './side';
import { Overview } from './panel/Overview';
import { SideHost } from './side3d/Host';
import { acrossSays, groupParts, listedOf, scopeIds } from './side3d/lists';
import { running } from '@/proto/words_running.gen';
import { side } from '@/proto/words_side.gen';
import { openOverview } from './panel/tabs';

// the office's renderer and the 3D pictures need WebGL: a stand-in office, pictures that never draw
vi.mock('@/bims/Office', async (orig) => ({ ...(await orig<typeof import('@/bims/Office')>()), Office: () => <canvas data-testid="office" /> }));
vi.mock('./side3d/render', () => ({
  outfitSig: () => '',
  objectPng: () => {
    throw new Error('no WebGL');
  },
  headPng: () => {
    throw new Error('no WebGL');
  },
  bubblePng: () => {
    throw new Error('no WebGL');
  },
}));
vi.mock('./side3d/ports', async (orig) => ({
  ...(await orig<typeof import('./side3d/ports')>()),
  usePanelBox: () => ({ open: false, width: 0 }),
}));

afterEach(cleanup);

const HOME = 'bise-home-00000000';
const HARNESS = 'harness-1a2b3c4d';
const DOCS = 'aidocs-5e6f7a8b';
const agent = (name: string, over: Partial<Agent> = {}): Agent => ({
  name, dir: name, main: false, status: 'idle', archived: false, title: name, purpose: '', since_ms: 0, waits: 0, watching: [], ...over,
});
const task = (id: number, agent: string): ScheduledTask => ({ id, agent, by: 'main', words: `wake ${agent}`, every: '5m', done: 0, times: 10, next_ms: Date.now() + 60_000 });
const proc = (id: string, agent: string): Proc => ({
  id, agent, kind: 'bg', cmd: `run ${agent}`, pid: 100, started_ms: Date.now() - 1000, state: { is: 'running' }, cpu: 0, rss_mb: 1, procs: 1, out: 'none',
}) as unknown as Proc;

/** Two projects (and bise's home), each with its own agent, artifact, schedule and process. */
function world(at: Route) {
  const port: CorePort = { send: () => undefined, onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  (window as unknown as { bise: unknown }).bise = { notify: { listed: () => undefined, state: () => Promise.resolve('granted'), onState: () => () => undefined } };
  Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });
  const store = new Store(port);
  store.setCore('up');
  store.apply(projects(row({ project: HOME, name: 'bise', home: true }), row({ project: HARNESS, name: 'harness' }), row({ project: DOCS, name: 'ai docs' })));
  for (const [p, who] of [[HARNESS, 'perf'], [DOCS, 'writer']] as const) {
    store.apply(ev('agents', { project: p, agents: [agent('main', { main: true }), agent(who, { status: 'working', rank: 1 })] }));
    store.apply(artifacts(p, artifact({ id: `${who}-notes`, kind: 'page', title: `${who} notes`, agent: who })));
    store.apply({ ev: 'scheduled', project: p, items: [task(1, who)] });
    store.apply({ ev: 'processes', project: p, items: [proc('bg1', who)] });
  }
  const router = createRouter(at);
  const v = render(
    <StoreProvider store={store}>
      <RouterContext value={router}>
        <SideHost />
        <div data-testid="app.panel"><Overview shown /></div>
      </RouterContext>
    </StoreProvider>,
  );
  return { v, router };
}

const inHarness: Route = { screen: 'thread', project: HARNESS, agent: 'main' };
const inDocs: Route = { screen: 'thread', project: DOCS, agent: 'main' };

/** What a float lists: each row's testid, as a list of words to look for. */
function floatText(v: ReturnType<typeof render>, b: 'agents' | 'artifacts' | 'scheduled' | 'processes'): string {
  fireEvent.click(v.getByTestId(`app.bubble.${b}`));
  const t = v.getByTestId(`app.flyout.${b}`).textContent;
  fireEvent.click(v.getByTestId(`app.bubble.${b}`));
  return t;
}

function overviewText(v: ReturnType<typeof render>): string {
  return v.getByTestId('app.panel').textContent;
}

describe('the right side is the project in front (his m_45581)', () => {
  it('one scope for the Overview and the folded side: a project its own, bise every project', () => {
    expect(panelProject(inHarness, HOME, 2)).toBe(HARNESS);
    expect(panelProject({ screen: 'agents', project: DOCS }, HOME, 2)).toBe(DOCS);
    expect(panelProject({ screen: 'bise' }, HOME, 2)).toBe('');
    expect(panelProject({ screen: 'thread', project: HOME, agent: 'main' }, HOME, 2)).toBe('');
    expect(scopeIds(HARNESS, [HOME, HARNESS, DOCS], HOME)).toEqual([HARNESS]);
    expect(scopeIds('', [HARNESS, HOME, DOCS], HOME)).toEqual([HOME, HARNESS, DOCS]);
  });

  it('the lists of every project keep each agent its project, two mains included', () => {
    const a = agent('main', { main: true });
    const b = agent('main', { main: true });
    const l = listedOf([{ project: HARNESS, agents: [a], cards: [], waits: 1 }, { project: DOCS, agents: [b], cards: [], waits: 2 }]);
    expect(l.live).toEqual([a, b]);
    expect(l.projectOf.get(a)).toBe(HARNESS);
    expect(l.projectOf.get(b)).toBe(DOCS);
    expect(l.waits).toBe(3);
  });

  it("in a project, its floats and its Overview list its agents, artifacts, schedules and processes only; in another, that one's", () => {
    const { v, router } = world(inHarness);
    expect(floatText(v, 'agents')).toContain('perf');
    expect(floatText(v, 'agents')).not.toContain('writer');
    expect(floatText(v, 'artifacts')).toContain('perf notes');
    expect(floatText(v, 'artifacts')).not.toContain('writer notes');
    expect(floatText(v, 'scheduled')).toContain('wake perf');
    expect(floatText(v, 'scheduled')).not.toContain('wake writer');
    expect(floatText(v, 'processes')).toContain('run perf');
    expect(floatText(v, 'processes')).not.toContain('run writer');
    for (const w of ['perf', 'perf notes']) expect(overviewText(v)).toContain(w);
    for (const w of ['writer', 'writer notes']) expect(overviewText(v)).not.toContain(w);
    act(() => {
      router.go(inDocs);
    });
    expect(floatText(v, 'agents')).toContain('writer');
    expect(floatText(v, 'agents')).not.toContain('perf');
    expect(floatText(v, 'artifacts')).not.toContain('perf notes');
    expect(floatText(v, 'scheduled')).not.toContain('wake perf');
    expect(floatText(v, 'processes')).not.toContain('run perf');
    for (const w of ['writer', 'writer notes']) expect(overviewText(v)).toContain(w);
    for (const w of ['perf', 'perf notes']) expect(overviewText(v)).not.toContain(w);
  });

  it("on bise's own screen, the floats and the Overview list every project's", () => {
    const { v } = world({ screen: 'bise' });
    for (const w of ['perf', 'writer']) expect(floatText(v, 'agents')).toContain(w);
    for (const w of ['perf notes', 'writer notes']) expect(floatText(v, 'artifacts')).toContain(w);
    for (const w of ['wake perf', 'wake writer']) expect(floatText(v, 'scheduled')).toContain(w);
    for (const w of ['run perf', 'run writer']) expect(floatText(v, 'processes')).toContain(w);
    for (const w of ['perf', 'writer', 'perf notes', 'writer notes']) expect(overviewText(v)).toContain(w);
  });

  it("on bise's own, each float row says its project ('acme › perf', the project apart for text-3) and each head counts across projects (designer m_45706)", () => {
    expect(groupParts('acme', 'perf')).toEqual({ project: running.group({ project: 'acme', agent: '' }), name: 'perf' });
    expect(groupParts(undefined, 'perf')).toEqual({ project: '', name: 'perf' });
    expect(acrossSays(side.working({ n: 6 }), 3)).toBe(side.in_projects({ n: side.working({ n: 6 }), p: 3 }));
    expect(acrossSays(side.working({ n: 6 }), 1)).toBe(side.working({ n: 6 }));
    const { v } = world({ screen: 'bise' });
    fireEvent.click(v.getByTestId('app.bubble.agents'));
    expect(v.getByTestId(`app.flyout.agents.${HARNESS}.perf.name`).textContent).toBe(running.group({ project: 'harness', agent: 'perf' }));
    expect(v.getByTestId(`app.flyout.agents.${HARNESS}.perf.name`).querySelector('.s3-group')?.textContent).toBe(running.group({ project: 'harness', agent: '' }));
    expect(v.getByTestId('app.flyout.agents').textContent).toContain(side.in_projects({ n: side.working({ n: 2 }), p: 2 }));
    // of the mains only the home's, as the Overview's agents: a project's main is its own thread
    expect(v.queryByTestId(`app.flyout.agents.${HARNESS}.main`)).toBeNull();
    expect(v.queryByTestId(`app.flyout.agents.${DOCS}.main`)).toBeNull();
    // the Overview's artifacts say their project too (ui-review m_45717)
    expect(v.getByTestId(`app.right.artifact.${DOCS}.writer-notes`).textContent).toContain('ai docs');
    expect(floatText(v, 'artifacts')).toContain(running.group({ project: 'ai docs', agent: 'writer' }));
    expect(floatText(v, 'scheduled')).toContain(running.group({ project: 'harness', agent: 'perf' }));
    expect(floatText(v, 'processes')).toContain(running.group({ project: 'ai docs', agent: 'writer' }));
  });

  it('in a project, rows and heads say no project', () => {
    const { v } = world(inHarness);
    fireEvent.click(v.getByTestId('app.bubble.agents'));
    expect(v.getByTestId(`app.flyout.agents.${HARNESS}.perf.name`).textContent).toBe('perf');
    expect(v.getByTestId(`app.flyout.agents.${HARNESS}.main`)).toBeTruthy();
    expect(v.getByTestId(`app.right.artifact.${HARNESS}.perf-notes`).textContent).not.toContain('harness');
    expect(v.getByTestId('app.flyout.agents').textContent).not.toContain(side.in_projects({ n: side.working({ n: 1 }), p: 1 }));
    expect(floatText(v, 'artifacts')).not.toContain(running.group({ project: 'harness', agent: 'perf' }));
  });

  it("a card's ▯ opens the Overview of the view: the next project's shows its own, never the pinned one's", () => {
    const { v, router } = world(inHarness);
    act(() => {
      openOverview('artifacts');
    });
    act(() => {
      router.go(inDocs);
    });
    expect(overviewText(v)).toContain('writer notes');
    expect(overviewText(v)).not.toContain('perf notes');
  });
});
