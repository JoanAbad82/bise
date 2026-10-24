// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { KEY_SECTIONS } from '@/settings/keys';
import { escOf, helpRows, otherPage, TOP } from './rows';
import { Help } from './Help';

const all = KEY_SECTIONS.flatMap((s) => s.rows.map((r) => r.keys));
const keysOf = (secs: ReturnType<typeof helpRows>) => secs.flatMap((s) => s.rows.map((r) => r.keys));

afterEach(cleanup);

describe('the key list (V3)', () => {
  it('every help key is a row of settings/keys.ts (a renamed key would vanish silently)', () => {
    for (const k of TOP) expect(all).toContain(k);
  });

  it('help shows the top keys, shortcuts every key, in the table order', () => {
    expect(keysOf(helpRows('help', ''))).toEqual(all.filter((k) => TOP.has(k)));
    expect(keysOf(helpRows('shortcuts', ''))).toEqual(all);
  });

  it('typing filters over section, keys, action and terminal key, case-insensitive; empty sections go', () => {
    const f = helpRows('shortcuts', 'ARTIFACTS');
    expect(keysOf(f)).toEqual(['⌘⇧A']);
    expect(f.map((s) => s.id)).toEqual(['window']);
    expect(keysOf(helpRows('shortcuts', 'the inbox')).length).toBeGreaterThan(5);
    expect(keysOf(helpRows('shortcuts', 'ctrl+x'))).toEqual(['⌘⌫']);
    expect(helpRows('help', 'zzz')).toEqual([]);
  });

  it('tab switches the page both ways; esc clears a filter, then closes', () => {
    expect(otherPage('help')).toBe('shortcuts');
    expect(otherPage('shortcuts')).toBe('help');
    expect(escOf('dic')).toBe('clear');
    expect(escOf('')).toBe('close');
  });

  it('the overlay: its field has the focus, typing filters, tab, esc clear then close', () => {
    const onClose = vi.fn();
    render(<Help onClose={onClose} />);
    const field = screen.getByTestId('help.field');
    expect(document.activeElement).toBe(field);
    const over = screen.getByTestId('help.overlay');
    expect(over.dataset.page).toBe('help');
    expect(screen.getAllByTestId('help.row').length).toBe(keysOf(helpRows('help', '')).length);
    fireEvent.keyDown(field, { key: 'Tab' });
    expect(over.dataset.page).toBe('shortcuts');
    expect(screen.getAllByTestId('help.row').length).toBe(all.length);
    fireEvent.change(field, { target: { value: 'dictation' } });
    expect(screen.getAllByTestId('help.row').map((r) => r.dataset.keys)).toEqual(['ctrl+r']);
    fireEvent.keyDown(field, { key: 'Escape' });
    expect((field as HTMLInputElement).value).toBe('');
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(field, { key: 'Escape' });
    // it fades out first (120 ms, as the ds sheet), then asks to close
    expect(over.classList.contains('out')).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.animationEnd(over);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('nothing matches: says so', () => {
    render(<Help onClose={() => undefined} page="shortcuts" />);
    fireEvent.change(screen.getByTestId('help.field'), { target: { value: 'qqq' } });
    expect(screen.queryAllByTestId('help.row')).toEqual([]);
    expect(screen.getByTestId('help.list').textContent).toContain('no key matches');
  });
});
