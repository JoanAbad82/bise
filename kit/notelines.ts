// bise kit · notes on the lines of a ui block (page-notes; docs/ambient-pages.md §2.7).
// A note on a k-diff or a k-term says which lines it is about, like a review comment on GitHub:
// the rows it covers (`.k-dl` a diff's row with data-old / data-new, `.k-ln` a terminal's line),
// each as {old?, new?, n?, text}, and the part of the block they sit in (the tab, the figure's
// caption: `part`). notes.js puts them on the note (`lines`, `more`, `part`); the hub writes them
// in the notes message (pages/notelines.rs) so the agent reads the numbers and the text.
// On a k-diff a click on a row's numbers picks that row, shift-click or a drag on the numbers
// picks a run: the same toolbar as a text selection comes up.
//
// Two halves, like notes.js: `BiseLines.core` is pure (node checks run it) and the DOM helpers read the page. Loaded before notes.js.
(function (root: typeof globalThis) {
  "use strict";

  const ROWS = ".k-dl, .k-ln";
  const MAX = 40;      // lines kept on one note (the rest is counted in `more`)
  const CUT = 300;     // chars kept of one line

  const norm = (s: unknown) => String(s || "").replace(/\s+/g, " ").trim();
  const cut = (s: string, k: number) => (s.length > k ? `${s.slice(0, k - 1)}…` : s);
  const num = (v: string | number | null | undefined) => (v == null || v === "" || !/^\d+$/.test(String(v).trim()) ? null : +v);

  // ---- pure: a row's facts {old, new, n, text} -> a note's line
  function line(f: LineFacts): NoteLine {
    const o = {} as NoteLine, a = num(f.old), b = num(f.new);
    if (a != null) o.old = a;
    if (b != null) o.new = b;
    if (a == null && b == null && f.n != null) o.n = f.n;
    o.text = cut(String(f.text || "").replace(/\s+$/, ""), CUT);
    return o;
  }
  // the rows' facts -> {lines, more}
  function linesOf(facts: LineFacts[] | null | undefined): { lines: NoteLine[]; more?: number } {
    const all = (facts || []).map(line);
    return all.length > MAX ? { lines: all.slice(0, MAX), more: all.length - MAX } : { lines: all };
  }
  // 34 or 34–38 (the run's first and last numbers)
  const span = (ns: number[]) => (ns.length ? (Math.min(...ns) === Math.max(...ns) ? `${ns[0]}` : `${Math.min(...ns)}–${Math.max(...ns)}`) : "");
  // what a note's place line says, in words (ambient m_7871: '-5-7' in mono reads as hyphens):
  // a diff's `old 5–7 · new 5` (only old: `old 5–7`, only new: `new 5`; an unchanged row counts
  // on both sides), a terminal's `line 3`, `lines 3–5`
  function label(lines: NoteLine[] | null | undefined, more?: number) {
    const ls = lines || [];
    if (!ls.length) return "";
    const old = ls.filter((l) => l.old != null).map((l) => l.old as number), nw = ls.filter((l) => l.new != null).map((l) => l.new as number);
    const ns = ls.filter((l) => l.n != null).map((l) => l.n as number);
    const parts: string[] = [];
    if (old.length) parts.push(`old ${span(old)}`);
    if (nw.length) parts.push(`new ${span(nw)}`);
    if (ns.length) parts.push(`${ls.length + (more || 0) === 1 ? "line" : "lines"} ${span(ns)}`);
    return parts.join(" · ");
  }
  // a note's place: its lines, and the part of the block they are in
  const where = (n: LinesPlace | null | undefined) => (n && n.lines && n.lines.length ? [label(n.lines, n.more), n.part].filter(Boolean).join(" · ") : "");

  // ======================================================================================
  // the DOM
  // ======================================================================================

  // a row's facts; `textOf` is notes.js's (the agent's text, never the kit's controls)
  function factsOf(row: Element, textOf: (row: Element) => string): LineFacts {
    const box = row.closest(".k-cells, .k-diff") || row.parentElement;
    const same = box ? [...box.querySelectorAll(row.matches(".k-dl") ? ".k-dl" : ".k-ln")] : [row];
    return { old: row.getAttribute("data-old"), new: row.getAttribute("data-new"), n: same.indexOf(row) + 1, text: textOf(row) };
  }
  // what shows (a row in a closed fold or a hidden tab is not something you selected)
  const shown = (e: Element) => !!(e.getClientRects && e.getClientRects().length);
  // the rows a Range covers, in order
  // (a drag that ends at the start of the next row, or starts at the end of a row, doesn't take
  // that row: nothing of it is selected)
  function rowsIn(range: Range, block: Element) {
    const rows = [...block.querySelectorAll(ROWS)].filter((r) => shown(r) && range.intersectsNode(r));
    const none = (row: Element, first: boolean) => {
      if (!row.textContent) return false;
      try {
        const r = block.ownerDocument.createRange();
        if (first) { r.setStart(range.startContainer, range.startOffset); r.setEnd(row, row.childNodes.length); }
        else { r.setStart(row, 0); r.setEnd(range.endContainer, range.endOffset); }
        return r.toString() === "";
      } catch { return false; }
    };
    if (rows.length > 1 && none(rows[rows.length - 1], false)) rows.pop();
    if (rows.length > 1 && none(rows[0], true)) rows.shift();
    return rows;
  }
  // where in the block: the tab's name, then the figure's caption (k-states, k-ba), nearest first
  function partOf(el: Element, block: Element) {
    const out: string[] = [];
    for (let e: Element | null = el; e && e !== block; e = e.parentElement) {
      if (e.matches(".k-pane[data-tab]")) {
        const tabs = e.closest("[data-ui=\"tabs\"]");
        const pane = e;
        const b = tabs && [...tabs.querySelectorAll(".k-tabs > button[data-tab]")].find((x) => x.getAttribute("data-tab") === pane.getAttribute("data-tab"));
        if (b) out.push(norm(b.textContent));
      } else if (e.tagName === "FIGURE") {
        const cap = [...e.children].find((c) => c.tagName === "FIGCAPTION");
        if (cap) out.push(norm(cap.textContent));
      }
    }
    return cut(out.filter(Boolean).reverse().join(" · "), 80);
  }
  // a Range in a block -> {lines?, more?, part?} for its note
  function at(range: Range, block: Element, textOf: (row: Element) => string): LinesPlace {
    const rows = rowsIn(range, block);
    const start = range.startContainer.nodeType === 1 ? (range.startContainer as Element) : range.startContainer.parentElement;
    // (a range in the block starts in it: an element, or a text node's parent)
    const part = partOf(rows[0] || start!, block);
    return { ...(rows.length ? linesOf(rows.map((r) => factsOf(r, textOf))) : {}), ...(part ? { part } : {}) };
  }

  // ---- picking a diff's rows by their numbers (the gutter: the row's left padding)
  const PICKED = "data-bn-line";
  function inGutter(row: Element, x: number, win: Window) {
    if (!row.matches(".k-dl")) return false;
    const r = row.getBoundingClientRect();
    return x - r.left < parseFloat(win.getComputedStyle(row).paddingLeft || "0");
  }
  function clear(page: ParentNode) { for (const r of page.querySelectorAll(`[${PICKED}]`)) r.removeAttribute(PICKED); }
  // the rows from a to b (both in one k-diff), what shows
  function run(a: Element, b: Element) {
    const diff = a.closest(".k-diff");
    if (!diff || diff !== b.closest(".k-diff")) return [b];
    const rows = [...diff.querySelectorAll(".k-dl")].filter(shown);
    const i = rows.indexOf(a), j = rows.indexOf(b);
    return i < 0 || j < 0 ? [b] : rows.slice(Math.min(i, j), Math.max(i, j) + 1);
  }
  // mousedown on a row's numbers picks it, shift extends from the last pick, a drag extends to
  // the row under the pointer; at mouseup `onPick(rows, block)`. Returns the picked rows' getter.
  function bindGutter(doc: Document, page: Element, onPick: (rows: Element[], block: Element) => void, off?: () => boolean): Gutter {
    // a page in a browser has its window
    const win = doc.defaultView as Window;
    let anchor: Element | null = null, picked: Element[] = [], dragging = false;
    // the run's ends carry first / last (notes.css draws the outline around the run)
    const mark = (rows: Element[]) => {
      clear(page); picked = rows;
      rows.forEach((r, i) => r.setAttribute(PICKED, [i === 0 ? "first" : "", i === rows.length - 1 ? "last" : ""].filter(Boolean).join(" ")));
    };
    page.addEventListener("mousedown", (ev) => {
      const e = ev as MouseEvent & { target: Element };
      if (e.button !== 0 || (off && off())) return;
      const row = e.target.closest && e.target.closest(".k-dl");
      if (!row || !inGutter(row, e.clientX, win)) return;
      e.preventDefault();   // no text selection
      if (win.getSelection) win.getSelection()!.removeAllRanges();
      if (!(e.shiftKey && anchor && doc.contains(anchor))) anchor = row;
      mark(run(anchor, row));
      dragging = true;
    });
    page.addEventListener("mousemove", (ev) => {
      const e = ev as MouseEvent & { target: Element };
      if (!dragging) return;
      const row = e.target.closest && e.target.closest(".k-dl");
      if (row && anchor) mark(run(anchor, row));
    });
    doc.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false;
      const block = picked[0] && picked[0].closest("[data-kit][data-id]");
      if (block) onPick(picked, block);
    });
    return { clear: () => { clear(page); picked = []; }, picked: () => picked };
  }

  const core = { line, linesOf, label, where, span, MAX, CUT };
  root.BiseLines = { core, label, where, at, rowsIn, partOf, factsOf, bindGutter, clear, ROWS };
})(typeof window !== "undefined" ? window : globalThis);
