// @vitest-environment happy-dom
// Office.tsx on fake parts and a fake renderer: the toggle, the loop's start and stop, the window
// away, a lost WebGL context, a click on a bim. No three, no GPU.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Agent } from '@/proto';
import type { Activity, Label, Motion, Office as OfficeMap, OfficeRenderer, Pose, Timeline } from './model';
import { BimsSwitch, labelsSig, Office, tagOf, type Parts } from './Office';
import { bimsView } from './view';

// ---- a hand-driven rAF: a test runs the frames itself
let frames: (() => void)[] = [];
const flush = async (n = 1) => {
  for (let i = 0; i < n; i++) {
    const now = frames;
    frames = [];
    await act(async () => {
      for (const f of now) f();
      await Promise.resolve();
    });
  }
};

const agent = (name: string, main = false): Agent => ({ name, main, status: 'working', archived: false }) as unknown as Agent;
const AGENTS = [agent('main', true), agent('perf')];

/** A renderer that says what the test wants (`motion`) and counts its frames. */
function fakeRenderer() {
  let lostCb = (): void => undefined;
  const r = {
    motion: 'still' as Motion,
    frames: 0,
    setOffice: vi.fn(),
    setSize: vi.fn(() => 120),
    frame: vi.fn((): Motion => {
      r.frames++;
      return r.motion;
    }),
    headOf: vi.fn(() => ({ x: 10, y: 20 })),
    pick: vi.fn((x: number): string | null => (x < 50 ? 'perf' : null)),
    onLost: (cb: () => void) => {
      lostCb = cb;
    },
    lose: () => {
      lostCb();
    },
    dispose: vi.fn(),
  };
  return r;
}

function fakeParts(r: ReturnType<typeof fakeRenderer>, o: { moving?: () => boolean; labels?: () => ReadonlyMap<string, Label>; fail?: boolean } = {}) {
  const pose = (name: string): Pose => ({ x: 0, z: 0, dir: 0, moving: false, since: 0, seg: { t: 0, act: { k: 'work', at: 'desk' }, sig: name, spot: { x: 0, z: 0, wz: 0, ax: 0, face: 0 }, path: { pts: [], seg: [], len: 0 }, speed: 2.4, from: null } });
  const timeline: Timeline & { updates: number } = {
    updates: 0,
    update() {
      timeline.updates++;
    },
    poseAt: (name) => pose(name),
    names: () => ['main', 'perf'],
    moving: () => o.moving?.() ?? false,
  };
  const parts: Parts = {
    activities: (snap) => new Map<string, Activity>(snap.agents.map((a) => [a.name, { k: 'work', at: 'desk' }])),
    layoutOf: () => ({}) as OfficeMap,
    newTimeline: () => timeline,
    labelsOf: () => o.labels?.() ?? new Map(),
    load: () => (o.fail === true ? Promise.reject(new Error('no chunk')) : Promise.resolve(() => r as unknown as OfficeRenderer)),
  };
  return { parts, timeline };
}

const mount = (parts: Parts, onOpen = vi.fn()) =>
  render(<Office project="p1" agents={AGENTS} cards={[]} places={[]} parts={parts} onOpen={onOpen} fallback={<div data-testid="the-list">list</div>} />);

beforeEach(() => {
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (f: () => void) => {
    frames.push(f);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = [];
  });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  (window as { bise?: { test?: boolean } }).bise = { test: true };
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  bimsView.reset();
});

describe('the toggle', () => {
  it('list | bims; 320 | wide only with bims on; kept', () => {
    const { rerender } = render(<BimsSwitch view={bimsView.get()} />);
    expect(screen.getByTestId('app.right.agents.view.list').getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByTestId('app.right.agents.width.wide')).toBeNull();
    fireEvent.click(screen.getByTestId('app.right.agents.view.bims'));
    expect(bimsView.get().view).toBe('bims');
    rerender(<BimsSwitch view={bimsView.get()} />);
    fireEvent.click(screen.getByTestId('app.right.agents.width.wide'));
    expect(bimsView.get()).toEqual({ view: 'bims', wide: true });
    bimsView.reset();
    expect(bimsView.get()).toEqual({ view: 'bims', wide: true });
  });
  it('each choice says itself on hover (taste 15)', () => {
    render(<BimsSwitch view={{ view: 'bims', wide: false }} />);
    for (const id of ['view.list', 'view.bims', 'width.narrow', 'width.wide']) expect(screen.getByTestId(`app.right.agents.${id}`).dataset.tip).not.toBe('');
  });
});

