// The sends slice's law (fast-try p4 slice 2, architect m_30501): seeded random runs of his sends,
// resends and dismisses, turn/send's results, his echoes (an entry or a page), the sends' errors
// and the core going down and up, through stepSends; after each input the laws below hold. The
// runs reach the edges where the bugs were: two sends of the same words, an echo before its send's
// answer, an error for a cid that went already, a send while the core is down, a resend of a row
// that isn't failed. A red prints its seed and step: `SEED=<n> pnpm vitest run sends.law` replays it.
//
// The laws, in their own words:
// 1. pure: the state given is untouched, the same input gives the same answer;
// 2. one gesture, at most one command: a send (or a resend of a failed row) sends once, with the
//    input's cid, while the core is up; down, nothing goes and its row fails at once; nothing but
//    a send or a resend sends anything;
// 3. every row ends: none is still sending after the core went down; an error with its cid fails
//    that row (refused) or takes it away (undelivered); an echo takes away at most one row;
// 4. an echo by id takes its row away whatever its state (architect m_30501 (4)): a delivered
//    message never also shows 'not sent' with a retry that would send it twice;
// 5. cids: a row's cid is the request id its gesture got, never two rows with one; the slice's
//    last cid only grows;
// 6. a resend gives the same words, mode and parts under the new cid, the old row gone;
// 7. an input that changes nothing: the same state back, nothing out.
// 8. the core gave up waiting for its hub (late): a row on its way turns late, never failed (its hub
//    may still make it: no retry); gone: not sent, its words kept for its echo; the hub's refusal
//    changes nothing here (its error event settles it). queue-drawer-fix, architect m_34889.
import { describe, expect, it } from "vitest";
import type { Entry, Part } from "@/proto";
import type { CoreCmd } from "@/shared/api";
import { threadKey, type Pending } from "../types";
import { pendingOf, sendingNow, sendsInit, stepSends, type SendsState } from "./sends";
import { NO_FACTS, type HubFacts, type Input, type Output } from "./types";

function rng(seed: number): { int(n: number): number; pick<T>(xs: readonly T[]): T; chance(p: number): boolean } {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    int: (n) => Math.floor(next() * n),
    pick: (xs) => xs[Math.floor(next() * xs.length)] as (typeof xs)[number],
    chance: (p) => next() < p,
  };
}

const THREADS = [
  ["acme-1a2b3c4d", "main"],
  ["acme-1a2b3c4d", "perf"],
  ["shop-0badc0de", "main"],
] as const;
const WORDS = ["make it fast", "again", "again", "/model x", ""];
const PARTS: readonly Part[] = [{ kind: "text", text: "a quote" } as unknown as Part];

const allRows = (s: SendsState): Pending[] => Object.values(s.threads).flatMap((t) => [...t.pending]);
const cmdsOf = (outs: readonly Output[]): CoreCmd[] => outs.flatMap((o) => (o.out === "cmd" ? [o.cmd] : []));
const label = (i: Input): string => (i.in === "do" ? i.intent.i : i.ev.ev === "core" ? `core ${i.ev.state}` : i.ev.ev);

