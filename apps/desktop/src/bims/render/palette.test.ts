import { describe, expect, it } from 'vitest';
import { allColours, hash, outfitOf, rng } from './palette';
import { ATTENTION, reads } from './palette.testkit';

describe('palette', () => {
  it('reads the accent and error colours from tokens.css', () => {
    expect(ATTENTION.length).toBeGreaterThanOrEqual(4);
  });

  it('knows a pink or a red when it sees one', () => {
    expect(reads('#f0a0b0', '#f4a6b0')).toBe(true);
    expect(reads('#e63946', '#ff5a52')).toBe(true);
    expect(reads('#ef8354', '#ff5a52')).toBe(true); // the prototype's coral: too red
    expect(reads('#f3d5b5', '#f4a6b0')).toBe(false); // a skin tone
  });

  it('never draws the accent pink or the error red (spec §1 rule 2)', () => {
    for (const c of allColours()) {
      expect(c).toMatch(/^#[0-9a-f]{6}$/);
      for (const a of ATTENTION) expect(reads(c, a), `${c} reads as ${a}`).toBe(false);
    }
  });

  it('dresses a bim the same way every time, main in ink', () => {
    expect(outfitOf('signup-perf', false)).toEqual(outfitOf('signup-perf', false));
    expect(outfitOf('main', true).hoodie).toBe('#1d1a17');
    expect(outfitOf('main', true).hat).toBe('main');
    expect(hash('a')).not.toBe(hash('b'));
  });

  it('seeds the same sequence', () => {
    const a = rng(7);
    const b = rng(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});
