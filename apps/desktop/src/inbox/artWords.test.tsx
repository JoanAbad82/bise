// @vitest-environment happy-dom
// inbox/artWords: an inbox line's artifact links cut out as names (desktop-agents-bar §5).
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ArtWords, artSplit } from './artWords';

afterEach(cleanup);

describe('artifact names in an inbox line', () => {
  it('cuts a line at its artifact links, words kept as written', () => {
    expect(artSplit('keep [the mock](artifact:mock@v3) or [Q3 plan](artifact:q3)?')).toEqual([
      { words: 'keep ' },
      { name: 'the mock', id: 'mock' },
      { words: ' or ' },
      { name: 'Q3 plan', id: 'q3' },
      { words: '?' },
    ]);
    expect(artSplit('no link, [a web one](https://x)')).toEqual([{ words: 'no link, [a web one](https://x)' }]);
    expect(artSplit('')).toEqual([{ words: '' }]);
  });
  it('a line with no artifact draws its words alone, no router needed', () => {
    const { container } = render(<ArtWords text="ship it?" project="p" testId="x" />);
    expect(container.textContent).toBe('ship it?');
    expect(container.querySelector('.b-artname')).toBeNull();
  });
});