/** One run's next input, from what the state holds now (so resends, errors and echoes hit real rows often). */
function nextInput(r: ReturnType<typeof rng>, s: SendsState, at: number, cid: number): Input | { core: "up" | "down" } {
  const rows = allRows(s);
  const row = rows.length > 0 && r.chance(0.8) ? r.pick(rows) : null;
  const [project, agent] = r.pick(THREADS);
  const key = row === null ? threadKey(project, agent) : threadKey(row.project, row.agent);
  const someCid = row?.cid ?? r.int(cid + 2);
  // the hub gives each message its own id: a send's is 100 + its cid here, an echo carries one of them
  const msgIds = [100 + someCid, 100 + r.int(cid + 2)];
  const k = r.int(100);
  if (k < 25) {
    const parts = r.chance(0.15) ? PARTS : undefined;
    return {
      at_ms: at,
      in: "do",
      cid,
      intent: {
        i: "send",
        project,
        agent,
        text: r.pick(WORDS),
        ...(r.chance(0.3) ? { mode: r.pick(["now", "queued"] as const) } : {}),
        ...(parts === undefined ? {} : { parts }),
      },
    };
  }
  if (k < 33) return { at_ms: at, in: "do", cid, intent: { i: "resend", key, cid: someCid } };
  if (k < 38) return { at_ms: at, in: "do", cid, intent: { i: "dismiss", key, cid: someCid } };
  if (k < 52) {
    // turn/send's result: a message made with its id, or why none (a page, a command, a route's
    // hold, a newer word, an older hub's {})
    const made = r.chance(0.75);
    const reason = made ? ("made" as const) : r.pick([null, "page", "command", "routed", "unknown"] as const);
    return { at_ms: at, in: "win", ev: { ev: "sent", project: row?.project ?? project, agent: row?.agent ?? agent, cid: someCid, msg_id: made ? 100 + someCid : null, reason } };
  }
  if (k < 60 && k >= 56) {
    // the core answered his send with an error of its own (late, gone) or the hub's (queue-drawer-fix)
    return { at_ms: at, in: "win", ev: { ev: "send_refused", project: row?.project ?? project, agent: row?.agent ?? agent, cid: someCid, reason: r.pick(["late", "late", "gone", "refused"] as const) } };
  }
  if (k < 70 || k < 76) {
    const e: Entry = {
      kind: "you",
      pos: r.int(1000),
      at_ms: at + r.pick([-6000, -10, 0, 50]),
      text: row !== null && r.chance(0.5) ? row.text : r.pick(WORDS),
      ...(r.chance(0.7) ? { msg_id: r.pick(msgIds) } : {}),
    };
    const p = row?.project ?? project;
    const a = row?.agent ?? agent;
    if (k < 70) return { at_ms: at, in: "ev", ev: { ev: "entry", project: p, agent: a, entry: e } };
    return { at_ms: at, in: "ev", ev: { ev: "thread", project: p, agent: a, before: null, more: false, entries: [e, { ...e, pos: e.pos + 1, kind: "agent" }] } };
  }
  if (k < 88)
    return {
      at_ms: at,
      in: "ev",
      ev: {
        ev: "error",
        project: row?.project ?? project,
        cmd: r.pick(["send", "send", "send", "slash"]),
        text: r.pick(["no agent main", "@perf is archived: not delivered"]),
        ...(r.chance(0.85) ? { cid: someCid } : {}),
        ...(r.chance(0.6) ? { reason: r.pick(["refused", "undelivered"]) } : {}),
      },
    };
  return { core: r.pick(["up", "down", "down"] as const) };
}

const SEEDS = process.env["SEED"] !== undefined ? [Number(process.env["SEED"])] : Array.from({ length: 300 }, (_, i) => i + 1);

