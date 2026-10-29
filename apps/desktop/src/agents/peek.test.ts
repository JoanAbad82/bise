// W6/K18: the agents list's keys (↑↓ select, space previews in place, space again or esc
// closes, ⏎ opens) and the preview's last entries.
import { describe, expect, it } from 'vitest';
import { peekKey } from './AgentsScreen';

describe('the agents list keys (the moves and ⏎ are app/listkeys.ts\'s)', () => {
  it('space previews the selected agent, space again closes; esc closes', () => {
    expect(peekKey(' ', 'p99', null)).toEqual({ peek: 'p99' });
    expect(peekKey(' ', 'p99', 'p99')).toEqual({ peek: null });
    expect(peekKey(' ', 'alerts', 'p99')).toEqual({ peek: 'alerts' });
    expect(peekKey('Escape', 'p99', 'p99')).toEqual({ peek: null });
    expect(peekKey('Escape', 'p99', null)).toBeNull();
  });

  it('nothing selected: space does nothing; other keys are not its', () => {
    expect(peekKey(' ', null, null)).toBeNull();
    expect(peekKey('x', 'alerts', null)).toBeNull();
    expect(peekKey('ArrowDown', 'alerts', null)).toBeNull();
  });
});
