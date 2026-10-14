// bise kit · the xlsx renderer of the office viewer (viewer.js; plan §4): the sheets module's
// outline (sheets.open(bytes).inspect(), office-sheets m_23804) as a grid: sheet tabs, column
// widths, merged cells, the values as shown, fills, bold, alignment; a click selects a cell
// (its formula in the bar), shift+click a range. Rows are added as the user scrolls (a long
// sheet draws its first rows at once). Not drawn, said in the foot: charts (their titles),
// pivot tables, and formulas with no saved value.
//
// Pure helpers (exported for kit/office/check.mjs): parseRef, colName, rangeOf, model.

import { sheets } from "/kit/office/office.js";

/** Rows drawn at once, and again each time the end comes near. */
const CHUNK = 200;
const DEFAULT_WIDTH = 72;

/** `B4` → { col: 2, row: 4 } (1-based); null for anything else. */
export function parseRef(ref) {
  const m = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(ref || "");
  if (!m) return null;
  let col = 0;
  for (const ch of m[1].toUpperCase()) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { col, row: Number(m[2]) };
}

/** 1 → A, 27 → AA. */
export function colName(col) {
  let s = "";
  for (let c = col; c > 0; c = Math.floor((c - 1) / 26)) s = String.fromCharCode(65 + ((c - 1) % 26)) + s;
  return s;
}

/** Two corners (any order) as `B4:D9`, or `B4` for one cell. */
export function rangeOf(a, b) {
  const [c0, c1] = [Math.min(a.col, b.col), Math.max(a.col, b.col)];
  const [r0, r1] = [Math.min(a.row, b.row), Math.max(a.row, b.row)];
  const one = `${colName(c0)}${r0}`;
  return c0 === c1 && r0 === r1 ? one : `${one}:${colName(c1)}${r1}`;
}

