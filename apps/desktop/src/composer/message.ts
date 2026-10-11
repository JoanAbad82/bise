// What the composer sends: its content as segments (text and chips), turned into the words and
// files of one send. Pure, no Lexical: the editor reads its nodes into segments, this builds
// the message. The tags are the terminal's, so the model and the history read a desktop message
// exactly like a TUI one:
//   a long paste  `<pasted n="1" lines="240">\n…\n</pasted>` where the chip was (pasted.rs);
//   a quote       `<selection from="main">\n…\n</selection>` in front of the words (quote.rs);
//   an artifact   `[title](url)` where the chip was (attach.rs insert_artifact);
//   an image      `[Image #1]` where the chip was, its file in `files` (the core's send takes
//                 absolute paths: run 5's shape; docs/images.md).
// One number sequence per draft for images, pastes and quotes (a number points at one chip).

import type { Part } from '@/proto';

export type Chip =
  | { readonly kind: 'image'; readonly n: number; readonly path: string; readonly name: string; readonly thumb?: string }
  | { readonly kind: 'paste'; readonly n: number; readonly text: string }
  | { readonly kind: 'quote'; readonly n: number; readonly text: string; readonly from: string; readonly at?: QuoteAt }
  | { readonly kind: 'artifact'; readonly n: number; readonly id: string; readonly title: string; readonly url: string };

/** Where in a diff a quote comes from (quote.rs Where): the file, its lines in the new file and the old one ('12-14'; '' none). */
export interface QuoteAt {
  readonly file: string;
  readonly new: string;
  readonly old: string;
}

/** A quote's place in words (quote.rs about): 'src/a.rs:12-14 · 3 lines', 'src/a.rs:11-12 · 2 removed lines', else 'main · 3 lines'. */
export function quoteAbout(from: string, text: string, at?: QuoteAt): string {
  const n = lineCount(text);
  const s = n === 1 ? '' : 's';
  if (at === undefined || at.file === '') return `${from} · ${n} line${s}`;
  if (at.new !== '') return `${at.file}:${at.new} · ${n} line${s}`;
  if (at.old !== '') return `${at.file}:${at.old} · ${n} removed line${s}`;
  return `${at.file} · ${n} line${s}`;
}

export type Segment = { readonly kind: 'text'; readonly text: string } | { readonly kind: 'chip'; readonly chip: Chip };

export interface Outgoing {
  readonly text: string;
  readonly files: readonly string[];
  /** msg-parts: the same message as typed parts (quotes, words, pastes), when it has more than words
   *  and no image; the hub renders the model's text from them */
  readonly parts?: readonly Part[];
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
    case 'artifact':
      return `↗ ${c.title}`;
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
    case 'quote':
      return `${chipLabel(c)} “${preview(c.text, 32)}”  ${quoteAbout(c.from, c.text, c.at)}`;
    case 'artifact':
      return `${chipLabel(c)}  ${c.url}`;
  }
}

const pasteTag = (n: number, text: string): string =>
  `<pasted n="${n}" lines="${lineCount(text)}">\n${text.replaceAll('</pasted>', '</pasted >')}\n</pasted>`;

const attr = (s: string): string => s.replaceAll('"', "'").replaceAll('\n', ' ');
/** quote.rs tag_at: from, then file / new / old when known. */
const quoteHead = (from: string, at?: QuoteAt): string =>
  [`from="${attr(from)}"`, ...(at === undefined ? [] : (['file', 'new', 'old'] as const).filter((k) => at[k] !== '').map((k) => `${k}="${attr(at[k])}"`))].join(' ');
const quoteTag = (from: string, text: string, at?: QuoteAt): string =>
  `<selection ${quoteHead(from, at)}>\n${chars(text).slice(0, QUOTE_MAX_CHARS).join('').replaceAll('</selection>', '</selection >')}\n</selection>`;

/** The send for these segments: quotes in front, pastes and image labels in place, the words
 *  trimmed at both ends. Empty text and no files: nothing to send. */
