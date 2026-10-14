import { describe, expect, it } from "vitest";
import { cutWords, glyphColumn, pickerPlace, stepActive, walkable } from "./picker";

describe("ds/picker", () => {
  const groups = [
    { id: "a", rows: [{ id: "1", name: "one" }, { id: "2", name: "two", disabled: true }] },
    { id: "b", rows: [{ id: "3", name: "three" }, { id: "4", name: "four" }] },
  ];

  it("walks the rows that aren't disabled", () => {
    expect(walkable(groups)).toEqual(["1", "3", "4"]);
  });

  it("↑↓ wrap, home and end, a page of 8", () => {
    const ids = walkable(groups);
    expect(stepActive(ids, "4", "ArrowDown")).toBe("1");
    expect(stepActive(ids, "1", "ArrowUp")).toBe("4");
    expect(stepActive(ids, null, "ArrowDown")).toBe("1");
    expect(stepActive(ids, null, "ArrowUp")).toBe("4");
    expect(stepActive(ids, "3", "Home")).toBe("1");
    expect(stepActive(ids, "1", "End")).toBe("4");
    expect(stepActive(ids, "1", "PageDown")).toBe("4");
    expect(stepActive(ids, "4", "PageUp")).toBe("1");
    expect(stepActive(ids, "1", "a")).toBeNull();
    expect(stepActive([], null, "ArrowDown")).toBeNull();
  });

  it("sits 8 px from its anchor, on its trigger's edge, above unless below has more room, its height fitted", () => {
    const win = { width: 1100, height: 820 };
    const start = pickerPlace({ top: 700, bottom: 780 }, { left: 300, right: 360 }, "start", win);
    expect(start.style).toEqual({ position: "fixed", left: 300, bottom: 128 });
    expect(start.maxHeight).toBe(684);
    const end = pickerPlace({ top: 700, bottom: 780 }, { left: 900, right: 1000 }, "end", win);
    expect(end.style).toEqual({ position: "fixed", right: 100, bottom: 128 });
    expect(pickerPlace({ top: 700, bottom: 780 }, { left: 2, right: 40 }, "start", win).style).toMatchObject({ left: 8 });
    // little room above, more below: it flips under the anchor
    const flip = pickerPlace({ top: 100, bottom: 130 }, { left: 10, right: 60 }, "start", win);
    expect(flip.style).toEqual({ position: "fixed", left: 10, top: 138 });
    expect(flip.maxHeight).toBe(820 - 130 - 16);
    // a short window: never taller than the room
    expect(pickerPlace({ top: 300, bottom: 380 }, { left: 10, right: 60 }, "start", { width: 800, height: 420 }).maxHeight).toBe(284);
  });

  it("shows the glyph column only when the list mixes kinds", () => {
    const g = (glyphs: (string | undefined)[]) => [{ id: "g", rows: glyphs.map((glyph, i) => ({ id: String(i), name: "x", glyph })) }];
    expect(glyphColumn(g(["/", "/"]))).toBe(false);
    expect(glyphColumn(g([undefined, undefined]))).toBe(false);
    expect(glyphColumn(g(["@", undefined]))).toBe(true);
    expect(glyphColumn(g(["@", "↗"]))).toBe(true);
  });

  it("cuts after a whole word with one '…'", () => {
    const fits = (n: number) => (t: string) => t.length <= n;
    expect(cutWords("an agent reads the changes", fits(40))).toBe("an agent reads the changes");
    expect(cutWords("an agent reads the changes", fits(16))).toBe("an agent reads…");
    expect(cutWords("an agent, reads", fits(10))).toBe("an agent…");
    expect(cutWords("unbreakable", fits(3))).toBe("unbreakable…");
  });
});
