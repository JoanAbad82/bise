// bise kit · notes on a site artifact, inside the site (art-notes; architect m_24172). The page
// server adds this one script to each html page it serves under /a/<id>/<v>/framed/ (the viewer's
// frame, kit/office/site.js); the plain copy never has it, and the kept copy never changes.
//
// The site stays sandboxed (an opaque origin, no token, no requests out). This script only talks
// to its parent, the viewer:
// - his text selection → {bise: "site-select", anchor: {kind: "block", block, quote}, quote, rect}
//   (`block`: the element's #id, or its tag path from the body; `quote`: the words he selected,
//   the fallback when the path moves in a new version); a click that clears it → anchor null;
// - a key he types while something is selected → {bise: "site-key", key, ...modifiers} (in the
//   app, typing adds the selection to his message);
// - the marks the viewer posts in ({bise: "site-marks", marks: [{i, at, mark}]}: no note words)
//   drawn on the blocks, and {bise: "site-found", found: [i…]} back (a lost one is `moved`).
// What the site posts is the site's as much as his: the viewer checks all of it.
(function () {
  "use strict";
  if (window.parent === window) return;
  const P = window.parent;
  const post = (m: unknown) => P.postMessage(m, "*");
  const norm = (s: unknown) => String(s || "").replace(/\s+/g, " ").trim();
  const BLOCKS = "p,li,h1,h2,h3,h4,h5,h6,td,th,pre,blockquote,figcaption,dt,dd,summary,caption,figure,section,article,aside,header,footer,main,nav,div,body";
  const MAX = 300;

  // ---- where an element is: its #id when unique, else its tag path from the body (or an id above)
  function pathOf(e: Element) {
    const parts: string[] = [];
    for (let el: Element | null = e; el && el.nodeType === 1 && el !== document.body; el = el.parentElement) {
      if (el.id && document.querySelectorAll(`#${CSS.escape(el.id)}`).length === 1) {
        parts.unshift(`#${CSS.escape(el.id)}`);
        return parts.join(">");
      }
      const tag = el.tagName.toLowerCase();
      let k = 1;
      for (let s = el.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === el.tagName) k++;
      parts.unshift(`${tag}:nth-of-type(${k})`);
    }
    return parts.length ? `body>${parts.join(">")}` : "body";
  }
  const find = (path: string) => {
    try {
      return document.querySelector(path);
    } catch {
      return null;
    }
  };
  const blockOf = (node: Node | null) => {
    const e = node && (node.nodeType === 1 ? (node as Element) : node.parentElement);
    return e ? e.closest(BLOCKS) : null;
  };
  // the smallest block whose words hold `quote` (a block that moved keeps its note)
  function byQuote(quote: unknown) {
    const q = norm(quote);
    if (!q) return null;
    let best: Element | null = null;
    for (const e of document.querySelectorAll(BLOCKS)) if (norm(e.textContent).includes(q) && (!best || best.contains(e))) best = e;
    return best;
  }

  // ---- his selection
  let had = false;
  document.addEventListener("mouseup", () => {
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        if (had) post({ bise: "site-select", anchor: null });
        had = false;
        return;
      }
      const range = sel.getRangeAt(0);
      const block = blockOf(range.commonAncestorContainer);
      const quote = norm(sel.toString()).slice(0, MAX);
      if (!block || !quote) return;
      const r = range.getBoundingClientRect();
      had = true;
      post({ bise: "site-select", anchor: { kind: "block", block: pathOf(block), quote }, quote, rect: { x: r.left, y: r.top, w: r.width, h: r.height } });
    }, 0);
  });
  document.addEventListener("scroll", () => had && post({ bise: "site-scroll" }), { passive: true, capture: true });
  document.addEventListener("keydown", (e) => {
    const sel = window.getSelection();
    if (!had || !sel || sel.isCollapsed) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName || ""))) return;
    post({ bise: "site-key", key: e.key, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey, isComposing: e.isComposing });
  });

  // ---- the marks the viewer posts in
  const style = document.createElement("style");
  style.textContent = `[data-bise-mark]{box-shadow:inset 3px 0 0 #c8264a!important}
[data-bise-mark="draft"]{box-shadow:inset 3px 0 0 #c8264a55!important}
[data-bise-mark="done"]{box-shadow:none!important;position:relative}
[data-bise-mark="done"]::after{content:"✓";position:absolute;top:0;right:2px;color:#c8264a;font:600 11px/1 system-ui,sans-serif}
@media (prefers-color-scheme: dark){[data-bise-mark]{box-shadow:inset 3px 0 0 #f4a6b0!important}[data-bise-mark="draft"]{box-shadow:inset 3px 0 0 #f4a6b055!important}[data-bise-mark="done"]::after{color:#f4a6b0}}`;
  // the viewer's marks: a note's anchor and its state (kit/office/site.js)
  type Mark = { i: number; mark: string; at?: { kind?: string; block?: unknown; quote?: string } | null } | null;
  window.addEventListener("message", (e: MessageEvent<{ bise?: string; marks?: Mark[] } | null>) => {
    if (e.source !== P || !e.data || e.data.bise !== "site-marks" || !Array.isArray(e.data.marks)) return;
    if (!style.isConnected) (document.head || document.documentElement).append(style);
    for (const el of document.querySelectorAll("[data-bise-mark]")) el.removeAttribute("data-bise-mark");
    const found: number[] = [];
    const rank: Record<string, number> = { draft: 1, done: 2, sent: 3 };
    for (const m of e.data.marks) {
      const at = m && m.at;
      if (!at || at.kind !== "block" || typeof at.block !== "string") continue;
      let el = find(at.block);
      if (el && at.quote && !norm(el.textContent).includes(norm(at.quote))) el = null;
      if (!el) el = byQuote(at.quote);
      if (!el) continue;
      found.push(m.i);
      const was = el.getAttribute("data-bise-mark");
      if (rank[m.mark] && (!was || rank[m.mark] > rank[was])) el.setAttribute("data-bise-mark", m.mark);
    }
    post({ bise: "site-found", found });
  });
  post({ bise: "site-hello" });
})();
