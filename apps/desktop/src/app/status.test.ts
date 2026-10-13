// The one status line's pick (designer's desktop-notices page (1)): the worst wins, the rest wait.
import { describe, expect, it } from 'vitest';
import { RANK, worst } from './status';

describe('the one status line', () => {
  it('down > failed > in progress > ready or done; the first of equals; none shows nothing', () => {
    const p = (rank: number, node: string) => ({ rank, node });
    expect(worst([])).toBeNull();
    expect(worst([null, null])).toBeNull();
    expect(worst([p(RANK.ready, 'ready'), p(RANK.running, 'reloading'), null])?.node).toBe('reloading');
    expect(worst([p(RANK.running, 'build'), p(RANK.failed, 'went bad'), p(RANK.down, 'core down')])?.node).toBe('core down');
    expect(worst([p(RANK.failed, 'first'), p(RANK.failed, 'second')])?.node).toBe('first');
    expect(worst([p(RANK.done, 'back'), p(RANK.ready, 'ready')])?.node).toBe('back');
  });
});
