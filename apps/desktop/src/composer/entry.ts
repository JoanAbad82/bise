// A saved composer entry (a draft, a history or a queue entry; drafts.ts keeps them as strings),
// editor-neutral: `{"v":2,"segs":[…]}`, the content as message.ts's segments. Pure, no editor.
//
// An entry it doesn't read (the old Lexical engine's, whose reader went in issue 31): null, and the
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
  isObj(x) && typeof x.n === 'number' && (x.kind === 'image' || x.kind === 'paste' || x.kind === 'quote' || x.kind === 'artifact' || x.kind === 'anchor');

function isSegment(x: unknown): x is Segment {
  if (!isObj(x)) return false;
  if (x.kind === 'text') return typeof x.text === 'string';
  return x.kind === 'chip' && isChip(x.chip);
}

/** An entry's segments; null when it doesn't read (the caller keeps its raw JSON). */
export function entrySegments(entry: string): Segment[] | null {
  let v: unknown;
  try {
    v = JSON.parse(entry);
  } catch {
    return null;
  }
  if (!isObj(v) || v.v !== V) return null;
  return Array.isArray(v.segs) && v.segs.every(isSegment) ? tidy(v.segs) : null;
}
