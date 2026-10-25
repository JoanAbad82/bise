import { expect, it } from 'vitest';
import { dropIndex, movedTo, shortPath } from './projectRows';

const HOME = '/Users/camille';

it('says the folder short: ~ for home, the middle cut past 40, never a folder name cut', () => {
  expect(shortPath('/Users/camille/acme', HOME)).toBe('~/acme');
  expect(shortPath('/opt/acme', HOME)).toBe('/opt/acme');
  expect(shortPath('/Users/camille/lab/bend-lab/very-long-folder-name/harness', HOME)).toBe('~/lab/…/harness');
  expect(shortPath('/Users/camille/a-really-long-single-folder-name-over-forty', HOME)).toBe('~/a-really-long-single-folder-name-over-forty');
  expect(shortPath('/Users/camilleother/acme', HOME)).toBe('/Users/camilleother/acme');
});

it('drops a dragged row before the first middle it is above', () => {
  const mids = [16, 48, 80];
  expect(dropIndex(mids, 0)).toBe(0);
  expect(dropIndex(mids, 30)).toBe(1);
  expect(dropIndex(mids, 70)).toBe(2);
  expect(dropIndex(mids, 200)).toBe(3);
});

it('tells the core the 1-based place after a drop, nothing when it stays', () => {
  expect(movedTo(0, 0)).toBeNull();
  expect(movedTo(0, 1)).toBeNull();
  expect(movedTo(0, 2)).toBe(2);
  expect(movedTo(0, 3)).toBe(3);
  expect(movedTo(2, 0)).toBe(1);
  expect(movedTo(2, 3)).toBeNull();
});
