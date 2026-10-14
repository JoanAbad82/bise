// The cards whose answer or close the hub (or the core) refused in this window, with its words
// (try-gate-f2a7: the words showed only as the card's project error line, never where he answered,
// and stayed after the hub then took the late answer). One owner: the Store sets an entry on the
// window-local 'card_refused' and takes it out when he acts on that card again (an answer, a close,
// 'try again'), when that card's 'card_answered' comes, or when the hub's rows drop the card (the
// hub took the late answer, or the card went). Every view that draws the card reads it (useRefused):
// 'not sent: <words> · try again' on the card that came back, wherever he is, across a project
// switch and a reload (the list is kept with his asides). Nothing goes on the project's line. Pure.
// Owner: amb-home.
import type { Part, ProjectRow } from "@/proto";
import { actedKey } from "./acted";
import type { AnswerFrom } from "./asides";

/** What he sent, to send it again ('try again'). */
export type Attempt =
  | {
      readonly kind: "answer";
      readonly reply: string;
      readonly files?: readonly string[];
      readonly parts?: readonly Part[];
      readonly from?: AnswerFrom;
    }
  | { readonly kind: "close" };

/** A card whose answer or close was refused here, until he acts again or the rows drop it. */
export interface Refused {
  /** `${project}-${card}`, the inbox's cardKey */
  readonly key: string;
  readonly project: string;
  readonly card: number;
  /** the hub's (or the core's) words */
  readonly text: string;
  readonly at_ms: number;
  /** what he sent: none when the window no longer knew (a reload before the refusal) */
  readonly attempt?: Attempt;
}

/** How many the window keeps (the newest). */
export const REFUSED_KEPT = 50;

/** The refusal of `card` joins the list (once, the newest last). Pure. */
export function refusedAdd(list: readonly Refused[], project: string, card: number, text: string, atMs: number, attempt?: Attempt): readonly Refused[] {
  const key = actedKey(project, card);
  const r: Refused = { key, project, card, text, at_ms: atMs, ...(attempt !== undefined ? { attempt } : {}) };
  return [...list.filter((x) => x.key !== key), r].slice(-REFUSED_KEPT);
}

/** He acted on `card` again, or the hub answered it: its refusal goes. The same list when it had none. Pure. */
export function refusedDrop(list: readonly Refused[], project: string, card: number): readonly Refused[] {
  const key = actedKey(project, card);
  return list.some((x) => x.key === key) ? list.filter((x) => x.key !== key) : list;
}

/**
 * The hub's rows came: a refusal goes once its project's row is loaded and lists the card no more
 * (the hub took the late answer or close, or the card went). A project not in the rows, or not
 * loaded yet, keeps its entries. The same list back when nothing went. Pure.
 */
export function refusedPrune(list: readonly Refused[], rows: readonly Pick<ProjectRow, "project" | "cards">[]): readonly Refused[] {
  if (list.length === 0) return list;
  const open = new Map(rows.flatMap((r) => (r.cards == null ? [] : [[r.project, new Set(r.cards.map((c) => c.id))] as const])));
  const next = list.filter((x) => open.get(x.project)?.has(x.card) ?? true);
  return next.length === list.length ? list : next;
}

/** The refusal of `card`, or null. Pure. */
export function refusedOf(list: readonly Refused[], project: string, card: number): Refused | null {
  const key = actedKey(project, card);
  return list.find((x) => x.key === key) ?? null;
}

/** The kept list read back (a reload, a relaunch): anything unreadable is dropped. Pure. */
export function refusedListOf(raw: unknown): readonly Refused[] {
  if (!Array.isArray(raw)) return [];
  const ok = (x: unknown): x is Refused => {
    if (typeof x !== "object" || x === null) return false;
    const r = x as Record<string, unknown>;
    if (typeof r["project"] !== "string" || typeof r["card"] !== "number" || typeof r["text"] !== "string" || typeof r["at_ms"] !== "number") return false;
    if (r["key"] !== actedKey(r["project"], r["card"])) return false;
    const a = r["attempt"];
    if (a === undefined) return true;
    if (typeof a !== "object" || a === null) return false;
    const k = (a as Record<string, unknown>)["kind"];
    return k === "close" || (k === "answer" && typeof (a as Record<string, unknown>)["reply"] === "string");
  };
  return raw.filter(ok).slice(-REFUSED_KEPT);
}

/** The line on the card that came back. Pure. */
export const refusedLine = (text: string): string => `not sent: ${text.replace(/[\s.]+$/u, "")}`;
