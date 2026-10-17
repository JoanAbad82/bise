// The cards slice of the window's machine (fast-try p4 slice 1, architect m_29689): his answers
// and closes in flight and how they settle, as step(state, facts, input) -> [state, outputs].
// What it holds is the window's own: the cards he acted on here that the hub's rows still list
// (acted.ts), the refused ones with their words and what he sent (refused.ts), where he was for
// each answer on its way and where he made each one the hub took (answered.ts), and where the
// window goes after one (jump). Open or closed, answered or not: the hub's rows (HubFacts) and
// card/answer's result or error (main's card_answered / card_refused) say it; step only reflects
// them with acted.ts / refused.ts / answered.ts's rules, never one of its own. An input that
// changes nothing gives the same state back and no output (the hooks re-render on a new
// reference only). A kept list is written in the same order as today's store wrote it.
// Pure. Owner: amb-core.
import { inboxCards, withRefused, type InboxItem } from "@/inbox/listed";
import { actedAdd, actedAnswered, actedKey, actedOf, actedPrune, type Acted } from "../acted";
import { refusedAdd, refusedDrop, refusedListOf, refusedOf, refusedPrune, type Attempt, type Refused } from "../refused";
import { answeredFromOf, answersOf, cardKeyOf, jumpOf, keptAnswers, type AnswerAt, type AnswerFrom, type AnsweredFrom } from "../answered";
import type { HubFacts, Input, Intent, Output, WinEv } from "./types";

/** Where the window goes for an answer the hub took: that thread, at that card's answer; `seq` counts them. */
export interface AnswerJump extends AnswerAt {
  readonly card: number;
  readonly seq: number;
}

export interface CardsState {
  /** the cards he answered or closed here that the hub's rows still list: every view leaves them out */
  readonly acted: readonly Acted[];
  /** the cards whose answer or close was refused here: their words, what he sent */
  readonly refused: readonly Refused[];
  /** what he sent for each card on its way (by actedKey): a refusal keeps it for 'try again' */
  readonly attempts: Readonly<Record<string, Attempt>>;
  /** where he was for each answer on its way (by cardKeyOf), until its result comes */
  readonly answering: Readonly<Record<string, AnswerFrom>>;
  /** where he made each answer this window sent that the hub took (oldest first) */
  readonly answersFrom: readonly AnsweredFrom[];
  /** the newest jump to an answer the hub took; null before any */
  readonly jump: AnswerJump | null;
}

const NONE: readonly never[] = [];

/**
 * The inbox's one view (architect m_29221 #2): every project's open items in the hub's order, the
 * ones he acted on here left out, each with the refusal of his act on it here. Pure.
 */
export function inboxView(s: CardsState, f: HubFacts): InboxItem[] {
  return withRefused(inboxCards(f.rows, s.acted), s.refused);
}

/** The slice at the window's start: his kept lists read back (none: a test with no keep). Pure. */
export function cardsInit(read: ((key: string) => unknown) | null): CardsState {
  return {
    acted: read === null ? NONE : actedOf(read("acted")),
    refused: read === null ? NONE : refusedListOf(read("refused")),
    attempts: {},
    answering: {},
    answersFrom: read === null ? NONE : answersOf(read("answered-from")),
    jump: null,
  };
}

type Step = readonly [CardsState, readonly Output[]];

/** One input. `f`: the hubs' facts, already updated with this input's event. Pure. */
export function stepCards(s: CardsState, f: HubFacts, input: Input): Step {
  switch (input.in) {
    case "ev":
      return input.ev.ev === "projects" ? rowsCame(s, f, input.at_ms) : [s, NONE];
    case "win":
      return settled(s, f, input.ev, input.at_ms);
    case "do":
      return does(s, input.intent, input.at_ms);
  }
}

/** The outputs that keep `next`'s lists that changed from `s`'s, in this order. */
function kept(s: CardsState, next: CardsState, order: readonly ("acted" | "refused")[]): Output[] {
  const out: Output[] = [];
  for (const k of order) {
    if (k === "acted" && next.acted !== s.acted) out.push({ out: "keep", key: "acted", value: next.acted });
    if (k === "refused" && next.refused !== s.refused) out.push({ out: "keep", key: "refused", value: next.refused });
  }
  return out;
}

function without<T>(r: Readonly<Record<string, T>>, key: string): Readonly<Record<string, T>> {
  return Object.hasOwn(r, key) ? Object.fromEntries(Object.entries(r).filter(([k]) => k !== key)) : r;
}

