// The cards he answered or closed in this window, until the hub's rows drop them (card-state, his
// #384 came back on a project switch). One owner: the Store sets an entry in answer() and close(),
// whichever view he acted from (the inbox block, a thread's strip, the capsule, a review), and
// only a project's rows take it out: once that project's row is loaded and no longer lists the
// card. Every view reads the same set (useActed), so a remount, a project switch or a reload (the
// set is kept with his asides) never shows a card he answered while the hub drops it. The hub
// stays the only owner of open and closed: an entry hides a card, it never closes one. Pure.
// Owner: amb-home.
import type { ProjectRow } from "@/proto";

/** A card he answered or closed here, its rows not caught up yet. */
export interface Acted {
  /** `${project}-${card}`, the inbox's cardKey */
  readonly key: string;
  readonly project: string;
  readonly card: number;
  readonly at_ms: number;
}

/** How many the window keeps (the newest): a hub that never answers can't grow it. */
export const ACTED_KEPT = 50;

/** The inbox's cardKey (inbox/order.ts), word for word: the views filter their cards on it. */
export const actedKey = (project: string, card: number): string => `${project}-${String(card)}`;

/** He acted on `card`: it joins the set (once, the newest last). Pure. */
export function actedAdd(list: readonly Acted[], project: string, card: number, atMs: number): readonly Acted[] {
  const key = actedKey(project, card);
  return [...list.filter((a) => a.key !== key), { key, project, card, at_ms: atMs }].slice(-ACTED_KEPT);
}

/**
 * The hub's rows came: an entry goes once its project's row is there and lists the card no more
 * (the hub closed it). A project not in the rows, or whose row has no cards field yet (not loaded:
 * a reload, a hub starting), keeps its entries. The same list back when nothing went (the slice's
 * reference holds). Pure.
 */
export function actedPrune(list: readonly Acted[], rows: readonly Pick<ProjectRow, "project" | "cards">[]): readonly Acted[] {
  if (list.length === 0) return list;
  const open = new Map(rows.flatMap((r) => (r.cards == null ? [] : [[r.project, new Set(r.cards.map((c) => c.id))] as const])));
  const next = list.filter((a) => open.get(a.project)?.has(a.card) ?? true);
  return next.length === list.length ? list : next;
}

/** The keys, for a view's filter. Pure. */
export function actedKeys(list: readonly Acted[]): ReadonlySet<string> {
  return new Set(list.map((a) => a.key));
}

/** The window-local 'card_closed' (never a hub event): card/close's result for a card this window closed. Pure. */
export function cardClosedOf(raw: unknown): { project: string; card: number } | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r["ev"] !== "card_closed" || typeof r["project"] !== "string" || typeof r["card"] !== "number") return null;
  return { project: r["project"], card: r["card"] };
}

/** The kept set read back (a reload, a relaunch): anything unreadable is dropped. Pure. */
export function actedOf(raw: unknown): readonly Acted[] {
  if (!Array.isArray(raw)) return [];
  const ok = (x: unknown): x is Acted => {
    if (typeof x !== "object" || x === null) return false;
    const r = x as Record<string, unknown>;
    return typeof r["project"] === "string" && typeof r["card"] === "number" && typeof r["at_ms"] === "number" && r["key"] === actedKey(r["project"], r["card"]);
  };
  return raw.filter(ok).slice(-ACTED_KEPT);
}
