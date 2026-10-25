// @vitest-environment happy-dom
// src/ds · the composer folded off the thread, at rest (designer m_41569): one line, and that line
// keeps its round send at the right, the field and the send centred on one row (his bug m_43032 on
// 10.17: the folded box hid the whole controls row, the send with it, and the placeholder sat low).
// The ds's whole stylesheet and the composer's own (index.css's imports, then composer.css) on the
// real ComposerFrame, read back with getComputedStyle. Mutation: the fold rule hiding `.box .row`
// whole again turns the send test red; the box back to a column turns the row test red.
import { cleanup, render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { ComposerFrame } from "./composer";

beforeAll(() => {
  const css = readFileSync(join(__dirname, "index.css"), "utf8");
  const files = [...css.matchAll(/@import "\.\/([\w/.-]+)";/g)].map((m) => m[1] ?? "");
  const style = document.createElement("style");
  style.textContent = [
    ...files.map((f) => readFileSync(join(__dirname, f), "utf8")),
    readFileSync(join(__dirname, "../composer/composer.css"), "utf8"),
  ].join("\n");
  document.head.append(style);
});
afterEach(cleanup);

/** shown: neither it nor a parent is display:none */
const shown = (el: Element | null): boolean => {
  for (let n = el; n !== null; n = n.parentElement) if (getComputedStyle(n).display === "none") return false;
  return el !== null;
};

const folded = () =>
  render(
    <ComposerFrame fold testId="c" tab="to bise" send="off" onSend={() => undefined}
      tools={<button type="button" data-testid="plus">+</button>} keys={<span>⏎ send</span>}>
      <span className="ph">write to bise, then ⏎</span>
    </ComposerFrame>,
  );

describe("the folded composer at rest (ds/css/composer.css)", () => {
  it("keeps its round send at the right; the tab, the tools and the keys go", () => {
    const { getByTestId, container } = folded();
    expect(getByTestId("c").dataset["fold"]).toBe("true");
    expect(shown(getByTestId("c.send"))).toBe(true);
    expect(shown(getByTestId("plus"))).toBe(false);
    expect(shown(getByTestId("c.tab"))).toBe(false);
    expect(shown(container.querySelector(".keys"))).toBe(false);
  });

  it("is one row: the field and the send side by side, centred", () => {
    const { getByTestId } = folded();
    const box = getComputedStyle(getByTestId("c.box"));
    expect(box.flexDirection).toBe("row");
    expect(box.alignItems).toBe("center");
  });
});
