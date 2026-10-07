import { describe, expect, it } from 'vitest';
import { MAIN_SIZE } from './mainsize';

describe('MAIN_SIZE (the main window)', () => {
  it('its narrowest is one 420 px column (the sidebar folds below 640); it opens wider', () => {
    expect(MAIN_SIZE.minWidth).toBe(420);
    expect(MAIN_SIZE.minWidth).toBeLessThan(640);
    expect(MAIN_SIZE.width).toBeGreaterThanOrEqual(640);
  });
});
