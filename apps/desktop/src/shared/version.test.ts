import { describe, expect, it } from 'vitest';
import { shortVersion } from './version';

describe('shortVersion (designer m_25699)', () => {
  it('the version, not the tag', () => {
    expect(shortVersion('desktop-v2026.10.2')).toBe('2026.10.2');
    expect(shortVersion('v2026.10.2')).toBe('2026.10.2');
    expect(shortVersion('2026.10.2-26')).toBe('2026.10.2-26');
  });
  it("the app's VERSION id (desktop_feed.py app_id) reads the same: never 'desktop-2026.10.2'", () => {
    expect(shortVersion('desktop-2026.10.2')).toBe('2026.10.2');
    expect(shortVersion('desktop-dry-5f9a429951ab')).toBe('desktop-dry-5f9a429951ab');
  });
});
