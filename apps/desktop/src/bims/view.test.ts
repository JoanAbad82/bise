// view.ts: list | bims and 320 | wide, kept per window.
import { afterEach, describe, expect, it } from 'vitest';
import { keep } from '@/app/keep';
import { bimsView, viewOf } from './view';

afterEach(() => {
  bimsView.reset();
});

describe('the kept view', () => {
  it('the bims and 320 by default (r2-launcher #9: the map at Overview\'s top); anything odd kept is the default', () => {
    expect(viewOf(undefined, undefined)).toEqual({ view: 'bims', wide: false });
    expect(viewOf('grid', 'yes')).toEqual({ view: 'bims', wide: false });
    expect(viewOf('list', true)).toEqual({ view: 'list', wide: true });
  });
  it('a pick is kept per window and read back after a reload', () => {
    bimsView.setView('list');
    bimsView.setWide(true);
    expect(keep.view('frame.rb.agents.view')).toBe('list');
    expect(keep.view('frame.rb.agents.wide')).toBe(true);
    bimsView.reset();
    expect(bimsView.get()).toEqual({ view: 'list', wide: true });
    // back to the defaults: nothing kept
    bimsView.setView('bims');
    bimsView.setWide(false);
    expect(keep.view('frame.rb.agents.view')).toBeUndefined();
    expect(keep.view('frame.rb.agents.wide')).toBeUndefined();
  });
});
