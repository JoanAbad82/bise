// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { editable, grabsKey, isCtrlR, registerGrab, spaceFree, type GrabKey } from "./grab";

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
  it("space types a space (main m_22096); never ⌥space or ⌘space", () => {
    expect(grabsKey(k(" ", { code: "Space" }))).toBe(true);
    expect(grabsKey(k("\u00a0", { altKey: true, code: "Space" }))).toBe(false);
    expect(grabsKey(k(" ", { metaKey: true, code: "Space" }))).toBe(false);
    expect(grabsKey(k(" ", { ctrlKey: true, code: "Space" }))).toBe(false);
  });
  it("space only where the focus does nothing with it: no focus, the thread; a button, a list row or a focused screen keeps it", () => {
    expect(spaceFree(null)).toBe(true);
    expect(spaceFree(document.body)).toBe(true);
    const list = document.createElement("div");
    list.dataset["testid"] = "thread.list";
    const row = document.createElement("div");
    const b = document.createElement("button");
    list.append(row, b);
    const screen = document.createElement("div");
    screen.tabIndex = 0;
    const opt = document.createElement("div");
    opt.setAttribute("role", "option");
    const inner = document.createElement("span");
    opt.append(inner);
    document.body.append(list, screen, opt);
    expect(spaceFree(row), "a thread row").toBe(true);
    expect(spaceFree(b), "a button in the thread").toBe(false);
    expect(spaceFree(screen), "a screen that walks its rows").toBe(false);
    expect(spaceFree(inner), "a list row").toBe(false);
    list.remove();
    screen.remove();
    opt.remove();
  });
  it("never ⌘/ctrl shortcuts, arrows, esc, enter, tab, a key already taken, a composition", () => {
    expect(grabsKey(k("k", { metaKey: true }))).toBe(false);
    expect(grabsKey(k("v", { metaKey: true }))).toBe(false);
    expect(grabsKey(k("c", { ctrlKey: true }))).toBe(false);
    for (const key of [
      "ArrowUp",
      "ArrowDown",
      "Escape",
      "Enter",
      "Tab",
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

describe("a key a screen took stays the screen’s (grab.ts, archived.spec: 'a' then esc)", () => {
  const press = (on: HTMLElement, key: string) =>
    on.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  it("a list screen’s own letter (preventDefault in bubble) keeps the focus; a stray one goes to the field", () => {
    const field = document.createElement("div");
    field.textContent = "field";
    const screen = document.createElement("section");
    screen.tabIndex = -1;
    screen.addEventListener("keydown", (e) => {
      if (e.key === "a") e.preventDefault();
    });
    document.body.append(field, screen);
    let took = 0;
    const un = registerGrab({ el: field, take: () => { took += 1; }, paste: () => false });
    // happy-dom draws nothing: the field counts as on screen
    field.getClientRects = () => [new DOMRect(0, 0, 10, 10)] as unknown as DOMRectList;
    try {
      screen.focus();
      press(screen, "a");
      expect(took, "the screen’s 'a'").toBe(0);
      press(screen, "x");
      expect(took, "a stray 'x'").toBe(1);
    } finally {
      un();
      field.remove();
      screen.remove();
    }
  });
});
