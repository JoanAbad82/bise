import { describe, expect, it } from 'vitest';
import { idOf } from './id';

describe('idOf: a notification number typed in a search', () => {
  it('takes 567 and #567, nothing else', () => {
    expect(idOf('567')).toBe(567);
    expect(idOf(' #567 ')).toBe(567);
    expect(idOf('5 67')).toBeNull();
    expect(idOf('webp')).toBeNull();
    expect(idOf('#')).toBeNull();
  });
});
