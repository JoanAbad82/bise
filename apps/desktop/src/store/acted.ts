// The cards he answered or closed in this window, until the hub's rows drop them (card-state, his
// #384 came back on a project switch). One owner: the Store sets an entry in answer() and close(),
// whichever view he acted from (the inbox block, a thread's strip, the capsule, a review), and
// a project's rows take it out (once that project's row is loaded and no longer lists the card),
// the hub's answer to that request while its rows still list the card and not `running` (it kept it
// open: actedAnswered; `running`: it carries out his answer, the card stays his answered one),
// or the error to that very request (the window-local 'card_refused', architect m_23524: the card
// shows again). Every view reads the same set (useActed), so a remount, a project switch or a reload (the
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

/** How long an entry may hide a card the hub's rows still list (the hub answers in ms). */
export const ACTED_STALE_MS = 60_000;

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
 * a reload, a hub starting), keeps its entries. An entry older than ACTED_STALE_MS whose loaded
 * row still lists the card goes too: the hub answers in milliseconds, so the hub kept it open and
 * its answer never came here (a window reloaded before it, a set kept by an older build); unless
 * the row says `running` (the hub carries out his answer, minutes for a merge). The same list back
 * when nothing went (the slice's reference holds). Pure.
 */
export function actedPrune(list: readonly Acted[], rows: readonly Pick<ProjectRow, "project" | "cards">[], nowMs: number): readonly Acted[] {
  if (list.length === 0) return list;
  const open = new Map(rows.flatMap((r) => (r.cards == null ? [] : [[r.project, new Map(r.cards.map((c) => [c.id, c.running === true]))] as const])));
  const next = list.filter((a) => {
    const cards = open.get(a.project);
    if (cards === undefined) return true;
    const running = cards.get(a.card);
    if (running === undefined) return false;
    // inbox-reappear: the hub carries out his answer (a merge, a try build, an update): his still
    return running || nowMs - a.at_ms < ACTED_STALE_MS;
  });
  return next.length === list.length ? list : next;
}

/**
 * The hub answered his answer to `card` (the window-local 'card_answered'): the rows it sent before
 * its answer say what the answer did (the hub broadcasts a step's cards before it answers the
 * request, the core emits the rows on them). A loaded row that still lists the card: the hub kept
 * it open (a drafts card's '1. review' or his words on it, an older hub's no-op), so the entry goes
 * and the card is his again in every view. The ghost it fixes: the sidebar counted the card from
 * the rows while every inbox hid it, until a relaunch. A row that lists it `running` (the hub
 * carries out his answer: a merge, a try build, an update) keeps the entry until the hub closes the
 * card (inbox-reappear, his #780: the merge question came back while it ran). Pure.
 */
export function actedAnswered(list: readonly Acted[], project: string, card: number, rows: readonly Pick<ProjectRow, "project" | "cards">[]): readonly Acted[] {
  const key = actedKey(project, card);
  if (!list.some((a) => a.key === key)) return list;
  const row = rows.find((r) => r.project === project)?.cards?.find((c) => c.id === card);
  return row !== undefined && row.running !== true ? list.filter((a) => a.key !== key) : list;
}

/** The keys, for a view's filter. Pure. */
export function actedKeys(list: readonly Acted[]): ReadonlySet<string> {
  return new Set(list.map((a) => a.key));
}

/**
 * The window-local 'card_refused' (never a hub event, main's ipc.ts): the error to this window's
 * card/answer or card/close request for that card (the hub's or the core's words), or the core
 * gone before it answered. Pure.
 */
export function cardRefusedOf(raw: unknown): { project: string; card: number; text: string } | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r["ev"] !== "card_refused" || typeof r["project"] !== "string" || typeof r["card"] !== "number" || typeof r["text"] !== "string") return null;
  return { project: r["project"], card: r["card"], text: r["text"] };
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
