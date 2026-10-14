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

  it("the presence (bise-presence v10): live at rest, the eyes follow his voice, the team's branches, a waiting one in the accent", () => {
    const { getByTestId, rerender } = render(<BiseMark live wink={false} size={26} testId="m" />);
    const m = getByTestId("m");
    expect(m.className).toBe("b-bise live");
    rerender(<BiseMark live wink={false} size={26} listening level={1} testId="m" />);
    const eyes = m.querySelectorAll<SVGRectElement>(".b-bise-eye");
    expect(eyes[0]?.style.transform).toBe("scaleY(1.9)");
    rerender(<BiseMark live wink={false} size={26} working arms={["run", "wait"]} testId="m" />);
    expect(m.querySelectorAll("line")).toHaveLength(2);
    expect(m.querySelectorAll("line.wait")).toHaveLength(1);
    expect(m.dataset["arms"]).toBe("2");
  });

  it("not live under 16 px: no blink, no sway in the menu bar's size", () => {
    const { getByTestId } = render(<BiseMark live wink={false} size={15} testId="m" />);
    expect(getByTestId("m").className).toBe("b-bise");
  });

  it("a new wait remounts the kiss group (the two kisses play once); the same one doesn't", () => {
    const { getByTestId, rerender } = render(<BiseMark waits kiss="a" testId="m" />);
    const first = getByTestId("m").querySelector(".b-bise-kiss");
    rerender(<BiseMark waits kiss="a" testId="m" />);
    expect(getByTestId("m").querySelector(".b-bise-kiss")).toBe(first);
    rerender(<BiseMark waits kiss="b" testId="m" />);
    expect(getByTestId("m").querySelector(".b-bise-kiss")).not.toBe(first);
  });

  it("its stroke thickens as it gets small", () => {
    expect([markStroke(14), markStroke(26), markStroke(56)]).toEqual([11, 9, 7]);
  });
});
