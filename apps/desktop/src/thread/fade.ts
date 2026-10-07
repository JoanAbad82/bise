// The new words of a streamed answer fade in (ambient's text-appearing v2,
// signed by designer): a rehype step over the answer's tree, so every
// element stays React's own (no DOM surgery). Owner: amb-win.
//
// `from` = how much of the answer's text (its rendered characters, in
// order) was already shown. Past it:
// - each new word is a span.th-w with its delay: the words of one update
//   are staggered by min(30 ms, 120 ms ÷ their count), so all start within
//   120 ms; once faded the thread renders again with `from` at the end and
//   the spans are gone (plain text again: nothing above re-animates);
// - a new list item, table row or code box fades as one (th-in), its dash
//   or frame with it; in code, whole new lines fade (data-from on <code>:
//   the code's own offset where the new lines start; Code.tsx draws them);
// - `wave`: the working sign '∿' rides after the last word.
// Pure on its tree: unit laws in fade.test.ts.

export interface HNode {
  type: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HNode[];
}

export interface FadeOpts {
  /** characters of the answer's text already shown (no fade before it); Infinity: none fades */
  from: number;
  /** the '∿' after the last word (the answer still comes) */
  wave?: boolean;
  /** told the answer's whole length after each pass (the next update's `from`) */
  onTotal?: (n: number) => void;
}

const STAGGER_MS = 30;
const SPREAD_MS = 120;
const BLOCKS = new Set(['li', 'tr']);

/** The delay between two new words of one update. Pure. */
export function staggerOf(words: number): number {
  return words <= 0 ? 0 : Math.min(STAGGER_MS, SPREAD_MS / words);
}

function addClass(n: HNode, c: string): void {
  const p = (n.properties ??= {});
  const cur = p.className;
  p.className = Array.isArray(cur) ? [...(cur as unknown[]), c] : typeof cur === 'string' ? [cur, c] : [c];
}

function textLen(n: HNode): number {
  if (n.type === 'text') return n.value?.length ?? 0;
  return (n.children ?? []).reduce((s, c) => s + textLen(c), 0);
}

/** The words of a text from character `at` on (whitespace runs are not words). */
function wordsOf(s: string): string[] {
  return s.split(/(\s+)/).filter((w) => w !== '');
}

/** How many new words the tree has past `from`, outside code. */
function countNew(n: HNode, from: number, at: { i: number }, inPre: boolean): number {
  if (n.type === 'text') {
    const v = n.value ?? '';
    const s = at.i;
    at.i += v.length;
    if (inPre || at.i <= from) return 0;
    return wordsOf(v.slice(Math.max(0, from - s))).filter((w) => !/^\s+$/.test(w)).length;
  }
  const pre = inPre || n.tagName === 'pre';
  return (n.children ?? []).reduce((k, c) => k + countNew(c, from, at, pre), 0);
}

function mark(n: HNode, from: number, at: { i: number }, w: { k: number; step: number }, inPre: boolean): void {
  const kids = n.children;
  if (kids === undefined) return;
  const out: HNode[] = [];
  for (const c of kids) {
    if (c.type === 'text') {
      const v = c.value ?? '';
      const s = at.i;
      at.i += v.length;
      if (inPre || at.i <= from) {
        out.push(c);
        continue;
      }
      const cut = Math.max(0, from - s);
      if (cut > 0) out.push({ type: 'text', value: v.slice(0, cut) });
      for (const part of wordsOf(v.slice(cut))) {
        if (/^\s+$/.test(part)) out.push({ type: 'text', value: part });
        else {
          const delay = Math.round(w.k * w.step);
          w.k++;
          out.push({ type: 'element', tagName: 'span', properties: { className: ['th-w'], style: `animation-delay:${String(delay)}ms` }, children: [{ type: 'text', value: part }] });
        }
      }
      continue;
    }
    if (c.type === 'element') {
      const start = at.i;
      const len = textLen(c);
      if (start >= from && len > 0 && (BLOCKS.has(c.tagName ?? '') || c.tagName === 'pre')) addClass(c, 'th-in');
      if (c.tagName === 'code' && inPre && start + len > from) {
        (c.properties ??= {}).dataFrom = String(Math.max(0, from - start));
      }
      mark(c, from, at, w, inPre || c.tagName === 'pre');
    }
    out.push(c);
  }
  n.children = out;
}

/** The element the '∿' goes in: the last block with words (a paragraph, a list item, a heading). */
function lastHome(root: HNode): HNode {
  let n = root;
  for (;;) {
    const last = [...(n.children ?? [])].reverse().find((c) => c.type === 'element');
    if (last === undefined) return n;
    const t = last.tagName ?? '';
    if (t === 'ul' || t === 'ol' || t === 'li' || t === 'blockquote') {
      n = last;
      continue;
    }
    if (t === 'p' || /^h[1-6]$/.test(t)) return last;
    return n;
  }
}

/** The rehype step: `[fade, opts]` in react-markdown's rehypePlugins. */
export function fade(opts: FadeOpts) {
  return (tree: HNode): void => {
    const total = textLen(tree);
    if (opts.from < total) {
      const words = countNew(tree, opts.from, { i: 0 }, false);
      mark(tree, opts.from, { i: 0 }, { k: 0, step: staggerOf(words) }, false);
    }
    if (opts.wave === true) {
      const home = lastHome(tree);
      (home.children ??= []).push({ type: 'element', tagName: 'span', properties: { className: ['th-wave'], ariaHidden: 'true', dataTestid: 'thread.stream.wave' }, children: [{ type: 'text', value: '∿' }] });
    }
    opts.onTotal?.(total);
  };
}
