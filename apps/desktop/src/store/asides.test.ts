import { describe, expect, it } from "vitest";
import { answer_result } from "@/proto/fixtures.gen";
import { ASIDES_KEPT, asideOf, asidesOf, cardAnsweredOf, rowThere } from "./asides";
import { Store } from "./store";

const gift = answer_result[0]?.answer ?? null;

describe("inbox picks (3): his answer where he was", () => {
  it("the hub's row is there already in the asker's thread and its project's main", () => {
    expect(rowThere({ project: "shop", agent: "gift-ui" }, "shop", "gift-ui")).toBe(true);
    expect(rowThere({ project: "shop", agent: "main" }, "shop", "gift-ui")).toBe(true);
    expect(rowThere({ project: "shop", agent: "perf" }, "shop", "gift-ui")).toBe(false);
    expect(rowThere({ project: "telemetry", agent: "main" }, "shop", "gift-ui")).toBe(false);
  });

  it("another project: the result's words, the card's key; none where the hub wrote it", () => {
    const from = { at: { project: "telemetry", agent: "p99" } };
    const got = asideOf(from, "shop", 4, gift, 1000);
    expect(got?.at).toEqual({ project: "telemetry", agent: "p99" });
    expect(got?.aside).toEqual({ key: "shop/4", project: "shop", card: 4, agent: "docs", notice: "you answered docs: only at checkout", note: "", at_ms: 1000, by: "hub" });
    expect(asideOf({ ...from, at: { project: "shop", agent: "docs" } }, "shop", 4, gift, 1000)).toBeNull();
    expect(asideOf({ ...from, at: null }, "shop", 4, gift, 1000)).toBeNull();
  });

  it("card-state: {} (the hub closed no card: a merge's digit, words it refused) draws no 'you answered'", () => {
    const at = { project: "home", agent: "main" };
    expect(asideOf({ at }, "ts-pattern", 384, null, 5)).toBeNull();
    const s = new Store({ send: () => undefined }, { now: () => 42 });
    s.answer("ts-pattern", 384, "1", undefined, undefined, { at });
    expect(s.apply({ ev: "card_answered", project: "ts-pattern", card: 384, answer: null })).toBe(true);
    expect(s.asides("home/main")).toEqual([]);
  });

  it("reads the window-local event; a bad answer is the fallback", () => {
    expect(cardAnsweredOf({ ev: "card_answered", project: "shop", card: 2, answer: gift })).toEqual({ project: "shop", card: 2, answer: gift });
    expect(cardAnsweredOf({ ev: "card_answered", project: "shop", card: 2, answer: null })?.answer).toBeNull();
    expect(cardAnsweredOf({ ev: "card_answered", project: "shop", card: 2, answer: { said: "2" } })?.answer).toBeNull();
    expect(cardAnsweredOf({ ev: "sent", project: "shop", card: 2 })).toBeNull();
  });

  it("the store keeps the row in the thread he answered from, once per card", () => {
    const sent: unknown[] = [];
    const s = new Store({ send: (c) => sent.push(c) }, { now: () => 42 });
    s.answer("shop", 2, "2", undefined, undefined, { at: { project: "telemetry", agent: "main" } });
    expect(sent).toEqual([{ cmd: "answer", project: "shop", card: 2, reply: "2" }]);
    expect(s.apply({ ev: "card_answered", project: "shop", card: 2, answer: gift })).toBe(true);
    expect(s.asides("telemetry/main").map((a) => a.notice)).toEqual(["you answered docs: only at checkout"]);
    // a second result for the same card (none waits for it) changes nothing
    expect(s.apply({ ev: "card_answered", project: "shop", card: 2, answer: gift })).toBe(true);
    expect(s.asides("telemetry/main")).toHaveLength(1);
  });

  it("his rows come back after a reload (the window's keep), the newest ASIDES_KEPT, junk dropped", () => {
    const kept = new Map<string, unknown>();
    const asides = { read: (k: string) => kept.get(k), write: (k: string, v: unknown) => kept.set(k, v) };
    const s = new Store({ send: () => undefined }, { now: () => 42, asides });
    s.answer("shop", 2, "2", undefined, undefined, { at: { project: "telemetry", agent: "main" } });
    s.apply({ ev: "card_answered", project: "shop", card: 2, answer: gift });
    const again = new Store({ send: () => undefined }, { asides });
    expect(again.asides("telemetry/main").map((a) => a.key)).toEqual(["shop/2"]);
    const a = again.asides("telemetry/main")[0];
    const many = Array.from({ length: ASIDES_KEPT + 3 }, (_, i) => ({ ...a, key: `shop/${String(i)}`, card: i }));
    expect(asidesOf([{ key: 1 }, ...many, "x"]).map((x) => x.card)).toEqual(many.slice(-ASIDES_KEPT).map((x) => x.card));
    expect(asidesOf("nope")).toEqual([]);
  });

  it("stale-aside: the old build's own-words row (no hub row behind it) is dropped on load, and leaves the keep once", () => {
    // his keep-window.json, written by 0170ed3f in bise's view (harness main), word for word
    const legacy = {
      key: "ts-pattern-4b4afb4c/14",
      project: "ts-pattern-4b4afb4c",
      card: 14,
      notice: "you answered pattern-error-dx: open it on GitHub",
      note: "",
      at_ms: 1791964531024,
    };
    const tkey = "harness-3abb2bd8/main";
    const kept = new Map<string, unknown>([[`asides:${tkey}`, [legacy]]]);
    const writes: string[] = [];
    const asides = { read: (k: string) => kept.get(k), write: (k: string, v: unknown) => (writes.push(k), kept.set(k, v)) };
    expect(asidesOf([legacy])).toEqual([]);
    const s = new Store({ send: () => undefined }, { asides });
    expect(s.asides(tkey)).toEqual([]);
    expect(kept.get(`asides:${tkey}`)).toEqual([]);
    expect(writes).toEqual([`asides:${tkey}`]);
    // the next load finds nothing to drop: no write
    expect(new Store({ send: () => undefined }, { asides }).asides(tkey)).toEqual([]);
    expect(writes).toHaveLength(1);
    // a row the hub's word drew stays, next to it
    const hub = { ...legacy, key: "shop/2", project: "shop", card: 2, notice: "you answered docs: only at checkout", by: "hub" };
    kept.set(`asides:${tkey}`, [legacy, hub]);
    expect(new Store({ send: () => undefined }, { asides }).asides(tkey)).toEqual([hub]);
    expect(kept.get(`asides:${tkey}`)).toEqual([hub]);
  });

  it("no path writes a row the hub didn't word: every kept row carries by 'hub'", () => {
    const kept = new Map<string, unknown>();
    const asides = { read: (k: string) => kept.get(k), write: (k: string, v: unknown) => kept.set(k, v) };
    const s = new Store({ send: () => undefined }, { now: () => 42, asides });
    const at = { project: "harness", agent: "main" };
    s.answer("ts-pattern", 14, "1", undefined, undefined, { at });
    s.apply({ ev: "card_answered", project: "ts-pattern", card: 14, answer: null });
    s.answer("shop", 2, "2", undefined, undefined, { at });
    s.apply({ ev: "card_answered", project: "shop", card: 2, answer: gift });
    const rows = kept.get("asides:harness/main") as { card: number; by?: string }[];
    expect(rows.map((r) => [r.card, r.by])).toEqual([[2, "hub"]]);
  });
});
