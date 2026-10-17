import { describe, expect, it } from "vitest";
import { Store } from "./store";
import { ANSWERS_KEPT, answeredFromOf, answersOf, cardAnsweredOf, jumpOf, keptAnswers } from "./answered";

const gift = { agent: "docs", question: "where?", said: "2", pick: "only at checkout", notice: "you answered docs: only at checkout" };

describe("answer-in-thread A: where he answered, where the window goes", () => {
  it("keeps where he made an answer the hub took: a thread, or the inbox screen; nothing for one it didn't take", () => {
    expect(answeredFromOf({ at: { project: "home", agent: "main" } }, "shop", 4, gift, 1000)).toEqual({ key: "shop/4", project: "shop", card: 4, from: { project: "home", agent: "main" }, at_ms: 1000 });
    expect(answeredFromOf({ at: null, inbox: true }, "shop", 4, gift, 1000)?.from).toBe("inbox");
    expect(answeredFromOf({ at: { project: "home", agent: "main" } }, "shop", 4, null, 1000)).toBeNull();
    expect(answeredFromOf({ at: null }, "shop", 4, gift, 1000)).toBeNull();
  });

  it("goes to the asking project's main thread from bise's view or another project; never for bise's own card, the project in view, the inbox screen or an answer not taken", () => {
    const bise = { at: { project: "home", agent: "main" } };
    expect(jumpOf(bise, "ts", "home", true)).toEqual({ project: "ts", agent: "main" });
    expect(jumpOf({ at: { project: "shop", agent: "docs" } }, "ts", "home", true)).toEqual({ project: "ts", agent: "main" });
    expect(jumpOf({ at: { project: "ts", agent: "docs" } }, "ts", "home", true)).toBeNull();
    expect(jumpOf({ at: { project: "ts", agent: "main" } }, "home", "home", true)).toBeNull();
    expect(jumpOf({ at: null, inbox: true }, "ts", "home", true)).toBeNull();
    expect(jumpOf(bise, "ts", "home", false)).toBeNull();
  });

  it("one per card, the newest kept; a read drops what doesn't read", () => {
    const a = (card: number) => ({ key: `p/${String(card)}`, project: "p", card, from: "inbox" as const, at_ms: card });
    expect(keptAnswers([a(1), a(2)], { ...a(1), at_ms: 9 }).map((x) => [x.card, x.at_ms])).toEqual([[2, 2], [1, 9]]);
    const many = Array.from({ length: ANSWERS_KEPT + 3 }, (_, i) => a(i));
    expect(answersOf([{ key: 1 }, ...many, "x"]).map((x) => x.card)).toEqual(many.slice(-ANSWERS_KEPT).map((x) => x.card));
    expect(answersOf("nope")).toEqual([]);
  });

  it("reads the window-local event; a bad answer is the fallback", () => {
    expect(cardAnsweredOf({ ev: "card_answered", project: "shop", card: 2, answer: gift })).toEqual({ project: "shop", card: 2, answer: gift });
    expect(cardAnsweredOf({ ev: "card_answered", project: "shop", card: 2, answer: { said: "2" } })?.answer).toBeNull();
    expect(cardAnsweredOf({ ev: "sent", project: "shop", card: 2 })).toBeNull();
  });

  it("the store: his answer from bise's view keeps where, says the jump, draws nothing in bise's thread; a reload keeps where, never the jump", () => {
    const kept = new Map<string, unknown>();
    const keep = { read: (k: string) => kept.get(k), write: (k: string, v: unknown) => kept.set(k, v) };
    const s = new Store({ send: () => undefined }, { now: () => 42, asides: keep });
    s.apply({ ev: "projects", projects: [{ project: "home", name: "bise", path: "/h", git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }] });
    s.do({ i: "answer", project: "ts", card: 384, reply: "2", from: { at: { project: "home", agent: "main" } } });
    expect(s.apply({ ev: "card_answered", project: "ts", card: 384, answer: gift })).toBe(true);
    expect(s.answeredFrom("ts", 384)?.from).toEqual({ project: "home", agent: "main" });
    expect(s.answerJump()).toEqual({ project: "ts", agent: "main", card: 384, seq: 1 });
    const again = new Store({ send: () => undefined }, { asides: keep });
    expect(again.answeredFrom("ts", 384)?.at_ms).toBe(42);
    expect(again.answerJump()).toBeNull();
  });
});
