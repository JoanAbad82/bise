// One update card for the machine (update-dot, Gabriel m_46040, architect m_46059): every hub
// opens its own `update` card for the same release (kind `update`, place `release:<id>`, the
// switchboard's release_line.rs), so the window groups them by that typed place and shows one: in
// the inbox's list, the capsule, the Dock's badge and the notifications. A display matter only:
// his answer goes to the one hub whose card he answers, and every hub closes its own card at its
// next look at the machine's files. Pure (no React, no store, no Electron), shared by the renderer
// and the main process, so it lives beside api.ts. Owner: amb-home.

/** The update card's place prefix (release_line.rs place_of). */
export const RELEASE_PLACE = 'release:';

/** Any card shape as it came off the wire: the functions check the fields themselves. */
export type PlaceCard = { readonly kind?: unknown; readonly place?: unknown };

/** An update card: kind `update` about a place `release:<id>`. */
export function isUpdate(c: PlaceCard): boolean {
  return c.kind === 'update' && typeof c.place === 'string' && c.place.startsWith(RELEASE_PLACE);
}

/** The release an update card is about (its place); '' for any other card. */
export function releaseKey(c: PlaceCard): string {
  return isUpdate(c) ? (c.place as string) : '';
}

/**
 * The cards to show: each release's update cards as one, bise's own (the home hub's) when it has
 * one, else the first in the given order; every other card as it came, in its place. Pure.
 */
export function oneUpdate<T extends PlaceCard & { readonly project: string }>(cards: readonly T[], home: string): T[] {
  const pick = new Map<string, T>();
  for (const c of cards) {
    const k = releaseKey(c);
    if (k === '') continue;
    const was = pick.get(k);
    if (was === undefined || (was.project !== home && c.project === home)) pick.set(k, c);
  }
  if (pick.size === 0) return [...cards];
  const keep = new Set(pick.values());
  return cards.filter((c) => !isUpdate(c) || keep.has(c));
}

/**
 * How many cards wait in these arrays (every hub's): each card once, a release's update cards
 * once between them. Pure.
 */
export function countOnce(arrays: readonly (readonly unknown[])[]): number {
  let n = 0;
  const rels = new Set<string>();
  for (const a of arrays)
    for (const c of a) {
      const k = typeof c === 'object' && c !== null ? releaseKey(c) : '';
      if (k === '') n += 1;
      else rels.add(k);
    }
  return n + rels.size;
}

/**
 * Which of a batch of new cards knock as a notification: a release's update card knocks once,
 * the first of it in the batch, never again once one knocked (`posted`); every other card as it
 * comes. Pure.
 */
export function knockOnce<T extends PlaceCard>(fresh: readonly T[], posted: ReadonlySet<string>): { readonly post: readonly T[]; readonly keys: readonly string[] } {
  const post: T[] = [];
  const keys: string[] = [];
  for (const c of fresh) {
    const k = releaseKey(c);
    if (k !== '' && (posted.has(k) || keys.includes(k))) continue;
    post.push(c);
    if (k !== '') keys.push(k);
  }
  return { post, keys };
}
