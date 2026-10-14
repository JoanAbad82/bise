import { describe, expect, it } from 'vitest';
import { wholeWords } from './FitWords';

const w = (s: string) => s.length * 7;

describe('wholeWords (desktop-agents-bar §2, designer m_23711)', () => {
  it('the whole text when it fits', () => {
    expect(wholeWords('price rules', 200, w)).toBe('price rules');
  });
  it('cut after a whole word with one …, never mid-word', () => {
    expect(wholeWords('import the catalog', 80, w)).toBe('import the…');
    expect(wholeWords('import the catalog', 60, w)).toBe('import…');
  });
  it('not even one whole word fits: nothing', () => {
    expect(wholeWords('proofreading', 40, w)).toBe('');
  });
});
