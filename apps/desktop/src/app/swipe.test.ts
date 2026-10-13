import { describe, expect, it } from 'vitest';
import { GAP_MS, START, swipeStep, THRESHOLD_PX, type SwipeState, type Walk, type WheelIn } from './swipe';

const ev = (dx: number, dy: number, t: number, more: Partial<WheelIn> = {}): WheelIn => ({ dx, dy, t, ctrl: false, shift: false, innerX: false, ...more });

/** A stream of events, 16 ms apart from `t0`: the walks it makes, and its last state. */
function feed(events: readonly WheelIn[], from: SwipeState = START): { walks: Walk[]; state: SwipeState } {
  let state = from;
  const walks: Walk[] = [];
  for (const e of events) {
    const r = swipeStep(state, e);
    state = r.state;
    if (r.walk !== null) walks.push(r.walk);
  }
  return { walks, state };
}
const stream = (dx: number, dy: number, n: number, t0 = 1000, more: Partial<WheelIn> = {}) => Array.from({ length: n }, (_, i) => ev(dx, dy, t0 + i * 16, more));

describe('swipe', () => {
  it('fingers to the right walk back once, to the left forward once', () => {
    expect(feed(stream(-20, 0, 30)).walks).toEqual(['back']);
    expect(feed(stream(20, 1, 30)).walks).toEqual(['forward']);
  });

  it('short of the line, nothing', () => {
    const n = Math.floor((THRESHOLD_PX - 1) / 20);
    expect(feed(stream(-20, 0, n)).walks).toEqual([]);
  });

  it("the inertia after a walk is swallowed; after a pause, a new swipe walks again", () => {
    const one = stream(-20, 0, 30);
    const two = stream(-20, 0, 30, 1000 + 30 * 16 + GAP_MS + 1);
    expect(feed([...one, ...two]).walks).toEqual(['back', 'back']);
  });

  it('a vertical scroll that drifts sideways never walks', () => {
    expect(feed([ev(0, 30, 1000), ...stream(-40, 2, 20, 1016)]).walks).toEqual([]);
  });

  it('over something that scrolls sideways, it is that scroll', () => {
    expect(feed(stream(-20, 0, 30, 1000, { innerX: true })).walks).toEqual([]);
  });

  it('a pinch (ctrl) or a shift+wheel never walks', () => {
    expect(feed(stream(-20, 0, 30, 1000, { ctrl: true })).walks).toEqual([]);
    expect(feed(stream(-20, 0, 30, 1000, { shift: true })).walks).toEqual([]);
  });

  it('a tiny first move waits to pick its axis', () => {
    expect(feed([ev(-1, 1, 1000), ...stream(-20, 0, 30, 1016)]).walks).toEqual(['back']);
  });
});
