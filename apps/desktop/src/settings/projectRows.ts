// settings › projects, its rows' pure parts (designer m_41841): the folder said short, and where a
// dragged row lands. Pure. Owner: amb-home.

/** the path's longest, in characters, before its middle goes to '…' */
export const PATH_MAX = 40;

/**
 * A project's folder as its row says it: home folded to '~', and past `max` characters its middle
 * cut ('~/lab/…/harness'): its first folder after the root and its last one stay, never cut
 * themselves. The tip keeps the whole path. Pure.
 */
export function shortPath(path: string, home: string | undefined, max = PATH_MAX): string {
  const p = home !== undefined && home !== '' && path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path;
  if (p.length <= max) return p;
  const parts = p.split('/');
  // '~/lab/x/y/harness' → ['~', 'lab', 'x', 'y', 'harness']; '/opt/a/b' → ['', 'opt', 'a', 'b']
  if (parts.length <= 3) return p;
  const head = parts.slice(0, 2).join('/');
  const last = parts[parts.length - 1] ?? '';
  return `${head}/…/${last}`;
}

/**
 * Where a dragged row goes: the index it takes in the list, from the pointer's y and each row's
 * vertical middle (top to bottom). Past a row's middle it goes after it. Pure.
 */
export function dropIndex(middles: readonly number[], y: number): number {
  let i = 0;
  while (i < middles.length && y > (middles[i] ?? 0)) i += 1;
  return i;
}

/**
 * The order the core is told after a drop: project_move's index in his list, 0-based (0 = first
 * after bise's home: bise_home::projects::move_to), or null when the row stays where it was. `to`
 * counts the slots of the list with the row still in it. Settings and the sidebar's drag both
 * move through it, the one way to say where a row goes (architect m_49117). Pure.
 */
export function movedTo(from: number, to: number): number | null {
  const at = to > from ? to - 1 : to;
  return at === from ? null : at;
}

/** The list once the row at `from` went to index `at` (movedTo's): what the core will say. Pure. */
export function movedList<T>(list: readonly T[], from: number, at: number): T[] {
  const out = [...list];
  const [row] = out.splice(from, 1);
  if (row === undefined) return out;
  out.splice(Math.min(at, out.length), 0, row);
  return out;
}