/** The hub's rows came: the cards they no longer list come back to nothing (acted.ts, refused.ts). */
function rowsCame(s: CardsState, f: HubFacts, at: number): Step {
  const acted = actedPrune(s.acted, f.rows, at);
  const refused = refusedPrune(s.refused, f.rows);
  // what he sent matters only while it is on its way (acted)
  const on = new Set(acted.map((a) => a.key));
  const gone = Object.keys(s.attempts).filter((k) => !on.has(k));
  const attempts = gone.length === 0 ? s.attempts : Object.fromEntries(Object.entries(s.attempts).filter(([k]) => on.has(k)));
  if (acted === s.acted && refused === s.refused && attempts === s.attempts) return [s, NONE];
  const next = { ...s, acted, refused, attempts };
  return [next, kept(s, next, ["acted", "refused"])];
}

/** Main's answer to this window's own card request. */
function settled(s: CardsState, f: HubFacts, ev: WinEv, at: number): Step {
  const key = actedKey(ev.project, ev.card);
  const k = cardKeyOf(ev.project, ev.card);
  if (ev.ev === "card_refused") {
    // the card is his again in every view, the words on that card (refused.ts)
    const next: CardsState = {
      ...s,
      answering: without(s.answering, k),
      acted: s.acted.filter((x) => x.key !== key),
      refused: refusedAdd(s.refused, ev.project, ev.card, ev.text, at, s.attempts[key]),
      attempts: without(s.attempts, key),
    };
    return [next, kept(s, next, ["acted", "refused"])];
  }
  // the hub took it: no refusal of it holds; its rows came before its answer, so a card they still
  // list is one the hub kept open (acted.ts)
  const base: CardsState = {
    ...s,
    refused: refusedDrop(s.refused, ev.project, ev.card),
    attempts: without(s.attempts, key),
    acted: actedAnswered(s.acted, ev.project, ev.card, f.rows),
    answering: without(s.answering, k),
  };
  const out = kept(s, base, ["refused", "acted"]);
  const from = s.answering[k];
  if (from === undefined) return same(s, base) ? [s, NONE] : [base, out];
  const got = answeredFromOf(from, ev.project, ev.card, ev.answer, at);
  const answersFrom = got === null ? s.answersFrom : keptAnswers(s.answersFrom, got);
  if (got !== null) out.push({ out: "keep", key: "answered-from", value: answersFrom });
  const home = f.rows.find((p) => p.home)?.project ?? "";
  const to = jumpOf(from, ev.project, home, ev.answer !== null);
  const jump = to === null ? s.jump : { ...to, card: ev.card, seq: (s.jump?.seq ?? 0) + 1 };
  return [{ ...base, answersFrom, jump }, out];
}

function same(a: CardsState, b: CardsState): boolean {
  return a.acted === b.acted && a.refused === b.refused && a.attempts === b.attempts && a.answering === b.answering;
}

/** His gesture on a card. */
function does(s: CardsState, intent: Intent, at: number): Step {
  switch (intent.i) {
    case "answer": {
      const { project, card, reply, files, parts, from } = intent;
      // answer-in-thread A: where he was, for the row's 'answered from …' and the jump (answered.ts)
      const answering = from === undefined ? s.answering : { ...s.answering, [cardKeyOf(project, card)]: from };
      const [next, out] = acts({ ...s, answering }, project, card, at, {
        kind: "answer",
        reply,
        ...(files !== undefined ? { files } : {}),
        ...(parts !== undefined ? { parts } : {}),
        ...(from !== undefined ? { from } : {}),
      });
      out.push({
        out: "cmd",
        cmd: {
          cmd: "answer",
          project,
          card,
          reply,
          ...(files !== undefined && files.length > 0 ? { files: [...files] } : {}),
          ...(parts !== undefined && parts.length > 0 ? { parts: [...parts] } : {}),
        },
      });
      return [next, out];
    }
    case "close": {
      const [next, out] = acts(s, intent.project, intent.card, at, { kind: "close" });
      out.push({ out: "cmd", cmd: { cmd: "close", project: intent.project, card: intent.card } });
      return [next, out];
    }
    case "retry_card": {
      // what he sent, sent again; none known: nothing, the card stays his
      const a = refusedOf(s.refused, intent.project, intent.card)?.attempt;
      if (a === undefined) return [s, NONE];
      if (a.kind === "close") return does(s, { i: "close", project: intent.project, card: intent.card }, at);
      return does(
        s,
        {
          i: "answer",
          project: intent.project,
          card: intent.card,
          reply: a.reply,
          ...(a.files !== undefined ? { files: a.files } : {}),
          ...(a.parts !== undefined ? { parts: a.parts } : {}),
          ...(a.from !== undefined ? { from: a.from } : {}),
        },
        at,
      );
    }
  }
}

/** He answered or closed it: out of every view until the hub's rows drop it, or its refusal; its last refusal goes. */
function acts(s: CardsState, project: string, card: number, at: number, attempt: Attempt): [CardsState, Output[]] {
  const next: CardsState = {
    ...s,
    acted: actedAdd(s.acted, project, card, at),
    refused: refusedDrop(s.refused, project, card),
    attempts: { ...s.attempts, [actedKey(project, card)]: attempt },
  };
  return [next, kept(s, next, ["acted", "refused"])];
}
