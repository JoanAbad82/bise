// What a streamed answer shows while it grows (ambient's text-appearing v2,
// signed by designer; amb-core's partial: the whole text so far, every
// 250 ms at most). Owner: amb-win.
//
// The hub sends the raw text so far; the thread shows only what is whole:
// - a word cut in its middle waits for its end (a whitespace);
// - in an open code block, a half line waits for its newline;
// - a table shows once its separator line came, then each row once whole;
// - an unclosed ** or backtick never shows its raw marks: the words show
//   plain until it closes, then become bold / code in place.
// The final entry is the source of truth: none of this applies to it.

const FENCE = /^ {0,3}(```|~~~)/;
const ROW = /^\s*\|/;
const SEP = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

/** Inside an open code block at the end of `text` (an odd number of fence lines). Pure. */
export function openFence(text: string): boolean {
  let open = false;
  for (const line of text.split('\n')) if (FENCE.test(line)) open = !open;
  return open;
}

/** The marks of the last block that never closed, dropped (a lone ** or `), outside code. Pure. */
export function dropOpenMarks(block: string): string {
  // inline code first: a backtick with no partner is the open one
  const ticks = [...block.matchAll(/`/g)].map((m) => m.index);
  let out = block;
  if (ticks.length % 2 === 1) {
    const at = ticks[ticks.length - 1] ?? 0;
    out = out.slice(0, at) + out.slice(at + 1);
  }
  // ** outside inline code
  const stars: number[] = [];
  let inCode = false;
  for (let i = 0; i < out.length; i++) {
    if (out[i] === '`') inCode = !inCode;
    else if (!inCode && out.startsWith('**', i)) {
      stars.push(i);
      i++;
    }
  }
  if (stars.length % 2 === 1) {
    const at = stars[stars.length - 1] ?? 0;
    out = out.slice(0, at) + out.slice(at + 2);
  }
  return out;
}

/**
 * The part of a streamed text the thread shows now. `done`: the stream
 * ended (the whole text shows, still without open marks). Pure.
 */
export function streamView(text: string, done = false): string {
  if (text === '') return '';
  // an open code block: whole lines only
  if (openFence(text)) {
    if (done) return text;
    const nl = text.lastIndexOf('\n');
    return nl < 0 ? '' : text.slice(0, nl + 1);
  }
  let t = text;
  if (!done) {
    // the last line is cut: a table row waits whole, a word waits for its end
    const nl = t.lastIndexOf('\n');
    const last = t.slice(nl + 1);
    if (ROW.test(last)) t = t.slice(0, nl + 1);
    else if (!/\s$/.test(t)) {
      const ws = Math.max(t.lastIndexOf(' '), t.lastIndexOf('\n'), t.lastIndexOf('\t'));
      t = ws < 0 ? '' : t.slice(0, ws + 1);
    }
  }
  // the last block (after the last blank line)
  const cut = t.search(/\n\s*\n(?![\s\S]*\n\s*\n)/);
  const head = cut < 0 ? '' : t.slice(0, cut);
  let block = cut < 0 ? t : t.slice(cut);
  // a table before its separator: its header waits
  const lines = block.split('\n');
  const first = lines.findIndex((l) => l.trim() !== '');
  if (first >= 0 && ROW.test(lines[first] ?? '')) {
    const sep = lines[first + 1];
    if (sep === undefined || !SEP.test(sep)) block = lines.slice(0, first).join('\n');
  }
  return head + dropOpenMarks(block);
}
