import { describe, expect, it } from 'vitest';
import { Batcher, clampSize, decodePtyEv, encodePtyCmd, evictee, folderOf, ptyBin } from './lines';

describe('pty lines', () => {
  it('decodes known events, drops the rest', () => {
    expect(decodePtyEv('{"ev":"data","data":"bHMNCg=="}')).toEqual({ ev: 'data', data: 'bHMNCg==' });
    expect(decodePtyEv('{"ev":"exit"}')).toEqual({ ev: 'exit' });
    for (const l of ['nope', '[]', '{"data":"x"}', '{"ev":"pulse"}']) expect(decodePtyEv(l)).toBeNull();
  });
  it('encodes one command a line', () => {
    expect(encodePtyCmd({ cmd: 'resize', cols: 120, rows: 30 })).toBe('{"cmd":"resize","cols":120,"rows":30}\n');
    expect(encodePtyCmd({ cmd: 'attach' })).toBe('{"cmd":"attach"}\n');
  });
});

describe('folderOf', () => {
  const rows = [{ project: 'shop-1a2b', path: '/w/shop' }, { project: 'rel', path: 'w/rel' }, null, 3];
  it("the project's row's absolute path, never anything else", () => {
    expect(folderOf('shop-1a2b', rows)).toBe('/w/shop');
    expect(folderOf('rel', rows)).toBeNull();
    expect(folderOf('other', rows)).toBeNull();
    expect(folderOf('', rows)).toBeNull();
    expect(folderOf(42, rows)).toBeNull();
    expect(folderOf('/etc', rows)).toBeNull();
  });
});

describe('clampSize', () => {
  it('whole cells, 2..500 × 1..200; junk refused', () => {
    expect(clampSize(80.7, 24.2)).toEqual({ cols: 80, rows: 24 });
    expect(clampSize(0, 0)).toEqual({ cols: 2, rows: 1 });
    expect(clampSize(9999, 9999)).toEqual({ cols: 500, rows: 200 });
    expect(clampSize('80', 24)).toBeNull();
    expect(clampSize(Number.NaN, 24)).toBeNull();
  });
});

describe('evictee', () => {
  it('none while there is room, else the least recently used', () => {
    expect(evictee(new Map([['a', 1]]), 2)).toBeNull();
    expect(
      evictee(
        new Map([
          ['a', 5],
          ['b', 2],
          ['c', 9],
        ]),
        3,
      ),
    ).toBe('b');
  });
});

describe('Batcher', () => {
  it('one send per shell per frame, in order; flush sends at once', () => {
    const sent: [string, number[]][] = [];
    let tick: (() => void) | null = null;
    const b = new Batcher(
      (id, bytes) => sent.push([id, [...bytes]]),
      16,
      (fn) => {
        tick = fn;
        return 0 as unknown as ReturnType<typeof setTimeout>;
      },
    );
    b.push('a', new Uint8Array([1, 2]));
    b.push('a', new Uint8Array([3]));
    b.push('b', new Uint8Array([9]));
    expect(sent).toEqual([]);
    b.flush('b');
    expect(sent).toEqual([['b', [9]]]);
    (tick as unknown as () => void)();
    expect(sent).toEqual([
      ['b', [9]],
      ['a', [1, 2, 3]],
    ]);
  });
});

describe('ptyBin', () => {
  it("test mode: BISE_DESKTOP_PTY when it is an absolute path, else the core's bise", () => {
    expect(ptyBin({ BISE_DESKTOP_PTY: '/gate/bise' }, true, '/fake/core')).toBe('/gate/bise');
    expect(ptyBin({ BISE_DESKTOP_PTY: 'bise' }, true, '/fake/core')).toBe('/fake/core');
    expect(ptyBin({}, true, null)).toBeNull();
  });
  it('a normal run never reads it: the app\'s own bise runs the shells', () => {
    expect(ptyBin({ BISE_DESKTOP_PTY: '/elsewhere/bise' }, false, '/app/bin/bise')).toBe('/app/bin/bise');
  });
});
