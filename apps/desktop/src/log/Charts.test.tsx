// @vitest-environment happy-dom
// src/log · /debug completion's charts (Charts.tsx, designer debug-viz v5): the bars of a level,
// their words through the catalog, and each click handing the list its filter.
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CompPart, CompRow } from "@/proto";
import { Charts, keyWord, selWords } from "./Charts";

afterEach(cleanup);

const part = (role: CompPart["role"], kind: CompPart["kind"], names: string[], tokens: number): CompPart => ({ role, kind, names, tokens });
const row = (n: number, parts: CompPart[]): CompRow => ({ n, role: "x", head: "", blocks: [], bytes: 0, tokens: parts.reduce((a, p) => a + p.tokens, 0), parts });
const rows = [
  row(0, [part("system", "tools", ["bash"], 300)]),
  row(1, [part("user", "agent_message", ["main"], 120)]),
  row(2, [part("tool_result", "tool", ["bash", "git"], 900)]),
  row(3, [part("tool_result", "tool", ["bash", "rg"], 2000)]),
];

function draw(drill: string[] = [], sel?: { path: string[] }) {
  const on = { onBar: vi.fn(), onCrumb: vi.fn(), onBin: vi.fn(), onOpen: vi.fn() };
  const r = render(<Charts rows={rows} drill={drill} filter={sel === undefined ? {} : { sel }} {...on} />);
  return { ...r, ...on };
}

describe("src/log charts (debug-viz)", () => {
  it("a level's keys read as words: roles and kinds through the catalog, names as they are", () => {
    expect(keyWord("tool_result")).toBe("tool result");
    expect(keyWord("k:agent_message")).toBe("agent message");
    expect(keyWord("n:bash")).toBe("bash");
    expect(selWords({ path: ["tool_result", "n:bash"] })).toBe("tool result › bash");
  });

  it("the top level's bars, biggest first; a click hands its group to the list", () => {
    const { getByTestId, container, onBar } = draw();
    const keys = [...container.querySelectorAll(".lg-bar")].map((b) => b.getAttribute("data-testid"));
    expect(keys).toEqual(["comp.chart.bar.tool_result", "comp.chart.bar.system", "comp.chart.bar.user"]);
    fireEvent.click(getByTestId("comp.chart.bar.tool_result"));
    expect(onBar).toHaveBeenCalledWith(expect.objectContaining({ path: ["tool_result"], deeper: true }));
  });

  it("one level down: the breadcrumb goes back up, the picked bar is marked", () => {
    const { getByTestId, getByText, onCrumb } = draw(["tool_result", "n:bash"], { path: ["tool_result", "n:bash", "n:rg"] });
    expect(getByTestId("comp.chart.crumbs").textContent).toBe("all › tool result › bash");
    expect(getByTestId("comp.chart.bar.n:rg").className).toContain("on");
    fireEvent.click(getByText("tool result"));
    expect(onCrumb).toHaveBeenCalledWith(1);
  });

  it("a bin hands its size range; a message's bar opens the tallest message near it", () => {
    const { getByTestId, onBin, onOpen } = draw();
    const bin = [...Array(24).keys()].map((i) => getByTestId(`comp.chart.bin.${String(i)}`)).find((b) => !(b as HTMLButtonElement).disabled);
    expect(bin).toBeDefined();
    if (bin !== undefined) fireEvent.click(bin);
    // sizes 120, 300, 900, 2000: p99 2000, 24 bins of 84; the first with a part is 84-168
    expect(onBin).toHaveBeenCalledWith(84, 168);
    fireEvent.click(getByTestId("comp.chart.msg.1"));
    expect(onOpen).toHaveBeenCalledWith(3);
    expect(getByTestId("comp.chart.peak").getAttribute("data-tip")).toBe("#3 · 2.0k · tool result bash rg");
  });
});
