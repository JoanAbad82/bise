// The store's laws for the slices that came later (computer use live, a tool call's real
// output, a diff that answers another view's req). Split out of store.test.ts (the file cap);
// the same fake port and fixtures. Owner: amb-core (the store), amb-win (the split).
import { describe, expect, it } from "vitest";
import type { CoreCmd } from "@/shared/api";
import { Store } from "./store";

const P = "acme-1a2b3c4d";

function fake(): { sent: CoreCmd[]; store: Store } {
  const sent: CoreCmd[] = [];
  const store = new Store({ send: (c) => sent.push(c) }, { now: () => 1000 });
  store.setCore("up");
  return { sent, store };
}

describe("computer use live (S29)", () => {
  it("keeps the rows whole, the latest still per agent in memory only, and sends acts by key", () => {
    const { sent, store } = fake();
    expect(store.computerLive()).toEqual([]);
    const rows = [
      {
        key: "h.perf",
        project: P,
        agent: "perf",
        driving: "Chrome",
        place: "amazon.fr",
        since_ms: 5,
        kind: "driving" as const,
        mark: "↖",
        words: "driving Chrome · amazon.fr",
      },
    ];
    store.apply({ ev: "computer_live", items: rows });
    expect(store.computerLive()).toEqual(rows);
    store.apply({ ev: "computer_live", items: [] });
    expect(store.computerLive()).toEqual([]);
    store.computer("take", "h.perf");
    store.computer("peek", "h.perf", 640);
    expect(sent.slice(-2)).toEqual([
      { cmd: "computer", act: "take", key: "h.perf" },
      { cmd: "computer", act: "peek", key: "h.perf", max_width: 640 },
    ]);
    const shot = {
      data: "QUJD",
      mime: "image/jpeg",
      width: 640,
      height: 400,
      at_ms: 9,
    };
    store.apply({ ev: "computer_peek", key: "h.perf", shot });
    store.apply({ ev: "computer_peek", key: "h.perf", why: "too_soon" });
    expect(store.peek("h.perf")).toEqual({
      ev: "computer_peek",
      key: "h.perf",
      why: "too_soon",
    });
    store.dropPeek("h.perf");
    expect(store.peek("h.perf")).toBeNull();
  });
});

describe("a tool call's real output (amb-feed dece0fe9)", () => {
  const P = "acme-1a2b3c4d";
  it("asks once, keeps the answer by its pos, and a refusal names the last ask", () => {
    const sent: CoreCmd[] = [];
    const store = new Store({ send: (c) => sent.push(c) }, { now: () => 1000 });
    store.askToolOut(P, "perf", 4);
    store.askToolOut(P, "perf", 4);
    expect(sent.filter((c) => c.cmd === "tool_out")).toEqual([
      { cmd: "tool_out", project: P, agent: "perf", pos: 4 },
    ]);
    store.apply({
      ev: "tool_out",
      project: P,
      agent: "perf",
      pos: 4,
      out: "running 40 tests",
      cut: true,
    });
    expect(store.toolOut(P, "perf", 4)).toEqual({
      out: "running 40 tests",
      cut: true,
    });
    // the whole size, when the hub read the session log (amb-feed a928ab09)
    store.apply({
      ev: "tool_out",
      project: P,
      agent: "perf",
      pos: 5,
      out: "running 40 tests",
      cut: true,
      total: 18_432,
    });
    expect(store.toolOut(P, "perf", 5)).toEqual({
      out: "running 40 tests",
      cut: true,
      total: 18_432,
    });
    store.askToolOut(P, "perf", 4);
    expect(
      sent.filter((c) => c.cmd === "tool_out"),
      "answered: never asked again",
    ).toHaveLength(1);
    store.askToolOut(P, "perf", 9);
    store.apply({
      ev: "error",
      cmd: "tool_out",
      project: P,
      text: "no result yet",
    });
    expect(store.toolOut(P, "perf", 9)).toEqual({ error: "no result yet" });
    expect(store.toolOut(P, "perf", 7)).toBeNull();
  });
});

