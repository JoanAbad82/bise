// the ambient app mockups: one engine for the four directions.
// a direction calls AMB.mount({ id, name, wall, screens: { key: () => html }, notes: { key: text } }).
// choreography lives in the html through data attributes, timed from the screen's own clock:
//   data-at="1.2"            gets .in at 1.2 s (data-out="4" removes it at 4 s)
//   data-type="0.6"          its words land one by one from 0.6 s (data-per = seconds per word)
//   canvas data-face="seq:listen@0,talk@0.4,think@5"   the kiss face, dot by dot (data-cell, data-shape, data-col)
//   pre data-face="…"         the same face in half blocks, like the terminal
//   data-wave="you@0.4-5,main@6-10"  bars that follow a voice (data-n bars)
//   data-gust="12"           the working breeze, n cells
//   data-k="0.4"             a 0..1 voice level as --k (for css: scale, glow)
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const REDUCE = new URLSearchParams(location.search).has("still") || matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- a voice: syllables, pauses (deterministic in t)
  function voice(t, seed = 0) {
    if (t < 0) return 0;
    const syl = Math.max(0, Math.sin(t * 11 + seed) * 0.5 + 0.5) ** 1.4;
    const phrase = 0.55 + 0.45 * Math.sin(t * 2.1 + seed * 3.1);
    const pause = ((t * 0.9 + seed) % 2.6) > 2.25 ? 0.08 : 1;
    return Math.min(1, syl * phrase * pause * 1.1);
  }

  // ---- the kiss face (rust/tui/src/voicemode/kiss.rs, round 5), 41 × 18 dots
  const FW = 41, FH = 18;
  function face(pose, t, lvl) {
    const P = Array.from({ length: FH }, () => new Uint8Array(FW));
    const set = (x, y) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < FW && y >= 0 && y < FH) P[y][x] = 1; };
    const shut = pose !== "speak" && pose !== "think" && (t % 4.2) > 4.02;
    const sleep = pose === "sleep";
    for (const y0 of [4, 11]) for (let y = y0; y < y0 + 3; y++) for (let x = 6; x < 10; x++) if (!(shut || sleep) || y === y0 + 1) set(x, y);
    const cx = 23, cy = 8.5;
    const paren = (h, b) => { for (let y = cy - h; y <= cy + h; y += 0.25) { const u = (y - cy) / h, x = cx - 1.5 + b * (1 - u * u); set(x, y); set(x + 1, y); } };
    const star = (r, rot, x0 = cx, y0 = cy) => { for (let a = 0; a < 3; a++) { const g = rot + a * Math.PI / 3;
      for (let s = -r; s <= r; s += 0.25) { set(x0 + s * Math.sin(g) * 1.15, y0 - s * Math.cos(g)); set(x0 + s * Math.sin(g) * 1.15 + 0.5, y0 - s * Math.cos(g)); } } };
    const ring = (rx, ry) => { for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const o = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2, i = ((x - cx) / Math.max(0.5, rx - 1.7)) ** 2 + ((y - cy) / Math.max(0.5, ry - 1.4)) ** 2;
      if (o <= 1 && i > 1) P[y][x] = 1; } };
    const arcs = v => { const k = v < 0.15 ? 0 : v < 0.4 ? 1 : v < 0.7 ? 2 : 3;
      for (let j = 0; j < k; j++) { const rx = 12 + 2.5 * j, ry = 5.5 + 1.5 * j; for (let a = -0.9; a <= 0.9; a += 0.04) set(cx + rx * Math.cos(a), cy + ry * Math.sin(a)); } };
    const kiss = ms => {
      if (ms < 150) return paren(5.5, 1.2);
      if (ms < 300) return star(3, 0);
      if (ms < 800) { star(5, 0); const p = [[9, -2, 2], [12, -3, 2], [14, -4, 1.5]], i = Math.floor((ms - 300) / 120); if (i < 3) star(p[i][2], 0, cx + p[i][0], cy + p[i][1]); return; }
      return paren(5.5, 3);
    };
    if (REDUCE) { t = 1.3; if (pose === "kiss") pose = "rest"; }
    if (pose === "rest" || pose === "sleep") paren(5.5, 3);
    else if (pose === "listen") paren(5.5, 3 + 0.6 * (Math.floor(t / 1.2) % 2));
    else if (pose === "talk") paren(5.5, 3.5);
    else if (pose === "think") star(5, Math.floor(t / 0.15) * Math.PI / 12);
    else if (pose === "speak") { const v = REDUCE ? 0.45 : lvl; if (v < 0.08) paren(5.5, 3); else { ring(4.5 + v * 2.5, 1.8 + v * 6.5); arcs(v); } }
    else if (pose === "kiss") kiss(t * 1000);
    return P;
  }
  // "seq:listen@0,talk@0.5,think@5" → the pose at t, and the time inside it
  function poseAt(spec, t) {
    if (!spec.startsWith("seq:")) return { p: spec, s: t };
    let cur = { p: "rest", s: t };
    for (const part of spec.slice(4).split(",")) { const [p, at] = part.split("@"); if (t >= +at) cur = { p, s: t - +at }; }
    return cur;
  }
  function drawFace(cv, P, o) {
    const cell = +(cv.dataset.cell || 4), gap = +(cv.dataset.gap ?? 1), shape = cv.dataset.shape || "square";
    const cs = getComputedStyle(cv), col = cv.dataset.col || cs.color;
    const w = FW * cell, h = FH * cell, dpr = 2;
    if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + "px"; cv.style.height = h + "px"; }
    const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.fillStyle = col;
    if (cv.dataset.glow) { g.shadowColor = col; g.shadowBlur = +cv.dataset.glow; }
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (P[y][x]) {
      if (shape === "round") { g.beginPath(); g.arc(x * cell + cell / 2, y * cell + cell / 2, (cell - gap) / 2, 0, 7); g.fill(); }
      else g.fillRect(x * cell, y * cell, cell - gap, cell - gap);
    }
  }
  function blocks(P) {
    const rows = [];
    for (let r = 0; r < FH / 2; r++) { let s = ""; for (let x = 0; x < FW; x++) { const a = P[2 * r][x], b = P[2 * r + 1][x]; s += a && b ? "█" : a ? "▀" : b ? "▄" : " "; } rows.push(s); }
    return rows.join("\n");
  }

  // ---- voice windows: "you@0.4-5,main@6-10"
  function levelAt(spec, t) {
    for (const part of spec.split(",")) {
      const m = part.match(/(\w+)@([\d.]+)-([\d.]+)/); if (!m) continue;
      const [, who, a, b] = m; if (t >= +a && t <= +b) return { who, v: voice(t - a, who === "main" ? 2 : 0) * Math.min(1, (t - a) * 4, (b - t) * 4) };
    }
    return { who: "", v: 0 };
  }
  const GUST = "·~∿≈";

  // ---- the stage
  let D, key, t0 = 0, auto = true, held = false, root, stageEl;
  const ORDER = ["idle", "listen", "talk", "agents", "needs", "viewer", "spotlight", "sheet"];
  const LABEL = { idle: "idle", listen: "hold fn", talk: "main answers", agents: "agents", needs: "needs you", viewer: "output + notes", spotlight: "spotlight", sheet: "state sheet" };
  const LEN = { idle: 5, listen: 6.5, talk: 7.5, agents: 6, needs: 7, viewer: 10, spotlight: 6, sheet: 9 };
  const embed = new URLSearchParams(location.search).has("embed");
  const FREEZE = new URLSearchParams(location.search).get("t") == null ? null : +new URLSearchParams(location.search).get("t");
  if (FREEZE != null) document.documentElement.classList.add("frozen");

  function prep(el) {
    $$("[data-type]", el).forEach(n => {
      if (n._typed) return; n._typed = 1;
      const words = n.textContent.trim().split(/\s+/);
      n.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(" ");
    });
    $$("[data-wave]", el).forEach(n => { if (!n.children.length) n.innerHTML = "<i></i>".repeat(+(n.dataset.n || 24)); });
  }
  function show(k, keepAuto) {
    key = k; t0 = performance.now(); if (!keepAuto) auto = false;
    root.innerHTML = D.screens[k] ? D.screens[k]() : `<div class="todo">${k}</div>`;
    root.dataset.screen = k; stageEl.dataset.screen = k;
    prep(root);
    $$(".tabs button").forEach(b => b.classList.toggle("on", b.dataset.k === k));
    const n = $("#note"); if (n) n.innerHTML = (D.notes && D.notes[k]) || "";
    const p = $("#play"); if (p) p.textContent = auto ? "❚❚ pause" : "▶ play the flow";
    tick();
  }
  function tick() {
    const t = REDUCE ? 99 : FREEZE != null ? FREEZE : (performance.now() - t0) / 1000;
    $$("[data-at]", root).forEach(n => {
      const on = t >= +n.dataset.at && !(n.dataset.out && t >= +n.dataset.out);
      n.classList.toggle("in", on);
    });
    $$("[data-type]", root).forEach(n => {
      const st = +n.dataset.type, per = +(n.dataset.per || 0.26), ws = n.children; let last = -1;
      for (let i = 0; i < ws.length; i++) { const on = t >= st + i * per; ws[i].classList.toggle("on", on); if (on) last = i; }
      for (let i = 0; i < ws.length; i++) ws[i].classList.toggle("cur", i === last && last < ws.length - 1);
    });
    $$("[data-face]", root).forEach(n => {
      let { p, s } = poseAt(n.dataset.face, t);
      let lvl = p === "speak" ? voice(s, 2) : 0;
      if (n.dataset.still != null) { s = 1.3; lvl = 0.45; if (p === "kiss") s = 0.5; }
      const P = face(p, s, lvl);
      if (n.tagName === "CANVAS") drawFace(n, P); else n.textContent = blocks(P);
      n.dataset.pose = p;
    });
    $$("[data-wave]", root).forEach(n => {
      const bars = n.children, N = bars.length;
      for (let i = 0; i < N; i++) {
        const { v, who } = levelAt(n.dataset.wave, t - Math.abs(i - N / 2) * 0.035);
        const idle = 0.06 + 0.04 * Math.sin(t * 2 + i * 0.7);
        const shape = Math.sin((i + 0.5) / N * Math.PI) ** 0.6;
        bars[i].style.setProperty("--h", Math.max(idle, v * shape * (0.6 + 0.4 * Math.sin(i * 1.7 + t * 7) ** 2)).toFixed(3));
        bars[i].className = who ? "v-" + who : "";
      }
    });
    $$("[data-k]", root).forEach(n => { n.style.setProperty("--k", levelAt(n.dataset.k, t).v.toFixed(3)); });
    $$("[data-gust]", root).forEach(n => {
      const N = +n.dataset.gust; let s = "";
      for (let i = 0; i < N; i++) { const ph = (t * 1.6 - i * 0.18) % 2.2, v = ph > 0 && ph < 1 ? Math.sin(ph * Math.PI) : 0; s += GUST[Math.min(3, Math.floor(v * 4))]; }
      n.textContent = REDUCE ? "∿" : s;
    });
    $$("[data-clock]", root.ownerDocument).forEach(n => { n.textContent = "wed 15 oct  17:42"; });
    if (D.tick) D.tick(key, t, root);
    if (auto && !held && t > LEN[key]) { const i = ORDER.indexOf(key); show(ORDER[(i + 1) % (ORDER.length - 1)], true); }
  }

  function desktop(wall) {
    return `<div class="desk ${wall}">
      <div class="menubar"><span class="apple"></span><b>Chrome</b><span>File</span><span>Edit</span><span>View</span><span>History</span><span>Window</span>
        <span class="sp"></span><span class="tray" id="tray">${(D && D.tray) || ":*"}</span><span class="mi">◔</span><span class="mi">⌕</span><span data-clock></span></div>
      <div class="win term"><div class="wt"><i></i><i></i><i></i><span>ghostty · ~/acme</span></div>
        <pre>  <b>bise</b> <em>:*</em>   ~/acme · main

  <u>│</u> dark mode for the settings page
  <em>:*</em> dark-mode started. settings first.
  <s>∿</s> perf      profiling signup
  <s>∿</s> cookies   the banner, mobile
  <s>∿</s> emoji-csv it's always unicode
  <s>…</s> release   waits for the others</pre></div>
      <div class="win web"><div class="wt"><i></i><i></i><i></i><span class="url">localhost:4801/settings</span></div>
        <div class="page"><div class="ph"><b>acme</b><span>settings</span><span>billing</span><span>team</span></div>
        <div class="pb"><h4>appearance</h4><div class="row"><span>theme</span><span class="sw"><i></i><i class="on"></i><i></i></span></div>
        <div class="row"><span>density</span><span class="bar"></span></div><div class="row"><span>language</span><span class="bar s"></span></div>
        <h4>notifications</h4><div class="row"><span>email me</span><span class="tg"></span></div><div class="row"><span>weekly digest</span><span class="tg on"></span></div></div></div></div>
    </div>`;
  }

  function mount(d) {
    D = d;
    document.title = `ambient · ${d.name}`;
    document.body.classList.add("amb", "dir-" + d.id); if (embed) document.body.classList.add("embed");
    document.body.insertAdjacentHTML("afterbegin", `
      ${embed ? "" : `<header class="top"><a href="index.html">← ambient · all directions</a><span class="sp"></span>${["a", "b", "c", "d"].map(x => `<a class="${x === d.id ? "on" : ""}" href="${x}.html">${x}</a>`).join("")}</header>
      <div class="intro"><h1>${d.letter} · ${d.name}</h1><p>${d.pitch}</p></div>`}
      <div class="fit"><div class="stage" id="stage">${desktop(d.wall)}<div class="scene" id="scene"></div><div class="fn ${embed ? "hide" : ""}" id="fn"><b>fn</b><span>hold to talk</span></div></div></div>
      ${embed ? "" : `<nav class="tabs">${ORDER.map(k => `<button data-k="${k}">${LABEL[k]}</button>`).join("")}<span class="sp"></span><button id="play">❚❚ pause</button></nav>
      <p class="note" id="note"></p>
      <p class="keys">hold <kbd>space</kbd> (or the <kbd>fn</kbd> key on the screen) = fn · <kbd>/</kbd> spotlight · <kbd>←</kbd> <kbd>→</kbd> screens · <a href="?still">reduced motion</a></p>`}`);
    root = $("#scene"); stageEl = $("#stage");
    const fit = () => { const f = $(".fit"), w = f.clientWidth - (embed ? 0 : 56), s = Math.min(w / 1440, embed ? innerHeight / 900 : 9); f.style.height = 900 * s + "px"; stageEl.style.transform = `scale(${s})`; };
    addEventListener("resize", fit); fit();
    $$(".tabs button[data-k]").forEach(b => b.onclick = () => show(b.dataset.k));
    const play = $("#play"); if (play) play.onclick = () => { auto = !auto; if (auto) show(key === "sheet" ? "idle" : key, true); else play.textContent = "▶ play the flow"; };
    const down = () => { if (held) return; held = true; auto = false; show("listen"); stageEl.classList.add("held"); };
    const up = () => { if (!held) return; held = false; stageEl.classList.remove("held"); show("talk"); };
    addEventListener("keydown", e => {
      if (e.target.closest && e.target.closest("input,textarea,[contenteditable]")) return;
      if (e.code === "Space") { e.preventDefault(); if (!e.repeat) down(); }
      else if (e.key === "/") { e.preventDefault(); show("spotlight"); }
      else if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const i = ORDER.indexOf(key), n = ORDER.length; show(ORDER[(i + (e.key === "ArrowRight" ? 1 : n - 1)) % n]); }
    });
    addEventListener("keyup", e => { if (e.code === "Space") up(); });
    const fn = $("#fn"); fn.onpointerdown = down; addEventListener("pointerup", up);
    show(new URLSearchParams(location.search).get("s") || "idle", true);
    if (new URLSearchParams(location.search).has("s")) auto = false;
    const loop = () => { if (!document.hidden) tick(); setTimeout(loop, 33); };
    loop();
  }

  // the words, the same in every direction (designer, m_4561)
  const W = {
    idle: "nothing needs you. 3 agents working.",
    quiet: "all quiet. hold fn to talk.",
    said: "dark mode for the settings page. and the cookie banner hides the buy button on mobile, make it half the size",
    got: ":* got it.",
    on: "main is on it.",
    answer: "dark-mode started. settings page first, then the rest. cookies is on the banner.",
    needs: "cookies needs you: keep the banner on mobile?",
    needsOpts: ["1 yes", "2 no"],
    light: "one question from perf. ten seconds, promise.",
    done: "perf is done: signup 4.1 s → 0.9 s.",
    doneTouch: "three seconds back, every signup.",
    fail: "release couldn't publish: the checksum didn't match. main is on it.",
    sees: "Chrome · localhost:4801/settings",
    note1: "this gray is too light. use the one in tokens.css",
    note2: "and the toggles, same gray",
  };
  const AGENTS = [
    ["✓", "perf", "is done · 4.1 s → 0.9 s", "done"],
    ["∿", "dark-mode", "settings page first", "work"],
    ["∿", "cookies", "the banner, half the size", "work"],
    ["∿", "emoji-csv", "it's always unicode", "work"],
    ["…", "release", "waits for the others", "wait"],
  ];
  const OUTPUTS = [
    ["page", "settings, dark", "localhost:4801/settings", "dark-mode"],
    ["pr", "PR #482 · cookies: half-size banner on mobile", "github.com/acme/web/pull/482", "cookies"],
    ["doc", "release notes · draft 2", "localhost:4802/notes", "release"],
    ["img", "which gray wins? 3 grays", "localhost:4803/grays", "dark-mode"],
  ];
  window.AMB = { mount, face, blocks, voice, levelAt, poseAt, desktop, W, AGENTS, OUTPUTS };
})();
