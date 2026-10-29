// The one status pill's pick (designer's desktop-notices page v2, m_21067): the worst wins, the rest wait.
import { describe, expect, it } from 'vitest';
import { RANK, worst, type StatusPart } from './status';

describe('the one status pill', () => {
  it('core down > failed > update > reload > done; the first of equals; none shows nothing', () => {
    const p = (rank: number, testId: string): StatusPart => ({ rank, testId, tone: 'quiet', words: testId, short: testId });
    expect(worst([])).toBeNull();
    expect(worst([null, null])).toBeNull();
    // the callers' order puts the update before the reload: an update ready wins a reload running
    expect(worst([p(RANK.ready, 'update'), p(RANK.running, 'reloading'), null])?.testId).toBe('update');
    expect(worst([p(RANK.done, 'reloaded'), p(RANK.running, 'reloading')])?.testId).toBe('reloading');
    expect(worst([p(RANK.ready, 'update'), p(RANK.failed, 'reload failed')])?.testId).toBe('reload failed');
    expect(worst([p(RANK.running, 'build'), p(RANK.failed, 'went bad'), p(RANK.down, 'core down')])?.testId).toBe('core down');
    expect(worst([p(RANK.failed, 'first'), p(RANK.failed, 'second')])?.testId).toBe('first');
    expect(worst([p(RANK.done, 'back'), p(RANK.ready, 'ready')])?.testId).toBe('ready');
  });
});
