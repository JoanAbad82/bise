// bise desktop · the window's DOM: draws AmbWinView's data with the design system's markup
// (apps/ambient/web/ds/ds.css: b-side, b-row, b-head, b-thread, b-msg, b-route, b-dock, b-composer,
// b-board...), turns clicks and keys into ui_* events for AmbWinModel, and talks to the shell.
// It decides nothing: every key goes through the model, which says whether it ate it.
//
// Bridge (amb-mac's S4 window, m_8199): in = window.ambient.recv(ev); out =
// window.webkit.messageHandlers.bise.postMessage(cmd). With no app around (a plain browser:
// screens.html, the harness's headless shots) the fake core answers instead (winfake.js).
(function (root) {
  "use strict";
  const M = root.AmbWinModel, V = root.AmbWinView;
  const doc = root.document;

  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // ---- small drawings: the capture and the artifacts' thumbnails (svg, no data)
  const SVG = {
    p99: `<svg viewBox="0 0 150 84" preserveAspectRatio="none"><line x1="0" y1="29" x2="150" y2="29" class="w-gr"/><line x1="0" y1="60" x2="150" y2="60" class="w-gr"/><rect x="64" y="0" width="17" height="84" class="w-fa"/><polyline class="sv-err" points="0,60 9,63 15,60 21,58 28,65 34,55 41,66 47,56 54,63 60,60 64,58 66,44 69,31 71,22 73,18 75,22 77,31 79,44 81,60 88,65 94,55 101,66 107,55 114,64 120,60 126,59 133,65 139,55 146,66 150,59"/><text x="4" y="25" class="w-svt">2 s</text><text x="4" y="56" class="w-svt">300 ms</text><text x="68" y="78" class="w-svt">14:00</text></svg>`,
    chart: `<svg viewBox="0 0 300 52" preserveAspectRatio="none"><polyline class="sv-err" points="0,46 30,44 45,10 55,45 100,46 130,43 145,8 155,44 200,46 230,44 245,14 255,45 300,46"/><polyline class="sv-ok" points="0,48 50,47 100,46 150,48 200,47 250,46 300,47"/></svg>`,
    bars: `<svg viewBox="0 0 300 52" preserveAspectRatio="none">${[20, 34, 44, 40, 26, 27, 41, 44, 34, 21, 35, 44, 40, 25, 27, 41, 44, 34, 22, 35].map((h, i) => `<rect x="${2 + i * 15}" y="${52 - h}" width="10" height="${h}" class="${i < 12 ? "sv-f" : "sv-f sv-dim"}"/>`).join("")}</svg>`,
    report: `<svg viewBox="0 0 300 52" preserveAspectRatio="none"><rect x="20" y="8" width="110" height="7" class="sv-f"/>${[0, 1, 2, 3].map((i) => `<rect x="20" y="${22 + i * 7}" width="${240 - i * 23}" height="3" class="sv-f sv-dim"/>`).join("")}</svg>`,
    table: `<svg viewBox="0 0 300 52" preserveAspectRatio="none">${[0, 1, 2, 3, 4].map((i) => `<rect x="10" y="${6 + i * 9}" width="280" height="1" class="sv-f sv-dim"/><rect x="14" y="${9 + i * 9}" width="${50 + (i * 37) % 60}" height="3" class="sv-f"/>`).join("")}</svg>`,
  };
  const thumb = (k) => SVG[k] || SVG.report;

  // ---- regions, drawn with amb-kit's components (window/components: BiseUI.<name>.render(data)
  // -> Element, the design system's markup); the few parts the kit has no component for yet (the
  // day line, the context under his message, the inbox card's context, the thumbnails' grid) are
  // plain markup with DS classes. No `on` is handed to the components: the window's one click
  // listener reads data-act (it adds the shift key to a diff line's act).
  const UI = root.BiseUI;
  const h = (...a) => UI.core.h(...a);
  const svg = (k) => { const t = doc.createElement("template"); t.innerHTML = thumb(k); return t.content.firstChild; };
  const withAct = (el, a) => UI.core.act(el, a);
  // the kit's pearl span ([data-bise-pearl]) gets the window's shared canvas, with the mood
  // without WebGL (a headless shot, a GPU-less VM) the span keeps its ':*' (designer m_8292)
  function pearlsIn(el, mood) {
    if (!glFor(mood || "rest")) return el;
    for (const p of el.querySelectorAll ? el.querySelectorAll("[data-bise-pearl]") : []) {
      const n = +p.getAttribute("data-bise-pearl") || 22;
      p.replaceChildren(Object.assign(doc.createElement("canvas"), { className: "w-pearl", width: n * 2, height: n * 2 }));
      p.firstChild.dataset.mood = p.getAttribute("data-mood") || mood || "rest";
    }
    return el;
  }

  function side(v) {
    const rows = v.side.rows.map((r) => (r.kind === "sh" ? { sh: r.text }
      : { kind: r.kind, name: r.name, sub: r.sub, dot: r.kind === "me" ? null : { state: r.dot }, end: r.end, needs: r.nd || r.end === "?", on: r.on, act: r.act }));
    const el = UI.side.render({ rows, foot: { text: v.side.foot, act: { ev: "ui_add_open" } } });
    el.querySelector(".b-lights").classList.add("w-drag");
    return pearlsIn(el, v.mood);
  }

  function head(v) {
    const d = v.head;
    const sub = d.t2.map((x, i) => [i ? " · " : "", i === d.acc ? h("span", "w-acc", x) : x]);
    const end = [
      ...(d.seg ? [UI.seg.render({ items: d.seg.map((x) => x.text), on: d.seg.findIndex((x) => x.on), act: { ev: "ui_tab_i" } })] : []),
      ...(d.end || []).map((e) => e.kind === "chip" ? h("span", "b-chip", e.text, e.kbd ? [" ", UI.kbd.render({ text: e.kbd })] : null)
        : (() => { const b = withAct(h("button", "b-btn ghost", e.text, e.kbd ? [" ", UI.kbd.render({ text: e.kbd })] : null), e.act); if (e.tip) b.title = e.tip; return b; })()),
    ];
    const el = UI.head.render({ title: d.t1, sub, pearl: d.pearl ? 40 : null, dot: !d.pearl && d.dot != null ? { state: d.dot } : null, end });
    el.classList.add("w-drag");
    return pearlsIn(el, v.mood);
  }

  function jobs(v) {
    if (!v.jobs.length) return null;
    return h("div", "w-now", v.jobs.map((j) => UI.job.render({ state: j.failed ? "er" : "wk", name: j.title, end: j.following ? { text: "following" } : "", what: j.s, pct: j.pct, act: j.act })));
  }

  function msg(r) {
    const w = r.who;
    const from = w.pearl ? "bise" : r.you ? "you" : "agent";
    const [time, ...via] = r.meta.split(" · ");
    const children = [
      r.ctx ? h("div", "w-ctx", r.ctx.shot ? h("div", "w-shot", svg(r.ctx.shot)) : null, h("div", "w-chips", r.ctx.chips.map((c) => UI.chip.render({ text: c })))) : null,
      r.page ? UI.art.render({ title: `↗ ${r.page.title}`, meta: "page", thumb: svg("report") }) : null,
    ];
    const el = UI.msg.render({ from, name: w.name, time, via: via.join(" · "), text: r.error ? `▲ ${r.text}` : r.text, av: w.av, quote: r.quote ? { text: r.quote.replace(/^❝ /, "") } : null,
      dot: from === "agent" ? { state: r.error ? "er" : w.dot || "" } : null, in: w.in, state: r.error ? "error" : null, children });
    if (r.pending) el.classList.add("w-pending");
    el.setAttribute("data-pos", String(r.pos));
    el.querySelector(".b-text").setAttribute("data-quote", String(r.pos));
    return pearlsIn(el, "rest");
  }

  function row(r) {
    const fold = { ev: "ui_fold", pos: r.pos };
    switch (r.t) {
      case "day": return UI.day.render({ text: r.text });
      case "msg": return msg(r);
      case "route": { const el = UI.route.render({ state: r.dot, p1: r.p1, p2: r.p2, p3: r.p3, pct: r.bar != null && r.bar >= 0 ? r.bar : null, act: r.act }); el.classList.add("w-in"); return el; }
      case "fold": {
        const el = UI.fold.render({ text: r.text.replace(/^[▸▾] /, ""), open: r.open, act: fold });
        return [el, r.items.map((x) => h("div", "w-folded", row(x)))];
      }
      case "tool": { const el = UI.tool.render({ text: r.label, state: r.open ? "open" : r.run ? "run" : "", out: r.items.join("\n"), act: fold }); el.classList.add("w-in"); return el; }
      case "answered": return [UI.answered.render({ text: r.why ? `${r.text} ${r.open ? "▾" : "▸"} why` : r.text, act: fold }), r.open && r.why ? h("div", "b-answered w-whytext", r.why) : null];
      case "marker": return withAct(UI.marker.render({ text: r.text }), r.act);
      case "diff": {
        const el = UI.diff.render({ file: r.file, add: r.add, rm: r.del, lines: r.lines.map((l) => ({ old: l.o, new: l.n, sign: l.sign === "−" ? "-" : l.sign, text: l.text, sel: l.sel, act: { ev: "ui_line", pos: r.pos, i: l.i } })) });
        el.classList.add("w-in");
        return el;
      }
      case "art": { const el = UI.art.render({ title: `↗ ${r.title}`, meta: r.meta, isNew: r.new, thumb: svg(r.kind) }); el.classList.add("w-in"); return el; }
    }
    return null;
  }

  function thread(v) {
    const t = v.thread;
    if (t.loading) return UI.thread.render({ children: [UI.skel.render({}), h("span", "b-skel w-skel2")] });
    if (t.empty) return UI.thread.render({ children: [UI.empty.render({ title: t.empty.b, text: t.empty.s })] });
    const more = t.more ? withAct(UI.day.render({ text: t.paging ? "loading…" : "earlier messages ↑" }), { ev: "ui_older" }) : null;
    const typing = t.typing ? (() => { const el = UI.tool.render({ text: `${t.typing.who} · ${t.typing.text}`, state: "run" }); el.classList.add("w-in"); return el; })() : null;
    return UI.thread.render({ children: [more, t.rows.map(row), typing] });
  }

  function dock(v) {
    const d = v.composer.dock;
    if (!d) return null;
    const tabs = d.tabs ? UI.tabs.render({ items: d.tabs.map((x) => ({ text: x.text, dot: { state: "nd" }, on: x.on, act: { ev: "ui_inbox", card: x.id } })) }) : null;
    const el = UI.dock.render({ head: d.h, keys: d.k, q: d.q, typeHint: d.ty,
      ctx: d.body || d.shot ? { shot: d.shot ? h("div", "w-shot", svg(d.shot)) : null, body: d.body, origin: d.origin } : null,
      opts: d.opts.map((o) => ({ n: o.n, text: o.label, picked: o.picked, act: { ev: "ui_pick", card: d.card, n: o.n } })) });
    return [tabs, el];
  }

  // ⌘K: the spotlight's look (DS .b-spot) over the window; the field is the page's own
  function findRows(v) {
    const f = v.finder;
    if (!f) return null;
    const rows = f.rows.map((r) => withAct(h("div", ["r", r.on && "on"],
      r.kind === "me" ? UI.pearl.render({ size: 22 }) : UI.dot.render({ state: r.dot, lg: r.kind === "pj" }),
      h("span", null, r.name), h("span", "pp", r.where), h("span", "dm", r.note), h("span", "ky", r.on ? "⏎" : "")), r.act));
    return pearlsIn(h("div", null, f.empty ? h("div", "g", f.empty) : rows, h("div", "keys", f.keys)), v.mood);
  }

  // a project's changes and artifacts tabs (S7 opens the review and the artifact itself)
  function tabList(v) {
    const t = v.tab;
    if (!t) return null;
    if (t.empty) return UI.thread.render({ children: [UI.empty.render({ title: t.empty.b, text: t.empty.s })] });
    if (t.tab === "changes") return UI.thread.render({ children: t.items.map((it) => UI.job.render({ state: it.dot, name: it.name, psi: true, end: it.branch, what: it.what, act: it.act })) });
    return h("div", "w-grid", t.items.map((it) => withAct(h("div", "w-ac", svg(it.kind), h("div", "ai", h("b", null, it.title), it.new ? [" ", UI.chip.render({ text: "new", tone: "acc" })] : null, h("span", "m", it.meta))), it.act)));
  }

  function board(v) {
    const b = v.board;
    if (!b) return null;
    return b.sections.map((sec) => {
      const items = sec.items.map((it) => {
        if (sec.kind === "cards") return UI.job.render({ state: "nd", name: it.who, what: it.text, act: it.act });
        if (sec.kind === "thumbs") return { title: it.title, thumb: svg(it.kind), act: it.act };
        if (sec.kind === "agents") return UI.job.render({ state: it.dot, name: it.name, key: it.key, psi: it.psi, what: it.w, pct: it.pct, act: it.act });
        return UI.job.render({ state: "sched", name: it.text.replace(/^◷ /, ""), end: it.when });
      });
      return [UI.sh.render({ text: sec.sh }), sec.kind === "thumbs" ? UI.thumbs.render({ items }) : items];
    });
  }

  // ---- the pearls: one WebGL renderer per mood, copied into each slot's 2D canvas (a thread
  // has a pearl per bise message; WebKit allows only a few GL contexts)
  const gls = {};
  function glFor(mood) {
    if (gls[mood] !== undefined) return gls[mood];
    const P = root.AmbPearl;
    const cv = doc.createElement("canvas");
    cv.style.cssText = "position:fixed;left:-200px;top:0;width:80px;height:80px;visibility:hidden";
    doc.body.appendChild(cv);
    const p = P && P.create(cv);
    gls[mood] = p && !p.failed ? { p, cv } : null;
    return gls[mood];
  }
  const still = root.matchMedia ? root.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
  function pearls(now) {
    const slots = doc.querySelectorAll("canvas.w-pearl");
    const moods = new Set([...slots].map((c) => c.dataset.mood));
    for (const mood of moods) {
      const g = glFor(mood);
      if (!g) continue;
      g.p.frame({ mood, lvl: 0, still }, now);
      for (const c of slots) if (c.dataset.mood === mood) {
        const x = c.getContext("2d");
        x.clearRect(0, 0, c.width, c.height);
        x.drawImage(g.cv, 0, 0, c.width, c.height);
      }
    }
  }

  // ---- data-qa: a stable name on everything clickable, for the off-screen harness (amb-tools,
  // lead m_8397): read from its act, so a row, a tab, an option or a button is named by what it does
  function qaName(a) {
    const name = (p) => (p === "home" ? "bise" : p);
    switch (a.ev) {
      case "ui_route": return a.agent && a.agent !== "main" ? `route:${name(a.project)}/${a.agent}` : `route:${name(a.project)}`;
      case "ui_tab": case "ui_tab_i": return `tab:${a.tab || a.i}`;
      case "ui_pick": return `opt:${a.n}`;
      case "ui_inbox": return a.card ? `inbox:${a.card}` : "inbox";
      case "ui_fold": return `fold:${a.pos}`;
      case "ui_line": return `line:${a.pos}:${a.i}`;
      case "ui_unquote": return `unquote:${a.i}`;
      case "ui_find_open": return `find:${a.i}`;
      case "ui_set_page": return `page:${a.page}`;
      case "ui_set_pref": return `pref:${a.key}`;
      case "ui_perm_ask": return `perm:${a.perm}`;
      case "ui_acct_sign_in": return `sign-in:${a.id}`;
      case "ui_key_edit": return `key:${a.id}`;
      case "ui_onb_pick": case "ui_add_pick": return `pick:${a.path}`;
      case "ui_add_toggle": return `add-choice:${a.key}`;
      case "ui_set_move": return `move:${a.project}`;
      case "ui_set_remove": return `remove:${a.project}`;
      default: return String(a.ev || "").replace(/^ui_/, "").replace(/_/g, "-");
    }
  }
  function qa(rootEl) {
    for (const n of rootEl.querySelectorAll("[data-act]")) {
      try { n.setAttribute("data-qa", qaName(JSON.parse(n.getAttribute("data-act")))); } catch (e) { /* not ours */ }
    }
  }

  // ---- mount: the static frame, then regions redrawn when their HTML changes
  function mount(el, { post, recv: hook, wire = false }) {
    el.innerHTML = `<div class="w-app b-ui"><aside class="w-side"></aside><main class="b-main w-main"><div class="w-head"></div><div class="w-jobs"></div>` +
      `<div class="w-scroll"><div class="w-thread"></div></div><div class="w-full" hidden></div><div class="w-over" hidden></div><div class="w-toast"></div><div class="w-find" hidden><div class="b-spot"><div class="in"><input class="tx w-findq" placeholder="find an agent or a project" spellcheck="false"></div><div class="w-findrows"></div></div></div><div class="b-composer w-composer"><div class="w-dock"></div><div class="w-quotes"></div><div class="div"></div>` +
      `<div class="box"><textarea class="in w-field" rows="1" spellcheck="false"></textarea><span class="send off" data-act='{"ev":"ui_send"}'>↑</span></div><div class="keys"></div></div></main><aside class="w-board b-board"></aside></div>`;
    const $ = (sel) => el.querySelector(sel);
    el.querySelector(".w-field").setAttribute("data-qa", "composer");
    el.querySelector(".w-findq").setAttribute("data-qa", "finder");
    const R = { side: $(".w-side"), head: $(".w-head"), jobs: $(".w-jobs"), thread: $(".w-thread"), scroll: $(".w-scroll"), dock: $(".w-dock"), quotes: $(".w-quotes"),
      div: $(".w-composer .div"), field: $(".w-field"), box: $(".w-composer .box"), send: $(".w-composer .send"), keys: $(".w-composer .keys"), board: $(".w-board"), app: $(".w-app"),
      full: $(".w-full"), over: $(".w-over"), toast: $(".w-toast"), find: $(".w-find"), findq: $(".w-findq"), findrows: $(".w-findrows") };
    const api = {};
    let s = M.init(Date.now());
    if (root.AMB_WIN_TZ) s = { ...s, tz: root.AMB_WIN_TZ };
    // the real core (S3b): the window says what it shows, bise's hub travels under its id
    if (wire) s = { ...s, wire: true };
    const last = {};
    let lastRoute = "";
    let lastTitle = "";
    let toastAt = null;

    // a region is redrawn only when its markup changes (the pearls' canvases and the scroll stay)
    function put(name, content) {
      const box = doc.createElement("div");
      UI.core.add(box, [content]);
      const html = box.innerHTML;
      if (last[name] === html) return false;
      last[name] = html;
      R[name].replaceChildren(...box.childNodes);
      qa(R[name]);
      return true;
    }

    function draw() {
      const v = V.view(s);
      const html = doc.documentElement;
      if (html.dataset.theme !== v.theme) {
        // a theme change is instant, as macOS's: no 140 ms fade of every card (and a fade
        // that never runs, in a page with no frames, leaves the old theme's colors)
        html.classList.add("w-theme-switch");
        html.dataset.theme = v.theme;
        if (doc.defaultView && doc.body) doc.defaultView.getComputedStyle(doc.body).color;
        html.classList.remove("w-theme-switch");
      }
      R.app.classList.toggle("is-inactive", !v.focused);
      R.app.classList.toggle("w-two", !v.board);
      put("side", side(v));
      put("head", head(v));
      put("jobs", jobs(v));
      // the setup screens (S11): onboarding and settings take the whole window, the add sheet
      // sits over it
      const SC = root.AmbWinScreens && root.AmbWinScreens.make(UI);
      R.full.hidden = !v.setup;
      if (SC) put("full", v.setup ? (v.setup.kind === "onboarding" ? pearlsIn(SC.onboarding(v.setup), v.mood) : SC.settings(v.setup)) : null);
      R.over.hidden = !v.sheet;
      if (SC) put("over", v.sheet ? SC.sheet(v.sheet) : null);
      // the core's error: one line over the window, gone after 6 s or with 'close'
      put("toast", v.toast ? UI.toast.render({ text: v.toast.text, err: true, action: v.toast.close }) : null);
      if (v.toast && v.toast.at !== toastAt && root.setTimeout) { const at = (toastAt = v.toast.at); root.setTimeout(() => feed({ ev: "ui_toast_close", at }), 6000); }
      const keyin = el.querySelector(".w-keyin");
      if (keyin && doc.activeElement !== keyin) keyin.focus();
      const routeKey = `${v.route.screen || ""}${v.route.project}/${v.route.agent}`;
      const atEnd = R.scroll.scrollHeight - R.scroll.scrollTop - R.scroll.clientHeight < 40;
      const changed = put("thread", v.s7 && root.AmbWinS7 ? root.AmbWinS7.draw(v.s7, UI) : v.tab ? tabList(v) : thread(v));
      // ⌘K's finder: shown over the window, its field takes the keys while it is open
      const wasOpen = !R.find.hidden;
      R.find.hidden = !v.finder;
      put("findrows", findRows(v));
      if (v.finder && R.findq.value !== v.finder.q) R.findq.value = v.finder.q;
      if (v.finder && v.finder.ph && R.findq.placeholder !== v.finder.ph) R.findq.placeholder = v.finder.ph;
      if (v.finder && !wasOpen) R.findq.focus();
      if (!v.finder && wasOpen) R.field.focus();
      if (routeKey !== lastRoute || (changed && atEnd)) R.scroll.scrollTop = R.scroll.scrollHeight;
      put("dock", dock(v));
      put("quotes", v.composer.quotes.map((q) => UI.quote.render({ text: q.text.replace(/^❝ /, ""), act: { ev: "ui_unquote", i: q.i } })));
      // the line says what his words will do: answering a question in the accent, its esc hint
      R.div.replaceChildren(h("span", v.composer.divAcc ? "w-acc" : null, v.composer.div), v.composer.divHint ? h("span", "w-divhint", v.composer.divHint) : "");
      R.field.placeholder = v.composer.ph;
      if (R.field.value !== v.composer.text) R.field.value = v.composer.text;
      R.send.className = `send ${v.composer.send}`;
      R.send.textContent = v.composer.send === "stop" ? "■" : "↑";
      R.send.dataset.act = JSON.stringify(v.composer.send === "stop" ? { ev: "ui_stop" } : { ev: "ui_send" });
      R.send.dataset.qa = v.composer.send === "stop" ? "stop" : "send";
      el.querySelector(".w-composer").classList.toggle("is-disabled", v.composer.disabled);
      R.keys.textContent = v.composer.keys;
      put("board", board(v));
      if (routeKey !== lastRoute) { lastRoute = routeKey; R.field.focus(); }
      if (v.title !== lastTitle) { lastTitle = v.title; doc.title = v.title; }
      fit();
    }
    // the field grows a line at a time, up to 40% of the window (DS composer)
    function fit() { R.field.style.height = "auto"; R.field.style.height = `${Math.min(Math.round((root.innerHeight || 800) * 0.4), R.field.scrollHeight)}px`; }

    function feed(ev) {
      const r = M.step(s, ev);
      s = r.s;
      for (const c of r.cmds) post(c);
      draw();
      if (hook) hook(ev, s, r);
      if (api.onDraw) api.onDraw();
      return r;
    }

    // clicks: the nearest data-act; a diff line selects (shift extends)
    el.addEventListener("click", (e) => {
      const a = e.target.closest("[data-act]");
      if (!a) return;
      const ev = JSON.parse(a.dataset.act);
      // a diff line: shift extends the selection; the header's segmented control names its tab
      if (ev.ev === "ui_line") ev.shift = e.shiftKey;
      if (ev.ev === "ui_tab_i") { ev.ev = "ui_tab"; ev.tab = ["thread", "changes", "artifacts"][ev.i]; }
      if (ev.values && ev.i != null) { ev.value = ev.values[ev.i]; delete ev.values; delete ev.i; }
      feed(ev);
      if (!e.target.closest("textarea") && R.find.hidden && R.full.hidden && R.over.hidden) R.field.focus();
    });
    // a sentence selected in a message becomes a quote when he lets go
    el.addEventListener("mouseup", () => {
      const sel = root.getSelection && root.getSelection();
      const text = sel && String(sel);
      if (!text || !text.trim()) return;
      const node = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
      const host = node && node.closest("[data-quote]");
      if (!host) return;
      feed({ ev: "ui_quote_text", pos: +host.dataset.quote, text });
      sel.removeAllRanges();
      R.field.focus();
    });
    R.field.addEventListener("input", () => { feed({ ev: "ui_type", text: R.field.value }); });
    R.findq.addEventListener("input", () => { feed({ ev: "ui_find_type", text: R.findq.value }); });
    // an API key's field (the setup screens) reports its words
    el.addEventListener("input", (e) => {
      const c = e.target.classList;
      if (c && c.contains("w-keyin")) feed({ ev: "ui_key_type", text: e.target.value });
      if (c && c.contains("w-pathin")) feed({ ev: "ui_add_type", text: e.target.value });
    });
    // settings › projects: a row's handle drags it, a drop on another row takes that row's place
    // (the order of ⌘1-9)
    let dragged = null;
    el.addEventListener("dragstart", (e) => {
      const g = e.target.closest && e.target.closest("[data-drag]");
      if (!g) return;
      dragged = JSON.parse(g.getAttribute("data-drag")).project;
      if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", dragged); }
    });
    el.addEventListener("dragover", (e) => { if (dragged && e.target.closest && e.target.closest("[data-order]")) e.preventDefault(); });
    el.addEventListener("drop", (e) => {
      const row = dragged && e.target.closest && e.target.closest("[data-order]");
      const project = dragged;
      dragged = null;
      if (!row) return;
      e.preventDefault();
      feed({ ev: "ui_set_move", project, order: +row.getAttribute("data-order") });
    });
    el.addEventListener("dragend", () => { dragged = null; });
    R.find.addEventListener("mousedown", (e) => { if (e.target === R.find) feed({ ev: "ui_find_close" }); });
    R.scroll.addEventListener("scroll", () => { if (R.scroll.scrollTop < 20) feed({ ev: "ui_older" }); });
    // keys: e.code gives the digit under ⌥ (macOS turns ⌥1 into ¡)
    doc.addEventListener("keydown", (e) => {
      if (e.isComposing) return;
      const m = /^Digit([0-9])$/.exec(e.code || "");
      const r = feed({ ev: "ui_key", key: e.key, digit: m ? +m[1] : null, meta: e.metaKey, alt: e.altKey, ctrl: e.ctrlKey, shift: e.shiftKey });
      if (r.eat) e.preventDefault();
    }, true);

    // the pearls breathe; the clock ticks once a minute
    let raf = 0;
    const loop = (t) => { pearls(t); raf = root.requestAnimationFrame(loop); };
    if (root.requestAnimationFrame) raf = root.requestAnimationFrame(loop);

    const st = M.start(s);
    s = st.s;
    draw();
    for (const c of st.cmds) post(c);
    Object.assign(api, { feed, state: () => s, view: () => V.view(s), stop: () => root.cancelAnimationFrame(raf), draw });
    return api;
  }

  // the page's entry: the app's bridge when the app booted us (amb-mac's mark window.ambientApp =
  // {mac, window}, and webkit's handler), else the fake core
  function boot(el, opts = {}) {
    const wk = root.webkit && root.webkit.messageHandlers && root.webkit.messageHandlers.bise;
    const app = !!(root.ambientApp && root.ambientApp.window && wk) && !opts.fake;
    if (app) {
      const post = (cmd) => wk.postMessage(cmd);
      const w = mount(el, { post, wire: true });
      root.ambient = { recv: (ev) => w.feed(typeof ev === "string" ? JSON.parse(ev) : ev) };
      // the title bar is the page's: the sidebar's width (the native vibrancy under it) and the
      // rects that move the window (the lights' strip, the thread's head), in CSS px
      let sent = "";
      const size = () => {
        const r = (q) => { const b = el.querySelector(q); if (!b) return null; const x = b.getBoundingClientRect(); return [Math.round(x.left), Math.round(x.top), Math.round(x.width), Math.round(x.height)]; };
        const cmd = { cmd: "win_size", sidebar: Math.round(el.querySelector(".w-side").getBoundingClientRect().width), drag: [r(".w-side .b-lights"), r(".w-head .b-head")].filter(Boolean) };
        const k = JSON.stringify(cmd);
        if (k !== sent) { sent = k; post(cmd); }
      };
      size();
      root.addEventListener("resize", size);
      w.onDraw = size;
      return w;
    }
    const F = root.AmbWinFake;
    let player = null;
    const queue = [];
    const post = (cmd) => { if (opts.log) opts.log(cmd); if (player) player.post(cmd); else queue.push(cmd); };
    const w = mount(el, { post, recv: opts.recv });
    // #fresh: a first install (the onboarding's world: nothing signed in, nothing allowed)
    if (/fresh/.test((root.location && root.location.hash) || "") && root.AmbWinFake11) root.AmbWinFake11.fresh();
    player = F.player((ev) => w.feed(ev));
    for (const c of queue.splice(0)) player.post(c);
    root.ambient = { recv: (ev) => w.feed(ev) };
    // a plain browser opens a screen from the address: #agent/storefront/search, #inbox, #light
    const hash = decodeURIComponent((root.location && root.location.hash) || "").slice(1);
    for (const part of hash.split("&").filter(Boolean)) {
      if (part === "fresh") continue;
      if (part === "light" || part === "dark") w.feed({ ev: "win_theme", dark: part === "dark" });
      else w.feed({ ev: "win_open", route: part });
    }
    return w;
  }

  // thumb(kind): an artifact's svg thumbnail (S7's artifacts screen draws with it)
  root.AmbWinUI = { mount, boot, esc, thumb: svg };
})(typeof window !== "undefined" ? window : globalThis);
