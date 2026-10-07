import { describe, expect, it } from 'vitest';
import { bundleOf, designated, leftovers, localFeed, readSwap, readVersion, startup, zipName } from './plan';

describe('readVersion (the app bundle VERSION)', () => {
  it('reads id and built; a dev build has no built; no id is no build', () => {
    expect(readVersion('id=d25\nbuilt=2026-10-07T10:00:00Z\ntarget=darwin-arm64\n')).toEqual({ id: 'd25', built: '2026-10-07T10:00:00Z' });
    expect(readVersion('id=dev\nrepo=/x\n')).toEqual({ id: 'dev' });
    expect(readVersion('built=2026\n')).toBeNull();
    expect(readVersion('')).toBeNull();
  });
});

describe('bundleOf', () => {
  it('the .app around its executable, else null (an unpacked run)', () => {
    expect(bundleOf('/Applications/bise.app/Contents/MacOS/bise')).toBe('/Applications/bise.app');
    expect(bundleOf('/Users/x/Apps/bise check.app/Contents/MacOS/bise check')).toBe('/Users/x/Apps/bise check.app');
    expect(bundleOf('/x/node_modules/electron/dist/Electron.app/Contents/Resources/x')).toBeNull();
  });
});

describe('designated (codesign -d -r-)', () => {
  it("reads the requirement; none means no update", () => {
    const out = 'Executable=/A/bise.app/Contents/MacOS/bise\ndesignated => identifier "dev.bise.desktop" and certificate leaf = H"ab12"\n';
    expect(designated(out)).toBe('identifier "dev.bise.desktop" and certificate leaf = H"ab12"');
    expect(designated('Executable=/x\n')).toBeNull();
    expect(designated('designated => \n')).toBeNull();
  });
});

describe('startup after a swap (.old kept until started ok)', () => {
  const rec = (attempts: number, ok: boolean) => ({ version: '2026.10.2-26', attempts, ok });
  it('no swap, a forgotten one, the first start, a confirmed one', () => {
    expect(startup(false, null)).toBe('none');
    expect(startup(false, rec(1, false))).toBe('forget');
    expect(startup(true, rec(0, false))).toBe('first');
    expect(startup(true, rec(1, true))).toBe('confirmed');
  });
  it('started before and never said ok, or no record: offer to go back', () => {
    expect(startup(true, rec(1, false))).toBe('went_bad');
    expect(startup(true, null)).toBe('went_bad');
  });
  it('a record reads back, junk is none', () => {
    expect(readSwap(JSON.stringify(rec(0, false)))).toEqual(rec(0, false));
    expect(readSwap('{"version":1}')).toBeNull();
    expect(readSwap('{')).toBeNull();
  });
});

describe('files and feeds', () => {
  it('a start cleans partial downloads and unpacked copies, keeps the rest', () => {
    expect(leftovers(['bise-1.zip.part', 'unpack-1', 'swap.json', 'bise-1.zip'])).toEqual(['bise-1.zip.part', 'unpack-1']);
  });
  it('a test run reads only a local feed', () => {
    expect(localFeed('file:///tmp/t/feed/app.zip')).toBe(true);
    expect(localFeed('http://127.0.0.1:4100/app.zip')).toBe(true);
    expect(localFeed('https://github.com/gvergnaud/bise/releases/latest/download/app.zip')).toBe(false);
    expect(localFeed('http://127.0.0.1.evil.com/app.zip')).toBe(false);
  });
  it('a version is a safe file name', () => {
    expect(zipName('2026.10.2-26')).toBe('bise-2026.10.2-26.zip');
    expect(zipName('../x y')).toBe('bise-.._x_y.zip');
  });
});
