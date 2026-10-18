import { describe, expect, it } from "vitest";
import type { Entry } from "@/proto";
import type { CoreCmd } from "@/shared/api";
import { Store } from "./store";
import { threadKey, type ThreadOrder } from "./types";
import { JUMP_AFTER, JUMP_LIMIT, NEWER_LIMIT, NEWER_LINES, answers, merged, planJump, planNewer } from "./window";

const P = "acme-1a2b3c4d";
const K = threadKey(P, "perf");
const range = (a: number, b: number): number[] => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const tail: ThreadOrder = { order: range(5000, 5039), before: 5000, more: true, loaded: true };

function fake(): { sent: CoreCmd[]; store: Store } {
  const sent: CoreCmd[] = [];
  const store = new Store({ send: (c) => sent.push(c) }, { now: () => 1000 });
  store.setCore("up");
  return { sent, store };
}

const entry = (pos: number): Entry => ({ pos, at_ms: pos, kind: "agent", text: `e${String(pos)}` });
const page = (store: Store, pos: readonly number[], before: number | null, more: boolean) => {
  store.apply({ ev: "thread", project: P, agent: "perf", entries: pos.map(entry), before, more });
};

describe("window (pure)", () => {
  it("a jump to a held entry shows it; to a far one asks the page around it, under the tail", () => {
    expect(planJump(tail, 5010)).toEqual({ kind: "held", pos: 5010 });
    expect(planJump({ ...tail, loaded: false }, 10)).toEqual({ kind: "wait" });
    const p = planJump(tail, 120);
    expect(p.kind).toBe("ask");
    if (p.kind !== "ask") return;
    expect(p.ask).toEqual({ kind: "jump", pos: 120, before: 120 + 1 + JUMP_AFTER, hi: 5000 });
    expect(p.limit).toBe(JUMP_LIMIT);
  });

  it("a jump near the tail asks the page right under it: one run, no gap", () => {
    const p = planJump(tail, 4990);
    if (p.kind !== "ask") throw new Error("ask");
    expect(p.ask.before).toBe(5000);
    const v = merged(tail, range(4950, 4999), 4950, true, p.ask);
    expect(v.gap).toBeUndefined();
    expect(v.order[0]).toBe(4950);
  });

  it("the jump's page becomes the window: its cut newest entry held back, the gap to the tail", () => {
    const p = planJump(tail, 120);
    if (p.kind !== "ask") throw new Error("ask");
    const v = merged(tail, range(90, 144), 90, true, p.ask);
    expect(v.gap).toEqual({ lo: 143, hi: 5000, from: 144 });
    expect(v.order.includes(144)).toBe(false);
    expect(v.order.includes(120)).toBe(true);
    expect([v.before, v.more]).toEqual([90, true]);
  });

  it("newer pages fill the gap until they meet the tail, then it merges", () => {
    let v: ThreadOrder = { ...tail, order: [...range(90, 143), ...tail.order], before: 90, gap: { lo: 143, hi: 5000, from: 144 } };
    for (let n = 0; v.gap !== undefined; n++) {
      expect(n).toBeLessThan(40);
      const plan = planNewer(v);
      if (plan === null) throw new Error("plan");
      expect(plan.limit).toBe(NEWER_LIMIT);
      expect(plan.ask.before).toBe(Math.min(v.gap.from + NEWER_LINES, 5000));
      // the hub: the newest entries of the lines before `before` (one entry per 3 lines here)
      const got = range(Math.max(1, plan.ask.before - 600), plan.ask.before - 1).filter((x) => x % 3 === 0).slice(-NEWER_LIMIT);
      expect(answers(plan.ask, v, got)).toBe(true);
      v = merged(v, got, got[0] ?? null, true, plan.ask);
    }
    // whole: every entry between the window and the tail, once, in order
    expect(v.order.filter((x) => x > 143 && x < 5000)).toEqual(range(144, 4999).filter((x) => x % 3 === 0));
    // a newer page reads lines under the window too: one run, its before the oldest held
    expect(v.before).toBe(v.order[0]);
  });

  it("a page that is not the window's leaves the gap alone; the tail's page reaching into it moves its top", () => {
    const v: ThreadOrder = { ...tail, order: [...range(90, 143), ...tail.order], before: 90, gap: { lo: 143, hi: 5000, from: 144 } };
    // an older page of the window
    const older = merged(v, range(50, 89), 50, true, null);
    expect(older.gap).toEqual(v.gap);
    expect([older.before, older.order[0]]).toEqual([50, 50]);
    // a reconnection's tail page, longer than the tail
    const re = merged(v, range(4900, 5060), 4900, true, null);
    expect(re.gap).toEqual({ lo: 143, hi: 4900, from: 144 });
    expect(re.before).toBe(90);
  });

  it("an older page of the old window is never taken for the jump's answer", () => {
    const ask = { kind: "jump", pos: 2000, before: 2025, hi: 5000 } as const;
    expect(answers(ask, tail, range(50, 89))).toBe(false);
    expect(answers(ask, tail, range(1980, 2024))).toBe(true);
    expect(answers(ask, tail, range(4990, 5039))).toBe(false);
  });
});

