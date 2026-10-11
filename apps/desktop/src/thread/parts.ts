// His message from its typed parts (msg-parts, architect m_17621; bise_proto::parts): what he wrote,
// the selections he quoted, his long pastes, his images and his files, apart. When an entry carries
// parts, the window draws his message from them and never from Entry.text (the model's templated
// text, kept for search and copy): no '<selection …>', '<pasted …>' or '<image …>' tag ever shows.
// The TUI does the same (rust/tui/src/said.rs view_of / gist). Owner: amb-win. Pure.
import type { Part } from '@/proto';

/** A quote he sent: who wrote it, its text, and from a diff where (file, its new / old lines). */
export interface PartQuote {
  readonly from: string;
  readonly text: string;
  readonly file: string;
  readonly new: string;
  readonly old: string;
}

/** His message as the bubble draws it. */
export interface YouView {
  /** the quotes, first in the bubble */
  readonly quotes: readonly PartQuote[];
  /** his words (markdown), a long paste's chip label '▤ 1' where it was; an image's label is not
   *  in the words: its chip under them is the image (designer m_15891) */
  readonly words: string;
  /** his long pastes, by number (each opens from its chip) */
  readonly pastes: readonly { readonly n: number; readonly text: string }[];
  /** his images: their label ('[Image #2]') and where he took them from (the thumbnail) */
  readonly images: readonly { readonly name: string; readonly path: string }[];
  /** his other files (absolute paths) */
  readonly files: readonly string[];
}

/** The bubble's view of `parts` (the TUI's view_of). Pure. */
export function youView(parts: readonly Part[]): YouView {
  const quotes: PartQuote[] = [];
  const pastes: { n: number; text: string }[] = [];
  const images: { name: string; path: string }[] = [];
  const files: string[] = [];
  let words = '';
  for (const p of parts) {
    switch (p.kind) {
      case 'quote':
        quotes.push({ from: p.from, text: p.text, file: p.file ?? '', new: p.new ?? '', old: p.old ?? '' });
        break;
      case 'text':
        words += p.text;
        break;
      case 'paste':
        words += `▤ ${String(p.n)}`;
        pastes.push({ n: p.n, text: p.text });
        break;
      case 'image':
        images.push({ name: p.name, path: p.source });
        break;
      case 'file':
        files.push(p.path);
        break;
      default:
        // a part from a newer client: kept by the hub, never drawn
        break;
    }
  }
  // an image's place keeps no double space and no space before a line's end
  return { quotes, words: words.replace(/[ \t]{2,}/gu, ' ').replace(/[ \t]+\n/gu, '\n').trim(), pastes, images, files };
}

/** His message on one line (a row's gist, the TUI's said.rs gist): each chip's glyph and label in place, never a tag. Pure. */
export function partsGist(parts: readonly Part[]): string {
  const quotes: string[] = [];
  let words = '';
  for (const p of parts) {
    if (p.kind === 'quote') quotes.push(`❝ ${p.from}`);
    else if (p.kind === 'text') words += p.text;
    else if (p.kind === 'paste') words += `▤ ${String(p.n)}`;
    else if (p.kind === 'image') {
      const file = p.source.split('/').at(-1) ?? '';
      words += `▣ ${p.name.startsWith('[') || file === '' ? p.name : file}`;
    } else words += ` ${p.path}`;
  }
  return [...quotes, words.split(/\s+/u).filter((w) => w !== '').join(' ')].filter((s) => s !== '').join(' ');
}
