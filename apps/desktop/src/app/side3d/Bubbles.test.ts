// The coin's bottom pill (bims-plugins r3, designer m_44986): the count whole, the agents' shown at
// 0, the key in its place while ⌥ is held.
import { describe, expect, it } from 'vitest';
import { pillOf } from './Bubbles';

describe('pillOf', () => {
  it('the count whole, 3 digits too; none at 0', () => {
    expect(pillOf('artifacts', { n: 589, always: false }, undefined)).toEqual({ text: '589', key: false, zero: false });
    expect(pillOf('artifacts', { n: 0, always: false }, undefined)).toBeNull();
  });

  it('the agents\' active count: shown at 0 (text-3), 99+ past 99 (designer m_44986)', () => {
    expect(pillOf('agents', { n: 0, always: true }, undefined)).toEqual({ text: '0', key: false, zero: true });
    expect(pillOf('agents', { n: 128, always: true }, undefined)).toEqual({ text: '99+', key: false, zero: false });
  });

  it('⌥ held: the key in the count\'s place, shown at 0 too; no count, no pill', () => {
    expect(pillOf('agents', { n: 2, always: true }, '⌥1')).toEqual({ text: '⌥1', key: true, zero: false });
    expect(pillOf('processes', { n: 0, always: false }, '⌥4')).toEqual({ text: '⌥4', key: true, zero: false });
    expect(pillOf('processes', null, undefined)).toBeNull();
  });
});
