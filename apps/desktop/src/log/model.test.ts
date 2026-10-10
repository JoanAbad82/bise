import { describe, expect, it } from "vitest";
import type { LogItem } from "@/proto";
import {
  codeText,
  findCount,
  findRows,
  foldLabel,
  folds,
  kindOf,
  kindsIn,
  labelOf,
  ruleKind,
  shortBytes,
  shown,
  sizeOf,
  timeOf,
  withOlder,
} from "./model";

const item = (
  seq: number,
  role: LogItem["role"],
  over: Partial<LogItem> = {},
): LogItem => ({ seq, role, head: `row ${String(seq)}`, ...over });

describe("log model", () => {
  it("labels rows with the TUI's role column words", () => {
    expect(labelOf(item(1, "you"), "perf")).toBe("› you");
    expect(labelOf(item(1, "assistant"), "perf")).toBe("● perf");
    expect(labelOf(item(1, "assistant"), "checkout-flow")).toBe("● agent");
    expect(labelOf(item(1, "call", { tool: "bash" }), "perf")).toBe("$ bash");
    expect(labelOf(item(1, "call", { tool: "run_typescript" }), "perf")).toBe(
      "⌁ ts",
    );
    expect(labelOf(item(1, "call", { tool: "grep" }), "perf")).toBe("grep");
    expect(labelOf(item(1, "result", { ok: true }), "perf")).toBe("└ result");
    expect(labelOf(item(1, "result", { ok: false }), "perf")).toBe("✗ result");
    expect(labelOf(item(1, "injected"), "perf")).toBe("⊕ bise");
    expect(labelOf(item(0, "tools"), "perf")).toBe("§ tools");
  });

  it("gives each role its colour kind", () => {
    expect(kindOf(item(1, "result", { ok: false }))).toBe("failed");
    expect(kindOf(item(1, "result"))).toBe("result");
    expect(kindOf(item(0, "tools"))).toBe("system");
    expect(kindOf(item(1, "unknown"))).toBe("event");
  });

  it("folds past 6 lines with the TUI's words", () => {
    const text = Array.from(
      { length: 34 },
      (_, i) => `line ${String(i)} ${"x".repeat(55)}`,
    ).join("\n");
    const long = item(5, "result", { body: { kind: "plain", text } });
    expect(folds(long)).toBe(true);
    expect(foldLabel(long)).toBe(`▸ 34 lines · ${shortBytes(text.length)}`);
    expect(
      folds(
        item(6, "you", { body: { kind: "md", text: "a\nb\nc\nd\ne\nf\n" } }),
      ),
    ).toBe(false);
    expect(folds(item(7, "you"))).toBe(false);
  });

  it("sizes bodies in UTF-8 bytes as short_bytes does", () => {
    expect(shortBytes(512)).toBe("512 B");
    expect(shortBytes(2150)).toBe("2.1 KB");
    expect(shortBytes(3 * 1024 * 1024)).toBe("3.0 MB");
    expect(sizeOf(item(1, "you", { body: { kind: "md", text: "é" } }))).toBe(
      "2 B",
    );
    expect(sizeOf(item(1, "event"))).toBe("");
  });

  it("draws compactions green, turns faint", () => {
    expect(ruleKind("compacted · 42k → 9k")).toBe("compact");
    expect(ruleKind("turn 4 · 801k in")).toBe("turn");
  });

  it("reads times as HH:MM:SS", () => {
    expect(timeOf(Date.UTC(2026, 0, 2, 14, 2, 13), "UTC")).toBe("14:02:13");
    expect(timeOf(undefined)).toBe("");
  });

  it("pretty-prints JSON bodies, leaves cut ones as written", () => {
    expect(
      codeText(
        item(1, "call", {
          body: { kind: "code", lang: "json", text: '{"a":1}' },
        }),
      ),
    ).toEqual({ text: '{\n  "a": 1\n}', lang: "json" });
    expect(
      codeText(
        item(1, "call", {
          body: { kind: "code", lang: "json", text: '{"a":', cut: true },
        }),
      ),
    ).toEqual({ text: '{"a":', lang: "json" });
    expect(
      codeText(
        item(1, "call", { body: { kind: "code", lang: "bash", text: "ls" } }),
      ),
    ).toEqual({ text: "ls", lang: "bash" });
  });

  it("puts an older page before the rows", () => {
    const rows = [item(10, "you"), item(11, "assistant")];
    expect(
      withOlder(rows, [item(8, "you"), item(9, "assistant")]).map((r) => r.seq),
    ).toEqual([8, 9, 10, 11]);
    expect(withOlder([], [item(1, "you")]).map((r) => r.seq)).toEqual([1]);
  });

  it("finds in heads, bodies and rules, and counts", () => {
    const rows = [
      item(1, "you", { head: "make it fast" }),
      item(2, "result", {
        head: "ok",
        body: { kind: "plain", text: "FAILED query::slow" },
      }),
      item(3, "event", { head: "", rule: "turn 2 · slow" }),
    ];
    expect(findRows(rows, "slow")).toEqual([1, 2]);
    expect(findRows(rows, "  ")).toEqual([]);
    expect(findCount(0, 2)).toBe("1 of 2");
    expect(findCount(0, 0)).toBe("no match");
  });

  it("filters by kind, rules always shown", () => {
    const rows = [
      item(1, "you"),
      item(2, "thinking"),
      item(3, "event", { head: "", rule: "turn 1" }),
    ];
    expect(kindsIn(rows)).toEqual(["you", "thinking"]);
    const hidden = new Set(["thinking"] as const);
    expect(rows.filter((r) => shown(r, hidden)).map((r) => r.seq)).toEqual([
      1, 3,
    ]);
  });
});
