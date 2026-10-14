// The composer's tab (designer's composer-strip A, his pick, m_23965): who and where his words go,
// glued to the box's top. 'to perf' + the gust while it works, 'ψ sb/perf' (or 'shared folder'),
// the project where the crumb doesn't name it, and on the right 'context 42k · 17%'. Short, it
// drops whole items: the project, then the context, then the place; the label always stays.
// Answering a card: 'answering search · <question>' and 'esc write to search' on the right.
// Pure: ComposerTab.tsx draws and measures it. Owner: amb-win.

/** Where its words go, as the tab names it (designer m_24790): his checkout by its folder's name,
 *  a worktree by its own folder's name after the ψ; the tip says what it is. */
export interface TabPlace {
  readonly name: string;
  /** a worktree: the ψ before its name, the name mono */
  readonly worktree: boolean;
  readonly tip: string;
}

/** What the tab says. */
export interface TabWords {
  /** 'to perf', 'answering search · which size…', 'to perf · voice paused', 'to perf · about “…”' */
  readonly label: string;
  /** where it works; undefined: not said (bise's own main) */
  readonly place?: TabPlace | undefined;
  /** the project's name, only where the screen's crumb doesn't name it */
  readonly project?: string | undefined;
  /** 'context 42k · 17%' ('' or undefined: none, as at 0%) */
  readonly context?: string | undefined;
}

/** A folder's own name: the last part of its path. Pure. */
export function folderName(path: string): string {
  return path.replace(/\/+$/u, '').split('/').at(-1) ?? path;
}

/** A worktree's name: its folder under ~/.bise/worktrees/<hub>/<name>/<repo>, else its folder's own name. Pure. */
export function worktreeName(path: string): string {
  const parts = path.replace(/\/+$/u, '').split('/');
  const i = parts.lastIndexOf('worktrees');
  return (i >= 0 && parts.length >= i + 3 ? parts[i + 2] : parts.at(-1)) ?? path;
}

/**
 * Where an agent works, as the tab says it (designer m_24790, his m_24782): in a worktree 'ψ <its
 * folder's name>' with wt-sign's signed tip (`wt`, its Place's path and tip words); in his checkout
 * the project folder's name and 'your own folder: <path>'; nothing for bise's own main. Pure.
 */
export function tabPlace(
  a: { branch?: string | null; worktree?: string | null } | undefined,
  home: boolean,
  wt: { path?: string | null; tip: string } | undefined,
  project: string | undefined,
  tilde: (path: string) => string,
): TabPlace | undefined {
  if (a === undefined || home) return undefined;
  if (wt !== undefined && wt.path != null && wt.path !== '') return { name: worktreeName(wt.path), worktree: true, tip: wt.tip };
  if (a.worktree != null && a.worktree !== '') return { name: worktreeName(a.worktree), worktree: true, tip: wt?.tip ?? `ψ worktree: ${tilde(a.worktree)}` };
  if (a.branch != null && a.branch !== '') return { name: a.branch, worktree: true, tip: wt?.tip ?? `ψ worktree, on ${a.branch}` };
  if (project === undefined || project === '') return undefined;
  return { name: folderName(project), worktree: false, tip: `your own folder: ${tilde(project)}` };
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
