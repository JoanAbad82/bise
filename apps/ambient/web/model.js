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
    page: 8000,      // `<page> is ready · fn + o`
    hide: 1500,      // fn + . : the line, then hide
    // the hello, once ever (ambient m_5702): the pearl gathers 1.2 s, the words land, the kiss
    // puff, then 5 s; under reduced motion the words fade in and leave 5 s later
    helloGather: 1200, helloWords: 300, helloKiss: 1400, helloKissMs: 1000, helloStay: 5000,
  };

  // how long the hello stays: the words land (0.3 s + their 0.5 s arrival), then 5 s; reduced: 5.5 s
  const helloMs = (m) => (m.reduce ? 500 : T.helloWords + 500) + T.helloStay;
  const TURN = ["listening", "sending", "working", "speaking"];
  // the settings view's toggles, in its order (amb-mac's app_setting keys)
  const SETTING_KEYS = ["edge_glow", "right_option", "meeting_quiet", "voice_answers", "launch_at_login"];

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
      hello: null,                  // { at }: the hello, once ever (app_hello)
      hidden: false, reduce: false, edgeGlow: true,
      radius: 16,                   // macOS's window radius (app_settings.radius); 16 until it comes
      quiet: null,                  // { why: 'call' | 'meeting' | '' } while in a call or a meeting (app_quiet)
      visible: true,                // app_visible: false while nobody can see the capsule (no orb frames)
      opened: {},                   // page id -> the version the capsule opened (for you: unopened first)
      flashes: [],                  // [{ glyph, text, sub, at, ttl, kiss, still, kind }]
      turnNames: null, chips: [],   // agents that appeared during your turn
      pages: [],                    // "for you": the pages made for you, newest first (state.pages)
      timers: [],                   // the hub's standing orders (state.timers): a page with one is watched
      lastPage: null,               // the page `is ready · fn + o` named last
      pane: null,                   // null | 'agents' | 'inbox' | 'spot'
      spotText: "",
      answered: {},                 // card id -> true, until the hub drops the card
      sel: 0,                       // the inbox's chosen card
    };
  }

  const names = (agents) => agents.map((a) => a.name);
  // a page you opened (from the capsule, or the core's opened_version when it says so) at its
  // current version; for you lists the ready pages, unopened first, then newest
  const openedAt = (m, p) => Math.max(m.opened[p.id] || 0, p.opened_version || 0);
  const opened = (m, p) => openedAt(m, p) >= (p.version || 1);
  // the number on the menu-bar icon and this list agree (vision §3 G, ambient-lead m_5515): the
  // questions and approvals waiting + the pages with a version you haven't opened; amb-mac's
  // MenuRows counts the same from the same state (fixtures/count.json is the shared case list)
  const count = (m) => visibleCards(m).length + m.pages.filter((p) => p.state !== "writing" && !opened(m, p)).length;
  const forYouPages = (m) => {
    const ready = m.pages.filter((p) => p.state !== "writing");
    return [...ready.filter((p) => !opened(m, p)), ...ready.filter((p) => opened(m, p))];
  };
  // the capsule opens a page: app_open_url, and the page counts as opened at its version
  function openPage(m, p, url) {
    return { m: { ...m, lastPage: p.id, opened: { ...m.opened, [p.id]: p.version || 1 } }, cmds: [{ cmd: "app_open_url", url: url || p.url, page: p.id }] };
  }
  const sortPages = (pages) => pages.slice().sort((a, b) => (b.at_ms || 0) - (a.at_ms || 0));
  // a page's name on your surfaces: its title, else its id with spaces (vision §3 B)
  const pageName = (p) => p.title || String(p.id).replace(/-/g, " ");
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
  // a batch of drafts on one page (amb-core 34703bf0, card.page.drafts, card.batch {count, title,
  // what, names}); without batch, read from its text '<n> drafts ready: a · b · c'
  function batchOf(c) {
    if (!c || !c.page || !c.page.drafts) return null;
    const b = c.batch || {};
    // without batch: amb-core's text, '<n> drafts wait for you · <title>\n<line>\n1. review…' (e2d256e1),
    // or the first one's '<n> drafts ready: a · b · c'
    const lines = String(c.text || "").split("\n");
    const tm = /^(\d+)\s+drafts?[^:]*:\s*(.*)$/.exec(lines[0]);
    const tw = /^(\d+)\s+drafts? wait for you(?:\s*·\s*(.*))?$/.exec(lines[0]);
    const opts = Wd.options(c);
    const review = opts.find((o) => /review/i.test(o.label)) || { i: 0, n: 1 };
    const send = opts.find((o) => /send/i.test(o.label)) || { i: 1, n: 2 };
    const names = Array.isArray(b.names) ? b.names.map(String) : tm ? tm[2].split(/\s*·\s*/).filter(Boolean) : [];
    const count = +b.count || (tm ? +tm[1] : tw ? +tw[1] : names.length || 2);
    const line = !c.batch && tw && lines[1] && !/^\d+\./.test(lines[1]) ? lines[1] : null;
    return { count, title: b.title || (tw && tw[2]) || c.page.title || "", what: b.what || "drafts", names, line, review, send };
  }

  function answer(m, card, opt, now) {
    const choice = opt ? opt.label : null;
    const reply = String(opt.n);
    const m2 = { ...m, answered: { ...m.answered, [card.id]: true }, sel: 0, pane: m.pane === "inbox" && visibleCards(m).length <= 1 ? null : m.pane };
    const f = { kind: "answered", glyph: "✓", text: Wd.answeredLine(card.agent, choice), ttl: T.answered, kiss: true };
    // a batch of drafts: review opens the page at the first draft (the card stays open on the hub);
    // send all says '∿ sending 3 replies.', dim, 4 s: nothing has left yet (ambient-lead m_6063)
    const b = batchOf(card), p = card.page;
    if (b) {
      if (opt.n === b.send.n) return { m: flashNow(m2, { kind: "sending", glyph: "∿", text: Wd.drafts.sending(b.count, b.what), ttl: T.answered }, now), cmds: [{ cmd: "answer", card: card.id, reply }] };
      return { m: { ...m2, lastPage: p.id || m.lastPage }, cmds: [{ cmd: "answer", card: card.id, reply }, ...(p.url ? [{ cmd: "app_open_url", url: p.url, page: p.id }] : [])] };
    }
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
        let m2 = { ...m, agents, cards, seen: true, pages: Array.isArray(ev.pages) ? sortPages(ev.pages) : m.pages,
          timers: Array.isArray(ev.timers) ? ev.timers.filter((t) => t && t.id != null) : m.timers };
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
        // a note talk (fn held on a bise page, §4.1): its words go to the page, not to main
        m2.notePage = phase === "listening" ? ev.page || m.notePage || null : null;
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

      // a page published or changing state (docs/ambient-pages.md §2.3): a new version that is
      // ready says `<page> is ready · fn + o`, unless the app opens it in front itself
      case "page": {
        if (!ev.id) return none(m);
        const prev = m.pages.find((p) => p.id === ev.id);
        const page = { ...(prev || {}), ...ev };
        delete page.ev; delete page.front;
        const m2 = { ...m, pages: sortPages([page, ...m.pages.filter((p) => p.id !== ev.id)]) };
        const fresh = page.state === "ready" && (!prev || prev.version !== page.version || prev.state !== "ready");
        if (!fresh || ev.front) return none(fresh ? { ...m2, lastPage: ev.id } : m2);
        return none(flashQueue({ ...m2, lastPage: ev.id }, { kind: "page", text: Wd.pageReady(pageName(page)), ttl: T.page, page: ev.id }, now));
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
          let m2 = { ...m, pane: null, hello: null };
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
        return none({ ...m, edgeGlow: ev.edge_glow !== false, macos: ev.macos || m.macos, radius: +ev.radius > 0 ? +ev.radius : m.radius,
          // the settings view's fields (amb-mac ef4dbc2e; it keeps them and sends them after every change)
          settings: {
            edge_glow: ev.edge_glow !== false, right_option: !!ev.right_option, meeting_quiet: !!ev.meeting_quiet,
            voice_answers: ev.voice_answers !== false, launch_at_login: ev.launch_at_login || "off",
            skip: Array.isArray(ev.skip) ? ev.skip.map((s) => ({ bundle: s.bundle, name: s.name || s.bundle, fixed: !!s.fixed })) : [],
          } });
      // the settings view: a toggle flips (optimistic; amb-mac answers with app_settings), an app
      // added to the skip list (amb-mac opens the macOS picker) or removed
      case "ui_setting": {
        const s = m.settings || {};
        if (ev.key === "skip_add") return { m, cmds: [{ cmd: "app_setting", key: "skip_add" }] };
        if (ev.key === "skip_remove") {
          const it = (s.skip || []).find((x) => x.bundle === ev.value);
          if (!it || it.fixed) return none(m);
          return { m: { ...m, settings: { ...s, skip: s.skip.filter((x) => x !== it) } }, cmds: [{ cmd: "app_setting", key: "skip_remove", value: ev.value }] };
        }
        if (!SETTING_KEYS.includes(ev.key)) return none(m);
        const on = ev.key === "launch_at_login" ? s.launch_at_login !== "on" && s.launch_at_login !== "approve" : !s[ev.key];
        const val = ev.key === "launch_at_login" ? (on ? "approve" : "off") : on;
        return { m: { ...m, settings: { ...s, [ev.key]: val } }, cmds: [{ cmd: "app_setting", key: ev.key, value: on }] };
      }
      case "app_hidden": {
        // hidden (esc, fn ., a click away, the app's timers: docs/ambient-app.md §8): an open pane
        // closes, so the next timed show is never stuck behind a stale full view
        const hidden = !!(ev.on ?? ev.hidden);
        if (!hidden || !m.pane) return none({ ...m, hidden });
        const r = setPane({ ...m, hidden }, null);
        return r;
      }
      case "app_reduce_motion":
        return none({ ...m, reduce: !!(ev.on ?? ev.reduce) });
      case "app_key":
        // a card clicked in the menu bar's :* menu (amb-mac, 60c247e9): the inbox, at that card
        if (ev.key === "i" && ev.card) {
          const i = visibleCards(m).findIndex((c) => c.id === ev.card);
          const r = setPane(m, "inbox");
          return { m: { ...r.m, sel: Math.max(0, i) }, cmds: r.cmds };
        }
        return key(m, ev.key, now);
      // a call or a meeting (amb-mac, 62d2105; replayed after a reload): main answers in text only
      // and the non-urgent cards wait (no needs-you glass); the inbox still lists them
      // nobody can see the capsule (hidden, covered, the screen locked or asleep; amb-mac e3c5dcf6):
      // the orb stops drawing until it is seen again
      case "app_visible":
        return none({ ...m, visible: ev.on !== false });
      // the menu-bar icon's rect in the page's CSS px (the capsule grows out of it, SPEC §0)
      case "app_icon":
        return none({ ...m, icon: [ev.x, ev.y, ev.w, ev.h].every((n) => Number.isFinite(+n)) ? { x: +ev.x, y: +ev.y, w: +ev.w, h: +ev.h } : null });
      // the hello, once ever (ambient m_5702; amb-mac sends it once and keeps "said hello")
      case "app_hello":
        return none({ ...m, hello: { at: now } });
      case "app_quiet":
        return none({ ...m, quiet: ev.on ? { why: ev.why || "" } : null });
      // today's morning page, opened in front by the app (amb-mac, 7d65d59e): the capsule names
      // it, fn + o brings it back
      case "app_morning": {
        if (!ev.id) return none(m);
        const prev = m.pages.find((p) => p.id === ev.id);
        const page = { state: "ready", ...(prev || {}), id: ev.id, title: ev.title || (prev && prev.title), url: ev.url || (prev && prev.url) };
        // the app opened it in front: it counts as opened; N = the things that need you (the
        // morning page's 'needs you' lines are the same cards and pages: the shared count)
        const m2 = { ...m, pages: sortPages([page, ...m.pages.filter((p) => p.id !== ev.id)]), lastPage: ev.id, opened: { ...m.opened, [ev.id]: page.version || 1 } };
        return none(flashQueue(m2, { kind: "morning", text: Wd.morning(!!ev.greet, count(m2)), ttl: T.page, page: ev.id }, now));
      }

      // ---- the page's own (clicks, the spotlight field)
      case "ui_option": {
        const card = m.cards.find((c) => c.id === ev.card);
        const opt = card && Wd.options(card)[ev.i];
        if (!opt || m.answered[card.id]) return none(m);
        return answer(m, card, opt, now);
      }
      case "ui_open_card":   // a click on a card's `fn + ⏎ open it`
        return openCard(m, m.cards.find((c) => c.id === ev.card));
      case "ui_page": {      // a click on a page in "for you"
        const p = m.pages.find((x) => x.id === ev.page);
        return p ? openPage(m, p) : none(m);
      }
      case "ui_capsule":     // a click on the small capsule: the agents
        if (m.hello) return none({ ...m, hello: null });   // a click ends the hello
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

  function openCard(m, card) {
    const p = card && card.page;
    if (!p || !p.url) return { m, cmds: [] };
    const known = m.pages.find((x) => x.id === p.id);
    if (known) return openPage(m, known, p.url);
    return { m: { ...m, lastPage: p.id || m.lastPage }, cmds: [{ cmd: "app_open_url", url: p.url, page: p.id }] };
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
      // fn + ⏎: a card asked from a page opens that page at the question (amb-core, 7e41f98e:
      // card.page {id, block, url}, the url ending with #block)
      // in the full view with no card from a page to open, fn + ⏎ opens for you's first page (its
      // newest version: the page's url is always its latest)
      case "enter": {
        const card = cards[m.pane === "inbox" || m.pane === "agents" ? m.sel : 0];
        if (m.pane === "agents" && !(card && card.page && card.page.url) && forYouPages(m)[0]) return openPage(m, forYouPages(m)[0]);
        return openCard(m, card);
      }
      case "space": return setPane(m, m.pane === "spot" ? null : "spot");
      // fn + o: in the full view, the first page of for you (unopened first); else the page the
      // capsule named last, else the newest; the app opens it or brings its tab
      case "o": {
        // a batch of drafts asking: fn o opens its page at the first draft (amb-core 34703bf0)
        const ask0 = !m.pane && visibleCards(m)[0];
        if (ask0 && ask0.page && ask0.page.drafts && ask0.page.url) return openCard(m, ask0);
        const p = (m.pane === "agents" && forYouPages(m)[0]) || m.pages.find((x) => x.id === m.lastPage) || m.pages[0];
        return p ? openPage(m, p) : none(m);
      }
      case "i": return setPane(m, m.pane === "inbox" ? null : "inbox");
      case "0": return setPane(m, m.pane === "agents" ? null : "agents");
      // fn + , (and the menu's 'settings…'): the settings view (amb-mac ef4dbc2e)
      case ",": return setPane(m, m.pane === "settings" ? null : "settings");
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
        if (m.hello) return none({ ...m, hello: null });
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

  // ---- the pearl's mood (SPEC §1, round 8): listen while you talk (level = your mic), speak
  // while bise talks (level = its voice), work while main or agents work, need for a question,
  // done / fail for those lines, away while quiet (a call, a meeting), rest otherwise
  function moodOf(v, m, flash, asking) {
    switch (v.state) {
      case "listening": case "voice_note": return "listen";
      case "speaking": return m.hushed ? "work" : "speak";
      case "working": return "work";
      case "needs": case "perm": return "need";
      case "answered": case "done": return "done";
      case "failed": case "error": case "hub_down": return "fail";
    }
    if (v.state === "agents" || v.state === "inbox") return asking.length ? "need" : working(m.agents) ? "work" : m.quiet ? "away" : "rest";
    if (m.quiet) return "away";
    if (v.pose === "think") return "work";
    return "rest";
  }

  // ---- it grows out of the menu-bar icon (SPEC §0): the open/close motion when the app shows or
  // hides the capsule. `icon` is the icon's rect in the page's CSS px (amb-mac's app_icon; above
  // the panel, so y < 0); without it, the panel's top right. Reduced motion: a plain fade.
  const GROW = { open: 750, close: 600, fade: 200, from: 0.15, easeOut: "cubic-bezier(.16, 1, .3, 1)", easeIn: "cubic-bezier(.7, 0, .84, 0)" };
  // the glass leaves with its last words on it (ambient's gate run 3 (b), and its reduced-motion
  // recheck m_5574): with nothing left to show (content none), the capsule keeps drawing the last
  // view it showed (words, chips, label, width, so app_size never shrinks the panel either), with
  // the live hidden flag, mood and settings, through the app's hide and its close (0.6 s, or the
  // 0.2 s fade) and after it, until new content comes; it never draws the empty view in between
  function hold(shown, v) {
    if (v.content.kind !== "none") return { shown: v.hidden ? shown : v, v };
    if (!shown) return { shown, v };
    return { shown, v: { ...shown, hidden: v.hidden, content: v.content, mood: v.mood, lvl: v.lvl, still: v.still, unseen: v.unseen, icon: v.icon, radius: v.radius } };
  }
  // reduced motion for the grow: the app's flag (app_reduce_motion) or the system's (the web
  // view's prefers-reduced-motion), either one is enough, whichever arrived first
  const reduced = (appFlag, system) => !!appFlag || !!system;
  function grow(wasHidden, hidden, reduce, icon, box) {
    if (wasHidden === hidden) return null;
    const open = !hidden;
    if (reduce) return { open, ms: GROW.fade, fade: true, ease: "linear" };
    const b = box || { x: 0, y: 0, w: 0 };
    // the origin, in the animated box's own px: the icon's centre, else the box's top right
    const ox = icon ? icon.x + icon.w / 2 - b.x : b.w;
    const oy = icon ? icon.y + icon.h / 2 - b.y : 0;
    return { open, ms: open ? GROW.open : GROW.close, fade: false, from: GROW.from, origin: `${Math.round(ox)}px ${Math.round(oy)}px`, ease: open ? GROW.easeOut : GROW.easeIn };
  }

  // ---- what the capsule has to show, for the app's show/hide policy (amb-mac, m_5073): talk,
  // type, answer, got and needs the app also derives itself; it acts on line (4 s), open (until
  // esc, fn ., a click away), needs (6 s) and none
  function contentOf(v, flash, asking) {
    switch (v.state) {
      case "listening": case "voice_note": return { kind: "talk" };
      case "spotlight": return { kind: "type" };
      case "working": return { kind: v.words ? "answer" : "got" };
      case "speaking": case "end": return { kind: "answer" };
      case "agents": case "inbox": case "settings": return { kind: "open" };
      case "hello": return { kind: "hello" };
      // a permission ask is opened (until he answers); its refused line is a timed line, 8 s (amb-mac m_5679)
      case "perm": return { kind: v.perm ? "open" : "line" };
      case "needs": return { kind: "needs", card: asking[0] && asking[0].id };
      case "idle": return { kind: "none" };
      // SPEC §0: never for done, failed, a page ready (they live in the menu-bar marble); an
      // answer's line (`cookies has it: yes.`), the morning page, a key's answer, the hub lost do
      case "done": case "failed": case "page": return { kind: "none" };
      default: return { kind: flash || v.state === "hub_down" ? "line" : "none" };
    }
  }

  // ---- what the capsule shows now
  // `wall`: the epoch clock (a page's age); `now` may be the page's own monotonic clock
  function view(m, now, wall = now) {
    const cards = visibleCards(m);
    // in a call or a meeting, only the urgent cards ask (the rest wait in the inbox)
    const asking = m.quiet ? cards.filter((c) => c.urgent) : cards;
    const need = asking.length > 0;
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
      note: null,           // (gone in round 8: a question is the capsule itself, v.ask)
      ask: null,            // a question: { id, agent, title, text, options, hint, open, more }
      edge: { on: false, lvl: 0 },
      hidden: m.hidden,
      unseen: m.hidden || m.visible === false,   // nobody sees it: no orb frames
      icon: m.icon || null,  // the menu-bar icon (the capsule grows out of it)
      radius: m.radius,     // the capsule's and the glass's corners
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

    // a question is ONE glass (round 8, ambient m_5332 (2)): the capsule itself, open, with the
    // pearl, '? cookies needs you', the question, its options and the hint; no second card
    const ask = () => {
      const c = asking[0];
      const b = batchOf(c);
      // a batch of drafts: one glass like a question, its own words, review first (ambient m_6056)
      if (b) return { id: c.id, agent: c.agent, title: Wd.drafts.label(b.count, b.title), text: b.line || Wd.drafts.line(b.what, b.names), hint: W.needsHint, more: asking.length - 1, open: null, batch: true,
        options: [{ i: b.review.i, label: Wd.optionLabel(b.review.n, Wd.drafts.review) }, { i: b.send.i, label: Wd.optionLabel(b.send.n, Wd.drafts.sendAll(b.count)) }] };
      return { id: c.id, agent: c.agent, title: Wd.needsLine(c.agent), text: c.text || "", hint: W.needsHint, more: asking.length - 1,
        open: c.page && c.page.url ? W.openIt : null,
        options: Wd.options(c).map((o) => ({ i: o.i, label: Wd.optionLabel(o.n, o.label) })) };
    };

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
      // `listening · let go of fn to send` on the label's line, the words under it; on a page,
      // `voice note on weekly update` (the words pin on the page, main sees nothing)
      const np = m.notePage;
      v.label = { text: np ? Wd.voiceNoteOn(np.title || pageName(np)) : now - m.cutAt < T.cutIn ? W.cutIn : W.listening, acc: true, rest: m.handsFree ? W.handsFree : W.letGo };
      if (np) v.state = "voice_note";
      v.words = { list: m.heard.text.split(/\s+/).filter(Boolean), per: 0.24 };
      v.words.lit = v.words.list.length;
      if (m.shot && !np) v.sees = m.shot.skipped ? { head: W.notSeen, tail: "" } : Wd.seesParts(m.shot.app, m.shot.title);
      v.edge = { on: m.edgeGlow && !m.reduce, lvl: you };
    } else if (m.hello && now - m.hello.at < helloMs(m)) {
      // the hello, once ever (ambient m_5702): one line, no buttons; the pearl gathers out of a few
      // scattered dots (gather 1 -> 0 over 1.2 s, expo out), the words land, then the kiss puff
      // off its top right (the only kiss bise ever does); reduced motion: no gathering, no puff
      const t = now - m.hello.at;
      v.state = "hello"; v.size = "small"; v.glyph = null;
      v.text = t >= (m.reduce ? 0 : T.helloWords) ? W.hello : null;
      v.gather = m.reduce ? 0 : Math.max(0, 1 - (1 - Math.pow(1 - Math.min(1, t / T.helloGather), 3)));
      v.puff = !m.reduce && t >= T.helloKiss && t < T.helloKiss + T.helloKissMs;
    } else if (m.mine && (m.phase === "sending" || m.phase === "working" || (m.phase === "idle" && now - m.sentAt < 30000 && !m.main.text))) {
      v.state = "working"; v.size = "open"; v.pose = "think";
      v.label = { text: "bise", acc: true };
      if (m.main.text && !m.voice) v.words = mainWords();
      else v.text = now - m.sentAt < T.got ? W.got : W.onShort;
      if (m.line) v.sub = m.line;
      v.chips = m.chips;
    } else if (m.mine && m.phase === "speaking") {
      v.state = "speaking"; v.size = "open";
      v.pose = m.hushed ? "think" : "speak";
      v.lvl = m.hushed ? 0 : lv(m, "main", now);
      v.label = { text: "bise", acc: true };
      v.words = mainWords();
      if (m.hushed) v.sub = W.hush;
      v.chips = m.chips;
    } else if (m.mine && m.phase === "done" && now - m.doneAt < T.endOpen) {
      v.state = "end"; v.size = "open";
      v.label = { text: "bise", acc: true };
      v.words = mainWords();
      if (m.hushed) v.sub = W.hush;
      v.chips = m.chips;
      kissAt(m.doneAt);
    } else if (m.pane === "agents") {
      // the full view (vision §3 G, SPEC §0: fn 0, a hand-open of the app): what's running (each
      // agent with its live line, the pages being written), what needs you (the inbox, 1-9 answer
      // the chosen card), what's for you (the pages, unopened first, then newest; fn o or a click
      // opens one); esc or a click elsewhere closes it
      v.state = "agents"; v.size = "open";
      v.label = { text: `${m.hub.workspace || "agents"} · ${Wd.plural(m.agents.length, "agent", "agents")}` };
      v.titles = { running: W.running, needs: cards.length ? Wd.waiting(cards.length) : null };
      // the empty sections say so, in one line each (nothing running, nothing waiting)
      v.empty = { running: m.agents.length || m.pages.some((p) => p.state === "writing" || p.state === "updating") ? null : W.nothingRunning, needs: cards.length ? null : W.nothingNeeds };
      if (cards.length) v.inbox = inbox();
      const ready = forYouPages(m);
      // unopened first (newest first), each saying 'new' or how many versions came since you
      // looked; the ones you've seen dim below; a watched page says when its agent last checked
      if (ready.length) v.forYou = { title: Wd.forYou, pages: ready.map((p) => {
        const t = m.timers.find((x) => x.page === p.id);
        return { id: p.id, name: pageName(p), meta: Wd.pageMeta(p, wall, openedAt(m, p)), unopened: !opened(m, p), watch: t ? Wd.watching(+t.last_ms || 0, wall) : null };
      }) };
      const writingRows = m.pages.filter((p) => p.state === "writing" || p.state === "updating").map((p) => ({
        name: pageName(p), glyph: "◰", kind: "page", what: Wd.rowLabel(p.state === "writing" ? W.pageWriting : W.pageUpdating), age: "", page: p.id,
      }));
      // the running ones first (and those asking), then the others (done, failed, idle); a done
      // agent's row says its done line, the first sentence of its report (ambient m_5332 (6)); the
      // title is 'running' only when every row runs, else 'agents'
      const runs = (a) => cards.some((c) => c.agent === a.name) || a.working || ["working", "waiting", "starting", "blocked"].includes(a.status);
      const ordered = [...m.agents.filter(runs), ...m.agents.filter((a) => !runs(a))];
      v.list = ordered.map((a) => {
        const asks = cards.some((c) => c.agent === a.name);
        const doneLine = a.status === "done" && a.report ? Wd.firstSentence(a.report) : "";
        return {
          name: a.name,
          glyph: asks ? "?" : Wd.GLYPH[a.status] || "·",
          kind: asks ? "need" : a.status,
          // short: its task line, or a done agent's done line
          what: Wd.rowLabel(asks ? "needs you" : doneLine || a.note || a.status),
          age: Wd.age(a.turn_ms),
        };
      }).concat(writingRows);
      if (ordered.some((a) => !runs(a))) v.titles.running = W.agents;
    } else if (m.pane === "settings") {
      // fn + , : glass rows with toggles, then the windows bise never sees (amb-mac keeps them;
      // words: best guesses, asked to ambient; the empty line is ambient's)
      const s = m.settings || { edge_glow: m.edgeGlow, skip: [] };
      v.state = "settings"; v.size = "open";
      v.label = { text: W.set.title };
      v.settings = {
        rows: SETTING_KEYS.map((key) => ({
          key, label: W.set[key], on: key === "launch_at_login" ? s.launch_at_login === "on" || s.launch_at_login === "approve" : !!s[key],
          note: key === "launch_at_login" && s.launch_at_login === "approve" ? W.set.approve
            : key === "meeting_quiet" ? W.set.meeting_quiet_note : null,
        })),
        skipTitle: W.set.skipTitle,
        // two fixed rows first (private windows, password managers: ambient m_5410), then his apps,
        // each with 'remove'; amb-mac's fixed entries (the password managers) are in the second row
        always: W.set.fixed,
        skip: (s.skip || []).filter((x) => !x.fixed).map((x) => ({ bundle: x.bundle, name: x.name })),
        add: W.set.add, remove: W.set.remove,
      };
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
      v.state = "needs"; v.size = "open"; v.ask = ask();
    } else {
      // at rest nothing shows (docs/ambient-app.md §8, 'out of the way'): no status line; the app
      // hides the capsule (app_content none) and the menu-bar icon carries the count
      v.state = "idle";
      if (inTurn(m)) v.pose = "think";   // main on its own turn: the * turns, the capsule stays small
    }
    v.content = contentOf(v, flash, asking);
    v.mood = moodOf(v, m, flash, asking);
    // the open states keep the key lines too (cancelled, an error) as their sub line; a
    // permission ask stays alone in the capsule (ambient, m_4671)
    if (flash && v.size === "open" && !v.sub && v.state !== "perm" && flash.kind !== "answered") v.sub = flash.text;
    if (m.reduce) { v.still = true; v.edge.on = false; }
    return v;
  }

  root.AmbModel = { init, step, view, T, visibleCards, grow, GROW, reduced, count, hold };
})(typeof window !== "undefined" ? window : globalThis);
