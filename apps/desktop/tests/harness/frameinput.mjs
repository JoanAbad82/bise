// frameInput(page, frame): real Input events for a cross-origin frame (an OOPIF), sent on that
// frame's own CDP session (image-pinch, architect m_30735). Why: the harness's windows use
// offscreen rendering (launch.ts), and there Chromium's router never delivers a pointer or a wheel
// into an OOPIF (probe: page.mouse and the page's CDP reach nothing in the artifact viewer, while
// plain Chromium routes them). His windows are not offscreen. So the same Input.dispatch* events go
// straight to the frame's widget, the browser's hit-test step skipped, and this helper does that
// step itself: before each pointer event, the parent's elementFromPoint at those page coordinates
// must be the iframe, else it throws with what is on top (an overlay over the frame still fails,
// as it would for him). Same-origin frames route fine under offscreen rendering: refused here.
// Plain .mjs so the as-he-does driver (dev/plugins/ambient-qa/as-he-does/driver.ts) and the
// checks (inputs.ts re-exports it) read one copy. Coordinates are the page's, as page.mouse's.

const KEYS = {
  Escape: { key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 },
  Space: { key: " ", code: "Space", windowsVirtualKeyCode: 32 },
};

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Frame} frame
 */
export async function frameInput(page, frame) {
  const el = await frame.frameElement();
  const origin = (u) => {
    try {
      return new URL(u).origin;
    } catch {
      return "";
    }
  };
  if (origin(frame.url()) === origin(page.url()) && origin(page.url()) !== "null") {
    throw new Error(`frameInput: ${frame.url()} is same-origin with the page: use page.mouse / page.keyboard`);
  }
  const cdp = await page.context().newCDPSession(frame);
  let held = false;
  /** The browser's hit test, done here: the iframe must be on top at (x, y); its frame coordinates. */
  const at = async (x, y) => {
    const top = await el.evaluate((f, p) => {
      const e = f.ownerDocument.elementFromPoint(p.x, p.y);
      if (e === f) return null;
      return e ? `${e.tagName.toLowerCase()}${e.getAttribute("data-testid") ? `[data-testid=${e.getAttribute("data-testid")}]` : ""}${e.className && typeof e.className === "string" ? `.${e.className.split(/\s+/).join(".")}` : ""}` : "nothing";
    }, { x, y });
    if (top !== null) throw new Error(`frameInput: at (${x}, ${y}) the window shows ${top} over the frame: his pointer wouldn't reach it`);
    const b = await el.boundingBox();
    if (b === null) throw new Error("frameInput: the frame is not on screen");
    return { x: x - b.x, y: y - b.y };
  };
  const mouse = async (type, x, y, o = {}) => {
    const p = await at(x, y);
    await cdp.send("Input.dispatchMouseEvent", { type, x: p.x, y: p.y, ...(held ? { button: "left", buttons: 1 } : {}), ...o });
  };
  const key = async (type, name, modifiers = 0) => {
    const k = KEYS[name];
    if (!k) throw new Error(`frameInput: no key ${name} (${Object.keys(KEYS).join(", ")})`);
    await cdp.send("Input.dispatchKeyEvent", { type, modifiers, ...k });
  };
  return {
    move: (x, y) => mouse("mouseMoved", x, y),
    /** A wheel at (x, y); ctrl: a trackpad pinch, as Chromium sends it. */
    wheel: (x, y, dx, dy, o = {}) => mouse("mouseWheel", x, y, { deltaX: dx, deltaY: dy, modifiers: o.ctrl ? 2 : 0 }),
    down: async (x, y) => {
      await mouse("mousePressed", x, y, { button: "left", buttons: 1, clickCount: 1 });
      held = true;
    },
    up: async (x, y) => {
      held = false;
      await mouse("mouseReleased", x, y, { button: "left", buttons: 0, clickCount: 1 });
    },
    click: async (x, y) => {
      await mouse("mouseMoved", x, y);
      await mouse("mousePressed", x, y, { button: "left", buttons: 1, clickCount: 1 });
      await mouse("mouseReleased", x, y, { button: "left", clickCount: 1 });
    },
    dblclick: async (x, y) => {
      await mouse("mouseMoved", x, y);
      for (const n of [1, 2]) {
        await mouse("mousePressed", x, y, { button: "left", buttons: 1, clickCount: n });
        await mouse("mouseReleased", x, y, { button: "left", clickCount: n });
      }
    },
    /** A drag from a to b in `steps` moves, the button held. */
    drag: async (a, b, steps = 6) => {
      await mouse("mouseMoved", a.x, a.y);
      await mouse("mousePressed", a.x, a.y, { button: "left", buttons: 1, clickCount: 1 });
      held = true;
      for (let i = 1; i <= steps; i++) await mouse("mouseMoved", a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps);
      held = false;
      await mouse("mouseReleased", b.x, b.y, { button: "left", clickCount: 1 });
    },
    keyDown: (name) => key("rawKeyDown", name),
    keyUp: (name) => key("keyUp", name),
    press: async (name) => {
      await key("rawKeyDown", name);
      await key("keyUp", name);
    },
    detach: () => cdp.detach().catch(() => undefined),
  };
}
