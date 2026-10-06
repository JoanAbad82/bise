// bise desktop · the window's state and its one reducer, pure: step(s, ev) -> { s, cmds, eat }.
// `ev` is a core event (S3a's typed events: projects, agents, cards, jobs, artifacts, thread,
// entry, typing; the shell's win_open/win_theme/win_focused) or a ui_* event from winui.js (a
// click, a key, the composer's text). `cmds` go to the core (subscribe, page, send, answer,
// stop) or the shell (win_title). `eat`: the key was the window's (winui.js prevents its
// default). Who decides what a key does is here, never in the DOM code.
//
// Keys (desktop-app v9, "les raccourcis"): ⌘0 bise · ⌘1-9 the projects in the sidebar's order ·
// ⌥0 the project's main · ⌥1-9 its agents · ⌘[ ⌘] back and forward · ⌘I the inbox above the
// composer · ctrl+1-9 the inbox at that card · ← → the other cards · 1-9 picks an option when
// the field is empty · ⏎ sends (or answers the card above) · esc steps back (inbox, quote, the
// card, then the agent's thread to its main) · ⌘E unfolds everything · ⌘. stops the agent.
(function (root) {
  "use strict";
  const D = root.AmbWinDock;
  const { HOME, keyOf } = D;

  function init(now = 0) {
    return {
      now, tz: undefined, user: { name: "you" }, offline: false, theme: "dark", focused: true,
      projects: [], agents: {}, cards: {}, jobs: {}, arts: {}, sched: {},
      threads: {},                 // "project/agent" -> { entries, before, more, loading, typing }
      route: { project: HOME, agent: "main" }, back: [], fwd: [],
      tab: {},                     // project -> thread | changes | artifacts
      inbox: null,                 // { i } while the inbox is open above the composer
      dockI: {}, dockOff: {},      // per thread: the card shown, the cards put off with esc
      drafts: {}, quotes: {},      // per thread: the composer's text, its quotes ❝
      sel: null,                   // { key, pos, a, b }: selected diff lines
      open: {},                    // "key#pos" -> unfolded
      all: false,                  // ⌘E: everything unfolded
      answered: {},                // card id -> what he answered (hidden at once, named in the thread)
      picked: null,                // { card, n }: the option on its way
      finder: null,                // { q, i } while ⌘K's finder is open
    };
  }

  const set = (o, k, v) => ({ ...o, [k]: v });
  const agentsOf = (s, project) => (s.agents[project] || []).filter((a) => !a.main && !a.archived);
  const projectsInOrder = (s) => s.projects.filter((p) => !p.home).sort((a, b) => (a.order || 0) - (b.order || 0));
  const agentRow = (s, r = s.route) => (s.agents[r.project] || []).find((a) => (r.agent === "main" ? a.main : a.name === r.agent));

  // the thread a route shows; subscribe on first sight
  function needThread(s, r, cmds) {
    const k = keyOf(r);
    if (s.threads[k]) return s;
    cmds.push({ cmd: "subscribe", project: r.project, agent: r.agent, limit: 60 });
    return set(s, "threads", set(s.threads, k, { entries: [], before: null, more: false, loading: true, typing: "" }));
  }
  // S7's screens (amb-web: review, artifacts, environments) plug in as one extension object,
  // root.AmbWinS7 = { init(), owns(ev), enter(s7, route, s), step(s7, ev, s), view(s), tab(s,
  // project, tab), draw(d, UI) }: its state lives in s.s7, its events and cmds pass through here
  const S7 = () => root.AmbWinS7 || null;
  const SCREENS = ["review", "artifacts", "environments"];
  function titleOf(s, r) {
    if (r.screen === "review") return `review · ${r.agent} · ${D.pname(s, r.project)}`;
    if (r.screen) return r.screen;
    if (r.project === HOME) return "bise";
    const p = D.pname(s, r.project);
    return r.agent === "main" ? p : `${r.agent} · ${p}`;
  }
  function go(s, r, cmds, { history = true } = {}) {
    if (!r || keyOf(r) === keyOf(s.route)) return s;
    if (history) s = { ...s, back: [...s.back, s.route].slice(-50), fwd: [] };
    s = { ...s, route: r, inbox: null, sel: null, picked: null, finder: null };
    if (r.screen) {
      const x = S7();
      if (x && x.enter) { const e = x.enter(s.s7 || (x.init && x.init()), r, s); s = { ...s, s7: e.s7 }; cmds.push(...(e.cmds || [])); }
    } else s = needThread(s, r, cmds);
    cmds.push({ cmd: "win_title", text: titleOf(s, r), route: routeOf(r) });
    return s;
  }
  // the route as the shell keeps it for restore (win_title's route, win_open's)
  const routeOf = (r) => (r.screen === "review" ? `review/${r.project}/${r.agent}` : r.screen ? r.screen
    : r.project === HOME ? "bise" : r.agent === "main" ? `project/${r.project}` : `agent/${r.project}/${r.agent}`);

  // a deep link from the shell, the capsule or a card: bise · project/<p> · agent/<p>/<a> · inbox
  // (<p> is the project's id or its name)
  function resolve(s, route) {
    const parts = String(route || "").split("/");
    const proj = (x) => (s.projects.find((p) => p.project === x || p.name === x) || {}).project;
    if (parts[0] === "bise" || parts[0] === "") return { project: HOME, agent: "main" };
    if (parts[0] === "project" && proj(parts[1])) return { project: proj(parts[1]), agent: "main" };
    if (parts[0] === "agent" && proj(parts[1]) && parts[2]) return { project: proj(parts[1]), agent: parts[2] };
    if (parts[0] === "review" && proj(parts[1]) && parts[2]) return { screen: "review", project: proj(parts[1]), agent: parts[2] };
    if (SCREENS.includes(parts[0]) && parts[0] !== "review") return { screen: parts[0], project: HOME, agent: "main" };
    return null;
  }

  // entries: a page replaces (newest) or goes before (older); an entry with a known pos replaces
  // it, a new one goes in pos order
  function mergeEntry(list, e) {
    const out = list.filter((x) => !(x.pending && e.kind === "you" && x.text === e.text));
    const i = out.findIndex((x) => x.pos === e.pos);
    if (i >= 0) { out[i] = e; return out; }
    out.push(e);
    return out.sort((a, b) => (a.pending ? 1 : 0) - (b.pending ? 1 : 0) || a.pos - b.pos);
  }

  function core(s, ev, cmds) {
    switch (ev.ev) {
      case "welcome": case "hello": return { ...s, user: ev.user || s.user, now: ev.now_ms || s.now, offline: false };
      case "projects": return { ...s, projects: ev.projects };
      case "agents": return set(s, "agents", set(s.agents, ev.project, ev.agents));
      case "cards": {
        // a card he answered stays hidden until the core drops it (ids are numbers in S3a v1)
        // (`answered` keeps his words for the thread's line: "you answered: ...")
        const ids = new Set(Object.values({ ...s.cards, [ev.project]: ev.cards }).flat().map((c) => String(c.id)));
        return { ...s, cards: set(s.cards, ev.project, ev.cards), picked: s.picked && ids.has(String(s.picked.card)) ? s.picked : null };
      }
      case "jobs": return set(s, "jobs", set(s.jobs, ev.project, ev.jobs));
      case "artifacts": return set(s, "arts", set(s.arts, ev.project, ev.items));
      case "scheduled": return set(s, "sched", set(s.sched, ev.project, ev.items));
      case "thread": {
        const k = `${ev.project}/${ev.agent}`;
        const t = s.threads[k] || { entries: [], typing: "" };
        const older = t.paging && t.entries.length;
        const entries = older ? [...ev.entries.filter((e) => !t.entries.some((x) => x.pos === e.pos)), ...t.entries] : ev.entries;
        return set(s, "threads", set(s.threads, k, { ...t, entries, before: ev.before, more: !!ev.more, loading: false, paging: false }));
      }
      case "entry": {
        const k = `${ev.project}/${ev.agent}`;
        const t = s.threads[k];
        if (!t) return s; // not subscribed: the next subscribe brings it
        return set(s, "threads", set(s.threads, k, { ...t, entries: mergeEntry(t.entries, ev.entry) }));
      }
      case "typing": {
        const k = `${ev.project}/${ev.agent}`;
        const t = s.threads[k];
        return t ? set(s, "threads", set(s.threads, k, { ...t, typing: ev.text || "" })) : s;
      }
      case "hub": return { ...s, offline: ev.up === false };
      case "win_open": {
        if (ev.route === "inbox") return { ...s, inbox: { i: 0 } };
        return go(s, resolve(s, ev.route), cmds);
      }
      case "win_theme": return { ...s, theme: ev.dark ? "dark" : "light" };
      case "win_focused": return { ...s, focused: !!ev.on };
      case "tick": return { ...s, now: ev.now };
    }
    return s;
  }

  // answer the card above the composer: an option (by its digit) or his words
  function answer(s, d, how, cmds) {
    const c = d.card;
    const opt = how.n != null ? (c.options || []).find((o) => o.n === how.n) : null;
    if (how.n != null && !opt) return s;
    // S3a v1: one answer for questions and approvals alike, the option's digit or his words
    cmds.push({ cmd: "answer", project: c.project, card: c.id, reply: opt ? String(opt.n) : how.text });
    const said = opt ? opt.label : how.text;
    const k = keyOf(s.route);
    s = { ...s, answered: set(s.answered, c.id, said), picked: opt ? { card: c.id, n: opt.n } : null };
    if (how.text != null) s = { ...s, drafts: set(s.drafts, k, "") };
    // the inbox stays open on the next card; it closes with the last one
    if (s.inbox && !D.allCards(s).length) s = { ...s, inbox: null };
    return s;
  }

  // ⏎ sends now (a working agent reads it as a steer); ⌥⏎ queues it for the end of its turn
  // (S3a's send mode; the hub's side comes with amb-hub's queued input, lead m_8258)
  function send(s, cmds, mode = "now") {
    const k = keyOf(s.route);
    const text = (s.drafts[k] || "").trim();
    const quotes = s.quotes[k] || [];
    if (!text) return s;
    const d = D.dock(s);
    if (d && !quotes.length) return answer(s, d, { text }, cmds);
    const q = quotes.length ? quotes.map(({ agent, pos, text: t, file, lines }) => ({ agent, pos, text: t, ...(file ? { file, lines } : {}) })) : null;
    cmds.push({ cmd: "send", project: s.route.project, agent: s.route.agent, text, mode, ...(q ? { quote: q.length === 1 ? q[0] : q } : {}) });
    const t = s.threads[k] || { entries: [] };
    const pending = { pos: Number.MAX_SAFE_INTEGER, at_ms: s.now, kind: "you", text, via: "typed", pending: true, ...(mode === "queued" ? { queued: true } : {}), ...(q ? { quote: q[0] } : {}) };
    return { ...s, drafts: set(s.drafts, k, ""), quotes: set(s.quotes, k, []), sel: null,
      threads: set(s.threads, k, { ...t, entries: [...t.entries, pending] }) };
  }

  // esc steps back one thing at a time
  function esc(s, cmds) {
    const k = keyOf(s.route);
    if (s.inbox) return { ...s, inbox: null };
    if ((s.quotes[k] || []).length) return { ...s, quotes: set(s.quotes, k, s.quotes[k].slice(0, -1)), sel: null };
    if (s.sel) return { ...s, sel: null };
    const d = D.dock(s);
    if (d) return { ...s, dockOff: set(s.dockOff, k, [...(s.dockOff[k] || []), d.card.id]) };
    if (s.route.project !== HOME && s.route.agent !== "main") return go(s, { project: s.route.project, agent: "main" }, cmds);
    return s;
  }

  function moveDock(s, by) {
    const d = D.dock(s);
    if (!d || d.list.length < 2) return s;
    const i = (d.i + by + d.list.length) % d.list.length;
    if (d.mode === "inbox") return { ...s, inbox: { i } };
    return { ...s, dockI: set(s.dockI, keyOf(s.route), i) };
  }

  function key(s, ev, cmds) {
    const k = keyOf(s.route);
    const empty = !(s.drafts[k] || "").length;
    const digit = ev.digit != null ? ev.digit : /^[0-9]$/.test(ev.key) ? +ev.key : null;
    const meta = !!ev.meta, alt = !!ev.alt, ctrl = !!ev.ctrl;
    const eat = (x) => ({ s: x, eat: true });
    const lower = String(ev.key).toLowerCase();
    if (meta && lower === "k") return eat({ ...s, finder: s.finder ? null : { q: "", i: 0 } });
    // ⌘K's finder has the keys while it is open: ↑ ↓ ⏎ esc; the rest types into its field
    if (s.finder && !meta && !ctrl && !alt) {
      const r = root.AmbWinFind.key(s, s.finder, ev.key);
      if (r.eat) return eat(r.route ? go({ ...s, finder: null }, r.route, cmds) : { ...s, finder: r.f });
      return { s, eat: false };
    }
    if (meta && !alt && !ctrl && digit != null) {
      if (digit === 0) return eat(go(s, { project: HOME, agent: "main" }, cmds));
      const p = projectsInOrder(s)[digit - 1];
      return eat(p ? go(s, { project: p.project, agent: "main" }, cmds) : s);
    }
    if (alt && !meta && !ctrl && digit != null) {
      if (s.route.project === HOME) return eat(s);
      if (digit === 0) return eat(go(s, { project: s.route.project, agent: "main" }, cmds));
      const a = agentsOf(s, s.route.project)[digit - 1];
      return eat(a ? go(s, { project: s.route.project, agent: a.name }, cmds) : s);
    }
    if (ctrl && !meta && !alt && digit != null && digit > 0) {
      const list = D.allCards(s);
      return eat(digit <= list.length ? { ...s, inbox: { i: digit - 1 } } : s);
    }
    if (meta && (ev.key === "[" || ev.key === "]")) {
      const from = ev.key === "[" ? s.back : s.fwd;
      if (!from.length) return eat(s);
      const r = from[from.length - 1];
      const rest = from.slice(0, -1);
      const t = go(s, r, cmds, { history: false });
      return eat(ev.key === "[" ? { ...t, back: rest, fwd: [...s.fwd, s.route] } : { ...t, fwd: rest, back: [...s.back, s.route] });
    }
    if (meta && lower === "i") return eat(s.inbox ? { ...s, inbox: null } : D.allCards(s).length ? { ...s, inbox: { i: 0 } } : s);
    if (meta && lower === "e") return eat({ ...s, all: !s.all, open: {} });
    // ⌘D the agent's review (S7), ⌘⇧A every artifact
    if (meta && lower === "d") return eat(s.route.project !== HOME && s.route.agent !== "main" ? go(s, { screen: "review", project: s.route.project, agent: s.route.agent }, cmds) : s);
    if (meta && ev.shift && lower === "a") return eat(go(s, { screen: "artifacts", project: HOME, agent: "main" }, cmds));
    if (meta && ev.key === ".") {
      if (s.route.project === HOME) return eat(s);
      cmds.push({ cmd: "stop", project: s.route.project, agent: s.route.agent });
      return eat(s);
    }
    if (ev.key === "Escape") return eat(esc(s, cmds));
    if (ev.key === "Enter" && alt && !meta && !ctrl && !ev.shift) return eat(send(s, cmds, "queued"));
    if (meta || ctrl || alt) return { s, eat: false };
    const d = D.dock(s);
    if (d && empty && (ev.key === "ArrowLeft" || ev.key === "ArrowRight")) return eat(moveDock(s, ev.key === "ArrowLeft" ? -1 : 1));
    if (d && empty && digit != null && digit > 0) return eat(answer(s, d, { n: digit }, cmds));
    if (ev.key === "Enter" && !ev.shift) return eat(send(s, cmds));
    return { s, eat: false };
  }

  function ui(s, ev, cmds) {
    const k = keyOf(s.route);
    switch (ev.ev) {
      case "ui_route": return go(s, { project: ev.project, agent: ev.agent || "main" }, cmds);
      case "ui_type": return set(s, "drafts", set(s.drafts, k, ev.text));
      case "ui_pick": { const d = D.dock(s); return d && d.card.id === ev.card ? answer(s, d, { n: ev.n }, cmds) : s; }
      case "ui_dock": return moveDock(s, ev.by);
      case "ui_inbox": {
        const list = D.allCards(s);
        if (!list.length) return { ...s, inbox: null };
        const i = ev.card ? Math.max(0, list.findIndex((c) => c.id === ev.card)) : 0;
        return { ...s, inbox: ev.close ? null : { i } };
      }
      case "ui_tab": return set(s, "tab", set(s.tab, s.route.project, ev.tab));
      case "ui_fold": {
        // `open` lists the entries flipped by hand from the default (folded, or unfolded under ⌘E)
        const id = `${k}#${ev.pos}`;
        const open = { ...s.open };
        if (open[id]) delete open[id]; else open[id] = true;
        return { ...s, open };
      }
      case "ui_line": {
        const t = s.threads[k];
        const e = t && t.entries.find((x) => x.pos === ev.pos);
        if (!e || !e.diff) return s;
        const a = ev.shift && s.sel && s.sel.key === k && s.sel.pos === ev.pos ? s.sel.a : ev.i;
        const sel = { key: k, pos: ev.pos, a, b: ev.i };
        const q = D.quoteLines(s.route.agent, e, a, ev.i);
        // one quote per diff: a new selection in the same diff replaces its quote
        const quotes = [...(s.quotes[k] || []).filter((x) => x.pos !== ev.pos), q];
        return { ...s, sel, quotes: set(s.quotes, k, quotes) };
      }
      case "ui_quote_text": {
        const t = s.threads[k];
        const e = t && t.entries.find((x) => x.pos === ev.pos);
        if (!e || !String(ev.text || "").trim()) return s;
        return set(s, "quotes", set(s.quotes, k, [...(s.quotes[k] || []), D.quoteText(s.route.agent, e, ev.text)]));
      }
      case "ui_unquote": return set(s, "quotes", set(s.quotes, k, (s.quotes[k] || []).filter((_, i) => i !== ev.i)));
      case "ui_send": return send(s, cmds);
      case "ui_stop": if (s.route.project !== HOME) cmds.push({ cmd: "stop", project: s.route.project, agent: s.route.agent }); return s;
      case "ui_older": {
        const t = s.threads[k];
        if (!t || !t.more || t.paging) return s;
        cmds.push({ cmd: "page", project: s.route.project, agent: s.route.agent, before: t.before, limit: 60 });
        return set(s, "threads", set(s.threads, k, { ...t, paging: true }));
      }
      case "ui_theme": return { ...s, theme: s.theme === "dark" ? "light" : "dark" };
      case "ui_find_type": return s.finder ? { ...s, finder: { q: ev.text, i: 0 } } : s;
      case "ui_find_open": {
        const row = root.AmbWinFind.rows(s, s.finder ? s.finder.q : "")[ev.i];
        return row ? go({ ...s, finder: null }, row.route, cmds) : s;
      }
      case "ui_find_close": return { ...s, finder: null };
    }
    return s;
  }

  function step(s, ev) {
    const cmds = [];
    const x = S7();
    if (x && x.owns && x.owns(ev)) {
      const r = x.step(s.s7 || (x.init && x.init()), ev, s);
      let out = { ...s, s7: r.s7 };
      cmds.push(...(r.cmds || []));
      // a quote ❝ from S7's lines (review): {agent, pos, text, file, lines, n}, one per pos like ui_line
      if (r.quote) { const k = keyOf(out.route); out = { ...out, quotes: set(out.quotes, k, [...(out.quotes[k] || []).filter((q) => q.pos !== r.quote.pos), r.quote]) }; }
      if (r.route) out = go(out, r.route, cmds);
      return { s: out, cmds, eat: !!r.eat };
    }
    if (ev.ev === "ui_key") { const r = key(s, ev, cmds); return { s: r.s, cmds, eat: r.eat }; }
    const out = ev.ev && ev.ev.startsWith("ui_") ? ui(s, ev, cmds) : core(s, ev, cmds);
    return { s: out, cmds, eat: false };
  }

  // the first route: bise's thread, subscribed
  function start(s) {
    const cmds = [];
    const out = needThread(s, s.route, cmds);
    cmds.push({ cmd: "win_title", text: "bise", route: "bise" });
    return { s: out, cmds };
  }

  // is this entry unfolded (a fold, a tools group, an "asked · i answered" why)?
  function isOpen(s, pos) {
    const id = `${keyOf(s.route)}#${pos}`;
    return s.all ? !s.open[id] : !!s.open[id];
  }

  root.AmbWinModel = { init, step, start, isOpen, resolve, agentRow, agentsOf, projectsInOrder, titleOf };
})(typeof window !== "undefined" ? window : globalThis);
