// A1 (architect's delta review, m_21449): his pending send meets its echo, the 'you' entry, by the
// message id the hub gave it (the send's result, main's ipc.ts -> the window-local event 'sent'),
// not by its words. Pure. Owner: amb-win (store.ts calls it; amb-core's file).
import type { Entry } from "@/proto";
import type { Pending } from "./types";

/** The window-local 'sent' (never a hub event): the send `cid` of this window was answered with
 *  its message id; null: an answer without one (a refused send's row goes by its error). */
export interface Sent {
  readonly project: string;
  readonly agent: string;
  readonly cid: number;
  readonly msg_id: number | null;
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
  };
}

/**
 * Which pending send `e` is the echo of, or -1: the send answered with the entry's message id
 * (two sends of the same words never swap). An entry that lands before its send's answer has no
 * row yet: the store keeps its id (`keepLanded`) and `answered` drops the row then. The words
 * matched a send of an older hub (no id) until issue 31: every hub from v2026.10.2-35 answers one.
 */
export function echoOf(pending: readonly Pending[], e: Entry): number {
  const id = e.msg_id ?? null;
  return id === null ? -1 : pending.findIndex((p) => p.msgId === id);
}

/** An entry of his with no row: its send's answer may come after it, so its id is kept (the last 32). */
export function keepLanded(
  ids: readonly number[] | undefined,
  id: number | null | undefined,
): readonly number[] | undefined {
  return id == null ? ids : [...(ids ?? []), id].slice(-32);
}

/**
 * A send's answer on its thread's rows: the row learns its id; when the entry with that id
 * already landed (`landedIds`: the ids of his messages seen with no row to take), the row goes.
 * Null: no row has this cid (it went already, or another window sent it).
 */
export function answered(
  pending: readonly Pending[],
  s: Sent,
  landedIds: ReadonlySet<number>,
): readonly Pending[] | null {
  const i = pending.findIndex((p) => p.cid === s.cid);
  if (i < 0) return null;
  if (s.msg_id !== null && landedIds.has(s.msg_id))
    return pending.filter((_, j) => j !== i);
  return pending.map((p, j) => (j === i ? { ...p, msgId: s.msg_id } : p));
}
