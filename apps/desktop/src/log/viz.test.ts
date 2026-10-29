import { describe, expect, it } from "vitest";
import type { CompPart, CompRow } from "@/proto";
import { filterRows, histogram, level, pathOf, peaks, quantile, series, share, total } from "./viz";

const part = (role: CompPart["role"], kind: CompPart["kind"], names: string[], tokens: number): CompPart => ({
  role,
  kind,
  ...(names.length > 0 ? { names } : {}),
  tokens,
});

const row = (n: number, parts: CompPart[]): CompRow => ({
  n,
  role: "x",
  head: "",
  blocks: [],
  bytes: 0,
  tokens: parts.reduce((a, p) => a + p.tokens, 0),
  parts,
});

// a small request: the head, the prompt, his words, two bash calls and their results, an agent message
const rows: CompRow[] = [
  row(0, [part("system", "tools", ["bash"], 300), part("system", "params", [], 20)]),
  row(1, [part("system", "prompt", [], 1000)]),
  row(2, [part("user", "words", [], 50)]),
  row(3, [part("assistant", "text", [], 10), part("tool_call", "tool", ["bash", "git"], 30), part("tool_call", "tool", ["bash", "rg"], 20)]),
  row(4, [part("tool_result", "tool", ["bash", "git"], 400), part("tool_result", "tool", ["bash", "rg"], 2000)]),
  row(5, [part("user", "agent_message", ["main"], 120), part("tool_result", "tool", ["bash"], 5)]),
];

describe("the groups", () => {
  it("a part's path is its role, its kind or its tool, its names", () => {
    expect(pathOf(part("tool_result", "tool", ["bash", "git"], 1))).toEqual(["tool_result", "n:bash", "n:git"]);
    expect(pathOf(part("user", "agent_message", ["main"], 1))).toEqual(["user", "k:agent_message", "n:main"]);
    expect(pathOf(part("system", "prompt", [], 1))).toEqual(["system", "k:prompt"]);
  });

  it("a level sums its children, biggest first, and the sum is the whole", () => {
    const top = level(rows, []);
    expect(top.map((n) => [n.key, n.tokens])).toEqual([
      ["tool_result", 2405],
      ["system", 1320],
      ["user", 170],
      ["tool_call", 50],
      ["assistant", 10],
    ]);
    expect(top.reduce((a, n) => a + n.tokens, 0)).toBe(total(rows));
    const bash = level(rows, ["tool_result", "n:bash"]);
    // the result with no program is the level's 'other'
    expect(bash.map((n) => [n.key, n.tokens, n.rest])).toEqual([
      ["n:rg", 2000, false],
      ["n:git", 400, false],
      ["other", 5, true],
    ]);
    expect(level(rows, ["tool_result"])[0]?.deeper).toBe(true);
  });

  it("past 8 children, the 7 biggest and one 'other'", () => {
    const many = [row(1, Array.from({ length: 10 }, (_, i) => part("tool_call", "tool", [`t${String(i)}`], 100 - i)))];
    const l = level(many, ["tool_call"]);
    expect(l).toHaveLength(8);
    expect(l[7]).toMatchObject({ key: "other", tokens: 93 + 92 + 91, count: 3, rest: true });
    expect(filterRows(many, { sel: l[7] })).toHaveLength(1);
  });
});

describe("the filter", () => {
  it("keeps the messages with a part in the group", () => {
    expect(filterRows(rows, { sel: { path: ["tool_result", "n:bash"] } }).map((r) => r.n)).toEqual([4, 5]);
    expect(filterRows(rows, { sel: { path: ["tool_result", "n:bash", "n:git"] } }).map((r) => r.n)).toEqual([4]);
    expect(filterRows(rows, { sel: { path: ["user"] } }).map((r) => r.n)).toEqual([2, 5]);
    expect(filterRows(rows, {}).map((r) => r.n)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("the 'other' node keeps what the shown keys don't", () => {
    const other = level(rows, ["tool_result", "n:bash"]).find((n) => n.rest);
    expect(filterRows(rows, { sel: other }).map((r) => r.n)).toEqual([5]);
  });

  it("a size range applies to the same part as the group", () => {
    // row 4 has a git result of 400 and an rg one of 2000: git at 1000-3000 keeps nothing
    const sel = { path: ["tool_result", "n:bash", "n:git"] };
    expect(filterRows(rows, { sel, size: { from: 1000, to: 3000 } })).toEqual([]);
    expect(filterRows(rows, { sel, size: { from: 300, to: 500 } }).map((r) => r.n)).toEqual([4]);
  });
});

describe("the histogram", () => {
  it("bins from 0 to the p99, the rest counted over", () => {
    const sizes = [...Array.from({ length: 99 }, (_, i) => i * 10), 100_000];
    const many = [row(1, sizes.map((t) => part("tool_result", "tool", ["bash"], t)))];
    const h = histogram(many, undefined, 10);
    expect(h.n).toBe(100);
    expect(h.p99).toBe(980);
    expect(h.over).toBe(1);
    expect(h.bins.reduce((a, b) => a + b.count, 0)).toBe(99);
    expect(h.bins[0]?.from).toBe(0);
    expect(h.bins.at(-1)?.to).toBeGreaterThan(980);
  });

  it("follows the group", () => {
    const h = histogram(rows, { path: ["tool_result"] });
    expect(h.n).toBe(3);
    expect(h.median).toBe(400);
  });

  it("an empty group draws empty bins", () => {
    const h = histogram(rows, { path: ["nobody"] });
    expect(h.n).toBe(0);
    expect(h.bins.every((b) => b.count === 0)).toBe(true);
  });

  it("quantile is the nearest rank", () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2);
    expect(quantile([], 0.5)).toBe(0);
  });
});

describe("the series", () => {
  it("one bar per message, the group's share in it, the peaks tallest first", () => {
    const s = series(rows, { path: ["tool_result"] });
    expect(s.map((b) => b.n)).toEqual([1, 2, 3, 4, 5]);
    expect(s.find((b) => b.n === 5)).toEqual({ n: 5, tokens: 125, picked: 5 });
    expect(peaks(s, 2).map((b) => b.n)).toEqual([4, 5]);
    expect(peaks(series(rows, undefined), 1).map((b) => b.n)).toEqual([4]);
  });

  it("share says <1% when small", () => {
    expect(share(1, 1000)).toBe("<1%");
    expect(share(500, 1000)).toBe("50%");
  });
});
