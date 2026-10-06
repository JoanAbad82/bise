// What the composer sends: its content as segments (text and chips), turned into the words and
// files of one send. Pure, no Lexical: the editor reads its nodes into segments, this builds
// the message. The tags are the terminal's, so the model and the history read a desktop message
// exactly like a TUI one:
//   a long paste  `<pasted n="1" lines="240">\n…\n</pasted>` where the chip was (pasted.rs);
//   a quote       `<selection from="main">\n…\n</selection>` in front of the words (quote.rs);
//   an image      `[Image #1]` where the chip was, its file in `files` (the core's send takes
//                 absolute paths: run 5's shape; docs/images.md).
// One number sequence per draft for images, pastes and quotes (a number points at one chip).

export type Chip =
  | { readonly kind: 'image'; readonly n: number; readonly path: string; readonly name: string; readonly thumb?: string }
  | { readonly kind: 'paste'; readonly n: number; readonly text: string }
  | { readonly kind: 'quote'; readonly n: number; readonly text: string; readonly from: string };

export type Segment = { readonly kind: 'text'; readonly text: string } | { readonly kind: 'chip'; readonly chip: Chip };

export interface Outgoing {
  readonly text: string;
  readonly files: readonly string[];
}

/** A paste at least this long (lines or characters) becomes a chip (pasted.rs). */
export const PASTE_MIN_LINES = 12;
export const PASTE_MIN_CHARS = 1200;
/** At most this many quotes in one message, each cut at this many characters (quote.rs). */
export const QUOTE_MAX = 4;
export const QUOTE_MAX_CHARS = 8000;

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** The characters of a text as he sees them (an emoji or an accented letter is one). */
export const chars = (text: string): string[] => Array.from(graphemes.segment(text), (g) => g.segment);

/** Lines of a text, a trailing newline not counted, at least 1 (quote.rs `line_count`). */
export function lineCount(text: string): number {
  return Math.max(1, text.replace(/\n+$/u, '').split('\n').length);
}

/** A paste this long goes in as a chip, a shorter one inline. */
export function isLongPaste(text: string): boolean {
  return lineCount(text) >= PASTE_MIN_LINES || chars(text).length >= PASTE_MIN_CHARS;
}

/** The chip's label as the composer shows it: `▤ 1`, `❝ 2`, or the image's `[Image #3]`. */
export function chipLabel(c: Chip): string {
  switch (c.kind) {
    case 'image':
      return `[Image #${c.n}]`;
    case 'paste':
      return `▤ ${c.n}`;
    case 'quote':
      return `❝ ${c.n}`;
  }
}

/** The start of a text on one line: newlines as spaces, at most `max` characters, `…` when cut. */
export function preview(text: string, max: number): string {
  const one = text.replace(/\s+/gu, ' ').trim();
  const cs = chars(one);
  return cs.length <= max ? one : `${cs.slice(0, Math.max(0, max - 1)).join('').trimEnd()}…`;
}

/** The strip's line for a chip: `▤ 1 “first words…”   240 lines · 9.8 kB`, `❝ 1 “…”  main · 3 lines`. */
export function chipStrip(c: Chip): string {
  switch (c.kind) {
    case 'image':
      return `${chipLabel(c)} ${c.name}`;
    case 'paste': {
      const kb = new TextEncoder().encode(c.text).length / 1000;
      return `${chipLabel(c)} “${preview(c.text, 32)}”   ${lineCount(c.text)} lines · ${kb.toFixed(1)} kB`;
    }
    case 'quote': {
      const n = lineCount(c.text);
      return `${chipLabel(c)} “${preview(c.text, 32)}”  ${c.from} · ${n} ${n === 1 ? 'line' : 'lines'}`;
    }
  }
}

const pasteTag = (n: number, text: string): string =>
  `<pasted n="${n}" lines="${lineCount(text)}">\n${text.replaceAll('</pasted>', '</pasted >')}\n</pasted>`;

const quoteTag = (from: string, text: string): string =>
  `<selection from="${from.replaceAll('"', "'")}">\n${chars(text).slice(0, QUOTE_MAX_CHARS).join('').replaceAll('</selection>', '</selection >')}\n</selection>`;

/** The send for these segments: quotes in front, pastes and image labels in place, the words
 *  trimmed at both ends. Empty text and no files: nothing to send. */
export function buildMessage(segments: readonly Segment[]): Outgoing {
  const quotes: string[] = [];
  const files: string[] = [];
  let body = '';
  for (const s of segments) {
    if (s.kind === 'text') {
      body += s.text;
      continue;
    }
    const c = s.chip;
    if (c.kind === 'quote') {
      if (quotes.length < QUOTE_MAX) quotes.push(quoteTag(c.from, c.text));
    } else if (c.kind === 'paste') {
      body += pasteTag(c.n, c.text);
    } else {
      body += chipLabel(c);
      if (!files.includes(c.path)) files.push(c.path);
    }
  }
  const words = body.trim();
  const text = [...quotes, words].filter((x) => x !== '').join('\n');
  return { text, files };
}

/** Nothing to send: no words, no chip. */
export const isEmpty = (segments: readonly Segment[]): boolean =>
  segments.every((s) => s.kind === 'text' && s.text.trim() === '');

/** The next chip number of a draft: one past the highest in use (images, pastes, quotes share it). */
export function nextChipNumber(segments: readonly Segment[]): number {
  let n = 0;
  for (const s of segments) if (s.kind === 'chip') n = Math.max(n, s.chip.n);
  return n + 1;
}
