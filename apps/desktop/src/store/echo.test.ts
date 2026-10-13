import { describe, expect, it } from "vitest";
import type { Entry } from "@/proto";
import type { CoreCmd } from "@/shared/api";
import { answered, echoOf, keepLanded, sentOf } from "./echo";
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
    expect(echoOf(rows, you(5, "ok", 11), 500)).toBe(1);
    expect(echoOf(rows, you(4, "ok", 10), 500)).toBe(0);
  });

  it("a send answered with an id never takes an entry by its words", () => {
    expect(echoOf([row(1, "ok", { msgId: 10 })], you(4, "ok", 99), 500)).toBe(
      -1,
    );
    expect(echoOf([row(1, "ok", { msgId: 10 })], you(4, "ok"), 500)).toBe(-1);
  });

  it("an older hub (answered {} or not yet): the words still match (TODO(A1): one release)", () => {
    expect(echoOf([row(1, "ok", { msgId: null })], you(4, "ok", 99), 500)).toBe(
      0,
    );
    expect(echoOf([row(1, "ok")], you(4, "ok"), 500)).toBe(0);
    expect(echoOf([row(1, "ok")], you(4, "no"), 500)).toBe(-1);
  });

  it("an answer gives its row the id; when that entry landed first, the row goes", () => {
    const rows = [row(1, "ok"), row(2, "ok")];
    const s = { project: P, agent: "perf", cid: 2, msg_id: 11 };
    expect(answered(rows, s, new Set())?.map((p) => p.msgId)).toEqual([
      undefined,
      11,
    ]);
    expect(answered(rows, s, new Set([11]))?.map((p) => p.cid)).toEqual([1]);
    expect(answered(rows, { ...s, cid: 9 }, new Set())).toBeNull();
    expect(
      answered(rows, { ...s, msg_id: null }, new Set())?.[1]?.msgId,
    ).toBeNull();
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
      sentOf({ ev: "sent", project: P, agent: "perf", cid: 3, msg_id: 7 }),
    ).toEqual({ project: P, agent: "perf", cid: 3, msg_id: 7 });
    expect(
      sentOf({ ev: "sent", project: P, agent: "perf", cid: 3 })?.msg_id,
    ).toBeNull();
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
      }),
    ).toBe(true);
    store.apply({ ev: "sent", project: P, agent: "perf", cid: b, msg_id: 11 });
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
    store.apply({ ev: "sent", project: P, agent: "perf", cid: a, msg_id: 10 });
    // b is not answered yet: its words take this entry (old-hub path); it is b's own, id 11
    store.apply({
      ev: "entry",
      project: P,
      agent: "perf",
      entry: you(4, "ok", 11),
    });
    expect(store.pending(K).map((p) => p.cid)).toEqual([a]);
    store.apply({ ev: "sent", project: P, agent: "perf", cid: b, msg_id: 11 });
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
    store.apply({ ev: "sent", project: P, agent: "perf", cid: a, msg_id: 10 });
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
    store.apply({ ev: "sent", project: P, agent: "perf", cid: b, msg_id: 12 });
    expect(store.pending(K).map((p) => p.cid)).toEqual([a]);
  });
});
