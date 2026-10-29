// ⌘F in a process's output, pure: the next match of his words in the terminal's lines (xterm's
// buffer read as text), from after the last one, wrapping at the end; case-blind. The view selects
// it and scrolls to its line. Owner: procs-desktop.

export interface Hit {
  readonly row: number;
  readonly col: number;
  readonly len: number;
}

/** The match after `from` (none: from the top), else the first one from the top; null: none. */
export function nextHit(lines: readonly string[], words: string, from: Hit | null): Hit | null {
  const w = words.toLowerCase();
  if (w === '') return null;
  const low = lines.map((l) => l.toLowerCase());
  const scan = (row0: number, col0: number): Hit | null => {
    for (let row = row0; row < low.length; row++) {
      const col = (low[row] ?? '').indexOf(w, row === row0 ? col0 : 0);
      if (col >= 0) return { row, col, len: words.length };
    }
    return null;
  };
  return (from === null ? null : scan(from.row, from.col + 1)) ?? scan(0, 0);
}
