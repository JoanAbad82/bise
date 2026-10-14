// card-state's laws: the cards he answered or closed have one owner, the store, and only the
// hub's rows take them out (his #384 came back on a project switch: a view's own copy). Owner: amb-home.
import { describe, expect, it } from "vitest";
import type { Card, ProjectRow } from "@/proto";
import { ACTED_KEPT, actedAdd, actedKeys, actedOf, actedPrune } from "./acted";
import { Store } from "./store";

const card = (project: string, id: number): Card => ({ id, project, kind: "question", agent: "docs", question: "?", options: [], urgent: false, since_ms: 0 });
const row = (project: string, ids: number[]): ProjectRow => ({ project, name: project, cards: ids.map((i) => card(project, i)) }) as unknown as ProjectRow;

function keepOf(): { read: (k: string) => unknown; write: (k: string, v: unknown) => void } {
  const kept = new Map<string, unknown>();
  return { read: (k) => kept.get(k), write: (k, v) => kept.set(k, v) };
}

describe("acted: the cards he answered or closed, one owner", () => {
  it("adds once per card, the newest last, at most ACTED_KEPT", () => {
    const a = actedAdd(actedAdd([], "shop", 2, 1), "shop", 2, 5);
    expect(a).toEqual([{ key: "shop-2", project: "shop", card: 2, at_ms: 5 }]);
    let many: ReturnType<typeof actedAdd> = [];
    for (let i = 0; i < ACTED_KEPT + 4; i += 1) many = actedAdd(many, "shop", i, i);
    expect(many).toHaveLength(ACTED_KEPT);
    expect(many[0]?.card).toBe(4);
  });

  it("only a loaded row that no longer lists the card takes it out; the same list when nothing goes", () => {
    const a = actedAdd(actedAdd([], "shop", 2, 1), "ts-pattern", 384, 2);
    // the hub still lists both: nothing goes, the same reference
    expect(actedPrune(a, [row("shop", [2]), row("ts-pattern", [384])])).toBe(a);
    // ts-pattern not loaded yet (a reload), or its row without its cards yet: its entry stays
    expect(actedPrune(a, [row("shop", [])]).map((x) => x.key)).toEqual(["ts-pattern-384"]);
    expect(actedPrune(a, [row("shop", []), { project: "ts-pattern" }]).map((x) => x.key)).toEqual(["ts-pattern-384"]);
    // its row came without the card: the hub closed it
    expect(actedPrune(a, [row("shop", []), row("ts-pattern", [])])).toEqual([]);
    expect(actedKeys(a)).toEqual(new Set(["shop-2", "ts-pattern-384"]));
  });

  it("reads the kept list back, junk dropped", () => {
    const ok = { key: "shop-2", project: "shop", card: 2, at_ms: 1 };
    expect(actedOf([ok, { key: "shop-3", project: "shop", card: 2, at_ms: 1 }, "x", null])).toEqual([ok]);
    expect(actedOf("nope")).toEqual([]);
  });

  it("the store: answer and close put it in, every reader sees the same set, rows take it out", () => {
    const sent: unknown[] = [];
    const s = new Store({ send: (c) => sent.push(c) }, { now: () => 7 });
    s.apply({ ev: "projects", projects: [row("ts-pattern", [384, 385])] });
    s.answer("ts-pattern", 384, "1");
    s.close("ts-pattern", 385);
    expect(s.acted().map((a) => a.key)).toEqual(["ts-pattern-384", "ts-pattern-385"]);
    expect(sent).toEqual([
      { cmd: "answer", project: "ts-pattern", card: 384, reply: "1" },
      { cmd: "close", project: "ts-pattern", card: 385 },
    ]);
    // the hub's next rows still list 384 (a merge running): it stays out; 385 closed: gone
    const before = s.acted();
    s.apply({ ev: "projects", projects: [row("ts-pattern", [384])] });
    expect(s.acted().map((a) => a.key)).toEqual(["ts-pattern-384"]);
    expect(s.acted()).not.toBe(before);
    // another project's rows (a project switch) never bring it back
    const same = s.acted();
    s.apply({ ev: "projects", projects: [row("ts-pattern", [384]), row("shop", [1])] });
    expect(s.acted()).toBe(same);
  });

  it("a reload keeps it until the rows drop it (his #384: never back once answered)", () => {
    const keep = keepOf();
    const s = new Store({ send: () => undefined }, { now: () => 7, asides: keep });
    s.answer("ts-pattern", 384, "1");
    const again = new Store({ send: () => undefined }, { asides: keep });
    expect(again.acted().map((a) => a.key)).toEqual(["ts-pattern-384"]);
    again.apply({ ev: "projects", projects: [row("ts-pattern", [])] });
    expect(again.acted()).toEqual([]);
    expect(new Store({ send: () => undefined }, { asides: keep }).acted()).toEqual([]);
  });
});
