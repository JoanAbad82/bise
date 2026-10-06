import { describe, expect, it } from 'vitest';
import { binPath, type Where } from './paths';

const app = '/Applications/bise.app/Contents/Resources';
const repo = '/Users/u/w/bise';

function where(over: Partial<Where>, files: string[] = []): Where {
  return {
    env: {},
    packaged: false,
    resourcesPath: app,
    appPath: `${repo}/apps/desktop`,
    exists: (p) => files.includes(p),
    ...over,
  };
}

describe('binPath', () => {
  it('packaged: the bise inside the app, whatever the env says', () => {
    const shipped = `${app}/bin/bise`;
    expect(binPath(where({ packaged: true, env: { BISE_DESKTOP_BISE: '/tmp/other/bise' } }, [shipped]))).toBe(shipped);
  });

  it('packaged without its bise: none (never PATH)', () => {
    expect(binPath(where({ packaged: true }))).toBeNull();
  });

  it('dev: BISE_DESKTOP_BISE first, only as a path', () => {
    expect(binPath(where({ env: { BISE_DESKTOP_BISE: '/opt/b/bise' } }))).toBe('/opt/b/bise');
    expect(binPath(where({ env: { BISE_DESKTOP_BISE: 'bise' } }))).toBeNull();
  });

  it("dev: else the repo's release build, then its debug build", () => {
    const rel = `${repo}/rust/target/release/bise`;
    const dbg = `${repo}/rust/target/debug/bise`;
    expect(binPath(where({}, [rel, dbg]))).toBe(rel);
    expect(binPath(where({}, [dbg]))).toBe(dbg);
    expect(binPath(where({}))).toBeNull();
  });
});
