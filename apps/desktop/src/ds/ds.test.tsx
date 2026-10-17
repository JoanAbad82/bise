// @vitest-environment happy-dom
// src/ds · the components' behavior: test ids, handlers, and the typing invariant (a frame's
// re-render never replaces the editor in its slot, nor the rows of a list).
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArtChip, ArtName, ComposerFrame, Dock, Dot, Field, Msg, Opts, Row, Seg, Spot, SpotRow, Tabs, Toggle } from "./index";
import { CUT_CHARS, PickerCut } from "./picker";

afterEach(cleanup);

describe("src/ds", () => {
  it("an inline secondary as long as a brief draws only its start (at-perf: 28 of them laid out on every '@')", () => {
    const brief = "the composer's picker reads the core's answer and draws its rows. ".repeat(40);
    const { container } = render(<PickerCut text={brief} />);
    const s = container.querySelector(".s");
    expect(s?.textContent).toBe(brief.slice(0, CUT_CHARS));
    const short = render(<PickerCut text="sort_unstable in the hot query" />);
    expect(short.container.querySelector(".s")?.textContent).toBe("sort_unstable in the hot query");
  });

  it("the composer's frame keeps the editor's node when send, dock or focus change", () => {
    const editor = <div contentEditable suppressContentEditableWarning data-testid="composer.editor">hi</div>;
    const { getByTestId, rerender } = render(<ComposerFrame send="off" testId="composer">{editor}</ComposerFrame>);
    const before = getByTestId("composer.editor");
    rerender(<ComposerFrame send="on" focus testId="composer" dock={<Dock head="? x" q="y" />}>{editor}</ComposerFrame>);
    rerender(<ComposerFrame send="stop" testId="composer">{editor}</ComposerFrame>);
    expect(getByTestId("composer.editor")).toBe(before);
    expect(getByTestId("composer.stop").textContent).toBe("■");
  });

  it("the whole box is the input: a press on its padding calls onBoxDown, a press on the editor, a chip or send does not", () => {
    const onBoxDown = vi.fn();
    const { getByTestId } = render(
      <ComposerFrame send="on" onBoxDown={onBoxDown} testId="c">
        <div contentEditable suppressContentEditableWarning data-testid="c.editor">hi <span className="b-chip" data-testid="c.chip">1</span></div>
      </ComposerFrame>,
    );
    fireEvent.mouseDown(getByTestId("c.box"), { button: 0 });
    expect(onBoxDown).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(getByTestId("c.editor"), { button: 0 });
    fireEvent.mouseDown(getByTestId("c.chip"), { button: 0 });
    fireEvent.mouseDown(getByTestId("c.send"), { button: 0 });
    fireEvent.mouseDown(getByTestId("c.box"), { button: 2 });
    expect(onBoxDown).toHaveBeenCalledTimes(1);
  });

  it("send is a real button, off when there is nothing to send", () => {
    const onSend = vi.fn();
    const { getByTestId, rerender } = render(<ComposerFrame send="off" onSend={onSend} testId="c"><span /></ComposerFrame>);
    expect((getByTestId("c.send") as HTMLButtonElement).disabled).toBe(true);
    rerender(<ComposerFrame send="on" onSend={onSend} testId="c"><span /></ComposerFrame>);
    fireEvent.click(getByTestId("c.send"));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("the spotlight's input slot survives its rows changing", () => {
    const input = <input data-testid="spot.input" />;
    const { getByTestId, rerender } = render(<Spot input={input}><SpotRow glyph=":*" name="a" on testId="spot.row.a" /></Spot>);
    const before = getByTestId("spot.input");
    rerender(<Spot input={input}><SpotRow glyph=":*" name="a" testId="spot.row.a" /><SpotRow glyph="∿" name="b" on testId="spot.row.b" /></Spot>);
    expect(getByTestId("spot.input")).toBe(before);
    expect(getByTestId("spot.row.b").className).toContain("on");
  });

  it("a list row stays the same node when its neighbors change", () => {
    const { getByTestId, rerender } = render(<div><Row name="a" testId="side.a" /><Row name="b" testId="side.b" /></div>);
    const a = getByTestId("side.a");
    rerender(<div><Row name="a" testId="side.a" /><Row name="b" on testId="side.b" /><Row name="c" testId="side.c" /></div>);
    expect(getByTestId("side.a")).toBe(a);
  });

  it("options, tabs and segments hand back what was picked, with ids per part", () => {
    const pick = vi.fn();
    const { getByTestId } = render(<>
      <Opts items={[{ n: 1, text: "yes" }, { n: 2, text: "no" }]} onPick={pick} testId="dock.opt" />
      <Tabs items={[{ id: "search", text: "search" }]} onPick={pick} testId="inbox.tab" />
      <Seg items={["a", "b"]} on={0} onPick={pick} testId="seg" />
    </>);
    fireEvent.click(getByTestId("dock.opt.2"));
    fireEvent.click(getByTestId("inbox.tab.search"));
    fireEvent.click(getByTestId("seg.1"));
    expect(pick.mock.calls).toEqual([[2], ["search"], [1]]);
  });

  it("the toggle flips by click and by space; a disabled one doesn't", () => {
    const flip = vi.fn();
    const { getByTestId } = render(<><Toggle on={false} onChange={flip} testId="t" /><Toggle on onChange={flip} state="disabled" testId="d" /></>);
    fireEvent.click(getByTestId("t"));
    fireEvent.keyDown(getByTestId("t"), { key: " " });
    fireEvent.click(getByTestId("d"));
    expect(flip.mock.calls).toEqual([[true], [true]]);
  });

  it("the field is a real input with its test id, uncontrolled", () => {
    const { getByTestId } = render(<Field defaultValue="acme" testId="setup.workspace" />);
    const input = getByTestId("setup.workspace") as HTMLInputElement;
    expect(input.tagName).toBe("INPUT");
    fireEvent.change(input, { target: { value: "acme/x" } });
    expect(input.value).toBe("acme/x");
  });

  it("a search that '/' focuses says so: a boxed '/' after the input (GitHub's); the placeholder says what it searches", () => {
    const { getByTestId } = render(<Field slash placeholder="search artifacts" testId="list.search" />);
    const input = getByTestId("list.search") as HTMLInputElement;
    expect(input.placeholder).toBe("search artifacts");
    expect(input.getAttribute("aria-keyshortcuts")).toBe("/");
    const cap = getByTestId("list.search.slash");
    expect(cap.textContent).toBe("/");
    expect(cap.className).toContain("b-kbd");
    expect(input.nextElementSibling).toBe(cap);
    expect(input.closest(".b-field")?.classList.contains("slash")).toBe(true);
  });

  it("a dot says its state in words, an error dock carries ▲ (never by color alone)", () => {
    const { getAllByRole, getByTestId } = render(<><Dot state="er" /><Dot state="nd" /><Dot /><Dock kind="err" head="search failed" q="x" testId="dock" /></>);
    expect(getAllByRole("img").map((e) => e.getAttribute("aria-label"))).toEqual(["error", "needs you", "idle"]);
    expect(getByTestId("dock").textContent).toContain("▲ search failed");
  });

  it("a message shows words from data as text, never markup", () => {
    const { container } = render(<Msg from="agent" name="x">{"<img src=x onerror=alert(1)>"}</Msg>);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img src=x");
  });

  it("an artifact's chip and its inline name: pink classes, the open state, a click (desktop-agents-bar §5)", () => {
    const open = vi.fn();
    const named = vi.fn();
    const { getByTestId } = render(<><ArtChip title="product page" meta="page · v2" open onClick={open} testId="a" /><ArtName onClick={named} testId="n">product page</ArtName></>);
    const chip = getByTestId("a");
    expect(chip.tagName).toBe("BUTTON");
    expect(chip.className).toBe("b-artchip open");
    expect(chip.querySelector(".b-artchip-title")?.textContent).toBe("↗ product page");
    expect(chip.querySelector(".b-artchip-meta")?.textContent).toBe("page · v2");
    expect(chip.querySelector(".b-artchip-open")?.textContent).toBe("open");
    fireEvent.click(chip);
    expect(open).toHaveBeenCalledTimes(1);
    const n = getByTestId("n");
    expect(n.className).toBe("b-artname");
    fireEvent.click(n);
    fireEvent.keyDown(n, { key: "Enter" });
    expect(named).toHaveBeenCalledTimes(2);
  });
});
