// The coin's pill (bims-plugins r3): the count whole, the key in its place while ⌥ is held, the
// accent only on what waits on him.
import { describe, expect, it } from 'vitest';
import { pillOf } from './Bubbles';

describe('pillOf', () => {
  it('the count whole, 3 digits too; none at 0', () => {
    expect(pillOf({ n: 589, accent: false }, undefined)).toEqual({ text: '589', accent: false, key: false });
    expect(pillOf({ n: 0, accent: false }, undefined)).toBeNull();
  });

  it('⌥ held: the key in the count\'s place, the asking one stays the accent, shown at 0 too', () => {
    expect(pillOf({ n: 2, accent: true }, '⌥1')).toEqual({ text: '⌥1', accent: true, key: true });
    expect(pillOf({ n: 0, accent: false }, '⌥4')).toEqual({ text: '⌥4', accent: false, key: true });
  });
});
