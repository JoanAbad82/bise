// The spring-loaded project row's timeline (designer m_47386): time is an input.
import { describe, expect, it } from 'vitest';
import { BLINK_MS, isFileDrag, springStep, type Spring, type SpringCfg, type SpringEv } from './spring';
import { springingOf, SPRING_DEFAULT_MS } from '@/shared/springing';

const CFG: SpringCfg = { here: false, springing: { on: true, delayMs: 500 }, reduceMotion: false };

/** Runs the events from no drag; the phase after each, and when the project opened. */
function run(evs: SpringEv[], cfg: SpringCfg = CFG): { phases: (string | null)[]; opened: number[] } {
  let s: Spring = null;
  const phases: (string | null)[] = [];
  const opened: number[] = [];
  evs.forEach((ev, i) => {
    const r = springStep(s, ev, cfg);
    s = r.s;
    phases.push(s?.phase ?? null);
    if (r.open) opened.push(i);
  });
  return { phases, opened };
}

describe('springStep', () => {
  it('lights on enter, blinks at the delay, opens after the two blinks', () => {
    const r = run([{ e: 'enter', now: 0 }, { e: 'tick', now: 499 }, { e: 'tick', now: 500 }, { e: 'tick', now: 500 + BLINK_MS - 1 }, { e: 'tick', now: 500 + BLINK_MS }]);
    expect(r.phases).toEqual(['hold', 'hold', 'blink', 'blink', null]);
    expect(r.opened).toEqual([4]);
  });

  it('a dragover again does not restart the delay', () => {
    const r = run([{ e: 'enter', now: 0 }, { e: 'enter', now: 300 }, { e: 'tick', now: 500 }]);
    expect(r.phases).toEqual(['hold', 'hold', 'blink']);
  });

  it('leaving the row cancels; coming back starts again', () => {
    const r = run([{ e: 'enter', now: 0 }, { e: 'leave' }, { e: 'tick', now: 600 }, { e: 'enter', now: 700 }, { e: 'tick', now: 1100 }]);
    expect(r.phases).toEqual(['hold', null, null, 'hold', 'hold']);
    expect(r.opened).toEqual([]);
  });

  it('Esc cancels: it never springs until he leaves, then a new enter starts again', () => {
    const r = run([{ e: 'enter', now: 0 }, { e: 'esc' }, { e: 'enter', now: 100 }, { e: 'tick', now: 2000 }, { e: 'space', now: 2100 }, { e: 'leave' }, { e: 'enter', now: 2200 }]);
    expect(r.phases).toEqual(['hold', 'stop', 'stop', 'stop', 'stop', null, 'hold']);
    expect(r.opened).toEqual([]);
  });

  it('space springs at once, as in the Finder', () => {
    const r = run([{ e: 'enter', now: 0 }, { e: 'space', now: 100 }, { e: 'tick', now: 100 + BLINK_MS }]);
    expect(r.phases).toEqual(['hold', 'blink', null]);
    expect(r.opened).toEqual([2]);
  });

  it('the project in view never springs', () => {
    const r = run([{ e: 'enter', now: 0 }, { e: 'tick', now: 5000 }], { ...CFG, here: true });
    expect(r.phases).toEqual([null, null]);
    expect(r.opened).toEqual([]);
  });

  it("spring-loading off in macOS: lit, never opens", () => {
    const r = run([{ e: 'enter', now: 0 }, { e: 'tick', now: 10_000 }], { ...CFG, springing: { on: false, delayMs: 500 } });
    expect(r.phases).toEqual(['lit', 'lit']);
    expect(r.opened).toEqual([]);
  });

  it('reduce motion: no blink, it opens at the delay', () => {
    const r = run([{ e: 'enter', now: 0 }, { e: 'tick', now: 500 }], { ...CFG, reduceMotion: true });
    expect(r.phases).toEqual(['hold', null]);
    expect(r.opened).toEqual([1]);
  });

  it("follows his Mac's delay", () => {
    const r = run([{ e: 'enter', now: 0 }, { e: 'tick', now: 500 }, { e: 'tick', now: 1200 }], { ...CFG, springing: { on: true, delayMs: 1200 } });
    expect(r.phases).toEqual(['hold', 'hold', 'blink']);
  });
});

describe('isFileDrag', () => {
  it("a file or an image from the Finder springs; text or bise's own cards do not", () => {
    expect(isFileDrag(['Files'])).toBe(true);
    expect(isFileDrag(['text/plain'])).toBe(false);
    expect(isFileDrag(['application/x-bise-artifacts'])).toBe(false);
  });
});

describe('springingOf', () => {
  it("macOS's two defaults: unset is on at 0.5 s; set, his", () => {
    expect(springingOf('', '')).toEqual({ on: true, delayMs: SPRING_DEFAULT_MS });
    expect(springingOf('1', '0.5')).toEqual({ on: true, delayMs: 500 });
    expect(springingOf('0', '1.25')).toEqual({ on: false, delayMs: 1250 });
    expect(springingOf('1', '0')).toEqual({ on: true, delayMs: 0 });
  });
});
