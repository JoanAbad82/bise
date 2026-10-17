// The window-local events main sends the one window that asked (src/main/core/ipc.ts), built from
// the core's answer to that window's request: 'card_answered' (card/answer's result), 'sent' (a
// send's message id), 'card_refused' (an answer's or a close's error). Not the core's protocol:
// the store reads them (src/store echo.ts, answered.ts, acted.ts). Pure, so ipc.ts and the nightly
// invariant check on recorded cores (tests/nightly) build them the same way. Owner: amb-core.
import type { AnswerResult, CardAnswer, SendResult } from '../proto';

export type LocalEv =
  | { readonly ev: 'card_answered'; readonly project: unknown; readonly card: unknown; readonly answer: CardAnswer | null }
  | { readonly ev: 'sent'; readonly project: unknown; readonly agent: unknown; readonly cid: unknown; readonly msg_id: number | null }
  | { readonly ev: 'card_refused'; readonly project: unknown; readonly card: unknown; readonly text: string };

/**
 * The core answered `cmd` with `result`: the window's event, 'card_answered' for an answer
 * (card/answer's result) or 'sent' for a send (turn/send's message id); null for a close taken
 * (the rows say it) and any other command.
 */
export function answeredEv(cmd: Readonly<Record<string, unknown>>, result: unknown): LocalEv | null {
  // a close taken: the hub's rows drop the card, nothing more to say
  if (cmd['cmd'] === 'close') return null;
  if (cmd['cmd'] === 'answer') {
    // the step closed no card (or a page took it) answers {}: answer null, no row
    const answer = (result as AnswerResult | null)?.answer ?? null;
    return { ev: 'card_answered', project: cmd['project'], card: cmd['card'], answer };
  }
  if (cmd['cmd'] === 'send') {
    // turn/send's result (bise-proto rpc SendResult); an older hub answers {}: msg_id null,
    // the window falls back to the words
    const id = (result as SendResult | null)?.msg_id ?? null;
    return { ev: 'sent', project: cmd['project'], agent: cmd['agent'], cid: cmd['cid'], msg_id: id };
  }
  return null;
}

/** The core or its hub refused his answer or close of a card: that card's event, with the words. */
export function refusedEv(project: unknown, card: unknown, message: string): LocalEv {
  return { ev: 'card_refused', project, card, text: message };
}

/** A core gone before it answered his answer or close: the card is his again, with these words. */
export const RESTARTED_WORDS = "bise restarted before your answer was confirmed: if the card is still here, answer it again.";