/** A sheet node of the outline as what the grid draws: cells by `row:col`, the size, the merges. */
export function model(sheet) {
  const p = sheet.props || {};
  const cells = new Map();
  let rows = 0;
  let cols = 0;
  for (const c of sheet.children || []) {
    if (c.type !== "cell") continue;
    const ref = parseRef(String(c.id).split("!").pop());
    if (!ref) continue;
    cells.set(`${ref.row}:${ref.col}`, c);
    rows = Math.max(rows, ref.row);
    cols = Math.max(cols, ref.col);
  }
  const dims = typeof p.dims === "string" ? p.dims.split(":").map(parseRef) : [];
  if (dims[1]) [rows, cols] = [Math.max(rows, dims[1].row), Math.max(cols, dims[1].col)];
  // a merge: its top-left cell spans it, the others are not drawn
  const spans = new Map();
  const covered = new Set();
  for (const r of p.merged || []) {
    const [a, b] = String(r).split(":").map(parseRef);
    if (!a || !b) continue;
    spans.set(`${a.row}:${a.col}`, { rows: b.row - a.row + 1, cols: b.col - a.col + 1 });
    for (let y = a.row; y <= b.row; y++) for (let x = a.col; x <= b.col; x++) if (y !== a.row || x !== a.col) covered.add(`${y}:${x}`);
    rows = Math.max(rows, b.row);
    cols = Math.max(cols, b.col);
  }
  return { name: sheet.name || sheet.id, rows: Math.max(rows, 1), cols: Math.max(cols, 1), cells, spans, covered, props: p };
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** What the foot says this file has that the grid does not draw. */
function notesOf(models) {
  const out = [];
  for (const m of models) {
    for (const c of m.props.charts || []) out.push(`${m.name}: the chart "${c.title || "untitled"}" is not drawn here.`);
    if (m.props.pivots) out.push(`${m.name}: ${m.props.pivots} pivot table${m.props.pivots > 1 ? "s are" : " is"} not drawn here.`);
    let none = 0;
    for (const c of m.cells.values()) if (c.props && c.props.noValue) none++;
    if (none) out.push(`${m.name}: ${none} formula${none > 1 ? "s have" : " has"} no saved value (blank here until Excel computes ${none > 1 ? "them" : "it"}).`);
  }
  return out;
}

export async function draw(root, bytes) {
  const book = await sheets.open(bytes);
  const models = book.inspect().nodes.filter((n) => n.type === "sheet").map(model);
  root.classList.add("office-sheet");
  const bar = el("div", "office-bar");
  const where = el("span", "where");
  const formula = el("span", "formula");
  bar.append(where, formula);
  const scroller = el("div", "office-grid");
  const tabs = el("nav", "office-tabs");
  tabs.setAttribute("aria-label", "sheets");
  root.append(bar, scroller, tabs);

  let current = 0;
  let sel = null; // { a, b } corners, 1-based
  let drawn = 0;
  let tbody = null;
  let more = null;

  function cellNode(m, row, col) {
    return m.cells.get(`${row}:${col}`);
  }

  function rowEl(m, row) {
    const tr = el("tr");
    tr.append(el("th", "rn", String(row)));
    const h = m.props.heights && m.props.heights[row];
    if (h) tr.style.height = `${h}px`;
    for (let col = 1; col <= m.cols; col++) {
      const key = `${row}:${col}`;
      if (m.covered.has(key)) continue;
      const c = cellNode(m, row, col);
      const td = el("td", null, c ? (c.text ?? "") : "");
      td.dataset.ref = `${colName(col)}${row}`;
      const span = m.spans.get(key);
      if (span) {
        if (span.rows > 1) td.rowSpan = span.rows;
        if (span.cols > 1) td.colSpan = span.cols;
      }
      const p = (c && c.props) || {};
      if (p.bold) td.style.fontWeight = "600";
      if (p.italic) td.style.fontStyle = "italic";
      if (p.fill) td.style.background = p.fill;
      if (p.color) td.style.color = p.color;
      if (p.align) td.style.textAlign = p.align;
      else if (typeof p.value === "number") td.style.textAlign = "right";
      if (p.noValue) td.classList.add("novalue");
      if (p.error) td.classList.add("error");
      tr.append(td);
    }
    return tr;
  }

  function addRows(m) {
    const end = Math.min(m.rows, drawn + CHUNK);
    const frag = document.createDocumentFragment();
    for (let r = drawn + 1; r <= end; r++) frag.append(rowEl(m, r));
    tbody.append(frag);
    drawn = end;
    if (drawn >= m.rows && more) {
      more.remove();
      more = null;
    }
  }

  function showSheet(i) {
    current = i;
    sel = null;
    drawn = 0;
    const m = models[i];
    scroller.replaceChildren();
    for (const [j, b] of [...tabs.children].entries()) b.setAttribute("aria-selected", String(j === i));
    if (!m) {
      scroller.append(el("p", "office-empty", "this workbook has no sheets."));
      return;
    }
    const table = el("table");
    const colgroup = el("colgroup");
    colgroup.append(el("col", "rn"));
    const head = el("tr");
    head.append(el("th", "corner"));
    for (let col = 1; col <= m.cols; col++) {
      const c = el("col");
      const w = m.props.widths && m.props.widths[col - 1];
      c.style.width = `${w || DEFAULT_WIDTH}px`;
      colgroup.append(c);
      head.append(el("th", "cn", colName(col)));
    }
    const thead = el("thead");
    thead.append(head);
    tbody = el("tbody");
    table.append(colgroup, thead, tbody);
    scroller.append(table);
    addRows(m);
    if (drawn < m.rows) {
      more = el("p", "office-more", `rows ${drawn + 1}–${m.rows} as you scroll`);
      scroller.append(more);
    }
    paint();
  }

  scroller.addEventListener("scroll", () => {
    const m = models[current];
    if (m && drawn < m.rows && scroller.scrollTop + scroller.clientHeight > scroller.scrollHeight - 400) addRows(m);
  });

  /** The selection's outline in the grid and its words in the bar. */
  function paint() {
    for (const td of scroller.querySelectorAll("td.sel")) td.classList.remove("sel");
    const m = models[current];
    if (!sel || !m) {
      where.textContent = m ? m.name : "";
      formula.textContent = "";
      return;
    }
    const range = rangeOf(sel.a, sel.b);
    for (const td of scroller.querySelectorAll("td[data-ref]")) {
      const r = parseRef(td.dataset.ref);
      if (r.col >= Math.min(sel.a.col, sel.b.col) && r.col <= Math.max(sel.a.col, sel.b.col) && r.row >= Math.min(sel.a.row, sel.b.row) && r.row <= Math.max(sel.a.row, sel.b.row)) td.classList.add("sel");
    }
    where.textContent = `${m.name}!${range}`;
    const c = cellNode(m, sel.a.row, sel.a.col);
    const p = (c && c.props) || {};
    formula.textContent = p.formula ? `=${String(p.formula).replace(/^=/, "")}` : (c?.text ?? "");
  }

  scroller.addEventListener("click", (e) => {
    const td = e.target.closest("td[data-ref]");
    if (!td) return;
    const r = parseRef(td.dataset.ref);
    sel = e.shiftKey && sel ? { a: sel.a, b: r } : { a: r, b: r };
    paint();
  });

  for (const [i, m] of models.entries()) {
    const b = el("button", null, m.name);
    b.type = "button";
    b.setAttribute("role", "tab");
    b.addEventListener("click", () => showSheet(i));
    tabs.append(b);
  }
  showSheet(0);

  return {
    notes: notesOf(models),
    place() {
      return { sheet: models[current]?.name, top: scroller.scrollTop, left: scroller.scrollLeft, sel };
    },
    restore(p) {
      const i = models.findIndex((m) => m.name === p.sheet);
      if (i < 0) return;
      showSheet(i);
      const m = models[i];
      while (drawn < m.rows && scroller.scrollHeight < p.top + scroller.clientHeight) addRows(m);
      scroller.scrollTop = p.top;
      scroller.scrollLeft = p.left;
      sel = p.sel;
      paint();
    },
    /** The selection as an Anchor (bise_proto::anchor `cell`), or null. */
    selection() {
      const m = models[current];
      return sel && m ? { kind: "cell", sheet: m.name, range: rangeOf(sel.a, sel.b) } : null;
    },
  };
}
