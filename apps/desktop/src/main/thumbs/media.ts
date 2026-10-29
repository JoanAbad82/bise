// A video's or a sound's length from its header, for the card's '▶ 0:04' (artifacts-gallery v7,
// `kinds`: « a frame + its length »). No decoder, no ffprobe: the ISO media box tree (mp4, mov,
// m4v, m4a: moov › mvhd's timescale and duration) and a WAV's RIFF chunks (data size / byte rate).
// Pure over a `read(offset, length)` of the file. Owner: art-thumbs.

/** Reads `len` bytes at `at` (fewer at the end of the file). */
export type Read = (at: number, len: number) => Uint8Array;

const u32 = (b: Uint8Array, i: number): number => ((b[i] ?? 0) * 0x1000000 + (((b[i + 1] ?? 0) << 16) | ((b[i + 2] ?? 0) << 8) | (b[i + 3] ?? 0))) >>> 0;
const u32le = (b: Uint8Array, i: number): number => ((b[i] ?? 0) | ((b[i + 1] ?? 0) << 8) | ((b[i + 2] ?? 0) << 16)) + (b[i + 3] ?? 0) * 0x1000000;
const u64 = (b: Uint8Array, i: number): number => u32(b, i) * 0x1_0000_0000 + u32(b, i + 4);
const tag = (b: Uint8Array, i: number): string => String.fromCharCode(b[i] ?? 0, b[i + 1] ?? 0, b[i + 2] ?? 0, b[i + 3] ?? 0);

/** The boxes walked at most (a broken file can't loop us). */
const MAX_BOXES = 4096;

/** The first box of type `want` among the boxes in [from, to): its body's start and end, or null. */
function findBox(read: Read, from: number, to: number, want: string): { at: number; end: number } | null {
  let at = from;
  for (let n = 0; n < MAX_BOXES && at + 8 <= to; n++) {
    const h = read(at, 16);
    if (h.length < 8) return null;
    let size = u32(h, 0);
    let head = 8;
    if (size === 1) {
      if (h.length < 16) return null;
      size = u64(h, 8);
      head = 16;
    } else if (size === 0) size = to - at;
    if (size < head) return null;
    if (tag(h, 4) === want) return { at: at + head, end: Math.min(to, at + size) };
    at += size;
  }
  return null;
}

/** An ISO media file's length in seconds (moov › mvhd), or null. Pure. */
export function isoSecs(read: Read, size: number): number | null {
  const moov = findBox(read, 0, size, 'moov');
  if (moov === null) return null;
  const mvhd = findBox(read, moov.at, moov.end, 'mvhd');
  if (mvhd === null) return null;
  const b = read(mvhd.at, 32);
  const v1 = b[0] === 1;
  const scale = u32(b, v1 ? 20 : 12);
  const dur = v1 ? u64(b, 24) : u32(b, 16);
  if (scale === 0 || (!v1 && dur === 0xffffffff)) return null;
  return dur / scale;
}

/** A WAV's length in seconds (its data chunk's size over its byte rate), or null. Pure. */
export function wavSecs(read: Read, size: number): number | null {
  const h = read(0, 12);
  if (tag(h, 0) !== 'RIFF' || tag(h, 8) !== 'WAVE') return null;
  let at = 12;
  let rate = 0;
  for (let n = 0; n < MAX_BOXES && at + 8 <= size; n++) {
    const c = read(at, 20);
    const len = u32le(c, 4);
    if (tag(c, 0) === 'fmt ') rate = u32le(c, 16);
    else if (tag(c, 0) === 'data') return rate > 0 ? len / rate : null;
    at += 8 + len + (len % 2);
  }
  return null;
}

const ISO = new Set(['mp4', 'm4v', 'mov', 'm4a', '3gp', 'aac']);

/** The length of a video or a sound by its extension's format, or null (another format, a broken header). Pure. */
export function mediaSecs(ext: string, read: Read, size: number): number | null {
  try {
    if (ISO.has(ext)) return isoSecs(read, size);
    if (ext === 'wav') return wavSecs(read, size);
  } catch {
    return null;
  }
  return null;
}