describe("the sends slice's law", () => {
  it("over seeded runs: one gesture at most one send with its cid, none while down; every row ends; an echo by id takes its row whatever its state; cids are unique; a resend is the same message", () => {
    for (const seed of SEEDS) {
      const r = rng(seed);
      let s: SendsState = sendsInit();
      let f: HubFacts = { ...NO_FACTS, core: "up" };
      let counter = 0;
      const seen = new Set<number>();
      let at = 1_791_100_000_000;
      for (let step = 0; step < 120; step += 1) {
        at += r.pick([0, 5, 300, 7000]);
        const next0 = nextInput(r, s, at, counter + 1);
        const input: Input = "core" in next0 ? { at_ms: at, in: "win", ev: { ev: "core", state: next0.core } } : next0;
        if (input.in === "win" && input.ev.ev === "core") f = { ...f, core: input.ev.state };
        const where = `seed ${String(seed)} step ${String(step)} (${label(input)})`;
        const before = JSON.stringify(s);
        const rowsBefore = allRows(s);
        const [next, outs] = stepSends(s, f, input);
        // 1. pure
        expect(JSON.stringify(s), where).toBe(before);
        expect(JSON.stringify(stepSends(s, f, input)), where).toBe(JSON.stringify([next, outs]));
        // 7. nothing changed: the same state, nothing out (a send's answer or error for a row it
        //    names is always written again, as today's store did: a new list, its thread told)
        const rewrites = (input.in === "win" && (input.ev.ev === "sent" || input.ev.ev === "send_refused")) || (input.in === "ev" && input.ev.ev === "error");
        if (JSON.stringify(next) === before && !rewrites) {
          expect(next, where).toBe(s);
          expect(outs, where).toEqual([]);
        }
        const cmds = cmdsOf(outs);
        const rows = allRows(next);
        // 5. cids: unique, the last only grows, a new row has the gesture's cid
        expect(new Set(rows.map((p) => p.cid)).size, where).toBe(rows.length);
        expect(next.cid >= s.cid, where).toBe(true);
        const made = rows.filter((p) => !rowsBefore.some((b) => b.cid === p.cid));
        expect(made.length <= 1, where).toBe(true);
        for (const p of made) {
          expect(input.in === "do" && p.cid === input.cid && next.cid === input.cid, where).toBe(true);
          expect(seen.has(p.cid), `${where}: cid ${String(p.cid)} given twice`).toBe(false);
          seen.add(p.cid);
        }
        if (next.cid > counter) counter = next.cid;
        // 2. one gesture, at most one send, with the cid of its row, and only while the core is up
        expect(cmds.length <= 1, where).toBe(true);
        if (input.in !== "do" || (input.intent.i !== "send" && input.intent.i !== "resend")) expect(cmds, where).toEqual([]);
        for (const c of cmds) {
          expect(c.cmd, where).toBe("send");
          expect(f.core, where).not.toBe("down");
          expect(made.map((p) => p.cid), where).toEqual([c.cmd === "send" && "cid" in c ? c.cid : -1]);
        }
        if (input.in === "do" && f.core === "down") {
          expect(cmds, where).toEqual([]);
          for (const p of made) expect(p.state, where).toBe("failed");
        }
        // 6. a resend of a failed row: the same message under the new cid, the old row gone
        if (input.in === "do" && input.intent.i === "resend") {
          const { key, cid } = input.intent;
          const old = rowsBefore.find((p) => p.cid === cid && p.state === "failed" && threadKey(p.project, p.agent) === key);
          if (old === undefined) expect(next, where).toBe(s);
          else {
            expect(rows.some((p) => p.cid === cid), where).toBe(false);
            const [n] = made;
            expect(n && [n.project, n.agent, n.text, n.mode, n.parts], where).toEqual([old.project, old.agent, old.text, old.mode, old.parts]);
          }
        }
        // 3. every row ends
        if (input.in === "win" && input.ev.ev === "core" && input.ev.state === "down") expect(rows.some((p) => p.state === "sending" || p.state === "late"), where).toBe(false);
        // 8. the core gave up waiting (late): a row on its way with no id turns late, never failed (no
        //    retry: its hub may still make it); gone: not sent, its words kept for its echo (lostAt);
        //    the hub's refusal: its error event settles it, this changes nothing (queue-drawer-fix)
        if (input.in === "win" && input.ev.ev === "send_refused") {
          const { cid, reason } = input.ev;
          const key = threadKey(input.ev.project, input.ev.agent);
          const had = rowsBefore.find((p) => p.cid === cid && threadKey(p.project, p.agent) === key);
          const now = rows.find((p) => p.cid === cid && threadKey(p.project, p.agent) === key);
          const open = had !== undefined && (had.state === "sending" || had.state === "late") && typeof had.msgId !== "number";
          if (!open || reason === "refused") expect(now, where).toEqual(had);
          else if (reason === "late") expect(now?.state, where).toBe("late");
          else expect([now?.state, typeof now?.lostAt], where).toEqual(["failed", "number"]);
        }
        if (input.in === "ev" && input.ev.ev === "error" && input.ev.cmd === "send" && input.ev.cid != null) {
          const cid = input.ev.cid;
          const had = rowsBefore.find((p) => p.cid === cid);
          const now = rows.find((p) => p.cid === cid);
          if (had !== undefined) {
            if ((input.ev.reason ?? "refused") === "undelivered") expect(now, where).toBeUndefined();
            else expect([now?.state, now?.why], where).toEqual(["failed", input.ev.text]);
          }
        }
        if (input.in === "ev" && input.ev.ev === "entry") {
          // an echo takes away at most one row, and only in its own thread
          const key = threadKey(input.ev.project, input.ev.agent);
          const gone = rowsBefore.filter((p) => !rows.some((q) => q.cid === p.cid));
          expect(gone.length <= 1, where).toBe(true);
          for (const p of gone) expect(threadKey(p.project, p.agent), where).toBe(key);
          // 4. an echo by id: its row goes whatever its state
          const id = input.ev.entry.msg_id;
          if (id != null) for (const p of rowsBefore) if (p.msgId === id && threadKey(p.project, p.agent) === key) expect(rows.some((q) => q.cid === p.cid), where).toBe(false);
        }
        // the reads: a thread's rows and 'one on its way'
        for (const [p, a] of THREADS) expect(pendingOf(next, threadKey(p, a)), where).toBe(next.threads[threadKey(p, a)]?.pending ?? pendingOf(sendsInit(), "x"));
        expect(sendingNow(next), where).toBe(rows.some((p) => p.state === "sending" || p.state === "late"));
        s = next;
      }
    }
  }, 60_000);
});
