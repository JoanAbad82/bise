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
  // screens that plug in as extensions, each with its state under its own key: S7 (amb-web:
  // review, artifacts, environments) as root.AmbWinS7 in s.s7, S11 (winsetup.js: onboarding,
  // settings, the add-a-project sheet) as root.AmbWinS11 in s.s11. An extension is { init(),
  // owns(ev), enter(x, route, s), step(x, ev, s) -> {x, cmds, route?, quote?, back?, eat?}, view(s),
  // tab?(s, project, tab), draw?(d, UI), key?(x, ev, s), wantsKeys?(x, s) }
  const EXTS = [["s7", "AmbWinS7", ["review", "artifacts", "environments"]], ["s11", "AmbWinS11", ["onboarding", "settings"]]];
  const S7 = () => root.AmbWinS7 || null;
  const SCREENS = EXTS.flatMap((e) => e[2]);
  const extOf = (screen) => EXTS.find((e) => e[2].includes(screen) && root[e[1]]);
  // an extension's result: its state back in place, its cmds, then a quote, a back or a route
  function applyExt(s, key, r, cmds) {
    let out = { ...s, [key]: r.s7 !== undefined ? r.s7 : r.s11 !== undefined ? r.s11 : r[key] };
    cmds.push(...(r.cmds || []));
    // a quote ❝ from S7's lines (review): {agent, pos, text, file, lines, n}, one per pos like ui_line
    if (r.quote) { const k = keyOf(out.route); out = { ...out, quotes: set(out.quotes, k, [...(out.quotes[k] || []).filter((q) => q.pos !== r.quote.pos), r.quote]) }; }
    if (r.back) out = back(out, cmds);
    if (r.route) out = go(out, r.route, cmds);
    return out;
  }
  function back(s, cmds) {
    if (!s.back.length) return go(s, { project: HOME, agent: "main" }, cmds);
    const r = s.back[s.back.length - 1];
    return { ...go(s, r, cmds, { history: false }), back: s.back.slice(0, -1), fwd: [...s.fwd, s.route] };
  }

  function titleOf(s, r) {
    if (r.screen === "review") return `review · ${r.agent} · ${D.pname(s, r.project)}`;
    if (r.screen === "onboarding") return "welcome to bise";
    if (r.screen === "notfound") return "not found";
    if (r.screen) return r.screen;
    if (r.project === HOME && r.agent === "main") return "bise";
    // bise's own agents (the single-hub core puts every agent there)
    const p = r.project === HOME ? "bise" : D.pname(s, r.project);
    return r.agent === "main" ? p : `${r.agent} · ${p}`;
  }
  function go(s, r, cmds, { history = true } = {}) {
    if (!r || keyOf(r) === keyOf(s.route)) return s;
    if (history) s = { ...s, back: [...s.back, s.route].slice(-50), fwd: [] };
    s = { ...s, route: r, inbox: null, sel: null, picked: null, finder: null };
    if (r.screen === "notfound") { /* nothing to subscribe: the view says it isn't there */ } else if (r.screen) {
      const e = extOf(r.screen);
      const x = e && root[e[1]];
      if (x && x.enter) { const out = x.enter(s[e[0]] || (x.init && x.init()), r, s); s = { ...s, [e[0]]: out[e[0]] !== undefined ? out[e[0]] : out.s7 }; cmds.push(...(out.cmds || [])); }
    } else s = needThread(s, r, cmds);
    cmds.push({ cmd: "win_title", text: titleOf(s, r), route: routeOf(r) });
    return s;
  }
  // the route as the shell keeps it for restore (win_title's route, win_open's)
  const routeOf = (r) => (r.screen === "review" ? `review/${r.project}/${r.agent}` : r.screen === "notfound" ? r.want
    : r.screen === "settings" && r.page ? `settings/${r.page}` : r.screen ? r.screen
    : r.project === HOME && r.agent === "main" ? "bise" : r.agent === "main" ? `project/${r.project}` : `agent/${r.project}/${r.agent}`);

  // the single-hub core's state (the bar's: {agents, cards, projects?}): agents and cards go to
  // their project (bise's own hub when they name none), in the window's S3a shapes; a project
  // listed there before (and gone now) is emptied. Typed projects (S3b) win over state's.
  function fromState(s, ev) {
    const by = (list) => {
      const out = {};
      for (const x of Array.isArray(list) ? list : []) (out[x.project || HOME] = out[x.project || HOME] || []).push(x);
      return out;
    };
    const ag = by(ev.agents), cd = by(ev.cards);
    const keys = new Set([HOME, ...(s.stateKeys || []), ...Object.keys(ag), ...Object.keys(cd)]);
    let agents = s.agents, cards = s.cards;
    for (const k of keys) {
      const list = (ag[k] || []).map((a) => ({ ...a, project: k, main: !!(a.main || a.name === "main") }));
      // bise's main is always there, even when the state lists only the other agents
      if (k === HOME && !list.some((a) => a.main)) list.unshift({ name: "main", main: true, status: "idle", project: HOME });
      agents = set(agents, k, list);
      cards = set(cards, k, (cd[k] || []).map((c) => ({ ...c, project: k, kind: c.kind || "question", question: c.question || c.text || c.title || "",
        options: (c.options || []).map((o, i) => (typeof o === "string" ? { n: i + 1, label: o } : o)) })));
    }
    const projects = Array.isArray(ev.projects) && ev.projects.length && !s.projSeen ? ev.projects : s.projects;
    const ids = new Set(Object.values(cards).flat().map((c) => String(c.id)));
    return { ...s, agents, cards, projects, stateKeys: [...keys], picked: s.picked && ids.has(String(s.picked.card)) ? s.picked : null };
  }

  // a project whose hub the core doesn't hold still has its open cards: its projects row carries
  // them (ProjectView.cards from its view.json, architect m_8726, lead m_8721), so bise's
  // 'waiting for you' and its dock answer them; a hub's own cards event wins over its row's
  function rowCards(s, rows) {
    let cards = s.cards;
    for (const p of rows || []) {
      if (p.home || !Array.isArray(p.cards) || (s.live || {})[p.project]) continue;
      cards = set(cards, p.project, p.cards.map((c) => ({ ...c, project: p.project })));
    }
    return cards === s.cards ? s : { ...s, cards };
  }

  // the core's error {project?, cmd?, text} (S3b: a command to a hub not welcomed yet, an unknown
  // project, a hub's own refusal): a thread that was opening says it didn't, a message on its way
  // says it wasn't sent, an answer he gave puts its card back; the line shows over the window
  function onError(s, ev) {
    const text = String(ev.text || "");
    const mine = (k) => !ev.project || k.startsWith(`${ev.project}/`);
    const threads = {};
    for (const [k, t] of Object.entries(s.threads)) {
      let u = t;
      if (mine(k) && (ev.cmd === "subscribe" || ev.cmd === "page") && (t.loading || t.paging)) u = { ...u, loading: false, paging: false, error: text };
      if (mine(k) && ev.cmd === "send") {
        const i = u.entries.map((e) => !!e.pending).lastIndexOf(true);
        if (i >= 0) u = { ...u, entries: u.entries.map((e, j) => (j === i ? { ...e, pending: false, failed: text } : e)) };
      }
      threads[k] = u;
    }
    let answered = s.answered, picked = s.picked;
    let cards = s.cards;
    if (ev.cmd === "answer" && ev.project) {
      const list = s.cards[ev.project] || [];
      const ids = new Set(list.map((c) => String(c.id)));
      const mineAnswered = new Set(Object.keys(s.answered).filter((id) => ids.has(String(id))));
      answered = Object.fromEntries(Object.entries(s.answered).filter(([id]) => !ids.has(String(id))));
      if (picked && ids.has(String(picked.card))) picked = null;
      // a card that isn't open any more (a stale row's card, lead m_8728): it goes, not back
      if (/isn't open|not open/.test(text)) cards = set(cards, ev.project, list.filter((c) => !mineAnswered.has(String(c.id))));
    }
    return { ...s, threads, answered, picked, cards, toast: { project: ev.project || null, cmd: ev.cmd || null, text, at: s.now } };
  }

  // a deep link from the shell, the capsule or a card: bise · project/<p> · agent/<p>/<a> · inbox
  // (<p> is the project's id or its name)
  function resolve(s, route) {
    const parts = String(route || "").split("/");
    // bise's own hub is always there, even before a projects list comes (the single-hub core
    // sends none until S3b; amb-tools m_8543: agent/home/perf was 'not found')
    const proj = (x) => (x === HOME || (s.homeId && x === s.homeId) ? HOME : (s.projects.find((p) => p.project === x || p.name === x) || {}).project);
    // an agent we know isn't in its project (its list came, the name isn't there) is not found
    const has = (p, a) => !s.agents[p] || s.agents[p].some((x) => x.name === a);
    if (parts[0] === "bise" || parts[0] === "") return { project: HOME, agent: "main" };
    if (parts[0] === "project" && proj(parts[1])) return { project: proj(parts[1]), agent: "main" };
    if (parts[0] === "agent" && proj(parts[1]) && parts[2] && has(proj(parts[1]), parts[2])) return { project: proj(parts[1]), agent: parts[2] };
    if (parts[0] === "review" && proj(parts[1]) && parts[2]) return { screen: "review", project: proj(parts[1]), agent: parts[2] };
    if (parts[0] === "settings") return { screen: "settings", project: HOME, agent: "main", ...(parts[1] ? { page: parts.slice(1).join("/") } : {}) };
    if (SCREENS.includes(parts[0]) && parts[0] !== "review") return { screen: parts[0], project: HOME, agent: "main" };
    // the short forms: <project> and <project>/<agent>
    if (proj(parts[0]) && !parts[1]) return { project: proj(parts[0]), agent: "main" };
    if (proj(parts[0]) && parts[1] && has(proj(parts[0]), parts[1])) return { project: proj(parts[0]), agent: parts[1] };
    // anything else is a place that isn't there (yet): its own screen, with the link it came from
    return route ? { screen: "notfound", project: HOME, agent: "main", want: String(route) } : null;
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
      case "projects": return rowCards({ ...s, projects: ev.projects, projSeen: true }, ev.projects);
      // the single-hub core's snapshot (the bar's state: agents, cards, maybe projects): until
      // S3b's typed per-project events it is the only place the window learns of them
      case "state": return fromState(s, ev);
      case "error": return onError(s, ev);
      case "agents": return set(s, "agents", set(s.agents, ev.project, ev.agents));
      case "cards": {
        // a card he answered stays hidden until the core drops it (ids are numbers in S3a v1)
        // (`answered` keeps his words for the thread's line: "you answered: ...")
        const ids = new Set(Object.values({ ...s.cards, [ev.project]: ev.cards }).flat().map((c) => String(c.id)));
        return { ...s, cards: set(s.cards, ev.project, ev.cards), live: set(s.live || {}, ev.project, true), picked: s.picked && ids.has(String(s.picked.card)) ? s.picked : null };
      }
      case "jobs": return set(s, "jobs", set(s.jobs, ev.project, ev.jobs));
      case "artifacts": return set(s, "arts", set(s.arts, ev.project, ev.items));
      case "scheduled": return set(s, "sched", set(s.sched, ev.project, ev.items));
      case "thread": {
        const k = `${ev.project}/${ev.agent}`;
        const t = s.threads[k] || { entries: [], typing: "" };
        const older = t.paging && t.entries.length;
        // his messages still on their way stay (a page can land between his ⏎ and the hub's echo)
        const mine = t.entries.filter((e) => e.pending && !ev.entries.some((x) => x.kind === "you" && x.text === e.text));
        const entries = older ? [...ev.entries.filter((e) => !t.entries.some((x) => x.pos === e.pos)), ...t.entries] : [...ev.entries, ...mine];
        // it opened after all: no error left on it, nor over the window
        const toast = s.toast && s.toast.project === ev.project && (s.toast.cmd === "subscribe" || s.toast.cmd === "page") ? null : s.toast;
        return { ...set(s, "threads", set(s.threads, k, { ...t, entries, before: ev.before, more: !!ev.more, loading: false, paging: false, error: undefined })), toast };
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
      // macOS's language (the shell's win_lang {lang: "fr" | "en" | ...}): the words follow it
      // unless his setting says otherwise (winwords.lang)
      case "win_lang": return { ...s, lang: String(ev.lang || "").slice(0, 2).toLowerCase() || null };
      case "win_focused": return { ...s, focused: !!ev.on };
      case "tick": return { ...s, now: ev.now, toast: s.toast && ev.now - s.toast.at > 8000 ? null : s.toast };
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
    if (s.route.agent !== "main") return go(s, { project: s.route.project, agent: "main" }, cmds);
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
    if (meta && ev.key === ",") return eat(go(s, { screen: "settings", project: HOME, agent: "main" }, cmds));
    // ⌘D the agent's review (S7), ⌘⇧A every artifact
    if (meta && lower === "d") return eat(s.route.agent !== "main" ? go(s, { screen: "review", project: s.route.project, agent: s.route.agent }, cmds) : s);
    if (meta && ev.shift && lower === "a") return eat(go(s, { screen: "artifacts", project: HOME, agent: "main" }, cmds));
    if (meta && ev.key === ".") {
      if (s.route.project === HOME && s.route.agent === "main") return eat(s);
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
      case "ui_stop": if (!(s.route.project === HOME && s.route.agent === "main")) cmds.push({ cmd: "stop", project: s.route.project, agent: s.route.agent }); return s;
      case "ui_older": {
        const t = s.threads[k];
        if (!t || !t.more || t.paging) return s;
        cmds.push({ cmd: "page", project: s.route.project, agent: s.route.agent, before: t.before, limit: 60 });
        return set(s, "threads", set(s.threads, k, { ...t, paging: true }));
      }
      case "ui_theme": return { ...s, theme: s.theme === "dark" ? "light" : "dark" };
      case "ui_back": return back(s, cmds);
      case "ui_toast_close": return s.toast && (ev.at == null || ev.at === s.toast.at) ? { ...s, toast: null } : s;
      case "ui_find_type": return s.finder ? { ...s, finder: { q: ev.text, i: 0 } } : s;
      case "ui_find_open": {
        const row = root.AmbWinFind.rows(s, s.finder ? s.finder.q : "")[ev.i];
        return row ? go({ ...s, finder: null }, row.route, cmds) : s;
      }
      case "ui_find_close": return { ...s, finder: null };
    }
    return s;
  }

  // ---- the wire (S3b step 2, amb-core m_8689 / m_8712). bise's own hub travels as its hub id
  // (the projects row with home:true); inside the window it is HOME, so routes, links and the
  // fake core keep one name. Events come in renamed, commands go out renamed. The window tells
  // the core which project it shows ({cmd:'shown'}: the core holds home + these + any project
  // with a subscribed thread; it refuses a command before the first shown).
  const WIRE = ["project", "from_project"];
  function rename(x, from, to, depth = 0) {
    if (depth > 5 || x == null || typeof x !== "object") return x;
    if (Array.isArray(x)) return x.map((y) => rename(y, from, to, depth + 1));
    const out = {};
    for (const k of Object.keys(x)) out[k] = WIRE.includes(k) && x[k] === from ? to : rename(x[k], from, to, depth + 1);
    return out;
  }
  const MAPS = ["agents", "cards", "jobs", "arts", "sched"];
  // the first projects list names bise's hub: what came under its id before moves to HOME, and
  // the threads asked under HOME (refused: the core knew no 'home') are asked again
  function learnHome(s, id, cmds) {
    const out = { ...s, homeId: id, homeQ: [] };
    // what waited for the id (a send, an answer: never a subscribe, asked again below) goes now
    for (const c of s.homeQ || []) cmds.push({ ...c, project: id });
    for (const m of MAPS) if (s[m] && id in s[m]) { const { [id]: v, ...rest } = s[m]; out[m] = { ...rest, [HOME]: v }; }
    const threads = {};
    for (const [k, t] of Object.entries(s.threads)) threads[k.startsWith(`${id}/`) ? `${HOME}/${k.slice(id.length + 1)}` : k] = t;
    out.threads = threads;
    for (const k of Object.keys(threads)) if (k.startsWith(`${HOME}/`)) cmds.push({ cmd: "subscribe", project: id, agent: k.slice(HOME.length + 1), limit: 60 });
    return out;
  }
  const shownOf = (s) => (s.route.project && s.route.project !== HOME ? [s.route.project] : []);
  function step(s, ev) {
    const pre = [];
    if (ev.ev === "projects" && Array.isArray(ev.projects)) {
      const h = ev.projects.find((p) => p.home);
      if (h && h.project !== HOME && h.project !== s.homeId) s = learnHome(s, h.project, pre);
    }
    if (s.homeId && s.homeId !== HOME && !String(ev.ev || "").startsWith("ui_")) ev = rename(ev, s.homeId, HOME);
    const r = step0(s, ev);
    let out = r.s;
    const cmds = [...pre.filter(Boolean), ...r.cmds];
    // what the window shows: sent when it changes (the first one opens the core's projects)
    const shown = shownOf(out);
    const key = shown.join(",");
    if (out.shownKey !== key && out.wire) { out = { ...out, shownKey: key }; cmds.unshift({ cmd: "shown", projects: shown }); }
    // on the real core, before the projects list names bise's hub, a command for HOME waits (the
    // core knows no 'home': it would refuse it); its threads are asked again by learnHome
    if (out.wire && !out.homeId) {
      const held = cmds.filter((c) => c.project === HOME);
      if (held.length) out = { ...out, homeQ: [...(out.homeQ || []), ...held.filter((c) => c.cmd !== "subscribe" && c.cmd !== "page")] };
      return { ...r, s: out, cmds: cmds.filter((c) => c.project !== HOME) };
    }
    const home = out.homeId && out.homeId !== HOME ? out.homeId : null;
    return { ...r, s: out, cmds: home ? cmds.map((c) => (c.project === HOME ? { ...c, project: home } : c)) : cmds };
  }

  function step0(s, ev) {
    const cmds = [];
    for (const [key, name] of EXTS) {
      const x = root[name];
      if (x && x.owns && x.owns(ev)) {
        const r = x.step(s[key] || (x.init && x.init()), ev, s);
        return { s: applyExt(s, key, r, cmds), cmds, eat: !!r.eat };
      }
    }
    if (ev.ev === "ui_key") {
      // an extension that holds the keys now (onboarding, settings, the add sheet) sees them first
      // (S7's key() gets the keys of its own screens: review's ⌘⏎ merge, ⌘O open in editor;
      // amb-web m_8453)
      for (const [key, name, screens] of EXTS) {
        const x = root[name];
        const holds = x && x.key && (x.wantsKeys ? x.wantsKeys(s[key], s) : !!s.route.screen && screens.includes(s.route.screen));
        if (holds) {
          const r = x.key(s[key] || (x.init && x.init()), ev, s);
          if (r) return { s: applyExt(s, key, r, cmds), cmds, eat: !!r.eat };
        }
      }
      const r = key(s, ev, cmds);
      return { s: r.s, cmds, eat: r.eat };
    }
    const out = ev.ev && ev.ev.startsWith("ui_") ? ui(s, ev, cmds) : core(s, ev, cmds);
    return { s: out, cmds, eat: false };
  }

  // the first route: bise's thread, subscribed
  function start(s) {
    const cmds = [];
    // the real core refuses every command before the window's first shown: it goes first
    if (s.wire) { s = { ...s, shownKey: shownOf(s).join(",") }; cmds.push({ cmd: "shown", projects: shownOf(s) }); }
    const out = needThread(s, s.route, cmds);
    cmds.push({ cmd: "win_title", text: "bise", route: "bise" });
    // bise's thread is asked once the projects list names its hub (learnHome)
    return { s: out, cmds: s.wire ? cmds.filter((c) => c.project !== HOME) : cmds };
  }

  // is this entry unfolded (a fold, a tools group, an "asked · i answered" why)?
  function isOpen(s, pos) {
    const id = `${keyOf(s.route)}#${pos}`;
    return s.all ? !s.open[id] : !!s.open[id];
  }

  root.AmbWinModel = { init, step, start, isOpen, resolve, agentRow, agentsOf, projectsInOrder, titleOf };
})(typeof window !== "undefined" ? window : globalThis);
