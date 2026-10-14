// @vitest-environment happy-dom
// src/ds · bise's ':*' (mark.tsx): its states as classes and data, its tip, its stroke by size.
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BiseMark, markStroke } from "./index";

afterEach(cleanup);

describe("src/ds BiseMark (desktop-delight v2, bise-presence v10)", () => {
  it("at rest: two eyes and a three-line star, its box at its size, it winks on hover", () => {
    const { getByTestId } = render(<BiseMark testId="m" />);
    const m = getByTestId("m");
    expect(m.className).toBe("b-bise winks");
    expect(m.style.width).toBe("14px");
    expect(m.querySelectorAll("rect")).toHaveLength(2);
    expect(m.querySelectorAll("line")).toHaveLength(3);
    expect(m.dataset["waits"]).toBeUndefined();
    expect(m.dataset["tip"]).toBeUndefined();
  });

  it("the accent when something waits, its star turns while bise works, its tip in data-tip", () => {
    const { getByTestId } = render(<BiseMark waits working wink={false} size={22} tip="bise: 1 thing waits for you" testId="m" />);
    const m = getByTestId("m");
    expect(m.className).toBe("b-bise waits working");
    expect(m.dataset["waits"]).toBe("true");
    expect(m.dataset["working"]).toBe("true");
    expect(m.dataset["tip"]).toBe("bise: 1 thing waits for you");
  });

  it("its stroke thickens as it gets small", () => {
    expect([markStroke(14), markStroke(26), markStroke(56)]).toEqual([11, 9, 7]);
  });
});
