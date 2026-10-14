// The composer's tab (designer's composer-strip A, his pick, m_23965): who and where his words go,
// glued to the box's top. 'to perf' + the gust while it works, 'ψ sb/perf' (or 'shared folder'),
// the project where the crumb doesn't name it, and on the right 'context 42k · 17%'. Short, it
// drops whole items: the project, then the context, then the branch; the label always stays.
// Answering a card: 'answering search · <question>' and 'esc write to search' on the right.
// Pure: ComposerTab.tsx draws and measures it. Owner: amb-win.

/** What the tab says. */
export interface TabWords {
  /** 'to perf', 'answering search · which size…', 'to perf · voice paused', 'to perf · about “…”' */
  readonly label: string;
  /** where it works: its worktree's branch, '' for the shared folder; undefined: not said (bise) */
  readonly branch?: string | undefined;
  /** the project's name, only where the screen's crumb doesn't name it */
  readonly project?: string | undefined;
  /** 'context 42k · 17%' ('' or undefined: none, as at 0%) */
  readonly context?: string | undefined;
}

/** The branch item's words: 'sb/perf', or 'shared folder' in his own checkout. Pure. */
export function placeWords(branch: string): string {
  return branch === '' ? 'shared folder' : branch;
}

/** Where an agent works, as the tab says it: its worktree's branch, else '' (the shared folder);
 *  undefined for bise's own main (no folder of a project). Pure. */
export function placeOf(a: { branch?: string | null } | undefined, home: boolean): string | undefined {
  if (a === undefined || home) return undefined;
  return a.branch ?? '';
}

/** Which optional items fit beside the label. */
export interface TabFit {
  readonly branch: boolean;
  readonly project: boolean;
  readonly context: boolean;
}

/**
 * The items that fit in `avail` px: the label always; then each optional item whole or not at all,
 * the project dropped first, then the context, then the branch (designer m_23965 (2)). `gap` is
 * the space between two items. A width of 0 is an item that isn't there. Pure.
 */
export function tabFit(w: { avail: number; gap: number; label: number; branch: number; project: number; context: number }): TabFit {
  const sum = (on: TabFit): number => {
    const items = [w.label, on.branch ? w.branch : 0, on.project ? w.project : 0, on.context ? w.context : 0].filter((x) => x > 0);
    return items.reduce((n, x) => n + x, 0) + w.gap * Math.max(0, items.length - 1);
  };
  const tries: TabFit[] = [
    { branch: true, project: true, context: true },
    { branch: true, project: false, context: true },
    { branch: true, project: false, context: false },
  ];
  for (const t of tries) if (sum(t) <= w.avail) return t;
  return { branch: false, project: false, context: false };
}

/**
 * The label cut to fit `room` px after a whole word, with the one '…' (designer m_24325: never
 * mid-word): the whole label when it fits; the longest run of whole words that fits with the '…'
 * (a trailing '·' or ',' goes with the cut); its first word and the '…' when not even that fits
 * (the tab's own clip then). `width` measures a string in the label's font. Pure.
 */
export function wordCut(label: string, room: number, width: (s: string) => number): string {
  if (width(label) <= room) return label;
  const words = label.split(' ');
  for (let n = words.length - 1; n >= 1; n--) {
    const head = words.slice(0, n).join(' ').replace(/[\s·,:;]+$/u, '');
    if (head === '') continue;
    const cut = `${head}…`;
    if (width(cut) <= room) return cut;
  }
  return `${words[0] ?? ''}…`;
}
