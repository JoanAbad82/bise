// A saved composer entry (a draft, a history or a queue entry; drafts.ts keeps them as strings),
// editor-neutral: `{"v":2,"segs":[…]}`, the content as message.ts's segments. Pure, no editor.
//
// The reader also takes the old Lexical engine's entries (its editor-state JSON: paragraphs, text,
// line breaks and 'bise-chip' nodes), so nothing he typed before the switch is lost. Keep that
// reader one release after Lexical went (architect m_11500). An entry neither reads: null, and the
// caller keeps its raw JSON (never dropped).
import type { Chip, Segment } from './message';

const V = 2;

/** The entry for these segments. */
export function entryOf(segs: readonly Segment[]): string {
  return JSON.stringify({ v: V, segs: tidy(segs) });
}

/** Adjacent text segments as one, empty ones out (one shape for equal content). */
export function tidy(segs: readonly Segment[]): Segment[] {
  const out: Segment[] = [];
  for (const s of segs) {
    const last = out.at(-1);
    if (s.kind === 'text') {
      if (s.text === '') continue;
      if (last?.kind === 'text') out[out.length - 1] = { kind: 'text', text: last.text + s.text };
      else out.push(s);
    } else out.push(s);
  }
  return out;
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

const isChip = (x: unknown): x is Chip =>
  isObj(x) && typeof x.n === 'number' && (x.kind === 'image' || x.kind === 'paste' || x.kind === 'quote' || x.kind === 'artifact');

function isSegment(x: unknown): x is Segment {
  if (!isObj(x)) return false;
  if (x.kind === 'text') return typeof x.text === 'string';
  return x.kind === 'chip' && isChip(x.chip);
}

/** An entry's segments, from either format; null when it reads as neither. */
export function entrySegments(entry: string): Segment[] | null {
  let v: unknown;
  try {
    v = JSON.parse(entry);
  } catch {
    return null;
  }
  if (!isObj(v)) return null;
  if (v.v === V) return Array.isArray(v.segs) && v.segs.every(isSegment) ? tidy(v.segs) : null;
  const root = v.root;
  if (isObj(root) && Array.isArray(root.children)) return lexicalSegments(root.children);
  return null;
}

/** The old engine's root children as segments, as its $readSegments read them: paragraphs joined
 *  by a newline, a line break a newline, a chip a chip, any other element's children in order. */
function lexicalSegments(paras: readonly unknown[]): Segment[] {
  const out: Segment[] = [];
  const text = (t: string): void => {
    out.push({ kind: 'text', text: t });
  };
  const visit = (n: unknown): void => {
    if (!isObj(n)) return;
    if (n.type === 'bise-chip') {
      if (isChip(n.chip)) out.push({ kind: 'chip', chip: n.chip });
    } else if (n.type === 'linebreak') text('\n');
    else if (n.type === 'tab') text('\t');
    else if (typeof n.text === 'string') text(n.text);
    else if (Array.isArray(n.children)) n.children.forEach(visit);
  };
  paras.forEach((p, i) => {
    if (i > 0) text('\n');
    visit(p);
  });
  return tidy(out);
}
