// @vitest-environment happy-dom
// held.ts: a modifier held alone arms its hints; release or any other key hides them.
import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HINT_HOLD_MS, heldStep, useHeld } from './held';

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
    expect(heldStep(null, k('keydown', 'Meta', { metaKey: true }))).toEqual({ arm: 'Meta' });
    expect(heldStep('Meta', k('keyup', 'Meta'))).toBe('hide');
    expect(heldStep('Meta', k('keydown', 'k', { metaKey: true }))).toBe('hide');
    expect(heldStep(null, k('keydown', 'Meta', { metaKey: true, shiftKey: true }))).toBe('hide');
    expect(heldStep(null, k('keydown', 'Meta', { metaKey: true, altKey: true }))).toBe('hide');
    expect(heldStep('Meta', k('keyup', 'k', { metaKey: true }))).toBe('none');
  });
  it('⌥ the same, ⌥⌘ is neither', () => {
    expect(heldStep(null, k('keydown', 'Alt', { altKey: true }))).toEqual({ arm: 'Alt' });
    expect(heldStep(null, k('keydown', 'Alt', { altKey: true, metaKey: true }))).toBe('hide');
    expect(heldStep('Alt', k('keydown', 'Meta', { altKey: true, metaKey: true }))).toBe('hide');
    expect(heldStep('Alt', k('keydown', '1', { altKey: true }))).toBe('hide');
    expect(heldStep('Alt', k('keyup', 'Alt'))).toBe('hide');
  });
  it('ctrl alone arms too (the TUI\'s ctrlhint.rs Held::Ctrl); ctrl+r, ctrl+⇧ hide', () => {
    expect(heldStep(null, k('keydown', 'Control', { ctrlKey: true }))).toEqual({ arm: 'Control' });
    expect(heldStep('Control', k('keydown', 'Control', { ctrlKey: true }))).toBe('none');
    expect(heldStep('Control', k('keydown', 'r', { ctrlKey: true }))).toBe('hide');
    expect(heldStep('Control', k('keydown', 'Shift', { ctrlKey: true, shiftKey: true }))).toBe('hide');
    expect(heldStep(null, k('keydown', 'Control', { ctrlKey: true, metaKey: true }))).toBe('hide');
    expect(heldStep('Control', k('keyup', 'Control'))).toBe('hide');
    expect(heldStep('Control', k('keyup', 'Alt'))).toBe('none');
  });
  it('shift alone is no hint', () => {
    expect(heldStep(null, k('keydown', 'Shift', { shiftKey: true }))).toBe('hide');
  });
});

describe('the window\'s one hold', () => {
  it('shows after HINT_HOLD_MS, hides on release, a click or another key', () => {
    vi.useFakeTimers();
    let seen: string | null = null;
    function Probe() {
      seen = useHeld();
      return null;
    }
    const v = render(<Probe />);
    const key = (type: string, key: string, ctrlKey: boolean) => {
      act(() => {
        window.dispatchEvent(new KeyboardEvent(type, { key, ctrlKey }));
      });
    };
    key('keydown', 'Control', true);
    act(() => {
      vi.advanceTimersByTime(HINT_HOLD_MS - 10);
    });
    expect(seen).toBeNull();
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(seen).toBe('Control');
    key('keyup', 'Control', false);
    expect(seen).toBeNull();
    key('keydown', 'Control', true);
    act(() => {
      vi.advanceTimersByTime(HINT_HOLD_MS);
    });
    expect(seen).toBe('Control');
    act(() => {
      window.dispatchEvent(new MouseEvent('mousedown'));
    });
    expect(seen).toBeNull();
    key('keyup', 'Control', false);
    key('keydown', 'Control', true);
    key('keydown', 'o', true);
    act(() => {
      vi.advanceTimersByTime(HINT_HOLD_MS * 2);
    });
    expect(seen, 'a ctrl+o never flashes them').toBeNull();
    v.unmount();
    vi.useRealTimers();
  });
});

describe('the hold delay (his ask main m_22199)', () => {
  it("is the terminal app's ctrl hint delay, 150 ms (rust/tui/src/ctrlhint.rs:43), for ⌘, ⌥ and ctrl alike", () => {
    expect(HINT_HOLD_MS).toBe(150);
  });
});
