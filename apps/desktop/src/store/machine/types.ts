// The window's state machine's shapes (fast-try p4, architect m_29689): every slice is
// step(state, facts, input) -> [state, outputs], pure. Input: one of the core's or a hub's events
// (bise_proto's CoreEv | HubEv), one of main's window-local answers to this window's own requests,
// or one of his gestures (an Intent), stamped with the shell's clock. Output: a command to the core,
// a write to his kept asides, as data; the shell (store.ts) runs them at one edge, in order.
// HubFacts: what the hubs said that several slices read (their last `projects` rows), held once,
// as it came, owned by no slice. Pure, no state. Owner: amb-core.
import type { Part, ProjectRow } from "@/proto";
import type { CoreCmd } from "@/shared/api";
import type { Acted } from "../acted";
import type { AnswerFrom, AnsweredFrom, CardAnswered } from "../answered";
import type { Refused } from "../refused";
import type { Ev } from "../types";

/**
 * Main's window-local events (main/core/ipc.ts), the settling of this window's own card requests:
 * card/answer's result (its `answer` is bise_proto's CardAnswer) and the error to a card/answer or
 * card/close request (the RPC error's words).
 */
export type WinEv =
  | ({ readonly ev: "card_answered" } & CardAnswered)
  | { readonly ev: "card_refused"; readonly project: string; readonly card: number; readonly text: string };

/** His gestures. */
export type Intent =
  | {
      readonly i: "answer";
      readonly project: string;
      readonly card: number;
      readonly reply: string;
      readonly files?: readonly string[];
      readonly parts?: readonly Part[];
      readonly from?: AnswerFrom;
    }
  | { readonly i: "close"; readonly project: string; readonly card: number }
  /** 'try again' on a refused card: what he sent, sent again */
  | { readonly i: "retry_card"; readonly project: string; readonly card: number };

/** One input to the machine; `at_ms` is the shell's clock when it came (step never reads one). */
export type Input = { readonly at_ms: number } & (
  | { readonly in: "ev"; readonly ev: Ev }
  | { readonly in: "win"; readonly ev: WinEv }
  | { readonly in: "do"; readonly intent: Intent }
);

/** A write to his kept asides (kept across a reload), typed per key. */
export type Keep =
  | { readonly key: "acted"; readonly value: readonly Acted[] }
  | { readonly key: "refused"; readonly value: readonly Refused[] }
  | { readonly key: "answered-from"; readonly value: readonly AnsweredFrom[] };

/** What a step asks the shell to do, in order. */
export type Output = { readonly out: "cmd"; readonly cmd: CoreCmd } | ({ readonly out: "keep" } & Keep);

/** What the hubs said that several slices read, as it came. */
export interface HubFacts {
  /** every project's row, the last `projects` event's own array */
  readonly rows: readonly ProjectRow[];
}

export const NO_FACTS: HubFacts = { rows: [] };

/** The facts after one of the core's or a hub's events: the same object when it names none. Pure. */
export function factsOf(f: HubFacts, ev: Ev): HubFacts {
  return ev.ev === "projects" ? { ...f, rows: ev.projects } : f;
}
