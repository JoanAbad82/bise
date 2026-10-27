// @vitest-environment happy-dom
// ⌘K with a big list (cmdk-perf, his m_46804): a one-letter query matches a thousand rows, the
// palette draws about a screen of them (paletteWindow.ts), the heads still count them all, and ↓
// reaches a far row, drawn and selected. Mutations: the window dropped (every row drawn), the
// selected row's run dropped from windowOf: each turns this red.
// PERF=1 also times keystrokes on 20 projects × (60 agents, 100 artifacts, 10 scheduled):
//   PERF=1 pnpm -C apps/desktop exec vitest run src/app/Palette.test.tsx
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Agent, ScheduledTask } from '@/proto';
import { Store, StoreProvider } from '@/store';
import { artifact, artifacts, ev, projects as projectsEv, row } from '../../tests/feature/inputs';
import { Palette } from './Palette';
import { OVERSCAN } from './paletteWindow';
import { createRouter, RouterContext } from './router';

afterEach(cleanup);

const BASE = 1_791_100_000_000;
const WORDS = ['perf', 'docs', 'search', 'login', 'deploy', 'bims', 'plugins', 'review', 'gate', 'thread'];

/** A fake core's store: `nProjects` projects, each with its agents (a quarter archived), artifacts and scheduled tasks. */
function bigStore(nProjects: number, nAgents: number, nArtifacts: number, nSched: number): Store {
  const store = new Store(null);
  const rows = Array.from({ length: nProjects }, (_, i) => row({ project: `p${String(i)}`, name: `proj${String(i)}`, order: i, home: i === 0 }));
  store.apply(projectsEv(...rows));
  const agent0 = ev('agents').agents[0] as Agent;
  for (const r of rows) {
    const ags: Agent[] = [{ ...agent0, name: 'main', main: true, archived: false }];
    for (let k = 0; k < nAgents; k++) {
      const w = WORDS[k % WORDS.length] ?? 'x';
      ags.push({ ...agent0, name: `${w}-${String(k)}`, main: false, archived: k % 4 === 0, status: 'idle', title: `fix the ${w} thing number ${String(k)}`, purpose: `make ${w} faster`, since_ms: BASE - k * 60_000, waits: k % 17 === 0 ? 1 : 0 });
    }
    store.apply(ev('agents', { project: r.project, agents: ags, archived: [] }));
    store.apply(
      artifacts(
        r.project,
        ...Array.from({ length: nArtifacts }, (_, k) => artifact({ id: `a${String(k)}`, title: `${WORDS[k % WORDS.length] ?? 'x'} report ${String(k)}`, agent: `perf-${String(k)}`, at_ms: BASE - k * 3_600_000 })),
      ),
    );
    const items: ScheduledTask[] = Array.from({ length: nSched }, (_, k) => ({ id: k, agent: 'main', by: 'main', words: `check ${WORDS[k % WORDS.length] ?? 'x'} every morning`, every: 'every 1h', done: 0 }));
    store.apply(ev('scheduled', { project: r.project, items }));
  }
  return store;
}

function mount(store: Store) {
  const view = render(
    <StoreProvider store={store}>
      <RouterContext value={createRouter({ screen: 'bise' })}>
        <Palette onClose={() => undefined} />
      </RouterContext>
    </StoreProvider>,
  );
  const field = view.getByTestId('app.palette.field') as HTMLInputElement;
  const type = (value: string): void => {
    act(() => {
      fireEvent.change(field, { target: { value } });
    });
  };
  return { view, field, type };
}

describe('⌘K with a big list', () => {
  it('draws about a screen of rows, the heads count them all, ↓ reaches a far row', () => {
    const { view, field, type } = mount(bigStore(1, 400, 400, 0));
    type('r');
    const agents = view.getByTestId('app.palette.group.agents');
    // the head counts every agent 'r' matches, drawn or not
    const count = Number(/· (\d+)/.exec(agents.textContent)?.[1]);
    expect(count).toBeGreaterThan(100);
    const drawn = view.container.querySelectorAll('[role="option"]').length;
    // unmeasured (no layout here): one 720 px screen of 32 px rows and the overscan
    expect(drawn).toBeLessThanOrEqual(Math.ceil(720 / 32) + 2 * OVERSCAN + 2);
    // a far row: a few past the drawn ones, not drawn yet. Each ↓ is a render: just past the window
    // keeps the test cheap (60 ↓ timed out at 5 s in the whole suite under load, 0.24 s alone)
    const at = drawn + 3;
    expect(view.queryByTestId(`app.palette.item.${String(at)}`)).toBeNull();
    for (let i = 0; i < at; i++)
      act(() => {
        fireEvent.keyDown(field, { key: 'ArrowDown' });
      });
    const far = view.getByTestId(`app.palette.item.${String(at)}`);
    expect(far.getAttribute('aria-selected')).toBe('true');
    expect(view.container.querySelectorAll('[role="option"][aria-selected="true"]').length).toBe(1);
    // ~35 renders: 0.4 s alone, the whole suite at load stretches a test 20-25x (9.6 s on 2a0cf0caf)
  }, 15_000);

  it.runIf(process.env['PERF'] === '1')('PERF: ms per keystroke', () => {
    const store = bigStore(20, 60, 100, 10);
    const { view, type } = mount(store);
    const typed = 'deploy re';
    const times: number[] = [];
    for (let round = 0; round < 3; round++) {
      for (let i = 1; i <= typed.length; i++) {
        const t0 = performance.now();
        type(typed.slice(0, i));
        times.push(performance.now() - t0);
      }
      type('');
    }
    type('d');
    const items = store.projects().reduce((n, p) => n + store.agents(p.project).length + store.artifacts(p.project).length + store.scheduled(p.project).length, 0);
    const sorted = [...times].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
    const rowsNow = view.container.querySelectorAll('[role="option"]').length;
    console.log(`⌘K keystroke on ${String(items)} items: median ${median.toFixed(1)} ms, max ${(sorted.at(-1) ?? 0).toFixed(1)} ms; rows drawn for 'd': ${String(rowsNow)}`);
  }, 120_000);
});
