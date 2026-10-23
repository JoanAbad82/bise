import { describe, expect, it } from 'vitest';
import { nextHit } from './find';

const lines = ['> vite --port 5173', '[vite] page reload Hero.tsx', '[vite] hmr update Gallery.tsx', '[vite] page reload hero.tsx'];

describe('find in an output', () => {
  it('the first match from the top, case-blind', () => {
    expect(nextHit(lines, 'HERO', null)).toEqual({ row: 1, col: 19, len: 4 });
  });

  it('each ⏎ the next one, then back to the top', () => {
    const a = nextHit(lines, 'hero', null);
    const b = nextHit(lines, 'hero', a);
    expect(b).toEqual({ row: 3, col: 19, len: 4 });
    expect(nextHit(lines, 'hero', b)).toEqual(a);
  });

  it('two on one line: the second after the first', () => {
    expect(nextHit(['vite vite'], 'vite', { row: 0, col: 0, len: 4 })).toEqual({ row: 0, col: 5, len: 4 });
  });

  it('nothing typed or nothing there: none', () => {
    expect(nextHit(lines, '', null)).toBeNull();
    expect(nextHit(lines, 'webpack', null)).toBeNull();
  });
});
