// refused.ts: a refused answer or close says so on that card, where he is, until he acts again or
// the hub takes it (try-gate-f2a7: the words were only the project's error line, and stayed after
// the hub took the late answer). Owner: amb-home.
import { describe, expect, it } from "vitest";
import type { Card, ProjectRow } from "@/proto";
import { REFUSED_KEPT, refusedAdd, refusedDrop, refusedLine, refusedListOf, refusedOf, refusedPrune } from "./refused";
import { Store } from "./store";

const card = (project: string, id: number): Card => ({ id, project, kind: "question", agent: "docs", question: "?", options: [], urgent: false, since_ms: 0 });
const row = (project: string, ids: number[]): ProjectRow => ({ project, name: project, cards: ids.map((i) => card(project, i)) }) as unknown as ProjectRow;

function keepOf(): { read: (k: string) => unknown; write: (k: string, v: unknown) => void } {
  const kept = new Map<string, unknown>();
  return { read: (k) => kept.get(k), write: (k, v) => kept.set(k, v) };
}

describe("refused: the hub's words on the card that came back", () => {
  it("adds once per card (the newest words), drops by card, at most REFUSED_KEPT", () => {
    const a = refusedAdd(refusedAdd([], "shop", 2, "no", 1), "shop", 2, "late", 5, { kind: "close" });
    expect(a).toEqual([{ key: "shop-2", project: "shop", card: 2, text: "late", at_ms: 5, attempt: { kind: "close" } }]);
    expect(refusedOf(a, "shop", 2)?.text).toBe("late");
    expect(refusedOf(a, "shop", 3)).toBeNull();
    expect(refusedDrop(a, "shop", 3)).toBe(a);
    expect(refusedDrop(a, "shop", 2)).toEqual([]);
    let many: ReturnType<typeof refusedAdd> = [];
    for (let i = 0; i < REFUSED_KEPT + 3; i += 1) many = refusedAdd(many, "shop", i, "no", i);
    expect(many).toHaveLength(REFUSED_KEPT);
    expect(many[0]?.card).toBe(3);
  });

  it("only a loaded row that no longer lists the card takes it out (the hub took it late, or it went)", () => {
    const a = refusedAdd(refusedAdd([], "harness", 7, "its hub didn't answer.", 1), "ai-docs", 2, "no", 2);
    expect(refusedPrune(a, [row("harness", [7]), row("ai-docs", [2])])).toBe(a);
    expect(refusedPrune(a, [row("ai-docs", [2])])).toBe(a);
    expect(refusedPrune(a, [{ project: "harness", cards: undefined }])).toBe(a);
    expect(refusedPrune(a, [row("harness", []), row("ai-docs", [2])]).map((r) => r.key)).toEqual(["ai-docs-2"]);
  });

  it("reads the kept list back, junk dropped; the line", () => {
    const ok = refusedAdd([], "shop", 2, "no", 1, { kind: "answer", reply: "1" });
    expect(refusedListOf(JSON.parse(JSON.stringify(ok)))).toEqual(ok);
    expect(refusedListOf([{ key: "x", project: "shop", card: 2, text: "no", at_ms: 1 }, { ...ok[0], attempt: { kind: "fly" } }, 3, null])).toEqual([]);
    expect(refusedListOf("nope")).toEqual([]);
    expect(refusedLine("its hub didn't answer. try again in a moment.")).toBe("not sent: its hub didn't answer. try again in a moment");
  });

  it("the store: a refusal goes on that card, never the project's line; a late take, another try or the card's result clears it", () => {
    const sent: unknown[] = [];
    const s = new Store({ send: (c) => sent.push(c) }, { now: () => 7 });
    s.apply({ ev: "projects", projects: [row("ai-docs", []), row("harness", [7, 8, 9])] });
    s.do({ i: "answer", project: "harness", card: 7, reply: "1", from: { at: { project: "ai-docs", agent: "main" } } });
    s.do({ i: "close", project: "harness", card: 8 });
    s.do({ i: "answer", project: "harness", card: 9, reply: "keep it" });
    s.apply({ ev: "card_refused", project: "harness", card: 7, text: "its hub didn't answer. try again in a moment." });
    s.apply({ ev: "error", project: "harness", cmd: "answer", text: "its hub didn't answer. try again in a moment." });
    s.apply({ ev: "card_refused", project: "harness", card: 8, text: "its hub didn't answer. try again in a moment." });
    s.apply({ ev: "card_refused", project: "harness", card: 9, text: "card 9 isn't open" });
    expect(s.notice("harness")).toBeNull();
    expect(s.notice("ai-docs")).toBeNull();
    expect(s.refused().map((r) => [r.key, r.attempt?.kind])).toEqual([
      ["harness-7", "answer"],
      ["harness-8", "close"],
      ["harness-9", "answer"],
    ]);
    // the hub then took the late answer and close: its rows drop 7 and 8, their words go
    s.apply({ ev: "projects", projects: [row("ai-docs", []), row("harness", [9])] });
    expect(s.refused().map((r) => r.key)).toEqual(["harness-9"]);
    // 'try again': what he sent goes again, the words go while it is on its way, the card hides
    sent.length = 0;
    s.do({ i: "retry_card", project: "harness", card: 9 });
    expect(sent).toEqual([expect.objectContaining({ cmd: "answer", project: "harness", card: 9, reply: "keep it" })]);
    expect(s.refused()).toEqual([]);
    expect(s.acted().map((a) => a.key)).toContain("harness-9");
    // refused again, then its result comes (a new try from elsewhere took it): no words left
    s.apply({ ev: "card_refused", project: "harness", card: 9, text: "no" });
    expect(s.refused().map((r) => r.key)).toEqual(["harness-9"]);
    s.apply({ ev: "card_answered", project: "harness", card: 9, answer: null });
    expect(s.refused()).toEqual([]);
  });

  it("a retried close sends the close; a refusal it never sent from here has no 'try again'", () => {
    const sent: unknown[] = [];
    const s = new Store({ send: (c) => sent.push(c) }, { now: () => 7 });
    s.do({ i: "close", project: "harness", card: 8 });
    s.apply({ ev: "card_refused", project: "harness", card: 8, text: "no" });
    sent.length = 0;
    s.do({ i: "retry_card", project: "harness", card: 8 });
    expect(sent).toEqual([expect.objectContaining({ cmd: "close", project: "harness", card: 8 })]);
    s.apply({ ev: "card_refused", project: "harness", card: 4, text: "bise restarted" });
    expect(refusedOf(s.refused(), "harness", 4)?.attempt).toBeUndefined();
    sent.length = 0;
    s.do({ i: "retry_card", project: "harness", card: 4 });
    expect(sent).toEqual([]);
  });

  it("a reload keeps the words (and the try) until the rows drop the card", () => {
    const keep = keepOf();
    const s = new Store({ send: () => undefined }, { now: () => 7, asides: keep });
    s.do({ i: "answer", project: "harness", card: 7, reply: "1" });
    s.apply({ ev: "card_refused", project: "harness", card: 7, text: "no" });
    const again = new Store({ send: () => undefined }, { asides: keep });
    expect(again.refused().map((r) => [r.key, r.text, r.attempt?.kind])).toEqual([["harness-7", "no", "answer"]]);
    again.apply({ ev: "projects", projects: [row("harness", [])] });
    expect(again.refused()).toEqual([]);
    expect(new Store({ send: () => undefined }, { asides: keep }).refused()).toEqual([]);
  });
});
