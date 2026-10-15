// zen.ts: the TUI's zen while you type (rust/tui/src/zen.rs), its pure rules.
import { describe, expect, it } from 'vitest';
import { ZEN_HOLD_MS, ZEN_REST, zenActive, zenKey, zenStep, type KeyWhere, type ZenKey } from './zen';

const k = (key: string, m: Partial<Record<'altKey' | 'metaKey' | 'ctrlKey' | 'shiftKey', boolean>> = {}): ZenKey => ({ key, altKey: false, metaKey: false, ctrlKey: false, shiftKey: false, ...m });
const typed: KeyWhere = { composer: true, changed: true, popup: false };
const still: KeyWhere = { composer: true, changed: false, popup: false };

describe('zen enters, holds and leaves (zen.rs Zen::input)', () => {
  it('a typing key enters; it lasts ZEN_HOLD_MS (5 s) after the last one', () => {
    const s = zenStep(ZEN_REST, 'typing', 1000);
    expect(zenActive(s, 1000)).toBe(true);
    expect(zenActive(s, 1000 + ZEN_HOLD_MS - 1)).toBe(true);
    expect(zenActive(s, 1000 + ZEN_HOLD_MS)).toBe(false);
    expect(ZEN_HOLD_MS).toBe(5000);
  });
  it('a hold key keeps it going, never starts it', () => {
    expect(zenActive(zenStep(ZEN_REST, 'hold', 0), 0)).toBe(false);
    const s = zenStep(zenStep(ZEN_REST, 'typing', 0), 'hold', 4000);
    expect(zenActive(s, 8000)).toBe(true);
  });
  it('anything else leaves at once; typing again comes back', () => {
    const s = zenStep(zenStep(ZEN_REST, 'typing', 0), 'other', 100);
    expect(zenActive(s, 100)).toBe(false);
    expect(zenActive(zenStep(s, 'hold', 200), 200), 'a hold after a break is not zen').toBe(false);
    expect(zenActive(zenStep(s, 'typing', 300), 300)).toBe(true);
  });
  it('a neutral input changes nothing', () => {
    const s = zenStep(ZEN_REST, 'typing', 0);
    expect(zenStep(s, 'neutral', 10)).toBe(s);
  });
});

describe('what a key is for zen (zen.rs key_input, composer_key)', () => {
  it('a key that changes the composer types: a letter, backspace, ⇧⏎, an accent', () => {
    expect(zenKey(k('a'), typed)).toBe('typing');
    expect(zenKey(k('Backspace'), typed)).toBe('typing');
    expect(zenKey(k('Enter', { shiftKey: true }), typed)).toBe('typing');
    expect(zenKey(k('Enter', { altKey: true }), typed)).toBe('typing');
    expect(zenKey(k('Dead', { altKey: true }), still)).toBe('typing');
  });
  it('a move in the composer holds: arrows, home/end, their word forms, ⌘A', () => {
    expect(zenKey(k('ArrowLeft'), still)).toBe('hold');
    expect(zenKey(k('ArrowRight', { altKey: true }), still)).toBe('hold');
    expect(zenKey(k('End', { shiftKey: true }), still)).toBe('hold');
    expect(zenKey(k('a', { metaKey: true }), still)).toBe('hold');
  });
  it('⏎ send, esc, tab, page keys and app shortcuts leave', () => {
    expect(zenKey(k('Enter'), typed), '⏎ sends (BISE-128)').toBe('other');
    expect(zenKey(k('Escape'), still)).toBe('other');
    expect(zenKey(k('Tab'), typed)).toBe('other');
    expect(zenKey(k('PageUp'), still)).toBe('other');
    expect(zenKey(k('k', { metaKey: true }), still), '⌘K: the text unchanged').toBe('other');
    expect(zenKey(k('r', { ctrlKey: true }), still)).toBe('other');
  });
  it('a key outside a composer, or with a list open, leaves', () => {
    expect(zenKey(k('a'), { ...typed, composer: false })).toBe('other');
    expect(zenKey(k('/'), { ...typed, popup: true }), '/ opens the list: no zen').toBe('other');
  });
  it('a lone modifier or caps lock is nothing', () => {
    expect(zenKey(k('Meta', { metaKey: true }), still)).toBe('neutral');
    expect(zenKey(k('Control', { ctrlKey: true }), still)).toBe('neutral');
    expect(zenKey(k('CapsLock'), still)).toBe('neutral');
  });
});
