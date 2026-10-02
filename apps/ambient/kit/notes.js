// bise kit · the note layer (docs/ambient-pages.md §2.7, docs/ambient-vision.md §3 C-D, §5).
// On a page the agent made, you leave notes: a pin, a typed note on a block or on a selection
// (anchored by the block's data-id and the quoted text), ♡ keep · ✗ drop · ~ not sure, an edit in
// place on prose (a note with before/after, undone with ⌘z). The side list shows them; nothing goes
// until `send` (the button, ⌘⏎). Drafts are saved to the page server, so a reload loses nothing.
// When kit.js swaps in the next version (`bise:swapped`), notes re-anchor (`moved` when their
// block or quote is gone) and show what happened to them (done, the agent's answer, open).
//
// Two halves: `BiseNotes.core` is pure (the words, anchoring, the notes model: node checks run it,
// apps/ambient/web/check.mjs) and `mount()` is the DOM (the page's, under the shell's CSP: no
// inline style, only CSSOM for the pins' positions). Classes are `bn-*`; looks come from the kit's
// role tokens (notes.css).
(function (root) {
  "use strict";

  // ---- the words (ambient's; a new line goes through ambient)
  const NW = {
    listTitle: (page, n) => `notes for ${page} · ${n}`,
    sendBar: (n, agent) => `${n} ${n === 1 ? "note" : "notes"} for ${agent} · or just say "send"`,
    send: "send",
    count: (n) => (n ? `${n} ${n === 1 ? "note" : "notes"}` : ""),
    sent: (agent) => `sent. ${agent} is on it.`,
    updating: (agent) => `${agent} is updating this page…`,
    moved: "moved",
    done: "✓ done",
    open: "open",
    sentTag: "sent",
    changed: (before, after) => `you changed "${before}" → "${after}"`,
    marks: { keep: "♡ keep", drop: "✗ drop", unsure: "~ not sure" },
    // a voice note's pin while you talk (the mocks' `you · voice`; ambient, m_4877)
    voiceBy: "you · voice",
    // a drawing in the side list, and the hint while you draw (§5.4; asked to ambient)
    // signed by ambient (m_4926): esc still ends it, it just doesn't need saying
    drawing: "✎ drawing",
    drawHint: "draw on the page   d done",
    // the agent's answer to a note is a reply (ambient, m_4919 (3)): its name dim, its words, then yours
    replyBy: (agent) => `${agent}:`,
    replyField: "reply, or hold fn and say it",
    // a question's option you picked (ambient, m_4795)
    picked: (option, text) => (text ? `you picked ${option}: ${text}` : `you picked ${option}`),
    tools: { note: "note", keep: "♡", drop: "✗", unsure: "~", edit: "edit", pin: "pin" },
    placeholder: "your note",
    // signed off by ambient (m_4786): 'block' is our word, not hers; keys like the TUI's key bar
    empty: "no notes yet. select some text, or hold fn and talk.",
    keys: "t type   p pin   d draw   ⌘z undo   ⌘⏎ send",
    remove: "remove",
    undo: "undo",
    failed: "couldn't save your notes. trying again.",
  };

  // agents' ids are kebab-case; on your surfaces they read with spaces (vision §3 B)
  const spaced = (id) => String(id || "").replace(/-/g, " ");

  // ---- anchoring: on the block's text with its whitespace collapsed (what you see)
  const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();

  // where `quote` sits in `text` (both normalized): the occurrence nearest `hint` (its old offset)
  function locate(text, quote, hint) {
    const t = norm(text), q = norm(quote);
    if (!q) return null;
    let best = null, at = t.indexOf(q);
    while (at >= 0) {
      if (best == null || Math.abs(at - (hint || 0)) < Math.abs(best - (hint || 0))) best = at;
      at = t.indexOf(q, at + 1);
    }
    return best == null ? null : { start: best, end: best + q.length };
  }

  // a note against the blocks of a version ({id: text}): is it still where it was?
  function anchorOf(note, blocks) {
    if (!note.block) return "ok";                         // a page-wide note
    // a drawing holds while one of the blocks under it is still there
    if (note.kind === "draw") return (note.blocks || [note.block]).some((id) => id in blocks) ? "ok" : "moved";
    if (!(note.block in blocks)) return "moved";          // its block is gone
    const text = blocks[note.block];
    if (note.kind === "edit") {
      // your edit holds if your words are there (kept, as the agent should), or the old ones are
      if (note.after && locate(text, note.after)) return "ok";
      if (note.before && locate(text, note.before)) return "ok";
      return "moved";
    }
    if (note.quote && !locate(text, note.quote, note.offset)) return "moved";
    return "ok";
  }
  // every note, re-anchored on a new version's blocks
  const reanchor = (notes, blocks) => notes.map((n) => ({ ...n, anchor: anchorOf(n, blocks) }));

  // ---- the words nearest a point in a block's text (a voice note's or a pin's anchor): the word
  // at `offset` and its neighbours, at most `n` words, never across a sentence's end
  function nearestQuote(text, offset, n = 5) {
    const t = norm(text);
    if (!t) return null;
    const words = [];
    const re = /\S+/g;
    let m;
    while ((m = re.exec(t))) words.push({ w: m[0], at: m.index });
    if (!words.length) return null;
    let i = words.findIndex((x) => x.at + x.w.length >= offset);
    if (i < 0) i = words.length - 1;
    let a = i, b = i;
    const ends = (k) => /[.!?:;]$/.test(words[k].w);
    while (b - a + 1 < n) {
      const grew = b - a;
      if (b + 1 < words.length && !ends(b)) b++;
      if (b - a + 1 < n && a > 0 && !ends(a - 1)) a--;
      if (b - a === grew) break;
    }
    return { quote: words.slice(a, b + 1).map((x) => x.w).join(" "), offset: words[a].at };
  }

  // ---- an edit: the smallest changed span, by words (`you changed "Q2" → "Q3"`)
  function diffWords(before, after) {
    const a = norm(before).split(" "), b = norm(after).split(" ");
    let p = 0;
    while (p < a.length && p < b.length && a[p] === b[p]) p++;
    let s = 0;
    while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
    return { before: a.slice(p, a.length - s).join(" "), after: b.slice(p, b.length - s).join(" "), at: a.slice(0, p).join(" ").length + (p ? 1 : 0) };
  }

  // ---- what happened to a note: the agent's outcome first, then where it sits
  function outcome(n) {
    if (n.status === "done") return { tag: "done", text: NW.done };
    if (n.status === "answered") return { tag: "answer", text: n.answer || "" };
    if (n.status === "sent") return { tag: n.version_seen && n.version_seen > n.version ? "open" : "sent", text: n.version_seen && n.version_seen > n.version ? NW.open : NW.sentTag };
    return { tag: "draft", text: "" };
  }

  // where a note sits, in the page's words, never a block id (ambient, m_4919 (2)): the quoted
  // words when there was a selection, else the block's name (its kicker or heading)
  const where = (n, name) => (n.quote ? `"${n.quote}"` : name || n.where || "");
  // a block's name from what it shows: its own heading or kicker (a heading, a callout's h3), else
  // the heading of its section (the heading block above it), else its first words
  function blockName(own, section, text) {
    const cut = (s, k) => { const w = norm(s).split(" ").filter(Boolean); return w.length > k ? `${w.slice(0, k).join(" ")}…` : w.join(" "); };
    return norm(own) ? cut(own, 8) : norm(section) ? cut(section, 8) : cut(text, 6);
  }

  // a note's one line in the side list
  function label(n) {
    if (n.kind === "edit") return NW.changed(n.before || "", n.after || "");
    if (NW.marks[n.kind]) return n.text ? `${NW.marks[n.kind]}: ${n.text}` : NW.marks[n.kind];
    if (n.kind === "pick") return NW.picked(n.option, n.text);
    if (n.kind === "draw") return n.text ? `${NW.drawing}: ${n.text}` : NW.drawing;
    return n.text || "";
  }

  // ---- the notes model: drafts are yours until `send`; the server's statuses win for the rest
  const STATUS = ["draft", "sent", "done", "answered"];
  // every note gets its own id here: the server numbers id-less notes n<max+1>, so a removed
  // draft's number could come back (ambient-lead, m_4805). `n` + time + random, base 36.
  const newId = (now) => `n${Math.floor(now || Date.now()).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  function model(init, opts) {
    let notes = (init || []).map((n) => ({ ...n }));
    const undo = [];          // edits and removals, newest last: {type, note}
    const idOf = (opts && opts.id) || newId;
    const api = {
      all: () => notes.slice(),
      // a voice note still listening is not a draft yet (not counted, not saved)
      drafts: () => notes.filter((n) => n.status === "draft" && !n.listening),
      listening: () => notes.find((n) => n.listening) || null,
      // a voice note at the mouse (§4.1): start pins it listening, heard fills it, end saves it as a
      // draft (empty words: it goes), cancel removes it; one at a time
      voiceStart(anchor, version, now) {
        api.voiceCancel();
        return api.add({ version, ...anchor, kind: "voice", text: "", listening: true }, now);
      },
      voiceHeard(text) {
        const v = api.listening();
        if (v) notes = notes.map((n) => (n === v ? { ...n, text: text || "" } : n));
        return api.listening();
      },
      voiceEnd(text, now) {
        const v = api.listening();
        if (!v) return null;
        const words = norm(text != null ? text : v.text);
        if (!words) { notes = notes.filter((n) => n !== v); return null; }
        const done = { ...v, text: words, at_ms: now || v.at_ms };
        delete done.listening;
        notes = notes.map((n) => (n === v ? done : n));
        return done;
      },
      voiceCancel() {
        const v = api.listening();
        if (v) notes = notes.filter((n) => n !== v);
        return v;
      },
      get: (id) => notes.find((n) => n.id === id) || null,
      nextId: (now) => { let id; do id = idOf(now); while (api.get(id)); return id; },
      add(n, now) {
        const note = { id: api.nextId(now), status: "draft", at_ms: now || 0, ...n };
        notes.push(note);
        if (note.kind === "edit") undo.push({ type: "add", note });
        return note;
      },
      update(id, patch) {
        notes = notes.map((n) => (n.id === id && n.status === "draft" ? { ...n, ...patch } : n));
        return api.get(id);
      },
      remove(id) {
        const n = api.get(id);
        if (!n || n.status !== "draft") return null;
        notes = notes.filter((x) => x.id !== id);
        undo.push({ type: "remove", note: n });
        return n;
      },
      // ⌘z: the last edit or removal; returns what to redo on the page
      undo() {
        const u = undo.pop();
        if (!u) return null;
        if (u.type === "add") notes = notes.filter((x) => x.id !== u.note.id);
        else notes.push(u.note);
        return u;
      },
      // an edit on a block already edited: one note per block, its before kept from the first
      edit(block, before, after, now) {
        const prev = notes.find((n) => n.status === "draft" && n.kind === "edit" && n.block === block);
        if (prev) {
          if (norm(prev.before) === norm(after)) { api.remove(prev.id); undo.pop(); return null; }
          return api.update(prev.id, { after, at_ms: now || prev.at_ms });
        }
        if (norm(before) === norm(after)) return null;
        return api.add({ kind: "edit", block, before, after }, now);
      },
      // a question's option picked on the page (kit.js's bise:pick): one pick per block, the
      // latest wins; picking the same option again takes it back
      pick(block, option, text, version, now) {
        const prev = notes.find((n) => n.status === "draft" && n.kind === "pick" && n.block === block);
        // option null: kit.js took the pick back
        if (option == null || (prev && String(prev.option) === String(option))) { if (prev) notes = notes.filter((x) => x !== prev); return null; }
        if (prev) return api.update(prev.id, { option, text, at_ms: now || prev.at_ms });
        return api.add({ version, block, kind: "pick", option, text }, now);
      },
      // a question answered elsewhere (the capsule, the TUI: §4.2): one card, one answer, so a
      // draft pick on that block goes
      answered(block) {
        const had = notes.some((n) => n.status === "draft" && n.kind === "pick" && n.block === block);
        notes = notes.filter((n) => !(n.status === "draft" && n.kind === "pick" && n.block === block));
        return had;
      },
      // the server's notes (meta, SSE): its statuses and answers win; drafts it doesn't know stay
      merge(server) {
        const by = Object.fromEntries((server || []).map((n) => [n.id, n]));
        notes = notes.map((n) => (by[n.id] && STATUS.indexOf(by[n.id].status) >= STATUS.indexOf(n.status) ? { ...n, ...by[n.id], anchor: n.anchor } : n));
        for (const s of server || []) if (!notes.some((n) => n.id === s.id)) notes.push({ ...s });
      },
      // sent: the drafts are now the agent's
      sent(now) { notes = notes.map((n) => (n.status === "draft" ? { ...n, status: "sent", sent_ms: now || 0 } : n)); undo.length = 0; },
      reanchor(blocks, version) { notes = reanchor(notes, blocks).map((n) => (n.status === "sent" ? { ...n, version_seen: version } : n)); },
      // what the server keeps: the drafts, without the page's own fields
      payload: () => ({ notes: api.drafts().map(({ anchor, version_seen, listening, ...n }) => n) }),
    };
    return api;
  }

  // ---- drawing (§5.4): strokes in the page's own coordinates (from #bise-page's top left, so
  // scrolling never moves them), one note per drawing: its path, its box, the blocks under it
  // one stroke as an SVG path: points closer than 1.5 px to the last kept one are dropped
  function strokePath(points) {
    const kept = [];
    for (const [x, y] of points || []) {
      const l = kept[kept.length - 1];
      if (!l || Math.hypot(x - l[0], y - l[1]) >= 1.5) kept.push([x, y]);
    }
    if (!kept.length) return "";
    const f = (v) => String(Math.round(v * 10) / 10);
    if (kept.length === 1) kept.push([kept[0][0] + 0.1, kept[0][1]]);   // a dot
    return kept.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join(" ");
  }
  // the box around every stroke
  function strokesBox(strokes) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of strokes || []) for (const [x, y] of s) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return x0 === Infinity ? null : { x: Math.round(x0), y: Math.round(y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0) };
  }
  // the blocks a box touches ({id: {x, y, w, h}}), top to bottom
  function blocksIn(box, rects) {
    if (!box) return [];
    return Object.entries(rects || {})
      .filter(([, r]) => r.x < box.x + box.w && box.x < r.x + r.w && r.y < box.y + box.h && box.y < r.y + r.h)
      .sort((a, b) => a[1].y - b[1].y || a[1].x - b[1].x)
      .map(([id]) => id);
  }

  const core = { NW, spaced, norm, locate, anchorOf, reanchor, diffWords, outcome, label, where, blockName, model, nearestQuote, strokePath, strokesBox, blocksIn };

  // ======================================================================================
  // the DOM: only on a page the shell served (#bise-page)
  // ======================================================================================

  // the text nodes of a block, and a Range for [start, end) of its normalized text
  function textNodes(el) {
    const out = [];
    const walk = (n) => {
      if (n.nodeType === 3) out.push(n);
      else if (n.nodeType === 1 && !(n.classList && n.classList.contains("bn-ui"))) for (const c of n.childNodes) walk(c);
    };
    walk(el);
    return out;
  }
  // normalized offset -> (node, offset): walk the raw text, counting collapsed whitespace once
  function rawPoints(el) {
    const pts = [];   // pts[i] = [node, offset] of the i-th normalized char
    let prevSpace = true;
    for (const node of textNodes(el)) {
      const s = node.nodeValue;
      for (let i = 0; i < s.length; i++) {
        const sp = /\s/.test(s[i]);
        if (sp && prevSpace) continue;
        pts.push([node, i]);
        prevSpace = sp;
      }
    }
    // the trailing space norm() trims
    while (pts.length && /\s/.test(pts[pts.length - 1][0].nodeValue[pts[pts.length - 1][1]])) pts.pop();
    return pts;
  }
  function rangeFor(doc, el, start, end) {
    const pts = rawPoints(el);
    if (!pts.length || start >= pts.length) return null;
    const r = doc.createRange();
    const a = pts[start], b = pts[Math.min(end, pts.length) - 1];
    r.setStart(a[0], a[1]);
    r.setEnd(b[0], b[1] + 1);
    return r;
  }
  // a selection inside one block -> {block, quote, offset}
  function fromSelection(sel, page) {
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const r = sel.getRangeAt(0);
    const start = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement;
    const block = start && start.closest("[data-kit][data-id]");
    if (!block || !page.contains(block) || !block.contains(r.endContainer)) return null;
    const quote = norm(sel.toString());
    if (!quote) return null;
    // the offset: the normalized text before the selection
    const pre = r.cloneRange();
    pre.selectNodeContents(block);
    pre.setEnd(r.startContainer, r.startOffset);
    const offset = norm(pre.toString()).length + (/\s$/.test(pre.toString()) && pre.toString().trim() ? 1 : 0);
    return { block: block.dataset.id, quote, offset };
  }

  function mount(doc) {
    const win = doc.defaultView;
    const page = doc.getElementById("bise-page");
    if (!page || page.dataset.biseNotes) return null;
    page.dataset.biseNotes = "on";
    const pageId = page.dataset.page;
    let version = +page.dataset.version || 1;
    const token = (doc.querySelector('meta[name="bise-token"]') || {}).content || "";
    const meta = { title: doc.title || spaced(pageId), agent: "" };
    const M = model([]);
    const now = () => Date.now();
    const el = (tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const blocks = () => [...page.querySelectorAll("[data-kit][data-id]")];
    const blockById = (id) => page.querySelector(`[data-kit][data-id="${CSS.escape(id)}"]`);
    const blockTexts = () => Object.fromEntries(blocks().map((b) => [b.dataset.id, norm(b.textContent)]));
    let state = "ready";

    // ---- the server
    const api = (path, body) => win.fetch(path, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json", "X-Bise-Token": token } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));
    let saveT = 0, saving = false, dirty = false;
    function save() {
      clearTimeout(saveT);
      saveT = win.setTimeout(async () => {
        if (saving) { dirty = true; return; }
        saving = true;
        try { await api(`/api/p/${pageId}/notes`, M.payload()); bar.classList.remove("bn-error"); }
        catch { bar.classList.add("bn-error"); barMsg(NW.failed); win.setTimeout(save, 3000); }
        saving = false;
        if (dirty) { dirty = false; save(); }
      }, 400);
    }

    // ---- the layer: the side list, the send bar, the toolbar, the composer, the pins
    const list = el("aside", "bn-ui bn-list");
    const listHead = el("div", "bn-head");
    const listBody = el("ol", "bn-items");
    const listKeys = el("div", "bn-keys", NW.keys);
    // the composer is the list's last row: a note you type never covers the page (QA m_4929: it
    // opened over the next block)
    const composer = el("form", "bn-composer");
    const composerWhere = el("div", "bn-where");
    const input = el("textarea", "bn-input");
    input.rows = 2; input.placeholder = NW.placeholder;
    composer.append(composerWhere, input);
    list.append(listHead, listBody, composer, listKeys);
    const bar = el("div", "bn-ui bn-bar");
    const barText = el("span", "bn-bar-text");
    const barSend = el("button", "bn-send", NW.send);
    barSend.type = "button";
    bar.append(barText, barSend);
    const tools = el("div", "bn-ui bn-tools");
    const pins = el("div", "bn-ui bn-pins");
    doc.body.append(list, bar, tools, pins);
    // a line whose leading ✎ or ✓ keeps its own color (the pen's, the olive's): ambient, m_4926, m_4919 (4)
    const glyphed = (tag, cls, text) => {
      const m = /^([✎✓])(\s.*)$/su.exec(text || "");
      if (!m) return el(tag, cls, text);
      const e = el(tag, cls);
      e.append(el("span", "bn-glyph", m[1]), m[2]);
      return e;
    };
    // a block's name, as the page shows it (never its id)
    const heads = "h1, h2, h3, h4";
    function nameOf(id) {
      const b = id && blockById(id);
      if (!b) return "";
      const own = b.querySelector(heads);
      let section = null;
      for (let p = b.previousElementSibling; p && !section; p = p.previousElementSibling) if (p.dataset && p.dataset.kit === "heading") section = p.querySelector(heads);
      const kit = b.dataset.kit;
      // a heading block is its own name; a callout's kicker is its first h2/h3; a table or a
      // prose block goes by its section
      return blockName(kit === "heading" || kit === "callout" ? own && own.textContent : "", section ? section.textContent : "", b.textContent);
    }
    const frameCount = () => doc.querySelector("[data-bise-notes-count]");
    const frameSend = () => doc.querySelector("[data-bise-send]");

    // ---- highlights: the CSS Custom Highlight API (no change to the agent's DOM)
    const HL = win.CSS && win.CSS.highlights && win.Highlight ? win.CSS.highlights : null;
    function paintHighlights() {
      if (!HL) return;
      const mine = new win.Highlight(), moved = new win.Highlight();
      for (const n of M.all()) {
        if (!n.quote || n.kind === "edit") continue;
        const b = blockById(n.block);
        const at = b && locate(b.textContent, n.quote, n.offset);
        const r = at && rangeFor(doc, b, at.start, at.end);
        if (r) (n.status === "draft" ? mine : moved).add(r);
      }
      HL.set("bise-note", mine);
      HL.set("bise-note-sent", moved);
    }

    // ---- the side list and the counts
    let barNote = "";
    function barMsg(s) { barNote = s; render(); }
    function render() {
      const all = M.all(), drafts = M.drafts().length;
      listHead.textContent = NW.listTitle(meta.title, all.length);
      listBody.replaceChildren(...all.map((n) => {
        const li = el("li", `bn-item bn-${n.status}${n.anchor === "moved" ? " bn-moved" : ""}`);
        li.dataset.note = n.id;
        li.append(el("div", "bn-where", where(n, nameOf(n.block))), glyphed("div", "bn-what", label(n)));
        const o = outcome(n);
        if (n.anchor === "moved") li.append(el("div", "bn-tag bn-tag-moved", NW.moved));
        else if (o.tag === "answer") {
          // the agent's answer is a reply, and the note stays open: its name dim, its words, then
          // a field for yours (ambient, m_4919 (3))
          const rep = el("div", "bn-reply");
          rep.append(el("span", "bn-reply-by", NW.replyBy(spaced(meta.agent || "main"))), el("span", "bn-reply-text", ` ${o.text}`));
          const field = el("input", "bn-reply-field");
          field.type = "text"; field.placeholder = NW.replyField; field.dataset.replyTo = n.id;
          li.append(rep, field);
        } else if (o.text) li.append(glyphed("div", `bn-tag bn-tag-${o.tag}`, o.text));
        if (n.status === "draft") {
          const x = el("button", "bn-x", "×");
          x.type = "button"; x.title = NW.remove; x.dataset.remove = n.id;
          li.append(x);
        }
        return li;
      }));
      if (!all.length) listBody.replaceChildren(el("li", "bn-empty", NW.empty));
      list.classList.toggle("bn-on", all.length > 0 || composer.classList.contains("bn-on"));
      const who = spaced(meta.agent || "main");
      barText.textContent = barNote || (state === "updating" ? NW.updating(who) : NW.sendBar(drafts, who));
      bar.classList.toggle("bn-on", drafts > 0 || !!barNote || state === "updating");
      barSend.disabled = drafts === 0 || state === "updating";
      // the frame's count: nothing at 0 (a lone 0 is a riddle), else `1 note` / `3 notes` (ambient, m_4868)
      const fc = frameCount(); if (fc) fc.textContent = NW.count(drafts);
      const fs = frameSend(); if (fs) fs.disabled = drafts === 0;
      renderPins();
      paintHighlights();
      for (const b of blocks()) b.classList.toggle("bn-has", M.all().some((n) => n.block === b.dataset.id && n.status === "draft"));
    }
    function renderPins() {
      pins.replaceChildren();
      const sx = win.scrollX, sy = win.scrollY;
      M.all().filter((n) => n.pin).forEach((n, i) => {
        const b = blockById(n.block);
        if (!b) return;
        const r = b.getBoundingClientRect();
        const p = el("div", `bn-pin bn-${n.status}${n.listening ? " bn-listening" : ""}`, String(i + 1));
        p.dataset.note = n.id;
        // CSSOM, not style= (the shell's CSP)
        const x = r.left + sx + n.pin.x * r.width, y = r.top + sy + n.pin.y * r.height;
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        pins.append(p);
        // a voice note while you talk: your words land beside its pin
        if (n.listening) {
          const bub = el("div", "bn-bubble");
          bub.append(el("div", "bn-by", NW.voiceBy), el("div", "bn-said", n.text || "…"));
          bub.style.left = `${x + 18}px`;
          bub.style.top = `${y - 8}px`;
          pins.append(bub);
        }
      });
    }

    // ---- the toolbar: over a selection, or over the block under the mouse
    // (QA m_4929: on a block too, not only on a selection, so ♡ ✗ ~ work on a whole block or row
    // and `edit` is reachable on prose)
    let target = null;   // {block, quote?, offset?, pin?}
    function showTools(t, rect) {
      target = t;
      const b = blockById(t.block);
      const prose = b && b.dataset.kit === "prose";
      const btn = (k, text) => { const e = el("button", "bn-tool", text); e.type = "button"; e.dataset.tool = k; return e; };
      tools.replaceChildren(btn("note", NW.tools.note), btn("keep", NW.tools.keep), btn("drop", NW.tools.drop), btn("unsure", NW.tools.unsure), ...(prose ? [btn("edit", NW.tools.edit)] : []));
      tools.style.left = `${rect.left + win.scrollX}px`;
      tools.style.top = `${rect.top + win.scrollY - 40}px`;
      tools.dataset.on = t.quote ? "selection" : "block";
      tools.classList.add("bn-on");
    }
    const hideTools = () => { tools.classList.remove("bn-on"); delete tools.dataset.on; };
    // the note you type: in the list's last row, under where it goes
    function compose(t) {
      target = t;
      hideTools();
      composerWhere.textContent = t.drawing ? NW.drawing : where(t, nameOf(t.block));
      composer.classList.add("bn-on");
      input.value = "";
      render();
      input.focus();
    }
    const closeComposer = () => { composer.classList.remove("bn-on"); input.blur(); render(); };
    function addNote(kind, text, extra) {
      if (!target) return;
      // words for a drawing just made: they go on its note
      if (target.drawing) { M.update(target.drawing, { text: text || undefined }); target = null; save(); render(); return; }
      M.add({ version, block: target.block, quote: target.quote, offset: target.offset, pin: target.pin, kind, text: text || undefined, where: nameOf(target.block) || undefined, ...extra }, now());
      barNote = "";
      save(); render();
    }

    const selecting = () => { const s = win.getSelection(); return !!(s && !s.isCollapsed && s.toString().trim()); };
    doc.addEventListener("mouseup", () => {
      win.setTimeout(() => {
        const s = fromSelection(win.getSelection(), page);
        if (!s) return;
        clearTimeout(hoverT);
        showTools(s, win.getSelection().getRangeAt(0).getBoundingClientRect());
      }, 0);
    });
    // on a block under the mouse, after a short rest; a selection's toolbar stays until it goes
    let hover = null, hoverT = 0;
    const busy = () => selecting() || drawing || pinning || editing || composer.classList.contains("bn-on") || tools.dataset.on === "selection";
    page.addEventListener("mouseover", (e) => {
      const b = e.target.closest && e.target.closest("[data-kit][data-id]");
      if (b === hover) return;
      hover = b;
      clearTimeout(hoverT);
      if (!b) return;
      hoverT = win.setTimeout(() => { if (hover === b && !busy()) showTools({ block: b.dataset.id }, b.getBoundingClientRect()); }, 250);
    });
    page.addEventListener("mouseleave", () => {
      hover = null; clearTimeout(hoverT);
      hoverT = win.setTimeout(() => { if (tools.dataset.on === "block" && !tools.matches(":hover")) hideTools(); }, 300);
    });
    tools.addEventListener("mouseleave", () => { if (tools.dataset.on === "block" && !hover) hideTools(); });
    doc.addEventListener("selectionchange", () => { if (tools.dataset.on === "selection" && !selecting()) hideTools(); });
    tools.addEventListener("mousedown", (e) => e.preventDefault());   // keep the selection
    tools.addEventListener("click", (e) => {
      const k = e.target.dataset && e.target.dataset.tool;
      if (!k || !target) return;
      const b = blockById(target.block);
      if (k === "note") return compose(target);
      if (k === "edit") { hideTools(); return startEdit(b); }
      addNote(k);
      hideTools();
      win.getSelection().removeAllRanges();
    });
    // your reply to the agent's answer: a note on the same place, kept as a draft until send
    list.addEventListener("keydown", (e) => {
      const f = e.target;
      if (!f.dataset || !f.dataset.replyTo) return;
      e.stopPropagation();
      if (e.key === "Escape") { f.value = ""; f.blur(); return; }
      if (e.key !== "Enter" || e.metaKey) return;
      e.preventDefault();
      const n = M.get(f.dataset.replyTo), text = f.value.trim();
      if (!n || !text) return;
      target = { block: n.block, quote: n.quote, offset: n.offset, pin: n.pin };
      addNote("note", text, { reply_to: n.id });
      target = null;
    });
    composer.addEventListener("submit", (e) => { e.preventDefault(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.metaKey) { e.preventDefault(); if (input.value.trim()) addNote(target && target.pin ? "pin" : "note", input.value.trim()); closeComposer(); }
      else if (e.key === "Escape") { e.preventDefault(); closeComposer(); }
      e.stopPropagation();
    });

    // ---- pin mode: p, then a click on a block places it
    let pinning = false;
    page.addEventListener("click", (e) => {
      if (!pinning) return;
      const b = e.target.closest("[data-kit][data-id]");
      if (!b) return;
      e.preventDefault();
      pinning = false; doc.documentElement.classList.remove("bn-pinning");
      const r = b.getBoundingClientRect();
      compose({ block: b.dataset.id, pin: { x: +((e.clientX - r.left) / r.width).toFixed(3), y: +((e.clientY - r.top) / r.height).toFixed(3) } });
    }, true);

    // ---- edit in place (prose only): the block becomes editable; leaving it makes the note
    const originals = {};   // block id -> its HTML before your first edit (undo)
    let editing = null;
    function startEdit(b) {
      if (!b || b.dataset.kit !== "prose") return;
      if (!(b.dataset.id in originals)) originals[b.dataset.id] = { html: b.innerHTML, text: norm(b.textContent) };
      editing = { block: b, before: norm(b.textContent) };
      b.contentEditable = "true";
      b.classList.add("bn-editing");
      b.focus();
    }
    function endEdit() {
      if (!editing) return;
      const b = editing.block;
      b.contentEditable = "false";
      b.classList.remove("bn-editing");
      const first = originals[b.dataset.id].text, after = norm(b.textContent);
      const d = diffWords(first, after);
      M.edit(b.dataset.id, d.before, d.after, now());
      b.classList.toggle("bn-edited", norm(first) !== after);
      editing = null;
      save(); render();
    }
    page.addEventListener("focusout", (e) => { if (editing && e.target === editing.block) endEdit(); });
    page.addEventListener("keydown", (e) => {
      if (editing && e.key === "Escape") { e.preventDefault(); editing.block.blur(); }
    });

    // ---- keys: t type · p pin · ⌘z undo · ⌘⏎ send
    doc.addEventListener("keydown", (e) => {
      if (e.target === input || (editing && e.target === editing.block && !(e.metaKey && e.key === "Enter"))) return;
      if (e.metaKey && e.key === "Enter") { e.preventDefault(); if (editing) editing.block.blur(); return send(); }
      if (e.metaKey && e.key === "z" && !e.shiftKey) {
        const u = M.undo();
        if (!u) return;
        e.preventDefault();
        // an edit undone: the block's text as it was
        if (u.note.kind === "edit") {
          const b = blockById(u.note.block), o = originals[u.note.block];
          if (u.type === "add" && b && o) { b.innerHTML = o.html; b.classList.remove("bn-edited"); delete originals[u.note.block]; }
        }
        save(); render();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "t" && hover) { e.preventDefault(); compose({ block: hover.dataset.id }); }
      else if (e.key === "p") { e.preventDefault(); pinning = !pinning; doc.documentElement.classList.toggle("bn-pinning", pinning); }
      else if (e.key === "d") { e.preventDefault(); drawing ? stopDraw() : startDraw(); }
      else if (e.key === "Escape") { hideTools(); pinning = false; doc.documentElement.classList.remove("bn-pinning"); if (drawing) stopDraw(); }
    });

    // ---- the list's clicks: go to the note, remove a draft
    list.addEventListener("click", (e) => {
      const x = e.target.dataset && e.target.dataset.remove;
      if (x) { M.remove(x); save(); render(); return; }
      const li = e.target.closest(".bn-item");
      const n = li && M.get(li.dataset.note);
      const b = n && blockById(n.block);
      if (b) b.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // ---- send: the button, the frame's button, ⌘⏎
    async function send() {
      if (!M.drafts().length || state === "updating") return;
      clearTimeout(saveT);
      try {
        await api(`/api/p/${pageId}/notes`, M.payload());
        await api(`/api/p/${pageId}/send`, {});
        M.sent(now());
        barNote = NW.sent(spaced(meta.agent || "main"));
        state = "updating";
        render();
        win.setTimeout(() => { barNote = ""; render(); }, 4000);
      } catch { barMsg(NW.failed); }
    }
    barSend.addEventListener("click", send);
    doc.addEventListener("click", (e) => { if (e.target.closest && e.target.closest("[data-bise-send]")) send(); });

    // ---- kit.js's events: a new version swapped in, the notes' outcomes, the page's state
    doc.addEventListener("bise:swapped", (e) => {
      version = (e.detail && e.detail.version) || +page.dataset.version || version;
      for (const id of Object.keys(originals)) delete originals[id];   // the new text is the agent's
      M.reanchor(blockTexts(), version);
      render();
    });
    doc.addEventListener("bise:notes", (e) => { M.merge((e.detail && e.detail.notes) || []); M.reanchor(blockTexts(), version); render(); });
    // ---- a voice note at the mouse (§4.1): fn held on this page; the core's words arrive as
    // kit.js's bise:voice {phase, text}; the pin goes where the mouse last was over a block
    let mouse = null;
    doc.addEventListener("mousemove", (e) => { mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });
    function anchorAt(pt) {
      let b = pt && doc.elementFromPoint(pt.x, pt.y);
      b = b && b.closest && b.closest("[data-kit][data-id]");
      if (!b || !page.contains(b)) {
        // no block under the mouse: the block nearest the middle of the window
        const mid = win.innerHeight / 2;
        b = blocks().reduce((best, x) => { const r = x.getBoundingClientRect(), d = Math.abs((r.top + r.bottom) / 2 - mid); return !best || d < best.d ? { x, d } : best; }, null);
        b = b && b.x;
        pt = null;
      }
      if (!b) return null;
      const r = b.getBoundingClientRect();
      const at = { block: b.dataset.id, pin: pt ? { x: +((pt.x - r.left) / r.width).toFixed(3), y: +((pt.y - r.top) / r.height).toFixed(3) } : { x: 0, y: 0 } };
      // the nearest words: the text before the caret under the mouse
      const caret = pt && (doc.caretRangeFromPoint ? doc.caretRangeFromPoint(pt.x, pt.y) : doc.caretPositionFromPoint && (() => { const p = doc.caretPositionFromPoint(pt.x, pt.y); if (!p) return null; const r2 = doc.createRange(); r2.setStart(p.offsetNode, p.offset); return r2; })());
      let offset = 0;
      if (caret && b.contains(caret.startContainer)) {
        const pre = doc.createRange();
        pre.selectNodeContents(b);
        pre.setEnd(caret.startContainer, caret.startOffset);
        offset = norm(pre.toString()).length;
      }
      const q = nearestQuote(b.textContent, offset);
      if (q) { at.quote = q.quote; at.offset = q.offset; }
      return at;
    }
    doc.addEventListener("bise:voice", (e) => {
      const d = e.detail || {};
      if (d.phase === "start") { const at = anchorAt(mouse); if (at) M.voiceStart(at, version, now()); }
      else if (d.phase === "heard") M.voiceHeard(d.text);
      else if (d.phase === "end") { if (M.voiceEnd(d.text, now())) save(); }
      else if (d.phase === "cancel") M.voiceCancel();
      else if (d.phase === "send") { M.voiceCancel(); return send(); }
      render();
    });

    // a question answered in the capsule or the TUI: kit.js's question shows the answer; a draft
    // pick of ours on it goes (one card, one answer)
    doc.addEventListener("bise:answered", (e) => {
      if (M.answered((e.detail || {}).block)) { save(); render(); }
    });

    // a question's option picked (kit.js marks it on the page; the note is ours)
    doc.addEventListener("bise:pick", (e) => {
      const d = e.detail || {};
      if (!d.block) return;
      M.pick(d.block, d.option, d.text, version, now());
      barNote = ""; save(); render();
    });
    doc.addEventListener("bise:state", (e) => { state = (e.detail && e.detail.state) || "ready"; render(); });
    win.addEventListener("resize", renderPins);

    // ---- drawing (§5.4): d, draw with the mouse or the pen, d or esc again: one drawing note
    // (its path in the page's coordinates, its box, the blocks under it) and the PNG of that area
    // the page draws itself with a canvas, sent with the note
    const SVGNS = "http://www.w3.org/2000/svg";
    const ink = doc.createElementNS(SVGNS, "svg");
    ink.setAttribute("class", "bn-ui bn-ink");
    const pad = el("div", "bn-ui bn-drawpad");
    const hint = el("div", "bn-ui bn-drawhint", NW.drawHint);
    doc.body.append(ink, pad, hint);
    let drawing = null;   // {strokes: [[[x, y]...]], live: [[x, y]...] | null}
    const pageXY = (e) => { const r = page.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    function placeInk() {
      // the ink layer covers the page, in the page's coordinates (CSSOM, not style=)
      const r = page.getBoundingClientRect();
      ink.style.left = `${r.left + win.scrollX}px`; ink.style.top = `${r.top + win.scrollY}px`;
      ink.setAttribute("width", Math.ceil(r.width)); ink.setAttribute("height", Math.ceil(r.height));
    }
    function renderInk() {
      placeInk();
      const paths = [];
      for (const n of M.all()) if (n.kind === "draw" && n.path) paths.push([n.path, `bn-stroke bn-${n.status}`]);
      if (drawing) for (const s of [...drawing.strokes, drawing.live || []]) if (s.length) paths.push([strokePath(s), "bn-stroke bn-live"]);
      ink.replaceChildren(...paths.map(([d, cls]) => { const p = doc.createElementNS(SVGNS, "path"); p.setAttribute("d", d); p.setAttribute("class", cls); return p; }));
    }
    function startDraw() {
      hideTools(); closeComposer();
      drawing = { strokes: [], live: null };
      doc.documentElement.classList.add("bn-drawing");
    }
    pad.addEventListener("pointerdown", (e) => {
      if (!drawing) return;
      pad.setPointerCapture(e.pointerId);
      drawing.live = [pageXY(e)];
    });
    pad.addEventListener("pointermove", (e) => {
      if (!drawing || !drawing.live) return;
      for (const c of e.getCoalescedEvents ? e.getCoalescedEvents() : [e]) drawing.live.push(pageXY(c));
      renderInk();
    });
    const endStroke = () => { if (drawing && drawing.live) { if (drawing.live.length) drawing.strokes.push(drawing.live); drawing.live = null; renderInk(); } };
    pad.addEventListener("pointerup", endStroke);
    pad.addEventListener("pointercancel", endStroke);
    function stopDraw() {
      endStroke();
      const d = drawing;
      drawing = null;
      doc.documentElement.classList.remove("bn-drawing");
      if (!d || !d.strokes.length) return renderInk();
      const box = strokesBox(d.strokes);
      const pr = page.getBoundingClientRect();
      const rects = Object.fromEntries(blocks().map((b) => { const r = b.getBoundingClientRect(); return [b.dataset.id, { x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height }]; }));
      const under = blocksIn(box, rects);
      const note = M.add({ version, kind: "draw", block: under[0], blocks: under, box, path: d.strokes.map(strokePath).join(" ") }, now());
      save(); render(); renderInk();
      // words for it, if you want (Enter keeps them, Esc keeps the drawing alone)
      target = { block: under[0], drawing: note.id };
      compose(target);
      areaPng(box, note.path).then((png) => { if (png && M.get(note.id)) { M.update(note.id, { png }); save(); } });
    }
    // the area as the page shows it, with the drawing on top: the page's HTML and CSS in an SVG
    // foreignObject drawn on a canvas; where the browser won't let a canvas read that back, the
    // strokes alone on the page's paper
    async function areaPng(box, path) {
      const m = 16, w = Math.max(1, Math.min(1600, box.w + 2 * m)), h = Math.max(1, Math.min(1600, box.h + 2 * m));
      const x0 = box.x - m, y0 = box.y - m;
      const cv = doc.createElement("canvas");
      cv.width = w; cv.height = h;
      const g = cv.getContext("2d");
      const paper = win.getComputedStyle(doc.body).backgroundColor || "#fff";
      const strokes = () => {
        g.save(); g.translate(-x0, -y0);
        g.strokeStyle = win.getComputedStyle(doc.documentElement).getPropertyValue("--pen").trim() || "#c8264a";
        g.lineWidth = 3; g.lineCap = "round"; g.lineJoin = "round";
        g.stroke(new win.Path2D(path));
        g.restore();
      };
      try {
        let css = "";
        for (const s of doc.styleSheets) { try { for (const r of s.cssRules) css += r.cssText + "\n"; } catch {} }
        const clone = page.cloneNode(true);
        const pw = page.getBoundingClientRect().width;
        const xhtml = new win.XMLSerializer().serializeToString(clone);
        const svg = `<svg xmlns="${SVGNS}" width="${w}" height="${h}"><style>${css.replace(/</g, "\\3c ")}</style>` +
          `<rect width="100%" height="100%" fill="${paper}"/><foreignObject x="${-x0}" y="${-y0}" width="${pw}" height="${y0 + h + 10}">` +
          `<div xmlns="http://www.w3.org/1999/xhtml" class="${doc.body.className}">${xhtml}</div></foreignObject></svg>`;
        const img = new win.Image();
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        await img.decode();
        g.drawImage(img, 0, 0);
        strokes();
        return cv.toDataURL("image/png");
      } catch {
        g.clearRect(0, 0, w, h);
        g.fillStyle = paper; g.fillRect(0, 0, w, h);
        strokes();
        try { return cv.toDataURL("image/png"); } catch { return null; }
      }
    }
    const _render = render;
    render = function () { _render(); renderInk(); };
    win.addEventListener("resize", renderInk);
    renderInk();

    // ---- the drafts and the outcomes already on the server
    api(`/p/${pageId}/meta`).then((r) => {
      // flat {id, title, agent, state, versions, url, notes} (amb-core, ecb6ff9); {meta, notes} read too
      const m = r.meta || r || {};
      meta.title = m.title || meta.title; meta.agent = m.agent || ""; state = m.state || state;
      M.merge(r.notes || m.notes || []);
      M.reanchor(blockTexts(), version);
      // your edits in place, back on the page after a reload
      for (const n of M.drafts().filter((x) => x.kind === "edit")) reapplyEdit(n);
      render();
    }).catch(() => render());
    function reapplyEdit(n) {
      const b = blockById(n.block);
      if (!b || !n.before) return;
      for (const t of textNodes(b)) {
        const i = t.nodeValue.indexOf(n.before);
        if (i >= 0) {
          originals[n.block] = { html: b.innerHTML, text: norm(b.textContent) };
          t.nodeValue = t.nodeValue.slice(0, i) + n.after + t.nodeValue.slice(i + n.before.length);
          b.classList.add("bn-edited");
          return;
        }
      }
    }
    render();
    return { model: M, render };
  }

  root.BiseNotes = { core, mount, rangeFor, rawPoints, fromSelection };
  if (root.document && root.document.getElementById) {
    // the page's layer, kept for a look from the console (BiseNotes.live.model.all())
    const go = () => { root.BiseNotes.live = mount(root.document); };
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", go); else go();
  }
})(typeof window !== "undefined" ? window : globalThis);
