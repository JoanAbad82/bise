// A find's matches as DOM ranges, for the CSS highlight API: the matched words get the selection's
// tint and the rows' DOM stays as drawn (designer m_17531 for /log, m_25774 for ⌘F in a thread).
// Shared by the thread's find bar (FindBar.tsx) and /log's find (LogScreen.tsx). Owner: amb-win.

/**
 * The places `at(text)` finds in an element's words, each `len` long, as ranges (a match may span
 * several text nodes: the code's colour spans, a link inside a line).
 */
export function rangesIn(root: Node, at: (text: string) => readonly number[], len: number): Range[] {
  const nodes: Text[] = [];
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n !== null; n = walk.nextNode()) nodes.push(n as Text);
  const starts: number[] = [];
  let text = '';
  for (const n of nodes) {
    starts.push(text.length);
    text += n.data;
  }
  // the text node and offset at a place in the joined words
  const place = (pos: number, end: boolean): [Text, number] | null => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const s = starts[i] ?? 0;
      const node = nodes[i];
      if (node !== undefined && (end ? pos > s : pos >= s)) return [node, pos - s];
    }
    return null;
  };
  if (len <= 0) return [];
  return at(text).flatMap((m) => {
    const a = place(m, false);
    const b = place(m + len, true);
    if (a === null || b === null) return [];
    const r = document.createRange();
    r.setStart(a[0], a[1]);
    r.setEnd(b[0], b[1]);
    return [r];
  });
}
