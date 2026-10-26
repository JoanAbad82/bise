import { describe, expect, it } from 'vitest';
import { FRAME_KINDS } from '../shared/frame';
import { PINCH_FORWARD } from './pinch';

type Listener = (e: Record<string, unknown>) => void;

/** The injected script, run as a frame runs it: its globals given. */
// eslint-disable-next-line @typescript-eslint/no-implied-eval -- the script guard.ts injects, run as the frame would
const run = new Function('window', 'parent', 'addEventListener', 'innerWidth', 'innerHeight', PINCH_FORWARD) as (...globals: unknown[]) => void;

/** The forwarder run in a fake frame: its listeners, what it posted to its parent. */
function frame() {
  const on: Record<string, Listener[]> = {};
  const posted: unknown[] = [];
  const parent = { postMessage: (m: unknown) => posted.push(m) };
  const win: Record<string, unknown> = {};
  const addEventListener = (t: string, f: Listener, o?: { passive?: boolean }) => {
    if (t === 'wheel') expect(o?.passive, 'a wheel it may take is never passive').toBe(false);
    (on[t] ??= []).push(f);
  };
  const load = () => {
    run(win, parent, addEventListener, 600, 800);
  };
  load();
  const wheel = (w: Record<string, unknown>) => {
    let taken = false;
    const e = { deltaX: 0, deltaY: 0, deltaMode: 0, ctrlKey: false, shiftKey: false, clientX: 0, clientY: 0, defaultPrevented: false, preventDefault: () => { taken = true; }, ...w };
    for (const f of on.wheel ?? []) f(e);
    return taken;
  };
  const message = (data: unknown, source: unknown = parent) => {
    for (const f of on.message ?? []) f({ data, source });
  };
  return { posted, wheel, message, again: load };
}

describe("a web page's pinch forwarder (main/pinch.ts, put in pages-server frames by guard.ts)", () => {
  it('a pinch the page left goes to the window; one the page took (the image viewer) stays the page’s', () => {
    const f = frame();
    expect(f.wheel({ ctrlKey: true, deltaY: -3, clientX: 40, clientY: 50 })).toBe(true);
    expect(f.posted).toEqual([{ bise: FRAME_KINDS.pinch, dy: -3, x: 40, y: 50, w: 600 }]);
    expect(f.wheel({ ctrlKey: true, deltaY: -3, defaultPrevented: true })).toBe(false);
    expect(f.posted).toHaveLength(1);
  });

  it('at fit two fingers scroll the page; zoomed with room that way they pan, at an edge the page scrolls again', () => {
    const f = frame();
    expect(f.wheel({ deltaY: 30 })).toBe(false);
    f.message({ bise: FRAME_KINDS.room, room: { l: 0, r: 100, u: 0, d: 200 } });
    expect(f.wheel({ deltaY: 30 })).toBe(true);
    expect(f.posted.at(-1)).toEqual({ bise: FRAME_KINDS.pan, dx: 0, dy: 30, w: 600 });
    expect(f.wheel({ deltaY: -30 }), 'no room up: the page scrolls').toBe(false);
    expect(f.wheel({ deltaX: -10, deltaY: 2 }), 'no room left').toBe(false);
    expect(f.wheel({ deltaX: 10, deltaY: 2 })).toBe(true);
    expect(f.wheel({ deltaY: 2, deltaMode: 1 }), 'lines are px').toBe(true);
    expect(f.posted.at(-1)).toEqual({ bise: FRAME_KINDS.pan, dx: 0, dy: 32, w: 600 });
    f.message({ bise: FRAME_KINDS.room, room: null });
    expect(f.wheel({ deltaY: 30 }), 'back at fit').toBe(false);
  });

  it('takes the room only from its parent, and runs once per document', () => {
    const f = frame();
    f.message({ bise: FRAME_KINDS.room, room: { l: 9, r: 9, u: 9, d: 9 } }, { name: 'another page' });
    expect(f.wheel({ deltaY: 30 })).toBe(false);
    f.again();
    expect(f.wheel({ ctrlKey: true, deltaY: 1 })).toBe(true);
    expect(f.posted, 'one listener, one message').toHaveLength(1);
  });
});
