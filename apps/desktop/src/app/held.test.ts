// held.ts: a modifier held alone arms its hints; release or any other key hides them.
import { describe, expect, it } from 'vitest';
import { HINT_HOLD_MS, heldStep } from './held';

const k = (type: string, key: string, m: Partial<Record<'altKey' | 'metaKey' | 'ctrlKey' | 'shiftKey', boolean>> = {}) => ({
  type,
  key,
  altKey: false,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  ...m,
});

describe('a modifier held alone', () => {
  it('⌘ alone arms, its release or any other key hides', () => {
    expect(heldStep('Meta', k('keydown', 'Meta', { metaKey: true }))).toBe('arm');
    expect(heldStep('Meta', k('keyup', 'Meta'))).toBe('hide');
    expect(heldStep('Meta', k('keydown', 'k', { metaKey: true }))).toBe('hide');
    expect(heldStep('Meta', k('keydown', 'Meta', { metaKey: true, shiftKey: true }))).toBe('hide');
    expect(heldStep('Meta', k('keydown', 'Meta', { metaKey: true, altKey: true }))).toBe('hide');
    expect(heldStep('Meta', k('keyup', 'k', { metaKey: true }))).toBe('none');
  });
  it('⌥ the same, ⌥⌘ is neither', () => {
    expect(heldStep('Alt', k('keydown', 'Alt', { altKey: true }))).toBe('arm');
    expect(heldStep('Alt', k('keydown', 'Alt', { altKey: true, metaKey: true }))).toBe('hide');
    expect(heldStep('Alt', k('keydown', '1', { altKey: true }))).toBe('hide');
    expect(heldStep('Alt', k('keyup', 'Alt'))).toBe('hide');
  });
});

describe('the hold delay (his ask main m_22199)', () => {
  it("is the terminal app's ctrl hint delay, 150 ms (rust/tui/src/ctrlhint.rs:43), for ⌘, ⌥ and ctrl alike", () => {
    expect(HINT_HOLD_MS).toBe(150);
  });
});
