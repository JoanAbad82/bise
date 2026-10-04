// bise ambient · the bar on screen (round 9, ambient's identity9.html#spec): the bridge to the
// app, the DOM, the animation frame. The app calls window.ambient.recv(ev) for every core and
// app_* event; the page posts its cmds to window.webkit.messageHandlers.bise (in a browser: to
// window.ambientDev, the fake core). model.js decides, bar.js turns its view into the bar's
// blocks, this file only draws them.
(function () {
  "use strict";
  // one bar per page: a second run of this file (an injected copy) would answer every click twice
  if (window.ambient && window.ambient.ui) return;
  const { AmbModel: M, AmbPearl, AmbWords: Wd, AmbBar: Bar } = window;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const native = () => !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.bise);
  if (native() || window.ambientApp) document.documentElement.classList.add("app");

  // ---- the DOM, once: the panel's box (transparent), the pearl free at the glass's left, the
  // glass with its header row, level line, big line or text, body of rows and footer.
  // VoiceOver: the bar is a region named bise, the pearl an image whose label says its mood; what
  // changes is read once from one polite live line; rows and footer hints are buttons
  const host = $("#amb") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "amb" }));
  host.classList.add("amb");
  host.setAttribute("role", "region");
  host.setAttribute("aria-label", "bise");
  host.innerHTML = `
    <div class="bar" id="bar">
      <canvas class="pearl" role="img" aria-label="bise"></canvas>
      <div class="glass" id="glass">
        <div class="say" aria-live="polite" aria-atomic="true" data-qa-info="1"></div>
        <div class="gin"><div class="head"></div><div class="level" aria-hidden="true"></div><div class="mid"></div><div class="body"></div><div class="foot"></div></div>
      </div>
    </div>`;
  const bar = $(".bar", host), glass = $(".glass", bar), gin = $(".gin", glass), sayEl = $(".say", glass), pearlCv = $(".pearl", bar);
  const el = { head: $(".head", gin), level: $(".level", gin), mid: $(".mid", gin), body: $(".body", gin), foot: $(".foot", gin) };
  bar.style.left = Bar.BOX.left + "px"; bar.style.top = Bar.BOX.top + "px";
  // the typed line: one field, kept across draws (its focus, its caret)
  const input = Object.assign(document.createElement("input"), { type: "text", spellcheck: false, autocomplete: "off", className: "qin" });
  input.dataset.qa = "field";
  glass.dataset.qa = "glass";
  const pearl = AmbPearl.create(pearlCv);

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
  // a key, or a chord as caps side by side ('–' a dash between them, never a '+')
  const caps = (keys) => (keys || []).map((k) => (k === "–" ? `<span class="dash">–</span>` : `<kbd class="k">${esc(k)}</kbd>`)).join("");
  const act = (a) => (a ? ` data-act="${esc(JSON.stringify(a))}"` : "");
  const hint = (it, cls = "fi") => {
    const inner = `${it.pre ? `<span>${esc(it.pre)}</span>` : ""}${caps(it.keys)}${it.w ? `<span>${esc(it.w)}</span>` : ""}`;
    // data-qa (amb-tools' real clicks, lead m_6586): 'full-text', else 'hint-<keys>' ('hint-fn-esc')
    const qa = it.act && it.act.ev === "ui_ask_more" ? "full-text" : `hint-${it.keys.filter((k) => k !== "–").join("-")}`;
    // data-key (ambient m_6592 via amb-tools m_6594): the hint's keys as shown ('fn esc', 'fn 1–3', '⌘ ⏎')
    const dk = it.keys.join(" ").replace(/ – /g, "–");
    return it.act ? `<button type="button" class="${cls}" data-qa="${esc(qa)}" data-key="${esc(dk)}"${act(it.act)}>${inner}</button>` : `<span class="${cls} info" data-qa-info="1">${inner}</span>`;   // only info ('↑↓ move'): not a target (ambient's gate (3))
  };

  // words that land one by one: keep the spans that are the same, light the ones said
  function words(node, w) {
    const kids = node.querySelectorAll(".w");
    let same = 0;
    const code = (i) => !!(w.code && w.code[i]);
    while (same < kids.length && same < w.list.length && kids[same].dataset.w === w.list[same] && kids[same].classList.contains("code") === code(same)) same++;
    if (same < kids.length) { node.textContent = ""; same = 0; }
    for (let i = same; i < w.list.length; i++) {
      const s = document.createElement("span");
      s.className = code(i) ? "w code" : "w"; s.dataset.w = w.list[i]; s.textContent = w.list[i];
      if (node.childNodes.length) node.appendChild(document.createTextNode(" "));
      node.appendChild(s);
    }
    const spans = node.querySelectorAll(".w");
    const lit = w.lit == null ? w.list.length : w.lit;
    requestAnimationFrame(() => spans.forEach((s, i) => s.classList.toggle("on", i < lit)));
  }

  function head(h) {
    if (!h) return "";
    const right = !h.right ? "" : h.right.keys ? hint(h.right, "rk") : `<span class="rk">${esc(h.right.text)}</span>`;
    let left;
    if (h.lab) left = `<div class="lab">${h.lab.acc ? `<span class="a">${esc(h.lab.acc)}</span>${h.lab.rest ? " · " : ""}` : ""}${esc(h.lab.rest || "")}</div><span class="sp"></span>`;
    else if (h.input) left = `<div class="q in"></div>`;
    else {
      const L = h.line;
      left = `<div class="q${L.ph ? " ph" : ""}${L.size ? " " + L.size : ""}">${L.words ? "" : `${L.glyph ? `<span class="gl ${L.gc || ""}">${esc(L.glyph)}</span> ` : ""}${esc(L.text)}`}</div>`;
    }
    return `<div class="inrow h${h.h}">${left}${right}</div>`;
  }

  // the rows, without their selection (a move must not replay the rows' rise)
  let rowRight = [];
  // quiet: drawn as the bar appears, the rows come with it (no rise, no stagger: ambient m_6574)
  function body(sections, quiet) {
    rowRight = [];
    let n = 0;
    return sections.map((sec) => (sec.label ? `<div class="lab sec${sec.acc ? " acc" : ""}" role="heading" aria-level="2">${esc(sec.label)}</div>` : "") + sec.rows.map((r) => {
      const i = n++;
      const right = !r.right ? "" : r.right.sw != null ? `<span class="sw${r.right.sw ? " on" : ""}" aria-hidden="true"></span>` : r.right.age ? esc(r.right.age) : caps(r.right.keys);
      rowRight.push({ right, sw: !!(r.right && r.right.sw != null) });
      const g = r.gk ? caps([r.g]) : esc(r.g || "");
      const tag = r.fixed || !r.act ? "div" : "button";
      const role = r.right && r.right.sw != null ? ` role="switch" aria-checked="${!!r.right.sw}"` : "";
      return `<${tag}${tag === "button" ? ' type="button"' : ""} class="row${r.fixed ? " fixed" : ""}${r.seen ? " seen" : ""}" data-r="${i}" data-row="${i}" data-qa="${esc(r.qa || `row-${i}`)}"${act(r.act)}${role} style="${quiet ? "animation:none" : `animation-delay:${i * 20}ms`}"><span class="g ${r.gc || ""}" aria-hidden="true">${g}</span><span class="t">${esc(r.t)}${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</span><span class="s">${right}</span></${tag}>`;
    }).join("")).join("");
  }
  const strip = (sections) => sections.map((s) => ({ ...s, rows: s.rows.map(({ sel, ...r }) => r) }));
  const sels = (sections) => sections.flatMap((s) => s.rows.map((r) => !!r.sel));

  // ---- show and hide (the user via ambient m_6574): the bar appears at its final size, already
  // filled, with a quick fade and a 4 px drop, and leaves the same way in 0.12 s with its last
  // words drawn (style.css); while it shows, a content change eases the height and new rows rise
  // 20 ms apart; for the first frames of a show (.appear) neither happens
  let appearT = 0;
  function render(v, s) {
    host.classList.toggle("still", !!v.still);
    bar.dataset.state = v.state;
    const on = !v.hidden && !!s.head;
    if (on && !bar.classList.contains("on")) {
      bar.classList.add("appear");
      clearTimeout(appearT);
      appearT = setTimeout(() => bar.classList.remove("appear"), 250);
    }
    show(bar, on);
    pearlCv.classList.toggle("big", v.state === "listening" || v.state === "voice_note");
    put("a11y", JSON.stringify([v.mood, v.hidden]), () => pearlCv.setAttribute("aria-label", Wd.moodLabel(v.mood)));
    const say = v.hidden ? "" : Wd.sayOf(v);
    if (sayEl.textContent !== say) sayEl.textContent = say;

    // the hello's kiss (ambient m_5702): 6 pink and cream dots rising off the pearl's top right
    put("puff", v.puff ? "on" : "", () => {
      const old = $(".puff", bar);
      if (old) old.remove();
      if (!v.puff) return;
      const p = document.createElement("div");
      p.className = "puff"; p.setAttribute("aria-hidden", "true");
      const DOTS = [[0, 0, 0, 3], [4, -3, 0.06, 2], [-2, -5, 0.1, 2.5], [6, 1, 0.14, 2], [2, -8, 0.18, 3], [8, -4, 0.22, 2.5]];
      p.innerHTML = DOTS.map(([x, y, d, z]) => `<i style="left:${x}px;top:${y}px;width:${z}px;height:${z}px;animation-delay:${d}s"></i>`).join("");
      bar.appendChild(p);
    });

    const h = s.head;
    const hk = h && { ...h, line: h.line && { ...h.line, words: h.line.words ? 1 : 0 }, input: h.input ? 1 : 0 };
    if (put("head", JSON.stringify(hk), () => {
      el.head.innerHTML = head(h);
      const slot = $(".q.in", el.head);
      if (slot) slot.appendChild(input);
      last.words = null;
    }) && h && h.input) setTimeout(() => input.focus(), 0);
    if (h && h.input) {
      if (input.value !== h.input.text && document.activeElement !== input) input.value = h.input.text;
      if (input.placeholder !== h.input.ph) { input.placeholder = h.input.ph; input.setAttribute("aria-label", h.input.ph); }
    } else if (document.activeElement === input) input.blur();
    const w = h && h.line && h.line.words;
    put("words", JSON.stringify(w && [w.list, w.code, w.lit]), () => { const q = $(".q", el.head); if (q && w) words(q, w); });

    show(el.level, s.level != null);
    if (s.level != null) el.level.style.transform = `scaleX(${(0.25 + 0.75 * Math.min(1, s.level)).toFixed(3)})`;

    put("mid", JSON.stringify([s.big, s.text]), () => {
      const t = s.text;
      // the card's body takes a real click (pm's fail 45): the question's full text, the drafts'
      // big line their first row (review)
      el.mid.innerHTML = (s.big ? `<div class="big"${s.bigAct ? ` data-qa="body"${act(s.bigAct)}` : ""}>${esc(s.big)}</div>` : "")
        + (t ? `<div class="text${t.clamp && !t.full ? " clamp" : ""}${t.dim ? " dim" : ""}"${t.act ? ` data-qa="body"${act(t.act)}` : ""}>${esc(t.s)}</div>` : "");
      show(el.mid, s.big || t);
    });
    const rowsOn = s.sections.some((x) => x.rows.length || x.label);
    put("body", JSON.stringify(strip(s.sections)), () => { el.body.innerHTML = body(s.sections, bar.classList.contains("appear") || !on); el.body.scrollTop = 0; last.sel = null; show(el.body, rowsOn); });
    // the selected row: soft pink, its glyph pink, a ⏎ cap on the right (a switch keeps its switch)
    put("sel", JSON.stringify(sels(s.sections)), () => {
      const on = sels(s.sections);
      el.body.querySelectorAll(".row").forEach((r) => {
        const i = +r.dataset.r, sel = !!on[i], rr = rowRight[i] || { right: "" };
        r.classList.toggle("sel", sel);
        if (r.tagName === "BUTTON" && !rr.sw) r.setAttribute("aria-selected", String(sel));
        $(".s", r).innerHTML = sel && !rr.sw ? caps(["⏎"]) : rr.right;
        if (sel) r.scrollIntoView({ block: "nearest" });
      });
    });
    put("foot", JSON.stringify(s.foot), () => {
      const f = s.foot;
      el.foot.innerHTML = f ? f.left.map((it) => hint(it)).join("") + `<span class="sp"></span>` + f.right.map((it) => hint(it)).join("") : "";
      show(el.foot, f);
    });
  }

  // ---- the glass's height follows its content (0.32 s ease-out, the top fixed); past 70% of the
  // screen the rows scroll inside; the panel follows the glass (app_size: the box and the glass)
  let sent = "";
  function layout() {
    const screenH = window.screen && screen.availHeight ? screen.availHeight : 900;
    const maxH = Math.round((native() || window.ambientApp ? screenH : Math.max(screenH, innerHeight)) * 0.7);
    el.body.style.maxHeight = "";
    const fixed = gin.scrollHeight - el.body.scrollHeight;
    if (gin.scrollHeight > maxH) el.body.style.maxHeight = Math.max(88, maxH - fixed) + "px";
    const h = Math.min(maxH, Math.ceil(gin.scrollHeight)) || 68;
    if (glass.style.height !== h + "px") glass.style.height = h + "px";
    // the bar gone (nothing to show): no glass in the same frame, so the native blur never stays
    // without the page's glass (ambient m_6681 (3); amb-mac reads glass null as no glass)
    // the glass is there whenever the bar has something to show, even while the app still keeps
    // the panel hidden (the app shows it from that glass: saying null while hidden left the bar
    // empty at ambient's sign-off, ed63487d); null only when nothing is left to show
    const msg = Bar.size(h, 26, !!(lastS && lastS.head));
    const key = JSON.stringify(msg);
    if (key !== sent) { sent = key; post(msg); }
  }

  // ---- the frame loop: runs while something moves, sleeps when the bar is settled
  let raf = 0, lastV = null, lastS = null, contentSent = "", retryAt = 0;
  const fps = { frames: 0, since: now(), value: 0 };
  // a frame never waits on requestAnimationFrame alone: WebKit suspends it while it thinks the page
  // is hidden (document.hidden stayed true in the QA app with the panel shown, so the bar never
  // drew: ambient's empty-bar sign-off); hidden, a timer runs the frame, and a 100 ms backup runs
  // one that rAF never delivered
  let rafBackup = 0;
  function schedule() {
    if (raf) return;
    if (document.hidden) { raf = setTimeout(frame, 16); return; }
    raf = requestAnimationFrame(frame);
    clearTimeout(rafBackup);
    rafBackup = setTimeout(() => { if (raf) { cancelAnimationFrame(raf); raf = 0; frame(); } }, 100);
  }
  document.addEventListener("visibilitychange", () => { if (raf) { cancelAnimationFrame(raf); clearTimeout(raf); raf = 0; } schedule(); });
  function frame() {
    raf = 0; clearTimeout(rafBackup);
    const t = now();
    const now0 = M.view(model, t, Date.now());
    const v = held(now0);
    lastV = now0;
    const s = Bar.spec(v);
    lastS = s;
    // while a press is down, the bar is not redrawn: a click that makes the panel key switches the
    // footer from fn chords to plain keys, and a redraw between mouse down and up lost the click
    // (pm's fail 47); the press's end redraws
    if (!pressing) { render(v, s); layout(); }
    // what the bar has to show, on every change: the app's show/hide policy acts on it
    const ck = JSON.stringify(v.content);
    if (ck !== contentSent) { contentSent = ck; post({ cmd: "app_content", ...v.content }); }
    // can't reach bise: try again on its own every 10 s while it shows
    if (v.state === "offline") { if (t - retryAt > 10000) { if (retryAt) recv({ ev: "ui_retry", auto: true }); retryAt = t; } } else retryAt = 0;
    let moving = false;
    if (!v.unseen) moving = pearl.frame({ mood: v.mood, lvl: v.lvl, still: v.still, gather: v.gather || 0 }, t);
    else if (pearl.fit) pearl.fit();
    fps.frames++;
    if (t - fps.since > 1000) { fps.value = Math.round((fps.frames * 1000) / (t - fps.since)); fps.frames = 0; fps.since = t; }
    // the pearl moves at 30 Hz at most (SPEC §1); still, it checks again at ~15 Hz; nobody seeing
    // the bar (hidden, covered, locked: app_visible false) keeps only the timers, at 4 Hz
    if (v.unseen) later(250); else if (moving || s.level != null) later(33); else later(66);
  }
  // the glass leaves with its last words on it: when nothing is left to show (content none), the
  // bar keeps drawing the last view it showed until the app hides it; new content ends the hold
  let shown = null;
  function held(v) {
    const h = M.hold(shown, v);
    shown = h.shown;
    return h.v;
  }
  let laterT = 0;
  function later(ms) { if (!laterT && !raf) laterT = setTimeout(() => { laterT = 0; schedule(); }, ms); }

  // ---- input: every row and every footer hint is a real button; a click = its key
  // ⌘ C: the answer, or what he said when bise can't be reached (the page's clipboard, and the
  // app's too: app_copy)
  function copy(text) {
    if (!text) return;
    post({ cmd: "app_copy", text });
    try { navigator.clipboard.writeText(text).catch(() => {}); } catch { /* the app's copy stands */ }
  }
  // one press, one act: the same act again within 400 ms is the same press delivered twice (pm's
  // fail 46: one click answered twice in the app)
  let lastAct = "", lastActAt = -1e9;
  function run(a) {
    if (!a) return false;
    const k = JSON.stringify(a), t = now();
    if (k === lastAct && t - lastActAt < 400) return true;
    lastAct = k; lastActAt = t;
    if (a.ev === "ui_copy") copy(a.text); else recv(a);
    return true;
  }
  // a press acts on its release over the same target (pointerup), and the click after it is the
  // same act (deduped above): the first click on a pushed card makes the panel key, and WebKit does
  // not always turn that press into a click (pm's fail 47); a press longer than 1.5 s, or one that
  // never ends, frees the redraw anyway
  let pressing = false, pressEl = null, pressT = 0;
  const release = () => { clearTimeout(pressT); pressEl = null; if (pressing) { pressing = false; schedule(); } };
  host.addEventListener("pointerdown", (e) => {
    pressing = true; pressEl = e.target.closest("[data-act]");
    clearTimeout(pressT); pressT = setTimeout(release, 1500);
  });
  window.addEventListener("pointerup", (e) => {
    const b = e.target && e.target.closest ? e.target.closest("[data-act]") : null;
    if (b && b === pressEl && host.contains(b)) { try { run(JSON.parse(b.dataset.act)); } catch (err) { console.error("act", err); } }
    setTimeout(release, 0);
  }, true);
  window.addEventListener("pointercancel", release, true);
  window.addEventListener("blur", release);
  host.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || !host.contains(b)) return;
    try { run(JSON.parse(b.dataset.act)); } catch (err) { console.error("act", err); }
  });
  input.addEventListener("input", () => recv({ ev: "ui_spot_type", text: input.value }));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); recv({ ev: "ui_spot_send", text: input.value }); }
    else if (e.key === "Tab") { e.preventDefault(); recv({ ev: "ui_spot_tab", text: input.value }); }
    else if (e.key === "Escape") { e.preventDefault(); recv({ ev: "ui_close" }); }
    e.stopPropagation();
  });
  // plain keys while the bar has them (the app gives the panel the keys only when he opened it or
  // clicked a pushed card): ↑↓ ⏎ 1-9 esc, ⌘⏎ the question's full text
  // an open bar (fn 0, fn i, fn p, settings, can't reach bise): ↑↓ over every row, ⏎ runs the
  // selected row, ⌘ 1-9 opens that page, space flips a switch, ⌫ removes an app (ambient's keymap)
  document.addEventListener("keydown", (e) => {
    if (e.target === input || e.ctrlKey) return;
    const s = lastS, st = lastV && lastV.state;
    const asking = st === "needs" && !model.pane;
    const open = !!model.pane || st === "offline";
    const stop = () => e.preventDefault();
    if (asking && e.metaKey && e.key === "Enter") { stop(); recv({ ev: "ui_ask_more" }); return; }
    if (e.metaKey) {
      if (!s) return;
      if (/^[1-9]$/.test(e.key) && open) { const r = Bar.cmdRow(s, e.key); if (r) { stop(); run(r.act); } return; }
      if (e.key.toLowerCase() === "c") {
        const it = (s.foot ? s.foot.left : []).concat(s.sections.flatMap((x) => x.rows)).find((x) => x.act && x.act.ev === "ui_copy");
        if (it) { stop(); run(it.act); }
        return;
      }
      if (e.key === "Enter" && st === "offline") { stop(); recv({ ev: "ui_terminal" }); }
      return;
    }
    if (open && s && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      stop(); recv({ ev: "app_key", key: e.key === "ArrowUp" ? "up" : "down", local: true, n: Bar.selectable(s).length }); return;
    }
    if (open && s && e.key === "Enter") { const r = Bar.selRow(s); if (r) { stop(); run(r.act); return; } }
    if (st === "settings" && s && (e.key === " " || e.key === "Backspace")) {
      const r = Bar.selRow(s);
      const ok = r && (e.key === " " ? r.right && "sw" in r.right : r.act.key === "skip_remove");
      if (ok) { stop(); run(r.act); }
      return;
    }
    const k = { Escape: "esc", ArrowUp: "up", ArrowDown: "down", Enter: "enter" }[e.key] || (/^[1-9p]$/.test(e.key) ? e.key : null);
    if (k && (open || asking || k === "esc") && !(k === "enter" && !asking && !open)) { stop(); recv({ ev: "app_key", key: k, local: true }); }
  });

  window.ambient = {
    recv,
    // for dev.html and the checks: start over, read what shows
    ui: true,
    reset() { model = M.init(); for (const k in last) delete last[k]; schedule(); },
    model: () => model,
    view: () => lastV,
    bar: () => lastS,
    fps: () => fps.value,
  };
  schedule();
})();
