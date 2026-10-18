// A1 (architect's delta review, m_21449): his pending send meets its echo, the 'you' entry, by the
// message id the hub gave it (the send's result, main's ipc.ts -> the window-local event 'sent'),
// not by its words (but one case, echoOf). send-reason (architect m_30519): a result that made no
// message (a page took it, a command ran, or an older hub's {}) drops the row on the result; a
// routed one keeps it for its route (thread/routes.ts). Pure.
// Owner: amb-win (store.ts calls it; amb-core's file).
import type { Entry, SendReason } from "@/proto";
import { sentParts, sentWords, type Pending } from "./types";

/**
 * How much earlier than his send its echo (the hub's 'you' entry) may say it was written: the
 * window's clock and the hub's line times are the same machine's, read a few ms apart.
 */
export const ECHO_SLACK_MS = 5000;

/** The window-local 'sent' (never a hub event): the send `cid` of this window was answered with
 *  its message id and `reason` (what the hub did: 'made' with the id); both null: an older hub. */
export interface Sent {
  readonly project: string;
  readonly agent: string;
  readonly cid: number;
  readonly msg_id: number | null;
  readonly reason: SendReason | null;
}

export function sentOf(raw: unknown): Sent | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (
    r["ev"] !== "sent" ||
    typeof r["project"] !== "string" ||
    typeof r["agent"] !== "string" ||
    typeof r["cid"] !== "number"
  )
    return null;
  return {
    project: r["project"],
    agent: r["agent"],
    cid: r["cid"],
    msg_id: typeof r["msg_id"] === "number" ? r["msg_id"] : null,
    reason: typeof r["reason"] === "string" ? (r["reason"] as SendReason) : null,
  };
}

/**
 * Which pending send `e` is the echo of, or -1: the row its message id was answered for (two
 * sends of the same words never swap). An entry that lands before its send's answer has no row
 * yet: the store keeps its id (`keepLanded`) and `answered` drops the row then. One row has no id
 * and may still have reached the hub: a send the core went down before answering (`lost`, 'not
 * sent'); an entry whose id no row holds takes it by its words and parts, else a retry would send
 * it twice (architect m_30553). This restores, for that one case only, the words match issue 31
 * (ff9c5cdd5) removed; its end is send-reason sha 2, the request's cid on his entry. Only an entry
 * written after the send (less ECHO_SLACK_MS) can be its echo.
 */
export function echoOf(pending: readonly Pending[], e: Entry): number {
  const id = e.msg_id ?? null;
  if (id !== null) {
    const i = pending.findIndex((p) => p.msgId === id);
    if (i >= 0) return i;
  }
  const typed =
    e.parts != null && e.parts.length > 0 ? sentParts(e.parts) : null;
  const said = sentWords(e.text);
  return pending.findIndex(
    (p) =>
      p.lost === true &&
      typeof p.msgId !== "number" &&
      e.at_ms >= p.at_ms - ECHO_SLACK_MS &&
      (typed !== null && p.parts !== undefined
        ? sentParts(p.parts) === typed
        : sentWords(p.text) === said),
  );
}

/** An entry of his with no row: its send's answer may come after it, so its id is kept (the last 32). */
export function keepLanded(
  ids: readonly number[] | undefined,
  id: number | null | undefined,
): readonly number[] | undefined {
  return id == null ? ids : [...(ids ?? []), id].slice(-32);
}

/**
 * A send's answer on its thread's rows: a message made, the row learns its id, or goes when the
 * entry with that id already landed (`landedIds`: the ids of his messages seen with no row to
 * take). Routed: the row stays, it is the route's hold (thread/routes.ts settles it on its
 * route_done). No message made (a page took it, a command ran, a newer reason, or none: an older
 * hub's {}, whose 'you' entry shows his words if one comes): the row goes. Null: no row has this
 * cid (it went already, or another window sent it).
 */
export function answered(
  pending: readonly Pending[],
  s: Sent,
  landedIds: ReadonlySet<number>,
): readonly Pending[] | null {
  const i = pending.findIndex((p) => p.cid === s.cid);
  if (i < 0) return null;
  if (s.reason === "routed") return pending;
  const id = s.msg_id;
  if (s.reason !== "made" || id === null || landedIds.has(id))
    return pending.filter((_, j) => j !== i);
  return pending.map((p, j) => (j === i ? { ...p, msgId: id } : p));
}
