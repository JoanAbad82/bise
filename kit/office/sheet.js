// bise kit · the xlsx renderer of the office viewer (viewer.js; page xlsx-univer, architect
// m_37322, m_37328): the workbook in Univer's grid (office/dist/office-sheet.js, loaded here
// only), where he resizes columns and rows, types values and formulas (recomputed by the
// grid), and his edits save themselves 2 s after the last one: the grid's edits
// (editsBetween) are replayed on the file with the office SDK, which keeps what the grid never
// saw (charts, pivots), and the bytes go to POST /api/a/<id>/save, which writes the file and
// makes the next version (the saves of one sitting replace it: one version per sitting).
//
// A version made elsewhere while he has edits not saved yet: the save is refused (409) and
// the strip offers `keep mine` (save over it) or `take v<n>` (draw it, his edits dropped).
// His own saves come back on the artifact's stream: they are not drawn again (hold).
//
// What the notes layer (select.js) asks of a view: selection() as an Anchor, box() and quote()
// of the selection, where(anchor) for the marks (boxes over the canvas, moved as it scrolls).
//
// The save's body: one JSON line {base, rev, session, seq, force}, then the bytes
// (pages/artifact/save.rs). A 503 (the hub busy) is tried again with the same seq: a save
// that landed late answers its version, never a second one.
//
// Pure helpers (exported for office/sdk/test/viewer.test.mjs): parseRef, colName, rangeOf, saveBody,
// saveState; and saver, the save loop without the DOM.

import { sheets, editsBetween } from "/kit/office/office.js";

/** How long after his last edit the file is saved. */
export const SAVE_AFTER_MS = 2000;

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

/** The save's body: the header line, then the file's bytes. */
export function saveBody(head, bytes) {
  const line = new TextEncoder().encode(`${JSON.stringify(head)}\n`);
  const out = new Uint8Array(line.length + bytes.length);
  out.set(line);
  out.set(bytes, line.length);
  return out;
}

/**
 * The strip's words for a state: `idle` (nothing), `waiting` (edits not saved yet),
 * `saving`, `saved` (v), `conflict` (v: the version that came in), `failed` (why).
 */
