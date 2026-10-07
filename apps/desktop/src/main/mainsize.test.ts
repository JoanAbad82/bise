import { describe, expect, it } from 'vitest';
import { MAIN_SIZE } from './mainsize';

describe('MAIN_SIZE (the main window)', () => {
  it('its narrowest fits the sidebar, one 380 px column and margins; it opens wider', () => {
    expect(MAIN_SIZE.minWidth).toBe(680);
    expect(MAIN_SIZE.minWidth).toBeGreaterThanOrEqual(264 + 380);
    expect(MAIN_SIZE.width).toBeGreaterThanOrEqual(MAIN_SIZE.minWidth);
  });
});
