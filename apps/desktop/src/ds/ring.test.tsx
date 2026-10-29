// @vitest-environment happy-dom
// src/ds · Ring: a dial after Codex's (designer m_26952): an arc on a track as wide, round caps inside 0..pct.
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { arc, Ring, RING_WARN_PCT } from "./ring";

afterEach(cleanup);

describe("Ring", () => {
  it("the arc's dash in px is the percent used less its two caps, starting one cap in, clamped to 0-100", () => {
    // r 5 is 31.42 px around; each round cap reaches 1 px past its dash: 2 px short, 1 px in
    expect(arc(50)).toEqual({ dash: "13.71 17.71", offset: "-1" });
    expect(arc(95)).toEqual({ dash: "27.85 3.57", offset: "-1" });
    expect(arc(140)).toEqual({ dash: "29.42 2", offset: "-1" });
    expect(arc(0)).toBeNull();
    expect(arc(-5)).toBeNull();
  });

  it("under a cap's length the arc is a dot, never a negative dash", () => {
    expect(arc(3)?.dash).toBe("0.01 31.41");
  });

  it("draws a track and an arc from 12 o'clock, no arc at 0, ink from 70 %", () => {
    const { getByTestId, rerender } = render(<Ring pct={42} testId="r" />);
    const svg = getByTestId("r");
    const used = svg.querySelector(".used");
    expect(svg.querySelector(".track")?.tagName.toLowerCase()).toBe("circle");
    expect(used?.getAttribute("stroke-dasharray")).toBe("11.19 20.22");
    expect(used?.getAttribute("stroke-dashoffset")).toBe("-1");
    expect(used?.getAttribute("transform")).toBe("rotate(-90 6 6)");
    expect(svg.querySelector("path"), "no pie wedge").toBeNull();
    expect(svg.hasAttribute("data-warn")).toBe(false);
    rerender(<Ring pct={RING_WARN_PCT} testId="r" />);
    expect(getByTestId("r").hasAttribute("data-warn")).toBe(true);
    rerender(<Ring pct={0} testId="r" />);
    expect(getByTestId("r").querySelector(".used")).toBeNull();
  });
});
