// His bim's look as the window knows it (page bim-pick): set from his prefs, heard once per change.
import { afterEach, describe, expect, it } from 'vitest';
import { myLook, onMyLook, setMyLook } from './mine';

afterEach(() => {
  setMyLook(undefined);
});

describe('my look', () => {
  it('follows his prefs and tells the listeners once per change', () => {
    let heard = 0;
    const stop = onMyLook(() => {
      heard++;
    });
    setMyLook({ skin: 2, hair: 'mohawk', color: 3, wear: 'none' });
    expect(myLook()).toEqual({ skin: 2, hair: 'mohawk', color: 3, wear: 'none' });
    setMyLook({ skin: 2, hair: 'mohawk', color: 3, wear: 'none' });
    expect(heard).toBe(1);
    setMyLook(undefined);
    expect(myLook()).toBeNull();
    expect(heard).toBe(2);
    stop();
    setMyLook({ skin: 0, hair: 'short', color: 0, wear: 'cap' });
    expect(heard).toBe(2);
  });
});