describe("window (store)", () => {
  it("opens at pos, pages newer until merged; a live entry while open lands in the tail only", () => {
    const { store, sent } = fake();
    page(store, range(5000, 5039), 5000, true);
    expect(store.jumpTo(P, "perf", 120)).toEqual({ kind: "asked" });
    expect(sent.at(-1)).toEqual({ cmd: "page", project: P, agent: "perf", before: 145, limit: JUMP_LIMIT });
    // asked again while on its way: no second page
    expect(store.jumpTo(P, "perf", 120)).toEqual({ kind: "asked" });
    expect(sent.filter((c) => c.cmd === "page")).toHaveLength(1);
    page(store, range(90, 144), 90, true);
    expect(store.jumpTo(P, "perf", 120)).toEqual({ kind: "held", pos: 120 });
    expect(store.threadOrder(K).gap).toEqual({ lo: 143, hi: 5000, from: 144 });
    // live: a new entry, then an old one re-sent from inside the gap
    store.apply({ ev: "entry", project: P, agent: "perf", entry: entry(5040) });
    store.apply({ ev: "entry", project: P, agent: "perf", entry: entry(3000) });
    expect(store.threadOrder(K).order.at(-1)).toBe(5040);
    expect(store.threadOrder(K).order.includes(3000)).toBe(false);
    // newer pages until merged
    for (let n = 0; store.threadOrder(K).gap !== undefined; n++) {
      expect(n).toBeLessThan(40);
      const before = sent.length;
      store.newerPage(P, "perf");
      store.newerPage(P, "perf"); // one at a time
      expect(sent.length).toBe(before + 1);
      const c = sent.at(-1) as { before: number };
      page(store, range(Math.max(1, c.before - 600), c.before - 1).slice(-NEWER_LIMIT), c.before - 200, true);
    }
    const v = store.threadOrder(K);
    expect(v.order.filter((x) => x >= 90)).toEqual(range(90, 5040));
    expect(v.before).toBe(90);
  });

  it("a new jump replaces the window: the tail with its own before, then the new window", () => {
    const { store, sent } = fake();
    page(store, range(5000, 5039), 5000, true);
    store.jumpTo(P, "perf", 120);
    page(store, range(90, 144), 90, true);
    expect(store.jumpTo(P, "perf", 2000)).toEqual({ kind: "asked" });
    expect(store.threadOrder(K).order[0]).toBe(5000);
    expect(store.threadOrder(K).before).toBe(5000);
    expect(sent.at(-1)).toMatchObject({ before: 2025 });
    page(store, range(1970, 2024), 1970, true);
    const v = store.threadOrder(K);
    expect(v.order.includes(120)).toBe(false);
    expect(v.gap).toEqual({ lo: 2023, hi: 5000, from: 2024 });
  });

  it("a jump while the window's newer page is on its way waits for it: that page never lands in the tail without its gap (find-walk-red)", () => {
    const { store, sent } = fake();
    page(store, range(5000, 5039), 5000, true);
    store.jumpTo(P, "perf", 2000);
    page(store, range(1970, 2024), 1970, true);
    // the gap row shows under the window: its newer page goes
    store.newerPage(P, "perf");
    const newer = sent.at(-1) as { before: number };
    expect(newer.before).toBe(2174);
    // ⏎ to a match far above before it came: no page asked yet, the window stays
    const pages = sent.filter((c) => c.cmd === "page").length;
    expect(store.jumpTo(P, "perf", 120)).toEqual({ kind: "asked" });
    expect(sent.filter((c) => c.cmd === "page")).toHaveLength(pages);
    // the newer page comes, then the jump goes
    page(store, range(1574, 2173).slice(-NEWER_LIMIT), 1974, true);
    expect(store.jumpTo(P, "perf", 120)).toEqual({ kind: "asked" });
    expect(sent.at(-1)).toMatchObject({ cmd: "page", before: 145 });
    page(store, range(90, 144), 90, true);
    const v = store.threadOrder(K);
    // the window around 120, its gap to the tail; nothing of the old window's pages
    expect(v.order).toEqual([...range(90, 143), ...range(5000, 5039)]);
    expect(v.gap).toEqual({ lo: 143, hi: 5000, from: 144 });
  });
});
