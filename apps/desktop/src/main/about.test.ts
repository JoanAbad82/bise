import { describe, expect, it } from 'vitest';
import { aboutPanel } from './about';

describe("aboutPanel (the macOS About panel: his app's name, its real build)", () => {
  it('the name everywhere (a try build: its own)', () => {
    expect(aboutPanel('bise', 'desktop-v2026.10.1', null)).toMatchObject({ applicationName: 'bise', applicationVersion: '2026.10.1' });
    expect(aboutPanel('bise try', '2026.10.1-3', null)).toMatchObject({ applicationName: 'bise try', applicationVersion: '2026.10.1-3' });
  });
  it('the version as he reads it elsewhere (shortVersion, designer m_25699): the version, not the tag', () => {
    expect(aboutPanel('bise', 'v2026.10.2', null)).toMatchObject({ applicationName: 'bise', applicationVersion: '2026.10.2' });
    expect(aboutPanel('bise', 'desktop-2026.10.1', null)).toMatchObject({ applicationName: 'bise', applicationVersion: 'desktop-2026.10.1' });
  });
  it("a packed app sets the build in parentheses too, never the bundle's 0.0.0: its commit, else its version", () => {
    expect(aboutPanel('bise', 'desktop-v2026.10.2', '5f9a429951ab0c1d2e3f4a5b6c7d8e9f00112233')).toEqual({
      applicationName: 'bise',
      applicationVersion: '2026.10.2',
      version: '5f9a429951ab',
    });
    expect(aboutPanel('bise', 'desktop-v2026.10.2', null)).toEqual({ applicationName: 'bise', applicationVersion: '2026.10.2', version: '2026.10.2' });
  });
  it("a dev run (no VERSION) sets only the name: the panel says the running Electron.app's own version", () => {
    expect(aboutPanel('bise', null, null)).toEqual({ applicationName: 'bise' });
  });
});
