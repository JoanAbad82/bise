// @vitest-environment happy-dom
// src/ds Slide: Vibe Work's pace (44 px/s; a 250 ms delay, designer m_26921), the words whole in the DOM, and the row's
// mark ([data-slide-row]) the hover listens on. The pixels and the slide itself: the harness checks.
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Slide, SLIDE_DELAY_MS, SLIDE_PX_PER_S, slideMs, wholeWords } from "./index";

afterEach(cleanup);

describe("ds Slide", () => {
  it("slides at Vibe Work's pace: 44 px a second, after 250 ms", () => {
    expect(SLIDE_PX_PER_S).toBe(44);
    expect(SLIDE_DELAY_MS).toBe(250);
    expect(slideMs(0)).toBe(0);
    expect(slideMs(-3)).toBe(0);
    expect(slideMs(44)).toBe(1000);
    expect(slideMs(110)).toBe(2500);
  });

  it("cuts after a whole word with one '…', never mid-word; not one word fits: nothing (designer m_23711, m_26248)", () => {
    const w = (s: string) => s.length * 7;
    expect(wholeWords("price rules", 200, w)).toBe("price rules");
    expect(wholeWords("import the catalog", 80, w)).toBe("import the…");
    expect(wholeWords("import the catalog", 60, w)).toBe("import…");
    expect(wholeWords("proofreading", 40, w)).toBe("");
  });

  it("shows its whole words at rest when there is no room measured, its delay in a variable", () => {
    const words = "all his picks decided; signing builders' shots (composer-strip, inbox)";
    const { getByTestId } = render(
      <button data-slide-row type="button">
        <Slide className="role" text={words} testId="r.role" />
      </button>,
    );
    const el = getByTestId("r.role");
    expect(el.textContent).toBe(words);
    expect(el.className).toBe("b-slide role");
    expect(el.style.getPropertyValue("--slide-delay")).toBe("250ms");
  });
});
