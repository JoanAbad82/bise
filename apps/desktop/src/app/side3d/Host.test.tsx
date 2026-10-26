// @vitest-environment happy-dom
// The right side as he sees it on fake rows: the world and the four bubbles with their counts, a
// card per bubble, an ask's option sent through the store's own pick, esc and ⌥⌘1 (the screen
// action), nothing clipped on the way up (noClip), nothing while the panel is open.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { Profiler } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Agent } from '@/proto';
import type { CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { noClip } from '@/ds/noclip';
import { side } from '@/proto/words_side.gen';
import { artifact, artifacts, card, ev, projects, row } from '../../../tests/feature/inputs';
import { createRouter, RouterContext } from '../router';
import { emitAction } from '../menu';
import { keyAction } from '../keys';
import { SideHost, bubbleTops } from './Host';
import { CARD_MAX } from './layout';
import { GRACE_MS, HOVER_MS, hitBox } from './World';

// the office's renderer and the 3D pictures need WebGL: a stand-in office, pictures that never draw (the plain tile)
const office = vi.hoisted(() => ({ cameraFrom: [] as (HTMLElement | null)[] }));
vi.mock('@/bims/Office', () => ({
  Office: ({ cameraFrom = null }: { cameraFrom?: HTMLElement | null }) => {
    office.cameraFrom.push(cameraFrom);
    return <canvas data-testid="office" />;
  },
}));
vi.mock('./render', () => ({
  outfitSig: () => '',
  objectPng: () => {
    throw new Error('no WebGL');
  },
  headPng: () => {
    throw new Error('no WebGL');
  },
}));
const panel = vi.hoisted(() => ({ open: false }));
vi.mock('./ports', async (orig) => ({
  ...(await orig<typeof import('./ports')>()),
  usePanelBox: () => ({ open: panel.open, width: panel.open ? 384 : 0 }),
}));

afterEach(() => {
  cleanup();
  panel.open = false;
});

const HOME = 'bise-home-00000000';
const ACME = 'acme-1a2b3c4d';
const agent = (name: string, over: Partial<Agent> = {}): Agent => ({
  name, dir: name, main: false, status: 'idle', archived: false, title: 'speed', purpose: '', since_ms: 0, waits: 0, watching: [], ...over,
});

function side3d(winW = 1440, onCommit?: () => void) {
  const port: CorePort = { send: () => undefined, onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  (window as unknown as { bise: unknown }).bise = { notify: { listed: () => undefined, state: () => Promise.resolve('granted'), onState: () => () => undefined } };
  // 1440 wide: the world small (sideLayout), the rail and the sidebar on the left
  Object.defineProperty(window, 'innerWidth', { value: winW, configurable: true });
  const store = new Store(port);
  store.setCore('up');
  const ask = card({ project: ACME, id: 7, agent: 'perf', kind: 'question', question: 'run rm -rf target?', options: [{ n: 1, label: 'yes' }, { n: 2, label: 'no' }], approval: false });
  store.apply(projects(row({ project: HOME, name: 'bise', home: true }), row({ project: ACME, name: 'acme', cards: [ask], waits: 1 })));
  store.apply(ev('agents', {
    project: ACME,
    agents: [
      agent('main', { main: true }),
      agent('perf', { status: 'working', waits: 1, rank: 1 }),
      agent('docs', { status: 'working', rank: 2, note: 'checking the links' }),
      agent('old', { archived: true }),
    ],
  }));
  store.apply(artifacts(ACME, artifact({ id: 'a1', kind: 'pr', title: 'PR #6', agent: 'perf', new: true }), artifact({ id: 'a2', kind: 'page', title: 'Perf notes', agent: 'perf', new: false })));
  const does = vi.spyOn(store, 'do');
  const router = createRouter({ screen: 'thread', project: ACME, agent: 'perf' });
  const v = render(
    <StoreProvider store={store}>
      <RouterContext value={router}>
        <Profiler id="side" onRender={() => onCommit?.()}>
          <SideHost />
        </Profiler>
      </RouterContext>
    </StoreProvider>,
  );
  return { v, store, does, router };
}

describe('the right side, folded', () => {
  it('the world and the four bubbles, each with its tip; the counts, the agents in the accent when one asks, none at 0', () => {
    const { v } = side3d();
    expect(v.getByTestId('app.world')).toBeTruthy();
    for (const b of ['agents', 'artifacts', 'scheduled', 'processes']) expect(v.getByTestId(`app.bubble.${b}`).getAttribute('data-tip')).toBeTruthy();
    // 2 working, 1 of them asks: the badge is what waits on him
    expect(v.getByTestId('app.bubble.agents.count').textContent).toBe('1');
    expect(v.getByTestId('app.bubble.agents.count').hasAttribute('data-accent')).toBe(true);
    expect(v.getByTestId('app.bubble.artifacts.count').textContent).toBe('1');
    expect(v.getByTestId('app.bubble.artifacts.count').hasAttribute('data-accent')).toBe(false);
    expect(v.queryByTestId('app.bubble.processes.count')).toBeNull();
    expect(v.getByTestId('app.bubble.agents').getAttribute('aria-label')).toBe(
      side.bubble_tip({ name: side.agents, says: `${side.working({ n: 2 })} · ${side.asks({ n: 1 })}` }),
    );
  });

  it('nothing clips the world, a bubble or a card on the way up', () => {
    const { v } = side3d();
    fireEvent.click(v.getByTestId('app.bubble.agents'));
    noClip(v.getByTestId('app.world'));
    noClip(v.getByTestId('app.bubble.agents'));
    noClip(v.getByTestId('app.flyout.agents'));
  });

  it('the agents card: in the hub\'s rank, the asking one with its options; an option sends the inbox\'s pick from the thread in view', () => {
    const { v, does } = side3d();
    fireEvent.click(v.getByTestId('app.bubble.agents'));
    const lines = [...v.getByTestId('app.flyout.agents').querySelectorAll('.s3-agent')].map((e) => e.getAttribute('data-testid'));
    expect(lines).toEqual([`app.flyout.agents.${ACME}.main`, `app.flyout.agents.${ACME}.perf`, `app.flyout.agents.${ACME}.docs`]);
    expect(v.getByTestId(`app.flyout.agents.${ACME}.perf`).getAttribute('data-k')).toBe('asks');
    expect(v.getByTestId(`app.flyout.agents.${ACME}.docs`).getAttribute('data-k')).toBe('thinks');
    fireEvent.click(v.getByTestId(`app.flyout.agents.${ACME}.perf.opt.1`));
    expect(does).toHaveBeenCalledWith({ i: 'pick', project: ACME, card: 7, n: 1, from: { at: { project: ACME, agent: 'perf' } } });
    expect(v.getByTestId(`app.flyout.agents.${ACME}.perf.answer`).textContent).toBe(side.answer);
    expect(v.getByTestId('app.flyout.agents').textContent).toContain(side.archived({ n: 1 }));
  });

  it('the artifacts card: the new one with its dot; one card at a time; esc closes it', () => {
    const { v } = side3d();
    fireEvent.click(v.getByTestId('app.bubble.artifacts'));
    expect(v.getByTestId(`app.flyout.artifacts.${ACME}.a1`).querySelector('.s3-dot[data-tone="acc"]')).not.toBeNull();
    expect(v.getByTestId(`app.flyout.artifacts.${ACME}.a2`).querySelector('.s3-dot')).toBeNull();
    fireEvent.click(v.getByTestId('app.bubble.agents'));
    expect(v.queryByTestId('app.flyout.artifacts')).toBeNull();
    expect(v.getByTestId('app.bubble.agents').getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(v.queryByTestId('app.flyout.agents')).toBeNull();
  });

  it('⌥⌘1-⌥⌘4 are the bubbles: the key gives the screen action, the side opens its card', () => {
    const k = (code: string) => keyAction({ key: '', code, metaKey: true, altKey: true, ctrlKey: false, shiftKey: false }, { route: { screen: 'bise' }, projects: [], agents: () => [], typing: false });
    expect(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].map(k)).toEqual([{ screen: 'side-1' }, { screen: 'side-2' }, { screen: 'side-3' }, { screen: 'side-4' }, undefined]);
    const { v } = side3d();
    act(() => {
      emitAction('side-4');
    });
    expect(v.getByTestId('app.flyout.processes').textContent).toContain(side.no_processes);
    // the scheduled bubble: its own head first, the processes under it
    act(() => {
      emitAction('side-3');
    });
    const card = v.getByTestId('app.flyout.scheduled');
    expect(card.querySelector('.s3-card-head b')?.textContent).toBe(side.scheduled);
    expect(v.getByTestId('app.flyout.scheduled.processes').textContent).toContain(side.processes);
  });

  it('1100 wide: the world folds into a 5th bubble on top of the stack', () => {
    const { v } = side3d(1100);
    expect(v.queryByTestId('app.world')).toBeNull();
    expect(v.getByTestId('app.bubble.world').style.top).toBe('40px');
    expect(v.getByTestId('app.bubble.agents').style.top).toBe('120px');
  });

  it('the tabbed panel open: no world, no bubbles', () => {
    panel.open = true;
    const { v } = side3d();
    expect(v.queryByTestId('app.side')).toBeNull();
  });

  it('the world takes the pointer on its island only: grown, never on the bubbles\' column', () => {
    expect(hitBox(280, false)).toEqual({ width: 148, height: 108 });
    const big = hitBox(280, true);
    expect(big).toMatchObject({ width: 384, height: 280 });
    expect(big.clipPath).toContain('calc(100% - 68px) 112px');
  });

  it('the agents card: one foot, the card\'s end (archived · all agents)', () => {
    const { v } = side3d();
    fireEvent.click(v.getByTestId('app.bubble.agents'));
    const card = v.getByTestId('app.flyout.agents');
    expect(card.querySelectorAll('footer')).toHaveLength(1);
    expect(card.lastElementChild?.tagName).toBe('FOOTER');
    expect(card.hasAttribute('data-foot')).toBe(true);
    expect(card.querySelector('footer')?.textContent).toBe(`${side.archived({ n: 1 })}${side.all_agents}`);
  });

  it('a card\'s top is its bubble\'s; its height at most the window\'s (min(window − 48, 560))', () => {
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
    const { v } = side3d();
    fireEvent.click(v.getByTestId('app.bubble.processes'));
    const card = v.getByTestId('app.flyout.processes');
    expect(card.style.top).toBe(v.getByTestId('app.bubble.processes').style.top);
    expect(card.style.maxHeight).toBe(`${String(CARD_MAX)}px`);
  });

  it('a card open stays put: its own resize with nothing changed makes no new render (the jitter, Gabriel m_44190)', () => {
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
    // a card's rows 900 tall: drawn at its cap, as Chromium would
    const was = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get(this: HTMLElement) {
        if (!this.classList.contains('s3-card')) return 0;
        const cap = parseFloat(this.style.maxHeight);
        return Number.isNaN(cap) ? 900 : Math.min(900, cap);
      },
    });
    const seen: ResizeObserverCallback[] = [];
    vi.stubGlobal('ResizeObserver', class {
      constructor(cb: ResizeObserverCallback) {
        seen.push(cb);
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    });
    try {
      let commits = 0;
      const { v } = side3d(1440, () => {
        commits++;
      });
      fireEvent.click(v.getByTestId('app.bubble.processes'));
      const card = v.getByTestId('app.flyout.processes');
      const top = card.style.top;
      // lifted so its 560 end 24 above the window's bottom: 900 - 24 - 560 under the window's top
      expect(top).toBe(`${String(900 - 24 - CARD_MAX - (card.parentElement?.getBoundingClientRect().top ?? 0))}px`);
      const after = commits;
      act(() => {
        for (let i = 0; i < 5; i++) for (const cb of seen) cb([], {} as ResizeObserver);
      });
      expect(commits).toBe(after);
      expect(card.style.top).toBe(top);
    } finally {
      vi.unstubAllGlobals();
      if (was !== undefined) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', was);
    }
  });

  it('grown on hover, the world gives its hit span to the office as its camera\'s input (the open map\'s pinch and drag); folded, none', () => {
    vi.useFakeTimers();
    try {
      const { v } = side3d();
      const last = () => office.cameraFrom.at(-1);
      expect(last()).toBeNull();
      fireEvent.pointerEnter(v.getByTestId('app.world'));
      act(() => {
        vi.advanceTimersByTime(HOVER_MS);
      });
      expect(last()).toBe(v.getByTestId('app.world.hit'));
      fireEvent.pointerLeave(v.getByTestId('app.world'));
      act(() => {
        vi.advanceTimersByTime(GRACE_MS);
      });
      expect(last()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('the bubbles under the world at 152, 80 apart, put whatever the world does; as a 5th bubble the world tops the stack', () => {
    expect(bubbleTops('small').bubbles).toEqual({ agents: 152, artifacts: 232, scheduled: 312, processes: 392 });
    expect(bubbleTops('bubble')).toEqual({ world: 40, bubbles: { agents: 120, artifacts: 200, scheduled: 280, processes: 360 } });
  });
});
