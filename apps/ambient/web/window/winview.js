// bise desktop · state -> what the window shows, pure: plain data for the sidebar, the header, the
// jobs strip, the thread's rows, the dock above the composer, the composer and the right column.
// winui.js draws it with the design system's markup (apps/ambient/web/ds, then amb-kit's
// window/components); check-win.mjs reads it. Words follow desktop-app v9.
(function (root) {
  "use strict";
  const D = root.AmbWinDock, M = root.AmbWinModel;
  const { HOME, keyOf } = D;

  // ---- time, in his timezone (s.tz; undefined = the machine's)
  const fmts = {};
  const fmt = (tz) => (fmts[tz || ""] = fmts[tz || ""] || new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }));
  const dayf = (tz) => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: tz });
  const hm = (s, ms) => fmt(s.tz).format(new Date(ms));
  function dayLabel(s, ms) {
    const f = dayf(s.tz);
    const d = f.format(new Date(ms)), today = f.format(new Date(s.now)), yest = f.format(new Date(s.now - 86400000));
    if (d === today) return "today";
    if (d === yest) return "yesterday";
    return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: s.tz }).format(new Date(ms));
  }
  const mins = (ms) => { const m = Math.max(0, Math.round(ms / 60000)); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ""}`.trim(); };
  const num = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const pct = (a, b) => (b ? Math.max(0, Math.min(100, Math.round((a / b) * 100))) : 0);

  // ---- dots: the sidebar's and the board's state, one word each
  const DOT = { working: "wk", waiting: "nd", done: "ok", blocked: "er", failed: "er", idle: "" };
  const agentDot = (s, project, a) => (openCardsOf(s, project, a.name).length ? "nd" : DOT[a.status] || "");
  const openCardsOf = (s, project, agent) => D.allCards(s).filter((c) => c.project === project && (agent == null || c.agent === agent));
  const projectWaits = (s, project) => openCardsOf(s, project).length;
  const projectWorking = (s, project) => M.agentsOf(s, project).filter((a) => a.status === "working").length;

  function sidebar(s) {
    const r = s.route;
    const rows = [{ kind: "me", name: "bise", sub: "every project", end: String(D.allCards(s).length || ""), nd: D.allCards(s).length > 0, on: r.project === HOME, act: { ev: "ui_route", project: HOME, agent: "main" } }];
    rows.push({ kind: "sh", text: "projects" });
    M.projectsInOrder(s).forEach((p, i) => {
      const waits = projectWaits(s, p.project), working = projectWorking(s, p.project);
      rows.push({ kind: "pj", name: p.name, dot: p.offline ? "off" : waits ? "nd" : working ? "wk" : "",
        end: p.offline ? "offline" : waits ? String(waits) : i < 9 ? `⌘${i + 1}` : "", nd: waits > 0,
        on: r.project === p.project && r.agent === "main", act: { ev: "ui_route", project: p.project, agent: "main" } });
      // a project's agents show under it on bise's view, and under the project in view
      if (r.project === HOME || r.project === p.project) {
        const list = M.agentsOf(s, p.project);
        if (!list.length) rows[rows.length - 1].end = rows[rows.length - 1].end || "no agent";
        for (const a of list) {
          const dot = agentDot(s, p.project, a);
          rows.push({ kind: "ag", name: a.name, dot, end: dot === "nd" ? "?" : dot === "er" ? "▲" : "",
            on: r.project === p.project && r.agent === a.name, act: { ev: "ui_route", project: p.project, agent: a.name } });
        }
      }
    });
    return { rows, foot: "+ add a project" };
  }

  function header(s) {
    const r = s.route;
    const all = D.allCards(s).length;
    if (r.project === HOME) {
      const working = s.projects.reduce((n, p) => n + projectWorking(s, p.project), 0);
      const fresh = Object.values(s.arts).flat().filter((a) => a.new).length;
      return { pearl: true, t1: "bise", t2: ["every project", `${working} at work`, ...(all ? [`${all} wait${all > 1 ? "" : "s"} for you`] : [])], acc: all ? 2 : -1,
        end: [...(fresh ? [{ kind: "chip", text: `↗ ${fresh} new` }] : []), { kind: "chip", text: "⌕", kbd: "⌘K" }] };
    }
    const p = s.projects.find((x) => x.project === r.project) || { name: r.project, path: "" };
    const waits = projectWaits(s, r.project);
    if (r.agent === "main") {
      const n = M.agentsOf(s, r.project).length;
      const tab = s.tab[r.project] || "thread";
      return { t1: p.name, t2: [p.path, p.branch || "main", `${n} agent${n === 1 ? "" : "s"}`, ...(waits ? [`${waits} wait${waits > 1 ? "" : "s"} for you`] : [])], acc: waits ? 3 : -1,
        seg: ["thread", "changes", "artifacts"].map((t) => ({ text: t, on: t === tab, act: { ev: "ui_tab", tab: t } })) };
    }
    const a = M.agentRow(s) || { name: r.agent, status: "idle" };
    const mine = openCardsOf(s, r.project, r.agent).length;
    const t = s.threads[keyOf(r)];
    const files = t ? new Set(t.entries.filter((e) => e.kind === "diff").map((e) => e.diff.path)).size : 0;
    const t2 = [p.name, ...(a.branch ? [`ψ ${a.branch}`] : []), ...(a.started_ms ? [`started by ${a.parent || "main"} ${hm(s, a.started_ms)}`] : []),
      mine ? "waits for you" : a.status === "working" ? "working" : a.status];
    return { t1: r.agent, dot: agentDot(s, r.project, a), t2, acc: mine ? t2.length - 1 : -1,
      end: [...(files ? [{ kind: "chip", text: `± ${files} file${files > 1 ? "s" : ""}` }] : []),
        ...(a.status === "working" ? [{ kind: "btn", text: "stop", kbd: "⌘.", act: { ev: "ui_stop" } }] : []),
        { kind: "btn", text: `← ${p.name}`, act: { ev: "ui_route", project: r.project, agent: "main" } }] };
  }

  // what runs now, on bise's view: every running job, the followed ones first
  function jobs(s) {
    if (s.route.project !== HOME) return [];
    const out = [];
    for (const p of M.projectsInOrder(s)) for (const j of s.jobs[p.project] || []) if (j.state === "running" || j.state === "failed")
      out.push({ title: `${p.name} · ${j.agent}`, following: !!j.followed, failed: j.state === "failed",
        s: `${j.label} · ${num(j.step)} / ${num(j.steps)}${j.unit ? ` ${j.unit}` : ""}`, pct: pct(j.step, j.steps), act: { ev: "ui_route", project: p.project, agent: j.agent } });
    return out.sort((a, b) => (b.following ? 1 : 0) - (a.following ? 1 : 0)).slice(0, 3);
  }

  // ---- the thread's rows
  function who(s, e) {
    const r = s.route;
    if (e.kind === "you") return { name: "you", av: (s.user.name || "you")[0].toUpperCase() };
    if (e.kind === "agent") return r.project === HOME ? { name: "bise", pearl: true } : { name: r.agent, dot: r.agent === "main" ? "" : "" };
    // from_agent: a project's main in bise's thread, main's brief in an agent's, an agent in main's
    if (e.from_project && r.project === HOME) return { name: `${D.pname(s, e.from_project)} · ${e.from}`, dot: "nd", in: true };
    if (e.from === "bise") return { name: "bise", pearl: true };
    if (e.to && r.agent !== "main") return { name: `${e.from} → ${e.to}` };
    return { name: e.from || "", in: r.agent === "main" && r.project !== HOME };
  }
  const VIA = { voice: "by voice", capsule: "from the capsule", page: "from a page", bise: "via bise" };
  function meta(s, e) {
    const bits = [hm(s, e.at_ms)];
    if (e.via && VIA[e.via]) bits.push(`${VIA[e.via]}${e.context && e.context.app ? `, from ${e.context.app}` : ""}`);
    else if (e.context && e.context.app) bits.push(`from ${e.context.app}`);
    if (e.pending) bits.push("sending…");
    return bits.join(" · ");
  }
  function ctx(e) {
    const c = e.context;
    if (!c) return null;
    const chips = [c.title, c.file && `${c.file}${c.selection ? "" : ""}`, c.selection].filter(Boolean);
    return { shot: c.shot || "", chips };
  }

  function row(s, e) {
    const k = keyOf(s.route);
    const open = M.isOpen(s, e.pos);
    switch (e.kind) {
      case "you": case "agent": case "from_agent": case "report": case "page": {
        const w = who(s, e);
        return { t: "msg", pos: e.pos, you: e.kind === "you", who: w, meta: meta(s, e), text: e.text, ctx: ctx(e),
          quote: e.quote ? D.quoteChip(e.quote, 0, (ms) => hm(s, ms)).replace(/^❝ 1 /, "❝ ") : null,
          page: e.page ? { title: e.page.title, url: e.page.url } : null, pending: !!e.pending };
      }
      case "delegation": {
        const d = e.delegation || {};
        const to = D.pname(s, d.project_to);
        const p1 = d.agent ? `${to} · main → ${d.agent}` : `${to} · main`;
        const running = d.state === "running";
        const steps = d.steps ? pct(d.step, d.steps) : null;
        return { t: "route", pos: e.pos, dot: running ? "wk" : d.state === "failed" ? "er" : "ok", p1, p2: `${e.text}${d.followed ? " · following" : ""}`,
          p3: running ? (steps != null ? `${steps}%` : mins(s.now - e.at_ms)) : d.state === "failed" ? hm(s, e.at_ms) : d.done_ms ? `done ${hm(s, d.done_ms)}` : "done",
          bar: running ? (steps != null ? steps : -1) : null, act: { ev: "ui_route", project: d.project_to, agent: d.agent || "main" } };
      }
      case "agents": {
        const a = e.agents || { items: [], count: 0, names: [] };
        return { t: "fold", pos: e.pos, text: `${open ? "▾" : "▸"} ${a.count} messages between ${a.names.length} agents`, open,
          items: open ? a.items.map((x) => row(s, { ...x, kind: "from_agent", to: undefined })) : [] };
      }
      case "tools": {
        const t = e.tools || { items: [] };
        return { t: "tool", pos: e.pos, label: t.summary || e.text, open, run: !!e.running, items: open ? t.items.map((i) => i.text) : [] };
      }
      case "card": {
        const c = e.card || {};
        if (c.answered && c.by && c.by !== "you")
          return { t: "answered", pos: e.pos, text: `${e.from} asked: ${c.question} · ${c.by === "main" ? "i" : c.by} answered: ${c.answer}`, why: c.why || "", open };
        return { t: "marker", pos: e.pos, text: D.markerText(s, e), card: c.id, act: { ev: "ui_inbox", card: c.id } };
      }
      case "diff": {
        const d = e.diff;
        const sel = s.sel && s.sel.key === k && s.sel.pos === e.pos ? [Math.min(s.sel.a, s.sel.b), Math.max(s.sel.a, s.sel.b)] : null;
        return { t: "diff", pos: e.pos, file: d.path, add: d.add, del: d.del,
          lines: (d.hunk ? d.hunk.lines : []).map((l, i) => ({ i, o: l.old != null ? l.old : "", n: l.new != null ? l.new : "", sign: l.kind === "add" ? "+" : l.kind === "del" ? "−" : "", cls: l.kind === "add" ? "ad" : l.kind === "del" ? "rm" : "", text: l.text, sel: !!sel && i >= sel[0] && i <= sel[1] })) };
      }
      case "artifact": {
        const a = e.artifact || {};
        const fresh = Object.values(s.arts).flat().some((x) => x.id === a.id && x.new);
        return { t: "art", pos: e.pos, title: a.title || e.text, kind: a.kind || "page", meta: `${e.from || ""}${e.from ? " · " : ""}${hm(s, e.at_ms)}`, new: fresh, url: a.url || "" };
      }
    }
    return { t: "msg", pos: e.pos, who: { name: e.from || "" }, meta: hm(s, e.at_ms), text: e.text || "" };
  }

  function thread(s) {
    const t = s.threads[keyOf(s.route)];
    if (!t || (t.loading && !t.entries.length)) return { loading: true, rows: [] };
    const rows = [];
    let day = null;
    for (const e of t.entries) {
      const d = dayLabel(s, e.at_ms);
      if (d !== day && !(e.kind === "card" && e.pos >= 1000000000)) { rows.push({ t: "day", text: d }); day = d; }
      rows.push(row(s, e));
    }
    const a = M.agentRow(s);
    const empty = !t.entries.length ? (s.route.project === HOME ? { b: "nothing here yet", s: "hold fn and ask bise anything, from any app" }
      : s.route.agent === "main" && !M.agentsOf(s, s.route.project).length ? { b: `${D.pname(s, s.route.project)} has no agent yet`, s: "ask its main below, or ask bise from anywhere" }
      : { b: "no message yet", s: "" }) : null;
    return { rows, more: !!t.more, paging: !!t.paging, typing: t.typing ? { who: s.route.project === HOME ? "bise" : s.route.agent, text: t.typing } : null, empty, working: !!(a && a.status === "working") };
  }

  // ---- the composer and what sits above it
  function composer(s) {
    const k = keyOf(s.route);
    const d = D.dock(s);
    const a = M.agentRow(s);
    const text = s.drafts[k] || "";
    const quotes = (s.quotes[k] || []).map((q, i) => ({ i, text: D.quoteChip(q, i, (ms) => hm(s, ms)) }));
    const working = a && a.status === "working" && s.route.agent !== "main";
    return { dock: D.dockWords(s, d), div: D.divider(s, d, a), ph: D.placeholder(s, d, a), text, quotes,
      send: text.trim() ? "on" : working ? "stop" : "off", disabled: !!s.offline,
      keys: `@ file   $ skills   / commands   ⌘I inbox` };
  }

  // ---- the right column: bise = waiting + made today; a project = its agents + scheduled
  function board(s) {
    const r = s.route;
    if (r.project === HOME) {
      const waiting = D.allCards(s).map((c) => ({ who: `${D.pname(s, c.project)} · ${c.agent}`, text: c.title || c.question, act: { ev: "ui_inbox", card: c.id } }));
      const day = dayLabel(s, s.now);
      const made = Object.entries(s.arts).flatMap(([project, list]) => list.map((a) => ({ ...a, project })))
        .filter((a) => dayLabel(s, a.at_ms) === day).sort((a, b) => b.at_ms - a.at_ms).slice(0, 4)
        .map((a) => ({ title: a.title, kind: a.kind, new: !!a.new, act: { ev: "ui_route", project: a.project, agent: a.agent } }));
      return { sections: [{ sh: `waiting for you · ${waiting.length}`, kind: "cards", items: waiting }, { sh: "made today", kind: "thumbs", items: made }] };
    }
    if (r.agent !== "main") return null;
    const list = M.agentsOf(s, r.project).map((a, i) => {
      const dot = agentDot(s, r.project, a);
      return { name: a.name, key: i < 9 ? `⌥${i + 1}` : "", psi: !!a.branch, dot, w: a.title, nd: dot === "nd", er: dot === "er", done: a.status === "done", act: { ev: "ui_route", project: r.project, agent: a.name } };
    });
    const sched = (s.sched[r.project] || []).map((x) => ({ text: `◷ ${x.label}`, when: whenText(s, x.at_ms) }));
    return { sections: [{ sh: `agents · ${list.length}`, kind: "agents", items: list }, ...(sched.length ? [{ sh: "scheduled", kind: "sched", items: sched }] : [])] };
  }
  function whenText(s, ms) {
    const d = dayLabel(s, ms);
    const f = dayf(s.tz).format(new Date(s.now + 86400000)) === dayf(s.tz).format(new Date(ms));
    const h = +fmt(s.tz).format(new Date(ms)).slice(0, 2);
    if (f && h < 6) return `tonight ${hm(s, ms)}`;
    return d === "today" ? hm(s, ms) : f ? `tomorrow ${hm(s, ms)}` : `${d} ${hm(s, ms)}`;
  }

  // the pearl's mood (pearl.js MOODS): pink when someone waits, whirling while agents work
  function mood(s) {
    if (D.allCards(s).length) return "need";
    if (s.projects.some((p) => projectWorking(s, p.project))) return "work";
    return "rest";
  }

  function view(s) {
    return { theme: s.theme, focused: s.focused, route: s.route, title: M.titleOf(s, s.route), mood: mood(s),
      side: sidebar(s), head: header(s), jobs: jobs(s), thread: thread(s), composer: composer(s), board: board(s), inbox: !!s.inbox };
  }

  root.AmbWinView = { view, sidebar, header, jobs, thread, composer, board, mood, hm, dayLabel };
})(typeof window !== "undefined" ? window : globalThis);
