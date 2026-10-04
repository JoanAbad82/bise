// bise ambient · the side panel on screen (round 10, identity10): the bridge to the app, the DOM,
// the keys. amb-mac's second window loads panel.html with window.ambientApp = {mac, panel}; every
// core event comes here too (window.ambient.recv), the panel's cmds go the bar's way
// (messageHandlers.bise). panelmodel.js decides; this file only draws its view.
(function () {
  "use strict";
  if (window.ambient && window.ambient.panel) return;
  const { AmbPanel: P, AmbPearl, AmbWords: Wd } = window;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const native = () => !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.bise);
  if (native() || window.ambientApp) document.documentElement.classList.add("app");
  const BOX = { left: 84, w: 440 };

  const host = $("#amb") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "amb" }));
  host.classList.add("amb", "side");
  host.setAttribute("role", "region");
  host.setAttribute("aria-label", "bise · agent");
  host.innerHTML = `
    <canvas class="pearl" role="img" aria-label="bise"></canvas>
    <div class="sglass" data-qa="panel">
      <div class="sh"></div>
      <div class="sfind"><span aria-hidden="true">⌕</span><input class="fin" type="text" spellcheck="false" autocomplete="off" data-qa="find"><span class="n"></span></div>
      <div class="hist" data-qa="history"></div>
      <div class="live"></div>
      <div class="comp"><textarea class="cin" rows="1" spellcheck="true" data-qa="composer"></textarea><div class="ch"></div></div>
      <div class="stoast" aria-live="polite"></div>
    </div>`;
  const glass = $(".sglass", host), el = { sh: $(".sh", glass), find: $(".sfind", glass), hist: $(".hist", glass), live: $(".live", glass), comp: $(".comp", glass), ch: $(".ch", glass), toast: $(".stoast", glass) };
  const fin = $(".fin", glass), cin = $(".cin", glass), findN = $(".n", el.find), pearlCv = $(".pearl", host);
  const pearl = AmbPearl.create(pearlCv);
  glass.style.left = BOX.left + "px";

  // ---- the model and the bridge
  let model = P.init();
  const now = () => performance.now();
  function post(cmd) {
    try {
      if (native()) window.webkit.messageHandlers.bise.postMessage(cmd);
      else if (window.ambientDev && window.ambientDev.cmd) window.ambientDev.cmd(cmd);
    } catch (e) { console.error("post", e); }
  }
  function recv(ev) {
    if (typeof ev === "string") { try { ev = JSON.parse(ev); } catch { return; } }
    const r = P.step(model, ev, now(), Date.now());
    model = r.m;
    for (const c of r.cmds) post(c);
    schedule();
  }

  // ---- drawing, each part only when it changed
  const last = {};
  const put = (part, key, fn) => { if (last[part] === key) return false; last[part] = key; fn(); return true; };
  const caps = (keys) => (keys || []).map((k) => (k === "–" ? `<span class="dash">–</span>` : `<kbd class="k">${esc(k)}</kbd>`)).join("");
  const act = (a) => (a ? ` data-act="${esc(JSON.stringify(a))}"` : "");
  const hint = (it, cls = "fi") => it.act
    ? `<button type="button" class="${cls}" data-key="${esc(it.keys.join(" "))}"${act(it.act)}>${caps(it.keys)}<span>${esc(it.w)}</span></button>`
    : `<span class="${cls} info">${caps(it.keys)}<span>${esc(it.w)}</span></span>`;
  // the agents' words: paragraphs, `code` in mono, nothing else of markdown's marks
  const md = (s) => esc(Wd.plain ? s.replace(/\*\*|__/g, "") : s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\n{2,}/g, "<br><br>").replace(/\n/g, "<br>");
  const mark = (html, q) => {
    if (!q) return html;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
    return html.split(/(<[^>]+>)/).map((part) => (part.startsWith("<") ? part : part.replace(re, "<mark>$1</mark>"))).join("");
  };

  function head(v) {
    // four words, no keycaps inside (ambient's gate m_7074: 'archive ⌘⌫' was cut at 440 px); their
    // keys stay in the tooltip and the ⋯ menu
    const tools = v.tools.map((t) => `<button type="button" class="tb2${t.on ? " on" : ""}${t.risk ? " stop" : ""}" data-qa="tool-${t.id}" data-key="${esc(t.keys.join(" "))}" title="${esc(`${t.w} · ${t.keys.join(" ")}`)}"${act(t.act)}>${esc(t.w)}</button>`);
    const stopAt = v.tools.findIndex((t) => t.id === "stop" || t.id === "archive");
    tools.splice(stopAt, 0, `<span class="sp"></span>`);
    return `<div class="t1"><h3>${esc(v.name)}</h3><span class="chip ${v.chip.gc || ""}">${esc(v.chip.text)}</span>`
      + `<button type="button" class="ix" data-qa="more" title="${esc(Wd.W.panel.more)}"${act({ ev: "ui_menu" })}>⋯</button>`
      + `<button type="button" class="ix" data-qa="close" title="esc"${act({ ev: "ui_close" })}>✕</button></div>`
      + (v.title ? `<div class="tl">${esc(v.title)}</div>` : "")
      + `<div class="tools">${tools.join("")}</div>`
      + (v.confirm ? `<div class="conf" data-qa="confirm"><span>${esc(v.confirm.text)}</span><span class="sp"></span>${hint({ keys: ["⏎"], w: v.confirm.yes, act: { ev: "ui_yes" } }, "act")}${hint({ keys: ["esc"], w: v.keep, act: { ev: "ui_no" } }, "act")}</div>` : "")
      + (v.menu ? `<div class="menu" role="menu">${v.menu.map((it) => (it ? `<button type="button" class="mi" role="menuitem"${act(it.act)}><span>${esc(it.w)}</span><span>${caps(it.keys)}</span></button>` : "<hr>")).join("")}</div>` : "");
  }

  function entry(e, q) {
    const at = e.at ? ` <i>${esc(e.at)}</i>` : "";
    const cls = `ev ${e.kind}${e.hit ? " hit" : ""}${e.cur ? " cur" : ""}`;
    if (e.card) {
      const c = e.card;
      if (c.answered) return `<div class="${cls} answered" data-pos="${e.pos}"><div class="who">${esc(c.label)}</div>${mark(md(c.question), q)} <div class="dim">${esc(c.done)}</div></div>`;
      return `<div class="${cls}" data-pos="${e.pos}"><div class="l">${esc(c.label)}</div>${mark(md(c.question), q)}<div class="opts">${c.options.map((o) => `<button type="button" class="opt" data-qa="opt-${esc(o.n)}"${act(o.act)}><span>${c.keys ? caps([String(o.n)]) : ""}</span><span>${esc(o.label)}</span></button>`).join("")}</div></div>`;
    }
    if (e.tools) {
      const t = e.tools;
      return `<div class="${cls}${t.open ? " open" : ""}" data-pos="${e.pos}"${act({ ev: "ui_fold", pos: e.pos })}>› ${mark(esc(t.summary), q)}${at}<div class="more">${t.items.map((i) => `${i.land ? "⇡ " : ""}${esc(i.text)}`).join("<br>") || "—"}</div></div>`;
    }
    if (e.page) return `<button type="button" class="${cls}" data-pos="${e.pos}"${act(e.page.act)}><span class="g">◰</span><span>${mark(esc(e.page.t), q)}</span>${at}</button>`;
    const copy = `<button type="button" class="copy"${act({ ev: "ui_copy", text: e.text })}>${esc(Wd.W.panel.copy)}</button>`;
    return `<div class="${cls}" data-pos="${e.pos}"><div class="who">${e.glyph ? `<span class="gl ${e.glyph === "✓" ? "ok" : "risk"}">${esc(e.glyph)}</span> ` : ""}${esc(e.who)}${at}</div>${mark(md(e.text), q)}${copy}</div>`;
  }

  let lastV = null, sentSize = "";
  function render(v) {
    host.classList.toggle("on", v.on);
    host.classList.toggle("still", !!v.still);
    if (!v.on) return;
    glass.style.height = Math.max(200, v.size.h || innerHeight) + "px";
    glass.style.borderRadius = (v.size.radius || 26) + "px";
    put("sh", JSON.stringify([v.name, v.chip, v.title, v.tools, v.confirm, v.menu]), () => { el.sh.innerHTML = head(v); });
    // find
    el.find.classList.toggle("on", !!v.find);
    if (v.find) {
      if (fin.value !== v.find.text && document.activeElement !== fin) fin.value = v.find.text;
      fin.placeholder = Wd.W.panel.find;
      findN.textContent = v.find.label;
    }
    // the history: stays at the bottom while he is there; older entries keep his place
    const q = v.find && v.find.text;
    put("hist", JSON.stringify([v.name, v.entries, v.more, v.empty, q]), () => {
      const atEnd = el.hist.scrollHeight - el.hist.scrollTop - el.hist.clientHeight < 40;
      const fromEnd = el.hist.scrollHeight - el.hist.scrollTop;
      const fresh = last.histName !== v.name;
      last.histName = v.name;
      el.hist.innerHTML = (v.more ? `<button type="button" class="older" data-qa="older"${act({ ev: "ui_older" })}>${esc(Wd.W.panel.older)}</button>` : "")
        + (v.empty ? `<div class="empty">${esc(v.empty)}</div>` : "")
        + v.entries.map((e) => entry(e, q)).join("");
      if (fresh || atEnd) el.hist.scrollTop = el.hist.scrollHeight;
      else el.hist.scrollTop = el.hist.scrollHeight - fromEnd;
    });
    put("cur", String(v.find && v.find.cur), () => {
      const c = v.find && v.find.cur != null ? el.hist.querySelector(`[data-pos="${v.find.cur}"]`) : null;
      if (c) c.scrollIntoView({ block: "center" });
    });
    // its current step, and what waits to go when it's free
    put("live", JSON.stringify([v.typing, v.queued]), () => {
      el.live.innerHTML = v.queued.map((x) => `<div class="queued"><span class="lab">${esc(x.label)}</span> ${esc(x.text)}</div>`).join("")
        + (v.typing ? `<div class="typing"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>${esc(v.typing)}</div>` : "");
      el.live.classList.toggle("on", !!(v.typing || v.queued.length));
    });
    // the composer
    if (cin.value !== v.comp && document.activeElement !== cin) cin.value = v.comp;
    if (cin.placeholder !== v.ph) { cin.placeholder = v.ph; cin.setAttribute("aria-label", v.ph); }
    put("ch", JSON.stringify([v.hints, v.close]), () => { el.ch.innerHTML = v.hints.map((h) => hint(h, "act")).join("") + `<span class="sp"></span>` + hint(v.close, "act"); });
    put("toast", JSON.stringify(v.toast), () => {
      el.toast.innerHTML = v.toast ? `<span>${esc(v.toast.text)}</span>${v.toast.undo ? hint(v.toast.undo, "act") : ""}` : "";
      el.toast.classList.toggle("on", !!v.toast);
    });
    // the box: room for the pearl at the left, the glass pinned to the screen's right edge
    const msg = { cmd: "app_size", w: BOX.left + BOX.w, h: v.size.h || innerHeight, radius: v.size.radius || 26, glass: { x: BOX.left, y: 0, w: BOX.w, h: v.size.h || innerHeight } };
    const k = JSON.stringify(msg);
    if (k !== sentSize) { sentSize = k; post(msg); }
  }

  // ---- the frame loop: only while the panel shows; the pearl at 30 Hz at most, 15 when calm
  let timer = 0;
  function schedule() { if (!timer) timer = setTimeout(frame, 0); }
  function frame() {
    timer = 0;
    const t = now();
    const v = P.view(model, t, Date.now());
    lastV = v;
    render(v);
    if (!v.on) return;
    const moving = pearl.frame({ mood: v.mood, lvl: 0, still: v.still, gather: 0, zoom: 64 / 76 }, t);
    timer = setTimeout(frame, moving ? 33 : 66);
  }

  // ---- input: a click = its key
  host.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || !host.contains(b)) return;
    if (b.classList.contains("ev") && window.getSelection && String(window.getSelection()).trim()) return;   // selecting text, not folding
    e.stopPropagation();
    let a; try { a = JSON.parse(b.dataset.act); } catch { return; }
    if (a.ev === "ui_find_open") { recv(a); setTimeout(() => fin.focus(), 0); return; }
    recv(a);
  });
  // near the top: the older entries
  el.hist.addEventListener("scroll", () => { if (el.hist.scrollTop < 60 && lastV && lastV.more && !lastV.loading) recv({ ev: "ui_older" }); });
  cin.addEventListener("input", () => { recv({ ev: "ui_type", text: cin.value }); cin.style.height = "auto"; cin.style.height = Math.min(160, cin.scrollHeight) + "px"; });
  fin.addEventListener("input", () => recv({ ev: "ui_find", text: fin.value }));
  fin.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); recv({ ev: "ui_find_next" }); }
    else if (e.key === "Escape") { e.preventDefault(); recv({ ev: "ui_esc" }); cin.focus(); }
    e.stopPropagation();
  });
  // the keys (amb-mac m_7042: ⌘Q ⌘W ⌘, ⌘H are the app's menu: never prevented here)
  document.addEventListener("keydown", (e) => {
    const v = lastV;
    if (!v || !v.on || e.ctrlKey) return;
    const stop = () => e.preventDefault();
    const k = e.key, inComp = e.target === cin;
    if (e.metaKey) {
      const low = k.toLowerCase();
      if (low === "f") { stop(); recv({ ev: "ui_find_open" }); setTimeout(() => fin.focus(), 0); }
      else if (low === "d") { stop(); recv({ ev: "ui_follow" }); }
      else if (low === "o") { stop(); recv({ ev: "ui_terminal" }); }
      else if (k === ".") { stop(); recv({ ev: "ui_stop" }); }
      else if (k === "Backspace") { stop(); recv({ ev: "ui_archive" }); }
      else if (k === "ArrowUp" || k === "ArrowDown") { stop(); recv({ ev: "ui_step", d: k === "ArrowUp" ? -1 : 1 }); }
      else if (low === "z" && v.toast && v.toast.undo) { stop(); recv({ ev: "ui_undo" }); }
      return;
    }
    if (v.confirm) {
      if (k === "Enter") { stop(); recv({ ev: "ui_yes" }); } else if (k === "Escape") { stop(); recv({ ev: "ui_no" }); }
      return;
    }
    if (k === "Escape") { stop(); recv({ ev: "ui_esc" }); return; }
    if (/^[1-9]$/.test(k) && !cin.value.trim() && v.entries.some((x) => x.card && x.card.keys)) { stop(); recv({ ev: "ui_digit", n: +k }); return; }
    if (inComp && k === "Enter" && !e.shiftKey && !e.isComposing) { stop(); recv({ ev: "ui_send", mode: "now" }); cin.value = ""; cin.style.height = "auto"; return; }
    if (inComp && k === "Tab") { stop(); recv({ ev: "ui_send", mode: "queued" }); cin.value = ""; cin.style.height = "auto"; return; }
    // a letter anywhere else writes to it
    if (!inComp && e.target !== fin && k.length === 1) cin.focus();
  });

  window.ambient = { recv, panel: true, model: () => model, view: () => lastV };
  schedule();
})();
