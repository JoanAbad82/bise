// view.ts: list | bims and 320 | wide, kept per window.
import { afterEach, describe, expect, it } from 'vitest';
import { keep } from '@/app/keep';
import { bimsView, viewOf } from './view';

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
});
