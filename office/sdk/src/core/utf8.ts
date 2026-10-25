// UTF-8 for a host with no TextEncoder/TextDecoder (bend-jsrt is V8 and
// deno_core, no web APIs). fflate's own fallback mangles characters past
// U+FFFF (an emoji comes back as another one: test/bare.test.ts), so the
// SDK has its own. The host's codec is used when there is one.

type Codec = { encode(s: string): Uint8Array; decode(b: Uint8Array): string };

function native(): Codec | undefined {
  const g = globalThis as { TextEncoder?: new () => { encode(s: string): Uint8Array }; TextDecoder?: new () => { decode(b: Uint8Array): string } };
  if (!g.TextEncoder || !g.TextDecoder) return undefined;
  const te = new g.TextEncoder();
  const td = new g.TextDecoder();
  return { encode: (s) => te.encode(s), decode: (b) => td.decode(b) };
}

/** A string as UTF-8 bytes (a lone surrogate becomes U+FFFD, as TextEncoder does). */
export function encodeUtf8(s: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
      const d = s.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) {
        c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00);
        i++;
      }
    }
    if (c >= 0xd800 && c <= 0xdfff) c = 0xfffd;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return new Uint8Array(out);
}

/** UTF-8 bytes as a string, as TextDecoder does it (the WHATWG decoder: a
 * bad sequence's maximal part becomes one U+FFFD; a leading BOM is dropped). */
export function decodeUtf8(b: Uint8Array): string {
  let s = "";
  let cp = 0;
  let need = 0;
  let lo = 0x80;
  let hi = 0xbf;
  let i = b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf ? 3 : 0;
  while (i < b.length) {
    const c = b[i];
    if (need === 0) {
      i++;
      if (c < 0x80) s += String.fromCharCode(c);
      else if (c >= 0xc2 && c <= 0xdf) [need, cp] = [1, c & 0x1f];
      else if (c >= 0xe0 && c <= 0xef) {
        if (c === 0xe0) lo = 0xa0;
        if (c === 0xed) hi = 0x9f;
        [need, cp] = [2, c & 0xf];
      } else if (c >= 0xf0 && c <= 0xf4) {
        if (c === 0xf0) lo = 0x90;
        if (c === 0xf4) hi = 0x8f;
        [need, cp] = [3, c & 0x7];
      } else s += "\uFFFD";
      continue;
    }
    if (c < lo || c > hi) {
      // the sequence ends here: one U+FFFD, and this byte starts again
      [need, cp, lo, hi] = [0, 0, 0x80, 0xbf];
      s += "\uFFFD";
      continue;
    }
    [lo, hi] = [0x80, 0xbf];
    cp = (cp << 6) | (c & 0x3f);
    i++;
    if (--need === 0) s += String.fromCodePoint(cp);
  }
  if (need > 0) s += "\uFFFD";
  return s;
}

const codec: Codec = native() ?? { encode: encodeUtf8, decode: decodeUtf8 };

export const utf8Encode = (s: string): Uint8Array => codec.encode(s);
export const utf8Decode = (b: Uint8Array): string => codec.decode(b);
