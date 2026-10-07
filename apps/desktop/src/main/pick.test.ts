import { describe, expect, it } from 'vitest';
import { pickedInTest } from './pick';

describe('pickedInTest (BISE_DESKTOP_TEST_PICK_FOLDER)', () => {
  it('an absolute path is the pick; unset, empty or relative is a cancel', () => {
    expect(pickedInTest('/tmp/t/home/code/shop')).toBe('/tmp/t/home/code/shop');
    expect(pickedInTest(undefined)).toBeNull();
    expect(pickedInTest('')).toBeNull();
    expect(pickedInTest('code/shop')).toBeNull();
  });
});
