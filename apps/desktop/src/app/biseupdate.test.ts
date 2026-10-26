// update-flow (Gabriel's pick A, designer m_45087): a newer bise is the status pill's, never a card.
import { describe, expect, it } from 'vitest';
import type { BiseUpdate } from '@/proto';
import { biseUpdateLine } from './UpdateLine';

const u = (over: Partial<BiseUpdate>): BiseUpdate => ({ id: 'r3', version: 'v2026.10.3', running: 'v2026.10.2', state: 'ready', ...over });

describe('the bise update line', () => {
  it('ready: quiet words, `update`, the tip, at most 3 notes, then where the rest is', () => {
    const l = biseUpdateLine(u({ notes: ['a', 'b', 'c', 'd'] }), null);
    expect(l?.tone).toBe('quiet');
    expect(l?.words).toBe('bise v2026.10.3 is ready');
    expect(l?.act).toBe('update');
    expect(l?.lines).toEqual(['your agents keep working, your drafts stay, and the window reopens where you are.', 'a', 'b', 'c', 'all notes in Settings › update']);
  });
  it('installing and updating run, with no action; the projects left are named', () => {
    for (const state of ['installing', 'updating'] as const) {
      const l = biseUpdateLine(u({ state, waiting: ['shop', 'web'] }), null);
      expect(l?.tone).toBe('running');
      expect(l?.act).toBeNull();
      expect(l?.words).toBe('updating to v2026.10.3… your agents keep working');
      expect(l?.lines).toEqual(['shop, web', '2 to go']);
    }
  });
  it('failed: ▲ in the error tone, try again, and nothing changed', () => {
    const l = biseUpdateLine(u({ state: 'failed', why: 'the download failed' }), null);
    expect(l?.tone).toBe('err');
    expect(l?.words).toBe("▲ couldn't update to v2026.10.3");
    expect(l?.act).toBe('try again');
    expect(l?.lines).toEqual(['the download failed', "you're still on v2026.10.2. nothing changed."]);
  });
  it('gone after updating: ✓ updated, then nothing', () => {
    expect(biseUpdateLine(null, 'v2026.10.3')?.words).toBe('✓ updated to v2026.10.3');
    expect(biseUpdateLine(null, null)).toBeNull();
    expect(biseUpdateLine(u({ state: 'unknown' }), null)).toBeNull();
  });
});
