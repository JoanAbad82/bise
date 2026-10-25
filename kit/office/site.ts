// bise kit · a site artifact in the viewer (viewer.js; art-notes, architect m_24172): the site
// framed as itself at /a/<id>/<v>/framed/… (still sandboxed by the server's ARTIFACT_CSP: an
// opaque origin, no token, no requests out), with kit/site-select.js in each of its pages. What
// that script posts is the site's as much as his: only from that frame, each field read again
// here (a block anchor, a quote and a rect of capped size) before select.js sees it.
//
// The view adds two things to a renderer's: `box()` (where the selection is, in this window) and
// `marks(list)` / `onFound` (the marks drawn inside the frame, which ones it found).
//
// Pure helper (exported for office/sdk/test/viewer.test.ts): readSelect.

import { foot } from "/kit/office/viewer.js";

const MAX = 300;
// the frame's script says hello on each page: none after this long, it was kept out
const HELLO_MS = 4000;
const W = { keptOut: "notes can't go on this site: its own rules block bise." };

/** A `site-select` message's selection read again: a block anchor and his quote (each at most
 * 300 characters), a rect of finite numbers; null for anything else. */
/** A message from the site's frame (kit/site-select.js): unchecked, read field by field. */
type SiteMsg = {
  bise?: unknown; anchor?: { kind?: unknown; block?: unknown; quote?: unknown } | null; quote?: unknown;
  rect?: { x?: unknown; y?: unknown; w?: unknown; h?: unknown } | null; found?: unknown;
  key?: unknown; ctrlKey?: unknown; metaKey?: unknown; altKey?: unknown; isComposing?: unknown;
};
type Picked = { anchor: Anchor; quote: string; rect: AnchorRect | null };

export function readSelect(d: SiteMsg | null | undefined): Picked | null {
  const a = d && d.anchor;
  if (!a || a.kind !== "block" || typeof a.block !== "string" || !a.block || a.block.length > MAX) return null;
  const str = (s: unknown) => (typeof s === "string" ? s.slice(0, MAX) : "");
  const quote = str(a.quote);
  const r = d!.rect;
  const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && Math.abs(v) < 1e5;
  const rect = r && num(r.x) && num(r.y) && num(r.w) && num(r.h) ? { x: r.x, y: r.y, w: r.w, h: r.h } : null;
  return { anchor: { kind: "block", block: a.block, ...(quote ? { quote } : {}) }, quote: str(d!.quote) || quote, rect };
}

export async function draw(root: HTMLElement, _bytes: Uint8Array | null, info: OfficeInfo) {
  root.classList.add("office-site");
  const frame = document.createElement("iframe");
  frame.className = "site";
  frame.title = info.name || "site";
  frame.src = info.file;
  root.append(frame);

  let picked: Picked | null = null;
  let alive = false;
  let lastMarks: (OfficeMark & { i: number })[] = [];
  const view: OfficeView = {
    notes: [],
    place: () => ({}),
    restore: () => {},
    selection: () => (picked ? picked.anchor : null),
    quote: () => (picked ? picked.quote : ""),
    box() {
      if (!picked || !picked.rect) return null;
      const f = frame.getBoundingClientRect();
      const r = picked.rect;
      return { left: f.left + r.x, top: f.top + r.y, right: f.left + r.x + r.w, bottom: f.top + r.y + r.h };
    },
    marks(list) {
      lastMarks = list.map((m, i) => ({ i, at: m.at, mark: m.mark }));
      frame.contentWindow && frame.contentWindow.postMessage({ bise: "site-marks", marks: lastMarks }, "*");
    },
    onFound: null,
  };
  const main = document.getElementById("bise-office");
  window.addEventListener("message", (e) => {
    if (e.source !== frame.contentWindow || !e.data || typeof e.data !== "object") return;
    const d: SiteMsg = e.data;
    if (d.bise === "site-hello") {
      alive = true;
      // a new page of the site: its marks again
      if (lastMarks.length) frame.contentWindow!.postMessage({ bise: "site-marks", marks: lastMarks }, "*");
    } else if (d.bise === "site-select") {
      picked = d.anchor === null ? null : readSelect(d);
      root.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    } else if (d.bise === "site-scroll") {
      picked = null;
      root.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    } else if (d.bise === "site-found" && Array.isArray(d.found)) {
      if (view.onFound) view.onFound(new Set(d.found.filter((i) => Number.isInteger(i))));
    } else if (d.bise === "site-key" && typeof d.key === "string" && d.key.length <= 16) {
      // his key, as if typed here (select.js's rule decides what it takes)
      document.dispatchEvent(new KeyboardEvent("keydown", { key: d.key, ctrlKey: !!d.ctrlKey, metaKey: !!d.metaKey, altKey: !!d.altKey, isComposing: !!d.isComposing }));
    }
  });
  frame.addEventListener("load", () => {
    alive = false;
    setTimeout(() => {
      if (!alive && main) foot(main, [W.keptOut]);
    }, HELLO_MS);
  });
  return view;
}
