// answer-in-thread A (his pick, designer m_24425/m_24628, ambient-lead m_24432): his answer to a
// card lives where the question was asked, never in the thread he answered from (the old 'aside'
// bubble is gone). What the window keeps of an answer it sent: where he was when he sent it, so the
// hub's row says 'answered from bise · 09:55' (the hub doesn't know it; kept across a reload and a
// relaunch); and where the window goes on send: the asking project's main thread at his answer,
// unless the card is bise's own or of the project in view. From card/answer's result (the
// window-local event 'card_answered' main's ipc.ts sends to the window that answered). Pure.
// Owner: amb-home.
import type { CardAnswer } from "@/proto";

/** The thread he was in when he answered (bise's view: its home project's main). */
export interface AnswerAt {
  readonly project: string;
  readonly agent: string;
}

/** What the window knew when he answered: the thread he was in, or the inbox screen. */
export interface AnswerFrom {
  readonly at: AnswerAt | null;
  /** answered on the inbox screen (no thread) */
  readonly inbox?: true;
}

/** Where his answer to card `card` of `project` was made, and when: the window's own fact. */
export interface AnsweredFrom {
  /** `${project}/${card}`: one per card */
  readonly key: string;
  readonly project: string;
  readonly card: number;
  /** the thread he was in, or 'inbox' (the inbox screen) */
  readonly from: AnswerAt | "inbox";
  readonly at_ms: number;
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

export function cardKeyOf(project: string, card: number): string {
  return `${project}/${String(card)}`;
}

/**
 * What the window keeps of an answer the hub took: where he made it. Only the hub's word that it
 * took the answer counts (card-state): `answer` null ({}: the step closed no card, a hub item's
 * digit it acts on later, words it refused, an older hub) keeps nothing; nor an answer made from
 * nowhere the window knows (the capsule's own window). Pure.
 */
export function answeredFromOf(from: AnswerFrom, project: string, card: number, answer: CardAnswer | null, atMs: number): AnsweredFrom | null {
  if (answer === null) return null;
  const where = from.inbox === true ? "inbox" : from.at;
  if (where === null) return null;
  return { key: cardKeyOf(project, card), project, card, from: where, at_ms: atMs };
}

/**
 * Where the window goes once the hub took his answer (designer's rules A): the asking project's
 * main thread, at his answer. Nowhere when bise asked (its home project), when the card is of the
 * project he is in, when the hub didn't take it, or from the inbox screen (it shows his answer
 * itself). Pure.
 */
export function jumpOf(from: AnswerFrom, project: string, home: string, taken: boolean): AnswerAt | null {
  if (!taken || from.inbox === true || from.at === null) return null;
  if (project === home || from.at.project === project) return null;
  return { project, agent: "main" };
}

/** How many answers' places the window keeps (the newest): his, not the hub's. */
export const ANSWERS_KEPT = 200;

/** The kept list: one per card, the newest ANSWERS_KEPT. Pure. */
export function keptAnswers(list: readonly AnsweredFrom[], add: AnsweredFrom): readonly AnsweredFrom[] {
  return [...list.filter((a) => a.key !== add.key), add].slice(-ANSWERS_KEPT);
}

/** The kept list read back (a reload, a relaunch): anything unreadable is dropped. Pure. */
export function answersOf(raw: unknown): readonly AnsweredFrom[] {
  if (!Array.isArray(raw)) return [];
  const at = (x: unknown): boolean => {
    if (x === "inbox") return true;
    if (typeof x !== "object" || x === null) return false;
    const r = x as Record<string, unknown>;
    return typeof r["project"] === "string" && typeof r["agent"] === "string";
  };
  const ok = (x: unknown): x is AnsweredFrom => {
    if (typeof x !== "object" || x === null) return false;
    const r = x as Record<string, unknown>;
    return typeof r["key"] === "string" && typeof r["project"] === "string" && typeof r["card"] === "number" && at(r["from"]) && typeof r["at_ms"] === "number";
  };
  return raw.filter(ok).slice(-ANSWERS_KEPT);
}
