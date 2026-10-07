// W6/K18: the agents list's keys (↑↓ select, space previews in place, space again or esc
// closes, ⏎ opens) and the preview's last entries.
import { describe, expect, it } from 'vitest';
import { listKey } from './AgentsScreen';
import { lastOf, PEEK_ROWS } from './Peek';

const order = ['main', 'p99', 'alerts'];

describe('the agents list keys', () => {
  it('↑↓ move the selection inside the list, the first ↓ selects the first', () => {
    expect(listKey('ArrowDown', order, null, null)).toEqual({ sel: 'main', peek: null });
    expect(listKey('ArrowDown', order, 'main', null)?.sel).toBe('p99');
    expect(listKey('ArrowDown', order, 'alerts', null)?.sel).toBe('alerts');
    expect(listKey('ArrowUp', order, 'main', null)?.sel).toBe('main');
  });

  it('space previews the selected agent, space again closes; esc closes', () => {
    expect(listKey(' ', order, 'p99', null)).toEqual({ sel: 'p99', peek: 'p99' });
    expect(listKey(' ', order, 'p99', 'p99')).toEqual({ sel: 'p99', peek: null });
    expect(listKey(' ', order, 'alerts', 'p99')).toEqual({ sel: 'alerts', peek: 'alerts' });
    expect(listKey('Escape', order, 'p99', 'p99')).toEqual({ sel: 'p99', peek: null });
    expect(listKey('Escape', order, 'p99', null)).toBeNull();
  });

  it('nothing selected: space and ⏎ do nothing; ⏎ opens the selected one', () => {
    expect(listKey(' ', order, null, null)).toBeNull();
    expect(listKey('Enter', order, null, null)).toBeNull();
    expect(listKey('Enter', order, 'alerts', null)?.open).toBe('alerts');
    expect(listKey('x', order, 'alerts', null)).toBeNull();
  });

  it('the preview shows the last entries of the feed', () => {
    expect(lastOf([1, 2, 3])).toEqual([1, 2, 3]);
    const many = Array.from({ length: 20 }, (_, i) => i + 1);
    expect(lastOf(many)).toHaveLength(PEEK_ROWS);
    expect(lastOf(many).at(-1)).toBe(20);
  });
});