describe("a diff that answers another view's req (lead m_16528)", () => {
  it("a terminal's /diff answer (req this window never sent) never replaces the review's diff", () => {
    const store = new Store(null);
    const review = {
      ev: "diff",
      project: P,
      agent: "perf",
      base: "main",
      files: [],
    } as const;
    store.apply(review);
    expect(store.diff(P, "perf")).toMatchObject({ base: "main" });
    store.apply({
      ev: "diff",
      project: P,
      agent: "perf",
      base: "HEAD~1",
      files: [],
      req: 7,
    });
    expect(store.diff(P, "perf"), "someone else's req: dropped").toMatchObject({
      base: "main",
    });
    store.apply({
      ev: "diff",
      project: P,
      agent: "perf",
      base: "HEAD~2",
      files: [],
    });
    expect(store.diff(P, "perf"), "no req: the review asked it").toMatchObject({
      base: "HEAD~2",
    });
  });
  it("main's newer hub tags (amb-feed m_16785): state per project; the moments only through onEvent", () => {
    const { store, sent } = fake();
    const seen: string[] = [];
    store.onEvent((ev) => seen.push(ev.ev));
    store.apply({
      ev: "branches",
      project: P,
      base: "main",
      rows: [
        { branch: "sb/perf", agents: ["perf"], commits: 2, uncommitted: 1 },
      ],
    });
    expect(store.branches(P)).toEqual({
      base: "main",
      rows: [
        { branch: "sb/perf", agents: ["perf"], commits: 2, uncommitted: 1 },
      ],
    });
    store.apply({
      ev: "versions",
      project: P,
      current: "9f0e2aa",
      items: [{ rev: "9f0e2aa", subject: "fix", marks: ["current"] }],
    });
    expect(store.versions(P)).toEqual({
      current: "9f0e2aa",
      dev: false,
      installed: false,
      items: [{ rev: "9f0e2aa", subject: "fix", marks: ["current"] }],
    });
    expect(store.flow(P), "before the hub said").toBeNull();
    store.apply({ ev: "flow", project: P, flow: "pr" });
    expect(store.flow(P)).toBe("pr");
    store.apply({ ev: "flow", project: P });
    expect(store.flow(P), "not set").toBeNull();
    store.apply({ ev: "pages", project: P, items: [], overdue: 2 });
    expect(store.pages(P)).toEqual({ items: [], overdue: 2 });
    store.apply({
      ev: "update",
      project: P,
      state: "building",
      rev: "1152b33",
      elapsed: 130,
    });
    expect(store.hubUpdate(P)).toMatchObject({
      state: "building",
      rev: "1152b33",
      elapsed: 130,
    });
    store.apply({
      ev: "update",
      project: P,
      state: "failed",
      rev: "1152b33",
      text: "couldn't build",
      tail: ["error"],
    });
    expect(store.hubUpdate(P), "whole each time").toMatchObject({
      state: "failed",
      text: "couldn't build",
      tail: ["error"],
    });
    expect(store.hubUpdate(P)).not.toHaveProperty("elapsed");
    store.apply({
      ev: "release",
      project: P,
      state: "plan",
      tag: "v2026.10.3",
    });
    expect(store.release(P)).toMatchObject({
      state: "plan",
      tag: "v2026.10.3",
    });
    // moments: read through onEvent, nothing kept
    store.apply({ ev: "card_open", project: P, id: 13 });
    store.apply({ ev: "focused", project: P, focus: "main" });
    expect(seen.filter((t) => t === "card_open" || t === "focused")).toEqual([
      "card_open",
      "focused",
    ]);
    store.askBranches(P);
    store.askVersions(P);
    expect(sent.slice(-2)).toEqual([
      { cmd: "branches", project: P },
      { cmd: "versions", project: P },
    ]);
  });
  it("takes back a queued message: queued_take with its id; its words, or the hub refusal on that one (amb-feed 34c35175)", () => {
    const { store, sent } = fake();
    expect(store.queuedTaken(P, "perf", 4)).toBeNull();
    store.queuedTake(P, "perf", 4);
    expect(sent.at(-1)).toEqual({
      cmd: "queued_take",
      project: P,
      agent: "perf",
      id: 4,
    });
    store.apply({
      ev: "queued_taken",
      project: P,
      agent: "perf",
      id: 4,
      text: "then open a PR",
    });
    expect(store.queuedTaken(P, "perf", 4)).toEqual({ text: "then open a PR" });
    // asked again: the old answer goes; a refusal lands on that ask
    store.queuedTake(P, "perf", 5);
    store.apply({
      ev: "error",
      project: P,
      cmd: "queued_take",
      text: "already delivered",
    });
    expect(store.queuedTaken(P, "perf", 5)).toEqual({
      error: "already delivered",
    });
    expect(store.queuedTaken(P, "perf", 4)).toEqual({ text: "then open a PR" });
  });
});
