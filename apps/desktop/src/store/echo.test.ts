import { describe, expect, it } from "vitest";
import type { Entry } from "@/proto";
import type { CoreCmd } from "@/shared/api";
import { answered, echoOf, keepLanded, sentOf, ECHO_SLACK_MS } from "./echo";
import { Store, threadKey, type Pending } from "./store";

const P = "acme-1a2b3c4d";
const K = threadKey(P, "perf");

const row = (
  cid: number,
  text: string,
  more: Partial<Pending> = {},
): Pending => ({
  cid,
  project: P,
  agent: "perf",
  text,
  mode: "now",
  at_ms: 1000,
  state: "sending",
  ...more,
});
const you = (pos: number, text: string, msg_id?: number): Entry => ({
  pos,
  at_ms: 2000,
  kind: "you",
  text,
  ...(msg_id === undefined ? {} : { msg_id }),
});

describe("echo (A1): his send meets its 'you' entry by its message id", () => {
  it("two sends of the same words meet their own entries, in either order", () => {
    const rows = [row(1, "ok", { msgId: 10 }), row(2, "ok", { msgId: 11 })];
    expect(echoOf(rows, you(5, "ok", 11))).toBe(1);
    expect(echoOf(rows, you(4, "ok", 10))).toBe(0);
  });

  it("never by its words: another id, no id, or a send not answered yet takes nothing", () => {
    expect(echoOf([row(1, "ok", { msgId: 10 })], you(4, "ok", 99))).toBe(-1);
    expect(echoOf([row(1, "ok", { msgId: 10 })], you(4, "ok"))).toBe(-1);
    expect(echoOf([row(1, "ok")], you(4, "ok", 99))).toBe(-1);
    expect(echoOf([row(1, "ok")], you(4, "ok"))).toBe(-1);
    expect(echoOf([row(1, "ok", { state: "failed" })], you(4, "ok", 99))).toBe(-1);
  });

  it("but a row the core went down before answering (lost) is taken by its words: it may have reached the hub (restores ff9c5cdd5's match for that case only, until send-reason sha 2's cid)", () => {
    // sent at 1000, the core died at 1500; the entry was written at 2000
    const lost = { state: "failed", lostAt: 1500 } as const;
    expect(echoOf([row(1, "ok", lost)], you(4, "ok", 99))).toBe(0);
    expect(echoOf([row(1, "ok", lost)], you(4, "no", 99))).toBe(-1);
    // an entry written after the core's death (more the slack) is a new send's, never this row's
    expect(echoOf([row(1, "ok", { ...lost, lostAt: 2000 - ECHO_SLACK_MS - 1 })], you(4, "ok", 99))).toBe(-1);
    expect(echoOf([row(1, "ok", { ...lost, lostAt: 2000 - ECHO_SLACK_MS })], you(4, "ok", 99))).toBe(0);
    // a lost row answered with an id meets only that id
    expect(echoOf([row(1, "ok", { ...lost, msgId: 5 })], you(4, "ok", 99))).toBe(-1);
    // an entry written before the send (less the slack) is an older one, never its echo
    expect(echoOf([row(1, "ok", { ...lost, at_ms: 2000 + ECHO_SLACK_MS + 1 })], you(4, "ok", 99))).toBe(-1);
    expect(echoOf([row(1, "ok", { ...lost, at_ms: 2000 + ECHO_SLACK_MS })], you(4, "ok", 99))).toBe(0);
    // two lost rows with the same words: the oldest
    expect(echoOf([row(1, "ok", lost), row(2, "ok", lost)], you(4, "ok", 99))).toBe(0);
  });

  it("a lost row with parts is taken by its own parts, never by the same words with another paste", () => {
    const parts = (pasted: string) => [{ kind: "text", text: "look at this" }, { kind: "paste", n: 1, text: pasted }] as const;
    const lost = row(1, "look at this", { state: "failed", lostAt: 1500, parts: [...parts("trace A")] });
    const echo = (pasted: string): Entry => ({ ...you(4, "look at this", 99), parts: [...parts(pasted)] });
    expect(echoOf([lost], echo("trace B"))).toBe(-1);
    expect(echoOf([lost], echo("trace A"))).toBe(0);
  });

  it("the store: one entry clears one of two lost rows with its words; a retry of a lost row is a new send, met by its id only", () => {
    const store = new Store({ send: () => undefined }, { now: () => 1000 });
    store.setCore("up");
    store.send({ project: P, agent: "perf", text: "ok" });
    store.send({ project: P, agent: "perf", text: "ok" });
    store.setCore("down");
    store.setCore("up");
    expect(store.pending(K).map((p) => p.lostAt)).toEqual([1000, 1000]);
    store.apply({ ev: "entry", project: P, agent: "perf", entry: you(4, "ok", 41) });
    expect(store.pending(K).map((p) => p.cid)).toEqual([2]);
    store.retry(K, 2);
    const again = store.pending(K);
    expect(again.map((p) => [p.cid, p.state, p.lostAt])).toEqual([[3, "sending", undefined]]);
    store.apply({ ev: "entry", project: P, agent: "perf", entry: you(5, "ok", 42) });
    expect(store.pending(K).map((p) => p.cid)).toEqual([3]);
  });

  it("a message made: its row learns the id; when that entry landed first, the row goes", () => {
    const rows = [row(1, "ok"), row(2, "ok")];
    const s = { project: P, agent: "perf", cid: 2, msg_id: 11, reason: "made" } as const;
    expect(answered(rows, s, new Set())?.map((p) => p.msgId)).toEqual([
      undefined,
      11,
    ]);
    expect(answered(rows, s, new Set([11]))?.map((p) => p.cid)).toEqual([1]);
    expect(answered(rows, { ...s, cid: 9 }, new Set())).toBeNull();
  });

  it("send-reason: no message made (a page took it, a command ran, a newer reason, an older hub's {}): the row goes on the answer; routed: it stays for its route", () => {
    const rows = [row(1, "ok"), row(2, "ok")];
    const none = { project: P, agent: "perf", cid: 2, msg_id: null };
    for (const reason of ["page", "command", "unknown", null] as const)
      expect(answered(rows, { ...none, reason }, new Set())?.map((p) => p.cid), String(reason)).toEqual([1]);
    expect(answered(rows, { ...none, reason: "routed" }, new Set())).toBe(rows);
  });

  it("keeps the last 32 landed ids, an entry without one keeps nothing", () => {
    let ids: readonly number[] | undefined;
    for (let i = 0; i < 40; i++) ids = keepLanded(ids, i);
    expect(ids).toHaveLength(32);
    expect(ids?.[0]).toBe(8);
    expect(keepLanded(ids, undefined)).toBe(ids);
  });

  it("reads only a well-formed 'sent'", () => {
    expect(
      sentOf({ ev: "sent", project: P, agent: "perf", cid: 3, msg_id: 7, reason: "made" }),
    ).toEqual({ project: P, agent: "perf", cid: 3, msg_id: 7, reason: "made" });
    expect(
      sentOf({ ev: "sent", project: P, agent: "perf", cid: 3 }),
    ).toEqual({ project: P, agent: "perf", cid: 3, msg_id: null, reason: null });
    expect(sentOf({ ev: "sent", project: P, agent: "perf" })).toBeNull();
    expect(sentOf({ ev: "entry" })).toBeNull();
  });

  it("the store: two 'ok's, answered then echoed out of order, each takes its own row", () => {
    const sent: CoreCmd[] = [];
    const store = new Store({ send: (c) => sent.push(c) }, { now: () => 1000 });
    store.setCore("up");
    store.send({ project: P, agent: "perf", text: "ok" });
    store.send({ project: P, agent: "perf", text: "ok", mode: "queued" });
    const [a, b] = store.pending(K).map((p) => p.cid);
    expect(
      store.apply({
        ev: "sent",
        project: P,
        agent: "perf",
        cid: a,
        msg_id: 10,
        reason: "made",
      }),
    ).toBe(true);
    store.apply({ ev: "sent", project: P, agent: "perf", cid: b, msg_id: 11, reason: "made" });
    store.apply({
      ev: "entry",
      project: P,
      agent: "perf",
      entry: you(4, "ok", 11),
    });
    expect(store.pending(K).map((p) => p.cid)).toEqual([a]);
    store.apply({
      ev: "entry",
      project: P,
      agent: "perf",
      entry: you(5, "ok", 10),
    });
    expect(store.pending(K)).toEqual([]);
  });

  it("the store: the entry lands before its send's answer, the answer takes the row", () => {
    const store = new Store({ send: () => undefined }, { now: () => 1000 });
    store.setCore("up");
    store.send({ project: P, agent: "perf", text: "ok" });
    store.send({ project: P, agent: "perf", text: "ok" });
    const [a, b] = store.pending(K).map((p) => p.cid);
    store.apply({ ev: "sent", project: P, agent: "perf", cid: a, msg_id: 10, reason: "made" });
    // b is not answered yet: its entry (id 11) takes no row by its words, its id is kept
    store.apply({
      ev: "entry",
      project: P,
      agent: "perf",
      entry: you(4, "ok", 11),
    });
    expect(store.pending(K).map((p) => p.cid)).toEqual([a, b]);
    // b's answer: its entry landed already, the row goes
    store.apply({ ev: "sent", project: P, agent: "perf", cid: b, msg_id: 11, reason: "made" });
    expect(store.pending(K).map((p) => p.cid)).toEqual([a]);
    // a's answer came first; now its entry: gone
    store.apply({
      ev: "entry",
      project: P,
      agent: "perf",
      entry: you(5, "ok", 10),
    });
    expect(store.pending(K)).toEqual([]);
  });

  it("the store: an entry with an id lands first and no row takes it; the late answer removes its row", () => {
    const store = new Store({ send: () => undefined }, { now: () => 1000 });
    store.setCore("up");
    store.send({ project: P, agent: "perf", text: "ok" });
    const [a] = store.pending(K).map((p) => p.cid);
    store.apply({ ev: "sent", project: P, agent: "perf", cid: a, msg_id: 10, reason: "made" });
    store.send({ project: P, agent: "perf", text: "go" });
    const b = store.pending(K)[1]?.cid;
    // 'go' answered with 12 later; its entry first, with words that differ from his row (a template)
    store.apply({
      ev: "entry",
      project: P,
      agent: "perf",
      entry: you(6, "go (edited)", 12),
    });
    expect(store.pending(K)).toHaveLength(2);
    store.apply({ ev: "sent", project: P, agent: "perf", cid: b, msg_id: 12, reason: "made" });
    expect(store.pending(K).map((p) => p.cid)).toEqual([a]);
  });
});
