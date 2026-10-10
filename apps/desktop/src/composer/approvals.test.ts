import { describe, expect, it } from 'vitest';
import { flashWords } from './approvals';

describe('flashWords (keybar.rs flash_words)', () => {
  it('says the mode word, then its sentence', () => {
    expect(flashWords('yolo', 'jev', false)).toEqual({ word: 'yolo', rest: ' · everything runs, nothing asks' });
    expect(flashWords('auto', 'jev', false)).toEqual({ word: 'auto', rest: ' · safe calls run, risky ones ask you' });
    expect(flashWords('auto', 'off', false)).toEqual({ word: 'auto', rest: ' · edits run, commands ask you' });
  });
  it('an empty mode is yolo; the env one says it is for this session', () => {
    expect(flashWords('', 'off', true)).toEqual({ word: 'yolo', rest: ' · everything runs, nothing asks (this session only: BISE_APPROVALS)' });
  });
});
