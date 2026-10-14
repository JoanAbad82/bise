// @vitest-environment happy-dom
// src/ds · the controls' behavior (controls.tsx): real buttons with their names, the Sheet's keys.
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Act, Button, IconButton, Row, Sheet, TextArea } from "./index";

afterEach(cleanup);

describe("src/ds controls (designer m_18343)", () => {
  it("IconButton is a real button named by its label, its words and key in the ds tip, pressed when on", () => {
    const onClick = vi.fn();
    const { getByTestId } = render(<IconButton label="sidebar" keys="⌘\" pressed onClick={onClick} testId="ib">☰</IconButton>);
    const b = getByTestId("ib");
    expect(b.tagName).toBe("BUTTON");
    expect(b.getAttribute("aria-label")).toBe("sidebar");
    expect(b.getAttribute("title")).toBeNull();
    expect(b.getAttribute("data-tip")).toBe("sidebar");
    expect(b.getAttribute("data-tip-keys")).toBe("⌘\\");
    expect(b.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("Act is an inline text button; err takes the error tone; Button sm is the small one", () => {
    const { getByTestId } = render(<><Act tone="err" testId="a">retry</Act><Button size="sm" kind="ghost" testId="b">go back</Button></>);
    expect(getByTestId("a").tagName).toBe("BUTTON");
    expect(getByTestId("a").className).toBe("b-act err");
    expect(getByTestId("b").className).toBe("b-btn ghost sm");
  });

  it("TextArea keeps its words uncontrolled in the Field's frame", () => {
    const { getByTestId } = render(<TextArea defaultValue={"two\nlines"} testId="t" />);
    const t = getByTestId("t") as HTMLTextAreaElement;
    expect(t.tagName).toBe("TEXTAREA");
    expect(t.value).toBe("two\nlines");
    expect(t.parentElement?.className).toBe("b-field b-area");
  });

  it("Row with onClick is a real button; without, a plain row", () => {
    const onClick = vi.fn();
    const { getByTestId } = render(<><Row kind="pj" name="shop" onClick={onClick} testId="r1" /><Row kind="pj" name="docs" testId="r2" /></>);
    expect(getByTestId("r1").tagName).toBe("BUTTON");
    expect(getByTestId("r2").tagName).toBe("DIV");
    fireEvent.click(getByTestId("r1"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("the Sheet: its head and foot, ⏎ runs the primary (never from a field of several lines), esc asks to close", () => {
    const onClose = vi.fn();
    const onPrimary = vi.fn();
    const { getByTestId, getByText } = render(
      <Sheet open onClose={onClose} onPrimary={onPrimary} title="add a project" sub="a folder, a git repo." foot={<Button kind="pri" testId="s.go">add</Button>} testId="s">
        <TextArea testId="s.area" />
        <input data-testid="s.field" />
      </Sheet>,
    );
    expect(getByText("add a project")).toBeTruthy();
    fireEvent.keyDown(getByTestId("s.area"), { key: "Enter" });
    expect(onPrimary).not.toHaveBeenCalled();
    fireEvent.keyDown(getByTestId("s.field"), { key: "Enter" });
    expect(onPrimary).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(getByTestId("s"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
