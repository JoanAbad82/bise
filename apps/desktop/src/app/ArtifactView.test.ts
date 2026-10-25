import { describe, expect, it } from 'vitest';
import { artOf, isFrameEsc } from './ArtifactView';

describe("an artifact's route (its tab in the panel, the maker's thread in the centre)", () => {
  it("opens for a project's artifact by id, never for a list or every project's", () => {
    expect(artOf({ screen: 'artifacts', project: 'shop', id: 'page-1' })).toEqual({ project: 'shop', id: 'page-1' });
    expect(artOf({ screen: 'artifacts', project: 'shop' })).toBeUndefined();
    expect(artOf({ screen: 'artifacts', project: '', id: 'page-1' })).toBeUndefined();
    expect(artOf({ screen: 'bise' })).toBeUndefined();
  });
  it("reads the frame's forwarded esc, nothing else", () => {
    expect(isFrameEsc({ bise: 'esc' })).toBe(true);
    expect(isFrameEsc({ bise: 'note' })).toBe(false);
    expect(isFrameEsc('esc')).toBe(false);
    expect(isFrameEsc(null)).toBe(false);
  });
});

import { initialsOf } from './SideRail';

describe("the rail's project initials (designer m_20435 (f))", () => {
  it("two words: their first letters; one word: its first letter; capitals", () => {
    expect(initialsOf('storefront')).toBe('S');
    expect(initialsOf('gift-cards')).toBe('GC');
    expect(initialsOf('my shop app')).toBe('MS');
    expect(initialsOf('élan')).toBe('É');
    expect(initialsOf('')).toBe('');
  });
});
