// S.6: the window's update line says only what he can act on.
import { describe, expect, it } from 'vitest';
import { shortVersion, updateLine } from './UpdateLine';

describe('the update line', () => {
  it('ready: restart; went bad: go back; downloading, failed, none: nothing', () => {
    expect(updateLine({ state: 'ready', version: '2026.10.2-26' })).toEqual({ text: 'bise 2026.10.2-26 is ready', act: 'restart' });
    expect(updateLine({ state: 'went_bad', version: '2026.10.2-26' })).toEqual({ text: "the new bise didn't start right", act: 'go back' });
    expect(updateLine({ state: 'downloading', version: '2026.10.2-26' })).toBeNull();
    expect(updateLine({ state: 'failed', version: '2026.10.2-26', why: 'signature' })).toBeNull();
    expect(updateLine({ state: 'none' })).toBeNull();
  });
});

describe('shortVersion (designer m_25699)', () => {
  it('the version, not the tag', () => {
    expect(shortVersion('desktop-v2026.10.2')).toBe('2026.10.2');
    expect(shortVersion('v2026.10.2')).toBe('2026.10.2');
    expect(shortVersion('2026.10.2-26')).toBe('2026.10.2-26');
    expect(shortVersion('desktop-2026.10.1')).toBe('desktop-2026.10.1');
  });
});
