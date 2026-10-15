// @vitest-environment happy-dom
// src/ds · Ring: a donut gauge (his ask on agent-rows): an arc on a track, nothing filled.
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { arc, Ring } from "./ring";

afterEach(cleanup);

describe("Ring", () => {
  it("the arc's dash is the percent used, clamped to 0-100", () => {
    expect(arc(17)).toBe("17 83");
    expect(arc(71.26)).toBe("71.3 28.7");
    expect(arc(-5)).toBe("0 100");
    expect(arc(140)).toBe("100 0");
  });

  it("draws a track and an arc from 12 o'clock, no arc at 0", () => {
    const { getByTestId, rerender } = render(<Ring pct={42} testId="r" />);
    const used = getByTestId("r").querySelector(".used");
    expect(getByTestId("r").querySelector(".track")?.tagName.toLowerCase()).toBe("circle");
    expect(used?.getAttribute("stroke-dasharray")).toBe("42 58");
    expect(used?.getAttribute("transform")).toBe("rotate(-90 6 6)");
    expect(getByTestId("r").querySelector("path"), "no pie wedge").toBeNull();
    rerender(<Ring pct={0} testId="r" />);
    expect(getByTestId("r").querySelector(".used")).toBeNull();
  });
});
