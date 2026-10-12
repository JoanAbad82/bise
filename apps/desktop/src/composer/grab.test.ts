// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { editable, grabsKey, isCtrlR, type GrabKey } from "./grab";

const k = (key: string, more: Partial<GrabKey> = {}): GrabKey => ({
  key,
  code: more.code ?? "",
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  isComposing: false,
  defaultPrevented: false,
  ...more,
});

describe("a stray key goes to the composer (grab.ts, main m_16044)", () => {
  it("a letter, an accent, a dead key, an IME key, a symbol: typed there", () => {
    for (const key of ["a", "Z", "é", "?", "1", "Dead", "Process", "😀"])
      expect(grabsKey(k(key)), key).toBe(true);
  });
  it("⌥ letters are text on a Mac (⌥e, ⌥( ): typed there; ⌥ digits stay the window’s", () => {
    expect(grabsKey(k("Dead", { altKey: true, code: "KeyE" }))).toBe(true);
    expect(grabsKey(k("{", { altKey: true, code: "Digit5" }))).toBe(false);
    expect(grabsKey(k("¡", { altKey: true, code: "Digit1" }))).toBe(false);
  });
  it("never ⌘/ctrl shortcuts, arrows, esc, enter, tab, space, a key already taken, a composition", () => {
    expect(grabsKey(k("k", { metaKey: true }))).toBe(false);
    expect(grabsKey(k("v", { metaKey: true }))).toBe(false);
    expect(grabsKey(k("c", { ctrlKey: true }))).toBe(false);
    for (const key of [
      "ArrowUp",
      "ArrowDown",
      "Escape",
      "Enter",
      "Tab",
      " ",
      "Backspace",
      "Shift",
      "F5",
      "End",
    ])
      expect(grabsKey(k(key)), key).toBe(false);
    expect(grabsKey(k("a", { defaultPrevented: true }))).toBe(false);
    expect(grabsKey(k("a", { isComposing: true }))).toBe(false);
  });
  it("an input, a textarea, a select, a contenteditable, a textbox keep their keys", () => {
    expect(editable(document.createElement("input"))).toBe(true);
    expect(editable(document.createElement("textarea"))).toBe(true);
    expect(editable(document.createElement("select"))).toBe(true);
    const box = document.createElement("div");
    box.setAttribute("role", "textbox");
    expect(editable(box)).toBe(true);
    expect(editable(document.createElement("button"))).toBe(false);
    expect(editable(document.body)).toBe(false);
    expect(editable(null)).toBe(false);
  });
});

describe("ctrl+r anywhere is dictation (grab.ts, his try a43609b2)", () => {
  const r = (
    key: string,
    more: Partial<GrabKey & { shiftKey: boolean }> = {},
  ) => ({
    ...k(key, { ctrlKey: true, code: "KeyR" }),
    shiftKey: false,
    ...more,
  });
  it("ctrl+r, either case: the field’s key", () => {
    expect(isCtrlR(r("r"))).toBe(true);
    expect(isCtrlR(r("R"))).toBe(true);
  });
  it("never with another modifier, without ctrl, taken already or composing", () => {
    expect(isCtrlR(r("r", { ctrlKey: false }))).toBe(false);
    expect(isCtrlR(r("r", { metaKey: true }))).toBe(false);
    expect(isCtrlR(r("r", { altKey: true }))).toBe(false);
    expect(isCtrlR(r("R", { shiftKey: true }))).toBe(false);
    expect(isCtrlR(r("r", { defaultPrevented: true }))).toBe(false);
    expect(isCtrlR(r("r", { isComposing: true }))).toBe(false);
    expect(isCtrlR(r("c"))).toBe(false);
  });
});
