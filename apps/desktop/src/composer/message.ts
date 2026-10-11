// What the composer sends: its content as segments (text and chips), turned into one send. Pure,
// no editor: the editor reads its nodes into segments, this builds the message. The window never
// writes the model's template (the terminal's <selection>/<pasted> tags, image markers): a message
// with a quote, a paste or an image goes as typed parts and the hub renders the model's text from
// them (bise_proto::parts::render, the one renderer; architect's delta review D2):
//   a long paste  {kind:'paste', n, text} where the chip was;
//   a quote       {kind:'quote', from, text, file?, new?, old?} in front of the words;
//   an artifact   `[title](url)` in his words where the chip was (attach.rs insert_artifact);
//   an image      {kind:'image', name:'[Image #1]', source:<absolute path>} where the chip was
//                 (the hub stores it, main 18a32ce3).
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
  /** msg-parts: his message as typed parts, when it has more than words (a quote, a paste, an
   *  image); the hub renders the model's text from them and ignores `text` */
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

/** The send for these segments (architect's delta review D2: the window never templates; the hub
 *  renders the model's text from the parts, bise_proto::parts::render). A message of words alone
 *  goes as its text; one with a quote, a paste or an image goes as typed parts: the quotes in front
 *  (at most QUOTE_MAX, each cut at QUOTE_MAX_CHARS), the words with the pastes and images in place
 *  (an image with its source alone: the hub stores it, main 18a32ce3). `text` is then his words
 *  with the chips' labels ('▤ 1', '[Image #1]'), for the hub's older readers, the composer's strip
 *  and the pending row's match, never the model's template. Empty: nothing to send. */
export function buildMessage(segments: readonly Segment[]): Outgoing {
  const files: string[] = [];
  const quoteParts: Part[] = [];
  const bodyParts: Part[] = [];
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
      if (quoteParts.length < QUOTE_MAX) {
        const at = c.at === undefined ? {} : Object.fromEntries((['file', 'new', 'old'] as const).filter((k) => c.at?.[k] !== '').map((k) => [k, c.at?.[k] ?? '']));
        quoteParts.push({ kind: 'quote', from: c.from, text: chars(c.text).slice(0, QUOTE_MAX_CHARS).join(''), ...at });
      }
      continue;
    }
    if (c.kind === 'paste') {
      body += chipLabel(c);
      bodyParts.push({ kind: 'paste', n: c.n, text: c.text });
      spaceNext = false;
      continue;
    }
    const label = c.kind === 'artifact' ? `[${c.title.replace(/[[\]]/gu, '')}](${c.url})` : chipLabel(c);
    const pad = /\S$/u.test(body) ? ' ' : '';
    body += pad + label;
    if (c.kind === 'image') {
      say(pad);
      bodyParts.push({ kind: 'image', name: label, source: c.path });
    } else say(pad + label);
    spaceNext = true;
  }
  // `say …` and `steer …` go out without their word (sb.rs, C45)
  const text = body.trim().replace(/^(?:steer|say) /u, '').trim();
  // parts only when they say more than words (the TUI's of_parts); words alone stay text
  const typed = quoteParts.length > 0 || bodyParts.some((p) => p.kind !== 'text');
  return typed ? { text, files, parts: [...quoteParts, ...trimParts(bodyParts)] } : { text, files };
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
