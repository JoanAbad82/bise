import { describe, expect, it } from "vitest";
import {
  BREATH,
  CALM_MS,
  GUST5,
  GUST_MS,
  HUSH_MS,
  PULSE_MS,
  breathCell,
  gustCells,
  nextChange,
  pulseCell,
  toneOf,
  turnAge,
} from "./gust";

const at = (
  elapsed: number,
  o: { still?: boolean; typing?: boolean } = {},
) => ({ elapsed, still: o.still ?? false, typing: o.typing ?? false });
const text = (cells: readonly { g: string }[]): string =>
  cells.map((c) => c.g).join("");

describe("the gust (the TUI's W1, gust.rs)", () => {
  it("steps through the 9 frames, 110 ms each, and loops every 990 ms", () => {
    expect(GUST5).toHaveLength(9);
    GUST5.forEach((f, i) => {
      expect(text(gustCells(at(i * GUST_MS)))).toBe(f);
      expect(text(gustCells(at(i * GUST_MS + 109)))).toBe(f);
      expect(text(gustCells(at(990 + i * GUST_MS)))).toBe(f);
    });
    expect(text(gustCells(at(3 * GUST_MS)))).toBe("·~∿≈ ");
  });

  it("tones by glyph: ≈ ∿ ink, ~ text-2, · text-3", () => {
    expect(gustCells(at(3 * GUST_MS)).map((c) => c.tone)).toEqual([
      "t3",
      "t2",
      "ink",
      "ink",
      "t3",
    ]);
    expect(toneOf("≈")).toBe("ink");
    expect(toneOf("~")).toBe("t2");
    expect(toneOf("·")).toBe("t3");
  });

  it("calm while he types: half speed, each tone one step down", () => {
    expect(text(gustCells(at(CALM_MS, { typing: true })))).toBe(GUST5[1]);
    expect(text(gustCells(at(CALM_MS - 1, { typing: true })))).toBe(GUST5[0]);
    expect(
      gustCells(at(3 * CALM_MS, { typing: true })).map((c) => c.tone),
    ).toEqual(["t3", "t3", "t2", "t2", "t3"]);
  });

  it("still: one ∿ in ink, the box keeps its 5 cells", () => {
    const s = gustCells(at(4 * GUST_MS, { still: true }));
    expect(text(s)).toBe("∿    ");
    expect(s[0]?.tone).toBe("ink");
  });
});

describe("the breath and the hush", () => {
  it("breathes · ~ ∿ ≈ ∿ ~ at 110 ms", () => {
    expect(BREATH.map((_, i) => breathCell(at(i * GUST_MS)).g).join("")).toBe(
      "·~∿≈∿~",
    );
    expect(breathCell(at(6 * GUST_MS)).g).toBe("·");
  });

  it("while he types: one ∿ stepping text-2 / text-3 every 1.32 s", () => {
    expect(breathCell(at(0, { typing: true }))).toEqual({ g: "∿", tone: "t2" });
    expect(breathCell(at(HUSH_MS - 1, { typing: true }))).toEqual({
      g: "∿",
      tone: "t2",
    });
    expect(breathCell(at(HUSH_MS, { typing: true }))).toEqual({
      g: "∿",
      tone: "t3",
    });
  });

  it("still: ∿ in ink", () => {
    expect(breathCell(at(2 * GUST_MS + 7, { still: true }))).toEqual({
      g: "∿",
      tone: "ink",
    });
  });
});

describe("the pulses", () => {
  it("a running tool's ∿: ink then text-2, 320 ms a phase; held in ink when still or he types", () => {
    expect(pulseCell("tool", at(0))).toEqual({ g: "∿", tone: "ink" });
    expect(pulseCell("tool", at(PULSE_MS))).toEqual({ g: "∿", tone: "t2" });
    expect(pulseCell("tool", at(2 * PULSE_MS))).toEqual({
      g: "∿",
      tone: "ink",
    });
    expect(pulseCell("tool", at(PULSE_MS, { still: true })).tone).toBe("ink");
    expect(pulseCell("tool", at(PULSE_MS, { typing: true })).tone).toBe("ink");
  });

  it("a starting agent's ·: text-2 then text-3", () => {
    expect(pulseCell("starting", at(0))).toEqual({ g: "·", tone: "t2" });
    expect(pulseCell("starting", at(PULSE_MS))).toEqual({ g: "·", tone: "t3" });
  });
});

describe("the working row's age", () => {
  it("seconds under a minute, then the head chip's words", () => {
    expect(turnAge(0)).toBe("0 s");
    expect(turnAge(42_400)).toBe("42 s");
    expect(turnAge(2 * 60_000 + 5_000)).toBe("2 min");
    expect(turnAge(3 * 3_600_000)).toBe("3 h");
  });
});

describe("the clock wakes only when a cell can change", () => {
  it("at the next gust frame or pulse phase, whichever comes first", () => {
    expect(nextChange(0)).toBe(GUST_MS);
    expect(nextChange(100)).toBe(10);
    expect(nextChange(300)).toBe(20);
    expect(nextChange(315)).toBe(5);
    expect(nextChange(320)).toBe(10);
  });
});