describe('the loop', () => {
  it('the list while the renderer loads, then the office; one frame and it stops when all is still', async () => {
    const r = fakeRenderer();
    const { parts } = fakeParts(r);
    mount(parts);
    expect(screen.getByTestId('app.right.bims').dataset.state).toBe('loading');
    expect(screen.getByTestId('the-list')).toBeTruthy();
    await flush();
    expect(screen.getByTestId('app.right.bims').dataset.state).toBe('on');
    expect(screen.queryByTestId('the-list')).toBeNull();
    await flush(3);
    expect(r.frames).toBe(1);
    expect(frames).toHaveLength(0);
    expect(r.setOffice).toHaveBeenCalledTimes(1);
  });
  it('runs while something walks, stops after', async () => {
    const r = fakeRenderer();
    let walking = true;
    const { parts } = fakeParts(r, { moving: () => walking });
    mount(parts);
    await flush(5);
    expect(r.frames).toBe(4);
    walking = false;
    await flush(5);
    expect(r.frames).toBe(5);
    expect(frames).toHaveLength(0);
  });
  it("the renderer's walk keeps it at the display rate", async () => {
    const r = fakeRenderer();
    r.motion = 'walk';
    mount(fakeParts(r).parts);
    await flush(4);
    expect(frames).toHaveLength(1);
    r.motion = 'still';
    await flush(3);
    expect(frames).toHaveLength(0);
  });
  it('the window hidden: no frame at all; back: one frame', async () => {
    const r = fakeRenderer();
    r.motion = 'walk';
    let hidden = false;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    mount(fakeParts(r).parts);
    await flush(2);
    const n = r.frames;
    hidden = true;
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await flush(5);
    expect(r.frames).toBe(n);
    expect(frames).toHaveLength(0);
    hidden = false;
    r.motion = 'still';
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await flush(3);
    expect(r.frames).toBe(n + 1);
  });
  it('a new snapshot kicks one frame and the timeline hears of it', async () => {
    const r = fakeRenderer();
    const { parts, timeline } = fakeParts(r);
    const { rerender } = mount(parts);
    await flush(2);
    expect(timeline.updates).toBe(1);
    rerender(<Office project="p1" agents={[...AGENTS, agent('ui')]} cards={[]} places={[]} parts={parts} onOpen={vi.fn()} fallback={null} />);
    await flush(2);
    expect(r.frames).toBe(2);
    expect(timeline.updates).toBe(2);
    // a new agent: a new office
    expect(r.setOffice).toHaveBeenCalledTimes(2);
  });
});

describe('WebGL lost', () => {
  it('the list with one line, never a blank section; the loop stops', async () => {
    const r = fakeRenderer();
    r.motion = 'walk';
    mount(fakeParts(r).parts);
    await flush(2);
    act(() => {
      r.lose();
    });
    expect(screen.getByTestId('app.right.bims.lost').textContent).not.toBe('');
    expect(screen.getByTestId('the-list')).toBeTruthy();
    expect(screen.queryByTestId('app.right.bims.canvas')).toBeNull();
    const n = r.frames;
    await flush(3);
    expect(r.frames).toBe(n);
  });
  it('a renderer that fails to load: the same', async () => {
    mount(fakeParts(fakeRenderer(), { fail: true }).parts);
    await flush();
    expect(screen.getByTestId('app.right.bims.lost')).toBeTruthy();
    expect(screen.getByTestId('the-list')).toBeTruthy();
  });
});

describe('the overlay', () => {
  it('a pill alone has no name; hover, ctrl or an event give the line', () => {
    expect(tagOf({ name: 'perf', mode: 'pill', words: '', pill: 'asks' })).toEqual({ text: null, pill: 'asks' });
    expect(tagOf({ name: 'perf', mode: 'name', words: '', pill: 'asks' })).toEqual({ text: 'perf', pill: 'asks' });
    expect(tagOf({ name: 'perf', mode: 'event', words: 'done', pill: null })).toEqual({ text: 'perf · done', pill: null });
    expect(tagOf({ name: 'perf', mode: 'name', words: '', pill: null })).toEqual({ text: 'perf', pill: null });
    expect(tagOf({ name: 'perf', mode: 'hover', words: 'working · fix', pill: 'failed' }).text).toBe('perf · working · fix');
  });
  it('labels re-render only when their content changes', () => {
    const a = new Map<string, Label>([['perf', { name: 'perf', mode: 'event', words: 'done', pill: null }]]);
    expect(labelsSig(a)).toBe(labelsSig(new Map(a)));
    expect(labelsSig(a)).not.toBe(labelsSig(new Map<string, Label>([['perf', { name: 'perf', mode: 'name', words: '', pill: null }]])));
  });
  it('shows the pills with their tip; a click on a pill or a bim opens it', async () => {
    const r = fakeRenderer();
    const onOpen = vi.fn();
    mount(fakeParts(r, { labels: () => new Map<string, Label>([['perf', { name: 'perf', mode: 'pill', words: '', pill: 'asks' }]]) }).parts, onOpen);
    await flush(2);
    const pill = screen.getByTestId('app.right.bims.pill.perf');
    expect(pill.dataset.pill).toBe('asks');
    expect(pill.dataset.tip).toContain('perf');
    expect(screen.queryByTestId('app.right.bims.label.perf')).toBeNull();
    fireEvent.click(pill);
    expect(onOpen).toHaveBeenCalledWith('perf');
    fireEvent.click(screen.getByTestId('app.right.bims'), { clientX: 10, clientY: 10 });
    expect(onOpen).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByTestId('app.right.bims'), { clientX: 200, clientY: 10 });
    expect(onOpen).toHaveBeenCalledTimes(2);
  });
});
