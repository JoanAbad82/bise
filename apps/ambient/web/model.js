// bise ambient · the capsule's model. Pure: no DOM, no clock of its own (every function takes
// `now` in ms), loaded by the capsule, dev.html, the fake core and check.mjs.
//
//   step(model, ev, now) -> { m, cmds }   one event (the core's, the app's app_*, the page's ui_*)
//   view(model, now)     -> what the capsule shows now (SPEC §2): its size, the orb's pose, the words
//
// The contract is docs/ambient-app.md §4. `cmds` are the web UI's commands: the core's (answer,
// send, hush, cut_in, talk_cancel) and the app's (app_size is the page's own, app_focus, app_hide,
// app_perm). A cmd with `delay` (ms) is posted that much later, without the field.
(function (root) {
  "use strict";
  const Wd = root.AmbWords;
  const { W } = Wd;

  // how long things stay (ms)
  const T = {
    got: 900,        // `:* got it.` before `on it.`
    endOpen: 4000,   // end of turn: open, then small
    kiss: 1000,      // the kiss, once
    level: 250,      // a level older than this is silence
    cutIn: 1500,     // `main stopped. go ahead.` over `listening`
    answered: 4000,
    done: 8000,      // `<name> is done.`, then the count line (ambient, m_4677)
    failed: 8000,
    error: 6000,
    key: 3000,       // a key's own line (cancelled, later, hush...)
    hide: 1500,      // fn + . : the line, then hide
  };

  const TURN = ["listening", "sending", "working", "speaking"];

  function init() {
    return {
      hub: { up: false, workspace: "", known: false },
      seen: false,                  // a `state` came
      agents: [], cards: [],
      phase: "idle", phaseAt: 0, line: "",
      heard: { text: "", final: false },
      lvl: { you: { v: 0, at: -1e9 }, main: { v: 0, at: -1e9 } },
      main: { text: "", turn: null, at: 0 },
      word: { turn: null, i: -1 },
      mine: false,                  // this turn started with your words: the capsule opens
      voice: false,                 // you talked: main answers aloud
      sentAt: -1e9, doneAt: -1e9, cutAt: -1e9,
      hushed: false,
      fn: false, handsFree: false,
      shot: null,                   // { app, title, skipped }
      perms: {}, permAsk: null,
      hidden: false, reduce: false, edgeGlow: true,
      flashes: [],                  // [{ glyph, text, sub, at, ttl, kiss, still, kind }]
      turnNames: null, chips: [],   // agents that appeared during your turn
      pane: null,                   // null | 'agents' | 'inbox' | 'spot'
      spotText: "",
      answered: {},                 // card id -> true, until the hub drops the card
      sel: 0,                       // the inbox's chosen card
    };
  }

  const names = (agents) => agents.map((a) => a.name);
  const working = (agents) => agents.filter((a) => a.working ?? ["working", "waiting", "starting"].includes(a.status)).length;
  const visibleCards = (m) => m.cards.filter((c) => !m.answered[c.id]);
  const lv = (m, who, now) => (now - m.lvl[who].at < T.level ? m.lvl[who].v : 0);
  const listening = (m) => m.fn || m.handsFree || m.phase === "listening";
  const inTurn = (m) => TURN.includes(m.phase);

  // a line now, over the queue (a key's answer)
  function flashNow(m, f, now) {
    return { ...m, flashes: [{ ttl: T.key, ...f, at: now }] };
  }
  // a line after the ones already waiting (an agent done, failed, answered)
  function flashQueue(m, f, now) {
    const live = m.flashes.filter((x) => x.at + x.ttl > now);
    const last = live[live.length - 1];
    return { ...m, flashes: [...live, { ttl: T.key, ...f, at: last ? Math.max(now, last.at + last.ttl) : now }] };
  }

  // answer a card with its option `opt` ({n, label}): the reply is the option's digit
  function answer(m, card, opt, now) {
    const choice = opt ? opt.label : null;
    const reply = String(opt.n);
    const m2 = { ...m, answered: { ...m.answered, [card.id]: true }, sel: 0, pane: m.pane === "inbox" && visibleCards(m).length <= 1 ? null : m.pane };
    const f = { kind: "answered", glyph: "✓", text: Wd.answeredLine(card.agent, choice), ttl: T.answered, kiss: true };
    return { m: flashNow(m2, f, now), cmds: [{ cmd: "answer", card: card.id, reply }] };
  }

  function setPane(m, pane) {
    const cmds = [];
    if (m.pane === "spot" && pane !== "spot") cmds.push({ cmd: "app_focus", on: false });
    if (pane === "spot" && m.pane !== "spot") cmds.push({ cmd: "app_focus", on: true });
    return { m: { ...m, pane, spotText: pane === "spot" ? m.spotText : "" }, cmds };
  }

  function step(m, ev, now) {
    const none = (x) => ({ m: x, cmds: [] });
    switch (ev && ev.ev) {
      case "hub":
        return none({ ...m, hub: { up: !!ev.up, workspace: ev.workspace || m.hub.workspace, known: true } });

      case "state": {
        const agents = Array.isArray(ev.agents) ? ev.agents : [];
        const cards = Array.isArray(ev.cards) ? ev.cards : [];
        let m2 = { ...m, agents, cards, seen: true };
        // the hub dropped a card: forget that it was answered here
        const ids = new Set(cards.map((c) => c.id));
        m2.answered = Object.fromEntries(Object.keys(m.answered).filter((id) => ids.has(id)).map((id) => [id, true]));
        if (m2.sel >= visibleCards(m2).length) m2.sel = 0;
        if (!m.seen) return none(m2);
        const prev = Object.fromEntries(m.agents.map((a) => [a.name, a]));
        for (const a of agents) {
          const p = prev[a.name];
          if (!p) {
            if (m.turnNames && !m.turnNames.includes(a.name) && !m2.chips.includes(a.name)) m2.chips = [...m2.chips, a.name];
            continue;
          }
          const failed = (a.status === "failed" && p.status !== "failed") || (a.report_kind === "failed" && (p.report_kind !== "failed" || p.report !== a.report));
          if (failed) {
            m2 = flashQueue(m2, { kind: "failed", glyph: "▲", text: Wd.failLine(a.name), ttl: T.failed, still: true }, now);
          } else if (a.status === "done" && p.status !== "done") {
            m2 = flashQueue(m2, { kind: "done", glyph: "✓", text: Wd.doneLine(a.name), ttl: T.done, kiss: true }, now);
          }
        }
        return none(m2);
      }

      case "phase": {
        const phase = ev.phase || "idle";
        let m2 = { ...m, phase, phaseAt: now, line: ev.line || "" };
        if (phase === "listening" && m.phase !== "listening") {
          m2 = { ...m2, heard: { text: "", final: false }, mine: true, turnNames: names(m.agents), chips: [], hushed: false, pane: null };
          if (m.pane === "spot") return { m: m2, cmds: [{ cmd: "app_focus", on: false }] };
        }
        if (phase === "sending") m2.mine = m.mine || m.fn || m.handsFree;
        if (phase === "done") m2.doneAt = now;
        if (phase === "idle") m2 = { ...m2, mine: false, shot: null, handsFree: false };
        if (phase === "failed") {
          m2 = flashNow({ ...m2, mine: false }, { kind: "failed", glyph: "▲", text: ev.line || W.on, ttl: T.failed, still: true }, now);
        }
        if (phase !== "listening") m2.handsFree = false;
        return none(m2);
      }

      case "heard":
        return none({ ...m, heard: { text: ev.text || "", final: !!ev.final } });

      case "level": {
        const who = ev.who === "main" ? "main" : "you";
        return none({ ...m, lvl: { ...m.lvl, [who]: { v: Math.max(0, Math.min(1, +ev.v || 0)), at: now } } });
      }

      case "main": {
        const word = ev.turn === m.main.turn ? m.word : { turn: ev.turn, i: -1 };
        return none({ ...m, main: { text: ev.text || "", turn: ev.turn, at: now }, word });
      }

      case "word":
        return none(ev.turn === m.main.turn || m.main.turn == null ? { ...m, word: { turn: ev.turn, i: ev.i | 0 } } : m);

      case "sent":
        return none({ ...m, voice: !!ev.voice, sentAt: now, mine: true, hushed: false, shot: ev.shot ? m.shot : null,
          turnNames: m.turnNames || names(m.agents), chips: m.turnNames ? m.chips : [], main: { text: "", turn: m.main.turn, at: now } });

      case "error":
        return none(flashNow(m, { kind: "error", glyph: "▲", text: ev.text || "", ttl: T.error, still: true }, now));

      // ---- the app's own events (amb-mac: down comes 250 ms into a hold with no other key, the
      // app sends talk_start/talk_end/shot itself; tap = fn released under 250 ms; cancel = the app
      // ended a hold without talk_end; double = hands-free, ended by the next tap's `up`)
      case "app_fn": {
        const st = ev.state;
        const start = (x) => ({ ...x, heard: { text: "", final: false }, mine: true, hushed: false, turnNames: names(m.agents), chips: [] });
        if (st === "down" || st === "double") {
          const cmds = [];
          let m2 = { ...m, pane: null };
          if (m.pane === "spot") cmds.push({ cmd: "app_focus", on: false });
          if (m.phase === "speaking") { cmds.push({ cmd: "cut_in" }); m2.cutAt = now; }
          m2 = st === "down" ? { ...m2, fn: true } : { ...m2, handsFree: true };
          if (m.phase !== "listening") m2 = start(m2);
          return { m: m2, cmds };
        }
        if (st === "tap") {
          if (m.phase !== "speaking") return none(m);
          return { m: flashNow({ ...m, cutAt: now, hushed: true }, { kind: "cut", text: W.cutIn }, now), cmds: [{ cmd: "cut_in" }] };
        }
        if (st === "up") return none({ ...m, fn: false, handsFree: false });
        if (st === "cancel") {
          return { m: flashNow({ ...m, fn: false, handsFree: false, mine: false, heard: { text: "", final: false }, phase: m.phase === "listening" ? "idle" : m.phase }, { kind: "cancel", text: W.cancelled }, now), cmds: [{ cmd: "talk_cancel" }] };
        }
        return none(m);
      }
      case "app_shot":
        return none({ ...m, shot: { app: ev.app || "", title: ev.title || "", skipped: !!ev.skipped } });
      case "app_perm": {
        const perms = { ...m.perms, [ev.perm]: ev.state };
        if (ev.state === "ask") return none({ ...m, perms, permAsk: ev.perm });
        const m2 = { ...m, perms, permAsk: m.permAsk === ev.perm ? null : m.permAsk };
        if (ev.state === "denied" && m.perms[ev.perm] !== "denied" && W.permDenied[ev.perm]) {
          return none(flashNow(m2, { kind: "perm", glyph: "▲", text: Wd.permDenied(ev.perm, m.macos), ttl: 8000, still: true }, now));
        }
        return none(m2);
      }
      case "app_settings":
        return none({ ...m, edgeGlow: ev.edge_glow !== false, macos: ev.macos || m.macos });
      case "app_hidden":
        return none({ ...m, hidden: !!(ev.on ?? ev.hidden) });
      case "app_reduce_motion":
        return none({ ...m, reduce: !!(ev.on ?? ev.reduce) });
      case "app_key":
        return key(m, ev.key, now);

      // ---- the page's own (clicks, the spotlight field)
      case "ui_option": {
        const card = m.cards.find((c) => c.id === ev.card);
        const opt = card && Wd.options(card)[ev.i];
        if (!opt || m.answered[card.id]) return none(m);
        return answer(m, card, opt, now);
      }
      case "ui_capsule":     // a click on the small capsule: the agents
        return setPane(m, m.pane ? null : visibleCards(m).length > 1 ? "inbox" : "agents");
      case "ui_close":
        return setPane(m, null);
      case "ui_spot_type":
        return none({ ...m, spotText: ev.text || "" });
      case "ui_spot_send":    // ⏎ send to main; tab (agent: true) start an agent, which main does
      case "ui_spot_tab": {
        const text = (ev.text ?? m.spotText).trim();
        if (!text) return none(m);
        const r = setPane({ ...m, spotText: "" }, null);
        const out = ev.ev === "ui_spot_tab" ? W.startAgent + text : text;
        return { m: { ...r.m, mine: true, voice: false, turnNames: names(m.agents), chips: [] }, cmds: [...r.cmds, { cmd: "send", text: out }] };
      }
      case "ui_perm":
        // continue: macOS's prompt; not now: the refused path (the app answers app_perm denied, and
        // the refused line shows once); either way the ask leaves the capsule
        return { m: ev.do === "continue" || ev.do === "not_now" ? { ...m, permAsk: null } : m, cmds: [{ cmd: "app_perm", perm: ev.perm, do: ev.do }] };
      default:
        return none(m);
    }
  }

  // fn + key (app_key), and the same keys inside the panel
  function key(m, k, now) {
    const none = (x) => ({ m: x, cmds: [] });
    const cards = visibleCards(m);
    if (/^[1-9]$/.test(k)) {
      const card = cards[m.pane === "inbox" || m.pane === "agents" ? m.sel : 0];
      // the digit is the option's own n (a hard confirm: 1 allow, 3 no)
      const opt = card && Wd.options(card).find((o) => o.n === +k);
      if (!opt) return none(m);
      return answer(m, card, opt, now);
    }
    switch (k) {
      case "space": return setPane(m, m.pane === "spot" ? null : "spot");
      case "i": return setPane(m, m.pane === "inbox" ? null : "inbox");
      case "0": return setPane(m, m.pane === "agents" ? null : "agents");
      case "up": return none({ ...m, sel: Math.max(0, m.sel - 1) });
      case "down": return none({ ...m, sel: Math.min(Math.max(0, cards.length - 1), m.sel + 1) });
      case "l": {
        if ((m.pane !== "inbox" && m.pane !== "agents") || !cards[m.sel]) return none(m);
        // later: the card leaves the inbox here; the hub keeps it (bringing it back is the core's, later)
        return none(flashNow({ ...m, answered: { ...m.answered, [cards[m.sel].id]: true }, sel: 0 }, { kind: "later", text: W.later }, now));
      }
      case ".":
        if (m.hidden) return none(m);
        return { m: flashNow(m, { kind: "hide", text: W.hidden, sub: W.showAgain, ttl: T.hide + 500 }, now), cmds: [{ cmd: "app_hide", delay: T.hide }] };
      case "esc": {
        if (listening(m)) {
          return { m: flashNow({ ...m, fn: false, handsFree: false, mine: false, heard: { text: "", final: false }, phase: m.phase === "listening" ? "idle" : m.phase }, { kind: "cancel", text: W.cancelled }, now), cmds: [{ cmd: "talk_cancel" }] };
        }
        if (m.phase === "speaking" && !m.hushed) return { m: { ...m, hushed: true }, cmds: [{ cmd: "hush" }] };
        if (m.pane) return setPane(m, null);
        return none(m);
      }
      default:
        return none(m);
    }
  }

  // ---- what the capsule shows now
  function view(m, now) {
    const cards = visibleCards(m);
    const need = cards.length > 0;
    const flash = m.flashes.find((f) => f.at <= now && now < f.at + f.ttl) || null;
    const v = {
      size: "small", pose: "rest", poseMs: now, lvl: 0, need, still: m.reduce,
      frozen: false,        // the face held still (failed, an error): no blink
      state: "idle",
      label: null,          // { text, acc, glyph }
      words: null,          // { list: [...], lit: n, per: s }
      text: null,           // one plain line
      glyph: null,          // the line's glyph (? ✓ ▲)
      sub: null,
      sees: null,           // `main sees …`
      chips: [],
      list: null,           // the agents' rows
      inbox: null,
      spot: null,           // { text }
      perm: null,           // { perm, text }
      note: null,           // the needs-you glass under the capsule
      edge: { on: false, lvl: 0 },
      hidden: m.hidden,
      kiss: false,
    };
    // main's reply, its markdown rendered (marks stripped, `code` flagged), one entry per raw word
    // so word.i lights the right one; the capsule shows at most 3 lines of it, then …
    const mainWords = () => {
      const toks = Wd.mdWords(m.main.text);
      const lit = m.voice && !m.hushed && m.phase === "speaking" && m.word.turn === m.main.turn ? Math.min(toks.length, m.word.i + 1) : toks.length;
      return { list: toks.map((t) => t.w), code: toks.map((t) => t.code), lit, per: 0.28, clamp: 3 };
    };
    const inbox = () => cards.map((c, i) => ({ id: c.id, agent: c.agent, text: c.text, sel: i === m.sel,
      options: Wd.options(c).map((o) => ({ i: o.i, label: Wd.optionLabel(o.n, o.label) })) }));
    const kissAt = (at) => {
      if (now - at < T.kiss) { v.pose = "kiss"; v.poseMs = now - at; v.kiss = true; }
    };

    // the needs-you glass, unless a view already lists the cards
    if (need && !m.pane && !m.permAsk) {
      const c = cards[0];
      v.note = { id: c.id, agent: c.agent, title: Wd.needsLine(c.agent), text: c.text || "", hint: W.needsHint, more: cards.length - 1,
        options: Wd.options(c).map((o) => ({ i: o.i, label: Wd.optionLabel(o.n, o.label) })) };
    }

    if (m.permAsk) {
      v.state = "perm"; v.size = "open";
      v.perm = { perm: m.permAsk, text: W.perm[m.permAsk] || "", button: W.continue, later: W.notNow };
    } else if (m.pane === "spot") {
      v.state = "spotlight"; v.size = "open";
      // the key bar: `tab start an agent` only once there is text (designer)
      v.spot = { text: m.spotText, hint: W.spotHint, keys: W.spotKeys.filter(([k]) => k !== "tab" || m.spotText.trim()) };
      if (inTurn(m)) v.pose = "think";
    } else if (listening(m)) {
      v.state = "listening"; v.size = "open";
      const you = lv(m, "you", now);
      v.pose = you > 0.04 || m.heard.text ? "talk" : "listen";
      v.lvl = you;
      // `listening · let go of fn to send` on the label's line, the words under it
      v.label = { text: now - m.cutAt < T.cutIn ? W.cutIn : W.listening, acc: true, rest: m.handsFree ? W.handsFree : W.letGo };
      v.words = { list: m.heard.text.split(/\s+/).filter(Boolean), per: 0.24 };
      v.words.lit = v.words.list.length;
      if (m.shot) v.sees = m.shot.skipped ? { head: W.notSeen, tail: "" } : Wd.seesParts(m.shot.app, m.shot.title);
      v.edge = { on: m.edgeGlow && !m.reduce, lvl: you };
    } else if (m.mine && (m.phase === "sending" || m.phase === "working" || (m.phase === "idle" && now - m.sentAt < 30000 && !m.main.text))) {
      v.state = "working"; v.size = "open"; v.pose = "think";
      v.label = { text: "main", acc: true };
      if (m.main.text && !m.voice) v.words = mainWords();
      else v.text = now - m.sentAt < T.got ? W.got : W.onShort;
      if (m.line) v.sub = m.line;
      v.chips = m.chips;
    } else if (m.mine && m.phase === "speaking") {
      v.state = "speaking"; v.size = "open";
      v.pose = m.hushed ? "think" : "speak";
      v.lvl = m.hushed ? 0 : lv(m, "main", now);
      v.label = { text: "main", acc: true };
      v.words = mainWords();
      if (m.hushed) v.sub = W.hush;
      v.chips = m.chips;
    } else if (m.mine && m.phase === "done" && now - m.doneAt < T.endOpen) {
      v.state = "end"; v.size = "open";
      v.label = { text: "main", acc: true };
      v.words = mainWords();
      if (m.hushed) v.sub = W.hush;
      v.chips = m.chips;
      kissAt(m.doneAt);
    } else if (m.pane === "agents") {
      // fn + 0 and the menu-bar click: what waits for you first, then the agents
      v.state = "agents"; v.size = "open";
      v.label = { text: `${m.hub.workspace || "agents"} · ${Wd.plural(m.agents.length, "agent", "agents")}` };
      if (cards.length) v.inbox = inbox();
      v.list = m.agents.map((a) => {
        const asks = cards.some((c) => c.agent === a.name);
        return {
          name: a.name,
          glyph: asks ? "?" : Wd.GLYPH[a.status] || "·",
          kind: asks ? "need" : a.status,
          // short: its task line, never the report (written to main, not to you)
          what: Wd.rowLabel(asks ? "needs you" : a.note || a.status),
          age: Wd.age(a.turn_ms),
        };
      });
    } else if (m.pane === "inbox") {
      v.state = "inbox"; v.size = "open";
      v.label = { text: cards.length ? Wd.waiting(cards.length) : W.quiet };
      v.inbox = inbox();
    } else if (flash) {
      v.state = flash.kind;
      v.glyph = flash.glyph || null; v.text = flash.text; v.sub = flash.sub || null;
      if (flash.kiss) kissAt(flash.at);
      if (flash.still) v.frozen = true;
    } else if (m.hub.known && !m.hub.up) {
      v.state = "hub_down"; v.text = W.hubDown; v.frozen = true;
    } else if (need) {
      // the glass under it names the agent; the capsule counts (designer: the two never repeat)
      v.state = "needs"; v.glyph = "?"; v.text = Wd.waiting(cards.length);
    } else {
      v.state = "idle"; v.text = Wd.idleLine(working(m.agents));
      if (inTurn(m)) v.pose = "think";   // main on its own turn: the * turns, the capsule stays small
    }
    // the open states keep the key lines too (cancelled, an error) as their sub line; a
    // permission ask stays alone in the capsule (ambient, m_4671)
    if (flash && v.size === "open" && !v.sub && v.state !== "perm" && flash.kind !== "answered") v.sub = flash.text;
    if (m.reduce) { v.still = true; v.edge.on = false; }
    return v;
  }

  root.AmbModel = { init, step, view, T, visibleCards };
})(typeof window !== "undefined" ? window : globalThis);
