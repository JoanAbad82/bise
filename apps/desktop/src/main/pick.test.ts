import { describe, expect, it } from 'vitest';
import { pickedFilesInTest, pickedInTest } from './pick';

describe('pickedInTest (BISE_DESKTOP_TEST_PICK_FOLDER)', () => {
  it('an absolute path is the pick; unset, empty or relative is a cancel', () => {
    expect(pickedInTest('/tmp/t/home/code/shop')).toBe('/tmp/t/home/code/shop');
    expect(pickedInTest(undefined)).toBeNull();
    expect(pickedInTest('')).toBeNull();
    expect(pickedInTest('code/shop')).toBeNull();
  });
});

describe('pickedFilesInTest (BISE_DESKTOP_TEST_PICK_FILES)', () => {
  it('absolute paths, one per line, are the pick; unset or empty is a cancel; a relative line is left out', () => {
    expect(pickedFilesInTest('/t/home/a.pdf\n/t/home/b.png\n')).toEqual(['/t/home/a.pdf', '/t/home/b.png']);
    expect(pickedFilesInTest(undefined)).toEqual([]);
    expect(pickedFilesInTest('')).toEqual([]);
    expect(pickedFilesInTest('rel/a.pdf\n/t/b.pdf')).toEqual(['/t/b.pdf']);
  });
});
