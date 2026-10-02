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
    sent: (agent) => `sent. ${agent} is on it.`,
    updating: (agent) => `${agent} is updating this page…`,
    moved: "moved",
    done: "✓ done",
    open: "open",
    sentTag: "sent",
    changed: (before, after) => `you changed "${before}" → "${after}"`,
    marks: { keep: "♡ keep", drop: "✗ drop", unsure: "~ not sure" },
    // a question's option you picked (ambient, m_4795)
    picked: (option, text) => (text ? `you picked ${option}: ${text}` : `you picked ${option}`),
    tools: { note: "note", keep: "♡", drop: "✗", unsure: "~", edit: "edit", pin: "pin" },
    placeholder: "your note",
    // signed off by ambient (m_4786): 'block' is our word, not hers; keys like the TUI's key bar
    empty: "no notes yet. select some text, or hold fn and talk.",
    keys: "t type   p pin   ⌘z undo   ⌘⏎ send",
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

  // a note's one line in the side list
  function label(n) {
    if (n.kind === "edit") return NW.changed(n.before || "", n.after || "");
    if (NW.marks[n.kind]) return n.text ? `${NW.marks[n.kind]}: ${n.text}` : NW.marks[n.kind];
    if (n.kind === "pick") return NW.picked(n.option, n.text);
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
      drafts: () => notes.filter((n) => n.status === "draft"),
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
        if (prev && String(prev.option) === String(option)) { notes = notes.filter((x) => x !== prev); return null; }
        if (prev) return api.update(prev.id, { option, text, at_ms: now || prev.at_ms });
        return api.add({ version, block, kind: "pick", option, text }, now);
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
      payload: () => ({ notes: api.drafts().map(({ anchor, version_seen, ...n }) => n) }),
    };
    return api;
  }

  const core = { NW, spaced, norm, locate, anchorOf, reanchor, diffWords, outcome, label, model };

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
    list.append(listHead, listBody, listKeys);
    const bar = el("div", "bn-ui bn-bar");
    const barText = el("span", "bn-bar-text");
    const barSend = el("button", "bn-send", NW.send);
    barSend.type = "button";
    bar.append(barText, barSend);
    const tools = el("div", "bn-ui bn-tools");
    const composer = el("form", "bn-ui bn-composer");
    const input = el("textarea", "bn-input");
    input.rows = 2; input.placeholder = NW.placeholder;
    composer.append(input);
    const pins = el("div", "bn-ui bn-pins");
    doc.body.append(list, bar, tools, composer, pins);
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
        const where = el("div", "bn-where", n.quote ? `"${n.quote}"` : n.block ? n.block : "");
        const what = el("div", "bn-what", label(n));
        li.append(where, what);
        const o = outcome(n);
        const tag = n.anchor === "moved" ? NW.moved : o.text;
        if (tag) li.append(el("div", `bn-tag bn-tag-${n.anchor === "moved" ? "moved" : o.tag}`, tag));
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
      const fc = frameCount(); if (fc) fc.textContent = String(drafts);
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
        const p = el("div", `bn-pin bn-${n.status}`, String(i + 1));
        p.dataset.note = n.id;
        // CSSOM, not style= (the shell's CSP)
        p.style.left = `${r.left + sx + n.pin.x * r.width}px`;
        p.style.top = `${r.top + sy + n.pin.y * r.height}px`;
        pins.append(p);
      });
    }

    // ---- the toolbar: over a selection, or over the block under the mouse
    let target = null;   // {block, quote?, offset?, pin?}
    function showTools(t, rect) {
      target = t;
      const b = blockById(t.block);
      const prose = b && b.dataset.kit === "prose";
      const btn = (k, text) => { const e = el("button", "bn-tool", text); e.type = "button"; e.dataset.tool = k; return e; };
      tools.replaceChildren(btn("note", NW.tools.note), btn("keep", NW.tools.keep), btn("drop", NW.tools.drop), btn("unsure", NW.tools.unsure), ...(prose && !t.quote ? [btn("edit", NW.tools.edit)] : []));
      tools.style.left = `${rect.left + win.scrollX}px`;
      tools.style.top = `${rect.top + win.scrollY - 40}px`;
      tools.classList.add("bn-on");
    }
    const hideTools = () => { tools.classList.remove("bn-on"); };
    function compose(t, rect) {
      target = t;
      hideTools();
      composer.style.left = `${rect.left + win.scrollX}px`;
      composer.style.top = `${rect.bottom + win.scrollY + 8}px`;
      composer.classList.add("bn-on");
      input.value = ""; input.focus();
      render();
    }
    const closeComposer = () => { composer.classList.remove("bn-on"); input.blur(); render(); };
    function addNote(kind, text) {
      if (!target) return;
      M.add({ version, block: target.block, quote: target.quote, offset: target.offset, pin: target.pin, kind, text: text || undefined }, now());
      barNote = "";
      save(); render();
    }

    doc.addEventListener("mouseup", () => {
      win.setTimeout(() => {
        const s = fromSelection(win.getSelection(), page);
        if (!s) return;
        showTools(s, win.getSelection().getRangeAt(0).getBoundingClientRect());
      }, 0);
    });
    let hover = null;
    page.addEventListener("mouseover", (e) => { hover = e.target.closest && e.target.closest("[data-kit][data-id]"); });
    tools.addEventListener("mousedown", (e) => e.preventDefault());   // keep the selection
    tools.addEventListener("click", (e) => {
      const k = e.target.dataset && e.target.dataset.tool;
      if (!k || !target) return;
      const b = blockById(target.block);
      if (k === "note") return compose(target, b.getBoundingClientRect());
      if (k === "edit") { hideTools(); return startEdit(b); }
      addNote(k);
      hideTools();
      win.getSelection().removeAllRanges();
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
      compose({ block: b.dataset.id, pin: { x: +((e.clientX - r.left) / r.width).toFixed(3), y: +((e.clientY - r.top) / r.height).toFixed(3) } }, { left: e.clientX, bottom: e.clientY, top: e.clientY });
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
      if (e.key === "t" && hover) { e.preventDefault(); compose({ block: hover.dataset.id }, hover.getBoundingClientRect()); }
      else if (e.key === "p") { e.preventDefault(); pinning = !pinning; doc.documentElement.classList.toggle("bn-pinning", pinning); }
      else if (e.key === "Escape") { hideTools(); pinning = false; doc.documentElement.classList.remove("bn-pinning"); }
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
    // a question's option picked (kit.js marks it on the page; the note is ours)
    doc.addEventListener("bise:pick", (e) => {
      const d = e.detail || {};
      if (!d.block) return;
      M.pick(d.block, d.option, d.text, version, now());
      barNote = ""; save(); render();
    });
    doc.addEventListener("bise:state", (e) => { state = (e.detail && e.detail.state) || "ready"; render(); });
    win.addEventListener("resize", renderPins);

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
    const go = () => mount(root.document);
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", go); else go();
  }
})(typeof window !== "undefined" ? window : globalThis);
