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
        <div class="more"></div>
        <div class="spot"><input type="text" spellcheck="false" autocomplete="off"><div class="keys"></div></div>
        <div class="perm"><p></p><button type="button" data-do="continue"></button><button type="button" class="later" data-do="not_now"></button></div>
      </div>
    </div>
    <div class="note" id="note"></div>`;
  const cap = $("#cap", host), note = $("#note", host), tx = $(".tx", cap);
  const el = { lab: $(".lab", tx), line: $(".line", tx), words: $(".words", tx), sub: $(".sub", tx), sees: $(".sees", tx), chips: $(".chips", tx), rows: $(".rows", tx), more: $(".more", tx), spot: $(".spot", tx), perm: $(".perm", tx) };
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
    const code = (i) => !!(w.code && w.code[i]);
    while (same < kids.length && same < w.list.length && kids[same].dataset.w === w.list[same] && kids[same].classList.contains("code") === code(same)) same++;
    while (kids.length > same) node.removeChild(node.lastChild);
    for (let i = same; i < w.list.length; i++) {
      const s = document.createElement("span");
      // `code` in mono, without its backticks; a word that was only a markdown mark stays empty
      s.className = code(i) ? "w code" : "w"; s.dataset.w = w.list[i]; s.textContent = w.list[i];
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
    if (host.style.getPropertyValue("--r") !== v.radius + "px") host.style.setProperty("--r", v.radius + "px");
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
    put("words", JSON.stringify(v.words && [v.state === "listening", v.words.list, v.words.code, v.words.lit]), () => {
      show(el.words, v.words);
      el.words.classList.toggle("clamp", !!(v.words && v.words.clamp));
      if (v.words) words(el.words, v.words, v.state !== "listening");
      else el.words.textContent = "";
    });
    put("sub", v.sub || "", () => { show(el.sub, v.sub); el.sub.textContent = v.sub || ""; });
    // the head (app, host) never cut, the tail (path, title) ends in … when it must
    put("sees", JSON.stringify(v.sees), () => {
      show(el.sees, v.sees);
      el.sees.innerHTML = v.sees ? `<span class="hd">${esc(v.sees.head)}</span><span class="tl">${esc(v.sees.tail)}</span>` : "";
    });
    put("chips", v.chips.join(","), () => {
      show(el.chips, v.chips.length);
      const have = new Set([...el.chips.children].map((c) => c.dataset.n));
      [...el.chips.children].forEach((c) => { if (!v.chips.includes(c.dataset.n)) c.remove(); });
      for (const n of v.chips) if (!have.has(n)) el.chips.insertAdjacentHTML("beforeend", `<span class="chip" data-n="${esc(n)}"><b>∿</b>${esc(n)}</span>`);
    });
    put("rows", JSON.stringify([v.list, v.inbox, v.forYou]), () => {
      // what waits for you first (the inbox, or the agents view's top), then "for you", then the agents
      show(el.rows, v.list || v.inbox);
      const qs = (v.inbox || []).map((q, i) => `<div class="q${q.sel ? " sel" : ""}" style="animation-delay:${i * 0.06}s"><div class="who">? ${esc(q.agent)}</div><div class="tq">${esc(q.text)}</div>${opts(q)}</div>`);
      const fy = v.forYou ? [`<div class="sec">${esc(v.forYou.title)}</div>`, ...v.forYou.pages.map((p) => `<button type="button" class="page" data-page="${esc(p.id)}"><span class="gl">◰</span><span class="pn">${esc(p.name)}</span><span class="pm">${esc(p.meta)}</span></button>`)] : [];
      const n = qs.length + fy.length;
      const rs = (v.list || []).map((r, i) => `<div class="row ${esc(r.kind)}" style="animation-delay:${(n + i) * 0.06}s"><span class="gl">${esc(r.glyph)}</span><span class="nm">${esc(r.name)}</span><span class="wh">${esc(r.what)}</span><span class="ag">${esc(r.age)}</span></div>`);
      el.rows.innerHTML = qs.join("") + fy.join("") + rs.join("");
      el.rows.scrollTop = 0;
    });
    put("spot", v.spot ? "on" : "", () => {
      show(el.spot, v.spot);
      if (v.spot) { input.value = v.spot.text; input.placeholder = v.spot.hint; setTimeout(() => input.focus(), 0); }
      else input.blur();
    });
    // the key bar, key then word like the TUI's, three spaces between pairs
    put("keys", JSON.stringify(v.spot && v.spot.keys), () => {
      $(".keys", el.spot).innerHTML = v.spot ? v.spot.keys.map(([k, w]) => `<b>${esc(k)}</b> ${esc(w)}`).join("   ") : "";
    });
    put("perm", JSON.stringify(v.perm), () => {
      show(el.perm, v.perm);
      if (v.perm) {
        $("p", el.perm).textContent = v.perm.text;
        const [go, later] = el.perm.querySelectorAll("button");
        go.textContent = v.perm.button; later.textContent = v.perm.later;
        go.dataset.perm = later.dataset.perm = v.perm.perm;
      }
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
  // grows to its content up to 70% of the screen; past that a list scrolls inside, its last row
  // fading over 24 px, `+N more` under it (designer); other content scrolls with the same fade
  // small: as wide as its line, 360 to 470 (ambient: the idle status on one line)
  const SMALL_W = 360, OPEN_W = 470, SIDE = SMALL_W - 236;   // the orb, the gap, the paddings
  function width(v) {
    if (v.size !== "small") { cap.style.width = ""; tx.style.width = ""; return; }
    el.line.style.whiteSpace = "nowrap";
    const need = Math.ceil(el.line.scrollWidth) + 2;
    el.line.style.whiteSpace = "";
    const w = Math.max(SMALL_W, Math.min(OPEN_W, SIDE + need));
    if (cap.style.width !== w + "px") { cap.style.width = w + "px"; tx.style.width = w - SIDE + "px"; }
  }
  function layout(v) {
    width(v);
    const screenH = window.screen && screen.availHeight ? screen.availHeight : 900;
    // in a browser the page is the screen (headless Chrome says 300)
    const maxH = Math.round((native() || window.ambientApp ? screenH : Math.max(screenH, innerHeight)) * 0.7);
    const rows = el.rows, list = rows.classList.contains("on");
    rows.style.maxHeight = ""; el.more.classList.remove("on");
    let want = Math.max(MIN_H[v.size], Math.ceil(tx.scrollHeight) + PAD);
    let scroll = false;
    if (want > maxH && list) {
      el.more.classList.add("on");
      const over = Math.ceil(tx.scrollHeight) + PAD - maxH;
      const rh = Math.max(60, rows.clientHeight - over);
      rows.style.maxHeight = rh + "px";
      // rows below the visible part
      const bottom = rows.scrollTop + rh - 12;
      const hidden = [...rows.children].filter((r) => r.offsetTop + r.offsetHeight > bottom).length;
      el.more.textContent = hidden ? `+${hidden} more` : "";
      rows.classList.toggle("fade", hidden > 0);
      want = Math.max(MIN_H[v.size], Math.ceil(tx.scrollHeight) + PAD);
    } else if (want > maxH) scroll = true;
    if (!el.more.classList.contains("on")) rows.classList.remove("fade");
    const h = Math.min(want, maxH);
    tx.style.maxHeight = scroll ? `${maxH - PAD}px` : "";
    tx.style.overflowY = scroll ? "auto" : "";
    tx.classList.toggle("scroll", scroll);
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
      msg.note = { y: Math.round(n.top - r.top), h: Math.round(n.height), radius: Math.round(radius) };
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
    const v = M.view(model, t, Date.now());
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
    const pg = e.target.closest("button[data-page]");
    if (pg) recv({ ev: "ui_page", page: pg.dataset.page });
    const b = e.target.closest("button[data-card]");
    if (b) recv({ ev: "ui_option", card: b.dataset.card, i: +b.dataset.i });
    const p = e.target.closest(".perm button");
    if (p) recv({ ev: "ui_perm", perm: p.dataset.perm, do: p.dataset.do });
  });
  input.addEventListener("input", () => recv({ ev: "ui_spot_type", text: input.value }));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); recv({ ev: "ui_spot_send", text: input.value }); }
    else if (e.key === "Tab") { e.preventDefault(); recv({ ev: "ui_spot_tab", text: input.value }); }
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
