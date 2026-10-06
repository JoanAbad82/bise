import { describe, expect, it } from 'vitest';
import { glassOf } from './glass';

describe('glassOf', () => {
  it('the capsule is real glass on macOS: vibrancy that stays on while bise is not the active app, a clear background, macOS shadow and corners', () => {
    expect(glassOf('capsule', 'darwin', false)).toEqual({
      vibrancy: 'popover',
      visualEffectState: 'active',
      backgroundColor: '#00000000',
      transparent: false,
      hasShadow: true,
      roundedCorners: true,
    });
  });

  it('the main window: vibrancy under the page, following the window', () => {
    expect(glassOf('window', 'darwin', false)).toEqual({ vibrancy: 'under-window', visualEffectState: 'followWindow', backgroundColor: '#00000000' });
  });

  it('test mode and other systems: no glass', () => {
    expect(glassOf('capsule', 'darwin', true)).toEqual({});
    expect(glassOf('window', 'darwin', true)).toEqual({});
    expect(glassOf('capsule', 'win32', false)).toEqual({});
    expect(glassOf('window', 'linux', false)).toEqual({});
  });
});
