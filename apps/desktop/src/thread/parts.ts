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
      case 'page':
        // what he did on a page: its own row (pageAnswer), never the hub's template
        words += p.notes.map((n) => pageNoteWords(n, true)).filter((w) => w !== '').join('\n');
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
    if (p.kind === 'quote') quotes.push(`❝ ${p.from === 'main' ? 'bise' : p.from}`);
    else if (p.kind === 'text') words += p.text;
    else if (p.kind === 'paste') words += `▤ ${String(p.n)}`;
    else if (p.kind === 'image') {
      const file = p.source.split('/').at(-1) ?? '';
      words += `▣ ${p.name.startsWith('[') || file === '' ? p.name : file}`;
    } else if (p.kind === 'page') words += p.notes.map((n) => pageNoteWords(n, true)).join(' · ');
    else words += ` ${p.path}`;
  }
  return [...quotes, words.split(/\s+/u).filter((w) => w !== '').join(' ')].filter((s) => s !== '').join(' ');
}

/** The part kinds this window draws; an entry with another kind (a newer hub's) is drawn from its text. */
const KNOWN_KINDS: ReadonlySet<string> = new Set(['text', 'quote', 'paste', 'image', 'file', 'page']);

/** His parts when this window can draw them all, else null: an entry with a part of a kind it
 *  doesn't know (a newer hub's) is drawn from its text, never as an empty bubble (architect m_20833). Pure. */
export function drawnParts(parts: readonly Part[] | null | undefined): readonly Part[] | null {
  if (parts == null || parts.length === 0) return null;
  return parts.every((p) => KNOWN_KINDS.has((p as { kind: string }).kind)) ? parts : null;
}

type PagePart = Extract<Part, { kind: 'page' }>;
type PageNoteOf = PagePart['notes'][number];

/** The page part of his message, when the hub wrote it from a page (his pick, note, tick). Pure. */
export function pageOf(parts: readonly Part[] | null | undefined): PagePart | null {
  return parts?.find((p): p is PagePart => p.kind === 'page') ?? null;
}

const ON_THE_LINE = 30;

function oneLine(s: string, max: number): string {
  const l =
    s
      .split('\n')
      .map((x) => x.trim())
      .find((x) => x !== '') ?? '';
  // code points, as bise-proto's chars().count()
  const cps = Array.from(l);
  return cps.length <= max ? l : `${cps.slice(0, max - 1).join('')}…`;
}

/** One note's words, bise-proto's words::page_note_words word for word. Pure. */
export function pageNoteWords(n: PageNoteOf, on: boolean): string {
  const text = (n.text ?? '').trim();
  const quote = oneLine(n.quote ?? '', 60);
  if (n.kind === 'edit') return `"${quote}" → "${oneLine(text, 60)}"`;
  const marks: Record<string, string> = { keep: '♡ keep', drop: '✗ drop', unsure: '~ not sure', approve: '✓ approve', skip: 'skip' };
  const mark = n.kind === 'tick' && (text === '' || text === 'done') ? '✓ done' : (marks[n.kind] ?? text);
  return on && quote !== '' ? `"${quote}": ${mark}` : mark;
}

/** What he did on a page as its row, bise-proto's words::page_answer word for word: one answer to
 *  a card reads as any card answer (head 'you answered main', what it asked, his words); a start
 *  asks for an agent; else the page's name and his notes one per line. Pure. */
export function pageAnswer(p: PagePart): { head: string; asked: string; words: string } {
  const title = p.title != null && p.title !== '' ? p.title : p.page;
  const only = p.notes.length === 1 ? p.notes[0] : undefined;
  if (only !== undefined && (only.asked ?? '') !== '') {
    const w = pageNoteWords(only, false).trim();
    const short = !w.includes('\n') && Array.from(w).length <= ON_THE_LINE;
    return short ? { head: `you answered ${p.to}: ${w}`, asked: (only.asked ?? '').trim(), words: '' } : { head: `you answered ${p.to}`, asked: (only.asked ?? '').trim(), words: w };
  }
  // a note is not an answer (designer m_20985): what he sent, the page as its ↗ link
  const n = p.notes.length;
  const head = p.notes.every((x) => x.kind === 'start')
    ? `you asked ${p.to} for an agent on ↗ ${title}`
    : n === 1
      ? `you sent ${p.to} a note on ↗ ${title}`
      : `you sent ${p.to} ${String(n)} notes on ↗ ${title}`;
  return {
    head,
    asked: '',
    words: p.notes
      .map((n) => pageNoteWords(n, true))
      .filter((w) => w !== '')
      .join('\n'),
  };
}
