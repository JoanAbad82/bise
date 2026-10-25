import { describe, expect, it } from 'vitest';
import { fileFor, fitWidth, readReq, safePart, stemOf, thumbsDirOf } from './cache';
import { toPrune } from './prune';
import { isoSecs, mediaSecs, wavSecs, type Read } from './media';

const box = (type: string, body: Uint8Array): Uint8Array => {
  const b = new Uint8Array(8 + body.length);
  new DataView(b.buffer).setUint32(0, b.length);
  for (let i = 0; i < 4; i++) b[4 + i] = type.charCodeAt(i);
  b.set(body, 8);
  return b;
};
const cat = (...xs: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(xs.reduce((n, x) => n + x.length, 0));
  let at = 0;
  for (const x of xs) {
    out.set(x, at);
    at += x.length;
  }
  return out;
};
const reader = (b: Uint8Array): Read => (at, len) => b.subarray(at, Math.min(b.length, at + len));

describe('a media length from its header', () => {
  it("reads an mp4's moov › mvhd, after a big mdat, v0 and v1", () => {
    const mvhd0 = new Uint8Array(100);
    new DataView(mvhd0.buffer).setUint32(12, 600);
    new DataView(mvhd0.buffer).setUint32(16, 2520);
    const file = cat(box('ftyp', new Uint8Array(12)), box('mdat', new Uint8Array(5000)), box('moov', cat(box('mvhd', mvhd0), box('trak', new Uint8Array(20)))));
    expect(isoSecs(reader(file), file.length)).toBeCloseTo(4.2);
    const mvhd1 = new Uint8Array(112);
    mvhd1[0] = 1;
    new DataView(mvhd1.buffer).setUint32(20, 1000);
    new DataView(mvhd1.buffer).setUint32(28, 42_000);
    const f1 = cat(box('moov', box('mvhd', mvhd1)));
    expect(mediaSecs('m4a', reader(f1), f1.length)).toBe(42);
  });

  it("reads a WAV's data size over its byte rate", () => {
    const fmt = new Uint8Array(16);
    new DataView(fmt.buffer).setUint32(8, 88_200, true);
    const le = (type: string, body: Uint8Array): Uint8Array => {
      const b = new Uint8Array(8 + body.length);
      for (let i = 0; i < 4; i++) b[i] = type.charCodeAt(i);
      new DataView(b.buffer).setUint32(4, body.length, true);
      b.set(body, 8);
      return b;
    };
    const head = new Uint8Array(12);
    head.set(new TextEncoder().encode('RIFF'), 0);
    head.set(new TextEncoder().encode('WAVE'), 8);
    const file = cat(head, le('fmt ', fmt), le('data', new Uint8Array(176_400)));
    expect(wavSecs(reader(file), file.length)).toBe(2);
  });

  it('answers null for a broken or unknown file, never loops', () => {
    const junk = new Uint8Array(64);
    expect(isoSecs(reader(junk), junk.length)).toBeNull();
    expect(mediaSecs('mkv', reader(junk), junk.length)).toBeNull();
    expect(mediaSecs('wav', reader(junk), junk.length)).toBeNull();
  });
});

describe('the thumbnails cache', () => {
  const r = { how: 'file' as const, src: '/w/a.png', project: 'shop-1a2b', id: 'plan', v: 3, sig: '0123abcd' };

  it('keeps one file per version under the caches folder, its sig in the name', () => {
    // the folder is the core's (bise_home's thumbs_cache), never joined here
    expect(thumbsDirOf({ proto: 1, thumbs_dir: '/h/.bise/cache/thumbs' })).toBe('/h/.bise/cache/thumbs');
    expect(thumbsDirOf({ proto: 1 })).toBe('');
    expect(thumbsDirOf({ thumbs_dir: 'rel/x' })).toBe('');
    expect(thumbsDirOf(null)).toBe('');
    expect(fileFor('/c', r)).toBe('/c/shop-1a2b/plan-v3.0123abcd.png');
    expect(stemOf(r)).toBe('plan-v3.');
  });

  it("refuses a request whose names could leave the cache, or that isn't one", () => {
    expect(readReq(r)).toEqual(r);
    expect(readReq({ ...r, project: '..' })).toBeNull();
    expect(readReq({ ...r, id: 'a/b' })).toBeNull();
    expect(readReq({ ...r, sig: 'zz' })).toBeNull();
    expect(readReq({ ...r, how: 'exec' })).toBeNull();
    expect(readReq({ ...r, v: 1.5 })).toBeNull();
    expect(readReq('x')).toBeNull();
    expect(safePart('a..b')).toBeNull();
    expect(safePart('.hidden')).toBeNull();
  });

  it('cuts a picture to 480 wide, its ratio kept, never up', () => {
    expect(fitWidth(1120, 700)).toEqual({ width: 480, height: 300 });
    expect(fitWidth(200, 100)).toEqual({ width: 200, height: 100 });
  });
});

describe('the thumbnails cache cap', () => {
  it('deletes the least recently read first, until the rest fit under the cap', () => {
    const f = (path: string, bytes: number, atime: number) => ({ path, bytes, atime });
    const files = [f('/c/a', 40, 3), f('/c/b', 40, 1), f('/c/c', 40, 2), f('/c/d', 40, 4)];
    expect(toPrune(files, 160)).toEqual([]);
    expect(toPrune(files, 100)).toEqual(['/c/b', '/c/c']);
    expect(toPrune(files, 0)).toEqual(['/c/b', '/c/c', '/c/a', '/c/d']);
  });
});
