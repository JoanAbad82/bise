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
  const item = (keys, w, act, pre) => ({ ...(pre ? { pre } : {}), keys, ...(w ? { w } : {}), ...(act ? { act } : {}) });
  const PERMS = ["accessibility", "mic", "screen"];

  // a pushed card (a question, drafts) never takes the keys: fn chords until he clicks it
  // (ambient m_6519 FOCUS AND KEYS); clicked, the plain keys
  function askFoot(n, focused) {
    const range = (pre) => [...pre, "1", "–", String(n)];
    // a range ('fn 1 – 2 pick') is info, like '↑↓ move': the rows are its targets (ambient m_6681 (2))
    const left = focused
      ? [item(range([]), B.pick), item(["↑", "↓"], B.move), item(["esc"], B.later, key("esc"))]
      : [item(range(["fn"]), B.pick), item(["fn", "esc"], B.later, key("esc"))];
    return { left, right: [item(["fn"], B.sayIt, null, B.orHold)] };
  }

  // the line a key's answer, a flash or an error says, its glyph colored by what it is
  const GC = { "✓": "ok", "▲": "risk", "?": "a" };
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

  function spec(v) {
    const s = { kind: v.state, mood: v.mood, head: null, level: null, big: null, text: null, sections: [], foot: null };
    const focused = !!v.focused;
    switch (v.state) {
      case "listening": case "voice_note": {
        const said = v.words && v.words.list.length ? v.words : null;
        s.head = { h: 68, line: said ? { words: said } : { ph: true, text: v.state === "voice_note" && v.label ? v.label.text : B.listening } };
        // seesParts already says 'bise sees <app> · <host>' (ambient's gate (1): it was doubled)
        if (v.sees) s.head.right = { text: v.sees.head + (v.sees.tail || "") };
        s.level = v.lvl || 0;
        s.foot = v.handsFree
          ? { left: [item(["fn"], B.send, null, B.tap), item(["esc"], B.cancel, key("esc"))], right: [] }
          : { left: [item(["fn"], B.send, null, B.letGo), item(["esc"], B.cancel, key("esc"))], right: [item(["fn"], B.handsFree, null, B.doubleTap)] };
        return s;
      }
      case "working": case "speaking": case "end": {
        s.head = { h: 68, line: v.words ? { words: v.words, size: "big" } : { text: v.text, size: "big" } };
        if (v.sub) s.text = { s: v.sub, dim: true };
        s.sections = started(v);
        // ⌘ C copies main's answer (ui.js: act ui_copy is the page's, never the model's)
        const said = v.words ? v.words.list.join(" ") : "";
        s.foot = { left: said ? [item(["⌘", "C"], B.copy, { ev: "ui_copy", text: said })] : [], right: [item(["esc"], v.state === "end" ? B.closeLeaves : B.close, key("esc"))] };
        return s;
      }
      case "needs": {
        const a = v.ask;
        const [acc, rest] = a.batch ? a.title.split(" · ") : [a.label || B.needs(a.agent), B.now];
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
        s.foot = askFoot(Math.max(...a.options.map((o) => o.n), 1), focused);
        if (a.open) s.foot.left.push(item(["fn", "o"], B.openPage, key("o")));
        return s;
      }
      case "hello": {
        s.head = { h: 68, line: v.text ? { words: { list: v.text.split(" "), lit: v.text.split(" ").length }, size: "hello" } : { text: "", size: "hello" } };
        s.foot = { left: [item(["fn"], B.talk, null, B.hold), item(["fn", "space"], B.type), item(["fn", "0"], B.goingOn), item(["fn", "o"], B.startHere)], right: [] };
        return s;
      }
      case "spotlight": {
        const t = v.spot.text.trim();
        s.head = { h: 68, input: { text: v.spot.text, ph: B.typeHint } };
        if (t) s.sections = [{ rows: [
          { g: "@", gc: "a", t: B.askMain(t), right: { keys: ["⌘", "⏎"] }, sel: true, act: { ev: "ui_spot_send", text: v.spot.text }, qa: "ask-main" },
          { g: "+", t: B.startAgent(t), right: { keys: ["tab"] }, act: { ev: "ui_spot_tab", text: v.spot.text }, qa: "start-agent" },
        ] }];
        s.foot = { left: [item(["⏎"], B.sendMain), ...(t ? [item(["tab"], B.startAgentKey)] : [])], right: [item(["esc"], B.close, { ev: "ui_close" })] };
        return s;
      }
      case "agents": case "inbox": {
        const full = v.state === "agents";
        s.head = { h: 68, line: { ph: true, text: full ? B.goingOn : B.inbox }, right: full ? item(["fn", "0"]) : { text: B.mostBlocking } };
        const cards = (v.inbox || []).map((c, k) => ({ g: "?", gc: "a", t: c.text, sub: c.agent, sel: !!c.sel, right: { keys: [String(k + 1)] }, act: { ev: "ui_card", card: c.id }, qa: `card-${c.id}` }));
        if (cards.length || !full) s.sections.push({ label: cards.length ? Wd.waiting(cards.length) : W.nothingNeeds, rows: cards, acc: cards.length > 0 });
        if (full) {
          const run = (v.list || []).map((r) => ({ g: r.glyph === "✓" ? "✓" : r.kind === "need" ? "?" : r.glyph, gc: r.glyph === "✓" ? "ok" : r.glyph === "▲" ? "risk" : r.kind === "need" ? "a" : null, t: r.name, sub: r.what, right: r.age ? { age: r.age } : null }));
          s.sections.push({ label: run.length ? `${v.titles.running} · ${run.length}` : W.nothingRunning, rows: run });
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
          { g: "›_", t: B.terminal, sub: B.runs, right: { keys: ["⌘", "⏎"] }, act: { ev: "ui_terminal" }, qa: "terminal" },
          ...(v.offline.text ? [{ g: "⧉", t: B.copySaid, right: { keys: ["⌘", "C"] }, act: { ev: "ui_copy", text: v.offline.text }, qa: "copy-said" }] : []),
        ] }];
        s.foot = { left: [item(["⏎"], B.tryAgain, { ev: "ui_retry" })], right: [item(["esc"], B.close, key("esc"))] };
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
        if (!v.perm) { if (v.text == null) return s; s.head = { h: 68, line: lineOf(v) }; if (v.sub) s.text = { s: v.sub, dim: true }; return s; }
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
  const size = (h, radius, show = true) => ({ cmd: "app_size", w: BOX.left + BOX.w + BOX.right, h: BOX.top + h + BOX.bottom, radius,
    glass: show ? { x: BOX.left, y: BOX.top, w: BOX.w, h } : null });

  // the row ⌘ <d> opens (fn 0's for you, fn p), and the one ⏎ runs
  const cmdRow = (s, d) => s.sections.flatMap((sec) => sec.rows).find((r) => r.act && r.right && r.right.keys && r.right.keys[0] === "⌘" && r.right.keys[1] === String(d)) || null;
  const selRow = (s) => s.sections.flatMap((sec) => sec.rows).find((r) => r.sel && r.act) || null;

  root.AmbBar = { spec, BOX, size, selectable, cmdRow, selRow };
})(typeof window !== "undefined" ? window : globalThis);
