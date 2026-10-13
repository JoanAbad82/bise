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

/** What the window knew when he answered: where he was, who asked, and his words as it shows them. */
export interface AnswerFrom {
  readonly at: AnswerAt | null;
  readonly asker: string;
  /** his words as the inbox draws them: the option's words for a pick, else what he typed */
  readonly words: string;
}

/** His answer, drawn in the thread he answered from: the hub's 'you answered' words. */
export interface Aside {
  /** `${project}/${card}`: one per card */
  readonly key: string;
  /** the card's project, and its name as the window draws it */
  readonly project: string;
  readonly card: number;
  /** 'you answered gift-ui' (the hub's head; words after ':' are his) */
  readonly notice: string;
  /** his words when they don't fit on the head's line */
  readonly note: string;
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

/** The hub already writes the row in the asker's thread and in the card project's main thread. Pure. */
export function rowThere(at: AnswerAt, project: string, asker: string): boolean {
  return at.project === project && (at.agent === asker || at.agent === "main");
}

/**
 * The row for his answer where he was, or null when the hub's row is there already. `answer`
 * null: an older hub (or a page took it) answered {}: the window's own words, 'you answered
 * <asker>: <words>'. Pure.
 */
export function asideOf(
  from: AnswerFrom,
  project: string,
  card: number,
  answer: CardAnswer | null,
  atMs: number,
): { at: AnswerAt; aside: Aside } | null {
  const at = from.at;
  if (at === null) return null;
  const asker = answer?.agent ?? from.asker;
  if (rowThere(at, project, asker)) return null;
  const notice =
    answer !== null ? answer.notice : oneLine(from.words) ? `you answered ${asker}: ${from.words.trim()}` : `you answered ${asker}`;
  const note = answer !== null ? (answer.note ?? "") : oneLine(from.words) ? "" : from.words.trim();
  return {
    at,
    aside: { key: `${project}/${String(card)}`, project, card, notice, note, at_ms: atMs },
  };
}

/** How many of his rows a thread keeps (the newest): the window keeps them, not the hub. */
export const ASIDES_KEPT = 20;

/** A thread's list as kept: one per card, the newest ASIDES_KEPT. Pure. */
export function keptAsides(list: readonly Aside[]): readonly Aside[] {
  return list.slice(-ASIDES_KEPT);
}

/** A kept list read back (a reload, a relaunch): anything unreadable is dropped. Pure. */
export function asidesOf(raw: unknown): readonly Aside[] {
  if (!Array.isArray(raw)) return [];
  const ok = (x: unknown): x is Aside => {
    if (typeof x !== "object" || x === null) return false;
    const r = x as Record<string, unknown>;
    return (
      typeof r["key"] === "string" &&
      typeof r["project"] === "string" &&
      typeof r["card"] === "number" &&
      typeof r["notice"] === "string" &&
      typeof r["note"] === "string" &&
      typeof r["at_ms"] === "number"
    );
  };
  return keptAsides(raw.filter(ok));
}

// words::answered_split's rule: one line, short enough to sit on the head's line
const ON_THE_LINE = 48;
function oneLine(words: string): boolean {
  const w = words.trim();
  return w !== "" && !w.includes("\n") && Array.from(w).length <= ON_THE_LINE;
}
