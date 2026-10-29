import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { imageDir, imageExt, imageFile, saveImage } from './images';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2]);
const GIF = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);

describe('saveImage (R41: a pasted or dropped image reaches the model)', () => {
  it('the kind comes from the bytes, never the name', () => {
    expect([PNG, JPG, GIF, WEBP].map(imageExt)).toEqual(['png', 'jpg', 'gif', 'webp']);
    expect(imageExt(new TextEncoder().encode('%PDF-1.7'))).toBeNull();
    expect(imageExt(new Uint8Array())).toBeNull();
  });
  it("the store is the TUI's: BEND_IMAGE_DIR, else <BISE_HOME>/images, else ~/.bise/images", () => {
    expect(imageDir({ BEND_IMAGE_DIR: '/x/img', BISE_HOME: '/h/.bise' }, '/Users/c')).toBe('/x/img');
    expect(imageDir({ BISE_HOME: '/h/.bise' }, '/Users/c')).toBe('/h/.bise/images');
    expect(imageDir({}, '/Users/c')).toBe('/Users/c/.bise/images');
  });
  it('named by its hash: the same image twice is one file; not an image: null', () => {
    const a = imageFile('/s', PNG);
    expect(a).toMatch(/^\/s\/[0-9a-f]{64}\.png$/u);
    expect(imageFile('/s', PNG.slice())).toBe(a);
    expect(imageFile('/s', JPG)).not.toBe(a);
    expect(imageFile('/s', new TextEncoder().encode('hello'))).toBeNull();
  });
  it('writes the bytes once and answers the absolute path; junk is refused', () => {
    const dir = join(mkdtempSync(join(tmpdir(), 'bise-img-')), 'images');
    const p = saveImage(dir, PNG);
    expect(p).not.toBeNull();
    expect(new Uint8Array(readFileSync(p ?? ''))).toEqual(PNG);
    expect(saveImage(dir, PNG)).toBe(p);
    expect(readdirSync(dir)).toHaveLength(1);
    expect(saveImage(dir, 'not bytes')).toBeNull();
    expect(saveImage(dir, new TextEncoder().encode('text'))).toBeNull();
  });
});