export function saveState(state) {
  switch (state.kind) {
    case "waiting":
      return { text: "edited", actions: [] };
    case "saving":
      return { text: "saving…", actions: [] };
    case "saved":
      return { text: `saved · v${state.v}`, actions: [] };
    case "conflict":
      if (state.disk) return { text: "the file changed on disk while you edited", actions: [{ id: "keep", text: "keep mine" }, { id: "take", text: `take v${state.v}` }] };
      return { text: `v${state.v} came in while you edited`, actions: [{ id: "keep", text: "keep mine" }, { id: "take", text: `take v${state.v}` }] };
    case "failed":
      return { text: `couldn't save: ${state.why}`, actions: [{ id: "retry", text: "try again" }] };
    default:
      return { text: "", actions: [] };
  }
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Light or dark, as the frame wears it (kit.js's <html data-theme>, else the system's). */
function darkNow() {
  const t = document.documentElement.dataset.theme;
  if (t === "dark" || t === "light") return t === "dark";
  return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

/** What the foot says this file has that the grid does not draw. */
function notesOf(outline) {
  const out = [];
  for (const s of outline.nodes.filter((n) => n.type === "sheet")) {
    const p = s.props || {};
    for (const c of p.charts || []) out.push(`${s.name}: the chart "${c.title || "untitled"}" is not drawn here (it stays in the file).`);
    if (p.pivots) out.push(`${s.name}: ${p.pivots} pivot table${p.pivots > 1 ? "s are" : " is"} not drawn here (kept in the file).`);
  }
  return out;
}

const token = () => (document.querySelector('meta[name="bise-token"]') || {}).content || "";

/**
 * His edits saved (the viewer's save loop, without the DOM: the tests drive it with a fake
 * grid). `grid.snapshot()` is the grid now; `post(head, bytes)` sends a save and gives
 * `{status, answer}`; `later(fn, ms)` schedules and gives its cancel; `onState(state)` is told
 * each state (saveState's words); `take(ev)` draws a version past the hold.
 */
export function saver({ book, grid, info, session, post, later, onState, take }) {
  let saved = grid.snapshot(); // the grid's snapshot the file was last saved from
  let base = { v: info.version, rev: info.rev ?? 1 };
  let state = { kind: "idle" };
  let cancel = null;
  let inFlight = null;
  let dirty = false;
  const mine = new Set(); // `${v}:${rev}` of the saves made here
  let stashed = null; // a version that came during a save
  let keepAgainst = null; // the version `keep mine` saves over
  let seq = 0; // this sitting's saves, from 1
  const set = (s) => {
    state = s;
    onState(s);
  };

  function changed() {
    dirty = true;
    if (state.kind !== "conflict" && state.kind !== "saving") set({ kind: "waiting" });
    cancel?.();
    cancel = later(save, SAVE_AFTER_MS);
  }

  async function save() {
    cancel?.();
    cancel = null;
    if (inFlight) return inFlight;
    if (state.kind === "conflict" && !keepAgainst) return;
    const now = grid.snapshot();
    const edits = editsBetween(saved, now);
    if (edits.length === 0 && !keepAgainst) {
      dirty = false;
      set({ kind: "idle" });
      return;
    }
    book.apply(edits);
    saved = now;
    dirty = false;
    set({ kind: "saving" });
    const against = keepAgainst || base;
    keepAgainst = null;
    seq += 1;
    const head = { base: against.v, rev: against.rev, session, seq, force: !!against.force };
    inFlight = (async () => {
      const bytes = await book.save();
      let r;
      // the hub busy past its wait: the same save again (its seq makes a retry harmless)
      for (let tries = 0; tries < 4; tries++) {
        r = await post(head, bytes);
        if (r.status !== 503) break;
      }
      const a = r.answer || {};
      if (r.status === 409 && a.v) return { kind: "conflict", v: a.v, rev: a.rev, disk: !!a.disk };
      if (r.status !== 200) return { kind: "failed", why: a.error || `${r.status}` };
      mine.add(`${a.v}:${a.rev}`);
      base = { v: a.v, rev: a.rev };
      Object.assign(info, { version: a.v, latest: a.v, rev: a.rev });
      return { kind: "saved", v: a.v };
    })().catch((e) => ({ kind: "failed", why: e.message || String(e) }));
    const done = await inFlight;
    inFlight = null;
    set(done);
    if (dirty && done.kind === "saved") changed();
    const ev = stashed;
    stashed = null;
    if (ev && !mine.has(`${ev.n}:${ev.rev}`) && done.kind !== "conflict") came(ev);
  }

  /** A version made elsewhere: drawn when he has nothing unsaved, else he picks. */
  function came(ev) {
    if (!dirty && state.kind !== "conflict") return false;
    set({ kind: "conflict", v: ev.n, rev: ev.rev });
    return true;
  }

  return {
    get state() {
      return state;
    },
    get dirty() {
      return dirty;
    },
    changed,
    save,
    /** `keep mine`: his edits saved over the version that came (over the disk's file too). */
    keep() {
      if (state.kind !== "conflict") return;
      keepAgainst = { v: state.v, rev: state.rev, force: !!state.disk };
      return save();
    },
    /** `take v<n>`: that version drawn, his edits not saved dropped. */
    take() {
      if (state.kind !== "conflict") return;
      const ev = { n: state.v, rev: state.rev };
      dirty = false;
      set({ kind: "idle" });
      take(ev);
    },
    /** A version on the artifact's stream: true when this view keeps it from being drawn. */
    hold(ev) {
      if (mine.has(`${ev.n}:${ev.rev}`)) return true;
      if (inFlight) {
        stashed = ev;
        return true;
      }
      return came(ev);
    },
  };
}

export async function draw(root, bytes, info) {
  const [book, ui] = await Promise.all([sheets.open(bytes), import("/kit/office/office-sheet.js")]);
  root.classList.add("office-sheet");
  const strip = el("div", "office-save");
  strip.setAttribute("role", "status");
  const host = el("div", "office-univer");
  root.append(host, strip);

  const session = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  let grid = null;
  let save = null;

  function paint(state) {
    const w = saveState(state);
    strip.dataset.state = state.kind;
    strip.replaceChildren();
    if (!w.text) return;
    strip.append(el("span", "words", w.text));
    for (const a of w.actions) {
      const b = el("button", null, a.text);
      b.type = "button";
      b.dataset.do = a.id;
      strip.append(b);
    }
  }
  strip.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-do]");
    if (!b || !save) return;
    if (b.dataset.do === "keep") save.keep();
    else if (b.dataset.do === "take") save.take();
    else if (b.dataset.do === "retry") save.save();
  });
  const post = async (head, bytes) => {
    const r = await fetch(`/api/a/${encodeURIComponent(info.id)}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream", "X-Bise-Token": token() },
      body: saveBody(head, bytes),
      credentials: "same-origin",
      cache: "no-store",
    });
    return { status: r.status, answer: await r.json().catch(() => ({})) };
  };
  const later = (fn, ms) => {
    const t = setTimeout(fn, ms);
    return () => clearTimeout(t);
  };

  // the grid needs its size: mounted once the viewer put the stage in the page
  const mount = () => {
    if (!host.isConnected) return requestAnimationFrame(mount);
    grid = ui.mountGrid(host, book.univer(), { dark: darkNow() });
    save = saver({ book, grid, info, session, post, later, onState: paint, take: (ev) => window.biseOffice.take?.(ev) });
    grid.onChange(() => save.changed());
    grid.onMove(() => moveMarks());
    new MutationObserver(() => grid && grid.dark(darkNow())).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => grid && grid.dark(darkNow()));
    if (pendingPlace) grid.restore(pendingPlace);
  };
  let pendingPlace = null;
  mount();

  // the marks the notes layer asked for, kept over their cells as the grid moves
  const marks = new Set();
  function moveMarks() {
    for (const m of marks) {
      if (!m.box.isConnected) {
        marks.delete(m);
        continue;
      }
      const r = grid && grid.rect(m.a.sheet, m.a.range);
      m.box.hidden = !r;
      if (r) Object.assign(m.box.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    }
  }

  window.addEventListener("pagehide", () => {
    if (save && save.dirty) save.save();
  });

  return {
    notes: notesOf(book.inspect({ maxCells: 0 })),
    place() {
      return grid ? grid.place() : pendingPlace || { sheet: book.sheetNames[0], range: null };
    },
    restore(p) {
      if (grid) grid.restore(p);
      else pendingPlace = p;
    },
    /** The selection as an Anchor (bise_proto::anchor `cell`), or null. */
    selection() {
      const p = grid && grid.place();
      return p && p.range ? { kind: "cell", sheet: p.sheet, range: p.range } : null;
    },
    box() {
      const p = grid && grid.place();
      return p && p.range ? grid.rect(p.sheet, p.range) : null;
    },
    quote() {
      return grid ? grid.text() : "";
    },
    where(a) {
      if (a.kind !== "cell") return null;
      const has = book.sheetNames.includes(a.sheet);
      const r = grid && grid.rect(a.sheet, a.range);
      if (!r) return { els: [], found: has };
      const box = el("div", "office-cell-mark");
      box.dataset.ours = "1";
      document.body.append(box);
      const m = { a, box };
      marks.add(m);
      moveMarks();
      return { els: [box], found: true };
    },
    /** A version on the artifact's stream: true when this view keeps it from being drawn. */
    hold(ev) {
      return save ? save.hold(ev) : false;
    },
    dispose() {
      for (const m of marks) m.box.remove();
      grid && grid.dispose();
    },
  };
}
