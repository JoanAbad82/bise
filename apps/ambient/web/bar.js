// bise ambient · round 9's bar (ambient's identity9.html#spec, the user's 'oui, construisez-la'):
// one 700 px glass for every state, the pearl free to its left. This file is pure: it turns the
// model's view into the bar's blocks (a header row, a big line or a text, sections of 44 px rows
// with their key on the right, a footer of key hints); ui.js draws them, check.mjs reads them.
//
//   spec(v) -> { kind, mood, head, level, big, text, sections, foot }
//   head:  { h: 68|52, line?: { text?, words?, ph?, size?: "big", glyph?, gc? }, input?: { text, ph },
//            lab?: { acc, rest }, right?: item | { text } }
//   row:   { g, gk?: true (the glyph is a keycap), gc?: "a"|"ok"|"risk", t, sub?, seen?, fixed?,
//            right?: { keys } | { age } | { sw }, sel?, act? }
//   item:  { pre?, keys: [...], w?, act? }   (a key '–' is drawn as a dash between caps)
//   act:   the event a click sends to the model (a click = its key)
(function (root) {
  "use strict";
  const Wd = root.AmbWords, W = Wd.W, B = W.bar;
  const key = (k) => ({ ev: "app_key", key: k, local: true });
  // who asks, on a card row: the global main is called bise on ambient surfaces (v9; ambient m_8725)
  const asker = (agent) => (!agent || agent === "main" ? "bise" : agent);
  const item = (keys, w, act, pre) => ({ ...(pre ? { pre } : {}), keys, ...(w ? { w } : {}), ...(act ? { act } : {}) });
  const PERMS = ["accessibility", "mic", "screen"];

  // a pushed card (a question, drafts) never takes the keys: fn chords until he clicks it
  // (ambient m_6519 FOCUS AND KEYS); clicked, the plain keys
  // an approval (ambient m_8772): words never act on it, so no 'or hold fn and say it': 'pick 1 or 2'
  function askFoot(n, focused, pick) {
    const range = (pre) => [...pre, "1", "–", String(n)];
    // a range ('fn 1 – 2 pick') is info, like '↑↓ move': the rows are its targets (ambient m_6681 (2))
    const left = focused
      ? [item(range([]), B.pick), item(["↑", "↓"], B.move), item(["esc"], B.later, key("esc"))]
      : [item(range(["fn"]), B.pick), item(["fn", "⏎"], B.openInBise, key("enter")), item(["fn", "esc"], B.later, key("esc"))];
    return { left, right: [pick ? item([], pick) : item(["fn"], B.sayIt, null, B.orHold)] };
  }

  // a path under his home, as ~/…
  const home = (p) => String(p).replace(/^\/Users\/[^/]+(?=\/|$)/, "~");

  // the line a key's answer, a flash or an error says, its glyph colored by what it is
  const GC = { "✓": "ok", "▲": "risk", "?": "a", "!": "a" };   // ✉ stays faint (dim, ambient m_8793)
  const lineOf = (v) => ({ text: v.text, glyph: v.glyph || null, gc: GC[v.glyph] || null, size: "big" });

  // the rows of the agents an answer started (the model's chips: names)
  const started = (v) => (v.chips && v.chips.length ? [{ label: B.agentsStarted, rows: v.chips.map((n) => ({ g: "∿", t: n })) }] : []);

  // the rows ↑↓ can select: the ones a click acts on (not a fixed row, not a label)
  const selectable = (s) => s.sections.flatMap((sec) => sec.rows).filter((r) => r.act && !r.fixed);
  // an open bar (fn 0, fn i, fn p, settings, can't reach bise): the model's rowSel, clamped
  function markSel(s, at) {
    const rows = selectable(s);
    s.sections.forEach((sec) => sec.rows.forEach((r) => { r.sel = false; }));
    if (rows.length) rows[Math.max(0, Math.min(rows.length - 1, at || 0))].sel = true;
    return s;
  }

  // ---- round 10, preview A (identity10): the bar opens at 860 for your agents, the list on the
  // left (360), the selected agent's preview on the right (500); fn a, or fn space with agents
  const WIDE = 860, LIST = 360;
  const AG = { waiting: ["?", "a"], blocked: ["▲", "risk"], working: ["∿", "work"], idle: ["◌", null], done: ["✓", "ok"], failed: ["▲", "risk"] };
  const F = B.find;
  // a time of day, 24 h (the preview's actions: '10:37')
  const hhmm = (ms) => { if (!(ms > 0)) return ""; const d = new Date(ms); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
  function finder(s, v) {
    const f = v.find, spot = f.mode === "spot", q = f.q;
    s.w = WIDE;
    s.head = { h: 68, input: { text: v.spot ? v.spot.text : q, ph: spot ? F.spotPh : F.ph }, right: item(spot ? ["fn", "space"] : ["fn", "a"]) };
    const rows = f.rows.map((r) => {
      const [g, gc] = AG[r.status] || AG.idle;
      return { g, gc, t: r.name, p: r.pname, sub: r.title || null, mark: { t: r.marks.name, sub: r.marks.title }, seen: r.archived,
        right: r.waits ? { wait: r.waits } : r.age ? { age: r.age } : null, act: { ev: "ui_agent", agent: r.name, ...(r.project ? { project: r.project } : {}) }, qa: `agent-${r.name}` };
    });
    const waiting = f.rows.filter((r) => r.waits).length;
    s.sections = [{ label: q ? F.agents : F.yours, acc: waiting > 0 && !q ? F.waitingOnYou(waiting) : null, rows }];
    if (spot && q) s.sections.push({ label: F.ask, rows: [
      { g: "@", gc: "a", t: B.askMain(q), right: { keys: ["⌘", "⏎"] }, act: { ev: "ui_spot_send", text: v.spot.text }, qa: "ask-main" },
      { g: "+", t: B.startAgent(q), right: { keys: ["tab"] }, act: { ev: "ui_spot_tab", text: v.spot.text }, qa: "start-agent" },
    ] });
    s.preview = preview(f, v);
    const a = f.agent, row = a && f.rows.find((r) => r.name === a);
    s.foot = { left: [item(["↑", "↓"], B.move), item(["⏎"], B.open, key("enter")),
      ...(a ? [item(["⌘", "O"], F.terminal, { ev: "ui_agent_terminal", agent: a }), item(["⌘", "D"], row && row.followed ? F.following : F.follow, { ev: "ui_follow", agent: a })] : [])],
    right: [item(["esc"], B.close, { ev: "ui_close" })] };
    if (!f.rows.length && !q) s.text = { s: F.none, dim: true };
    markSel(s, f.sel);
    // a click on the preview does what its ⏎ does (lead m_8123): an agent's side panel, or, when
    // no agent matches ('⏎ asks main instead'), the selected row (ask main)
    if (s.preview) { const r = selRow(s); s.preview.act = s.preview.name ? { ev: "ui_agent", agent: s.preview.name } : r ? r.act : { ev: "ui_spot_send" }; }
    return s;
  }
  // ---- desktop S8, the spotlight (v9): its sections when empty, the found rows, ⏎ by shape
  const SP = Wd.spot;
  function spotlight(s, v) {
    const L = v.spot.list, q = L.q;
    // 'to bise' names where ⌘⏎ sends, once he has typed; empty, the voice way (ambient m_8498 (4))
    s.head = { h: 68, input: { text: v.spot.text, ph: SP.ph }, right: { text: q ? SP.to : SP.holdFn } };
    let envN = 0;
    const row = (r) => {
      if (r.kind === "card") return { g: r.mark || "?", gc: r.mark === "✉" ? null : "a", t: asker(r.agent), p: r.pname, sub: r.text, right: { keys: ["⏎"] }, act: { ev: "ui_open_card", card: r.id }, qa: `card-${r.id}` };
      if (r.kind === "env") { envN++; return { g: "ψ", t: r.name, sub: `${r.path}${r.sub ? `  ·  ${r.sub}` : ""}`, right: envN <= 9 ? { keys: ["⌘", String(envN)] } : null, act: { ev: "ui_project", project: r.project }, qa: `env-${r.name}` }; }
      if (r.kind === "ask") return { g: "@", gc: "a", t: SP.askBise, sub: r.text, act: { ev: "ui_spot_send", text: v.spot.text }, qa: "ask-bise" };
      const [g, gc] = AG[r.status] || AG.idle;
      return { g, gc, t: r.name, p: r.pname, sub: r.title || null, mark: r.marks ? { t: r.marks.name, sub: r.marks.title } : undefined,
        act: { ev: "ui_agent", agent: r.name, ...(r.project ? { project: r.project } : {}) }, qa: `agent-${r.name}` };
    };
    s.sections = L.sections.map((sec) => ({ label: sec.label, acc: !!sec.acc, rows: sec.rows.map(row) }));
    markSel(s, v.rowSel);
    const sel = selRow(s), firstAgent = L.sections.flatMap((x) => x.rows).find((r) => r.kind === "agent");
    const send = { ev: "ui_spot_send", text: v.spot.text };
    const left = L.mode === "names" ? [item(["⏎"], sel ? SP.open(sel.t) : SP.openInBise), item(["⌘", "⏎"], SP.sendQ(q), send)]
      : L.mode === "ask" ? [item(["⏎"], SP.sendToBise), ...(firstAgent ? [item(["↓"], SP.thenOpen(firstAgent.name))] : [])]
        : [item(["⏎"], SP.openInBise)];
    // ⌘⏎ and tab only once he has typed (round 9's rule, ambient m_8617 (2))
    s.foot = { left: [...left, ...(q ? [item(["tab"], SP.startAgent, { ev: "ui_spot_tab", text: v.spot.text })] : [])], right: [item(["esc"], SP.close, { ev: "ui_close" })] };
    return s;
  }

  // the preview of the selected agent: its status chip, what it does now, what waits on you, its
  // last actions, its last report, its pages, and the ways in (⏎ ⌘O ⌘D); until the core's
  // agent_preview comes, its title line stands for 'now'
  function preview(f, v) {
    const r = f.agent && f.rows.find((x) => x.name === f.agent);
    if (!r) return f.q ? { empty: F.noMatch } : null;
    const p = f.preview;
    const [g, gc] = AG[r.status] || AG.idle;
    const out = { name: r.name, chip: { text: `${F.status[r.status] || r.status}${r.age ? ` · ${r.age}` : ""}`, gc }, now: p && p.now ? p.now : r.title || "", loading: !p && !f.late, waits: [], actions: [], report: null, pages: [] };
    const ways = [item(["⏎"], F.openHistory, { ev: "ui_agent", agent: r.name }), item(["⌘", "O"], F.terminal, { ev: "ui_agent_terminal", agent: r.name }),
      item(["⌘", "D"], r.followed ? F.following : F.follow, { ev: "ui_follow", agent: r.name })];
    // no preview yet: what the row has (its cards wait on you); after ~1 s, no '…' either
    if (!p) {
      out.waits = (f.cards || []).map((c) => ({ label: F.needsYou(r.name), text: c.text, act: { ev: "ui_card", card: c.id }, qa: `wait-${c.id}` }));
      if (f.late) out.ways = ways;
      return out;
    }
    out.waits = p.waiting.map((w) => ({ label: F.needsYou(r.name), text: w.question, act: { ev: "ui_card", card: w.card_id }, qa: `wait-${w.card_id}` }));
    out.actions = p.actions.map((x) => ({ at: hhmm(x.at_ms), text: x.text }));
    if (p.last_report) out.report = { glyph: p.last_report.kind === "done" ? "✓" : p.last_report.kind === "blocked" || p.last_report.kind === "failed" ? "▲" : "", text: p.last_report.text };
    out.pages = p.pages.map((pg) => ({ t: `${pg.title} · v${pg.v}`, act: { ev: "ui_open_url", url: pg.url, page: pg.id }, qa: `pv-page-${pg.id}` }));
    out.ways = ways;
    void g;
    return out;
  }

  // every '⏎' hint does what ⏎ does (lead m_8108 (3)): runs the selected row; the spotlight's
  // sends what he typed
  function spec(v) {
    const s = specOf(v);
    if (s.foot) {
      const r = selRow(s);
      for (const it of s.foot.left) if (it.keys.length === 1 && it.keys[0] === "⏎") {
        if (r) it.act = r.act;
        else if (!it.act && (v.state === "spotlight" || v.state === "find")) it.act = { ev: "ui_spot_send" };
      }
    }
    return s;
  }
  function specOf(v) {
    const s = { kind: v.state, mood: v.mood, head: null, level: null, big: null, text: null, sections: [], foot: null };
    const focused = !!v.focused;
    switch (v.state) {
      case "listening": case "voice_note": {
        const said = v.words && v.words.list.length ? v.words : null;
        // his words wrap to as many lines as they need (a cap, then a fade at the top), never
        // clipped on one line (the user's dogfood, lead m_7163)
        s.head = { h: 68, line: said ? { words: said, wrap: true } : { ph: true, text: v.state === "voice_note" && v.label ? v.label.text : B.listening } };
        // seesParts already says 'bise sees <app> · <host>' (ambient's gate (1): it was doubled)
        if (v.sees) s.head.right = { text: v.sees.head + (v.sees.tail || "") };
        s.level = v.lvl || 0;
        s.foot = v.handsFree
          ? { left: [item(["fn"], B.send, null, B.tap), item(["esc"], B.cancel, key("esc"))], right: [] }
          : { left: [item(["fn"], B.send, null, B.letGo), item(["esc"], B.cancel, key("esc"))], right: [item(["fn"], B.handsFree, null, B.doubleTap)] };
        return s;
      }
      // desktop S8: '→ telemetry · main', 2 s to correct with tab, fn esc cancels (v9)
      case "route":
        s.head = { h: 68, line: { text: v.route.line, size: "big" } };
        s.foot = { left: [item(["tab"], Wd.route.another, { ev: "ui_route_next" }), item(["fn", "esc"], Wd.route.cancel, { ev: "ui_route_cancel" })], right: [] };
        return s;
      case "working": case "speaking": case "end": {
        // after he lets go: his words stay, whole, while bise thinks; main's answer replaces them
        // his words dim (ambient m_7170: the pearl thinking + dimmed words = heard, working)
        s.head = { h: 68, line: v.words ? { words: v.words, size: "big" } : v.said ? { words: v.said, wrap: true, dim: true } : { text: v.text, size: "big" } };
        if (v.sub) s.text = { s: v.sub, dim: true };
        s.sections = started(v);
        // ⌘ C copies main's answer (ui.js: act ui_copy is the page's, never the model's)
        const said = v.words ? v.words.list.join(" ") : "";
        s.foot = { left: said ? [item(["⌘", "C"], B.copy, { ev: "ui_copy", text: said })] : [], right: [item(["esc"], v.state === "end" ? B.closeLeaves : B.close, key("esc"))] };
        return s;
      }
      case "needs": {
        const a = v.ask;
        // the global main is called bise on ambient surfaces (v9; ambient m_8617 (1)): '? bise needs you'
        const asMain = !a.agent || a.agent === "main";
        const [acc, rest] = a.batch ? a.title.split(" · ") : [asMain ? B.needs("bise") : a.label || B.needs(a.agent), B.now];
        const more = a.more > 0 ? ` · +${a.more}` : "";
        s.head = { h: 52, lab: { acc: a.batch ? `? ${acc}` : acc, rest: (rest || "") + more } };
        // the body takes a click too (pm's fail 45): drafts -> review (row 1), a question -> its full text
        if (a.batch) { s.big = a.text; s.bigAct = { ev: "ui_option", card: a.id, i: a.options[0].i }; }
        else {
          s.text = { s: a.text, clamp: 4, full: !!a.full, ...(a.full ? {} : { act: { ev: "ui_ask_more" } }) };
          if (!a.full) s.head.right = item(["⌘", "⏎"], B.fullText, { ev: "ui_ask_more" });
        }
        s.sections = [{ rows: a.options.map((o, k) => ({
          g: String(o.n), gk: true, t: o.label, sel: o.sel, sub: a.batch ? (k === 0 ? B.reviewSub : B.sendSub) : null,
          act: { ev: "ui_option", card: a.id, i: o.i }, qa: `opt-${o.n}`,
        })) }];
        s.foot = askFoot(Math.max(...a.options.map((o) => o.n), 1), focused, a.approval ? Wd.card.pick(a.options.map((o) => o.n)) : null);
        if (a.open) s.foot.left.push(item(["fn", "o"], B.openPage, key("o")));
        return s;
      }
      case "hello": {
        s.head = { h: 68, line: v.text ? { words: { list: v.text.split(" "), lit: v.text.split(" ").length }, size: "hello" } : { text: "", size: "hello" } };
        s.foot = { left: [item(["fn"], B.talk, null, B.hold), item(["fn", "space"], B.type), item(["fn", "0"], B.goingOn), item(["fn", "o"], B.startHere)], right: [] };
        return s;
      }
      case "find": return finder(s, v);
      case "spotlight": {
        if (v.spot.list) return spotlight(s, v);
        if (v.find) return finder(s, v);
        const t = v.spot.text.trim();
        s.head = { h: 68, input: { text: v.spot.text, ph: B.typeHint } };
        if (t) s.sections = [{ rows: [
          { g: "@", gc: "a", t: B.askMain(t), right: { keys: ["⌘", "⏎"] }, act: { ev: "ui_spot_send", text: v.spot.text }, qa: "ask-main" },
          { g: "+", t: B.startAgent(t), right: { keys: ["tab"] }, act: { ev: "ui_spot_tab", text: v.spot.text }, qa: "start-agent" },
        ] }];
        s.foot = { left: [item(["⏎"], B.sendMain), ...(t ? [item(["tab"], B.startAgentKey)] : [])], right: [item(["esc"], B.close, { ev: "ui_close" })] };
        // ↓ moves to 'start an agent', ⏎ runs the selected row (SPEC §4, lead m_8094)
        return t ? markSel(s, v.rowSel) : s;
      }
      case "agents": case "inbox": {
        const full = v.state === "agents";
        s.head = { h: 68, line: { ph: true, text: full ? B.goingOn : B.inbox }, right: full ? item(["fn", "0"]) : { text: B.mostBlocking } };
        const cards = (v.inbox || []).map((c, k) => ({ g: "?", gc: "a", t: c.text, sub: c.agent, sel: !!c.sel, right: { keys: [String(k + 1)] }, act: { ev: "ui_card", card: c.id }, qa: `card-${c.id}` }));
        if (cards.length || !full) s.sections.push({ label: cards.length ? Wd.waiting(cards.length) : W.nothingNeeds, rows: cards, acc: cards.length > 0 });
        if (full) {
          // every row acts (lead m_8108 (3)): an agent opens its thread in bise's window (desktop S8), a page
          // being written opens in the browser
          const run = (v.list || []).map((r) => ({ g: r.glyph === "✓" ? "✓" : r.kind === "need" ? "?" : r.glyph, gc: r.glyph === "✓" ? "ok" : r.glyph === "▲" ? "risk" : r.kind === "need" ? "a" : null, t: r.name, p: r.pname, sub: r.what, right: r.age ? { age: r.age } : null,
            act: r.agent ? { ev: "ui_agent", agent: r.agent, ...(r.project ? { project: r.project } : {}) } : r.page ? { ev: "ui_page", page: r.page } : null, qa: r.agent ? `agent-${r.agent}` : r.page ? `page-${r.page}` : undefined }));
          s.sections.push({ label: run.length ? `${v.titles.running} · ${run.length}` : W.nothingRunning, rows: run });
          // main's last answer, back on the glass by hand (lead m_8108 (6): a card or a pane may cover it)
          if (v.answer) s.sections.push({ label: B.biseSaid, rows: [{ g: "*", t: v.answer, act: { ev: "ui_reanswer" }, qa: "answer" }] });
          if (v.forYou) s.sections.push({ label: v.forYou.title, rows: v.forYou.pages.map((p, k) => ({ g: "◰", gc: p.unopened ? "a" : null, t: p.name, sub: p.watch ? `${p.watch} · ${p.meta}` : p.meta, seen: !p.unopened, right: k < 9 ? { keys: ["⌘", String(k + 1)] } : null, act: { ev: "ui_page", page: p.id }, qa: `page-${p.id}` })) });
        }
        s.foot = { left: [item(["↑", "↓"], B.move), item(["⏎"], B.open, key("enter"))], right: [item(["esc"], full ? B.close : B.later, key("esc"))] };
        return markSel(s, v.rowSel);
      }
      case "pages": {
        // fn p: new for you, then seen (dim), ⌘ 1-9 on the first nine (ambient m_6528)
        s.head = { h: 68, line: { ph: true, text: B.yourPages }, right: item(["fn", "p"]) };
        const row = (p, k) => ({ g: "◰", gc: p.unopened ? "a" : null, t: p.name, sub: p.watch ? `${p.watch} · ${p.meta}` : p.meta, seen: !p.unopened,
          right: k < 9 ? { keys: ["⌘", String(k + 1)] } : null, act: { ev: "ui_page", page: p.id }, qa: `page-${p.id}` });
        const all = (v.myPages || []).map(row);
        const fresh = all.filter((r) => !r.seen), old = all.filter((r) => r.seen);
        if (fresh.length) s.sections.push({ label: B.newForYou, rows: fresh, acc: true });
        if (old.length) s.sections.push({ label: B.seen, rows: old });
        if (!all.length) s.text = { s: W.nothingNeeds, dim: true };
        s.foot = { left: [item(["↑", "↓"], B.move), item(["⏎"], B.open, key("enter")), item(["⌘", "1", "–", "9"], B.openThat)], right: [item(["esc"], B.close, key("esc"))] };
        return markSel(s, v.rowSel);
      }
      case "offline": {
        // can't reach bise (ambient m_6528): its words kept, try again (and every 10 s), start it,
        // copy what you said
        s.head = { h: 68, line: { text: B.offline, glyph: "▲", gc: "risk", size: "big" }, right: { text: B.kept } };
        s.text = { s: B.offlineText, dim: true };
        s.sections = [{ rows: [
          { g: "↻", t: B.tryAgain, sub: B.checks, right: { keys: ["⏎"] }, act: { ev: "ui_retry" }, qa: "retry" },
          // the bise the app runs, by its path (amb-mac m_8082: app_bise; null: none found, no row)
          ...(v.offline.bise === null ? [] : [{ g: "›_", t: v.offline.bise ? B.terminalAt(home(v.offline.bise)) : B.terminal,
            sub: v.offline.bise ? B.runsAt(home(v.offline.bise)) : B.runs, right: { keys: ["⌘", "⏎"] }, act: { ev: "ui_terminal" }, qa: "terminal" }]),
          ...(v.offline.text ? [{ g: "⧉", t: B.copySaid, right: { keys: ["⌘", "C"] }, act: { ev: "ui_copy", text: v.offline.text }, qa: "copy-said" }] : []),
        ] }];
        s.foot = { left: [item(["⏎"], B.tryAgain, { ev: "ui_retry" })], right: [item(["esc"], B.close, key("esc"))] };
        return markSel(s, v.rowSel);
      }
      // desktop S8: the menu-bar pearl's dropdown (amb-mac places it under the icon; app_menu)
      case "menu": {
        const u = v.menu, MN = Wd.menu;
        const hm = (ms) => { const d = new Date(ms); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
        s.head = { h: 52, lab: { acc: u.waits ? MN.head(u.working, u.waits) : "", rest: u.waits ? "" : MN.head(u.working, 0) } };
        // 'all quiet.' only when nothing waits and nothing failed (ambient m_8653 (2))
        s.text = u.failed ? { s: MN.broke(u.failed), dim: false } : u.waits ? null : { s: MN.calm, dim: true };
        if (u.cards.length) s.sections.push({ rows: u.cards.map((c, k) => ({ g: "?", gc: "a", t: asker(c.agent), p: c.pname, sub: c.text,
          right: k === 0 ? { keys: ["fn", "1"] } : null, act: { ev: "ui_open_card", card: c.id }, qa: `card-${c.id}` })) });
        if (u.followed.length) s.sections.push({ rows: u.followed.map((a) => ({ g: a.failed ? "▲" : "∿", gc: a.failed ? "risk" : "work",
          t: [a.pname, a.name, MN.following].filter(Boolean).join(" · "), sub: a.job ? MN.job(a.job) : a.title || null,
          act: { ev: "ui_agent", agent: a.name, ...(a.project ? { project: a.project } : {}) }, qa: `job-${a.name}` })) });
        s.sections.push({ rows: [
          { g: "", t: MN.openBise, right: { keys: ["⌘", "0"] }, act: { ev: "ui_open_bise" }, qa: "open-bise" },
          // paused: 'quiet until 11:41' said, then its own 'resume' row, as amb-mac's native menu (ambient m_8653 (3))
          ...(u.quiet ? [{ g: "☾", t: MN.quietUntil(hm(u.quiet.until)), fixed: true, qa: "quiet-until" },
            { g: "", t: MN.resume, act: { ev: "ui_quiet_hour" }, qa: "resume" }]
            : [{ g: "☾", t: MN.quietHour, act: { ev: "ui_quiet_hour" }, qa: "quiet-hour" }]),
          { g: "⚙", t: MN.settings, right: { keys: ["⌘", ","] }, act: { ev: "app_key", key: "," }, qa: "settings" },
        ] });
        // last, after a separator (ambient m_8618 via amb-mac m_8639)
        s.sections.push({ rows: [{ g: "", t: MN.quit, right: { keys: ["⌘", "Q"] }, act: { ev: "ui_quit" }, qa: "quit" }] });
        return markSel(s, v.rowSel);
      }
      case "settings": {
        const st = v.settings;
        s.head = { h: 68, line: { ph: true, text: W.set.title }, right: item(["fn", ","]) };
        s.sections = [
          { rows: st.rows.map((r) => ({ t: r.label, sub: r.note, right: { sw: r.on }, act: { ev: "ui_setting", key: r.key }, qa: `set-${r.key}` })) },
          { label: B.never, rows: [
            ...st.always.map((n) => ({ g: "◌", t: n, sub: B.always, fixed: true })),
            ...st.skip.map((x) => ({ g: "◌", t: x.name, right: { keys: ["⌫"] }, act: { ev: "ui_setting", key: "skip_remove", value: x.bundle }, qa: `skip-${x.bundle}` })),
            { g: "+", t: st.add, act: { ev: "ui_setting", key: "skip_add" }, qa: "skip-add" },
          ] },
        ];
        s.foot = { left: [item(["↑", "↓"], B.move), item(["space"], B.switch), item(["⌫"], B.remove)], right: [item(["esc"], B.close, key("esc"))] };
        return markSel(s, v.rowSel);
      }
      case "perm": {
        // a refused permission is a flash of kind perm (no v.perm): one ▲ line, as below
        // with the way back (ambient m_6936): what he loses on the line, the exact path on its own
        // line under it (never cut inside), ⏎ open System Settings at that pane, esc close
        if (!v.perm) {
          if (v.text == null) return s;
          const first = Wd.firstSentence(v.text, 400), rest = v.text.slice(first.length).trim();
          s.head = { h: 68, line: lineOf({ ...v, text: rest ? first : v.text }) };
          if (rest) s.text = { s: rest, path: true };
          if (v.denied) s.foot = { left: [item(["⏎"], B.openSystemSettings, { ev: "ui_perm", perm: v.denied, do: "settings" })], right: [item(["esc"], B.close, key("esc"))] };
          return s;
        }
        const p = v.perm, i = PERMS.indexOf(p.perm);
        s.head = { h: 52, lab: { acc: "", rest: `${B.beforeAsks} · ${B.permName[p.perm] || p.perm}` }, right: i >= 0 ? { text: B.ofN(i + 1, PERMS.length) } : null };
        s.big = p.text;
        s.sections = [{ rows: [
          { g: "→", gc: "a", t: p.button, sub: B.asksNext, sel: true, act: { ev: "ui_perm", perm: p.perm, do: "continue" }, qa: "perm-continue" },
          { g: "◌", t: p.later, right: { keys: ["esc"] }, act: { ev: "ui_perm", perm: p.perm, do: "not_now" }, qa: "perm-not-now" },
        ] }];
        s.foot = { left: [item(["⏎"], p.button, { ev: "ui_perm", perm: p.perm, do: "continue" })], right: [item(["esc"], p.later, { ev: "ui_perm", perm: p.perm, do: "not_now" })] };
        return s;
      }
      case "hub_down": {
        // can't reach bise, trying again: start it from here too, naming the bise the app runs
        // (lead m_8108 (2); null: none found, no row)
        s.head = { h: 68, line: lineOf({ text: v.text, glyph: "▲" }) };
        if (v.bise !== null) {
          s.sections = [{ rows: [{ g: "›_", t: v.bise ? B.terminalAt(home(v.bise)) : B.terminal, sub: v.bise ? B.runsAt(home(v.bise)) : B.runs,
            right: { keys: ["⌘", "⏎"] }, act: { ev: "ui_terminal" }, qa: "terminal" }] }];
          s.foot = { left: [item(["⌘", "⏎"], B.startIt, { ev: "ui_terminal" })], right: [] };
        }
        return s;
      }
      case "idle": return s;
      default: {
        // a flash (got it, answered, sending, cancelled, an error, a page ready, hidden) or the
        // hub down: one line, its glyph colored, the sub line dim under it
        if (v.text == null) return s;
        s.head = { h: 68, line: lineOf(v) };
        if (v.sub) s.text = { s: v.sub, dim: true };
        return s;
      }
    }
  }

  // the panel around the glass (amb-mac's app_size: the box, the glass inside it): room for the
  // pearl's 76 px canvas at x -82 (the pearl drawn 64 px at x -76, 76 px while fn is held), the
  // drawn shadow (0 30 80 -24) and the entry's 8 px rise
  const BOX = { left: 84, top: 28, right: 60, bottom: 92, w: 700 };
  // show false (nothing left to show): glass null, the app drops its blur that frame (amb-mac
  // 6072dcc8); a hidden panel with something to show still gets its glass
  // w: the glass's width, 700, or 860 for round 10's lists with their preview (it opens at that
  // width and never grows while shown)
  const size = (h, radius, show = true, w = BOX.w) => ({ cmd: "app_size", w: BOX.left + w + BOX.right, h: BOX.top + h + BOX.bottom, radius,
    glass: show ? { x: BOX.left, y: BOX.top, w, h } : null });

  // the row ⌘ <d> opens (fn 0's for you, fn p), and the one ⏎ runs
  const cmdRow = (s, d) => s.sections.flatMap((sec) => sec.rows).find((r) => r.act && r.right && r.right.keys && r.right.keys[0] === "⌘" && r.right.keys[1] === String(d)) || null;
  const selRow = (s) => s.sections.flatMap((sec) => sec.rows).find((r) => r.sel && r.act) || null;

  root.AmbBar = { spec, BOX, size, selectable, cmdRow, selRow };
})(typeof window !== "undefined" ? window : globalThis);
