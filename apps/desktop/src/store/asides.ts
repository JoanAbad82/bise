// Inbox picks (3), architect m_22636: his answer to a card, shown where he was when he answered it.
// The hub writes the 'you answered' row in the asker's thread and its project's main thread; an
// answer made from anywhere else (another project, bise's view, another agent's thread) leaves a
// window-local row there, from card/answer's result (AnswerResult, the window-local event
// 'card_answered' main's ipc.ts sends to the window that answered). Pure. Owner: amb-home.
import type { CardAnswer } from "@/proto";

/** The thread he was in when he answered (bise's view: its home project's main). */
export interface AnswerAt {
  readonly project: string;
  readonly agent: string;
}

/** What the window knew when he answered: where he was (the row's words are the hub's alone). */
export interface AnswerFrom {
  readonly at: AnswerAt | null;
}

/** His answer, drawn in the thread he answered from: the hub's 'you answered' words. */
export interface Aside {
  /** `${project}/${card}`: one per card */
  readonly key: string;
  /** the card's project, and its name as the window draws it */
  readonly project: string;
  readonly card: number;
  /**
   * the agent his answer went to (card/answer's `agent`): a click opens its thread at the answer
   * (answered-link); none in a row kept before it was kept (it opens nothing)
   */
  readonly agent?: string;
  /** 'you answered gift-ui' (the hub's head; words after ':' are his) */
  readonly notice: string;
  /** his words when they don't fit on the head's line */
  readonly note: string;
  readonly at_ms: number;
  /**
   * The hub's word drew it (card-state). The build before card-state (0170ed3f) also kept rows
   * in its own words when the hub said nothing (an older hub, a merge item's digit the hub kept):
   * the same shape without this field. A read drops them (asidesOf), the store writes the list
   * back once (stale-aside: '✓ you answered pattern-error-dx' in bise's view, forever).
   */
  readonly by: "hub";
}

/** The window-local 'card_answered' (never a hub event): card/answer's result for a card this window answered. */
export interface CardAnswered {
  readonly project: string;
  readonly card: number;
  /** null: an older hub, or a page took it ({}) */
  readonly answer: CardAnswer | null;
}

export function cardAnsweredOf(raw: unknown): CardAnswered | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r["ev"] !== "card_answered" || typeof r["project"] !== "string" || typeof r["card"] !== "number") return null;
  const a = r["answer"];
  const ok =
    typeof a === "object" &&
    a !== null &&
    typeof (a as Record<string, unknown>)["agent"] === "string" &&
    typeof (a as Record<string, unknown>)["notice"] === "string";
  return { project: r["project"], card: r["card"], answer: ok ? (a as CardAnswer) : null };
}

/** The hub already writes the row in the asker's thread and in the card project's main thread. Pure. */
export function rowThere(at: AnswerAt, project: string, asker: string): boolean {
  return at.project === project && (at.agent === asker || at.agent === "main");
}

/**
 * The row for his answer where he was, or null when the hub's row is there already. Only the
 * hub's word that it took the answer draws 'you answered' (card-state): `answer` null ({}: the
 * step closed no card, a hub item's digit it acts on later, words it refused, an older hub) draws
 * nothing, never the window's own words (his #384: '✓ you answered' on a merge item the hub kept). Pure.
 */
export function asideOf(
  from: AnswerFrom,
  project: string,
  card: number,
  answer: CardAnswer | null,
  atMs: number,
): { at: AnswerAt; aside: Aside } | null {
  const at = from.at;
  if (at === null || answer === null) return null;
  if (rowThere(at, project, answer.agent)) return null;
  return {
    at,
    aside: { key: `${project}/${String(card)}`, project, card, agent: answer.agent, notice: answer.notice, note: answer.note ?? "", at_ms: atMs, by: "hub" },
  };
}

/** How many of his rows a thread keeps (the newest): the window keeps them, not the hub. */
export const ASIDES_KEPT = 20;

/** A thread's list as kept: one per card, the newest ASIDES_KEPT. Pure. */
export function keptAsides(list: readonly Aside[]): readonly Aside[] {
  return list.slice(-ASIDES_KEPT);
}

/**
 * A kept list read back (a reload, a relaunch): anything unreadable is dropped, and a row the hub's
 * word didn't draw (no `by`: the old build's own words, no hub row behind it). Pure.
 */
export function asidesOf(raw: unknown): readonly Aside[] {
  if (!Array.isArray(raw)) return [];
  const ok = (x: unknown): x is Aside => {
    if (typeof x !== "object" || x === null) return false;
    const r = x as Record<string, unknown>;
    return (
      typeof r["key"] === "string" &&
      typeof r["project"] === "string" &&
      typeof r["card"] === "number" &&
      (r["agent"] === undefined || typeof r["agent"] === "string") &&
      typeof r["notice"] === "string" &&
      typeof r["note"] === "string" &&
      typeof r["at_ms"] === "number" &&
      r["by"] === "hub"
    );
  };
  return keptAsides(raw.filter(ok));
}