export function buildMessage(segments: readonly Segment[]): Outgoing {
  const quotes: string[] = [];
  const files: string[] = [];
  // msg-parts (architect m_17621): the same message as typed parts, the hub renders the model's text
  // from them (byte for byte these tags); kept in order beside the text
  const quoteParts: Part[] = [];
  const bodyParts: Part[] = [];
  let images = false;
  const say = (t: string): void => {
    const last = bodyParts.at(-1);
    if (last?.kind === 'text') bodyParts[bodyParts.length - 1] = { kind: 'text', text: last.text + t };
    else if (t !== '') bodyParts.push({ kind: 'text', text: t });
  };
  let body = '';
  // an inline label (an image's `[Image #1]`, an artifact's link) gets one space from the words
  // on each side, as the TUI inserts it: never '[Image #1]what is…' (qa-native's R41 read)
  let spaceNext = false;
  for (const s of segments) {
    if (s.kind === 'text') {
      if (spaceNext && /^[^\s.,;:!?)\]]/u.test(s.text)) {
        body += ' ';
        say(' ');
      }
      if (s.text !== '') spaceNext = false;
      body += s.text;
      say(s.text);
      continue;
    }
    const c = s.chip;
    if (c.kind === 'quote') {
      if (quotes.length < QUOTE_MAX) {
        quotes.push(quoteTag(c.from, c.text, c.at));
        const at = c.at === undefined ? {} : Object.fromEntries((['file', 'new', 'old'] as const).filter((k) => c.at?.[k] !== '').map((k) => [k, c.at?.[k] ?? '']));
        quoteParts.push({ kind: 'quote', from: attr(c.from), text: chars(c.text).slice(0, QUOTE_MAX_CHARS).join(''), ...at });
      }
      continue;
    }
    if (c.kind === 'paste') {
      body += pasteTag(c.n, c.text);
      bodyParts.push({ kind: 'paste', n: c.n, text: c.text });
      spaceNext = false;
      continue;
    }
    if (c.kind === 'image') {
      images = true;
      if (!files.includes(c.path)) files.push(c.path);
    }
    const label = c.kind === 'artifact' ? `[${c.title.replace(/[[\]]/gu, '')}](${c.url})` : chipLabel(c);
    const pad = /\S$/u.test(body) ? ' ' : '';
    body += pad + label;
    say(pad + label);
    spaceNext = true;
  }
  // `say …` and `steer …` go out without their word (sb.rs, C45)
  const words = body.trim().replace(/^(?:steer|say) /u, '').trim();
  const text = [...quotes, words].filter((x) => x !== '').join('\n');
  // parts only when they say more than words (the TUI's of_parts), and never with an image: its
  // file goes as `files` and the hub stores it (a part's image must already be in the store as a
  // .b64, which the window doesn't make); a message of words alone stays text
  const parts = images || (quoteParts.length === 0 && !bodyParts.some((p) => p.kind === 'paste')) ? undefined : [...quoteParts, ...trimParts(bodyParts)];
  return parts === undefined ? { text, files } : { text, files, parts };
}

/** The words' parts trimmed like the text (both ends, and `say ` / `steer ` in front), empty text parts dropped. */
function trimParts(ps: readonly Part[]): Part[] {
  const out = [...ps];
  const first = out[0];
  if (first?.kind === 'text') out[0] = { kind: 'text', text: first.text.trimStart().replace(/^(?:steer|say) /u, '').trimStart() };
  const last = out.at(-1);
  if (last?.kind === 'text') out[out.length - 1] = { kind: 'text', text: last.text.trimEnd() };
  return out.filter((p) => p.kind !== 'text' || p.text !== '');
}

/** The line a message with images gets when the model reads none (attach.rs no_vision_error). */
export const noVisionLine = (model: string): string => `${model} does not support image input (bise's model catalog): not sent`;

/** Nothing to send: no words, no chip. */
export const isEmpty = (segments: readonly Segment[]): boolean =>
  segments.every((s) => s.kind === 'text' && s.text.trim() === '');

/** The next chip number of a draft: one past the highest in use (images, pastes, quotes share it). */
export function nextChipNumber(segments: readonly Segment[]): number {
  let n = 0;
  for (const s of segments) if (s.kind === 'chip') n = Math.max(n, s.chip.n);
  return n + 1;
}
