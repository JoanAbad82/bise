// update-flow (designer m_45087), update-dot (m_46058): a newer bise is an inbox card; the pill says it runs.
import { describe, expect, it } from 'vitest';
import type { BiseUpdate } from '@/proto';
import { biseUpdateLine } from './UpdateLine';

const u = (over: Partial<BiseUpdate>): BiseUpdate => ({ id: 'r3', version: 'v2026.10.3', running: 'v2026.10.2', state: 'ready', ...over });

describe('the bise update line', () => {
  it('ready: nothing in the pill, the inbox card asks (update-dot, designer m_46058)', () => {
    expect(biseUpdateLine(u({ notes: ['a'] }), null)).toBeNull();
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
