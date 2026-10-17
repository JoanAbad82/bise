// view.ts: list | bims and 320 | wide, kept per window; the column the frame gives the bar.
import { afterEach, describe, expect, it } from 'vitest';
import { keep } from '@/app/keep';
import { MAIN_MIN } from '@/app/resize';
import { bimsView, panelColumn, showsWide, viewOf, WIDE_PX, wideMode } from './view';

afterEach(() => {
  bimsView.reset();
});

describe('the kept view', () => {
  it('the list and 320 by default; anything odd kept is the default', () => {
    expect(viewOf(undefined, undefined)).toEqual({ view: 'list', wide: false });
    expect(viewOf('grid', 'yes')).toEqual({ view: 'list', wide: false });
    expect(viewOf('bims', true)).toEqual({ view: 'bims', wide: true });
  });
  it('a pick is kept per window and read back after a reload', () => {
    bimsView.setView('bims');
    bimsView.setWide(true);
    expect(keep.view('frame.rb.agents.view')).toBe('bims');
    expect(keep.view('frame.rb.agents.wide')).toBe(true);
    bimsView.reset();
    expect(bimsView.get()).toEqual({ view: 'bims', wide: true });
    // back to the defaults: nothing kept
    bimsView.setView('list');
    bimsView.setWide(false);
    expect(keep.view('frame.rb.agents.view')).toBeUndefined();
    expect(keep.view('frame.rb.agents.wide')).toBeUndefined();
  });
  it('wide only with the office on, on a project (bise thread keeps the list)', () => {
    expect(showsWide({ view: 'bims', wide: true }, 'p1')).toBe(true);
    expect(showsWide({ view: 'list', wide: true }, 'p1')).toBe(false);
    expect(showsWide({ view: 'bims', wide: false }, 'p1')).toBe(false);
    expect(showsWide({ view: 'bims', wide: true }, ''), "bise's thread: the town wide").toBe(true);
    expect(showsWide({ view: 'bims', wide: true }, undefined)).toBe(false);
  });
});

describe("the bar's column", () => {
  it('his width when not wide', () => {
    expect(panelColumn(320, false, 2000, 240)).toBe(320);
    expect(panelColumn(480, false, 2000, 240)).toBe(480);
  });
  it('640 docked when the window has room for it and the thread', () => {
    const room = 240 + WIDE_PX + MAIN_MIN;
    expect(panelColumn(320, true, room, 240)).toBe(WIDE_PX);
    expect(panelColumn(320, true, 1600, 0)).toBe(WIDE_PX);
  });
  it('short of room: his width, the bar slides over the thread (css)', () => {
    expect(panelColumn(320, true, 240 + WIDE_PX + MAIN_MIN - 1, 240)).toBe(320);
  });
  it('a bar already wider than 640 stays as he made it', () => {
    expect(panelColumn(700, true, 1000, 240)).toBe(700);
  });
});

describe("the wide bar's place (app.panel data-wide)", () => {
  it('docked in a 640 column, over the thread otherwise', () => {
    expect(wideMode(false, WIDE_PX)).toBe('docked');
    expect(wideMode(false, 320)).toBe('over');
    expect(wideMode(true, WIDE_PX)).toBe('over');
    expect(wideMode(false, undefined)).toBe('over');
  });
});
