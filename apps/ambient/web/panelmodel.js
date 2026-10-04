// bise ambient · round 10's side panel (ambient's identity10.html, lead m_7047): one agent's whole
// history, live, where he answers it, writes to it, follows it, stops or archives it. It lives in
// its own window (amb-mac's panel.html, m_7040/m_7042) docked to the screen's right edge; the bar's
// ⏎ on an agent opens it. This file is pure: step(m, ev, now) -> { m, cmds }, view(m, now, wall);
// panelui.js draws the view, check.mjs reads it.
//
// in:  app_panel {agent, on, h} (amb-mac, on every open and agent change; on:false on any close),
//      state, hub, agent_history {agent, entries, before, more}, agent_entry {agent, entry},
//      agent_typing {agent, text}, agent_queued {agent, text}, sent {agent, mode}, error,
//      app_reduce_motion, app_focused, app_settings, app_menu {key:'close'}
// out: agent_history {agent, before?, limit}, agent_unwatch, agent_send {agent, text, mode},
//      answer {card, reply}, follow, stop, archive {agent, stop_first}, unarchive, open_terminal,
//      app_panel {agent} (⌘↑↓ re-points the window), app_panel_close, app_open_url, app_copy, app_quit
(function (root) {
  "use strict";
  const Wd = root.AmbWords, W = Wd.W, P = W.panel, F = W.bar.find;
  const M = root.AmbModel;
  const LIMIT = 60;
  const RUNS = ["working", "waiting", "blocked"];
  const T = { toast: 2200, undo: 6000 };

  function init() {
    return {
      on: false, agent: null, h: 0,
      agents: [], cards: [], follows: {},
      entries: [], before: null, more: false, loading: false,
      typing: "", queued: [], comp: "",
      find: null, findAt: 0,          // null: closed; else the text he looks for
      confirm: null,                  // null | 'stop' | 'archive'
      menu: false, open: {},          // the ⋯ menu; the unfolded tools entries (pos -> true)
      toast: null,                    // { text, at, undo?: agent }
      reduce: false, focused: false, radius: 26,
    };
  }

  // the agent rows, as the bar orders them (waiting first...), from the same state
  const rows = (m, wall, q = "") => M.roster({ agents: m.agents, cards: m.cards, answered: {}, follows: m.follows }, q, wall);
  const rowOf = (m, wall, name) => rows(m, wall, name).find((r) => r.name === name) || null;
  const hhmm = (ms) => { if (!(ms > 0)) return ""; const d = new Date(ms); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

  // entries by pos; the same pos replaces (a tools entry growing, a card answered), its card's
  // fields kept when the update only says {id, answered}
  function merge(list, add) {
    const byPos = new Map(list.map((e) => [e.pos, e]));
    for (const e of add) {
      if (!e || e.pos == null) continue;
      const old = byPos.get(e.pos);
      byPos.set(e.pos, old ? { ...old, ...e, card: e.card ? { ...(old.card || {}), ...e.card } : old.card } : e);
    }
    return [...byPos.values()].sort((a, b) => a.pos - b.pos);
  }

  // a new agent in the panel: its last 60 entries, the old one unwatched
  function show(m, agent) {
    const cmds = [];
    if (m.agent && m.agent !== agent) cmds.push({ cmd: "agent_unwatch", agent: m.agent });
    const fresh = { ...m, agent, entries: [], before: null, more: false, loading: true, typing: "", queued: [], comp: m.agent === agent ? m.comp : "",
      find: null, findAt: 0, confirm: null, menu: false, open: {} };
    cmds.push({ cmd: "agent_history", agent, limit: LIMIT });
    return { m: fresh, cmds };
  }
  const toast = (m, text, now, undo) => ({ ...m, toast: { text, at: now, ...(undo ? { undo } : {}) } });
  const toastOn = (m, now) => m.toast && now - m.toast.at < (m.toast.undo ? T.undo : T.toast);

  // archive it: out of the list (the state says so soon), ⌘Z undoes while its line shows; the
  // panel goes on to the next agent, or closes when none is left
  function archive(m, now, wall, stopFirst) {
    const name = m.agent;
    const list = rows(m, wall).filter((r) => r.name !== name);
    const i = rows(m, wall).findIndex((r) => r.name === name);
    const next = list[Math.min(Math.max(0, i), list.length - 1)];
    const agents = m.agents.map((a) => (a.name === name ? { ...a, archived: true } : a));
    const m2 = toast({ ...m, agents, confirm: null, menu: false }, P.archived(name), now, name);
    const cmds = [{ cmd: "archive", agent: name, stop_first: !!stopFirst }];
    if (!next) return { m: m2, cmds: [...cmds, { cmd: "agent_unwatch", agent: name }, { cmd: "app_panel_close" }] };
    const r = show(m2, next.name);
    return { m: r.m, cmds: [...cmds, ...r.cmds, { cmd: "app_panel", agent: next.name }] };
  }

  function step(m, ev, now, wall = now) {
    const none = (x) => ({ m: x, cmds: [] });
    const mine = (e) => e.agent && e.agent === m.agent;
    switch (ev && ev.ev) {
      case "app_panel": {
        if (ev.on === false) {
          const cmds = m.agent ? [{ cmd: "agent_unwatch", agent: m.agent }] : [];
          return { m: { ...init(), agents: m.agents, cards: m.cards, follows: m.follows, reduce: m.reduce, radius: m.radius, toast: m.toast }, cmds };
        }
        if (!ev.agent) return none(m);
        const h = +ev.h > 0 ? +ev.h : m.h;
        if (ev.agent === m.agent && m.on) return none({ ...m, h });
        const r = show({ ...m, on: true, h }, ev.agent);
        return r;
      }
      case "state":
        return none({ ...m, agents: Array.isArray(ev.agents) ? ev.agents : m.agents, cards: Array.isArray(ev.cards) ? ev.cards : m.cards });
      case "app_reduce_motion": return none({ ...m, reduce: !!ev.on });
      case "app_focused": return none({ ...m, focused: !!ev.on });
      case "app_settings": return none({ ...m, radius: +ev.radius > 0 ? +ev.radius : m.radius });
      case "app_menu": return ev.key === "close" ? { m, cmds: [{ cmd: "app_panel_close" }] } : none(m);

      case "agent_history": {
        if (!mine(ev)) return none(m);
        const entries = merge(m.entries, Array.isArray(ev.entries) ? ev.entries : []);
        return none({ ...m, entries, before: ev.before ?? null, more: !!ev.more, loading: false });
      }
      case "agent_entry": {
        if (!mine(ev) || !ev.entry) return none(m);
        const e = ev.entry;
        // his message arrived: the queued line with the same words goes
        const queued = e.kind === "you" ? m.queued.filter((q) => q.trim() !== String(e.text || "").trim()) : m.queued;
        return none({ ...m, entries: merge(m.entries, [e]), queued });
      }
      case "agent_typing": return mine(ev) ? none({ ...m, typing: String(ev.text || "") }) : none(m);
      case "agent_queued": return mine(ev) && ev.text ? none({ ...m, queued: [...m.queued, String(ev.text)] }) : none(m);
      case "error": return m.on ? none(toast(m, String(ev.text || ""), now)) : none(m);

      // ---- his hands (a click = its key; panelui.js maps the keys)
      case "ui_type": return none({ ...m, comp: String(ev.text ?? "") });
      case "ui_send": {
        const text = m.comp.trim();
        if (!text || !m.agent) return none(m);
        const mode = ev.mode === "queued" ? "queued" : "now";
        return { m: { ...m, comp: "" }, cmds: [{ cmd: "agent_send", agent: m.agent, text, mode }] };
      }
      case "ui_answer": {
        const e = m.entries.find((x) => x.card && x.card.id === ev.card);
        if (!e || e.card.answered) return none(m);
        const o = (e.card.options || []).find((x) => +x.n === +ev.n);
        const entries = m.entries.map((x) => (x === e ? { ...x, card: { ...x.card, answered: true, picked: o ? o.label : String(ev.n) } } : x));
        return { m: { ...m, entries }, cmds: [{ cmd: "answer", card: ev.card, reply: String(ev.n) }] };
      }
      case "ui_digit": {
        // 1-9 with an empty composer: the open card's option with that digit
        if (m.comp.trim()) return none(m);
        const e = openCard(m);
        const o = e && (e.card.options || []).find((x) => +x.n === +ev.n);
        return o ? step(m, { ev: "ui_answer", card: e.card.id, n: o.n }, now, wall) : none(m);
      }
      case "ui_fold": return none({ ...m, open: { ...m.open, [ev.pos]: !m.open[ev.pos] } });
      case "ui_older":
        if (!m.more || m.loading || !m.agent) return none(m);
        return { m: { ...m, loading: true }, cmds: [{ cmd: "agent_history", agent: m.agent, before: m.before, limit: LIMIT }] };
      case "ui_follow": {
        const r = m.agent && rowOf(m, wall, m.agent);
        if (!r) return none(m);
        const on = !r.followed;
        return { m: toast({ ...m, menu: false, follows: { ...m.follows, [m.agent]: on } }, on ? P.followOn(m.agent) : P.followOff(m.agent), now), cmds: [{ cmd: "follow", agent: m.agent, on }] };
      }
      case "ui_terminal": return m.agent ? { m: { ...m, menu: false }, cmds: [{ cmd: "open_terminal", agent: m.agent }] } : none(m);
      case "ui_stop": {
        const r = m.agent && rowOf(m, wall, m.agent);
        return r && RUNS.includes(r.status) ? none({ ...m, confirm: "stop", menu: false }) : none({ ...m, menu: false });
      }
      case "ui_archive": {
        const r = m.agent && rowOf(m, wall, m.agent);
        if (!r) return none(m);
        // still working: it asks first; idle or done: at once, ⌘Z undoes
        if (RUNS.includes(r.status)) return none({ ...m, confirm: "archive", menu: false });
        return archive(m, now, wall, false);
      }
      case "ui_yes": {
        if (m.confirm === "stop") return { m: toast({ ...m, confirm: null }, P.stopped(m.agent), now), cmds: [{ cmd: "stop", agent: m.agent }] };
        if (m.confirm === "archive") return archive(m, now, wall, true);
        return none(m);
      }
      case "ui_no": return none({ ...m, confirm: null });
      case "ui_undo": {
        const name = toastOn(m, now) && m.toast.undo;
        if (!name) return none(m);
        const agents = m.agents.map((a) => (a.name === name ? { ...a, archived: false } : a));
        return { m: toast({ ...m, agents }, P.back(name), now), cmds: [{ cmd: "unarchive", agent: name }] };
      }
      case "ui_menu": return none({ ...m, menu: !m.menu });
      case "ui_copy_name": return m.agent ? { m: toast({ ...m, menu: false }, P.copied(m.agent), now), cmds: [{ cmd: "app_copy", text: m.agent }] } : none(m);
      case "ui_copy": return ev.text ? { m: toast(m, P.copied(Wd.rowLabel(Wd.firstSentence(ev.text, 30))), now), cmds: [{ cmd: "app_copy", text: ev.text }] } : none(m);
      case "ui_quit": return { m: { ...m, menu: false }, cmds: [{ cmd: "app_quit" }] };
      case "ui_page": return ev.url ? { m, cmds: [{ cmd: "app_open_url", url: ev.url, page: ev.page }] } : none(m);
      // ⌘↑ ⌘↓: the agent above / below in the bar's order, the same window
      case "ui_step": {
        const list = rows(m, wall);
        if (list.length < 2 || !m.agent) return none(m);
        const i = list.findIndex((r) => r.name === m.agent);
        const next = list[(Math.max(0, i) + (ev.d < 0 ? -1 : 1) + list.length) % list.length];
        const r = show(m, next.name);
        return { m: r.m, cmds: [...r.cmds, { cmd: "app_panel", agent: next.name }] };
      }
      // ⌘F: find in its history (the loaded entries); ⏎ the next hit, esc done
      case "ui_find_open": return none({ ...m, find: m.find ?? "", findAt: 0, menu: false });
      case "ui_find": return none({ ...m, find: String(ev.text ?? ""), findAt: 0 });
      case "ui_find_next": return m.find ? none({ ...m, findAt: m.findAt + 1 }) : none(m);
      // esc: leaves find, then the question, then the menu, then closes
      case "ui_esc":
        if (m.find != null) return none({ ...m, find: null, findAt: 0 });
        if (m.confirm) return none({ ...m, confirm: null });
        if (m.menu) return none({ ...m, menu: false });
        return { m, cmds: [{ cmd: "app_panel_close" }] };
      case "ui_close": return { m, cmds: [{ cmd: "app_panel_close" }] };
      default:
        return none(m);
    }
  }

  // the first card still waiting on him in this history
  const openCard = (m) => m.entries.find((e) => e.kind === "card" && e.card && !e.card.answered) || null;
  const textOf = (e) => [e.text, e.tools && e.tools.summary, e.card && e.card.question, e.page && e.page.title].filter(Boolean).join(" ");

  // what the panel shows
  function view(m, now, wall = now) {
    const name = m.agent;
    const r = name ? rowOf(m, wall, name) : null;
    const status = r ? r.status : "idle";
    const chip = { text: `${F.status[status] || status}${r && r.age ? ` · ${r.age}` : ""}`, gc: { waiting: "a", blocked: "risk", failed: "risk", done: "ok" }[status] || null };
    const q = m.find ? m.find.toLowerCase() : "";
    const hits = q ? m.entries.filter((e) => textOf(e).toLowerCase().includes(q)).map((e) => e.pos) : [];
    const cur = hits.length ? hits[m.findAt % hits.length] : null;
    const first = openCard(m);
    const entries = m.entries.map((e) => {
      const out = { pos: e.pos, kind: e.kind, at: hhmm(e.at_ms), text: String(e.text || ""), hit: hits.includes(e.pos), cur: e.pos === cur };
      if (e.kind === "you") out.who = P.you;
      else if (e.kind === "from-agent") out.who = e.from || "";
      else if (e.kind === "report") { out.who = `${name} · ${P.report}`; out.glyph = e.report && e.report.kind === "done" ? "✓" : e.report && ["failed", "blocked"].includes(e.report.kind) ? "▲" : ""; }
      else out.who = name;
      if (e.tools) out.tools = { summary: e.tools.summary || out.text, count: e.tools.count || 0, items: (e.tools.items || []).map((i) => ({ text: String(i.text || ""), land: !!i.land })), open: !!m.open[e.pos] };
      if (e.card) {
        const c = e.card;
        out.card = { id: c.id, question: c.question || out.text, answered: !!c.answered, picked: c.picked || null, keys: e === first,
          // what he answered (ambient m_7058): the option he picked here, or the core's answer when it says
          done: c.answered ? (c.picked || c.answer || c.reply ? P.youAnswered(c.picked || c.answer || c.reply) : P.answered) : null,
          label: P.needsYou(name, out.at), options: (c.options || []).map((o) => ({ n: o.n, label: o.label, act: { ev: "ui_answer", card: c.id, n: o.n } })) };
      }
      if (e.page) out.page = { t: `${e.page.title || e.page.id} · v${e.page.v || 1}`, act: { ev: "ui_page", url: e.page.url, page: e.page.id } };
      return out;
    });
    const n = first ? (first.card.options || []).length : 0;
    const hints = [
      { keys: ["⏎"], w: P.sendNow, act: { ev: "ui_send", mode: "now" } },
      { keys: ["tab"], w: P.whenFree, act: { ev: "ui_send", mode: "queued" } },
      ...(first && !m.comp.trim() && n ? [{ keys: ["1", "–", String(Math.max(...first.card.options.map((o) => +o.n)))], w: P.answer }] : []),
    ];
    const followed = !!(r && r.followed);
    return {
      on: m.on && !!name, name, status, chip, title: r ? r.title : "", followed, canStop: RUNS.includes(status),
      size: { w: 84 + 440, h: m.h, radius: m.radius },
      tools: [
        { id: "follow", w: followed ? P.following : P.follow, keys: ["⌘", "D"], on: followed, act: { ev: "ui_follow" } },
        { id: "terminal", w: P.terminal, keys: ["⌘", "O"], act: { ev: "ui_terminal" } },
        ...(RUNS.includes(status) ? [{ id: "stop", w: P.stop, keys: ["⌘", "."], act: { ev: "ui_stop" }, risk: true }] : []),
        { id: "archive", w: P.archive, keys: ["⌘", "⌫"], act: { ev: "ui_archive" } },
      ],
      confirm: m.confirm === "stop" ? { text: P.confirmStop(name), yes: P.yesStop } : m.confirm === "archive" ? { text: P.confirmArchive(name), yes: P.yesArchive } : null,
      keep: P.keep,
      menu: m.menu ? [
        { w: followed ? P.menu.unfollow : P.menu.follow, keys: ["⌘", "D"], act: { ev: "ui_follow" } },
        { w: P.menu.terminal, keys: ["⌘", "O"], act: { ev: "ui_terminal" } },
        { w: P.menu.find, keys: ["⌘", "F"], act: { ev: "ui_find_open" } },
        { w: P.menu.copyName, keys: [], act: { ev: "ui_copy_name" } },
        null,
        ...(RUNS.includes(status) ? [{ w: P.menu.stop, keys: ["⌘", "."], act: { ev: "ui_stop" } }] : []),
        { w: P.menu.archive, keys: ["⌘", "⌫"], act: { ev: "ui_archive" } },
        null,
        { w: P.menu.quit, keys: ["⌘", "Q"], act: { ev: "ui_quit" } },
      ] : null,
      find: m.find == null ? null : { text: m.find, n: hits.length, label: !m.find ? "" : P.found(hits.length), cur },
      entries, more: m.more, loading: m.loading, empty: !m.loading && !m.entries.length ? P.empty : null,
      typing: status === "working" || m.typing ? m.typing : "",
      queued: m.queued.map((t) => ({ text: t, label: P.queued })),
      comp: m.comp, ph: name ? P.write(name) : "", hints, close: { keys: ["esc"], w: P.close, act: { ev: "ui_close" } },
      toast: toastOn(m, now) ? { text: m.toast.text, undo: m.toast.undo ? { keys: ["⌘", "Z"], w: P.undo, act: { ev: "ui_undo" } } : null } : null,
      mood: { waiting: "need", working: "work", done: "done", blocked: "fail", failed: "fail" }[status] || "rest",
      still: m.reduce,
    };
  }

  root.AmbPanel = { init, step, view, merge, T, LIMIT };
})(typeof window !== "undefined" ? window : globalThis);
