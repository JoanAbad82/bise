// bise ambient · the capsule on screen: the bridge to the app, the DOM, the animation frame.
// The app calls window.ambient.recv(ev) for every core and app_* event; the page posts its cmds
// to window.webkit.messageHandlers.bise (in a browser: to window.ambientDev, the fake core).
// Everything that decides lives in model.js; this file only draws what view() says.
(function () {
  "use strict";
  const { AmbModel: M, AmbOrb } = window;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const native = () => !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.bise);
  if (native() || window.ambientApp) document.documentElement.classList.add("app");

  // ---- the DOM, once
  const host = $("#amb") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "amb" }));
  host.classList.add("amb");
  host.innerHTML = `
    <div class="cap small" id="cap">
      <div class="orbbox"><canvas class="orb-gl"></canvas><canvas class="orb-still"></canvas></div>
      <div class="tx">
        <div class="lab"></div>
        <div class="line"></div>
        <div class="words"></div>
        <div class="sub"></div>
        <div class="sees"></div>
        <div class="chips"></div>
        <div class="rows"></div>
        <div class="spot"><input type="text" spellcheck="false" autocomplete="off"><div class="keys">⏎ send to main · esc</div></div>
        <div class="perm"><p></p><button type="button"></button></div>
      </div>
    </div>
    <div class="note" id="note"></div>`;
  const cap = $("#cap", host), note = $("#note", host), tx = $(".tx", cap);
  const el = { lab: $(".lab", tx), line: $(".line", tx), words: $(".words", tx), sub: $(".sub", tx), sees: $(".sees", tx), chips: $(".chips", tx), rows: $(".rows", tx), spot: $(".spot", tx), perm: $(".perm", tx) };
  const input = $("input", el.spot);
  const orb = AmbOrb.create($(".orb-gl", cap), $(".orb-still", cap));

  // ---- the model and the bridge
  let model = M.init();
  const now = () => performance.now();

  function post(cmd) {
    if (cmd.delay) { const { delay, ...rest } = cmd; setTimeout(() => post(rest), delay); return; }
    try {
      if (native()) window.webkit.messageHandlers.bise.postMessage(cmd);
      else if (window.ambientDev && window.ambientDev.cmd) window.ambientDev.cmd(cmd);
    } catch (e) { console.error("post", e); }
  }
  function recv(ev) {
    if (typeof ev === "string") { try { ev = JSON.parse(ev); } catch { return; } }
    const r = M.step(model, ev, now());
    model = r.m;
    for (const c of r.cmds) post(c);
    schedule();
  }

  // ---- drawing: each part redrawn only when its own content changed
  const last = {};
  function put(part, key, fn) {
    if (last[part] === key) return false;
    last[part] = key; fn(); return true;
  }
  const show = (node, on) => node.classList.toggle("on", !!on);

  // words that land one by one: keep the spans that are the same, light the ones said
  function words(node, w, main) {
    node.classList.toggle("main", !!main);
    const kids = node.children;
    let same = 0;
    while (same < kids.length && same < w.list.length && kids[same].dataset.w === w.list[same]) same++;
    while (kids.length > same) node.removeChild(node.lastChild);
    for (let i = same; i < w.list.length; i++) {
      const s = document.createElement("span");
      s.className = "w"; s.dataset.w = w.list[i]; s.textContent = w.list[i];
      if (i > 0 || node.childNodes.length) node.appendChild(document.createTextNode(" "));
      node.appendChild(s);
    }
    const spans = node.querySelectorAll(".w");
    // the new words need one frame unlit, then their fade starts
    requestAnimationFrame(() => spans.forEach((s, i) => {
      s.classList.toggle("on", i < w.lit);
      s.classList.toggle("cur", i === w.lit - 1 && w.lit < w.list.length);
    }));
  }

  function render(v) {
    host.classList.toggle("still", !!v.still);
    host.style.display = v.hidden ? "none" : "";
    cap.classList.toggle("small", v.size === "small");
    cap.classList.toggle("open", v.size === "open");
    cap.dataset.state = v.state;

    put("lab", JSON.stringify(v.label), () => {
      show(el.lab, v.label);
      const L = v.label;
      el.lab.innerHTML = L ? (L.acc ? `<b>${esc(L.text)}</b>` : esc(L.text)) + (L.rest ? ` · ${esc(L.rest)}` : "") : "";
    });
    put("line", JSON.stringify([v.glyph, v.text]), () => {
      show(el.line, v.text != null);
      const fail = v.glyph === "▲";
      el.line.innerHTML = v.text == null ? "" : `${v.glyph ? `<span class="gl${fail ? " fail" : ""}">${esc(v.glyph)}</span>` : ""}${esc(v.text)}`;
      el.line.classList.remove("arrive"); void el.line.offsetWidth; el.line.classList.add("arrive");
    });
    put("words", JSON.stringify(v.words && [v.state === "listening", v.words.list, v.words.lit]), () => {
      show(el.words, v.words);
      if (v.words) words(el.words, v.words, v.state !== "listening");
      else el.words.textContent = "";
    });
    put("sub", v.sub || "", () => { show(el.sub, v.sub); el.sub.textContent = v.sub || ""; });
    put("sees", v.sees || "", () => { show(el.sees, v.sees); el.sees.textContent = v.sees || ""; });
    put("chips", v.chips.join(","), () => {
      show(el.chips, v.chips.length);
      const have = new Set([...el.chips.children].map((c) => c.dataset.n));
      [...el.chips.children].forEach((c) => { if (!v.chips.includes(c.dataset.n)) c.remove(); });
      for (const n of v.chips) if (!have.has(n)) el.chips.insertAdjacentHTML("beforeend", `<span class="chip" data-n="${esc(n)}"><b>∿</b>${esc(n)}</span>`);
    });
    put("rows", JSON.stringify([v.list, v.inbox]), () => {
      show(el.rows, v.list || v.inbox);
      if (v.list) {
        el.rows.innerHTML = v.list.map((r, i) => `<div class="row ${esc(r.kind)}" style="animation-delay:${i * 0.06}s"><span class="gl">${esc(r.glyph)}</span><span class="nm">${esc(r.name)}</span><span class="wh">${esc(r.what)}</span><span class="ag">${esc(r.age)}</span></div>`).join("");
      } else if (v.inbox) {
        el.rows.innerHTML = v.inbox.map((q, i) => `<div class="q${q.sel ? " sel" : ""}" style="animation-delay:${i * 0.06}s"><div class="who">? ${esc(q.agent)}</div><div class="tq">${esc(q.text)}</div>${opts(q)}</div>`).join("");
      } else el.rows.innerHTML = "";
    });
    put("spot", v.spot ? "on" : "", () => {
      show(el.spot, v.spot);
      if (v.spot) { input.value = v.spot.text; input.placeholder = v.spot.hint; setTimeout(() => input.focus(), 0); }
      else input.blur();
    });
    put("perm", JSON.stringify(v.perm), () => {
      show(el.perm, v.perm);
      if (v.perm) { $("p", el.perm).textContent = v.perm.text; const b = $("button", el.perm); b.textContent = v.perm.button; b.dataset.perm = v.perm.perm; }
    });
    put("note", JSON.stringify(v.note), () => {
      note.classList.toggle("on", !!v.note);
      if (!v.note) { note.innerHTML = ""; return; }
      const n = v.note;
      note.innerHTML = `<div class="h"><span class="app">:*</span>bise${n.more > 0 ? `<span class="more">+${n.more}</span>` : ""}</div>
        <div class="ttl"><span class="gl">?</span>${esc(n.title)}</div><div class="qq">${esc(n.text)}</div>${opts(n)}<div class="hint">${esc(n.hint)}</div>`;
    });
  }
  const opts = (c) => c.options.length ? `<div class="opts">${c.options.map((o) => `<button type="button" data-card="${esc(c.id)}" data-i="${o.i}">${esc(o.label)}</button>`).join("")}</div>` : "";

  // ---- the capsule's size: its height follows the words; the panel follows the capsule (app_size)
  const MIN_H = { small: 84, open: 120 };
  const PAD = 24, NOTE_GAP = 12;
  function layout(v) {
    const maxH = Math.round((window.screen && screen.availHeight ? screen.availHeight : 900) * 0.7);
    const want = Math.max(MIN_H[v.size], Math.ceil(tx.scrollHeight) + PAD);
    const h = Math.min(want, maxH);
    tx.style.maxHeight = want > maxH ? `${maxH - PAD}px` : "";
    tx.style.overflowY = want > maxH ? "auto" : "";
    tx.classList.toggle("scroll", want > maxH);
    if (cap.style.height !== h + "px") cap.style.height = h + "px";
  }
  let sent = "";
  function size() {
    const r = cap.getBoundingClientRect();
    const radius = parseFloat(getComputedStyle(cap).borderTopLeftRadius) || 0;
    note.style.width = r.width + "px";
    note.style.top = r.height + NOTE_GAP + "px";
    const msg = { cmd: "app_size", w: Math.round(r.width), h: Math.round(r.height), radius: Math.round(radius) };
    if (note.classList.contains("on")) {
      const n = note.getBoundingClientRect();
      msg.note = { y: Math.round(n.top - r.top), h: Math.round(n.height), radius: 22 };
    }
    const key = JSON.stringify(msg);
    if (key !== sent) { sent = key; post(msg); }
  }

  // ---- the frame loop: runs while something moves, sleeps when the capsule is settled
  let raf = 0, lastV = null;
  const fps = { frames: 0, since: now(), value: 0, drew: 0 };
  function schedule() { if (!raf) raf = requestAnimationFrame(frame); }
  function frame() {
    raf = 0;
    const t = now();
    const v = M.view(model, t);
    lastV = v;
    render(v);
    layout(v);
    size();
    let drew = false;
    if (!v.hidden) drew = orb.frame({ pose: v.pose, poseMs: v.poseMs, lvl: v.lvl, need: v.need, still: v.still, frozen: v.frozen }, t);
    fps.frames++; if (drew) fps.drew++;
    if (t - fps.since > 1000) { fps.value = Math.round((fps.frames * 1000) / (t - fps.since)); fps.frames = 0; fps.drew = 0; fps.since = t; }
    // keep going: the orb wakes for the blink and the springs; a settled, hidden capsule idles at 4 Hz
    if (v.hidden) setTimeout(schedule, 250); else schedule();
  }

  // ---- input: clicks, the spotlight field, plain keys inside the panel
  cap.addEventListener("click", (e) => {
    if (e.target.closest("button, input, .opts")) return;
    if (cap.classList.contains("small")) recv({ ev: "ui_capsule" });
  });
  host.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-card]");
    if (b) recv({ ev: "ui_option", card: b.dataset.card, i: +b.dataset.i });
    const p = e.target.closest(".perm button");
    if (p) recv({ ev: "ui_perm", perm: p.dataset.perm, do: "continue" });
  });
  input.addEventListener("input", () => recv({ ev: "ui_spot_type", text: input.value }));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); recv({ ev: "ui_spot_send", text: input.value }); }
    else if (e.key === "Escape") { e.preventDefault(); recv({ ev: "ui_close" }); }
    e.stopPropagation();
  });
  document.addEventListener("keydown", (e) => {
    if (e.target === input || e.metaKey || e.ctrlKey) return;
    const k = { Escape: "esc", ArrowUp: "up", ArrowDown: "down" }[e.key] || (/^[1-9l]$/.test(e.key) ? e.key : null);
    if (k && (model.pane || k === "esc")) { e.preventDefault(); recv({ ev: "app_key", key: k, local: true }); }
  });

  window.ambient = {
    recv,
    // for dev.html and the checks: start over, read what shows
    reset() { model = M.init(); for (const k in last) delete last[k]; schedule(); },
    model: () => model,
    view: () => lastV,
    fps: () => fps.value,
  };
  schedule();
})();
